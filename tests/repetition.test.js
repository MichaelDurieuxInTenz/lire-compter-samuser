import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../app/js/games/index.js';
import { createRng } from '../app/js/random.js';
import { historique, marques, noter, questionSuivante, sujetQuestion } from '../app/js/repetition.js';

const formes = GAMES.find((g) => g.id === 'formes');
const ctx = { name: 'Léa', season: 'automne' };

/** Une partie comme dans l'app (main.js, newQuestion) : questions tirées une à une. */
function partie(game, level, rng, total = 10) {
  const h = historique();
  const questions = [];
  for (let index = 0; index < total; index++) {
    const q = questionSuivante(() => game.generate(level, rng, index, ctx), h);
    noter(h, q);
    questions.push(q);
  }
  return questions;
}

/** Les questions déjà posées plus tôt dans la partie (même clé ou même sujet), avec leur rang. */
function doublons(questions) {
  const vues = new Set();
  return questions.map((q, index) => ({ q, index })).filter(({ q }) => {
    const m = marques(q);
    const deja = m.some((x) => vues.has(x));
    m.forEach((x) => vues.add(x));
    return deja;
  });
}

test('même question : le même objet, quels que soient l’ordre des formes proposées et leurs couleurs', () => {
  const rng = createRng(3);
  const parObjet = new Map();
  for (let i = 0; i < 300; i++) {
    const q = formes.generate(7, rng, i, ctx);
    if (!parObjet.has(q.stage.emoji)) parObjet.set(q.stage.emoji, new Set());
    parObjet.get(q.stage.emoji).add(sujetQuestion(q));
  }
  assert.ok(parObjet.size >= 15, `${parObjet.size} objets`);
  for (const [emoji, sujets] of parObjet) assert.equal(sujets.size, 1, emoji);
});

test('même question, sans dessin : la même bonne réponse ; les autres choix ne comptent pas, l’intrus si', () => {
  const tetard = (autre) => ({
    key: `vivant:${autre}`, text: 'Que devient le têtard ?', stage: { type: 'none' }, answer: 'la grenouille',
    choices: [{ value: 'la grenouille', label: '🐸' }, { value: autre, label: '❔' }],
  });
  assert.equal(sujetQuestion(tetard('la pousse')), sujetQuestion(tetard('le papillon')));
  const intrus = (label) => ({
    key: 'intrus', text: 'Touche l’intrus.', stage: { type: 'none' }, answer: 'intrus',
    choices: [{ value: 'x', label: '🐶' }, { value: 'intrus', label }, { value: 'y', label: '🐱' }],
  });
  assert.notEqual(sujetQuestion(intrus('🍎')), sujetQuestion(intrus('🍌')));
  // des mots à remettre en ordre : la même phrase, les étiquettes mélangées autrement
  const phrase = (items) => ({ key: 'p', interaction: 'order', text: 'Remets les mots dans l’ordre.', items });
  const mots = [{ value: 0, label: 'I' }, { value: 1, label: 'am' }, { value: 2, label: 'happy' }];
  assert.equal(sujetQuestion(phrase(mots)), sujetQuestion(phrase([mots[2], mots[0], mots[1]])));
});

test('question suivante : jamais une question déjà posée, tant que le jeu en a d’autres', () => {
  const q = (key, answer = key) => ({ key, text: 'Combien ?', stage: { type: 'dots', n: answer }, answer });
  const h = historique();
  noter(h, q('a'));
  noter(h, q('b'));
  const suite = [q('a'), q('b'), q('a'), q('c')];
  assert.equal(questionSuivante((i) => suite[i], h).key, 'c');
  // une autre clé, mais la même question (le même dessin, la même réponse) : écartée aussi
  const memeSujet = [q('a2', 'a'), q('d')];
  assert.equal(questionSuivante((i) => memeSujet[i], h).key, 'd');
  // plus rien de nouveau : celle posée il y a le plus longtemps, pas la dernière
  assert.equal(questionSuivante((i) => [q('b'), q('a')][i % 2], h, 4).key, 'a');
  assert.equal(questionSuivante(() => q('b'), h, 3).key, 'b', 'le jeu n’a que celle-là');
  // posées il y a au moins 4 questions : toutes aussi bonnes, la première tirée (le hasard du jeu)
  for (const k of ['c', 'd', 'e', 'f']) noter(h, q(k));
  assert.equal(questionSuivante((i) => [q('b'), q('a')][i % 2], h, 4).key, 'b');
});

test('les formes : pas deux fois le même objet, ni la même devinette, dans une partie', () => {
  const rng = createRng(11);
  for (let s = 0; s < 50; s++) {
    const objets = partie(formes, 7, rng);
    assert.deepEqual(doublons(objets).map(({ q }) => q.key), []);
    assert.equal(new Set(objets.map((q) => q.stage.emoji)).size, 10);
    // 9 devinettes : toutes avant d'en revoir une, et pas une des 4 dernières
    const devinettes = partie(formes, 8, rng);
    assert.equal(new Set(devinettes.slice(0, 9).map((q) => q.text)).size, 9);
    assert.ok(devinettes.slice(0, 6).some((q) => q.text === devinettes[9].text));
  }
});

test('tous les jeux : une question ne revient que si le niveau en a trop peu, et jamais aussitôt', () => {
  const rng = createRng(5);
  const tropPeu = [];
  for (const game of GAMES) {
    for (let level = 1; level <= (game.levels?.length || 1); level++) {
      const total = Math.min(10, game.questions || 10);
      const parties = [partie(game, level, rng, total), partie(game, level, rng, total)];
      for (const p of parties) {
        for (let i = 1; i < p.length; i++) {
          const [avant, apres] = [marques(p[i - 1]), marques(p[i])];
          assert.ok(!apres.some((m) => avant.includes(m)) || p.every((q) => q.key === p[0].key), `${game.id} niveau ${level} : « ${p[i].key} » deux fois de suite`);
        }
      }
      const repetee = parties.map((p) => doublons(p)[0]).find(Boolean);
      if (!repetee) continue;
      // combien de questions différentes ce niveau propose-t-il à ce rang ? (des jeux alternent
      // deux sortes de questions : « colorie le quart » au 1er, 3e, 5e… rang, « touche… » entre les deux)
      const cles = new Set();
      const sujets = new Set();
      for (let i = 0; i < 200; i++) {
        const [cle, sujet] = marques(game.generate(level, rng, repetee.index, ctx));
        cles.add(cle);
        sujets.add(sujet);
      }
      const differentes = Math.min(cles.size, sujets.size);
      assert.ok(differentes < 12, `${game.id} niveau ${level} : « ${repetee.q.key} » revient, sur ${differentes} possibles`);
      tropPeu.push(`${game.id} ${level}`);
    }
  }
  assert.ok(tropPeu.length < 250, `${tropPeu.length} niveaux à moins de 12 questions`);
});
