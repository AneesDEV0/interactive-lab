import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:4173/electricity.html');await p.waitForFunction(()=>window.lab);
 assert.equal(await p.evaluate(()=>lab.audio.preferences.mode),'recordings');
 await p.evaluate(async()=>{window.speechCalls=0;window.speechSynthesis.speak=()=>window.speechCalls++;await lab.audio.speak('هذه العبارة لا تملك تسجيلًا.',true);});
 assert.equal(await p.evaluate(()=>speechCalls),0);await expect(p.locator('#sound-status')).toContainText('بلا تسجيل');
 await p.locator('.assistant summary').click();await p.getByRole('button',{name:'إعدادات الصوت',exact:true}).click();await expect(p.locator('#voice-mode')).toHaveValue('recordings');
 await p.locator('#preview-voice').click();await expect.poll(()=>p.evaluate(()=>lab.audio.audio.paused)).toBe(false);
 await p.locator('#voice-mode').selectOption('device');await expect(p.locator('#voice-description')).toContainText('آلي');assert.equal(await p.evaluate(()=>lab.audio.audio.paused),true);
 await p.locator('#voice-rate').selectOption('1.1');await p.locator('#preview-voice').click();await expect.poll(()=>p.evaluate(()=>speechCalls)).toBe(1);assert.equal(await p.evaluate(()=>lab.audio.audio.getAttribute('src')),null);
 await p.reload();await p.waitForFunction(()=>window.lab);assert.equal(await p.evaluate(()=>lab.audio.preferences.mode),'device');assert.equal(await p.evaluate(()=>lab.audio.preferences.rate),1.1);
 await p.locator('.assistant summary').click();await p.getByRole('button',{name:'إعدادات الصوت',exact:true}).click();await p.locator('#voice-mode').selectOption('recordings');await p.locator('#voice-rate').selectOption('1');await p.locator('#preview-voice').click();await expect.poll(()=>p.evaluate(()=>lab.audio.audio.paused)).toBe(false);
 await p.locator('[data-close=voice-settings]').click();await expect.poll(()=>p.evaluate(()=>lab.audio.audio.paused)).toBe(true);
 await p.evaluate(async()=>{lab.audio.humanRecordings=[{text:'اختبار التسجيل البشري',file:'missing-human.mp3'}];lab.audio.configure({mode:'human'});window.speechCalls=0;speechSynthesis.speak=()=>window.speechCalls++;await lab.audio.speak('نص بلا ملف بشري',true);});assert.equal(await p.evaluate(()=>speechCalls),0);
 assert.deepEqual(errors,[]);await writeFile('docs/audio/browser-results.json',JSON.stringify({errors,checks:['No automatic device TTS for missing recordings','Local clip preview actually plays','Narrator change stops previous playback','Device mode never switches to existing recording','Voice/rate preferences persist','Closing settings stops preview','Missing human recording cannot fall back to a different narrator'],limitation:'Playback and routing tests only. Naturalness and Arabic pronunciation still require listening approval of new recordings.'},null,2));
 console.log('Voice routing and settings: 7 checks passed.');
}finally{await b.close();}
