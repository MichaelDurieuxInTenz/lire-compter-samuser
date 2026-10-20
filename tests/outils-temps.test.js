// Outils « le temps et la monnaie » (app/js/outils/temps.js) : l'horloge, les pièces et les
// billets, le minuteur. Les règles communes à tous les outils sont dans outils.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aDesDefis, outilsPour, trouverOutil } from '../app/js/outils.js';
import { horloge, minuteur, moinsDePieces, monnaie, montantEcrit, tempsEcrit, TEMPS } from '../app/js/outils/temps.js';
import { createRng } from '../app/js/random.js';

/** Les défis d'un outil pour une classe (tirés avec une graine fixe). */
function defis(outil, grade, n = 400, graine = 11) {
  const rng = createRng(graine);
  return Array.from({ length: n }, () => outil.defi(grade, rng));
}

// ---------------------------------------------------------------- l'horloge

/** L'heure dite dans une consigne, recalculée ici sans le code de l'outil : minutes depuis 0 h. */
function heureLue(texte) {
  const m = texte.match(/^(\d+) heures?(?: (et quart|et demie|moins le quart|moins (\d+)|(\d+)))?$/);
  assert.ok(m, `heure illisible : « ${texte} »`);
  const h = Number(m[1]);
  if (m[2] === 'et quart') return h * 60 + 15;
  if (m[2] === 'et demie') return h * 60 + 30;
  if (m[2] === 'moins le quart') return h * 60 - 15;
  if (m[3]) return h * 60 - Number(m[3]);
  return h * 60 + Number(m[4] || 0);
}
/** Minutes depuis 0 h → l'heure sur un cadran de 12 heures. */
const cadran = (t) => {
  const n = ((t % 720) + 720) % 720;
  return { h: Math.floor(n / 60) || 12, m: n % 60 };
};

test('l’horloge : chaque consigne dit une heure que l’on retrouve sur le cadran', () => {
  for (const grade of horloge.classes) {
    for (const defi of defis(horloge, grade)) {
      // en mots pour la voix : jamais « h » ni « min »
      assert.ok(!/\d ?(h|min)\b/.test(defi.consigne), `« ${defi.consigne} »`);
      let attendu;
      if (defi.type === 'regle') {
        attendu = cadran(heureLue(defi.consigne.match(/^Mets l’horloge à (.+)\.$/)[1]));
      } else {
        const m = defi.consigne.match(/^Il est (.+)\. (Avance|Recule) l’horloge de (?:(\d+) heures?(?: et )?)?(?:(\d+) minutes?)?\.$/);
        assert.ok(m, `« ${defi.consigne} »`);
        const duree = Number(m[3] || 0) * 60 + Number(m[4] || 0);
        assert.deepEqual(defi.depart, cadran(heureLue(m[1])), defi.consigne);
        assert.equal(defi.duree, m[2] === 'Avance' ? duree : -duree);
        attendu = cadran(heureLue(m[1]) + defi.duree);
      }
      assert.deepEqual(defi.cible, attendu, defi.consigne);
      // l'horloge vidée (12 heures) ne répond à aucun défi
      assert.ok(!(defi.cible.h === 12 && defi.cible.m === 0), defi.consigne);
    }
  }
});

test('l’horloge : des défis à la mesure de chaque classe', () => {
  const formes = (grade) => new Set(defis(horloge, grade).map((d) => (d.type === 'duree' ? 'duree' : d.forme)));
  assert.deepEqual([...formes('GS')], ['pile']);
  assert.deepEqual([...formes('CP')].sort(), ['demie', 'pile']);
  assert.deepEqual([...formes('CE1')].sort(), ['cinq', 'demie', 'moinsQuart', 'quart']);
  assert.deepEqual([...formes('CE2')].sort(), ['duree', 'minute', 'moins']);
  assert.deepEqual([...formes('CM1')].sort(), ['apresMidi', 'duree']);
  // jusqu'au CE1, des minutes de 5 en 5 (les boutons « 5 min » suffisent)
  for (const grade of ['GS', 'CP', 'CE1']) {
    for (const d of defis(horloge, grade)) assert.equal(d.cible.m % 5, 0, d.consigne);
  }
  assert.ok(defis(horloge, 'CE2').some((d) => d.cible.m % 5), 'CE2 : à la minute');
  // CM1 : des durées en avant et en arrière, l'après-midi
  const cm1 = defis(horloge, 'CM1');
  assert.ok(cm1.some((d) => d.duree < 0) && cm1.some((d) => d.duree > 60));
  assert.ok(cm1.some((d) => /^Mets l’horloge à 1\d heures/.test(d.consigne)));
  assert.equal(horloge.aLaMinute('CE1'), false);
  assert.equal(horloge.aLaMinute('CE2'), true);
});

test('l’horloge : réussi (heure modulo 12 et minutes), et les indices sur des cas précis', () => {
  const trouve = (grade, consigne) => {
    const defi = defis(horloge, grade, 40000, 5).find((d) => d.consigne === consigne);
    assert.ok(defi, `pas tiré : « ${consigne} »`);
    return defi;
  };
  const I = (debut) => horloge.indices.find((t) => t.startsWith(debut));

  const moinsQuart = trouve('CE1', 'Mets l’horloge à 7 heures moins le quart.');
  assert.deepEqual(moinsQuart.cible, { h: 6, m: 45 });
  assert.ok(horloge.reussi(moinsQuart, { h: 6, m: 45 }));
  assert.ok(!horloge.reussi(moinsQuart, { h: 7, m: 45 }));
  // l'erreur classique : 7 h 45 ; l'indice explique « moins le quart » sans donner l'heure
  assert.equal(horloge.indice(moinsQuart, { h: 7, m: 45 }), I('Pas encore. Moins le quart'));
  assert.equal(horloge.indice(moinsQuart, { h: 6, m: 15 }), I('Pas encore. Moins le quart'));
  assert.equal(horloge.indice(moinsQuart, { h: 2, m: 10 }), I('Pas encore. Regarde les deux aiguilles'));

  const demie = trouve('CP', 'Mets l’horloge à 4 heures et demie.');
  assert.ok(horloge.reussi(demie, { h: 4, m: 30 }));
  assert.equal(horloge.indice(demie, { h: 5, m: 30 }), I('Pas encore. La petite aiguille'));
  assert.equal(horloge.indice(demie, { h: 4, m: 0 }), I('Pas encore. Et demie'));

  const pile = trouve('GS', 'Mets l’horloge à 3 heures.');
  assert.equal(horloge.indice(pile, { h: 3, m: 5 }), I('Pas encore. À l’heure pile'));

  // l'après-midi : 15 heures 20 se montre 3 h 20 sur l'horloge à aiguilles
  const apresMidi = trouve('CM1', 'Mets l’horloge à 15 heures 20.');
  assert.ok(horloge.reussi(apresMidi, { h: 3, m: 20 }));
  assert.equal(horloge.indice(apresMidi, { h: 5, m: 20 }), I('Pas encore. L’après-midi'));

  // une durée qui passe l'heure : 13 h 45 + 35 minutes = 2 h 20
  const avance = trouve('CM1', 'Il est 13 heures 45. Avance l’horloge de 35 minutes.');
  assert.deepEqual(avance.depart, { h: 1, m: 45 });
  assert.deepEqual(avance.cible, { h: 2, m: 20 });
  assert.equal(horloge.indice(avance, { h: 1, m: 20 }), I('Pas encore. Quand la grande aiguille passe le 12'));
  assert.equal(horloge.indice(avance, avance.depart), I('Pas encore. Pars de l’heure de départ'));
  // une durée en arrière : 10 h 15 − 30 minutes = 9 h 45
  const recule = trouve('CM1', 'Il est 10 heures 15. Recule l’horloge de 30 minutes.');
  assert.deepEqual(recule.cible, { h: 9, m: 45 });
  assert.ok(horloge.reussi(recule, { h: 9, m: 45 }));

  // l'indice est toujours une phrase enregistrée, quelle que soit l'heure montrée
  const rng = createRng(2);
  for (const grade of horloge.classes) {
    for (const defi of defis(horloge, grade, 60)) {
      const etat = { h: 1 + Math.floor(rng() * 12), m: Math.floor(rng() * 60) };
      if (!horloge.reussi(defi, etat)) assert.ok(horloge.indices.includes(horloge.indice(defi, etat)));
    }
  }
});

// ---------------------------------------------------------------- les pièces et les billets

test('les pièces et les billets : les valeurs de chaque classe', () => {
  assert.deepEqual(monnaie.valeurs('GS'), [100, 200, 500, 1000]);
  assert.ok(monnaie.valeurs('CP').includes(2000) && !monnaie.valeurs('CP').includes(5000));
  assert.ok(monnaie.valeurs('CE1').includes(5000) && monnaie.valeurs('CE1').every((v) => v >= 100));
  assert.deepEqual(monnaie.valeurs('CE2').filter((v) => v < 100), [10, 20, 50]);
  for (const grade of ['CM1', 'CM2']) assert.equal(monnaie.valeurs(grade).length, 12);
});

test('les pièces et les billets : des défis par classe, en euros et en centimes écrits en toutes lettres', () => {
  for (const grade of monnaie.classes) {
    const valeurs = monnaie.valeurs(grade);
    for (const defi of defis(monnaie, grade)) {
      // la somme dite est celle à poser
      const m = defi.consigne.match(/^Pose (?:(\d+) euros?)?(?: et )?(?:(\d+) centimes?)?\.( Prends le moins possible de pièces et de billets\.)?$/);
      assert.ok(m, `${grade} : « ${defi.consigne} »`);
      assert.equal(Number(m[1] || 0) * 100 + Number(m[2] || 0), defi.centimes, defi.consigne);
      assert.equal(Boolean(m[3]), defi.type === 'moins');
      // la solution n'utilise que les pièces et billets de la classe, et le moins possible
      const solution = monnaie.solution(defi);
      assert.ok(solution.pieces.every((v) => valeurs.includes(v)), `${grade} : ${solution.pieces}`);
      assert.equal(solution.n, moinsDePieces(defi.centimes, valeurs));
      if (defi.type === 'moins') assert.equal(defi.pieces, solution.n);
    }
  }
  const sommes = (grade) => defis(monnaie, grade).map((d) => d.centimes);
  assert.ok(sommes('GS').every((c) => c % 100 === 0 && c >= 200 && c <= 1000));
  assert.ok(sommes('CP').every((c) => c % 100 === 0 && c <= 3000));
  assert.ok(sommes('CE1').every((c) => c % 100 === 0) && sommes('CE1').some((c) => c > 5000));
  assert.ok(sommes('CE2').every((c) => c % 10 === 0) && sommes('CE2').some((c) => c % 100));
  assert.ok(sommes('CM1').every((c) => c % 5 === 0) && sommes('CM2').some((c) => c % 5));
  for (const grade of ['CE1', 'CE2', 'CM1', 'CM2']) assert.ok(defis(monnaie, grade).some((d) => d.type === 'moins'), grade);
  for (const grade of ['GS', 'CP']) assert.ok(defis(monnaie, grade).every((d) => d.type === 'somme'), grade);
});

test('les pièces et les billets : le moins de pièces possible, le total écrit', () => {
  assert.equal(moinsDePieces(1235), 5); // 10 €, 2 €, 20 c, 10 c, 5 c
  assert.equal(moinsDePieces(450, monnaie.valeurs('CE2')), 3); // 2 €, 2 €, 50 c
  assert.equal(moinsDePieces(8800), 6); // 50 €, 20 €, 10 €, 5 €, 2 €, 1 €
  assert.equal(moinsDePieces(5, monnaie.valeurs('CE2')), Infinity);
  assert.equal(montantEcrit(350), '3,50 €');
  assert.equal(montantEcrit(300), '3 €');
  assert.equal(montantEcrit(5), '0,05 €');
  assert.equal(montantEcrit(1209), '12,09 €');
});

test('les pièces et les billets : réussi et indices sur des cas précis', () => {
  const I = (debut) => monnaie.indices.find((t) => t.startsWith(debut));
  const moins = { type: 'moins', centimes: 1235, pieces: 5 };
  assert.ok(monnaie.reussi(moins, { total: 1235, n: 5 }));
  assert.ok(!monnaie.reussi(moins, { total: 1235, n: 6 }));
  assert.equal(monnaie.indice(moins, { total: 1235, n: 6 }), I('Pas encore. Le compte est bon'));
  const somme = { type: 'somme', centimes: 450 };
  assert.ok(monnaie.reussi(somme, { total: 450, n: 9 }));
  assert.equal(monnaie.indice(somme, { total: 430, n: 4 }), I('Pas encore. Les euros sont justes'));
  assert.equal(monnaie.indice(somme, { total: 550, n: 3 }), I('Pas encore. Les centimes sont justes'));
  assert.equal(monnaie.indice(somme, { total: 620, n: 3 }), I('Pas encore. C’est trop'));
  assert.equal(monnaie.indice(somme, { total: 0, n: 0 }), I('Pas encore. Il manque'));
  assert.equal(monnaie.indice({ type: 'somme', centimes: 1500 }, { total: 1700, n: 2 }), I('Pas encore. C’est trop'));
});

// ---------------------------------------------------------------- le minuteur

test('le minuteur : de la petite section au CM2, sans défi', () => {
  assert.deepEqual(minuteur.classes, ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2']);
  for (const grade of minuteur.classes) {
    assert.equal(aDesDefis(minuteur, grade), false);
    assert.ok(outilsPour(grade).includes(minuteur));
  }
  assert.deepEqual(minuteur.indices, []);
  assert.equal(tempsEcrit(270), '4 min 30 s');
  assert.equal(tempsEcrit(300), '5 min');
  assert.equal(tempsEcrit(30), '30 s');
  assert.equal(tempsEcrit(0), '0 s');
});

test('la famille « temps » : trois outils, avec leurs classes', () => {
  assert.deepEqual(TEMPS.map((o) => o.id), ['horloge', 'monnaie', 'minuteur']);
  for (const outil of TEMPS) {
    assert.equal(trouverOutil(outil.id), outil);
    assert.equal(outil.famille, 'temps');
    assert.match(outil.titre, /^(Le |La |Les |L’)/);
  }
  assert.deepEqual(outilsPour('PS').filter((o) => o.famille === 'temps'), [minuteur]);
  assert.deepEqual(outilsPour('GS').filter((o) => o.famille === 'temps'), [horloge, monnaie, minuteur]);
  assert.deepEqual(outilsPour('CM2').filter((o) => o.famille === 'temps'), [monnaie, minuteur]);
});
