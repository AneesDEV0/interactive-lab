// Pixel rectangles measured on the supplied textbook scans, excluding labels/answer bulbs.
// A reference belongs to one item; a whole shared page must never be used as every item's reference.
import { devices } from '../electricity/data.js';
export const materialReferences=[
  {id:'metalSpoon',rect:[320,134,115,76]},
  {id:'paperEnvelope',rect:[168,172,114,89]},
  {id:'fabricCloth',rect:[447,200,124,115]},
  {id:'ironNail',rect:[118,272,96,95]},
  {id:'eraser',rect:[514,315,91,68]},
  {id:'glassCup',rect:[126,410,78,138]},
  {id:'chalk',rect:[488,445,118,101]},
  {id:'woodStick',rect:[203,540,144,123]},
  {id:'paperClip',rect:[381,538,117,106]},
].map(r=>({...r,source:'/assets/book/conductors_page67.png'}));
export const safetyReferences=[
  {id:'overloaded_socket',source:'/assets/book/safety_page89.png',rect:[137,68,184,150]},
  {id:'kids_playing_cords',source:'/assets/book/safety_page89.png',rect:[393,68,194,150]},
  {id:'baby_biting_cord',source:'/assets/book/safety_page90.png',rect:[353,188,180,123]},
  {id:'exposed_damaged_wire',source:'/assets/book/safety_page90.png',rect:[353,345,180,123]},
  {id:'inserting_scissors_socket',source:'/assets/book/safety_page90.png',rect:[353,505,180,123]},
];
export function referencesFor(activity){
  const refs=activity.id==='electricity'?devices.map(d=>({id:d.id,source:`/assets/book/${d.id}.jpg`})) : activity.id==='safety'?safetyReferences:materialReferences;
  return refs.filter(r=>activity.items.some(d=>d.id===r.id));
}
