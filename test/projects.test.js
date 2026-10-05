const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');const projects=require('../lib/projects'),{patchIni}=require('../lib/core');
test('projects roundtrip all progress, backup overwrites, copy, rename and recycle safely',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pz-projects-'));try{
 const config={name:'test',selected:['b','a'],selectedMetadata:[{key:'b',id:'B',workshopId:'123'}],settings:{Mods:'B;A',PublicName:'demo'},files:{'.ini':'# keep\nMods=\n','_SandboxVars.lua':'SandboxVars={X=3}', '_spawnregions.lua':'return {serverfile="test_spawnpoints.lua"}', '_spawnpoints.lua':'return {}'},heap:'8',install:'D:/server',paths:'D:/Steam',ui:{variantChoices:[['Other','key']],modSort:'modified-new',editorDraft:'not applied',editorFile:'_SandboxVars.lua'}};
 await projects.save(root,config,patchIni);const restored=await projects.load(root,'test');assert.deepEqual(restored.selected,config.selected);assert.deepEqual(restored.selectedMetadata,config.selectedMetadata);assert.deepEqual(restored.ui,config.ui);assert.deepEqual(restored.files,config.files);assert.match(await fs.readFile(path.join(root,'test.ini'),'utf8'),/Mods=B;A/);
 await projects.save(root,{...config,heap:'10'},patchIni);assert.equal((await fs.readdir(path.join(root,'.pzstudio/backups'))).length,1);
 await projects.manage(root,'copy','test','copy');assert.equal((await projects.load(root,'copy')).name,'copy');assert.match(await fs.readFile(path.join(root,'copy_spawnregions.lua'),'utf8'),/copy_spawnpoints/);await assert.rejects(projects.manage(root,'copy','test','copy'),/同名/);
 await projects.manage(root,'rename','copy','renamed');assert.equal((await projects.list(root)).profiles.some(p=>p.name==='copy'),false);
 const deleted=await projects.manage(root,'trash','renamed');assert.equal((await projects.list(root)).trash.length,1);await projects.manage(root,'restore',null,'recovered',deleted.id);assert.equal((await projects.load(root,'recovered')).name,'recovered');assert.equal((await projects.list(root)).trash.length,0);
 await assert.rejects(projects.manage(root,'trash','../test'),/配置名称/);await assert.rejects(projects.manage(root,'restore',null,null,'../../x'),/无效/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
