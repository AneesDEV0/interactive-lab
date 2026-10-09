import { devices, sources, trySource } from '../electricity/data.js';
import { items as materials, categories } from '../materials/data.js';
import { items as safety } from '../safety/data.js';
import { items as conductors } from '../conductors/data.js';

const names = { plasticRuler:'مسطرة', woolBall:'كرة خيط', glassJar:'مرطبان', glassCup:'كأس', ironNail:'مسمار', woodStick:'عود', metalSpoon:'ملعقة', fabricCloth:'قطعة نسيج', paperEnvelope:'مغلف', eraser:'ممحاة', paperClip:'مشبك', goldRing:'خاتم', brassMortar:'هاون', chalk:'طباشير', keys:'مفاتيح', solarCar:'سيارة بلوح علوي' };
const safetyNames = { overloaded_socket:'أجهزة كثيرة في مقبس واحد', kids_playing_cords:'أطفال يلعبون بالأسلاك', baby_biting_cord:'سلك في فم طفل', exposed_damaged_wire:'سلك بغلاف مفتوح', inserting_scissors_socket:'مقص داخل المقبس', wet_hands_plug:'يد مبللة قرب القابس', pulling_cord_violently:'نزع القابس بسحب السلك', cord_under_carpet:'سلك تحت السجادة', appliance_near_bathtub:'مجفف شعر قرب حوض الماء', pulling_by_plug_head:'شخص بالغ يمسك رأس القابس', dry_hands_switch:'تجفيف اليدين قبل لمس المفتاح', childproof_socket_cover:'شخص بالغ يركّب غطاء المقبس', unplug_idle_appliances:'شخص بالغ يفصل جهازًا بعد استخدامه' };
const observations = { plasticRuler:'تأمّل خفتها وشكلها المنتظم وتدريجاتها.', woolBall:'تأمّل الخيوط الملتفة ولينها.', glassJar:'نرى داخل هذا الوعاء، وسطحه صلب وأملس.', glassCup:'يمكن رؤية الماء عبر جدار الكأس.', ironNail:'تأمّل سطحه اللامع وصلابته.', woodStick:'لاحظ الخطوط والألياف على سطح العود.', metalSpoon:'سطحها لامع، وشكلها يبقى ثابتًا.', fabricCloth:'يمكن طيها، وهي مكوّنة من خيوط متشابكة.', paperEnvelope:'يشبه في ملمسه صفحة الدفتر ويمكن طيه.', eraser:'لينة، وتزيل أثر قلم الرصاص.', paperClip:'تأمّل السلك المنحني اللامع.', goldRing:'له بريق، ويمكن تشكيل مادته لصنع الحلي.', brassMortar:'ثقيل ولامع ويُستخدم للدق.', keys:'صلبة ولامعة، وتحافظ على شكلها.', chalk:'تترك أثرًا على السبورة.' };
const prepare = (key, list) => list.map(d => ({ ...d, label:names[d.id] || safetyNames[d.id] || d.name, thumbnail:key === 'electricity' ? `assets/thumbnails/${d.id}.png` : `assets/thumbnails/challenge/${key}/${d.id}.svg` }));
export const activities = [
  { id:'electricity', title:'شغّل الأجهزة', description:'اختر مصدر الطاقة، وشاهد الجهاز يعمل.', tag:'مصادر الكهرباء', image:'assets/thumbnails/fan.png', items:prepare('electricity',devices), instruction:'اختر مصدر الطاقة، ثم جرّب التشغيل.', options:Object.entries(sources).map(([id,s])=>({id,name:s.name})), color:'lilac' },
  // The legacy dataset puts chalk in wood. Do not assess an unverified classification.
  { id:'materials', title:'افرز المواد', description:'تأمّل كل عنصر، واكتشف خامته.', tag:'خامات البيئة', image:'assets/thumbnails/challenge/materials/glassJar.svg', items:prepare('materials',materials.filter(d=>d.id!=='chalk')), instruction:'اختر الحاوية المناسبة لهذا العنصر.', options:Object.values(categories), color:'mint' },
  // Tape alone is not enough to infer a safe repair. Await a verified textbook reference.
  { id:'safety', title:'اختر التصرف الآمن', description:'لاحظ الموقف، وفكّر كيف نحمي أنفسنا.', tag:'السلامة الكهربائية', image:'assets/thumbnails/challenge/safety/dry_hands_switch.svg', items:prepare('safety',safety.filter(d=>d.id!=='insulating_tape_repair')), instruction:'تأمّل الموقف. هل التصرف آمن أم خطر؟', options:[{id:'safe',name:'آمن'},{id:'hazard',name:'خطر'}], color:'peach' },
  { id:'conductors', title:'اختبر مرور الكهرباء', description:'اختبر المادة، ثم لاحظ ضوء المصباح.', tag:'الموصلات والعوازل', image:'assets/thumbnails/challenge/conductors/ironNail.svg', items:prepare('conductors',conductors), instruction:'ضع العنصر في الدائرة بالضغط على «اختبر المادة».', options:[{id:'conductive',name:'موصلة للكهرباء'},{id:'insulating',name:'عازلة للكهرباء'}], color:'blue' },
];
export const activityById = id => activities.find(a=>a.id===id);
export const itemById = (activity,id) => activity.items.find(d=>d.id===id);
export function optionsFor(activity,item) {
  if(activity.id!=='electricity') return activity.options;
  return activity.options.filter(o=>['battery','mains'].includes(o.id) || o.id===item.source);
}
export function evaluate(activity,item,choice) {
  if(!optionsFor(activity,item).some(o=>o.id===choice))return false;
  return activity.id==='electricity' ? trySource(item.id,choice).ok : item.category===choice;
}
export function contentFor(activity,item) {
  const kind=activity.id;
  const hint1=kind==='electricity' ? 'تأمّل الجهاز: هل يستخدم سلكًا، أم يمكن حمله بعيدًا عن المقبس؟' : kind==='materials' ? 'تأمّل سطح العنصر وشكله. ما الصفة التي تميّز خامته؟' : kind==='safety' ? 'تأمّل مكان اليد والماء والأسلاك. هل يحمي التصرف الشخص من الكهرباء؟' : 'اختبر العنصر أولًا، ثم لاحظ هل أضاء المصباح.';
  const hint2=kind==='materials' ? observations[item.id] : kind==='conductors' ? 'إضاءة المصباح تعني أن المادة تسمح بمرور الكهرباء في هذه الدائرة.' : item.hint;
  const explanation=kind==='electricity' ? item.result : kind==='materials' ? `${item.label}: ${item.material}. ${observations[item.id]}` : kind==='safety' ? `${item.category==='safe'?'هذا التصرف آمن.':'هذا التصرف خطر.'} ${item.goldenRule} تذكّر: المقابس والصيانة للكبار.` : `${item.label} ${item.category==='conductive'?'يسمح بمرور الكهرباء، لذلك أضاء المصباح.':'لا يمرر الكهرباء في نموذجنا، لذلك بقي المصباح مطفأً.'} نختبر مواد جافة في دائرة تعليمية افتراضية.`;
  return {start:activity.instruction,hints:[hint1,hint2],wrong:kind==='electricity'?`لم يعمل ${item.label} بهذا المصدر. ${item.hint}`:`حاول مرة أخرى. ${kind==='materials'?observations[item.id]:hint1}`,explanation,question:kind==='electricity'?'إلى ماذا تحوّلت الطاقة عندما عمل الجهاز؟':kind==='materials'?'ما الصفة التي ساعدتك في معرفة خامته؟':kind==='safety'?'كيف تشرح التصرف الصحيح لصديقك؟':'ماذا يخبرك ضوء المصباح عن هذه المادة؟'};
}
