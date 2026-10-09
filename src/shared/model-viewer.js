import * as THREE from 'three';
import { LabScene } from '../electricity/scene.js';

// Reuse the existing renderer, device animations and real WebXR session implementation.
export class ModelViewer extends LabScene {
  constructor(container,hooks,activity){
    super(container,hooks);this.activity=activity;this.platform.visible=false;
    this.world.children.filter(o=>o!==this.platform).forEach(o=>{o.visible=false;});
    this.controls.addEventListener('start',()=>{this.autoRotate=false;});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.modelMaterials=new Set();
  }
  async setItem(item){
    if(this.activity==='electricity'){await super.setDevice(item);this.fit();return;}
    const rev=++this.revision;this.ready=false;
    if(this.model){this.world.remove(this.model);this.disposeModel(this.model);this.model=null;}
    const module=await (this.activity==='safety'?import('../safety/models.js'):import('../materials/models.js'));
    const model=await (module.loadSafetyItem||module.loadMaterialItem)(item);
    if(rev!==this.revision){this.disposeModel(model);return;}
    this.model=model;this.world.add(model);this.device=item;this.ready=true;this.fit();
  }
  fit(){
    if(!this.model||this.xrMode)return;
    // Ignore the invisible celebration ring when fitting the actual object.
    const bounds=new THREE.Box3().setFromObject(this.activity==='electricity'?this.model:this.model.children[0]);
    this.bounds=bounds;const sphere=bounds.getBoundingSphere(new THREE.Sphere());
    const halfV=THREE.MathUtils.degToRad(this.camera.fov/2),halfH=Math.atan(Math.tan(halfV)*this.camera.aspect);
    const direction=new THREE.Vector3(.55,.38,1.6).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right).normalize();
    let distance=0;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const p=new THREE.Vector3(x,y,z).sub(sphere.center);
      distance=Math.max(distance,Math.abs(p.dot(right))/Math.tan(halfH)+p.dot(direction),Math.abs(p.dot(up))/Math.tan(halfV)+p.dot(direction));
    }
    distance*=1.25;
    this.controls.target.copy(sphere.center);this.camera.position.copy(sphere.center).add(direction.multiplyScalar(distance));
    this.controls.minDistance=distance*.92;this.controls.maxDistance=Math.max(distance*1.8,sphere.radius/Math.sin(Math.min(halfV,halfH))*1.2);this.controls.update();this.controls.saveState();
  }
  resize(){super.resize();if(this.model&&!this.xrMode)this.fit();}
  setState(state){super.setState({...state,source:state.choice});}
  frame(t,frame){
    if(!this.activity||this.activity==='electricity'){super.frame(t,frame);return;}
    this.controls.update();this.renderer.render(this.scene,this.camera);
  }
  destroy(){++this.revision;this.renderer.setAnimationLoop(null);this.observer.disconnect();this.controls.dispose();this.clearVR();if(this.model)this.disposeModel(this.model);this.scene.traverse(o=>{if(o.isMesh||o.isLine){o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){m.map?.dispose();m.dispose();}}});this.renderer.dispose();}
}
