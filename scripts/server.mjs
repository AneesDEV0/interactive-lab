import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const hasParentIndex = existsSync(path.resolve('..', 'index.html'));
const root = path.resolve(process.argv[2] || (hasParentIndex ? '..' : '.'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.md': 'text/plain; charset=utf-8'
};

async function tryResolve(targetPath) {
  try {
    const s = await stat(targetPath);
    if (s.isFile()) return targetPath;
  } catch {}
  return null;
}

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const rel = pathname === '/' ? '/index.html' : pathname;

    let file = await tryResolve(path.resolve(root, '.' + rel));
    if (!file) {
      file = await tryResolve(path.resolve(root, 'colleague_repo' + rel)) ||
             await tryResolve(path.resolve(root, 'colleague_repo/public' + rel)) ||
             await tryResolve(path.resolve(root, 'public' + rel));
    }

    if (!file || !file.startsWith(root) || file.includes('node_modules') || file.includes('.git')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(4173, '127.0.0.1', () => console.log('Battery Lab: http://127.0.0.1:4173'));
