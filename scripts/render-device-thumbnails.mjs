import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {devices} from '../src/electricity/data.js';
await mkdir('assets/thumbnails',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1400,height:950}});
await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.lab?.scene);
for(const d of devices){
 const png=await page.evaluate(async id=>{
   await window.lab.selectDevice(id);const s=window.lab.scene;
   s.world.children.forEach(o=>{if(o!==s.model)o.visible=false;});
   s.renderer.setSize(300,240,false);s.camera.aspect=300/240;s.camera.position.set(3.5,2.6,4.5);s.controls.target.set(0,1,0);s.controls.update();s.camera.updateProjectionMatrix();s.renderer.render(s.scene,s.camera);
   const canvas=document.createElement('canvas');canvas.width=300;canvas.height=240;const ctx=canvas.getContext('2d');ctx.drawImage(s.renderer.domElement,0,0,300,240);
   const data=ctx.getImageData(0,0,300,240).data;let left=300,right=0,top=240,bottom=0;
   for(let y=0;y<240;y++)for(let x=0;x<300;x++)if(data[(y*300+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   const crop=document.createElement('canvas'),padding=8;crop.width=right-left+1+padding*2;crop.height=bottom-top+1+padding*2;crop.getContext('2d').drawImage(canvas,left,top,right-left+1,bottom-top+1,padding,padding,right-left+1,bottom-top+1);
   return crop.toDataURL('image/png').split(',')[1];
 },d.id);
 await writeFile(`assets/thumbnails/${d.id}.png`,Buffer.from(png,'base64'));
}
await browser.close();console.log('Rendered 17 model thumbnails');
