import { activities, activityById, itemById, evaluate, contentFor, optionsFor } from './catalog.js';
export const STORAGE_KEY='sharara-progress-v3';
export const emptyProgress=()=>({version:3,completed:{},last:null});
export function readProgress(storage) {
  const result=emptyProgress();
  try {
    const data=JSON.parse(storage.getItem(STORAGE_KEY)||'null');
    if(data?.version===3){
      for(const a of activities){result.completed[a.id]={};for(const item of a.items){const record=data.completed?.[a.id]?.[item.id];if(record && typeof record.assisted==='boolean' && Number.isInteger(record.attempts) && record.attempts>0)result.completed[a.id][item.id]={assisted:record.assisted,attempts:record.attempts};}}
      if(activityById(data.last?.activity) && itemById(activityById(data.last.activity),data.last.item))result.last=data.last;
      return result;
    }
  }catch{}
  const legacy=['sharara-discoveries-v2','khabeer-materials-discoveries-v1','captain-safety-discoveries-v1','professor-conductors-discoveries-v1'];
  activities.forEach((a,index)=>{try{const saved=JSON.parse(storage.getItem(legacy[index])||'{}');for(const d of a.items){const value=saved?.[d.id];if(a.id==='electricity'?Array.isArray(value)&&value.some(v=>evaluate(a,d,v)):evaluate(a,d,value)){result.completed[a.id]||={};result.completed[a.id][d.id]={assisted:true,attempts:1};}}}catch{}});
  return result;
}
export function saveProgress(storage,progress){try{storage.setItem(STORAGE_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function recordSuccess(progress,activity,state) {
  if(state.phase!=='success')return progress;
  const completed={...progress.completed,[activity.id]:{...progress.completed[activity.id]}};
  completed[activity.id][state.id] ||= {assisted:state.hints>0||state.attempts>1||state.revealed,attempts:state.attempts};
  return {...progress,completed};
}
export function newAttempt(id,mode='play'){return {id,mode,phase:'choose',choice:null,attempts:0,hints:0,revealed:false,tested:false,running:false,doorOpen:false,lastAction:'select',feedback:'',error:null};}
export function transition(activity,state,event) {
  const item=itemById(activity,state.id), bank=contentFor(activity,item);
  if(event.type==='select')return itemById(activity,event.id)?newAttempt(event.id,state.mode):state;
  if(event.type==='mode')return {...newAttempt(state.id,event.mode),attempts:state.attempts,hints:state.hints,revealed:event.mode==='learn'||state.revealed};
  if(event.type==='hint')return {...state,hints:Math.min(3,state.hints+1),revealed:state.revealed||state.hints>=2,lastAction:'hint'};
  if(state.mode!=='play')return state;
  if(event.type==='test'&&activity.id==='conductors')return {...state,tested:true,lastAction:'test'};
  if(state.phase==='success')return state;
  if(event.type==='choose'&&optionsFor(activity,item).some(o=>o.id===event.choice))return {...state,choice:event.choice,phase:'choose',feedback:'',error:null,lastAction:'choose'};
  if(event.type==='submit'){
    if(!state.choice || (activity.id==='conductors'&&!state.tested))return state;
    const ok=evaluate(activity,item,state.choice),attempts=state.attempts+1;
    return {...state,attempts,phase:ok?'success':'retry',running:ok&&activity.id==='electricity',lastAction:'submit',error:ok?null:'classification',feedback:ok?bank.explanation:attempts>=3?`لنراجع معًا: ${bank.explanation}`:bank.wrong,revealed:state.revealed||(!ok&&attempts>=3)};
  }
  return state;
}
export function guidance(activity,state,intent='now') {
  const item=itemById(activity,state.id),bank=contentFor(activity,item);
  if(state.mode==='learn')return activity.id==='electricity'?item.fact:bank.explanation;
  if(intent==='hint')return state.hints>=3?bank.explanation:bank.hints[Math.max(0,state.hints-1)];
  if(intent==='why')return state.attempts||state.tested||state.revealed?bank.explanation:'جرّب اختيارك أولًا، ثم نكتشف السبب معًا.';
  if(intent==='unknown')return 'أساعدك في هذا النشاط بإرشادات جاهزة. اختر «تلميح» أو «ماذا أفعل الآن؟».';
  if(state.phase==='success')return bank.explanation;
  if(state.phase==='retry')return state.feedback;
  if(activity.id==='electricity'&&state.choice)return 'اضغط «جرّب التشغيل» لتختبر المصدر الذي اخترته.';
  if(activity.id==='conductors'&&state.tested)return 'لاحظ المصباح، ثم اختر: موصلة أم عازلة؟';
  return `${item.label}: ${bank.start}`;
}
export function parseIntent(text){const q=String(text).normalize('NFKC').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim();return /تلميح|ساعد|مساعد/.test(q)?'hint':/لماذا|ليش|سبب/.test(q)?'why':/افعل|اعمل|الان|التالي|اشرح|شرح/.test(q)?'now':'unknown';}
