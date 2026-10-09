import { devices } from './data.js';
let cvPromise;
function loadCV(){
  if(cvPromise)return cvPromise;
  cvPromise=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('تأخر تجهيز المطابقة. اختر اسم الجهاز من القائمة.')),30000);
    const script=document.createElement('script');script.src='/vendor/opencv.js';
    script.onerror=()=>{clearTimeout(timer);cvPromise=null;reject(new Error('تعذّر تحميل المطابقة. اختر اسم الجهاز.'));};
    script.onload=()=>{try{const cv=window.cv;if(cv.Mat){clearTimeout(timer);resolve({cv});}else cv.onRuntimeInitialized=()=>{clearTimeout(timer);resolve({cv});};}catch(error){clearTimeout(timer);reject(error);}};
    document.head.append(script);
  });return cvPromise;
}
async function imageCanvas(source){
  const image=new Image();image.src=typeof source==='string'?source:source.source;await image.decode();
  const [x,y,w,h]=source.rect||[0,0,image.naturalWidth,image.naturalHeight];
  const canvas=document.createElement('canvas');const scale=Math.min(1,900/Math.max(w,h));
  canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);canvas.getContext('2d').drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height);return canvas;
}
// ORB descriptors + ratio test + geometric verification. Low confidence never auto-selects.
export async function recognize(source,references=devices.map(d=>({id:d.id,source:`/assets/book/${d.id}.jpg`}))){
  const {cv}=await loadCV();const canvas=await imageCanvas(source);const input=cv.imread(canvas),gray=new cv.Mat();cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);input.delete();
  const orb=new cv.ORB(1200,1.2,8,12,0,2,0,31,10),kp=new cv.KeyPointVector(),desc=new cv.Mat(),mask=new cv.Mat();
  orb.detectAndCompute(gray,mask,kp,desc);gray.delete();mask.delete();
  const scores=[];
  try{
    if(desc.rows<8)return null;
    for(const d of references){
      const reference=await imageCanvas(d);const raw=cv.imread(reference),refGray=new cv.Mat();cv.cvtColor(raw,refGray,cv.COLOR_RGBA2GRAY);raw.delete();
      const rk=new cv.KeyPointVector(),rd=new cv.Mat(),rm=new cv.Mat();orb.detectAndCompute(refGray,rm,rk,rd);refGray.delete();rm.delete();
      const matcher=new cv.BFMatcher(cv.NORM_HAMMING,false),matches=new cv.DMatchVectorVector();let pointsA=[],pointsB=[];
      try{
        if(rd.rows>=8){matcher.knnMatch(rd,desc,matches,2);
          for(let i=0;i<matches.size();i++){const pair=matches.get(i);if(pair.size()>=2){const a=pair.get(0),b=pair.get(1);if(a.distance<.72*b.distance&&a.distance<65){const p=rk.get(a.queryIdx).pt,q=kp.get(a.trainIdx).pt;pointsA.push(p.x,p.y);pointsB.push(q.x,q.y);}}pair.delete();}
          if(pointsA.length>=16){const a=cv.matFromArray(pointsA.length/2,1,cv.CV_32FC2,pointsA),b=cv.matFromArray(pointsB.length/2,1,cv.CV_32FC2,pointsB),inliers=new cv.Mat();const h=cv.findHomography(a,b,cv.RANSAC,5,inliers);let count=0;for(const n of inliers.data)count+=n;const ratio=count/(pointsA.length/2);if(!h.empty()&&count>=8&&ratio>.5)scores.push({id:d.id,score:count,ratio});a.delete();b.delete();inliers.delete();h.delete();}
        }
      }finally{matcher.delete();matches.delete();rk.delete();rd.delete();}
    }
    scores.sort((a,b)=>b.score-a.score);if(!scores.length||scores[1]?.score>scores[0].score*.8)return null;
    return scores[0];
  }finally{orb.delete();kp.delete();desc.delete();}
}
