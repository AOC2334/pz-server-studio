const fs=require('node:fs'),path=require('node:path');
const install=process.argv[2]||'C:/Program Files (x86)/Steam/steamapps/common/Project Zomboid Dedicated Server';
const lua=fs.readFileSync(path.join(install,'media/lua/client/OptionScreens/ServerSettingsScreen.lua'),'utf8');
const dict=Object.assign({},...['UI','Sandbox'].map(name=>JSON.parse(fs.readFileSync(path.join(install,'media/lua/shared/Translate/CN',name+'.json'),'utf8'))));
const groups={INI:[],Sandbox:[]};let kind,group;
for(const line of lua.slice(lua.indexOf('SettingsTable = {'),lua.indexOf('for _,page in ipairs(SettingsTable[1].pages)')).split(/\r?\n/)){
 const section=line.match(/^\t\tname = "(INI|Sandbox)"/);if(section){kind=section[1];continue;}
 const heading=line.match(/^\t{4}name = "([^"]+)"/);if(heading&&kind){const id=heading[1];group={id,label:dict[(kind==='INI'?'UI_ServerSettingGroup_':'Sandbox_')+id]||id,keys:[]};groups[kind].push(group);continue;}
 const option=line.match(/^\t{5}\{ name = "([^"]+)"/);if(option&&group)group.keys.push(option[1]);
}
for(const [id,key]of [['Map','Map'],['Mods','Mods'],['SteamWorkshop','WorkshopItems']])groups.INI.find(g=>g.id===id)?.keys.push(key);
fs.writeFileSync(path.join(__dirname,'../public/settings-categories.js'),'// Categories extracted from Project Zomboid 42.21 ServerSettingsScreen.lua.\nconst SettingsCategories = '+JSON.stringify(groups,null,2)+';\n');
console.log(groups.INI.length+' INI categories, '+groups.Sandbox.length+' sandbox categories');
