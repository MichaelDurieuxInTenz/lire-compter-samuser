import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const APP = new URL('../app/', import.meta.url).pathname;
// _headers : les en-têtes de sécurité, lus par Cloudflare Pages (ce n'est pas un fichier de l'app)
const NOT_CACHED = new Set(['sw.js', '_headers', 'fonts/OFL.txt', 'fonts/TWEMOJI.txt']);

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [relative(APP, path)];
  });
}

test('le service worker met en cache tous les fichiers de l’app (et seulement eux)', () => {
  const sw = readFileSync(join(APP, 'sw.js'), 'utf8');
  const list = sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1];
  const cached = [...list.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  // les sons de la voix naturelle sont téléchargés à part, en paquets (cache des voix, voir voix.test.js)
  const files = listFiles(APP).filter((f) => !NOT_CACHED.has(f) && !/^voix\/((fr|en)\/|paquet-)/.test(f));
  assert.deepEqual([...cached].sort(), [...files].sort());
});

test('hors ligne : un fichier de l’app est cherché dans le cache de l’app seul, un son par son adresse exacte', () => {
  const sw = readFileSync(join(APP, 'sw.js'), 'utf8');
  // caches.match(…, { ignoreSearch: true }) parcourt tous les caches, dont celui des 14 000 sons, en entier :
  // 23 ms par fichier au lieu de 0,4 ms, et l'app mettait des dizaines de secondes à s'ouvrir hors ligne
  assert.doesNotMatch(sw, /caches\.match\([^)]*ignoreSearch/);
  const clips = sw.slice(sw.indexOf('if (isVoiceClip(url)) {'), sw.indexOf('voiceFromPack(event.request'));
  assert.ok(clips.includes('cache.match(event.request)'), 'son cherché par adresse exacte');
  assert.doesNotMatch(clips, /ignoreSearch/);
});

test('mises à jour : chaque fichier de l’app est redemandé au serveur, l’app se recharge au bon moment', () => {
  const sw = readFileSync(join(APP, 'sw.js'), 'utf8');
  // sans « no-cache », le navigateur resservait sa copie (gardée jusqu'à 4 h par le serveur) : une app
  // de l'écran d'accueil restait sur l'ancienne version (scripts/smoke.mjs, checkUpdate, le vérifie aussi)
  assert.match(sw, /fetch\(event\.request, \{ cache: 'no-cache' \}\)/);
  assert.match(sw, /new Request\(file, \{ cache: 'reload' \}\)/, 'nouvelle version mise en cache depuis le serveur');
  assert.match(sw, /self\.skipWaiting\(\)/);
  assert.match(sw, /self\.clients\.claim\(\)/);
  const main = readFileSync(new URL('../app/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /registration\.update\(\)/, 'au retour dans l’app, une nouvelle version est cherchée');
  assert.match(main, /'controllerchange'/);
  // rechargée seulement sur « Qui joue ? » ou l'accueil d'un enfant, jamais pendant une partie
  assert.match(main, /main\.screen\.profiles:not\(\.duo-pick\), :scope > main\.screen\.home/);
});

test('le manifeste et la page d’accueil pointent vers des fichiers existants', () => {
  const manifest = JSON.parse(readFileSync(join(APP, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) assert.ok(statSync(join(APP, icon.src)).isFile(), icon.src);
  const html = readFileSync(join(APP, 'index.html'), 'utf8');
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
    assert.ok(statSync(join(APP, ref)).isFile(), ref);
  }
});

test('sécurité : la page n’autorise que les fichiers de l’app (CSP)', () => {
  const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe/, 'aucun script en ligne ni eval');
  // voix des parents : les enregistrements (blob:) se jouent, rien d'autre ne vient d'ailleurs
  const media = csp.match(/media-src ([^;]+)/)?.[1].trim().split(/\s+/);
  assert.deepEqual(media, ["'self'", 'blob:']);
});

test('en-têtes de sécurité (app/_headers, Cloudflare Pages) : pas dans le cadre d’un autre site, micro seulement', async () => {
  const { headersFor, parseHeaders } = await import('../scripts/serve.mjs');
  const rules = parseHeaders(readFileSync(join(APP, '_headers'), 'utf8'));
  for (const path of ['/', '/index.html', '/js/main.js', '/voix/manifest.json']) {
    const h = headersFor(rules, path);
    assert.equal(h['Content-Security-Policy'], "frame-ancestors 'none'", path);
    assert.equal(h['X-Frame-Options'], 'DENY', path);
    assert.equal(h['X-Content-Type-Options'], 'nosniff', path);
    assert.equal(h['Referrer-Policy'], 'no-referrer', path);
    assert.match(h['Permissions-Policy'], /(^|, )microphone=\(self\)/, `${path} : le micro sert aux histoires enregistrées`);
    assert.match(h['Permissions-Policy'], /camera=\(\)/, path);
    assert.match(h['Strict-Transport-Security'], /max-age=\d{7,}/, path);
  }
  // la CSP de la page reste dans index.html (scripts du site seulement, sans script en ligne)
  const html = readFileSync(join(APP, 'index.html'), 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'self';/);
  assert.doesNotMatch(html, /script-src[^;"]*'unsafe-(inline|eval)'/);
});
