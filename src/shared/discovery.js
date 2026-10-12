import {activities, activityById, itemById} from './catalog.js';

export const DISCOVERY_KEY='sharara-discovery-progress-v1';
export function readDiscovery(storage) {
  const result={completed:{},last:null};
  try {
    const data=JSON.parse(storage.getItem(DISCOVERY_KEY)||'null');
    for(const activity of activities){
      result.completed[activity.id]={};
      for(const item of activity.items)if(data?.completed?.[activity.id]?.[item.id]===true)result.completed[activity.id][item.id]=true;
    }
    const subject=activityById(data?.last?.activity);
    if(subject&&itemById(subject,data.last.item))result.last={activity:subject.id,item:data.last.item};
  }catch{}
  return result;
}
export function recordDiscovery(progress,activity,id) {
  if(!itemById(activity,id))return progress;
  return {...progress,completed:{...progress.completed,[activity.id]:{...progress.completed[activity.id],[id]:true}}};
}
export function saveDiscovery(storage,progress) {
  try{storage.setItem(DISCOVERY_KEY,JSON.stringify(progress));return true;}catch{return false;}
}
