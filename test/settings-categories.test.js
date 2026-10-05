const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const categories=vm.runInNewContext(fs.readFileSync(require.resolve('../public/settings-categories.js'),'utf8')+';SettingsCategories');
test('game categories retain core INI and sandbox mappings without duplicate controls',()=>{
 assert.equal(categories.INI.length,22);assert.equal(categories.Sandbox.length,9);
 const find=(kind,key)=>categories[kind].find(g=>g.keys.includes(key))?.label;
 assert.equal(find('INI','MaxPlayers'),'玩家设置');assert.equal(find('INI','PublicName'),'服务器信息');assert.equal(find('INI','SafehouseAllowTrepass'),'安全屋设置');
 assert.equal(find('Sandbox','DayLength'),'日期时间');assert.equal(find('Sandbox','ZombieLore.Speed'),'僵尸');assert.equal(find('Sandbox','CarSpawnRate'),'汽车');
 for(const kind of ['INI','Sandbox']){const keys=categories[kind].flatMap(g=>g.keys);assert.equal(new Set(keys).size,keys.length,kind+' keys must have only one category');}
});
