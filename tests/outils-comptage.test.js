// Les outils pour compter (app/js/outils/comptage.js) : jetons bicolores, tableau de cent, dés et
// roue. Les tests communs à tous les outils sont dans outils.test.js ; ici, les défis de chaque
// classe et des cas précis de reussi et indice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trouverOutil } from '../app/js/outils.js';
import { createRng } from '../app/js/random.js';

/** Les défis tirés pour une classe (300 tirages). */
function defis(outil, grade, n = 300) {
  const rng = createRng(11);
  return Array.from({ length: n }, () => outil.defi(grade, rng));
}

test('les jetons : 5 au plus en MS, 10 en GS, 20 ensuite ; des décompositions au CP, doubles et moitiés au CE1', () => {
  const jetons = trouverOutil('jetons');
  const max = { MS: 5, GS: 10, CP: 20, CE1: 20 };
  for (const grade of jetons.classes) {
    for (const d of defis(jetons, grade)) {
      const total = d.rouge + d.jaune;
      assert.ok(total >= 1 && total <= max[grade] && total <= jetons.max, `${grade} : « ${d.consigne} »`);
      assert.ok(Number.isInteger(d.rouge) && Number.isInteger(d.jaune) && d.rouge >= 0 && d.jaune >= 0);
    }
  }
  assert.equal(jetons.defi('PS', createRng(1)), null);
  // le CP décompose 10 ; le CE1 pose des doubles et des moitiés
  const cp = defis(jetons, 'CP').map((d) => d.consigne);
  assert.ok(cp.some((c) => /^Pose 10 jetons, dont \d jaunes?\.$/.test(c)), 'CP : « Pose 10 jetons, dont 3 jaunes. »');
  const ce1 = defis(jetons, 'CE1');
  for (const d of ce1) {
    if (['autant', 'moitie'].includes(d.type)) assert.equal(d.rouge, d.jaune, d.consigne);
    if (d.type === 'double') assert.equal(d.jaune, 2 * d.rouge, d.consigne);
    if (d.type === 'ecart') assert.ok(d.rouge > d.jaune, d.consigne);
  }
  assert.ok(ce1.some((d) => /^Pose \d+ jetons rouges et autant de jaunes\.$/.test(d.consigne)));
  assert.ok(ce1.some((d) => /^Pose \d+ jetons, moitié rouges et moitié jaunes\.$/.test(d.consigne)));
  // accords : « 1 jeton rouge », « 1 jaune »
  for (const grade of jetons.classes) {
    for (const d of defis(jetons, grade)) assert.ok(!/\b1 (jetons|rouges|jaunes)\b/.test(d.consigne), d.consigne);
  }
});

test('les jetons : réussi quand il y a juste ce qu’il faut de chaque couleur ; les indices', () => {
  const jetons = trouverOutil('jetons');
  const etat = (rouge, jaune) => ({ rouge, jaune, total: rouge + jaune });
  const dont = { type: 'dont', rouge: 7, jaune: 3, consigne: 'Pose 10 jetons, dont 3 jaunes.' };
  assert.ok(jetons.reussi(dont, etat(7, 3)));
  assert.ok(!jetons.reussi(dont, etat(3, 7)));
  assert.equal(jetons.indice(dont, etat(7, 2)), 'Pas encore. Compte tous les jetons.');
  assert.equal(jetons.indice(dont, etat(6, 4)), 'Pas encore. Compte les jetons rouges.');
  const couleur = { type: 'couleur', rouge: 4, jaune: 0 };
  assert.ok(jetons.reussi(couleur, etat(4, 0)));
  assert.ok(!jetons.reussi(couleur, etat(4, 1)));
  assert.equal(jetons.indice(couleur, etat(4, 1)), 'Pas encore. Regarde bien la couleur des jetons.');
  assert.equal(jetons.indice(couleur, etat(3, 0)), 'Pas encore. Compte les jetons rouges.');
  const moitie = { type: 'moitie', rouge: 7, jaune: 7 };
  assert.equal(jetons.indice(moitie, etat(8, 6)), 'Pas encore. Il faut autant de jetons rouges que de jetons jaunes.');
  assert.equal(jetons.indice(moitie, etat(6, 6)), 'Pas encore. Compte tous les jetons.');
  const double = { type: 'double', rouge: 4, jaune: 8 };
  assert.ok(jetons.reussi(double, etat(4, 8)));
  assert.equal(jetons.indice(double, etat(4, 6)), 'Pas encore. Pour le double, compte 2 fois les jetons rouges.');
  const ecart = { type: 'ecart', rouge: 9, jaune: 6 };
  assert.equal(jetons.indice(ecart, etat(8, 7)), 'Pas encore. Compte combien il y a de jetons rouges de plus que de jetons jaunes.');
});

test('le tableau de cent : des nombres de 1 à 100, jusqu’à 30 en GS ; les défis de chaque classe', () => {
  const cent = trouverOutil('tableau-cent');
  for (const grade of cent.classes) {
    for (const d of defis(cent, grade)) {
      assert.ok(d.nombres.length >= 1, d.consigne);
      assert.equal(new Set(d.nombres).size, d.nombres.length, `${d.consigne} : en double`);
      for (const n of d.nombres) assert.ok(Number.isInteger(n) && n >= 1 && n <= (grade === 'GS' ? 30 : 100), `${grade} : « ${d.consigne} » (${n})`);
    }
  }
  assert.equal(cent.defi('PS', createRng(1)), null);
  const consignes = (grade) => new Set(defis(cent, grade, 600).map((d) => d.consigne));
  assert.ok(consignes('CP').has('Colorie les nombres de 10 en 10, de 10 jusqu’à 100.'));
  assert.ok(consignes('CP').has('Colorie le nombre qui vient juste après 39.'));
  assert.ok(consignes('CE1').has('Colorie les nombres de 2 en 2, de 2 jusqu’à 20.'));
  assert.ok(consignes('CE2').has('Colorie les nombres de 5 en 5, de 5 jusqu’à 50.'));
  assert.ok(consignes('CE2').has('Colorie les multiples de 9 jusqu’à 90.'));
  // les nombres attendus, sur des consignes précises
  const trouve = (grade, consigne) => defis(cent, grade, 2000).find((d) => d.consigne === consigne);
  assert.deepEqual(trouve('CP', 'Colorie le nombre qui vient juste après 39.').nombres, [40]);
  assert.deepEqual(trouve('CP', 'Colorie tous les nombres qui finissent par 5.').nombres, [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
  assert.deepEqual(trouve('CP', 'Colorie tous les nombres qui finissent par 0.').nombres, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.deepEqual(trouve('CE2', 'Colorie les multiples de 9 jusqu’à 90.').nombres, [9, 18, 27, 36, 45, 54, 63, 72, 81, 90]);
  const diz = defis(cent, 'CE2', 2000).find((d) => d.type === 'dizaines');
  const [, dz, u] = diz.consigne.match(/(\d) dizaines? et (\d) unités?/);
  assert.deepEqual(diz.nombres, [10 * Number(dz) + Number(u)]);
});

test('le tableau de cent : réussi quand les cases coloriées sont exactement les bonnes, quelle que soit leur couleur', () => {
  const cent = trouverOutil('tableau-cent');
  const pas2 = { type: 'pas', nombres: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] };
  assert.ok(cent.reussi(pas2, { colories: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] }));
  assert.ok(!cent.reussi(pas2, { colories: [2, 4, 6, 8, 10, 12, 14, 16, 18] }));
  assert.ok(!cent.reussi(pas2, { colories: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] }));
  assert.equal(cent.indice(pas2, { colories: [] }), 'Pas encore. Touche une case pour la colorier.');
  assert.equal(cent.indice(pas2, { colories: [2, 4, 6] }), 'Pas encore. Il manque des nombres.');
  assert.equal(cent.indice(pas2, { colories: [2, 3, 4] }), 'Pas encore. Certains nombres coloriés ne vont pas.');
  const apres = { type: 'apres', nombres: [40] };
  assert.ok(cent.reussi(apres, { colories: [40], couleurs: { 40: 'bleu' } }));
  assert.equal(cent.indice(apres, { colories: [38] }), 'Pas encore. Le nombre qui vient juste après, c’est 1 de plus.');
  assert.equal(cent.indice(apres, { colories: [40, 41] }), 'Pas encore. Il faut colorier un seul nombre.');
  assert.equal(cent.indice({ type: 'plus', nombres: [56] }, { colories: [47] }), 'Pas encore. 10 de plus, c’est 1 dizaine de plus.');
});

test('les dés et la roue : un dé en maternelle, 2 au GS et au CP, 3 au CE ; la roue au CM', () => {
  const des = trouverOutil('des');
  const nbDes = { PS: [1], MS: [1], GS: [2], CP: [2], CE1: [3], CE2: [3] };
  for (const grade of des.classes) {
    const tous = defis(des, grade);
    for (const d of tous) {
      if (d.type === 'des') {
        assert.ok(nbDes[grade]?.includes(d.des), `${grade} : « ${d.consigne} »`);
        // chaque défi est possible avec ses dés
        if (['somme', 'plus', 'moins'].includes(d.cond)) {
          const { valeur: v } = d;
          assert.ok(d.cond === 'somme' ? v >= d.des && v <= 6 * d.des : d.cond === 'plus' ? v < 6 * d.des : v > d.des, d.consigne);
        }
        if (d.cond === 'face') assert.ok(d.valeur <= (grade === 'PS' ? 3 : 6), d.consigne);
      } else {
        assert.ok(d.secteurs >= 2 && d.secteurs <= 8, d.consigne);
        for (const c of d.couleurs || []) assert.ok(des.couleurs.slice(0, d.secteurs).includes(c), `${d.consigne} : ${c} n’est pas sur la roue`);
        // le nombre de secteurs est dit quand il est vérifié
        assert.equal(d.compte, d.consigne.includes(`de ${d.secteurs} secteurs`), d.consigne);
      }
    }
    if (['CM1', 'CM2'].includes(grade)) assert.ok(tous.every((d) => d.type === 'roue' && d.compte));
  }
  const cp = new Set(defis(des, 'CP').map((d) => d.consigne));
  assert.ok(cp.has('Lance 2 dés jusqu’à faire 10 en tout.'));
  assert.ok(new Set(defis(des, 'CE1').map((d) => d.consigne)).has('Lance 3 dés jusqu’à faire plus de 15 en tout.'));
  assert.ok(new Set(defis(des, 'GS').map((d) => d.consigne)).has('Lance 2 dés jusqu’à faire un double.'));
});

test('les dés et la roue : le dernier lancer compte, avec le bon nombre de dés ; les indices', () => {
  const des = trouverOutil('des');
  const lancer = (faces, nbDes = faces.length) => ({ mode: 'des', nbDes, des: faces, secteurs: 6, tirages: [] });
  const six = { type: 'des', des: 1, cond: 'face', valeur: 6 };
  assert.ok(des.reussi(six, lancer([6])));
  assert.ok(!des.reussi(six, lancer([5])));
  assert.ok(!des.reussi(six, lancer([6, 2])), 'un 6 avec deux dés ne compte pas');
  assert.equal(des.indice(six, lancer([6, 2])), 'Pas encore. Regarde combien de dés il faut lancer.');
  assert.equal(des.indice(six, lancer([], 1)), 'Pas encore. Lance le dé.');
  assert.equal(des.indice(six, lancer([3])), 'Pas encore. Compte les points du dé, puis relance-le.');
  const dix = { type: 'des', des: 2, cond: 'somme', valeur: 10 };
  assert.ok(des.reussi(dix, lancer([4, 6])));
  assert.ok(!des.reussi(dix, lancer([4, 5])));
  assert.equal(des.indice(dix, { ...lancer([4, 6]), mode: 'roue' }), 'Pas encore. Choisis les dés.');
  const double = { type: 'des', des: 2, cond: 'double' };
  assert.ok(des.reussi(double, lancer([3, 3])));
  assert.equal(des.indice(double, lancer([3, 4])), 'Pas encore. Pour un double, les 2 dés montrent le même nombre. Relance-les.');
  const plus15 = { type: 'des', des: 3, cond: 'plus', valeur: 15 };
  assert.ok(des.reussi(plus15, lancer([6, 6, 4])));
  assert.ok(!des.reussi(plus15, lancer([5, 5, 5])), '15 n’est pas plus de 15');
  // la roue
  const tour = (tirages, secteurs = 6) => ({ mode: 'roue', nbDes: 2, des: [], secteurs, tirages });
  const bleu = { type: 'roue', secteurs: 6, compte: true, cond: 'couleur', couleurs: ['bleu'] };
  assert.ok(des.reussi(bleu, tour(['rouge', 'bleu'])));
  assert.ok(!des.reussi(bleu, tour(['bleu', 'rouge'])), 'seul le dernier tour compte');
  assert.ok(!des.reussi(bleu, tour(['bleu'], 4)), 'pas avec une autre roue');
  assert.equal(des.indice(bleu, tour(['bleu'], 4)), 'Pas encore. Compte les secteurs de la roue.');
  assert.equal(des.indice(bleu, tour([])), 'Pas encore. Fais tourner la roue.');
  assert.equal(des.indice(bleu, lancer([2])), 'Pas encore. Choisis la roue.');
  // en maternelle, le nombre de secteurs n'est pas dit : il ne compte pas
  assert.ok(des.reussi({ type: 'roue', secteurs: 4, compte: false, cond: 'couleur', couleurs: ['rouge'] }, tour(['rouge'], 6)));
  const suite = { type: 'roue', secteurs: 4, compte: true, cond: 'suite', couleurs: null };
  assert.ok(des.reussi(suite, tour(['vert', 'jaune', 'jaune'], 4)));
  assert.ok(!des.reussi(suite, tour(['jaune', 'vert', 'jaune'], 4)));
  assert.equal(des.indice(suite, tour(['jaune'], 4)), 'Pas encore. Il faut tomber 2 fois de suite sur le même secteur.');
  // rien lancé : aucun défi n'est réussi
  for (const grade of des.classes) for (const d of defis(des, grade, 50)) assert.ok(!des.reussi(d, des.vide));
});
