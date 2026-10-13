const fs=require('node:fs/promises'),path=require('node:path');
const {vdf}=require('./core');
function workshopId(value){
 const text=String(value||'').trim();if(/^[1-9]\d{0,19}$/.test(text))return text;
 try{const u=new URL(text);if(u.protocol==='https:'&&u.hostname==='steamcommunity.com'&&['/sharedfiles/filedetails/','/workshop/filedetails/'].includes(u.pathname)&&/^[1-9]\d{0,19}$/.test(u.searchParams.get('id')||''))return u.searchParams.get('id');}catch{}
 throw Error('请输入工坊编号或 Steam 创意工坊条目链接');
}
async function details(values,fetcher=fetch){
 const ids=[...new Set(values.map(workshopId))];if(!ids.length||ids.length>100)throw Error('每次查询 1–100 个工坊条目');
 const body=new URLSearchParams({itemcount:String(ids.length)});ids.forEach((id,i)=>body.set(`publishedfileids[${i}]`,id));
 const response=await fetcher('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',{method:'POST',body,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Steam 工坊查询失败：HTTP '+response.status);
 const result=await response.json(),items=result.response?.publishedfiledetails;if(!Array.isArray(items))throw Error('Steam 返回了无效的工坊数据');
 return ids.map(id=>{const item=items.find(x=>String(x.publishedfileid)===id);if(!item||item.result!==1)return {id,error:'条目不存在、不可见或 Steam 拒绝访问'};if(Number(item.consumer_app_id)!==108600)return {id,error:'此条目不属于 Project Zomboid'};
  return {id,type:item.file_type===undefined?null:Number(item.file_type),title:String(item.title||id),description:String(item.description||'').slice(0,20000),created:Number(item.time_created)||null,updated:Number(item.time_updated)||null,tags:(item.tags||[]).map(t=>String(t.tag)),url:'https://steamcommunity.com/sharedfiles/filedetails/?id='+id};});
}
async function installedTime(root,id){try{const data=vdf(await fs.readFile(path.join(root,'steamapps/workshop/appworkshop_108600.acf'),'utf8')).AppWorkshop;const installed=data?.WorkshopItemsInstalled?.[id];return Number(installed?.timeupdated)||null;}catch{try{return Number(JSON.parse(await fs.readFile(path.join(root,'records.json'),'utf8'))[id]?.updated)||null;}catch{return null;}}}
function compareVersion(local,remote){if(!local||!remote)return 'unknown';return local<remote?'update':'current';}
async function check(values,libraries,managedRoot,fetcher){
 const items=await details(values,fetcher);for(const item of items){if(item.error)continue;const sources=[];for(const root of [...new Set([...libraries,managedRoot])]){const updated=await installedTime(root,item.id);if(updated)sources.push({root,updated,status:compareVersion(updated,item.updated)});}item.sources=sources;item.status=sources.length?(sources.some(s=>s.status==='current')?'current':'update'):'unknown';item.managed=sources.find(s=>s.root===managedRoot)?.status||'unknown';}return items;
}
async function collection(value,fetcher=fetch){
 const id=workshopId(value),root=(await details([id],fetcher))[0];if(root.error)throw Error(root.error);if(root.type!==null&&root.type!==2)throw Error('此链接是模组条目，请填写 Steam 合集链接');
 const visited=new Set(),items=[],warnings=[];let collections=0;
 async function visit(item,depth){if(visited.has(item.id))return;visited.add(item.id);if(visited.size>550||depth>8)throw Error('合集过大或嵌套超过 8 层，最多合并 500 个模组条目');if(item.error){warnings.push(item.id+'：'+item.error);return;}if(item.type!==2){items.push(item);if(items.length>500)throw Error('最多合并 500 个模组条目');return;}if(++collections>50)throw Error('嵌套合集数量超过 50 个');
  const body=new URLSearchParams({collectioncount:'1','publishedfileids[0]':item.id}),r=await fetcher('https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/',{method:'POST',body,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('合集读取失败：HTTP '+r.status);const data=await r.json(),entry=data.response?.collectiondetails?.find(x=>String(x.publishedfileid)===item.id);if(entry?.result!==1||!Array.isArray(entry.children))throw Error('无法展开合集 '+item.id+'，请填写公开可访问的 Steam 合集链接');
  const ids=[...new Set(entry.children.slice().sort((a,b)=>(Number(a.sortorder)||0)-(Number(b.sortorder)||0)).map(c=>workshopId(c.publishedfileid)))];if(ids.length>550)throw Error('合集过大');const children=[];for(let i=0;i<ids.length;i+=100)children.push(...await details(ids.slice(i,i+100),fetcher));for(const child of children){if(child.type===null)child.type=Number(entry.children.find(c=>String(c.publishedfileid)===child.id)?.filetype)||0;await visit(child,depth+1);}
 }
 await visit({...root,type:2},0);return {id,title:root.title,items,warnings,collections};
}
module.exports={workshopId,details,installedTime,compareVersion,check,collection};
