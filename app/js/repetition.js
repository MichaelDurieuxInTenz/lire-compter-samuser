// Pas deux fois la même question dans une partie : ce qui ne dépend pas de l'écran (testé dans tests/).
// Le « sujet » d'une question, c'est ce que l'enfant voit et entend : la consigne, le dessin, la bonne
// réponse (et les paires, le texte à remettre en ordre…), sans l'ordre des choix, les autres choix
// proposés ni leurs couleurs. Quand l'écran n'a pas de dessin, le bon choix tel qu'il est montré fait
// partie du sujet (« trouve l'intrus » : l'intrus) ; s'il n'y en a pas, tous les choix.

// ce qui ne change pas le sujet : la clé, les mots dits (ils suivent la consigne), les félicitations,
// les explications, les couleurs ; les choix sont traités à part
const HORS_SUJET = new Set(['key', 'instruction', 'short', 'success', 'replay', 'explain', 'hint', 'speak', 'color', 'colors', 'choices', 'rights']);
// listes mélangées à l'écran (mots à remettre en ordre, étiquettes, cartes, paires) : leur ordre ne compte pas
const EN_DESORDRE = ['items', 'tiles', 'cards', 'pairs'];

const texte = (x) => JSON.stringify(x, (k, v) => (HORS_SUJET.has(k) ? undefined : v));

/** Le sujet d'une question (une chaîne) : deux questions de même sujet sont « la même question ». */
export function sujetQuestion(q) {
  const sansDessin = !q.stage || (q.stage.type === 'none' && Object.keys(q.stage).length === 1);
  const sujet = { ...q };
  for (const k of EN_DESORDRE) if (Array.isArray(q[k])) sujet[k] = q[k].map(texte).sort();
  if (sansDessin && Array.isArray(q.choices)) {
    const reponse = JSON.stringify(q.answer);
    const bons = q.choices.filter((c) => reponse !== undefined && JSON.stringify(c?.value) === reponse);
    sujet.choix = (bons.length ? bons : q.choices).map(texte).sort();
  }
  return texte(sujet);
}

/**
 * Ce qui fait reconnaître une question déjà posée : sa clé (le jeu y met l'essentiel : « le double de 2 »,
 * quel que soit le dessin) et son sujet (la même question, les choix dans un autre ordre).
 */
export function marques(q) {
  return [`clé ${q.key}`, `sujet ${sujetQuestion(q)}`];
}

/** L'historique d'une partie : pour chaque marque, le rang de la dernière question qui la portait. */
export function historique() {
  return { rangs: new Map(), n: 0 };
}

/** Note la question qu'on vient de poser. */
export function noter(h, q) {
  for (const m of marques(q)) h.rangs.set(m, h.n);
  h.n += 1;
}

// une question posée il y a au moins 4 questions peut revenir (s'il n'y en a plus de nouvelle)
const ECART_SUFFISANT = 4;

/** Combien de questions depuis que celle-ci (ou la même) a été posée : Infinity si jamais. */
function ecart(h, q) {
  const rangs = marques(q).filter((m) => h.rangs.has(m)).map((m) => h.rangs.get(m));
  return rangs.length ? h.n - Math.max(...rangs) : Infinity;
}

/**
 * La question suivante d'une partie. `draw(i)` tire une question : la première qui n'a pas encore été
 * posée dans la partie (historique `h`). Si le niveau n'en propose plus après `tries` tirages (il a peu de
 * questions), une qui n'a pas été posée parmi les 4 dernières, sinon celle posée il y a le plus longtemps :
 * jamais deux fois de suite la même quand le jeu en a d'autres.
 */
export function questionSuivante(draw, h = historique(), tries = 100) {
  let meilleure = null;
  let meilleurEcart = -1;
  for (let i = 0; i < tries; i++) {
    const q = draw(i);
    const e = ecart(h, q);
    if (e === Infinity) return q;
    if (Math.min(e, ECART_SUFFISANT) > meilleurEcart) {
      meilleure = q;
      meilleurEcart = Math.min(e, ECART_SUFFISANT);
    }
  }
  return meilleure;
}
