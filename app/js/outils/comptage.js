// Outils pour compter : le cadre de dix (le modèle des autres outils), les jetons bicolores, le
// tableau de cent, les dés et la roue.
//
// Un outil se manipule librement ; ses défis, sans note, sont tirés selon la classe. Le contrat
// d'un outil est décrit dans ../outils.js.

import { h } from '../render.js';
import { createRng, pick, randInt, sample } from '../random.js';

const COULEURS = { rouge: 'rouge', jaune: 'jaune' };

/** « 1 jeton », « 7 jetons ». */
function jetons(n, couleur = '') {
  return `${n} jeton${n > 1 ? 's' : ''}${couleur ? ` ${couleur}${n > 1 ? 's' : ''}` : ''}`;
}

const INDICES_CADRE = {
  compte: 'Pas encore. Compte bien les jetons.',
  rouges: 'Pas encore. Compte d’abord les jetons rouges.',
  plein: 'Pas encore. Le cadre doit être plein.',
  pleins: 'Pas encore. Les deux cadres doivent être pleins.',
};

/**
 * Le cadre de dix : 10 cases sur deux rangées de 5 (deux cadres, 20 cases, à partir du CP). On
 * touche une case pour poser un jeton de la couleur choisie, un jeton pour l'enlever.
 */
export const cadreDix = {
  id: 'cadre-dix',
  titre: 'Le cadre de dix',
  icone: '🔟',
  famille: 'comptage',
  classes: ['PS', 'MS', 'GS', 'CP', 'CE1'],
  aide: 'Touche une case pour poser un jeton. Touche un jeton pour l’enlever.',
  indices: Object.values(INDICES_CADRE),
  vide: { rouge: 0, jaune: 0, total: 0 },

  /** Deux cadres (20 cases) à partir du CP. */
  cases(grade) {
    return ['CP', 'CE1'].includes(grade) ? 20 : 10;
  },

  defi(grade, rng) {
    const montre = (min, max) => {
      const n = randInt(rng, min, max);
      return { type: 'montre', n, consigne: `Pose ${jetons(n)} dans le cadre.` };
    };
    const complete = (min, max, total) => {
      const n = randInt(rng, min, max);
      const fin = total === 10 ? 'complète le cadre avec des jetons jaunes.' : 'complète les deux cadres avec des jetons jaunes.';
      return { type: 'complete', n, total, consigne: `Pose ${jetons(n, 'rouge')}, puis ${fin}` };
    };
    if (grade === 'PS') return montre(1, 3);
    if (grade === 'MS') return montre(1, 6);
    if (grade === 'GS') return pick(rng, [() => montre(1, 10), () => montre(4, 10), () => complete(1, 9, 10)])();
    if (grade === 'CP') return pick(rng, [() => montre(6, 20), () => complete(1, 9, 10)])();
    return pick(rng, [() => montre(11, 20), () => complete(11, 19, 20)])();
  },

  reussi(defi, etat) {
    if (defi.type === 'montre') return etat.total === defi.n;
    return etat.rouge === defi.n && etat.jaune === defi.total - defi.n;
  },

  /** Un état qui répond au défi (pour les tests). */
  solution(defi) {
    if (defi.type === 'montre') return { rouge: defi.n, jaune: 0, total: defi.n };
    return { rouge: defi.n, jaune: defi.total - defi.n, total: defi.total };
  },

  indice(defi, etat) {
    if (defi.type === 'montre') return INDICES_CADRE.compte;
    if (etat.rouge !== defi.n) return INDICES_CADRE.rouges;
    return defi.total === 10 ? INDICES_CADRE.plein : INDICES_CADRE.pleins;
  },

  creer({ grade }) {
    const n = cadreDix.cases(grade);
    const contenu = Array(n).fill(null); // null, 'rouge' ou 'jaune'
    let couleur = 'rouge';
    const total = h('p', { class: 'outil-nombre outil-aide-nombre', 'aria-live': 'polite' });
    const cases = contenu.map((_, i) => h('button', { class: 'case', 'data-case': i, onclick: () => toucher(i) }));
    const cadres = h('div', { class: `cadres n${n}` },
      Array.from({ length: n / 10 }, (_, k) => h('div', { class: 'cadre', role: 'group', 'aria-label': n > 10 ? `Cadre ${k + 1}` : 'Cadre de dix' },
        cases.slice(k * 10, k * 10 + 10))));
    const choix = Object.keys(COULEURS).map((c) => h('button', {
      class: 'outil-btn jeton-choix', 'data-couleur': c, 'aria-pressed': String(c === couleur),
      onclick: () => { couleur = c; dessiner(); },
    }, h('span', { class: `jeton ${c}`, 'aria-hidden': 'true' }), ` ${c[0].toUpperCase()}${c.slice(1)}`));
    const voirNombre = h('button', { class: 'outil-btn outil-aide-nombre', 'data-voir-nombre': '', 'aria-pressed': 'false', onclick: () => {
      voirNombre.setAttribute('aria-pressed', String(voirNombre.getAttribute('aria-pressed') !== 'true'));
      dessiner();
    } }, '👁 Combien ?');
    const commandes = h('div', { class: 'outil-commandes' }, choix, voirNombre,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      const rouge = contenu.filter((c) => c === 'rouge').length;
      const jaune = contenu.filter((c) => c === 'jaune').length;
      return { rouge, jaune, total: rouge + jaune };
    }
    function dessiner() {
      contenu.forEach((c, i) => {
        cases[i].replaceChildren(...(c ? [h('span', { class: `jeton ${c}`, 'aria-hidden': 'true' })] : []));
        cases[i].setAttribute('aria-label', `Case ${i + 1} : ${c ? `jeton ${c}` : 'vide'}`);
      });
      choix.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.couleur === couleur)));
      const { rouge, jaune, total: t } = etat();
      total.hidden = voirNombre.getAttribute('aria-pressed') !== 'true';
      total.textContent = rouge && jaune ? `${rouge} + ${jaune} = ${t}` : String(t);
    }
    function toucher(i) {
      contenu[i] = contenu[i] ? null : couleur;
      dessiner();
    }
    function vider() {
      contenu.fill(null);
      dessiner();
    }
    dessiner();
    return { el: h('div', { class: 'outil-cadre-dix' }, cadres, total, commandes), etat, vider };
  },
};

// ---------------------------------------------------------------- Aides communes

/** « 1 rouge », « 4 jaunes ». */
function nCouleur(n, couleur) {
  return `${n} ${couleur}${n > 1 ? 's' : ''}`;
}

/** Les nombres de a à b, de p en p. */
function suiteDe(a, b, p = 1) {
  const out = [];
  for (let n = a; n <= b; n += p) out.push(n);
  return out;
}

/** Rejoue la petite animation d'un élément (classe « pop ») : retirée, puis remise. */
function rejouer(el) {
  el.classList.remove('pop');
  void el.offsetWidth; // sans ce calcul, le navigateur ne verrait aucun changement
  el.classList.add('pop');
}

/** Pas d'animation : réglage du système, ou mode calme du profil (a11y.js). */
function sansAnimation() {
  return document.body.classList.contains('a11y-calm') || Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

// ---------------------------------------------------------------- Les jetons bicolores

const MAX_JETONS = 20;

const INDICES_JETONS = {
  tous: 'Pas encore. Compte tous les jetons.',
  rouges: 'Pas encore. Compte les jetons rouges.',
  jaunes: 'Pas encore. Compte les jetons jaunes.',
  couleur: 'Pas encore. Regarde bien la couleur des jetons.',
  autant: 'Pas encore. Il faut autant de jetons rouges que de jetons jaunes.',
  double: 'Pas encore. Pour le double, compte 2 fois les jetons rouges.',
  ecart: 'Pas encore. Compte combien il y a de jetons rouges de plus que de jetons jaunes.',
};

/**
 * Les jetons bicolores : rouges d'un côté, jaunes de l'autre. On en ajoute (20 au plus, rangés par
 * lignes de 5), on touche un jeton pour le retourner : décompositions, doubles et moitiés.
 */
export const jetonsBicolores = {
  id: 'jetons',
  titre: 'Les jetons',
  icone: '🔴',
  famille: 'comptage',
  classes: ['MS', 'GS', 'CP', 'CE1'],
  aide: 'Touche un bouton pour ajouter un jeton rouge ou jaune. Touche un jeton pour le retourner.',
  indices: Object.values(INDICES_JETONS),
  vide: { rouge: 0, jaune: 0, total: 0 },
  max: MAX_JETONS,

  /** Chaque défi demande un nombre précis de jetons rouges et de jetons jaunes. */
  defi(grade, rng) {
    const cible = (type, rouge, jaune, consigne) => ({ type, rouge, jaune, consigne });
    const uneCouleur = (min, max) => {
      const n = randInt(rng, min, max);
      return rng() < 0.5 ? cible('couleur', n, 0, `Pose ${jetons(n, 'rouge')}.`) : cible('couleur', 0, n, `Pose ${jetons(n, 'jaune')}.`);
    };
    const deux = (max) => {
      const r = randInt(rng, 1, max - 1);
      const j = randInt(rng, 1, max - r);
      return cible('deux', r, j, `Pose ${jetons(r, 'rouge')} et ${jetons(j, 'jaune')}.`);
    };
    const total = (min, max) => {
      const n = randInt(rng, min, max);
      const r = randInt(rng, 1, n - 1);
      return cible('total', r, n - r, `Pose ${jetons(n)}, dont ${nCouleur(r, 'rouge')} et ${nCouleur(n - r, 'jaune')}.`);
    };
    // une décomposition : les autres jetons sont de l'autre couleur
    const dont = (n) => {
      const k = randInt(rng, 1, n - 1);
      return rng() < 0.5 ? cible('dont', k, n - k, `Pose ${jetons(n)}, dont ${nCouleur(k, 'rouge')}.`)
        : cible('dont', n - k, k, `Pose ${jetons(n)}, dont ${nCouleur(k, 'jaune')}.`);
    };
    const autant = (min, max) => {
      const n = randInt(rng, min, max);
      return cible('autant', n, n, `Pose ${jetons(n, 'rouge')} et autant de jaunes.`);
    };
    const moitie = (min, max) => {
      const n = 2 * randInt(rng, min / 2, max / 2);
      return cible('moitie', n / 2, n / 2, `Pose ${jetons(n)}, moitié rouges et moitié jaunes.`);
    };
    const double = (min, max) => {
      const r = randInt(rng, min, max);
      return cible('double', r, 2 * r, `Pose ${jetons(r, 'rouge')}, puis le double de jetons jaunes.`);
    };
    // un problème : le total et l'écart (entre 9 et 19 jetons)
    const ecart = () => {
      const d = randInt(rng, 1, 5);
      const j = randInt(rng, Math.ceil((9 - d) / 2), Math.floor((19 - d) / 2));
      return cible('ecart', j + d, j, `Pose ${jetons(2 * j + d)}, avec ${nCouleur(d, 'rouge')} de plus que de jaunes.`);
    };
    const choix = {
      MS: [() => uneCouleur(1, 5), () => deux(5), () => total(2, 5)],
      GS: [() => total(3, 10), () => uneCouleur(6, 10), () => autant(2, 5), () => deux(10)],
      CP: [() => dont(10), () => dont(10), () => dont(randInt(rng, 11, 20)), () => deux(20), () => total(11, 20)],
      CE1: [() => autant(4, 10), () => moitie(6, 20), () => double(2, 6), () => ecart()],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  reussi(defi, etat) {
    return etat.rouge === defi.rouge && etat.jaune === defi.jaune;
  },

  solution(defi) {
    return { rouge: defi.rouge, jaune: defi.jaune, total: defi.rouge + defi.jaune };
  },

  indice(defi, etat) {
    const { rouge, jaune } = etat;
    if (defi.type === 'couleur') {
      if (defi.rouge ? jaune : rouge) return INDICES_JETONS.couleur;
      return defi.rouge ? INDICES_JETONS.rouges : INDICES_JETONS.jaunes;
    }
    if (['total', 'dont', 'moitie', 'ecart'].includes(defi.type) && rouge + jaune !== defi.rouge + defi.jaune) return INDICES_JETONS.tous;
    if (['autant', 'moitie'].includes(defi.type) && rouge !== jaune) return INDICES_JETONS.autant;
    if (defi.type === 'ecart') return INDICES_JETONS.ecart;
    if (rouge !== defi.rouge) return INDICES_JETONS.rouges;
    return defi.type === 'double' ? INDICES_JETONS.double : INDICES_JETONS.jaunes;
  },

  creer() {
    const pions = []; // la couleur de chaque jeton posé, dans l'ordre
    // 20 boutons créés une fois pour toutes (cachés tant qu'ils sont vides) : le focus ne se perd pas
    const boutons = Array.from({ length: MAX_JETONS }, (_, i) => h('button', {
      class: 'jetons-pion', 'data-jeton': i, hidden: true, onclick: () => retourner(i),
    }, h('span', { class: 'jeton', 'aria-hidden': 'true' })));
    const places = boutons.map((b) => h('div', { class: 'jetons-place vide' }, b));
    // par lignes de 5, pour compter d'un coup d'œil (deux lignes côte à côte quand c'est large)
    const plateau = h('div', { class: 'jetons-plateau', role: 'group', 'aria-label': 'Plateau de jetons' },
      [0, 1, 2, 3].map((k) => h('div', { class: 'jetons-ligne' }, places.slice(k * 5, k * 5 + 5))));
    const total = h('p', { class: 'outil-nombre outil-aide-nombre jetons-total', 'aria-live': 'polite' });
    const ajouts = ['rouge', 'jaune'].map((c) => h('button', { class: 'outil-btn', 'data-ajouter': c, onclick: () => ajouter(c) },
      h('span', { class: `jeton ${c}`, 'aria-hidden': 'true' }), `+ ${c === 'rouge' ? 'Rouge' : 'Jaune'}`));
    const enlever = h('button', { class: 'outil-btn', 'data-enlever': '', onclick: () => enleverDernier() }, '− Enlever');
    const voirNombre = h('button', { class: 'outil-btn outil-aide-nombre', 'data-voir-nombre': '', 'aria-pressed': 'false', onclick: () => {
      voirNombre.setAttribute('aria-pressed', String(voirNombre.getAttribute('aria-pressed') !== 'true'));
      dessiner();
    } }, '👁 Combien ?');
    const commandes = h('div', { class: 'outil-commandes' }, ajouts, enlever, voirNombre,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      const rouge = pions.filter((c) => c === 'rouge').length;
      return { rouge, jaune: pions.length - rouge, total: pions.length };
    }
    function dessiner() {
      boutons.forEach((b, i) => {
        const c = pions[i];
        b.hidden = !c;
        places[i].classList.toggle('vide', !c);
        if (!c) return;
        b.firstChild.className = `jeton ${c}`;
        b.setAttribute('aria-label', `Jeton ${i + 1} : ${c}`);
      });
      // aria-disabled plutôt que disabled : le bouton garde le focus au clavier
      ajouts.forEach((b) => b.setAttribute('aria-disabled', String(pions.length >= MAX_JETONS)));
      enlever.setAttribute('aria-disabled', String(!pions.length));
      const { rouge, jaune, total: t } = etat();
      const parts = [rouge && nCouleur(rouge, 'rouge'), jaune && nCouleur(jaune, 'jaune')].filter(Boolean);
      total.hidden = voirNombre.getAttribute('aria-pressed') !== 'true';
      total.textContent = parts.length === 2 ? `${parts[0]} et ${parts[1]} : ${t}` : parts[0] || '0';
    }
    function ajouter(c) {
      if (pions.length >= MAX_JETONS) return;
      pions.push(c);
      dessiner();
      rejouer(boutons[pions.length - 1]);
    }
    function retourner(i) {
      pions[i] = pions[i] === 'rouge' ? 'jaune' : 'rouge';
      dessiner();
      rejouer(boutons[i]);
    }
    function enleverDernier() {
      pions.pop();
      dessiner();
    }
    function vider() {
      pions.length = 0;
      dessiner();
    }
    dessiner();
    return { el: h('div', { class: 'outil-jetons' }, h('div', { class: 'jetons-zone' }, plateau), total, commandes), etat, vider };
  },
};

// ---------------------------------------------------------------- Le tableau de cent

/** Les couleurs pour colorier : chacune a aussi son motif (rond pointillé, cadre épais) et son nom. */
const COULEURS_CENT = { jaune: 'Jaune', bleu: 'Bleu' };

const INDICES_CENT = {
  touche: 'Pas encore. Touche une case pour la colorier.',
  un: 'Pas encore. Il faut colorier un seul nombre.',
  nombre: 'Pas encore. Lis bien les nombres du tableau.',
  apres: 'Pas encore. Le nombre qui vient juste après, c’est 1 de plus.',
  avant: 'Pas encore. Le nombre qui vient juste avant, c’est 1 de moins.',
  plus: 'Pas encore. 10 de plus, c’est 1 dizaine de plus.',
  moins: 'Pas encore. 10 de moins, c’est 1 dizaine de moins.',
  dizaines: 'Pas encore. Les dizaines sont à gauche, les unités à droite.',
  compte: 'Pas encore. Compte à partir du nombre de la consigne.',
  trop: 'Pas encore. Certains nombres coloriés ne vont pas.',
  manque: 'Pas encore. Il manque des nombres.',
};

/** L'indice d'un défi à un seul nombre, selon son type. */
const INDICE_UN = { nombre: 'nombre', apres: 'apres', avant: 'avant', plus: 'plus', moins: 'moins', dizaines: 'dizaines', ecart: 'compte' };

/**
 * Le tableau de cent : les nombres de 1 à 100, par lignes de 10. On touche une case pour la
 * colorier, on la retouche pour l'effacer : suites, bonds de 10 en 10, multiples…
 */
export const tableauCent = {
  id: 'tableau-cent',
  titre: 'Le tableau de cent',
  icone: '💯',
  famille: 'comptage',
  classes: ['GS', 'CP', 'CE1', 'CE2'],
  aide: 'Touche une case pour la colorier. Touche-la encore pour l’effacer.',
  indices: Object.values(INDICES_CENT),
  vide: { colories: [] },

  /** Chaque défi donne les nombres à colorier (nombres), ni plus ni moins. */
  defi(grade, rng) {
    const un = (type, n, consigne) => ({ type, nombres: [n], consigne });
    const plusieurs = (type, nombres, consigne) => ({ type, nombres, consigne });
    const nombre = (min, max) => {
      const n = randInt(rng, min, max);
      return un('nombre', n, `Colorie le nombre ${n}.`);
    };
    const apres = (n) => un('apres', n + 1, `Colorie le nombre qui vient juste après ${n}.`);
    const avant = (n) => un('avant', n - 1, `Colorie le nombre qui vient juste avant ${n}.`);
    const suite = (a, b) => plusieurs('suite', suiteDe(a, b), `Colorie les nombres de ${a} jusqu’à ${b}.`);
    const pas = (p, a, b) => plusieurs('pas', suiteDe(a, b, p), `Colorie les nombres de ${p} en ${p}, de ${a} jusqu’à ${b}.`);
    const finit = (u) => plusieurs('finit', suiteDe(u || 10, u ? 90 + u : 100, 10), `Colorie tous les nombres qui finissent par ${u}.`);
    const dix = (sens, n) => un(sens, sens === 'plus' ? n + 10 : n - 10, `Colorie le nombre qui a 10 de ${sens} que ${n}.`);
    const dizaines = () => {
      const d = randInt(rng, 1, 9);
      const u = randInt(rng, 1, 9);
      return un('dizaines', 10 * d + u, `Colorie le nombre qui a ${d} dizaine${d > 1 ? 's' : ''} et ${u} unité${u > 1 ? 's' : ''}.`);
    };
    const multiples = (k) => plusieurs('multiples', suiteDe(k, 10 * k, k), `Colorie les multiples de ${k} jusqu’à ${10 * k}.`);
    const ecart = () => {
      const k = pick(rng, [9, 11, 20, 30]);
      const n = randInt(rng, 1, 100 - k);
      return un('ecart', n + k, `Colorie le nombre qui a ${k} de plus que ${n}.`);
    };
    const choix = {
      GS: [() => nombre(1, 30), () => apres(randInt(rng, 1, 29)), () => avant(randInt(rng, 2, 30)),
        () => { const a = randInt(rng, 1, 25); return suite(a, a + randInt(rng, 2, 5)); }],
      // CP : souvent le passage à la dizaine (« juste après 39 », « juste avant 40 »)
      CP: [() => nombre(31, 100), () => apres(rng() < 0.5 ? 10 * randInt(rng, 1, 9) + 9 : randInt(rng, 10, 98)),
        () => avant(rng() < 0.5 ? 10 * randInt(rng, 2, 10) : randInt(rng, 11, 100)),
        () => { const a = rng() < 0.5 ? 10 : randInt(rng, 1, 9); return pas(10, a, a + 90); },
        () => finit(randInt(rng, 0, 9))],
      CE1: [() => { const a = pick(rng, [2, 2, 1, randInt(rng, 21, 80)]); return pas(2, a, a + 18); },
        () => dix('plus', randInt(rng, 1, 90)), () => dix('moins', randInt(rng, 11, 100)),
        () => { const a = randInt(rng, 1, 9); return pas(10, a, a + 90); }],
      CE2: [() => pas(5, 5, pick(rng, [50, 100])), () => dizaines(), () => multiples(randInt(rng, 3, 9)), () => ecart()],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  /** Exactement les nombres demandés, quelle que soit leur couleur. */
  reussi(defi, etat) {
    const voulus = new Set(defi.nombres);
    return etat.colories.length === voulus.size && etat.colories.every((n) => voulus.has(n));
  },

  solution(defi) {
    return { colories: [...defi.nombres] };
  },

  indice(defi, etat) {
    const { colories } = etat;
    if (!colories.length) return INDICES_CENT.touche;
    if (defi.nombres.length === 1) return colories.length > 1 ? INDICES_CENT.un : INDICES_CENT[INDICE_UN[defi.type] || 'nombre'];
    const voulus = new Set(defi.nombres);
    return colories.some((n) => !voulus.has(n)) ? INDICES_CENT.trop : INDICES_CENT.manque;
  },

  creer() {
    const coloris = new Map(); // nombre → couleur
    let couleur = 'jaune';
    let actif = 1; // la seule case atteinte par Tab : les flèches passent d'une case à l'autre
    const cases = Array.from({ length: 100 }, (_, i) => h('button', {
      class: 'cent-case', 'data-nombre': i + 1, tabindex: i ? '-1' : '0',
      onclick: () => toucher(i + 1), onkeydown: (e) => fleches(e, i + 1),
    }, String(i + 1)));
    // deux moitiés de 50 : l'une sous l'autre (un tableau de 10 × 10), ou côte à côte quand c'est large
    const tableau = h('div', { class: 'cent-tableau', role: 'group', 'aria-label': 'Tableau de cent' },
      [0, 1].map((k) => h('div', { class: 'cent-moitie' }, cases.slice(k * 50, k * 50 + 50))));
    const choix = Object.entries(COULEURS_CENT).map(([c, nom]) => h('button', {
      class: 'outil-btn cent-choix', 'data-couleur': c, 'aria-pressed': String(c === couleur),
      onclick: () => { couleur = c; dessinerChoix(); },
    }, h('span', { class: `cent-pastille cent-${c}`, 'aria-hidden': 'true' }), nom));
    const commandes = h('div', { class: 'outil-commandes cent-commandes' }, choix,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      return { colories: [...coloris.keys()].sort((a, b) => a - b), couleurs: Object.fromEntries(coloris) };
    }
    function dessinerCase(n) {
      const c = coloris.get(n);
      cases[n - 1].className = c ? `cent-case cent-${c}` : 'cent-case';
      cases[n - 1].setAttribute('aria-label', c ? `${n} : colorié en ${c}` : `${n} : pas colorié`);
    }
    function dessinerChoix() {
      choix.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.couleur === couleur)));
    }
    function activer(n) {
      cases[actif - 1].tabIndex = -1;
      actif = n;
      cases[n - 1].tabIndex = 0;
    }
    function toucher(n) {
      if (coloris.has(n)) coloris.delete(n);
      else coloris.set(n, couleur);
      activer(n);
      dessinerCase(n);
    }
    function fleches(e, n) {
      const pas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 10, ArrowUp: -10 }[e.key];
      if (!pas || n + pas < 1 || n + pas > 100) return;
      e.preventDefault();
      activer(n + pas);
      cases[n + pas - 1].focus();
    }
    function vider() {
      coloris.clear();
      for (let n = 1; n <= 100; n++) dessinerCase(n);
    }
    vider();
    return { el: h('div', { class: 'outil-tableau-cent' }, h('div', { class: 'cent-corps' }, h('div', { class: 'cent-zone' }, tableau), commandes)), etat, vider };
  },
};

// ---------------------------------------------------------------- Les dés et la roue

/** Les secteurs de la roue, dans l'ordre : leur nom est écrit dedans (jamais la couleur seule). */
const COULEURS_ROUE = [
  { nom: 'rouge', fond: '#c62828', texte: '#fff' },
  { nom: 'bleu', fond: '#1565c0', texte: '#fff' },
  { nom: 'jaune', fond: '#ffd23f', texte: '#2b2d42' },
  { nom: 'vert', fond: '#2e7d32', texte: '#fff' },
  { nom: 'orange', fond: '#ff9f43', texte: '#2b2d42' },
  { nom: 'violet', fond: '#7b1fa2', texte: '#fff' },
  { nom: 'rose', fond: '#f8a5c2', texte: '#2b2d42' },
  { nom: 'marron', fond: '#795548', texte: '#fff' },
];
const SECTEURS = { min: 2, max: 8 };
/** Les points d'un dé, sur une grille de 3 × 3 (cases 0 à 8, ligne par ligne). */
const POINTS_DE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const DUREE_DES = 550; // ms : les dés roulent un peu (0,6 s au plus)
const DUREE_ROUE = 900; // ms : la roue tourne (1 s au plus), comme la transition de outils-comptage.css
/** Le nombre de dés au départ, selon la classe. */
const DES_PAR_CLASSE = { PS: 1, MS: 1, GS: 2, CP: 2, CE1: 3, CE2: 3, CM1: 2, CM2: 2 };

const INDICES_DES = {
  choisirDes: 'Pas encore. Choisis les dés.',
  choisirRoue: 'Pas encore. Choisis la roue.',
  nombreDes: 'Pas encore. Regarde combien de dés il faut lancer.',
  lancerDe: 'Pas encore. Lance le dé.',
  lancerDes: 'Pas encore. Lance les dés.',
  compteDe: 'Pas encore. Compte les points du dé, puis relance-le.',
  comptePoints: 'Pas encore. Compte tous les points, puis relance les dés.',
  double: 'Pas encore. Pour un double, les 2 dés montrent le même nombre. Relance-les.',
  secteurs: 'Pas encore. Compte les secteurs de la roue.',
  tourner: 'Pas encore. Fais tourner la roue.',
  fleche: 'Pas encore. Regarde où montre la flèche, puis fais encore tourner la roue.',
  suite: 'Pas encore. Il faut tomber 2 fois de suite sur le même secteur.',
};

/** « le rouge », « l’orange ». */
function leNom(couleur) {
  return /^[aeiouy]/.test(couleur) ? `l’${couleur}` : `le ${couleur}`;
}

/** k dés dont le total fait n (pour les solutions). */
function repartir(n, k) {
  const des = Array(k).fill(1);
  let reste = n - k;
  for (let i = 0; i < k; i++) {
    const ajout = Math.min(5, reste);
    des[i] += ajout;
    reste -= ajout;
  }
  return des;
}

/** La roue de n secteurs (SVG) : le disque tourne (g.roue-tourne), la flèche reste en haut. */
function roueSvg(n) {
  const s = 360 / n;
  const point = (a, r) => `${(r * Math.sin((a * Math.PI) / 180)).toFixed(2)} ${(-r * Math.cos((a * Math.PI) / 180)).toFixed(2)}`;
  const taille = n <= 4 ? 19 : n <= 6 ? 17 : 15;
  const secteurs = COULEURS_ROUE.slice(0, n).map((c, i) => {
    const m = (i + 0.5) * s;
    const [x, y] = point(m, 62).split(' ');
    // le nom suit le rayon, sans jamais être écrit la tête en bas quand la roue est à l'arrêt
    const angle = m <= 180 ? m - 90 : m + 90;
    return `<path d="M0 0 L${point(i * s, 100)} A100 100 0 0 1 ${point((i + 1) * s, 100)} Z" fill="${c.fond}" stroke="#fff" stroke-width="2"/>`
      + `<text x="${x}" y="${y}" transform="rotate(${angle.toFixed(2)} ${x} ${y})" fill="${c.texte}" font-size="${taille}">${c.nom}</text>`;
  }).join('');
  const noms = COULEURS_ROUE.slice(0, n).map((c) => c.nom).join(', ');
  return `<svg class="roue-svg" viewBox="-112 -120 224 232" role="img" aria-label="Roue de ${n} secteurs : ${noms}">`
    + `<g class="roue-tourne">${secteurs}<circle r="100" fill="none" stroke="#2b2d42" stroke-width="4"/><circle r="11" fill="#2b2d42"/></g>`
    + '<path class="roue-fleche" d="M-13 -118 L13 -118 L0 -88 Z" fill="#2b2d42" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
    + '</svg>';
}

/**
 * Les dés et la roue : 1, 2 ou 3 dés à points, ou une roue de 2 à 8 secteurs. Le hasard décide :
 * un défi se réussit en relançant jusqu'à obtenir ce qui est demandé.
 */
export const desEtRoue = {
  id: 'des',
  titre: 'Les dés et la roue',
  icone: '🎲',
  famille: 'comptage',
  classes: ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche Lancer pour lancer les dés, ou choisis la roue et fais-la tourner.',
  indices: Object.values(INDICES_DES),
  vide: { mode: 'des', nbDes: 1, des: [], secteurs: 6, tirages: [] },
  couleurs: COULEURS_ROUE.map((c) => c.nom),

  /**
   * Un défi aux dés : { type: 'des', des (leur nombre), cond (face, double, somme, plus, moins), valeur } ;
   * à la roue : { type: 'roue', secteurs, compte (le nombre de secteurs est dans la consigne), cond
   * (couleur, suite), couleurs (les secteurs qui conviennent) }.
   */
  defi(grade, rng) {
    const auxDes = (des, cond, valeur, consigne) => ({ type: 'des', des, cond, valeur, consigne });
    const face = (max) => {
      const k = randInt(rng, 1, max);
      return auxDes(1, 'face', k, `Lance le dé jusqu’à faire un ${k}.`);
    };
    const double = () => auxDes(2, 'double', null, 'Lance 2 dés jusqu’à faire un double.');
    const somme = (k, min, max) => {
      const v = randInt(rng, min, max);
      return auxDes(k, 'somme', v, `Lance ${k} dés jusqu’à faire ${v} en tout.`);
    };
    const plus = (k, min, max) => {
      const v = randInt(rng, min, max);
      return auxDes(k, 'plus', v, `Lance ${k} dés jusqu’à faire plus de ${v} en tout.`);
    };
    const moins = (k, min, max) => {
      const v = randInt(rng, min, max);
      return auxDes(k, 'moins', v, `Lance ${k} dés jusqu’à faire moins de ${v} en tout.`);
    };
    const noms = (n) => COULEURS_ROUE.slice(0, n).map((c) => c.nom);
    const aLaRoue = (secteurs, compte, cond, couleurs, consigne) => ({ type: 'roue', secteurs, compte, cond, couleurs, consigne });
    // en maternelle, la roue garde son nombre de secteurs (réglé par preparer) sans le dire
    const couleur = (n) => {
      const c = pick(rng, noms(n));
      return aLaRoue(n, false, 'couleur', [c], `Fais tourner la roue jusqu’à tomber sur ${leNom(c)}.`);
    };
    const secteur = (n) => {
      const c = pick(rng, noms(n));
      return aLaRoue(n, true, 'couleur', [c], `Fais tourner la roue de ${n} secteurs jusqu’à tomber sur le secteur ${c}.`);
    };
    const ou = (n) => {
      const [a, b] = sample(rng, noms(n), 2);
      return aLaRoue(n, true, 'couleur', [a, b], `Fais tourner la roue de ${n} secteurs jusqu’à tomber sur le secteur ${a} ou sur le secteur ${b}.`);
    };
    const suite = (n) => aLaRoue(n, true, 'suite', null, `Fais tourner la roue de ${n} secteurs jusqu’à tomber 2 fois de suite sur le même secteur.`);
    const choix = {
      PS: [() => face(3), () => couleur(4)],
      MS: [() => face(6), () => couleur(6)],
      GS: [() => double(), () => somme(2, 4, 10)],
      CP: [() => somme(2, 6, 11), () => somme(2, 10, 10), () => plus(2, 7, 9), () => double()],
      CE1: [() => plus(3, 12, 15), () => somme(3, 8, 13)],
      CE2: [() => plus(3, 13, 15), () => moins(3, 7, 8), () => somme(3, 9, 12)],
      CM1: [() => secteur(randInt(rng, 4, 8)), () => ou(randInt(rng, 5, 8)), () => suite(randInt(rng, 3, 5))],
      CM2: [() => secteur(randInt(rng, 5, 8)), () => ou(randInt(rng, 6, 8)), () => suite(randInt(rng, 4, 6))],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  /** Le dernier lancer répond au défi, avec le bon nombre de dés (ou la bonne roue). */
  reussi(defi, etat) {
    if (defi.type === 'des') {
      if (etat.mode !== 'des' || etat.des.length !== defi.des) return false;
      const total = etat.des.reduce((a, b) => a + b, 0);
      if (defi.cond === 'face') return etat.des[0] === defi.valeur;
      if (defi.cond === 'double') return etat.des[0] === etat.des[1];
      if (defi.cond === 'somme') return total === defi.valeur;
      if (defi.cond === 'plus') return total > defi.valeur;
      return total < defi.valeur;
    }
    const t = etat.tirages;
    if (etat.mode !== 'roue' || !t.length || (defi.compte && etat.secteurs !== defi.secteurs)) return false;
    if (defi.cond === 'suite') return t.length >= 2 && t.at(-1) === t.at(-2);
    return defi.couleurs.includes(t.at(-1));
  },

  solution(defi) {
    if (defi.type === 'des') {
      const des = defi.cond === 'face' ? [defi.valeur]
        : defi.cond === 'double' ? [3, 3]
          : repartir(defi.valeur + { somme: 0, plus: 1, moins: -1 }[defi.cond], defi.des);
      return { mode: 'des', nbDes: defi.des, des, secteurs: 6, tirages: [] };
    }
    const c = defi.couleurs?.[0] || COULEURS_ROUE[0].nom;
    return { mode: 'roue', nbDes: 1, des: [], secteurs: defi.secteurs, tirages: defi.cond === 'suite' ? [c, c] : [c] };
  },

  indice(defi, etat) {
    if (defi.type === 'des') {
      if (etat.mode !== 'des') return INDICES_DES.choisirDes;
      if (etat.nbDes !== defi.des) return INDICES_DES.nombreDes;
      if (!etat.des.length) return defi.des > 1 ? INDICES_DES.lancerDes : INDICES_DES.lancerDe;
      if (defi.cond === 'double') return INDICES_DES.double;
      return defi.des > 1 ? INDICES_DES.comptePoints : INDICES_DES.compteDe;
    }
    if (etat.mode !== 'roue') return INDICES_DES.choisirRoue;
    if (defi.compte && etat.secteurs !== defi.secteurs) return INDICES_DES.secteurs;
    if (!etat.tirages.length) return INDICES_DES.tourner;
    return defi.cond === 'suite' ? INDICES_DES.suite : INDICES_DES.fleche;
  },

  creer({ grade }) {
    const hasard = createRng();
    let mode = 'des';
    let nbDes = DES_PAR_CLASSE[grade] || 2;
    let faces = []; // le dernier lancer (vide : rien lancé)
    let secteurs = grade === 'PS' ? 4 : 6;
    let tirages = []; // les secteurs montrés par la flèche, du plus ancien au plus récent
    let angle = 0; // la rotation de la roue, en degrés : elle tourne toujours dans le même sens
    let minuteur = null;
    let finir = null; // termine tout de suite l'animation en cours

    const des = [0, 1, 2].map(() => h('div', { class: 'des-de', role: 'img' },
      Array.from({ length: 9 }, () => h('span', { class: 'des-point', 'aria-hidden': 'true' }))));
    const plateauDes = h('div', { class: 'des-plateau' }, des);
    const total = h('p', { class: 'outil-nombre outil-aide-nombre des-total' });
    // les points, dits par le lecteur d'écran (sans le total, caché pendant un défi)
    const annonce = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    const dessinRoue = h('div', { class: 'roue-dessin' });
    const resultat = h('p', { class: 'roue-resultat', 'aria-live': 'polite' });
    const avant = h('p', { class: 'roue-avant' });
    let disque = null;

    const modes = ['des', 'roue'].map((m) => h('button', {
      class: 'outil-btn', 'data-mode': m, 'aria-pressed': 'false', onclick: () => choisirMode(m),
    }, m === 'des' ? 'Dés' : 'Roue'));
    const nombres = [1, 2, 3].map((n) => h('button', {
      class: 'outil-btn des-nb', 'data-nb-des': n, 'aria-pressed': 'false', onclick: () => choisirNombre(n),
    }, `${n} dé${n > 1 ? 's' : ''}`));
    const moins = h('button', { class: 'outil-btn des-pm', 'data-secteurs': '-1', 'aria-label': 'Un secteur de moins', onclick: () => changerSecteurs(-1) }, '−');
    const plus = h('button', { class: 'outil-btn des-pm', 'data-secteurs': '1', 'aria-label': 'Un secteur de plus', onclick: () => changerSecteurs(1) }, '+');
    const nbSecteurs = h('span', { class: 'roue-nb' });
    const lancer = h('button', { class: 'outil-btn des-lancer', 'data-lancer': '', onclick: () => (mode === 'des' ? lancerDes() : tournerRoue()) });

    const el = h('div', { class: 'outil-des' },
      h('div', { class: 'des-corps' },
        h('div', { class: 'des-scene' },
          h('div', { class: 'des-vue des-seul' }, plateauDes, total),
          h('div', { class: 'des-vue roue-seul' }, dessinRoue, h('div', { class: 'roue-texte' }, resultat, avant)),
          annonce),
        h('div', { class: 'des-commandes' },
          h('div', { class: 'outil-commandes', role: 'group', 'aria-label': 'Dés ou roue' }, modes),
          h('div', { class: 'outil-commandes' },
            h('div', { class: 'des-reglage des-seul', role: 'group', 'aria-label': 'Nombre de dés' }, nombres),
            h('div', { class: 'des-reglage roue-seul', role: 'group', 'aria-label': 'Nombre de secteurs' }, moins, nbSecteurs, plus),
            lancer))));

    function etat() {
      return { mode, nbDes, des: [...faces], secteurs, tirages: [...tirages] };
    }
    function dessinerDes(valeurs) {
      des.forEach((d, i) => {
        const v = valeurs[i];
        d.hidden = i >= nbDes;
        d.classList.toggle('vierge', !v);
        d.querySelectorAll('.des-point').forEach((p, k) => p.classList.toggle('on', Boolean(v) && POINTS_DE[v].includes(k)));
        d.setAttribute('aria-label', v ? `Dé : ${v}` : 'Dé pas encore lancé');
      });
    }
    function dessiner() {
      el.dataset.affiche = mode; // les dés ou la roue (outils-comptage.css)
      modes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      nombres.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.nbDes) === nbDes)));
      nbSecteurs.textContent = `${secteurs} secteurs`;
      moins.setAttribute('aria-disabled', String(secteurs <= SECTEURS.min));
      plus.setAttribute('aria-disabled', String(secteurs >= SECTEURS.max));
      lancer.textContent = mode === 'des' ? '🎲 Lancer' : '🔄 Tourner';
      dessinerDes(faces);
      const t = faces.reduce((a, b) => a + b, 0);
      total.textContent = faces.length > 1 ? `${faces.join(' + ')} = ${t}` : faces.length ? String(t) : '';
      const [dernier, ...precedents] = tirages.slice(-3).reverse(); // et les 2 tours d'avant (2 fois de suite…)
      resultat.textContent = dernier ? `La flèche montre ${leNom(dernier)}.` : '';
      avant.textContent = precedents.length ? `Avant : ${precedents.join(', ')}.` : '';
    }
    function construireRoue() {
      dessinRoue.innerHTML = roueSvg(secteurs);
      disque = dessinRoue.querySelector('.roue-tourne');
      angle = 0;
    }
    /** Une animation de `duree` ms (etape : toutes les 90 ms), puis `fin` ; tout de suite sans animation. */
    function animer(duree, fin, etape) {
      const debut = Date.now();
      finir = () => {
        clearTimeout(minuteur);
        minuteur = null;
        finir = null;
        fin();
        dessiner();
      };
      if (sansAnimation()) return finir();
      const suite = () => {
        const passe = Date.now() - debut;
        if (passe >= duree) return finir();
        etape?.();
        minuteur = setTimeout(suite, Math.min(etape ? 90 : duree, duree - passe)); // jamais au-delà de la durée
      };
      return suite();
    }
    function lancerDes() {
      if (finir) return;
      const tirage = Array.from({ length: nbDes }, () => randInt(hasard, 1, 6));
      faces = []; // rien à vérifier tant que les dés roulent
      total.textContent = '';
      plateauDes.classList.add('roule');
      animer(DUREE_DES, () => {
        plateauDes.classList.remove('roule');
        faces = tirage;
        annonce.textContent = `${tirage.join(' et ')}.`;
      }, () => dessinerDes(Array.from({ length: nbDes }, () => randInt(hasard, 1, 6)))); // les faces changent en roulant
    }
    function tournerRoue() {
      if (finir) return;
      const s = 360 / secteurs;
      const r = randInt(hasard, 0, secteurs - 1);
      // le secteur tiré s'arrête sous la flèche (en haut), pas toujours en plein milieu
      const vise = -(r + 0.5) * s + (hasard() - 0.5) * s * 0.7;
      angle += 720 + ((((vise - angle) % 360) + 360) % 360);
      disque.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      resultat.textContent = '';
      avant.textContent = '';
      animer(DUREE_ROUE, () => tirages.push(COULEURS_ROUE[r].nom));
    }
    function choisirMode(m) {
      finir?.();
      mode = m;
      dessiner();
    }
    function choisirNombre(n) {
      finir?.();
      nbDes = n;
      faces = [];
      dessiner();
    }
    function changerSecteurs(d) {
      const n = secteurs + d;
      if (n < SECTEURS.min || n > SECTEURS.max) return;
      finir?.();
      secteurs = n;
      tirages = [];
      construireRoue();
      dessiner();
    }
    function vider() {
      finir?.();
      faces = [];
      tirages = [];
      annonce.textContent = '';
      dessiner();
    }
    function preparer(defi) {
      if (!defi) return;
      finir?.();
      if (defi.type === 'des') {
        mode = 'des';
        nbDes = defi.des;
      } else {
        mode = 'roue';
        if (secteurs !== defi.secteurs) {
          secteurs = defi.secteurs;
          construireRoue();
        }
      }
      faces = [];
      tirages = [];
      dessiner();
    }
    function arreter() {
      clearTimeout(minuteur);
      minuteur = null;
      finir = null;
    }
    construireRoue();
    dessiner();
    return { el, etat, vider, preparer, arreter };
  },
};

export const COMPTAGE = [cadreDix, jetonsBicolores, tableauCent, desEtRoue];
