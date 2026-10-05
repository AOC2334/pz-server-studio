const {test}=require('node:test'),assert=require('node:assert/strict'),dgram=require('node:dgram');
const {once}=require('node:events'),{createRelay}=require('../lib/udp-relay');
test('IPv6 relay sends IPv4 replies to the correct independent client',async()=>{
 const backend=dgram.createSocket('udp4');backend.bind(0,'127.0.0.1');await once(backend,'listening');backend.on('message',(data,r)=>backend.send(data,r.port,r.address));
 const relay=createRelay({listenHost:'::1',listenPort:0,listenType:'udp6',targetHost:'127.0.0.1',targetPort:backend.address().port,targetType:'udp4'});await once(relay,'listening');
 const clients=[dgram.createSocket('udp6'),dgram.createSocket('udp6')];try{await Promise.all(clients.map(async(c,i)=>{const received=once(c,'message',{signal:AbortSignal.timeout(3000)});c.send(Buffer.from('player'+i),relay.address().port,'::1');assert.equal((await received)[0].toString(),'player'+i);}));}finally{for(const c of clients)c.close();relay.close();backend.close();}
});
