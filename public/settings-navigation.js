let settingsCategory='INI:Details';
function settingGroup(kind,key){return SettingsCategories[kind].find(g=>g.keys.includes(key));}
function refreshSettingsNavigation(){
 const groups=[...document.querySelectorAll('#all-settings .setting-category,#lua-fields .sandbox-group')];
 const nav=$('settings-nav');nav.replaceChildren();
 for(const kind of ['INI','Sandbox','模组沙盒']){
  const matching=groups.filter(g=>g.dataset.kind===kind);if(!matching.length)continue;
  if(kind==='Sandbox')matching.sort((a,b)=>{const rank=g=>{const i=SettingsCategories.Sandbox.findIndex(c=>g.dataset.title==='原版 · '+c.label);return i<0?999:i;};return rank(a)-rank(b);});
  const section=el('details',undefined,'settings-nav-section');section.open=true;section.append(el('summary',kind));
  for(const group of matching){const button=el('button',group.dataset.title+(group.querySelectorAll('label').length?' · '+group.querySelectorAll('label').length:''));button.classList.toggle('active',settingsCategory===group.dataset.category);button.setAttribute('aria-pressed',String(settingsCategory===group.dataset.category));button.onclick=()=>{settingsCategory=group.dataset.category;$('setting-search').value=$('sandbox-search').value='';renderAll();renderLua();};section.append(button);}nav.append(section);
 }
 const editorButton=el('button','原文文件编辑器');editorButton.classList.toggle('active',settingsCategory==='editor');editorButton.onclick=()=>{settingsCategory='editor';$('setting-search').value=$('sandbox-search').value='';refreshSettingsNavigation();};nav.append(editorButton);
 const searching=!!$('setting-search').value.trim()||!!$('sandbox-search').value.trim();
 document.querySelector('#settings .settings-content').classList.toggle('searching',searching);
 if(!searching&&settingsCategory!=='editor'&&!groups.some(g=>g.dataset.category===settingsCategory)&&groups.length)settingsCategory=groups[0].dataset.category;
 for(const group of groups)group.classList.toggle('hidden',!searching&&group.dataset.category!==settingsCategory);
 $('settings-editor').classList.toggle('hidden',searching||settingsCategory!=='editor');
 $('sandbox-tools').classList.toggle('hidden',!groups.some(g=>g.dataset.kind!=='INI'&&!g.classList.contains('hidden')));
 $('settings-category-title').textContent=searching?'搜索结果':settingsCategory==='editor'?'原文文件编辑器':groups.find(g=>g.dataset.category===settingsCategory)?.dataset.title||'服务器设置';
 $('settings-empty').classList.toggle('hidden',!searching||groups.length>0);
}
