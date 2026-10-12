// Petit serveur statique sans dépendance : `npm start` puis ouvrir l'adresse affichée.
// Sur le même Wi-Fi, l'iPhone peut ouvrir http://<ip-de-l-ordinateur>:8080.

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../app/', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};

/**
 * Les en-têtes de app/_headers (règles de Cloudflare Pages : une adresse, « /* » pour toutes, puis ses
 * en-têtes, en retrait), appliqués comme sur le site publié.
 */
export function parseHeaders(text) {
  const rules = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) rules.push({ path: line.trim(), headers: {} });
    else if (rules.length) {
      const i = line.indexOf(':');
      if (i > 0) rules.at(-1).headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

/** Les en-têtes d'une adresse : ceux de chaque règle qui la couvre (« /* », un dossier « /x/* », l'adresse exacte). */
export function headersFor(rules, path) {
  const out = {};
  for (const rule of rules) {
    const match = rule.path.endsWith('*') ? path.startsWith(rule.path.slice(0, -1)) : path === rule.path;
    if (match) Object.assign(out, rule.headers);
  }
  return out;
}

/**
 * Options (test de mise à jour, scripts/smoke.mjs) : `cacheControl`, l'en-tête envoyé (par défaut, le
 * navigateur redemande chaque fichier) ; `replaced`, des fichiers servis à la place de ceux du disque
 * (adresse → contenu), comme une nouvelle version publiée.
 */
export function startServer(port = PORT, root = ROOT, { cacheControl = 'no-cache', replaced = null } = {}) {
  const rules = existsSync(join(root, '_headers')) ? parseHeaders(readFileSync(join(root, '_headers'), 'utf8')) : [];
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    for (const [name, value] of Object.entries(headersFor(rules, path))) res.setHeader(name, value);
    const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = replaced?.has(path) ? Buffer.from(replaced.get(path)) : await readFile(file);
      const type = TYPES[extname(file)] || 'application/octet-stream';
      // une partie du fichier (« Range: bytes=a-b ») : un son pris dans un paquet de sons, comme sur GitHub Pages
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if (range) {
        const start = Number(range[1]);
        const end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
        if (start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
          return;
        }
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Cache-Control': cacheControl });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': cacheControl });
      res.end(body);
    } catch {
      res.writeHead(404).end('Introuvable');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await startServer();
  console.log(`Lire, compter et s’amuser ! : http://localhost:${PORT}`);
}
