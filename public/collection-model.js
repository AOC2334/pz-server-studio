(function(root){
 const M=typeof module==='object'?require('./mod-model'):root.ModModel;
 function merge(selected,mods,workshopIds,version='',preferredRoot='',metadata=[]){
  const inRoot=m=>!preferredRoot||m.path.replace(/\\/g,'/').toLowerCase().startsWith(preferredRoot.replace(/\\/g,'/').toLowerCase()+'/'),identity=key=>mods.find(m=>m.key===key)||metadata.find(m=>m.key===key);
  const result=[...selected],existing=new Set(selected.map(k=>M.modId(identity(k)?.id)).filter(Boolean)),added=[],missing=[],problems=[],seen=new Set();
  function add(mod){const id=M.modId(mod.id);if(existing.has(id)){const index=result.findIndex(k=>M.sameId(identity(k)?.id,id));if(index>=0&&!mods.some(m=>m.key===result[index]))result[index]=mod.key;return;}if(seen.has(id)){problems.push('发现循环前置：'+id);return;}seen.add(id);for(const dependency of mod.require||[]){if(existing.has(M.modId(dependency)))continue;const candidates=mods.filter(m=>M.sameId(m.id,dependency)&&inRoot(m));const source=candidates[0];if(source)add(M.effectiveVariant(source,mods,version));else problems.push(mod.id+' 缺少前置 '+M.modId(dependency));}result.push(mod.key);existing.add(id);added.push(mod.id);}
  for(const workshopId of workshopIds){let candidates=mods.filter(m=>m.workshopId===workshopId);if(preferredRoot)candidates=candidates.filter(m=>m.path.replace(/\\/g,'/').toLowerCase().startsWith(preferredRoot.replace(/\\/g,'/').toLowerCase()+'/'));if(!candidates.length){missing.push(workshopId);continue;}for(const group of M.groupMods(candidates)){const mod=M.effectiveVariant(group.variants[0],candidates,version);add(mod);}}
  return {selected:result,added,missing,problems:[...new Set(problems)]};
 }
 const api={merge};if(typeof module==='object')module.exports=api;else root.CollectionModel=api;
})(typeof globalThis==='object'?globalThis:this);
