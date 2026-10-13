const path=require('node:path'),core=require('./core'),workshop=require('./workshop'),M=require('../public/mod-model');
async function prepare(config,snapshot,options){
 const {steamcmd,refresh,progress=()=>{},details=workshop.details,installedTime=workshop.installedTime}=options;
 require('./projects').name(config.name);core.validate({...config,selected:[]},snapshot);if(!snapshot.installs.some(i=>i.path===config.install&&(i.appId==='380870'||i.kind==='dedicated')))throw Error('请选择 Dedicated Server 运行环境');
 let scan=snapshot,keys=[...config.selected],checked=new Set(),records=[];const version=snapshot.installs.find(i=>i.path===config.install)?.gameVersion||config.targetVersion||'';
 for(let round=0;round<8;round++){
  const active=keys.map(key=>scan.mods.find(m=>m.key===key)||(config.selectedMetadata||[]).find(m=>m.key===key&&m.workshopId));if(active.some(m=>!m))throw Error('启用模组的来源已失效，请刷新并重新选择');const ids=[...new Set(active.map(m=>m.workshopId).filter(Boolean))].filter(id=>!checked.has(id));
  if(ids.length){progress('正在获取 '+ids.length+' 个工坊条目的最新版本');const remote=[];for(let i=0;i<ids.length;i+=100)remote.push(...await details(ids.slice(i,i+100)));if(remote.some(m=>m.error))throw Error(remote.filter(m=>m.error).map(m=>m.id+'：'+m.error).join('；'));
   if(!(await steamcmd.state()).available){progress('正在安装 SteamCMD');await steamcmd.install();}await steamcmd.enqueue(ids,config.steamAccount||'anonymous');
   let lastMessage='';while(steamcmd.busy){const state=await steamcmd.state();const message='构建前更新模组：'+state.queue.filter(j=>j.status==='done').length+'/'+ids.length+' · '+(state.queue.find(j=>j.status==='running')?.message||'正在校验')+(state.challenge?' · 请在工坊下载区提交 Steam 登录验证':'');if(message!==lastMessage){progress(message);lastMessage=message;}await new Promise(r=>setTimeout(r,300));}
   const state=await steamcmd.state();if(state.queue.some(j=>j.status!=='done'))throw Error('模组更新失败，未生成服务器包：'+state.queue.filter(j=>j.status!=='done').map(j=>j.id+' '+j.message).join('；'));
   const latest=[];for(let i=0;i<ids.length;i+=100)latest.push(...await details(ids.slice(i,i+100)));for(const item of latest){const local=await installedTime(steamcmd.managedRoot,item.id);if(item.error||!local||!item.updated||local<item.updated)throw Error('无法确认 '+item.id+' 已下载最新版本，请重试；未生成服务器包');records.push({id:item.id,title:item.title,updated:local,checkedAt:new Date().toISOString()});checked.add(item.id);}
   const before=active;scan=await refresh();keys=before.map(old=>{if(!old.workshopId)return old.key;const candidates=scan.mods.filter(m=>m.workshopId===old.workshopId&&M.sameId(m.id,old.id)&&m.path.toLowerCase().startsWith(path.resolve(steamcmd.managedRoot).toLowerCase()+path.sep));if(!candidates.length)throw Error('新版工坊条目 '+old.workshopId+' 已移除 Mod ID '+old.id+'，请重新选择');return M.effectiveVariant(candidates[0],candidates,version).key;});
  }
  const previous=[...keys];for(const key of previous){const enabled=M.enableWithDependencies(keys,scan.mods,key,version);if(enabled.missing.length||enabled.cycles.length)throw Error([...enabled.missing,...enabled.cycles.map(id=>'循环前置：'+id)].join('；'));keys=enabled.selected;}
  const unverified=keys.some(key=>{const m=scan.mods.find(m=>m.key===key);return m?.workshopId&&!checked.has(m.workshopId);});if(!unverified){const {steamAccount,...safeConfig}=config;const prepared={...safeConfig,selected:keys,workshopVersions:records};return {config:prepared,scan,mods:core.validate(prepared,scan)};}
 }
 throw Error('新版模组依赖展开超过 8 轮，请检查依赖链');
}
module.exports={prepare};
