const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const modInfo=require('./mod-info');
const sandbox=require('./sandbox');
const {modId,sameId,effectiveVariant}=require('../public/mod-model');
async function runtimeInfo(dir){let names=[];try{names=await fs.readdir(dir);}catch{}const launcher=['startserver64.bat','start-server64.bat','start-server.bat','projectzomboidserver.bat'].map(name=>names.find(n=>n.toLowerCase()===name)).find(Boolean);const available=!!launcher&&await exists(path.join(dir,'jre64/bin/java.exe'))&&(await exists(path.join(dir,'projectzomboid.jar'))||await exists(path.join(dir,'java/projectzomboid.jar'))||await exists(path.join(dir,'zombie/network/GameServer.class'))||await exists(path.join(dir,'java/zombie/network/GameServer.class')));return {launcher:launcher||null,available};}
function dedicatedInstall(scan){return scan.installs.find(i=>i.appId==='380870'&&i.available!==false)||scan.installs.find(i=>i.kind==='dedicated'&&i.available!==false)||scan.installs.find(i=>i.appId==='380870'||i.kind==='dedicated')||null;}
function migrateConfig(config,scan){const install=scan.installs.find(i=>i.path===config.install&&(i.appId==='380870'||i.kind==='dedicated'))||dedicatedInstall(scan);return {...config,runtimeSource:'dedicated',schemaVersion:2,install:install?.path||''};}
const pathKey=p=>process.platform==='win32'?path.resolve(p).toLowerCase():path.resolve(p);
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function read(p) { try { return (await fs.readFile(p,'utf8')).replace(/^\uFEFF/,''); } catch { return ''; } }
async function dirs(p) { try { return (await fs.readdir(p,{withFileTypes:true})).filter(x=>x.isDirectory()&&!x.isSymbolicLink()).map(x=>path.join(p,x.name)); } catch { return []; } }
async function findModImage(modPath){
 const meta=ini(await read(path.join(modPath,'mod.info')));
 const root=/^\d+(?:\.\d+)*$/.test(path.basename(modPath))?path.dirname(modPath):modPath;
 const candidates=[];for(const name of [meta.icon,meta.poster,'icon.png','poster.png','preview.png','preview.jpg'].filter(Boolean))for(const dir of [...new Set([modPath,root,path.join(root,'common')])]){
  const candidate=path.resolve(dir,name);const relative=path.relative(root,candidate);
  if(relative.startsWith('..')||path.isAbsolute(relative)||!/^\.(png|jpe?g|webp|gif)$/i.test(path.extname(candidate)))continue;candidates.push(candidate);
 }
 let realRoot;try{realRoot=await fs.realpath(root);}catch{return null;}
 for(const candidate of candidates)try{const real=await fs.realpath(candidate),relative=path.relative(realRoot,real),stat=await fs.stat(real);if(!relative.startsWith('..')&&!path.isAbsolute(relative)&&stat.isFile()&&stat.size>0&&stat.size<=10*1024*1024)return real;}catch{}
 return null;
}
function vdf(text) {
 const tokens = text.replace(/\/\/[^\r\n]*/g,'').match(/"(?:\\.|[^"\\])*"|[{}]/g)||[]; let i=0;
 const value=t=>t.slice(1,-1).replace(/\\\\/g,'\\').replace(/\\"/g,'"');
 function object() {const out={}; while(i<tokens.length&&tokens[i]!=='}'){const k=value(tokens[i++]); if(tokens[i]==='{'){i++;out[k]=object();}else out[k]=value(tokens[i++]||'""');} if(tokens[i]==='}')i++;return out;} return object();
}
function ini(text) { const out={}; for(const l of text.split(/\r?\n/)){const m=l.match(/^([^#;=\s][^=]*)=(.*)$/);if(m)out[m[1].trim()]=m[2];}return out; }
function patchIni(text,values) {const seen=new Set();const lines=text.split(/\r?\n/).map(l=>{const m=l.match(/^([^#;=\s][^=]*)=/);if(m&&Object.hasOwn(values,m[1].trim())){const k=m[1].trim();seen.add(k);return k+'='+values[k];}return l;});for(const [k,v]of Object.entries(values))if(!seen.has(k))lines.push(k+'='+v);return lines.join('\r\n');}
async function discover(extra=[],managedRoot=null,packages=[]) {
 const warnings=[];const roots=[process.env.STEAM_PATH,path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Steam'),path.join(process.env.ProgramFiles||'C:/Program Files','Steam')];
 if(process.platform==='win32') for(const key of ['HKCU\\Software\\Valve\\Steam','HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam'])try{const t=execFileSync('reg',['query',key],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']});for(const m of t.matchAll(/(?:SteamPath|InstallPath)\s+REG_SZ\s+(.+)/g))roots.push(m[1].trim());}catch{}
 roots.push(...extra);const libraries=new Set();const addLibrary=p=>{const resolved=path.resolve(p);if(![...libraries].some(existing=>pathKey(existing)===pathKey(resolved)))libraries.add(resolved);};for(const root of roots.filter(Boolean)){if(!await exists(root)){warnings.push('路径不存在：'+root);continue;}const r=path.resolve(root);addLibrary(r);const folders=vdf(await read(path.join(r,'steamapps/libraryfolders.vdf'))).libraryfolders||{};for(const val of Object.values(folders)){const p=typeof val==='string'?val:val.path;if(p&&await exists(p))addLibrary(p);}}
 const installs=[];const workshopRoots=managedRoot?[path.join(managedRoot,'steamapps/workshop/content/108600')]:[];for(const lib of libraries){for(const app of ['380870','108600']){const manifest=vdf(await read(path.join(lib,'steamapps',`appmanifest_${app}.acf`))).AppState;if(manifest?.installdir){const p=path.join(lib,'steamapps/common',manifest.installdir);if(await exists(p))installs.push({path:p,appId:app,build:manifest.buildid,beta:manifest.UserConfig?.BetaKey||'public'});}}workshopRoots.push(path.join(lib,'steamapps/workshop/content/108600'));}
 for(const p of extra)if((await runtimeInfo(p)).available&&!installs.some(i=>pathKey(i.path)===pathKey(p)))installs.push({path:path.resolve(p),appId:'manual',build:'未知',beta:'未知'});
 for(const i of installs)workshopRoots.push(path.join(i.path,'steamapps/workshop/content/108600'));
 const mods=[];const visited=new Set();async function walk(p,workshopId='',depth=0){if(depth>7)return;for(const sub of await dirs(p)){const info=path.join(sub,'mod.info');if(await exists(info)&&!visited.has(pathKey(info))){visited.add(pathKey(info));const meta=ini(await read(info));if(meta.id)mods.push({key:info,id:meta.id,name:meta.name||meta.id,description:meta.description||'',require:(meta.require||'').split(/[,;]/).map(x=>x.trim()).filter(Boolean),workshopId,path:sub,variant:path.relative(p,sub),maps:(await dirs(path.join(sub,'media/maps'))).map(x=>path.basename(x))});}await walk(sub,workshopId,depth+1);}}
 for(const root of new Set(workshopRoots))for(const item of await dirs(root))if(/^\d+$/.test(path.basename(item)))await walk(item,path.basename(item));
 const local=path.join(os.homedir(),'Zomboid/mods');await walk(local);
 for(const pack of packages){const first=mods.length;await walk(pack.modsRoot);for(const mod of mods.slice(first)){mod.source='package';mod.packageId=pack.id;mod.workshopId=(pack.manifest.bundledMods||pack.manifest.mods)?.find(m=>sameId(m.id,mod.id))?.workshopId||'';}if(!installs.some(i=>pathKey(i.path)===pathKey(pack.runtime)))installs.push({path:pack.runtime,appId:'380870',build:'服务器包',beta:'包内环境'});}
 const configRoot=path.join(os.homedir(),'Zomboid/Server');let profiles=[];try{profiles=(await fs.readdir(configRoot)).filter(x=>x.endsWith('.ini')).map(x=>x.slice(0,-4));}catch{}
 for(const mod of mods){mod.imagePath=await findModImage(mod.path);const contents=(await dirs(path.join(mod.path,'media'))).map(x=>path.basename(x));let scripts=[];try{scripts=await fs.readdir(path.join(mod.path,'media/scripts'));}catch{}Object.assign(mod,modInfo.metadata(await read(mod.key),mod.path,mod.maps,[...contents,...scripts]));try{mod.modifiedAt=(await fs.stat(mod.key)).mtime.toISOString();}catch{warnings.push('扫描期间模组文件发生变化，请刷新：'+mod.id);}}
 for(const install of installs){install.kind=install.appId==='380870'||/project zomboid dedicated server/i.test(path.basename(install.path))?'dedicated':'game';Object.assign(install,await runtimeInfo(install.path));install.gameVersion=await modInfo.gameVersion(install.path);install.sandbox=await sandbox.installation(install.path);if(install.kind==='dedicated'&&!install.available)warnings.push('Dedicated Server 尚未安装完成或缺少启动文件：'+install.path);}
 for(const mod of mods)mod.sandboxOptions=await sandbox.modOptions(mod);
 if(managedRoot)for(const mod of mods)if(pathKey(mod.path).startsWith(pathKey(managedRoot)+path.sep))mod.source='managed';
 return {libraries:[...libraries],installs,mods,profiles,configRoot,warnings};
}
async function profile(root,name) {if(!/^[\w-]+$/.test(name))throw Error('配置名仅支持字母、数字、下划线和短横线');const files={};for(const suffix of ['.ini','_SandboxVars.lua','_spawnregions.lua','_spawnpoints.lua'])files[suffix]=await read(path.join(root,name+suffix));return {files,settings:ini(files['.ini'])};}
function validate(config,scan) {
 if(!/^[\w-]{1,64}$/.test(config.name||''))throw Error('服务器配置名仅支持 1–64 位字母、数字、下划线和短横线');
 const version=scan.installs?.find(i=>i.path===config.install)?.gameVersion||config.targetVersion||'';
 const selected=(config.selected||[]).map(k=>{const m=scan.mods.find(m=>m.key===k);if(!m)throw Error('模组已失效，请重新扫描');return effectiveVariant(m,scan.mods,version);});
 const ids=new Set();for(const m of selected){if(version&&+version.split('.')[0]>=42&&m.path&&!m.versionDirectory&&path.basename(m.path)!=='common'&&!scan.mods.some(x=>x.path===path.join(m.path,'common')))throw Error(m.id+' 仅有旧版根目录，未发现可供 B42 加载的版本目录；请选择 B42 替代模组');if(/[;\r\n]/.test(m.id))throw Error('模组 ID 含非法分隔符');if(ids.has(modId(m.id)))throw Error('重复模组 ID：'+m.id+'，请只选择一个版本');ids.add(modId(m.id));}
 for(const m of selected)for(const dep of m.require){if(!ids.has(modId(dep)))throw Error(`${m.name} 缺少依赖：${dep}`);if(selected.findIndex(x=>sameId(x.id,dep))>selected.indexOf(m))throw Error(`${dep} 必须排在 ${m.id} 前面`);}
 for(const mod of selected)for(const other of mod.incompatible||[])if(ids.has(modId(other)))throw Error(`${mod.id} 声明与 ${other} 不兼容`);
 const settings=config.settings||{};for(const [k,v]of Object.entries(settings))if(!/^[\w]+$/.test(k)||/[\r\n\0]/.test(String(v)))throw Error('INI 设置含非法字符');
 for(const k of ['DefaultPort','UDPPort'])if(settings[k]!==undefined&&(!/^\d+$/.test(settings[k])||+settings[k]<1||+settings[k]>65535))throw Error(k+' 必须为 1–65535');
 if(settings.MaxPlayers!==undefined&&(!/^\d+$/.test(settings.MaxPlayers)||+settings.MaxPlayers<1||+settings.MaxPlayers>100))throw Error('玩家数量必须为 1–100');
 return selected;
}
async function copyTree(src,dst,onFile=()=>{},filter=()=>true){await fs.mkdir(dst,{recursive:true});for(const e of await fs.readdir(src,{withFileTypes:true})){const a=path.join(src,e.name),b=path.join(dst,e.name);if(!filter(a,e))continue;if(e.isSymbolicLink())throw Error('为保证包独立性，不支持符号链接：'+a);if(e.isDirectory())await copyTree(a,b,onFile,filter);else if(e.isFile()){await fs.copyFile(a,b);onFile(a);}}}
async function treeSize(src,filter=()=>true){let size=0;for(const e of await fs.readdir(src,{withFileTypes:true})){const p=path.join(src,e.name);if(!filter(p,e))continue;if(e.isSymbolicLink())throw Error('不支持符号链接：'+p);if(e.isDirectory())size+=await treeSize(p,filter);else if(e.isFile())size+=(await fs.stat(p)).size;}return size;}
async function build(config,scan,output,progress=()=>{}) {
 const selected=validate(config,scan);const install=scan.installs.find(i=>i.path===config.install);if(!install||(install.appId!=='380870'&&install.kind!=='dedicated'))throw Error('请选择 Steam 下载的 Project Zomboid Dedicated Server（AppID 380870）');
 const runtime=await runtimeInfo(install.path),launcher=runtime.launcher;if(!runtime.available)throw Error('Dedicated Server 尚未安装完成：缺少启动脚本、JRE 或服务器主类，请在 Steam 工具中完成安装并刷新');
 const heap=Number(config.heap||4);if(!Number.isInteger(heap)||heap<1||heap>64)throw Error('内存必须为 1–64 GB');
 await fs.mkdir(output,{recursive:true});const runtimeFilter=p=>{const rel=path.relative(install.path,p).split(path.sep);return !['steamapps','Workshop','mods','Saves','Server'].includes(rel[0])&&!/^(hs_err|replay)_pid.*\.log$/.test(rel[0]);};
 progress('检查可用空间',0);let required=await treeSize(install.path,runtimeFilter);for(const m of selected){let root=m.path;while(path.basename(path.dirname(root)).toLowerCase()!=='mods'&&path.dirname(root)!==root)root=path.dirname(root);required+=await treeSize(path.dirname(root)===root?m.path:root);}
 const disk=await fs.statfs(output);if(disk.bavail*disk.bsize<required+256*1024*1024)throw Error(`磁盘空间不足：预估至少需要 ${(required/1024**3).toFixed(1)} GB（含安全余量）`);
 const target=path.join(output,config.name+'-'+Date.now());const staging=target+'.building';await fs.mkdir(staging);let count=0;
 try{progress('复制运行环境',count);await copyTree(install.path,path.join(staging,'runtime'),()=>{count++;if(count%100===0)progress('复制运行环境',count);},runtimeFilter);
 const cache=path.join(staging,'Zomboid');await fs.mkdir(path.join(cache,'Server'),{recursive:true});
 const copied=new Map();for(const m of selected){let source=m.path;while(path.basename(path.dirname(source)).toLowerCase()!=='mods'&&path.dirname(source)!==source)source=path.dirname(source);if(path.dirname(source)===source)source=m.path;const folder=path.basename(source);if(copied.has(folder)){if(copied.get(folder)!==source)throw Error('模组目录名称冲突：'+folder);continue;}copied.set(folder,source);await copyTree(source,path.join(cache,'mods',folder));}
 const workshopIds=[...new Set(selected.map(m=>m.workshopId).filter(Boolean))];

 const files=config.files||{};const values={...config.settings,Mods:selected.map(m=>m.id).join(';'),WorkshopItems:''};
 for(const suffix of ['.ini','_SandboxVars.lua','_spawnregions.lua','_spawnpoints.lua']){let text=files[suffix]||'';if(suffix==='.ini')text=patchIni(text,values);if(text)await fs.writeFile(path.join(cache,'Server',config.name+suffix),text,'utf8');}
 let bat=await read(path.join(staging,'runtime',launcher));bat=bat.replace(/(zombie\.network\.GameServer[^\r\n]*)/i,line=>line.replace(/%~?[1-9]/g,'').trimEnd());bat=bat.replace(/-Xmx\S+/g,`-Xmx${heap}g`).replace(/-Xms\S+/g,`-Xms${Math.min(heap,2)}g`);if(!bat.includes('%*'))bat=bat.replace(/(zombie\.network\.GameServer[^\r\n]*)/i,'$1 %*');if(!bat.includes('%*'))throw Error('未识别启动脚本的参数传递方式');await fs.writeFile(path.join(staging,'runtime',launcher),bat);
 await fs.writeFile(path.join(staging,'启动服务器.cmd'),`@echo off\r\nsetlocal\r\ncd /d "%~dp0runtime"\r\ncall "${launcher}" -cachedir="%~dp0Zomboid" -servername ${config.name} -modfolders mods\r\npause\r\n`);
 await fs.writeFile(path.join(staging,'manifest.json'),JSON.stringify({created:new Date().toISOString(),install,configName:config.name,mods:selected.map(({id,workshopId,name})=>({id,workshopId,name})),heapGB:heap,modDelivery:'bundled-local',workshopVersions:config.workshopVersions||[]},null,2));
 const packageFiles={...files,'.ini':patchIni(files['.ini']||'',values)};
 await fs.writeFile(path.join(cache,'Server',config.name+'.pzstudio.json'),JSON.stringify({...config,files:packageFiles,settings:values,selectedMetadata:selected.map(m=>({key:m.key,id:m.id,workshopId:m.workshopId})),schemaVersion:4,savedAt:new Date().toISOString()},null,2));
 await fs.writeFile(path.join(staging,'使用说明.txt'),'双击 启动服务器.cmd。首次启动按提示创建管理员密码。服务器数据保存在 Zomboid 文件夹。Steam 模式仍可能联网校验/更新创意工坊；本包不保证完全离线。客户端必须使用兼容游戏和模组版本。配置内密码为明文，请只分享给可信任人员。\r\n');
 await fs.rename(staging,target);progress('完成',count);return target;
 }catch(e){await fs.rm(staging,{recursive:true,force:true});throw e;}
}
module.exports={vdf,ini,patchIni,discover,profile,validate,build,exists,findModImage,runtimeInfo,dedicatedInstall,migrateConfig};
