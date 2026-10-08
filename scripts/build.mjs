import { cp, mkdir, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

await mkdir('dist', { recursive: true });

const targets = [
  'dynamic-lab.html',
  'static-lab.html',
  'src',
  'vendor',
  'assets',
  'public',
  'licenses',
  'ATTRIBUTIONS.md',
  'ASSET_MANIFEST.json'
];

// Copy local targets if present
for (const f of targets) {
  if (existsSync(f)) {
    await cp(f, 'dist/' + f, { recursive: true });
  }
}

// Copy root html files to dist
for (const page of ['index.html', 'electricity.html', 'materials.html', 'conductors.html', '404.html']) {
  if (existsSync(page)) {
    await cp(page, 'dist/' + page);
  }
}
if (existsSync('public/static-activity.html')) {
  await cp('public/static-activity.html', 'dist/static-activity.html');
}
if (existsSync('public/favicon.svg')) {
  await cp('public/favicon.svg', 'dist/favicon.svg');
}
await mkdir('docs', { recursive: true });

async function walk(p) {
  const out = [];
  for (const name of await readdir(p)) {
    const f = p + '/' + name;
    if ((await stat(f)).isDirectory()) out.push(...await walk(f));
    else out.push(f);
  }
  return out;
}

const files = await walk('dist');
let bytes = 0, gzip = 0;
for (const f of files) {
  const b = await readFile(f);
  bytes += b.length;
  gzip += gzipSync(b).length;
}

const result = {
  files: files.length,
  uncompressedBytes: bytes,
  sumOfGzipBytes: gzip,
  note: 'Static copy; no framework, bundler or runtime installation. Server does not apply gzip. Fonts and Three.js are local.'
};

await writeFile('docs/build-size.json', JSON.stringify(result, null, 2));
console.log(result);
