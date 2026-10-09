import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {activities} from '../src/shared/catalog.js';
const base=process.env.LAB_URL||'http://127.0.0.1:4173';
const out='docs/implementation';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),errors=[],external=[],failed=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url());});
page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
async function ready(){await page.waitForFunction(()=>window.lab && (!document.body.dataset.activity||lab.scene?.ready||document.querySelector('.fallback-image')));await page.evaluate(()=>document.fonts.ready);}
async function open(path){await page.goto(`${base}/${path}`);await ready();}
try{
 await open('');await expect(page.locator('.activity-card')).toHaveCount(4);await expect(page.locator('.resume')).toHaveCount(0);await page.screenshot({path:`${out}/home-desktop.png`,fullPage:true});checks.push('Home: four direct activity links and no invented progress');
 await page.locator('.activity-card .start-link').first().click();await ready();
 await expect(page.locator('#submit-answer')).toBeDisabled();await expect(page.locator('[data-choice][aria-pressed=true]')).toHaveCount(0);await expect(page.locator('#sound-status')).toBeEmpty();
 await page.locator('[data-choice=mains]').click();await page.locator('#submit-answer').click();assert.equal(await page.evaluate(()=>lab.state.phase),'retry');assert.equal(await page.evaluate(()=>Object.keys(lab.progress.completed.electricity||{}).length),0);
 await page.locator('[data-choice=battery]').click();await page.locator('#submit-answer').click();await expect(page.locator('#feedback')).toContainText('تحرّكت');assert.equal(await page.evaluate(()=>lab.state.running),true);
 await page.evaluate(()=>{lab.submit();lab.submit();});assert.equal(await page.evaluate(()=>Object.keys(lab.progress.completed.electricity).length),1);assert.equal(await page.evaluate(()=>lab.progress.completed.electricity.car.assisted),true);
 await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>lab.state.id),'car');checks.push('Explicit source, wrong/retry explanation, functional animation, no auto-advance, idempotent progress');
 await page.locator('#listen').click();await expect.poll(()=>page.evaluate(()=>lab.audio.audio.paused)).toBe(false);await page.locator('#listen').click();assert.equal(await page.evaluate(()=>lab.audio.audio.paused),true);checks.push('Existing exact-match local Arabic recording plays and stops');
 await page.locator('#next-item').click();await page.waitForFunction(()=>lab.state.id==='fan'&&lab.scene?.ready);await expect(page.locator('#guide-text')).toContainText('المروحة');await expect(page.locator('#feedback')).toBeHidden();
 await page.locator('[data-intent=hint]').click();await page.locator('#item-picker [data-item=car]').click();await page.locator('#item-picker [data-item=fan]').click();assert.equal(await page.evaluate(()=>lab.state.hints),1);checks.push('Assistant cancels previous message and preserves assistance across item reselection');
 await page.reload();await ready();assert.equal(await page.evaluate(()=>Object.keys(lab.progress.completed.electricity).length),1);assert.equal(await page.evaluate(()=>lab.state.hints),1);assert.equal(await page.evaluate(()=>lab.state.running),false);checks.push('Completion and assistance survive refresh; device resets safely');
 await page.locator('.assistant summary').click();await page.locator('#ask-input').fill('<img src=x onerror=alert(1)>');await page.locator('#ask-form button').click();await expect(page.locator('#guide-text')).toContainText('إرشادات جاهزة');await expect(page.locator('#guide-text img')).toHaveCount(0);checks.push('Unknown Arabic intent/HTML is handled as text with bounded suggestions');
 await open('materials.html');await expect(page.locator('#item-title')).toHaveText('مسطرة');await expect(page.locator('#item-picker')).not.toContainText('بلاستيكية');await expect(page.locator('#item-picker .completed')).toHaveCount(0);
 await page.locator('[data-choice=glass]').click();await expect(page.locator('#feedback')).toContainText('حاول');await page.locator('[data-choice=plastic]').focus();await page.keyboard.press('Enter');await expect(page.locator('#feedback')).toHaveClass(/success/);checks.push('Material challenge hides material name; keyboard classification works');
 await page.locator('#item-picker [data-item=woolBall]').click();await page.locator('#drag-card').dragTo(page.locator('[data-bin=fabric]'));await expect(page.locator('#feedback')).toHaveClass(/success/);assert.equal(await page.evaluate(()=>lab.state.id),'woolBall');checks.push('Separate draggable card classifies without dragging the 3D canvas');
 await page.screenshot({path:`${out}/materials-desktop.png`,fullPage:true});
 for(const a of activities){
  await open(`${a.id}.html`);
  for(const d of a.items){
   await page.locator('[data-open=library]').click();await page.locator(`#library-grid [data-item="${d.id}"]`).click();await expect(page.locator('#scene')).toHaveAttribute('data-loaded',d.id);
   await expect(page.locator('#answer-controls [aria-pressed=true]')).toHaveCount(0);
   if(a.id==='conductors'){await expect(page.locator('#answer-controls')).toBeHidden();await page.locator('#test-material').click();await expect(page.locator('.circuit-status')).toContainText(d.category==='conductive'?'أضاء':'مطفأ');}
   await page.locator(`[data-choice="${d.source||d.category}"]`).click();if(a.id==='electricity')await page.locator('#submit-answer').click();await expect(page.locator('#feedback')).toHaveClass(/success/);
   if(d.id==='fridge'){await page.locator('#door').click();assert.equal(await page.evaluate(()=>lab.state.doorOpen),true);}
   assert.equal(await page.evaluate(()=>lab.state.id),d.id);
  }
  assert.equal(await page.evaluate(id=>Object.keys(lab.progress.completed[id]).length,a.id),a.items.length);
  checks.push(`${a.id}: all ${a.items.length} models load and all correct answers complete exactly once`);
  console.log(checks.at(-1));await page.screenshot({path:`${out}/${a.id}-completed.png`,fullPage:true});
 }
 await open('electricity.html');await page.locator('#xr-details summary').click();await expect(page.locator('[data-xr]:visible')).toHaveCount(0);await expect(page.locator('#xr-status')).toContainText('الشاشة');checks.push('Unsupported XR shows explanation, with no fake start button');
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width===768?1024:900});
  for(const path of ['',...activities.map(a=>a.id+'.html')]){await open(path);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} overflows at ${width}`);const tiny=await page.locator('button:not([hidden])').evaluateAll(bs=>bs.filter(b=>b.getClientRects().length&&b.getBoundingClientRect().height<43).map(b=>b.textContent));assert.deepEqual(tiny,[],`${path}: touch targets ${width}`);if(width===390)await page.screenshot({path:`${out}/${path.replace('.html','')||'home'}-mobile.png`,fullPage:true});}
 }
 checks.push('Desktop, tablet, mobile and 320px: no horizontal overflow; visible buttons >=44px');
 await page.emulateMedia({reducedMotion:'reduce'});await open('electricity.html');assert.equal(await page.evaluate(()=>lab.scene.reduced),true);checks.push('Reduced motion honored');
 const fallback=await context.newPage();await fallback.route('**/vendor/three.module.js',r=>r.abort());await fallback.goto(base+'/conductors.html');await fallback.waitForFunction(()=>window.lab);await expect(fallback.locator('.fallback-image')).toBeVisible();await fallback.locator('#test-material').click();await fallback.locator('[data-choice=conductive]').click();await expect(fallback.locator('#feedback')).toHaveClass(/success/);await fallback.close();checks.push('Blocked WebGL module: image, circuit and classification still work');
 await page.setViewportSize({width:1440,height:1000});await open('about.html');await expect(page.locator('main')).toContainText('ولاء حامد الصيداوي');await expect(page.locator('main')).toContainText('حسن ربحي مهدي');await page.locator('#reset-progress').click();await page.getByRole('button',{name:'احتفظ بتقدمي'}).click();assert.ok(await page.evaluate(()=>localStorage.getItem('sharara-progress-v3')));await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();assert.equal(await page.evaluate(()=>localStorage.getItem('sharara-progress-v3')),null);checks.push('Credits preserved; progress reset requires confirmation; cancel retains data');
 await open('electricity.html');await page.evaluate(()=>{localStorage.setItem('sharara-progress-v3','{corrupt');localStorage.setItem('sharara-attempts-v3','null');});await page.reload();await ready();assert.equal(await page.evaluate(()=>lab.state.choice),null);checks.push('Corrupted saved data recovers without blocking learning');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failed,[]);
 await writeFile(`${out}/browser-results.json`,JSON.stringify({checks,errors,external,failed,models:59,limitations:['Chrome desktop emulates viewport sizes; physical tablets, headset tracking and touch-camera hardware not available.']},null,2));console.log(JSON.stringify({checks,errors,external,failed},null,2));
}finally{await browser.close();}

