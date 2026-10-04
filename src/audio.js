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

    // Prefer modern high-definition neural / natural voices
    if (name.includes('natural') || name.includes('online') || name.includes('neural')) s += 100;
    if (name.includes('google')) s += 50;

    // High quality named Arabic neural voices (Edge / Windows / Chrome / Apple)
    if (name.includes('shakir') || name.includes('salma') || name.includes('hamed') || name.includes('zariyah') || name.includes('naayf') || name.includes('maged')) s += 40;
    if (name.includes('laila') || name.includes('tarik') || name.includes('mariam') || name.includes('hoda')) s += 25;

    // Region preference
    if (vLang === 'ar-sa' || vLang === 'ar-eg' || vLang === 'ar-ae') s += 15;

    // Remote neural web service
    if (!v.localService) s += 10;
    if (v.default) s += 5;

    return s;
  };

  return [...matching].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
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

export function speak(text, lang) {
  stopAudio();
  if (!globalThis.speechSynthesis) return false;

  const cleaned = cleanSpeechText(text);
  if (!cleaned) return false;

  const voices = speechSynthesis.getVoices();
  const voice = selectBestVoice(voices, lang);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang === 'en' ? 'en-US' : 'ar-SA';
  }

  // Tuned for natural, clear, bright, engaging educational robot
  utterance.rate = 1.0;
  utterance.pitch = 1.08;
  utterance.volume = 1.0;

  speech = utterance;
  try {
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
