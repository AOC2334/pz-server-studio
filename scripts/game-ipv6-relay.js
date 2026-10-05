const {createRelay}=require('../lib/udp-relay');
const config=require('../config/game-ipv6.json');
const client=process.argv.includes('--client');
const sockets=config.ports.map(port=>createRelay(client?{listenHost:'127.0.0.1',listenPort:port,listenType:'udp4',targetHost:config.domain,targetPort:port,targetType:'udp6'}:{listenHost:'::',listenPort:port,listenType:'udp6',targetHost:'127.0.0.1',targetPort:port,targetType:'udp4'}));
for(const socket of sockets){socket.on('listening',()=>console.log(`${client?'玩家本地入口':'服务器 IPv6 入口'} ${JSON.stringify(socket.address())}`));socket.on('error',e=>{console.error(e.message);process.exitCode=1;for(const s of sockets)try{s.close();}catch{}});}
process.on('SIGINT',()=>{for(const socket of sockets)socket.close();});
