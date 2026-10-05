const {test}=require('node:test'),assert=require('node:assert/strict');const {copyProjectName}=require('../public/project-manager');
test('configuration copies get unique case-insensitive names within game name limit',()=>{
 assert.equal(copyProjectName('kkdy',['kkdy']),'kkdy_copy');assert.equal(copyProjectName('kkdy',['KKDY_COPY','kkdy_copy_2']),'kkdy_copy_3');
 const original='a'.repeat(64),first=copyProjectName(original,[]);assert.equal(first.length,64);const next=copyProjectName(original,[first]);assert.equal(next.length,64);assert.notEqual(next,first);
});
