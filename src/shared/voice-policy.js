// A narrator is selected explicitly. Missing clips never switch to a different voice.
export function normalizeSpeechText(text){return String(text).normalize('NFC').replace(/[ـ\u200e\u200f]/g,'').replace(/\s+/g,' ').trim();}
export function selectArabicVoice(voices,uri){
  const local=voices.filter(v=>v.localService&&/^ar(?:[-_]|$)/i.test(v.lang));
  return local.find(v=>v.voiceURI===uri)||local[0]||null;
}
export function readVoicePreferences(raw){
  try{const p=JSON.parse(raw);return {mode:['recordings','device','human'].includes(p?.mode)?p.mode:'recordings',voiceURI:typeof p?.voiceURI==='string'?p.voiceURI:'',rate:[.9,1,1.1].includes(p?.rate)?p.rate:1};}
  catch{return {mode:'recordings',voiceURI:'',rate:1};}
}
export function findRecording(manifest,text){
  const normalized=normalizeSpeechText(text);
  return Object.entries(manifest).find(([,value])=>normalizeSpeechText(value)===normalized)?.[0]||null;
}
