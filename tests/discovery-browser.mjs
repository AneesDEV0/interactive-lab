import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {activities,activityPages} from '../src/shared/catalog.js';

const base=process.env.LAB_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});page.on('request',r=>requests.push(r.url()));
const open=async path=>{await page.goto(`${base}/${path}`);await page.waitForFunction(()=>window.lab);await page.evaluate(()=>document.fonts.ready);};
try{
 await open('index.html');await expect(page.locator('.activity-card')).toHaveCount(10);
 for(const activity of activities){
  requests.length=0;await open(`${activity.id}-discover.html`);
  await expect(page.locator('#answer-controls,[data-mode]')).toHaveCount(0);
  await expect(page.locator('#scene canvas')).toHaveCount(1);
  assert.equal(await page.evaluate(id=>Object.keys(lab.progress.completed[id]||{}).length,activity.id),0);
  await expect(page.locator('#previous-card')).toBeDisabled();
  await page.locator('#read-next').click();
  assert.equal(await page.evaluate(()=>lab.state.id),activity.items[1].id);
  await page.locator('#previous-card').click();await expect(page.locator('#read-status')).toContainText('قرأت');
  await page.locator('#read-next').click();
  for(let i=1;i<activity.items.length;i++)await page.locator('#read-next').click();
  await expect(page.locator('#reading-complete')).toBeVisible();
  assert.equal(await page.evaluate(id=>Object.keys(lab.discovery.completed[id]).length,activity.id),activity.items.length);
  assert.equal(await page.evaluate(id=>Object.keys(lab.progress.completed[id]||{}).length,activity.id),0);
  await page.reload();await page.waitForFunction(()=>window.lab);
  assert.equal(await page.evaluate(id=>Object.keys(lab.discovery.completed[id]).length,activity.id),activity.items.length);
  await page.locator('[data-open=library]').click();await page.locator(`#library-grid [data-item="${activity.items[1].id}"]`).click();
  await expect(page.locator('#experiment-link')).toHaveAttribute('href',`${activity.id}.html?item=${activity.items[1].id}`);
  await page.locator('#experiment-link').click();await page.waitForFunction(()=>window.lab);
  assert.equal(await page.evaluate(()=>lab.state.mode),'play');assert.equal(await page.evaluate(()=>lab.state.id),activity.items[1].id);
  await expect(page.locator('[data-mode],#learn-panel')).toHaveCount(0);
  await page.locator('#discovery-link').click();await page.waitForFunction(()=>window.lab);
  assert.equal(await page.evaluate(()=>lab.state.id),activity.items[1].id);
  await open(`${activity.id}.html?mode=learn&device=${activity.items[1].id}`);
  await expect(page).toHaveURL(new RegExp(`${activity.id}-discover.html\\?item=${activity.items[1].id}$`));
  console.log(`${activity.id}: reading completion, reload, independent progress, paired navigation and old bookmarks pass`);
 }
 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const entry of ['index.html',...activityPages.filter(p=>p.kind==='discover').map(p=>p.href)]){
   await open(entry);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${entry} overflows at ${width}`);
   const small=await page.locator('button').evaluateAll(buttons=>buttons.filter(b=>b.getClientRects().length&&b.getBoundingClientRect().height<44).map(b=>b.textContent));assert.deepEqual(small,[]);
   if(process.env.LAB_ARTIFACTS&&width===390){await mkdir(process.env.LAB_ARTIFACTS,{recursive:true});await page.screenshot({path:`${process.env.LAB_ARTIFACTS}/${entry}-mobile.png`,fullPage:true});}
  }
 }
 await open('materials.html');await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>page.evaluate(()=>lab.scene.reduced)).toBe(true);
 await page.locator('[data-choice=plastic]').click();await expect(page.locator('.sorted-item')).toBeVisible();
 assert.equal(await page.locator('#feedback').evaluate(el=>getComputedStyle(el).animationName),'none');
 await open('about.html');await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();assert.equal(await page.evaluate(()=>localStorage.getItem('sharara-discovery-progress-v1')),null);
 await open('materials-discover.html');await page.evaluate(()=>localStorage.setItem('sharara-discovery-progress-v1','{bad'));await page.reload();await page.waitForFunction(()=>window.lab);await expect(page.locator('#discovery-fact')).not.toBeEmpty();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('Mobile/tablet layouts, live reduced-motion preference, reset, corrupt-storage recovery: pass; no browser or HTTP errors.');
}finally{await browser.close();}
