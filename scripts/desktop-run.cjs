const path=require('node:path'),{spawnSync}=require('node:child_process');
require('../lib/web-proxy').configureProxy();
if(process.env.HTTPS_PROXY||process.env.HTTP_PROXY){process.env.ELECTRON_GET_USE_PROXY='1';process.env.GLOBAL_AGENT_HTTP_PROXY=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;process.env.GLOBAL_AGENT_HTTPS_PROXY=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;}
const mode=process.argv[2]||'start';
const command=mode==='install'?path.join(__dirname,'../node_modules/electron/install.js'):mode==='start'?path.join(__dirname,'../node_modules/electron/cli.js'):path.join(__dirname,'../node_modules/electron-builder/cli.js');
const args=mode==='install'?[]:mode==='start'?['.']:mode==='pack'?['--win','--dir']:['--win','portable'];
if((mode==='pack'||mode==='dist')&&!require('node:fs').existsSync(path.join(__dirname,'../node_modules/electron/dist/electron.exe'))){const setup=spawnSync(process.execPath,['--use-env-proxy',path.join(__dirname,'../node_modules/electron/install.js')],{env:process.env,stdio:'inherit',windowsHide:true});if(setup.status!==0)process.exit(setup.status||1);}
const r=spawnSync(process.execPath,['--use-env-proxy',command,...args],{cwd:path.resolve(__dirname,'..'),env:process.env,stdio:'inherit',windowsHide:mode!=='start'});if(r.error)console.error(r.error.message);process.exitCode=r.status??1;
