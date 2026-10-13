(function(root){
 const model=typeof module==='object'?require('./mod-model'):root.ModModel;
 function restore(config,mods,version='',preferredRoot=''){
  const metadata=config.selectedMetadata||[],saved=config.selected||[],ids=Object.hasOwn(config.settings||{},'Mods')?String(config.settings.Mods||'').split(';').filter(Boolean):saved.map(key=>(metadata.find(m=>m.key===key)||mods.find(m=>m.key===key))?.id).filter(Boolean);
  const selected=[],selectedMetadata=[],missing=[];
  for(const id of ids){if(selectedMetadata.some(m=>model.sameId(m.id,id)))continue;const hint=metadata.find(m=>model.sameId(m.id,id)),oldKey=saved.find(key=>model.sameId((metadata.find(m=>m.key===key)||mods.find(m=>m.key===key))?.id,id));let candidates=mods.filter(m=>model.sameId(m.id,id));
   if(preferredRoot)candidates=candidates.filter(m=>m.path.replace(/\\/g,'/').toLowerCase().startsWith(preferredRoot.replace(/\\/g,'/').toLowerCase()+'/'));
   const source=candidates.find(m=>m.key===oldKey)||candidates.find(m=>hint?.workshopId&&m.workshopId===hint.workshopId)||candidates[0],mod=source&&model.effectiveVariant(source,candidates,version),key=mod?.key||'missing:'+model.modId(id);
   selected.push(key);selectedMetadata.push({key,id:mod?.id||id,workshopId:mod?.workshopId||hint?.workshopId||''});if(!mod)missing.push(id);
  }
  return {...config,selected,selectedMetadata,missing};
 }
 const api={restore};if(typeof module==='object')module.exports=api;else root.ConfigModel=api;
})(typeof globalThis==='object'?globalThis:this);
