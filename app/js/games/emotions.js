// « Le monde » : les émotions. Reconnaître six émotions sur un visage, les nommer, les relier à
// une situation et à ce que l'on sent dans son corps, dire si elles sont petites ou grandes,
// découvrir des émotions plus fines (fier, jaloux, déçu…), puis savoir se calmer et aider un
// copain. Les quatre émotions de base sont aussi dans « Sécurité et vivre ensemble » (vivre.js) ;
// ici, on va plus loin. Toutes les phrases sont fixes (pas de prénom de l'enfant ni de nombre) :
// Estelle les dit d'un seul son.

import { pick, sample, shuffle } from '../random.js';

const NB = ' '; // espace insécable avant « ? », « ! » et « : » dans les boutons

const capitalize = (text) => `${text[0].toUpperCase()}${text.slice(1)}`;
const spokenList = (labels) => (labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} ou ${labels.at(-1)}`);

/** Les six émotions : le visage, son nom, la consigne, la phrase dite quand on l'a trouvé. */
export const FACES = {
  joie: {
    emoji: '😄', noun: 'La joie', name: 'un visage content', ask: 'Touche le visage content.',
    says: 'Oui, ce visage est content : il sourit.', m: 'est content', f: 'est contente',
  },
  tristesse: {
    emoji: '😢', noun: 'La tristesse', name: 'un visage triste', ask: 'Touche le visage triste.',
    says: 'Oui, ce visage est triste : il pleure.', m: 'est triste', f: 'est triste',
  },
  colere: {
    emoji: '😠', noun: 'La colère', name: 'un visage en colère', ask: 'Touche le visage en colère.',
    says: 'Oui, ce visage est en colère : il fronce les sourcils.', m: 'est en colère', f: 'est en colère',
  },
  peur: {
    emoji: '😨', noun: 'La peur', name: 'un visage qui a peur', ask: 'Touche le visage qui a peur.',
    says: 'Oui, ce visage a peur : il ouvre grand les yeux.', m: 'a peur', f: 'a peur',
  },
  surprise: {
    emoji: '😲', noun: 'La surprise', name: 'un visage surpris', ask: 'Touche le visage surpris.',
    says: 'Oui, ce visage est surpris : il ouvre grand la bouche.', m: 'est surpris', f: 'est surprise',
  },
  degout: {
    emoji: '🤢', noun: 'Le dégoût', name: 'un visage dégoûté', ask: 'Touche le visage dégoûté.',
    says: 'Oui, ce visage est dégoûté : il trouve ça beurk.', m: 'est dégoûté', f: 'est dégoûtée',
  },
};
const BASIC = ['joie', 'tristesse', 'colere', 'peur'];
const ALL = Object.keys(FACES);

const faceChoice = (e) => ({ value: e, label: FACES[e].emoji, name: FACES[e].name });

/** Une question à réponses écrites, lues à voix haute (pour ceux qui ne lisent pas encore). */
function textQuestion({ key, text, stage = { type: 'none' }, answer, wrong, success, rng }) {
  const options = shuffle(rng, [answer, ...wrong]);
  return {
    key,
    text,
    instruction: [text, `${capitalize(spokenList(options))} ?`],
    stage,
    choices: options.map((o) => ({ value: o, label: o })),
    choiceStyle: 'sentences',
    answer,
    success: { speak: success },
  };
}

// Comment se sent-il ? Des enfants aux prénoms variés, une situation, l'émotion attendue et deux
// émotions qui ne vont pas du tout avec la situation.
export const SITUATIONS = [
  { who: 'Léo', f: false, emoji: '🎁', text: 'Léo ouvre le cadeau qu’il voulait tant.', answer: 'joie', wrong: ['tristesse', 'peur'] },
  { who: 'Maya', f: true, emoji: '🎠', text: 'Maya fait un tour de manège avec son papa.', answer: 'joie', wrong: ['tristesse', 'colere'] },
  { who: 'Inès', f: true, emoji: '🧸', text: 'Inès a perdu son doudou au parc.', answer: 'tristesse', wrong: ['joie', 'surprise'] },
  { who: 'Gabin', f: false, emoji: '🐠', text: 'Le poisson rouge de Gabin est mort.', answer: 'tristesse', wrong: ['joie', 'degout'] },
  { who: 'Adam', f: false, emoji: '🧱', text: 'Un copain a fait tomber la tour d’Adam exprès.', answer: 'colere', wrong: ['joie', 'peur'] },
  { who: 'Lina', f: true, emoji: '🖍️', text: 'Le frère de Lina a cassé ses crayons sans demander.', answer: 'colere', wrong: ['joie', 'surprise'] },
  { who: 'Jade', f: true, emoji: '⛈️', text: 'Jade entend un gros orage pendant la nuit.', answer: 'peur', wrong: ['joie', 'degout'] },
  { who: 'Sacha', f: false, emoji: '🐕', text: 'Un gros chien aboie très fort devant Sacha.', answer: 'peur', wrong: ['joie', 'tristesse'] },
  { who: 'Tom', f: false, emoji: '🎉', text: 'Tom ouvre la porte et toute sa famille crie : « Surprise ! »', answer: 'surprise', wrong: ['tristesse', 'colere'] },
  { who: 'Zoé', f: true, emoji: '🐰', text: 'Le magicien fait sortir un lapin de son chapeau devant Zoé.', answer: 'surprise', wrong: ['tristesse', 'colere'] },
  { who: 'Nina', f: true, emoji: '🍎', text: 'Nina trouve un ver dans sa pomme.', answer: 'degout', wrong: ['joie', 'tristesse'] },
  { who: 'Malo', f: false, emoji: '🧦', text: 'Malo sent les vieilles chaussettes de son grand frère.', answer: 'degout', wrong: ['joie', 'peur'] },
];

// Le corps parle : ce que l'on sent, et l'émotion qui va avec.
export const BODY = [
  { text: 'Mon cœur bat très vite et mes jambes tremblent. Quelle émotion est-ce ?', answer: 'peur', wrong: ['joie', 'degout'] },
  { text: 'Je me cache sous ma couette et je n’ose plus bouger. Quelle émotion est-ce ?', answer: 'peur', wrong: ['joie', 'colere'] },
  { text: 'Je serre les poings et mon visage devient tout rouge. Quelle émotion est-ce ?', answer: 'colere', wrong: ['joie', 'tristesse'] },
  { text: 'Je tape du pied et j’ai envie de crier. Quelle émotion est-ce ?', answer: 'colere', wrong: ['joie', 'peur'] },
  { text: 'J’ai une boule dans la gorge et des larmes dans les yeux. Quelle émotion est-ce ?', answer: 'tristesse', wrong: ['joie', 'colere'] },
  { text: 'Je souris, je ris et j’ai envie de sauter partout. Quelle émotion est-ce ?', answer: 'joie', wrong: ['tristesse', 'peur'] },
  { text: 'J’ouvre grand les yeux et la bouche : je ne m’y attendais pas ! Quelle émotion est-ce ?', answer: 'surprise', wrong: ['tristesse', 'colere'] },
  { text: 'Je plisse le nez et j’ai envie de dire : beurk ! Quelle émotion est-ce ?', answer: 'degout', wrong: ['joie', 'peur'] },
  { text: 'Je fronce les sourcils et je serre les dents. Quelle émotion est-ce ?', answer: 'colere', wrong: ['joie', 'surprise'] },
  { text: 'Je tremble de partout et je veux me cacher. Quelle émotion est-ce ?', answer: 'peur', wrong: ['joie', 'colere'] },
  { text: 'Je baisse la tête et j’ai envie de pleurer. Quelle émotion est-ce ?', answer: 'tristesse', wrong: ['joie', 'colere'] },
  { text: 'Je reste dans mon coin et je n’ai plus envie de jouer. Quelle émotion est-ce ?', answer: 'tristesse', wrong: ['joie', 'surprise'] },
  { text: 'Je tape dans mes mains et je chante très fort. Quelle émotion est-ce ?', answer: 'joie', wrong: ['tristesse', 'peur'] },
  { text: 'J’ai un grand sourire et les yeux qui brillent. Quelle émotion est-ce ?', answer: 'joie', wrong: ['colere', 'peur'] },
  { text: 'Mes sourcils montent tout en haut et je dis : oh ! Quelle émotion est-ce ?', answer: 'surprise', wrong: ['tristesse', 'colere'] },
  { text: 'Je me bouche le nez et je détourne la tête. Quelle émotion est-ce ?', answer: 'degout', wrong: ['joie', 'tristesse'] },
  { text: 'Je fais la grimace et je repousse mon assiette. Quelle émotion est-ce ?', answer: 'degout', wrong: ['joie', 'peur'] },
];

// Un peu, beaucoup : trois mots de la plus petite à la plus grande émotion.
export const SCALES = [
  { emotion: 'colere', emoji: '😠', words: ['agacé', 'en colère', 'furieux'], big: 'Quel mot dit la plus grande colère ?', small: 'Quel mot dit la plus petite colère ?', noun: 'colère' },
  { emotion: 'peur', emoji: '😨', words: ['inquiet', 'effrayé', 'terrifié'], big: 'Quel mot dit la plus grande peur ?', small: 'Quel mot dit la plus petite peur ?', noun: 'peur' },
  { emotion: 'joie', emoji: '😄', words: ['content', 'joyeux', 'fou de joie'], big: 'Quel mot dit la plus grande joie ?', small: 'Quel mot dit la plus petite joie ?', noun: 'joie' },
  { emotion: 'tristesse', emoji: '😢', words: ['déçu', 'triste', 'effondré'], big: 'Quel mot dit la plus grande tristesse ?', small: 'Quel mot dit la plus petite tristesse ?', noun: 'tristesse' },
];

// D'autres émotions : fier, jaloux, déçu, timide, impatient, inquiet, soulagé, gêné.
export const NUANCES = [
  { who: 'Zoé', text: 'Zoé a réussi son grand puzzle toute seule.', answer: 'fière', wrong: ['jalouse', 'timide'] },
  { who: 'Hugo', text: 'Hugo a construit une très haute tour tout seul.', answer: 'fier', wrong: ['jaloux', 'gêné'] },
  { who: 'Lou', text: 'Le petit frère de Lou reçoit plein de cadeaux, et elle aucun.', answer: 'jalouse', wrong: ['fière', 'soulagée'] },
  { who: 'Nathan', text: 'Le meilleur copain de Nathan ne joue plus qu’avec un autre enfant.', answer: 'jaloux', wrong: ['fier', 'soulagé'] },
  { who: 'Mia', text: 'Mia devait aller au zoo, mais la sortie est annulée.', answer: 'déçue', wrong: ['fière', 'soulagée'] },
  { who: 'Paul', text: 'Paul a raté le car pour la sortie qu’il attendait tant.', answer: 'déçu', wrong: ['fier', 'impatient'] },
  { who: 'Noé', text: 'Noé arrive dans une nouvelle école et n’ose parler à personne.', answer: 'timide', wrong: ['fier', 'jaloux'] },
  { who: 'Rayan', text: 'Ce soir, c’est Noël : Rayan a hâte d’ouvrir ses cadeaux.', answer: 'impatient', wrong: ['déçu', 'timide'] },
  { who: 'Lila', text: 'La maman de Lila est en retard pour venir la chercher.', answer: 'inquiète', wrong: ['fière', 'jalouse'] },
  { who: 'Tim', text: 'Tim croyait avoir perdu son doudou, mais il le retrouve sous son lit.', answer: 'soulagé', wrong: ['jaloux', 'déçu'] },
  { who: 'Elsa', text: 'Elsa a renversé son verre d’eau devant toute la classe.', answer: 'gênée', wrong: ['fière', 'impatiente'] },
  { who: 'Ambre', text: 'Ambre a très bien chanté au spectacle, et tout le monde l’applaudit.', answer: 'fière', wrong: ['jalouse', 'déçue'] },
];

// Pour se calmer : ce qui aide, et ce qui n'aide pas du tout.
export const CALM = [
  { emoji: '😠', text: 'Tu es très en colère. Que peux-tu faire pour te calmer ?', answer: 'Respirer lentement', wrong: ['Taper un copain', 'Casser un jouet'], says: 'Respirer lentement, ça aide à se calmer.' },
  { emoji: '🗣️', text: 'Tu es en colère contre ton frère. Que peux-tu faire ?', answer: 'Lui dire avec des mots', wrong: ['Le pousser', 'Lui lancer un jouet'], says: 'Avec des mots, on se fait comprendre sans faire mal.' },
  { emoji: '🌙', text: 'Tu as peur du noir pour t’endormir. Que peux-tu faire ?', answer: 'Allumer une veilleuse', wrong: ['Regarder un film qui fait peur', 'Partir te cacher dehors'], says: 'Une petite lumière rassure, et on peut aussi appeler un adulte.' },
  { emoji: '😢', text: 'Tu es triste. Que peux-tu faire ?', answer: 'En parler à quelqu’un', wrong: ['Tout garder pour toi', 'Te fâcher contre tout le monde'], says: 'Parler de sa tristesse à quelqu’un, ça fait du bien.' },
  { emoji: '📖', text: 'Tu as peur de te tromper en lisant devant la classe. Que peux-tu faire ?', answer: 'Respirer et essayer quand même', wrong: ['Te moquer des autres', 'Sortir de la classe'], says: 'On a le droit de se tromper : c’est comme ça qu’on apprend.' },
  { emoji: '🤸', text: 'Tu es si excité que tu n’arrives plus à rester assis. Que peux-tu faire ?', answer: 'Respirer doucement', wrong: ['Courir partout dans la classe', 'Crier très fort'], says: 'Respirer doucement aide le corps à se poser.' },
  { emoji: '🎲', text: 'Tu as perdu au jeu et tu es déçu. Que peux-tu faire ?', answer: 'Dire bravo au gagnant', wrong: ['Jeter le jeu par terre', 'Dire que c’est de la triche'], says: 'Perdre, ça arrive : on rejouera une autre fois.' },
  { emoji: '😤', text: 'Tu sens que tu vas te mettre en colère. Que peux-tu faire ?', answer: 'Compter lentement jusqu’à dix', wrong: ['Crier sur tout le monde', 'Claquer la porte'], says: 'Compter lentement jusqu’à dix laisse le temps à la colère de redescendre.' },
  { emoji: '✋', text: 'Un copain se moque de toi et la colère monte. Que peux-tu faire ?', answer: 'Lui dire stop calmement', wrong: ['Le frapper', 'Te moquer de lui encore plus'], says: 'On dit stop avec des mots, et on peut aussi prévenir un adulte.' },
  { emoji: '🧱', text: 'Ta tour s’écroule et tu t’énerves. Que peux-tu faire ?', answer: 'Souffler et recommencer', wrong: ['Taper sur la table', 'Jeter les cubes partout'], says: 'Souffler un grand coup aide à se calmer, puis on peut réessayer.' },
  { emoji: '📝', text: 'Tu n’arrives pas à faire ton exercice et tu t’énerves. Que peux-tu faire ?', answer: 'Demander de l’aide', wrong: ['Déchirer ta feuille', 'Jeter ton crayon'], says: 'Demander de l’aide, c’est une bonne idée : on apprend ensemble.' },
  { emoji: '🔊', text: 'Il y a trop de bruit et tu te sens énervé. Que peux-tu faire ?', answer: 'Aller dans un coin calme', wrong: ['Crier encore plus fort', 'Pousser les autres'], says: 'Un coin calme aide à se reposer et à se calmer.' },
  { emoji: '🛏️', text: 'Tu te réveilles après un cauchemar. Que peux-tu faire ?', answer: 'Appeler un adulte', wrong: ['Te cacher dans le placard', 'Sortir dans la rue'], says: 'Un adulte peut te rassurer : ce n’était qu’un rêve.' },
  { emoji: '🩺', text: 'Tu as peur de la piqûre chez le médecin. Que peux-tu faire ?', answer: 'Tenir la main d’un adulte', wrong: ['Mordre le médecin', 'Partir en courant'], says: 'Tenir la main d’un adulte et respirer doucement, ça rassure.' },
];

// Aider les autres : remarquer ce que ressent un copain, et faire ce qui l'aide.
export const HELP = [
  { emoji: '🤕', text: 'Ton copain est tombé et il pleure. Que fais-tu ?', answer: 'Je vais l’aider', wrong: ['Je me moque de lui', 'Je fais comme si je ne l’avais pas vu'], says: 'C’est gentil d’aider un copain qui a mal.' },
  { emoji: '🧒', text: 'Une copine est triste : personne ne joue avec elle. Que fais-tu ?', answer: 'Je lui propose de jouer', wrong: ['Je me moque d’elle', 'Je pars en courant'], says: 'Proposer de jouer, ça console.' },
  { emoji: '⛈️', text: 'Ton petit frère a peur de l’orage. Que fais-tu ?', answer: 'Je le rassure', wrong: ['Je lui fais encore plus peur', 'Je me moque de lui'], says: 'Le rassurer l’aide à avoir moins peur.' },
  { emoji: '😠', text: 'Ton ami est très en colère. Que fais-tu ?', answer: 'Je le laisse se calmer', wrong: ['Je l’énerve encore plus', 'Je lui prends son jouet'], says: 'On le laisse se calmer, puis on pourra en parler.' },
  { emoji: '👀', text: 'Comment savoir ce que ressent un copain ?', answer: 'Regarder son visage et lui demander', wrong: ['Deviner sans le regarder', 'Ne pas s’en occuper'], says: 'Son visage nous aide, et on peut toujours lui demander.' },
  { emoji: '🎨', text: 'Ta copine a gagné un concours de dessin. Que lui dis-tu ?', answer: 'Bravo, c’est super', wrong: ['C’est nul', 'Je m’en fiche'], says: 'Dire bravo, ça fait plaisir.' },
  { emoji: '💬', text: 'Tu as fait de la peine à un copain sans le vouloir. Que fais-tu ?', answer: 'Je lui demande pardon', wrong: ['Je fais comme si de rien n’était', 'Je recommence'], says: 'Demander pardon, ça répare.' },
  { emoji: '😢', text: 'Ta copine a l’air triste ce matin. Que fais-tu ?', answer: 'Je lui demande ce qui ne va pas', wrong: ['Je me moque d’elle', 'Je lui dis de partir'], says: 'Lui demander ce qui ne va pas, c’est montrer qu’on pense à elle.' },
  { emoji: '🎒', text: 'Un nouvel élève arrive dans la classe. Que fais-tu ?', answer: 'Je l’accueille avec un sourire', wrong: ['Je me moque de lui', 'Je fais comme s’il n’était pas là'], says: 'Un sourire et un bonjour aident à se sentir bien dans une nouvelle classe.' },
  { emoji: '🗣️', text: 'Des enfants se moquent d’un camarade. Que fais-tu ?', answer: 'Je le défends et j’appelle un adulte', wrong: ['Je me moque avec eux', 'Je regarde sans rien dire'], says: 'On ne laisse pas un camarade seul : on le défend, et on prévient un adulte.' },
  { emoji: '🍪', text: 'Ton copain a oublié son goûter. Que fais-tu ?', answer: 'Je partage le mien', wrong: ['Je mange devant lui en riant', 'Je cache mon goûter'], says: 'Partager, c’est faire plaisir à un copain.' },
  { emoji: '📚', text: 'Une copine a fait tomber tous ses livres. Que fais-tu ?', answer: 'Je l’aide à les ramasser', wrong: ['Je marche dessus', 'Je ris d’elle'], says: 'À deux, on ramasse plus vite.' },
  { emoji: '✏️', text: 'Ton voisin de classe n’a pas de crayon. Que fais-tu ?', answer: 'Je lui prête le mien', wrong: ['Je cache ma trousse', 'Je me moque de lui'], says: 'Prêter, c’est rendre service.' },
  { emoji: '🧓', text: 'Une dame âgée cherche une place assise dans le bus. Que fais-tu ?', answer: 'Je lui laisse ma place', wrong: ['Je pose mon sac sur le siège', 'Je fais semblant de dormir'], says: 'Laisser sa place à une personne âgée, c’est poli et gentil.' },
];

function emotionsLevel(level, rng) {
  // 1 et 2 : trouver le visage (quatre, puis six émotions)
  if (level <= 2) {
    const pool = level === 1 ? BASIC : ALL;
    const target = pick(rng, pool);
    const options = shuffle(rng, [target, ...sample(rng, pool.filter((e) => e !== target), level === 1 ? 2 : 3)]);
    return {
      key: `emotions:visage:${target}:${options.join(',')}`,
      text: FACES[target].ask,
      instruction: FACES[target].ask,
      stage: { type: 'none' },
      choices: options.map(faceChoice),
      choiceStyle: 'pictures',
      answer: target,
      success: { speak: FACES[target].says },
    };
  }
  // 3 : le nom de l'émotion
  if (level === 3) {
    const target = pick(rng, ALL);
    const text = 'Quelle émotion montre ce visage ?';
    return textQuestion({
      key: `emotions:nom:${target}`, text, stage: { type: 'picture', emoji: FACES[target].emoji },
      answer: FACES[target].noun, wrong: sample(rng, ALL.filter((e) => e !== target), 2).map((e) => FACES[e].noun),
      success: `Oui, c’est ${FACES[target].noun.toLowerCase()}.`, rng,
    });
  }
  // 4 : la situation, et le visage qui va avec
  if (level === 4) {
    const item = pick(rng, SITUATIONS);
    const question = `Comment se sent ${item.who} ?`;
    const options = shuffle(rng, [item.answer, ...item.wrong]);
    return {
      key: `emotions:situation:${item.who}`,
      text: `${item.text} ${question}`,
      instruction: [item.text, question],
      stage: { type: 'picture', emoji: item.emoji },
      choices: options.map(faceChoice),
      choiceStyle: 'pictures',
      answer: item.answer,
      success: { speak: `Oui, ${item.who} ${FACES[item.answer][item.f ? 'f' : 'm']}.` },
    };
  }
  // 5 : le corps parle
  if (level === 5) {
    const item = pick(rng, BODY);
    return textQuestion({
      key: `emotions:corps:${item.text}`, text: item.text,
      answer: FACES[item.answer].noun, wrong: item.wrong.map((e) => FACES[e].noun),
      success: `Oui, c’est ${FACES[item.answer].noun.toLowerCase()}.`, rng,
    });
  }
  // 6 : un peu, beaucoup
  if (level === 6) {
    const item = pick(rng, SCALES);
    const big = rng() < 0.5;
    const answer = big ? item.words[2] : item.words[0];
    return textQuestion({
      key: `emotions:echelle:${item.emotion}:${big}`, text: big ? item.big : item.small,
      stage: { type: 'picture', emoji: item.emoji },
      answer: capitalize(answer), wrong: item.words.filter((w) => w !== answer).map(capitalize),
      success: `Oui : ${item.words.join(', puis ')}.`, rng,
    });
  }
  // 7 : d'autres émotions
  if (level === 7) {
    const item = pick(rng, NUANCES);
    const question = `Comment se sent ${item.who} ?`;
    return textQuestion({
      key: `emotions:nuance:${item.who}`, text: `${item.text} ${question}`,
      answer: capitalize(item.answer), wrong: item.wrong.map(capitalize),
      success: `Oui, ${item.who} se sent ${item.answer}.`, rng,
    });
  }
  // 8 : se calmer ; 9 : aider les autres
  const item = pick(rng, level === 8 ? CALM : HELP);
  return textQuestion({
    key: `emotions:${level === 8 ? 'calme' : 'aide'}:${item.text}`, text: item.text,
    stage: { type: 'picture', emoji: item.emoji }, answer: item.answer, wrong: item.wrong,
    success: ['Oui, c’est ça.', item.says], rng,
  });
}

export const emotions = {
  id: 'emotions',
  domain: 'monde',
  title: 'Les émotions',
  icon: '😊',
  skill: 'Reconnaître, nommer et comprendre ses émotions et celles des autres ; savoir se calmer',
  levels: [
    'Les visages', 'Six émotions', 'Le nom des émotions', `Comment se sent-il${NB}?`, 'Le corps parle',
    'Un peu, beaucoup', 'D’autres émotions', 'Pour se calmer', 'Aider les autres', 'Grand mélange',
  ],
  generate(level, rng) {
    // niveau 10 : un peu de tout (niveaux 3 à 9)
    const q = emotionsLevel(level === 10 ? 3 + Math.floor(rng() * 7) : level, rng);
    return level === 10 ? { ...q, key: `melange:${q.key}` } : q;
  },
};
