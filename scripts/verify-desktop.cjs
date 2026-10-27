const root=require('node:path').resolve(__dirname,'..');
const {_electron}=require(root+'/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const packaged=require('node:fs').existsSync(root+'/release/win-unpacked/PZ Server Studio.exe');
 const app=await _electron.launch({executablePath:packaged?root+'/release/win-unpacked/PZ Server Studio.exe':root+'/node_modules/electron/dist/electron.exe',args:packaged?[]:[root],timeout:60000});let page;
 try{
  page=await app.firstWindow({timeout:45000});await page.waitForSelector('#home',{timeout:45000});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(()=>{localStorage.setItem('pz-studio-onboarded','1');document.getElementById('onboarding').close();});
  await page.waitForTimeout(2000);await page.evaluate(()=>document.getElementById('onboarding').close());
  await fs.mkdir(root+'/release/preview',{recursive:true});
  await page.screenshot({path:root+'/release/preview/home.png'});
  for(const tab of ['sources','mods','settings','export','servers','activity','home']){
   await page.locator('nav [data-tab="'+tab+'"]').click();await page.waitForTimeout(150);
   assert.equal(await page.locator('#'+tab).isVisible(),true,'tab '+tab);
   assert.equal(await page.locator('section.panel:not(.hidden)').count(),1);
  }
  await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.screenshot({path:root+'/release/preview/home-dark.png'});await page.locator('#theme-toggle').click();
  await page.locator('nav [data-tab="mods"]').click();await page.screenshot({path:root+'/release/preview/mods.png'});
  await page.locator('nav [data-tab="activity"]').click();await page.screenshot({path:root+'/release/preview/logs.png'});
  await page.locator('#help-tour').click();assert.equal(await page.locator('#onboarding').isVisible(),true);
  await page.locator('#tour-next').click();assert.equal(await page.locator('#sources').isVisible(),true);await page.locator('#tour-close').click();
  await page.locator('nav [data-tab="home"]').click();
  assert.equal(await page.evaluate(()=>!!window.desktop),true);
  await page.evaluate(()=>window.desktop.minimize());
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].restore());
  assert.deepEqual(errors,[]);
  console.log('PASS: native desktop boot; isolated preload; 7 navigation pages; theme; onboarding; native window; screenshots.');
  console.log('Preview: '+root+'/release/preview/home.png');
 }finally{
  // No server, downloads or builds are started by this UI check. Confirm the regular idle exit.
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});});
  await page?.evaluate(()=>window.desktop.close());
  await app.close().catch(()=>{});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
