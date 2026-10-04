import {config,copy,deviceNames,msg,DEVICE_MAP} from './config.js';
import {initialState,reducer,explorationDone,quizDone,validAction,nextActions} from './state.js';
import {answerQuestion,normalize} from './knowledge.js';
import {icon,robotSvg} from './icons.js';
import {stopAudio,radioTune,speak,speakIntro,speakToolPick,speakDropSuccess,speakDropIncompatible,speakHint} from './audio.js';
import {launchArGateway} from './ar.js';

// التأكد من استرجاع التفضيلات العامة فقط (الصوت، تقليل الحركة، اللغة) دون حفظ حالة الأجهزة أو التوصيل
let rawPrefs = {};
try { rawPrefs = JSON.parse(localStorage.getItem('sharara-preferences') || '{}'); } catch {}
const prefs = {
  muted: typeof rawPrefs.muted === 'boolean' ? rawPrefs.muted : true,
  reducedMotion: typeof rawPrefs.reducedMotion === 'boolean' ? rawPrefs.reducedMotion : (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false),
  language: rawPrefs.language === 'en' ? 'en' : 'ar',
  ageRange: Array.isArray(rawPrefs.ageRange) ? rawPrefs.ageRange : [6, 9]
};

// تفريغ أي تخزين مؤقت قديم للتوصيل لضمان بدء التجربة نظيفة تماماً في كل Reload
try {
  sessionStorage.removeItem('sharara-session');
  sessionStorage.removeItem('sharara-state');
  localStorage.removeItem('sharara-state');
  localStorage.removeItem('sharara-connections');
} catch {}

let state = initialState(prefs);
let scene = null, seq = 0, pendingDevice = null, drag = null, idleTimer = null, modalOpener = null, tutorial = false;
const history = [], counts = new Map(), app = document.querySelector('#app');

const $ = s => document.querySelector(s);
const t = () => copy[state.language];
const name = id => deviceNames[state.language][id] || id;
const shortName = id => {
  const shortMap = {
    car: 'السيارة', toyCar: 'سيارة ألعاب', radio: 'الراديو', flashlight: 'شعلة جيب',
    wallClock: 'ساعة جدار', remote: 'الريموت', calculator: 'الحاسبة', digitalScale: 'الميزان',
    smokeDetector: 'كاشف دخان', laserPointer: 'قلم ليزر', hearingAid: 'سماعة أذن', robotToy: 'الروبوت',
    electricToothbrush: 'فرشاة أسنان', fridge: 'الثلاجة', microwave: 'الميكروويف', washer: 'الغسالة',
    airConditioner: 'المكيف', vacuum: 'المكنسة', lamp: 'المصباح', electricOven: 'الفرن',
    iron: 'المكواة', hairDryer: 'الاستشوار', electricWaterHeater: 'سخان ماء', electricHeater: 'المدفأة',
    blender: 'الخلاط'
  };
  return state.language === 'ar' ? (shortMap[id] || name(id)) : name(id);
};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function button(action, label, ico, cls = '', extra = '') {
  return `<button type="button" class="${cls}" data-action="${action}" ${extra}>${ico ? icon(ico) : ''}<span>${label}</span></button>`;
}

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playClickSound() {
  if (state.muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.05);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.05);
  } catch {}
}

function playSuccessSound() {
  if (state.muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50], t = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), start = t + idx * 0.07, dur = 0.28;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + dur);
    });
  } catch {}
}

function playErrorSound() {
  if (state.muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const freqs = [240, 180], t = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), start = t + idx * 0.09, dur = 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + dur);
    });
  } catch {}
}

function showCentralFeedback(d, tool, isSuccess, message) {
  updateLiveFeedback(d, tool, isSuccess, message);
}

function updateLiveFeedback(d, tool, isSuccess, message) {
  const meta = DEVICE_MAP[d];
  const pill = $('#live-feedback-pill');
  const devTag = $('#live-feedback-device');
  const textEl = $('#live-feedback-text');
  const bar = $('#bottom-feedback-bar');

  if (!bar) return;

  bar.classList.remove('feedback-animated');
  const av = bar.querySelector('.feedback-spark-avatar');
  if (av) av.classList.remove('avatar-bounce');
  void bar.offsetWidth;
  bar.classList.add('feedback-animated');
  if (av) av.classList.add('avatar-bounce');

  if (isSuccess) {
    playSuccessSound();
    if (pill) {
      pill.textContent = tool === 'battery' ? '🎉 تم التشغيل بالبطارية 🔋' : '⚡ تم التشغيل بالكهرباء 🔌';
      pill.className = 'feedback-status-pill pill-success';
    }
    if (devTag) {
      devTag.textContent = (meta ? meta.name : d) + ' (يعمل الآن)';
    }
    if (textEl) {
      textEl.textContent = message || (meta ? meta.reason : 'تم تشغيل الجهاز بنجاح!');
    }
    bar.classList.remove('pulse-success', 'pulse-warning');
    void bar.offsetWidth;
    bar.classList.add('pulse-success');
  } else {
    playErrorSound();
    if (pill) {
      pill.textContent = '💡 توجيه علمي من شرارة';
      pill.className = 'feedback-status-pill pill-warning';
    }
    if (devTag) {
      devTag.textContent = (meta ? meta.name : d) + ' (لم يعمل)';
    }
    if (textEl) {
      textEl.textContent = message || (meta ? meta.wrongReason : 'الجهاز غير متوافق.');
    }
    bar.classList.remove('pulse-success', 'pulse-warning');
    void bar.offsetWidth;
    bar.classList.add('pulse-warning');
  }
}

function hideCentralFeedback() {
  const modal = $('#central-feedback');
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
  }
}

function shell() {
  const c = t();
  const currentIds = Object.keys(state.devices);
  const navBase = typeof window !== 'undefined' && window.location.pathname.includes('/public/') ? '../' : './';

  app.innerHTML = `
   <header class="header compact-header">
     <a class="brand" href="${navBase}index.html" aria-label="${c.brand}">
       <span class="brand-mark">${icon('bolt')}</span>
       <span><strong>${c.brand} 3D</strong><small>${c.tagline}</small></span>
     </a>
     <nav class="top-actions" aria-label="${c.settings}">
       <a href="${navBase}index.html" class="nav-link-btn" title="الرئيسية">🏠 <span>الرئيسية</span></a>
       <a href="${navBase}static-lab.html" class="nav-link-btn" title="النشاط الثابت">🔍 <span>الثابت</span></a>
       <button type="button" class="header-ar-launch-btn" data-action="launchAR" title="فتح كاميرا الواقع المعزز الحقيقي">📷 <span>الواقع المعزز AR</span></button>
       ${button('sound', state.muted ? c.muted : c.sound, state.muted ? 'muted' : 'volume', 'quiet', 'id="sound-button"')}
       ${button('compare', c.compare, 'book', 'quiet', 'id="comparison-button" title="جدول الاكتشافات"')}
       ${button('chat', c.chat, 'chat', 'quiet', 'id="chat-toggle" aria-expanded="false" title="تحدث مع شرارة"')}
       ${button('settings', c.settings, 'settings', 'icon-only', 'title="الإعدادات"')}
     </nav>
   </header>

   <main class="lab-main-100vh">
     <div class="workspace">
       <div class="scene-wrap">
         <div id="scene" role="img" aria-label="${c.lab}"></div>
         <div class="scene-top">
           <span class="room-tag"><i></i>${c.available}</span>
           <div class="camera-tools">
             ${button('zoomIn', c.zoomIn, 'plus', 'icon-only')}
             ${button('zoomOut', c.zoomOut, 'minus', 'icon-only')}
             ${button('resetView', c.resetView, 'refresh', 'icon-only')}
           </div>
         </div>
         <div id="scene-labels" class="scene-labels-stack">
            ${currentIds.map(id => `<button class="scene-label-stack-item" data-action="device" data-device="${id}" data-target="${id}" id="label-${id}"><span class="label-status-dot" id="dot-${id}">○</span><strong class="label-name">${shortName(id)}</strong><span class="label-badge badge-off" id="badge-${id}">متوقف</span></button>`).join('')}
          </div>
         <div id="fallback-panel" hidden>
           <div class="fallback-illustration">${icon('battery')}${icon('car')}${icon('radio')}${icon('fridge')}</div>
           <h2>${c.fallback}</h2>
           <p>${c.guide}</p>
         </div>
         <div class="scene-caption">${icon('hand')}<span id="scene-guide">${c.guide}</span></div>

         <!-- أدوات الطاقة المباشرة المبسطة بملصقات واضحة وإيموجي للأطفال -->
          <div class="table-power-dock" id="table-power-dock">
            <button id="battery-button" data-action="pick" class="dock-power-btn battery-dock-btn" aria-pressed="false" title="اسحب البطارية لأي جهاز لتجربتها">
              <span class="power-emoji">🔋</span>
              <span class="power-title">بطارية جافة</span>
            </button>
            <button id="mains-button" data-action="pickMains" class="dock-power-btn mains-dock-btn" aria-pressed="false" title="اسحب الفيشة لأي جهاز لتجربتها">
              <span class="power-emoji">🔌</span>
              <span class="power-title">فيشة الكهرباء الرئيسية</span>
            </button>
          </div>

           

         <div id="intro" class="intro-card">
           <span class="intro-bolt">${icon('bolt')}</span>
           <h2>${c.welcome}</h2>
           <p>${c.intro}</p>
           ${button('start', c.start, 'arrow', 'primary')}
         </div>
         <div id="tutorial" class="tutorial-card" hidden>
           <div class="tutorial-path">${icon('battery')}<span>······</span>${icon('car')}</div>
           <h2>${c.tutorialTitle}</h2>
           <p>${c.tutorial}</p>
           ${button('doneTutorial', c.doneTutorial, 'check', 'primary')}
           ${button('doneTutorial', c.skipTutorial, null, 'text-button')}
         </div>
       </div>

       <!-- شريط التغذية الراجعة الحي والمباشر أسفل الطاولة (بديل الكروت والـ alert) -->
       <section class="bottom-feedback-bar" id="bottom-feedback-bar" aria-live="polite">
         <div class="feedback-avatar-wrap">
           <div class="feedback-spark-avatar">⚡</div>
           <div class="feedback-spark-pulse"></div>
         </div>
         <div class="feedback-content">
           <div class="feedback-header-row">
             <span class="feedback-status-pill" id="live-feedback-pill">⚡ جاهز للاستكشاف</span>
             <strong class="feedback-device-tag" id="live-feedback-device">اسحب بطارية 🔋 أو فيشة 🔌 إلى أي جهاز</strong>
             <div class="active-power-summary" id="active-power-summary">
               <span class="active-count-chip" id="active-count-chip">🔋 المشغلة: <b id="running-count-num">0</b> / 4</span>
             </div>
           </div>
           <p class="live-feedback-text" id="live-feedback-text">${state.message || c.intro}</p>
         </div>
         <div class="feedback-bar-actions">
           <button type="button" class="bar-reset-btn" data-action="reset" title="توليد 4 أجهزة عشوائية جديدة">
             🔄 <span>أجهزة جديدة</span>
           </button>
         </div>
       </section>

       <!-- عناصر التوافق مع الاختبارات وقارئات الشاشة -->
       <div class="sr-only">
         <span id="progress-count">0 / 4</span>
         <i id="progress-fill"></i>
         <p id="progress-text">${c.notYet}</p>
         <p id="message" role="status" aria-live="polite" aria-atomic="true">${c.intro}</p>
         <div id="suggestions" class="suggestions"></div>
         <div id="accessible-cards">
           ${currentIds.map(id => `
             <article id="card-${id}" data-target="${id}">
               <button data-action="device" data-device="${id}">${name(id)}</button>
               <button data-action="inspect" data-device="${id}">تدوير وتفحص</button>
               <button data-action="power" data-device="${id}">تشغيل</button>
               <span id="status-${id}"></span>
               <span id="check-${id}"></span>
             </article>
           `).join('')}
         </div>
       </div>

       <!-- شريط تذييل مدمج وخفيف -->
       <footer class="compact-footer sr-only">
         <span>${icon('shield')}${c.safety}</span>
         ${button('reset', c.reset, 'refresh', 'text-button')}
       </footer>
     </div>
   </main>

   <!-- النافذة المركزية المنبثقة للتغذية الراجعة المباشرة أمام الطالب -->
   <div id="central-feedback" class="central-feedback-overlay" hidden style="display: none;">
     <div class="central-feedback-card" id="central-feedback-card">
       <div class="feedback-badge" id="feedback-badge">🎉 أحسنت بطلنا الصغير!</div>
       <div class="feedback-icon" id="feedback-icon">⚡</div>
       <h3 class="feedback-title" id="feedback-title">اسم الجهاز</h3>
       <p class="feedback-message" id="feedback-message">نص التغذية الراجعة</p>
       <button type="button" class="feedback-confirm-btn" id="feedback-confirm-btn" data-action="closeCentralFeedback">
         <span>متابعة التجربة 🚀</span>
       </button>
     </div>
   </div>

   <aside id="chat-panel" hidden aria-label="${c.chat}">
     <div class="chat-heading">
       <span class="tiny-robot">${icon('bolt')}</span>
       <div><strong>${c.robot}</strong><small>${c.robotRole}</small></div>
       ${button('chat', c.close, 'close', 'icon-only', 'id="chat-close"')}
     </div>
     <div id="chat-history" role="log" aria-live="polite"></div>
     <div class="quick-questions">
       ${(state.language === 'ar' ? ['ماذا أفعل؟', 'لماذا لم يعمل؟', 'هل البطارية فيها كهرباء؟'] : ['What do I do next?', 'Why is it off?', 'Does a battery have electricity?']).map(q => button('quickQuestion', q, null, 'question-chip', `data-question="${q}"`)).join('')}
     </div>
     <form id="chat-form">
       <label class="sr-only" for="question">${c.ask}</label>
       <input id="question" maxlength="600" autocomplete="off" placeholder="${c.ask}"/>
       <button type="submit" class="primary icon-only" aria-label="${c.send}">${icon('send')}</button>
     </form>
     <p class="chat-info">${c.chatInfo}</p>
   </aside>

   <dialog id="dialog"><div id="dialog-content"></div></dialog>
   <div id="drag-ghost" hidden></div>
  `;

  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

  $('#dialog').addEventListener('cancel', () => { pendingDevice = null; if (state.batteryLocation === 'held' || state.mainsLocation === 'held') dispatch({type: 'CANCEL_DRAG'}); });
  $('#dialog').addEventListener('close', () => { modalOpener?.focus?.(); });
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); ask($('#question').value); $('#question').value = ''; });
  
  // تفعيل سحب وإفلات البطاريات والفيشات باللمس الحقيقي للجوالات والماوس للديسكتوب
  initTouchDragSupport();

  // إغلاق نافذة التغذية الراجعة المركزية
  $('#feedback-confirm-btn')?.addEventListener('click', hideCentralFeedback);
  $('#central-feedback')?.addEventListener('click', e => { if (e.target.id === 'central-feedback') hideCentralFeedback(); });
  
  render();
}

function dispatch(event) {
  const old = state;
  state = reducer(state, {id: `${state.sessionRevision}:${++seq}`, sessionRevision: state.sessionRevision, ...event});
  if (state === old) return;

  if (event.type === 'RESET') {
    stopAudio();
    history.length = 0;
    counts.clear();
    pendingDevice = null;
    drag = null;
    tutorial = false;
    $('#drag-ghost').hidden = true;
    hideCentralFeedback();
    closeDialog();
    shell();
    scene?.reset();
    resetIdle();
    return;
  }

  if (state.muted || (state.devices.radio && state.devices.radio.status !== 'running') || ['PICK_BATTERY', 'PICK_MAINS'].includes(event.type)) stopAudio();
  if (!state.muted && state.devices.radio && state.devices.radio.status === 'running' && (old.devices.radio?.status !== 'running' || old.muted)) playRadio();

  if (['SET_MUTED', 'SET_REDUCED_MOTION', 'SET_LANGUAGE', 'SET_AGE'].includes(event.type)) {
    try { localStorage.setItem('sharara-preferences', JSON.stringify({muted: state.muted, reducedMotion: state.reducedMotion, language: state.language, ageRange: state.ageRange})); } catch {}
  }

  render();
  if (event.type === 'DROP_ON_DEVICE') {
    const d = event.device;
    const isSuccess = state.devices[d]?.status === 'running';
    const tool = state.devices[d]?.source || event.tool || 'battery';
    showCentralFeedback(d, tool, isSuccess, state.message);
    if (!state.muted) {
      if (isSuccess) {
        speakDropSuccess(name(d), DEVICE_MAP[d]?.reason);
      } else {
        speakDropIncompatible(name(d), DEVICE_MAP[d]?.wrongReason);
      }
    }
  }
  if (!['IDLE', 'CHAT_RESPONSE'].includes(event.type)) resetIdle();
}

function resetIdle() {
  clearTimeout(idleTimer);
  const revision = state.sessionRevision;
  idleTimer = setTimeout(() => dispatch({type: 'IDLE', sessionRevision: revision}), config.idleMs);
}

function actionLabel(a) {
  const c = t();
  return a.id === 'select_device' ? `${state.language === 'ar' ? 'جرّب' : 'Try'} ${name(a.device)}`
    : a.id === 'show_mains_demo' ? 'توصيل بالفيشة'
    : a.id === 'open_comparison' ? c.compare
    : a.id === 'restart' ? c.reset
    : a.id === 'pick_battery' ? c.pick
    : c.hint;
}

function actionsHTML(actions) {
  return actions.filter(a => validAction(state, a)).map(a => `<button class="action-chip" data-action="suggested" data-suggestion="${escape(JSON.stringify(a))}">${escape(actionLabel(a))}${icon('arrow')}</button>`).join('');
}

function render() {
  if (!$('#message')) return;
  const c = t();
  const currentIds = Object.keys(state.devices);

  document.body.classList.toggle('reduced-motion', state.reducedMotion);
  document.body.classList.toggle('holding-battery', state.batteryLocation === 'held' || state.mainsLocation === 'held');

  $('#intro').hidden = !['intro', 'loading', 'recoverable_error'].includes(state.phase);
  $('#tutorial').hidden = !tutorial;
  $('#intro button').disabled = state.phase === 'loading';

  $('#message').textContent = state.phase === 'intro' ? c.intro : state.message || c.intro;
  $('#suggestions').innerHTML = state.phase === 'exploring' ? (state.messageKey === 'idle' ? button('hint', c.yes, 'bolt', 'action-chip') + button('dismissHint', c.quitHint, null, 'text-button') : actionsHTML(nextActions(state))) : '';

  $('#sound-button').innerHTML = icon(state.muted ? 'muted' : 'volume') + `<span>${state.muted ? c.muted : c.sound}</span>`;
  $('#sound-button').setAttribute('aria-pressed', String(!state.muted));

  // حالة زر البطارية
  const heldBat = state.batteryLocation === 'held';
  const batBtn = $('#battery-button');
  if (batBtn) {
    batBtn.setAttribute('aria-pressed', String(heldBat));
    batBtn.classList.toggle('selected', heldBat);
    batBtn.disabled = ['intro', 'loading', 'recoverable_error'].includes(state.phase);
    const batTitle = batBtn.querySelector('.power-title');
    if (batTitle) batTitle.textContent = heldBat ? 'اسحب للجهاز ✋' : 'بطارية جافة';
  }

  // حالة زر الفيشة
  const heldMains = state.mainsLocation === 'held';
  const mainsBtn = $('#mains-button');
  if (mainsBtn) {
    mainsBtn.setAttribute('aria-pressed', String(heldMains));
    mainsBtn.classList.toggle('selected', heldMains);
    mainsBtn.disabled = ['intro', 'loading', 'recoverable_error'].includes(state.phase);
    const mainsTitle = mainsBtn.querySelector('.power-title');
    if (mainsTitle) mainsTitle.textContent = heldMains ? 'اسحب للجهاز ✋' : 'فيشة الكهرباء الرئيسية';
  }

  // تحديث عداد الأجهزة المشغلة على شريط التغذية الراجعة
  const runningDevs = Object.values(state.devices).filter(d => d.status === 'running');
  const countNumEl = $('#running-count-num');
  if (countNumEl) countNumEl.textContent = runningDevs.length;

  $('#scene-guide').textContent = (heldBat || heldMains) ? 'أسقط المصدر قرب الجهاز المناسب' : c.guide;

  for (const id of currentIds) {
    const d = state.devices[id] || {status: 'off'};
    const found = state.exploredDevices.includes(id);

    const statusEl = $('#status-' + id);
    if (statusEl) statusEl.textContent = `${c.now}: ${c[d.status] || d.status}${d.source ? ' · ' + (d.source === 'battery' ? c.battery : 'فيشة رئيسية') : ''}`;

    const labelBadge = $('#badge-' + id);
    const dotEl = $('#dot-' + id);
    if (labelBadge) {
      if (d.status === 'running') {
        labelBadge.textContent = d.source === 'battery' ? 'شغال (بطارية)' : 'شغال (كهرباء)';
        labelBadge.className = 'label-badge badge-running';
        if (dotEl) dotEl.textContent = '⚡';
      } else {
        labelBadge.textContent = 'متوقف';
        labelBadge.className = 'label-badge badge-off';
        if (dotEl) dotEl.textContent = '○';
      }
    }

    const cardEl = $('#card-' + id);
    if (cardEl) {
      cardEl.classList.toggle('selected', state.selectedDevice === id);
      cardEl.classList.toggle('running', d.status === 'running');
    }

    const lblEl = $('#label-' + id);
    if (lblEl) lblEl.classList.toggle('running', d.status === 'running');

    const chkEl = $('#check-' + id);
    if (chkEl) chkEl.innerHTML = found ? icon('check') : '○';

    document.querySelectorAll(`[data-action="device"][data-device="${id}"]`).forEach(b => {
      b.disabled = ['intro', 'loading', 'recoverable_error'].includes(state.phase);
      b.setAttribute('aria-pressed', String(state.selectedDevice === id));
    });
  }

  $('#progress-count').textContent = `${state.exploredDevices.length} / ${currentIds.length}`;
  $('#progress-fill').style.width = `${(state.exploredDevices.length / currentIds.length) * 100}%`;
  $('#progress-text').textContent = explorationDone(state) ? msg(state, 'explored') : state.exploredDevices.length ? `${state.language === 'ar' ? 'جرّبت' : 'Explored'} ${state.exploredDevices.length} / ${currentIds.length} ${state.language === 'ar' ? 'أجهزة' : 'devices'}` : c.notYet;

  $('#comparison-button').disabled = !state.exploredDevices.length;

  const wasOpen = !$('#chat-panel').hidden;
  $('#chat-panel').hidden = !state.chatOpen;
  $('#chat-toggle').setAttribute('aria-expanded', String(state.chatOpen));
  if (state.chatOpen && !wasOpen) setTimeout(() => $('#question')?.focus(), 0);

  $('#fallback-panel').hidden = state.rendererStatus !== 'fallback';
  $('#scene-labels').hidden = state.rendererStatus === 'fallback';
  if (state.rendererStatus === 'fallback') $('#scene canvas')?.setAttribute('hidden', '');

  if (state.chatOpen) renderChat();
}

function openDialog(html) {
  modalOpener = document.activeElement;
  $('#dialog-content').innerHTML = html;
  if (!$('#dialog').open) $('#dialog').showModal();
}

function closeDialog() {
  $('#dialog')?.close();
}

function dialogHeader(title) {
  return `<div class="dialog-heading"><h2>${title}</h2>${button('closeDialog', t().close, 'close', 'icon-only')}</div>`;
}

function testWithBattery(id) {
  closeDialog();
  if (state.attemptsByDevice[id] === 0 && state.predictionByDevice[id] === null) {
    showPrediction(id, true);
    return;
  }
  if (state.batteryLocation !== 'held') dispatch({type: 'PICK_BATTERY'});
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool: 'battery'});
}

function testWithMains(id) {
  closeDialog();
  if (state.mainsLocation !== 'held') dispatch({type: 'PICK_MAINS'});
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool: 'mains'});
}

function showDevicePowerChoice(id) {
  const dIcon = DEVICE_MAP[id]?.icon || 'bolt';
  openDialog(`
    ${dialogHeader(name(id))}
    <div class="prediction-icon ${id}">${icon(dIcon)}</div>
    <h3 style="text-align:center;margin:10px 0 6px;">بماذا تريد تجربة ${name(id)}؟</h3>
    <p style="text-align:center;color:var(--frog);margin-bottom:18px;font-size:14px;">اختر مصدر الطاقة لاختبار الجهاز واكتشاف عمله العلمي:</p>
    <div class="dialog-actions" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button type="button" class="primary" data-action="chooseBattery" data-device="${id}" style="font-size:15px;padding:12px 20px;min-width:180px;">
        🔋 تجربة بالبطارية الجافة
      </button>
      <button type="button" class="secondary" data-action="chooseMains" data-device="${id}" style="font-size:15px;padding:12px 20px;min-width:180px;background:#2F3E36;color:#FFB703;border-color:#2F3E36;">
        🔌 توصيل بفيشة الكهرباء
      </button>
    </div>
  `);
}

function tryDevice(id) {
  // إذا كان الجهاز يعمل بالفعل، نقرة عليه تقوم بإيقافه وفصله بأمان
  if (state.devices[id]?.status === 'running') {
    if (state.devices[id].source === 'battery') {
      dispatch({type: 'REMOVE_BATTERY', device: id});
    } else {
      dispatch({type: 'REMOVE_MAINS', device: id});
    }
    return;
  }

  const isHeld = state.batteryLocation === 'held' || state.mainsLocation === 'held';
  if (!isHeld) {
    dispatch({type: 'SELECT_DEVICE', device: id});
    if (id === 'car' && state.attemptsByDevice.car === 0 && state.predictionByDevice.car === null) {
      showPrediction('car', true);
    } else {
      showDevicePowerChoice(id);
    }
    return;
  }

  const tool = state.mainsLocation === 'held' ? 'mains' : 'battery';
  if (id === 'car' && tool === 'battery' && state.attemptsByDevice.car === 0 && state.predictionByDevice.car === null) {
    showPrediction('car', true);
    return;
  }
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool});
}

function showPrediction(id, drop) {
  pendingDevice = {id, drop};
  const dIcon = DEVICE_MAP[id]?.icon || 'car';
  openDialog(`${dialogHeader(name(id))}<div class="prediction-icon ${id}">${icon(dIcon)}</div><h3>${t().prediction}</h3><p>${state.language === 'ar' ? 'لا بأس إن كانت النتيجة مختلفة. التجربة تساعدنا لنتعلم.' : 'It is okay if the result differs.'}</p><div class="dialog-actions">${button('predictYes', t().yes, null, 'primary')}${button('predictNo', t().no, null, 'secondary')}${button('predictSkip', t().skip, null, 'text-button')}</div>`);
}

function prediction(value) {
  const p = pendingDevice;
  pendingDevice = null;
  if (!p) return;
  if (value !== null) dispatch({type: 'PREDICT', device: p.id, value});
  closeDialog();
  if (p.drop) {
    if (state.batteryLocation !== 'held') dispatch({type: 'PICK_BATTERY'});
    dispatch({type: 'DROP_ON_DEVICE', device: p.id, tool: 'battery'});
  }
}

function compare() {
  dispatch({type: 'OPEN_COMPARISON'});
  const c = t();
  const currentIds = Object.keys(state.devices);

  let html = `${dialogHeader(c.compare)}<p class="comparison-intro">${c.sourceNote}</p><div class="comparison-grid">${currentIds.map(id => {
    const meta = DEVICE_MAP[id];
    const isBattery = meta?.type === 'battery';
    const factText = state.discoveredFacts.includes(id + '_battery') ? c.batteryFits : (state.discoveredFacts.includes(id + '_mains') ? c.mainsFact : (state.discoveredFacts.includes(id + '_incompatible') ? 'البطارية غير مناسبة' : c.notYet));
    return `<article>${icon(meta?.icon || 'car')}<h3>${name(id)}</h3><small>${c.now}</small><strong>${c[state.devices[id].status] || state.devices[id].status}${state.devices[id].source ? ' · ' + (state.devices[id].source === 'battery' ? c.battery : 'فيشة رئيسية') : ''}</strong><hr/><small>${c.discovered}</small><p>${factText}</p></article>`;
  }).join('')}</div><p class="fine-print">${c.symbolic}</p>`;

  if (explorationDone(state)) {
    html += `<section class="quiz"><h3>${c.challenge}</h3><p>${c.challengeIntro}</p>${currentIds.map(id => {
      const meta = DEVICE_MAP[id];
      const answered = state.quiz[id];
      return `<div class="quiz-row"><strong>${name(id)} ${answered ? icon('check') : ''}</strong><div>${button('quiz', c.battery, 'battery', answered && meta?.type === 'battery' ? 'answer-correct' : 'secondary', `data-device="${id}" data-answer="battery"`)}${button('quiz', 'فيشة رئيسية', 'home', answered && meta?.type === 'mains' ? 'answer-correct' : 'secondary', `data-device="${id}" data-answer="mains"`)}</div></div>`;
    }).join('')}<h3>${c.explain}</h3><div class="explanation-options">${button('quiz', c.explainGood, state.quiz.explanation ? 'check' : null, state.quiz.explanation ? 'answer-correct' : 'secondary', 'data-device="explanation" data-answer="design"')}${button('quiz', c.explainBad, null, 'secondary', 'data-device="explanation" data-answer="size"')}</div><p id="quiz-feedback" role="status">${['quizRight', 'quizWrong'].includes(state.messageKey) ? state.message : ''}</p>${button('complete', c.finish, 'star', 'primary', quizDone(state) ? '' : 'disabled')}</section>`;
  } else {
    html += `<div class="dialog-actions">${button('closeDialog', c.continue, 'arrow', 'primary')}</div>`;
  }
  openDialog(html);
}

function completed() {
  const c = t();
  openDialog(`${dialogHeader(c.congrats)}<div class="badge">${icon('star')}</div><h2 class="badge-title">${c.badge}</h2><p>${msg(state, 'explored')}</p><div class="dialog-actions">${button('compare', c.compare, 'book', 'primary')}${button('reset', c.reset, 'refresh', 'secondary')}</div>`);
}

function resetRequest() {
  if (!state.exploredDevices.length) {
    dispatch({type: 'RESET'});
    return;
  }
  openDialog(`${dialogHeader(t().confirm)}<p>${t().confirmBody}</p><div class="dialog-actions">${button('confirmReset', t().restart, 'refresh', 'primary')}${button('closeDialog', t().continue, null, 'secondary')}</div>`);
}

function settings() {
  openDialog(`${dialogHeader(t().settings)}<label class="setting-row">${t().language}<select id="language"><option value="ar" ${state.language === 'ar' ? 'selected' : ''}>العربية</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option></select></label><label class="setting-row">${t().motion}<input type="checkbox" id="reduced-motion" ${state.reducedMotion ? 'checked' : ''}/></label><label class="setting-row">${t().age}<select id="age"><option value="standard" ${state.ageRange[0] === 6 ? 'selected' : ''}>6–9</option><option value="younger" ${state.ageRange[0] === 4 ? 'selected' : ''}>4–6 · ${state.language === 'ar' ? 'مع بالغ' : 'with an adult'}</option></select></label><p class="fine-print">${t().chatInfo}</p>`);
  $('#reduced-motion').onchange = e => dispatch({type: 'SET_REDUCED_MOTION', value: e.target.checked});
  $('#age').onchange = e => dispatch({type: 'SET_AGE', value: e.target.value});
  $('#language').onchange = async e => {
    const language = e.target.value;
    closeDialog();
    dispatch({type: 'SET_LANGUAGE', value: language});
    scene?.dispose();
    scene = null;
    shell();
    await loadScene();
  };
}

function renderChat() {
  const c = t();
  const currentIds = Object.keys(state.devices || {});
  $('#chat-history').innerHTML = history.map(h => {
    let extraChips = '';
    if (h.response && h === history.at(-1)) {
      if (h.response.intent === 'clarify') {
        extraChips = `<div class="suggestions" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">` +
          currentIds.map(id => `<button type="button" class="action-chip" data-action="quickQuestion" data-question="${name(id)}">${name(id)} ➔</button>`).join('') +
          `</div>`;
      } else if (h.response.suggestedActions?.length) {
        extraChips = `<div class="suggestions">${actionsHTML(h.response.suggestedActions)}</div>`;
      }
    }
    return `<div class="chat-bubble ${h.role}"><strong>${h.role === 'user' ? (state.language === 'ar' ? 'أنت' : 'You') : c.robot}</strong><p>${escape(h.text)}</p>${extraChips}</div>`;
  }).join('') || `<div class="chat-bubble assistant"><p>${c.intro}</p></div>`;
  $('#chat-history').scrollTop = $('#chat-history').scrollHeight;
}

function ask(q) {
  dispatch({type: 'ASK_QUESTION'});
  const key = normalize(q), repeat = counts.get(key) || 0;
  counts.set(key, repeat + 1);
  try {
    const r = answerQuestion(q, state, {repeat, history});
    dispatch({type: 'CHAT_RESPONSE', response: r});
    history.push({role: 'user', text: String(q).slice(0, 600)}, {role: 'assistant', text: r.text, response: r});
    if (history.length > 30) history.splice(0, 2);
    renderChat();
    if (!state.muted && r?.text) {
      speak(r.text, state.language);
    }
  } catch {
    dispatch({type: 'CHAT_FAILED'});
  }
}

function runSuggested(a) {
  if (!validAction(state, a)) return;
  if (a.id === 'select_device') tryDevice(a.device);
  else if (a.id === 'show_mains_demo') dispatch({type: 'SHOW_MAINS_DEMO', device: a.device});
  else if (a.id === 'show_hint') showHint();
  else if (a.id === 'open_comparison') compare();
  else if (a.id === 'restart') resetRequest();
  else if (a.id === 'pick_battery') dispatch({type: 'PICK_BATTERY'});
  else if (a.id === 'pick_mains') dispatch({type: 'PICK_MAINS'});
}

function showHint() {
  dispatch({type: 'REQUEST_HINT'});
  ask(state.language === 'ar' ? 'أريد تلميحًا' : 'I need a hint');
}

async function playRadio() {
  const rev = state.sessionRevision;
  if (!(await radioTune()) && rev === state.sessionRevision) dispatch({type: 'AUDIO_FAILED'});
  if (rev !== state.sessionRevision || state.muted || (state.devices.radio && state.devices.radio.status !== 'running')) stopAudio();
}

let lastToolDownTime = 0;

// محرك السحب والإفلات المزدوج المتطور لشاشات اللمس (Mobile/Tablet Touch) والماوس (Desktop)
function initTouchDragSupport() {
  const batBtn = $('#battery-button');
  const mainsBtn = $('#mains-button');

  const setupBtn = (btn, tool) => {
    if (!btn) return;
    btn.style.touchAction = 'none';

    // 1. معالجة أحداث اللمس الأصلية المتجاوبة (Mobile Touch Events)
    btn.addEventListener('touchstart', e => {
      if (['intro', 'loading', 'recoverable_error'].includes(state.phase)) return;
      lastToolDownTime = Date.now();
      playClickSound();

      const touch = e.touches[0];
      if (!touch) return;

      if (tool === 'battery') dispatch({type: 'PICK_BATTERY', mode: 'touch'});
      else dispatch({type: 'PICK_MAINS', mode: 'touch'});

      drag = {
        tool,
        startX: touch.clientX,
        startY: touch.clientY,
        x: touch.clientX,
        y: touch.clientY,
        moved: false,
        isTouch: true
      };

      const g = $('#drag-ghost');
      if (g) {
        g.innerHTML = tool === 'battery' ? icon('battery') : '<span style="font-size:36px;">🔌</span>';
        g.style.left = touch.clientX + 'px';
        g.style.top = touch.clientY + 'px';
        g.hidden = false;
      }
    }, { passive: false });

    // 2. أحداث المؤشر والماوس لأجهزة الديسكتوب
    btn.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return; // تم التعامل معه مسبقاً عبر touchstart
      toolDown(tool, e);
    });
  };

  setupBtn(batBtn, 'battery');
  setupBtn(mainsBtn, 'mains');
}

// السحب والإفلات للماوس على الديسكتوب
function toolDown(tool, e) {
  if (['intro', 'loading', 'recoverable_error'].includes(state.phase)) return;
  lastToolDownTime = Date.now();
  playClickSound();
  if (tool === 'battery') dispatch({type: 'PICK_BATTERY', mode: 'drag'});
  else dispatch({type: 'PICK_MAINS', mode: 'drag'});

  drag = {tool, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, isTouch: false, pointerId: e.pointerId};
  const g = $('#drag-ghost');
  if (g) {
    g.innerHTML = tool === 'battery' ? icon('battery') : '<span style="font-size:36px;">🔌</span>';
    g.style.left = e.clientX + 'px';
    g.style.top = e.clientY + 'px';
    g.hidden = false;
  }
}

// حركة اللمس المباشرة للجوالات (تمنع التمرير وتحدث موقع الشبح بسلاسة 100%)
window.addEventListener('touchmove', e => {
  if (!drag || !drag.isTouch) return;
  const touch = e.touches[0];
  if (!touch) return;

  // منع تمرير الصفحة أثناء سحب المصدر لمنع التقطيع أو الإلغاء
  e.preventDefault();

  if (Math.hypot(touch.clientX - drag.startX, touch.clientY - drag.startY) > 6) {
    drag.moved = true;
  }

  drag.x = touch.clientX;
  drag.y = touch.clientY;

  const g = $('#drag-ghost');
  if (g && drag.moved) {
    g.hidden = false;
    g.style.left = touch.clientX + 'px';
    g.style.top = touch.clientY + 'px';
  }
}, { passive: false });

// نهاية اللمس على شاشات الجوال والتابلت
window.addEventListener('touchend', e => {
  if (!drag || !drag.isTouch) return;
  const touch = e.changedTouches[0] || e.touches[0];
  const dropX = touch ? touch.clientX : drag.x;
  const dropY = touch ? touch.clientY : drag.y;
  const tool = drag.tool;
  const moved = drag.moved;

  drag = null;
  const g = $('#drag-ghost');
  if (g) g.hidden = true;

  if (!moved) {
    // لمسة سريعة بدون سحب: نطق التوجيه الصوتي للطفل
    if (!state.muted) speakToolPick(tool);
    return;
  }

  // فحص الهدف المسقط عليه الجهاز
  const el = document.elementFromPoint(dropX, dropY);
  let id = el?.closest('[data-target]')?.dataset.target;
  if (!id && el?.closest('#scene')) id = scene?.at(dropX, dropY);
  if (!id) id = scene?.at(dropX, dropY);

  const currentIds = Object.keys(state.devices);
  if (currentIds.includes(id)) {
    dispatch({type: 'DROP_ON_DEVICE', device: id, tool});
  } else {
    dispatch({type: 'DROP_OUTSIDE'});
  }
}, { passive: false });

window.addEventListener('touchcancel', () => {
  if (drag && drag.isTouch) {
    drag = null;
    const g = $('#drag-ghost');
    if (g) g.hidden = true;
    dispatch({type: 'CANCEL_DRAG'});
  }
});

// أحداث الماوس على أجهزة الكمبيوتر والمؤشر
document.addEventListener('pointermove', e => {
  if (!drag || drag.isTouch) return;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
  if (drag.moved) {
    const g = $('#drag-ghost');
    if (g) {
      g.hidden = false;
      g.style.left = e.clientX + 'px';
      g.style.top = e.clientY + 'px';
    }
  }
});

document.addEventListener('pointerup', e => {
  if (!drag || drag.isTouch) return;
  const tool = drag.tool;
  const moved = drag.moved;
  drag = null;
  const g = $('#drag-ghost');
  if (g) g.hidden = true;
  if (!moved) {
    if (!state.muted) speakToolPick(tool);
    return;
  }

  const el = document.elementFromPoint(e.clientX, e.clientY);
  let id = el?.closest('[data-target]')?.dataset.target;
  if (!id && el?.closest('#scene')) id = scene?.at(e.clientX, e.clientY);
  if (!id) id = scene?.at(e.clientX, e.clientY);

  const currentIds = Object.keys(state.devices);
  if (currentIds.includes(id)) {
    dispatch({type: 'DROP_ON_DEVICE', device: id, tool});
  } else {
    dispatch({type: 'DROP_OUTSIDE'});
  }
}, true);

document.addEventListener('pointercancel', () => {
  if (drag && !drag.isTouch) {
    drag = null;
    const g = $('#drag-ghost');
    if (g) g.hidden = true;
    dispatch({type: 'CANCEL_DRAG'});
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (drag || state.batteryLocation === 'held' || state.mainsLocation === 'held') {
      drag = null;
      pendingDevice = null;
      $('#drag-ghost').hidden = true;
      dispatch({type: 'CANCEL_DRAG'});
    }
    if (state.chatOpen) {
      dispatch({type: 'TOGGLE_CHAT'});
      $('#chat-toggle').focus();
    }
  }
});

app.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const a = b.dataset.action, c = t();

  switch (a) {
    case 'launchAR':
      launchArGateway({
        title: 'مختبر شرارة المتحرك 3D',
        mode: 'dynamic',
        onContinue: () => {
          speakIntro('dynamic');
        }
      });
      break;
    case 'start': dispatch({type: 'START'}); tutorial = true; render(); break;
    case 'doneTutorial': tutorial = false; render(); $('#battery-button').focus(); break;
    case 'help': tutorial = true; render(); break;
    case 'pick':
      if (Date.now() - lastToolDownTime < 450) break;
      if (state.batteryLocation === 'held') dispatch({type: 'CANCEL_DRAG'});
      else {
        dispatch({type: 'PICK_BATTERY', mode: e.detail === 0 ? 'keyboard' : 'click'});
        if (!state.muted) speakToolPick('battery');
      }
      break;
    case 'pickMains':
      if (Date.now() - lastToolDownTime < 450) break;
      if (state.mainsLocation === 'held') dispatch({type: 'CANCEL_DRAG'});
      else {
        dispatch({type: 'PICK_MAINS', mode: e.detail === 0 ? 'keyboard' : 'click'});
        if (!state.muted) speakToolPick('mains');
      }
      break;
    case 'chooseBattery': testWithBattery(b.dataset.device); break;
    case 'chooseMains': testWithMains(b.dataset.device); break;
    case 'remove': dispatch({type: 'REMOVE_BATTERY', device: b.dataset.device}); break;
    case 'stopMains': dispatch({type: 'REMOVE_MAINS', device: b.dataset.device}); break;
    case 'device': tryDevice(b.dataset.device); break;
    case 'predictYes': prediction(true); break;
    case 'predictNo': prediction(false); break;
    case 'predictSkip': prediction(null); break;
    case 'power':
      dispatch({type: 'TRY_POWER', device: b.dataset.device});
      if (b.dataset.device === 'radio' && !state.muted && state.devices.radio?.status === 'running') playRadio();
      if (b.dataset.device === 'fridge') dispatch({type: 'TOGGLE_DOOR'});
      break;
    case 'sound': dispatch({type: 'SET_MUTED', value: !state.muted}); break;
    case 'listen':
      if (!state.muted && !speak(state.message || c.intro, state.language)) dispatch({type: 'AUDIO_FAILED'});
      else if (state.muted) {
        dispatch({type: 'SET_MUTED', value: false});
        if (!speak(state.message || c.intro, state.language)) dispatch({type: 'AUDIO_FAILED'});
      }
      break;
    case 'stopAudio': stopAudio(); break;
    case 'chat': dispatch({type: 'TOGGLE_CHAT'}); if (!state.chatOpen) $('#chat-toggle').focus(); break;
    case 'hint': showHint(); if (!state.muted && state.message) speakHint(state.message); break;
    case 'dismissHint': dispatch({type: 'DISMISS_IDLE'}); break;
    case 'settings': settings(); break;
    case 'reset': resetRequest(); break;
    case 'confirmReset': dispatch({type: 'RESET'}); break;
    case 'closeCentralFeedback': {
      const modal = $('#central-feedback');
      if (modal) modal.hidden = true;
      break;
    }
    case 'compare': compare(); break;
    case 'closeDialog': pendingDevice = null; dispatch({type: 'CLOSE_COMPARISON'}); closeDialog(); break;
    case 'quiz':
      dispatch({type: 'QUIZ_ANSWER', device: b.dataset.device, answer: b.dataset.answer});
      {
        const d = b.dataset.device, answer = b.dataset.answer;
        compare();
        $(`[data-action="quiz"][data-device="${d}"][data-answer="${answer}"]`)?.focus();
      }
      break;
    case 'complete': dispatch({type: 'COMPLETE'}); if (state.phase === 'completed') completed(); break;
    case 'quickQuestion': ask(b.dataset.question); break;
    case 'suggested': try { runSuggested(JSON.parse(b.dataset.suggestion)); } catch {} break;
    case 'inspect': scene?.inspect(b.dataset.device); break;
    case 'zoomIn': case 'zoomOut': scene?.[a](); break;
    case 'resetView': scene?.reset(); break;
  }
});

async function loadScene() {
  const rev = state.sessionRevision;
  try {
    const {createLabScene} = await import('./scene.js');
    scene = await createLabScene($('#scene'), {
      getState: () => state,
      dispatch: e => dispatch({...e, sessionRevision: rev}),
      onBattery: e => toolDown('battery', e),
      onMains: e => toolDown('mains', e),
      onDevice: tryDevice,
      projectLabel: () => {
        // Vertical stack layout prevents label collision
      }
    });
    if (scene) {
      dispatch({type: 'READY', sessionRevision: rev});
      if (state.phase === 'intro') dispatch({type: 'START', sessionRevision: rev});
    }
  } catch {
    dispatch({type: 'RENDERER_FAILED', sessionRevision: rev});
  }
}

shell();
loadScene();
resetIdle();

if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !window.location.hash.includes('skip-ar') && !window.location.search.includes('skip-ar')) {
  setTimeout(() => {
    launchArGateway({
      title: 'مختبر شرارة المتحرك 3D',
      mode: 'dynamic',
      onContinue: () => {
        speakIntro('dynamic');
      }
    });
  }, 120);
}

Object.defineProperty(window, 'labDiagnostics', {value: () => ({state: structuredClone(state), render: scene?.stats() || null}), writable: false});
