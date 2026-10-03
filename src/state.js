import {config,msg} from './config.js';
export const ids=config.devices;
const emptyDevice=()=>({status:'off',source:null,reason:'never_connected'});
export function initialState(p={}){return {phase:'loading',language:p.language||config.defaultLanguage,ageRange:p.ageRange||config.ageRange,selectedDevice:null,batteryLocation:'tray',activePowerSource:{car:null,radio:null,fridge:null},devices:Object.fromEntries(ids.map(id=>[id,emptyDevice()])),exploredDevices:[],attemptsByDevice:{car:0,radio:0,fridge:0},predictionByDevice:{car:null,radio:null,fridge:null},lastAttempt:null,lastOutcome:null,lastRelevantEvent:null,discoveredFacts:[],completedMilestones:[],hintLevel:0,interactionMode:'click',muted:p.muted??true,reducedMotion:p.reducedMotion??false,chatOpen:false,assetStatus:'loading',rendererStatus:'loading',sessionRevision:p.sessionRevision||0,revision:0,processedEvents:[],message:'',messageKey:'',messagePriority:0,idleShown:false,quiz:{},chatResponse:null,questionCount:{},doorOpen:false};}
export const explorationDone=s=>['car_battery','radio_battery','fridge_incompatible','fridge_mains'].every(x=>s.discoveredFacts.includes(x));
export const quizDone=s=>['car','radio','fridge','explanation'].every(x=>s.quiz[x]===true);
function say(s,key,priority=2){s.messageKey=key;s.message=msg(s,key);s.messagePriority=priority;}
function fact(s,key){if(!s.discoveredFacts.includes(key))s.discoveredFacts.push(key);s.completedMilestones=[...s.discoveredFacts];}
function detach(s,reason='removed'){const old=s.batteryLocation;if(ids.includes(old)&&old!=='fridge'){s.devices[old]={status:'off',source:null,reason};s.activePowerSource[old]=null;}s.batteryLocation='tray';return old;}
export function reducer(state,event){
 if(event.sessionRevision!==undefined&&event.sessionRevision!==state.sessionRevision)return state;
 if(event.id&&state.processedEvents.includes(event.id))return state;
 if(event.type==='RESET')return {...initialState({...state,sessionRevision:state.sessionRevision+1}),phase:'intro',assetStatus:state.assetStatus,rendererStatus:state.rendererStatus,message:msg(state,'start'),messageKey:'start'};
 const s=structuredClone(state);s.revision++;
 if(event.id)s.processedEvents.push(event.id);
 const relevant=()=>{s.lastRelevantEvent={...event,time:event.time??Date.now(),revision:s.revision};};
 switch(event.type){
 case 'READY':s.phase=s.phase==='loading'?'intro':s.phase;s.assetStatus=s.assetStatus==='fallback'?'fallback':'ready';s.rendererStatus='ready';break;
 case 'START':if(s.phase==='intro'||s.phase==='recoverable_error'){s.phase='exploring';say(s,'start');}break;
 case 'SELECT_DEVICE':if(!ids.includes(event.device))return state;s.selectedDevice=event.device;s.hintLevel=0;if(s.batteryLocation!=='held')say(s,'select');break;
 case 'PREDICT':if(ids.includes(event.device)&&s.attemptsByDevice[event.device]===0)s.predictionByDevice[event.device]=event.value===true;break;
 case 'PICK_BATTERY':if(s.phase==='intro'||s.phase==='loading')return state;{const old=detach(s,'transferred');if(ids.includes(old)){s.lastRelevantEvent={...event,device:old,time:event.time??Date.now(),revision:s.revision};}}s.batteryLocation='held';s.interactionMode=event.mode||'click';say(s,'pick');break;
 case 'DROP_ON_DEVICE':{
   if(!ids.includes(event.device)||s.batteryLocation!=='held'||!['exploring','summary','completed'].includes(s.phase))return state;
   const d=event.device,first=s.attemptsByDevice[d]===0,success=d!=='fridge';s.selectedDevice=d;s.attemptsByDevice[d]++;if(!s.exploredDevices.includes(d))s.exploredDevices.push(d);
   s.lastAttempt={id:event.id,device:d,source:'battery',time:event.time??Date.now(),success};s.lastOutcome=success?'running':'incompatible';relevant();
   if(success){s.batteryLocation=d;s.devices[d]={status:'running',source:'battery',reason:'connected'};s.activePowerSource[d]='battery';fact(s,d+'_battery');say(s,first?d:'repeat');}
   else{s.batteryLocation='tray';fact(s,'fridge_incompatible');say(s,first?'fridge':'fridgeAgain');if(s.devices.fridge.status==='running')s.message+=' '+(s.language==='ar'?'الثلاجة ما زالت تعمل بكهرباء المنزل، لا بالبطارية.':'It is still running on household electricity, not this battery.');}
   if(first&&s.predictionByDevice[d]!==null)s.message+=' '+msg(s,s.predictionByDevice[d]===success?'match':'different');
   break;}
 case 'DROP_OUTSIDE':if(s.batteryLocation!=='held')return state;detach(s);say(s,'outside');break;
 case 'CANCEL_DRAG':if(s.batteryLocation!=='held')return state;detach(s);say(s,'cancel');break;
 case 'DROP_ON_MAINS':if(s.batteryLocation!=='held')return state;detach(s);say(s,'homeDrop');break;
 case 'REMOVE_BATTERY':{const device=detach(s);if(ids.includes(device))s.lastRelevantEvent={...event,device,time:event.time??Date.now(),revision:s.revision};say(s,'remove');break;}
 case 'SHOW_MAINS_DEMO':if(!s.discoveredFacts.includes('fridge_incompatible'))return state;s.devices.fridge={status:'running',source:'mains',reason:'connected'};s.activePowerSource.fridge='mains';fact(s,'fridge_mains');s.lastOutcome='mains_running';s.lastRelevantEvent={...event,device:'fridge',time:event.time??Date.now(),revision:s.revision};say(s,'mains');break;
 case 'STOP_MAINS_DEMO':s.devices.fridge={status:'off',source:null,reason:'demo_stopped'};s.activePowerSource.fridge=null;s.lastRelevantEvent={...event,device:'fridge',time:event.time??Date.now(),revision:s.revision};say(s,'stopMains');break;
 case 'TRY_POWER':if(!ids.includes(event.device))return state;s.selectedDevice=event.device;s.message=s.devices[event.device].status==='running'?(s.language==='ar'?'الجهاز يعمل الآن بالمصدر المتصل.':'It is running with its connected source.'):msg(s,'needsPower');break;
 case 'TOGGLE_DOOR':s.doorOpen=!s.doorOpen;break;
 case 'OPEN_COMPARISON':if(s.phase==='loading'||s.phase==='intro')return state;if(s.phase!=='completed')s.phase='summary';break;
 case 'CLOSE_COMPARISON':if(s.phase==='summary')s.phase='exploring';break;
 case 'QUIZ_ANSWER':if(!explorationDone(s))return state;{const correct=event.device==='explanation'?event.answer==='design':event.answer===(event.device==='fridge'?'mains':'battery');if(![...ids,'explanation'].includes(event.device))return state;s.quiz[event.device]=correct;say(s,correct?'quizRight':'quizWrong');}break;
 case 'COMPLETE':if(!explorationDone(s)||!quizDone(s))return state;s.phase='completed';say(s,'complete');break;
 case 'ASK_QUESTION':s.chatOpen=true;s.idleShown=true;break;
 case 'CHAT_RESPONSE':if(event.response.stateRevision!==s.revision-1)return state;s.chatResponse=event.response;break;
 case 'REQUEST_HINT':s.hintLevel=Math.min(3,s.hintLevel+1);s.idleShown=true;break;
 case 'IDLE':if(s.chatOpen||s.idleShown||s.phase!=='exploring'||s.batteryLocation==='held')return state;s.idleShown=true;say(s,'idle',0);break;
 case 'DISMISS_IDLE':s.idleShown=true;say(s,'start',0);break;
 case 'TOGGLE_CHAT':s.chatOpen=!s.chatOpen;break;
 case 'SET_MUTED':s.muted=event.value;break;
 case 'SET_REDUCED_MOTION':s.reducedMotion=event.value;break;
 case 'SET_LANGUAGE':if(!['ar','en'].includes(event.value))return state;s.language=event.value;if(s.messageKey)s.message=msg(s,s.messageKey);s.chatResponse=null;break;
 case 'SET_AGE':s.ageRange=event.value==='younger'?[4,6]:[6,9];break;
 case 'ASSET_FAILED':s.assetStatus='fallback';say(s,'asset',3);break;
 case 'RENDERER_FAILED':s.rendererStatus='fallback';s.phase=s.phase==='loading'?'recoverable_error':s.phase;say(s,'renderer',3);break;
 case 'CHAT_FAILED':say(s,'chat',3);break;
 case 'AUDIO_FAILED':say(s,'audio',3);break;
 default:return state;
 }
 return s;
}
export function validAction(s,a){if(!a||!['select_device','show_hint','show_mains_demo','open_comparison','restart','pick_battery'].includes(a.id))return false;if(a.id==='select_device')return ids.includes(a.device);if(a.id==='show_mains_demo')return s.discoveredFacts.includes('fridge_incompatible')&&s.devices.fridge.status!=='running';if(a.id==='open_comparison')return s.exploredDevices.length>0;if(a.id==='pick_battery')return !['intro','loading'].includes(s.phase)&&s.batteryLocation!=='held';return true;}
export function nextActions(s){let a=[];if(s.discoveredFacts.includes('fridge_incompatible')&&!s.discoveredFacts.includes('fridge_mains'))a.push({id:'show_mains_demo'});const d=ids.find(x=>!s.exploredDevices.includes(x));if(d)a.push({id:'select_device',device:d});else a.push({id:'open_comparison'});return a.filter(x=>validAction(s,x)).slice(0,2);}
