const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
  version:()=>ipcRenderer.invoke('desktop:version'),
  minimize:()=>ipcRenderer.send('desktop:minimize'),
  maximize:()=>ipcRenderer.send('desktop:maximize'),
  close:()=>ipcRenderer.send('desktop:close'),
  chooseDirectory:()=>ipcRenderer.invoke('desktop:directory'),
  showData:()=>ipcRenderer.invoke('desktop:data'),
  exportText:(text)=>ipcRenderer.invoke('desktop:export',String(text).slice(0,2000000))
}));
