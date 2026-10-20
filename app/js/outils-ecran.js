// Les écrans de la boîte à outils : la liste des outils de l'enfant (par famille), puis un outil,
// à manipuler librement, avec ses défis sans note (« Un défi », « Vérifier », « Un autre défi »).
// Le catalogue et le contrat d'un outil sont dans outils.js ; main.js passe ses aides (deps) :
// show, topBar, say, me, child, frenchSpacing, onBack (retour à l'accueil), quitter (ce qu'il faut
// arrêter en quittant l'écran).

import { h } from './render.js';
import { createRng, pick } from './random.js';
import { playSound } from './sounds.js';
import { aDesDefis, estVide, FAMILLES, outilsDeLEnfant, PHRASES_OUTILS, RUBRIQUE_OUTILS, trouverOutil } from './outils.js';

/** La liste des outils de l'enfant, rangés par famille. */
export function outilsScreen(deps) {
  const { show, topBar, say, me, child, onBack } = deps;
  const outils = outilsDeLEnfant(child());
  if (!outils.length) return onBack();
  const blocks = [];
  for (const famille of FAMILLES) {
    const liste = outils.filter((o) => o.famille === famille.id);
    if (!liste.length) continue;
    blocks.push(h('h2', { class: 'section-title' }, famille.titre));
    for (const outil of liste) {
      blocks.push(h('div', { class: 'game-card outil-card' },
        h('button', { class: 'game-play', 'data-outil': outil.id, onclick: () => outilScreen(deps, outil.id) },
          h('span', { class: 'game-icon', 'aria-hidden': 'true' }, outil.icone),
          h('span', { class: 'game-title' }, outil.titre))));
    }
  }
  show(h('main', { class: `screen domain outils domain-theme-${RUBRIQUE_OUTILS.id}`, 'data-title': RUBRIQUE_OUTILS.title },
    topBar({ onBack, title: `${RUBRIQUE_OUTILS.icon} ${RUBRIQUE_OUTILS.title}` }),
    h('div', { class: 'game-grid' }, blocks)));
  say(me(), PHRASES_OUTILS.liste);
}

/** Un outil : on le manipule librement ; « Un défi » propose une consigne, vérifiée sans note. */
export function outilScreen(deps, id) {
  const { show, topBar, say, me, child, frenchSpacing } = deps;
  const outil = trouverOutil(id);
  if (!outil) return outilsScreen(deps);
  const grade = child().grade;
  const rng = createRng();
  const inst = outil.creer({ grade });
  const dire = (text) => say(me(), text);
  let defi = null;
  let reussi = false;

  const consigne = h('button', { class: 'bubble outil-consigne', 'data-consigne': '', onclick: () => defi && dire(defi.consigne) });
  const retour = h('p', { class: 'outil-retour', 'aria-live': 'polite' });
  const bandeau = h('div', { class: 'outil-defi', hidden: true }, consigne, retour);
  const barre = h('div', { class: 'outil-barre' });
  const main = h('main', { class: `screen outil domain-theme-${RUBRIQUE_OUTILS.id}`, 'data-outil': outil.id, 'data-title': outil.titre },
    topBar({ onBack: () => outilsScreen(deps), title: `${outil.icone} ${outil.titre}` }),
    bandeau,
    h('div', { class: 'outil-zone' }, inst.el),
    barre);

  const bouton = (texte, attr, onclick, primary = false) => h('button', { class: primary ? 'big-btn primary' : 'big-btn', [attr]: '', onclick }, texte);
  function dessinerBarre() {
    if (!defi) {
      barre.replaceChildren(...(aDesDefis(outil, grade) ? [bouton('🎯 Un défi', 'data-defi', nouveauDefi, true)] : []));
    } else if (reussi) {
      barre.replaceChildren(bouton('🎯 Un autre défi', 'data-defi', nouveauDefi, true), bouton('Arrêter', 'data-arreter', arreter));
    } else {
      barre.replaceChildren(defi.libre ? bouton('✔ J’ai fini', 'data-verifier', verifier, true) : bouton('✔ Vérifier', 'data-verifier', verifier, true),
        bouton('Arrêter', 'data-arreter', arreter));
    }
  }
  function nouveauDefi() {
    // un défi différent du précédent
    let suivant = null;
    for (let i = 0; i < 20 && (!suivant || suivant.consigne === defi?.consigne); i++) suivant = outil.defi(grade, rng);
    defi = suivant;
    reussi = false;
    globalThis.__lc = { outil: outil.id, defi }; // utilisé par les tests de bout en bout
    inst.vider?.();
    inst.preparer?.(defi);
    main.classList.add('en-defi');
    bandeau.hidden = false;
    consigne.textContent = frenchSpacing(defi.consigne);
    retour.textContent = '';
    retour.className = 'outil-retour';
    dessinerBarre();
    dire(defi.consigne);
  }
  function verifier() {
    const etat = inst.etat();
    // un défi libre (dessin, construction) n'est pas vérifié, mais il faut au moins avoir commencé
    if (defi.libre ? !estVide(outil, etat) : outil.reussi(defi, etat)) {
      reussi = true;
      const bravo = defi.libre ? PHRASES_OUTILS.fini : pick(rng, PHRASES_OUTILS.bravo);
      retour.textContent = frenchSpacing(bravo);
      retour.className = 'outil-retour bien';
      playSound('success');
      dessinerBarre();
      dire(bravo);
    } else {
      const indice = defi.libre ? PHRASES_OUTILS.rien : outil.indice?.(defi, etat) || PHRASES_OUTILS.pasEncore;
      retour.textContent = frenchSpacing(indice);
      retour.className = 'outil-retour pas-encore';
      playSound('error');
      dire(indice);
    }
  }
  function arreter() {
    defi = null;
    reussi = false;
    inst.preparer?.(null);
    main.classList.remove('en-defi');
    bandeau.hidden = true;
    dessinerBarre();
  }

  dessinerBarre();
  show(main);
  if (inst.arreter) deps.quitter(inst.arreter);
  dire(outil.aide);
}
