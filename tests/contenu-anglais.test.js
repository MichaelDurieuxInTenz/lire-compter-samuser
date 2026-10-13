// Plus de questions dans les niveaux d'anglais qui en avaient peu (épeler, parler, mélanger et
// colorier les couleurs, les phrases, l'histoire de « Where is the cat? ») : des données justes, une
// seule bonne réponse, des clés qui désignent la question, et assez de questions différentes pour
// une partie de 10 sans redite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGame } from '../app/js/games/index.js';
import { PARLE_DATA, SPELL_MORE, spellable } from '../app/js/games/anglais.js';
import { ALL_MIXES, EN_COLORS, EN_DRAWINGS, PHRASE_DATA } from '../app/js/games/anglais-plus.js';
import { ENGLISH_THEMES } from '../app/js/data/anglais-data.js';
import { createRng } from '../app/js/random.js';
import { marques } from '../app/js/repetition.js';

const ctx = { name: 'Léa', season: 'automne' };
const draw = (id, level, runs = 400, seed = 31) => {
  const rng = createRng(seed + level);
  return Array.from({ length: runs }, (_, i) => findGame(id).generate(level, rng, i, ctx));
};
const values = (q) => q.choices.map((c) => c.value);

// les niveaux enrichis, et le nombre de questions différentes attendu au moins
const ENRICHED = [
  ['epelle-anglais', 3, 14], ['epelle-anglais', 4, 15], ['epelle-anglais', 5, 15], ['epelle-anglais', 6, 15],
  ['ou-est', 7, 100],
  ['parle-anglais', 1, 15], ['parle-anglais', 2, 15], ['parle-anglais', 3, 15], ['parle-anglais', 5, 17],
  ['parle-anglais', 6, 17], ['parle-anglais', 7, 15],
  ['colorie-anglais', 1, 15], ['colorie-anglais', 2, 15], ['colorie-anglais', 3, 15],
  ['couleurs-anglais', 1, 14], ['couleurs-anglais', 2, 14], ['couleurs-anglais', 3, 14], ['couleurs-anglais', 4, 12],
  ['couleurs-anglais', 5, 14], ['couleurs-anglais', 6, 12], ['couleurs-anglais', 7, 12],
  ['phrase-anglais', 1, 15], ['phrase-anglais', 2, 16], ['phrase-anglais', 3, 15], ['phrase-anglais', 6, 16],
];

test('contenu anglais : assez de questions différentes (clé et sujet) dans chaque niveau enrichi', () => {
  for (const [id, level, min] of ENRICHED) {
    const keys = new Set();
    const subjects = new Set();
    for (const q of draw(id, level)) {
      const [k, s] = marques(q);
      keys.add(k);
      subjects.add(s);
    }
    assert.ok(Math.min(keys.size, subjects.size) >= min, `${id} niveau ${level} : ${keys.size} clés, ${subjects.size} sujets (au moins ${min})`);
  }
});

test('contenu anglais : une seule bonne réponse, pas de choix en double, une clé = une question', () => {
  for (const [id, level] of ENRICHED) {
    const byKey = new Map();
    for (const q of draw(id, level, 300)) {
      if (q.choices.length) {
        const v = values(q);
        assert.equal(new Set(v).size, v.length, `${id} ${level} : choix en double ${q.key}`);
        assert.equal(v.filter((x) => x === q.answer).length, 1, `${id} ${level} : bonne réponse absente ou en double ${q.key}`);
        const labels = q.choices.map((c) => c.label ?? c.swatch);
        assert.equal(new Set(labels).size, labels.length, `${id} ${level} : deux choix pareils ${q.key}`);
      }
      // la clé ne dépend pas de l'ordre des choix : même clé, même consigne et même réponse
      const same = `${q.text}|${JSON.stringify(q.answer)}`;
      // (sauf « How old are you? » : la réponse dit l'âge de l'enfant)
      if (byKey.has(q.key) && q.key !== 'parle:dialogue:How old are you?') {
        assert.equal(byKey.get(q.key), same, `${id} ${level} : deux questions pour la clé ${q.key}`);
      }
      byKey.set(q.key, same);
    }
  }
});

// ------------------------------------------------------------------ Épeler

test('épelle en anglais : les mots ajoutés s’épellent, sont nouveaux et ont chacun leur image', () => {
  const themeWords = ENGLISH_THEMES.flatMap((t) => t.words);
  const added = Object.values(SPELL_MORE).flat();
  assert.equal(new Set(added.map((w) => w.en)).size, added.length, 'mot ajouté deux fois');
  for (const w of added) {
    assert.ok(spellable(w), `${w.en} : 3 à 6 lettres toutes différentes`);
    // (orange, le fruit, est aussi une couleur du thème des couleurs)
    assert.ok(!themeWords.some((t) => t.en === w.en && t.emoji), `${w.en} : déjà dans un thème`);
    assert.ok(w.fr && w.emoji, w.en);
    assert.ok(!w.fr.includes("'"), `${w.fr} : apostrophe typographique`);
  }
  // dans un niveau, deux mots n'ont jamais la même image
  for (let level = 3; level <= 6; level++) {
    const seen = new Map();
    for (const q of draw('epelle-anglais', level, 500)) {
      const pic = q.stage.emoji || q.stage.color;
      if (seen.has(pic)) assert.equal(seen.get(pic), q.answer, `niveau ${level} : ${pic} pour ${seen.get(pic)} et ${q.answer}`);
      seen.set(pic, q.answer);
    }
  }
  // tous les mots ajoutés sont tirés, à leur niveau
  for (const [level, words] of Object.entries(SPELL_MORE)) {
    const answers = new Set(draw('epelle-anglais', Number(level), 600).map((q) => q.answer));
    for (const w of words) assert.ok(answers.has(w.en), `${w.en} jamais tiré au niveau ${level}`);
  }
});

// ------------------------------------------------------------------ Parler

/** Deux propositions du même groupe ne sont jamais ensemble (« Sorry! » et « Excuse me! »). */
function checkGroups(list, q, field) {
  const shown = q.choices.map((c) => list.find((x) => x[field] === c.value));
  assert.ok(shown.every(Boolean), q.key);
  const groups = shown.map((x) => x.group || x[field]);
  assert.equal(new Set(groups).size, groups.length, `deux du même groupe : ${q.choices.map((c) => c.value)}`);
}

test('parle anglais : saluer, être poli, finir la comptine, sans deux réponses possibles', () => {
  const { GREETINGS, POLITE, NURSERY } = PARLE_DATA;
  for (const [list, field] of [[GREETINGS, 'en'], [POLITE, 'en'], [NURSERY, 'word']]) {
    assert.ok(list.length >= 15, `${list.length} seulement`);
    assert.equal(new Set(list.map((x) => x[field])).size, list.length, 'réponse en double');
    assert.equal(new Set(list.map((x) => x.situation || x.line)).size, list.length, 'situation en double');
  }
  assert.equal(new Set(NURSERY.map((r) => r.emoji)).size, NURSERY.length, 'deux comptines, la même image');
  for (const r of NURSERY) assert.ok(r.line.endsWith('…') && r.fr, r.line);
  for (const s of [...GREETINGS, ...POLITE]) {
    assert.match(s.situation, /^[A-ZÀ-Ý].*\. Tu .*…$/, s.situation);
    assert.ok(s.situation.length <= 50, `${s.situation} : trop long`);
  }
  for (const q of draw('parle-anglais', 1)) checkGroups(GREETINGS, q, 'en');
  for (const q of draw('parle-anglais', 7)) checkGroups(POLITE, q, 'en');
  for (const q of draw('parle-anglais', 3)) checkGroups(NURSERY, q, 'word');
});

test('parle anglais : petites conversations et « trouve la question », une seule réponse possible', () => {
  const talks = PARLE_DATA.conversations('Léa', 7);
  assert.equal(new Set(talks.map((t) => t.q)).size, talks.length, 'question en double');
  assert.equal(new Set(talks.map((t) => t.a)).size, talks.length, 'réponse en double');
  for (const t of talks) {
    assert.equal(new Set([t.a, ...t.wrong]).size, 3, `${t.q} : réponses en double`);
    assert.ok(/[?]$/.test(t.q) && /[.!]$/.test(t.a), t.q);
  }
  // une question sur quatre environ sans image : elle ne se joue qu'à l'oreille
  assert.ok(talks.filter((t) => !t.emoji).length <= 4);
  // trouve la question : jamais deux questions d'un même groupe (la réponse irait avec les deux)
  for (const q of draw('parle-anglais', 5)) {
    const shown = values(q).map((v) => talks.find((t) => t.q === v));
    const groups = shown.flatMap((t) => t?.groups || []);
    assert.equal(new Set(groups).size, groups.length, `${q.stage.text} : ${values(q)}`);
  }
});

test('parle anglais : le mot qui manque, une seule place et une seule réponse', () => {
  const gaps = PARLE_DATA.gapSentences('Léa', 7);
  assert.equal(new Set(gaps.map((g) => g.a)).size, gaps.length, 'deux phrases, le même mot (la même clé)');
  for (const g of gaps) {
    assert.equal(g.s.split('___').length, 2, g.s);
    assert.equal(new Set([g.a, ...g.wrong]).size, 3, g.s);
    assert.ok(!g.s.includes('Lou'), 'pas de prénom en dur');
  }
});

// ------------------------------------------------------------------ Où est le chat ? L'histoire

test('where is the cat?, l’histoire : deux histoires différentes sont deux questions différentes', () => {
  for (const level of [7, 8]) {
    const bySubject = new Map();
    for (const q of draw('ou-est', level, 300)) {
      const told = [...q.replay[0].text.matchAll(/The (\w+) is (in|on|under|next to) the/g)]
        .map(([, pet, place]) => `${pet} ${place === 'next to' ? 'next' : place}`).sort().join(', ');
      assert.equal(q.stage.story, told, q.replay[0].text);
      const [, subject] = marques(q);
      const what = `${q.stage.story}|${q.replay[1].text}`;
      if (bySubject.has(subject)) assert.equal(bySubject.get(subject), what, 'même sujet, autre histoire');
      bySubject.set(subject, what);
    }
  }
});

// ------------------------------------------------------------------ Mélanger les couleurs

// les mélanges de peinture justes : les secondaires, deux complémentaires (du marron), avec du blanc
// (plus clair) ou du noir (plus foncé)
const RIGHT_MIXES = {
  'red+yellow': 'orange', 'blue+yellow': 'green', 'red+blue': 'purple', 'red+green': 'brown',
  'blue+orange': 'brown', 'yellow+purple': 'brown', 'red+white': 'pink', 'black+white': 'grey',
  'blue+white': 'light blue', 'green+white': 'light green', 'purple+white': 'light purple', 'brown+white': 'light brown',
  'blue+black': 'dark blue', 'green+black': 'dark green',
};
const mixOf = (a, b) => RIGHT_MIXES[`${a}+${b}`] || RIGHT_MIXES[`${b}+${a}`];
const familyOf = (c) => EN_COLORS[c].family || c;
// des couleurs qu'on pourrait croire obtenir à la place
const NEAR = [['brown', 'grey'], ['brown', 'black'], ['pink', 'light purple'], ['light brown', 'grey']];
const near = (x, y) => NEAR.some(([p, q]) => (p === x && q === y) || (p === y && q === x));

test('mélange les couleurs : des mélanges justes, des pièges clairement faux', () => {
  assert.equal(ALL_MIXES.length, Object.keys(RIGHT_MIXES).length);
  assert.equal(new Set(ALL_MIXES.map(([a, b]) => [a, b].sort().join('+'))).size, ALL_MIXES.length, 'mélange en double');
  for (const [a, b, result] of ALL_MIXES) {
    assert.equal(mixOf(a, b), result, `${a} + ${b}`);
    for (const c of [a, b]) assert.ok(EN_COLORS[c].square, `${c} : un carré de couleur pour le montrer`);
    assert.ok(EN_COLORS[result].fr && /^#[0-9a-f]{6}$/.test(EN_COLORS[result].hex), result);
  }
  for (let level = 1; level <= 6; level++) {
    for (const q of draw('couleurs-anglais', level, 300)) {
      const [, a, b] = q.replay[0].text.match(/^([a-z]+) and ([a-z]+) make\.\.\.\?$/);
      assert.equal(q.answer, mixOf(a, b), q.key);
      // la clé : le mélange, quel que soit l'ordre des deux couleurs à l'écran
      const [x, y] = ALL_MIXES.find((m) => [m[0], m[1]].sort().join() === [a, b].sort().join());
      assert.equal(q.key, `couleurs-anglais:${level}:${x}+${y}`);
      for (const c of values(q).filter((v) => v !== q.answer)) {
        assert.ok(![a, b, q.answer].map(familyOf).includes(familyOf(c)), `${a} + ${b} : ${c} est une nuance trop proche`);
        assert.ok(!near(c, q.answer), `${a} + ${b} = ${q.answer} : ${c} trop proche`);
      }
      // jamais l'information par la couleur seule : chaque pastille a son nom
      for (const c of q.choices) if (c.swatch) assert.equal(c.name, EN_COLORS[c.value].fr);
    }
  }
  // retrouve les 2 couleurs : trois mélanges de couleurs bien différentes
  for (const q of draw('couleurs-anglais', 7, 300)) {
    const made = values(q);
    for (const x of made) for (const y of made) if (x !== y) assert.ok(familyOf(x) !== familyOf(y) && !near(x, y), `${x} et ${y}`);
    for (const c of q.choices) assert.equal(mixOf(...c.label.split(' and ')), c.value, c.label);
  }
  // le coloriage garde son nuancier : ni nuance claire ou foncée, ni nouveau mélange
  for (let level = 4; level <= 7; level++) {
    for (const q of draw('colorie-anglais', level, 100)) {
      for (const c of q.stage.legend) {
        if (level <= 5) assert.ok(!EN_COLORS[c.word].shade, c.word);
        else assert.ok(['orange', 'green', 'purple', 'pink', 'grey', 'brown'].includes(mixOf(...c.word.split(' + '))), c.word);
      }
    }
  }
});

// ------------------------------------------------------------------ Colorier

test('colorie en anglais : 15 dessins, des zones bien numérotées dans le carré', () => {
  assert.ok(EN_DRAWINGS.length >= 15);
  assert.equal(new Set(EN_DRAWINGS.map((d) => d.name)).size, EN_DRAWINGS.length);
  for (const { name, zones } of EN_DRAWINGS) {
    assert.match(name, /^(a [b-df-hj-np-tv-z]|an [aeiou])[a-z -]+$/, `${name} : a ou an`);
    for (const z of zones) {
      assert.ok(Number.isInteger(z.c) && z.c >= 0 && z.c <= 4, name);
      assert.ok(z.at.every((v) => v >= 4 && v <= 116), `${name} : le nombre ${z.at} sort du dessin`);
      assert.match(z.d, /^M[\d. a-zA-Z-]+Z$/, name);
    }
    // 3, 4 ou 5 couleurs : au moins 3 couleurs sur le dessin
    for (const n of [3, 4, 5]) assert.ok(new Set(zones.map((z) => z.c % n)).size >= 3, `${name} avec ${n} couleurs`);
  }
});

// ------------------------------------------------------------------ Les phrases

test('phrase anglaise : des phrases courtes, sans mot répété, traduites', () => {
  const { SENTENCES, MORE_SENTENCES, QUESTIONS, answers } = PHRASE_DATA;
  const all = [...SENTENCES, ...MORE_SENTENCES, ...QUESTIONS, ...answers('Léa')];
  // les phrases à remettre en ordre (niveaux 1 à 3, 5 et 7) : chacune une seule fois
  const texts = [...SENTENCES, ...MORE_SENTENCES].map((s) => s.words.join(' '));
  assert.equal(new Set(texts).size, texts.length, 'phrase en double');
  for (const s of all) {
    const text = s.words.join(' ');
    assert.ok(s.words.length >= 3 && s.words.length <= 5, text);
    // chaque étiquette a une seule place possible, et tient sur une ligne
    assert.equal(new Set(s.words).size, s.words.length, `${text} : mot répété`);
    for (const w of s.words) assert.ok([...w].length <= (s.words.length === 5 ? 6 : 7), `${w} trop long`);
    assert.match(s.words[0], /^[A-Z]/, text);
    assert.match(s.fr, /^[A-ZÀ-Ý].*[.!?]$/, s.fr);
    assert.ok(!s.fr.includes("'"), `${s.fr} : apostrophe typographique`);
  }
  for (const n of [3, 4, 5]) {
    const count = [...SENTENCES, ...MORE_SENTENCES].filter((s) => s.words.length === n).length;
    assert.ok(count >= 15, `${count} phrases de ${n} mots`);
  }
  const replies = answers('Léa');
  assert.equal(new Set(replies.map((r) => r.q)).size, replies.length, 'question en double');
});
