const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),dgram=require('node:dgram'),{spawn}=require('node:child_process');
const {patchIni,exists}=require('./core');
function javaArguments(script){
 const env={};for(const m of script.matchAll(/^\s*@?set\s+"?([\w]+)=(.*?)"?\s*$/gim))env[m[1].toUpperCase()]=m[2];
 const line=script.replace(/\^\r?\n/g,' ').split(/\r?\n/).find(l=>/java(?:\.exe)?["\s].*zombie\.network\.GameServer/i.test(l));if(!line)throw Error('无法解析 Java 启动参数');
 const expanded=line.replace(/%([\w]+)%/g,(_,key)=>{if(!(key.toUpperCase() in env))throw Error('无法解析启动环境变量：'+key);return env[key.toUpperCase()];});
 const tokens=(expanded.match(/(?:"[^"]*"|[^\s"])+/g)||[]).map(t=>t.replace(/"/g,''));const start=tokens.findIndex(t=>/java(?:\.exe)?$/i.test(t)),end=tokens.indexOf('zombie.network.GameServer');if(start<0||end<=start)throw Error('无法识别服务器主类');return tokens.slice(start+1,end+1);
}
function analyzeLog(text,mods=[]){
 const lines=text.split(/\r?\n/),findings=[],seen=new Set();let warnings=0,errors=0;
 const loaded=new Set();for(const line of lines){if(/WARN\s*:|WARNING:/.test(line))warnings++;if(/ERROR\s*:|Exception in thread|Exception thrown/.test(line))errors++;
  for(const mod of mods){const id=mod.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if((line.includes('mod "'+mod.id+'"')&&/loading|overrides/i.test(line))||new RegExp('\\bloading\\s+(?:mod\\s+)?["\\\']?'+id+'(?=["\\\'\\s]|$)','i').test(line))loaded.add(mod.id);}
 }
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(!/ERROR\s*:|Exception|stack traceback|require\(.*failed|mod .*not found|failed to load.*mod/i.test(line))continue;
  const block=[line];for(let j=i+1;j<Math.min(lines.length,i+16);j++){const next=lines[j];if(/^(?:LOG|WARN|ERROR)\s*:/.test(next)&&!/>\s*(?:at |\tat |Caused by:|function:|-- |stack traceback|\.{3})/.test(next))break;block.push(next);}const context=block.join('\n').replace(/\\/g,'/');
  if(/Lua\(Vanilla\)/.test(line))continue;
  const suspects=mods.filter(mod=>{
   const root=mod.path?.replace(/\\/g,'/'),id=mod.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   return (root&&context.toLowerCase().includes(root.toLowerCase()))||new RegExp('(?:Lua\\('+id+'\\)|mod\\s+["\\\']'+id+'["\\\'])','i').test(context)||(mod.name&&context.includes('Lua((MOD:'+mod.name+'))'))||context.includes('mods/'+mod.id+'/')||(mod.logRoot&&context.includes(mod.logRoot))||(mod.logFiles||[]).some(file=>{const escaped=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:file:\\s*|[/\\s])'+escaped+'(?=[:\\s]|$)','i').test(context);});
  });
  const missing=line.match(/mod\s+["']([^"']+)["'].*(?:not found|missing)/i);
  const ids=missing?[missing[1]]:suspects.map(m=>m.id);if(!ids.length)continue;
  const key=ids.join(';')+'|'+line.replace(/.*>\s*/,'');if(seen.has(key))continue;seen.add(key);
  const resourceWarning=/NoSuchFileException:.*\/media\/(?:AnimSets|actiongroups)(?=\s|$)/i.test(context);findings.push({modIds:ids,severity:resourceWarning?'warning':'error',certainty:resourceWarning?'资源目录缺失，单独不能证明模组不兼容':missing?'明确的缺失模组':suspects.length===1?'日志指向该模组，需复现确认':'多个候选，不能唯一归因',evidence:block.slice(0,10).join('\n')});if(findings.length>=30)break;
 }
 const environment=/AccessDeniedException|Error loading java\.security|Could not reserve enough space|OutOfMemoryError|BindException|Address already in use|Unable to bind|Could not find or load main class|Unrecognized VM option/i.test(text);
 findings.sort((a,b)=>Number(/Lua\(|require\(/.test(b.evidence))-Number(/Lua\(|require\(/.test(a.evidence)));
 return {warnings,errors,findings,loadedModIds:[...loaded],environmentIssue:environment,gameVersion:text.match(/version=(\d+\.\d+(?:\.\d+)?)/)?.[1]||null};
}
async function reservePorts(){const sockets=[];try{for(let i=0;i<2;i++){const socket=dgram.createSocket('udp4');sockets.push(socket);await new Promise((resolve,reject)=>{socket.once('error',reject);socket.bind(0,'127.0.0.1',resolve);});}return {ports:sockets.map(s=>s.address().port),release:()=>sockets.forEach(s=>s.close())};}catch(e){for(const s of sockets)try{s.close();}catch{}throw e;}}
async function luaNames(root){const names=new Set();async function walk(dir){let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return;}for(const entry of entries){if(entry.isSymbolicLink())continue;if(entry.isDirectory())await walk(path.join(dir,entry.name));else if(entry.isFile()&&entry.name.endsWith('.lua'))names.add(entry.name.toLowerCase());}}await walk(root);return names;}
async function logOwners(mods,output){const vanilla=await luaNames(path.join(output,'runtime/media/lua'));return Promise.all(mods.map(async mod=>{let root=mod.path;while(root&&path.basename(path.dirname(root)).toLowerCase()!=='mods'&&path.dirname(root)!==root)root=path.dirname(root);const folder=path.basename(root||mod.id),files=await luaNames(path.join(output,'Zomboid/mods',folder));return {...mod,logRoot:'mods/'+folder+'/',logFiles:[...files].filter(name=>!vanilla.has(name))};}));}
async function runSmoke(output,config,mods,progress=()=>{},options={}){
 const started=Date.now(),timeoutMs=options.timeoutMs||180000,runtime=path.join(output,'runtime'),cache=path.join(output,'.smoke-'+crypto.randomBytes(6).toString('hex')),reportDir=path.join(output,'diagnostics');
 let child,lease,timer,forceTimer,logHandle,log='',logBytes=0,writeQueue=Promise.resolve(),spawnError=null,ready=false,timedOut=false,cancelled=false,terminated=false,closedPromise,stopped=false,cancel;
 const secret=crypto.randomBytes(24).toString('hex'),testName='studio_smoke';
 await fs.mkdir(reportDir,{recursive:true});const logPath=path.join(reportDir,'smoke.log');
 function stop(){if(stopped)return;stopped=true;if(child&&!child.killed){try{if(child.stdin.writable)child.stdin.write('quit\n',()=>{});}catch{}forceTimer=setTimeout(()=>child.kill(),5000);}}
 try{
  progress({phase:'smoke',message:'准备独立测试缓存和临时端口',logs:[]});
  await fs.mkdir(path.join(cache,'Server'),{recursive:true});
  const source=path.join(output,'Zomboid');for(const suffix of ['.ini','_SandboxVars.lua','_spawnregions.lua','_spawnpoints.lua'])if(await exists(path.join(source,'Server',config.name+suffix))){let text=await fs.readFile(path.join(source,'Server',config.name+suffix),'utf8');if(suffix==='.ini')text=patchIni(text,{WorkshopItems:'',Public:'false',UPnP:'false',SteamVAC:'false',Password:secret,AutoCreateUserInWhiteList:'false'});await fs.writeFile(path.join(cache,'Server',testName+suffix),text);}
  if(await exists(path.join(source,'mods')))await fs.cp(path.join(source,'mods'),path.join(cache,'mods'),{recursive:true});
  const owners=await logOwners(mods,output);
  lease=await reservePorts();const [port,udpPort]=lease.ports;
  const iniPath=path.join(cache,'Server',testName+'.ini');await fs.writeFile(iniPath,patchIni(await fs.readFile(iniPath,'utf8'),{DefaultPort:String(port),UDPPort:String(udpPort)}));
  const {launcher}=await require('./core').runtimeInfo(runtime);if(!launcher)throw Error('缺少服务器启动脚本');
  const args=javaArguments(await fs.readFile(path.join(runtime,launcher),'utf8'));args.push('-cachedir='+cache,'-servername',testName,'-nosteam','-modfolders','mods','-ip','127.0.0.1','-adminusername','studio_smoke_admin','-adminpassword',secret);
  logHandle=await fs.open(logPath,'w');lease.release();lease=null;
  child=(options.launchProcess||spawn)(path.join(runtime,'jre64/bin/java.exe'),args,{cwd:runtime,windowsHide:true,env:{...process.env,_JAVA_OPTIONS:''},stdio:['pipe','pipe','pipe']});child.stdin.on('error',()=>{});
  closedPromise=new Promise(resolve=>child.once('close',code=>resolve(code)));child.once('error',e=>{spawnError=e.message;});
  const decoderOut=new (require('node:string_decoder').StringDecoder)('utf8'),decoderErr=new (require('node:string_decoder').StringDecoder)('utf8');
  function receive(text){const sanitized=text.split(secret).join('[临时凭据已隐藏]');logBytes+=Buffer.byteLength(sanitized);if(logBytes>30*1024*1024){spawnError='日志超过 30 MB 限制';stop();return;}log+=sanitized;writeQueue=writeQueue.then(()=>logHandle.write(sanitized)).catch(e=>{spawnError=e.message;stop();});const lines=sanitized.split(/\r?\n/).filter(Boolean);if(/\*+ SERVER STARTED/i.test(log)&&!ready){ready=true;progress({phase:'smoke',message:'服务器已就绪，正在停止测试进程',logs:lines.slice(-40)});stop();}else if(!ready&&/Server Terminated\./i.test(sanitized)){terminated=true;progress({phase:'smoke',message:'服务器报告启动终止，正在整理错误证据',logs:lines.slice(-40)});stop();}else progress({phase:'smoke',message:'启动检查中 · '+Math.round((Date.now()-started)/1000)+' 秒',logs:lines.slice(-40)});}
  const pending={out:'',err:''};function buffered(kind,text,flush=false){pending[kind]+=text;const end=flush?pending[kind].length:pending[kind].lastIndexOf('\n')+1;if(end){receive(pending[kind].slice(0,end));pending[kind]=pending[kind].slice(end);}if(pending[kind].length>1024*1024){spawnError='单行日志超过大小限制';stop();}}
  child.stdout.on('data',b=>buffered('out',decoderOut.write(b)));child.stderr.on('data',b=>buffered('err',decoderErr.write(b)));
  timer=setTimeout(()=>{timedOut=true;progress({phase:'smoke',message:'启动超时，正在停止测试进程'});stop();},timeoutMs);
  if(options.signal){cancel=()=>{cancelled=true;stop();};options.signal.addEventListener('abort',cancel,{once:true});if(options.signal.aborted)cancel();}
  const code=await closedPromise;buffered('out',decoderOut.end(),true);buffered('err',decoderErr.end(),true);await writeQueue;
  const analysis=analyzeLog(log,owners);analysis.unconfirmedModIds=mods.map(m=>m.id).filter(id=>!analysis.loadedModIds.includes(id));const status=cancelled?'cancelled':analysis.findings.some(f=>f.severity!=='warning')?'failed':spawnError||analysis.environmentIssue?'blocked':!ready?timedOut&&!terminated?'timeout':'failed':analysis.warnings||analysis.errors?'passed_with_warnings':'passed';
  const report={status,ready,exitCode:code,durationMs:Date.now()-started,timeoutMs,mode:'隔离缓存 / 无 Steam / 本机临时 UDP 端口',message:spawnError||analysis.environmentIssue?'测试环境或运行时异常，不能归因于模组':status==='timeout'?'测试超时，未证明模组不兼容':analysis.findings.some(f=>f.severity!=='warning')?'日志发现模组相关错误，见证据':ready?'服务器启动到就绪状态':'服务器未达到就绪状态',...analysis,logPath,reportPath:path.join(reportDir,'smoke-report.json'),limitations:['不测试 Steam 下载、多人入服和全部游戏交互','没有日志归因证据的异常不指定问题模组','只测试当前模组组合，不自动二分或禁用模组']};
  await fs.writeFile(report.reportPath,JSON.stringify(report,null,2));progress({phase:'smoke',message:report.message,smoke:report});return report;
 }catch(e){const report={status:'blocked',ready:false,message:e.message,findings:[],durationMs:Date.now()-started,logPath,reportPath:path.join(reportDir,'smoke-report.json')};await fs.writeFile(report.reportPath,JSON.stringify(report,null,2));progress({phase:'smoke',message:e.message,smoke:report});return report;
 }finally{clearTimeout(timer);clearTimeout(forceTimer);if(cancel)options.signal.removeEventListener('abort',cancel);lease?.release();if(child&&child.exitCode===null){child.kill();await closedPromise;}await writeQueue;await logHandle?.close();await fs.rm(cache,{recursive:true,force:true});}
}
module.exports={javaArguments,analyzeLog,runSmoke,logOwners};
