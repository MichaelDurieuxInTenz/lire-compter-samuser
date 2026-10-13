// Plus de questions dans les niveaux du monde qui en avaient peu (animaux, pays, carte, émotions,
// vivre ensemble, cherche et trouve) : des données justes, une seule bonne réponse, des clés qui
// désignent la question, et assez de questions différentes pour une partie de 10 sans redite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGame } from '../app/js/games/index.js';
import { BODY, CALM, FACES as EMOTION_FACES, HELP } from '../app/js/games/emotions.js';
import { CALLING, RULES, STREET, WHAT_IF } from '../app/js/games/vivre.js';
import { FACES, lookAlike } from '../app/js/games/cherche.js';
import { COUNTRIES } from '../app/js/data/carte-data.js';
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
  ['animaux-monde', 4, 15], ['animaux-monde', 6, 15], ['pays', 1, 14], ['pays', 2, 12], ['pays', 5, 12],
  ['pays', 7, 8], ['pays', 8, 15], ['carte-monde', 3, 12], ['cherche-trouve', 7, 15],
  ['emotions', 5, 15], ['emotions', 8, 14], ['emotions', 9, 14],
  ['vivre-ensemble', 3, 14], ['vivre-ensemble', 5, 15], ['vivre-ensemble', 6, 13], ['vivre-ensemble', 7, 16],
];

test('contenu monde : assez de questions différentes (clé et sujet) dans chaque niveau enrichi', () => {
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

test('contenu monde : une seule bonne réponse, et une clé = une question (même consigne, même réponse)', () => {
  for (const [id, level] of ENRICHED) {
    const byKey = new Map();
    for (const q of draw(id, level, 300)) {
      const v = values(q);
      assert.equal(new Set(v).size, v.length, `${id} ${level} : choix en double ${q.key}`);
      assert.equal(v.filter((x) => x === q.answer).length, 1, `${id} ${level} : bonne réponse absente ou en double ${q.key}`);
      // la clé ne dépend pas de l'ordre des choix (sauf « cherche et trouve », où tout est à sa place)
      const same = `${q.text}|${JSON.stringify(q.answer)}`;
      if (byKey.has(q.key)) assert.equal(byKey.get(q.key), same, `${id} ${level} : deux questions pour la clé ${q.key}`);
      byKey.set(q.key, same);
    }
  }
});

// ------------------------------------------------------------------ Les animaux

test('animaux : qui pond des œufs (ovipares contre mammifères), la maison de chacun', () => {
  const layers = [
    'la tortue', 'la chouette', 'le manchot', 'la poule', 'le crabe', 'le canard', 'le serpent', 'la pieuvre', 'le crocodile',
    'le lézard', 'le perroquet', 'le cygne', 'l’aigle', 'la grenouille', 'le papillon', 'la coccinelle', 'l’escargot',
    'l’araignée', 'l’oiseau',
  ];
  const mammals = [
    'la vache', 'le mouton', 'le cheval', 'le cochon', 'le dauphin', 'la baleine', 'le renard', 'le cerf', 'l’écureuil',
    'le lion', 'la girafe', 'l’éléphant', 'le zèbre', 'l’ours blanc', 'le phoque', 'le chat', 'le chien', 'le lapin', 'le loup',
  ];
  const asked = new Set();
  for (const q of draw('animaux-monde', 4)) {
    assert.ok(layers.includes(q.answer), q.answer);
    for (const v of values(q)) if (v !== q.answer) assert.ok(mammals.includes(v), `${v} ne pond pas d’œufs ?`);
    asked.add(q.answer);
  }
  assert.equal(asked.size, layers.length, 'tous les animaux qui pondent sont demandés');

  const houses = {
    'du chien': 'la niche', 'de la vache': 'l’étable', 'du cheval': 'l’écurie', 'du cochon': 'la porcherie',
    'de la poule': 'le poulailler', 'de l’ours blanc': 'la tanière', 'du renard': 'le terrier', 'du mouton': 'la bergerie',
    'du lapin': 'le terrier', 'de l’escargot': 'la coquille', 'de l’araignée': 'la toile', 'de l’oiseau': 'le nid',
    'du loup': 'la tanière', 'de l’abeille': 'la ruche', 'de la fourmi': 'la fourmilière',
  };
  const seen = new Set();
  for (const q of draw('animaux-monde', 6)) {
    const who = Object.keys(houses).find((k) => q.text === `Comment s’appelle la maison ${k} ?`);
    assert.ok(who, q.text);
    assert.equal(q.answer, houses[who], q.text);
    assert.equal(new Set(values(q)).size, 3, q.text);
    assert.match([q.success.speak].flat().join(' '), /\.$/, q.text);
    seen.add(who);
  }
  assert.equal(seen.size, Object.keys(houses).length);
  // les nouveaux animaux dans les autres niveaux : le loup (bébé, cri, nourriture), poils, plumes ou écailles
  assert.ok(draw('animaux-monde', 2).some((q) => q.answer === 'le louveteau' && q.text.includes('du loup')));
  assert.ok(draw('animaux-monde', 5).some((q) => q.text === 'Qui hurle ?' && q.answer === 'le loup'));
  const covers = { '🦎': 'écailles', '🦜': 'plumes', '🦢': 'plumes', '🦅': 'plumes', '🐺': 'poils' };
  for (const q of draw('animaux-monde', 7)) if (covers[q.stage.emoji]) assert.equal(q.answer, covers[q.stage.emoji], q.text);
  // ni la grenouille, ni les insectes, ni l'escargot dans « poils, plumes, écailles »
  for (const q of draw('animaux-monde', 7)) assert.ok(!['🐸', '🦋', '🐞', '🐌', '🕷️', '🐝', '🐜', '🐦'].includes(q.stage.emoji), q.text);
});

// ------------------------------------------------------------------ Les pays

test('pays : le bon pays pour chaque lieu, plat ou animal ; « bonjour » dans douze langues ; les huit voisins', () => {
  const places = {
    1: {
      'La tour Eiffel': 'France', 'La baguette': 'France', 'Le château de Versailles': 'France', 'Le camembert': 'France',
      'La pizza': 'Italie', 'Les spaghettis': 'Italie', 'Le Colisée de Rome': 'Italie', 'Les gardes de Londres': 'Royaume-Uni',
      'L’horloge Big Ben': 'Royaume-Uni', 'La paella': 'Espagne', 'Le flamenco': 'Espagne', 'Le bretzel': 'Allemagne',
      'Le Parthénon d’Athènes': 'Grèce', 'Les champs de tulipes': 'Pays-Bas',
    },
    2: {
      'La statue de la Liberté': 'États-Unis', 'Le mont Fuji': 'Japon', 'Les sushis': 'Japon', 'Le kimono': 'Japon',
      'Le panda géant': 'Chine', 'La Grande Muraille': 'Chine', 'Le kangourou': 'Australie', 'Le koala': 'Australie',
      'Les pyramides': 'Égypte', 'La feuille d’érable': 'Canada', 'Le Taj Mahal': 'Inde', 'Le carnaval de Rio': 'Brésil',
    },
  };
  for (const level of [1, 2]) {
    const seen = new Set();
    for (const q of draw('pays', level)) {
      const what = q.text.replace('… dans quel pays ?', '');
      assert.ok(places[level][what], `${level} : ${q.text}`);
      assert.equal(q.answer, places[level][what], q.text);
      seen.add(what);
    }
    assert.equal(seen.size, Object.keys(places[level]).length, `niveau ${level} : tous les lieux sont demandés`);
  }
  // un seul pays d'Europe par question au niveau 1 (les mauvaises réponses sont d'autres pays)
  for (const q of draw('pays', 1)) for (const v of values(q)) assert.ok(Object.values(places[1]).includes(v), v);
  // le niveau 3 (continents) reprend les nouveaux lieux sur le bon continent
  const continents = { 'Le koala': 'Océanie', 'Le carnaval de Rio': 'Amérique', 'Les sushis': 'Asie', 'Le flamenco': 'Europe' };
  for (const q of draw('pays', 3)) {
    const what = q.text.replace('… sur quel continent ?', '');
    if (continents[what]) assert.equal(q.answer, continents[what], q.text);
  }

  const hellos = {
    'Hello !': 'anglais', 'Hola !': 'espagnol', 'Ciao !': 'italien', 'Guten Tag !': 'allemand', 'Konnichiwa !': 'japonais',
    'Ni hao !': 'chinois', 'Salam !': 'arabe', 'Bom dia !': 'portugais', 'Kaliméra !': 'grec', 'Namasté !': 'hindi',
    'Jambo !': 'swahili', 'Shalom !': 'hébreu',
  };
  const heard = new Set();
  for (const q of draw('pays', 5)) {
    assert.equal(q.answer, hellos[q.stage.text], q.stage.text);
    assert.ok(q.success.speak.at(-1).startsWith(`C’est bonjour en ${q.answer}. On parle ${q.answer} `), q.success.speak.at(-1));
    heard.add(q.stage.text);
  }
  assert.equal(heard.size, 12);
  assert.equal(new Set(Object.values(hellos)).size, 12, 'une langue par mot');

  const neighbours = new Set(draw('pays', 7).map((q) => q.answer));
  assert.deepEqual([...neighbours].sort(), ['Allemagne', 'Andorre', 'Belgique', 'Espagne', 'Italie', 'Luxembourg', 'Monaco', 'Suisse']);
});

// ------------------------------------------------------------------ La carte : où est la France ?

test('carte : où est la France (ses voisins, son continent, sa capitale, ses mers)', () => {
  const kinds = new Set();
  for (const q of draw('carte-monde', 3)) {
    const kind = q.key.split(':')[2] || q.key;
    kinds.add(q.key.startsWith('carte:capitale') ? 'capitale' : kind);
    if (kind === 'voisin') {
      assert.ok(COUNTRIES.fr.neighbours.includes(q.answer), q.key);
      assert.equal(q.stage.start, 'fr', 'la France est hachurée');
      assert.ok(!q.stage.zones.includes('fr'));
      assert.equal(q.text, `Touche ${COUNTRIES[q.answer].name}, un pays voisin de la France.`);
    }
    if (kind === 'continent') assert.equal(q.answer, 'europe');
    if (q.key.startsWith('carte:capitale')) assert.equal(q.answer, 'cap-fr', q.key);
  }
  for (const k of ['voisin', 'continent', 'capitale', 'europe', 'monde', 'mediterranee', 'atlantique', 'mer-du-nord']) assert.ok(kinds.has(k), k);
});

// ------------------------------------------------------------------ Cherche et trouve : les visages

test('cherche et trouve : quinze visages, chacun son nom, jamais à côté d’un visage qui lui ressemble', () => {
  assert.equal(new Set(FACES.map((f) => f.emoji)).size, FACES.length);
  assert.equal(new Set(FACES.map((f) => f.name)).size, FACES.length);
  for (const f of FACES) for (const e of f.near || []) assert.ok(FACES.some((g) => g.emoji === e), `${f.name} : ${e}`);
  // les mêmes visages que dans « Les émotions » pour les émotions qui y sont
  for (const e of ['joie', 'tristesse', 'colere', 'peur', 'surprise', 'degout']) assert.ok(FACES.some((f) => f.emoji === EMOTION_FACES[e].emoji), e);
  const asked = new Set();
  for (const q of draw('cherche-trouve', 7, 300)) {
    const target = FACES.find((f) => f.emoji === q.choices.find((c) => c.value === q.answer).label);
    asked.add(target.emoji);
    assert.equal(q.text, `Trouve ${target.name}.`);
    for (const c of q.choices) {
      if (c.value === q.answer) continue;
      const other = FACES.find((f) => f.emoji === c.label);
      assert.ok(other && other !== target && !lookAlike(other, target), `${target.name} à côté de ${c.name}`);
    }
  }
  assert.equal(asked.size, FACES.length);
});

// ------------------------------------------------------------------ Les émotions, vivre ensemble

test('émotions et vivre ensemble : listes sans doublon, une bonne réponse et deux mauvaises bien distinctes', () => {
  const lists = { BODY, CALM, HELP, STREET, WHAT_IF, RULES, CALLING };
  for (const [name, list] of Object.entries(lists)) {
    const texts = list.map((i) => i.text);
    assert.equal(new Set(texts).size, texts.length, `${name} : situation en double`);
    for (const item of list) {
      assert.equal(item.wrong.length, 2, item.text);
      assert.equal(new Set([item.answer, ...item.wrong]).size, 3, item.text);
      assert.match(item.text, /[.?!]$/, item.text);
      assert.ok(!/'/.test(JSON.stringify(item)), `apostrophe droite : ${item.text}`);
      if (item.says) assert.match(item.says, /\.$/, item.says);
    }
  }
  for (const item of BODY) for (const e of [item.answer, ...item.wrong]) assert.ok(EMOTION_FACES[e], `${item.text} : ${e}`);
  // le corps parle : la réponse n'est jamais écrite dans la situation
  for (const item of BODY) assert.ok(!item.text.toLowerCase().includes(EMOTION_FACES[item.answer].noun.slice(3).toLowerCase()), item.text);
  // « Que faire si… », la rue, les règles, les secours : des boutons courts (26 caractères au plus)
  for (const list of [STREET, WHAT_IF, RULES, CALLING]) {
    for (const item of list) for (const a of [item.answer, ...item.wrong]) assert.ok([...a].length <= 26, a);
  }
});

test('vivre ensemble : les numéros d’urgence selon ce qui arrive, et bien appeler les secours', () => {
  const byText = {
    'Quelqu’un est très malade. Quel numéro faut-il appeler ?': 15,
    'Un voleur entre dans une maison. Quel numéro faut-il appeler ?': 17,
  };
  const seen = new Set();
  for (const q of draw('vivre-ensemble', 6, 500)) {
    if (byText[q.text]) {
      assert.equal(q.answer, byText[q.text], q.text);
      assert.deepEqual(values(q), [15, 17, 18]);
    }
    const call = CALLING.find((c) => c.text === q.text);
    if (call) assert.equal(q.answer, call.answer, q.text);
    seen.add(q.key);
  }
  for (const k of ['malade', 'voleur', ...CALLING.map((c) => c.key)]) assert.ok(seen.has(`vivre:urgence:${k}`), k);
});
