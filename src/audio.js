let context = null, nodes = [], speech = null;

export function stopAudio() {
  for (const n of nodes) {
    try { n.stop(); } catch {}
  }
  nodes = [];
  globalThis.speechSynthesis?.cancel();
}

export async function radioTune() {
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    await context.resume();
    for (const [i, f] of [392, 440, 523.25, 440, 392, 329.63].entries()) {
      const o = context.createOscillator(), g = context.createGain(), t = context.currentTime + i * .22;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.035, t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.connect(g);
      g.connect(context.destination);
      o.start(t);
      o.stop(t + .21);
      nodes.push(o);
    }
    return true;
  } catch {
    return false;
  }
}

export function cleanSpeechText(text) {
  if (!text) return '';
  return String(text)
    // Strip emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, ' ')
    // Strip quotes, brackets and formatting symbols that disrupt natural speech
    .replace(/[«»"'“”„`~*_#\[\]{}()<>➔→•|/\\=^~+−]/g, ' ')
    // Normalize dashes and pauses
    .replace(/[-–—]+/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function selectBestVoice(voices, lang) {
  if (!voices || !voices.length) return null;
  const targetPrefix = String(lang || 'ar').slice(0, 2).toLowerCase();
  const matching = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));
  if (!matching.length) {
    return voices.find(v => v.default) || voices[0] || null;
  }

  const scoreVoice = v => {
    let s = 0;
    const name = (v.name || '').toLowerCase();
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');

    // 1. الأولوية القصوى للأصوات النسائية الناعمة الطبيعية (Soft Natural Female Voices)
    if (name.includes('salma') || name.includes('zariyah') || name.includes('fatima') || name.includes('sana')) s += 300;
    if (name.includes('laila') || name.includes('mariam') || name.includes('zeina') || name.includes('hoda')) s += 200;
    if (name.includes('female') || name.includes('woman') || name.includes('girl')) s += 150;

    // الأصوات العصبية الطبيعية الحديثة (Neural / Natural / Online)
    if (name.includes('natural') || name.includes('online') || name.includes('neural')) s += 100;
    if (name.includes('google')) s += 50;

    // خفض نقاط الأصوات الذكورية تماماً لضمان اختيار صوت أنثوي ناعم
    if (name.includes('shakir') || name.includes('hamed') || name.includes('hamdan') || 
        name.includes('naayf') || name.includes('maged') || name.includes('tarik') || 
        name.includes('youssef') || name.includes('male') || name.includes('man')) {
      s -= 200;
    }

    // تفضيل اللهجات الفصحى الرسمية
    if (vLang === 'ar-sa' || vLang === 'ar-eg' || vLang === 'ar-ae') s += 25;

    // الخدمة السحابية العصبية عالية الجودة
    if (!v.localService) s += 20;
    if (v.default) s += 5;

    return s;
  };

  return [...matching].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

// ─── منع تجميد الصوت في الهواتف الذكية (iOS Safari & Android Chrome GC / Freeze Fix) ───
const activeUtterances = new Set();
let speechUnlockBound = false;

function bindSpeechUnlock() {
  if (typeof window === 'undefined' || !globalThis.speechSynthesis || speechUnlockBound) return;
  speechUnlockBound = true;

  const unlock = () => {
    try {
      if (globalThis.speechSynthesis.paused) {
        globalThis.speechSynthesis.resume();
      }
      // تشغيل نغمة صامتة جداً لفتح قفل الصوت في نظام iOS
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      u.rate = 10;
      globalThis.speechSynthesis.speak(u);
    } catch {}
    ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(evt => {
      window.removeEventListener(evt, unlock, { capture: true });
    });
  };

  ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(evt => {
    window.addEventListener(evt, unlock, { capture: true, once: true, passive: true });
  });
}

// تفعيل فتح قفل الصوت فور تحميل الملف
if (typeof window !== 'undefined') {
  bindSpeechUnlock();
}

// Pre-warm voices cache as soon as the browser loads them
if (typeof window !== 'undefined' && globalThis.speechSynthesis) {
  try {
    globalThis.speechSynthesis.getVoices();
    if (globalThis.speechSynthesis.onvoiceschanged !== undefined) {
      globalThis.speechSynthesis.onvoiceschanged = () => {
        try { globalThis.speechSynthesis.getVoices(); } catch {}
      };
    }
  } catch {}
}

export function speak(text, lang = 'ar', options = {}) {
  stopAudio();
  if (!globalThis.speechSynthesis) return false;

  const cleaned = cleanSpeechText(text);
  if (!cleaned) return false;

  try {
    // التأكد من استئناف محرّك الصوت إن كان في حالة pause
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  } catch {}

  let voices = [];
  try {
    voices = speechSynthesis.getVoices() || [];
  } catch {}
  const voice = selectBestVoice(voices, lang);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang === 'en' ? 'en-US' : 'ar-SA';
  }

  // ضبط السرعة والنبرة - نبرة أنثوية ناعمة ومخارج حروف واضحة جداً
  utterance.rate = options.rate ?? 0.92;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  // الاحتفاظ بالمرجع لمنع محرك الـ Garbage Collector في iOS/Android من مسحه أثناء النطق
  activeUtterances.add(utterance);
  if (typeof window !== 'undefined') {
    window.__currentSpeechUtterance = utterance;
  }

  utterance.onend = () => {
    activeUtterances.delete(utterance);
    if (typeof window !== 'undefined' && window.__currentSpeechUtterance === utterance) {
      window.__currentSpeechUtterance = null;
    }
  };

  utterance.onerror = () => {
    activeUtterances.delete(utterance);
    if (typeof window !== 'undefined' && window.__currentSpeechUtterance === utterance) {
      window.__currentSpeechUtterance = null;
    }
  };

  speech = utterance;

  try {
    // تشغيل الصوت بعد تأخير متناهي الصغر (Microtask) لضمان انتهاء cancel السابقة في WebKit
    setTimeout(() => {
      try {
        if (speechSynthesis.paused) speechSynthesis.resume();
        speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech speak retry failed:', err);
      }
    }, 15);
    return true;
  } catch {
    return false;
  }
}

// ─── توجيهات صوتية تعليمية مساندة باللغة العربية الفصحى السليمة ───

export function speakIntro(mode = 'dynamic') {
  const msg = mode === 'dynamic'
    ? 'مَرْحَبًا بِكَ يَا بَطَلَ العُلُومِ فِي مُخْتَبَرِ المـُحَاكَاةِ ثُلَاثِيَّةِ الأَبْعَاد! اسْحَبِ البَطَّارِيَّةَ الجَافَّةَ وَضَعْهَا دَاخِلَ حُجْرَةِ السَّيَّارَةِ أَوْ الرَّادْيُو، أَوِ اسْحَبِ القَابِسَ إِلَى المَقْبَسِ لِتَشْغِيلِ الأَجْهِزَةِ المَنْزِلِيَّةِ الكَبِيرَةِ.'
    : 'مَرْحَبًا بِكَ يَا مُتَحَرِّيَ العُلُومِ فِي النَّشَاطِ التَّقْوِيمِيّ! حَدِّدْ جِهَازَيْنِ يَعْمَلَانِ بِالمَصْدَرِ المَطْلُوبِ، وَاضْغَطْ فَحْصَ ثُلَاثِيَّ الأَبْعَادِ لِكَشْفِ دَائِرَةِ الطَّاقَة.';
  return speak(msg, 'ar');
}

export function speakToolPick(tool) {
  const msg = tool === 'battery'
    ? 'أَمْسَكْتَ البَطَّارِيَّةَ الجَافَّة! اسْحَبْهَا الآنَ وَضَعْهَا دَاخِلَ حُجْرَةِ البَطَّارِيَّةِ فِي الجِهَازِ لِتَشْغِيلِهِ.'
    : 'أَمْسَكْتَ قَابِسَ الكَهْرَبَاءِ! اسْحَبِ القَابِسَ إِلَى المَقْبَسِ الجِدَارِيِّ لِتَوْصِيلِ تَيَّارِ مِئَتَيْنِ وَعِشْرِينَ فُولْت.';
  return speak(msg, 'ar');
}

export function speakDropSuccess(deviceName, reason = '') {
  const msg = `رَائِعٌ جِدًّا! أَحْسَنْتَ عَمَلًا مُمَيَّزًا! اكْتَمَلَتِ الدَّائِرَةُ الكَهْرَبَائِيَّةُ وَتَمَّ تَشْغِيلُ ${deviceName} بِنَجَاح! ${reason}`;
  return speak(msg, 'ar');
}

export function speakDropIncompatible(deviceName, wrongReason = '') {
  const msg = `حَاوِلْ مَرَّةً أُخْرَى يَا بَطَل! جِهَازُ ${deviceName} لَا يَعْمَلُ بِهَذَا المَصْدَرِ. ${wrongReason}`;
  return speak(msg, 'ar');
}

export function speakHint(hintText) {
  const msg = `تَلْمِيحٌ ذَكِيّ: ${hintText}`;
  return speak(msg, 'ar');
}
