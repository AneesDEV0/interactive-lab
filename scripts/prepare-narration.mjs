import {mkdir,writeFile} from 'node:fs/promises';
import {activities,contentFor,discoveryFor} from '../src/shared/catalog.js';
import {newAttempt,guidance} from '../src/shared/learning.js';
import {createHash} from 'node:crypto';
const rows=new Map();
function add(text,context){if(!text)return;const id='line-'+createHash('sha256').update(text).digest('hex').slice(0,12);if(!rows.has(text))rows.set(text,{id,file:id+'.mp3',text,contexts:[]});rows.get(text).contexts.push(context);}
for(const a of activities)for(const item of a.items){
  const bank=contentFor(a,item),fact=discoveryFor(a,item);
  add(guidance(a,newAttempt(item.id)),`${a.title} / ${item.label} / البداية`);
  add(bank.hints[0],`${a.title} / ${item.label} / تلميح ١`);
  add(bank.hints[1],`${a.title} / ${item.label} / تلميح ٢`);
  add(bank.wrong,`${a.title} / ${item.label} / إعادة المحاولة`);
  add(bank.explanation,`${a.title} / ${item.label} / النتيجة`);
  add(fact.text,`${a.title} / ${item.label} / تعرّف`);
  if(item.promptQuestion)add(item.promptQuestion,`${a.title} / ${item.label} / سؤال التجربة`);
  add(`لنراجع معًا: ${bank.explanation}`,`${a.title} / ${item.label} / مساعدة بعد التكرار`);
}
for(const text of ['اختر نشاطًا، وجرّب بنفسك.','اضغط «جرّب التشغيل» لتختبر المصدر الذي اخترته.','جرّب اختيارك أولًا، ثم نكتشف السبب معًا.','أساعدك في هذا النشاط بإرشادات جاهزة. اختر «تلميح» أو «ماذا أفعل الآن؟».','لاحظ المصباح، ثم اختر: موصلة أم عازلة؟','لاحظ ما حدث بعد الدلك والاحتكاك، ثم اختر السبب الصحيح.','ضع الجهاز على الطاولة أولًا.','أصبح الجهاز على الطاولة. تابع تجربتك.','توقّف الجهاز. يمكنك الانتقال إلى العنصر التالي.'])add(text,'إرشاد مشترك');
const recordings=[...rows.values()];await mkdir('docs/audio',{recursive:true});await writeFile('docs/audio/recording-script.json',JSON.stringify({version:1,voice:'تسجيل بشري عربي',recordings},null,2)+'\n');
console.log(`Prepared ${recordings.length} narration lines; no audio generated.`);
