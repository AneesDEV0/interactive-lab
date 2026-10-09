import { activities, activityById, itemById, optionsFor, contentFor } from './catalog.js';
import { readProgress, saveProgress, recordSuccess, newAttempt, transition, guidance, parseIntent } from './learning.js';
import { header, footer, helpDialog, ActivityLayout, ItemPicker, esc, num, modal } from './components.js';
import { AudioManager } from './audio-manager.js';
import { mountVoiceSettings } from './voice-settings.js';
import { CameraCapture } from './camera.js';
import { icon } from '../electricity/icons.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let progress=readProgress(storage),scene=null,state=null,camera=null,currentText='',soundState='idle',loadRevision=0;
const activity=activityById(document.body.dataset.activity);
const audio=new AudioManager(status=>{soundState=status;const message={unavailable:'لا يتوفر صوت عربي محلي. تابع الشرح المكتوب.', 'missing-recording':'هذه العبارة بلا تسجيل بعد. تابع النص، أو اختر قراءة الجهاز من إعدادات الصوت.', 'recording-error':'تعذر تشغيل التسجيل. أعد المحاولة أو تابع النص.', playing:'يُقرأ الشرح الآن…'}[status]||'';for(const el of [$('#sound-status'),$('#voice-preview-status')])if(el)el.textContent=message;const listen=$('#listen span');if(listen)listen.textContent=status==='playing'?'إيقاف الشرح':'اسمع الشرح';if(state)state.audioStatus=status;});
function soundButton(){const b=$('#sound-toggle');b.setAttribute('aria-pressed',String(audio.enabled));b.innerHTML=icon(audio.enabled?'sound':'mute')+`<span>${audio.enabled?'كتم الصوت':'تشغيل الصوت'}</span>`;}
function persist(){if(!saveProgress(storage,progress)&&$('#storage-status'))$('#storage-status').textContent='الحفظ غير متاح في هذا المتصفح. يمكنك متابعة النشاط خلال هذه الزيارة.';}
function say(text){currentText=text;if($('#guide-text'))$('#guide-text').textContent=text;audio.speak(text);scene?.updateVR();}
function renderHome(){
  $('#app').innerHTML=`${header()}<main id="main" class="home-main"><section class="welcome"><div><span class="eyebrow">أهلًا أيها المستكشف الصغير</span><h1>ماذا سنكتشف <em>اليوم؟</em></h1><p>اختر تجربة. جرّب بنفسك، وشرارة معك في كل خطوة.</p></div>${progress.last && Object.keys(progress.completed[progress.last.activity]||{}).length<activityById(progress.last.activity).items.length?`<a class="primary resume" href="${progress.last.activity}.html?item=${progress.last.item}">أكمل نشاطك ←</a>`:'<span class="welcome-note">مساحة صغيرة<br><strong>لاكتشافات كبيرة.</strong></span>'}</section><section class="activity-cards" aria-label="الأنشطة الأربعة">${activities.map(a=>{const count=Object.keys(progress.completed[a.id]||{}).length;return `<article class="activity-card ${a.color}"><a class="activity-art" href="${a.id}.html" tabindex="-1" aria-hidden="true"><img src="${a.image}" alt=""><span class="art-label">${a.tag}</span></a><div class="activity-copy"><h2>${a.title}</h2><p>${a.description}</p><div class="card-bottom"><a class="start-link" href="${a.id}.html">${count===a.items.length?'أعد الاستكشاف':count?'تابع النشاط':'ابدأ النشاط'} <span>←</span></a><small>${count?`${num(count)} من ${num(a.items.length)} مكتمل`:'جاهز للاكتشاف'}</small></div>${count?`<progress max="${a.items.length}" value="${count}" aria-label="تقدم ${a.title}"></progress>`:''}</div></article>`;}).join('')}</section><p class="home-note">${icon('shield')} كل التجارب على الشاشة. تعلّم وجرّب بأمان.</p></main>${footer()}${helpDialog()}`;
}
function renderAbout(){
 $('#app').innerHTML=`${header()}<main id="main" class="about-main"><a href="index.html" class="back-link">→ الأنشطة</a><h1>عن مختبر شرارة</h1><p class="lead">مختبر علوم تفاعلي لطلبة الصف الرابع الأساسي؛ نتعلّم الكهرباء وخامات البيئة بالملاحظة والتجربة.</p><section><h2>أصحاب المشروع</h2><p><strong>إعداد الباحثة: ولاء حامد الصيداوي</strong><br>باحثة ومصممة المنصة التفاعلية</p><p><strong>إشراف الدكتور: حسن ربحي مهدي</strong><br>إشراف تربوي وأكاديمي</p><p>المشروع البحثي الأصلي يستكشف توظيف الواقع المعزز والذكاء الاصطناعي لمعالجة الفاقد التعليمي. هذه النسخة تنفّذ أنشطة محلية ومساعدًا بإجابات معدّة.</p><p>جميع الحقوق محفوظة © لمنصة العلوم التفاعلية · الصف الرابع الأساسي</p></section><section><h2>كيف تعمل المنصة فعلًا؟</h2><p>شرارة مرشد قائم على قواعد وحالة النشاط، وليس محادثة توليدية. لا تحتاج المنصة حسابًا أو بيانات شخصية أو مفاتيح API.</p><p>المجسمات التعليمية موجودة مسبقًا أو تُنشأ برمجيًا. تُطابق صور أجهزة الكهرباء محليًا مع الصور المرجعية المتاحة، ثم يؤكد الطالب العنصر. نطابق أيضًا مناطق محددة لكل عنصر من صفحات السلامة والموصلات المتاحة. العناصر التي لا تملك مرجعًا واضحًا تُختار يدويًا، دون تخمين أو ادعاء فهم عام للصور.</p><p>التسجيلات المحلية المتاحة مولّدة صوتيًا مسبقًا، وليست تسجيلات بشرية. لا ينتقل الموقع تلقائيًا إلى صوت الجهاز عند غياب تسجيل. قراءة الجهاز خيار منفصل في إعدادات الصوت؛ وتُضاف التسجيلات البشرية عبر دليل محلي مخصص. لا يستخدم الموقع ميكروفونًا أو خدمة تحويل كلام خارجية.</p><p>الواقع المعزز والافتراضي متاحان لأجهزة نشاط الكهرباء عند دعم WebXR. بقية الأنشطة تعرض المجسم على الشاشة. تشغيل الكاميرا وAR على الهاتف يحتاج اتصالًا آمنًا. عرض ملء الشاشة ليس VR.</p></section><section><h2>المحتوى والمصادر</h2><p>حافظنا على بيانات الأنشطة وأصول المشروع. استُبعدت الطباشير من تحدي الخامات لأن البيانات القديمة تصنفها خشبًا. واستُبعد موقف إصلاح السلك بالشريط من التقييم إلى حين مراجعة مرجع الكتاب والإشراف المختص. بقيت الملفات الأصلية محفوظة للمراجعة.</p><p>الموصلية هنا نموذج تعليمي لمواد جافة؛ لا تعني أن المواد المنزلية تصلح أدوات حماية من الكهرباء. المقابس والصيانة للكبار.</p><p><a href="ATTRIBUTIONS.md">المصادر والتراخيص</a> · <a href="docs/implementation/REPORT.md">تقرير التنفيذ والاختبارات</a></p></section><section><h2>التقدم على هذا الجهاز</h2><p>يُحفظ تقدم الأنشطة وتفضيل الصوت محليًا. لا تُرفع الصور أو الأسئلة إلى خادم.</p><button id="reset-progress">مسح تقدم الأنشطة</button><p id="reset-status" role="status"></p></section></main>${footer()}${helpDialog()}${modal('reset-confirm','مسح تقدم الأنشطة؟','<p>سيُمسح التقدم المحفوظ للأنشطة الأربعة على هذا الجهاز. لا يمكن التراجع عن المسح.</p><div class="input-row"><button data-close="reset-confirm">احتفظ بتقدمي</button><button id="confirm-reset">نعم، امسح التقدم</button></div>')}`;
 $('#reset-progress').onclick=()=>$('#reset-confirm').showModal();$('#confirm-reset').onclick=()=>{try{for(const key of ['sharara-progress-v3','sharara-discoveries-v2','khabeer-materials-discoveries-v1','captain-safety-discoveries-v1','professor-conductors-discoveries-v1','sharara-attempts-v3'])storage.removeItem(key);$('#reset-status').textContent='تم مسح تقدم الأنشطة.';}catch{$('#reset-status').textContent='تعذر مسح التقدم من هذا المتصفح.';}$('#reset-confirm').close();};
}
function circuitMarkup(item){const tested=state.tested,lit=tested&&item.category==='conductive';return `<svg viewBox="0 0 340 150" role="img" aria-label="${tested?lit?'دائرة ومصباح مضيء':'دائرة ومصباح مطفأ':'دائرة تنتظر اختبار المادة'}" class="circuit-svg ${lit?'lit':''}"><path class="wire" d="M65 65H125M215 65H280V125H65V85"/><path class="wire sample" d="M125 65H215" ${tested?'':'stroke-dasharray="5 5"'}/><rect x="50" y="60" width="30" height="34" rx="4" fill="#8c75bd"/><text x="65" y="84" text-anchor="middle" fill="white">+</text><circle class="bulb" cx="280" cy="65" r="23"/><path d="M270 57l20 16m-20 0l20-16" stroke="#665d77" stroke-width="2"/><rect x="121" y="46" width="98" height="38" rx="9" fill="#eeeaf6"/><text x="170" y="70" text-anchor="middle" fill="#302844" font-size="13">${esc(item.label)}</text></svg><p class="circuit-status">${tested?lit?'أضاء المصباح. ماذا تستنتج؟':'بقي المصباح مطفأً. ماذا تستنتج؟':'المصباح ينتظر تجربتك.'}</p>`;}
function render(){
 const item=itemById(activity,state.id),count=Object.keys(progress.completed[activity.id]||{}).length,done=state.phase==='success',learn=state.mode==='learn';
 $('#item-title').textContent=learn?item.name:item.label;$('#instruction').textContent=learn?'تأمّل وتعرّف إلى العنصر':done?'لاحظ ما اكتشفته':activity.id==='conductors'&&state.tested?'ماذا يخبرك ضوء المصباح؟':activity.instruction;
 $('#progress-text').textContent=`${num(count)} من ${num(activity.items.length)} مكتمل`;$('#progress').value=count;
 $('#item-picker').innerHTML=ItemPicker(activity,state.id,progress.completed[activity.id]);$('#library-grid').innerHTML=ItemPicker(activity,state.id,progress.completed[activity.id],true);
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
 $('#play-panel').hidden=learn;$('#learn-panel').hidden=!learn;$('#learn-panel').textContent=activity.id==='electricity'?item.fact:contentFor(activity,item).explanation;
 $('#answer-controls').className='answer-controls '+(activity.id==='materials'?'bins':'');
 $('#answer-controls').innerHTML=optionsFor(activity,item).map(o=>`<button data-choice="${o.id}" ${activity.id==='materials'?`data-bin="${o.id}"`:''} aria-pressed="${state.choice===o.id}" ${done?'disabled':''}>${activity.id==='materials'?icon('cube'):''}<span>${o.name}</span></button>`).join('');
 $('#answer-controls').hidden=activity.id==='conductors'&&!state.tested;
 $('#submit-answer').hidden=activity.id!=='electricity'||done;$('#submit-answer').disabled=!state.choice;
 $('#drag-card').hidden=activity.id!=='materials'||done;$('#drag-card').dataset.item=state.id;$('#drag-card').setAttribute('aria-label',`اسحب بطاقة ${item.label} إلى الحاوية، أو استخدم أزرار الحاويات`);
 $('#circuit').hidden=activity.id!=='conductors';if(activity.id==='conductors')$('#circuit').innerHTML=circuitMarkup(item);
 $('#test-material').hidden=activity.id!=='conductors'||state.tested;
 $('#feedback').hidden=!state.feedback;$('#feedback').textContent=state.feedback;$('#feedback').className='feedback '+(done?'success':'retry');if(done){const question=document.createElement('p');question.className='understanding';question.textContent=contentFor(activity,item).question;$('#feedback').append(question);}
 $('#next-item').hidden=!done;$('#next-item').textContent=count===activity.items.length?'اكتمل النشاط · ارجع للأنشطة ←':'التالي ←';
 $('#stop-device').hidden=!state.running;
 $('#xr-answer-controls').innerHTML=optionsFor(activity,item).map(o=>`<button data-xr-choice="${o.id}" aria-pressed="${state.choice===o.id}">${o.name}</button>`).join('');
 $('#xr-submit').disabled=!state.choice||done;$('#xr-next').hidden=!done;
 $('#door').hidden=state.id!=='fridge';$('#door').textContent=state.doorOpen?'أغلق باب الثلاجة':'افتح باب الثلاجة';
 scene?.setState(state);
}
let attempts={};try{const saved=JSON.parse(storage.getItem('sharara-attempts-v3')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))attempts=saved;}catch{}
function rememberAttempt(){const key=activity.id+':'+state.id;attempts[key]={attempts:state.attempts,hints:state.hints,revealed:state.revealed};try{storage.setItem('sharara-attempts-v3',JSON.stringify(attempts));}catch{}}
async function selectItem(id){
 const item=itemById(activity,id);if(!item)return;
 audio.stop();state=newAttempt(id,state?.mode||'play');
 const saved=attempts[activity.id+':'+id];if(saved&&typeof saved==='object'){state.attempts=Number.isInteger(saved.attempts)&&saved.attempts>=0?saved.attempts:0;state.hints=Number.isInteger(saved.hints)?Math.max(0,Math.min(3,saved.hints)):0;state.revealed=saved.revealed===true;}if(state.mode==='learn'){state.revealed=true;rememberAttempt();}
 progress.last={activity:activity.id,item:id};persist();const url=new URL(location.href);url.searchParams.set('item',id);url.searchParams.delete('device');history.replaceState(null,'',url);
 render();say(guidance(activity,state));const rev=++loadRevision;$('#model-status').hidden=false;$('#model-status').textContent='نجهّز المجسم…';
 if(scene){try{await scene.setItem(item);if(rev===loadRevision){$('#model-status').hidden=true;$('#scene').dataset.loaded=id;}}catch{if(rev===loadRevision)fallback();}}else if($('#scene .fallback-image'))fallback();
}
function fallback(){scene?.destroy();scene=null;const d=itemById(activity,state.id);$('#scene').innerHTML=`<img class="fallback-image" src="${d.thumbnail}" alt="${esc(d.label)}">`;$('#model-status').hidden=false;$('#model-status').textContent='عرض مبسّط؛ يمكنك متابعة التجربة بالأزرار.';$$('[data-xr]').forEach(b=>b.hidden=true);$('#xr-status').textContent='تابع التجربة بالعرض المبسّط على الشاشة.';}
function submit(){if(scene?.xrMode==='ar'&&!scene.placed){say('ضع الجهاز على الطاولة أولًا.');return;}state=transition(activity,state,{type:'submit'});progress=recordSuccess(progress,activity,state);rememberAttempt();persist();render();say(guidance(activity,state));}
function choose(choice){state=transition(activity,state,{type:'choose',choice});if(activity.id==='electricity'){render();say(guidance(activity,state));}else submit();}
function next(){if(Object.keys(progress.completed[activity.id]||{}).length===activity.items.length){location.href='index.html';return;}const index=activity.items.findIndex(d=>d.id===state.id);const candidates=[...activity.items.slice(index+1),...activity.items.slice(0,index+1)];selectItem(candidates.find(d=>!progress.completed[activity.id]?.[d.id]).id);}
async function startActivity(){
 $('#app').innerHTML=ActivityLayout(activity);
 const params=new URLSearchParams(location.search),id=params.get('item')||params.get('device');state=newAttempt(itemById(activity,id)?.id||activity.items[0].id,params.get('mode')==='learn'?'learn':'play');
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
 camera=new CameraCapture(activity,id=>selectItem(id),status=>{state.cameraStatus=status;});
 $('#submit-answer').onclick=submit;$('#next-item').onclick=next;
 $('#xr-submit').onclick=submit;$('#xr-next').onclick=next;
 $('#stop-device').onclick=()=>{state.running=false;render();say('توقّف الجهاز. يمكنك الانتقال إلى العنصر التالي.');};
 $('#test-material').onclick=()=>{state=transition(activity,state,{type:'test'});render();say(guidance(activity,state));};
 $('#door').onclick=()=>{state.doorOpen=!state.doorOpen;render();};
 $('#listen').onclick=()=>soundState==='playing'?audio.stop():audio.speak(currentText,true);
 $('#ask-form').onsubmit=e=>{e.preventDefault();assist(parseIntent($('#ask-input').value));$('#ask-input').value='';};
 $('#drag-card').addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',state.id);e.dataTransfer.effectAllowed='move';});
 $('#answer-controls').addEventListener('dragover',e=>{if(e.target.closest('[data-bin]'))e.preventDefault();});
 $('#answer-controls').addEventListener('drop',e=>{e.preventDefault();const b=e.target.closest('[data-bin]');if(b&&e.dataTransfer.getData('text/plain')===state.id)choose(b.dataset.bin);});
 await selectItem(state.id);
 try{const {ModelViewer}=await import('./model-viewer.js');scene=new ModelViewer($('#scene'),{error:()=>fallback(),guidance:()=>currentText,sources:()=>optionsFor(activity,itemById(activity,state.id)),action:id=>{if(id==='exit')scene.exitXR();else if(id==='next')next();else if(['mode','play'].includes(id))setMode(id==='play'?'play':'learn');else if(id==='try')submit();else if(id==='stop'&&state.running){state.running=false;render();say('توقّف الجهاز. يمكنك الانتقال إلى العنصر التالي.');}else if(id==='listen'||id==='stop')audio.speak(currentText,true);else choose(id);},placed:()=>say('أصبح الجهاز على الطاولة. تابع تجربتك.'),ended:()=>{$('#xr-overlay').hidden=true;scene.fit();}},activity.id);scene.setState(state);await scene.setItem(itemById(activity,state.id));$('#model-status').hidden=true;$('#scene').dataset.loaded=state.id;}
 catch{scene?.destroy();scene=null;fallback();}
 await checkXR();
 window.addEventListener('pagehide',()=>{audio.stop();camera.close();scene?.destroy();});
}
function assist(intent){if(intent==='hint')state=transition(activity,state,{type:'hint'});if(intent==='why'&&(state.attempts||state.tested))state.revealed=true;rememberAttempt();say(guidance(activity,state,intent));}
function setMode(mode){state=transition(activity,state,{type:'mode',mode});rememberAttempt();const url=new URL(location.href);url.searchParams.set('mode',mode);history.replaceState(null,'',url);render();say(guidance(activity,state));}
async function checkXR(){
 const status=$('#xr-status');if(activity.id!=='electricity'||!scene){status.textContent='استكشف هذا العنصر على الشاشة. عرض النظارة والطاولة متاح للأجهزة في نشاط شغّل الأجهزة عند دعم جهازك.';return;}
 let supported=0;for(const mode of ['ar','vr']){try{const ok=isSecureContext&&await navigator.xr?.isSessionSupported(`immersive-${mode}`);$(`[data-xr="${mode}"]`).hidden=!ok;if(ok)supported++;}catch{}}
 status.textContent=supported?'ابدأ العرض المتاح لجهازك. يمكنك الخروج في أي وقت.':'جهازك أو متصفحك لا يدعم هذا العرض هنا. يمكنك تدوير المجسم وتجربته على الشاشة.';
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='sound-toggle'){audio.toggle();soundButton();if(audio.enabled)audio.speak(currentText||'اختر نشاطًا، وجرّب بنفسك.');}
 if(b.dataset.open){audio.stop();$('#'+b.dataset.open).showModal();}
 if(b.dataset.close)$('#'+b.dataset.close).close();
 if(!activity)return;
 if(b.dataset.item){selectItem(b.dataset.item);$('#library').close();}
 if(b.dataset.choice)choose(b.dataset.choice);
 if(b.dataset.xrChoice)choose(b.dataset.xrChoice);
 if(b.dataset.mode)setMode(b.dataset.mode);
 if(b.dataset.intent)assist(b.dataset.intent);
 if(b.dataset.view){if(b.dataset.view==='reset')scene?.reset();else scene?.zoom(b.dataset.view==='in'?.9:1.1);}
 if(b.dataset.xr){audio.stop();try{await scene.enterXR(b.dataset.xr,$('#xr-overlay'));$('#xr-overlay').hidden=false;$('#xr-guidance').textContent=b.dataset.xr==='ar'?'حرّك الهاتف ببطء حتى تظهر دائرة، ثم المس لوضع الجهاز.':'استخدم مؤشر النظارة لاختيار المصدر. زر خروج يعيدك إلى الشاشة.';}catch{$('#xr-status').textContent='تعذر بدء العرض. تابع استكشاف المجسم على الشاشة.';}}
 if(b.id==='xr-exit')scene?.exitXR();
 if(b.id==='xr-recenter'){if(scene?.xrMode==='ar'){scene.placed=false;scene.world.visible=false;}else scene?.world.position.set(0,-.55,-3);}
});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)audio.unlocked=true;},{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
if(activity)await startActivity();else if(document.body.dataset.page==='about')renderAbout();else renderHome();
soundButton();
await mountVoiceSettings(audio);
// Inspection handle for browser integration tests; no private student data is collected.
window.lab={get state(){return state;},get scene(){return scene;},get progress(){return progress;},get camera(){return camera;},selectItem,choose,submit,audio};



