import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {devices} from '../src/electricity/data.js';
const base=process.env.LAB_URL||'http://127.0.0.1:4173';
await mkdir('docs/redesign',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1040}});const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);await page.waitForFunction(()=>window.lab?.scene?.ready);
await expect(page.locator('#stage')).toHaveAttribute('data-loaded','car');
await page.screenshot({path:'docs/redesign/desktop.png',fullPage:true});
await page.locator('#source-options [data-source="mains"]').click();await page.locator('#try-power').click();
assert.equal(await page.evaluate(()=>lab.state.running),false);assert.equal(await page.evaluate(()=>Object.keys(lab.discoveries).length),0);
await page.locator('#source-options [data-source="battery"]').click();await page.locator('#try-power').click();
assert.equal(await page.evaluate(()=>lab.state.running),true);await expect(page.locator('#guide-text')).toContainText('تحرّكت');
await page.locator('#try-power').click();assert.equal(await page.evaluate(()=>lab.state.running),false);checks.push('Wrong source, retry, running, stop, and unique discovery');
await page.locator('#sound-toggle').click();await expect(page.locator('#listen')).toContainText('إيقاف');await page.locator('#listen').click();await expect(page.locator('#listen')).toContainText('اسمعني');await page.locator('#sound-toggle').click();checks.push('Local Arabic audio starts and stops');
await page.getByRole('button',{name:'تعرّف',exact:true}).click();await expect(page.locator('#play-panel')).toBeHidden();await expect(page.locator('#device-fact')).toContainText('البطارية');assert.equal(await page.evaluate(()=>lab.state.running),false);
await page.getByRole('button',{name:'جرّب',exact:true}).click();checks.push('Static and interactive modes share selection and stop motion');
await page.locator('#ask-input').fill('<img src=x onerror=alert(1)>');await page.locator('#ask-form button').click();await expect(page.locator('#guide-text')).toContainText('أستطيع مساعدتك');assert.equal(await page.locator('#guide-text img').count(),0);checks.push('Assistant safely handles unknown and HTML input');
for(const d of devices){
  await page.evaluate(async({id,source})=>{await lab.selectDevice(id);lab.selectSource(source);lab.testPower();},{id:d.id,source:d.source});
  await expect(page.locator('#stage')).toHaveAttribute('data-loaded',d.id);assert.equal(await page.evaluate(()=>lab.state.running),true,d.id);assert.equal(await page.evaluate(()=>lab.scene.model.userData.device),d.id);
  if(d.id==='fridge'){await page.locator('#door').click();assert.equal(await page.evaluate(()=>lab.state.doorOpen),true);}
}
assert.equal(await page.evaluate(()=>Object.keys(lab.discoveries).length),17);checks.push('All 17 models load and run; refrigerator door opens');
await page.reload();await page.waitForFunction(()=>window.lab?.scene?.ready);assert.equal(await page.evaluate(()=>Object.keys(lab.discoveries).length),17);assert.equal(await page.evaluate(()=>lab.state.running),false);checks.push('Discoveries survive reload; power resets');
await page.locator('.progress-chip').click();await expect(page.locator('.notebook-item')).toHaveCount(17);await page.keyboard.press('Escape');
await page.locator('.device-section [data-open="library"]').click();await page.locator('[data-filter="مصادر الكهرباء"]').click();await expect(page.locator('#library-grid .device-card')).toHaveCount(5);await page.keyboard.press('Escape');checks.push('Library filters and discovery notebook');
await page.locator('[data-xr="ar"]').click();await expect(page.locator('#notice')).toBeVisible();await expect(page.locator('#notice-text')).toContainText('يدعمان');await page.keyboard.press('Escape');checks.push('Unsupported AR has a clear fallback');
await page.locator('.camera-card').click();await page.locator('#photo-file').setInputFiles('assets/book/car.jpg');await expect(page.locator('#camera-result')).toBeVisible({timeout:45000});await expect(page.locator('#confirmed-device')).toHaveValue('car');await page.locator('#confirm-photo').click();await expect(page.locator('#stage')).toHaveAttribute('data-loaded','car');checks.push('Uploaded textbook image matched and confirmed as a 3D car');
const recognition=await page.evaluate(async()=>{
 const {recognize}=await import('/src/electricity/recognition.js');const img=new Image();img.src='/assets/book/washer.jpg';await img.decode();const c=document.createElement('canvas');c.width=500;c.height=500;const g=c.getContext('2d');g.fillStyle='#f5f4ed';g.fillRect(0,0,500,500);g.translate(250,250);g.rotate(.16);g.drawImage(img,-img.width,-img.height,img.width*2,img.height*2);const matched=await recognize(c.toDataURL());g.setTransform(1,0,0,1,0,0);g.fillStyle='white';g.fillRect(0,0,500,500);const blank=await recognize(c.toDataURL());return {matched,blank};
});assert.equal(recognition.matched?.id,'washer');assert.equal(recognition.blank,null);checks.push('Rotated/scaled book photo matches; blank photo rejected');
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'docs/redesign/mobile.png',fullPage:true});
await page.setViewportSize({width:320,height:700});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);checks.push('Responsive layout at 390 and 320 pixels without horizontal overflow');
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.lab?.scene?.ready);assert.equal(await page.evaluate(()=>lab.scene.reduced),true);checks.push('Reduced motion respected');
const fallback=await browser.newPage();await fallback.route('**/vendor/three.module.js',route=>route.abort());await fallback.goto(base);await fallback.waitForFunction(()=>window.lab);await fallback.locator('#try-power').click();assert.equal(await fallback.evaluate(()=>lab.state.running),true);await expect(fallback.locator('.fallback-image')).toBeVisible();await fallback.close();checks.push('No WebGL dependency: HTML experiment fallback remains usable');
assert.deepEqual(errors,[]);await writeFile('docs/redesign/browser-results.json',JSON.stringify({checks,errors,recognition,limits:['Physical AR/VR hardware not available in automated tests','Recognition evaluated on supplied book references, rotated/scaled fixture and blank image; classroom lighting not verified']},null,2));console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));await browser.close();
