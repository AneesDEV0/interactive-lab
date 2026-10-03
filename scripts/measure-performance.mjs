import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
await page.goto('http://127.0.0.1:4173');
await page.waitForFunction(()=>window.labDiagnostics?.().state.rendererStatus==='ready');
await page.locator('[data-action="start"]').click();
await page.locator('[data-action="doneTutorial"]').first().click();
await page.locator('#battery-button').click();
await page.locator('#card-car [data-action="device"]').click();
await page.locator('[data-action="predictSkip"]').click();
const samples=[];
for(let i=0;i<4;i++){await page.waitForTimeout(2100);samples.push(await page.evaluate(()=>window.labDiagnostics().render));}
const context=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const d=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):'unavailable',devicePixelRatio,userAgent:navigator.userAgent};});
const report={date:'2026-10-03',viewport:{width:1280,height:900},method:'Chrome default graphics backend; running toy, four consecutive 2.1 second samples after initialization',context,samples};
await writeFile('docs/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
