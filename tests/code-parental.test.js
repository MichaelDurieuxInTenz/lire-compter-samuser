// Code parental (espace parents) : le code choisi, le calcul d'adulte, le verrou après des erreurs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRng } from '../app/js/random.js';
import { apresErreur, attente, calculDifficile, codeTropFacile, MAX_ERREURS, problemeCode, VERROU_MS } from '../app/js/code-parental.js';

test('code parental : 4 chiffres, pas trop facile à deviner, tapé deux fois pareil', () => {
  for (const code of ['0000', '7777', '1234', '2345', '6789', '0123', '9876', '4321', '3210']) {
    assert.ok(codeTropFacile(code), code);
    assert.match(problemeCode(code, code), /trop facile/, code);
  }
  for (const code of ['2580', '1357', '1123', '9081', '4072']) {
    assert.ok(!codeTropFacile(code), code);
    assert.equal(problemeCode(code, code), '', code);
  }
  assert.match(problemeCode('258', '258'), /4 chiffres/);
  assert.match(problemeCode('25801', '25801'), /4 chiffres/);
  assert.match(problemeCode('25a0', '25a0'), /4 chiffres/);
  assert.match(problemeCode('2580', '2581'), /pas les mêmes/);
  assert.match(problemeCode('2580', ''), /pas les mêmes/);
});

test('code parental : le calcul d’adulte (un nombre de 12 à 19, fois 6 à 9, moins 11 à 49), juste et toujours positif', () => {
  const rng = createRng(42);
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const { texte, reponse } = calculDifficile(rng);
    const m = texte.match(/^(\d+) × (\d+) − (\d+) = \?$/);
    assert.ok(m, texte);
    const [a, b, c] = m.slice(1).map(Number);
    assert.ok(a >= 12 && a <= 19 && b >= 6 && b <= 9 && c >= 11 && c <= 49, texte);
    assert.equal(reponse, a * b - c, texte);
    assert.ok(reponse > 0, texte);
    seen.add(texte);
  }
  assert.ok(seen.size > 300, `${seen.size} calculs différents sur 500`);
});

test('code parental : après 3 erreurs de suite, 30 secondes d’attente, puis on peut réessayer', () => {
  const t0 = 1_000_000;
  let etat = {};
  for (let i = 1; i < MAX_ERREURS; i++) {
    etat = apresErreur(etat, t0);
    assert.equal(etat.erreurs, i);
    assert.equal(attente(etat, t0), 0, 'pas encore d’attente');
  }
  etat = apresErreur(etat, t0);
  assert.equal(attente(etat, t0), VERROU_MS);
  assert.equal(VERROU_MS, 30_000);
  assert.ok(attente(etat, t0 + 10_000) > 0, 'encore 20 s');
  assert.equal(attente(etat, t0 + VERROU_MS), 0, 'fini');
  // le compte des erreurs repart à zéro après l'attente
  etat = apresErreur(etat, t0 + VERROU_MS + 1);
  assert.equal(etat.erreurs, 1);
  assert.equal(attente(etat, t0 + VERROU_MS + 1), 0);
  assert.equal(attente({}, t0), 0);
  assert.equal(attente(null, t0), 0);
});

test('code parental : demandé à chaque entrée (plus de passage valable toute la séance), les chiffres cachés', () => {
  const main = readFileSync(new URL('../app/js/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /parent-ok/, 'la barrière ne doit plus être franchie pour toute la séance');
  // l'espace parents et le temps de jeu en plus passent tous deux par la barrière
  assert.ok((main.match(/parentGate\(/g) || []).length >= 3);
  const css = readFileSync(new URL('../app/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.gate-code\s*\{[^}]*-webkit-text-security:\s*disc/);
});
