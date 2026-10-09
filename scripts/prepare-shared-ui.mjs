import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
const pages={index:['','الأنشطة · مختبر شرارة'],electricity:['electricity','شغّل الأجهزة'],materials:['materials','افرز المواد'],safety:['safety','اختر التصرف الآمن'],conductors:['conductors','اختبر مرور الكهرباء'],about:['','عن مختبر شرارة']};
for(const [page,[activity,title]] of Object.entries(pages))await writeFile(`${page}.html`,`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#7052a3"><meta name="description" content="مختبر علوم تفاعلي للصف الرابع. أربع تجارب محلية مع شرارة."><title>${title} · مختبر شرارة</title><link rel="icon" href="public/favicon.svg"><link rel="stylesheet" href="src/shared/lab.css"><script type="importmap">{"imports":{"three":"./vendor/three.module.js","three/addons/":"./vendor/addons/"}}</script></head><body data-activity="${activity}" data-page="${page}"><a class="skip-link" href="#main">انتقل إلى المحتوى</a><div id="app"></div><noscript>فعّل JavaScript لتشغيل التجارب التفاعلية.</noscript><script type="module" src="src/shared/app.js"></script></body></html>\n`);
for(const activity of ['materials','conductors','safety']){
 const dir=`assets/thumbnails/challenge/${activity}`;await mkdir(dir,{recursive:true});
 for(const file of await readdir(`assets/thumbnails/${activity}`)){
  let svg=await readFile(`assets/thumbnails/${activity}/${file}`,'utf8');
  if(activity==='safety'){
   svg=svg.replace(/<rect x="0" y="0" width="160" height="120"[^>]*\/>/g,'<rect x="0" y="0" width="160" height="120" rx="14" fill="#f3f0f7"/>');
   // Status badges are separate final circle+text/path nodes in the supplied artwork.
   svg=svg.replace(/<circle[^>]*\/>\s*<(?:text|path)[^>]*(?:>[⚡❌⚠️🔥!]+<\/text>|\/>)/g,'');
   svg=svg.replace(/<!-- (?:درع أمان أخضر|علامة صح الأمان والحماية|علامة صح خضراء)[\s\S]*?(?=<\/svg>)/g,'');
   svg=svg.replace(/<text[^>]*>[⚡❌⚠️🔥!]+<\/text>/g,'');
   svg=svg.replace(/<polygon[^>]*fill="#38a169"[^>]*\/>/g,'');
   svg=svg.replace(/<polygon[^>]*fill="#(?:ecc94b|f6e05e|f6ad55|fc8181|dd6b20)"[^>]*\/>/g,'');
   svg=svg.replace(/<g filter="url\(#sparkGlow\)">[\s\S]*?<\/g>/g,'');
  }
  await writeFile(`${dir}/${file}`,svg);
 }
}
