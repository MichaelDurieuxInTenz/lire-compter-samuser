// Outils pour compter : le cadre de dix (les autres outils de la famille suivent le même modèle).
//
// Un outil se manipule librement ; ses défis, sans note, sont tirés selon la classe. Le contrat
// d'un outil est décrit dans ../outils.js.

import { h } from '../render.js';
import { pick, randInt } from '../random.js';

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

export const COMPTAGE = [cadreDix];
