const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('session recovery rebuilds server discovery without replacing unsaved frontend state',async()=>{
 const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8'),meta={content:'old'},scan={mods:['unsaved']},calls=[];
 const context={scan,serverPackages:{extra:['D:/package']},document:{querySelector:()=>meta},DOMParser:class{parseFromString(){return {querySelector:()=>({content:'new'})};}},$:()=>({value:'D:/Steam'}),fetch:async(url,options)=>{calls.push(url);if(url==='/')return {text:async()=>'<meta>'};if(options.headers['X-PZ-Token']==='old')return {status:403,ok:false,json:async()=>({error:'请从本地应用界面访问'})};return {status:200,ok:true,json:async()=>({ok:true})};}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('let sessionRecovery='),source.indexOf('\nfunction notice')),context);const result=await context.api('save',{settings:{PublicName:'unsaved'}});assert.equal(result.ok,true);assert.equal(context.scan,scan);assert.equal(meta.content,'new');assert.deepEqual(calls,['/api/save','/','/api/packages/scan','/api/scan','/api/save']);
});
