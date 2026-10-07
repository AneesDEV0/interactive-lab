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
}
