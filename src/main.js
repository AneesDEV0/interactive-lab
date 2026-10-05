// ═══════════════════════════════════════════════════════════════════════════
// src/main.js — المتحكم الرئيسي لمختبر شرارة المتحرك 3D
// كاميرا الكشف (Viewfinder HUD)، الاختبار المباشر في المشهد، ومؤثرات الـ 24 جهازاً
// ═══════════════════════════════════════════════════════════════════════════

import { config, copy, deviceNames, msg, DEVICE_MAP, ALL_DEVICES } from './config.js';
import { initialState, reducer, explorationDone, quizDone, validAction, nextActions } from './state.js';
import { answerQuestion, normalize } from './knowledge.js';
import { icon, robotSvg } from './icons.js';
import {
  stopAudio, radioTune, speak, speakIntro, speakToolPick, speakDropSuccess,
  speakDropIncompatible, speakHint, speakKey, getAudioDiagnostics, playDeviceSynthSound
} from './shared/audio.js';
import { launchArGateway } from './ar.js';
import { coach } from './coach.js';

// استرجاع التفضيلات العامة الموحدة المشتركة بين الثابت والمتحرك
let rawPrefs = {};
try {
  rawPrefs = JSON.parse(localStorage.getItem('sharara-preferences') || '{}');
  const sharedSound = localStorage.getItem('sharara_sound_enabled');
  if (sharedSound !== null) rawPrefs.muted = (sharedSound === 'false');
} catch {}

const prefs = {
  muted: typeof rawPrefs.muted === 'boolean' ? rawPrefs.muted : false,
  reducedMotion: typeof rawPrefs.reducedMotion === 'boolean' ? rawPrefs.reducedMotion : (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false),
  language: rawPrefs.language === 'en' ? 'en' : 'ar',
  ageRange: Array.isArray(rawPrefs.ageRange) ? rawPrefs.ageRange : [6, 9]
};

try {
  sessionStorage.removeItem('sharara-session');
  sessionStorage.removeItem('sharara-state');
  localStorage.removeItem('sharara-state');
  localStorage.removeItem('sharara-connections');
} catch {}

let state = initialState(prefs);
let scene = null, seq = 0, pendingDevice = null, drag = null, idleTimer = null, modalOpener = null, tutorial = false;
let isCameraPassthroughActive = false;
let inQuizChallengeMode = false;
let currentQuizDevIndex = 0;
const history = [], counts = new Map(), app = document.querySelector('#app');

const $ = s => document.querySelector(s);
const t = () => copy[state.language];
const name = id => (state.language === 'en' ? (DEVICE_MAP[id]?.nameEn || id) : (DEVICE_MAP[id]?.name || id));
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
    const osc = ctx.createOscillator(), gain = ctx.createGain(), tm = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, tm);
    osc.frequency.exponentialRampToValueAtTime(260, tm + 0.05);
    gain.gain.setValueAtTime(0.18, tm);
    gain.gain.exponentialRampToValueAtTime(0.001, tm + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(tm); osc.stop(tm + 0.05);
  } catch {}
}

function playSuccessSound() {
  if (state.muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50], tm = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), start = tm + idx * 0.07, dur = 0.28;
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
    const freqs = [240, 180], tm = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), start = tm + idx * 0.09, dur = 0.12;
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
    playDeviceSynthSound(d);
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
  const isDebugAudio = typeof window !== 'undefined' && window.location.search.includes('debugAudio=1');

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
       ${button('compare', c.compare, 'book', 'quiet', 'id="comparison-button" title="جدول الاكتشافات والتحدي"')}
       ${button('chat', c.chat, 'chat', 'quiet', 'id="chat-toggle" aria-expanded="false" title="تحدث مع شرارة"')}
       ${button('settings', c.settings, 'settings', 'icon-only', 'title="الإعدادات"')}
     </nav>
   </header>

   <main class="lab-main-100vh">
     <div class="workspace">
       <div class="scene-wrap">
         <div id="scene" role="img" aria-label="${c.lab}"></div>

         <!-- كاميرا الكشف الافتتاحية (Viewfinder HUD) -->
         <div class="viewfinder-hud" id="viewfinder-hud">
           <div class="viewfinder-corner tl"></div>
           <div class="viewfinder-corner tr"></div>
           <div class="viewfinder-corner bl"></div>
           <div class="viewfinder-corner br"></div>
           <div class="scan-laser-line"></div>

           <div class="viewfinder-top-bar">
             <span class="viewfinder-status-tag">
               <i class="hud-pulse-dot"></i>
               <span id="viewfinder-status-text">كاميرا الكشف: ${currentIds.length} أجهزة</span>
             </span>
             <div class="viewfinder-actions">
               <button type="button" class="viewfinder-btn" data-action="togglePassthrough" id="camera-passthrough-btn" title="تبديل بين كاميرا الجوال والخلفية الافتراضية">
                 📷 <span>كاميرا الجهاز</span>
               </button>
               <button type="button" class="viewfinder-btn" data-action="skipIntro" title="تخطي الحركة الافتتاحية">
                 ⏩ <span>تخطي</span>
               </button>
             </div>
           </div>
         </div>

         <div class="scene-top">
           <span class="room-tag"><i></i>${c.available}</span>
           <div class="camera-tools">
             ${button('zoomIn', c.zoomIn, 'plus', 'icon-only')}
             ${button('zoomOut', c.zoomOut, 'minus', 'icon-only')}
             ${button('resetView', c.resetView, 'refresh', 'icon-only')}
           </div>
         </div>

         <!-- بطاقات الأجهزة في المشهد لتأطير 1-4 والتوقع السريع -->
         <div id="scene-labels" class="scene-labels-stack">
           ${currentIds.map((id, index) => {
             const pred = state.predictionByDevice?.[id];
             return `
               <div class="scene-label-stack-item" id="label-${id}">
                 <button class="label-main-tap" data-action="device" data-device="${id}" data-target="${id}">
                   <span class="label-status-dot" id="dot-${id}">○</span>
                   <strong class="label-name">#${index + 1} ${shortName(id)}</strong>
                   <span class="label-badge badge-off" id="badge-${id}">متوقف</span>
                 </button>
                 <div class="label-prediction-btns">
                   <button type="button" class="label-pred-btn ${pred === true ? 'active-battery' : ''}" data-action="quickPredict" data-device="${id}" data-val="battery" title="أتوقع: بطارية جافة">🔋</button>
                   <button type="button" class="label-pred-btn ${pred === false ? 'active-mains' : ''}" data-action="quickPredict" data-device="${id}" data-val="mains" title="أتوقع: كهرباء المنزل">🔌</button>
                 </div>
               </div>
             `;
           }).join('')}
         </div>

         <div id="fallback-panel" hidden>
           <div class="fallback-illustration">${icon('battery')}${icon('car')}${icon('radio')}${icon('fridge')}</div>
           <h2>${c.fallback}</h2>
           <p>${c.guide}</p>
         </div>

         <div class="scene-caption">${icon('hand')}<span id="scene-guide">${c.guide}</span></div>

         <!-- مقياس القدرة المدمج (Power Meter Widget) -->
         <div class="power-meter-container" id="power-meter-widget" hidden style="display:none;">
           <div class="power-meter-header">
             <span class="power-meter-title">⚡ مقياس مقارنة القدرة الكهربائية</span>
             <button type="button" class="power-meter-close" data-action="closePowerMeter">✕</button>
           </div>
           <div class="power-meter-bars" id="power-meter-bars">
             <div class="power-meter-row">
               <span class="power-meter-label">🔋 طاقة البطارية:</span>
               <div class="power-meter-track"><div class="power-meter-fill battery-fill"></div></div>
               <span class="power-meter-val">1.5V – 3V (~2 واط)</span>
             </div>
             <div class="power-meter-row">
               <span class="power-meter-label" id="power-meter-dev-label">🔌 حاجة الجهاز:</span>
               <div class="power-meter-track"><div class="power-meter-fill device-fill"></div></div>
               <span class="power-meter-val" id="power-meter-dev-val">220V (~2000 واط)</span>
             </div>
           </div>
         </div>

         <!-- أدوات الطاقة المباشرة -->
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

       <!-- شريط التغذية الراجعة الحي والمباشر أسفل الطاولة -->
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

           <!-- عناصر أسئلة الاختبار المباشرة داخل المشهد -->
           <div id="in-scene-quiz-bar" style="display:none; margin-top:8px; gap:8px; align-items:center; flex-wrap:wrap;"></div>
         </div>
         <div class="feedback-bar-actions">
           <button type="button" class="bar-report-btn" data-action="openDetectiveReport" title="عرض لوحة تقرير المحقق">
             📊 <span>تقرير المحقق</span>
           </button>
           <button type="button" class="bar-reset-btn" data-action="reset" title="توليد 4 أجهزة عشوائية جديدة">
             🔄 <span>أجهزة جديدة</span>
           </button>
         </div>
       </section>

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

       <footer class="compact-footer sr-only">
         <span>${icon('shield')}${c.safety}</span>
         ${button('reset', c.reset, 'refresh', 'text-button')}
       </footer>
     </div>
   </main>

   <!-- نافذة لوحة تقرير المحقق (Detective Report Modal) -->
   <div id="detective-report-modal" class="detective-report-modal" hidden style="display:none;">
     <div class="detective-report-card">
       <div class="detective-report-header">
         <div class="detective-report-badge">🕵️‍♂️ ⚡</div>
         <h2 class="detective-report-title">لوحة تقرير المحقق الصغير</h2>
         <p class="detective-report-subtitle">ملخص استكشاف الأجهزة الأربعة ومقارنة التوقعات بالنتائج العلمية</p>
       </div>
       <div id="detective-report-table-wrap"></div>
       <div class="detective-report-actions">
         <button type="button" class="primary" data-action="startChallengeQuiz">🎯 خوض تحدي الاختبار في الكاميرا</button>
         <button type="button" class="primary" data-action="newRoundFromReport">🔄 جولة جديدة بأجهزة أخرى</button>
         <button type="button" class="secondary" data-action="closeDetectiveReport">متابعة الاستكشاف</button>
       </div>
     </div>
   </div>

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
       ${(state.language === 'ar' ? ['ما هي الأجهزة؟', 'لماذا لم يعمل؟', 'هل البطارية فيها كهرباء؟'] : ['What devices are here?', 'Why is it off?', 'Does a battery have electricity?']).map(q => button('quickQuestion', q, null, 'question-chip', `data-question="${q}"`)).join('')}
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

   ${isDebugAudio ? `<div class="audio-diag-badge" id="audio-diag-badge">Audio: Initializing...</div>` : ''}
  `;

  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

  $('#dialog').addEventListener('cancel', () => { pendingDevice = null; if (state.batteryLocation === 'held' || state.mainsLocation === 'held') dispatch({type: 'CANCEL_DRAG'}); });
  $('#dialog').addEventListener('close', () => { modalOpener?.focus?.(); });
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); ask($('#question').value); $('#question').value = ''; });
  
  initTouchDragSupport();

  $('#feedback-confirm-btn')?.addEventListener('click', hideCentralFeedback);
  $('#central-feedback')?.addEventListener('click', e => { if (e.target.id === 'central-feedback') hideCentralFeedback(); });
  
  render();
}

function renderInSceneQuiz() {
  const quizBar = $('#in-scene-quiz-bar');
  if (!quizBar) return;

  const currentIds = Object.keys(state.devices || {});
  if (!inQuizChallengeMode) {
    quizBar.style.display = 'none';
    return;
  }

  quizBar.style.display = 'flex';

  if (currentQuizDevIndex < currentIds.length) {
    const targetDevId = currentIds[currentQuizDevIndex];
    const devMeta = DEVICE_MAP[targetDevId];
    scene?.showTargetRing?.(targetDevId);
    scene?.pointTo?.(targetDevId);

    quizBar.innerHTML = `
      <div style="background:#EBF1ED; border-radius:12px; padding:6px 12px; font-size:0.85rem; font-weight:800; color:#2F3E36; width:100%; display:flex; justify-content:space-between; align-items:center;">
        <span>🎯 السؤال (${currentQuizDevIndex + 1} من ${currentIds.length}): ما مصدر طاقة <strong>${devMeta?.name || targetDevId}</strong>؟</span>
        <div style="display:flex; gap:6px;">
          <button type="button" class="primary" data-action="inSceneQuizAnswer" data-device="${targetDevId}" data-ans="battery" style="font-size:0.8rem; padding:6px 14px;">🔋 بطارية جافة</button>
          <button type="button" class="secondary" data-action="inSceneQuizAnswer" data-device="${targetDevId}" data-ans="mains" style="font-size:0.8rem; padding:6px 14px; background:#2F3E36; color:#FFB703;">🔌 كهرباء 220V</button>
        </div>
      </div>
    `;
  } else {
    // السؤال الأخير: التفسير العلمي
    scene?.showTargetRing?.(null);
    scene?.pointTo?.(null);
    scene?.fitToDevices?.({ animate: true });

    quizBar.innerHTML = `
      <div style="background:#EBF1ED; border-radius:12px; padding:8px 12px; font-size:0.85rem; font-weight:800; color:#2F3E36; width:100%;">
        <p style="margin:0 0 6px;">💡 السؤال الأخير: لماذا تختلف مصادر الطاقة بين هذه الأجهزة؟</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="primary" data-action="inSceneQuizAnswer" data-device="explanation" data-ans="design" style="font-size:0.8rem; padding:6px 12px;">✅ لأن لكل جهاز تصميماً وقدرة كهربائية محددة تناسبه</button>
          <button type="button" class="secondary" data-action="inSceneQuizAnswer" data-device="explanation" data-ans="size" style="font-size:0.8rem; padding:6px 12px;">❌ لأن حجم الجهاز هو وحده ما يحدد المصدر دائماً</button>
        </div>
      </div>
    `;
  }
}

function handleInSceneQuizAnswer(device, answer) {
  const isCorrect = (device === 'explanation')
    ? (answer === 'design')
    : (DEVICE_MAP[device]?.type === answer);

  dispatch({type: 'QUIZ_ANSWER', device, answer});

  if (isCorrect) {
    playSuccessSound();
    if (device !== 'explanation') {
      playDeviceSynthSound(device);
      // تشغيل الجهاز مؤقتاً لمدة ثانيتين
      if (state.devices[device]) {
        state.devices[device].status = 'running';
        render();
        setTimeout(() => {
          if (state.devices[device]) state.devices[device].status = 'off';
          render();
        }, 2000);
      }
    }
    currentQuizDevIndex++;
    if (currentQuizDevIndex > Object.keys(state.devices).length) {
      inQuizChallengeMode = false;
      dispatch({type: 'COMPLETE'});
      completed();
    } else {
      renderInSceneQuiz();
    }
  } else {
    playErrorSound();
    const pill = $('#live-feedback-pill');
    const textEl = $('#live-feedback-text');
    if (pill) {
      pill.textContent = '⚠️ حاول مجدداً يا بطل';
      pill.className = 'feedback-status-pill pill-warning';
    }
    if (textEl) {
      textEl.textContent = 'تذكر ما شاهدته أثناء تجربتك وفحص الجهاز!';
    }
  }
}

function renderDetectiveReport() {
  const currentIds = Object.keys(state.devices || {});
  const rows = currentIds.map(id => {
    const meta = DEVICE_MAP[id] || {};
    const pred = state.predictionByDevice?.[id];
    const actualSource = meta.type === 'battery' ? 'battery' : 'mains';
    const predSource = pred === true ? 'battery' : pred === false ? 'mains' : null;
    const isMatch = predSource === actualSource;

    const predChip = predSource === 'battery'
      ? '<span class="report-chip match">🔋 بطارية</span>'
      : predSource === 'mains'
      ? '<span class="report-chip match">🔌 كهرباء 220V</span>'
      : '<span class="report-chip">لم تتوقع</span>';

    const actualChip = actualSource === 'battery'
      ? '<span class="report-chip match">🔋 بطارية جافة</span>'
      : '<span class="report-chip different">🔌 كهرباء المنزل 220V</span>';

    const matchBadge = predSource === null
      ? '—'
      : isMatch
      ? '<span style="color:#0E7C7B;font-weight:900;">✅ متطابق</span>'
      : '<span style="color:#C05621;font-weight:900;">🔍 اكتشاف جديد</span>';

    return `
      <tr>
        <td><strong>${meta.name || id}</strong></td>
        <td>${predChip}</td>
        <td>${actualChip}</td>
        <td>${matchBadge}</td>
        <td style="font-size:0.75rem;text-align:start;max-width:200px;">${meta.reason || '—'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <table class="detective-report-table">
      <thead>
        <tr>
          <th>الجهاز</th>
          <th>توقعي 🔮</th>
          <th>النتيجة العلمية 🧪</th>
          <th>المطابقة</th>
          <th>التفسير العلمي 💡</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  const wrap = $('#detective-report-table-wrap');
  if (wrap) wrap.innerHTML = html;
}

function openDetectiveReport() {
  renderDetectiveReport();
  const modal = $('#detective-report-modal');
  if (modal) {
    modal.hidden = false;
    modal.style.display = 'flex';
  }
}

function closeDetectiveReport() {
  const modal = $('#detective-report-modal');
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
  }
}

function showPowerMeter(deviceId) {
  const dev = DEVICE_MAP[deviceId];
  const widget = $('#power-meter-widget');
  if (!widget || !dev) return;

  const lbl = $('#power-meter-dev-label');
  const val = $('#power-meter-dev-val');
  if (lbl) lbl.textContent = `🔌 حاجة ${dev.name}:`;
  if (val) val.textContent = dev.type === 'battery' ? `${dev.voltage} (${dev.watts})` : `220V (${dev.watts})`;

  widget.hidden = false;
  widget.style.display = 'block';
}

function hidePowerMeter() {
  const widget = $('#power-meter-widget');
  if (widget) {
    widget.hidden = true;
    widget.style.display = 'none';
  }
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
    inQuizChallengeMode = false;
    currentQuizDevIndex = 0;
    coach.resetRound();
    $('#drag-ghost').hidden = true;
    hideCentralFeedback();
    closeDetectiveReport();
    hidePowerMeter();
    closeDialog();
    shell();
    scene?.reset();
    resetIdle();
    return;
  }

  if (state.muted || (state.devices.radio && state.devices.radio.status !== 'running') || ['PICK_BATTERY', 'PICK_MAINS'].includes(event.type)) stopAudio();
  if (!state.muted && state.devices.radio && state.devices.radio.status === 'running' && (old.devices.radio?.status !== 'running' || old.muted)) playRadio();

  if (['SET_MUTED', 'SET_REDUCED_MOTION', 'SET_LANGUAGE', 'SET_AGE'].includes(event.type)) {
    try {
      localStorage.setItem('sharara-preferences', JSON.stringify({muted: state.muted, reducedMotion: state.reducedMotion, language: state.language, ageRange: state.ageRange}));
      localStorage.setItem('sharara_sound_enabled', String(!state.muted));
    } catch {}
  }

  if (event.type === 'DROP_ON_DEVICE') {
    const d = event.device;
    const isSuccess = state.devices[d]?.status === 'running';
    const tool = state.devices[d]?.source || event.tool || 'battery';
    
    coach.recordAttempt(d, isSuccess);
    showCentralFeedback(d, tool, isSuccess, state.message);

    if (!state.muted) {
      if (isSuccess) {
        speakDropSuccess(name(d), DEVICE_MAP[d]?.reason);
      } else {
        speakDropIncompatible(name(d), DEVICE_MAP[d]?.wrongReason);
      }
    }

    const advice = coach.getAdvice(state);
    if (advice.showPowerMeter && advice.targetDevice) {
      showPowerMeter(advice.targetDevice);
    }
    if (advice.pointsToDevice && scene) {
      scene.pointTo?.(advice.pointsToDevice);
      scene.showTargetRing?.(advice.pointsToDevice);
    }
  }

  render();

  if (explorationDone(state) && !old.discoveredFacts.includes('all_done')) {
    setTimeout(() => {
      openDetectiveReport();
    }, 1200);
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

  const heldBat = state.batteryLocation === 'held';
  const batBtn = $('#battery-button');
  if (batBtn) {
    batBtn.setAttribute('aria-pressed', String(heldBat));
    batBtn.classList.toggle('selected', heldBat);
    batBtn.disabled = ['intro', 'loading', 'recoverable_error'].includes(state.phase);
    const batTitle = batBtn.querySelector('.power-title');
    if (batTitle) batTitle.textContent = heldBat ? 'اسحب للجهاز ✋' : 'بطارية جافة';
  }

  const heldMains = state.mainsLocation === 'held';
  const mainsBtn = $('#mains-button');
  if (mainsBtn) {
    mainsBtn.setAttribute('aria-pressed', String(heldMains));
    mainsBtn.classList.toggle('selected', heldMains);
    mainsBtn.disabled = ['intro', 'loading', 'recoverable_error'].includes(state.phase);
    const mainsTitle = mainsBtn.querySelector('.power-title');
    if (mainsTitle) mainsTitle.textContent = heldMains ? 'اسحب للجهاز ✋' : 'فيشة الكهرباء الرئيسية';
  }

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

  const diagBadge = $('#audio-diag-badge');
  if (diagBadge) {
    const d = getAudioDiagnostics();
    diagBadge.textContent = `Unlocked: ${d.isUnlocked} | Key: ${d.lastKey} | Err: ${d.lastError || 'None'}`;
  }

  renderInSceneQuiz();
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
  if (state.batteryLocation !== 'held') dispatch({type: 'PICK_BATTERY'});
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool: 'battery'});
}

function testWithMains(id) {
  closeDialog();
  if (state.mainsLocation !== 'held') dispatch({type: 'PICK_MAINS'});
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool: 'mains'});
}

function showDevicePowerChoice(id) {
  const meta = DEVICE_MAP[id] || {};
  const dIcon = meta.icon || 'bolt';
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
    showDevicePowerChoice(id);
    return;
  }

  const tool = state.mainsLocation === 'held' ? 'mains' : 'battery';
  dispatch({type: 'DROP_ON_DEVICE', device: id, tool});
}

function compare() {
  openDetectiveReport();
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
  const advice = coach.getAdvice(state);
  if (advice.targetDevice) {
    showPowerMeter(advice.targetDevice);
  }
  ask(state.language === 'ar' ? 'أريد تلميحًا' : 'I need a hint');
}

async function playRadio() {
  const rev = state.sessionRevision;
  if (!(await radioTune()) && rev === state.sessionRevision) dispatch({type: 'AUDIO_FAILED'});
  if (rev !== state.sessionRevision || state.muted || (state.devices.radio && state.devices.radio.status !== 'running')) stopAudio();
}

let lastToolDownTime = 0;

function initTouchDragSupport() {
  const batBtn = $('#battery-button');
  const mainsBtn = $('#mains-button');

  const setupBtn = (btn, tool) => {
    if (!btn) return;
    btn.style.touchAction = 'none';

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

    btn.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      toolDown(tool, e);
    });
  };

  setupBtn(batBtn, 'battery');
  setupBtn(mainsBtn, 'mains');
}

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

window.addEventListener('touchmove', e => {
  if (!drag || !drag.isTouch) return;
  const touch = e.touches[0];
  if (!touch) return;

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

  if (drag.moved && scene?.setDragWorld) {
    scene.setDragWorld(drag.tool, touch.clientX, touch.clientY);
  }
}, { passive: false });

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
  scene?.clearDragWorld?.();

  if (!moved) {
    if (!state.muted) speakToolPick(tool);
    return;
  }

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
    scene?.clearDragWorld?.();
    dispatch({type: 'CANCEL_DRAG'});
  }
});

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
    if (scene?.setDragWorld) {
      scene.setDragWorld(drag.tool, e.clientX, e.clientY);
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
  scene?.clearDragWorld?.();
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
    scene?.clearDragWorld?.();
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
    case 'togglePassthrough':
      isCameraPassthroughActive = !isCameraPassthroughActive;
      scene?.setCameraPassthrough?.(isCameraPassthroughActive);
      b.innerHTML = isCameraPassthroughActive ? '🎨 <span>بيئة افتراضية</span>' : '📷 <span>كاميرا الجهاز</span>';
      break;
    case 'skipIntro':
      scene?.skipRevealIntro?.();
      break;
    case 'quickPredict':
      {
        const devId = b.dataset.device;
        const val = b.dataset.val === 'battery';
        dispatch({type: 'PREDICT', device: devId, value: val});
        playClickSound();
      }
      break;
    case 'openDetectiveReport':
      openDetectiveReport();
      break;
    case 'closeDetectiveReport':
      closeDetectiveReport();
      break;
    case 'startChallengeQuiz':
      closeDetectiveReport();
      inQuizChallengeMode = true;
      currentQuizDevIndex = 0;
      render();
      break;
    case 'inSceneQuizAnswer':
      handleInSceneQuizAnswer(b.dataset.device, b.dataset.ans);
      break;
    case 'newRoundFromReport':
      closeDetectiveReport();
      dispatch({type: 'RESET'});
      break;
    case 'closePowerMeter':
      hidePowerMeter();
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
      projectLabel: () => {}
    });
    if (scene) {
      dispatch({type: 'READY', sessionRevision: rev});
      if (state.phase === 'intro') {
        dispatch({type: 'START', sessionRevision: rev});
        scene.playRevealIntro?.();
        if (!state.muted) {
          speakIntro('dynamic');
        }
      }
    }
  } catch {
    dispatch({type: 'RENDERER_FAILED', sessionRevision: rev});
  }
}

shell();
loadScene();
resetIdle();

Object.defineProperty(window, 'labDiagnostics', {value: () => ({state: structuredClone(state), render: scene?.stats() || null}), writable: false});
