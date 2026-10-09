import {referencesFor} from './references.js';
export class CameraCapture {
  constructor(activity,onConfirm,onState=()=>{}){
    this.activity=activity;this.onConfirm=onConfirm;this.onState=onState;this.revision=0;this.stream=null;this.source=null;
    this.$=id=>document.getElementById(id);
    this.$('start-camera').onclick=()=>this.start();this.$('retake').onclick=()=>this.start();
    this.$('capture-photo').onclick=()=>this.capture();this.$('match-photo').onclick=()=>this.match();
    this.$('photo-file').onchange=e=>this.upload(e.target.files[0]);
    this.$('upload-photo').onclick=()=>this.$('photo-file').click();
    this.$('manual-item').onchange=()=>{this.$('confirm-photo').disabled=!this.$('manual-item').value;};
    this.$('confirm-photo').onclick=()=>{const id=this.$('manual-item').value;if(activity.items.some(i=>i.id===id)){onConfirm(id);this.$('camera').close();}};
    this.$('camera').addEventListener('close',()=>this.close());
    window.addEventListener('pagehide',()=>this.close());
    document.addEventListener('visibilitychange',()=>{if(document.hidden){++this.revision;this.stopStream();this.$('camera-video').hidden=true;this.$('capture-photo').hidden=true;this.$('start-camera').hidden=false;}});
  }
  status(text,state='idle'){this.$('camera-status').textContent=text;this.onState(state);}
  stopStream(){this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.$('camera-video').srcObject=null;}
  resetPhoto(){if(this.source?.startsWith('blob:'))URL.revokeObjectURL(this.source);this.source=null;this.$('photo-preview').hidden=true;this.$('photo-preview').removeAttribute('src');this.$('manual-item').value='';this.$('confirm-photo').disabled=true;this.$('match-photo').hidden=true;this.$('match-photo').disabled=false;this.$('retake').hidden=true;}
  close(){++this.revision;this.stopStream();this.resetPhoto();this.$('photo-file').value='';this.$('camera-video').hidden=true;this.$('capture-photo').hidden=true;this.$('start-camera').hidden=false;this.$('camera-placeholder').hidden=false;this.status('تبقى صورتك على جهازك.','closed');}
  async start(){
    const revision=++this.revision;this.stopStream();this.resetPhoto();
    if(!navigator.mediaDevices?.getUserMedia){this.status('الكاميرا غير متاحة هنا. ارفع صورة أو اختر العنصر بنفسك.','unavailable');return;}
    this.status('اسمح باستخدام الكاميرا لالتقاط صورة واحدة.','requesting');
    try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(revision!==this.revision||!this.$('camera').open){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;const video=this.$('camera-video');video.srcObject=stream;video.hidden=false;await video.play();if(revision!==this.revision)return;
      this.$('camera-placeholder').hidden=true;this.$('capture-photo').hidden=false;this.$('start-camera').hidden=true;this.status('وسّط عنصرًا واحدًا، ثم التقط الصورة.','live');
    }catch{if(revision===this.revision){this.stopStream();this.status('لم نتمكن من فتح الكاميرا. ارفع صورة أو اختر العنصر بنفسك.','denied');}}
  }
  capture(){const video=this.$('camera-video');if(!video.videoWidth)return;const c=document.createElement('canvas');const scale=Math.min(1,1200/video.videoWidth);c.width=video.videoWidth*scale;c.height=video.videoHeight*scale;c.getContext('2d').drawImage(video,0,0,c.width,c.height);this.preview(c.toDataURL('image/jpeg',.9));}
  async upload(file){
    if(!file)return;++this.revision;this.stopStream();this.resetPhoto();this.$('camera-video').hidden=true;this.$('capture-photo').hidden=true;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){this.status('اختر صورة JPG أو PNG أو WebP أصغر من ١٢ ميغابايت.','invalid');return;}
    const rev=this.revision,url=URL.createObjectURL(file),img=new Image();img.src=url;
    try{await img.decode();if(rev!==this.revision){URL.revokeObjectURL(url);return;}this.preview(url);}catch{URL.revokeObjectURL(url);this.status('لم نتمكن من قراءة الصورة. جرّب صورة أخرى أو اختر العنصر.','invalid');}
  }
  preview(source){++this.revision;this.stopStream();this.resetPhoto();this.source=source;this.$('photo-preview').src=source;this.$('photo-preview').hidden=false;this.$('camera-video').hidden=true;this.$('camera-placeholder').hidden=true;this.$('capture-photo').hidden=true;this.$('retake').hidden=false;this.$('start-camera').hidden=true;
    this.$('match-photo').hidden=false;
    this.status('راجع الصورة، ثم ابحث عن المجسم المطابق. نطابق فقط صور الكتاب المتاحة؛ يمكنك دائمًا اختيار العنصر بنفسك.','preview');
  }
  async match(){
    if(!this.source)return;
    const rev=++this.revision;this.$('match-photo').disabled=true;this.status('نقارن الصورة بصور الأجهزة المحفوظة على جهازك…','matching');
    try{const {recognize}=await import('../electricity/recognition.js');const result=await recognize(this.source,referencesFor(this.activity));if(rev!==this.revision)return;
      const valid=result&&this.activity.items.some(d=>d.id===result.id);
      this.$('manual-item').value=valid?result.id:'';this.$('confirm-photo').disabled=!valid;
      this.status(valid?'وجدنا عنصرًا مقترحًا. تأكد من اسمه قبل فتح المجسم.':'لم أتعرف على الصورة بوضوح. أعد الالتقاط أو اختر العنصر بنفسك.',valid?'suggested':'unmatched');
    }catch{if(rev===this.revision)this.status('تعذرت المطابقة. يمكنك اختيار العنصر من القائمة.','unavailable');}
    finally{if(rev===this.revision)this.$('match-photo').disabled=false;}
  }
}
