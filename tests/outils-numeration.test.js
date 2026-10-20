import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balance, baseDix, droiteNumerique } from '../app/js/outils/numeration.js';
import { createRng } from '../app/js/random.js';

/** Les défis d'un outil pour une classe (300 tirages). */
function defis(outil, grade, n = 300) {
  const rng = createRng(11);
  return Array.from({ length: n }, () => outil.defi(grade, rng));
}

const VALEURS = { milliers: 1000, centaines: 100, dizaines: 10, unites: 1 };
const blocs = (e) => ({ milliers: 0, centaines: 0, dizaines: 0, unites: 0, ...e });
const valeur = (e) => Object.entries(VALEURS).reduce((s, [k, v]) => s + (e[k] || 0) * v, 0);

// ---------------------------------------------------------------- Les blocs de base dix

test('blocs de base dix : les blocs de chaque classe, des nombres à sa mesure', () => {
  assert.deepEqual(baseDix.blocs('CP').map((b) => b.cle), ['dizaines', 'unites']);
  assert.deepEqual(baseDix.blocs('CE1').map((b) => b.cle), ['centaines', 'dizaines', 'unites']);
  assert.deepEqual(baseDix.blocs('CM2').map((b) => b.cle), ['milliers', 'centaines', 'dizaines', 'unites']);
  const max = { CP: 99, CE1: 999, CE2: 9999, CM1: 9999, CM2: 9999 };
  const plafonds = { milliers: 9, centaines: 19, dizaines: 19, unites: 19 };
  for (const grade of baseDix.classes) {
    const cles = baseDix.blocs(grade).map((b) => b.cle);
    for (const defi of defis(baseDix, grade)) {
      assert.ok(defi.n >= 1 && defi.n <= max[grade], `${grade} : « ${defi.consigne} »`);
      const sol = baseDix.solution(defi);
      assert.equal(valeur(sol), defi.n);
      // la solution se fait avec les blocs de la classe, sans dépasser les plafonds de l'outil
      for (const [k, plafond] of Object.entries(plafonds)) {
        assert.ok(sol[k] <= plafond && sol[k] >= 0, `${grade} : « ${defi.consigne} » demande ${sol[k]} ${k}`);
        if (!cles.includes(k)) assert.equal(sol[k], 0, `${grade} : pas de ${k}`);
      }
      // « avec 14 dizaines » : il faut casser ou grouper (sinon le défi ne serait qu'un « montre »)
      if (defi.type === 'avec') assert.notEqual(defi.nb, [Math.floor(defi.n / 1000), Math.floor(defi.n / 100) % 10, Math.floor(defi.n / 10) % 10, defi.n % 10][['milliers', 'centaines', 'dizaines', 'unites'].indexOf(defi.cle)]);
      // les grands nombres : l'espace fine à l'écran, et ce que dit la voix (« 4 mille 725 »)
      if (defi.n >= 1000) {
        assert.match(defi.consigne, /\d \d{3}/, defi.consigne);
        assert.ok(defi.dit && !/\d[  ]\d{3}\b/.test(defi.dit) && /mille/.test(defi.dit), `${defi.consigne} → ${defi.dit}`);
      } else assert.equal(defi.dit, undefined);
    }
  }
});

test('blocs de base dix : les défis de chaque classe', () => {
  const consignes = (grade) => new Set(defis(baseDix, grade, 400).map((d) => d.consigne.replace(/[\d ]+/g, 'N')));
  assert.deepEqual([...consignes('CP')].sort(), [
    'Montre N avec des dizaines et des unités.', 'Montre N avec le moins de blocs possible.',
    'Montre N avec seulement N dizaine.', 'Montre N avec seulement N dizaines.', 'Montre N avec seulement des unités.',
  ]);
  assert.ok(consignes('CE1').has('Montre N sans centaine.'));
  assert.ok(consignes('CE1').has('Montre N avec N dizaines.'));
  assert.ok(consignes('CE2').has('Montre N sans millier.'));
  assert.ok(consignes('CM1').has('Montre N avec N centaines.'));
  // CM : « Montre 1 305 avec 12 centaines » demande deux échanges (un millier, puis une centaine)
  const defi = { type: 'avec', n: 1305, cle: 'centaines', nb: 12, blocs: ['milliers', 'centaines', 'dizaines', 'unites'] };
  assert.deepEqual(baseDix.solution(defi), { milliers: 0, centaines: 12, dizaines: 10, unites: 5, valeur: 1305 });
  assert.ok(defis(baseDix, 'CM2', 400).some((d) => d.type === 'avec' && d.cle === 'dizaines' && Math.floor(d.n / 100) % 10 === 0));
});

test('blocs de base dix : vérifier et aider', () => {
  const quatreDizaines = { type: 'avec', n: 52, cle: 'dizaines', nb: 4, blocs: ['dizaines', 'unites'] };
  assert.ok(baseDix.reussi(quatreDizaines, blocs({ dizaines: 4, unites: 12 })));
  assert.ok(!baseDix.reussi(quatreDizaines, blocs({ dizaines: 5, unites: 2 })));
  assert.equal(baseDix.indice(quatreDizaines, blocs({ dizaines: 5, unites: 2 })), 'Pas encore. Compte bien les dizaines.');
  assert.equal(baseDix.indice(quatreDizaines, blocs({ dizaines: 4, unites: 2 })), 'Pas encore. Ton nombre est trop petit.');
  assert.equal(baseDix.indice(quatreDizaines, blocs({ dizaines: 6 })), 'Pas encore. Ton nombre est trop grand.');
  // le moins de blocs possible : 44, pas 3 dizaines et 14 unités
  const moins = { type: 'moins', n: 44 };
  assert.ok(baseDix.reussi(moins, blocs({ dizaines: 4, unites: 4 })));
  assert.ok(!baseDix.reussi(moins, blocs({ dizaines: 3, unites: 14 })));
  assert.equal(baseDix.indice(moins, blocs({ dizaines: 3, unites: 14 })), 'Pas encore. Tu peux grouper des blocs par 10.');
  // sans centaine : 135 = 13 dizaines et 5 unités (ou 12 dizaines et 15 unités)
  const sans = { type: 'avec', n: 135, cle: 'centaines', nb: 0, blocs: ['centaines', 'dizaines', 'unites'] };
  assert.ok(baseDix.reussi(sans, blocs({ dizaines: 12, unites: 15 })));
  assert.equal(baseDix.indice(sans, blocs({ centaines: 1, dizaines: 3, unites: 5 })), 'Pas encore. Casse les centaines en dizaines.');
  // montrer un nombre : n'importe quelle écriture
  assert.ok(baseDix.reussi({ type: 'montre', n: 245 }, blocs({ centaines: 1, dizaines: 14, unites: 5 })));
});

// ---------------------------------------------------------------- La droite numérique

test('droite numérique : une droite par classe, des défis sur la droite', () => {
  const longueur = (grade) => droiteNumerique.droites(grade).map((l) => [l.id, l.total, l.valeur(l.total)]);
  assert.deepEqual(longueur('GS'), [['entiers', 10, 10]]);
  assert.deepEqual(longueur('CP'), [['entiers', 20, 20]]);
  assert.deepEqual(longueur('CE1'), [['entiers', 100, 100]]);
  assert.deepEqual(longueur('CE2'), [['dizaines', 100, 1000]]);
  assert.deepEqual(longueur('CM1'), [['dixiemes', 10, 1], ['quarts', 8, 2]]);
  assert.deepEqual(longueur('CM2'), [['dixiemes', 20, 2], ['quarts', 8, 2]]);
  for (const grade of droiteNumerique.classes) {
    const lignes = droiteNumerique.droites(grade);
    for (const defi of defis(droiteNumerique, grade)) {
      const l = lignes.find((x) => x.id === defi.ligne);
      assert.ok(l, `${grade} : ${defi.ligne}`);
      assert.ok(defi.but >= 0 && defi.but <= l.total, `${grade} : « ${defi.consigne} »`);
      assert.equal(defi.cible, l.valeur(defi.but));
      if (defi.type !== 'place') {
        assert.ok(defi.depart >= 0 && defi.depart <= l.total && defi.depart !== defi.but);
        assert.equal(Math.sign(defi.but - defi.depart), defi.type === 'avance' ? 1 : -1);
      }
      // fractions en lettres, décimaux à virgule
      assert.ok(!/\d\/\d|\d\.\d/.test(defi.consigne), defi.consigne);
    }
  }
  const tous = (grade) => new Set(defis(droiteNumerique, grade).map((d) => d.consigne));
  assert.ok(tous('GS').has('Place la grenouille sur 7.'));
  assert.ok(tous('CM1').has('Place la grenouille sur trois quarts.'));
  assert.ok(tous('CM1').has('Place la grenouille sur 0,7.'));
  assert.ok([...tous('CM2')].some((c) => /^Place la grenouille sur 1,\d\.$/.test(c)));
});

test('droite numérique : vérifier et aider', () => {
  const bond = { type: 'avance', ligne: 'entiers', depart: 3, but: 7, cible: 7 };
  assert.ok(droiteNumerique.reussi(bond, { valeur: 7 }));
  assert.ok(!droiteNumerique.reussi(bond, { valeur: 3 }));
  assert.equal(droiteNumerique.indice(bond, { valeur: 3 }), 'Pas encore. La grenouille doit aller plus loin.');
  assert.equal(droiteNumerique.indice(bond, { valeur: 9 }), 'Pas encore. La grenouille est allée trop loin.');
  assert.equal(droiteNumerique.indice(bond, { valeur: null }), 'Pas encore. Touche une graduation pour poser la grenouille.');
  const recule = { type: 'recule', ligne: 'entiers', depart: 8, but: 5, cible: 5 };
  assert.equal(droiteNumerique.indice(recule, { valeur: 6 }), 'Pas encore. La grenouille doit reculer encore.');
  assert.equal(droiteNumerique.indice(recule, { valeur: 2 }), 'Pas encore. La grenouille a trop reculé.');
  // 0,6 + 0,3 : la grenouille est sur la graduation 9 (9 / 10), pas sur 0,6 + 0,3 = 0,8999…
  const decimal = { type: 'avance', ligne: 'dixiemes', depart: 6, but: 9, cible: 0.9 };
  assert.ok(droiteNumerique.reussi(decimal, { valeur: 9 / 10 }));
  assert.ok(droiteNumerique.reussi(decimal, { valeur: 0.6 + 0.3 }));
  // trois quarts : sur la droite des quarts
  const quarts = droiteNumerique.droites('CM1')[1];
  assert.equal(quarts.nom(3), 'trois quarts');
  assert.equal(quarts.nom(4), '1');
  assert.ok(droiteNumerique.reussi({ type: 'place', ligne: 'quarts', but: 3, cible: 0.75 }, { valeur: quarts.valeur(3) }));
});

// ---------------------------------------------------------------- La balance des nombres

const poids = (...liste) => {
  const out = Array(10).fill(0);
  for (const p of liste) out[p - 1]++;
  return out;
};

test('balance : des défis possibles, imposés à gauche', () => {
  for (const grade of balance.classes) {
    for (const defi of defis(balance, grade)) {
      assert.match(defi.consigne, /^À gauche, il y a /);
      assert.ok(defi.gauche.every((c) => c <= 3) && defi.gauche.some((c) => c > 0));
      const sol = balance.solution(defi);
      assert.ok(sol.droite, `${grade} : « ${defi.consigne} » impossible`);
      assert.ok(sol.droite.every((c) => c <= 3));
      if (grade === 'GS') assert.ok(defi.gauche.reduce((s, c, i) => s + c * (i + 1), 0) <= 10);
    }
  }
  const tous = (grade) => new Set(defis(balance, grade, 600).map((d) => d.consigne));
  assert.ok(tous('GS').has('À gauche, il y a un poids sur le 5. Équilibre la balance.'));
  assert.ok(tous('CP').has('À gauche, il y a un poids sur le 8 et un poids sur le 6. Équilibre la balance avec 2 poids.'));
  assert.ok(tous('CE1').has('À gauche, il y a un poids sur le 9 et un poids sur le 7. Équilibre la balance avec un poids sur le 10 et un autre poids.'));
});

test('balance : vérifier et aider', () => {
  // CE1 : 9 + 7 = 10 + 6
  const defi = { type: 'equilibre', gauche: poids(9, 7), nb: 2, sur: 10 };
  assert.ok(balance.reussi(defi, { gauche: poids(9, 7), droite: poids(10, 6) }));
  assert.ok(!balance.reussi(defi, { gauche: poids(9, 7), droite: poids(8, 8) }));
  assert.equal(balance.indice(defi, { gauche: poids(9, 7), droite: poids(8, 8) }), 'Pas encore. Il faut un poids sur le 10.');
  assert.equal(balance.indice(defi, { gauche: poids(9, 7), droite: poids(10, 4, 2) }), 'Pas encore. La balance est en équilibre, mais compte bien les poids à droite.');
  assert.equal(balance.indice(defi, { gauche: poids(9, 7), droite: poids(10) }), 'Pas encore. Il manque du poids à droite.');
  assert.equal(balance.indice(defi, { gauche: poids(9, 7), droite: poids(10, 9) }), 'Pas encore. Il y a trop de poids à droite.');
  assert.equal(balance.indice(defi, { gauche: poids(9), droite: poids(9) }), 'Pas encore. Laisse les poids de gauche comme au début.');
  // des poids seulement sur le 3 : 9 = 3 + 3 + 3
  const tables = { type: 'equilibre', gauche: poids(9), seulSur: 3 };
  assert.ok(balance.reussi(tables, { gauche: poids(9), droite: poids(3, 3, 3) }));
  assert.ok(!balance.reussi(tables, { gauche: poids(9), droite: poids(6, 3) }));
  assert.equal(balance.indice(tables, { gauche: poids(9), droite: poids(6, 3) }), 'Pas encore. Écoute bien la consigne : sur quel nombre faut-il accrocher les poids ?');
  // pencher à droite : plus lourd à droite
  const penche = { type: 'penche', gauche: poids(4) };
  assert.ok(balance.reussi(penche, { gauche: poids(4), droite: poids(5) }));
  assert.ok(!balance.reussi(penche, { gauche: poids(4), droite: poids(4) }));
  assert.equal(balance.indice(penche, { gauche: poids(4), droite: poids(2) }), 'Pas encore. La balance doit pencher à droite.');
});
