// Code parental (espace parents) : ce qui ne dépend pas de l'écran. Le code (4 chiffres) est choisi
// par un parent, après un calcul d'adulte ; il est ensuite demandé à chaque entrée dans l'espace
// parents et pour donner du temps de jeu en plus. Code oublié : un calcul plus dur, puis 5 minutes
// d'attente. L'écran est dans main.js (parentGate).

import { randInt } from './random.js';

export const CODE_LENGTH = 4;
// après 3 erreurs de suite (code ou calcul), une attente, de plus en plus longue jusqu'au bon code :
// 30 s, 2 min, 10 min, puis 30 min à chaque fois (essayer les 10 000 codes prendrait des mois)
export const MAX_ERREURS = 3;
export const PALIERS_VERROU = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];
// code oublié : après le calcul, 5 minutes d'attente avant de choisir le nouveau code (un enfant qui a
// trouvé le calcul se lasse), puis 10 minutes pour le choisir ; ensuite, tout est à refaire
export const ATTENTE_OUBLI_MS = 5 * 60_000;
export const CHOIX_OUBLI_MS = 10 * 60_000;

/** Un code trop facile à deviner : 4 fois le même chiffre, ou une suite (1234, 9876, 0123…). */
export function codeTropFacile(code) {
  const d = [...String(code)].map(Number);
  if (d.every((x) => x === d[0])) return true;
  const step = d[1] - d[0];
  return Math.abs(step) === 1 && d.every((x, i) => !i || x - d[i - 1] === step);
}

/** Ce qui ne va pas dans le code choisi (le texte à afficher), ou '' s'il convient. */
export function problemeCode(code, confirmation) {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(String(code))) return `Le code a ${CODE_LENGTH} chiffres.`;
  if (codeTropFacile(code)) return 'Ce code est trop facile à deviner. Choisissez-en un autre.';
  if (confirmation !== code) return 'Les deux codes ne sont pas les mêmes. Recommencez.';
  return '';
}

/** Un calcul d'adulte : un nombre de 12 à 19 multiplié par 6 à 9, moins un nombre de 11 à 49. */
export function calculDifficile(rng) {
  const a = randInt(rng, 12, 19);
  const b = randInt(rng, 6, 9);
  const c = randInt(rng, 11, 49);
  return { texte: `${a} × ${b} − ${c} = ?`, reponse: a * b - c };
}

/** Le calcul du code oublié, plus dur : un nombre de 23 à 49 multiplié par 13 à 19, moins 101 à 249 environ. */
export function calculOubli(rng) {
  const a = randInt(rng, 23, 49);
  const b = randInt(rng, 13, 19);
  const c = randInt(rng, 101, Math.min(299, a * b - 50));
  return { texte: `${a} × ${b} − ${c} = ?`, reponse: a * b - c };
}

/**
 * Le verrou après une erreur : { erreurs, series, jusqua } (series : les attentes déjà imposées depuis
 * le dernier bon code ; jusqua : la fin de l'attente, en ms). Les autres champs (oubli) sont gardés.
 */
export function apresErreur(etat, maintenant) {
  const erreurs = (etat?.erreurs || 0) + 1;
  if (erreurs < MAX_ERREURS) return { ...etat, erreurs };
  const series = etat?.series || 0;
  return { ...etat, erreurs: 0, series: series + 1, jusqua: maintenant + PALIERS_VERROU[Math.min(series, PALIERS_VERROU.length - 1)] };
}

/** Combien de millisecondes il faut encore attendre (0 : on peut essayer). */
export function attente(etat, maintenant) {
  return Math.max(0, (etat?.jusqua || 0) - maintenant);
}

/**
 * Où en est un code oublié (etat.oubli : la fin de l'attente, en ms) : 'attente' (encore à attendre),
 * 'choix' (le nouveau code peut être choisi) ou '' (rien en cours, ou trop tard).
 */
export function etapeOubli(etat, maintenant) {
  const fin = etat?.oubli || 0;
  if (!fin) return '';
  if (maintenant < fin) return 'attente';
  return maintenant < fin + CHOIX_OUBLI_MS ? 'choix' : '';
}

/** Une durée à afficher : « 45 s », « 2 min », « 4 min 05 s ». */
export function dureeEnClair(ms) {
  const s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${m} min`;
}
