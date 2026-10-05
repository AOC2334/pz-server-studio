(function(root){
 'use strict';
 // B42 dependency declarations may prefix a Mod ID with a backslash. Keep raw IDs for game files.
 function modId(id){return String(id??'').trim().replace(/^\\+/, '');}
 function sameId(a,b){return modId(a)===modId(b);}
 function compareMods(a,b,mode){
  const names=()=>String(a.name||a.id).localeCompare(String(b.name||b.id),'zh-CN',{numeric:true,sensitivity:'base'})||String(a.id).localeCompare(String(b.id));
  if(mode==='name-desc')return -names();if(mode==='name-asc')return names();
  if(mode==='modified-new'||mode==='modified-old'){const x=Date.parse(a.modifiedAt),y=Date.parse(b.modifiedAt);if(!Number.isFinite(x)||!Number.isFinite(y))return Number(!Number.isFinite(x))-Number(!Number.isFinite(y))||names();return (mode==='modified-new'?y-x:x-y)||names();}
  if(mode==='workshop-new'||mode==='workshop-old'){const x=String(a.workshopId||''),y=String(b.workshopId||''),valid=v=>/^\d+$/.test(v);if(!valid(x)||!valid(y))return Number(!valid(x))-Number(!valid(y))||names();const d=x.length-y.length||x.localeCompare(y);return (mode==='workshop-new'?-d:d)||names();}
  return 0;
 }
 function moveSelection(keys,from,to,after=false){if(from===to||!keys.includes(from)||!keys.includes(to))return [...keys];const result=keys.filter(k=>k!==from);result.splice(result.indexOf(to)+(after?1:0),0,from);return result;}
 function packagePath(mod){return (mod.path||'').replace(/\\/g,'/').replace(/\/(?:common|\d+(?:\.\d+)*)$/,'');}
 function effectiveVariant(mod,mods,version){if(!mod?.path)return mod;const major=String(version||'42').split('.')[0];if(+major<42)return mod;const candidates=mods.filter(m=>packagePath(m)===packagePath(mod)&&/^\d+(?:\.\d+)*$/.test(m.versionDirectory||'')&&m.versionDirectory.split('.')[0]===major&&(!version||compare(m.versionDirectory,version)<=0));return candidates.sort((a,b)=>compare(b.versionDirectory,a.versionDirectory))[0]||mod;}
 function resolveSelection(keys,mods,version){const found=keys.map(k=>{const m=mods.find(m=>m.key===k);return m?effectiveVariant(m,mods,version):{key:k,missing:true};});return found.filter((m,i)=>m.missing||found.findIndex(x=>!x.missing&&sameId(x.id,m.id))===i).map(m=>m.key);}
 function groupMods(mods){const groups=new Map();for(const mod of mods){if(!groups.has(mod.id))groups.set(mod.id,{id:mod.id,variants:[]});const group=groups.get(mod.id);if(!group.variants.some(v=>v.key===mod.key))group.variants.push(mod);}return [...groups.values()];}
 function variantLabel(mod){const normalized=mod.path.replace(/\\/g,'/');const tail=normalized.split('/').at(-1);const version=/^\d+(?:\.\d+)*$/.test(tail)?'版本 '+tail:'根目录';const source=!mod.workshopId?'本地模组':normalized.toLowerCase().includes('/steamapps/common/')?'游戏工坊缓存':'Steam 工坊';return `${source} · ${version}${mod.workshopId?' · '+mod.workshopId:''}`;}
 function chooseVariant(selected,mods,key){const chosen=mods.find(m=>m.key===key);if(!chosen)throw Error('模组来源已失效');const index=selected.findIndex(k=>sameId(mods.find(m=>m.key===k)?.id,chosen.id));const rest=selected.filter(k=>!sameId(mods.find(m=>m.key===k)?.id,chosen.id));if(index<0)return [...rest,key];rest.splice(index,0,key);return rest;}
 function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;}
 function compatibility(mod,version,ids=[]){const issues=[];for(const id of mod.require||[])if(!ids.some(value=>sameId(value,id)))issues.push('未启用依赖 '+id);for(const id of mod.incompatible||[])if(ids.some(value=>sameId(value,id)))issues.push('作者声明与 '+id+' 不兼容');const valid=s=>/^\d+(?:\.\d+)*$/.test(s||'');if(valid(version)){if(valid(mod.gameVersionMin)&&compare(version,mod.gameVersionMin)<0)issues.push('低于作者声明的最低版本');if(valid(mod.gameVersionMax)&&compare(version,mod.gameVersionMax)>0)issues.push('高于作者声明的最高版本');if(valid(mod.versionDirectory)&&mod.versionDirectory.split('.')[0]!==version.split('.')[0])issues.push('版本目录与目标游戏主版本不同');else if(valid(mod.versionDirectory)&&compare(version,mod.versionDirectory)<0)issues.push('目标游戏版本低于所选版本目录');if(valid(mod.declaredGameVersion)&&mod.declaredGameVersion.split('.')[0]!==version.split('.')[0])issues.push('作者版本说明与目标游戏主版本不同');}return {level:issues.length?'risk':'unknown',text:issues.length?issues.join('；'):!valid(version)?'未识别目标游戏版本，尚未验证':mod.gameVersionMin||mod.gameVersionMax?'声明范围未发现版本冲突；实际组合需启动测试':'作者未声明版本范围；实际兼容性待测试'};}
 function enableWithDependencies(selected,mods,key,version,preferred=[]){
  let keys=resolveSelection(chooseVariant(selected,mods,key),mods,version);const added=[],missing=[],cycles=[],ordered=[],visiting=new Set(),done=new Set();
  function visit(k){
   const mod=mods.find(m=>m.key===k);if(!mod)return;
   const id=modId(mod.id);if(visiting.has(id)){cycles.push(id);return;}if(done.has(id))return;visiting.add(id);
   for(const dependency of mod.require||[]){
    let dep=mods.find(m=>keys.includes(m.key)&&sameId(m.id,dependency));
    if(!dep){const candidates=mods.filter(m=>sameId(m.id,dependency)).map(m=>effectiveVariant(m,mods,version)).filter(m=>sameId(m.id,dependency));
     dep=candidates.find(m=>preferred.includes(m.key))||candidates.find(m=>!compatibility(m,version,[]).text.match(/低于作者|高于作者|主版本不同|低于所选/))||candidates[0];
     if(!dep){missing.push(`${mod.id} 缺少 ${modId(dependency)}`);continue;}keys=chooseVariant(keys,mods,dep.key);added.push(dep.id);
    }
    visit(dep.key);
    
   }
   visiting.delete(id);done.add(id);ordered.push(k);
  }
  const active=mods.find(m=>m.key===key);visit(keys.find(k=>sameId(mods.find(m=>m.key===k)?.id,active?.id)));
  const insertion=keys.findIndex(k=>ordered.includes(k));keys=keys.filter(k=>!ordered.includes(k));keys.splice(Math.max(0,insertion),0,...ordered);
  return {selected:keys,added:[...new Set(added)],missing:[...new Set(missing)],cycles:[...new Set(cycles)]};
 }
 const api={modId,sameId,compareMods,moveSelection,effectiveVariant,resolveSelection,groupMods,variantLabel,chooseVariant,enableWithDependencies,compatibility};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ModModel=api;
})(typeof window==='undefined'?{}:window);
