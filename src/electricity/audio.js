// One voice at a time. Pre-recorded Arabic has priority over device TTS.
export class GuideVoice {
  constructor(onStatus){this.enabled=false;this.onStatus=onStatus;this.audio=new Audio();this.audio.preload='none';this.revision=0;}
  stop(){++this.revision;this.audio.pause();this.audio.currentTime=0;window.speechSynthesis?.cancel();this.onStatus('idle');}
  async say(key,text,force=false){
    this.stop();if(!this.enabled&&!force)return;const revision=this.revision;
    this.audio.src=`/assets/audio/electricity/${key}.mp3`;this.onStatus('playing');
    this.audio.onended=()=>{if(revision===this.revision)this.onStatus('idle');};
    this.audio.onerror=()=>this.fallback(text,revision);
    try{await this.audio.play();}catch{if(revision===this.revision)this.fallback(text,revision);}
  }
  fallback(text,revision){
    if(revision!==this.revision||this.fallbackRevision===revision)return;
    this.fallbackRevision=revision;
    const synth=window.speechSynthesis;const voice=synth?.getVoices().find(v=>v.lang.startsWith('ar'));
    if(!voice){this.onStatus('unavailable');return;}
    synth.cancel();const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.86;u.onend=()=>{if(revision===this.revision)this.onStatus('idle');};u.onerror=()=>this.onStatus('unavailable');synth.speak(u);
  }
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }
  playSfx(type) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
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
    }
  }
}
