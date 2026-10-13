// Plus de questions dans les jeux d'histoires : « Histoires lues » (niveaux 1 à 8), « Dans l'ordre »
// (images à remettre dans l'ordre, niveaux 1, 2, 3 et 7) et « Petits textes » (niveaux 1 à 10).
// Chaque niveau propose au moins 15 questions différentes (même clé ou même sujet : app/js/repetition.js),
// en toute saison, pour qu'une partie de 10 questions ne repose jamais la même ; une seule bonne réponse.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findGame } from '../app/js/games/index.js';
import { STORY_DATA } from '../app/js/games/histoires.js';
import { ORDER_STORIES } from '../app/js/games/comprendre.js';
import { TEXT_DATA } from '../app/js/games/textes.js';
import { createRng } from '../app/js/random.js';
import { historique, marques, noter, questionSuivante } from '../app/js/repetition.js';

const SAISONS = [undefined, 'noel', 'halloween', 'hiver', 'printemps', 'ete', 'automne'];

/** `runs` questions tirées à un niveau. */
function draws(id, level, ctx = { name: 'Léa' }, runs = 400) {
  const game = findGame(id);
  const rng = createRng(7300 + level);
  return Array.from({ length: runs }, (_, i) => game.generate(level, rng, i, ctx));
}

/** Nombre de questions différentes, comme l'app les compte (clé et sujet). */
function differentes(qs) {
  const cles = new Set();
  const sujets = new Set();
  for (const q of qs) {
    const [cle, sujet] = marques(q);
    cles.add(cle);
    sujets.add(sujet);
  }
  return Math.min(cles.size, sujets.size);
}

/** Choix multiple : la bonne réponse une seule fois, pas de doublon. */
function uneSeuleBonne(q) {
  const values = q.choices.map((c) => c.value);
  assert.equal(new Set(values).size, values.length, `${q.key} : choix en double`);
  assert.equal(new Set(q.choices.map((c) => c.label)).size, values.length, `${q.key} : libellés en double`);
  assert.equal(values.filter((v) => v === q.answer).length, 1, `${q.key} : réponse absente ou en double`);
}

// [jeu, niveaux enrichis]
const NIVEAUX = [
  ['histoires', [1, 2, 3, 4, 5, 6, 7, 8]],
  ['ordre-histoire', [1, 2, 3, 7]],
  ['petits-textes', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
];
const MIN = 15;

test('histoires : au moins 15 questions différentes par niveau enrichi, en toute saison', () => {
  for (const [id, levels] of NIVEAUX) {
    for (const level of levels) {
      for (const season of SAISONS) {
        const n = differentes(draws(id, level, { name: 'Léa', season }));
        assert.ok(n >= MIN, `${id} niveau ${level} (${season ?? 'sans saison'}) : ${n} questions différentes`);
      }
    }
  }
});

test('histoires : une partie de 10 questions ne repose jamais la même', () => {
  for (const [id, levels] of NIVEAUX) {
    const game = findGame(id);
    for (const level of levels) {
      const rng = createRng(90 + level);
      for (let p = 0; p < 40; p++) {
        const h = historique();
        const vues = new Set();
        for (let i = 0; i < 10; i++) {
          const q = questionSuivante(() => game.generate(level, rng, i, { name: 'Léa', season: 'automne' }), h);
          noter(h, q);
          const m = marques(q);
          assert.ok(!m.some((x) => vues.has(x)), `${id} niveau ${level} : « ${q.key} » reposée`);
          m.forEach((x) => vues.add(x));
        }
      }
    }
  }
});

test('histoires : chaque question tirée a une seule bonne réponse, ou des images à ranger', () => {
  for (const [id, levels] of NIVEAUX) {
    for (const level of levels) {
      for (const q of draws(id, level, { name: 'Léa', season: 'automne' }, 200)) {
        assert.ok(q.key, `${id} niveau ${level} : clé absente`);
        if (q.interaction === 'order') {
          const values = q.items.map((it) => it.value);
          assert.deepEqual([...values].sort((a, b) => a - b), values.map((_, i) => i), q.key);
          assert.ok(!values.every((v, i) => v === i), `${q.key} : déjà dans l’ordre`);
          assert.equal(new Set(q.items.map((it) => it.emoji)).size, q.items.length, `${q.key} : image en double`);
        } else {
          uneSeuleBonne(q);
        }
      }
    }
  }
});

// ---------------------------------------------------------------- Les données

/** Une phrase lue par la voix : majuscule, ponctuation finale, apostrophe typographique, espaces simples. */
function phraseSoignee(s, where) {
  assert.ok(/^[«A-ZÀ-ÝŒ0-9]/u.test(s), `${where} : « ${s} » (majuscule)`);
  assert.ok(/[.!?…»]$/u.test(s), `${where} : « ${s} » (ponctuation finale)`);
  assert.ok(!s.includes("'") && !/ {2}/.test(s) && s.trim() === s, `${where} : typographie de « ${s} »`);
}

test('histoires lues : identifiants et titres uniques, une bonne réponse, des phrases soignées', () => {
  const ids = STORY_DATA.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiant en double');
  const titles = STORY_DATA.map((s) => s.title);
  assert.equal(new Set(titles).size, titles.length, 'titre en double (la clé d’une question est le titre)');
  const longueur = { 1: [3, 3], 2: [4, 4], 3: [4, 4], 4: [4, 4], 5: [6, 6], 6: [4, 4], 7: [4, 4], 8: [3, 4] };
  for (const s of STORY_DATA) {
    const [min, max] = longueur[s.level];
    assert.ok(s.sentences.length >= min && s.sentences.length <= max, `${s.title} : ${s.sentences.length} phrases`);
    assert.ok(s.sentences.join(' ').length <= 230, `${s.title} : trop longue`);
    for (const sentence of s.sentences) phraseSoignee(sentence, s.title);
    if (s.level === 6) {
      assert.equal(s.steps.length, 3, s.title);
      assert.equal(new Set(s.steps.map(([emoji]) => emoji)).size, 3, `${s.title} : images en double`);
      assert.equal(new Set(s.steps.map(([, label]) => label)).size, 3, `${s.title} : légendes en double`);
      continue;
    }
    phraseSoignee(s.question, s.title);
    const answers = [s.answer, ...s.others];
    assert.equal(answers.length, 3, s.title);
    assert.equal(new Set(answers).size, 3, `${s.title} : réponses en double`);
    // niveau 1 : réponses en images (un emoji chacune) ; ensuite, des mots courts
    if (s.level === 1) for (const a of answers) assert.ok(/^\p{Extended_Pictographic}/u.test(a) && [...new Intl.Segmenter().segment(a)].length === 1, `${s.title} : « ${a} »`);
    else for (const a of answers) for (const w of a.split(' ')) assert.ok(w.length <= 11, `${s.title} : mot trop long « ${w} »`);
    if (s.level === 7) assert.match(s.question, /^Que (veut dire|sont des) « .+ » \?$/u, s.title);
    if (s.level === 8) {
      assert.deepEqual([...answers].sort(), ['faux', 'on ne sait pas', 'vrai'], s.title);
      assert.ok(s.question.endsWith('.'), `${s.title} : la phrase à juger`);
    } else {
      assert.ok(s.question.endsWith(' ?'), `${s.title} : « ${s.question} »`);
    }
  }
  // assez d'histoires sans saison à chaque niveau, et des trois réponses au niveau 8
  for (let level = 1; level <= 8; level++) {
    const n = STORY_DATA.filter((s) => s.level === level && !s.season).length;
    assert.ok(n >= MIN, `niveau ${level} : ${n} histoires`);
  }
  const vraiFaux = STORY_DATA.filter((s) => s.level === 8).map((s) => s.answer);
  for (const a of ['vrai', 'faux', 'on ne sait pas']) assert.ok(vraiFaux.filter((x) => x === a).length >= 4, `niveau 8 : trop peu de « ${a} »`);
});

test('dans l’ordre : identifiants uniques, assez d’histoires claires pour les petits', () => {
  const ids = ORDER_STORIES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiant en double');
  const count = (f) => ORDER_STORIES.filter(f).length;
  assert.ok(count((s) => s.steps.length === 3 && s.theme === 'vie') >= MIN, 'niveau 1');
  assert.ok(count((s) => s.steps.length === 3 && s.theme !== 'vie') >= MIN, 'niveau 2');
  assert.ok(count((s) => s.steps.length === 4 && s.clair) >= MIN, 'niveau 3');
  assert.ok(count((s) => s.steps.length === 5) >= MIN, 'niveau 7');
  // sans légende (niveaux 1 à 3), les images seules donnent l'ordre
  for (const s of ORDER_STORIES.filter((x) => x.steps.length === 3)) assert.ok(s.clair, s.id);
  for (const s of ORDER_STORIES) for (const [, sentence] of s.steps) phraseSoignee(sentence, s.id);
});

test('petits textes : titres uniques, une bonne réponse parmi 3, questions de la compétence du niveau', () => {
  const titles = TEXT_DATA.map((t) => t.title);
  assert.equal(new Set(titles).size, titles.length, 'titre en double (la clé d’une question est le titre)');
  const max = [0, 80, 140, 220, 220, 220, 220, 220, 220, 220, 220];
  for (const t of TEXT_DATA) {
    assert.ok(t.text.length <= max[t.level], `${t.title} : texte trop long (${t.text.length})`);
    assert.ok(!t.text.includes("'") && !/ {2}/.test(t.text), `${t.title} : typographie`);
    assert.ok(t.questions.length >= 2, `${t.title} : au moins deux questions`);
    const questions = t.questions.map(([q]) => q);
    assert.equal(new Set(questions).size, questions.length, `${t.title} : question en double`);
    for (const [question, ...answers] of t.questions) {
      phraseSoignee(question, t.title);
      assert.equal(answers.length, 3, question);
      assert.equal(new Set(answers).size, 3, `${t.title} : « ${question} » réponses en double`);
      for (const a of answers) for (const w of a.split(' ')) assert.ok(w.length <= 11, `${t.title} : mot trop long « ${w} »`);
      if (t.level >= 7) assert.ok(question.endsWith(' ?'), question);
      if (t.level === 9) assert.ok(question.startsWith('Pourquoi '), question);
    }
    // niveau 6 : le texte est montré sans titre, et le titre est une des réponses
    if (t.level === 6) assert.ok(t.questions.some(([q, a]) => q === 'Quel est le meilleur titre ?' && a === t.title), t.title);
    if (t.level === 10) assert.ok(questions.some((q) => q.startsWith('Comment se sent')), t.title);
  }
  for (let level = 1; level <= 10; level++) {
    const n = TEXT_DATA.filter((t) => t.level === level && !t.season).length;
    assert.ok(n >= MIN, `niveau ${level} : ${n} textes`);
  }
});

test('histoires : le prénom de l’enfant ne change rien (aucun prénom en dur à remplacer)', () => {
  for (const [id, levels] of NIVEAUX) {
    for (const level of levels) {
      const a = draws(id, level, { name: 'Léa', season: 'ete' }, 30).map((q) => JSON.stringify(q));
      const b = draws(id, level, { name: 'Maximilien', season: 'ete' }, 30).map((q) => JSON.stringify(q));
      assert.deepEqual(a, b, `${id} niveau ${level}`);
    }
  }
});

test('histoires : les images viennent de la police de secours de l’app (scripts/emoji/emoji.txt)', () => {
  const liste = new Set(readFileSync(new URL('../scripts/emoji/emoji.txt', import.meta.url), 'utf8').trim().split('\n'));
  const segmenter = new Intl.Segmenter('fr', { granularity: 'grapheme' });
  const emojiDe = (t) => [...segmenter.segment(String(t))].map((s) => s.segment).filter((g) => /\p{Extended_Pictographic}/u.test(g));
  const textes = [
    ...STORY_DATA.flatMap((s) => [s.emoji, s.answer, ...(s.others || []), ...(s.steps || []).map(([e]) => e)]),
    ...ORDER_STORIES.flatMap((s) => s.steps.map(([e]) => e)),
  ];
  const absents = [...new Set(textes.flatMap(emojiDe))].filter((e) => !liste.has(e));
  assert.deepEqual(absents, []);
});
