// ═══════════════════════════════════════════════════════════════════════════
// src/materials/audio.js — محرك الصوت والتأثيرات التفاعلية لشخصية «الخبير»
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فئة التحكم بالصوت والتحدث التفاعلي للمساعد التعليمي "الخبير"
 */
export class KhabeerVoice {
  constructor(onStatus = () => {}) {
    this.enabled = true;
    this.onStatus = onStatus;
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.revision = 0;
    this.audioCtx = null;
  }

  /**
   * تشغيل سياق Web Audio API لإنتاج المؤثرات الصوتية فورياً دون الحاجة لملفات خارجية
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
   * نطق جملة صوتية خاصة بـ "الخبير"
   * تبحث أولاً عن ملف صوتي مسجل، ثم تلجأ إلى النطق العربي للمتصفح
   * @param {string} key معرف المقطع الصوتي
   * @param {string} text النص العربي للنطق
   * @param {boolean} force إجبار التشغيل حتى لو كان الصوت مطفأ
   */
  async say(key, text, force = false) {
    this.stop();
    if (!this.enabled && !force) return;
    const revision = this.revision;

    // محاولة تشغيل الملف الصوتي المسجل مسبقاً إن وجد
    this.audio.src = `assets/audio/materials/${key}.mp3`;
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

  /**
   * النطق التوليدي الصوتي العربي عبر SpeechSynthesis
   */
  fallback(text, revision) {
    if (revision !== this.revision || this.fallbackRevision === revision) return;
    this.fallbackRevision = revision;

    const synth = window.speechSynthesis;
    if (!synth) {
      this.onStatus('unavailable');
      return;
    }

    const voices = synth.getVoices() || [];
    // البحث عن صوت عربي
    const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('Arabic'));

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
    } else {
      utterance.lang = 'ar-SA';
    }

    utterance.rate = 0.88; // سرعة هادئة مناسبة لأطفال الصف الرابع
    utterance.pitch = 1.05; // نبرة ودودة ومشرقة

    utterance.onend = () => {
      if (revision === this.revision) this.onStatus('idle');
    };
    utterance.onerror = () => {
      this.onStatus('unavailable');
    };

    synth.speak(utterance);
  }

  /**
   * توليد مؤثرات صوتية تفاعلية غنية ومباشرة (SFX)
   * تعمل بدون أي اعتمادية وبشكل فوري 100%
   * @param {'correct' | 'wrong' | 'pop' | 'camera' | 'badge'} type
   */
  playSfx(type) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'correct') {
      // نغمة نجاح مبهجة ثلاثية النغمات (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'wrong') {
      // نغمة لطيفة وغير محبطة لتنبيه الطالب للمحاولة مجدداً
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'pop') {
      // صوت التقاط أو إفلات خفيف
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
      // صوت غالق الكاميرا
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
}
