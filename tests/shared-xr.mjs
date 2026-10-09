import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto((process.env.LAB_URL||'http://127.0.0.1:4173')+'/electricity.html');await page.waitForFunction(()=>window.lab?.scene?.ready);
 const result=await page.evaluate(async()=>{
  const {Vector3}=await import('three');const scene=lab.scene;scene.xrMode='ar';scene.placed=false;lab.choose('battery');lab.submit();const blockedBeforePlacement=!lab.state.running;
  scene.reticle.visible=true;scene.reticle.matrix.makeTranslation(.3,.1,-1.5);scene.selectXR();const placed=scene.placed&&scene.world.position.distanceTo(new Vector3(.3,.1,-1.5))<.001;lab.submit();const arRunning=lab.state.running;
  document.querySelector('#xr-recenter').click();const reCenter=!scene.placed&&!scene.world.visible;scene.reticle.visible=true;scene.selectXR();
  await lab.selectItem('fan');const preservesSelection=lab.state.id==='fan'&&scene.device.id==='fan';scene.xrMode='vr';scene.world.position.set(0,-.55,-3);scene.world.scale.setScalar(.5);scene.updateVR();
  const select=action=>{const target=scene.vrTargets.find(t=>t.userData.action===action);scene.scene.updateMatrixWorld(true);scene.controller.matrix.makeTranslation(target.position.x,target.position.y,target.position.z+1);scene.controller.updateMatrixWorld(true);scene.selectXR();};
  select('mains');const explicitTry=!lab.state.running&&lab.state.choice==='mains';select('try');const vrRunning=lab.state.running;select('stop');const vrStopped=!lab.state.running;select('mode');const learn=lab.state.mode==='learn';select('play');const play=lab.state.mode==='play';select('next');await new Promise(r=>setTimeout(r,250));const next=lab.state.id==='washer';
  let ended=false;scene.session={end:async()=>{ended=true;}};select('exit');await Promise.resolve();scene.session=null;scene.xrMode=null;
  return {blockedBeforePlacement,placed,arRunning,reCenter,preservesSelection,explicitTry,vrRunning,vrStopped,learn,play,next,exit:ended};
 });for(const [key,value] of Object.entries(result))assert.equal(value,true,key);assert.deepEqual(errors,[]);
 await page.goto((process.env.LAB_URL||'http://127.0.0.1:4173')+'/materials.html');await page.waitForFunction(()=>window.lab);await page.locator('#xr-details summary').click();await expect(page.locator('[data-xr]:visible')).toHaveCount(0);await expect(page.locator('#xr-status')).toContainText('على الشاشة');
 await mkdir('docs/implementation',{recursive:true});await writeFile('docs/implementation/xr-results.json',JSON.stringify({result,errors,limitation:'Synthetic hit-test placement and controller rays only. No physical headset, tracking, scale or WebXR session validation on supported hardware.'},null,2));console.log(result);
}finally{await browser.close();}
