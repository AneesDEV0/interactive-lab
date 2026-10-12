import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {activities,activityPages,discoveryFor} from '../src/shared/catalog.js';
import {DISCOVERY_KEY,readDiscovery,recordDiscovery,saveDiscovery} from '../src/shared/discovery.js';
import {readProgress,STORAGE_KEY} from '../src/shared/learning.js';

const memory=values=>({getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=value;}});
test('Ten independent entry pages expose reading and experiment activities for each subject',async()=>{
 assert.equal(activityPages.length,10);assert.equal(new Set(activityPages.map(p=>p.href)).size,10);
 for(const page of activityPages){const html=await readFile(new URL('../'+page.href,import.meta.url),'utf8');assert.ok(html.includes(`data-kind="${page.kind}"`));assert.ok(html.includes(`data-activity="${page.subject}"`));}
});
test('All picture cards have real content; reading never refers to an already performed conductor test',()=>{
 for(const activity of activities)for(const item of activity.items){const fact=discoveryFor(activity,item);for(const value of Object.values(fact))assert.ok(typeof value==='string'&&value.length>0);if(activity.id==='conductors')assert.ok(!fact.text.includes('لذلك أضاء'));}
});
test('Reading is saved independently, and acknowledging a card repeatedly does not inflate completion',()=>{
 const values={[STORAGE_KEY]:JSON.stringify({version:3,completed:{},last:null})},storage=memory(values),activity=activities[0];
 let reading=readDiscovery(storage);const experiment=readProgress(storage);
 for(let n=0;n<3;n++)reading=recordDiscovery(reading,activity,activity.items[0].id);
 reading.last={activity:activity.id,item:activity.items[0].id};assert.equal(saveDiscovery(storage,reading),true);
 assert.equal(Object.keys(readDiscovery(storage).completed[activity.id]).length,1);
 assert.deepEqual(readProgress(storage),experiment);assert.equal(recordDiscovery(reading,activity,'unknown'),reading);
});
test('Malformed, unknown and unavailable reading storage cannot block learning',()=>{
 for(const raw of ['null','{broken','[]','{"completed":{"electricity":{"car":"yes","alien":true}},"last":{"activity":"electricity","item":"alien"}}']){
  const result=readDiscovery(memory({[DISCOVERY_KEY]:raw}));assert.equal(result.last,null);assert.equal(Object.keys(result.completed.electricity||{}).length,0);
 }
 const blocked={getItem(){throw Error();},setItem(){throw Error();}};assert.doesNotThrow(()=>readDiscovery(blocked));assert.equal(saveDiscovery(blocked,{}),false);
});
