// ═══════════════════════════════════════════════════════════════════════════
// src/audio.js — المنظومة الصوتية الهجينة ثلاثية الطبقات (3-Tier Audio Engine)
// تدعم النشاطين: الثابت والمتحرك مع بنك المفاتيح الـ 24 وWeb Speech API المحمي
// ═══════════════════════════════════════════════════════════════════════════

import { ALL_DEVICES } from './config.js';

// ─── بنك المفاتيح والنصوص الصوتية المعتمدة للمنصة بالكامل ───
export const AUDIO_REGISTRY = {
  // ─── 1. مفاتيح النشاط التقويمي الثابت (Static Lab) ───
  'mission.battery': { file: './audio/ar/mission.battery.mp3', text: 'هيا يا بطل العلوم! ابحث عن جهازين يعملان بالبطاريات الجافة، واضغط فحص 3D لتكتشف حجرة البطاريات أو سلك الكهرباء!' },
  'mission.mains': { file: './audio/ar/mission.mains.mp3', text: 'هيا يا ذكي! ابحث عن جهازين يحتاجان كهرباء المنزل 220 فولت، واضغط فحص 3D لتفحص الجهاز بنفسك!' },
  'hint.battery': { file: './audio/ar/hint.battery.mp3', text: 'تلميح المحقق: اضغط زر فحص 3D على الأجهزة، وابحث عن الجهاز الذي يحتوي على حجرة بطاريات صغيرة وزوج من الأقطاب!' },
  'hint.mains': { file: './audio/ar/hint.mains.mp3', text: 'تلميح المحقق: اضغط زر فحص 3D على الأجهزة، وابحث عن الجهاز الذي يمتد منه سلك كهربائي قوي ينتهي بفيشة جدارية!' },
  'ui.welcome_ar': { file: './audio/ar/ui.welcome_ar.mp3', text: 'مرحباً بك يا بطل العلوم في النشاط التقويمي! حَدِّدْ جهازين يعملان بالمصدر المطلوب وتجنب الفخاخ. اضغط على الأجهزة لاختيارها، واضغط فحص ثري دي لكشف أسرارها!' },
  'ui.select_two': { file: './audio/ar/ui.select_two.mp3', text: 'اخْتَرْ جهازين أولاً يا بطل العلوم للتحقق من إجابتك!' },
  'ui.need_two': { file: './audio/ar/ui.need_two.mp3', text: 'اخْتَرْ جهازين لتكتمل إجابتك، متبقٍ جهاز واحد يا بطل!' },
  'ui.limit_two': { file: './audio/ar/ui.limit_two.mp3', text: 'حَدِّدْ جهازين فقط يا بطل، أو ألغِ تحديد أحدهما أولاً!' },
  'ui.ready_validate': { file: './audio/ar/ui.ready_validate.mp3', text: 'رائع، اكتمل جهازان! اضغط الآن زر: تحقق من إجابتي.' },
  'ui.win': { file: './audio/ar/ui.win.mp3', text: 'أنت بطل وعبقري! إجابة صحيحة مئة بالمئة! كشفت جميع الأجهزة وتجنبت الفخاخ ببراعة!' },
  'ui.general_wrong': { file: './audio/ar/ui.general_wrong.mp3', text: 'قريباً جداً يا بطل! تفحص الأجهزة عبر زر فحص ثري دي واكتشف مصدر طاقتها بنفسك. حاول مرة أخرى!' },
  'ui.voice_enabled': { file: './audio/ar/ui.voice_enabled.mp3', text: 'تم تفعيل التوجيه الصوتي بنجاح!' },

  // ─── 2. مفاتيح المختبر المتحرك العامة (Dynamic Lab General) ───
  'dyn.intro': { file: './audio/ar/dyn.intro.mp3', text: 'أهلاً بك يا بطل العلوم في مختبر شرارة المتحرك! اسحب البطارية أو القابس وجرب تشغيل الأجهزة ثلاثية الأبعاد!' },
  'dyn.pickBattery': { file: './audio/ar/dyn.pickBattery.mp3', text: 'اخترتَ البطارية الجافة! اسحبها وأفلتها فوق أحد الأجهزة لتجربة تشغيله.' },
  'dyn.pickMains': { file: './audio/ar/dyn.pickMains.mp3', text: 'اخترتَ قابس كهرباء المنزل 220 فولت! صِله بالجهاز لمشاهدة ما سيحدث.' },
  'dyn.roundComplete': { file: './audio/ar/dyn.roundComplete.mp3', text: 'ألف مبارك! اكتشفتَ مصادر طاقة جميع أجهزة هذه الجولة بنجاح باهر!' },
  'dyn.streak': { file: './audio/ar/dyn.streak.mp3', text: 'أداء مذهل وسلسلة صحيحة! واصل تألقك في استكشاف الأجهزة التالية!' },
  'dyn.powerMeter': { file: './audio/ar/dyn.powerMeter.mp3', text: 'انظر لمقياس القدرة! قارن بين طاقة البطارية الخفيفة وحاجة هذا الجهاز للتيار القوي.' }
};

// توليد مفاتيح الأجهزة الـ 24 للنشاط الثابت والمتحرك تلقائياً
ALL_DEVICES.forEach(dev => {
  // مفاتيح الثابت (Guide Map Keys)
  AUDIO_REGISTRY[`guide.${dev.id}.prompt`] = { file: `./audio/ar/guide.${dev.id}.prompt.mp3`, text: `تفحص ${dev.name} جيداً، ما مصدر طاقته المناسب؟` };
  AUDIO_REGISTRY[`guide.${dev.id}.correct`] = { file: `./audio/ar/guide.${dev.id}.correct.mp3`, text: `أحسنت يا بطل! ${dev.reason}` };
  AUDIO_REGISTRY[`guide.${dev.id}.wrong`] = { file: `./audio/ar/guide.${dev.id}.wrong.mp3`, text: `قريباً جداً! ${dev.wrongReason}` };
  AUDIO_REGISTRY[`guide.${dev.id}.inspect`] = { file: `./audio/ar/guide.${dev.id}.inspect.mp3`, text: `هيا يا محقق! تفحص ${dev.name} من جميع الجهات؛ هل ترى حجرة بطاريات أم سلكاً كهربائياً؟` };
  AUDIO_REGISTRY[`guide.${dev.id}.select`] = { file: `./audio/ar/guide.${dev.id}.select.mp3`, text: `حَدَّدْتَ ${dev.name}! اخْتَرْ جهازاً ثانياً يا بطل.` };
  AUDIO_REGISTRY[`guide.${dev.id}.deselect`] = { file: `./audio/ar/guide.${dev.id}.deselect.mp3`, text: `ألغيتَ تحديد ${dev.name}! اخْتَرْ جهازاً آخر.` };

  // مفاتيح المتحرك (Dynamic Lab Keys)
  AUDIO_REGISTRY[`dyn.${dev.id}.success`] = { file: `./audio/ar/dyn.${dev.id}.success.mp3`, text: `رائع جداً! تم تشغيل ${dev.name} بنجاح! ${dev.reason}` };
  AUDIO_REGISTRY[`dyn.${dev.id}.wrong`] = { file: `./audio/ar/dyn.${dev.id}.wrong.mp3`, text: `حاول مجدداً يا بطل! ${dev.name} لا يعمل بهذا المصدر. ${dev.wrongReason}` };
  AUDIO_REGISTRY[`dyn.${dev.id}.hint`] = { file: `./audio/ar/dyn.${dev.id}.hint.mp3`, text: `تلميح المحقق: ${dev.name} يستهلك ${dev.watts} تقريباً. فكر في مصدر طاقته المناسب.` };
  AUDIO_REGISTRY[`dyn.${dev.id}.predict`] = { file: `./audio/ar/dyn.${dev.id}.predict.mp3`, text: `ما هو توقعك العلمي لجهاز ${dev.name}؟` };
});

// ─── كشف المتصفحات المدمجة (In-App Browsers) ───
export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  return /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram|TikTok|wv|Snapchat/i.test(ua);
}

// ─── المشغل الصوتي الموحد (Singleton HTMLAudioElement) للطبقة 1 ───
let audioSingleton = null;
let currentPlaybackToken = 0;
let isAudioUnlocked = false;
let pendingPlayback = null;
let lastAudioError = null;

export function getAudioSingleton() {
  if (!audioSingleton && typeof window !== 'undefined') {
    audioSingleton = new Audio();
    audioSingleton.preload = 'auto';
    audioSingleton.playsInline = true;
    audioSingleton.setAttribute('playsinline', '');
    audioSingleton.setAttribute('webkit-playsinline', '');
  }
  return audioSingleton;
}

// ─── فك حظر الصوت في الجوالات (Mobile Audio Gesture Unlock) ───
export async function unlockAudioSystem() {
  if (isAudioUnlocked) return true;

  try {
    const audio = getAudioSingleton();
    if (audio) {
      // تشغيل ملف صامت جداً
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      await audio.play();
      audio.pause();
      isAudioUnlocked = true;
    }

    // فك حظر SpeechSynthesis
    if (typeof window !== 'undefined' && globalThis.speechSynthesis) {
      if (globalThis.speechSynthesis.paused) globalThis.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      u.rate = 10;
      globalThis.speechSynthesis.speak(u);
    }

    if (pendingPlayback) {
      const { key, fallbackText, options } = pendingPlayback;
      pendingPlayback = null;
      speakKey(key, fallbackText, options);
    }
    return true;
  } catch (err) {
    lastAudioError = err.message;
    console.warn('[Audio Unlock Retry Needed]', err);
    return false;
  }
}

// ربط مستمعات الفتح على أحداث المستخدم المباشرة
if (typeof window !== 'undefined') {
  const handleUserUnlock = () => {
    unlockAudioSystem().then(success => {
      if (success) {
        ['touchend', 'click', 'keydown'].forEach(evt => {
          window.removeEventListener(evt, handleUserUnlock, { capture: true });
        });
      }
    });
  };

  ['touchend', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, handleUserUnlock, { capture: true, passive: true });
  });

  // إيقاف الصوت تلقائياً عند مغادرة التبويب
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAudio();
  });
}

// ─── إيقاف جميع الأصوات الجارية ───
export function stopAudio() {
  currentPlaybackToken++;
  if (audioSingleton) {
    try {
      audioSingleton.pause();
      audioSingleton.currentTime = 0;
    } catch {}
  }
  if (typeof window !== 'undefined' && globalThis.speechSynthesis) {
    try {
      globalThis.speechSynthesis.cancel();
      if (window.__activeSpeechUtterance) {
        window.__activeSpeechUtterance = null;
      }
    } catch {}
  }
}

// ─── اختيار أفضل صوت عربي أصيل حصراً (selectBestVoice) ───
export function selectBestVoice(voices, lang = 'ar') {
  if (!voices || !voices.length) return null;
  const isArabicTarget = lang.startsWith('ar');

  const arabicVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  if (isArabicTarget && !arabicVoices.length) {
    return null; // ارجع null واعتمد على lang='ar-SA' الافتراضي
  }

  const candidatePool = isArabicTarget ? arabicVoices : voices;

  const scoreVoice = (v) => {
    let score = 0;
    const n = (v.name || '').toLowerCase();
    const l = (v.lang || '').toLowerCase();

    if (l === 'ar-sa') score += 50;
    if (l.startsWith('ar')) score += 30;
    if (n.includes('natural') || n.includes('neural') || n.includes('zariyah') || n.includes('salma') || n.includes('maged')) score += 40;
    if (n.includes('google') || n.includes('siri') || n.includes('apple') || n.includes('microsoft')) score += 20;
    if (v.localService) score += 10;
    return score;
  };

  return [...candidatePool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

// ─── تشغيل الاحتياط عبر Web Speech API (الطبقة 2) ───
function speakTts(text, lang = 'ar', options = {}, token = null) {
  if (typeof window === 'undefined' || !globalThis.speechSynthesis) return false;

  const cleaned = text.replace(/[#*_`~]/g, '').trim();
  if (!cleaned) return false;

  try {
    if (globalThis.speechSynthesis.paused) globalThis.speechSynthesis.resume();
  } catch {}

  let voices = [];
  try { voices = globalThis.speechSynthesis.getVoices() || []; } catch {}
  const voice = selectBestVoice(voices, lang);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang.startsWith('en') ? 'en-US' : 'ar-SA';
  }

  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1.05;
  utterance.volume = options.volume ?? 1.0;

  window.__activeSpeechUtterance = utterance;

  const cleanup = () => {
    if (window.__activeSpeechUtterance === utterance) {
      window.__activeSpeechUtterance = null;
    }
  };
  utterance.onend = cleanup;
  utterance.onerror = cleanup;

  try {
    setTimeout(() => {
      if (token !== null && token !== currentPlaybackToken) return;
      try {
        if (globalThis.speechSynthesis.paused) globalThis.speechSynthesis.resume();
        globalThis.speechSynthesis.speak(utterance);
      } catch (err) {
        lastAudioError = err.message;
      }
    }, 15);
    return true;
  } catch {
    return false;
  }
}

// ─── المحرك الرئيسي للنطق (speakKey: Tier 1 -> Tier 2 -> Tier 3) ───
export async function speakKey(key, fallbackText = '', options = {}) {
  stopAudio();
  const token = currentPlaybackToken;

  if (options.enabled === false) return false;

  if (!isAudioUnlocked && typeof window !== 'undefined') {
    pendingPlayback = { key, fallbackText, options };
  }

  const entry = AUDIO_REGISTRY[key];
  const audioFilePath = entry ? entry.file : null;
  const spokenText = fallbackText || (entry ? entry.text : key);

  // ─── الطبقة 1: تشغيل ملف MP3 المسجل ───
  if (audioFilePath) {
    try {
      const audio = getAudioSingleton();
      if (audio) {
        // مسار محدد ديناميكياً باستخدام import.meta.url
        const resolvedPath = new URL(audioFilePath, import.meta.url).href;
        audio.src = resolvedPath;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          await playPromise;
          if (token !== currentPlaybackToken) {
            audio.pause();
            return false;
          }
          return true;
        }
      }
    } catch (err) {
      lastAudioError = err.message;
      console.warn(`[Audio Tier-1 Fallback] (${key}):`, err.message);
    }
  }

  // ─── الطبقة 2: تشغيل الاحتياط عبر Web Speech API ───
  const ttsSuccess = speakTts(spokenText, 'ar', options, token);
  if (ttsSuccess) return true;

  // ─── الطبقة 3: إشعار النظام بحالة الفشل للتعامل معها بصرياً ───
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('audio-playback-failed', {
      detail: { key, text: spokenText, inApp: detectInAppBrowser() }
    }));
  }

  return false;
}

// ─── دوال التوجيه الصوتي للمتحرك ───
export function speak(text, lang = 'ar', options = {}) {
  const matchingKey = Object.keys(AUDIO_REGISTRY).find(k => AUDIO_REGISTRY[k].text === text);
  if (matchingKey) return speakKey(matchingKey, text, options);
  stopAudio();
  return speakTts(text, lang, options, currentPlaybackToken);
}

export function speakIntro(mode = 'dynamic') {
  return speakKey('dyn.intro', 'أهلاً بك يا بطل العلوم في مختبر شرارة المتحرك! اسحب البطارية أو القابس وجرب تشغيل الأجهزة ثلاثية الأبعاد!');
}

export function speakToolPick(tool) {
  return speakKey(tool === 'battery' ? 'dyn.pickBattery' : 'dyn.pickMains');
}

export function speakDropSuccess(deviceName, reason = '') {
  const dev = Object.values(ALL_DEVICES).find(d => d.name === deviceName);
  if (dev) return speakKey(`dyn.${dev.id}.success`, `رائع جداً! تم تشغيل ${deviceName} بنجاح! ${reason}`);
  return speak(`رائع جداً! تم تشغيل ${deviceName} بنجاح! ${reason}`, 'ar');
}

export function speakDropIncompatible(deviceName, wrongReason = '') {
  const dev = Object.values(ALL_DEVICES).find(d => d.name === deviceName);
  if (dev) return speakKey(`dyn.${dev.id}.wrong`, `حاول مجدداً يا بطل! ${deviceName} لا يعمل بهذا المصدر. ${wrongReason}`);
  return speak(`حاول مجدداً يا بطل! ${deviceName} لا يعمل بهذا المصدر. ${wrongReason}`, 'ar');
}

export function speakHint(hintText) {
  return speak(`تلميح ذكي: ${hintText}`, 'ar');
}

// ─── نغمة الراديو التفاعلية ───
let webAudioCtx = null;
export async function radioTune() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    webAudioCtx = webAudioCtx || new AudioContextClass();
    if (webAudioCtx.state === 'suspended') await webAudioCtx.resume();

    for (const [i, f] of [392, 440, 523.25, 440, 392, 329.63].entries()) {
      const o = webAudioCtx.createOscillator(), g = webAudioCtx.createGain(), t = webAudioCtx.currentTime + i * .22;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.035, t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.connect(g);
      g.connect(webAudioCtx.destination);
      o.start(t);
      o.stop(t + .21);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── لوحة تشخيص الصوت (?debugAudio=1) ───
if (typeof window !== 'undefined' && window.location.search.includes('debugAudio=1')) {
  window.audioDiagnostics = () => ({
    unlocked: isAudioUnlocked,
    inApp: detectInAppBrowser(),
    userAgent: navigator.userAgent,
    hasSpeechSynthesis: Boolean(window.speechSynthesis),
    voicesCount: window.speechSynthesis ? window.speechSynthesis.getVoices().length : 0,
    arabicVoices: window.speechSynthesis ? window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar')).map(v => v.name) : [],
    lastError: lastAudioError,
    registryKeys: Object.keys(AUDIO_REGISTRY).length
  });
  console.table(window.audioDiagnostics());
}
