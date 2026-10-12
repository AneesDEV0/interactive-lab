import {DISCOVERY_KEY, readDiscovery, recordDiscovery, saveDiscovery} from './discovery.js';
import { activities, activityById, itemById, optionsFor, contentFor, pageFor, discoveryFor } from './catalog.js';
import { readProgress, saveProgress, recordSuccess, newAttempt, transition, guidance, parseIntent } from './learning.js';
import { header, footer, helpDialog, ActivityLayout, DiscoveryLayout, ItemPicker, esc, num, modal } from './components.js';
import { AudioManager } from './audio-manager.js';
import { mountVoiceSettings } from './voice-settings.js';
import { mountPWA } from './pwa.js';
import { CameraCapture } from './camera.js';
import { icon } from '../electricity/icons.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let progress=readProgress(storage),scene=null,state=null,camera=null,currentText='',soundState='idle',loadRevision=0;
const activity=activityById(document.body.dataset.activity);
const discovering=document.body.dataset.kind==='discover';
let discovery=readDiscovery(storage);
const audio=new AudioManager(status=>{soundState=status;const message={unavailable:'لا يتوفر صوت عربي محلي. تابع الشرح المكتوب.', 'missing-recording':'هذه العبارة بلا تسجيل بعد. تابع النص، أو اختر قراءة الجهاز من إعدادات الصوت.', 'recording-error':'تعذر تشغيل التسجيل. أعد المحاولة أو تابع النص.', playing:'يُقرأ الشرح الآن…'}[status]||'';for(const el of [$('#sound-status'),$('#voice-preview-status')])if(el)el.textContent=message;const listen=$('#listen span');if(listen)listen.textContent=status==='playing'?'إيقاف الشرح':'اسمع الشرح';if(state)state.audioStatus=status;});
function soundButton(){const b=$('#sound-toggle');b.setAttribute('aria-pressed',String(audio.enabled));b.innerHTML=icon(audio.enabled?'sound':'mute')+`<span>${audio.enabled?'كتم الصوت':'تشغيل الصوت'}</span>`;}
function persist(){if(!saveProgress(storage,progress)&&$('#storage-status'))$('#storage-status').textContent='الحفظ غير متاح في هذا المتصفح. يمكنك متابعة النشاط خلال هذه الزيارة.';}
function say(text){currentText=text;if($('#guide-text'))$('#guide-text').textContent=text;audio.speak(text);scene?.updateVR();}
function renderHome(){
 const cards=kind=>activities.map(a=>{
  const page=pageFor(a,kind),records=kind==='discover'?discovery.completed:progress.completed,count=Object.keys(records[a.id]||{}).length;
  const resumeItem=a.items.find(item=>!records[a.id]?.[item.id]);
  const href=count&&resumeItem?page.href+'?item='+resumeItem.id:page.href;
  const description=kind==='discover'?{electricity:'شاهد الأجهزة واعرف مصادر طاقتها.',materials:'شاهد الأشياء واعرف ممّ صُنعت.',safety:'شاهد المواقف واعرف التصرف الآمن.',conductors:'تعرّف إلى المواد الموصلة والعازلة.'}[a.id]:a.description;
  return `<article class="activity-card ${a.color}"><a class="activity-art" href="${href}" tabindex="-1" aria-hidden="true"><img src="${a.image}" alt="" loading="lazy"><span class="art-label">${a.tag}</span></a><div class="activity-copy"><h3>${page.title}</h3><p>${description}</p><div class="card-bottom"><a class="start-link" href="${href}" aria-label="${page.title}">${count===a.items.length?'أعد النشاط':count?'أكمل النشاط':kind==='discover'?'شاهد واقرأ':'ابدأ التجربة'} <span aria-hidden="true">←</span></a><small>${count?`${num(count)} من ${num(a.items.length)} مكتمل`:kind==='discover'?'صور ومعلومات':'تجربة تفاعلية'}</small></div>${count?`<progress max="${a.items.length}" value="${count}" aria-label="تقدم ${page.title}"></progress>`:''}</div></article>`;
 }).join('');
 $('#app').innerHTML=`${header()}<main id="main" class="home-main"><section class="welcome"><div><span class="eyebrow">علوم الصف الرابع · مع شرارة</span><h1>اكتشف، ثم <em>جرّب!</em></h1><p>شاهد واقرأ في «تعرّف»، أو جرّب بنفسك في «تعلّم».</p></div>${progress.last&&Object.keys(progress.completed[progress.last.activity]||{}).length<activityById(progress.last.activity).items.length?`<a class="primary resume" href="${progress.last.activity}.html?item=${progress.last.item}">أكمل تجربتك ←</a>`:''}</section><nav class="journey-nav" aria-label="اختر نوع النشاط"><a href="#discover"><span class="journey-symbol" aria-hidden="true">${icon('book')}</span><span><strong>تعرّف</strong><small>شاهد الصور واقرأ</small></span><span aria-hidden="true">↓</span></a><a href="#experiment"><span class="journey-symbol" aria-hidden="true">${icon('play')}</span><span><strong>تعلّم</strong><small>جرّب وشاهد النتيجة</small></span><span aria-hidden="true">↓</span></a></nav><section id="discover" class="activity-group" aria-labelledby="discover-title"><div class="group-heading"><div><span class="group-symbol" aria-hidden="true">${icon('book')}</span><h2 id="discover-title">تعرّف <span>شاهد واقرأ</span></h2></div><span>٤ أنشطة</span></div><div class="activity-cards">${cards('discover')}</div></section><section id="experiment" class="activity-group" aria-labelledby="experiment-title"><div class="group-heading"><div><span class="group-symbol" aria-hidden="true">${icon('play')}</span><h2 id="experiment-title">تعلّم <span>جرّب بنفسك</span></h2></div><span>٤ أنشطة</span></div><div class="activity-cards">${cards('experiment')}</div></section><p class="home-note">${icon('shield')} كل التجارب على الشاشة. تعلّم وجرّب بأمان.</p></main>${footer()}${helpDialog()}`;
}
function persistDiscovery(){if(!saveDiscovery(storage,discovery))$('#storage-status').textContent='الحفظ غير متاح الآن. يمكنك متابعة القراءة خلال هذه الزيارة.';}
async function selectDiscovery(id,focus=false){
 const item=itemById(activity,id);if(!item)return;
 audio.stop();state=newAttempt(id,'learn');
 const fact=discoveryFor(activity,item),index=activity.items.indexOf(item),completed=discovery.completed[activity.id]||{},count=Object.keys(completed).length;
 discovery.last={activity:activity.id,item:id};persistDiscovery();
 const url=new URL(location.href);url.searchParams.set('item',id);url.searchParams.delete('mode');url.searchParams.delete('device');if(url.href!==location.href)history.replaceState(null,'',url);
 $('#item-title').textContent=item.name;
 $('#discovery-fact').textContent=fact.text;$('#fact-label').textContent=fact.label;$('#fact-value').textContent=fact.value;
 $('#card-position').textContent=`البطاقة ${num(index+1)} من ${num(activity.items.length)}`;
 $('#progress-text').textContent=`قرأت ${num(count)} من ${num(activity.items.length)}`;$('#progress').value=count;
 $('#library-grid').innerHTML=ItemPicker(activity,id,completed,true);
 $('#previous-card').disabled=index===0;$('#read-status').textContent=completed[id]?'✓ قرأت هذه البطاقة':'';
 $('#read-next').textContent=count===activity.items.length?'أنهيت القراءة ✓':'فهمت، التالي ←';
 $('#reading-complete').hidden=true;
 $('#experiment-link').href=pageFor(activity,'experiment').href+'?item='+id;
 if($('#door')){$('#door').hidden=id!=='fridge';$('#door').textContent=state.doorOpen?'أغلق باب الثلاجة':'افتح باب الثلاجة';}
 say(activity.id==='safety'?contentFor(activity,item).explanation:fact.text);
 if(focus)$('#item-title').focus({preventScroll:true});
 const rev=++loadRevision;$('#model-status').hidden=false;$('#model-status').textContent='نجهّز المجسم…';
 scene?.setState(state);
 if(scene){try{await scene.setItem(item);if(rev===loadRevision){$('#model-status').hidden=true;$('#scene').dataset.loaded=id;}}catch{if(rev===loadRevision)fallback();}}else if($('#scene .fallback-image'))fallback();
}
async function startDiscovery(){
 $('#app').innerHTML=DiscoveryLayout(activity);
 const params=new URLSearchParams(location.search),id=params.get('item')||params.get('device');
 if($('#door'))$('#door').onclick=()=>{state.doorOpen=!state.doorOpen;$('#door').textContent=state.doorOpen?'أغلق باب الثلاجة':'افتح باب الثلاجة';scene?.setState(state);};
 $('#listen').onclick=()=>soundState==='playing'?audio.stop():audio.speak(currentText,true);
 $('#previous-card').onclick=()=>selectDiscovery(activity.items[activity.items.findIndex(d=>d.id===state.id)-1]?.id,true);
 $('#read-next').onclick=()=>{
  discovery=recordDiscovery(discovery,activity,state.id);persistDiscovery();
  const completed=discovery.completed[activity.id],index=activity.items.findIndex(d=>d.id===state.id);
  const unread=[...activity.items.slice(index+1),...activity.items.slice(0,index+1)].find(d=>!completed[d.id]);
  if(unread){selectDiscovery(unread.id,true);return;}
  selectDiscovery(state.id);$('#reading-complete').hidden=false;$('#reading-complete-title').focus();
 };
 await selectDiscovery(itemById(activity,id)?.id||activity.items[0].id);
 try{const {ModelViewer}=await import('./model-viewer.js');scene=new ModelViewer($('#scene'),{error:()=>fallback(),guidance:()=>currentText,sources:()=>[],action:()=>{},placed:()=>{},ended:()=>scene.fit()},activity.id);scene.setState(state);await scene.setItem(itemById(activity,state.id));$('#model-status').hidden=true;$('#scene').dataset.loaded=state.id;}
 catch{scene?.destroy();scene=null;fallback();}
 window.addEventListener('pagehide',()=>{audio.stop();scene?.destroy();});
}
function renderAbout(){
 $('#app').innerHTML=`${header()}<main id="main" class="about-main"><a href="index.html" class="back-link">→ الأنشطة</a><h1>عن مختبر شرارة</h1><p class="lead">مختبر علوم تفاعلي لطلبة الصف الرابع الأساسي؛ نتعلّم الكهرباء وخامات البيئة بالملاحظة والتجربة.</p><section><h2>أصحاب المشروع</h2><p><strong>إعداد الباحثة: ولاء حامد الصيداوي</strong><br>باحثة ومصممة المنصة التفاعلية</p><p><strong>إشراف الدكتور: حسن ربحي مهدي</strong><br>إشراف تربوي وأكاديمي</p><p>المشروع البحثي الأصلي يستكشف توظيف الواقع المعزز والذكاء الاصطناعي لمعالجة الفاقد التعليمي. هذه النسخة تنفّذ أنشطة محلية ومساعدًا بإجابات معدّة.</p><p>جميع الحقوق محفوظة © لمنصة العلوم التفاعلية · الصف الرابع الأساسي</p></section><section><h2>التقدم على هذا الجهاز</h2><p>يُحفظ تقدم الأنشطة وتفضيل الصوت محليًا. لا تُرفع الصور أو الأسئلة إلى خادم.</p><button id="reset-progress">مسح تقدم الأنشطة</button><p id="reset-status" role="status"></p></section></main>${footer()}${helpDialog()}${modal('reset-confirm','مسح تقدم الأنشطة؟','<p>سيُمسح التقدم المحفوظ للأنشطة الثمانية على هذا الجهاز. لا يمكن التراجع عن المسح.</p><div class="input-row"><button data-close="reset-confirm">احتفظ بتقدمي</button><button id="confirm-reset">نعم، امسح التقدم</button></div>')}`;
 $('#reset-progress').onclick=()=>$('#reset-confirm').showModal();$('#confirm-reset').onclick=()=>{try{for(const key of [DISCOVERY_KEY,'sharara-progress-v3','sharara-discoveries-v2','khabeer-materials-discoveries-v1','captain-safety-discoveries-v1','professor-conductors-discoveries-v1','sharara-attempts-v3'])storage.removeItem(key);$('#reset-status').textContent='تم مسح تقدم الأنشطة.';}catch{$('#reset-status').textContent='تعذر مسح التقدم من هذا المتصفح.';}$('#reset-confirm').close();};
}
function circuitMarkup(item){const tested=state.tested,lit=tested&&item.category==='conductive';return `<svg viewBox="0 0 340 150" role="img" aria-label="${tested?lit?'دائرة ومصباح مضيء':'دائرة ومصباح مطفأ':'دائرة تنتظر اختبار المادة'}" class="circuit-svg ${lit?'lit':''}"><path class="wire" d="M65 65H125M215 65H280V125H65V85"/><path class="wire sample" d="M125 65H215" ${tested?'':'stroke-dasharray="5 5"'}/><rect x="50" y="60" width="30" height="34" rx="4" fill="#8c75bd"/><text x="65" y="84" text-anchor="middle" fill="white">+</text><circle class="bulb" cx="280" cy="65" r="23"/><path d="M270 57l20 16m-20 0l20-16" stroke="#665d77" stroke-width="2"/><rect x="121" y="46" width="98" height="38" rx="9" fill="#eeeaf6"/><text x="170" y="70" text-anchor="middle" fill="#302844" font-size="13">${esc(item.label)}</text></svg><p class="circuit-status">${tested?lit?'أضاء المصباح. ماذا تستنتج؟':'بقي المصباح مطفأً. ماذا تستنتج؟':'المصباح ينتظر تجربتك.'}</p>`;}
function render(){
 const item=itemById(activity,state.id),count=Object.keys(progress.completed[activity.id]||{}).length,done=state.phase==='success';
 $('#item-title').textContent=item.label;$('#instruction').textContent=done?'لاحظ ما اكتشفته':activity.id==='conductors'&&state.tested?'ماذا يخبرك ضوء المصباح؟':activity.instruction;
 $('#progress-text').textContent=`${num(count)} من ${num(activity.items.length)} مكتمل`;$('#progress').value=count;
 $('#item-picker').innerHTML=ItemPicker(activity,state.id,progress.completed[activity.id]);$('#library-grid').innerHTML=ItemPicker(activity,state.id,progress.completed[activity.id],true);

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
 $('#discovery-link').href=pageFor(activity,'discover').href+'?item='+state.id;
 $('#stage-result').hidden=!done;$('#stage-result').textContent=activity.id==='materials'?'✓ وجدت الخامة المناسبة!':activity.id==='safety'?'✓ عرفت التصرف!':activity.id==='conductors'?'✓ اكتشفت نوع المادة!':'✓ نجح التشغيل!';
 if(done){const answer=$('#answer-controls [aria-pressed="true"]');answer?.classList.add('answer-correct');if(answer&&activity.id==='materials'){answer.insertAdjacentHTML('afterbegin',`<img class="sorted-item" src="${item.thumbnail}" alt="${esc(item.label)}">`);}}
 $('#xr-answer-controls').innerHTML=optionsFor(activity,item).map(o=>`<button data-xr-choice="${o.id}" aria-pressed="${state.choice===o.id}">${o.name}</button>`).join('');
 $('#xr-submit').disabled=!state.choice||done;$('#xr-next').hidden=!done;
 $('#door').hidden=state.id!=='fridge';$('#door').textContent=state.doorOpen?'أغلق باب الثلاجة':'افتح باب الثلاجة';
 scene?.setState(state);
}
let attempts={};try{const saved=JSON.parse(storage.getItem('sharara-attempts-v3')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))attempts=saved;}catch{}
function rememberAttempt(){const key=activity.id+':'+state.id;attempts[key]={attempts:state.attempts,hints:state.hints,revealed:state.revealed};try{storage.setItem('sharara-attempts-v3',JSON.stringify(attempts));}catch{}}
async function selectItem(id){
 const item=itemById(activity,id);if(!item)return;
 audio.stop();state=newAttempt(id,'play');
 const saved=attempts[activity.id+':'+id];if(saved&&typeof saved==='object'){state.attempts=Number.isInteger(saved.attempts)&&saved.attempts>=0?saved.attempts:0;state.hints=Number.isInteger(saved.hints)?Math.max(0,Math.min(3,saved.hints)):0;state.revealed=saved.revealed===true;}
 progress.last={activity:activity.id,item:id};persist();const url=new URL(location.href);url.searchParams.set('item',id);url.searchParams.delete('device');url.searchParams.delete('mode');if(url.href!==location.href)history.replaceState(null,'',url);
 render();say(guidance(activity,state));const rev=++loadRevision;$('#model-status').hidden=false;$('#model-status').textContent='نجهّز المجسم…';
 if(scene){try{await scene.setItem(item);if(rev===loadRevision){$('#model-status').hidden=true;$('#scene').dataset.loaded=id;}}catch{if(rev===loadRevision)fallback();}}else if($('#scene .fallback-image'))fallback();
}
function fallback(){scene?.destroy();scene=null;const d=itemById(activity,state.id);$('#scene').innerHTML=`<img class="fallback-image" src="${d.thumbnail}" alt="${esc(d.name||d.label)}">`;$('#model-status').hidden=false;$('#model-status').textContent='عرض مبسّط؛ يمكنك متابعة التجربة بالأزرار.';$$('[data-xr]').forEach(b=>b.hidden=true);if($('#xr-status'))$('#xr-status').textContent='تابع التجربة بالعرض المبسّط على الشاشة.';}
function submit(){if(scene?.xrMode==='ar'&&!scene.placed){say('ضع الجهاز على الطاولة أولًا.');return;}state=transition(activity,state,{type:'submit'});progress=recordSuccess(progress,activity,state);rememberAttempt();persist();render();say(guidance(activity,state));if(state.phase==='success')$('#next-item').focus({preventScroll:true});else $('#answer-controls [aria-pressed="true"]')?.focus({preventScroll:true});}
function choose(choice){state=transition(activity,state,{type:'choose',choice});if(activity.id==='electricity'){render();say(guidance(activity,state));$('#answer-controls [aria-pressed="true"]')?.focus({preventScroll:true});}else submit();}
function next(){if(Object.keys(progress.completed[activity.id]||{}).length===activity.items.length){location.href='index.html';return;}const index=activity.items.findIndex(d=>d.id===state.id);const candidates=[...activity.items.slice(index+1),...activity.items.slice(0,index+1)];selectItem(candidates.find(d=>!progress.completed[activity.id]?.[d.id]).id);}
async function startActivity(){
 $('#app').innerHTML=ActivityLayout(activity);
 const params=new URLSearchParams(location.search),id=params.get('item')||params.get('device');state=newAttempt(itemById(activity,id)?.id||activity.items[0].id,'play');
 camera=new CameraCapture(activity,id=>selectItem(id),status=>{state.cameraStatus=status;});
 $('#submit-answer').onclick=submit;$('#next-item').onclick=next;
 $('#xr-submit').onclick=submit;$('#xr-next').onclick=next;
 $('#stop-device').onclick=()=>{state.running=false;render();say('توقّف الجهاز. يمكنك الانتقال إلى العنصر التالي.');};
 $('#test-material').onclick=()=>{state=transition(activity,state,{type:'test'});render();say(guidance(activity,state));$('#answer-controls button')?.focus({preventScroll:true});};
 $('#door').onclick=()=>{state.doorOpen=!state.doorOpen;render();};
 $('#listen').onclick=()=>soundState==='playing'?audio.stop():audio.speak(currentText,true);
 $('#ask-form').onsubmit=e=>{e.preventDefault();assist(parseIntent($('#ask-input').value));$('#ask-input').value='';};
 $('#drag-card').addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',state.id);e.dataTransfer.effectAllowed='move';});
 $('#answer-controls').addEventListener('dragover',e=>{if(e.target.closest('[data-bin]'))e.preventDefault();});
 $('#answer-controls').addEventListener('drop',e=>{e.preventDefault();const b=e.target.closest('[data-bin]');if(b&&e.dataTransfer.getData('text/plain')===state.id)choose(b.dataset.bin);});
 await selectItem(state.id);
 try{const {ModelViewer}=await import('./model-viewer.js');scene=new ModelViewer($('#scene'),{error:()=>fallback(),guidance:()=>currentText,sources:()=>optionsFor(activity,itemById(activity,state.id)),action:id=>{if(id==='exit')scene.exitXR();else if(id==='next')next();else if(id==='try')submit();else if(id==='stop'&&state.running){state.running=false;render();say('توقّف الجهاز. يمكنك الانتقال إلى العنصر التالي.');}else if(id==='listen'||id==='stop')audio.speak(currentText,true);else choose(id);},placed:()=>say('أصبح الجهاز على الطاولة. تابع تجربتك.'),ended:()=>{$('#xr-overlay').hidden=true;scene.fit();}},activity.id);scene.setState(state);await scene.setItem(itemById(activity,state.id));$('#model-status').hidden=true;$('#scene').dataset.loaded=state.id;}
 catch{scene?.destroy();scene=null;fallback();}
 await checkXR();
 window.addEventListener('pagehide',()=>{audio.stop();camera.close();scene?.destroy();});
}
function assist(intent){if(intent==='hint')state=transition(activity,state,{type:'hint'});if(intent==='why'&&(state.attempts||state.tested))state.revealed=true;rememberAttempt();say(guidance(activity,state,intent));}
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
 if(b.dataset.item){if(discovering)selectDiscovery(b.dataset.item,true);else selectItem(b.dataset.item);$('#library').close();}
 if(b.dataset.view){if(b.dataset.view==='reset')scene?.reset();else scene?.zoom(b.dataset.view==='in'?.9:1.1);}
 if(discovering)return;
 if(b.dataset.choice)choose(b.dataset.choice);
 if(b.dataset.xrChoice)choose(b.dataset.xrChoice);
 if(b.dataset.intent)assist(b.dataset.intent);
 if(b.dataset.xr){audio.stop();try{await scene.enterXR(b.dataset.xr,$('#xr-overlay'));$('#xr-overlay').hidden=false;$('#xr-guidance').textContent=b.dataset.xr==='ar'?'حرّك الهاتف ببطء حتى تظهر دائرة، ثم المس لوضع الجهاز.':'استخدم مؤشر النظارة لاختيار المصدر. زر خروج يعيدك إلى الشاشة.';}catch{$('#xr-status').textContent='تعذر بدء العرض. تابع استكشاف المجسم على الشاشة.';}}
 if(b.id==='xr-exit')scene?.exitXR();
 if(b.id==='xr-recenter'){if(scene?.xrMode==='ar'){scene.placed=false;scene.world.visible=false;}else scene?.world.position.set(0,-.55,-3);}
});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)audio.unlocked=true;},{once:true});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
// Old bookmarked reading URLs lead to the independent reading page.
if(activity&&!discovering&&new URLSearchParams(location.search).get('mode')==='learn'){const target=new URL(pageFor(activity,'discover').href,location.href);const old=new URLSearchParams(location.search);const id=old.get('item')||old.get('device');if(itemById(activity,id))target.searchParams.set('item',id);location.replace(target.href);}else{
if(activity&&discovering)await startDiscovery();else if(activity)await startActivity();else if(document.body.dataset.page==='about')renderAbout();else renderHome();
soundButton();
await mountVoiceSettings(audio);
mountPWA();
// Inspection handle for browser integration tests; no private student data is collected.
window.lab={get state(){return state;},get scene(){return scene;},get progress(){return progress;},get discovery(){return discovery;},get camera(){return camera;},selectItem,choose,submit,audio};
}



