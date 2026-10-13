// Respect explicit environment settings; otherwise reuse Windows' existing HTTP proxy.
const {execFileSync}=require('node:child_process');
function configureProxy(){
 if(process.platform==='win32'&&!process.env.HTTPS_PROXY&&!process.env.HTTP_PROXY)try{
  const text=execFileSync('reg',['query','HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']});
  if(/ProxyEnable\s+REG_DWORD\s+0x1\b/.test(text)){const proxy=text.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/)?.[1].trim();const endpoint=proxy?.includes('=')?proxy.match(/(?:^|;)https?=([^;]+)/)?.[1]:proxy;if(endpoint)process.env.HTTPS_PROXY=/^https?:\/\//.test(endpoint)?endpoint:'http://'+endpoint;}
 }catch{}
 if((process.env.HTTPS_PROXY||process.env.HTTP_PROXY)&&process.env.NODE_USE_ENV_PROXY===undefined)process.env.NODE_USE_ENV_PROXY='1';
}
module.exports={configureProxy};
