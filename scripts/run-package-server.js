const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{javaArguments}=require('../lib/smoke');
const output=path.resolve(process.argv[2]),manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8')),runtime=path.join(output,'runtime');
const launcher=manifest.install.launcher||'StartServer64.bat',args=javaArguments(fs.readFileSync(path.join(runtime,launcher),'utf8'));
args.push('-statistic','0','-cachedir='+path.join(output,'Zomboid'),'-servername',manifest.configName,'-modfolders','mods');
const child=spawn(path.join(runtime,'jre64/bin/java.exe'),args,{cwd:runtime,windowsHide:true,stdio:['pipe','inherit','inherit']});
console.log('Server PID: '+child.pid);child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>{console.log('Server exited: '+code);process.exitCode=code||0;});
process.on('SIGINT',()=>child.stdin.write('quit\n'));process.on('SIGTERM',()=>child.stdin.write('quit\n'));
