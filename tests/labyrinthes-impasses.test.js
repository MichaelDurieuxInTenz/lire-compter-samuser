// Labyrinthes (carré et rond) : au bout d'une impasse, la branche fausse est marquée ; jamais le bon
// chemin, ni une case que le héros n'a pas parcourue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMove, impasse, makeMaze, makePolarMaze, ROUND_MAZE_LEVELS, solveLinks, solveMaze } from '../app/js/games/labyrinthes.js';
import { createRng, pick } from '../app/js/random.js';

/** Les cases où l'on passe depuis c, dans un labyrinthe carré. */
const squareNeighbours = (open, cols) => (c) => [c - cols, c + 1, c + cols, c - 1]
  .filter((n) => n >= 0 && n < open.length && canMove(open, cols, c, n));

test('impasses : un couloir, puis l’embranchement ; au-delà seulement quand ses autres branches sont des impasses', () => {
  // un petit arbre : 0 (départ) - 1 - 2 (embranchement) ; 2 - 3 - 4 (impasse) ; 2 - 5 (impasse) ; 1 - 6 - 7 (arrivée)
  const links = { 0: [1], 1: [0, 2, 6], 2: [1, 3, 5], 3: [2, 4], 4: [3], 5: [2], 6: [1, 7], 7: [6] };
  const neighbours = (c) => links[c];
  const keep = new Set([0, 7]);
  const dead = new Set();
  assert.equal(impasse(neighbours, 3, keep, dead), null, 'un couloir n’est pas un bout d’impasse');
  assert.equal(impasse(neighbours, 0, keep, dead), null, 'le départ n’est jamais une impasse');
  assert.equal(impasse(neighbours, 7, keep, dead), null, 'l’arrivée non plus');
  // au bout de 3 - 4 : le couloir jusqu'à l'embranchement 2 (qui a encore la branche 5)
  assert.deepEqual(impasse(neighbours, 4, keep, dead), [4, 3]);
  // au bout de 5 : 5, puis 2 (toutes ses autres branches sont des impasses), et on s'arrête à 1 (vers l'arrivée)
  assert.deepEqual(impasse(neighbours, 5, keep, dead), [5, 2]);
  assert.deepEqual([...dead].sort(), [2, 3, 4, 5]);
  // revenir au bout d'une impasse déjà connue : rien de nouveau, mais c'est bien une impasse
  assert.deepEqual(impasse(neighbours, 4, keep, dead), []);
  // une clé au bout d'une impasse : ce n'est pas une erreur
  assert.equal(impasse(neighbours, 5, new Set([0, 7, 5]), new Set()), null);
});

/**
 * Le héros se promène au hasard (en revenant parfois sur ses pas) : chaque case marquée a déjà été
 * parcourue, aucune case du bon chemin (ni des chemins vers les clés) ne l'est, et chaque bout
 * d'impasse atteint est marqué.
 */
function wander(rng, neighbours, start, goal, items, keepPath) {
  const keep = new Set([start, goal, ...items]);
  const dead = new Set();
  const visited = new Set([start]);
  let pos = start;
  for (let step = 0; step < 400; step++) {
    const next = pick(rng, neighbours(pos));
    if (next === goal) continue; // l'arrivée finit la partie : on reste dans le labyrinthe
    pos = next;
    visited.add(pos);
    const fresh = impasse(neighbours, pos, keep, dead);
    if (neighbours(pos).length === 1 && !keep.has(pos)) assert.ok(dead.has(pos), `bout d’impasse ${pos} non marqué`);
    for (const c of fresh || []) assert.ok(visited.has(c), `case ${c} marquée sans avoir été parcourue`);
  }
  for (const c of keepPath) assert.ok(!dead.has(c), `case ${c} du bon chemin marquée comme impasse`);
  return dead.size;
}

test('impasses : labyrinthes carrés (de 4 × 4 à 9 × 9) : jamais le bon chemin, seulement des cases parcourues', () => {
  const rng = createRng(11);
  let marked = 0;
  for (let k = 0; k < 300; k++) {
    const size = 4 + (k % 6);
    const open = makeMaze(rng, size, size);
    const neighbours = squareNeighbours(open, size);
    const start = 0;
    const goal = size * size - 1;
    marked += wander(rng, neighbours, start, goal, [], solveMaze(open, size, start, goal));
  }
  assert.ok(marked > 1000, `${marked} cases marquées : les impasses sont bien trouvées`);
});

test('impasses : labyrinthes ronds (chaque niveau) : jamais le bon chemin, seulement des cases parcourues', () => {
  const rng = createRng(12);
  let marked = 0;
  for (let k = 0; k < 200; k++) {
    const { sectors } = ROUND_MAZE_LEVELS[k % ROUND_MAZE_LEVELS.length];
    const links = makePolarMaze(rng, sectors);
    const neighbours = (c) => links[c];
    const goal = links.length - 1; // une case du bord ; le départ : le centre
    marked += wander(rng, neighbours, 0, goal, [], solveLinks(links, 0, goal));
  }
  assert.ok(marked > 500, `${marked} cases marquées`);
});
