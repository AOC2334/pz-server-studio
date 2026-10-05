const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),{spawn}=require('node:child_process');
function request(host,port,header){return new Promise((resolve,reject)=>{const req=http.get({hostname:host,port,path:'/',headers:header?{Host:header}:{},timeout:3000},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body}));});req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('Request timed out')));});}
test('real application entry listens on IPv4 and IPv6 and rejects unrelated Hosts',{timeout:12000},async()=>{
 const child=spawn(process.execPath,[path.join(__dirname,'../server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 const closed=new Promise(resolve=>child.once('close',resolve));let output='';
 try{const port=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server startup timeout: '+output)),5000);child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/PZ Server Studio http:\/\/127\.0\.0\.1:(\d+)/);if(match){clearTimeout(timer);resolve(Number(match[1]));}});child.stderr.on('data',chunk=>output+=chunk);child.once('error',err=>{clearTimeout(timer);reject(err);});child.once('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code+': '+output));});});
 for(const host of ['127.0.0.1','::1']){const res=await request(host,port);assert.equal(res.status,200);assert.match(res.body,/PZ Server Studio/);}
 assert.equal((await request('::1',port,'unrelated.example:'+port)).status,403);
 }finally{child.kill();await closed;}
});
