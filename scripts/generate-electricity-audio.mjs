import {writeFile} from 'node:fs/promises';
import {devices,voiceLines} from '../src/electricity/data.js';
const lines={...voiceLines};
for(const d of devices){
  lines[d.id+'-fact']=d.fact; lines[d.id+'-hint']=d.hint;
  lines[d.id+'-result']=d.result; lines[d.id+'-wrong']='لم يعمل الجهاز بهذا المصدر. '+d.hint;
  lines[d.id+'-select']='اخترت '+d.name+'. اختر مصدرًا للطاقة، ثم اضغط: جرّب التشغيل.';
}
await writeFile('assets/audio/electricity/manifest.json',JSON.stringify(lines,null,2));
console.log(Object.keys(lines).length+' Arabic prompts prepared');
