// Assez de questions différentes dans les niveaux de maths enrichis (une partie de 10 questions ne repose
// pas une question déjà posée), et des données justes : une seule bonne réponse, pas de doublon, des clés
// qui désignent la question (jamais l'ordre des choix), des calculs vérifiés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../app/js/games/index.js';
import { COMPARE_PAIRS, FRACTIONS } from '../app/js/games/nombres-plus.js';
import { SHAPE_RIDDLES, SHAPE_RIDDLES_2 } from '../app/js/games/maths-extra.js';
import { createRng } from '../app/js/random.js';
import { historique, marques, noter, questionSuivante } from '../app/js/repetition.js';

const ctx = { name: 'Léa', season: 'automne' };
const game = (id) => GAMES.find((g) => g.id === id);

/** Des questions tirées comme dans une partie (le rang de la question est passé à generate). */
function tirages(id, level, n = 400, seed = 17) {
  const rng = createRng(seed);
  return Array.from({ length: n }, (_, i) => game(id).generate(level, rng, i, ctx));
}

/** Nombre de questions différentes : clés distinctes et sujets distincts (comme l'app), le plus petit des deux. */
function differentes(id, level) {
  const cles = new Set();
  const sujets = new Set();
  for (const q of tirages(id, level)) {
    const [k, s] = marques(q);
    cles.add(k);
    sujets.add(s);
  }
  return Math.min(cles.size, sujets.size);
}

/** Une partie de 10 questions, comme main.js : répète-t-elle une question ? */
function partieRepete(id, level, rng) {
  const h = historique();
  const vues = new Set();
  let repete = false;
  for (let index = 0; index < 10; index++) {
    const q = questionSuivante(() => game(id).generate(level, rng, index, ctx), h);
    noter(h, q);
    const m = marques(q);
    if (m.some((x) => vues.has(x))) repete = true;
    m.forEach((x) => vues.add(x));
  }
  return repete;
}

// [jeu, niveau, questions différentes au moins]
const ENRICHIS = [
  ['calendrier', 4, 15], ['mesures', 5, 15],
  ['donnees-cm', 5, 15], ['donnees-cm', 6, 15], ['donnees-cm', 10, 15], ['geometrie-cm', 6, 15],
  ['formes', 5, 12], ['formes', 8, 12], ['ranger', 2, 15],
  ['fractions', 3, 40], ['fractions', 4, 40], ['fractions', 9, 30],
];

test('maths : assez de questions différentes dans les niveaux enrichis', () => {
  for (const [id, level, min] of ENRICHIS) {
    const n = differentes(id, level);
    assert.ok(n >= min, `${id} niveau ${level} : ${n} questions différentes (au moins ${min})`);
  }
});

test('maths : une partie de 10 questions ne repose jamais une question dans les niveaux enrichis', () => {
  for (const [id, level] of ENRICHIS) {
    const rng = createRng(5);
    let repetees = 0;
    for (let p = 0; p < 40; p++) if (partieRepete(id, level, rng)) repetees++;
    assert.equal(repetees, 0, `${id} niveau ${level} : ${repetees} parties sur 40 répètent une question`);
  }
});

test('maths : une seule bonne réponse, pas deux fois le même choix', () => {
  for (const [id, level] of ENRICHIS) {
    for (const q of tirages(id, level, 300)) {
      if (!q.choices?.length) continue; // colorier, ranger : pas de choix
      const valeurs = q.choices.map((c) => JSON.stringify(c.value));
      assert.equal(new Set(valeurs).size, valeurs.length, `${id} ${level} : choix en double (${q.text})`);
      assert.equal(valeurs.filter((v) => v === JSON.stringify(q.answer)).length, 1, `${id} ${level} : ${q.text}`);
      const etiquettes = q.choices.map((c) => c.label).filter(Boolean);
      assert.equal(new Set(etiquettes).size, etiquettes.length, `${id} ${level} : étiquettes en double (${q.text})`);
    }
  }
});

test('maths : la clé désigne la question, pas l’ordre des choix', () => {
  for (const [id, level] of ENRICHIS) {
    const parCle = new Map();
    for (const q of tirages(id, level, 300)) {
      // une même clé : la même consigne écrite (hors dessins tirés au hasard) et la même bonne réponse
      const ref = parCle.get(q.key);
      const vu = { answer: JSON.stringify(q.answer), text: q.text };
      if (!ref) {
        parCle.set(q.key, vu);
        continue;
      }
      assert.equal(vu.answer, ref.answer, `${id} ${level} : ${q.key}`);
      // « un quart ou un demi » / « un demi ou un quart » : la même question, la même clé
      if (!(id === 'fractions' && level === 9)) assert.equal(vu.text, ref.text, `${id} ${level} : ${q.key}`);
    }
  }
});

test('maths : textes soignés (apostrophe typographique, phrases ponctuées)', () => {
  for (const [id, level] of ENRICHIS) {
    for (const q of tirages(id, level, 200)) {
      for (const texte of [q.text, q.instruction, q.success?.speak].flat().filter(Boolean)) {
        assert.ok(!texte.includes("'"), `${id} ${level} : apostrophe droite dans « ${texte} »`);
        assert.match(texte, /[.?!…]$/, `${id} ${level} : « ${texte} »`);
        assert.ok(!/\S[?!:]/.test(texte), `${id} ${level} : espace manquante dans « ${texte} »`);
      }
      for (const c of q.choices || []) if (c.label) assert.ok(!c.label.includes("'"), `${id} ${level} : « ${c.label} »`);
    }
  }
});

test('calendrier niveau 4 : le nombre de jours de chaque mois est juste', () => {
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const vus = new Set();
  for (const q of tirages('calendrier', 4)) {
    vus.add(q.text);
    const mois = MOIS.findIndex((m) => q.text === `Combien y a-t-il de jours en ${m} ?`);
    if (mois >= 0) {
      assert.notEqual(MOIS[mois], 'février', 'février : 28 ou 29 jours, pas de réponse unique');
      assert.equal(q.answer, new Date(2025, mois + 1, 0).getDate(), q.text);
    }
  }
  const attendu = {
    'Combien y a-t-il de jours dans une semaine ?': 7, 'Combien y a-t-il de mois dans une année ?': 12,
    'Combien y a-t-il de jours dans le week-end ?': 2, 'Combien y a-t-il de jours dans deux semaines ?': 14,
    'Combien y a-t-il de saisons dans une année ?': 4, 'Combien y a-t-il d’heures dans une journée ?': 24,
  };
  for (const q of tirages('calendrier', 4)) if (q.text in attendu) assert.equal(q.answer, attendu[q.text], q.text);
  for (const texte of Object.keys(attendu)) assert.ok(vus.has(texte), texte);
  assert.equal(vus.size, 17);
});

test('mesures niveau 5 : les mauvaises unités ne mesurent pas la même chose que la bonne', () => {
  const GRANDEUR = {
    'des centimètres': 'longueur', 'des mètres': 'longueur', 'des kilomètres': 'longueur',
    'des grammes': 'masse', 'des kilos': 'masse', 'des litres': 'contenance',
  };
  const vus = new Set();
  for (const q of tirages('mesures', 5)) {
    vus.add(q.text);
    const grandeur = GRANDEUR[q.answer];
    assert.ok(grandeur, q.answer);
    for (const c of q.choices) {
      assert.ok(GRANDEUR[c.value], c.value);
      if (c.value !== q.answer) assert.notEqual(GRANDEUR[c.value], grandeur, `${q.text} ${c.value}`);
    }
    // ce qu'on mesure dit la grandeur : le poids, l'eau, une longueur ou une distance
    if (/le poids/.test(q.text)) assert.equal(grandeur, 'masse', q.text);
    if (/l’eau/.test(q.text)) assert.equal(grandeur, 'contenance', q.text);
    if (/longueur|hauteur|distance/.test(q.text)) assert.equal(grandeur, 'longueur', q.text);
  }
  assert.ok(vus.size >= 16, `${vus.size} objets à mesurer`);
});

/** Toutes les issues de deux dés (un rouge, un bleu). */
const DEUX_DES = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1]);

test('données et hasard niveau 10 : les dénombrements sont justes', () => {
  const sommes = (s) => DEUX_DES.filter(([a, b]) => a + b === s).length;
  const plusFrequente = [...Array(11)].map((_, i) => i + 2).sort((a, b) => sommes(b) - sommes(a))[0];
  const attendu = {
    'On lance un dé rouge et un dé bleu. Combien y a-t-il d’issues possibles ?': String(DEUX_DES.length),
    'On lance un dé rouge et un dé bleu, et on ajoute les nombres. Combien de façons y a-t-il d’obtenir 3 ?': String(sommes(3)),
    'On lance deux dés et on ajoute les nombres. Combien de façons y a-t-il d’obtenir 12 ?': String(sommes(12)),
    'On lance deux dés et on ajoute les nombres. Quelle somme a le plus de chances de sortir ?': String(plusFrequente),
    'On lance une pièce puis un dé à six faces. Combien de chances y a-t-il d’obtenir pile et 6 ?': `1 chance sur ${2 * 6}`,
    'On lance deux pièces. Combien de chances y a-t-il d’obtenir au moins un face ?': '3 chances sur 4',
    'Au menu : 4 plats et 3 desserts. Combien de repas différents, avec un plat et un dessert, peut-on composer ?': String(4 * 3),
    'Tu as 2 casquettes et 4 écharpes. Combien de façons as-tu de mettre une casquette et une écharpe ?': String(2 * 4),
    'Il y a 3 chemins de la maison au parc, et 2 chemins du parc à l’école. Combien de trajets vont de la maison à l’école ?': String(3 * 2),
  };
  // deux pièces : pile-pile, pile-face, face-pile, face-face
  const pieces = ['PP', 'PF', 'FP', 'FF'];
  assert.equal(pieces.filter((p) => p.includes('F')).length, 3);
  const vus = new Set();
  for (const q of tirages('donnees-cm', 10)) {
    vus.add(q.text);
    if (q.text in attendu) assert.equal(q.answer, attendu[q.text], q.text);
    // le piège « on ajoute au lieu de multiplier » est parmi les choix des produits
    if (/menu : 4 plats|2 casquettes|3 chemins de la maison/.test(q.text)) assert.ok(q.choices.some((c) => ['7', '6', '5'].includes(c.value) && c.value !== q.answer), q.text);
  }
  for (const texte of Object.keys(attendu)) assert.ok(vus.has(texte), texte);
});

test('données et hasard niveaux 5 et 6 : le vocabulaire des chances est juste', () => {
  // la chance de l'événement, calculée à la main pour chaque situation ajoutée
  const CHANCE = {
    'On fait tourner une roue avec les nombres de 1 à 8. Obtenir 5, c’est…': 1 / 8,
    'On fait tourner une roue avec les nombres de 1 à 8. Obtenir un nombre plus petit que 9, c’est…': 1,
    'On lance un dé à six faces. Obtenir un nombre impair, c’est…': 3 / 6,
    'Dans un sac, il y a 3 billes vertes et 2 billes jaunes. Tirer une bille rouge, c’est…': 0,
    'On tire une carte dans un jeu qui n’a que des cœurs. Tirer un pique, c’est…': 0,
    'On lance une pièce. Tomber sur pile ou sur face, c’est…': 1,
    'Un sac contient 8 billes vertes et 2 billes jaunes. Tirer une bille jaune, c’est…': 2 / 10,
    'Une roue a 4 cases rouges et 4 cases bleues, de même taille. Tomber sur une case bleue, c’est…': 4 / 8,
    'Une roue a 1 case gagnante et 7 cases perdantes, de même taille. Gagner, c’est…': 1 / 8,
    'On lance un dé à six faces. Obtenir un nombre plus petit que 6, c’est…': 5 / 6,
    'Parmi 10 cartes retournées, 8 sont gagnantes. Tirer une carte gagnante, c’est…': 8 / 10,
    'Parmi 6 cartes retournées, 3 sont rouges et 3 sont noires. Tirer une carte noire, c’est…': 3 / 6,
  };
  const niveau5 = (p) => (p === 0 ? 'impossible' : p === 1 ? 'certain' : 'possible');
  const niveau6 = (p) => (p === 0.5 ? 'une chance sur deux' : p > 0.5 ? 'probable' : 'peu probable');
  const vus = new Set();
  for (const level of [5, 6]) {
    for (const q of tirages('donnees-cm', level)) {
      vus.add(q.text);
      if (q.text in CHANCE) assert.equal(q.answer, (level === 5 ? niveau5 : niveau6)(CHANCE[q.text]), q.text);
    }
  }
  assert.deepEqual(Object.keys(CHANCE).filter((t) => !vus.has(t)), [], 'situations ajoutées tirées');
  assert.ok(vus.has('Dans un sac, il y a des billes rouges et des billes bleues. Tirer une bille bleue, c’est…'));
});

test('géométrie niveau 6 : rayon, diamètre et position d’un point', () => {
  for (const q of tirages('geometrie-cm', 6)) {
    const rayonDiametre = q.text.match(/^Le rayon d’un cercle mesure (\d+) centimètres/);
    if (rayonDiametre) assert.equal(q.answer, `${2 * Number(rayonDiametre[1])} centimètres`, q.text);
    const diametre = q.text.match(/^Le diamètre d’un cercle mesure (\d+) centimètres/);
    if (diametre) assert.equal(q.answer, `${Number(diametre[1]) / 2} centimètres`, q.text);
    const point = q.text.match(/^Un point est à (\d+) centimètres du centre, sur un cercle de (\d+) centimètres de rayon/);
    if (point) {
      const [d, r] = [Number(point[1]), Number(point[2])];
      assert.equal(q.answer, d < r ? 'à l’intérieur du cercle' : d > r ? 'à l’extérieur du cercle' : 'sur le cercle', q.text);
    }
  }
});

test('formes niveaux 5 et 8 : devinettes distinctes ; le carré et le rectangle jamais ensemble pour « 4 côtés » ou « 4 pointes »', () => {
  for (const liste of [SHAPE_RIDDLES, SHAPE_RIDDLES_2]) {
    assert.equal(new Set(liste.map((r) => r.text)).size, liste.length);
    for (const r of liste) {
      const formes = [r.answer, ...r.others, ...(r.near ? [r.near] : [])];
      assert.equal(new Set(formes).size, formes.length, r.text);
      assert.ok(r.others.length >= (r.near ? 2 : 3), `${r.text} : assez de formes à proposer`);
    }
  }
  for (const level of [5, 8]) {
    for (const q of tirages('formes', level, 300)) {
      const valeurs = q.choices.map((c) => c.value);
      if (/4 côtés$|4 pointes$|plus de 3 pointes, mais moins de 5/.test(q.text.replace(/\.$/, ''))) {
        assert.ok(!(valeurs.includes('carré') && valeurs.includes('rectangle')), q.text);
      }
      if (q.text === 'Touche la forme qui a le moins de côtés.') assert.ok(!valeurs.includes('rond') && !valeurs.includes('cœur'), q.text);
    }
  }
});

test('fractions niveau 9 : des fractions unitaires du CE1, la plus grande part d’abord', () => {
  const CE1 = ['1/2', '1/3', '1/4', '1/5', '1/6', '1/8', '1/10'];
  const valeur = (f) => FRACTIONS[f].n / FRACTIONS[f].d;
  assert.equal(new Set(COMPARE_PAIRS.map((p) => p.join('-'))).size, COMPARE_PAIRS.length);
  for (const [grande, petite] of COMPARE_PAIRS) {
    assert.ok(CE1.includes(grande) && CE1.includes(petite), `${grande} ${petite}`);
    assert.ok(valeur(grande) > valeur(petite), `${grande} > ${petite}`);
  }
  for (const [f, { n, d, words, the }] of Object.entries(FRACTIONS)) {
    assert.equal(f, `${n}/${d}`);
    assert.ok(words && the, f);
  }
  // les parts comparées se voient : chaque fraction des paires est tirée, en mots et en dessins
  const vues = new Set();
  for (const q of tirages('fractions', 9)) for (const c of q.choices) vues.add(`${c.fraction ? 'dessin' : 'mot'}:${c.value}`);
  for (const f of new Set(COMPARE_PAIRS.flat())) assert.ok(vues.has(`dessin:${f}`) && vues.has(`mot:${f}`), f);
});

test('fractions niveaux 3 et 4 : assez de dessins différents à colorier pour une partie', () => {
  for (const [level, f, d] of [[3, '1/4', [4, 8, 12]], [4, '1/3', [3, 6, 9]]]) {
    const cles = new Set();
    for (const q of tirages('fractions', level)) {
      if (q.interaction !== 'shade') continue;
      cles.add(q.key);
      const parts = q.stage.sizes.length;
      assert.ok(d.includes(parts), `${q.key} : ${parts} parts`);
      assert.equal(q.target * FRACTIONS[f].d, parts, q.key);
      // la tablette n'a jamais plus de 9 carrés de large (sinon les parts sont trop étroites à toucher)
      if (q.stage.shape === 'bar') assert.ok(q.stage.sizes.reduce((a, b) => a + b, 0) <= 9, q.key);
    }
    // une partie de 10 questions colorie 5 fois : au moins 5 dessins différents
    assert.ok(cles.size >= 5, `niveau ${level} : ${cles.size} dessins à colorier`);
  }
});

test('ranger niveau 2 : au moins 15 objets différents à ranger', () => {
  const objets = new Set(tirages('ranger', 2).map((q) => q.items[0].emoji));
  assert.ok(objets.size >= 15, `${objets.size} objets`);
  for (const q of tirages('ranger', 2, 100)) {
    assert.equal(new Set(q.items.map((it) => it.emoji)).size, 1, 'un seul objet, en 4 tailles');
    assert.equal(new Set(q.items.map((it) => it.scale)).size, 4);
  }
});
