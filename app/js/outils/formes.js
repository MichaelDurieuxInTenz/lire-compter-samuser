// Outils pour les formes et les fractions : le géoplan, les blocs de formes, les réglettes de
// fractions et l'ardoise.
//
// Chaque outil suit le contrat décrit dans ../outils.js (modèle : le cadre de dix, ./comptage.js).
// Leurs zones de jeu (planche, réglettes, ardoise) prennent la place laissée par la consigne et les
// boutons : ce sont des conteneurs CSS (container-type: size, outils-formes.css).

import { h } from '../render.js';
import { pick, randInt } from '../random.js';

// ===================================================================== le géoplan

// La géométrie se calcule sur les coordonnées entières des clous ([colonne, ligne], à partir de 0) :
// produits scalaire et vectoriel, longueurs au carré, aire doublée : tout reste entier, donc exact.
const moins = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scalaire = (u, v) => u[0] * v[0] + u[1] * v[1];
const vectoriel = (u, v) => u[0] * v[1] - u[1] * v[0];
const memeClou = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Les sommets d'une figure fermée : sans clou répété à la suite, sans point aligné avec ses voisins. */
export function sommets(points) {
  const p = points.map(([x, y]) => [x, y]);
  for (let i = 0; p.length >= 3 && i < p.length;) {
    const avant = p[(i + p.length - 1) % p.length];
    const apres = p[(i + 1) % p.length];
    // un clou répété donne un côté nul : il est aligné lui aussi
    if (vectoriel(moins(p[i], avant), moins(apres, p[i])) === 0) {
      p.splice(i, 1);
      i = 0;
    } else i++;
  }
  return p.length >= 3 ? p : [];
}

const orientation = (a, b, c) => Math.sign(vectoriel(moins(b, a), moins(c, a)));
const dansLeCadre = (a, b, c) => Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0])
  && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);

/** Les segments [a, b] et [c, d] se touchent-ils (croisés, ou un bout sur l'autre) ? */
function seTouchent(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && dansLeCadre(a, b, c)) || (o2 === 0 && dansLeCadre(a, b, d))
    || (o3 === 0 && dansLeCadre(c, d, a)) || (o4 === 0 && dansLeCadre(c, d, b));
}

/**
 * Ce qu'est la figure d'un élastique fermé (null si elle est toute plate) : nombre de côtés, figure
 * simple (l'élastique ne se croise pas), rectangle, carré, losange, angle droit, aire doublée (formule
 * du lacet), périmètre (null s'il n'est pas entier : un côté en biais d'un carreau mesure √2).
 */
export function analyserFigure(points) {
  const p = sommets(points);
  const n = p.length;
  if (!n) return null;
  const cotes = p.map((a, i) => moins(p[(i + 1) % n], a));
  let simple = true;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // le dernier côté et le premier sont voisins
      if (seTouchent(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) simple = false;
    }
  }
  const longueurs = cotes.map((c) => scalaire(c, c));
  const droits = cotes.map((c, i) => scalaire(cotes[(i + n - 1) % n], c) === 0);
  const egaux = longueurs.every((l) => l === longueurs[0]);
  const rectangle = n === 4 && droits.every(Boolean);
  // une somme de racines carrées d'entiers n'est entière que si chacune l'est
  const racines = longueurs.map((l) => Math.round(Math.sqrt(l)));
  return {
    sommets: p,
    cotes: n,
    simple,
    rectangle,
    carre: rectangle && egaux,
    losange: n === 4 && egaux,
    angleDroit: droits.some(Boolean),
    aire2: Math.abs(p.reduce((s, a, i) => s + vectoriel(a, p[(i + 1) % n]), 0)),
    perimetre: racines.every((r, i) => r * r === longueurs[i]) ? racines.reduce((s, r) => s + r, 0) : null,
  };
}

/** La figure répond-elle au critère { forme, cotes?, pasCarre?, aire?, perimetre? } ? */
function convient(f, c) {
  if (!f?.simple) return false;
  const forme = {
    triangle: f.cotes === 3,
    'triangle-rectangle': f.cotes === 3 && f.angleDroit,
    carre: f.carre,
    rectangle: f.rectangle,
    losange: f.losange,
    polygone: f.cotes === c.cotes,
    figure: true,
  }[c.forme];
  return Boolean(forme) && !(c.pasCarre && f.carre)
    && (c.aire === undefined || f.aire2 === 2 * c.aire)
    && (c.perimetre === undefined || f.perimetre === c.perimetre);
}

/** Chaque critère trouve-t-il sa figure, une figure différente pour chacun ? */
function repartir(criteres, figures) {
  if (!criteres.length) return true;
  const [c, ...reste] = criteres;
  return figures.some((f, i) => convient(f, c) && repartir(reste, figures.filter((_, j) => j !== i)));
}

const figuresFermees = (etat) => (etat.elastiques || []).filter((e) => e.ferme).map((e) => analyserFigure(e.points));

/** a × b = n, avec a ≤ b les plus proches possible : le rectangle tient sur la planche. */
function facteurs(n) {
  let a = Math.floor(Math.sqrt(n));
  while (n % a) a--;
  return [a, n / a];
}

/** Une figure qui répond au critère, posée contre le coin en haut à gauche (pour solution). */
function figureModele(c) {
  if (c.forme === 'carre') {
    // un côté (a, b) avec a² + b² = aire : un carré penché s'il le faut (un carré de 2 carreaux)
    const aire = c.aire ?? 4;
    for (let b = 0; b * b <= aire; b++) {
      const a = Math.round(Math.sqrt(aire - b * b));
      if (a > 0 && a * a + b * b === aire) return [[b, 0], [a + b, b], [a, a + b], [0, a]];
    }
  }
  if (c.forme === 'rectangle' || c.forme === 'figure') {
    const quart = Math.floor((c.perimetre || 0) / 4);
    const [a, b] = c.aire ? facteurs(c.aire) : c.perimetre ? [quart, c.perimetre / 2 - quart] : [2, 3];
    return [[0, 0], [b, 0], [b, a], [0, a]];
  }
  if (c.forme === 'triangle' || c.forme === 'triangle-rectangle') {
    const [a, b] = c.aire ? facteurs(2 * c.aire) : [2, 2];
    return [[0, 0], [b, 0], [0, a]];
  }
  if (c.forme === 'losange') return [[0, 1], [2, 0], [4, 1], [2, 2]];
  if (c.cotes === 5) return [[0, 0], [2, 0], [3, 1], [2, 2], [0, 2]];
  return [[1, 0], [3, 0], [4, 1], [3, 2], [1, 2], [0, 1]];
}

const INDICES_GEOPLAN = {
  commence: 'Pas encore. Touche des clous l’un après l’autre pour tendre un élastique.',
  ferme: 'Pas encore. Pour fermer l’élastique, retouche le premier clou.',
  deux: 'Pas encore. Il faut un élastique fermé pour chaque figure.',
  plat: 'Pas encore. Ton élastique est tout plat. Choisis des clous qui ne sont pas alignés.',
  croise: 'Pas encore. Ton élastique ne doit pas se croiser.',
  cotes: 'Pas encore. Compte les côtés de ta figure.',
  angles: 'Pas encore. Les 4 coins doivent être droits, comme les coins d’une feuille.',
  angleDroit: 'Pas encore. Un des coins doit être droit, comme le coin d’une feuille.',
  egaux: 'Pas encore. Les côtés doivent tous avoir la même longueur.',
  carre: 'Pas encore. Ta figure est un carré. Cherche une autre forme.',
  aire: 'Pas encore. Compte les carreaux à l’intérieur de ta figure.',
  perimetre: 'Pas encore. Compte les côtés des carreaux tout autour de ta figure.',
  regarde: 'Pas encore. Regarde bien tes figures.',
};

/** Pourquoi la figure ne répond pas au critère (une phrase de INDICES_GEOPLAN). */
function expliquer(f, c) {
  if (!f) return INDICES_GEOPLAN.plat;
  if (!f.simple) return INDICES_GEOPLAN.croise;
  const cotes = { triangle: 3, 'triangle-rectangle': 3, carre: 4, rectangle: 4, losange: 4, polygone: c.cotes }[c.forme];
  if (cotes && f.cotes !== cotes) return INDICES_GEOPLAN.cotes;
  if ((c.forme === 'carre' || c.forme === 'rectangle') && !f.rectangle) return INDICES_GEOPLAN.angles;
  if (c.forme === 'triangle-rectangle' && !f.angleDroit) return INDICES_GEOPLAN.angleDroit;
  if ((c.forme === 'carre' || c.forme === 'losange') && !f.losange) return INDICES_GEOPLAN.egaux;
  if (c.pasCarre && f.carre) return INDICES_GEOPLAN.carre;
  if (c.aire !== undefined && f.aire2 !== 2 * c.aire) return INDICES_GEOPLAN.aire;
  if (c.perimetre !== undefined && f.perimetre !== c.perimetre) return INDICES_GEOPLAN.perimetre;
  return INDICES_GEOPLAN.regarde;
}

// Les élastiques : une couleur, son nom (dit dans les étiquettes des clous) et un motif de trait
// (plein, tirets, points…) : on les distingue sans voir les couleurs. Unités : un carreau = 1.
const ELASTIQUES = [
  { nom: 'rouge', couleur: '#c92a2a', motif: 'none' },
  { nom: 'bleu', couleur: '#1864ab', motif: '0.34 0.3' },
  { nom: 'vert', couleur: '#2b8a3e', motif: '0 0.27' },
  { nom: 'violet', couleur: '#6741d9', motif: '0.42 0.27 0 0.27' },
  { nom: 'orange', couleur: '#b35400', motif: '0.12 0.27' },
];

/**
 * Le géoplan : une planche de clous (5 × 5, 6 × 6 à partir du CE2). On touche des clous l'un après
 * l'autre pour tendre un élastique, on retouche le premier pour fermer la figure ; chaque élastique a
 * sa couleur et son motif.
 */
export const geoplan = {
  id: 'geoplan',
  titre: 'Le géoplan',
  icone: '📌',
  famille: 'formes',
  classes: ['GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche des clous l’un après l’autre pour tendre un élastique. Retouche le premier clou pour fermer ta figure.',
  indices: Object.values(INDICES_GEOPLAN),
  vide: { elastiques: [] },

  /** Clous par côté : 6 × 6 à partir du CE2 (les clous restent assez grands pour le doigt). */
  clous(grade) {
    return ['CE2', 'CM1', 'CM2'].includes(grade) ? 6 : 5;
  },

  defi(grade, rng) {
    const une = (consigne, critere) => ({ consigne, criteres: [critere] });
    const deux = (consigne, a, b) => ({ consigne, criteres: [{ forme: a }, { forme: b }] });
    const carre = () => une('Fais un carré.', { forme: 'carre' });
    const triangle = () => une('Fais un triangle.', { forme: 'triangle' });
    const rectangle = () => une('Fais un rectangle qui n’est pas un carré.', { forme: 'rectangle', pasCarre: true });
    const losange = () => une('Fais un losange qui n’est pas un carré.', { forme: 'losange', pasCarre: true });
    const triangleRectangle = () => une('Fais un triangle rectangle.', { forme: 'triangle-rectangle' });
    const carreDe = (aires) => {
      const aire = pick(rng, aires);
      return une(`Fais un carré de ${aire} carreaux.`, { forme: 'carre', aire });
    };
    const rectangleDe = (aires) => {
      const aire = pick(rng, aires);
      return une(`Fais un rectangle de ${aire} carreaux.`, { forme: 'rectangle', aire });
    };
    const triangleDe = (aires) => {
      const aire = pick(rng, aires);
      return une(`Fais un triangle de ${aire} carreaux.`, { forme: 'triangle', aire });
    };
    const cotes = (liste) => {
      const n = pick(rng, liste);
      return une(`Fais une figure qui a ${n} côtés.`, { forme: 'polygone', cotes: n });
    };
    // le périmètre se compte en côtés de carreau : un côté en biais n'a pas une longueur entière
    const perimetre = (liste) => {
      const p = pick(rng, liste);
      return une(`Fais une figure de périmètre ${p}.`, { forme: 'figure', perimetre: p });
    };
    const choix = {
      GS: [carre, triangle, rectangle, () => deux('Fais un carré et un triangle.', 'carre', 'triangle')],
      CP: [triangle, rectangle, carre, () => deux('Fais un carré et un triangle.', 'carre', 'triangle'),
        () => deux('Fais 2 triangles.', 'triangle', 'triangle')],
      CE1: [() => carreDe([4, 9, 16]), () => rectangleDe([3, 6, 8]), () => cotes([5, 6]),
        () => deux('Fais un rectangle et un triangle.', 'rectangle', 'triangle')],
      CE2: [triangleRectangle, () => carreDe([4, 9, 16, 25]), () => rectangleDe([6, 8, 10, 12, 15]), losange, () => cotes([5, 6])],
      CM1: [() => rectangleDe([6, 8, 10, 12, 15, 20]), () => perimetre([8, 10, 12, 14, 16]), losange, triangleRectangle,
        () => triangleDe([3, 4, 6])],
      // un carré de 2, 5, 8 ou 10 carreaux est penché : ses côtés suivent les diagonales des carreaux
      CM2: [() => rectangleDe([6, 8, 10, 12, 15, 20]), () => perimetre([10, 12, 14, 16, 18, 20]), losange,
        () => carreDe([2, 5, 8, 10]), () => triangleDe([3, 5, 6])],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  reussi(defi, etat) {
    return repartir(defi.criteres, figuresFermees(etat));
  },

  /** Des élastiques fermés qui répondent au défi (le deuxième décalé de 2 carreaux en biais). */
  solution(defi) {
    return {
      elastiques: defi.criteres.map((c, i) => ({ points: figureModele(c).map(([x, y]) => [x + 2 * i, y + 2 * i]), ferme: true })),
    };
  },

  indice(defi, etat) {
    const elastiques = etat.elastiques || [];
    const dernier = elastiques.at(-1);
    if (dernier && !dernier.ferme && dernier.points.length >= 3) return INDICES_GEOPLAN.ferme;
    const figures = figuresFermees(etat);
    if (!figures.length) return INDICES_GEOPLAN.commence;
    if (figures.length < defi.criteres.length) return INDICES_GEOPLAN.deux;
    // le critère qui ne trouve pas sa figure, et la dernière figure qui ne répond à aucun critère
    const c = defi.criteres.find((k) => !figures.some((f) => convient(f, k))) || defi.criteres.at(-1);
    const libres = figures.filter((f) => !defi.criteres.some((k) => convient(f, k)));
    return expliquer(libres.length ? libres.at(-1) : figures.at(-1), c);
  },

  creer({ grade }) {
    const n = geoplan.clous(grade);
    let elastiques = []; // { couleur (dans ELASTIQUES), points: [[x, y]…], ferme }
    let courant = -1; // l'élastique qu'on tend ; -1 : le prochain clou touché en commence un
    const dessin = h('div', { class: 'geo-dessin', 'aria-hidden': 'true' });
    const clous = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        clous.push(h('button', { class: 'geo-clou', 'data-clou': `${x},${y}`, onclick: () => toucher([x, y]) },
          h('span', { class: 'geo-tete', 'aria-hidden': 'true' })));
      }
    }
    const planche = h('div', { class: 'geo-planche', role: 'group', 'aria-label': `Géoplan de ${n} clous sur ${n}`, style: { '--n': n } },
      dessin, clous);
    const description = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    const commandes = h('div', { class: 'outil-commandes geo-commandes' },
      h('button', { class: 'outil-btn', 'data-nouvel-elastique': '', onclick: nouvelElastique }, '➕ Nouvel élastique'),
      h('button', { class: 'outil-btn', 'data-annuler': '', onclick: annuler }, '↶ Annuler'),
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));
    // le quadrillage entre les clous : il aide à compter les carreaux
    const lignes = Array.from({ length: n }, (_, i) => `M0.5 ${i + 0.5}H${n - 0.5}M${i + 0.5} 0.5V${n - 0.5}`).join('');

    function etat() {
      return { elastiques: elastiques.map((e) => ({ points: e.points.map(([x, y]) => [x, y]), ferme: e.ferme })) };
    }
    function dessiner() {
      const centre = ([x, y]) => `${x + 0.5},${y + 0.5}`;
      const traits = elastiques.map((e) => {
        const { couleur, motif } = ELASTIQUES[e.couleur];
        if (e.points.length === 1) return `<circle cx="${e.points[0][0] + 0.5}" cy="${e.points[0][1] + 0.5}" r="0.13" fill="${couleur}"/>`;
        const attributs = `points="${e.points.map(centre).join(' ')}" class="geo-elastique" stroke="${couleur}" stroke-dasharray="${motif}"`;
        return e.ferme ? `<polygon ${attributs} fill="${couleur}" fill-opacity="0.16"/>` : `<polyline ${attributs} fill="none"/>`;
      });
      // l'élastique qu'on tend : un anneau autour de son premier clou, à retoucher pour le fermer
      const tendu = elastiques[courant];
      const anneau = tendu?.points.length > 1
        ? `<circle cx="${tendu.points[0][0] + 0.5}" cy="${tendu.points[0][1] + 0.5}" r="0.3" class="geo-anneau" stroke="${ELASTIQUES[tendu.couleur].couleur}"/>` : '';
      dessin.innerHTML = `<svg viewBox="0 0 ${n} ${n}"><path d="${lignes}" class="geo-grille"/>${traits.join('')}${anneau}</svg>`;
      clous.forEach((bouton, k) => {
        const p = [k % n, Math.floor(k / n)];
        const noms = elastiques.filter((e) => e.points.some((q) => memeClou(q, p))).map((e) => ELASTIQUES[e.couleur].nom);
        const premier = tendu && tendu.points.length > 1 && memeClou(tendu.points[0], p);
        const sur = noms.length ? `élastique${noms.length > 1 ? 's' : ''} ${noms.join(' et ')}` : 'sans élastique';
        bouton.setAttribute('aria-label', `Clou ligne ${p[1] + 1}, colonne ${p[0] + 1} : ${sur}${premier ? ', premier clou' : ''}`);
      });
      // pour un lecteur d'écran : l'élastique qu'on vient de changer
      const dernier = tendu || elastiques.at(-1);
      description.textContent = dernier
        ? `Élastique ${ELASTIQUES[dernier.couleur].nom}${dernier.ferme ? ' fermé' : ''} : ${dernier.points.length} clou${dernier.points.length > 1 ? 's' : ''}.`
        : 'Aucun élastique.';
    }
    function toucher(p) {
      let e = elastiques[courant];
      if (!e) {
        e = { couleur: elastiques.length % ELASTIQUES.length, points: [], ferme: false };
        elastiques.push(e);
        courant = elastiques.length - 1;
      }
      if (e.points.length >= 3 && memeClou(p, e.points[0])) {
        e.ferme = true;
        courant = -1;
      } else if (!e.points.some((q) => memeClou(q, p))) e.points.push(p);
      dessiner();
    }
    /** L'élastique tendu reste comme il est (ouvert), le prochain clou en commence un autre. */
    function nouvelElastique() {
      if (elastiques[courant]?.points.length < 2) elastiques.splice(courant, 1);
      courant = -1;
      dessiner();
    }
    /** Annule le dernier clou touché (ou la fermeture du dernier élastique). */
    function annuler() {
      const i = courant >= 0 ? courant : elastiques.length - 1;
      const e = elastiques[i];
      if (!e) return;
      if (e.ferme) e.ferme = false;
      else e.points.pop();
      if (e.points.length) courant = i;
      else {
        elastiques.splice(i, 1);
        courant = -1;
      }
      dessiner();
    }
    function vider() {
      elastiques = [];
      courant = -1;
      dessiner();
    }
    dessiner();
    return { el: h('div', { class: 'outil-geoplan' }, h('div', { class: 'geo-zone' }, planche), commandes, description), etat, vider };
  },
};

// ===================================================================== les blocs de formes

const S3 = Math.sqrt(3) / 2; // hauteur d'un triangle équilatéral de côté 1

// Les blocs (côté 1, le grand côté du trapèze vaut 2), dans l'ordre de la palette. On les reconnaît à
// leur forme et à leur nom écrit dessous, pas seulement à leur couleur. Le carré tourne de 30° (un quart
// de tour ne le changerait pas) : il peut ainsi s'appuyer sur le côté penché d'un triangle.
const BLOCS = {
  hexagone: { nom: 'hexagone', noms: 'hexagones', couleur: 'jaune', couleurs: 'jaunes', fond: '#fcc419', pas: 60,
    points: [[0.5, 0], [1.5, 0], [2, S3], [1.5, 2 * S3], [0.5, 2 * S3], [0, S3]] },
  trapeze: { nom: 'trapèze', noms: 'trapèzes', couleur: 'rouge', couleurs: 'rouges', fond: '#e03131', pas: 60,
    points: [[0.5, 0], [1.5, 0], [2, S3], [0, S3]] },
  losange: { nom: 'losange', noms: 'losanges', couleur: 'bleu', couleurs: 'bleus', fond: '#1c7ed6', pas: 60,
    points: [[0.5, 0], [1.5, 0], [1, S3], [0, S3]] },
  triangle: { nom: 'triangle', noms: 'triangles', couleur: 'vert', couleurs: 'verts', fond: '#2f9e44', pas: 60,
    points: [[0.5, 0], [1, S3], [0, S3]] },
  carre: { nom: 'carré', noms: 'carrés', couleur: 'orange', couleurs: 'orange', fond: '#f76707', pas: 30,
    points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
};
const SORTES = Object.keys(BLOCS);
// La planche a 8 côtés de bloc de large, et au moins 4 de haut (les blocs restent assez grands sur un
// petit écran) : elle prend toute la hauteur de sa zone ; sa hauteur se mesure donc à chaque toucher.
const LARGEUR = 8;
const MIN_HAUTEUR = 4;

const taille = (sorte) => [Math.max(...BLOCS[sorte].points.map((p) => p[0])), Math.max(...BLOCS[sorte].points.map((p) => p[1]))];
const majuscule = (texte) => texte[0].toUpperCase() + texte.slice(1);
/** « 3 triangles verts », « 1 carré ». */
function quantite(sorte, n, avecCouleur) {
  const b = BLOCS[sorte];
  return `${n} ${n > 1 ? b.noms : b.nom}${avecCouleur ? ` ${n > 1 ? b.couleurs : b.couleur}` : ''}`;
}
/** « a », « a et b », « a, b et c ». */
const enumerer = (parts) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0]);

/** Le dessin d'un bloc (la palette, la planche). */
function blocSvg(sorte) {
  const [w, ht] = taille(sorte);
  const points = BLOCS[sorte].points.map(([x, y]) => `${x},${y}`).join(' ');
  return `<svg viewBox="-0.05 -0.05 ${w + 0.1} ${ht + 0.1}" aria-hidden="true"><polygon points="${points}" fill="${BLOCS[sorte].fond}" class="bf-trait"/></svg>`;
}

// Les sortes de blocs demandées ensemble : peu de mélanges, pour que les consignes ne changent que par
// leurs nombres (la voix d'Estelle les dit autour des nombres)
const PAIRES = [['hexagone', 'carre'], ['triangle', 'carre'], ['hexagone', 'losange'], ['trapeze', 'triangle'], ['losange', 'triangle']];
const TRIPLES = [['hexagone', 'losange', 'triangle'], ['trapeze', 'carre', 'triangle'], ['hexagone', 'trapeze', 'carre']];

// Recouvrir un grand bloc avec des petits : combien en faut-il ?
const RECOUVRIR = [['hexagone', 'triangle', 6], ['hexagone', 'losange', 3], ['hexagone', 'trapeze', 2], ['trapeze', 'triangle', 3], ['losange', 'triangle', 2]];

const LIBRES_BLOCS = {
  maison: 'Construis une maison avec un carré et un triangle.',
  fleur: 'Fais une fleur avec un hexagone et des losanges.',
  bonhomme: 'Fais un bonhomme avec des blocs.',
  train: 'Fais un train avec des carrés et des triangles.',
  bateau: 'Fais un bateau avec un trapèze et des triangles.',
  etoile: 'Fais une étoile avec un hexagone et 6 triangles.',
  hexaTriangles: 'Fais un hexagone avec 6 triangles verts.',
  hexaTrapezes: 'Fais un hexagone avec 2 trapèzes rouges.',
  hexaLosanges: 'Fais un hexagone avec 3 losanges bleus.',
  trapezeTriangles: 'Fais un trapèze avec 3 triangles verts.',
  frise: 'Fais une frise avec des blocs qui se répètent.',
};

const INDICES_BLOCS = {
  trop: 'Pas encore. Enlève les blocs qui ne sont pas demandés.',
  recouvrir: 'Pas encore. Pose les petits blocs sur le grand pour les compter.',
  ...Object.fromEntries(SORTES.map((s) => [s, `Pas encore. Compte bien les ${BLOCS[s].noms}.`])),
};

/**
 * Les blocs de formes : on choisit un bloc dans la palette, on touche la planche pour l'y poser (sur
 * une grille d'un quart de côté). Le dernier bloc posé est choisi : « Tourner », « Enlever ». La main
 * permet de choisir un bloc posé, puis de le déplacer en touchant sa nouvelle place.
 */
export const blocsFormes = {
  id: 'blocs-formes',
  titre: 'Les blocs de formes',
  icone: '🔷',
  famille: 'formes',
  classes: ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2'],
  aide: 'Choisis un bloc, puis touche la planche pour le poser. Pour déplacer un bloc, touche la main, puis le bloc, puis sa nouvelle place.',
  indices: Object.values(INDICES_BLOCS),
  vide: Object.fromEntries(SORTES.map((s) => [s, 0])),

  defi(grade, rng) {
    const petits = ['PS', 'MS', 'GS'].includes(grade);
    // des blocs à compter (une sorte, une paire ou un triple de PAIRES, TRIPLES) : les couleurs sont
    // dites aux petits, et quand il n'y a qu'une sorte
    const compte = (sortes, min, max) => {
      const choisies = typeof sortes[0] === 'string' ? [pick(rng, sortes)] : pick(rng, sortes);
      const blocs = Object.fromEntries(choisies.map((s) => [s, randInt(rng, min, max)]));
      return { blocs, consigne: `Pose ${enumerer(choisies.map((s) => quantite(s, blocs[s], petits || choisies.length === 1)))}.` };
    };
    const recouvrir = () => {
      const [grand, petit, n] = pick(rng, RECOUVRIR);
      return {
        blocs: { [grand]: 1, [petit]: n },
        recouvrir: true,
        consigne: `Pose 1 ${BLOCS[grand].nom}, puis autant de ${BLOCS[petit].noms} qu’il en faut pour le recouvrir.`,
      };
    };
    const libre = (...cles) => () => ({ libre: true, consigne: LIBRES_BLOCS[pick(rng, cles)] });
    const choix = {
      PS: [() => compte(['carre', 'triangle', 'hexagone'], 1, 3), () => compte(['carre', 'triangle', 'hexagone'], 1, 3), libre('maison', 'train')],
      MS: [() => compte(SORTES, 1, 5), () => compte(PAIRES, 1, 2), libre('maison', 'bonhomme', 'train')],
      GS: [() => compte(PAIRES, 1, 4), () => compte(SORTES, 3, 6), libre('maison', 'fleur', 'bateau', 'bonhomme')],
      CP: [() => compte(PAIRES, 1, 5), () => compte(TRIPLES, 1, 3), libre('fleur', 'bateau', 'etoile', 'hexaTriangles')],
      CE1: [() => compte(TRIPLES, 1, 4), recouvrir, libre('hexaTrapezes', 'hexaLosanges', 'trapezeTriangles', 'frise')],
      CE2: [() => compte(TRIPLES, 2, 5), recouvrir, recouvrir, libre('hexaTrapezes', 'hexaLosanges', 'frise', 'etoile')],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  /** Le nombre de blocs de chaque sorte : ceux demandés, et aucun autre. */
  reussi(defi, etat) {
    return SORTES.every((s) => (etat[s] || 0) === (defi.blocs[s] || 0));
  },

  solution(defi) {
    return { ...blocsFormes.vide, ...defi.blocs };
  },

  indice(defi, etat) {
    if (SORTES.some((s) => !defi.blocs[s] && etat[s])) return INDICES_BLOCS.trop;
    const faux = SORTES.filter((s) => defi.blocs[s] && etat[s] !== defi.blocs[s]);
    if (defi.recouvrir && faux.length && faux.every((s) => defi.blocs[s] > 1)) return INDICES_BLOCS.recouvrir;
    return INDICES_BLOCS[faux[0]] || INDICES_BLOCS.trop;
  },

  creer() {
    let blocs = []; // { sorte, x, y (centre, en côtés de bloc), angle }
    let choix = SORTES[0]; // le bloc de la palette, ou 'main' pour choisir et déplacer un bloc posé
    let choisi = -1; // le bloc posé qu'on tourne, enlève ou déplace
    const palette = [...SORTES, 'main'].map((s) => {
      const b = BLOCS[s];
      const [w, ht] = b ? taille(s) : [1, 1];
      const dessinBloc = h('span', { class: 'bf-dessin', 'aria-hidden': 'true', style: { '--w': w, '--h': ht } });
      if (b) dessinBloc.innerHTML = blocSvg(s);
      else dessinBloc.textContent = '✋';
      return h('button', {
        class: `bf-choix bf-choix-${s}`, 'data-choix': s, 'aria-label': b ? `${majuscule(b.nom)} ${b.couleur}` : 'Main : choisir et déplacer un bloc posé',
        onclick: () => choisir(s),
      }, dessinBloc, h('span', { class: 'bf-nom' }, b ? b.nom : 'déplacer'));
    });
    const fond = h('button', { class: 'bf-fond', 'data-planche': '', onclick: toucherPlanche });
    const posés = h('div', { class: 'bf-poses' });
    const planche = h('div', { class: 'bf-planche', style: { '--l': LARGEUR, '--hmin': MIN_HAUTEUR } }, fond, posés);
    const tourner = h('button', { class: 'outil-btn', 'data-tourner': '', onclick: () => tournerBloc() }, '↻ Tourner');
    const enlever = h('button', { class: 'outil-btn', 'data-enlever': '', onclick: () => enleverBloc() }, '🗑 Enlever');
    const commandes = h('div', { class: 'outil-commandes bf-commandes' }, tourner, enlever,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      return Object.fromEntries(SORTES.map((s) => [s, blocs.filter((b) => b.sorte === s).length]));
    }
    /** La hauteur de la planche, en côtés de bloc. */
    function hauteur() {
      const r = planche.getBoundingClientRect();
      return r.width ? (r.height / r.width) * LARGEUR : MIN_HAUTEUR;
    }
    /** Le bloc tient sur la planche (une fois tourné), centre arrondi au quart de côté. */
    function placer(b, x, y, haut = hauteur()) {
      const [w, ht] = taille(b.sorte);
      const a = (b.angle * Math.PI) / 180;
      const dx = (Math.abs(w * Math.cos(a)) + Math.abs(ht * Math.sin(a))) / 2;
      const dy = (Math.abs(w * Math.sin(a)) + Math.abs(ht * Math.cos(a))) / 2;
      b.x = Math.min(Math.max(Math.round(x * 4) / 4, dx), LARGEUR - dx);
      b.y = Math.min(Math.max(Math.round(y * 4) / 4, dy), haut - dy);
    }
    const nomBloc = (b) => `${BLOCS[b.sorte].nom} ${BLOCS[b.sorte].couleur}`;
    function dessiner() {
      posés.replaceChildren(...blocs.map((b, i) => {
        const [w, ht] = taille(b.sorte);
        const el = h('button', {
          class: 'bf-bloc', 'data-bloc': i, 'aria-pressed': String(i === choisi),
          'aria-label': `${majuscule(nomBloc(b))}${b.angle ? `, tourné de ${b.angle} degrés` : ''}`,
          style: {
            left: `calc(var(--u) * ${b.x - w / 2})`, top: `calc(var(--u) * ${b.y - ht / 2})`,
            width: `calc(var(--u) * ${w})`, height: `calc(var(--u) * ${ht})`, transform: `rotate(${b.angle}deg)`,
          },
          onclick: () => toucherBloc(i),
        });
        el.innerHTML = blocSvg(b.sorte);
        return el;
      }));
      palette.forEach((bouton) => bouton.setAttribute('aria-pressed', String(bouton.dataset.choix === choix)));
      planche.classList.toggle('main', choix === 'main');
      const bloc = blocs[choisi];
      fond.setAttribute('aria-label', choix !== 'main' ? `Planche : touche pour poser un ${nomBloc({ sorte: choix })}`
        : bloc ? `Planche : touche pour déplacer le ${nomBloc(bloc)}` : 'Planche : touche d’abord un bloc posé');
      tourner.disabled = !bloc;
      enlever.disabled = !bloc;
    }
    function choisir(s) {
      choix = s;
      if (s !== 'main') choisi = -1;
      dessiner();
    }
    function toucherPlanche(e) {
      // au clavier (pas de position touchée) : au milieu, un peu décalé à chaque bloc
      const r = planche.getBoundingClientRect();
      const auClavier = e.detail === 0 || !r.width;
      const x = auClavier ? LARGEUR / 2 + ((blocs.length % 5) - 2) / 2 : ((e.clientX - r.left) / r.width) * LARGEUR;
      const y = auClavier ? hauteur() / 2 : ((e.clientY - r.top) / r.width) * LARGEUR;
      if (choix !== 'main') {
        const b = { sorte: choix, x, y, angle: 0 };
        placer(b, x, y);
        blocs.push(b);
        choisi = blocs.length - 1;
      } else if (blocs[choisi]) placer(blocs[choisi], x, y);
      dessiner();
    }
    function toucherBloc(i) {
      // avec un bloc de la palette, la planche reçoit les touchers (on pose par-dessus) : seul le
      // clavier arrive ici, et choisit le bloc
      choisi = choix === 'main' && choisi === i ? -1 : i;
      dessiner();
    }
    function tournerBloc() {
      const b = blocs[choisi];
      if (!b) return;
      b.angle = (b.angle + BLOCS[b.sorte].pas) % 360;
      placer(b, b.x, b.y);
      dessiner();
    }
    function enleverBloc() {
      if (!blocs[choisi]) return;
      blocs.splice(choisi, 1);
      choisi = -1;
      dessiner();
    }
    function vider() {
      blocs = [];
      choisi = -1;
      dessiner();
    }
    // la planche change de taille (rotation de l'écran) : les blocs restent dessus
    const suivre = new ResizeObserver(() => {
      const haut = hauteur();
      for (const b of blocs) placer(b, b.x, b.y, haut);
      dessiner();
    });
    suivre.observe(planche);
    dessiner();
    return {
      el: h('div', { class: 'outil-blocs-formes' },
        h('div', { class: 'bf-palette', role: 'group', 'aria-label': 'Les blocs' }, palette),
        h('div', { class: 'bf-zone' }, planche),
        commandes),
      etat,
      vider,
      arreter: () => suivre.disconnect(),
    };
  },
};

// ===================================================================== les réglettes de fractions

// Les réglettes, de la même longueur, de haut en bas. Chacune a sa couleur et, coloriée, des rayures :
// un morceau colorié se voit sans les couleurs.
const REGLETTES = [
  { id: 'unite', parts: 1, nom: 'unité', noms: 'unités', fond: '#e8590c' },
  { id: 'demis', parts: 2, nom: 'demi', noms: 'demis', fond: '#e03131' },
  { id: 'tiers', parts: 3, nom: 'tiers', noms: 'tiers', fond: '#f08c00' },
  { id: 'quarts', parts: 4, nom: 'quart', noms: 'quarts', fond: '#2f9e44' },
  { id: 'cinquiemes', parts: 5, nom: 'cinquième', noms: 'cinquièmes', fond: '#0c8599' },
  { id: 'sixiemes', parts: 6, nom: 'sixième', noms: 'sixièmes', fond: '#1971c2' },
  { id: 'huitiemes', parts: 8, nom: 'huitième', noms: 'huitièmes', fond: '#7048e8' },
  { id: 'dixiemes', parts: 10, nom: 'dixième', noms: 'dixièmes', fond: '#c2255c' },
];
const reglette = (id) => REGLETTES.find((r) => r.id === id);
const EN_LETTRES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
/** « un quart », « trois quarts », « sept dixièmes » : les fractions sont dites en toutes lettres. */
const fractionEnLettres = (p, id) => `${EN_LETTRES[p]} ${p > 1 ? reglette(id).noms : reglette(id).nom}`;

const INDICES_FRACTIONS = {
  commence: 'Pas encore. Touche les morceaux d’une réglette pour les colorier.',
  reglette: 'Pas encore. Regarde bien dans quelle réglette tu colories.',
  trop: 'Pas encore. Tu as colorié trop de morceaux.',
  manque: 'Pas encore. Il manque des morceaux.',
  compare: 'Pas encore. Compare la longueur coloriée avec les autres réglettes.',
};

/**
 * Les réglettes de fractions : l'unité, puis des réglettes de même longueur coupées en demis, en
 * tiers, en quarts… (selon la classe). Toucher un morceau le colorie, le retoucher l'efface.
 */
export const fractions = {
  id: 'fractions',
  titre: 'Les réglettes de fractions',
  icone: '🍫',
  famille: 'formes',
  classes: ['CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Touche un morceau de réglette pour le colorier. Touche-le encore pour l’effacer.',
  indices: Object.values(INDICES_FRACTIONS),
  vide: Object.fromEntries(REGLETTES.map((r) => [r.id, 0])),

  /** Les réglettes de la classe : demis et quarts au CE1, puis tiers et huitièmes, puis toutes. */
  reglettes(grade) {
    if (grade === 'CE1') return ['unite', 'demis', 'quarts'];
    if (grade === 'CE2') return ['unite', 'demis', 'tiers', 'quarts', 'huitiemes'];
    return REGLETTES.map((r) => r.id);
  },

  defi(grade, rng) {
    // n morceaux de la réglette demandée ; egale : une fraction égale, dans une autre réglette
    const colorie = (id, min, max) => {
      const n = randInt(rng, min, max);
      return { reglette: id, n, consigne: `Colorie ${fractionEnLettres(n, id)}.` };
    };
    const egale = (liste) => {
      const [p, q, id] = pick(rng, liste);
      return { reglette: id, n: (p * reglette(id).parts) / reglette(q).parts, egale: true,
        consigne: `Colorie une fraction égale à ${fractionEnLettres(p, q)} dans la réglette des ${reglette(id).noms}.` };
    };
    const choix = {
      CE1: [() => ({ reglette: 'demis', n: 1, consigne: 'Colorie un demi de la réglette coupée en demis.' }),
        () => colorie('quarts', 1, 4), () => colorie('quarts', 1, 3),
        () => ({ reglette: 'quarts', n: 2, egale: true, consigne: 'Colorie la moitié de la réglette des quarts.' })],
      CE2: [() => colorie('tiers', 1, 2), () => colorie('huitiemes', 1, 7), () => colorie('quarts', 1, 3),
        () => ({ reglette: 'huitiemes', n: 4, egale: true, consigne: 'Colorie la moitié de la réglette des huitièmes.' }),
        () => ({ reglette: 'huitiemes', n: 2, egale: true, consigne: 'Colorie un quart de la réglette des huitièmes.' })],
      CM1: [() => egale([[1, 'demis', 'sixiemes'], [1, 'demis', 'huitiemes'], [1, 'demis', 'dixiemes'], [1, 'tiers', 'sixiemes'],
        [1, 'quarts', 'huitiemes'], [1, 'cinquiemes', 'dixiemes']]),
      () => colorie('cinquiemes', 1, 4), () => colorie('sixiemes', 1, 5), () => colorie('tiers', 1, 2)],
      CM2: [() => colorie('dixiemes', 1, 9), () => colorie('huitiemes', 1, 7),
        () => egale([[2, 'tiers', 'sixiemes'], [3, 'quarts', 'huitiemes'], [3, 'cinquiemes', 'dixiemes'], [4, 'cinquiemes', 'dixiemes'],
          [1, 'demis', 'dixiemes'], [2, 'quarts', 'huitiemes']])],
    }[grade];
    return choix ? pick(rng, choix)() : null;
  },

  /** Le nombre de morceaux coloriés de la bonne réglette (les autres ne comptent pas). */
  reussi(defi, etat) {
    return (etat[defi.reglette] || 0) === defi.n;
  },

  solution(defi) {
    return { ...fractions.vide, [defi.reglette]: defi.n };
  },

  indice(defi, etat) {
    if (!Object.values(etat).some(Boolean)) return INDICES_FRACTIONS.commence;
    const n = etat[defi.reglette] || 0;
    if (!n) return INDICES_FRACTIONS.reglette;
    if (defi.egale) return INDICES_FRACTIONS.compare;
    return n > defi.n ? INDICES_FRACTIONS.trop : INDICES_FRACTIONS.manque;
  },

  creer({ grade }) {
    const ids = fractions.reglettes(grade);
    const colories = Object.fromEntries(ids.map((id) => [id, Array(reglette(id).parts).fill(false)]));
    const morceaux = {};
    const mur = h('div', { class: `rgl-mur${ids.length > 5 ? ' nombreuses' : ''}`, style: { '--r': ids.length, '--r2': Math.ceil(ids.length / 2) } },
      ids.map((id) => {
        const r = reglette(id);
        // l'étiquette (1 sur 4) est dessinée par le CSS (::before) : le nom du bouton (« Un quart ») la dit déjà
        morceaux[id] = Array.from({ length: r.parts }, (_, k) => h('button', {
          class: 'rgl-morceau', 'data-reglette': id, 'data-morceau': k, onclick: () => toucher(id, k),
        }, h('span', { class: 'rgl-etiquette', 'aria-hidden': 'true' },
          r.parts === 1 ? h('span', { class: 'rgl-un', 'data-t': '1' }) : [h('span', { class: 'rgl-num', 'data-t': '1' }), h('span', { class: 'rgl-den', 'data-t': r.parts })])));
        return h('div', {
          class: `rgl-reglette rgl-${id}`, role: 'group', 'aria-label': r.parts === 1 ? 'L’unité' : `La réglette des ${r.noms}`,
          style: { '--parts': r.parts, '--rgl-couleur': r.fond },
        }, morceaux[id]);
      }));
    const voir = h('button', { class: 'outil-btn', 'data-voir-fractions': '', 'aria-pressed': 'false', onclick: () => {
      voir.setAttribute('aria-pressed', String(voir.getAttribute('aria-pressed') !== 'true'));
      dessiner();
    } }, '👁 Fractions');
    const commandes = h('div', { class: 'outil-commandes rgl-commandes' }, voir,
      h('button', { class: 'outil-btn', 'data-vider': '', onclick: () => vider() }, '🧽 Vider'));

    function etat() {
      return { ...fractions.vide, ...Object.fromEntries(ids.map((id) => [id, colories[id].filter(Boolean).length])) };
    }
    function dessiner() {
      for (const id of ids) {
        const r = reglette(id);
        morceaux[id].forEach((b, k) => {
          b.classList.toggle('colorie', colories[id][k]);
          const etatMorceau = colories[id][k] ? 'colorié' : 'blanc';
          b.setAttribute('aria-label', r.parts === 1 ? `L’unité : ${etatMorceau === 'blanc' ? 'blanche' : 'coloriée'}`
            : `Un ${r.nom}, morceau ${k + 1} sur ${r.parts} : ${etatMorceau}`);
        });
      }
      mur.classList.toggle('etiquettes', voir.getAttribute('aria-pressed') === 'true');
    }
    function toucher(id, k) {
      colories[id][k] = !colories[id][k];
      dessiner();
    }
    function vider() {
      for (const id of ids) colories[id].fill(false);
      dessiner();
    }
    dessiner();
    return { el: h('div', { class: 'outil-fractions' }, h('div', { class: 'rgl-zone' }, mur), commandes), etat, vider };
  },
};

// ===================================================================== l'ardoise

// Les feutres : leur nom est écrit sur le bouton, à côté de la pastille.
const FEUTRES = [
  { id: 'noir', couleur: '#212529' },
  { id: 'bleu', couleur: '#1864ab' },
  { id: 'rouge', couleur: '#c92a2a' },
  { id: 'vert', couleur: '#2b8a3e' },
];
const EPAISSEURS = { fin: 5, epais: 14, gomme: 34 }; // en pixels

const LIBRES_ARDOISE = {
  PS: ['Dessine un rond.', 'Dessine un soleil.', 'Dessine un bonhomme.', 'Dessine des points de toutes les couleurs.'],
  MS: ['Dessine un rond.', 'Dessine une maison.', 'Dessine un bonhomme.', 'Dessine un soleil et un nuage.', 'Écris la première lettre de ton prénom.'],
  GS: ['Écris ton prénom.', 'Dessine une maison.', 'Écris les nombres de 1 à 5.', 'Dessine 3 ronds et 2 carrés.',
    'Dessine un bonhomme avec des bras et des jambes.'],
  CP: ['Écris ton prénom.', 'Écris un mot que tu connais.', 'Écris les nombres de 1 à 10.', 'Dessine un carré et un triangle.'],
  CE1: ['Dessine un carré et un triangle.', 'Écris une phrase.', 'Écris un calcul qui fait 10.', 'Dessine un rectangle.'],
  CE2: ['Dessine un carré et un triangle.', 'Écris une phrase.', 'Dessine un cercle et un rectangle.', 'Écris un calcul qui fait 100.',
    'Dessine un triangle qui a un angle droit.'],
  CM1: ['Dessine 2 droites parallèles.', 'Dessine un triangle rectangle.', 'Écris une fraction.', 'Dessine un cercle et son centre.',
    'Écris un nombre décimal.'],
  CM2: ['Dessine 2 droites perpendiculaires.', 'Dessine un losange.', 'Écris un nombre décimal.', 'Écris un calcul qui fait 1000.',
    'Dessine un triangle et un cercle.'],
};
// des nombres à écrire (peu nombreux : chaque consigne est enregistrée par la voix d'Estelle)
const NOMBRES_ARDOISE = { CP: [12, 15, 20, 23, 38, 45, 57, 61, 74, 99], CE1: [105, 230, 347, 480, 506, 619, 777, 902] };

const INDICES_ARDOISE = { vide: 'Pas encore. Dessine sur l’ardoise.' };

/**
 * L'ardoise : on y dessine au doigt, au stylet ou à la souris (c'est l'activité elle-même) ; feutres
 * de couleur, deux épaisseurs, gomme. Ses défis sont libres : l'enfant dit quand il a fini.
 */
export const ardoise = {
  id: 'ardoise',
  titre: 'L’ardoise',
  icone: '✏️',
  famille: 'formes',
  classes: ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  aide: 'Dessine sur l’ardoise. Touche une couleur pour changer de feutre.',
  indices: Object.values(INDICES_ARDOISE),
  vide: { traits: 0 },

  defi(grade, rng) {
    const liste = LIBRES_ARDOISE[grade];
    if (!liste) return null;
    const nombres = NOMBRES_ARDOISE[grade];
    if (nombres && rng() < 0.3) return { libre: true, consigne: `Écris le nombre ${pick(rng, nombres)}.` };
    return { libre: true, consigne: pick(rng, liste) };
  },

  // les défis sont libres : ce qui suit ne sert qu'à garder le contrat d'un outil
  reussi(defi, etat) {
    return etat.traits > 0;
  },
  solution() {
    return { traits: 1 };
  },
  indice() {
    return INDICES_ARDOISE.vide;
  },

  creer() {
    let traits = []; // { couleur, largeur, gomme, points: [[x, y]…] } en pixels CSS
    const enCours = new Map(); // un trait par doigt posé
    let feutre = FEUTRES[0].id;
    let epaisseur = 'fin';
    let gomme = false;
    const toile = h('canvas', { class: 'ardoise-toile', role: 'img', 'aria-label': 'Ardoise vide' });
    const ctx = toile.getContext('2d');

    const feutres = FEUTRES.map((f) => h('button', {
      class: 'outil-btn ardoise-feutre', 'data-feutre': f.id, onclick: () => { feutre = f.id; gomme = false; dessinerBoutons(); },
    }, h('span', { class: 'ardoise-pastille', style: { background: f.couleur }, 'aria-hidden': 'true' }), ` ${majuscule(f.id)}`));
    const epaisseurs = Object.entries({ fin: 'Fin', epais: 'Épais' }).map(([id, nom]) => h('button', {
      class: 'outil-btn ardoise-epaisseur', 'data-epaisseur': id, onclick: () => { epaisseur = id; gomme = false; dessinerBoutons(); },
    }, h('span', { class: `ardoise-trait ${id}`, 'aria-hidden': 'true' }), ` ${nom}`));
    const boutonGomme = h('button', { class: 'outil-btn', 'data-gomme': '', onclick: () => { gomme = !gomme; dessinerBoutons(); } }, '🧽 Gomme');
    const commandes = h('div', { class: 'outil-commandes ardoise-commandes' }, feutres, epaisseurs, boutonGomme,
      h('button', { class: 'outil-btn', 'data-effacer': '', onclick: () => vider() }, '🗑 Effacer tout'));

    function dessinerBoutons() {
      feutres.forEach((b) => b.setAttribute('aria-pressed', String(!gomme && b.dataset.feutre === feutre)));
      epaisseurs.forEach((b) => b.setAttribute('aria-pressed', String(!gomme && b.dataset.epaisseur === epaisseur)));
      boutonGomme.setAttribute('aria-pressed', String(gomme));
    }
    function decrire() {
      toile.setAttribute('aria-label', traits.length ? `Ardoise : ${traits.length} trait${traits.length > 1 ? 's' : ''}` : 'Ardoise vide');
    }
    /** Un trait lisse : des courbes qui passent par le milieu de chaque segment. */
    function tracer(t, depuis = 0) {
      const p = t.points;
      ctx.save();
      ctx.globalCompositeOperation = t.gomme ? 'destination-out' : 'source-over';
      ctx.strokeStyle = t.couleur;
      ctx.fillStyle = t.couleur;
      ctx.lineWidth = t.largeur;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (p.length === 1) {
        ctx.beginPath();
        ctx.arc(p[0][0], p[0][1], t.largeur / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const milieu = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        ctx.beginPath();
        const debut = Math.max(1, depuis);
        ctx.moveTo(...(debut === 1 ? p[0] : milieu(p[debut - 2], p[debut - 1])));
        for (let i = debut; i < p.length; i++) ctx.quadraticCurveTo(...p[i - 1], ...milieu(p[i - 1], p[i]));
        ctx.lineTo(...p.at(-1));
        ctx.stroke();
      }
      ctx.restore();
    }
    function toutRedessiner() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, toile.width, toile.height);
      // les traits sont en pixels CSS de la toile ; elle a autant de points que l'écran
      ctx.setTransform(toile.width / (toile.clientWidth || 1), 0, 0, toile.height / (toile.clientHeight || 1), 0, 0);
      for (const t of traits) tracer(t);
    }
    // la toile suit la taille de son cadre (rotation de l'écran…), en pixels de l'écran (la page est
    // agrandie sur iPad : getBoundingClientRect donne sa taille à l'écran)
    const suivre = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;
      const r = toile.getBoundingClientRect();
      toile.width = Math.max(1, Math.round(r.width * ratio));
      toile.height = Math.max(1, Math.round(r.height * ratio));
      toutRedessiner();
    });
    suivre.observe(toile);

    const position = (e) => {
      const r = toile.getBoundingClientRect();
      // la page peut être agrandie (zoom sur iPad) : on ramène le point aux pixels de la toile
      return [((e.clientX - r.left) * toile.clientWidth) / (r.width || 1), ((e.clientY - r.top) * toile.clientHeight) / (r.height || 1)];
    };
    toile.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      toile.setPointerCapture?.(e.pointerId);
      const t = {
        couleur: FEUTRES.find((f) => f.id === feutre).couleur, largeur: gomme ? EPAISSEURS.gomme : EPAISSEURS[epaisseur], gomme, points: [position(e)],
      };
      traits.push(t);
      enCours.set(e.pointerId, t);
      tracer(t);
      decrire();
    });
    toile.addEventListener('pointermove', (e) => {
      const t = enCours.get(e.pointerId);
      if (!t) return;
      const avant = t.points.length;
      for (const ev of e.getCoalescedEvents?.() || [e]) t.points.push(position(ev));
      // on repart du dernier point déjà tracé : le trait reste continu
      tracer(t, avant);
    });
    const lever = (e) => enCours.delete(e.pointerId);
    toile.addEventListener('pointerup', lever);
    toile.addEventListener('pointercancel', lever);

    function vider() {
      traits = [];
      enCours.clear();
      toutRedessiner();
      decrire();
    }
    dessinerBoutons();
    return {
      el: h('div', { class: 'outil-ardoise' }, h('div', { class: 'ardoise-cadre' }, toile), commandes),
      etat: () => ({ traits: traits.length }),
      vider,
      arreter: () => suivre.disconnect(),
    };
  },
};

export const FORMES = [geoplan, blocsFormes, fractions, ardoise];
