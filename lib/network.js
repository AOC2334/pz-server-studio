const os=require('node:os');
const ALLOWED_DOMAINS=['aoc-applepie.work'];
function localAddresses(interfaces=os.networkInterfaces()){
 return [...new Set(Object.values(interfaces).flat().filter(entry=>entry&&['IPv4','IPv6'].includes(entry.family)&&!entry.internal).map(entry=>entry.address.split('%')[0]))];
}
function accessUrl(address,port){return `http://${address.includes(':')?'['+address+']':address}:${port}`;}
function validHost(host,port,interfaces=os.networkInterfaces(),hostname=os.hostname()){
 if(typeof host!=='string'||/[\s/@?#\\]/.test(host))return false;
 try{const requested=new URL('http://'+host);if(requested.port!==String(port))return false;
 const names=['127.0.0.1','::1','localhost',hostname,...ALLOWED_DOMAINS,...localAddresses(interfaces)];
 return names.some(name=>new URL(accessUrl(name,port)).hostname===requested.hostname);
 }catch{return false;}
}
module.exports={localAddresses,validHost,accessUrl};
