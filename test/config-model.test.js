const test=require('node:test'),assert=require('node:assert/strict'),{restore}=require('../public/config-model');
test('restores moved mod paths by Workshop identity, engine version and preserves missing IDs/order',()=>{
 const mods=[{key:'other',id:'A',workshopId:'2',path:'D:/other/A/42'},{key:'correct',id:'A',workshopId:'1',path:'D:/new/A/42'},{key:'b',id:'B',path:'D:/new/B/42'}];
 const config={selected:['old-a','old-b'],selectedMetadata:[{key:'old-a',id:'A',workshopId:'1'},{key:'old-b',id:'B'}],settings:{Mods:'B;A;Missing'}};const p=restore(config,mods,'42.21');assert.deepEqual(p.selected,['b','correct','missing:Missing']);assert.deepEqual(p.missing,['Missing']);assert.equal(p.selectedMetadata[2].id,'Missing');assert.deepEqual(restore(config,mods,'42.21','D:/package/mods').missing,['B','A','Missing']);
});
