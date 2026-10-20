import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAMILLES, OUTILS, outilsDeLEnfant, outilsPour, phrasesOutils, RUBRIQUE_OUTILS, trouverOutil } from '../app/js/outils.js';
import { GRADES } from '../app/js/storage.js';
import { tapText } from '../app/js/a11y-jeux.js';
import { createRng } from '../app/js/random.js';
import { DOMAINS } from '../app/js/games/index.js';

const CLASSES = Object.keys(GRADES);

test('chaque outil est complet : nom, dessin, famille, classes, aide, défis', () => {
  const ids = new Set();
  for (const outil of OUTILS) {
    assert.ok(!ids.has(outil.id), `${outil.id} en double`);
    ids.add(outil.id);
    assert.equal(trouverOutil(outil.id), outil);
    for (const key of ['titre', 'icone', 'aide']) assert.ok(typeof outil[key] === 'string' && outil[key], `${outil.id} : ${key}`);
    assert.ok(FAMILLES.some((f) => f.id === outil.famille), `${outil.id} : famille ${outil.famille}`);
    assert.ok(outil.classes.length && outil.classes.every((c) => CLASSES.includes(c)), `${outil.id} : classes`);
    assert.equal(typeof outil.creer, 'function', `${outil.id} : creer`);
    // toucher, jamais glisser : la consigne est la même avec le réglage « toucher plutôt que glisser »
    assert.equal(tapText(outil.aide), outil.aide, `${outil.id} : l'aide parle de glisser`);
  }
  // la rubrique ne prend pas l'identifiant d'une autre
  assert.ok(!DOMAINS.some((d) => d.id === RUBRIQUE_OUTILS.id));
});

test('les défis : une consigne écrite, réussie par la solution, pas par l’outil vide', () => {
  for (const outil of OUTILS) {
    if (!outil.defi) continue;
    for (const grade of outil.classes) {
      const rng = createRng(7);
      const vus = new Set();
      for (let i = 0; i < 300; i++) {
        const defi = outil.defi(grade, rng);
        if (!defi) continue;
        vus.add(defi.consigne);
        assert.match(defi.consigne, /^\p{Lu}.*[.!?]$/u, `${outil.id} ${grade} : « ${defi.consigne} »`);
        assert.ok(!/ [?!:;]/.test(defi.consigne), `${outil.id} : espace avant la ponctuation dans « ${defi.consigne} » (ajoutée à l'écran)`);
        assert.equal(tapText(defi.consigne), defi.consigne, `${outil.id} : « ${defi.consigne} » parle de glisser`);
        if (defi.libre) continue;
        assert.ok(outil.reussi(defi, outil.solution(defi)), `${outil.id} ${grade} : la solution ne répond pas à « ${defi.consigne} »`);
        if (outil.vide && !outil.reussi(defi, outil.vide)) {
          assert.ok(outil.indices.includes(outil.indice(defi, outil.vide)), `${outil.id} : indice inconnu`);
        }
      }
      // un outil peut n'avoir de défis que dans certaines classes (defi renvoie null ailleurs)
      if (vus.size) assert.ok(vus.size >= 3, `${outil.id} ${grade} : seulement ${vus.size} défis différents`);
    }
  }
});

test('le cadre de dix : 10 cases jusqu’en GS, 20 au CP ; les défis vont jusqu’au bon nombre', () => {
  const cadre = trouverOutil('cadre-dix');
  assert.equal(cadre.cases('GS'), 10);
  assert.equal(cadre.cases('CP'), 20);
  for (const grade of cadre.classes) {
    const rng = createRng(3);
    for (let i = 0; i < 300; i++) {
      const defi = cadre.defi(grade, rng);
      const max = defi.type === 'montre' ? defi.n : defi.total;
      assert.ok(max <= cadre.cases(grade), `${grade} : « ${defi.consigne} » ne tient pas dans le cadre`);
      if (grade === 'PS') assert.ok(defi.n <= 3);
    }
  }
  // compléter : il faut les rouges demandés, puis le cadre plein
  const defi = { type: 'complete', n: 6, total: 10 };
  assert.ok(cadre.reussi(defi, { rouge: 6, jaune: 4, total: 10 }));
  assert.ok(!cadre.reussi(defi, { rouge: 4, jaune: 6, total: 10 }));
  assert.equal(cadre.indice(defi, { rouge: 4, jaune: 6, total: 10 }), 'Pas encore. Compte d’abord les jetons rouges.');
  assert.equal(cadre.indice(defi, { rouge: 6, jaune: 2, total: 8 }), 'Pas encore. Le cadre doit être plein.');
});

test('les outils de chaque classe, et la rubrique masquée par les parents', () => {
  for (const grade of CLASSES) {
    for (const outil of outilsPour(grade)) assert.ok(outil.classes.includes(grade));
  }
  assert.ok(outilsDeLEnfant({ grade: 'GS' }).length);
  assert.deepEqual(outilsDeLEnfant({ grade: 'GS', hiddenDomains: ['outils'] }), []);
});

test('les phrases des outils (pour la voix) : écrans, aides, indices et consignes', () => {
  const phrases = phrasesOutils(50);
  for (const outil of OUTILS) {
    assert.ok(phrases.includes(outil.aide));
    for (const indice of outil.indices || []) assert.ok(phrases.includes(indice));
  }
  assert.ok(phrases.includes('Pose 7 jetons dans le cadre.'));
});
