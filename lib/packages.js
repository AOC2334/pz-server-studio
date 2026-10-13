const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const core=require('./core'),projects=require('./projects'),ConfigModel=require('../public/config-model');
const suffixes=['.ini','_SandboxVars.lua','_spawnregions.lua','_spawnpoints.lua','.pzstudio.json'];
async function inside(root,file){const real=await fs.realpath(file),relative=path.relative(root,real);if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('服务器包内包含指向外部的路径，无法编辑');return real;}
async function inspect(folder){
 const root=await fs.realpath(folder),manifestPath=await inside(root,path.join(root,'manifest.json')),manifest=JSON.parse(await fs.readFile(manifestPath,'utf8')),name=projects.name(manifest.configName);
 const configRoot=await inside(root,path.join(root,'Zomboid/Server'));await inside(root,path.join(configRoot,name+'.ini'));const runtime=await inside(root,path.join(root,'runtime')),info=await core.runtimeInfo(runtime);
 try{await inside(root,path.join(configRoot,'.pzstudio'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!info.launcher)throw Error('服务器包缺少运行环境启动脚本');await inside(root,path.join(runtime,info.launcher));
 const modsRoot=path.join(root,'Zomboid/mods');try{await inside(root,modsRoot);}catch(e){if(e.code!=='ENOENT')throw e;}
 const settings=core.ini(await fs.readFile(path.join(configRoot,name+'.ini'),'utf8'));
 return {id:crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,24),root,name,configRoot,runtime,launcher:info.launcher,modsRoot,manifest,modCount:(settings.Mods||'').split(';').filter(Boolean).length,modifiedAt:(await fs.stat(path.join(configRoot,name+'.ini'))).mtime.toISOString()};
}
async function list(output,extra=[]){
 if(!Array.isArray(extra)||extra.length>20)throw Error('补充服务器包路径最多 20 个');const candidates=[...extra];try{for(const entry of await fs.readdir(output,{withFileTypes:true}))if(entry.isDirectory()&&!entry.isSymbolicLink()&&!entry.name.endsWith('.building'))candidates.push(path.join(output,entry.name));}catch(e){if(e.code!=='ENOENT')throw e;}
 const packages=[],warnings=[];for(const candidate of candidates){try{const item=await inspect(candidate);if(!packages.some(p=>p.id===item.id))packages.push(item);}catch(e){if(extra.includes(candidate))warnings.push(candidate+'：'+e.message);}}
 return {packages,warnings};
}
async function load(item,scan){const config=await projects.load(item.configRoot,item.name);const metadata=(item.manifest.bundledMods||item.manifest.mods||[]).map(m=>({key:'package:'+m.id,id:m.id,workshopId:m.workshopId||''}));
 return ConfigModel.restore({...config,selectedMetadata:[...config.selectedMetadata,...metadata],install:item.runtime,heap:String(item.manifest.heapGB||4),packageId:item.id},scan.mods,scan.installs.find(i=>i.path===item.runtime)?.gameVersion||'',item.modsRoot);
}
async function save(item,config,scan){
 const checked=await inspect(item.root);if(checked.id!==item.id||checked.name!==item.name)throw Error('服务器包已变化，请重新加载');if(config.name!==item.name)throw Error('请保留服务器包的配置名称');
 const mods=core.validate({...config,install:item.runtime},scan);for(const mod of mods){const relative=path.relative(item.modsRoot,mod.path);if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('模组 '+mod.id+' 不在服务器包内，添加或更新模组请重新构建服务器包');await inside(item.root,mod.key);}
 config={...config,settings:{...config.settings,Mods:mods.map(m=>m.id).join(';'),WorkshopItems:''}};
 const heap=Number(config.heap);if(!Number.isInteger(heap)||heap<1||heap>64)throw Error('内存必须为 1–64 GB');
 const launcherFile=path.join(item.runtime,item.launcher),launcher=await fs.readFile(launcherFile,'utf8');if(!/-Xmx\S+/.test(launcher)||!/-Xms\S+/.test(launcher))throw Error('无法识别启动脚本内存参数');
 const edits=new Map([[launcherFile,launcher.replace(/-Xmx\S+/g,`-Xmx${heap}g`).replace(/-Xms\S+/g,`-Xms${Math.min(heap,2)}g`)],[path.join(item.root,'manifest.json'),JSON.stringify({...checked.manifest,heapGB:heap,bundledMods:checked.manifest.bundledMods||checked.manifest.mods,mods:mods.map(({id,workshopId,name})=>({id,workshopId,name})),editedAt:new Date().toISOString()},null,2)]]);
 const originals=new Map();for(const file of [...edits.keys(),...suffixes.map(s=>path.join(item.configRoot,item.name+s))]){try{await inside(item.root,file);originals.set(file,await fs.readFile(file));}catch(e){if(e.code!=='ENOENT')throw e;originals.set(file,null);}}
 const backup=path.join(item.configRoot,'.pzstudio/package-backups',Date.now()+'-'+crypto.randomUUID());await fs.mkdir(backup,{recursive:true});const record=[];for(const [file,contents]of originals){const rel=path.relative(item.root,file);record.push(rel);if(contents!==null){const target=path.join(backup,rel);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,contents);}}await fs.writeFile(path.join(backup,'record.json'),JSON.stringify({root:item.root,files:record,at:new Date().toISOString()},null,2));
 try{await projects.save(item.configRoot,{...config,packageId:undefined},core.patchIni);for(const [file,text]of edits){const temporary=file+'.tmp-'+crypto.randomUUID();try{await fs.writeFile(temporary,text,{flag:'wx'});await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true});}}}
 catch(e){for(const [file,contents]of originals){if(contents===null)await fs.rm(file,{force:true});else await fs.writeFile(file,contents);}throw e;}
 return {ok:true,name:item.name,root:item.configRoot,backup};
}
module.exports={inspect,list,load,save,inside};
