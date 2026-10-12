// Code parental (espace parents) : ce qui ne dépend pas de l'écran. Le code (4 chiffres) est choisi
// par un parent, après un calcul d'adulte ; il est ensuite demandé à chaque entrée dans l'espace
// parents et pour donner du temps de jeu en plus. L'écran est dans main.js (parentGate).

import { randInt } from './random.js';

export const CODE_LENGTH = 4;
// après 3 erreurs de suite (code ou calcul), on attend 30 secondes avant de réessayer
export const MAX_ERREURS = 3;
export const VERROU_MS = 30_000;

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

/** Le verrou après une erreur : { erreurs, jusqua } (jusqua : la fin de l'attente, en ms). */
export function apresErreur(etat, maintenant) {
  const erreurs = (etat?.erreurs || 0) + 1;
  if (erreurs >= MAX_ERREURS) return { erreurs: 0, jusqua: maintenant + VERROU_MS };
  return { erreurs, jusqua: etat?.jusqua || 0 };
}

/** Combien de millisecondes il faut encore attendre (0 : on peut essayer). */
export function attente(etat, maintenant) {
  return Math.max(0, (etat?.jusqua || 0) - maintenant);
}
