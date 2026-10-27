const {start,server,desktopState}=require('../server');
process.parentPort.on('message',async({data})=>{
  if(data==='state')process.parentPort.postMessage({type:'state',...desktopState()});
  if(data==='shutdown'&&!desktopState().busy){server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
});
server.on('error',e=>{process.parentPort.postMessage({type:'error',message:e.message});process.exit(1);});
start({host:'127.0.0.1',port:0}).then(url=>process.parentPort.postMessage({type:'ready',url}));
