// Plus de questions dans les petits niveaux de français : graphismes de « Écris au doigt », phrases
// de « Lis la phrase », textes et questions de « Lire et comprendre » (CM), textes de « Lire à voix
// haute ». Chaque niveau enrichi propose assez de questions différentes (même clé ou même sujet :
// app/js/repetition.js) pour qu'une partie ne repose pas deux fois la même ; une seule bonne réponse.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGame } from '../app/js/games/index.js';
import { createRng } from '../app/js/random.js';
import { marques } from '../app/js/repetition.js';
import { TEXTES_CM } from '../app/js/games/cm-lecture.js';
import { TEXTES_FLUENCE, fluenceTokens } from '../app/js/games/fluence.js';
import { GRAPHISMES } from '../app/js/data/ecriture-data.js';
import { DRAG_WORDS, tapQuestion } from '../app/js/a11y-jeux.js';
import { spoken } from '../scripts/voix/phrases.mjs';

const ctx = { name: 'Léa', season: 'automne' };

/** `runs` questions tirées à un niveau. */
function draws(id, level, runs = 400) {
  const game = findGame(id);
  const rng = createRng(4100 + level);
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

// [jeu, niveau, minimum de questions différentes]
const NIVEAUX = [
  ['ecrire', 1, 15],
  ['phrase', 1, 15], ['phrase', 2, 15],
  ['lecture-cm', 3, 15], ['lecture-cm', 4, 15], ['lecture-cm', 5, 15], ['lecture-cm', 6, 15], ['lecture-cm', 7, 15],
  ['lecture-cm', 8, 15],
  ['fluence', 7, 12], ['fluence', 8, 12], ['fluence', 9, 12],
];

test('français : assez de questions différentes dans chaque niveau enrichi', () => {
  for (const [id, level, min] of NIVEAUX) {
    const n = differentes(draws(id, level));
    assert.ok(n >= min, `${id} niveau ${level} : ${n} questions différentes (au moins ${min})`);
  }
});

// ---------------------------------------------------------------- Écris au doigt : graphismes

test('écris au doigt : des graphismes variés, consignes courtes, version « touche » sans geste de glisser', () => {
  assert.ok(Object.keys(GRAPHISMES).length >= 15);
  for (const id of ['creneaux', 'escalier', 'croix', 'quadrillage', 'soleil', 'spirale']) assert.ok(GRAPHISMES[id], id);
  const textes = Object.values(GRAPHISMES).map((g) => g.text);
  assert.equal(new Set(textes).size, textes.length, 'deux graphismes avec la même consigne');
  for (const [id, { text, help, strokes }] of Object.entries(GRAPHISMES)) {
    assert.match(text, /^Trace .+\.$/u, id);
    assert.ok(text.length <= 50, `${id} : consigne trop longue`);
    if (help) assert.match(help, /^D’abord .+\.$/u, id);
    assert.ok(strokes.length >= 1 && strokes.length <= 8, `${id} : ${strokes.length} traits`);
  }
  for (const q of draws('ecrire', 1, 200)) {
    assert.equal(q.stage.set, 'graphisme');
    const g = GRAPHISMES[q.stage.glyph];
    assert.equal(q.key, `ecrire:1:${q.stage.glyph}`);
    assert.equal(q.instruction, [g.text, g.help, 'Suis le chemin avec ton doigt, en partant du point vert.'].filter(Boolean).join(' '));
    const tap = tapQuestion(q);
    assert.doesNotMatch(tap.instruction, DRAG_WORDS, q.key);
  }
  // la spirale part du milieu et tourne vers la gauche ; le soleil : le rond d'abord, en partant du haut
  const [spirale] = GRAPHISMES.spirale.strokes;
  const centre = [spirale.reduce((s, p) => s + p[0], 0) / spirale.length, spirale.reduce((s, p) => s + p[1], 0) / spirale.length];
  assert.ok(Math.hypot(spirale[0][0] - centre[0], spirale[0][1] - centre[1]) < 10, 'la spirale part du milieu');
  assert.ok(spirale[1][0] < spirale[0][0], 'la spirale part vers la gauche');
  const [rond, ...rayons] = GRAPHISMES.soleil.strokes;
  assert.ok(rond[0][1] <= Math.min(...rond.map((p) => p[1])) + 0.5 && rond[1][0] < rond[0][0], 'le rond du soleil');
  for (const r of rayons) assert.ok(r.at(-1)[1] >= r[0][1], 'un rayon se trace du haut vers le bas');
});

// ---------------------------------------------------------------- Lis la phrase (niveaux 1 et 2)

test('lis la phrase : une image, une phrase ; jamais deux images pour la même phrase', () => {
  for (const level of [1, 2]) {
    const phraseDe = new Map();
    for (const q of draws('phrase', level)) {
      uneSeuleBonne(q);
      assert.equal(q.choices.length, 3, q.key);
      assert.equal(q.key, `phrase:${q.stage.emoji}`);
      if (phraseDe.has(q.key)) assert.equal(phraseDe.get(q.key), q.answer, q.key);
      phraseDe.set(q.key, q.answer);
      assert.match(q.answer, /^[A-ZÀÉ].*[.!]$/u, q.answer);
      assert.doesNotMatch(q.answer, /'/, `${q.answer} : apostrophe droite`);
    }
    const phrases = [...phraseDe.values()];
    assert.equal(new Set(phrases).size, phrases.length, `niveau ${level} : la même phrase pour deux images`);
    assert.ok(phraseDe.size >= 15, `niveau ${level} : ${phraseDe.size} images`);
    // phrases courtes au niveau 1, plus longues au niveau 2
    for (const p of phrases) {
      const mots = p.split(/\s+/).length;
      assert.ok(level === 1 ? mots <= 4 : mots >= 4 && mots <= 8, `niveau ${level} : « ${p} »`);
    }
  }
});

// ---------------------------------------------------------------- Lire et comprendre (CM)

const GENRES = ['recit', 'poeme', 'theatre', 'documentaire', 'lettre'];
const VF = ['vrai', 'faux', 'on ne sait pas'];
const texteDe = (t) => t.texte || t.lignes.join(' ');

test('lire et comprendre : des textes de chaque genre, et pour chaque question une seule bonne réponse', () => {
  const titres = TEXTES_CM.map((t) => t.titre);
  assert.equal(new Set(titres).size, titres.length, 'deux textes avec le même titre');
  for (const genre of GENRES) assert.ok(TEXTES_CM.filter((t) => t.genre === genre).length >= 2, genre);
  for (const t of TEXTES_CM) {
    assert.ok(GENRES.includes(t.genre), t.titre);
    assert.ok(Boolean(t.texte) !== Boolean(t.lignes), `${t.titre} : un texte ou des lignes`);
    const texte = texteDe(t);
    assert.ok(texte.length >= 200 && texte.length <= 460, `${t.titre} : ${texte.length} caractères`);
    assert.doesNotMatch(texte, /'/, `${t.titre} : apostrophe droite`);
    const vues = new Set();
    for (const [genre, question, reponse, autres] of t.questions) {
      const id = `${genre}:${question}`;
      assert.ok(!vues.has(id), `${t.titre} : question en double (${id})`);
      vues.add(id);
      if (genre === 'genre') {
        assert.equal(reponse, t.genre, t.titre);
        continue;
      }
      if (genre === 'vf') {
        assert.ok(VF.includes(reponse), `${t.titre} : ${question}`);
        continue;
      }
      assert.equal(autres.length, 2, `${t.titre} : ${question}`);
      assert.equal(new Set([reponse, ...autres]).size, 3, `${t.titre} : ${question} (réponses en double)`);
      for (const c of [reponse, ...autres]) assert.ok(c.length <= 45, `${t.titre} : « ${c} » trop long`);
      assert.match(question, /\?$/u, question);
      // « Qui dit : « … » ? » et « que veut dire « … » ? » : les mots cités sont dans le texte
      const cite = question.match(/« (.+) »/u)?.[1];
      if (genre === 'qui' || genre === 'mot') {
        assert.ok(cite, `${t.titre} : ${question}`);
        assert.ok(texte.toLowerCase().includes(cite.toLowerCase()), `${t.titre} : « ${cite} » n’est pas dans le texte`);
      }
    }
  }
});

test('lire et comprendre : chaque niveau tire des questions justes, sans nombre en chiffres dans ce qui est dit', () => {
  for (let level = 1; level <= 10; level++) {
    for (const q of draws('lecture-cm', level, 150)) {
      uneSeuleBonne(q);
      for (const part of spoken(q)) assert.doesNotMatch(part.text, /\d/, `${q.key} : ${part.text}`);
    }
  }
});

// ---------------------------------------------------------------- Lire à voix haute : textes

test('lire à voix haute : au moins 12 textes par niveau, de longueur comparable', () => {
  const ids = TEXTES_FLUENCE.map((t) => t.id);
  const titres = TEXTES_FLUENCE.map((t) => t.title);
  assert.equal(new Set(ids).size, ids.length, 'identifiant en double');
  assert.equal(new Set(titres).size, titres.length, 'titre en double');
  const bornes = { 7: [50, 62], 8: [90, 106], 9: [150, 165] };
  for (const [level, [min, max]] of Object.entries(bornes)) {
    const textes = TEXTES_FLUENCE.filter((t) => t.level === Number(level));
    assert.ok(textes.length >= 12, `niveau ${level} : ${textes.length} textes`);
    for (const t of textes) {
      const n = fluenceTokens(t.text).length;
      assert.ok(n >= min && n <= max, `${t.id} : ${n} mots (de ${min} à ${max})`);
      // pas de guillemets (ils seraient accrochés au mot d'avant), ni d'apostrophe droite, ni de double espace
      assert.doesNotMatch(t.text, /[«»"']|\s{2}/u, t.id);
      assert.match(t.text, /[.!?]$/u, t.id);
      // au niveau 7 (CP), des phrases courtes
      if (level === '7') {
        const phrases = t.text.split(/(?<=[.!?])\s+/u);
        assert.ok(n / phrases.length <= 7.5, `${t.id} : phrases trop longues pour le CP`);
      }
    }
  }
});
