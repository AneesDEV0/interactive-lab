// Render existing local models once. Reading pages only load the resulting PNGs.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {devices} from '../src/electricity/data.js';
const output='assets/discovery/electricity';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto((process.env.LAB_URL||'http://127.0.0.1:4173')+'/electricity.html');await page.waitForFunction(()=>window.lab?.scene?.ready);
 for(const device of devices){
  const png=await page.evaluate(async id=>{
   await lab.selectItem(id);const scene=lab.scene;
   const width=1600,height=1200;
   scene.renderer.setPixelRatio(1);scene.renderer.setSize(width,height,false);scene.camera.aspect=4/3;scene.camera.updateProjectionMatrix();scene.fit();
   scene.model.userData.animate(0,false,null,true,false);scene.renderer.render(scene.scene,scene.camera);
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');context.drawImage(scene.renderer.domElement,0,0);
   const pixels=context.getImageData(0,0,width,height).data;let left=width,right=0,top=height,bottom=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left||bottom<top)throw new Error('Model rendered empty: '+id);
   const image=document.createElement('canvas'),padding=24;image.width=right-left+1+padding*2;image.height=bottom-top+1+padding*2;
   image.getContext('2d').drawImage(canvas,left,top,right-left+1,bottom-top+1,padding,padding,right-left+1,bottom-top+1);
   return image.toDataURL('image/png').split(',')[1];
  },device.id);
  await writeFile(`${output}/${device.id}.png`,Buffer.from(png,'base64'));
 }
 console.log(`Rendered ${devices.length} high-resolution still device images.`);
}finally{await browser.close();}
