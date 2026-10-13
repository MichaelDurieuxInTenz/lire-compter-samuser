// Jeux de réflexion : le puzzle, le memory, le coloriage magique (la couleur dépend du
// chiffre) et les points à relier (une forme apparaît).

import { pick, randInt, sample, shuffle } from '../random.js';

// ---------------------------------------------------------------- Le puzzle

// Chaque image : un grand emoji sur un fond en dégradé (le haut et le bas n'ont pas la même couleur,
// ce qui aide à placer les pièces).
const PUZZLE_PICTURES = [
  { picture: '🦁', colors: ['#fff3b0', '#f4a259'] }, { picture: '🚀', colors: ['#1d3557', '#a8dadc'] },
  { picture: '🏰', colors: ['#bde0fe', '#90be6d'] }, { picture: '🐢', colors: ['#caf0f8', '#0096c7'] },
  { picture: '🦄', colors: ['#ffc8dd', '#cdb4db'] }, { picture: '🌻', colors: ['#a2d2ff', '#80b918'] },
  { picture: '🐳', colors: ['#e0fbfc', '#3d5a80'] }, { picture: '🚂', colors: ['#ffe5d9', '#9d8189'] },
  { picture: '🦋', colors: ['#d8f3dc', '#52b788'] }, { picture: '🍓', colors: ['#fff1e6', '#f08080'] },
  { picture: '🐼', colors: ['#e9f5db', '#718355'] }, { picture: '🎈', colors: ['#caf0f8', '#ffafcc'] },
]
const PUZZLE_LEVELS = [
  { label: '4 pièces (2 × 2)', cols: 2, rows: 2 },
  { label: '6 pièces (3 × 2)', cols: 3, rows: 2 },
  { label: '9 pièces (3 × 3)', cols: 3, rows: 3 },
  { label: '12 pièces (4 × 3)', cols: 4, rows: 3 },
  { label: '16 pièces (4 × 4)', cols: 4, rows: 4 },
  { label: '25 pièces (5 × 5)', cols: 5, rows: 5 },
  // 6 colonnes au plus : sur un iPhone SE, une pièce fait encore environ 50 points de côté
  { label: '30 pièces (6 × 5)', cols: 6, rows: 5 },
  { label: '36 pièces (6 × 6)', cols: 6, rows: 6 },
];

export const puzzle = {
  id: 'puzzle',
  domain: 'jeux',
  title: 'Le puzzle',
  icon: '🧩',
  skill: 'Reconstituer une image : observer, comparer les formes et les couleurs',
  levels: PUZZLE_LEVELS.map((l) => l.label),
  generate(level, rng) {
    const { cols, rows } = PUZZLE_LEVELS[level - 1];
    const { picture, colors } = pick(rng, PUZZLE_PICTURES);
    let order = shuffle(rng, Array.from({ length: cols * rows }, (_, i) => i));
    if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
    return {
      key: `puzzle:${level}:${picture}:${order.join('-')}`,
      interaction: 'swap',
      text: 'Remets l’image dans l’ordre.',
      instruction: 'Remets l’image dans l’ordre : touche deux pièces pour les échanger.',
      short: { key: 'puzzle', text: 'Remets l’image dans l’ordre.' },
      stage: { type: 'puzzle', cols, rows, picture, colors, order },
      choices: [],
      answer: null,
      success: { speak: 'Bravo, le puzzle est terminé !' },
    };
  },
};

// ---------------------------------------------------------------- Le memory

const MEMORY_PICTURES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁', '🐯', '🐮', '🐷', '🐔', '🐧'];
const MEMORY_LEVELS = [
  { label: '2 paires', pairs: 2 },
  { label: '3 paires', pairs: 3 },
  { label: '4 paires', pairs: 4 },
  { label: '6 paires', pairs: 6 },
  { label: '8 paires', pairs: 8 },
  { label: 'Chiffre et quantité (6 paires)', pairs: 6, mode: 'nombres' },
  { label: '10 paires', pairs: 10 },
];

export const memory = {
  id: 'memory',
  domain: 'jeux',
  title: 'Le memory',
  icon: '🃏',
  skill: 'Mémoriser où sont les cartes, retrouver les paires',
  levels: MEMORY_LEVELS.map((l) => l.label),
  generate(level, rng) {
    const { pairs, mode } = MEMORY_LEVELS[level - 1];
    let cards;
    if (mode === 'nombres') {
      const numbers = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], pairs);
      const emoji = pick(rng, ['🍎', '⭐', '🐟', '🌸']);
      cards = numbers.flatMap((n) => [{ pair: n, label: String(n) }, { pair: n, label: emoji.repeat(n), small: true }]);
    } else {
      cards = sample(rng, MEMORY_PICTURES, pairs).flatMap((e) => [{ pair: e, label: e }, { pair: e, label: e }]);
    }
    cards = shuffle(rng, cards);
    return {
      key: `memory:${level}:${cards.map((c) => c.pair).join('')}`,
      interaction: 'memory',
      text: 'Retrouve les paires.',
      instruction: mode === 'nombres'
        ? 'Retrouve les paires : chaque chiffre va avec le bon nombre d’objets. Retourne deux cartes à la fois.'
        : 'Retrouve les paires d’images. Retourne deux cartes à la fois.',
      short: { key: `memory:${mode || 'images'}`, text: 'Retrouve les paires.' },
      stage: { type: 'none' },
      cards,
      choices: [],
      answer: null,
      success: { speak: 'Bravo, tu as trouvé toutes les paires !' },
    };
  },
};

// ---------------------------------------------------------------- Le coloriage magique

// Chaque dessin : des zones (chemin SVG dans un carré de 120), la position du nombre, et le
// numéro de la couleur attendue (0, 1, 2…). Les zones sont assez grandes pour un doigt d'enfant.
export const MAGIC_DRAWINGS = [
  {
    name: 'la maison',
    zones: [
      { d: 'M0 96 H120 V120 H0 Z', at: [60, 110], c: 2 },
      { d: 'M18 58 L60 22 L102 58 Z', at: [60, 46], c: 0 },
      { d: 'M26 58 H94 V96 H26 Z M64 70 H82 V96 H64 Z M32 64 H48 V78 H32 Z', at: [55, 66], c: 1 },
      { d: 'M64 70 H82 V96 H64 Z', at: [73, 85], c: 3 },
      { d: 'M32 64 H48 V78 H32 Z', at: [40, 71], c: 4 },
      { d: 'M92 4 a12 12 0 1 0 0.1 0 Z', at: [92, 17], c: 3 },
    ],
  },
  {
    name: 'le bateau',
    zones: [
      { d: 'M0 90 Q30 80 60 90 T120 90 V120 H0 Z', at: [60, 108], c: 1 },
      { d: 'M18 72 H102 L90 90 H30 Z', at: [60, 81], c: 0 },
      { d: 'M55 14 V68 H26 Z', at: [45, 57], c: 4 },
      { d: 'M65 20 V68 H96 Z', at: [75, 58], c: 3 },
      { d: 'M55 4 H65 V72 H55 Z', at: [60, 12], c: 2 },
    ],
  },
  {
    name: 'le poisson',
    zones: [
      { d: 'M0 0 H120 V120 H0 Z M14 60 Q48 22 84 60 Q48 98 14 60 Z M84 60 L108 40 L108 80 Z', at: [100, 108], c: 1 },
      { d: 'M14 60 Q48 22 84 60 Q48 98 14 60 Z M36 47 a7 7 0 1 0 0.1 0 Z', at: [58, 64], c: 0 },
      { d: 'M84 60 L108 40 L108 80 Z', at: [99, 61], c: 3 },
      { d: 'M36 47 a7 7 0 1 0 0.1 0 Z', at: [36, 54], c: 4 },
    ],
  },
  {
    name: 'la fleur',
    zones: [
      { d: 'M0 104 H120 V120 H0 Z', at: [100, 113], c: 2 },
      { d: 'M55 70 H65 V104 H55 Z', at: [60, 96], c: 2 },
      { d: 'M60 16 a13 13 0 1 0 0.1 0 Z', at: [60, 26], c: 0 },
      { d: 'M85 36 a13 13 0 1 0 0.1 0 Z', at: [88, 49], c: 0 },
      { d: 'M35 36 a13 13 0 1 0 0.1 0 Z', at: [32, 49], c: 0 },
      { d: 'M60 58 a13 13 0 1 0 0.1 0 Z', at: [60, 74], c: 0 },
      { d: 'M60 37 a11 11 0 1 0 0.1 0 Z', at: [60, 48], c: 3 },
      { d: 'M64 90 Q86 72 100 84 Q84 100 64 94 Z', at: [84, 88], c: 1 },
    ],
  },
  {
    name: 'le papillon',
    zones: [
      { d: 'M55 58 C30 14 4 26 12 52 C16 66 40 68 55 58 Z', at: [30, 46], c: 0 },
      { d: 'M65 58 C90 14 116 26 108 52 C104 66 80 68 65 58 Z', at: [90, 46], c: 0 },
      { d: 'M55 64 C34 62 16 76 26 94 C36 106 52 92 55 70 Z', at: [38, 82], c: 3 },
      { d: 'M65 64 C86 62 104 76 94 94 C84 106 68 92 65 70 Z', at: [82, 82], c: 3 },
      { d: 'M55 30 H65 V96 H55 Z', at: [60, 40], c: 2 },
      { d: 'M0 106 H120 V120 H0 Z', at: [60, 114], c: 1 },
    ],
  },
  {
    name: 'le sapin',
    zones: [
      { d: 'M0 106 H120 V120 H0 Z', at: [100, 113], c: 1 },
      { d: 'M51 90 H69 V106 H51 Z', at: [60, 100], c: 0 },
      { d: 'M60 56 L104 94 L16 94 Z', at: [60, 86], c: 2 },
      { d: 'M60 38 L94 78 L26 78 Z', at: [60, 69], c: 2 },
      { d: 'M60 20 L84 58 L36 58 Z', at: [60, 47], c: 2 },
      { d: 'M60 3 L64.5 13 L75 13.5 L67 20.5 L69.5 31 L60 25.5 L50.5 31 L53 20.5 L45 13.5 L55.5 13 Z', at: [60, 18], c: 3 },
      { d: 'M36 79 a7 7 0 1 0 0.1 0 Z', at: [36, 86], c: 0 },
      { d: 'M84 79 a7 7 0 1 0 0.1 0 Z', at: [84, 86], c: 4 },
    ],
  },
  {
    name: 'la voiture',
    zones: [
      { d: 'M0 98 H120 V120 H0 Z', at: [60, 112], c: 2 },
      { d: 'M100 6 a12 12 0 1 0 0.1 0 Z', at: [100, 18], c: 3 },
      { d: 'M6 92 V70 Q6 62 14 62 H28 L40 40 H82 L96 62 H106 Q114 62 114 70 V92 Z', at: [60, 74], c: 0 },
      { d: 'M44 46 H58 V60 H35 Z', at: [49, 54], c: 1 },
      { d: 'M64 46 H79 L89 60 H64 Z', at: [74, 54], c: 1 },
      { d: 'M32 80 a12 12 0 1 0 0.1 0 Z', at: [32, 92], c: 4 },
      { d: 'M88 80 a12 12 0 1 0 0.1 0 Z', at: [88, 92], c: 4 },
    ],
  },
  {
    name: 'le champignon',
    zones: [
      { d: 'M0 0 H120 V100 H0 Z', at: [14, 12], c: 1 },
      { d: 'M0 100 H120 V120 H0 Z', at: [16, 111], c: 2 },
      { d: 'M46 60 H74 L80 104 H40 Z', at: [60, 86], c: 3 },
      { d: 'M8 66 Q8 16 60 14 Q112 16 112 66 Z', at: [60, 55], c: 0 },
      { d: 'M32 35 a9 9 0 1 0 0.1 0 Z', at: [32, 44], c: 3 },
      { d: 'M60 21 a9 9 0 1 0 0.1 0 Z', at: [60, 30], c: 3 },
      { d: 'M88 35 a9 9 0 1 0 0.1 0 Z', at: [88, 44], c: 3 },
    ],
  },
  {
    name: 'la glace',
    zones: [
      { d: 'M0 0 H120 V120 H0 Z', at: [16, 104], c: 1 },
      { d: 'M36 66 L60 114 L84 66 Z', at: [60, 86], c: 3 },
      { d: 'M60 35 a21 21 0 1 0 0.1 0 Z', at: [60, 64], c: 0 },
      { d: 'M60 14 a17 17 0 1 0 0.1 0 Z', at: [60, 33], c: 2 },
      { d: 'M60 3 a7 7 0 1 0 0.1 0 Z', at: [60, 10], c: 0 },
    ],
  },
  {
    name: 'la fusée',
    zones: [
      { d: 'M0 0 H120 V120 H0 Z', at: [16, 16], c: 1 },
      { d: 'M46 94 Q60 124 74 94 Z', at: [60, 104], c: 0 },
      { d: 'M44 58 L18 98 H44 Z', at: [35, 89], c: 2 },
      { d: 'M76 58 L102 98 H76 Z', at: [85, 89], c: 2 },
      { d: 'M60 6 Q82 30 78 96 H42 Q38 30 60 6 Z', at: [60, 80], c: 3 },
      { d: 'M60 6 Q70 14 75 28 H45 Q50 14 60 6 Z', at: [60, 21], c: 0 },
      { d: 'M60 40 a10 10 0 1 0 0.1 0 Z', at: [60, 50], c: 4 },
    ],
  },
  {
    name: 'l’arc-en-ciel',
    zones: [
      { d: 'M0 100 H120 V120 H0 Z', at: [60, 112], c: 2 },
      { d: 'M18 7 a11 11 0 1 0 0.1 0 Z', at: [18, 18], c: 3 },
      { d: 'M2 100 A58 58 0 0 1 118 100 H108 A48 48 0 0 0 12 100 Z', at: [60, 47], c: 0 },
      { d: 'M12 100 A48 48 0 0 1 108 100 H98 A38 38 0 0 0 22 100 Z', at: [60, 57], c: 3 },
      { d: 'M22 100 A38 38 0 0 1 98 100 H88 A28 28 0 0 0 32 100 Z', at: [60, 67], c: 2 },
      { d: 'M32 100 A28 28 0 0 1 88 100 H78 A18 18 0 0 0 42 100 Z', at: [60, 77], c: 1 },
      { d: 'M42 100 A18 18 0 0 1 78 100 Z', at: [60, 92], c: 4 },
      { d: 'M2 110 Q0 92 16 94 Q22 82 34 90 Q46 92 42 106 Q42 116 30 116 H10 Q2 116 2 110 Z', at: [22, 104], c: 1 },
      { d: 'M118 110 Q120 92 104 94 Q98 82 86 90 Q74 92 78 106 Q78 116 90 116 H110 Q118 116 118 110 Z', at: [98, 104], c: 1 },
    ],
  },
  {
    name: 'la tortue',
    zones: [
      { d: 'M0 0 H120 V100 H0 Z', at: [16, 16], c: 1 },
      { d: 'M0 100 H120 V120 H0 Z', at: [60, 111], c: 2 },
      { d: 'M20 76 H38 V100 H20 Z', at: [29, 91], c: 3 },
      { d: 'M66 76 H84 V100 H66 Z', at: [75, 91], c: 3 },
      { d: 'M104 52 a12 12 0 1 0 0.1 0 Z', at: [106, 64], c: 3 },
      { d: 'M6 82 Q8 32 52 32 Q96 32 96 82 Z', at: [19, 70], c: 2 },
      { d: 'M40 46 H64 L74 62 L64 78 H40 L30 62 Z', at: [52, 62], c: 0 },
    ],
  },
  {
    name: 'le château',
    zones: [
      { d: 'M0 104 H120 V120 H0 Z', at: [60, 113], c: 2 },
      { d: 'M30 104 V48 H42 V56 H54 V48 H66 V56 H78 V48 H90 V104 Z', at: [60, 69], c: 1 },
      { d: 'M8 40 H32 V104 H8 Z', at: [20, 72], c: 4 },
      { d: 'M88 40 H112 V104 H88 Z', at: [100, 72], c: 4 },
      { d: 'M4 40 L20 10 L36 40 Z', at: [20, 31], c: 0 },
      { d: 'M84 40 L100 10 L116 40 Z', at: [100, 31], c: 0 },
      { d: 'M47 104 V86 Q47 76 60 76 Q73 76 73 86 V104 Z', at: [60, 92], c: 3 },
    ],
  },
  {
    name: 'la pomme',
    zones: [
      { d: 'M0 0 H120 V120 H0 Z', at: [14, 108], c: 3 },
      { d: 'M53 36 Q50 18 46 8 H58 Q62 20 65 36 Z', at: [55, 20], c: 4 },
      { d: 'M64 26 Q84 4 108 14 Q90 38 64 26 Z', at: [88, 19], c: 2 },
      { d: 'M60 36 C40 20 8 28 12 62 C16 96 40 114 60 104 C80 114 104 96 108 62 C112 28 80 20 60 36 Z', at: [60, 70], c: 0 },
    ],
  },
  {
    name: 'la coccinelle',
    zones: [
      { d: 'M6 116 Q0 30 72 6 Q118 0 116 50 Q110 116 6 116 Z', at: [104, 72], c: 2 },
      { d: 'M60 15 a15 15 0 1 0 0.1 0 Z', at: [60, 23], c: 4 },
      { d: 'M60 34 A34 34 0 0 0 60 102 Z', at: [36, 67], c: 0 },
      { d: 'M60 34 A34 34 0 0 1 60 102 Z', at: [84, 67], c: 0 },
      { d: 'M46 42 a8 8 0 1 0 0.1 0 Z', at: [46, 50], c: 4 },
      { d: 'M74 42 a8 8 0 1 0 0.1 0 Z', at: [74, 50], c: 4 },
      { d: 'M44 76 a8 8 0 1 0 0.1 0 Z', at: [44, 84], c: 4 },
      { d: 'M76 76 a8 8 0 1 0 0.1 0 Z', at: [76, 84], c: 4 },
    ],
  },
];
export const MAGIC_COLORS = [
  { hex: '#ff5c5c', name: 'rouge' }, { hex: '#3d7dff', name: 'bleu' }, { hex: '#2fbf5b', name: 'vert' },
  { hex: '#ffd23f', name: 'jaune' }, { hex: '#b37dff', name: 'violet' },
];
// les nombres de la légende, et ce qui est écrit dans les zones
const MAGIC_LEVELS = [
  { label: 'Les nombres de 1 à 3', kind: 'chiffre', numbers: [1, 2, 3] },
  { label: 'Les nombres de 1 à 5', kind: 'chiffre', numbers: [1, 2, 3, 4, 5] },
  { label: 'Des additions (jusqu’à 5)', kind: 'plus', numbers: [1, 2, 3, 4, 5] },
  { label: 'Des soustractions', kind: 'moins', numbers: [1, 2, 3, 4, 5] },
  { label: 'Des additions (jusqu’à 10)', kind: 'plus', numbers: [2, 4, 6, 8, 10] },
  { label: 'Des additions (jusqu’à 20)', kind: 'plus', numbers: [11, 12, 13, 14, 15] },
  { label: 'Des multiplications', kind: 'fois', numbers: [6, 8, 10, 12, 15] },
];

/** Ce qui est écrit dans une zone : le nombre, ou un calcul dont le résultat est ce nombre. */
export function magicLabel(kind, n, rng) {
  if (kind === 'chiffre') return String(n);
  if (kind === 'plus') {
    const a = randInt(rng, 1, Math.max(1, n - 1));
    return `${a}+${n - a}`;
  }
  if (kind === 'moins') {
    const b = randInt(rng, 1, 5);
    return `${n + b}−${b}`;
  }
  const pairs = [];
  for (let a = 2; a <= 5; a++) if (n % a === 0 && n / a >= 2 && n / a <= 10) pairs.push([a, n / a]);
  const [a, b] = pick(rng, pairs.length ? pairs : [[1, n]]);
  return rng() < 0.5 ? `${a}×${b}` : `${b}×${a}`;
}

export const coloriageMagique = {
  id: 'coloriage-magique',
  domain: 'jeux',
  title: 'Le coloriage magique',
  icon: '🖍️',
  skill: 'Lire les nombres (puis calculer) pour trouver la bonne couleur',
  levels: MAGIC_LEVELS.map((l) => l.label),
  generate(level, rng) {
    const { kind, numbers } = MAGIC_LEVELS[level - 1];
    const drawing = pick(rng, MAGIC_DRAWINGS);
    const legend = numbers.map((n, i) => ({ ...MAGIC_COLORS[i], n }));
    const zones = drawing.zones.map((z) => {
      const c = z.c % numbers.length;
      return { d: z.d, at: z.at, c, label: magicLabel(kind, numbers[c], rng) };
    });
    const plain = kind === 'chiffre';
    return {
      key: `magique:${level}:${drawing.name}:${zones.map((z) => z.label).join(',')}`,
      interaction: 'colorby',
      text: plain ? 'Colorie chaque zone avec la couleur de son nombre.' : 'Calcule, puis colorie avec la couleur du résultat.',
      instruction: plain
        ? 'Colorie chaque zone avec la couleur de son nombre. Touche une couleur en bas, puis les zones.'
        : 'Calcule ce qui est écrit dans chaque zone, puis colorie avec la couleur du résultat. Touche une couleur en bas, puis les zones.',
      short: { key: `magique:${kind}`, text: plain ? 'La couleur de chaque nombre !' : 'Calcule, puis colorie !' },
      stage: { type: 'colorby', zones, legend, name: drawing.name },
      choices: [],
      answer: null,
      success: { speak: `Bravo, c’est ${drawing.name} !` },
    };
  },
};

// ---------------------------------------------------------------- Les points à relier

// Formes dessinées par des points (dans un carré 0–100), dans l'ordre du tracé.
export const DOT_SHAPES = [
  { name: 'une maison', points: [[20, 90], [20, 45], [50, 15], [80, 45], [80, 90]], close: true },
  { name: 'un bateau', points: [[10, 60], [90, 60], [75, 85], [25, 85]], close: true },
  { name: 'une étoile', points: [[50, 8], [61, 38], [94, 38], [67, 58], [78, 90], [50, 70], [22, 90], [33, 58], [6, 38], [39, 38]], close: true },
  { name: 'un cœur', points: [[50, 30], [62, 14], [80, 12], [92, 26], [90, 46], [50, 88], [10, 46], [8, 26], [20, 12], [38, 14]], close: true },
  { name: 'un poisson', points: [[10, 50], [30, 30], [55, 25], [75, 40], [92, 25], [92, 75], [75, 60], [55, 75], [30, 70]], close: true },
  { name: 'une fusée', points: [[50, 5], [64, 25], [64, 65], [78, 85], [62, 80], [50, 92], [38, 80], [22, 85], [36, 65], [36, 25]], close: true },
  { name: 'un sapin', points: [[50, 6], [70, 32], [60, 32], [80, 58], [66, 58], [88, 84], [56, 84], [56, 96], [44, 96], [44, 84], [12, 84], [34, 58], [20, 58], [40, 32], [30, 32]], close: true },
  { name: 'un diamant', points: [[30, 20], [70, 20], [90, 40], [50, 92], [10, 40]], close: true },
  // 4 ou 5 points (le niveau « De 1 à 5 », et les suites de 2 en 2, de 5 en 5… pour 5 points)
  { name: 'un cerf-volant', points: [[50, 6], [80, 38], [50, 94], [20, 38]], close: true },
  { name: 'une montagne', points: [[6, 88], [34, 26], [52, 54], [72, 12], [94, 88]], close: true },
  { name: 'un crayon', points: [[8, 42], [70, 42], [92, 50], [70, 58], [8, 58]], close: true },
  { name: 'une botte', points: [[30, 8], [56, 8], [56, 60], [92, 90], [30, 90]], close: true },
  { name: 'un drapeau', points: [[22, 92], [22, 8], [84, 28], [36, 46], [36, 92]], close: true },
  { name: 'un verre', points: [[24, 10], [76, 10], [66, 92], [34, 92]], close: true },
  // ceux-là se croisent, comme on les dessine d'un seul trait
  { name: 'un sablier', points: [[20, 8], [80, 8], [20, 92], [80, 92]], close: true },
  { name: 'un poisson', points: [[8, 50], [58, 22], [92, 76], [92, 24], [58, 78]], close: true },
  { name: 'une étoile', points: [[50, 6], [76, 88], [8, 37], [92, 37], [24, 88]], close: true },
  // de 6 à 10 points
  { name: 'une tente', points: [[50, 8], [92, 88], [62, 88], [50, 62], [38, 88], [8, 88]], close: true },
  { name: 'un éclair', points: [[62, 6], [20, 56], [44, 56], [32, 94], [82, 40], [58, 40]], close: true },
  { name: 'une flèche', points: [[50, 6], [88, 46], [62, 46], [62, 94], [38, 94], [38, 46], [12, 46]], close: true },
  { name: 'un pantalon', points: [[20, 8], [80, 8], [88, 92], [60, 92], [50, 40], [40, 92], [12, 92]], close: true },
  { name: 'une couronne', points: [[10, 86], [10, 22], [30, 50], [50, 14], [70, 50], [90, 22], [90, 86]], close: true },
  { name: 'un sapin', points: [[50, 6], [84, 72], [58, 72], [58, 92], [42, 92], [42, 72], [16, 72]], close: true },
  { name: 'un chapeau', points: [[8, 84], [92, 84], [92, 70], [74, 70], [74, 12], [26, 12], [26, 70], [8, 70]], close: true },
  { name: 'une bouteille', points: [[40, 6], [60, 6], [60, 24], [74, 40], [74, 94], [26, 94], [26, 40], [40, 24]], close: true },
  { name: 'un chat', points: [[14, 8], [30, 34], [70, 34], [86, 8], [86, 52], [76, 76], [50, 90], [24, 76], [14, 52]], close: true },
  { name: 'une chaise', points: [[22, 6], [36, 6], [36, 48], [80, 48], [80, 92], [66, 92], [66, 64], [36, 64], [36, 92], [22, 92]], close: true },
  { name: 'une glace', points: [[50, 94], [32, 54], [16, 46], [12, 30], [26, 12], [50, 6], [74, 12], [88, 30], [84, 46], [68, 54]], close: true },
  // de 11 à 15 points (le niveau « De 1 à 15 »)
  { name: 'un tee-shirt', points: [[38, 8], [50, 18], [62, 8], [92, 26], [84, 48], [72, 40], [72, 92], [28, 92], [28, 40], [16, 48], [8, 26]], close: true },
  { name: 'un champignon', points: [[8, 52], [14, 30], [32, 12], [50, 8], [68, 12], [86, 30], [92, 52], [62, 52], [64, 92], [36, 92], [38, 52]], close: true },
  { name: 'un lapin', points: [[26, 6], [40, 6], [42, 40], [58, 40], [60, 6], [74, 6], [76, 46], [86, 64], [78, 86], [50, 94], [22, 86], [14, 64], [24, 46]], close: true },
  { name: 'la tour Eiffel', points: [[50, 6], [56, 28], [62, 50], [72, 72], [92, 94], [70, 94], [64, 82], [50, 72], [36, 82], [30, 94], [8, 94], [28, 72], [38, 50], [44, 28]], close: true },
  { name: 'une voiture', points: [[8, 74], [8, 52], [24, 48], [36, 28], [66, 28], [80, 48], [92, 54], [92, 74], [76, 74], [68, 60], [60, 74], [40, 74], [32, 60], [24, 74]], close: true },
  { name: 'un château', points: [[10, 92], [10, 20], [26, 20], [26, 34], [42, 34], [42, 20], [58, 20], [58, 34], [74, 34], [74, 20], [90, 20], [90, 92], [60, 92], [50, 70], [40, 92]], close: true },
  { name: 'un avion', points: [[50, 6], [58, 20], [58, 40], [92, 56], [92, 70], [58, 62], [58, 80], [72, 92], [28, 92], [42, 80], [42, 62], [8, 70], [8, 56], [42, 40], [42, 20]], close: true },
];
const DOT_LEVELS = [
  { label: 'De 1 à 5', min: 4, max: 5, step: 1 },
  { label: 'De 1 à 10', min: 6, max: 10, step: 1 },
  { label: 'De 1 à 15', min: 9, max: 15, step: 1 },
  { label: 'De 2 en 2', min: 5, max: 10, step: 2 },
  { label: 'De 5 en 5', min: 5, max: 10, step: 5 },
  { label: 'De 10 en 10', min: 5, max: 10, step: 10 },
  { label: 'À rebours', min: 5, max: 10, step: -1 },
];

export const pointsRelier = {
  id: 'points',
  domain: 'jeux',
  title: 'Les points à relier',
  icon: '✨',
  skill: 'Réciter la suite des nombres (de 1 en 1, de 2 en 2, de 5 en 5…) pour faire apparaître un dessin',
  levels: DOT_LEVELS.map((l) => l.label),
  generate(level, rng) {
    const { min, max, step } = DOT_LEVELS[level - 1];
    const shape = pick(rng, DOT_SHAPES.filter((sh) => sh.points.length >= min && sh.points.length <= max));
    const n = shape.points.length;
    const labels = step === -1
      ? Array.from({ length: n }, (_, i) => n - i)
      : Array.from({ length: n }, (_, i) => (step === 1 ? i + 1 : (i + 1) * step));
    return {
      key: `points:${level}:${shape.name}`,
      interaction: 'dots',
      text: step === -1 ? `Relie les points en comptant à rebours, de ${labels[0]} à 1.` : `Relie les points dans l’ordre, de ${labels[0]} à ${labels.at(-1)}.`,
      instruction: step === -1
        ? `Relie les points en comptant à rebours, de ${labels[0]} à 1. Un dessin va apparaître !`
        : `Relie les points dans l’ordre, de ${labels[0]} à ${labels.at(-1)}. Un dessin va apparaître !`,
      short: { key: `points:${step}`, text: `De ${labels[0]} à ${labels.at(-1)} !` },
      stage: { type: 'dots', points: shape.points, labels, close: shape.close, name: shape.name },
      choices: [],
      answer: null,
      success: { speak: `Bravo, c’est ${shape.name} !` },
    };
  },
};

export const JEUX_GAMES = [puzzle, memory, coloriageMagique, pointsRelier];
