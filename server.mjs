// Servidor estático sin dependencias para Railway (sirve /dist con fallback a index.html).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml']);
const cache = new Map(); // ruta -> { body, gz, type, mtime }

async function load(file) {
  const info = await stat(file);
  if (!info.isFile()) throw new Error('not a file');
  const hit = cache.get(file);
  if (hit && hit.mtime === info.mtimeMs) return hit;
  const ext = extname(file).toLowerCase();
  const body = await readFile(file);
  const entry = {
    body,
    gz: COMPRESSIBLE.has(ext) ? gzipSync(body) : null,
    type: TYPES[ext] || 'application/octet-stream',
    mtime: info.mtimeMs,
  };
  cache.set(file, entry);
  return entry;
}

function send(req, res, entry, status, cacheControl) {
  const gz = entry.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const body = gz ? entry.gz : entry.body;
  res.writeHead(status, {
    'Content-Type': entry.type,
    'Content-Length': body.length,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...(gz ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
      return;
    }
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const entry = await load(file);
      const immutable = path.startsWith('/assets/');
      send(req, res, entry, 200, immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    } catch {
      // Un archivo con extensión que no existe es un 404 real; el resto cae al index (SPA).
      if (extname(path)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
        return;
      }
      send(req, res, await load(join(ROOT, 'index.html')), 200, 'no-cache');
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Error del servidor');
  }
}).listen(PORT, '0.0.0.0', () => console.log(`Gamma Lab en el puerto ${PORT}`));
