// Outils pour le temps et la monnaie : l'horloge, les pièces et les billets, le minuteur.
//
// Chaque outil suit le contrat décrit dans ../outils.js (modèle : le cadre de dix, ./comptage.js).
// La logique du cadran (aiguilles, heures en minutes depuis 12 h) vient du jeu « Règle l'horloge »
// (../games/horloge.js) ; les dessins (cadran, pièces, billets) de ../render.js.

import { clockSvg, h, moneyItem } from '../render.js';
import { pick, randInt } from '../random.js';
import { playSound } from '../sounds.js';
import { clockLabel } from '../games/maths-extra.js';
import {
  dragHourHand, dragMinuteHand, fromClockMinutes, handAngles, pickHand, pointerAngle, shiftClock, toClockMinutes,
} from '../games/horloge.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Toucher plutôt que glisser (a11y.js) : l'aiguille va là où l'on touche, sans suivre le doigt. */
const toucherSeulement = () => Boolean(globalThis.document?.body?.classList.contains('a11y-tap-only'));

// ---------------------------------------------------------------- L'horloge

/** « 1 heure », « 7 heures » (nombres en chiffres : la voix dit « une heure »). */
const heures = (n) => `${n} heure${n > 1 ? 's' : ''}`;
/** « 10 heures », « 10 heures 40 », « 9 heures 5 » : comme on le dit, sans « h » ni « min ». */
const heureDite = (n, m) => `${heures(n)}${m ? ` ${m}` : ''}`;
/** « 35 minutes », « 1 heure », « 1 heure et 20 minutes ». */
function dureeDite(minutes) {
  const [hh, mm] = [Math.floor(minutes / 60), minutes % 60];
  const min = `${mm} minute${mm > 1 ? 's' : ''}`;
  if (!hh) return min;
  return mm ? `${heures(hh)} et ${min}` : heures(hh);
}
/** { h, m } quelconque (h de 0 à 23, minutes négatives…) → l'heure du cadran, h de 1 à 12. */
const surLeCadran = (hh, m) => fromClockMinutes(toClockMinutes({ h: hh, m: 0 }) + m);

const INDICES_HORLOGE = {
  heures: 'Pas encore. La petite aiguille montre les heures.',
  minutes: 'Pas encore. La grande aiguille montre les minutes.',
  deux: 'Pas encore. Regarde les deux aiguilles, la petite pour les heures et la grande pour les minutes.',
  pile: 'Pas encore. À l’heure pile, la grande aiguille montre le 12.',
  demie: 'Pas encore. Et demie, c’est quand la grande aiguille a fait la moitié du tour.',
  quart: 'Pas encore. Et quart, c’est quand la grande aiguille a fait un quart de tour.',
  moinsQuart: 'Pas encore. Moins le quart, c’est un quart d’heure avant l’heure.',
  moins: 'Pas encore. Avec moins, il manque quelques minutes pour arriver à l’heure.',
  cinq: 'Pas encore. Compte les minutes de 5 en 5, en suivant les nombres du cadran.',
  minute: 'Pas encore. Compte les minutes de 5 en 5, puis une par une.',
  apresMidi: 'Pas encore. L’après-midi, enlève 12 aux heures pour lire l’horloge.',
  duree: 'Pas encore. Pars de l’heure de départ et compte les minutes.',
  dureeHeure: 'Pas encore. Quand la grande aiguille passe le 12, l’heure change aussi.',
};

// Les nombres des défis. Chaque consigne est enregistrée par la voix d'Estelle (phrasesOutils) :
// des choix variés mais en nombre limité, pour que presque toutes soient dites d'un seul son ; les
// autres le sont autour des nombres (« Mets l’horloge à » + 10 + « heures » + 37, comme le jeu).
const CINQ = [5, 10, 20, 25, 40, 50]; // de 5 en 5 (et quart, et demie : à part)
const A_LA_MINUTE = [3, 8, 14, 17, 22, 36, 41, 52];
const MINUTES_DEPART = [0, 10, 15, 20, 30, 40, 45, 50];
// heures de départ des durées : pile (CE2), ou dans la journée d'école (CM1, parfois l'après-midi)
const HEURES_PILE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const HEURES_JOURNEE = [8, 9, 10, 11, 13, 14, 15, 16];

/**
 * L'horloge à aiguilles : les boutons font tourner les deux aiguilles ensemble, comme une vraie
 * horloge (la grande fait avancer la petite) ; on peut aussi toucher le cadran pour y poser
 * l'aiguille la plus proche. Défis : régler une heure dite en mots, puis des durées (CM1).
 */
export const horloge = {
  id: 'horloge',
  titre: 'L’horloge',
  icone: '🕒',
  famille: 'temps',
  classes: ['GS', 'CP', 'CE1', 'CE2', 'CM1'],
  aide: 'Touche les boutons pour faire tourner les aiguilles. Tu peux aussi toucher le cadran.',
  indices: Object.values(INDICES_HORLOGE),
  // vider() remet l'horloge à 12 heures : aucun défi ne la demande
  vide: { h: 12, m: 0 },

  /** Au CE2 et au CM1, les minutes une par une (boutons « −1 min », « +1 min »). */
  aLaMinute(grade) {
    return ['CE2', 'CM1'].includes(grade);
  },

  defi(grade, rng) {
    // régler l'horloge sur une heure dite ; forme : ce que l'indice explique
    const regle = (forme, hh, m, dit) => ({ type: 'regle', forme, cible: surLeCadran(hh, m), consigne: `Mets l’horloge à ${dit}.` });
    const heure = () => randInt(rng, 1, 12);
    const pile = () => { const n = randInt(rng, 1, 11); return regle('pile', n, 0, heures(n)); };
    const demie = () => { const n = heure(); return regle('demie', n, 30, `${heures(n)} et demie`); };
    const quart = () => { const n = heure(); return regle('quart', n, 15, `${heures(n)} et quart`); };
    const moinsQuart = () => { const n = heure(); return regle('moinsQuart', n, -15, `${heures(n)} moins le quart`); };
    const cinq = () => { const [n, m] = [heure(), pick(rng, CINQ)]; return regle('cinq', n, m, heureDite(n, m)); };
    const minute = () => { const [n, m] = [heure(), pick(rng, A_LA_MINUTE)]; return regle('minute', n, m, heureDite(n, m)); };
    const moins = () => { const [n, k] = [heure(), pick(rng, [5, 10, 20, 25])]; return regle('moins', n, -k, `${heures(n)} moins ${k}`); };
    // l'après-midi : on dit 15 heures 20, l'horloge à aiguilles montre 3 h 20
    const apresMidi = () => { const [n, m] = [randInt(rng, 13, 18), pick(rng, MINUTES_DEPART)]; return regle('apresMidi', n, m, heureDite(n, m)); };
    // une durée : l'horloge part de l'heure dite (preparer), on avance ou on recule
    const duree = (departs, durees, sens = 1) => {
      for (;;) {
        const [dh, dm, d] = [pick(rng, departs), pick(rng, departs === HEURES_PILE ? [0] : MINUTES_DEPART), pick(rng, durees)];
        const cible = surLeCadran(dh, dm + sens * d);
        if (cible.h === 12 && cible.m === 0) continue; // c'est l'horloge vidée
        return {
          type: 'duree', depart: surLeCadran(dh, dm), duree: sens * d, cible,
          consigne: `Il est ${heureDite(dh, dm)}. ${sens > 0 ? 'Avance' : 'Recule'} l’horloge de ${dureeDite(d)}.`,
        };
      }
    };
    if (grade === 'GS') return pile();
    if (grade === 'CP') return pick(rng, [pile, demie, demie])();
    if (grade === 'CE1') return pick(rng, [quart, moinsQuart, demie, cinq, cinq])();
    if (grade === 'CE2') return pick(rng, [minute, minute, moins, () => duree(HEURES_PILE, [10, 15, 20, 30, 45])])();
    return pick(rng, [
      apresMidi,
      () => duree(HEURES_JOURNEE, [5, 10, 15, 20, 25, 35, 40, 50, 55]),
      () => duree(HEURES_JOURNEE, [70, 80, 90, 100]),
      () => duree(HEURES_JOURNEE, [10, 15, 20, 25, 30, 45], -1),
    ])();
  },

  reussi(defi, etat) {
    return etat.h % 12 === defi.cible.h % 12 && etat.m === defi.cible.m;
  },

  solution(defi) {
    return { ...defi.cible };
  },

  indice(defi, etat) {
    const I = INDICES_HORLOGE;
    const bonneHeure = etat.h % 12 === defi.cible.h % 12;
    const bonnesMinutes = etat.m === defi.cible.m;
    if (defi.type === 'duree') return bonnesMinutes ? I.dureeHeure : I.duree;
    if (!bonneHeure && !bonnesMinutes) return I.deux;
    // les minutes sont justes : l'heure de l'après-midi, ou celle d'après (« moins le quart »)
    if (bonnesMinutes) return ['apresMidi', 'moinsQuart', 'moins'].includes(defi.forme) ? I[defi.forme] : I.heures;
    // l'heure est juste : ce qu'il faut savoir des minutes pour cette forme
    return defi.forme === 'apresMidi' ? I.cinq : I[defi.forme] || I.minutes;
  },

  creer({ grade }) {
    const fin = horloge.aLaMinute(grade);
    const apresMidi = grade === 'CM1'; // « 3 h 20 ou 15 h 20 »
    let t = 0; // l'heure du cadran, en minutes depuis 12 h (games/horloge.js)
    const cadran = h('div', { class: 'horloge-cadran', role: 'img' });
    cadran.innerHTML = clockSvg(12, 0);
    const svg = cadran.querySelector('svg');
    const petite = svg.querySelector('.hand-hour');
    const grande = svg.querySelector('.hand-minute');
    // une poignée au bout de chaque aiguille : on voit qu'on peut les attraper
    const poignee = (classe, cy, r) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      for (const [k, v] of Object.entries({ class: `hand-knob ${classe}`, cx: 50, cy, r })) c.setAttribute(k, v);
      return c;
    };
    const poigneePetite = poignee('knob-hour', 29, 4);
    const poigneeGrande = poignee('knob-minute', 13, 3.4);
    petite.after(poigneePetite);
    grande.after(poigneeGrande);

    const ecrite = h('p', { class: 'outil-nombre outil-aide-nombre horloge-ecrite', 'aria-live': 'polite' });
    const voir = h('button', { class: 'outil-btn outil-aide-nombre', 'data-voir-heure': '', 'aria-pressed': 'false', onclick: () => {
      voir.setAttribute('aria-pressed', String(voir.getAttribute('aria-pressed') !== 'true'));
      dessiner();
    } }, '👁 L’heure');
    // une colonne par unité (heures, 5 minutes, 1 minute) : « + » en haut, « − » en bas ; le nom dit
    // aussi ce qui est écrit (commande vocale), comme dans le jeu « Règle l'horloge »
    const bouton = (minutes, texte, aria) => h('button', {
      class: `outil-btn horloge-btn ${Math.abs(minutes) === 60 ? 'heures' : 'minutes'}`, 'data-shift': minutes, 'aria-label': `${texte} : ${aria}`,
      onclick: () => regler(shiftClock(t, minutes)),
    }, texte);
    const boutons = h('div', { class: `horloge-boutons${fin ? ' fin' : ''}` },
      bouton(60, '+1 h', 'avancer d’une heure'), bouton(-60, '−1 h', 'reculer d’une heure'),
      bouton(5, '+5 min', 'avancer de 5 minutes'), bouton(-5, '−5 min', 'reculer de 5 minutes'),
      fin ? [bouton(1, '+1 min', 'avancer d’une minute'), bouton(-1, '−1 min', 'reculer d’une minute')] : []);

    function etat() {
      return fromClockMinutes(t);
    }
    function dessiner() {
      const { hour, minute } = handAngles(t);
      for (const el of [petite, poigneePetite]) el.setAttribute('transform', `rotate(${hour} 50 50)`);
      for (const el of [grande, poigneeGrande]) el.setAttribute('transform', `rotate(${minute} 50 50)`);
      const { h: hh, m } = etat();
      cadran.dataset.h = hh;
      cadran.dataset.m = m;
      cadran.setAttribute('aria-label', `Horloge : ${heureDite(hh, m)}`);
      ecrite.hidden = voir.getAttribute('aria-pressed') !== 'true';
      ecrite.textContent = apresMidi ? `${clockLabel(hh, m)} ou ${clockLabel(hh === 12 ? 0 : hh + 12, m)}` : clockLabel(hh, m);
    }
    function regler(suivant) {
      if (suivant === t) return;
      t = suivant;
      playSound('tap');
      dessiner();
    }

    // au doigt (en plus des boutons) : on attrape l'aiguille la plus proche et on la fait tourner
    let attrapee = null;
    const point = (e) => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
      return { angle: pointerAngle(p.x - 50, p.y - 50), rayon: Math.hypot(p.x - 50, p.y - 50) };
    };
    const suivre = (p) => regler(attrapee === 'minute' ? dragMinuteHand(t, p.angle, fin ? 1 : 5) : dragHourHand(t, p.angle));
    svg.addEventListener('pointerdown', (e) => {
      const p = point(e);
      if (p.rayon > 50 || p.rayon < 4) return; // hors du cadran, ou au centre (pas de direction)
      e.preventDefault();
      attrapee = pickHand(t, p.angle, p.rayon);
      cadran.classList.add(`grab-${attrapee}`);
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {
        // sans capture, le geste marche tant que le doigt reste sur le cadran
      }
      suivre(p);
    });
    svg.addEventListener('pointermove', (e) => {
      if (attrapee && !toucherSeulement()) suivre(point(e));
    });
    const lacher = () => {
      attrapee = null;
      cadran.classList.remove('grab-minute', 'grab-hour');
    };
    svg.addEventListener('pointerup', lacher);
    svg.addEventListener('pointercancel', lacher);

    function vider() {
      t = 0;
      dessiner();
    }
    /** Une durée part de l'heure dite dans la consigne. */
    function preparer(defi) {
      if (defi?.depart) {
        t = toClockMinutes(defi.depart);
        dessiner();
      }
    }
    dessiner();
    // le cadran prend toute la place qui reste (outils-temps.css) ; l'heure écrite à côté de « 👁 »
    return {
      el: h('div', { class: `outil-horloge${fin ? ' fin' : ''}` }, h('div', { class: 'horloge-corps' }, h('div', { class: 'horloge-place' }, cadran),
        h('div', { class: 'horloge-commandes' }, boutons, h('div', { class: 'outil-commandes' }, voir, ecrite)))),
      etat, vider, preparer,
    };
  },
};

// ---------------------------------------------------------------- Les pièces et les billets

// toutes les valeurs, en centimes, de la plus petite pièce au plus grand billet (jusqu'à 50 €)
const VALEURS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const MAX_POSES = 30; // au-delà, le porte-monnaie ne tiendrait plus sur un téléphone
// les centimes des défis du CM (en nombre limité : chaque consigne est enregistrée par la voix)
const CENTIMES_CM1 = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
const CENTIMES_CM2 = [3, 8, 12, 17, 26, 34, 48, 59, 63, 77, 81, 99];

/** « 3 € », « 3,50 € », « 0,05 € ». */
export function montantEcrit(centimes) {
  const [e, c] = [Math.floor(centimes / 100), centimes % 100];
  return c ? `${e},${String(c).padStart(2, '0')} €` : `${e} €`;
}

/** « 3 euros », « 4 euros et 50 centimes », « 80 centimes » (pour la voix : tout en mots). */
function montantDit(centimes) {
  const [e, c] = [Math.floor(centimes / 100), centimes % 100];
  const euros = `${e} euro${e > 1 ? 's' : ''}`;
  const cts = `${c} centime${c > 1 ? 's' : ''}`;
  if (!c) return euros;
  return e ? `${euros} et ${cts}` : cts;
}

/** « pièce de 50 centimes », « pièce de 2 euros », « billet de 10 euros ». */
function nomValeur(v) {
  if (v < 100) return `pièce de ${v} centime${v > 1 ? 's' : ''}`;
  if (v <= 200) return `pièce de ${v / 100} euro${v > 100 ? 's' : ''}`;
  return `billet de ${v / 100} euros`;
}

/** Le moins de pièces et de billets possible pour une somme (les euros : le plus grand d'abord suffit). */
export function moinsDePieces(centimes, valeurs = VALEURS) {
  let reste = centimes;
  let n = 0;
  for (const v of [...valeurs].sort((a, b) => b - a)) {
    n += Math.floor(reste / v);
    reste %= v;
  }
  return reste ? Infinity : n;
}

/** Une pièce ou un billet dessiné ; les centimes, que moneyItem ne dessine pas, sont faits ici. */
function dessinValeur(v) {
  const el = v >= 100 ? moneyItem(v / 100) : h('span', { class: `coin coin-c coin-c${v}` }, h('b', {}, v), 'c');
  el.removeAttribute('aria-label'); // c'est le bouton qui le dit
  el.setAttribute('aria-hidden', 'true');
  return el;
}

const INDICES_MONNAIE = {
  trop: 'Pas encore. C’est trop, enlève des pièces ou des billets.',
  manque: 'Pas encore. Il manque de l’argent.',
  centimes: 'Pas encore. Les euros sont justes, regarde les centimes.',
  euros: 'Pas encore. Les centimes sont justes, regarde les euros.',
  moins: 'Pas encore. Le compte est bon, mais tu peux prendre moins de pièces et de billets.',
};

/**
 * Les pièces et les billets : on touche une pièce ou un billet pour le poser dans le
 * porte-monnaie, on le touche dans le porte-monnaie pour l'enlever. Les centimes arrivent au CE2.
 */
export const monnaie = {
  id: 'monnaie',
  titre: 'Les pièces et les billets',
  icone: '💶',
  famille: 'temps',
  classes: ['GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche une pièce ou un billet pour le poser dans le porte-monnaie. Touche-le encore pour l’enlever.',
  indices: Object.values(INDICES_MONNAIE),
  vide: { total: 0, n: 0, pieces: [] },

  /** Les pièces et billets proposés dans une classe, en centimes. */
  valeurs(grade) {
    if (grade === 'GS') return [100, 200, 500, 1000];
    if (grade === 'CP') return [100, 200, 500, 1000, 2000];
    if (grade === 'CE1') return [100, 200, 500, 1000, 2000, 5000];
    if (grade === 'CE2') return [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    return VALEURS;
  },

  defi(grade, rng) {
    const pose = (centimes, moinsPossible = false) => ({
      type: moinsPossible ? 'moins' : 'somme', centimes,
      ...(moinsPossible ? { pieces: moinsDePieces(centimes, monnaie.valeurs(grade)) } : {}),
      consigne: `Pose ${montantDit(centimes)}.${moinsPossible ? ' Prends le moins possible de pièces et de billets.' : ''}`,
    });
    const euros = (min, max) => randInt(rng, min, max) * 100;
    if (grade === 'GS') return pose(euros(2, 10));
    if (grade === 'CP') return pose(euros(5, 30));
    if (grade === 'CE1') return pick(rng, [() => pose(euros(11, 70)), () => pose(euros(11, 70)), () => pose(euros(6, 70), true)])();
    // CE2 : des pièces de 10, 20 et 50 centimes
    const dizaines = () => randInt(rng, 1, 9) * 10;
    if (grade === 'CE2') {
      return pick(rng, [() => pose(euros(1, 9) + dizaines()), () => pose(euros(1, 9) + dizaines()), () => pose(dizaines()),
        () => pose(euros(1, 9) + dizaines(), true)])();
    }
    // CM : toutes les pièces ; au CM1, des centimes qui demandent une pièce de 5 centimes, au CM2,
    // aussi des pièces de 1 et 2 centimes
    const centimes = () => pick(rng, grade === 'CM1' ? CENTIMES_CM1 : CENTIMES_CM2);
    return pick(rng, [() => pose(euros(1, 15) + centimes()), () => pose(euros(1, 15) + centimes(), true)])();
  },

  reussi(defi, etat) {
    return etat.total === defi.centimes && (defi.type !== 'moins' || etat.n <= defi.pieces);
  },

  solution(defi) {
    const pieces = [];
    let reste = defi.centimes;
    for (const v of [...VALEURS].reverse()) {
      while (reste >= v) {
        pieces.push(v);
        reste -= v;
      }
    }
    return { total: defi.centimes, n: pieces.length, pieces };
  },

  indice(defi, etat) {
    const I = INDICES_MONNAIE;
    if (etat.total === defi.centimes) return I.moins;
    // des euros et des centimes : lequel des deux est juste ?
    if (defi.centimes % 100 && etat.total) {
      if (Math.floor(etat.total / 100) === Math.floor(defi.centimes / 100)) return I.centimes;
      if (etat.total % 100 === defi.centimes % 100) return I.euros;
    }
    return etat.total > defi.centimes ? I.trop : I.manque;
  },

  creer({ grade }) {
    const valeurs = monnaie.valeurs(grade);
    const poses = []; // les valeurs posées, de la plus grande à la plus petite (plus facile à compter)
    const bourse = h('div', { class: 'monnaie-bourse', role: 'group', 'aria-label': 'Porte-monnaie' });
    const total = h('p', { class: 'outil-nombre outil-aide-nombre monnaie-total', 'aria-live': 'polite' });
    const plein = h('p', { class: 'monnaie-plein', 'aria-live': 'polite' });
    const ajout = (v) => h('button', {
      class: `monnaie-ajout ${v >= 500 ? 'billet' : 'piece'}`, 'data-valeur': v, 'aria-label': `Poser ${v >= 500 ? 'un' : 'une'} ${nomValeur(v)}`,
      onclick: () => ajouter(v),
    }, dessinValeur(v));
    // les billets sur une ligne, les pièces dessous
    const banque = h('div', { class: 'monnaie-banque' },
      h('div', { class: 'monnaie-billets' }, valeurs.filter((v) => v >= 500).reverse().map(ajout)),
      h('div', { class: `monnaie-pieces n${valeurs.filter((v) => v < 500).length}` }, valeurs.filter((v) => v < 500).reverse().map(ajout)));
    const voir = h('button', { class: 'outil-btn outil-aide-nombre', 'data-voir-nombre': '', 'aria-pressed': 'false', onclick: () => {
      voir.setAttribute('aria-pressed', String(voir.getAttribute('aria-pressed') !== 'true'));
      dessiner();
    } }, '👁 Le total');
    const commandes = h('div', { class: 'outil-commandes monnaie-commandes' }, voir, total,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      const t = poses.reduce((a, b) => a + b, 0);
      return { total: t, n: poses.length, pieces: [...poses] };
    }
    function dessiner(focus = -1) {
      const items = poses.map((v, i) => h('button', {
        class: `monnaie-posee ${v >= 500 ? 'billet' : 'piece'}`, 'data-posee': v,
        'aria-label': `${nomValeur(v)[0].toUpperCase()}${nomValeur(v).slice(1)}, dans le porte-monnaie : touche pour l’enlever`,
        onclick: () => enlever(i),
      }, dessinValeur(v)));
      bourse.replaceChildren(...(items.length ? items : [h('span', { class: 'monnaie-vide' }, 'Le porte-monnaie est vide.')]));
      // beaucoup de pièces : elles rapetissent, pour que tout tienne sans défiler
      bourse.dataset.taille = poses.length > 20 ? 'petite' : poses.length > 12 ? 'moyenne' : 'grande';
      // au clavier, le focus reste dans le porte-monnaie (ou revient aux pièces quand il est vide)
      if (focus >= 0) (items[Math.min(focus, items.length - 1)] || banque.querySelector('button')).focus();
      const t = etat().total;
      total.hidden = voir.getAttribute('aria-pressed') !== 'true';
      total.textContent = montantEcrit(t);
      const estPlein = poses.length >= MAX_POSES;
      plein.textContent = estPlein ? 'Le porte-monnaie est plein.' : '';
      for (const b of banque.querySelectorAll('button')) b.setAttribute('aria-disabled', String(estPlein));
    }
    function ajouter(v) {
      if (poses.length >= MAX_POSES) return dessiner();
      const i = poses.findIndex((x) => x < v);
      poses.splice(i < 0 ? poses.length : i, 0, v);
      playSound('tap');
      dessiner();
    }
    function enlever(i) {
      const avaitLeFocus = bourse.contains(document.activeElement);
      poses.splice(i, 1);
      playSound('tap');
      dessiner(avaitLeFocus ? i : -1);
    }
    function vider() {
      poses.length = 0;
      dessiner();
    }
    dessiner();
    // le porte-monnaie prend toute la place qui reste ; en paysage, les pièces à poser à droite
    return {
      el: h('div', { class: `outil-monnaie${valeurs.length > 9 ? ' toutes' : ''}` },
        h('div', { class: 'monnaie-corps' }, h('div', { class: 'monnaie-gauche' }, bourse, plein), banque, commandes)),
      etat, vider,
    };
  },
};

// ---------------------------------------------------------------- Le minuteur

const DUREES = [30, 60, 120, 300, 600]; // en secondes
const DUREE_MAX = 60 * 60;

/** « 4 min 30 s », « 2 min », « 30 s » (écrit en grand) ; dit : « 4 minutes 30 secondes ». */
export function tempsEcrit(secondes) {
  const [m, s] = [Math.floor(secondes / 60), secondes % 60];
  if (!m) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
}
function tempsDit(secondes) {
  const [m, s] = [Math.floor(secondes / 60), secondes % 60];
  const min = `${m} minute${m > 1 ? 's' : ''}`;
  const sec = `${s} seconde${s > 1 ? 's' : ''}`;
  if (!m) return sec;
  return s ? `${min} ${sec}` : min;
}

/** Le disque qui se vide (comme un « Time Timer ») : la part qui reste part du 12, vers la gauche. */
function disqueSvg(part) {
  const r = 40;
  const a = 2 * Math.PI * (1 - part);
  const [x, y] = [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
  const reste = part >= 0.9995 ? `<circle class="minuteur-reste-part" cx="50" cy="50" r="${r}"/>`
    : part > 0 ? `<path class="minuteur-reste-part" d="M50 50 L${x.toFixed(2)} ${y.toFixed(2)} A${r} ${r} 0 ${part > 0.5 ? 1 : 0} 1 50 ${50 - r} Z"/>` : '';
  const traits = Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="5" x2="50" y2="9" transform="rotate(${i * 30} 50 50)"/>`).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle class="minuteur-fond" cx="50" cy="50" r="46"/>
    <g class="minuteur-traits">${traits}</g>
    ${reste}
    <circle class="minuteur-centre" cx="50" cy="50" r="4"/>
  </svg>`;
}

/**
 * Le minuteur : on choisit une durée, on le démarre, on le met en pause ; un disque se vide et le
 * temps qui reste est écrit en grand. À la fin, une fanfare et « C'est fini ! ». Pas de défi.
 */
export const minuteur = {
  id: 'minuteur',
  titre: 'Le minuteur',
  icone: '⏳',
  famille: 'temps',
  classes: ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Choisis une durée, puis touche Démarrer.',
  indices: [],
  vide: { duree: 60, reste: 60, marche: false },
  // pas de défi (aDesDefis : pas de bouton « Un défi ») ; null plutôt qu'une fonction qui renverrait
  // toujours null : tests/outils.test.js attend des défis de toute fonction defi
  defi: null,

  creer() {
    let duree = 60; // la durée choisie, en secondes
    let reste = duree * 1000; // ce qui reste, en millisecondes
    let finA = 0; // l'heure de la fin (Date.now()), quand il tourne
    let minuterie = null;
    let fini = false;
    const disque = h('div', { class: 'minuteur-disque', 'aria-hidden': 'true' });
    const temps = h('p', { class: 'minuteur-temps', role: 'timer' });
    const message = h('p', { class: 'minuteur-fin', 'aria-live': 'polite' });
    const choix = DUREES.map((s) => h('button', {
      class: 'outil-btn minuteur-duree', 'data-duree': s, 'aria-label': tempsDit(s), onclick: () => choisir(s),
    }, tempsEcrit(s)));
    const plus = h('button', { class: 'outil-btn minuteur-duree', 'data-plus': '', 'aria-label': 'Ajouter 1 minute', onclick: () => ajouterMinute() }, '+1 min');
    const go = h('button', { class: 'outil-btn minuteur-go', 'data-go': '', onclick: () => (minuterie ? pause() : demarrer()) });
    const again = h('button', { class: 'outil-btn', 'data-recommencer': '', 'aria-label': 'Recommencer', onclick: () => recommencer() }, '↺ Recommencer');

    // le disque (« C'est fini ! » par-dessus), puis le temps écrit et les boutons (à droite en paysage)
    const el = h('div', { class: 'outil-minuteur' }, h('div', { class: 'minuteur-corps' },
      h('div', { class: 'minuteur-boite' }, disque, message),
      h('div', { class: 'minuteur-commandes' }, temps,
        h('div', { class: 'minuteur-durees', role: 'group', 'aria-label': 'Durée' }, choix, plus),
        h('div', { class: 'minuteur-actions' }, go, again))));
    const secondes = () => Math.ceil(reste / 1000);
    function etat() {
      return { duree, reste: secondes(), marche: Boolean(minuterie) };
    }
    function dessiner() {
      disque.innerHTML = disqueSvg(duree ? reste / (duree * 1000) : 0);
      temps.textContent = tempsEcrit(secondes());
      temps.setAttribute('aria-label', `Il reste ${tempsDit(secondes())}`);
      go.textContent = minuterie ? '⏸ Pause' : '▶ Démarrer';
      go.setAttribute('aria-label', minuterie ? 'Pause' : 'Démarrer');
      choix.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.duree) === duree)));
      message.textContent = fini ? 'C’est fini\u00a0!' : '';
      el.classList.toggle('fini', fini);
      el.classList.toggle('en-marche', Boolean(minuterie));
    }
    function arreter() {
      clearInterval(minuterie);
      minuterie = null;
    }
    function tic() {
      reste = Math.max(0, finA - Date.now());
      if (!reste) {
        arreter();
        fini = true;
        playSound('fanfare');
      }
      dessiner();
    }
    function demarrer() {
      if (fini || !reste) {
        reste = duree * 1000;
        fini = false;
      }
      finA = Date.now() + reste;
      minuterie = setInterval(tic, 250);
      dessiner();
    }
    function pause() {
      reste = Math.max(0, finA - Date.now());
      arreter();
      dessiner();
    }
    function recommencer() {
      arreter();
      reste = duree * 1000;
      fini = false;
      dessiner();
    }
    function choisir(s) {
      duree = s;
      recommencer();
    }
    function ajouterMinute() {
      if (fini) {
        duree = 0;
        reste = 0;
        fini = false;
      }
      if (duree + 60 > DUREE_MAX) return;
      duree += 60;
      reste += 60000;
      if (minuterie) finA += 60000;
      dessiner();
    }
    dessiner();
    return { el, etat, vider: () => choisir(60), arreter };
  },
};

export const TEMPS = [horloge, monnaie, minuteur];
