import { cp, mkdir, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
await mkdir('dist',{recursive:true});
for(const f of ['index.html','src','vendor','assets','public','licenses','ATTRIBUTIONS.md','ASSET_MANIFEST.json'])await cp(f,'dist/'+f,{recursive:true});
async function walk(p){const out=[];for(const name of await readdir(p)){const f=p+'/'+name;if((await stat(f)).isDirectory())out.push(...await walk(f));else out.push(f);}return out;}
const files=await walk('dist');let bytes=0,gzip=0;
for(const f of files){const b=await readFile(f);bytes+=b.length;gzip+=gzipSync(b).length;}
const result={files:files.length,uncompressedBytes:bytes,sumOfGzipBytes:gzip,note:'Static copy; no framework, bundler or runtime installation. Server does not apply gzip. Fonts and Three.js are local.'};
await writeFile('docs/build-size.json',JSON.stringify(result,null,2));console.log(result);
