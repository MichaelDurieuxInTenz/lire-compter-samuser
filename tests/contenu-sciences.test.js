// Plus de questions dans les niveaux de sciences qui en avaient trop peu (2 à 9) : le vivant, la matière,
// l'électricité, les objets, les mélanges, la météo, le corps humain, les animaux et leur milieu.
// Chaque niveau enrichi a au moins 12 questions différentes (même clé ou même sujet = même question,
// comme dans app/js/repetition.js), une seule bonne réponse, des listes sans doublon.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGame } from '../app/js/games/index.js';
import { createRng } from '../app/js/random.js';
import { marques, sujetQuestion } from '../app/js/repetition.js';
import { CYCLES, GROWTH, NATURE, PLANT_CASES, WATER_FORMS } from '../app/js/games/sciences.js';
import { BUILDS, CHOOSE, DANGERS, LIFTING, PARTS, POWER, SAVING, SWITCH_FACTS, THEN_NOW } from '../app/js/games/techno.js';
import {
  EVAPORATE, EXPERIMENTS, INSOLUBLE, KITCHEN, MIXES, OIL, SEPARATE, SETTLE, SOLUBLE, STEP_ASKS,
} from '../app/js/games/planete.js';
import { CLOTHES, RAIN_FACTS, RAINBOW_FACTS, STORM_FACTS, STORM_PAIRS, WEATHER } from '../app/js/games/ciel.js';
import { BONE_RIDDLES, BONES, BREATHING, CLUES, FOOD_PATH, NEED_CASES } from '../app/js/games/corps.js';

const ctx = { name: 'Léa', season: 'automne' };

/** Les niveaux enrichis : [jeu, niveau]. */
const ENRICHIS = [
  ['matiere', 2], ['matiere', 8],
  ['vivant', 4], ['vivant', 5], ['vivant', 6],
  ['electricite', 2], ['electricite', 3], ['electricite', 4], ['electricite', 5], ['electricite', 6], ['electricite', 7],
  ['electricite', 8],
  ['objets', 3], ['objets', 4], ['objets', 7], ['objets', 8],
  ['melanges', 1], ['melanges', 2], ['melanges', 4], ['melanges', 5], ['melanges', 6], ['melanges', 7], ['melanges', 8],
  ['melanges', 9],
  ['meteo', 1], ['meteo', 2], ['meteo', 3], ['meteo', 5], ['meteo', 6],
  ['corps', 1], ['corps', 3], ['corps', 4], ['corps', 5], ['corps', 9],
  ['milieux', 3],
];
const MINIMUM = 12;

/** `runs` questions tirées à ce niveau. */
function draw(id, level, runs = 400, seed = 4242) {
  const rng = createRng(seed + level);
  const game = findGame(id);
  return Array.from({ length: runs }, (_, i) => game.generate(level, rng, i, ctx));
}

const unique = (list, label) => assert.equal(new Set(list).size, list.length, `doublon dans ${label}`);
const askOf = (it) => (Array.isArray(it.ask) ? it.ask.join(' ') : it.ask);

test('sciences enrichies : au moins 12 questions différentes par niveau (clé et sujet)', () => {
  for (const [id, level] of ENRICHIS) {
    const cles = new Set();
    const sujets = new Set();
    for (const q of draw(id, level)) {
      const [cle, sujet] = marques(q);
      cles.add(cle);
      sujets.add(sujet);
    }
    const n = Math.min(cles.size, sujets.size);
    assert.ok(n >= MINIMUM, `${id} niveau ${level} : ${n} questions différentes`);
  }
});

test('sciences enrichies : une clé désigne une seule question, une seule bonne réponse parmi des choix différents', () => {
  for (const [id, level] of ENRICHIS) {
    const sujetDe = new Map();
    for (const q of draw(id, level, 300, 99)) {
      const sujet = sujetQuestion(q);
      if (sujetDe.has(q.key)) assert.equal(sujetDe.get(q.key), sujet, `${id} niveau ${level} : clé ${q.key} pour deux questions`);
      sujetDe.set(q.key, sujet);
      if (q.interaction === 'order' || q.interaction === 'body') continue;
      const values = q.choices.map((c) => c.value);
      assert.equal(new Set(values).size, values.length, `choix en double : ${q.key}`);
      assert.equal(values.filter((v) => v === q.answer).length, 1, `bonne réponse absente ou en double : ${q.key}`);
    }
  }
});

test('le vivant et la matière : listes sans doublon, réponses justes', () => {
  unique(GROWTH.map((g) => g.from), 'GROWTH');
  unique(CYCLES.map((c) => c.title), 'CYCLES');
  for (const c of CYCLES) unique(c.steps.map(([e]) => e), c.title);
  unique(PLANT_CASES.map((p) => p.text), 'PLANT_CASES');
  for (const p of PLANT_CASES) assert.equal(p.grows, !p.why, p.text);
  unique(WATER_FORMS.map((w) => w.text), 'WATER_FORMS');
  unique(NATURE.map((n) => n.text), 'NATURE');
  for (const n of NATURE) {
    assert.ok(!n.others.includes(n.answer), n.text);
    unique(n.others, n.text);
  }
  const fact = (text) => [...WATER_FORMS, ...NATURE].find((w) => w.text === text).answer;
  assert.equal(fact('Le glacier, en haut de la montagne, c’est…'), 'de la glace');
  assert.equal(fact('La soupe bout : une partie de son eau devient…'), 'de la vapeur');
  assert.equal(fact('Le brouillard, c’est…'), 'un nuage tout bas');
  assert.equal(fact('L’eau de la mer est…'), 'salée');
  // ce qui sort d'un œuf : jamais proposé pour un autre œuf (la chenille à côté du poussin)
  for (const q of draw('vivant', 4, 300)) {
    if (!q.text.includes('l’œuf')) continue;
    assert.equal(q.choices.filter((c) => ['le poussin', 'la chenille'].includes(c.value)).length, 1, q.key);
  }
});

test('l’électricité et les objets : listes sans doublon, réponses justes', () => {
  unique(POWER.map((p) => p.text), 'POWER');
  unique(DANGERS.map((d) => d.text), 'DANGERS');
  unique(SAVING.map((s) => s.text), 'SAVING');
  unique(PARTS.flatMap((p) => [p.ask, ...p.more.map((m) => m.ask)]), 'PARTS');
  unique(SWITCH_FACTS.map((f) => f.text), 'SWITCH_FACTS');
  assert.equal(POWER.find((p) => p.text.startsWith('Le congélateur')).answer, 'prise');
  assert.equal(POWER.find((p) => p.text.startsWith('Le thermomètre')).answer, 'pile');
  assert.equal(DANGERS.find((d) => d.text.includes('grille-pain')).answer, 'faux');
  assert.equal(SAVING.find((s) => s.text.includes('toute la nuit')).saves, false);
  // l'interrupteur fermé ne suffit pas : un fil débranché et l'ampoule reste éteinte
  for (const q of draw('electricite', 8, 300)) {
    if (q.key.startsWith('electricite:interrupteur:panne:')) assert.equal(q.answer, 'non', q.key);
  }
  unique(THEN_NOW.map((p) => p.now.name), 'THEN_NOW');
  unique(BUILDS.map((b) => b.title), 'BUILDS');
  for (const b of BUILDS) unique(b.steps.map(([e]) => e), b.title);
  unique(CHOOSE.map((c) => c.text), 'CHOOSE');
  unique(LIFTING.map((l) => l.text), 'LIFTING');
  for (const l of LIFTING) assert.ok(!l.others.includes(l.answer), l.text);
  // « on voyageait à cheval » : ni le train ni l'avion à côté de la voiture
  for (const q of draw('objets', 3, 300)) {
    if (q.text.includes('à cheval')) assert.ok(!q.choices.some((c) => ['le train à grande vitesse', 'l’avion'].includes(c.value)), q.key);
  }
});

test('les mélanges : listes sans doublon, réponses justes', () => {
  unique([...SOLUBLE, ...INSOLUBLE].map((s) => s.part), 'SOLUBLE et INSOLUBLE');
  unique(MIXES.map((m) => m.mix), 'MIXES');
  unique(SETTLE.map((s) => s.part), 'SETTLE');
  unique(EXPERIMENTS.map((e) => e.title), 'EXPERIMENTS');
  unique(STEP_ASKS.map((s) => s.ask), 'STEP_ASKS');
  for (const [label, list] of [['OIL', OIL], ['EVAPORATE', EVAPORATE], ['KITCHEN', KITCHEN], ['SEPARATE', SEPARATE]]) {
    unique(list.map(askOf), label);
  }
  assert.equal(SETTLE.find((s) => s.part === 'des morceaux de bois').where, 'en haut');
  assert.equal(SETTLE.find((s) => s.part === 'de la farine').where, 'au fond');
  assert.ok(INSOLUBLE.some((s) => s.part === 'de la farine'), 'la farine ne se dissout pas');
  assert.equal(SEPARATE.find((s) => askOf(s).includes('sel et du sable')).answer, 'de l’eau');
});

test('la météo : listes sans doublon, réponses justes', () => {
  unique(WEATHER.flatMap((w) => [w.says, w.also]), 'WEATHER');
  for (const c of CLOTHES) {
    unique(c.good.map((g) => g.name), c.text);
    assert.ok(!c.good.some((g) => c.bad.some((b) => b.name === g.name || b.emoji === g.emoji)), c.text);
  }
  unique([...RAIN_FACTS, ...STORM_FACTS, ...RAINBOW_FACTS].map((f) => f.text), 'faits météo');
  unique(STORM_PAIRS.map((p) => p.text), 'STORM_PAIRS');
  const fact = (text) => [...RAIN_FACTS, ...STORM_FACTS, ...RAINBOW_FACTS].find((f) => f.text === text).answer;
  assert.equal(fact('Dans une voiture bien fermée, on est à l’abri de la foudre.'), 'vrai');
  assert.equal(fact('Le noir est une des couleurs de l’arc-en-ciel.'), 'faux');
  assert.equal(fact('La neige tombe quand il fait très chaud.'), 'faux');
});

test('le corps humain et les milieux : listes sans doublon, réponses justes', () => {
  unique(BONE_RIDDLES.map((r) => r.text), 'BONE_RIDDLES');
  for (const r of BONE_RIDDLES) assert.ok(BONES[r.id], r.text);
  unique(NEED_CASES.map((c) => c.text), 'NEED_CASES');
  unique(BREATHING.map((b) => `${b.text} ${b.answer}`), 'BREATHING');
  unique(FOOD_PATH.map((f) => f.text), 'FOOD_PATH');
  unique(CLUES.map((c) => c.text), 'CLUES');
  assert.equal(FOOD_PATH.find((f) => f.text.startsWith('La digestion commence')).answer, 'bouche');
  assert.equal(FOOD_PATH.find((f) => f.text.includes('très acide')).answer, 'estomac');
  assert.equal(BREATHING.find((b) => b.text.startsWith('Combien as-tu de poumons')).answer, 'deux');
  assert.equal(CLUES.find((c) => c.emoji === '🥕').answer.name, 'un lapin');
  // les grandes personnes : le plus âgé de trois est toujours le dernier dans l'ordre de la vie
  for (const q of draw('corps', 4, 300)) {
    if (q.text === 'Qui est le plus âgé ?') assert.notEqual(q.answer, 'le bébé', q.key);
    if (q.text === 'Qui est le plus jeune ?') assert.notEqual(q.answer, 'la personne âgée', q.key);
  }
});
