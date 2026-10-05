const dgram=require('node:dgram');
// Each remote endpoint owns an upstream socket, keeping player replies separate.
function createRelay({listenHost,listenPort,listenType,targetHost,targetPort,targetType,maxPeers=256,idleMs=60000}){
 const socket=dgram.createSocket({type:listenType,ipv6Only:listenType==='udp6'}),peers=new Map();
 const cleanup=setInterval(()=>{for(const [key,p] of peers)if(Date.now()-p.used>idleMs){p.socket.close();peers.delete(key);}},Math.min(idleMs,10000));cleanup.unref();
 socket.on('message',(data,remote)=>{const key=remote.address+'%'+remote.port;let p=peers.get(key);if(!p){if(peers.size>=maxPeers)return;p={socket:dgram.createSocket(targetType),used:Date.now(),pending:[]};peers.set(key,p);p.socket.on('error',()=>{if(peers.get(key)===p)peers.delete(key);p.socket.close();});p.socket.on('message',reply=>{p.used=Date.now();socket.send(reply,remote.port,remote.address,()=>{});});p.socket.connect(targetPort,targetHost,()=>{p.ready=true;for(const packet of p.pending)p.socket.send(packet,()=>{});p.pending=[];});}p.used=Date.now();if(p.ready)p.socket.send(data,()=>{});else if(p.pending.length<16)p.pending.push(data);});
 socket.on('close',()=>{clearInterval(cleanup);for(const p of peers.values())p.socket.close();peers.clear();});
 socket.bind(listenPort,listenHost);return socket;
}
module.exports={createRelay};
