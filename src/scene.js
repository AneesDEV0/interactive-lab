import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const defaults={blue:0x3093d7,navy:0x254a61,mint:0x60cbbb,yellow:0xffcf57,white:0xf7faf4,dark:0x294552,orange:0xf3a05c};
export async function createLabScene(host,{getState,dispatch,onDevice,onBattery,onMains,projectLabel}){
 let palette={...defaults};try{const result=await fetch('./assets/models/lab-design.json',{signal:AbortSignal.timeout(4000)});if(!result.ok)throw Error('Asset unavailable');const data=await result.json();for(const key of Object.keys(defaults)){if(!Number.isInteger(data.palette[key]))throw Error('Invalid palette');palette[key]=data.palette[key];}}catch{dispatch({type:'ASSET_FAILED'});}
 let renderer;
 try{if(new URLSearchParams(location.search).has('fallback'))throw Error('Requested renderer fallback');renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{dispatch({type:'RENDERER_FAILED'});return null;}
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-6,6,4,-4,.1,80);
 let view=0,zoom=1,focus=null,dead=false,frame=0,renderCount=0,measureStart=performance.now(),fps=0,quality='standard',lastScienceRevision=-1;
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xeaf5f2,1);
 host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const ambient=new THREE.HemisphereLight(0xffffff,0xaccbd0,1.8);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xfff5dc,2.1);sun.position.set(-3,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun);
 const mats=new Map();function mat(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.65}));return mats.get(color);}
 function mesh(parent,geo,color,pos){const m=new THREE.Mesh(geo,mat(color));if(pos)m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,w,h,d,c,x=0,y=0,z=0,r=.08)=>mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),c,[x,y,z]);
 const cyl=(p,r,h,c,x=0,y=0,z=0,n=24)=>mesh(p,new THREE.CylinderGeometry(r,r,h,n),c,[x,y,z]);
 const ball=(p,r,c,x,y,z)=>mesh(p,new THREE.SphereGeometry(r,20,12),c,[x,y,z]);
 function label(p,text,x,y,z,w=.7,h=.25,bg='#f5faf4',fg='#294552'){
  const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=fg;ctx.font='bold 92px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,87);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);p.add(m);return m;
 }
 const ground=box(scene,40,.1,30,0xe1efec,0,-.1,0);ground.receiveShadow=true;
 const grid=new THREE.GridHelper(36,36,0xcaddd9,0xd2e3de);grid.position.y=-.038;grid.material.transparent=true;grid.material.opacity=.55;scene.add(grid);
 box(scene,26,10,.15,0xe7f2ec,0,4,-5.8);
 // A bright science room: window, shelf, books, and a small plant.
 box(scene,4.5,3.2,.12,0xc0e6ec,-4,4.2,-5.66);box(scene,4.7,.13,.25,0xffffff,-4,2.54,-5.5);box(scene,.12,3.2,.14,0xffffff,-4,4.2,-5.48);box(scene,4.5,.12,.14,0xffffff,-4,4.2,-5.48);
 box(scene,3.5,.15,.5,0xb2d4ce,3.2,3.25,-5.4);
 for(let i=0;i<5;i++)box(scene,.23,.65+i%2*.12,.33,[palette.blue,palette.yellow,palette.mint,palette.orange,palette.white][i],2+i*.28,3.62,-5.35,.015);
 cyl(scene,.25,.4,palette.white,4.4,3.55,-5.35);for(let i=0;i<5;i++){let l=ball(scene,.24,palette.mint,4.4+Math.sin(i*2)*.2,3.95+(i%2)*.2,-5.35);l.scale.y=1.6;}
 const cart=new THREE.Group();scene.add(cart);
 box(cart,8.5,.25,3.2,0xf7e5b1,0,1.75,0,.1);box(cart,8.3,.11,3.05,0xfdfbf0,0,1.91,0,.05);
 box(cart,8.1,.19,2.8,0x8ad1c5,0,.55,0);box(cart,7.5,.3,.1,0x55a99c,0,.68,1.35);
 for(const x of [-3.8,3.8])for(const z of [-1.15,1.15]){
   box(cart,.15,1.38,.15,palette.navy,x,1,z,.03);box(cart,.22,.2,.22,palette.dark,x,.27,z);
   const w=cyl(cart,.26,.18,palette.dark,x,.2,z);w.rotation.z=Math.PI/2;const hub=cyl(cart,.11,.2,0xc9e0de,x,.2,z);hub.rotation.z=Math.PI/2;
 }
 for(const x of [-4.45,4.45]){box(cart,.14,.62,.14,palette.navy,x,1.9,-.9);box(cart,.14,.62,.14,palette.navy,x,1.9,.9);const h=box(cart,.14,.14,1.92,palette.navy,x,2.18,0);}
 box(cart,1.9,.5,1.6,palette.white,-2,.92,0);box(cart,1.9,.16,1.65,palette.blue,-2,1.2,0);box(cart,1.3,.35,1.5,palette.yellow,.2,.82,0);
 box(cart,1.6,.06,1.4,palette.white,2,.8,0);box(cart,1.6,.09,1.4,palette.mint,2,.73,0);
 const objects={},wheels=[];
 const car=new THREE.Group();car.name='car';car.position.set(2.35,1.98,.1);objects.car=car;scene.add(car);
 box(car,2.15,.4,1.07,palette.yellow,0,.48,0,.16);box(car,1.2,.53,.92,palette.yellow,-.1,.85,0,.16);
 box(car,.91,.34,.94,0x7db8ca,-.12,.93,0,.09);box(car,.12,.48,.99,palette.yellow,-.1,.87,0);
 box(car,.43,.23,.83,palette.yellow,.83,.67,0,.08);box(car,.11,.2,.9,palette.white,1.08,.46,0,.035);
 for(const x of [-.69,.69])for(const z of [-.57,.57]){const wheel=new THREE.Group();wheel.position.set(x,.3,z);car.add(wheel);const tire=cyl(wheel,.31,.19,palette.dark);tire.rotation.x=Math.PI/2;const hub=cyl(wheel,.16,.205,palette.white);hub.rotation.x=Math.PI/2;box(wheel,.065,.28,.215,palette.yellow);wheels.push(wheel);}
 for(const z of [-.32,.32])box(car,.06,.12,.19,palette.white,1.13,.57,z,.02);
 label(car,'01',.57,.76,.54,.3,.18,'#ffcf57');
 const radio=new THREE.Group();radio.name='radio';radio.position.set(0,1.98,-.15);objects.radio=radio;scene.add(radio);
 box(radio,1.7,1.34,.72,palette.blue,0,.83,0,.18);box(radio,1.55,.07,.8,palette.navy,0,.19,0);
 const speaker=cyl(radio,.43,.09,palette.navy,-.34,.87,.39);speaker.rotation.x=Math.PI/2;
 const center=cyl(radio,.28,.1,0x315d74,-.34,.87,.4);center.rotation.x=Math.PI/2;
 for(let i=0;i<8;i++)box(radio,.52,.023,.02,0x82baca,-.34,.65+i*.059,.461,.005);
 box(radio,.48,.22,.06,0xbce5c4,.48,1.1,.4,.02);label(radio,'FM',.47,1.11,.44,.35,.15,'#bce5c4');
 const knob=cyl(radio,.12,.1,palette.white,.49,.76,.42);knob.rotation.x=Math.PI/2;
 box(radio,.13,.33,.18,palette.navy,-.52,1.66,0);box(radio,.13,.33,.18,palette.navy,.52,1.66,0);box(radio,1.14,.13,.18,palette.navy,0,1.81,0);
 let antenna=cyl(radio,.025,1,0xc3d5d7,.66,1.84,-.15,12);antenna.rotation.z=-.18;
 const radioLight=ball(radio,.055,0x6b7b78,.65,1.31,.39);
 const waves=new THREE.Group();radio.add(waves);waves.position.set(-1,.95,0);
 for(let i=0;i<3;i++){const ring=mesh(waves,new THREE.TorusGeometry(.22+i*.16,.025,6,22,Math.PI),palette.mint);ring.rotation.z=Math.PI/2;ring.position.x=-i*.09;}
 const fridge=new THREE.Group();fridge.name='fridge';fridge.position.set(-2.7,1.98,-.45);objects.fridge=fridge;scene.add(fridge);
 box(fridge,1.4,2.5,1.1,palette.mint,0,1.3,0,.14);box(fridge,1.23,2.23,.05,0xe5f3e7,0,1.3,.566);
 const door=new THREE.Group();door.position.set(-.66,.1,.61);fridge.add(door);
 box(door,1.32,1.63,.13,0xc4eadc,.66,.87,0,.08);box(door,1.32,.7,.13,0xc4eadc,.66,2.065,0,.08);
 box(door,.09,.43,.11,palette.white,1.13,1.11,.12,.035);box(door,.09,.26,.11,palette.white,1.13,2.03,.12,.035);
 label(door,'❄',.67,1.4,.08,.31,.28,'#c4eadc','#23777b');
 for(let i=0;i<3;i++)box(fridge,1.18,.04,.85,palette.white,0,.5+i*.55,.06,.01);
 const doorLight=ball(fridge,.075,0xffdd80,.4,2.29,.4);doorLight.visible=false;
 for(const x of [-.45,.45])box(fridge,.18,.13,.6,palette.navy,x,.035,0,.03);
 const cooling=label(fridge,'❄  4°',0,2.72,.36,.95,.3,'#d7faf0','#168176');cooling.visible=false;
 const bays={};
 function bay(group,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);group.add(g);box(g,1.08,.3,.28,palette.navy,0,0,0,.04);box(g,.08,.2,.24,0xb7c6c4,-.44,.04,.045);box(g,.08,.2,.24,0xb7c6c4,.44,.04,.045);label(g,'−         +',0,-.018,.153,.91,.15,'#254a61','#ffffff');return g;}
 bays.car=bay(car,0,.52,.63);bays.radio=bay(radio,0,.31,.52);
 const tray=new THREE.Group();tray.position.set(.65,2.0,1.11);scene.add(tray);box(tray,1.68,.13,.71,0xb8d8d5,0,0,0,.1);box(tray,1.43,.06,.51,0xdcebe5,0,.07,0,.06);
 const battery=new THREE.Group();scene.add(battery);
 const body=cyl(battery,.145,.83,palette.yellow);body.rotation.z=Math.PI/2;
 const cap=cyl(battery,.147,.22,palette.navy,.29,0,0);cap.rotation.z=Math.PI/2;
 const pole=cyl(battery,.07,.09,0xc9d5d6,.48,0,0);pole.rotation.z=Math.PI/2;
 const bottom=cyl(battery,.14,.045,0xb9cdd0,-.44,0,0);bottom.rotation.z=Math.PI/2;
 label(battery,'−    +',0,.005,.15,.68,.18,'#ffcf57');
 // Adult robot companion; the mains connection is an automatic virtual demonstration.
 const robot=new THREE.Group();robot.position.set(4.8,.02,-.05);scene.add(robot);
 cyl(robot,.48,.17,palette.navy,0,.17,0);box(robot,.69,.77,.57,palette.white,0,.7,0,.15);box(robot,.48,.3,.05,palette.mint,0,.76,.31);
 box(robot,.94,.66,.62,palette.white,0,1.45,0,.19);box(robot,.75,.39,.06,palette.navy,0,1.46,.32,.1);
 for(const x of [-.2,.2])ball(robot,.055,palette.mint,x,1.5,.37);
 box(robot,.19,.025,.035,palette.mint,0,1.35,.37,.01);cyl(robot,.035,.22,palette.navy,0,1.88,0);ball(robot,.09,palette.yellow,0,2,0);
 const robotArm=box(robot,.18,.59,.2,palette.mint,-.5,.81,0,.06);robotArm.rotation.z=-.25;box(robot,.18,.5,.2,palette.mint,.49,.77,0,.06);
 const mainsWire=new THREE.Group();scene.add(mainsWire);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-3.1,2.1,-1),new THREE.Vector3(-4.1,1.7,-1.4),new THREE.Vector3(-4.5,1.9,-2)]);
 mesh(mainsWire,new THREE.TubeGeometry(curve,20,.035,8,false),palette.navy);mainsWire.visible=false;
 const targets=[];for(const id of ['car','radio','fridge']){const g=objects[id];g.traverse(o=>{if(o.isMesh){o.userData.device=id;targets.push(o);}});}
 battery.traverse(o=>{o.userData.battery=true;if(o.isMesh)targets.push(o);});tray.traverse(o=>{o.userData.battery=true;if(o.isMesh)targets.push(o);});
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();function pick(x,y){const r=host.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];return hit?.object.userData;}
 function at(x,y){const hit=pick(x,y);if(hit?.device)return hit.device;const rect=host.getBoundingClientRect();let nearest=null,min=85;for(const id in objects){const v=new THREE.Vector3();objects[id].getWorldPosition(v);v.y+=.7;v.project(camera);const dx=(v.x+1)*rect.width/2+rect.left-x,dy=(-v.y+1)*rect.height/2+rect.top-y,dist=Math.hypot(dx,dy);if(dist<min){min=dist;nearest=id;}}return nearest;}
 let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,hit:pick(e.clientX,e.clientY)};if(down.hit?.battery){onBattery(e);}});
 renderer.domElement.addEventListener('pointerup',e=>{if(down&&!down.hit?.battery&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<12){const h=pick(e.clientX,e.clientY);if(h?.device)onDevice(h.device);}down=null;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();dead=true;cancelAnimationFrame(frame);dispatch({type:'RENDERER_FAILED'});});
 function cameraUpdate(){const rect=host.getBoundingClientRect(),aspect=Math.max(rect.width,1)/Math.max(rect.height,1);const half=Math.max(3.8,6.2/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.zoom=zoom;const p=focus?objects[focus].position.clone().add(new THREE.Vector3(0,.9,0)):new THREE.Vector3(0,2.2,0);camera.position.copy(p).add(new THREE.Vector3(view===1?-2:2.4,5.2,11));camera.lookAt(p);camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);cameraUpdate();});observer.observe(host);cameraUpdate();
 let last=0,lastRevision=-1,revisionStart=0,previousLocation='tray',insertionStart=0,demoEvent=null,demoStart=0;const batteryPos=new THREE.Vector3(),insertionFrom=new THREE.Vector3(.65,2.24,1.11);
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);if(now-last<30)return;last=now;const s=getState();if(s.sessionRevision!==lastRevision){revisionStart=now;lastRevision=s.sessionRevision;}const t=(now-revisionStart)/1000;
   if(s.batteryLocation!==previousLocation){insertionStart=now;insertionFrom.copy(battery.position);if(previousLocation==='held')insertionFrom.set(.65,2.5,1.11);previousLocation=s.batteryLocation;}
   const inserted=s.reducedMotion||now-insertionStart>380;
   const carRuns=s.devices.car.status==='running'&&inserted;car.position.x=2.35+(carRuns&&!s.reducedMotion?Math.sin(t*1.5)*.3:0);for(const w of wheels)w.rotation.z=carRuns&&!s.reducedMotion?t*2.4:0;
   waves.visible=s.devices.radio.status==='running'&&inserted;waves.scale.setScalar(s.reducedMotion?1:1+Math.sin(t*2)*.035);radioLight.material=mat(waves.visible?0x86efa8:0x6b7b78);
   const fridgeRuns=s.devices.fridge.status==='running';cooling.visible=fridgeRuns;mainsWire.visible=fridgeRuns;door.rotation.y=s.doorOpen?-Math.PI*.58:0;doorLight.visible=s.doorOpen&&fridgeRuns;robotArm.rotation.z=fridgeRuns?-.95:-.25;
   if(s.lastRelevantEvent?.type==='SHOW_MAINS_DEMO'&&s.lastRelevantEvent.id!==demoEvent){demoEvent=s.lastRelevantEvent.id;demoStart=now;}
   const demoElapsed=(now-demoStart)/1000;const demonstrating=fridgeRuns&&demoElapsed<3.4&&demoStart>0&&!s.reducedMotion;
   if(demonstrating){const travel=Math.min(1,demoElapsed/1.1),back=demoElapsed>2.2?Math.min(1,(demoElapsed-2.2)/1.2):0;robot.position.x=4.8-9.5*(travel-back);robot.position.z=1.7*Math.sin(Math.PI*(travel-back));}else robot.position.set(4.8,.02,-.05);
   battery.visible=s.batteryLocation!=='held';if(bays[s.batteryLocation]){bays[s.batteryLocation].getWorldPosition(batteryPos);batteryPos.y+=.11;batteryPos.z+=.08;}else batteryPos.set(.65,2.24,1.11);
   const progress=s.reducedMotion?1:Math.min(1,(now-insertionStart)/380);battery.position.lerpVectors(insertionFrom,batteryPos,progress);battery.position.y+=Math.sin(progress*Math.PI)*.22;
   if(s.revision!==lastScienceRevision){renderer.shadowMap.needsUpdate=true;lastScienceRevision=s.revision;}
   for(const id in objects){const v=objects[id].position.clone();v.y+=id==='fridge'?3.25:id==='radio'?2.45:1.65;v.project(camera);projectLabel(id,(v.x+1)*host.clientWidth/2,(-v.y+1)*host.clientHeight/2);}
   renderer.render(scene,camera);renderCount++;if(now-measureStart>2000){fps=renderCount*1000/(now-measureStart);renderCount=0;measureStart=now;if(fps<22&&quality==='standard'){quality='economy';renderer.setPixelRatio(.8);renderer.setSize(host.clientWidth,host.clientHeight);}}
 }
 frame=requestAnimationFrame(tick);
 return {at,zoomIn(){zoom=Math.min(1.65,zoom+.15);cameraUpdate();},zoomOut(){zoom=Math.max(.75,zoom-.15);cameraUpdate();},reset(){focus=null;zoom=1;view=0;demoStart=0;cameraUpdate();},inspect(id){focus=id||'car';zoom=1.7;view=view===1?0:1;cameraUpdate();},stats(){return {fps,quality,pixelRatio:renderer.getPixelRatio(),triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries};},dispose(){dead=true;cancelAnimationFrame(frame);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material?.map)o.material.map.dispose();});for(const m of mats.values())m.dispose();renderer.dispose();}};
}
