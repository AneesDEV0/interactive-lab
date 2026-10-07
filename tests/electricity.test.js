import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {devices,sources,trySource,answer,voiceLines} from '../src/electricity/data.js';

test('Every book device has a working appropriate source and rejects inappropriate sources',()=>{
  assert.equal(devices.length,17);assert.equal(new Set(devices.map(d=>d.id)).size,17);
  for(const d of devices)for(const s of Object.keys(sources))assert.equal(trySource(d.id,s).ok,(d.accepts||[d.source]).includes(s),`${d.id}: ${s}`);
  assert.equal(trySource('invalid','battery').ok,false);assert.equal(trySource('car','invalid').ok,false);
});
test('Radio supports both illustrated supply options; solar, wind and dynamo are distinct',()=>{
  assert.ok(trySource('radio','battery').ok&&trySource('radio','mains').ok);
  assert.ok(trySource('solarCar','solar').ok);assert.ok(trySource('wind','wind').ok);assert.ok(trySource('bicycle','movement').ok);
});
test('Assistant stays within the device activity and prioritizes electrical safety',()=>{
  const d=devices[0];assert.equal(answer('هل ألمس المقبس؟',d).key,'safety');assert.equal(answer('كيف يعمل؟',d).text,d.fact);assert.equal(answer('<script>alert(1)</script>',d).key,'unknown');
});
test('Every displayed guide line has a matching local, nonempty recording',async()=>{
  const manifest=JSON.parse(await readFile('assets/audio/electricity/manifest.json','utf8'));
  for(const [key,text] of Object.entries(voiceLines))assert.equal(manifest[key],text);
  for(const d of devices)for(const key of ['fact','hint','result'])assert.equal(manifest[`${d.id}-${key}`],d[key]);
  for(const key of Object.keys(manifest)){const file=await readFile(`assets/audio/electricity/${key}.mp3`);assert.ok(file.length>1000,key);assert.ok(file[0]===0xff||file.toString('ascii',0,3)==='ID3',key);}
});
test('Every device has a book reference and rendered thumbnail; downloaded GLBs are valid',async()=>{
  for(const d of devices){assert.ok((await stat(`assets/book/${d.id}.jpg`)).size>1000);assert.ok((await stat(`assets/thumbnails/${d.id}.png`)).size>1000);if(d.model){const b=await readFile(`assets/models/book/${d.model}.glb`);assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);}}
});
