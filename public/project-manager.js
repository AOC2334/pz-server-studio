async function refreshProjects(preferred=$('profile').value){
 projectCatalog=await api('projects');scan.profiles=projectCatalog.profiles.map(p=>p.name);$('config-root').textContent='配置目录：'+projectCatalog.root;
 $('profile').replaceChildren(...projectCatalog.profiles.map(p=>{const option=el('option',p.name+(p.legacyBackup?'（旧备份副本）':'')+(p.project?' · 有工作台进度':''));option.value=p.name;return option;}));
 const legacy=el('option','旧版 data/project.json 进度');legacy.value='__legacy_project__';$('profile').append(legacy);if([...$('profile').options].some(o=>o.value===preferred))$('profile').value=preferred;
 $('trash-record').replaceChildren(...projectCatalog.trash.map(p=>{const option=el('option',p.name+' · '+new Date(p.deletedAt).toLocaleString());option.value=p.id;return option;}));$('restore-profile').disabled=!projectCatalog.trash.length;$('saved-project').replaceChildren(...projectCatalog.profiles.filter(p=>p.project).map(p=>{const o=el('option',p.name);o.value=p.name;return o;}));const old=el('option','旧版 data/project.json 进度');old.value='__legacy_project__';$('saved-project').append(old);if([...$('saved-project').options].some(o=>o.value===preferred))$('saved-project').value=preferred;renderProjectList();
}
function copyProjectName(source,names){const used=new Set(names.map(n=>n.toLowerCase()));for(let i=1;;i++){const suffix='_copy'+(i===1?'':'_'+i),candidate=source.slice(0,64-suffix.length)+suffix;if(!used.has(candidate.toLowerCase()))return candidate;}}
function confirmProjectDelete(name){return new Promise(resolve=>{
 const dialog=el('dialog',undefined,'project-delete-dialog');dialog.setAttribute('aria-label','确认删除配置');dialog.append(el('h3','确认删除配置？'),el('p',name),el('p','配套配置文件将一并删除。删除后可从回收区恢复。','muted'));
 const buttons=el('div',undefined,'row'),cancel=el('button','取消'),remove=el('button','确认删除');remove.className='delete-confirm';cancel.onclick=()=>dialog.close('cancel');remove.onclick=()=>dialog.close('delete');buttons.append(cancel,remove);dialog.append(buttons);dialog.onclose=()=>{const confirmed=dialog.returnValue==='delete';dialog.remove();resolve(confirmed);};document.body.append(dialog);dialog.showModal();cancel.focus();
 });}
function renderProjectList(){
 renderProjectPicker();
 const list=$('profile-list');list.replaceChildren();if(!projectCatalog?.profiles.length){list.append(el('p','未找到配置文件，可在上方新建配置。','muted'));return;}
 for(const profile of projectCatalog.profiles){
  const name=profile.name,row=el('div',undefined,'profile-row');row.setAttribute('role','listitem');row.tabIndex=0;row.dataset.name=name;
  const label=el('span',name,'profile-label');label.title=name;const actions=el('div',undefined,'profile-actions');row.append(label,actions);
  function button(text,fn){const b=el('button',text);b.setAttribute('aria-label',text+' '+name);b.onclick=guard(async()=>{b.disabled=true;try{await fn();}finally{b.disabled=false;}});actions.append(b);return b;}
  button('加载配置',async()=>{$('profile').value=name;await $('import').onclick();renderProjectList();});
  button('复制',async()=>{const newName=copyProjectName(name,projectCatalog.profiles.map(p=>p.name));await api('project/manage',{action:'copy',name,newName});await refreshProjects(newName);notice('已复制为 '+newName);});
  button('重命名',async()=>{
   row.classList.add('editing');const input=el('input');input.value=name;input.setAttribute('aria-label','重命名 '+name);label.replaceWith(input);actions.replaceChildren();
   let saving=false;const cancel=()=>renderProjectList();const commit=guard(async()=>{if(saving)return;const newName=input.value.trim();if(newName===name){cancel();return;}saving=true;try{await api('project/manage',{action:'rename',name,newName});if(!activePackageId&&$('name').value===name){$('name').value=$('project-name').value=newName;for(const suffix of ['_spawnregions.lua','_spawnpoints.lua'])files[suffix]=(files[suffix]||'').replaceAll(name+'_spawnpoints.lua',newName+'_spawnpoints.lua');sync();}await refreshProjects(newName);notice('已重命名为 '+newName);}finally{saving=false;}});
   button('保存名称',commit);button('取消',cancel);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit();}else if(e.key==='Escape'){e.preventDefault();cancel();}};input.focus();input.select();
  });
  button('删除',async()=>{if(!await confirmProjectDelete(name))return;await api('project/manage',{action:'trash',name});await refreshProjects();notice('已删除 '+name+'，可从回收区恢复。');});
  list.append(row);
 }
}
function showProfileDetails(){renderProjectList();}
async function restoreProject(p){
 if(window.EditorState&&!await EditorState.confirmSwitch())return false;window.EditorState?.setLoading(true);try{
 editGeneration++;if(window.WorkshopUI)WorkshopUI.restoreCollection(null);
 $('paths').value=p.paths||'';if(p.packagePaths)await api('packages/scan',{paths:p.packagePaths});await scanNow();activePackageId=p.packageId||null;loadedProjectName=p.name;const packageInfo=serverPackages?.packages.find(x=>x.id===activePackageId);p=ConfigModel.restore(p,scan.mods,p.targetVersion||scan.installs.find(i=>i.path===p.install)?.gameVersion||targetGameVersion(),packageInfo?.modsRoot||'');selected=p.selected;selectedMetadata.clear();for(const m of p.selectedMetadata)selectedMetadata.set(m.key,m);settings=p.settings;files=p.files;sandboxInitialized=true;$('name').value=$('project-name').value=p.name;$('heap').value=p.heap||'4';
 if(p.install&&![...$('install').options].some(o=>o.value===p.install)){const o=el('option','已保存运行环境（当前未找到）：'+p.install);o.value=p.install;$('install').append(o);}$('install').value=p.install||$('install').value;$('target-version').value=p.targetVersion||'';
 variantChoices.clear();for(const pair of p.ui?.variantChoices||[])variantChoices.set(...pair);editorDrafts.clear();for(const pair of p.ui?.editorDrafts||[])editorDrafts.set(...pair);
 updateEditTarget();$('file').value=p.ui?.editorFile||'.ini';$('mod-sort').value=p.ui?.modSort||'default';$('search').value=p.ui?.modSearch||'';$('filter').value=p.ui?.modFilter||'all';$('category').value=p.ui?.modCategory||'';
 $('setting-search').value=$('sandbox-search').value=p.ui?.settingSearch||'';settingsCategory=p.ui?.settingsCategory||'INI:Details';if(p.missing.length)notice('配置已恢复，但缺少模组：'+p.missing.join('、'),true);renderMods();renderSettings();if(projectCatalog.profiles.some(x=>x.name===p.name))$('profile').value=p.name;showProfileDetails();if(window.WorkshopUI)WorkshopUI.restoreCollection(p.ui?.collectionMerge);window.EditorState?.markSaved();return true;}finally{window.EditorState?.setLoading(false);}
}
if(typeof module!=='undefined')module.exports={copyProjectName};
function bindProjectManager(){
 $('profile').onchange=showProfileDetails;
 $('restore-progress').onclick=()=>{$('profile').value=$('saved-project').value;return $('load').onclick();};
 $('restore-profile').onclick=guard(async()=>{const result=await api('project/manage',{action:'restore',id:$('trash-record').value,newName:$('restore-name').value.trim()||undefined});await refreshProjects(result.name);notice('配置已恢复。');});
 let creating=false;
 function creationMode(on){creating=on;$('project-picker').classList.toggle('hidden',on);$('project-name').classList.toggle('hidden',!on);$('cancel-new-project').classList.toggle('hidden',!on);$('new-project').textContent=on?'创建':'新建';if(on){$('project-name').disabled=false;$('project-name').value='';$('project-name').focus();}else{$('project-name').value=$('name').value;updateEditTarget();}}
 $('cancel-new-project').onclick=()=>creationMode(false);
 $('project-name').oninput=()=>{};
 $('project-name').onkeydown=e=>{if(creating&&e.key==='Enter'){e.preventDefault();$('new-project').click();}else if(e.key==='Escape')creationMode(false);};
 $('project-picker').onchange=guard(async()=>{const value=$('project-picker').value;if(value.startsWith('package:')){const p=await api('packages/load',{id:value.slice(8),paths:$('paths').value.split('\n').map(x=>x.trim()).filter(Boolean)});await restoreProject(p);}else if(value.startsWith('profile:')){$('profile').value=value.slice(8);await $('import').onclick();}renderProjectPicker();});
 $('new-project').onclick=guard(async()=>{if(!creating){creationMode(true);return;}const name=$('project-name').value.trim();if(!/^[\w-]{1,64}$/.test(name))throw Error('名称须为 1–64 位字母、数字、下划线或连字符');if(projectCatalog.profiles.some(p=>p.name.toLowerCase()===name.toLowerCase())||(serverPackages?.packages||[]).some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('名称已存在，请使用其他名称');$('new-project').disabled=true;try{const restored=await restoreProject({name,heap:'4',install:$('install').value,paths:$('paths').value,selected:[],settings:{PublicName:'My Zomboid Server',MaxPlayers:'16',DefaultPort:'16261',UDPPort:'16262',PVP:'false',PauseEmpty:'true',Open:'true',Public:'false',Password:'',Map:'Muldraugh, KY'},files:{'.ini':'','_SandboxVars.lua':sandboxSource()?.sandbox.defaultLua||'SandboxVars = { VERSION = 5 }','_spawnregions.lua':'','_spawnpoints.lua':''}});if(!restored)return;window.EditorState?.markSaved('');if(!await saveCurrentProject())return;creationMode(false);renderProjectPicker();notice('已使用默认配置创建并保存 '+name+'，可继续配置并构建服务器包。');}finally{$('new-project').disabled=false;}});
}

function renderProjectPicker(){
 const picker=$('project-picker');if(!picker)return;picker.replaceChildren();
 const placeholder=el('option','请选择本机配置');placeholder.value='';picker.append(placeholder);
 for(const [label,items,prefix] of [['本机配置',projectCatalog?.profiles||[],'profile:']]){if(!items.length)continue;const group=el('optgroup');group.label=label;for(const item of items){const option=el('option',item.name);option.value=prefix+(item.id||item.name);option.title=item.root||item.name;group.append(option);}picker.append(group);}
 const value=activePackageId?'package:'+activePackageId:'profile:'+$('name').value;if([...picker.options].some(o=>o.value===value))picker.value=value;else picker.value='';
}
