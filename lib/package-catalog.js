const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),packages=require('./packages');
function createCatalog(root,{legacyRoots}={}){
 const file=path.join(root,'data/package-roots.json');let queue=Promise.resolve();
 const legacy=legacyRoots||[...new Set([path.dirname(root),path.join(os.homedir(),'Desktop/work')])].flatMap(base=>['ProjectZomboid','僵毁'].map(name=>path.join(base,name,'output')));
 async function scan(additions=[]){if(!Array.isArray(additions)||additions.some(p=>typeof p!=='string'||!p.trim()))throw Error('服务器包路径无效');let saved=[];try{saved=JSON.parse(await fs.readFile(file,'utf8'));if(!Array.isArray(saved)||saved.some(p=>typeof p!=='string'))throw Error('路径记录格式无效');}catch(e){if(e.code!=='ENOENT')throw Error('无法读取服务器包路径记录：'+e.message);}
 const extras=[...new Map([...saved,...additions].map(p=>[path.resolve(p).toLowerCase(),path.resolve(p)])).values()];if(extras.length>20)throw Error('补充服务器包路径最多 20 个');
 const available=[];for(const dir of legacy){try{if((await fs.stat(dir)).isDirectory())available.push(dir);}catch(e){if(e.code!=='ENOENT')throw e;}}
 const roots=[...new Map([...extras,...available].map(p=>[path.resolve(p).toLowerCase(),p])).values()];const result=await packages.list(path.join(root,'output'),roots);
 if(additions.length){await fs.mkdir(path.dirname(file),{recursive:true});const temporary=file+'.tmp';try{await fs.writeFile(temporary,JSON.stringify(extras,null,2));await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true});}}
 return {...result,extra:extras,roots:[path.join(root,'output'),...roots]};
 }
 return {scan(additions){const result=queue.then(()=>scan(additions));queue=result.catch(()=>{});return result;}};
}
module.exports={createCatalog};
