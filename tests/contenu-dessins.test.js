// Les dessins ajoutés pour qu'une partie ne repose pas deux fois le même : coloriages magiques, points à
// relier, dessins cachés (picross). Assez de questions différentes à chaque niveau, des noms (clés)
// distincts, et des dessins justes : points bien placés, nombres posés sur leur zone, grilles uniques.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGame } from '../app/js/games/index.js';
import { DOT_SHAPES, MAGIC_COLORS, MAGIC_DRAWINGS } from '../app/js/games/jeux.js';
import { PICTURES } from '../app/js/games/logique-plus.js';
import { createRng } from '../app/js/random.js';
import { marques } from '../app/js/repetition.js';

const ctx = { name: 'Léa', season: 'automne' };

/** Questions différentes d'un niveau (même clé ou même sujet = même question), sur 400 tirages. */
function differentes(id, level) {
  const game = findGame(id);
  const rng = createRng(17 + level);
  const cles = new Set();
  const sujets = new Set();
  for (let i = 0; i < 400; i++) {
    const [k, s] = marques(game.generate(level, rng, i, ctx));
    cles.add(k);
    sujets.add(s);
  }
  return Math.min(cles.size, sujets.size);
}

test('dessins : assez de questions différentes à chaque niveau enrichi', () => {
  const attendus = [
    ['coloriage-magique', 1, 15], ['coloriage-magique', 2, 15],
    ['points', 1, 12], ['points', 2, 15], ['points', 3, 15],
    ['points', 4, 15], ['points', 5, 15], ['points', 6, 15], ['points', 7, 15],
    ['picross', 1, 15], ['picross', 2, 15], ['picross', 4, 15], ['picross', 6, 15],
  ];
  for (const [id, level, min] of attendus) {
    const n = differentes(id, level);
    assert.ok(n >= min, `${id} niveau ${level} : ${n} questions différentes (au moins ${min})`);
  }
});

test('dessins : rien à choisir, une seule façon de réussir (colorier ou relier tout le dessin)', () => {
  for (const [id, levels] of [['coloriage-magique', [1, 2]], ['points', [1, 2, 3, 4, 5, 6, 7]], ['picross', [1, 2, 4, 6]]]) {
    const game = findGame(id);
    for (const level of levels) {
      const rng = createRng(5);
      for (let i = 0; i < 60; i++) {
        const q = game.generate(level, rng, i, ctx);
        assert.deepEqual(q.choices, [], q.key);
        assert.equal(q.answer, null, q.key);
        assert.match(q.success.speak, /^Bravo, c’est .+ !$/, q.key);
      }
    }
  }
});

// ---------------------------------------------------------------- Les points à relier

// tracés d'un seul trait, comme on les dessine : ils se croisent, et c'est voulu
const CROISES = ['un sablier', 'un poisson', 'une étoile'];
// le petit poisson et la petite étoile (5 points) sont la même question que les grands (même clé)
const MEME_NOM = ['un poisson', 'une étoile'];

function seCroisent([a, b], [c, d]) {
  const cote = (o, p, q) => Math.sign((p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]));
  return cote(a, b, c) * cote(a, b, d) < 0 && cote(c, d, a) * cote(c, d, b) < 0;
}

test('points à relier : noms distincts, pas deux fois le même dessin', () => {
  const traces = DOT_SHAPES.map((s) => JSON.stringify(s.points));
  assert.equal(new Set(traces).size, traces.length, 'deux dessins identiques');
  // à chaque niveau (4 ou 5 points, 6 à 10, 9 à 15, 5 à 10), un nom = un dessin
  for (const [min, max] of [[4, 5], [6, 10], [9, 15], [5, 10]]) {
    const noms = DOT_SHAPES.filter((s) => s.points.length >= min && s.points.length <= max).map((s) => s.name);
    const doubles = noms.filter((n, i) => noms.indexOf(n) !== i);
    assert.ok(doubles.every((n) => MEME_NOM.includes(n)), `de ${min} à ${max} points : ${doubles.join(', ')}`);
  }
  for (const s of DOT_SHAPES) assert.match(s.name, /^(un|une|la|le) /, s.name);
});

test('points à relier : points dans le cadre, assez loin les uns des autres, traits qui ne se croisent pas', () => {
  for (const { name, points } of DOT_SHAPES) {
    const n = points.length;
    assert.ok(n >= 4 && n <= 15, name);
    for (const [x, y] of points) assert.ok(x >= 5 && x <= 95 && y >= 5 && y <= 96, `${name} : point ${x},${y}`);
    // deux points à moins de 12 : le doigt les confond
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
        assert.ok(d >= 10, `${name} : points ${i + 1} et ${j + 1} trop proches`);
      }
    }
    const traits = points.map((p, i) => [p, points[(i + 1) % n]]);
    let croisements = 0;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1) && seCroisent(traits[i], traits[j])) croisements++;
    if (CROISES.includes(name) && n === 5 - (name === 'un sablier')) assert.ok(croisements > 0, name);
    else assert.equal(croisements, 0, `${name} : des traits se croisent`);
  }
});

// ---------------------------------------------------------------- Le coloriage magique

/** Les contours d'un chemin SVG (M L H V Q T C A a Z), en lignes brisées. */
function contours(d) {
  const toks = d.match(/[A-Za-z]|-?\d*\.?\d+/g);
  const subs = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let ctrl = null;
  let cmd = '';
  let i = 0;
  const num = () => Number(toks[i++]);
  const courbe = (f, steps = 16) => { for (let k = 1; k <= steps; k++) cur.push(f(k / steps)); };
  const arc = (rx, ry, large, sweep, x2, y2) => {
    // paramètres du centre (SVG 1.1, F.6.5), sans rotation
    const dx = (x - x2) / 2;
    const dy = (y - y2) / 2;
    const l = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (l > 1) { rx *= Math.sqrt(l); ry *= Math.sqrt(l); }
    let co = Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * dy * dy - ry * ry * dx * dx) / (rx * rx * dy * dy + ry * ry * dx * dx)));
    if (large === sweep) co = -co;
    const cx = (co * rx * dy) / ry + (x + x2) / 2;
    const cy = (-co * ry * dx) / rx + (y + y2) / 2;
    const t1 = Math.atan2((y - cy) / ry, (x - cx) / rx);
    let dt = Math.atan2((y2 - cy) / ry, (x2 - cx) / rx) - t1;
    if (sweep && dt <= 0) dt += 2 * Math.PI;
    if (!sweep && dt >= 0) dt -= 2 * Math.PI;
    courbe((t) => [cx + rx * Math.cos(t1 + dt * t), cy + ry * Math.sin(t1 + dt * t)], 48);
  };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const [x0, y0] = [x, y];
    if (cmd === 'M') { x = num(); y = num(); cur = [[x, y]]; subs.push(cur); cmd = 'L'; continue; }
    if (cmd === 'Z' || cmd === 'z') { [x, y] = cur[0]; ctrl = null; continue; }
    if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    if (cmd === 'H') { x = num(); cur.push([x, y]); }
    if (cmd === 'V') { y = num(); cur.push([x, y]); }
    if (cmd === 'Q' || cmd === 'T') {
      const [cx, cy] = cmd === 'Q' ? [num(), num()] : (ctrl ? [2 * x0 - ctrl[0], 2 * y0 - ctrl[1]] : [x0, y0]);
      x = num(); y = num();
      courbe((t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y]);
      ctrl = [cx, cy];
      continue;
    }
    if (cmd === 'C') {
      const [c1x, c1y, c2x, c2y] = [num(), num(), num(), num()];
      x = num(); y = num();
      courbe((t) => [
        (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * c1x + 3 * (1 - t) * t * t * c2x + t ** 3 * x,
        (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * c1y + 3 * (1 - t) * t * t * c2y + t ** 3 * y,
      ]);
    }
    if (cmd === 'A' || cmd === 'a') {
      const [rx, ry] = [num(), num()];
      num(); // rotation : toujours 0 ici
      const [large, sweep] = [num(), num()];
      const [ex, ey] = [num(), num()];
      arc(rx, ry, large, sweep, cmd === 'a' ? x0 + ex : ex, cmd === 'a' ? y0 + ey : ey);
      [x, y] = cmd === 'a' ? [x0 + ex, y0 + ey] : [ex, ey];
    }
    ctrl = null;
  }
  return subs;
}

/** Le point est-il dans la zone (règle pair-impair, comme fill-rule: evenodd) ? */
function dans(subs, [px, py]) {
  let inside = false;
  for (const poly of subs) {
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [xa, ya] = poly[a];
      const [xb, yb] = poly[b];
      if ((ya > py) !== (yb > py) && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) inside = !inside;
    }
  }
  return inside;
}

test('coloriage magique : le contrôle des zones reconnaît un rond, un carré troué, un arc', () => {
  const rond = contours('M60 20 a10 10 0 1 0 0.1 0 Z');
  assert.ok(dans(rond, [60, 30]) && !dans(rond, [60, 45]) && !dans(rond, [72, 30]));
  const troue = contours('M0 0 H40 V40 H0 Z M10 10 H30 V30 H10 Z');
  assert.ok(dans(troue, [5, 5]) && !dans(troue, [20, 20]));
  const bande = contours('M2 100 A58 58 0 0 1 118 100 H108 A48 48 0 0 0 12 100 Z');
  assert.ok(dans(bande, [60, 47]) && !dans(bande, [60, 60]) && !dans(bande, [60, 38]));
});

test('coloriage magique : noms distincts, couleurs connues, chaque nombre posé sur sa zone et visible', () => {
  assert.equal(new Set(MAGIC_DRAWINGS.map((d) => d.name)).size, MAGIC_DRAWINGS.length);
  assert.ok(MAGIC_DRAWINGS.length >= 15);
  for (const { name, zones } of MAGIC_DRAWINGS) {
    assert.match(name, /^(la |le |l’)/, name);
    assert.ok(zones.length >= 4 && zones.length <= 9, `${name} : ${zones.length} zones`);
    // au niveau « de 1 à 3 », les couleurs 4 et 5 deviennent 1 et 2 : il en reste au moins deux
    assert.ok(new Set(zones.map((z) => z.c % 3)).size >= 2, name);
    const formes = zones.map((z) => contours(z.d));
    zones.forEach((z, i) => {
      assert.ok(Number.isInteger(z.c) && z.c >= 0 && z.c < MAGIC_COLORS.length, `${name} : couleur ${z.c}`);
      // le nombre (et un peu autour) est dans sa zone, pas sous une zone dessinée par-dessus
      for (const [dx, dy] of [[0, 0], [-2.5, -3], [2.5, -3], [-2.5, 3], [2.5, 3]]) {
        const p = [z.at[0] + dx, z.at[1] + dy];
        assert.ok(dans(formes[i], p), `${name} : le nombre de la zone ${i + 1} déborde (${p})`);
        const dessus = formes.findIndex((f, j) => j > i && dans(f, p));
        assert.equal(dessus, -1, `${name} : le nombre de la zone ${i + 1} est caché par la zone ${dessus + 1}`);
      }
    });
  }
});

// ---------------------------------------------------------------- Le dessin caché (picross)

test('dessin caché : au moins 12 dessins de chaque taille jouée seule, noms distincts, pas de doublon', () => {
  for (const size of [4, 5, 6, 7]) {
    const dessins = PICTURES.filter((p) => p.rows.length === size);
    assert.ok(dessins.length >= 12, `${size} × ${size} : ${dessins.length} dessins`);
    assert.equal(new Set(dessins.map((p) => p.name)).size, dessins.length, `${size} × ${size} : deux dessins du même nom`);
    // ni deux fois la même grille, ni une grille et son reflet
    const grilles = new Set();
    for (const p of dessins) {
      const forme = p.rows.map((r) => r.replace(/[a-z]/g, '#'));
      const reflet = forme.map((r) => [...r].reverse().join(''));
      assert.ok(!grilles.has(forme.join('/')) && !grilles.has(reflet.join('/')), `${size} × ${size} : ${p.name} déjà là`);
      grilles.add(forme.join('/'));
    }
  }
});
