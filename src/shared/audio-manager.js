import {findRecording,normalizeSpeechText,readVoicePreferences,selectArabicVoice} from './voice-policy.js';

// Playback is offline. Recorded narration and device speech are separate, explicit choices.
export class AudioManager {
  constructor(onStatus=()=>{}) {
    this.onStatus=onStatus;this.revision=0;this.audio=new Audio();this.audio.preload='none';
    this.enabled=false;this.preferences=readVoicePreferences(null);
    try{this.enabled=localStorage.getItem('sharara-sound')==='on';this.preferences=readVoicePreferences(localStorage.getItem('sharara-voice-v1'));}catch{}
    this.unlocked=false;this.manifest={};this.humanRecordings=[];
    this.manifestReady=Promise.all([
      fetch('/assets/audio/electricity/manifest.json').then(r=>r.ok?r.json():{}).then(m=>{this.manifest=m;}).catch(()=>{}),
      fetch('/assets/audio/narration/manifest.json').then(r=>r.ok?r.json():{}).then(m=>{
        this.humanRecordings=Array.isArray(m.recordings)?m.recordings.filter(r=>typeof r.text==='string'&&typeof r.file==='string'&&/^[a-zA-Z0-9_-]+\.(mp3|wav|ogg)$/.test(r.file)):[];
      }).catch(()=>{}),
    ]);
    this.voices=()=>window.speechSynthesis?.getVoices().filter(v=>v.localService&&/^ar(?:[-_]|$)/i.test(v.lang))||[];
    window.speechSynthesis?.getVoices();
    window.addEventListener('pagehide',()=>this.stop());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
  }
  configure(patch){
    this.stop();this.preferences=readVoicePreferences(JSON.stringify({...this.preferences,...patch}));
    try{localStorage.setItem('sharara-voice-v1',JSON.stringify(this.preferences));}catch{}
  }
  toggle(){this.unlocked=true;this.enabled=!this.enabled;try{localStorage.setItem('sharara-sound',this.enabled?'on':'off');}catch{}if(!this.enabled)this.stop();}
  stop(){++this.revision;this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.audio.removeAttribute('src');window.speechSynthesis?.cancel();this.onStatus('idle');}
  async speak(text,explicit=false){
    this.stop();if(explicit)this.unlocked=true;
    if(!this.unlocked||(!this.enabled&&!explicit))return;
    const revision=this.revision;await this.manifestReady;if(revision!==this.revision)return;
    if(this.preferences.mode==='device'){await this.speakDevice(text,revision);return;}
    let source;
    if(this.preferences.mode==='human'){
      const clip=this.humanRecordings.find(r=>normalizeSpeechText(r.text)===normalizeSpeechText(text));
      if(clip)source='/assets/audio/narration/'+clip.file;
    }else{
      const clip=this.humanRecordings.find(r=>normalizeSpeechText(r.text)===normalizeSpeechText(text));
      if(clip){
        source='/assets/audio/narration/'+clip.file;
      }else{
        const key=findRecording(this.manifest,text);
        if(key)source=`/assets/audio/electricity/${key}.mp3`;
      }
    }
    if(!source){this.onStatus('missing-recording');return;}
    this.audio.src=source;this.audio.preservesPitch=true;this.audio.playbackRate=this.preferences.rate;
    this.audio.onended=()=>{if(revision===this.revision)this.onStatus('idle');};
    this.audio.onerror=()=>{if(revision===this.revision)this.onStatus('recording-error');};
    this.onStatus('playing');try{await this.audio.play();}catch{if(revision===this.revision)this.onStatus('recording-error');}
  }
  async speakDevice(text,revision){
    const synth=window.speechSynthesis;
    if(synth&&!this.voices().length)await new Promise(resolve=>{
      const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',finish);resolve();};
      const timer=setTimeout(finish,1200);synth.addEventListener('voiceschanged',finish);
    });
    if(revision!==this.revision)return;
    const voice=selectArabicVoice(this.voices(),this.preferences.voiceURI);
    if(!voice){this.onStatus('unavailable');return;}
    // Pin the actual installed voice so enumeration order cannot change the narrator.
    this.preferences.voiceURI=voice.voiceURI;
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=this.preferences.rate;utterance.pitch=1;
    utterance.onend=()=>{if(revision===this.revision)this.onStatus('idle');};utterance.onerror=()=>{if(revision===this.revision)this.onStatus('unavailable');};
    this.onStatus('playing');synth.speak(utterance);
  }
}
