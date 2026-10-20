// Outils pour les nombres : blocs de base dix, droite numérique, balance des nombres.
//
// Chaque outil suit le contrat décrit dans ../outils.js (modèle : le cadre de dix, ./comptage.js).
// Les grands nombres s'écrivent avec une espace fine entre les classes (« 4 725 », ecrit) ; une
// consigne qui en contient un porte aussi `dit`, ce que la voix doit dire (« 4 mille 725 ») :
// lue telle quelle, l'espace ferait dire « 4 » puis « 725 ».

import { h } from '../render.js';
import { pick, randInt } from '../random.js';
import { dit, ecrit } from '../games/ce2.js';

/** Une consigne et, si elle contient un grand nombre, ce que dit la voix. */
function consigneNombre(texte, n) {
  return n >= 1000 ? { consigne: texte, dit: texte.replace(ecrit(n), dit(n)) } : { consigne: texte };
}

/** Tire une valeur jusqu'à ce qu'elle convienne (au plus `essais` fois) ; null sinon. */
function tirer(essais, fn) {
  for (let i = 0; i < essais; i++) {
    const out = fn();
    if (out) return out;
  }
  return null;
}

// ================================================================ Les blocs de base dix

// Plafonds : 9 milliers ; 19 centaines, dizaines et unités, pour pouvoir casser un bloc quand il y
// en a déjà 9 du plus petit (« Montre 52 avec seulement 4 dizaines » : 12 unités).
const BLOCS = [
  { cle: 'milliers', valeur: 1000, max: 9, un: 'millier', des: 'milliers', titre: 'Milliers', article: 'un millier', f: false },
  { cle: 'centaines', valeur: 100, max: 19, un: 'centaine', des: 'centaines', titre: 'Centaines', article: 'une centaine', f: true },
  { cle: 'dizaines', valeur: 10, max: 19, un: 'dizaine', des: 'dizaines', titre: 'Dizaines', article: 'une dizaine', f: true },
  { cle: 'unites', valeur: 1, max: 19, un: 'unité', des: 'unités', titre: 'Unités', article: 'une unité', f: true },
];
const blocDe = (cle) => BLOCS.find((b) => b.cle === cle);

/** Les blocs d'une classe : dizaines et unités au CP, centaines au CE1, milliers à partir du CE2. */
function blocsDe(grade) {
  const n = { CP: 2, CE1: 3 }[grade] || 4;
  return BLOCS.slice(BLOCS.length - n);
}

function valeurBlocs(e) {
  return BLOCS.reduce((s, b) => s + (e[b.cle] || 0) * b.valeur, 0);
}

/** 1 305 → 1 millier, 3 centaines, 0 dizaine, 5 unités. */
function canonique(n) {
  return { milliers: Math.floor(n / 1000), centaines: Math.floor(n / 100) % 10, dizaines: Math.floor(n / 10) % 10, unites: n % 10, valeur: n };
}

/** « aucune dizaine », « 1 dizaine », « 3 dizaines ». */
function quantite(b, k) {
  if (!k) return `aucun${b.f ? 'e' : ''} ${b.un}`;
  return `${k} ${k > 1 ? b.des : b.un}`;
}

/** « 3 dizaines et 4 unités » (les blocs absents ne sont pas nommés). */
function decomposition(e) {
  const parts = BLOCS.filter((b) => e[b.cle]).map((b) => quantite(b, e[b.cle]));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0] || '';
}

/**
 * n avec exactement nb blocs `cle` : les autres blocs sont pris du plus gros au plus petit, dans
 * leurs plafonds ; null si ce n'est pas possible avec les blocs de la classe.
 */
function avecContrainte(n, cle, nb, cles) {
  const e = { milliers: 0, centaines: 0, dizaines: 0, unites: 0, valeur: n };
  e[cle] = nb;
  let reste = n - nb * blocDe(cle).valeur;
  if (reste < 0 || nb > blocDe(cle).max) return null;
  for (const b of BLOCS) {
    if (b.cle === cle || !cles.includes(b.cle)) continue;
    e[b.cle] = Math.min(b.max, Math.floor(reste / b.valeur));
    reste -= e[b.cle] * b.valeur;
  }
  return reste === 0 ? e : null;
}

const INDICES_BLOCS = {
  petit: 'Pas encore. Ton nombre est trop petit.',
  grand: 'Pas encore. Ton nombre est trop grand.',
  moins: 'Pas encore. Tu peux grouper des blocs par 10.',
  dizaines: 'Pas encore. Compte bien les dizaines.',
  centaines: 'Pas encore. Compte bien les centaines.',
  sansDizaine: 'Pas encore. Casse les dizaines en unités.',
  sansCentaine: 'Pas encore. Casse les centaines en dizaines.',
  sansMillier: 'Pas encore. Casse les milliers en centaines.',
};
const INDICE_SANS = { dizaines: INDICES_BLOCS.sansDizaine, centaines: INDICES_BLOCS.sansCentaine, milliers: INDICES_BLOCS.sansMillier };

// Les dessins des blocs (SVG) : l'unité est un petit carré, la dizaine une barre de 10, la centaine
// une plaque de 10 × 10, le millier un gros cube. Dans sa colonne, une sorte de bloc garde la même
// taille quel que soit leur nombre (la place est prévue pour le plafond) ; on les range par 5 et par
// 10, comme dans un cadre de dix, en lignes plus ou moins longues selon ce qui les dessine le plus
// grand dans la colonne (rangement).
const FORMES = {
  unites: { w: 10, h: 10, par: [5, 10, 2, 4], max: 2.4 },
  dizaines: { w: 8, h: 80, par: [10, 5], max: 2 },
  centaines: { w: 36, h: 36, par: [5, 10, 2, 4, 3], max: 1.8 },
  milliers: { w: 30, h: 30, par: [3, 5, 2], max: 2.1 },
};
const ECART = 3;
const PAQUET = 6; // écart en plus entre deux paquets de 5 sur une ligne, ou de 10

/** La place du i-ième bloc quand on en range `par` par ligne : [x, y]. */
function placeBloc(forme, par, i) {
  const col = i % par;
  const ligne = Math.floor(i / par);
  const lignesParPaquet = par === 10 ? 1 : 10 % par === 0 ? 10 / par : 0;
  return [
    col * (forme.w + ECART) + (par === 10 && col >= 5 ? PAQUET : 0),
    ligne * (forme.h + ECART) + (lignesParPaquet ? Math.floor(ligne / lignesParPaquet) * PAQUET : 0),
  ];
}

/** La place qu'il faut pour `max` blocs rangés `par` par ligne : [largeur, hauteur]. */
function placeTotale(forme, par, max) {
  return [placeBloc(forme, par, Math.min(par, max) - 1)[0] + forme.w, placeBloc(forme, par, max - 1)[1] + forme.h];
}

/**
 * Le rangement de chaque sorte de bloc dans une colonne de w × h pixels : { par, echelle } ; l'unité
 * n'est jamais beaucoup plus grande qu'un cube de la dizaine.
 */
function rangement(w, h) {
  const out = {};
  for (const b of BLOCS) {
    const forme = FORMES[b.cle];
    let best = null;
    for (const par of forme.par) {
      const [lw, lh] = placeTotale(forme, par, b.max);
      const echelle = Math.min(w / (lw + 2), h / (lh + 2), forme.max);
      if (!best || echelle > best.echelle + 1e-6) best = { par, echelle };
    }
    out[b.cle] = best;
  }
  out.unites.echelle = Math.min(out.unites.echelle, out.dizaines.echelle * 1.2);
  return out;
}

function dessinBloc(cle, x, y) {
  if (cle === 'unites') return `<rect class="bloc-unite" x="${x}" y="${y}" width="10" height="10" rx="1.5"/>`;
  if (cle === 'dizaines') {
    let traits = '';
    for (let j = 1; j < 10; j++) traits += `M${x} ${y + j * 8}h8`;
    return `<rect class="bloc-dizaine" x="${x}" y="${y}" width="8" height="80" rx="1.5"/><path class="bloc-trait" d="${traits}"/>`;
  }
  if (cle === 'centaines') {
    let traits = '';
    for (let j = 1; j < 10; j++) traits += `M${x + j * 3.6} ${y}v36M${x} ${y + j * 3.6}h36`;
    return `<rect class="bloc-centaine" x="${x}" y="${y}" width="36" height="36" rx="2"/><path class="bloc-trait" d="${traits}"/>`;
  }
  // le millier : une face avant de 24 × 24, le dessus et le côté en biais
  return `<path class="bloc-millier-haut" d="M${x} ${y + 6}l6 -6h24l-6 6z"/><path class="bloc-millier-cote" d="M${x + 24} ${y + 6}l6 -6v24l-6 6z"/>`
    + `<rect class="bloc-millier" x="${x}" y="${y + 6}" width="24" height="24"/><path class="bloc-trait" d="M${x + 8} ${y + 6}v24M${x + 16} ${y + 6}v24M${x} ${y + 14}h24M${x} ${y + 22}h24"/>`;
}

/** k blocs d'une sorte, dans une colonne de w × h pixels rangée selon `r` ({ par, echelle }). */
function blocsSvg(b, k, w, h, r) {
  const forme = FORMES[b.cle];
  const [lw] = placeTotale(forme, r.par, b.max);
  const [vw, vh] = [w / r.echelle, h / r.echelle];
  const x0 = Math.max(1, (vw - lw) / 2);
  let s = '';
  for (let i = 0; i < k; i++) {
    const [x, y] = placeBloc(forme, r.par, i);
    s += dessinBloc(b.cle, +(x0 + x).toFixed(2), y + 1);
  }
  return `<svg viewBox="0 0 ${vw.toFixed(2)} ${vh.toFixed(2)}" preserveAspectRatio="xMidYMin meet" aria-hidden="true">${s}</svg>`;
}

/**
 * Les blocs de base dix : on ajoute des unités, des dizaines, des centaines (CE1) et des milliers
 * (CE2) ; on touche un bloc pour l'enlever, ou pour le casser en 10 plus petits (« Casser »), ou
 * on groupe 10 blocs en un plus gros (« Grouper »). Le nombre s'écrit en dessous.
 */
export const baseDix = {
  id: 'base-dix',
  titre: 'Les blocs de base dix',
  icone: '🧱',
  famille: 'numeration',
  classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche plus pour ajouter un bloc. Touche un bloc pour l’enlever.',
  indices: Object.values(INDICES_BLOCS),
  vide: { milliers: 0, centaines: 0, dizaines: 0, unites: 0, valeur: 0 },
  blocs: blocsDe,

  defi(grade, rng) {
    const cles = blocsDe(grade).map((b) => b.cle);
    const fait = (d, texte) => ({ ...d, blocs: cles, ...consigneNombre(texte, d.n) });
    const montre = (min, max) => {
      const n = randInt(rng, min, max);
      return fait({ type: 'montre', n }, `Montre ${ecrit(n)}.`);
    };
    const moins = (min, max) => {
      const n = randInt(rng, min, max);
      return fait({ type: 'moins', n }, `Montre ${ecrit(n)} avec le moins de blocs possible.`);
    };
    // exactement nb blocs `cle` (nb tiré de l'écriture habituelle du nombre) : il faut casser ou grouper
    const avec = (min, max, cle, nbDe) => tirer(60, () => {
      const n = randInt(rng, min, max);
      const nb = nbDe(canonique(n));
      if (nb < 0 || nb === canonique(n)[cle] || !avecContrainte(n, cle, nb, cles)) return null;
      const b = blocDe(cle);
      let texte;
      if (nb === 0) texte = cle === 'dizaines' && !cles.includes('centaines') ? `Montre ${n} avec seulement des unités.` : `Montre ${ecrit(n)} sans ${b.un}.`;
      else if (nb < canonique(n)[cle]) texte = `Montre ${ecrit(n)} avec seulement ${quantite(b, nb)}.`;
      else texte = `Montre ${ecrit(n)} avec ${quantite(b, nb)}.`;
      return fait({ type: 'avec', n, cle, nb }, texte);
    }) || montre(min, max);
    const unDeMoins = (cle) => (c) => c[cle] - 1;
    const dixDePlus = (cle) => (c) => c[cle] + 10;
    const neufDePlus = (cle) => (c) => c[cle] + 9;
    const zero = () => 0;
    // les dizaines quand il n'y a pas de centaine : il faut casser un millier, puis une centaine
    const avecDizainesSansCentaine = () => tirer(60, () => {
      const n = randInt(rng, 1, 9) * 1000 + randInt(rng, 0, 9) * 10 + randInt(rng, 0, 9);
      const nb = canonique(n).dizaines + 10;
      return avecContrainte(n, 'dizaines', nb, cles) && fait({ type: 'avec', n, cle: 'dizaines', nb }, `Montre ${ecrit(n)} avec ${nb} dizaines.`);
    });

    if (grade === 'CP') {
      return pick(rng, [
        () => tirer(20, () => {
          const n = randInt(rng, 11, 99);
          return n % 10 ? fait({ type: 'montre', n }, `Montre ${n} avec des dizaines et des unités.`) : null;
        }),
        () => avec(20, 99, 'dizaines', unDeMoins('dizaines')),
        () => avec(11, 19, 'dizaines', zero),
        () => moins(21, 99),
      ])() || moins(21, 99);
    }
    if (grade === 'CE1') {
      return pick(rng, [
        () => montre(100, 999),
        () => moins(101, 999),
        () => avec(100, 999, 'dizaines', dixDePlus('dizaines')),
        () => avec(100, 199, 'centaines', zero),
        () => avec(30, 99, 'dizaines', unDeMoins('dizaines')),
      ])();
    }
    if (grade === 'CE2') {
      return pick(rng, [
        () => montre(1000, 9999),
        () => moins(1000, 9999),
        () => avec(1000, 9999, 'centaines', dixDePlus('centaines')),
        () => avec(100, 9999, 'dizaines', dixDePlus('dizaines')),
        () => avec(1000, 1999, 'milliers', zero),
      ])();
    }
    // CM : des échanges en chaîne (un millier en centaines, puis une centaine en dizaines…)
    return pick(rng, [
      () => moins(1000, 9999),
      () => avec(1000, 9999, 'centaines', dixDePlus('centaines')),
      () => avec(1000, 9999, 'centaines', neufDePlus('centaines')),
      avecDizainesSansCentaine,
      () => avec(1000, 1999, 'milliers', zero),
      ...(grade === 'CM2' ? [() => avec(1000, 9999, 'dizaines', neufDePlus('dizaines'))] : []),
    ])() || moins(1000, 9999);
  },

  reussi(defi, etat) {
    if (valeurBlocs(etat) !== defi.n) return false;
    if (defi.type === 'moins') return BLOCS.every((b) => (etat[b.cle] || 0) <= 9);
    if (defi.type === 'avec') return (etat[defi.cle] || 0) === defi.nb;
    return true;
  },

  solution(defi) {
    if (defi.type === 'avec') return avecContrainte(defi.n, defi.cle, defi.nb, defi.blocs);
    return canonique(defi.n);
  },

  indice(defi, etat) {
    const v = valeurBlocs(etat);
    if (v < defi.n) return INDICES_BLOCS.petit;
    if (v > defi.n) return INDICES_BLOCS.grand;
    if (defi.type === 'moins') return INDICES_BLOCS.moins;
    if (defi.type === 'avec') return defi.nb === 0 ? INDICE_SANS[defi.cle] : INDICES_BLOCS[defi.cle];
    return INDICES_BLOCS.petit;
  },

  creer({ grade }) {
    const blocs = blocsDe(grade);
    const n = { milliers: 0, centaines: 0, dizaines: 0, unites: 0 };
    let mode = null; // null : toucher un bloc l'enlève ; 'casser' ; 'grouper'
    const info = h('p', { class: 'base-dix-info', 'aria-live': 'polite' });
    const nombre = h('p', { class: 'outil-nombre base-dix-nombre outil-aide-nombre' });
    const colonnes = blocs.map((b) => ({
      b,
      zone: h('button', { class: `base-dix-zone zone-${b.cle}`, 'data-bloc': b.cle, onclick: () => toucher(b) }),
      plus: h('button', { class: 'outil-btn base-dix-plus', 'data-ajouter': b.cle, 'aria-label': `Ajouter ${b.article}`, onclick: () => ajouter(b) }, '+'),
    }));
    const tapis = h('div', { class: 'base-dix-tapis', style: { '--n': blocs.length } },
      colonnes.map(({ b, zone, plus }) => h('div', { class: `base-dix-colonne colonne-${b.cle}`, role: 'group', 'aria-label': b.titre },
        h('span', { class: 'base-dix-titre', 'aria-hidden': 'true' }, b.titre), zone, plus)));
    const modes = {
      casser: h('button', { class: 'outil-btn', 'data-mode': 'casser', 'aria-pressed': 'false', onclick: () => choisir('casser') }, '✂️ Casser'),
      grouper: h('button', { class: 'outil-btn', 'data-mode': 'grouper', 'aria-pressed': 'false', onclick: () => choisir('grouper') }, '🔗 Grouper'),
    };
    const commandes = h('div', { class: 'outil-commandes base-dix-commandes' }, modes.casser, modes.grouper,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    const etat = () => ({ ...n, valeur: valeurBlocs(n) });
    const dire = (texte) => { info.textContent = texte; };
    // la taille d'une colonne (sans ses marges) : mesurée dès que l'outil est à l'écran
    let taille = [70, 180];
    let rangs = rangement(...taille);
    function dessiner() {
      for (const { b, zone } of colonnes) {
        zone.innerHTML = blocsSvg(b, n[b.cle], ...taille, rangs[b.cle]);
        const fin = { casser: `Touche pour en casser ${b.f ? 'une' : 'un'}.`, grouper: 'Touche pour en grouper 10.' }[mode]
          || `Touche pour en enlever ${b.f ? 'une' : 'un'}.`;
        zone.setAttribute('aria-label', `${b.titre} : ${quantite(b, n[b.cle])}. ${fin}`);
      }
      for (const [m, bouton] of Object.entries(modes)) bouton.setAttribute('aria-pressed', String(mode === m));
      el.dataset.mode = mode || 'enlever';
      const v = valeurBlocs(n);
      const d = decomposition(n);
      nombre.replaceChildren(...(d ? [h('span', { class: 'base-dix-decomposition' }, `${d}\u00a0: `)] : []), h('b', {}, ecrit(v)));
    }
    function choisir(m) {
      mode = mode === m ? null : m;
      dire({ casser: 'Touche un bloc pour le casser en 10.', grouper: 'Touche une colonne de 10 blocs pour les grouper.' }[mode] || '');
      dessiner();
    }
    function ajouter(b) {
      if (n[b.cle] >= b.max) dire(`Pas plus de ${b.max} ${b.des}.`);
      else {
        n[b.cle]++;
        dire('');
      }
      dessiner();
    }
    function toucher(b) {
      const i = BLOCS.indexOf(b);
      if (mode === 'casser') {
        const petit = BLOCS[i + 1];
        if (!petit) dire('Une unité ne se casse pas.');
        else if (!n[b.cle]) dire(`Il n’y a pas de ${b.un} à casser.`);
        else if (n[petit.cle] + 10 > petit.max) dire(`Trop de ${petit.des}\u00a0: groupe-les d’abord.`);
        else {
          n[b.cle]--;
          n[petit.cle] += 10;
          dire(`1 ${b.un} = 10 ${petit.des}.`);
        }
      } else if (mode === 'grouper') {
        const gros = BLOCS[i - 1];
        if (!gros || !blocs.includes(gros)) dire(`Les ${b.des} ne se groupent pas ici.`);
        else if (n[b.cle] < 10) dire(`Il faut 10 ${b.des} pour faire ${gros.article}.`);
        else if (n[gros.cle] >= gros.max) dire(`Pas plus de ${gros.max} ${gros.des}.`);
        else {
          n[b.cle] -= 10;
          n[gros.cle]++;
          dire(`10 ${b.des} = 1 ${gros.un}.`);
        }
      } else if (n[b.cle]) {
        n[b.cle]--;
        dire('');
      }
      dessiner();
    }
    function vider() {
      for (const k of Object.keys(n)) n[k] = 0;
      mode = null;
      dire('');
      dessiner();
    }
    const el = h('div', { class: `outil-base-dix n${blocs.length}` },
      h('div', { class: 'base-dix-corps' }, tapis, h('div', { class: 'base-dix-panneau' }, nombre, info, commandes)));
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        taille = [width - 12, height - 12]; // le dessin a 6 px de marge (outils-numeration.css)
        rangs = rangement(...taille);
        dessiner();
      }).observe(colonnes[0].zone);
    }
    dessiner();
    return { el, etat, vider };
  },
};

// ================================================================ La droite numérique

const QUARTS = ['zéro', 'un quart', 'deux quarts', 'trois quarts', 'quatre quarts', 'cinq quarts', 'six quarts', 'sept quarts', 'huit quarts'];
/** 7 → « 0,7 » ; 10 → « 1 » ; 13 → « 1,3 » (dixièmes). */
const dixiemes = (i) => (i % 10 ? `${Math.floor(i / 10)},${i % 10}` : String(i / 10));

/**
 * Une droite graduée : `total` intervalles ; la valeur, l'écriture et le nom (lecteur d'écran) de la
 * graduation i ; les grands traits (tous les `grand`), les moyens (tous les `moyen`) ; les traits
 * numérotés (niveau ≥ `numeros`) ; les bonds (en intervalles) et leur écriture.
 */
function ligne(id, total, { valeur = (i) => i, texte = (i) => String(valeur(i)), nom = texte, grand = 10, moyen = 5, numeros = 0, bonds = [1], bond = (s) => texte(s) } = {}) {
  return { id, total, valeur, texte, nom, grand, moyen, numeros, bonds, bond };
}
const DROITES = {
  GS: [ligne('entiers', 10)],
  CP: [ligne('entiers', 20, { bonds: [1, 10] })],
  CE1: [ligne('entiers', 100, { numeros: 1, bonds: [1, 10] })],
  CE2: [ligne('dizaines', 100, { valeur: (i) => i * 10, texte: (i) => ecrit(i * 10), numeros: 1, bonds: [1, 10] })],
  CM1: [
    ligne('dixiemes', 10, { valeur: (i) => i / 10, texte: dixiemes, numeros: 1 }),
    ligne('quarts', 8, { valeur: (i) => i / 4, texte: (i) => (i % 4 ? `${i}/4` : String(i / 4)), nom: (i) => (i % 4 ? QUARTS[i] : String(i / 4)), grand: 4, moyen: 2, numeros: 2 }),
  ],
};
DROITES.CM2 = [ligne('dixiemes', 20, { valeur: (i) => i / 10, texte: dixiemes, numeros: 1 }), DROITES.CM1[1]];
const droitesDe = (grade) => DROITES[grade] || DROITES.GS;

const INDICES_DROITE = {
  absente: 'Pas encore. Touche une graduation pour poser la grenouille.',
  plusLoin: 'Pas encore. La grenouille doit aller plus loin.',
  tropLoin: 'Pas encore. La grenouille est allée trop loin.',
  reculeEncore: 'Pas encore. La grenouille doit reculer encore.',
  tropRecule: 'Pas encore. La grenouille a trop reculé.',
};

/**
 * La droite numérique : une droite graduée selon la classe (0 à 10 en GS, 0 à 20 au CP, 0 à 100 au
 * CE1, 0 à 1 000 au CE2, dixièmes et quarts au CM). On touche une graduation pour y poser la
 * grenouille, puis on la fait sauter (une autre graduation, ou les bonds « +1 », « −10 »…) : chaque
 * saut dessine un arc. Les graduations restent assez larges pour le doigt : si la droite est trop
 * longue pour l'écran, on en voit un morceau, et « ◀ » / « ▶ » montrent les autres.
 */
export const droiteNumerique = {
  id: 'droite',
  titre: 'La droite numérique',
  icone: '📏',
  famille: 'numeration',
  classes: ['GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche une graduation pour poser la grenouille, puis fais-la sauter.',
  indices: Object.values(INDICES_DROITE),
  vide: { valeur: null, ligne: null },
  droites: droitesDe,

  defi(grade, rng) {
    const [l, quarts] = droitesDe(grade);
    const fait = (lg, d, texte) => ({ ...d, ligne: lg.id, cible: lg.valeur(d.but), ...consigneNombre(texte, lg.valeur(d.but)) });
    // les fractions se disent et s'écrivent en lettres : « trois quarts »
    const nomDe = (lg, i) => (lg.id === 'quarts' ? QUARTS[i] : lg.texte(i));
    const place = (lg, min, max) => {
      const but = randInt(rng, min, max);
      return fait(lg, { type: 'place', but }, `Place la grenouille sur ${nomDe(lg, but)}.`);
    };
    const demi = (lg) => fait(lg, { type: 'place', but: lg.id === 'quarts' ? 2 : 5 }, 'Place la grenouille sur un demi.');
    // avancer ou reculer de `pas` intervalles (tirés dans `pas`) depuis une graduation de [min, max]
    const saute = (lg, sens, min, max, pas) => tirer(60, () => {
      const depart = randInt(rng, min, max);
      const s = pick(rng, pas);
      const but = depart + sens * s;
      if (but < 0 || but > lg.total) return null;
      const verbe = sens > 0 ? 'avancer' : 'reculer';
      return fait(lg, { type: sens > 0 ? 'avance' : 'recule', depart, but }, `La grenouille est sur ${nomDe(lg, depart)}. Fais-la ${verbe} de ${nomDe(lg, s)}.`);
    });
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const choix = {
      GS: [() => place(l, 1, 10), () => saute(l, 1, 0, 7, [1, 2, 3]), () => saute(l, -1, 3, 10, [1, 2, 3])],
      CP: [() => place(l, 2, 20), () => saute(l, 1, 0, 15, range(2, 6)), () => saute(l, -1, 6, 20, range(2, 6)),
        () => saute(l, 1, 0, 10, [10]), () => saute(l, -1, 10, 20, [10])],
      CE1: [() => place(l, 11, 99), () => saute(l, 1, 10, 70, [10, 20, 30, 12, 15, 21, 25]), () => saute(l, -1, 30, 100, [10, 20, 30, 11, 13, 22])],
      CE2: [() => place(l, 2, 99), () => saute(l, 1, 10, 70, [10, 20, 30, 3, 5, 12, 15]), () => saute(l, -1, 30, 100, [10, 20, 4, 6, 11, 25])],
      CM1: [() => place(l, 1, 9), () => place(quarts, 1, 7), () => demi(pick(rng, [l, quarts])), () => saute(l, 1, 0, 6, [2, 3, 4, 5]),
        () => saute(l, -1, 4, 10, [2, 3, 4])],
      CM2: [() => tirer(20, () => { const d = place(l, 1, 19); return d.but % 10 ? d : null; }), () => place(quarts, 1, 7),
        () => saute(l, 1, 2, 14, [3, 4, 5, 6, 7]), () => saute(l, -1, 8, 19, [3, 5, 6, 7]), () => saute(quarts, 1, 1, 3, [1, 2, 3])],
    };
    return pick(rng, choix[grade] || choix.GS)() || place(l, 1, l.total);
  },

  reussi(defi, etat) {
    return etat.valeur !== null && etat.valeur !== undefined && Math.abs(etat.valeur - defi.cible) < 1e-9;
  },

  solution(defi) {
    return { valeur: defi.cible, ligne: defi.ligne };
  },

  indice(defi, etat) {
    if (etat.valeur === null || etat.valeur === undefined) return INDICES_DROITE.absente;
    if (defi.type === 'recule') return etat.valeur > defi.cible ? INDICES_DROITE.reculeEncore : INDICES_DROITE.tropRecule;
    return etat.valeur < defi.cible ? INDICES_DROITE.plusLoin : INDICES_DROITE.tropLoin;
  },

  creer({ grade }) {
    const lignes = droitesDe(grade);
    let lg = lignes[0];
    let pos = null; // la graduation de la grenouille
    let sauts = []; // { de, a } : les arcs dessinés
    let debut = 0; // première graduation montrée
    let largeur = Math.min((globalThis.innerWidth || 375) - 32, 568);
    let k = morceau();

    const svgNs = 'http://www.w3.org/2000/svg';
    const arcs = document.createElementNS(svgNs, 'svg');
    arcs.setAttribute('class', 'droite-arcs');
    arcs.setAttribute('viewBox', '0 0 100 50');
    arcs.setAttribute('preserveAspectRatio', 'none');
    arcs.setAttribute('aria-hidden', 'true');
    const dessinLigne = h('div', { class: 'droite-dessin', 'aria-hidden': 'true' });
    const graduations = h('div', { class: 'droite-graduations', role: 'group', 'aria-label': 'Graduations' });
    const zone = h('div', { class: 'droite-ligne' }, arcs, dessinLigne, graduations);
    const nombre = h('p', { class: 'outil-nombre droite-nombre outil-aide-nombre' });
    const avant = h('button', { class: 'outil-btn droite-nav', 'data-nav': '-1', 'aria-label': 'Voir les nombres plus petits', onclick: () => naviguer(-1) }, '◀');
    const apres = h('button', { class: 'outil-btn droite-nav', 'data-nav': '1', 'aria-label': 'Voir les nombres plus grands', onclick: () => naviguer(1) }, '▶');
    const boutonsModes = lignes.length > 1 ? lignes.map((x) => h('button', {
      class: 'outil-btn', 'data-ligne': x.id, 'aria-pressed': 'false', onclick: () => changer(x),
    }, x.id === 'quarts' ? 'Quarts' : 'Dixièmes')) : [];
    const bonds = h('div', { class: 'droite-bonds' });
    const commandes = h('div', { class: 'outil-commandes droite-commandes' }, boutonsModes, avant, bonds, apres,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    /** Combien d'intervalles montrer : toute la droite si les graduations restent assez larges (28 px). */
    function morceau() {
      const options = [lg.total, 20, 10].filter((c) => c <= lg.total);
      return options.find((c) => largeur / (c + 1) >= 28) || options.at(-1);
    }
    const x = (i) => ((i - debut + 0.5) / (k + 1)) * 100;
    // la hauteur d'un arc (sur 50, la hauteur de son dessin) : plus le saut est long, plus il monte
    const hauteur = (de, a) => Math.min(40, 14 + Math.abs(x(a) - x(de)) * 0.4);
    const niveau = (i) => (i % lg.grand === 0 ? 2 : i % lg.moyen === 0 ? 1 : 0);
    function montrer(i) {
      if (i < debut || i > debut + k) debut = Math.max(0, Math.min(lg.total - k, i - Math.floor(k / 2)));
    }
    function dessiner() {
      debut = Math.max(0, Math.min(lg.total - k, debut));
      const fin = debut + k;
      // les arcs (étirés avec la droite : leur trait garde son épaisseur)
      arcs.replaceChildren(...sauts.map(({ de, a }) => {
        const p = hauteur(de, a);
        const path = document.createElementNS(svgNs, 'path');
        path.setAttribute('d', `M${x(de)} 50 Q${(x(de) + x(a)) / 2} ${50 - 2 * p} ${x(a)} 50`);
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        return path;
      }));
      // l'axe part de 0 quand on voit le début de la droite, sinon du bord
      const items = [h('span', { class: 'droite-axe', style: { left: debut === 0 ? `${x(0)}%` : '0' } })];
      for (let i = debut; i <= fin; i++) {
        items.push(h('span', { class: `droite-trait n${niveau(i)}`, style: { left: `${x(i)}%` } }));
        if (niveau(i) >= lg.numeros) items.push(h('span', { class: 'droite-numero', style: { left: `${x(i)}%` } }, lg.texte(i)));
      }
      for (const { de, a } of sauts) {
        const milieu = (x(de) + x(a)) / 2;
        if (milieu < 2 || milieu > 98) continue;
        const p = hauteur(de, a);
        const s = Math.abs(a - de);
        items.push(h('span', { class: 'droite-saut', style: { left: `${milieu}%`, '--haut': ((50 - p) / 50).toFixed(3) } }, `${a > de ? '+' : '−'}${lg.texte(s)}`));
      }
      if (pos !== null && pos >= debut && pos <= fin) items.push(h('span', { class: 'droite-grenouille', style: { left: `${x(pos)}%` } }, '🐸'));
      dessinLigne.replaceChildren(...items);
      graduations.replaceChildren(...Array.from({ length: k + 1 }, (_, j) => {
        const i = debut + j;
        return h('button', {
          class: `droite-grad${i === pos ? ' ici' : ''}`, 'data-grad': i,
          style: { left: `${(j / (k + 1)) * 100}%`, width: `${100 / (k + 1)}%` },
          'aria-label': `${lg.nom(i)}${i === pos ? ' : la grenouille est ici' : ''}`,
          onclick: () => aller(i),
        });
      }));
      avant.hidden = apres.hidden = k >= lg.total;
      avant.disabled = debut <= 0;
      apres.disabled = fin >= lg.total;
      bonds.replaceChildren(...[...lg.bonds].reverse().map((s) => bouton(-s)), ...lg.bonds.map((s) => bouton(s)));
      for (const b of boutonsModes) b.setAttribute('aria-pressed', String(b.dataset.ligne === lg.id));
      nombre.textContent = pos === null ? 'Touche une graduation.' : `La grenouille est sur ${lg.texte(pos)}.`;
    }
    // « +1/4 » : ce qui est écrit sur le bouton commence son nom (lecteur d'écran)
    const bouton = (s) => h('button', { class: 'outil-btn droite-bond', 'data-bond': s, onclick: () => sauter(s) },
      `${s > 0 ? '+' : '−'}${lg.bond(Math.abs(s))}`, h('span', { class: 'visually-hidden' }, ` : un bond en ${s > 0 ? 'avant' : 'arrière'}`));
    function aller(i) {
      if (pos !== null && i !== pos) sauts = [...sauts, { de: pos, a: i }].slice(-8);
      pos = i;
      montrer(i);
      dessiner();
    }
    function sauter(s) {
      const depart = pos ?? 0;
      if (depart + s < 0 || depart + s > lg.total) return;
      if (pos === null) pos = 0;
      aller(depart + s);
    }
    function naviguer(sens) {
      debut += sens * k;
      dessiner();
    }
    function changer(x2) {
      if (x2 === lg) return;
      lg = x2;
      vider();
    }
    function vider() {
      pos = null;
      sauts = [];
      debut = 0;
      k = morceau();
      dessiner();
    }
    function preparer(defi) {
      if (!defi) return;
      lg = lignes.find((x2) => x2.id === defi.ligne) || lignes[0];
      vider();
      if (defi.depart !== undefined) {
        pos = defi.depart;
        montrer(pos);
        dessiner();
      }
    }
    // la largeur réelle de la droite décide du morceau montré
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(([entry]) => {
        const w = entry.contentRect.width;
        if (!w || Math.abs(w - largeur) < 1) return;
        largeur = w;
        const avantK = k;
        k = morceau();
        if (k !== avantK) {
          if (pos !== null) montrer(pos);
          dessiner();
        }
      }).observe(zone);
    }
    dessiner();
    return {
      el: h('div', { class: 'outil-droite' }, zone, nombre, commandes),
      etat: () => ({ valeur: pos === null ? null : lg.valeur(pos), ligne: lg.id }),
      vider, preparer,
    };
  },
};

// ================================================================ La balance des nombres

const zeros = () => Array(10).fill(0);
const somme = (poids) => poids.reduce((s, c, i) => s + c * (i + 1), 0);
const compte = (poids) => poids.reduce((s, c) => s + c, 0);

/**
 * Des poids à droite (au plus 3 par graduation) qui pèsent `cible` : exactement `nb` poids s'il est
 * donné, au moins un sur `sur`, seulement sur `seulSur` ; le moins de poids possible. null sinon.
 */
function chercherDroite(cible, { nb, sur, seulSur } = {}) {
  const poids = zeros();
  const tailles = nb ? [nb] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  function placer(reste, valeurReste, max) {
    if (reste === 0) return valeurReste === 0;
    for (let p = Math.min(max, 10); p >= 1; p--) {
      if (seulSur && p !== seulSur) continue;
      if (poids[p - 1] >= 3 || p > valeurReste) continue;
      poids[p - 1]++;
      if (placer(reste - 1, valeurReste - p, p)) return true;
      poids[p - 1]--;
    }
    return false;
  }
  for (const t of tailles) {
    poids.fill(0);
    if (sur) {
      poids[sur - 1] = 1;
      if (placer(t - 1, cible - sur, 10)) return poids;
    } else if (placer(t, cible, 10)) return poids;
  }
  return null;
}

const INDICES_BALANCE = {
  gauche: 'Pas encore. Laisse les poids de gauche comme au début.',
  penche: 'Pas encore. La balance doit pencher à droite.',
  manque: 'Pas encore. Il manque du poids à droite.',
  trop: 'Pas encore. Il y a trop de poids à droite.',
  nombre: 'Pas encore. La balance est en équilibre, mais compte bien les poids à droite.',
  dix: 'Pas encore. Il faut un poids sur le 10.',
  seulSur: 'Pas encore. Écoute bien la consigne : sur quel nombre faut-il accrocher les poids ?',
};

/** « un poids sur le 8 et un poids sur le 6 », « 2 poids sur le 3 ». */
function poidsTexte(liste) {
  const parts = liste.map(([p, c]) => `${c === 1 ? 'un poids' : `${c} poids`} sur le ${p}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0];
}

/** L'inclinaison du fléau, en degrés (vers la droite si elle est plus lourde) : plus l'écart est grand, plus elle penche. */
function inclinaison(gauche, droite) {
  const ecart = somme(droite) - somme(gauche);
  return ecart ? Math.sign(ecart) * Math.min(12, 4 + Math.abs(ecart) * 0.5) : 0;
}

/** Le dessin de la balance (SVG) : le fléau gradué de 1 à 10 de chaque côté, les poids suspendus. */
function balanceSvg(gauche, droite, fixes) {
  const PX = 315;
  const PY = 96;
  const angle = inclinaison(gauche, droite);
  const rad = (angle * Math.PI) / 180;
  let s = `<polygon class="bal-pied" points="${PX},${PY} ${PX - 30},${PY + 130} ${PX + 30},${PY + 130}"/>`
    + `<rect class="bal-socle" x="${PX - 90}" y="${PY + 128}" width="180" height="12" rx="6"/>`
    + `<g transform="rotate(${angle.toFixed(2)} ${PX} ${PY})"><rect class="bal-fleau" x="3" y="${PY - 6}" width="624" height="12" rx="6"/>`;
  for (let n = 1; n <= 10; n++) {
    for (const sens of [-1, 1]) {
      const x = PX + sens * n * 30;
      s += `<circle class="bal-cheville" cx="${x}" cy="${PY}" r="3.5"/><text class="bal-num" x="${x}" y="${PY - 13}">${n}</text>`;
    }
  }
  s += `</g><circle class="bal-pivot" cx="${PX}" cy="${PY}" r="10"/>`;
  // les poids pendent droit, sous la graduation (qui a tourné avec le fléau)
  for (const [poids, sens] of [[gauche, -1], [droite, 1]]) {
    poids.forEach((c, i) => {
      if (!c) return;
      const dx = sens * (i + 1) * 30;
      const x = PX + dx * Math.cos(rad);
      const y = PY + dx * Math.sin(rad);
      s += `<line class="bal-fil" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 8 + (c - 1) * 16).toFixed(1)}"/>`;
      for (let j = 0; j < c; j++) {
        const fixe = sens < 0 && j < fixes[i];
        s += `<rect class="bal-poids${fixe ? ' fixe' : ''}" x="${(x - 11).toFixed(1)}" y="${(y + 8 + j * 16).toFixed(1)}" width="22" height="14" rx="3"/>`;
      }
    });
  }
  return `<svg viewBox="0 0 630 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
    + `<defs><pattern id="bal-raye" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#5b4a99"/><rect width="2.5" height="6" fill="#c9bcf5"/></pattern></defs>${s}</svg>`;
}

/**
 * La balance des nombres : un fléau gradué de 1 à 10 de chaque côté. On touche un nombre pour y
 * accrocher un poids (jusqu'à 3), puis encore pour les enlever ; la balance penche du côté le plus
 * lourd (un poids sur le 7 pèse 7), et une phrase le dit. Pendant un défi, les poids de gauche
 * sont imposés.
 */
export const balance = {
  id: 'balance',
  titre: 'La balance des nombres',
  icone: '⚖️',
  famille: 'numeration',
  classes: ['GS', 'CP', 'CE1'],
  aide: 'Touche un nombre pour y accrocher un poids. Après 3 poids, touche encore pour les enlever.',
  indices: Object.values(INDICES_BALANCE),
  vide: { gauche: zeros(), droite: zeros() },

  defi(grade, rng) {
    // les poids imposés à gauche : [[graduation, nombre de poids], …]
    const fait = (liste, contrainte, fin) => {
      if (!liste) return null;
      const gauche = zeros();
      for (const [p, c] of liste) gauche[p - 1] += c;
      const type = contrainte.penche ? 'penche' : 'equilibre';
      const cible = contrainte.penche ? somme(gauche) + 1 : somme(gauche);
      const { penche, ...reste } = contrainte;
      if (!chercherDroite(cible, reste)) return null;
      return { type, gauche, ...reste, consigne: `À gauche, il y a ${poidsTexte(liste)}. ${fin}` };
    };
    const deux = (min, max) => tirer(60, () => {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 9);
      return a !== b && a + b >= min && a + b <= max ? [[a, 1], [b, 1]] : null;
    });
    const choix = {
      GS: [
        () => fait([[randInt(rng, 2, 10), 1]], {}, 'Équilibre la balance.'),
        () => fait([[randInt(rng, 2, 10), 1]], { nb: 1 }, 'Équilibre la balance avec un seul poids.'),
        () => fait([[randInt(rng, 3, 10), 1]], { nb: 2 }, 'Équilibre la balance avec 2 poids.'),
        () => fait([[randInt(rng, 2, 9), 1]], { penche: true }, 'Fais pencher la balance à droite.'),
      ],
      CP: [
        () => fait(deux(3, 10), { nb: 1 }, 'Équilibre la balance avec un seul poids.'),
        () => fait(deux(11, 17), { nb: 2 }, 'Équilibre la balance avec 2 poids.'),
        () => fait([[randInt(rng, 2, 5), 2]], { nb: 1 }, 'Équilibre la balance avec un seul poids.'),
        () => fait([[randInt(rng, 3, 10), 1]], { nb: 3 }, 'Équilibre la balance avec 3 poids.'),
        () => fait(deux(8, 16), {}, 'Équilibre la balance.'),
      ],
      CE1: [
        () => fait(deux(11, 18), { nb: 2, sur: 10 }, 'Équilibre la balance avec un poids sur le 10 et un autre poids.'),
        () => fait([[randInt(rng, 4, 6), 3]], { nb: 2 }, 'Équilibre la balance avec 2 poids.'),
        () => tirer(20, () => {
          const p = randInt(rng, 2, 5);
          const n = p * randInt(rng, 2, 3);
          return n <= 10 && fait([[n, 1]], { seulSur: p }, `Équilibre la balance avec des poids sur le ${p}.`);
        }),
        () => tirer(20, () => {
          const [a, b, c] = [randInt(rng, 5, 9), randInt(rng, 3, 8), randInt(rng, 1, 6)];
          return a !== b && b !== c && a !== c && a + b + c <= 20 && a + b + c > 10 && fait([[a, 1], [b, 1], [c, 1]], { nb: 2 }, 'Équilibre la balance avec 2 poids.');
        }),
        () => fait([[randInt(rng, 6, 9), 2]], { nb: 3 }, 'Équilibre la balance avec 3 poids.'),
      ],
    };
    const liste = choix[grade] || choix.GS;
    return tirer(30, () => pick(rng, liste)()) || fait([[5, 1]], {}, 'Équilibre la balance.');
  },

  reussi(defi, etat) {
    if (etat.gauche.some((c, i) => c !== defi.gauche[i])) return false;
    const g = somme(etat.gauche);
    const d = somme(etat.droite);
    if (defi.type === 'penche') return d > g;
    if (g !== d) return false;
    if (defi.nb && compte(etat.droite) !== defi.nb) return false;
    if (defi.sur && !etat.droite[defi.sur - 1]) return false;
    if (defi.seulSur && etat.droite.some((c, i) => c && i !== defi.seulSur - 1)) return false;
    return true;
  },

  solution(defi) {
    const { nb, sur, seulSur } = defi;
    const cible = somme(defi.gauche) + (defi.type === 'penche' ? 1 : 0);
    return { gauche: defi.gauche.slice(), droite: chercherDroite(cible, { nb, sur, seulSur }) };
  },

  indice(defi, etat) {
    if (etat.gauche.some((c, i) => c !== defi.gauche[i])) return INDICES_BALANCE.gauche;
    if (defi.type === 'penche') return INDICES_BALANCE.penche;
    const ecart = somme(etat.droite) - somme(etat.gauche);
    if (ecart < 0) return INDICES_BALANCE.manque;
    if (ecart > 0) return INDICES_BALANCE.trop;
    if (defi.seulSur && etat.droite.some((c, i) => c && i !== defi.seulSur - 1)) return INDICES_BALANCE.seulSur;
    if (defi.sur && !etat.droite[defi.sur - 1]) return INDICES_BALANCE.dix;
    return INDICES_BALANCE.nombre;
  },

  creer() {
    const cotes = { gauche: zeros(), droite: zeros() };
    let fixes = zeros(); // les poids imposés à gauche pendant un défi
    let enDefi = false;
    const dessin = h('div', { class: 'balance-dessin' });
    const phrase = h('p', { class: 'balance-phrase', 'aria-live': 'polite' });
    const sommes = h('p', { class: 'outil-nombre balance-sommes outil-aide-nombre' });
    const cles = { gauche: [], droite: [] };
    // les nombres de chaque côté, sur deux rangées, en miroir : le 1 près du milieu, le 10 au bord
    const clavier = (cote) => h('div', { class: `balance-cote ${cote}`, role: 'group', 'aria-label': cote === 'gauche' ? 'À gauche' : 'À droite' },
      h('span', { class: 'balance-titre', 'aria-hidden': 'true' }, cote === 'gauche' ? 'À gauche' : 'À droite'),
      h('div', { class: 'balance-clavier' }, Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const col = cote === 'gauche' ? 5 - (i % 5) : (i % 5) + 1;
        const b = h('button', {
          class: 'balance-cle', 'data-cote': cote, 'data-n': n, style: { gridColumn: String(col), gridRow: n <= 5 ? '1' : '2' },
          onclick: () => toucher(cote, i),
        }, h('span', { class: 'balance-n' }, n), h('span', { class: 'balance-marques', 'aria-hidden': 'true' }));
        cles[cote].push(b);
        return b;
      })));
    const claviers = h('div', { class: 'balance-claviers' }, clavier('gauche'), clavier('droite'));
    const commandes = h('div', { class: 'outil-commandes balance-commandes' },
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function dessiner() {
      const { gauche, droite } = cotes;
      dessin.innerHTML = balanceSvg(gauche, droite, fixes);
      for (const cote of ['gauche', 'droite']) {
        cles[cote].forEach((b, i) => {
          const c = cotes[cote][i];
          const f = cote === 'gauche' ? fixes[i] : 0;
          b.querySelector('.balance-marques').replaceChildren(...Array.from({ length: c }, (_, j) => h('i', { class: j < f ? 'fixe' : '' })));
          b.classList.toggle('charge', c > 0);
          b.disabled = cote === 'gauche' && enDefi;
          b.setAttribute('aria-label', `${cote === 'gauche' ? 'À gauche' : 'À droite'}, sur le ${i + 1} : ${c ? `${c} poids` : 'aucun poids'}${f ? `, dont ${f} imposé${f > 1 ? 's' : ''}` : ''}`);
        });
      }
      const ecart = somme(droite) - somme(gauche);
      phrase.textContent = ecart < 0 ? 'La balance penche à gauche.' : ecart > 0 ? 'La balance penche à droite.' : 'La balance est en équilibre.';
      phrase.dataset.penche = ecart < 0 ? 'gauche' : ecart > 0 ? 'droite' : 'non';
      // les poids de chaque côté, et leur somme
      const termes = (poids) => {
        const t = poids.flatMap((c, i) => Array(c).fill(i + 1)).reverse();
        return !t.length ? '0' : t.length <= 4 ? t.join(' + ') : String(somme(poids));
      };
      sommes.textContent = `${termes(gauche)} ${ecart > 0 ? '<' : ecart < 0 ? '>' : '='} ${termes(droite)}`;
    }
    function toucher(cote, i) {
      const poids = cotes[cote];
      const f = cote === 'gauche' ? fixes[i] : 0;
      poids[i] = poids[i] >= 3 ? f : poids[i] + 1;
      dessiner();
    }
    function vider() {
      cotes.gauche = fixes.slice();
      cotes.droite = zeros();
      dessiner();
    }
    function preparer(defi) {
      enDefi = Boolean(defi);
      fixes = defi ? defi.gauche.slice() : zeros();
      if (defi) vider();
      else dessiner();
    }
    dessiner();
    return {
      el: h('div', { class: 'outil-balance' }, h('div', { class: 'balance-corps' }, dessin, h('div', { class: 'balance-panneau' }, phrase, sommes, claviers, commandes))),
      etat: () => ({ gauche: cotes.gauche.slice(), droite: cotes.droite.slice() }),
      vider, preparer,
    };
  },
};

export const NUMERATION = [baseDix, droiteNumerique, balance];
