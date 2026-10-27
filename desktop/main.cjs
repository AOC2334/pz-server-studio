const {app,BrowserWindow,utilityProcess,ipcMain,dialog,Tray,Menu,shell}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
let win,backend,tray,origin,quitting=false,ready=false,backendBusy=true;
const locked=app.requestSingleInstanceLock();
if(!locked)app.quit();else{
 app.on('second-instance',()=>{if(win){win.show();if(win.isMinimized())win.restore();win.focus();}});
 app.whenReady().then(launch).catch(e=>{dialog.showErrorBox('应用启动失败',e.message);quitting=true;app.quit();});
}
function trusted(event){if(!win||event.sender!==win.webContents||new URL(event.senderFrame.url).origin!==origin)throw Error('无效的桌面请求');}
async function launch(){
 const workspace=app.isPackaged?path.join(app.getPath('userData'),'workspace'):path.resolve(__dirname,'..');
 await fs.mkdir(workspace,{recursive:true});
 win=new BrowserWindow({width:1320,height:900,minWidth:960,minHeight:680,frame:false,backgroundColor:'#f7f8fa',show:false,icon:path.join(__dirname,'icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.session.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));
 win.webContents.session.setPermissionCheckHandler(()=>false);
 win.webContents.setWindowOpenHandler(({url})=>{try{if(new URL(url).protocol==='https:')shell.openExternal(url);}catch{}return {action:'deny'};});
 win.webContents.on('will-navigate',(e,url)=>{if(!origin||new URL(url).origin!==origin)e.preventDefault();});
 ipcMain.handle('desktop:version',e=>{trusted(e);return app.getVersion();});
 ipcMain.on('desktop:minimize',e=>{trusted(e);win.minimize();});
 ipcMain.on('desktop:maximize',e=>{trusted(e);win.isMaximized()?win.unmaximize():win.maximize();});
 ipcMain.on('desktop:close',e=>{trusted(e);win.close();});
 ipcMain.handle('desktop:directory',async e=>{trusted(e);const r=await dialog.showOpenDialog(win,{title:'选择本地目录',properties:['openDirectory']});return r.canceled?null:r.filePaths[0];});
 ipcMain.handle('desktop:data',async e=>{trusted(e);await shell.openPath(workspace);return workspace;});
 ipcMain.handle('desktop:export',async(e,text)=>{trusted(e);if(typeof text!=='string'||text.length>2000000)throw Error('日志过大');const r=await dialog.showSaveDialog(win,{defaultPath:'pz-studio-log.txt',filters:[{name:'文本日志',extensions:['txt']}]});if(r.canceled)return false;await fs.writeFile(r.filePath,text,'utf8');return true;});
 tray=new Tray(path.join(__dirname,'icon.png'));tray.setToolTip('PZ Server Studio');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'打开工作台',click:()=>win.show()},{label:'退出应用',click:()=>win.close()}]));tray.on('double-click',()=>win.show());
 win.on('close',async e=>{
  if(quitting)return;e.preventDefault();
  if(backendBusy){const r=await dialog.showMessageBox(win,{type:'info',title:'后台任务仍在运行',message:ready?'服务器或构建、下载任务仍在运行。':'应用正在启动，请稍候。',detail:'关闭到托盘会保留服务器终端。需要完全退出时，请先在应用内停止任务并保存服务器。',buttons:['返回应用','收起到托盘'],defaultId:0,cancelId:0});if(r.response===1)win.hide();return;}
  const r=await dialog.showMessageBox(win,{type:'question',title:'退出工作台',message:'退出 PZ Server Studio？',detail:'请确认已保存当前项目。',buttons:['取消','退出'],defaultId:0,cancelId:0});if(r.response===1){quitting=true;backend?.postMessage('shutdown');tray.destroy();win.destroy();setTimeout(()=>app.quit(),1800);}
 });
 backend=utilityProcess.fork(path.join(__dirname,'backend.cjs'),[],{cwd:workspace,env:{...process.env,PZ_WORKSPACE_ROOT:workspace},stdio:'pipe',serviceName:'PZ Server Studio Backend'});
 let bootLog='';backend.stdout.on('data',b=>{bootLog=(bootLog+b).slice(-4000);});backend.stderr.on('data',b=>{bootLog=(bootLog+b).slice(-4000);});
 const timer=setTimeout(()=>{if(!ready){dialog.showErrorBox('启动超时','本机服务未能就绪。\n'+bootLog);quitting=true;backend.kill();app.quit();}},30000);
 backend.on('message',msg=>{if(msg.type==='state')backendBusy=msg.busy;if(msg.type==='ready'){clearTimeout(timer);ready=true;origin=new URL(msg.url).origin;win.loadURL(msg.url).catch(e=>dialog.showErrorBox('界面加载失败',e.message));win.once('ready-to-show',()=>win.show());backend.postMessage('state');}if(msg.type==='error')dialog.showErrorBox('本机服务错误',msg.message);});
 backend.on('exit',code=>{clearInterval(poll);clearTimeout(timer);if(!quitting){backendBusy=false;dialog.showErrorBox('本机服务已退出','退出码：'+code+'\n'+bootLog);quitting=true;tray.destroy();win.destroy();app.quit();}});
 const poll=setInterval(()=>{if(ready)backend.postMessage('state');},500);poll.unref();
}
app.on('window-all-closed',()=>{if(quitting)app.quit();});
app.on('before-quit',e=>{if(!quitting){e.preventDefault();win?.close();}});
