// ═══════════════════════════════════════════════════════════════════════════
// src/safety/audio.js — محرك الصوت والمؤثرات التفاعلية لشخصية «حارس الأمان»
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فئة التحكم بالصوت والنطق التفاعلي للمساعد التعليمي "حارس الأمان"
 */
export class SafetyVoice {
  constructor(onStatus = () => {}) {
    this.enabled = true;
    this.onStatus = onStatus;
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.revision = 0;
    this.audioCtx = null;
    this.fallbackRevision = 0;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  stop() {
    ++this.revision;
    this.audio.pause();
    this.audio.currentTime = 0;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.onStatus('idle');
  }

  async say(key, text, force = false) {
    this.stop();
    if (!this.enabled && !force) return;
    const revision = this.revision;

    this.audio.src = `assets/audio/safety/${key}.mp3`;
    this.onStatus('playing');

    this.audio.onended = () => {
      if (revision === this.revision) this.onStatus('idle');
    };

    this.audio.onerror = () => {
      this.fallback(text, revision);
    };

    try {
      await this.audio.play();
    } catch {
      if (revision === this.revision) {
        this.fallback(text, revision);
      }
    }
  }

  speak(text, force = false) {
    return this.say('dynamic', text, force);
  }

  fallback(text, revision) {
    if (revision !== this.revision || this.fallbackRevision === revision) return;
    this.fallbackRevision = revision;

    const synth = window.speechSynthesis;
    if (!synth) {
      this.onStatus('unavailable');
      return;
    }

    const voices = synth.getVoices() || [];
    const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('Arabic'));

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
    } else {
      utterance.lang = 'ar-SA';
    }

    utterance.rate = 0.88;
    utterance.pitch = 1.02;

    utterance.onend = () => {
      if (revision === this.revision) this.onStatus('idle');
    };
    utterance.onerror = () => {
      this.onStatus('unavailable');
    };

    synth.speak(utterance);
  }

  playSfx(type) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct' || type === 'safe') {
      // نغمة أمان خضراء هادئة ومبهجة (F5 -> A5 -> C6)
      const freqs = [698.46, 880.00, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'wrong' || type === 'hazard' || type === 'shock' || type === 'electric') {
      // ⚡ محاكاة صوت كهرباء وصعق وتفريغ واقعي 100% (Electrical Zap & Spark SFX)
      // 1. أزيز التيار المتردد (50/60Hz AC mains hum + 120Hz buzz)
      const humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humOsc.type = 'sawtooth';
      humOsc.frequency.setValueAtTime(60, now);
      humOsc.frequency.linearRampToValueAtTime(120, now + 0.12);
      humGain.gain.setValueAtTime(0.24, now);
      humGain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
      humOsc.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start(now);
      humOsc.stop(now + 0.36);

      // 2. دفقات شرر وتفريغ كهربائي متقطع حقيقي (Electrical Crackle / Spark Arcing)
      const bufferSize = Math.floor(ctx.sampleRate * 0.32);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // شحنات وتفريغات عشوائية متقطعة
        output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.35 ? 1 : 0);
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      // 3. نغمة صاعقة كهربائية حادة وسريعة (ZAP)
      const zapOsc = ctx.createOscillator();
      const zapGain = ctx.createGain();
      zapOsc.type = 'triangle';
      zapOsc.frequency.setValueAtTime(950, now);
      zapOsc.frequency.exponentialRampToValueAtTime(95, now + 0.22);
      zapGain.gain.setValueAtTime(0.26, now);
      zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      zapOsc.connect(zapGain);
      zapGain.connect(ctx.destination);
      zapOsc.start(now);
      zapOsc.stop(now + 0.25);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'camera') {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    }
  }

  playSuccess() {
    this.playSfx('correct');
  }

  playRetry() {
    this.playSfx('wrong');
  }
}
