// ═══════════════════════════════════════════════════════════════════════════
// src/conductors/audio.js — محرك الصوت والمؤثرات التفاعلية للبروفيسور
// ═══════════════════════════════════════════════════════════════════════════

export class ProfessorVoice {
  constructor(onStatus = () => {}) {
    this.enabled = true;
    this.onStatus = onStatus;
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.revision = 0;
    this.audioCtx = null;
  }

  /**
   * تشغيل سياق Web Audio API لإنتاج المؤثرات الصوتية فورياً
   */
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

  /**
   * إيقاف أي صوت أو نطق حالي
   */
  stop() {
    ++this.revision;
    this.audio.pause();
    this.audio.currentTime = 0;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.onStatus('idle');
  }

  /**
   * نطق جملة صوتية للبروفيسور
   * @param {string} text النص العربي للنطق
   * @param {boolean} force إجبار التشغيل حتى لو كان الصوت مغلقاً
   */
  async speak(text, force = false) {
    this.stop();
    if (!this.enabled && !force) return;
    const revision = this.revision;

    if (!('speechSynthesis' in window)) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang && v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.onstart = () => {
        if (this.revision === revision) {
          this.onStatus('speaking');
        }
      };

      utterance.onend = () => {
        if (this.revision === revision) {
          this.onStatus('idle');
        }
      };

      utterance.onerror = () => {
        if (this.revision === revision) {
          this.onStatus('idle');
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.onStatus('idle');
    }
  }

  /**
   * نغمة نجاح وتوصيل صحيح (Electric Success Arpeggio)
   */
  playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (نغمة إشراقة علمية)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  /**
   * نغمة تنبيه لطيفة للمحاولة من جديد (Friendly Hint Tone)
   */
  playHint() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.22); // C4

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * نغمة فوز واكتمال التقرير النهائي (Professor Victory Fanfare)
   */
  playFanfare() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0.00, d: 0.12 }, // C5
      { f: 659.25, t: 0.14, d: 0.12 }, // E5
      { f: 783.99, t: 0.28, d: 0.12 }, // G5
      { f: 1046.5, t: 0.44, d: 0.35 }, // C6
      { f: 880.00, t: 0.82, d: 0.14 }, // A5
      { f: 1046.5, t: 1.00, d: 0.55 }  // C6 طويلة
    ];

    melody.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.2, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });
  }
}
