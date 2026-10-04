// ═══════════════════════════════════════════════════════════════════════════
// static-main.js — المحرك المركزي للنشاط التقويمي الثابت (100vh Responsive Module)
// مدعوم بمدخل الواقع المعزز الحقيقي (True AR)، والتوجيه الصوتي، والبطاقات ثلاثية الأبعاد
// ═══════════════════════════════════════════════════════════════════════════

import { launchARGateway } from './ar.js';
import { speak, stopAudio } from './audio.js';
import { ALL_DEVICES } from './config.js';

// ─── بنك رسومات SVG الـ 24 عالية الدقة ───
const SVG_MAP = {
  remote: `<svg viewBox="0 0 64 64" fill="none"><rect x="18" y="6" width="28" height="52" rx="14" fill="#3D5A80" /><rect x="22" y="10" width="20" height="44" rx="10" fill="#293241" /><circle cx="32" cy="7" r="2.5" fill="#EE6C4D" /><circle cx="32" cy="22" r="7" fill="#EE6C4D" /><circle cx="32" cy="22" r="3.5" fill="#E0FBFC" /><circle cx="26" cy="35" r="2.5" fill="#98C1D9" /><circle cx="38" cy="35" r="2.5" fill="#98C1D9" /><circle cx="26" cy="42" r="2.5" fill="#98C1D9" /><circle cx="38" cy="42" r="2.5" fill="#98C1D9" /><circle cx="26" cy="49" r="2.5" fill="#98C1D9" /><circle cx="38" cy="49" r="2.5" fill="#98C1D9" /></svg>`,
  flashlight: `<svg viewBox="0 0 64 64" fill="none"><path d="M14 26 L26 22 L26 42 L14 38 Z" fill="#FFB703" /><rect x="26" y="24" width="26" height="16" rx="4" fill="#5B7065" /><rect x="52" y="27" width="5" height="10" rx="2" fill="#2F3E36" /><rect x="33" y="21" width="7" height="3" rx="1.5" fill="#E63946" /><path d="M12 24 L2 18 L2 46 L12 40 Z" fill="#FFE8A3" opacity="0.6" /></svg>`,
  wallClock: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="26" fill="#F4A261" /><circle cx="32" cy="32" r="22" fill="#FFFFFF" /><circle cx="32" cy="32" r="3" fill="#264653" /><line x1="32" y1="32" x2="32" y2="18" stroke="#264653" stroke-width="3" stroke-linecap="round" /><line x1="32" y1="32" x2="44" y2="32" stroke="#E76F51" stroke-width="2.5" stroke-linecap="round" /></svg>`,
  car: `<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="24" width="48" height="20" rx="8" fill="#E63946" /><path d="M16 24 L22 14 L42 14 L48 24 Z" fill="#D90429" /><circle cx="18" cy="46" r="7" fill="#2B2D42" /><circle cx="18" cy="46" r="3" fill="#EDF2F4" /><circle cx="46" cy="46" r="7" fill="#2B2D42" /><circle cx="46" cy="46" r="3" fill="#EDF2F4" /></svg>`,
  calculator: `<svg viewBox="0 0 64 64" fill="none"><rect x="14" y="8" width="36" height="48" rx="8" fill="#4A5568" /><rect x="18" y="13" width="28" height="12" rx="3" fill="#A0AEC0" /><circle cx="22" cy="31" r="2.8" fill="#CBD5E0" /><circle cx="29" cy="31" r="2.8" fill="#CBD5E0" /><circle cx="36" cy="31" r="2.8" fill="#CBD5E0" /><circle cx="43" cy="31" r="2.8" fill="#ED8936" /></svg>`,
  radio: `<svg viewBox="0 0 64 64" fill="none"><line x1="16" y1="18" x2="36" y2="6" stroke="#4A5568" stroke-width="2.5" stroke-linecap="round" /><circle cx="36" cy="6" r="2.5" fill="#E53E3E" /><rect x="10" y="18" width="44" height="34" rx="8" fill="#319795" /><circle cx="24" cy="35" r="11" fill="#285E61" /><circle cx="44.5" cy="36" r="4" fill="#CBD5E0" /></svg>`,
  smokeDetector: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="24" fill="#EDF2F7" stroke="#CBD5E0" stroke-width="2.5"/><circle cx="32" cy="32" r="14" fill="#E2E8F0"/><circle cx="32" cy="32" r="4" fill="#E53E3E"/><line x1="22" y1="26" x2="26" y2="26" stroke="#718096" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="38" x2="26" y2="38" stroke="#718096" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="26" x2="42" y2="26" stroke="#718096" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="38" x2="42" y2="38" stroke="#718096" stroke-width="2" stroke-linecap="round"/></svg>`,
  laserPointer: `<svg viewBox="0 0 64 64" fill="none"><rect x="14" y="27" width="36" height="10" rx="4" fill="#2B6CB0"/><rect x="50" y="29" width="5" height="6" rx="1.5" fill="#A0AEC0"/><circle cx="24" cy="32" r="2.2" fill="#E53E3E"/><line x1="55" y1="32" x2="63" y2="32" stroke="#E53E3E" stroke-width="2.5" stroke-dasharray="2 1"/></svg>`,
  hearingAid: `<svg viewBox="0 0 64 64" fill="none"><path d="M26 14 C16 18, 14 36, 26 46 C32 52, 38 48, 38 42 C38 36, 32 38, 28 32 C26 28, 28 22, 36 20" stroke="#DD6B20" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="38" cy="42" r="5" fill="#ED8936"/></svg>`,
  digitalScale: `<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="14" width="40" height="40" rx="8" fill="#E2E8F0" stroke="#A0AEC0" stroke-width="2"/><rect x="20" y="20" width="24" height="10" rx="3" fill="#2D3748"/><circle cx="32" cy="40" r="7" fill="#CBD5E0"/></svg>`,
  robotToy: `<svg viewBox="0 0 64 64" fill="none"><rect x="18" y="18" width="28" height="26" rx="6" fill="#319795"/><circle cx="26" cy="28" r="3" fill="#FFD166"/><circle cx="38" cy="28" r="3" fill="#FFD166"/><rect x="24" y="36" width="16" height="3" rx="1.5" fill="#FFFFFF"/><circle cx="32" cy="10" r="3" fill="#E53E3E"/><line x1="32" y1="13" x2="32" y2="18" stroke="#4A5568" stroke-width="2"/></svg>`,
  electricToothbrush: `<svg viewBox="0 0 64 64" fill="none"><rect x="26" y="22" width="12" height="36" rx="6" fill="#4299E1"/><rect x="28" y="6" width="8" height="16" rx="2" fill="#E2E8F0"/><rect x="30" y="7" width="4" height="6" rx="1" fill="#3182CE"/></svg>`,
  
  fridge: `<svg viewBox="0 0 64 64" fill="none"><rect x="16" y="6" width="32" height="52" rx="6" fill="#E2E8F0" /><rect x="18" y="8" width="28" height="16" rx="3" fill="#CBD5E0" /><rect x="18" y="27" width="28" height="29" rx="3" fill="#CBD5E0" /><rect x="41" y="14" width="3" height="7" rx="1.5" fill="#4A5568" /><rect x="41" y="32" width="3" height="12" rx="1.5" fill="#4A5568" /></svg>`,
  microwave: `<svg viewBox="0 0 64 64" fill="none"><rect x="6" y="14" width="52" height="36" rx="6" fill="#718096" /><rect x="13" y="21" width="28" height="22" rx="3" fill="#2D3748" /><circle cx="48" cy="33" r="3" fill="#A0AEC0" /></svg>`,
  washer: `<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="8" width="40" height="48" rx="7" fill="#EDF2F7" /><circle cx="32" cy="35" r="15" fill="#CBD5E0" /><circle cx="32" cy="35" r="10" fill="#4299E1" opacity="0.6" /></svg>`,
  airConditioner: `<svg viewBox="0 0 64 64" fill="none"><rect x="6" y="18" width="52" height="24" rx="5" fill="#F7FAFC" /><line x1="10" y1="36" x2="54" y2="36" stroke="#A0AEC0" stroke-width="2" /></svg>`,
  vacuum: `<svg viewBox="0 0 64 64" fill="none"><rect x="30" y="24" width="24" height="20" rx="9" fill="#DD6B20" /><circle cx="44" cy="44" r="6" fill="#2D3748" /><path d="M32 30 C20 30, 14 18, 14 26 L14 48" stroke="#718096" stroke-width="3.5" fill="none"/></svg>`,
  lamp: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 26 L44 26 L38 12 L26 12 Z" fill="#F6AD55" /><line x1="32" y1="26" x2="32" y2="48" stroke="#4A5568" stroke-width="3" stroke-linecap="round"/><ellipse cx="32" cy="49" rx="12" ry="3.5" fill="#2D3748" /></svg>`,
  electricOven: `<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="10" width="44" height="44" rx="6" fill="#4A5568"/><rect x="15" y="26" width="34" height="24" rx="3" fill="#1A202C"/><path d="M19 32 L45 32" stroke="#E53E3E" stroke-width="2"/><path d="M19 44 L45 44" stroke="#E53E3E" stroke-width="2"/></svg>`,
  iron: `<svg viewBox="0 0 64 64" fill="none"><path d="M10 44 L50 44 C54 44, 56 40, 52 34 L38 22 C32 20, 20 20, 16 26 Z" fill="#3182CE"/><rect x="10" y="44" width="42" height="4" rx="1.5" fill="#A0AEC0"/><circle cx="30" cy="34" r="3" fill="#ED8936"/></svg>`,
  hairDryer: `<svg viewBox="0 0 64 64" fill="none"><rect x="14" y="16" width="28" height="16" rx="6" fill="#D53F8C"/><rect x="42" y="20" width="10" height="8" rx="2" fill="#4A5568"/><rect x="20" y="32" width="10" height="20" rx="3" fill="#702459"/></svg>`,
  electricWaterHeater: `<svg viewBox="0 0 64 64" fill="none"><rect x="18" y="10" width="28" height="44" rx="14" fill="#EDF2F7" stroke="#CBD5E0" stroke-width="2"/><circle cx="32" cy="45" r="2" fill="#E53E3E"/></svg>`,
  electricHeater: `<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="14" width="40" height="38" rx="6" fill="#C53030"/><line x1="18" y1="24" x2="46" y2="24" stroke="#FFD166" stroke-width="3"/><line x1="18" y1="34" x2="46" y2="34" stroke="#FFD166" stroke-width="3"/><line x1="18" y1="44" x2="46" y2="44" stroke="#FFD166" stroke-width="3"/></svg>`,
  blender: `<svg viewBox="0 0 64 64" fill="none"><path d="M20 12 L44 12 L38 38 L26 38 Z" fill="#CBD5E0"/><rect x="24" y="38" width="16" height="18" rx="4" fill="#2B6CB0"/><circle cx="32" cy="46" r="2" fill="#FFFFFF"/></svg>`
};

// ─── المؤثرات الصوتية الخفيفة المدمجة (Web Audio API) ───
let audioCtx = null;
let soundEnabled = true;
let speechEnabled = true;

function initAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type = 'sine', duration = 0.12) {
  if (!soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

function playSelectSound() {
  playTone(587.33, 'triangle', 0.1); // D5
}

function playFlipSound() {
  playTone(440, 'sine', 0.14); // A4
}

function playWinSound() {
  if (!soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'triangle', 0.22), idx * 110);
  });
}

function playErrorSound() {
  playTone(220, 'sawtooth', 0.25);
}

// التوجيه الصوتي العربي الموحد
function speakArabic(text) {
  if (!speechEnabled) return;
  speak(text, 'ar');
}

// ─── إدارة حالة النشاط ───
let totalScore = 0;
let totalChallenges = 0;
let currentTargetType = 'battery'; // 'battery' أو 'mains'
let currentDevices = []; // الأجهزة الـ 4 المعروضة حالياً
let selectedIds = new Set();
let isAnswerChecked = false;

// اختيار 4 أجهزة ذكية متوازنة (2 بطارية + 2 كهرباء منزل)
function pickChallengeDevices() {
  const batteries = ALL_DEVICES.filter(d => d.type === 'battery').sort(() => Math.random() - 0.5);
  const mains = ALL_DEVICES.filter(d => d.type === 'mains').sort(() => Math.random() - 0.5);
  
  const picked = [batteries[0], batteries[1], mains[0], mains[1]];
  return picked.sort(() => Math.random() - 0.5);
}

// ─── بناء واجهة المستخدم 100vh ───
export function initStaticLab() {
  const app = document.getElementById('app') || document.body;
  app.innerHTML = `
    <div class="static-app-root">
      <!-- 1. الترويسة الرئيسية -->
      <header class="static-header">
        <a href="./index.html" class="static-brand" id="brand-link">
          <div class="static-brand-icon">⚡</div>
          <div class="static-brand-title">
            <h1>متحري مصادر الكهرباء</h1>
            <span>مادة العلوم — الصف الرابع الابتدائي</span>
          </div>
        </a>

        <nav class="static-header-nav">
          <button type="button" id="btn-ar-launch" class="static-nav-btn btn-ar" title="فتح كاميرا الواقع المعزز الحقيقي">
            📷 <span>الواقع المعزز AR</span>
          </button>
          <button type="button" id="btn-voice-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل التوجيه الصوتي">
            🗣️
          </button>
          <button type="button" id="btn-sound-toggle" class="static-nav-btn icon-only" title="تفعيل/تعطيل المؤثرات الصوتية">
            🔊
          </button>
          <button type="button" id="btn-cert-open" class="static-nav-btn" title="شهادة الإنجاز">
            🎓 <span>الشهادة</span>
          </button>
          <a href="./dynamic-lab.html" class="static-nav-btn" id="dynamic-link" title="الانتقال للمختبر المتحرك">
            🧪 <span>المتحرك</span>
          </a>
        </nav>
      </header>

      <!-- لافتة الفوز المدمجة الفورية -->
      <div class="static-victory-overlay" id="victory-banner">
        <div class="victory-text-group">
          <span class="victory-trophy">🏆🌟</span>
          <div>
            <div class="victory-title" id="victory-title">كفو يا بطل العلوم! إجابة صحيحة 100%!</div>
            <div class="victory-sub">كشفت جميع الأجهزة المطلوبة وتجنبت الفخاخ ببراعة!</div>
          </div>
        </div>
        <button type="button" class="static-btn btn-verify" id="btn-next-challenge">
          <span>خوض تحدٍ جديد ➔</span>
        </button>
      </div>

      <!-- 2. شريط المهمة والتحدي (HUD) -->
      <section class="static-mission-hud">
        <div class="static-mission-info">
          <div class="static-target-chip" id="target-chip">
            <span id="target-icon">🔋</span>
            <span id="target-title">تحدي البطاريات الجافة</span>
          </div>
          <div class="static-mission-instruction" id="mission-instruction">
            انقر لتحديد جهازين يعملان بهذا المصدر، واضغط "فحص 3D" لكشف دائرة كل جهاز!
          </div>
        </div>

        <div class="static-mission-stats">
          <div class="static-stat-pill">
            <span>🏆 النقاط:</span>
            <span class="val" id="stat-score">0</span>
          </div>
          <div class="static-stat-pill">
            <span>🎯 التحديات:</span>
            <span class="val" id="stat-challenges">0</span>
          </div>
          <div class="static-stat-pill">
            <span>✔️ المحددة:</span>
            <span class="val" id="stat-selected">0 / 2</span>
          </div>
        </div>
      </section>

      <!-- 3. ساحة البطاقات التفاعلية 3D -->
      <main class="static-cards-stage" id="cards-stage"></main>

      <!-- 4. شريط الأوامر التقويمية السفلي -->
      <footer class="static-actions-bar">
        <div class="static-actions-right">
          <button type="button" class="static-btn btn-verify" id="btn-validate">
            <span>🔍 تحقق من إجابتي</span>
          </button>
          <button type="button" class="static-btn btn-secondary" id="btn-hint">
            <span>💡 تلميح المحقق</span>
          </button>
          <button type="button" class="static-btn btn-secondary" id="btn-refresh">
            <span>🔄 أجهزة أخرى</span>
          </button>
        </div>

        <button type="button" class="static-btn btn-secondary" id="btn-summary">
          <span>📋 كشف التصنيف والمقارنة</span>
        </button>
      </footer>

      <!-- 5. نافذة كشف المقارنة والتصنيف العلمي الموحدة -->
      <dialog class="static-dialog" id="summary-dialog">
        <div class="dialog-header">
          <h3>📋 كشف التحقيق: المقارنة العلمية لمصادر الطاقة</h3>
          <button type="button" class="dialog-close-btn" id="summary-close-btn">✕</button>
        </div>
        <div class="summary-table-container">
          <div class="summary-col battery-col">
            <h4>🔋 أجهزة تعمل بالبطارية الجافة:</h4>
            <div id="battery-summary-list"></div>
          </div>
          <div class="summary-col house-col">
            <h4>⚡ أجهزة تعمل بكهرباء المنزل 220V:</h4>
            <div id="house-summary-list"></div>
          </div>
        </div>
      </dialog>

      <!-- 6. نافذة شهادة الإنجاز الفخمة -->
      <dialog class="static-dialog" id="cert-dialog">
        <div class="dialog-header">
          <h3>🎓 شهادة تميّز متحرّي العلوم</h3>
          <button type="button" class="dialog-close-btn" id="cert-close-btn">✕</button>
        </div>
        <div style="text-align: center; padding: 10px 0;">
          <div style="font-size: 2.5rem; margin-bottom: 6px;">🎖️📜🎖️</div>
          <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--frog-dark); margin-bottom: 4px;">مبارك اجتياز تحديات مصادر الكهرباء!</h2>
          <p style="font-size: 0.88rem; color: var(--frog); margin-bottom: 14px;">مادة العلوم — الصف الرابع الابتدائي</p>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 0.82rem; font-weight: 800; margin-bottom: 6px;">ادخل اسمك يا بطل العلوم:</label>
            <input type="text" id="cert-name-input" value="البطل الصغير" style="border: 2px solid var(--gold); border-radius: 12px; padding: 8px 16px; font-size: 1rem; font-weight: 900; text-align: center; font-family: inherit; width: 80%; max-width: 280px;" />
          </div>

          <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 20px;">
            <div class="static-stat-pill">🏆 مجموع النقاط: <strong class="val" id="cert-score-val">0</strong></div>
            <div class="static-stat-pill">🎯 التحديات: <strong class="val" id="cert-challenges-val">0</strong></div>
          </div>

          <button type="button" class="static-btn btn-verify" onclick="window.print()" style="margin: 0 auto;">
            <span>🖨️ طباعة الشهادة</span>
          </button>
        </div>
      </dialog>
    </div>
  `;

  // ربط أحداث أزرار الترويسة والتحكم
  bindEvents();

  // بدء التحدي الأول
  startNewChallenge();

  // التحقق من إمكانية تشغيل مدخل الواقع المعزز تلقائياً
  if (typeof window !== 'undefined' && !window.location.hash.includes('skip-ar')) {
    setTimeout(() => {
      openArGateway();
    }, 200);
  }
}

// ─── فتح مدخل الواقع المعزز الحقيقي (True AR Gateway) ───
function openArGateway() {
  launchARGateway({
    onContinue: () => {
      speakArabic(
        'مرحباً بك يا متحرّي العلوم في النشاط التقويمي! مهمتك كشف جهازين يعملان بالمصدر المطلوب وتجنب الفخاخ. اضغط على الأجهزة لاختيارها وفحصها!'
      );
    }
  });
}

// ─── ربط الأحداث الرئيسية ───
function bindEvents() {
  // زر AR
  document.getElementById('btn-ar-launch')?.addEventListener('click', openArGateway);

  // تبديل الصوت
  const voiceBtn = document.getElementById('btn-voice-toggle');
  voiceBtn?.addEventListener('click', () => {
    speechEnabled = !speechEnabled;
    voiceBtn.textContent = speechEnabled ? '🗣️' : '🔇';
    if (!speechEnabled) stopAudio();
    else speakArabic('تم تفعيل التوجيه الصوتي');
  });

  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔈';
  });

  // أزرار الشهادة والمقارنة
  const certDialog = document.getElementById('cert-dialog');
  document.getElementById('btn-cert-open')?.addEventListener('click', () => {
    document.getElementById('cert-score-val').textContent = totalScore;
    document.getElementById('cert-challenges-val').textContent = totalChallenges;
    certDialog?.showModal();
  });
  document.getElementById('cert-close-btn')?.addEventListener('click', () => certDialog?.close());

  const summaryDialog = document.getElementById('summary-dialog');
  document.getElementById('btn-summary')?.addEventListener('click', () => {
    populateSummaryModal();
    summaryDialog?.showModal();
  });
  document.getElementById('summary-close-btn')?.addEventListener('click', () => summaryDialog?.close());

  // أزرار الأوامر
  document.getElementById('btn-validate')?.addEventListener('click', validateSelection);
  document.getElementById('btn-hint')?.addEventListener('click', giveDetectiveHint);
  document.getElementById('btn-refresh')?.addEventListener('click', startNewChallenge);
  document.getElementById('btn-next-challenge')?.addEventListener('click', startNewChallenge);

  // ضبط الروابط وفق موضع الملف (public أو root)
  const isInsidePublic = window.location.pathname.includes('/public/');
  const brandLink = document.getElementById('brand-link');
  const dynamicLink = document.getElementById('dynamic-link');
  if (brandLink) brandLink.href = isInsidePublic ? '../index.html' : './index.html';
  if (dynamicLink) dynamicLink.href = isInsidePublic ? './dynamic-lab.html' : './dynamic-lab.html';
}

// ─── بدء جولة تحدٍّ جديدة ───
function startNewChallenge() {
  isAnswerChecked = false;
  selectedIds.clear();
  document.getElementById('victory-banner').style.display = 'none';

  // التبديل الدوري بين تحدي البطاريات وكهرباء المنزل
  currentTargetType = Math.random() > 0.5 ? 'battery' : 'mains';

  const chip = document.getElementById('target-chip');
  const targetIcon = document.getElementById('target-icon');
  const targetTitle = document.getElementById('target-title');

  if (currentTargetType === 'battery') {
    chip.className = 'static-target-chip chip-battery';
    targetIcon.textContent = '🔋';
    targetTitle.textContent = 'تحدي البطاريات الجافة';
  } else {
    chip.className = 'static-target-chip chip-house';
    targetIcon.textContent = '⚡';
    targetTitle.textContent = 'تحدي كهرباء المنزل 220V';
  }

  updateSelectionCounter();

  // اختيار 4 أجهزة وعرضها في الساحة
  currentDevices = pickChallengeDevices();
  renderCards(currentDevices);

  // نطق التعليمات باللغة العربية
  if (currentTargetType === 'battery') {
    speakArabic('تحدي البطاريات الجافة! حدد جهازين يعملان بالبطارية الجافة وتجنب أجهزة كهرباء المنزل.');
  } else {
    speakArabic('تحدي كهرباء المنزل! حدد جهازين يحتاجان تياراً قوياً من مقبس الجدار 220 فولت.');
  }
}

// ─── رسم البطاقات التفاعلية 3D ───
function renderCards(devices) {
  const stage = document.getElementById('cards-stage');
  if (!stage) return;
  stage.innerHTML = '';

  devices.forEach((dev) => {
    const wrap = document.createElement('div');
    wrap.className = 'card-3d-wrap';

    const svgIcon = SVG_MAP[dev.id] || `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#FFB703"/></svg>`;

    wrap.innerHTML = `
      <div class="card-3d-inner" id="card-inner-${dev.id}">
        <!-- الوجه الأمامي -->
        <div class="card-face card-face-front" data-id="${dev.id}">
          <div class="card-select-badge" id="badge-${dev.id}">○</div>
          <div class="card-visual-box">
            ${svgIcon}
          </div>
          <div class="card-device-name">${dev.name}</div>
          <button type="button" class="btn-flip-inspect" data-inspect="${dev.id}">
            🔍 <span>فحص 3D ومصدر الطاقة</span>
          </button>
        </div>

        <!-- الوجه الخلفي (3D Flip) -->
        <div class="card-face card-face-back">
          <div class="back-header">
            <strong style="font-size:0.85rem;">⚡ الدائرة ومصدر الطاقة</strong>
            <span class="back-voltage-chip">${dev.voltage || (dev.type === 'battery' ? '1.5V بطارية' : '220V مقبس')}</span>
          </div>
          <div class="back-reason-box">
            <div class="back-reason-title">${dev.name}</div>
            <div class="back-reason-text">${dev.reason}</div>
          </div>
          <button type="button" class="btn-flip-back" data-flipback="${dev.id}">
            ↩️ عودة للبطاقة
          </button>
        </div>
      </div>
    `;

    // تفاعل النقر للتحديد (على الوجه الأمامي)
    const front = wrap.querySelector('.card-face-front');
    front.addEventListener('click', (e) => {
      // إذا نقر زر الفحص لا نحدد
      if (e.target.closest('.btn-flip-inspect')) return;
      toggleDeviceSelection(dev.id);
    });

    // تفاعل القلب 3D للفحص
    const inspectBtn = wrap.querySelector(`[data-inspect="${dev.id}"]`);
    const flipBackBtn = wrap.querySelector(`[data-flipback="${dev.id}"]`);
    const inner = wrap.querySelector(`#card-inner-${dev.id}`);

    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      inner.classList.add('is-flipped');
      playFlipSound();
      speakArabic(`فحص ${dev.name}: يعمل بجهد ${dev.voltage || 'محدد'}. ${dev.reason}`);
    });

    flipBackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      inner.classList.remove('is-flipped');
      playFlipSound();
    });

    // تأثير الإمالة ثلاثي الأبعاد بالماوس أو اللمس (3D Perspective Tilt)
    wrap.addEventListener('pointermove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / (rect.height / 2)) * 7;
      const rotY = (x / (rect.width / 2)) * 7;
      if (!inner.classList.contains('is-flipped')) {
        inner.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    });

    wrap.addEventListener('pointerleave', () => {
      if (!inner.classList.contains('is-flipped')) {
        inner.style.transform = '';
      }
    });

    stage.appendChild(wrap);
  });
}

// ─── تبديل تحديد الجهاز ───
function toggleDeviceSelection(devId) {
  if (isAnswerChecked) return;

  const dev = currentDevices.find(d => d.id === devId);
  if (!dev) return;

  const cardFront = document.querySelector(`.card-face-front[data-id="${devId}"]`);
  const badge = document.getElementById(`badge-${devId}`);

  if (selectedIds.has(devId)) {
    selectedIds.delete(devId);
    cardFront?.classList.remove('is-selected');
    if (badge) badge.textContent = '○';
    playSelectSound();
    speakArabic(`ألغيت تحديد ${dev.name}`);
  } else {
    if (selectedIds.size >= 2) {
      speakArabic('حدد جهازين فقط يا بطل، أو ألغِ تحديد أحدهما أولاً!');
      return;
    }
    selectedIds.add(devId);
    cardFront?.classList.add('is-selected');
    if (badge) badge.textContent = '✔️';
    playSelectSound();
    speakArabic(`حددت ${dev.name}`);
  }

  updateSelectionCounter();
}

function updateSelectionCounter() {
  const el = document.getElementById('stat-selected');
  if (el) el.textContent = `${selectedIds.size} / 2`;
}

// ─── التحقق من الإجابة التقويمية ───
function validateSelection() {
  if (selectedIds.size === 0) {
    speakArabic('اختر جهازين أولاً يا بطل العلوم!');
    return;
  }

  if (selectedIds.size < 2) {
    speakArabic('اختر جهازين لتكتمل إجابتك، متبقٍ جهاز واحد!');
    return;
  }

  // الأجهزة الصحيحة في هذا التحدي
  const targetDevices = currentDevices.filter(d => d.type === currentTargetType);
  const targetIds = new Set(targetDevices.map(d => d.id));

  // مطابقة الاختيار
  let isCorrect = true;
  selectedIds.forEach(id => {
    if (!targetIds.has(id)) isCorrect = false;
  });

  if (isCorrect) {
    // 🏆 إجابة صحيحة 100%
    isAnswerChecked = true;
    totalScore += 100;
    totalChallenges += 1;
    document.getElementById('stat-score').textContent = totalScore;
    document.getElementById('stat-challenges').textContent = totalChallenges;

    playWinSound();
    showVictoryBanner();

    speakArabic('رائع جداً يا بطل العلوم! أحسنت عملاً، إجابتك صحيحة مئة بالمئة! كشفت جميع الأجهزة وتجنبت الفخاخ!');
  } else {
    // ❌ إجابة تحتوي على فخ
    playErrorSound();

    // البحث عن الجهاز الخاطئ الذي تم اختياره لتقديم تعليل فوري
    const wrongChosenId = Array.from(selectedIds).find(id => !targetIds.has(id));
    const wrongDev = currentDevices.find(d => d.id === wrongChosenId);

    if (wrongDev) {
      const guidance = wrongDev.wrongReason || wrongDev.reason;
      speakArabic(`حاول مرة أخرى يا بطل! انتبه: ${wrongDev.name} ${guidance}`);
    } else {
      speakArabic('حاول مرة أخرى يا بطل، وتأكد من مصدر الطاقة المناسب لكل جهاز!');
    }
  }
}

function showVictoryBanner() {
  const banner = document.getElementById('victory-banner');
  if (banner) {
    banner.style.display = 'flex';
  }
}

// ─── تلميح المحقق الذكي ───
function giveDetectiveHint() {
  playSelectSound();
  if (currentTargetType === 'battery') {
    speakArabic(
      'تلميح المحقق: الأجهزة الصغيرة المحمولة مثل الساعة والريموت وكشاف الجيب تعمل ببطاريات جافة آمنة. ابحث عن الأجهزة سهلة الحمل!'
    );
  } else {
    speakArabic(
      'تلميح المحقق: الأجهزة الكبيرة والحرارية مثل الثلاجة والفرن والمكواة تستهلك طاقة جبارة لا توفرها إلا كهرباء المنزل من مقبس الجدار 220 فولت!'
    );
  }
}

// ─── تعبئة جدول المقارنة العلمية الشامل ───
function populateSummaryModal() {
  const batteryList = document.getElementById('battery-summary-list');
  const houseList = document.getElementById('house-summary-list');
  if (!batteryList || !houseList) return;

  batteryList.innerHTML = '';
  houseList.innerHTML = '';

  currentDevices.forEach(d => {
    const item = document.createElement('div');
    item.className = 'summary-device-item';
    item.innerHTML = `
      <strong>${d.name} (${d.voltage || (d.type === 'battery' ? '1.5V' : '220V')})</strong>
      <p>${d.reason}</p>
    `;

    if (d.type === 'battery') {
      batteryList.appendChild(item);
    } else {
      houseList.appendChild(item);
    }
  });
}

// ─── التشغيل التلقائي عند اكتمال تحميل DOM ───
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaticLab);
  } else {
    initStaticLab();
  }
}
