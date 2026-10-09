import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadDevice } from './models.js';

export class LabScene {
  constructor(container, hooks) {
    this.hooks=hooks;this.container=container;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
    this.renderer.xr.enabled=true;this.renderer.xr.setReferenceSpaceType('local');this.renderer.setClearColor(0x000000,0);
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','مجسم الجهاز ثلاثي الأبعاد. اسحب لتدويره.');
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(36,1,.01,100);this.camera.position.set(4.6,3.4,5.6);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.8,0);this.controls.enablePan=false;this.controls.minDistance=3.4;this.controls.maxDistance=11;this.controls.maxPolarAngle=Math.PI*.49;this.controls.enableDamping=!this.reduced;this.controls.update();this.controls.saveState();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xa3aea4,1.8));const sun=new THREE.DirectionalLight(0xfff5e4,2.5);sun.position.set(3,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.035;this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0xb5bdff,1);fill.position.set(-4,2,-3);this.scene.add(fill);
    this.world=new THREE.Group();this.scene.add(this.world);
    this.platform=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.38,.16,96),new THREE.MeshStandardMaterial({color:0xf4ead9,roughness:.9}));this.platform.position.y=-.10;this.platform.receiveShadow=true;this.world.add(this.platform);
    const edge=new THREE.Mesh(new THREE.TorusGeometry(2.25,.015,8,96),new THREE.MeshBasicMaterial({color:0xd3c6ac}));edge.rotation.x=Math.PI/2;edge.position.y=-.008;this.world.add(edge);
    this.reticle=new THREE.Mesh(new THREE.RingGeometry(.075,.10,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x57ba9f}));this.reticle.matrixAutoUpdate=false;this.reticle.visible=false;this.scene.add(this.reticle);
    this.raycaster=new THREE.Raycaster();this.controller=this.renderer.xr.getController(0);this.scene.add(this.controller);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-5)]),new THREE.LineBasicMaterial({color:0xa190e4}));this.controller.add(line);this.controller.addEventListener('select',()=>this.selectXR());
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();hooks.error('توقّف العرض الثلاثي الأبعاد. تابع التجربة بالأزرار أو أعد تحميل الصفحة.');});
    this.renderer.setAnimationLoop((ms,frame)=>this.frame(ms/1000,frame));this.revision=0;this.ready=false;
  }
  resize(){if(this.renderer.xr.isPresenting)return;const {width,height}=this.container.getBoundingClientRect();if(!width||!height)return;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  async setDevice(device){
    const rev=++this.revision;this.ready=false;
    if(this.model){this.world.remove(this.model);this.disposeModel(this.model);this.model=null;}
    const model=await loadDevice(device);
    if(rev!==this.revision){this.disposeModel(model);return;}
    this.model=model;this.world.add(model);this.ready=true;this.device=device;this.updateVR();
    return model.userData.imported;
  }
  disposeModel(model){const seen=new Set();model.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){if(!m.userData.localToModel||seen.has(m))continue;seen.add(m);for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}});}
  setState(state){this.state=state;this.updateVR();}
  reset(){this.controls.reset();}
  zoom(amount){this.camera.position.sub(this.controls.target).multiplyScalar(amount).add(this.controls.target);this.controls.update();}
  frame(t,frame){
    if(frame&&this.xrMode==='ar'&&this.hitSource){const hits=frame.getHitTestResults(this.hitSource);this.reticle.visible=!this.placed&&hits.length>0;if(this.reticle.visible){const pose=hits[0].getPose(this.renderer.xr.getReferenceSpace());if(pose)this.reticle.matrix.fromArray(pose.transform.matrix);}}
    const s=this.state||{};this.model?.userData.animate(t,s.running,s.source,this.reduced,s.doorOpen);
    if(!this.renderer.xr.isPresenting)this.controls.update();this.renderer.render(this.scene,this.camera);
  }
  label(text,width=2.8,height=.65,color='#ffffff',ink='#3e315a'){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*height/width);const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=ink;ctx.textAlign='center';ctx.direction='rtl';ctx.font='bold 45px Tajawal, Arial';
    const words=text.split(' ');let line='',lines=[];for(const word of words){if(ctx.measureText(line+' '+word).width>950){lines.push(line);line=word;}else line+=' '+word;}lines.push(line);const count=Math.min(lines.length,4),lineHeight=Math.min(58,(canvas.height-12)/count);lines.slice(0,4).forEach((l,i)=>ctx.fillText(l.trim(),512,canvas.height/2+(i-(count-1)/2)*lineHeight+15));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  }
  clearVR(){if(!this.vrPanel)return;this.scene.remove(this.vrPanel);this.vrPanel.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});this.vrPanel=null;}
  updateVR(){
    if(this.xrMode!=='vr')return;this.clearVR();this.vrPanel=new THREE.Group();this.scene.add(this.vrPanel);this.vrTargets=[];
    const guide=this.label(this.hooks.guidance(),3.5,.65);guide.position.set(0,.9,-3);this.vrPanel.add(guide);
    const learn=this.state?.mode==='learn';
    const entries=learn?[['play','جرّب الجهاز']]:this.hooks.sources().map(s=>[s.id,s.name]);
    if(!learn)entries.push(['try','جرّب التشغيل'],['stop',this.state?.running?'أوقف الجهاز':'اسمعني'],['mode','تعرّف إلى الجهاز']);
    else entries.push(['listen','اسمعني']);
    entries.push(['next','الجهاز التالي'],['exit','خروج']);
    entries.forEach(([id,name],i)=>{const m=this.label(name,1.05,.34,this.state?.source===id?'#d4f4e6':'#eee8ff');m.position.set((i%3-1)*1.15,-.55-Math.floor(i/3)*.44,-2.35);m.userData.action=id;this.vrPanel.add(m);this.vrTargets.push(m);});
  }
  selectXR(){
    if(this.xrMode==='ar'&&!this.placed&&this.reticle.visible){this.world.position.setFromMatrixPosition(this.reticle.matrix);this.world.scale.setScalar(.15);this.world.visible=true;this.placed=true;this.reticle.visible=false;this.hooks.placed();return;}
    if(this.xrMode==='vr') {const rotation=new THREE.Matrix4().extractRotation(this.controller.matrixWorld);this.raycaster.ray.origin.setFromMatrixPosition(this.controller.matrixWorld);this.raycaster.ray.direction.set(0,0,-1).applyMatrix4(rotation);const target=this.raycaster.intersectObjects(this.vrTargets||[])[0];if(target)this.hooks.action(target.object.userData.action);}
  }
  async enterXR(mode,overlay){
    if(!this.ready)throw new Error('انتظر قليلًا حتى يظهر الجهاز، ثم حاول مجددًا.');
    const type=mode==='ar'?'immersive-ar':'immersive-vr';
    if(!isSecureContext||!navigator.xr||!await navigator.xr.isSessionSupported(type))throw new Error(mode==='ar'?'عرض الجهاز على طاولتك يحتاج هاتفًا ومتصفحًا يدعمان الواقع المعزز، ورابط HTTPS. يمكنك تدوير الجهاز وتجربته هنا.':'تحتاج نظارة ومتصفحًا يدعمان الواقع الافتراضي. يمكنك متابعة التجربة هنا.');
    const session=await navigator.xr.requestSession(type,mode==='ar'?{requiredFeatures:['hit-test','dom-overlay'],domOverlay:{root:overlay}}:{optionalFeatures:['local-floor']});
    this.session=session;this.xrMode=mode;this.placed=false;
    session.addEventListener('end',()=>{this.hitSource?.cancel();this.hitSource=null;this.session=null;this.xrMode=null;this.reticle.visible=false;this.world.visible=true;this.world.position.set(0,0,0);this.world.scale.setScalar(1);this.clearVR();this.camera.position.set(4.6,3.4,5.6);this.controls.reset();this.resize();this.hooks.ended();},{once:true});
    try {
      await this.renderer.xr.setSession(session);
      if(mode==='ar'){this.world.visible=false;const viewer=await session.requestReferenceSpace('viewer');this.hitSource=await session.requestHitTestSource({space:viewer});}
      else {this.world.position.set(0,-.55,-3);this.world.scale.setScalar(.5);this.updateVR();}
    }catch(error){await session.end();throw error;}
  }
  async exitXR(){await this.session?.end();}
}
