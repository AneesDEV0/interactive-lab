import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createDevice3D } from '../devices/factory.js';
import { createPBRMaterials } from '../materials.js';

const loader = new GLTFLoader();
const materials = createPBRMaterials({mint:0x67c9b3,navy:0x434263});
const mat = (color, extra={}) => new THREE.MeshStandardMaterial({color,roughness:.4,...extra});
const cream = mat(0xf8fafb), purple = mat(0x7360ab), dark = mat(0x303547), mint = mat(0x64c3b1), metal = mat(0xa9bdc5,{metalness:.65});
function mesh(parent,geometry,material,x=0,y=0,z=0) {
  const m = new THREE.Mesh(geometry,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function box(p,w,h,d,m,x=0,y=0,z=0) { return mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z); }
function cylinder(p,r,h,m,x=0,y=0,z=0) { return mesh(p,new THREE.CylinderGeometry(r,r,h,32),m,x,y,z); }
function custom(id) {
  const g=new THREE.Group(); const fx={}; g.userData.effects=fx;
  if(id==='fan'||id==='wind') {
    const turbine=id==='wind';
    cylinder(g,.38,.1,cream,0,.05); cylinder(g,.065,1.5,turbine?cream:metal,0,.8);
    const blades=new THREE.Group();blades.position.set(0,1.6,.05);g.add(blades);fx.rotor=blades;
    for(let i=0;i<3;i++) {const arm=new THREE.Group();arm.rotation.z=i*Math.PI*2/3;blades.add(arm);const b=box(arm,turbine?.13:.24,turbine?.9:.55,.055,turbine?cream:mint,0,turbine?.43:.27);b.rotation.z=-.2;}
    mesh(g,new THREE.SphereGeometry(.13,24,16),turbine?cream:purple,0,1.6,.13);
    if(!turbine) {
      for(let i=1;i<5;i++) mesh(g,new THREE.TorusGeometry(i*.15,.012,6,60),metal,0,1.6,.2);
      for(let i=0;i<8;i++) {const spoke=box(g,.012,1.2,.015,metal,0,1.6,.21);spoke.rotation.z=i*Math.PI/8;}
    }
  } else if(id==='tablet'||id==='console') {
    if(id==='tablet') {
      box(g,1.4,1.85,.10,dark,0,1);const s=box(g,1.23,1.56,.012,mat(0x182139),0,1.04,.06);fx.display=s;
      for(let i=0;i<6;i++)box(g,.25,.25,.015,mat([0x9ca6eb,0x64c3b1,0xffd86d][i%3]),(i%3-1)*.36,.8+Math.floor(i/3)*.4,.073);
      mesh(g,new THREE.SphereGeometry(.035,12,8),metal,0,.16,.062);
    } else {
      box(g,1.6,.3,1,dark,0,.25);box(g,1.3,.025,.04,metal,0,.24,.51);
      const led=box(g,.12,.025,.015,mat(0x445555),.6,.3,.52);fx.display=led;
      const controller=new THREE.Group();controller.position.set(0,.16,.95);g.add(controller);
      box(controller,.65,.15,.3,dark);for(const x of [-.25,.25])mesh(controller,new THREE.SphereGeometry(.18,16,12),dark,x,0,.1);
      box(controller,.16,.025,.06,cream,-.2,.09);box(controller,.06,.025,.16,cream,-.2,.09);
      for(const x of [.16,.27])cylinder(controller,.035,.04,mint,x,.09);
    }
  } else if(id==='watch') {
    box(g,.48,2,.10,dark,0,1);const c=cylinder(g,.48,.16,metal,0,1,.08);c.rotation.x=Math.PI/2;
    const face=cylinder(g,.42,.18,cream,0,1,.1);face.rotation.x=Math.PI/2;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=box(g,.025,.07,.02,dark,Math.sin(a)*.35,1+Math.cos(a)*.35,.2);tick.rotation.z=-a;}
    const h=new THREE.Group();h.position.set(0,1,.22);g.add(h);box(h,.025,.34,.02,purple,0,.15);fx.hand=h;
    const m=box(g,.025,.25,.02,dark,-.1,1.08,.225);m.rotation.z=1;
  } else if(id==='bicycle') {
    const wheel=new THREE.Group();g.add(wheel);wheel.position.set(0,.8,0);fx.wheel=wheel;
    mesh(wheel,new THREE.TorusGeometry(.7,.055,12,48),dark);
    for(let i=0;i<10;i++){const spoke=box(wheel,.015,1.35,.02,metal);spoke.rotation.z=i*Math.PI/10;}
    const fork=box(g,.07,1.3,.07,mint,.2,1.2,.12);fork.rotation.z=-.3;
    cylinder(g,.12,.28,metal,.55,1.34,.2);box(g,.25,.2,.2,purple,.55,1.57,.2);
    fx.display=mesh(g,new THREE.SphereGeometry(.10,20,12),mat(0x77735b),.55,1.58,.32);
  } else if(id==='tv') {
    box(g,2.5,1.5,.12,dark,0,1.05);box(g,.12,.35,.12,metal,0,.22);box(g,.9,.08,.4,dark,0,.04);
  } else if(id==='street') {
    cylinder(g,.065,2,metal,0,1);box(g,.65,.055,.06,metal,.3,1.96);box(g,.3,.08,.15,dark,.6,1.94);fx.display=box(g,.25,.025,.13,mat(0xf6e7b0),.6,1.89);
  }
  return g;
}
function normalize(object) {
  const bounds=new THREE.Box3().setFromObject(object); const size=bounds.getSize(new THREE.Vector3());
  const scale=2.5/Math.max(size.x,size.y,size.z);object.scale.multiplyScalar(scale);
  bounds.setFromObject(object);const center=bounds.getCenter(new THREE.Vector3());object.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
}
export async function loadDevice(device) {
  let object, imported=false;
  if(device.model) { try { object=(await loader.loadAsync(`/assets/models/book/${device.model}.glb`)).scene; imported=true;object.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))m.userData.localToModel=true;}); } catch(error) { console.warn('Model fallback',device.id,error.message); } }
  if(!object) object=['fan','wind','watch','tablet','console','bicycle','tv','street'].includes(device.id)?custom(device.id):createDevice3D(device.id==='solarCar'?'car':device.id,materials);
  normalize(object);
  const root=new THREE.Group();root.add(object);root.userData.imported=imported;root.userData.device=device.id;
  const fx=object.userData.effects||{};
  object.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}if(o.name.startsWith('wheel')){fx.importedWheels ||= [];fx.importedWheels.push({node:o,rotation:o.rotation.clone()});} if(o.name==='doorFridge')fx.door=o;});
  if(device.id==='solarCar') {
    const panel=box(root,1.2,.04,.75,mat(0x253d75),0,1.25,0);panel.rotation.z=-.15;
    for(let i=0;i<5;i++)box(root,.012,.045,.74,metal,-.5+i*.25,1.27,0);
  }
  if(device.id==='washer'&&imported){const drum=new THREE.Group();drum.position.set(0,.95,.89);root.add(drum);fx.overlayDrum=drum;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;mesh(drum,new THREE.SphereGeometry(.12,16,12),[mint,purple,cream][i],Math.sin(a)*.23,Math.cos(a)*.23,0);}}
  if(device.id==='tv'){
    fx.display=box(root,2.27,1.22,.018,mat(0x24354a),0,1.02,.09);
    const screen=document.createElement('canvas');screen.width=512;screen.height=256;const ctx=screen.getContext('2d');ctx.fillStyle='#70b9cd';ctx.fillRect(0,0,512,256);ctx.fillStyle='#ffdb76';ctx.beginPath();ctx.arc(410,55,34,0,Math.PI*2);ctx.fill();
    for(let i=0;i<3;i++){ctx.fillStyle=['#4b9f86','#73b695','#438e7a'][i];ctx.beginPath();ctx.arc(70+i*190,285,115+i*20,0,Math.PI*2);ctx.fill();}
    const texture=new THREE.CanvasTexture(screen);texture.colorSpace=THREE.SRGBColorSpace;
    fx.picture=mesh(root,new THREE.PlaneGeometry(2.13,1.08),new THREE.MeshBasicMaterial({map:texture}),0,1.02,.112);fx.picture.material.userData.localToModel=true;
  }
  if(device.id==='radio'&&imported){
    for(const x of [-.7,.7]){const speaker=mesh(root,new THREE.CircleGeometry(.37,32),dark,x,.55,.395);for(let i=0;i<6;i++)box(root,.5,.012,.006,metal,x,.4+i*.06,.401);}
    fx.radioLight=mesh(root,new THREE.SphereGeometry(.045,16,12),mat(0x35534e),0,.91,.401);
  }
  // An educational energy indicator sits beside the downloaded models.
  const indicator=new THREE.Group();root.add(indicator);indicator.visible=false;indicator.position.set(-1.4,.18,.65);
  const cell=cylinder(indicator,.13,.55,mint,0,.15);cell.rotation.z=Math.PI/2;
  const cap=cylinder(indicator,.07,.06,metal,.30,.15);cap.rotation.z=Math.PI/2;
  fx.battery=indicator;
  const glow=mesh(root,new THREE.SphereGeometry(.09,18,12),mat(0xffdc70,{emissive:0xffbf30,emissiveIntensity:1.5}),.85,.24,.8);glow.visible=false;fx.glow=glow;
  const ring=mesh(root,new THREE.TorusGeometry(.55,.022,8,60),mat(0x55b99d),0,.12,0);ring.rotation.x=Math.PI/2;ring.visible=false;fx.ring=ring;
  const baseX=object.position.x;
  const init = new Map();for(const key of ['radioLight','screen','display','fridgeLight'])if(fx[key]?.material){fx[key].material=fx[key].material.clone();init.set(key,fx[key].material.color.clone());}
  root.userData.effects=fx;
  root.userData.animate=(time,running,source,reduced,doorOpen=false)=>{
    const t=reduced?0:time;
    indicator.visible=running&&source==='battery';glow.visible=running;ring.visible=running&&['radio','fridge','street'].includes(device.id);if(fx.picture)fx.picture.visible=running;
    ring.scale.setScalar(reduced?1:1+Math.sin(t*3)*.15);
    if(fx.rotor)fx.rotor.rotation.z=running?t*(device.id==='fan'?12:2):0;
    if(fx.hand)fx.hand.rotation.z=running?-t*.5:0;
    if(fx.wheel)fx.wheel.rotation.z=running?-t*2:0;
    if(fx.overlayDrum)fx.overlayDrum.rotation.z=running?t*2:0;
    if(fx.drum)fx.drum.rotation.z=running?t*2:0;
    if(fx.door)fx.door.rotation.y=doorOpen?-1.2:0;
    for(const {node,rotation} of fx.importedWheels||[]){node.rotation.copy(rotation);if(running)node.rotation.x+=t*5;}
    object.position.x=baseX+(running&&['car','solarCar'].includes(device.id)?Math.sin(t*1.3)*.28:0);
    for(const key of ['radioLight','screen','display','fridgeLight'])if(fx[key]?.material){fx[key].material.color.copy(running?new THREE.Color(0x82dcad):init.get(key));fx[key].material.emissive?.setHex(running?0x153e25:0);}
    for(const key of ['rods','coils','steam','windRings'])for(const part of fx[key]||[]){part.visible=running;if(key==='windRings')part.scale.setScalar(1+Math.sin(t*3)*.15);}
  };
  return root;
}
