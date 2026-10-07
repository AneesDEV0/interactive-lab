// Exercises scene/controller logic. This is not physical headset/tracking validation.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.lab?.scene?.ready);
const result=await page.evaluate(async()=>{
 const {Vector3}=await import('three');const s=lab.scene;
 s.xrMode='ar';s.placed=false;lab.testPower();const blockedBeforePlacement=!lab.state.running;
 s.reticle.visible=true;s.reticle.matrix.makeTranslation(.3,.1,-1.5);s.selectXR();const placed=s.placed&&s.world.position.distanceTo(new Vector3(.3,.1,-1.5))<.001;
 lab.testPower();const arRunning=lab.state.running;lab.testPower();
 s.xrMode='vr';s.world.position.set(0,-.55,-3);s.world.scale.setScalar(.5);s.updateVR();
 const select=action=>{const m=s.vrTargets.find(t=>t.userData.action===action);s.scene.updateMatrixWorld(true);s.controller.matrix.makeTranslation(m.position.x,m.position.y,m.position.z+1);s.controller.updateMatrixWorld(true);s.selectXR();};
 select('battery');const vrRunning=lab.state.running;select('stop');const vrStopped=!lab.state.running;select('mode');const staticMode=lab.state.mode==='learn';select('play');select('next');await new Promise(r=>setTimeout(r,100));const next=lab.state.id==='fan';
 return {blockedBeforePlacement,placed,arRunning,vrRunning,vrStopped,staticMode,next};
});for(const [key,value] of Object.entries(result))assert.equal(value,true,key);await writeFile('docs/redesign/xr-logic-results.json',JSON.stringify({result,limitation:'Synthetic controller/hit-test coordinates only. Physical AR/VR testing remains required.'},null,2));console.log(result);await browser.close();

