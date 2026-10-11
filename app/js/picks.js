// Tirage des jeux, sans dépendance au DOM (testé dans tests/) : défi du jour, révisions et
// partie à plusieurs. Les rubriques et les jeux masqués par les parents ne sont jamais tirés.

import { findGame } from './games/index.js';
import { isGameHidden, nearestLevel, programForChild } from './programs.js';
import { createRng, sample, shuffle } from './random.js';
import { gameStats, MAX_CHILDREN } from './storage.js';

/** Empreinte d'un texte (FNV-1a) : la graine du défi du jour. */
export function hashText(text) {
  let hash = 2166136261;
  for (const ch of text) hash = Math.imul(hash ^ ch.codePointAt(0), 16777619);
  return hash >>> 0;
}

/** Niveau actuel de l'enfant dans un jeu, parmi les niveaux de sa classe. */
export function currentLevel(child, { game, min, levels }) {
  return nearestLevel(levels, gameStats(child, game.id, min).level);
}

/**
 * Les jeux qu'on peut tirer pour un enfant : son programme affiché, sans la carte des paliers
 * ni les défis chrono (leur partie de 10 questions chronométrées a son propre format), ni la lecture
 * à voix haute (un adulte écoute et note, game.adult).
 */
export function drawPool(child) {
  return programForChild(child).flatMap((domain) => domain.games).filter(({ game }) => !game.paliers && !game.timed && !game.adult);
}

/**
 * Les jeux du défi du jour : 5 jeux distincts, les mêmes toute la journée (graine « jour:enfant »).
 * Sans réglage des parents, le tirage est le même qu'avant (même liste, même graine).
 */
export function dailyPicks(child, seed, count = 5) {
  return sample(createRng(hashText(seed)), drawPool(child), count);
}

/** Les révisions du jour (date « AAAA-MM-JJ ») : jeux connus, à revoir, et non masqués. */
export function dueReviews(child, today) {
  return Object.entries(child?.review || {})
    .filter(([id, item]) => findGame(id) && !findGame(id).timed && !findGame(id).adult && item?.due <= today && !isGameHidden(child, id));
}

// ---------------------------------------------------------------- Jouer à plusieurs (de 2 à 6)

export const DUO_QUESTIONS = 10;
/** Autant de joueurs que de profils : jusqu'à 6. */
export const PARTY_MAX = MAX_CHILDREN;

/**
 * Le nombre de questions d'une partie à `players` joueurs : une dizaine, autant pour chacun, et au
 * moins 2 chacun (10 à deux, 9 à trois, 12 à quatre, 10 à cinq, 12 à six).
 */
export function partyLength(players) {
  return Math.max(2, Math.round(DUO_QUESTIONS / players)) * players;
}

/** L'enfant dont c'est le tour : A, B, C, A, B, C… */
export function duoTurn(players, index) {
  return players[index % players.length];
}

/**
 * Le déroulé d'une partie à plusieurs : `total` questions, chacun son tour. Chaque question vient d'un
 * jeu tiré au hasard dans le programme de l'enfant dont c'est le tour (pas deux fois le même jeu tant
 * qu'il en reste), à son niveau actuel. Renvoie null si l'un d'eux n'a aucun jeu affiché.
 * @returns {{player: string, game: object, level: number}[] | null}
 */
export function duoPlan(profiles, players, rng, total = partyLength(players.length)) {
  const pools = Object.fromEntries(players.map((id) => [id, drawPool(profiles[id])]));
  if (players.length < 2 || players.some((id) => !profiles[id] || !pools[id].length)) return null;
  const decks = Object.fromEntries(players.map((id) => [id, []]));
  return Array.from({ length: total }, (_, index) => {
    const player = duoTurn(players, index);
    if (!decks[player].length) decks[player] = shuffle(rng, pools[player]);
    const entry = decks[player].shift();
    return { player, game: entry.game, level: currentLevel(profiles[player], entry) };
  });
}
