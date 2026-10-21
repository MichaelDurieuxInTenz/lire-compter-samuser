// Les outils « formes et fractions » (js/outils/formes.js) : la géométrie exacte du géoplan, les défis
// de chaque classe, et reussi / indice sur des cas précis. Les règles communes à tous les outils
// (consignes, solutions, indices connus) sont vérifiées par outils.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trouverOutil } from '../app/js/outils.js';
import { analyserFigure, sommets } from '../app/js/outils/formes.js';
import { DRAG_WORDS } from '../app/js/a11y-jeux.js';
import { createRng } from '../app/js/random.js';

const geoplan = trouverOutil('geoplan');
const blocs = trouverOutil('blocs-formes');
const fractions = trouverOutil('fractions');
const ardoise = trouverOutil('ardoise');
const FORMES = [geoplan, blocs, fractions, ardoise];

/** Les consignes tirées pour une classe (et les défis eux-mêmes). */
function tirages(outil, grade, n = 400, graine = 5) {
  const rng = createRng(graine);
  return Array.from({ length: n }, () => outil.defi(grade, rng));
}
const consignes = (outil, grade) => new Set(tirages(outil, grade).map((d) => d.consigne));

test('formes : quatre outils de la famille, des phrases à toucher (jamais glisser ni tracer)', () => {
  assert.deepEqual(FORMES.map((o) => o?.famille), ['formes', 'formes', 'formes', 'formes']);
  assert.deepEqual(ardoise.classes, ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2']);
  assert.deepEqual(fractions.classes, ['CE1', 'CE2', 'CM1', 'CM2']);
  for (const outil of FORMES) {
    const phrases = [outil.aide, ...outil.indices, ...outil.classes.flatMap((g) => [...consignes(outil, g)])];
    for (const p of phrases) {
      assert.doesNotMatch(p, DRAG_WORDS, `${outil.id} : « ${p} »`);
      assert.doesNotMatch(p, /\b(trace|glisse)/i, `${outil.id} : « ${p} »`);
      assert.doesNotMatch(p, / [?!:;]/, `${outil.id} : espace avant la ponctuation dans « ${p} »`);
      assert.match(p, /^\p{Lu}.*[.!?]$/u, `${outil.id} : « ${p} »`);
    }
    for (const indice of outil.indices) assert.match(indice, /^Pas encore\. /, `${outil.id} : « ${indice} »`);
  }
});

// ---------------------------------------------------------------- le géoplan : la géométrie

const figure = (...points) => analyserFigure(points);

test('géoplan : sommets sans clou répété ni point aligné', () => {
  assert.deepEqual(sommets([[0, 0], [1, 0], [2, 0], [2, 2], [2, 2], [0, 2]]), [[0, 0], [2, 0], [2, 2], [0, 2]]);
  // le premier clou répété à la fin, un point aligné sur le dernier côté
  assert.deepEqual(sommets([[0, 0], [3, 0], [0, 3], [0, 1], [0, 0]]).sort(), [[0, 0], [0, 3], [3, 0]]);
  assert.deepEqual(sommets([[0, 0], [1, 1], [3, 3]]), [], 'tout plat');
  assert.equal(figure([0, 0], [2, 0], [4, 0]), null);
});

test('géoplan : carrés, rectangles, losanges et triangles, droits ou penchés', () => {
  const carre = figure([0, 0], [2, 0], [2, 2], [0, 2]);
  assert.ok(carre.carre && carre.rectangle && carre.losange && carre.simple);
  assert.equal(carre.aire2, 8);
  assert.equal(carre.perimetre, 8);
  // carré penché de 2 carreaux : son périmètre (4 × √2) n'est pas entier
  const penche = figure([1, 0], [2, 1], [1, 2], [0, 1]);
  assert.ok(penche.carre);
  assert.equal(penche.aire2, 4);
  assert.equal(penche.perimetre, null);
  assert.equal(figure([1, 0], [3, 1], [2, 3], [0, 2]).aire2, 10, 'carré de 5 carreaux');
  // rectangle penché de 6 carreaux
  const rectangle = figure([0, 1], [1, 0], [4, 3], [3, 4]);
  assert.ok(rectangle.rectangle && !rectangle.carre);
  assert.equal(rectangle.aire2, 12);
  // losange qui n'est pas un carré, parallélogramme quelconque
  const losange = figure([0, 1], [2, 0], [4, 1], [2, 2]);
  assert.ok(losange.losange && !losange.rectangle);
  const para = figure([0, 0], [3, 0], [4, 2], [1, 2]);
  assert.ok(!para.losange && !para.rectangle && para.cotes === 4);
  // un clou au milieu d'un côté ne fait pas un sommet
  assert.ok(figure([0, 0], [1, 0], [2, 0], [2, 1], [0, 1]).rectangle);
  // triangles : rectangle penché (angle droit par produit scalaire), quelconque, 3-4-5
  assert.ok(figure([0, 0], [2, 1], [1, 3]).angleDroit);
  assert.ok(!figure([0, 0], [3, 0], [1, 2]).angleDroit);
  const t345 = figure([0, 0], [4, 0], [0, 3]);
  assert.deepEqual([t345.cotes, t345.perimetre, t345.aire2], [3, 12, 12]);
  // figure en creux (simple), élastique croisé, élastique qui repasse par un clou
  const creux = figure([0, 0], [2, 1], [4, 0], [4, 3], [0, 3]);
  assert.ok(creux.simple && creux.cotes === 5);
  assert.equal(figure([0, 0], [2, 2], [2, 0], [0, 2]).simple, false);
  assert.equal(figure([0, 0], [2, 0], [1, 1], [2, 2], [0, 2], [1, 1]).simple, false);
  // l'aire ne dépend pas du sens de l'élastique
  assert.equal(figure([0, 2], [2, 2], [2, 0], [0, 0]).aire2, 8);
});

// ---------------------------------------------------------------- le géoplan : défis

const fermes = (...figures) => ({ elastiques: figures.map((points) => ({ points, ferme: true })) });

test('géoplan : des défis par classe, sur une planche de 5 clous (6 à partir du CE2) où tient la solution', () => {
  assert.equal(geoplan.clous('GS'), 5);
  assert.equal(geoplan.clous('CE1'), 5);
  assert.equal(geoplan.clous('CE2'), 6);
  assert.equal(geoplan.clous('CM2'), 6);
  const attendues = {
    GS: ['Fais un carré.', 'Fais un triangle.', 'Fais un carré et un triangle.'],
    CP: ['Fais un triangle.', 'Fais un rectangle qui n’est pas un carré.', 'Fais 2 triangles.'],
    CE1: ['Fais un carré de 4 carreaux.', 'Fais un rectangle de 6 carreaux.', 'Fais une figure qui a 5 côtés.'],
    CE2: ['Fais un triangle rectangle.', 'Fais un carré de 25 carreaux.', 'Fais un losange qui n’est pas un carré.'],
    CM1: ['Fais un rectangle de 6 carreaux.', 'Fais une figure de périmètre 10.', 'Fais un losange qui n’est pas un carré.', 'Fais un triangle de 3 carreaux.'],
    CM2: ['Fais un carré de 2 carreaux.', 'Fais une figure de périmètre 20.', 'Fais un rectangle de 20 carreaux.'],
  };
  for (const grade of geoplan.classes) {
    const vues = consignes(geoplan, grade);
    for (const c of attendues[grade]) assert.ok(vues.has(c), `${grade} : « ${c} » jamais tiré`);
    const n = geoplan.clous(grade);
    for (const defi of tirages(geoplan, grade)) {
      const sol = geoplan.solution(defi);
      for (const { points } of sol.elastiques) {
        for (const [x, y] of points) assert.ok(x >= 0 && y >= 0 && x < n && y < n, `${grade} : « ${defi.consigne} » sort de la planche`);
      }
      // le vide ne répond jamais, et son indice dit de commencer
      assert.equal(geoplan.reussi(defi, geoplan.vide), false);
      assert.equal(geoplan.indice(defi, geoplan.vide), 'Pas encore. Touche des clous l’un après l’autre pour tendre un élastique.');
    }
  }
  // pas de carré de 25 carreaux avant le CE2 (la planche de 5 clous n'a que 4 carreaux de côté)
  assert.ok(![...consignes(geoplan, 'CE1')].includes('Fais un carré de 25 carreaux.'));
});

test('géoplan : réussi ou pas, et l’indice qui dit pourquoi', () => {
  const defi = (consigne) => {
    for (const grade of geoplan.classes) {
      const d = tirages(geoplan, grade, 600).find((x) => x.consigne === consigne);
      if (d) return d;
    }
    throw new Error(`défi introuvable : ${consigne}`);
  };
  const carre = defi('Fais un carré.');
  assert.ok(geoplan.reussi(carre, fermes([[1, 1], [3, 1], [3, 3], [1, 3]])));
  assert.ok(geoplan.reussi(carre, fermes([[1, 0], [2, 1], [1, 2], [0, 1]])), 'un carré penché est un carré');
  assert.ok(geoplan.reussi(carre, { elastiques: [{ points: [[0, 4], [4, 4]], ferme: false }, { points: [[0, 0], [1, 0], [1, 1], [0, 1]], ferme: true }] }),
    'un autre élastique, ouvert, ne gêne pas');
  assert.equal(geoplan.indice(carre, fermes([[0, 0], [3, 0], [3, 2], [0, 2]])), 'Pas encore. Les côtés doivent tous avoir la même longueur.');
  assert.equal(geoplan.indice(carre, fermes([[0, 1], [2, 0], [4, 1], [2, 2]])), 'Pas encore. Les 4 coins doivent être droits, comme les coins d’une feuille.');
  assert.equal(geoplan.indice(carre, fermes([[0, 0], [2, 0], [0, 2]])), 'Pas encore. Compte les côtés de ta figure.');
  assert.equal(geoplan.indice(carre, fermes([[0, 0], [2, 2], [2, 0], [0, 2]])), 'Pas encore. Ton élastique ne doit pas se croiser.');
  assert.equal(geoplan.indice(carre, fermes([[0, 0], [1, 1], [2, 2]])), 'Pas encore. Ton élastique est tout plat. Choisis des clous qui ne sont pas alignés.');
  // le bon carré, pas encore fermé
  const ouvert = { elastiques: [{ points: [[0, 0], [2, 0], [2, 2], [0, 2]], ferme: false }] };
  assert.equal(geoplan.reussi(carre, ouvert), false);
  assert.equal(geoplan.indice(carre, ouvert), 'Pas encore. Pour fermer l’élastique, retouche le premier clou.');

  const rectangle = defi('Fais un rectangle qui n’est pas un carré.');
  assert.ok(geoplan.reussi(rectangle, fermes([[0, 0], [3, 0], [3, 1], [0, 1]])));
  assert.equal(geoplan.reussi(rectangle, fermes([[0, 0], [2, 0], [2, 2], [0, 2]])), false);
  assert.equal(geoplan.indice(rectangle, fermes([[0, 0], [2, 0], [2, 2], [0, 2]])), 'Pas encore. Ta figure est un carré. Cherche une autre forme.');

  const triangleRectangle = defi('Fais un triangle rectangle.');
  assert.ok(geoplan.reussi(triangleRectangle, fermes([[0, 0], [2, 1], [1, 3]])));
  assert.equal(geoplan.indice(triangleRectangle, fermes([[0, 0], [3, 0], [1, 2]])), 'Pas encore. Un des coins doit être droit, comme le coin d’une feuille.');

  const aire4 = defi('Fais un carré de 4 carreaux.');
  assert.ok(geoplan.reussi(aire4, fermes([[2, 2], [4, 2], [4, 4], [2, 4]])));
  assert.equal(geoplan.indice(aire4, fermes([[0, 0], [3, 0], [3, 3], [0, 3]])), 'Pas encore. Compte les carreaux à l’intérieur de ta figure.');
  const aire2 = defi('Fais un carré de 2 carreaux.');
  assert.ok(geoplan.reussi(aire2, fermes([[1, 0], [2, 1], [1, 2], [0, 1]])));
  assert.equal(geoplan.reussi(aire2, fermes([[0, 0], [1, 0], [1, 1], [0, 1]])), false);
  const rect6 = defi('Fais un rectangle de 6 carreaux.');
  assert.ok(geoplan.reussi(rect6, fermes([[0, 0], [3, 0], [3, 2], [0, 2]])));
  assert.ok(geoplan.reussi(rect6, fermes([[0, 1], [1, 0], [4, 3], [3, 4]])), 'un rectangle penché de 6 carreaux');
  assert.equal(geoplan.reussi(rect6, fermes([[0, 0], [4, 0], [4, 2], [0, 2]])), false);
  const triangle3 = defi('Fais un triangle de 3 carreaux.');
  assert.ok(geoplan.reussi(triangle3, fermes([[0, 0], [3, 0], [1, 2]])));

  const perimetre = defi('Fais une figure de périmètre 10.');
  assert.ok(geoplan.reussi(perimetre, fermes([[0, 0], [3, 0], [3, 2], [0, 2]])));
  assert.ok(geoplan.reussi(perimetre, fermes([[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]])), 'une figure en L');
  assert.equal(geoplan.reussi(perimetre, fermes([[0, 0], [4, 0], [0, 3]])), false, 'périmètre 12');
  assert.equal(geoplan.reussi(perimetre, fermes([[1, 0], [3, 2], [2, 3], [0, 1]])), false, 'des côtés en biais : périmètre non entier');
  assert.equal(geoplan.indice(perimetre, fermes([[0, 0], [4, 0], [0, 3]])), 'Pas encore. Compte les côtés des carreaux tout autour de ta figure.');

  const cotes5 = defi('Fais une figure qui a 5 côtés.');
  assert.ok(geoplan.reussi(cotes5, fermes([[0, 0], [2, 1], [4, 0], [4, 3], [0, 3]])));
  assert.equal(geoplan.indice(cotes5, fermes([[0, 0], [1, 0], [2, 0], [2, 2], [0, 2]])), 'Pas encore. Compte les côtés de ta figure.', 'un clou aligné n’est pas un sommet');

  const losange = defi('Fais un losange qui n’est pas un carré.');
  assert.ok(geoplan.reussi(losange, fermes([[1, 0], [2, 2], [1, 4], [0, 2]])));
  assert.equal(geoplan.indice(losange, fermes([[0, 0], [2, 0], [2, 2], [0, 2]])), 'Pas encore. Ta figure est un carré. Cherche une autre forme.');

  // deux figures : il faut un élastique pour chacune
  const deux = defi('Fais un carré et un triangle.');
  const sq = [[0, 0], [2, 0], [2, 2], [0, 2]];
  const tri = [[3, 0], [4, 0], [4, 2]];
  assert.ok(geoplan.reussi(deux, fermes(sq, tri)));
  assert.ok(geoplan.reussi(deux, fermes(tri, sq)), 'dans n’importe quel ordre');
  assert.equal(geoplan.indice(deux, fermes(sq)), 'Pas encore. Il faut un élastique fermé pour chaque figure.');
  assert.equal(geoplan.reussi(deux, fermes(sq, sq.map(([x, y]) => [x + 2, y + 2]))), false);
  assert.equal(geoplan.indice(deux, fermes(sq, sq.map(([x, y]) => [x + 2, y + 2]))), 'Pas encore. Compte les côtés de ta figure.');
  const deuxTriangles = defi('Fais 2 triangles.');
  assert.equal(geoplan.reussi(deuxTriangles, fermes(tri)), false, 'un seul triangle ne compte pas deux fois');
  assert.ok(geoplan.reussi(deuxTriangles, fermes(tri, [[0, 0], [1, 0], [0, 1]])));
});

// ---------------------------------------------------------------- les blocs de formes

test('blocs de formes : des blocs à compter, des constructions libres, selon la classe', () => {
  const ps = tirages(blocs, 'PS');
  for (const d of ps.filter((x) => !x.libre)) {
    assert.ok(Object.keys(d.blocs).every((s) => ['carre', 'triangle', 'hexagone'].includes(s)), d.consigne);
    assert.ok(Object.values(d.blocs).every((n) => n >= 1 && n <= 3), d.consigne);
  }
  assert.ok(consignes(blocs, 'PS').has('Pose 3 triangles verts.'));
  assert.ok(consignes(blocs, 'PS').has('Pose 2 carrés orange.'));
  assert.ok(consignes(blocs, 'PS').has('Construis une maison avec un carré et un triangle.'));
  assert.ok(consignes(blocs, 'MS').has('Pose 1 losange bleu.'));
  assert.ok(consignes(blocs, 'GS').has('Fais une fleur avec un hexagone et des losanges.'));
  // au CP, les couleurs ne sont plus dites avec plusieurs sortes (« Pose 2 hexagones et 1 carré. »)
  const plusieurs = [...consignes(blocs, 'CP')].filter((c) => c.includes(' et '));
  assert.ok(plusieurs.length && plusieurs.every((c) => !/jaune|rouge|bleu|vert|orange/.test(c)), plusieurs.join(' / '));
  assert.ok([...consignes(blocs, 'CP')].some((c) => /^Pose \d \p{L}+, \d \p{L}+ et \d \p{L}+\.$/u.test(c)), 'trois sortes');
  assert.ok(consignes(blocs, 'CE1').has('Pose 1 hexagone, puis autant de triangles qu’il en faut pour le recouvrir.'));
  for (const grade of blocs.classes) {
    const ds = tirages(blocs, grade);
    assert.ok(ds.some((d) => d.libre) && ds.some((d) => !d.libre), `${grade} : des défis libres et comptés`);
  }
});

test('blocs de formes : chaque sorte comptée, rien de plus', () => {
  const trois = { blocs: { triangle: 3 } };
  const etat = (blocsPoses) => ({ ...blocs.vide, ...blocsPoses });
  assert.ok(blocs.reussi(trois, etat({ triangle: 3 })));
  assert.equal(blocs.reussi(trois, etat({ triangle: 2 })), false);
  assert.equal(blocs.indice(trois, etat({ triangle: 2 })), 'Pas encore. Compte bien les triangles.');
  assert.equal(blocs.reussi(trois, etat({ triangle: 3, carre: 1 })), false);
  assert.equal(blocs.indice(trois, etat({ triangle: 3, carre: 1 })), 'Pas encore. Enlève les blocs qui ne sont pas demandés.');
  const deux = { blocs: { hexagone: 2, carre: 1 } };
  assert.ok(blocs.reussi(deux, etat({ hexagone: 2, carre: 1 })));
  assert.equal(blocs.indice(deux, etat({ hexagone: 2 })), 'Pas encore. Compte bien les carrés.');
  const recouvrir = { blocs: { hexagone: 1, triangle: 6 }, recouvrir: true };
  assert.ok(blocs.reussi(recouvrir, etat({ hexagone: 1, triangle: 6 })));
  assert.equal(blocs.indice(recouvrir, etat({ hexagone: 1, triangle: 4 })), 'Pas encore. Pose les petits blocs sur le grand pour les compter.');
  assert.equal(blocs.indice(recouvrir, etat({ triangle: 6 })), 'Pas encore. Compte bien les hexagones.');
});

// ---------------------------------------------------------------- les réglettes de fractions

test('réglettes : les réglettes de chaque classe, et des fractions en toutes lettres', () => {
  assert.deepEqual(fractions.reglettes('CE1'), ['unite', 'demis', 'quarts']);
  assert.deepEqual(fractions.reglettes('CE2'), ['unite', 'demis', 'tiers', 'quarts', 'huitiemes']);
  assert.equal(fractions.reglettes('CM1').length, 8);
  const attendues = {
    CE1: ['Colorie un demi de la réglette coupée en demis.', 'Colorie trois quarts.', 'Colorie la moitié de la réglette des quarts.'],
    CE2: ['Colorie deux tiers.', 'Colorie cinq huitièmes.', 'Colorie un quart de la réglette des huitièmes.'],
    CM1: ['Colorie une fraction égale à un demi dans la réglette des sixièmes.', 'Colorie trois cinquièmes.'],
    CM2: ['Colorie sept dixièmes.', 'Colorie une fraction égale à trois quarts dans la réglette des huitièmes.'],
  };
  const parts = { unite: 1, demis: 2, tiers: 3, quarts: 4, cinquiemes: 5, sixiemes: 6, huitiemes: 8, dixiemes: 10 };
  for (const grade of fractions.classes) {
    const vues = consignes(fractions, grade);
    for (const c of attendues[grade]) assert.ok(vues.has(c), `${grade} : « ${c} » jamais tiré`);
    for (const c of vues) assert.doesNotMatch(c, /\d/, `${grade} : « ${c} » (fractions en toutes lettres)`);
    for (const d of tirages(fractions, grade)) {
      assert.ok(fractions.reglettes(grade).includes(d.reglette), `${grade} : « ${d.consigne} » sur une réglette absente`);
      assert.ok(Number.isInteger(d.n) && d.n >= 1 && d.n <= parts[d.reglette], d.consigne);
    }
  }
});

test('réglettes : le bon nombre de morceaux de la bonne réglette', () => {
  const etat = (colories) => ({ ...fractions.vide, ...colories });
  const troisQuarts = { reglette: 'quarts', n: 3 };
  assert.ok(fractions.reussi(troisQuarts, etat({ quarts: 3 })));
  assert.ok(fractions.reussi(troisQuarts, etat({ quarts: 3, demis: 1 })), 'les autres réglettes ne comptent pas');
  assert.equal(fractions.indice(troisQuarts, etat({ quarts: 4 })), 'Pas encore. Tu as colorié trop de morceaux.');
  assert.equal(fractions.indice(troisQuarts, etat({ quarts: 2 })), 'Pas encore. Il manque des morceaux.');
  assert.equal(fractions.indice(troisQuarts, etat({ huitiemes: 6 })), 'Pas encore. Regarde bien dans quelle réglette tu colories.');
  assert.equal(fractions.indice(troisQuarts, fractions.vide), 'Pas encore. Touche les morceaux d’une réglette pour les colorier.');
  const demiEnSixiemes = tirages(fractions, 'CM1', 600).find((d) => d.consigne === 'Colorie une fraction égale à un demi dans la réglette des sixièmes.');
  assert.deepEqual([demiEnSixiemes.reglette, demiEnSixiemes.n], ['sixiemes', 3]);
  assert.ok(fractions.reussi(demiEnSixiemes, etat({ sixiemes: 3 })));
  assert.equal(fractions.reussi(demiEnSixiemes, etat({ demis: 1 })), false);
  assert.equal(fractions.indice(demiEnSixiemes, etat({ sixiemes: 2 })), 'Pas encore. Compare la longueur coloriée avec les autres réglettes.');
  const sept = tirages(fractions, 'CM2', 600).find((d) => d.consigne === 'Colorie sept dixièmes.');
  assert.ok(fractions.reussi(sept, etat({ dixiemes: 7 })));
});

// ---------------------------------------------------------------- l'ardoise

test('ardoise : des défis libres dans chaque classe', () => {
  for (const grade of ardoise.classes) {
    const ds = tirages(ardoise, grade);
    assert.ok(ds.every((d) => d.libre), grade);
    assert.ok(new Set(ds.map((d) => d.consigne)).size >= 4, grade);
  }
  assert.ok(consignes(ardoise, 'PS').has('Dessine un rond.'));
  assert.ok(consignes(ardoise, 'GS').has('Écris ton prénom.'));
  assert.ok(consignes(ardoise, 'CP').has('Écris le nombre 12.'));
  assert.ok(consignes(ardoise, 'CE1').has('Dessine un carré et un triangle.'));
  assert.deepEqual(ardoise.vide, { traits: 0 });
});
