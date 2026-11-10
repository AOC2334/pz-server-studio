const path=require('node:path'),{spawnSync}=require('node:child_process');
require('../lib/web-proxy').configureProxy();
if(process.env.HTTPS_PROXY||process.env.HTTP_PROXY){process.env.ELECTRON_GET_USE_PROXY='1';process.env.GLOBAL_AGENT_HTTP_PROXY=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;process.env.GLOBAL_AGENT_HTTPS_PROXY=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;}
const mode=process.argv[2]||'start';
const command=mode==='install'?path.join(__dirname,'../node_modules/electron/install.js'):mode==='start'?path.join(__dirname,'../node_modules/electron/cli.js'):path.join(__dirname,'../node_modules/electron-builder/cli.js');
// electron-builder clears its output before copying; never build over a live app.
if(process.platform==='win32'&&(mode==='pack'||mode==='dist')){
 const output=path.resolve(__dirname,'../release/win-unpacked/PZ Server Studio.exe').replaceAll("'","''");
 const check=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; $target='"+output+"'; if (Get-Process | Where-Object { $_.Path -eq $target }) { exit 9 }"],{encoding:'utf8',windowsHide:true});
 if(check.status!==0){console.error(check.status===9?'请先正常退出 release/win-unpacked 中的桌面应用，再重新打包。为保护现有程序，本次未修改输出目录。':'无法确认输出目录中的应用是否仍在运行，已取消打包。');process.exit(1);}
}
const args=mode==='install'?[]:mode==='start'?['.']:mode==='pack'?['--win','--dir']:['--win','portable'];
if((mode==='pack'||mode==='dist')&&!require('node:fs').existsSync(path.join(__dirname,'../node_modules/electron/dist/electron.exe'))){const setup=spawnSync(process.execPath,['--use-env-proxy',path.join(__dirname,'../node_modules/electron/install.js')],{env:process.env,stdio:'inherit',windowsHide:true});if(setup.status!==0)process.exit(setup.status||1);}
const r=spawnSync(process.execPath,['--use-env-proxy',command,...args],{cwd:path.resolve(__dirname,'..'),env:process.env,stdio:'inherit',windowsHide:mode!=='start'});if(r.error)console.error(r.error.message);process.exitCode=r.status??1;
