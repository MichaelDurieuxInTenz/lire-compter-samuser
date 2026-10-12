// Code parental (espace parents) : le code choisi, le calcul d'adulte, le verrou après des erreurs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRng } from '../app/js/random.js';
import {
  apresErreur, ATTENTE_OUBLI_MS, attente, calculDifficile, calculOubli, CHOIX_OUBLI_MS, codeTropFacile, dureeEnClair, etapeOubli,
  MAX_ERREURS, PALIERS_VERROU, problemeCode,
} from '../app/js/code-parental.js';

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

test('code parental : après 3 erreurs de suite, une attente de plus en plus longue (30 s, 2 min, 10 min, 30 min)', () => {
  let t = 1_000_000;
  let etat = {};
  const attentes = [];
  for (let serie = 0; serie < 6; serie++) {
    for (let i = 1; i < MAX_ERREURS; i++) {
      etat = apresErreur(etat, t);
      assert.equal(etat.erreurs, i);
      assert.equal(attente(etat, t), 0, 'pas encore d’attente');
    }
    etat = apresErreur(etat, t);
    attentes.push(attente(etat, t));
    assert.ok(attente(etat, t + attentes.at(-1) - 1000) > 0, 'encore un peu');
    t += attentes.at(-1);
    assert.equal(attente(etat, t), 0, 'fini');
  }
  assert.deepEqual(attentes, [30_000, 120_000, 600_000, 1_800_000, 1_800_000, 1_800_000]);
  assert.deepEqual(PALIERS_VERROU, [30_000, 120_000, 600_000, 1_800_000]);
  // le bon code remet tout à zéro (l'écran enregistre alors {}) : de nouveau 30 s
  etat = {};
  for (let i = 0; i < MAX_ERREURS; i++) etat = apresErreur(etat, t);
  assert.equal(attente(etat, t), 30_000);
  // les autres champs (un code oublié en cours) sont gardés
  assert.equal(apresErreur({ oubli: 42 }, t).oubli, 42);
  assert.equal(attente({}, t), 0);
  assert.equal(attente(null, t), 0);
  assert.equal(apresErreur(null, t).erreurs, 1);
});

test('code oublié : un calcul plus dur, juste et positif ; 5 minutes d’attente, puis 10 minutes pour choisir', () => {
  const rng = createRng(7);
  for (let i = 0; i < 500; i++) {
    const { texte, reponse } = calculOubli(rng);
    const [a, b, c] = texte.match(/^(\d+) × (\d+) − (\d+) = \?$/).slice(1).map(Number);
    assert.ok(a >= 23 && a <= 49 && b >= 13 && b <= 19 && c >= 101 && c <= 299, texte);
    assert.equal(reponse, a * b - c, texte);
    assert.ok(reponse >= 50, texte);
  }
  const t0 = 5_000_000;
  const etat = { oubli: t0 + ATTENTE_OUBLI_MS };
  assert.equal(ATTENTE_OUBLI_MS, 5 * 60_000);
  assert.equal(etapeOubli(etat, t0), 'attente');
  assert.equal(etapeOubli(etat, t0 + ATTENTE_OUBLI_MS - 1), 'attente');
  assert.equal(etapeOubli(etat, t0 + ATTENTE_OUBLI_MS), 'choix');
  assert.equal(etapeOubli(etat, t0 + ATTENTE_OUBLI_MS + CHOIX_OUBLI_MS - 1), 'choix');
  assert.equal(etapeOubli(etat, t0 + ATTENTE_OUBLI_MS + CHOIX_OUBLI_MS), '', 'trop tard : tout est à refaire');
  assert.equal(etapeOubli({}, t0), '');
  assert.equal(etapeOubli(null, t0), '');
});

test('code parental : les durées affichées', () => {
  assert.equal(dureeEnClair(30_000), '30 s');
  assert.equal(dureeEnClair(29_001), '30 s');
  assert.equal(dureeEnClair(400), '1 s');
  assert.equal(dureeEnClair(0), '1 s');
  assert.equal(dureeEnClair(60_000), '1 min');
  assert.equal(dureeEnClair(120_000), '2 min');
  assert.equal(dureeEnClair(299_000), '4 min 59 s');
  assert.equal(dureeEnClair(245_000), '4 min 05 s');
});

test('code parental : demandé à chaque entrée (plus de passage valable toute la séance), les chiffres cachés', () => {
  const main = readFileSync(new URL('../app/js/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /parent-ok/, 'la barrière ne doit plus être franchie pour toute la séance');
  // l'espace parents et le temps de jeu en plus passent tous deux par la barrière
  assert.ok((main.match(/parentGate\(/g) || []).length >= 3);
  const css = readFileSync(new URL('../app/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.gate-code\s*\{[^}]*-webkit-text-security:\s*disc/);
});
