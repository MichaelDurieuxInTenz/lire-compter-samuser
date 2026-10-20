// La boîte à outils : des outils à manipuler librement, comme sur une table de classe (cadre de dix,
// blocs de base dix, horloge, pièces et billets, géoplan…), inspirés des « Teacher Tools » de Toy
// Theater. Pas de note ni d'étoiles : on manipule, on montre, on explique ; un bouton « Un défi »
// propose en plus une consigne courte, vérifiée sans être comptée.
//
// Un outil est un objet :
//   id, titre, icone, famille (FAMILLES), classes (les classes où il est proposé),
//   aide : la phrase dite à l'ouverture (toucher, jamais glisser : a11y-jeux.js),
//   indices : toutes les phrases que indice() peut renvoyer (enregistrées par la voix d'Estelle),
//   defi(grade, rng) : { consigne, dit?, …données } ou null (pas de défi) ; dit : ce que dit la voix
//     quand l'écrit ne s'entend pas tel quel (« 1 305 » → « mille 305 ») ; { libre: true } : pas de
//     vérification, l'enfant dit « J'ai fini » (un dessin, une construction libre) ;
//   reussi(defi, etat) : vrai si l'état de l'outil répond au défi ;
//   solution(defi) : un état qui répond au défi (pour les tests ; pas pour un défi libre) ;
//   vide : l'état de l'outil vidé (pour les tests : il ne répond à aucun défi, sauf exception) ;
//   indice(defi, etat) : une phrase de indices, dite quand ce n'est pas encore ça ;
//   creer({ grade }) : { el, etat(), vider?(), preparer?(defi), arreter?() } : l'outil dans la page
//     (el), son état (pour reussi), « vider » avant un défi, « preparer » un défi (ou null à la
//     fin du défi), « arreter » en quittant l'écran (un minuteur…).
// Pendant un défi, ce qui donne la réponse (le nombre affiché…) porte la classe outil-aide-nombre :
// il est caché (outils.css).
//
// defi, reussi et indice sont des fonctions pures (testées dans tests/outils.test.js) ; creer
// dessine l'outil (render.js).

import { COMPTAGE } from './outils/comptage.js';
import { FORMES } from './outils/formes.js';
import { NUMERATION } from './outils/numeration.js';
import { TEMPS } from './outils/temps.js';
import { createRng } from './random.js';

export const RUBRIQUE_OUTILS = { id: 'outils', title: 'Outils', icon: '🧰' };

export const FAMILLES = [
  { id: 'comptage', titre: 'Compter' },
  { id: 'numeration', titre: 'Les nombres' },
  { id: 'temps', titre: 'Le temps et la monnaie' },
  { id: 'formes', titre: 'Formes et fractions' },
];

export const OUTILS = [...COMPTAGE, ...NUMERATION, ...TEMPS, ...FORMES];

/** Ce que dit l'écran des outils (en plus des aides, consignes et indices de chaque outil). */
export const PHRASES_OUTILS = {
  liste: 'Outils. Choisis un outil !',
  bravo: ['Bravo, c’est ça !', 'Super, défi réussi !', 'Bien joué, c’est exactement ça !'],
  fini: 'Bravo ! Montre ton travail à un adulte.',
  pasEncore: 'Pas encore. Regarde bien et essaie encore.',
  rien: 'Pas encore. Il n’y a rien pour l’instant.',
};

export function trouverOutil(id) {
  return OUTILS.find((o) => o.id === id);
}

/** Les outils d'une classe, dans l'ordre des familles. */
export function outilsPour(grade) {
  return FAMILLES.flatMap((f) => OUTILS.filter((o) => o.famille === f.id && o.classes.includes(grade)));
}

/** Les outils d'un enfant : ceux de sa classe, sauf si les parents ont masqué la rubrique. */
export function outilsDeLEnfant(child) {
  if ((child?.hiddenDomains || []).includes(RUBRIQUE_OUTILS.id)) return [];
  return outilsPour(child?.grade || 'CP');
}

/** L'outil est-il comme vidé (rien posé, rien dessiné) ? Un défi libre ne se finit pas ainsi. */
export function estVide(outil, etat) {
  return Boolean(outil.vide) && Object.entries(outil.vide).every(([k, v]) => JSON.stringify(etat?.[k]) === JSON.stringify(v));
}

/** Un outil a-t-il des défis pour cette classe ? */
export function aDesDefis(outil, grade) {
  return Boolean(outil.defi && outil.defi(grade, createRng(1)));
}

/** Les phrases fixes des outils (écrans, titres, aides, indices) : chacune est enregistrée entière. */
export function phrasesFixesOutils() {
  const out = new Set([PHRASES_OUTILS.liste, ...PHRASES_OUTILS.bravo, PHRASES_OUTILS.fini, PHRASES_OUTILS.pasEncore, PHRASES_OUTILS.rien]);
  for (const outil of OUTILS) {
    out.add(outil.titre);
    out.add(outil.aide);
    for (const indice of outil.indices || []) out.add(indice);
  }
  return [...out];
}

/**
 * Les consignes des défis, tirées au hasard dans chaque classe de chaque outil : { outil, grade,
 * consigne, dit } (dit : ce que dit la voix). « decalage » donne d'autres tirages (des consignes
 * jamais vues, pour les tests).
 */
export function consignesOutils(tirages = 200, decalage = 0) {
  const out = [];
  OUTILS.forEach((outil, o) => {
    if (!outil.defi) return;
    outil.classes.forEach((grade, g) => {
      const rng = createRng((decalage + 1) * 104729 + o * 7919 + g * 31);
      for (let i = 0; i < tirages; i++) {
        const defi = outil.defi(grade, rng);
        if (defi) out.push({ outil: outil.id, grade, consigne: defi.consigne, dit: defi.dit ?? defi.consigne });
      }
    });
  });
  return out;
}

/** Toutes les phrases que disent les outils (pour les tests) : phrases fixes et consignes dites. */
export function phrasesOutils(tirages = 200) {
  return [...new Set([...phrasesFixesOutils(), ...consignesOutils(tirages).map((c) => c.dit)])];
}
