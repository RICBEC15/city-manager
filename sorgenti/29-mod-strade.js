// =====================================================================
//  Idee prese dalle mod più usate di Cities: Skylines II - Blocco 1:
//  strade e traffico. Tutto rifatto da zero, niente codice delle mod.
//  17 regole delle corsie · 134 frecce sulle corsie (anche rotonde)
//  100 svincoli compatti · 9/195 stili di strada · 21 passi carrai
//  22 cartelli e portali · 69 strisce pedonali larghe e diagonali
//  97 auto parcheggiate (anche storte) · 121 stili di semaforo
//  29 neve che si accumula e si scioglie, tracce delle gomme
//  44/168 scale e gradonate · 159 tunnel in cemento · 6 edifici deformati
//  7 anteprima dei ponti
// =====================================================================

// ---------- extra di ogni strada (s.mx) e salvataggio ----------
const MX_DEF = { curb: 'std', deco: 'none', cross: 'std', bike: false, arrows: false, line: 'white', st: 'concrete' };
function mxOf(s) { return s.mx || MX_DEF; }
function mxSet(s, k, v) { s.mx = { ...(s.mx || MX_DEF), [k]: v }; if (Object.keys(MX_DEF).every(q => s.mx[q] === MX_DEF[q])) s.mx = null; roadDirty.add(s.chunk); }
{ // dividere una strada: le due metà tengono lo stile
  const _split = splitSeg;
  splitSeg = function (s, t, elevOverride) { const mx = s.mx, m = _split(s, t, elevOverride); if (mx && m) for (const id of m.segs) { const q = segs.get(id); if (q && !q.mx && q.type === s.type) q.mx = { ...mx }; } return m; };
}
{
  const _ser = serialize;
  serialize = function () {
    S.segMx = [...segs.values()].filter(s => s.mx).map(s => [s.id, s.mx]);
    S.signs = SIGNS.list;
    try { return _ser(); } finally { delete S.segMx; }
  };
  if (typeof __cm !== 'undefined') __cm.serialize = serialize;
  const _des = deserializeG;
  deserializeG = function* (json) {
    yield* _des(json);
    if (S && S.segMx) { for (const [id, mx] of S.segMx) { const s = segs.get(id); if (s) { s.mx = mx; roadDirty.add(s.chunk); } } delete S.segMx; flushRoads(); }
    SIGNS.list = (S && S.signs) || []; signsRebuild();
  };
}

// ---------- 17 + 134: regole delle corsie ----------
// corsia "di destra" (o sinistra) di un tratto, contando come fa laneOffset
function laneSideIdx(e, right) {
  const n = e.cars.length, rt = RT[e.seg.type], lh = S?.opts?.leftHand ? -1 : 1;
  const rightIdx = rt.two && lh < 0 ? 0 : n - 1;
  return right ? rightIdx : n - 1 - rightIdx;
}
function kerbIdx(e) { const lh = S?.opts?.leftHand ? -1 : 1; return laneSideIdx(e, lh > 0); }
const HEAVY = new Set(['truck', 'van', 'bus', 'garbage', 'hearse', 'maint', 'fire']);
function laneFree(e, k, need) { return canEnter(e, k, need); }
bestLaneV = function (v, e2, li2) {
  const n = e2.cars.length; if (n <= 1) return 0;
  const k = VK[v.kind]; if (k.rail || v.stuck > 15) return bestLane(e2);
  const strict = !!(e2.seg.mx?.arrows || (e2.seg.ring && S.ringStrict));
  const after = v.legs[li2 + 1];
  let want = -1;
  if (after && after.e && !after.e.rail) {
    const t = turnSide(e2, after.e);
    const rtA = RT[after.e.seg.type], rt2 = RT[e2.seg.type];
    if (rt2.hw && after.e.seg.type === 'ramp' && e2.seg.type !== 'ramp') want = kerbIdx(e2); // uscita: corsia esterna per tempo
    else if (t > 0.35) want = laneSideIdx(e2, true);
    else if (t < -0.35) want = laneSideIdx(e2, false);
    else if (e2.seg.ring && !after.e.seg.ring) want = kerbIdx(e2); // si esce dalla rotonda: corsia esterna
    else if (e2.seg.ring) want = n - 1 - kerbIdx(e2); // si resta nella rotonda: corsia interna
    else if (rtA && !rt2.hw) { // svolta subito dopo un tratto corto: corsia giusta in anticipo
      const a2 = v.legs[li2 + 2];
      if (a2 && a2.e && after.e.len < 80) { const t2 = turnSide(after.e, a2.e); if (t2 > 0.35) want = laneSideIdx(e2, true); else if (t2 < -0.35) want = laneSideIdx(e2, false); }
    }
  }
  if (want < 0 && RT[e2.seg.type].hw) { // autostrada: si tiene la destra, i mezzi pesanti sempre
    const kb = kerbIdx(e2), other = kb === 0 ? 1 : kb - 1;
    if (HEAVY.has(v.kind)) want = laneFree(e2, kb, v.l + 6) || n < 3 ? kb : other;
    else want = laneFree(e2, kb, v.l + 25) ? kb : other; // corsia di sorpasso solo se serve
    return want;
  }
  if (want < 0) return bestLane(e2);
  if (strict || laneFree(e2, want, v.l + 3)) return want;
  return v.stuck > 4 ? bestLane(e2) : want;
};

// ---------- 100: svincoli compatti in più ----------
const ICHG2 = {
  compact: { U: 110, V: 85, E: 150, ct: 'medium', ramps: [['A1', -.06, .2, 'C2'], ['C2', .06, .2, 'A2'], ['A2', .06, -.2, 'C1'], ['C1', -.06, -.2, 'A1']] },
  parclo: { U: 170, V: 150, E: 330, ct: 'medium', ramps: [['A2', .06, -.2, 'C1'], ['C1', -.06, -.2, 'A1'], ['A1', -.95, .95, 'C2'], ['C2', -.22, .22, 'A1'], ['A2', .95, .95, 'C2'], ['C2', .22, .22, 'A2']] },
  trumpet: { U: 200, V: 200, E: 420, ct: 'highway', half: true, ramps: [['A1', -.95, -.95, 'C1'], ['C1', -.22, -.22, 'A1'], ['A2', .95, -.95, 'C1'], ['C1', .22, -.22, 'A2']] },
};
Object.assign(ICHG, {
  compact: { cost: 90000, ms: 4, n: () => L('Svincolo compatto', 'Compact interchange'), d: () => L('Rombo stretto per le città fitte: ponte e 4 rampe corte', 'Tight diamond for dense cities: bridge and 4 short ramps') },
  parclo: { cost: 260000, ms: 5, n: () => L('Mezzo quadrifoglio', 'Partial cloverleaf'), d: () => L('Da un lato rampe dritte, dall\'altro due anelli: meno semafori', 'Straight ramps on one side, two loops on the other') },
  trumpet: { cost: 300000, ms: 5, n: () => L('Svincolo a T (tromba)', 'Trumpet (T) interchange'), d: () => L('Clicca su un\'autostrada: ne parte un\'altra di lato, con 4 rampe', 'Click a highway: a new highway branches off to one side, with 4 ramps') },
});
TREE.push({ id: 't_ichg2', cat: 'roads', cost: 3, req: 't_ichg', items: ['compact', 'parclo', 'trumpet'], n: () => L('Svincoli compatti, mezzo quadrifoglio, a T', 'Compact, partial cloverleaf and T interchanges') });
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
{
  const _plan = ichgPlan, _build = buildInterchange;
  ichgPlan = function (kind, x, z) {
    const G = ICHG2[kind]; if (!G) return _plan(kind, x, z);
    const near = findNearSeg(x, z, 30, s => RT[s.type].hw && RT[s.type].two);
    if (!near) return { ok: false, why: L('Clicca su un\'autostrada a doppio senso', 'Click a two-way highway') };
    const s = near.seg, { U, V, E } = G;
    if (near.along < U + 20 || near.along > s.len - U - 20) return { ok: false, why: L('Tratto di autostrada troppo corto: allungalo o clicca più in mezzo', 'Highway stretch too short: click nearer its middle') };
    const f = segFrame(s, near.along), P = (u, v) => ({ x: f.x + f.tx * u + f.nx * v, z: f.z + f.tz * u + f.nz * v });
    const A1 = segFrame(s, near.along - U), A2 = segFrame(s, near.along + U), C1 = P(0, -V), C2 = P(0, V), K = { A1, A2, C1, C2 };
    const plan = { ok: true, why: '', cost: ICHG[kind].cost, seg: s, along: near.along, f, P, U, V, E, A1, A2, curves: [], G };
    plan.curves.push(G.half ? [P(0, -E), null, C1] : [P(0, -E), null, P(0, E)]);
    for (const [a, cu, cv, b] of G.ramps) plan.curves.push([K[a], P(cu * U, cv * V), K[b]]);
    for (const [a, c, b] of plan.curves) for (const p of curvePts(a, c, b, 16)) {
      if (!isOwned(p.x, p.z)) { plan.ok = false; plan.why = L('Fuori dal tuo territorio', 'Outside your land'); }
      else if (svcAt(p.x, p.z)) { plan.ok = false; plan.why = L('C\'è un edificio di servizio in mezzo', 'A service building is in the way'); }
      else if (isWater(p.x, p.z)) { plan.ok = false; plan.why = L('Non sull\'acqua', 'Not on water'); }
      if (!plan.ok) return plan;
    }
    return plan;
  };
  buildInterchange = function (kind, x, z) {
    const G = ICHG2[kind]; if (!G) return _build(kind, x, z);
    const pl = ichgPlan(kind, x, z);
    if (!pl.ok) { toast(pl.why, 2500); return; }
    if (!spend(pl.cost)) return;
    const made = [], s = pl.seg, P = pl.P;
    const t2 = nearestOnSeg(s, pl.A2.x, pl.A2.z).t; const N2 = splitSeg(s, t2);
    const near1 = findNearSeg(pl.A1.x, pl.A1.z, 6, q => q.type === s.type); const N1 = splitSeg(near1.seg, near1.t);
    const mk = (u, v) => { const q = P(u, v); return makeNode(q.x, q.z); };
    const E1 = mk(0, -pl.E), C1 = mk(0, -pl.V);
    made.push(addSeg(E1, C1, G.ct));
    let C2 = null;
    if (!G.half) { C2 = mk(0, pl.V); const E2 = mk(0, pl.E); made.push(addSeg(C1, C2, G.ct, null, null, 1), addSeg(C2, E2, G.ct)); }
    const K = { A1: N1, A2: N2, C1, C2 };
    for (const [a, cu, cv, b] of G.ramps) { const c = P(cu * pl.U, cv * pl.V); made.push(addSeg(K[a], K[b], 'ramp', c.x, c.z)); }
    for (const n of [N1, N2, C1, C2]) if (n) { n.lightMode = 'off'; updateNodeLights(n); }
    undoStack.push({ k: 'road', segs: made.map(q => q.id), cost: pl.cost });
    addXP(30, L('svincolo costruito', 'interchange built'));
    toast(ICHG[kind].n() + ' ✓', 2000);
  };
}

// ---------- 44 + 168: scale e gradonate ----------
RT.stairs = { ...RT.path, w: 4, speed: 1.4, cost: 30, upk: 0.02, stairs: true, n: () => L('Scala', 'Stairs'), d: () => L('Sale anche su pendii ripidi. 7 stili', 'Climbs even steep slopes. 7 styles') };
RT.steps = { ...RT.path, w: 12, speed: 1.6, cost: 70, upk: 0.03, stairs: true, steps: true, n: () => L('Gradonata', 'Terraced steps'), d: () => L('Gradoni larghi in cemento per pendii, argini e canali', 'Wide concrete steps for slopes, banks and canals') };
roadMats.stairs = new THREE.MeshLambertMaterial({ color: 0xb9b5ac, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
roadMats.steps = new THREE.MeshLambertMaterial({ color: 0xaaa79f, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
const STAIR_ST = {
  concrete: [() => L('Cemento', 'Concrete'), [0.72, 0.71, 0.68], [0.55, 0.55, 0.53]],
  stone: [() => L('Pietra', 'Stone'), [0.66, 0.6, 0.5], [0.5, 0.45, 0.38]],
  wood: [() => L('Legno', 'Wood'), [0.55, 0.38, 0.22], [0.4, 0.27, 0.15]],
  brick: [() => L('Mattoni', 'Brick'), [0.66, 0.34, 0.25], [0.5, 0.26, 0.2]],
  metal: [() => L('Metallo', 'Metal'), [0.5, 0.53, 0.56], [0.25, 0.27, 0.3]],
  garden: [() => L('Giardino', 'Garden'), [0.7, 0.68, 0.62], [0.32, 0.5, 0.25]],
  modern: [() => L('Moderna', 'Modern'), [0.9, 0.9, 0.88], [0.95, 0.85, 0.5]],
};
{ // le scale seguono il terreno anche dove è ripido
  const _csp = computeSegPts;
  computeSegPts = function (s) {
    _csp(s);
    if (!RT[s.type]?.stairs || s.elev) return;
    const n = s.pts.length - 1;
    for (let i = 1; i < n; i++) { const p = s.pts[i]; p.y = Math.max(p.h, WATER + 0.5); }
  };
}

// ---------- disegno extra delle strade (un pezzo per ogni casella) ----------
const decoMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const decoFlatMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
const h01 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const PARK_COLS = [[0.85, 0.85, 0.85], [0.15, 0.15, 0.17], [0.7, 0.12, 0.1], [0.2, 0.3, 0.6], [0.55, 0.56, 0.58], [0.9, 0.9, 0.92], [0.25, 0.45, 0.3], [0.85, 0.7, 0.2]];
function roadDeco(c) {
  const P = [], N = [], C = [], FP = [], FN = [], FC = [];
  const quad = (a, b, cc, d, col, flat) => {
    const nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const l = Math.hypot(nx, ny, nz) || 1, s = ny < 0 ? -1 : 1, pp = flat ? FP : P, nn = flat ? FN : N, co = flat ? FC : C;
    for (const p of [a, b, cc, a, cc, d]) { pp.push(p[0], p[1], p[2]); nn.push(s * nx / l, s * ny / l, s * nz / l); co.push(col[0], col[1], col[2]); }
  };
  // scatola orientata: centro x,z, base y0, alta h, mezza larghezza wa (lungo t) e wb (lungo n)
  const box = (x, y0, h, z, wa, wb, tx, tz, col, top = col) => {
    const nx = -tz, nz = tx, y1 = y0 + h;
    const Q = (sa, sb, y) => [x + tx * wa * sa + nx * wb * sb, y, z + tz * wa * sa + nz * wb * sb];
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) { const [a1, b1] = cs[i], [a2, b2] = cs[(i + 1) % 4]; quad(Q(a1, b1, y0), Q(a2, b2, y0), Q(a2, b2, y1), Q(a1, b1, y1), col); }
    quad(Q(-1, -1, y1), Q(1, -1, y1), Q(1, 1, y1), Q(-1, 1, y1), top);
  };
  const flatRect = (x, y, z, wa, wb, tx, tz, col) => { const nx = -tz, nz = tx; quad([x - tx * wa - nx * wb, y, z - tz * wa - nz * wb], [x + tx * wa - nx * wb, y, z + tz * wa - nz * wb], [x + tx * wa + nx * wb, y, z + tz * wa + nz * wb], [x - tx * wa + nx * wb, y, z - tz * wa + nz * wb], col, true); };
  const lh = S?.opts?.leftHand ? -1 : 1;
  for (const s of segs.values()) {
    if (s.chunk !== c || s.len < 4) continue;
    const rt = RT[s.type], hw = rt.w / 2, mx = mxOf(s), deep = s.elev <= -2;
    // --- 44/168 scale ---
    if (rt.stairs) {
      const st = STAIR_ST[mx.st] || STAIR_ST.concrete, w2 = hw - (rt.steps ? 0 : 0.2);
      for (let i = 0; i < s.pts.length - 1; i++) {
        const p = s.pts[i], q = s.pts[i + 1], dy = q.y - p.y, dl = s.cum[i + 1] - s.cum[i]; if (dl < 0.1) continue;
        const tx = (q.x - p.x) / dl, tz = (q.z - p.z) / dl, nx = -tz, nz = tx;
        const nst = Math.max(1, Math.min(40, Math.round(Math.abs(dy) / (rt.steps ? 0.45 : 0.17))));
        if (Math.abs(dy) > 0.25) for (let k = 0; k < nst; k++) {
          const u0 = k / nst, u1 = (k + 1) / nst, yb = Math.min(p.y, q.y) - 0.2, yt = p.y + dy * (dy > 0 ? u1 : u0) + 0.2;
          const cx = p.x + tx * dl * (u0 + u1) / 2, cz = p.z + tz * dl * (u0 + u1) / 2;
          box(cx, yb, yt - yb, cz, dl / nst / 2 + 0.02, w2, tx, tz, k % 2 ? st[1] : st[1].map(v => v * 0.94), st[1]);
        }
        if (!rt.steps || mx.st !== 'concrete') for (const sd of [-1, 1]) { // corrimano o bordi
          const o = sd * (hw - 0.1), ya = p.y + 1.1, yb2 = q.y + 1.1;
          if (mx.st === 'garden') { box(p.x + nx * o * 1.15 + tx * dl / 2, Math.min(p.y, q.y), Math.abs(dy) + 0.6, p.z + nz * o * 1.15 + tz * dl / 2, dl / 2, 0.5, tx, tz, st[2]); continue; }
          quad([p.x + nx * o, ya, p.z + nz * o], [q.x + nx * o, yb2, q.z + nz * o], [q.x + nx * o, yb2 - 0.1, q.z + nz * o], [p.x + nx * o, ya - 0.1, p.z + nz * o], st[2]);
          box(p.x + nx * o, p.y, 1.1, p.z + nz * o, 0.05, 0.05, tx, tz, st[2]);
          if (mx.st === 'modern' && i % 2 === 0) box(p.x + nx * o, p.y + 0.15, 0.1, p.z + nz * o, 0.12, 0.12, tx, tz, [1, 0.92, 0.6]);
        }
      }
      continue;
    }
    if (rt.ped || rt.rail) continue;
    const twoSide = rt.two ? [-1, 1] : [1, -1];
    const lb = rt.lanesB || rt.lanes, inner = rt.two ? rt.med : 0;
    for (let i = 0; i < s.pts.length - 1; i++) {
      const p = s.pts[i], q = s.pts[i + 1], dl = s.cum[i + 1] - s.cum[i]; if (dl < 0.1) continue;
      const tx = (q.x - p.x) / dl, tz = (q.z - p.z) / dl, nx = -tz, nz = tx, y = p.y + 0.15, y2 = q.y + 0.15;
      const elevated = p.y - p.h > 1.5 || q.y - q.h > 1.5;
      const seam = (o, col, w = 0.18, dy = 0.05) => quad([p.x + nx * (o - w), y + dy, p.z + nz * (o - w)], [q.x + nx * (o - w), y2 + dy, q.z + nz * (o - w)], [q.x + nx * (o + w), y2 + dy, q.z + nz * (o + w)], [p.x + nx * (o + w), y + dy, p.z + nz * (o + w)], col, true);
      // --- 159 tunnel e trincee in cemento ---
      if (s.elev < 0 && !deep && i % 2 === 0) for (const sd of [-1, 1]) { const o = sd * (hw + 14), top = Math.max(p.h, y + 1) + 0.6; if (top - y > 1.2) box(p.x + nx * o, y - 0.3, top - y + 0.3, p.z + nz * o, 0.6, 0.6, tx, tz, [0.6, 0.6, 0.57]); }
      if (deep && i < s.pts.length - 1) {
        const dp = typeof deepPt === 'function' ? deepPt : () => true, a0 = dp(s, p), a1 = dp(s, q);
        if (a0 !== a1) { // imbocco: arco in cemento con le ali
          const m = a0 ? q : p, top = Math.max(m.h, m.y + 6) + 1.5, yb = m.y, N2 = 9, R = hw + 1.6;
          for (let k = 0; k < N2; k++) { const a = Math.PI * k / (N2 - 1), ox = Math.cos(a) * R, oy = Math.sin(a) * Math.min(R, top - yb - 0.5); box(m.x + nx * ox, yb + oy, 1.2, m.z + nz * ox, 0.9, 0.9, tx, tz, [0.68, 0.68, 0.65]); }
          for (const sd of [-1, 1]) box(m.x + nx * sd * (R + 4), yb, top - yb, m.z + nz * sd * (R + 4), 1.5, 4, tx, tz, [0.62, 0.62, 0.6]);
        }
      }
      if (deep) continue;
      // --- 9/195 bordi, linee colorate, pista ciclabile, decorazioni ---
      const sw = rt.side || 0;
      if (mx.curb !== 'std' && sw > 0.5) for (const sd of [-1, 1]) {
        const o = sd * (hw - sw / 2);
        if (mx.curb === 'stone') seam(o, [0.62, 0.56, 0.47], sw / 2 - 0.05, 0.04);
        else if (mx.curb === 'green') seam(o, [0.33, 0.52, 0.25], sw / 2 - 0.25, 0.04);
        else if (mx.curb === 'redwhite') { const o2 = sd * (hw - sw + 0.1), n2 = Math.max(1, Math.round(dl / 2)); for (let k = 0; k < n2; k++) { const u = (k + 0.5) / n2; flatRect(p.x + (q.x - p.x) * u + nx * o2, lerp(y, y2, u) + 0.12, p.z + (q.z - p.z) * u + nz * o2, dl / n2 / 2, 0.2, tx, tz, k % 2 ? [0.85, 0.1, 0.1] : [0.95, 0.95, 0.95]); } }
      }
      if (mx.line !== 'white' && rt.two && rt.med <= 1) { const col = mx.line === 'yellow' ? [0.92, 0.75, 0.15] : [0.95, 0.95, 0.95]; seam(-0.3, col, 0.1); seam(0.3, col, 0.1); }
      if (mx.line === 'yellow' && !rt.two) for (const sd of [-1, 1]) seam(sd * rt.lanes * LW / 2, [0.92, 0.75, 0.15], 0.1);
      if (mx.bike) for (const sd of (rt.two ? [-1, 1] : [1])) { const o = rt.two ? sd * (inner + (sd > 0 ? rt.lanes : lb) * LW - 0.8) : (rt.lanes * LW / 2 - 0.8); seam(o * (rt.two ? lh : 1), [0.72, 0.22, 0.18], 0.75, 0.06); }
      if (mx.deco !== 'none') for (const sd of [-1, 1]) {
        const o = sd * (hw - 0.25), x0 = p.x + nx * o, z0 = p.z + nz * o, x1 = q.x + nx * o, z1 = q.z + nz * o;
        if (mx.deco === 'rail') { quad([x0, y + 0.6, z0], [x1, y2 + 0.6, z1], [x1, y2 + 0.9, z1], [x0, y + 0.9, z0], [0.75, 0.76, 0.78]); if (i % 1 === 0) box(x0, y, 0.8, z0, 0.06, 0.06, tx, tz, [0.5, 0.5, 0.52]); }
        else if (mx.deco === 'bollard') { for (let u = 0; u < dl; u += 2.5) box(x0 + tx * u, y + lerp(0, y2 - y, u / dl), 0.9, z0 + tz * u, 0.1, 0.1, tx, tz, [0.2, 0.2, 0.22], [0.9, 0.8, 0.2]); }
        else if (mx.deco === 'flowers' && i % 2 === 0) { box(x0 + tx * dl / 2, y, 0.6, z0 + tz * dl / 2, 0.8, 0.35, tx, tz, [0.45, 0.42, 0.4], [h01(s.id, i) < 0.5 ? 0.85 : 0.9, h01(i, s.id) < 0.5 ? 0.3 : 0.75, 0.4]); }
        else if (mx.deco === 'hedge') box(x0 + tx * dl / 2, y, 1.1, z0 + tz * dl / 2, dl / 2, 0.3, tx, tz, [0.22, 0.42, 0.2], [0.28, 0.5, 0.24]);
        else if (mx.deco === 'oldlamp' && i % 3 === 1) { box(x0, y, 4.5, z0, 0.1, 0.1, tx, tz, [0.15, 0.17, 0.15]); box(x0, y + 4.5, 0.7, z0, 0.3, 0.3, tx, tz, [1, 0.86, 0.55]); }
      }
      // --- 134 frecce sulle corsie, vicino alla fine del tratto ---
      if (mx.arrows && i === s.pts.length - 3 && !elevated) for (const e of s.edges) {
        if (e.rail || e.ped) continue; const nl = e.cars.length, fw = e.to === s.b ? 1 : -1, at = e.to === s.b ? s.len - 14 : 14, f = segFrame(s, at);
        for (let k2 = 0; k2 < nl; k2++) {
          const po = edgePos(e, clamp(e.to === s.b ? e.len - 14 : e.len - 14, 0, e.len), k2); if (!po) continue;
          const ttx = f.tx * fw, ttz = f.tz * fw, r = laneSideIdx(e, true) === k2 && nl > 1 ? 1 : laneSideIdx(e, false) === k2 && nl > 1 ? -1 : 0;
          flatRect(po.x, f.y + 0.24, po.z, 1.6, 0.12, ttx, ttz, [0.95, 0.95, 0.95]);
          const hx = po.x + ttx * 1.6, hz = po.z + ttz * 1.6, sx = -ttz, sz = ttx, hy = f.y + 0.24;
          const dir = r ? [ttx * 0.3 + sx * r * lh, ttz * 0.3 + sz * r * lh] : [ttx, ttz], dln = Math.hypot(dir[0], dir[1]); const dx = dir[0] / dln, dz = dir[1] / dln;
          quad([hx - dz * 0.6, hy, hz + dx * 0.6], [hx + dx * 1.2, hy, hz + dz * 1.2], [hx + dz * 0.6, hy, hz - dx * 0.6], [hx, hy, hz], [0.95, 0.95, 0.95], true);
        }
      }
      // --- 97 auto parcheggiate (qualcuna storta) ---
      if (rt.park && !elevated && rt.zone && SET.parkedCars !== false) for (const sd of twoSide) {
        const a0 = rt.two ? inner + (sd > 0 ? rt.lanes : lb) * LW : rt.lanes * LW / 2, a1 = hw - sw, o = sd * (a0 + a1) / 2;
        if (a1 - a0 < 1.6) continue;
        for (let u = 3; u < dl; u += 6.4) {
          const along = s.cum[i] + u; if (along < 14 || along > s.len - 14) continue;
          const r1 = h01(s.id * 7 + sd, Math.round(along)); if (r1 > (S.parkFull ?? 0.6)) continue;
          const crooked = SET.crookedPark !== false && h01(Math.round(along), s.id) < 0.3, ang = crooked ? (h01(s.id, Math.round(along * 3)) - 0.5) * 0.5 : 0, off = crooked ? (h01(Math.round(along * 5), s.id) - 0.5) * 0.7 : 0;
          const ca = Math.cos(ang), sa = Math.sin(ang), ctx = tx * ca - tz * sa, ctz = tx * sa + tz * ca;
          const cx = p.x + tx * u + nx * (o + off), cz = p.z + tz * u + nz * (o + off), cy = lerp(y, y2, u / dl) - 0.1, col = PARK_COLS[(r1 * 997 | 0) % PARK_COLS.length];
          box(cx, cy + 0.25, 0.75, cz, 2.1, 0.85, ctx, ctz, col); box(cx - ctx * 0.2, cy + 1, 0.55, cz - ctz * 0.2, 1.1, 0.78, ctx, ctz, [0.25, 0.3, 0.36], col);
        }
      }
    }
    // --- 69 strisce pedonali larghe, colorate o in diagonale ---
    if (mx.cross !== 'std' && rt.zone && !rt.gravel && !rt.pedst && !s.elev) for (const [nid, along, dir] of [[s.a, 0, 1], [s.b, s.len, -1]]) {
      const nd = nodes.get(nid); if (!nd || nd.segs.length < 3) continue;
      let r = 0; for (const id of nd.segs) { const q2 = segs.get(id); if (q2) r = Math.max(r, RT[q2.type].w / 2); }
      const at = along + dir * (r + 2.2); if (at < 0 || at > s.len) continue; const f = segFrame(s, at), w2 = hw - 0.4, yy = f.y + 0.23;
      if (mx.cross === 'wide') for (const ex of [-1, 1]) for (let k = -w2 + 0.4; k < w2; k += 1.2) flatRect(f.x + f.nx * k + f.tx * dir * ex * 2.4 * 1, yy, f.z + f.nz * k + f.tz * dir * ex * 2.4, 0.9, 0.28, f.tx, f.tz, [0.93, 0.93, 0.9]);
      if (mx.cross === 'color') flatRect(f.x, yy - 0.01, f.z, 2.2, w2, f.tx, f.tz, [0.68, 0.2, 0.17]);
      if (mx.cross === 'diag' && dir === 1) { // attraversamento diagonale: una X dentro l'incrocio
        for (const sg of [-1, 1]) { const dx2 = f.tx * Math.SQRT1_2 + f.nx * Math.SQRT1_2 * sg, dz2 = f.tz * Math.SQRT1_2 + f.nz * Math.SQRT1_2 * sg; for (let k = -r; k < r; k += 1.4) flatRect(nd.x + dx2 * k, nd.y + 0.26, nd.z + dz2 * k, 0.28, 1.4, dx2, dz2, [0.93, 0.93, 0.9]); }
      }
    }
  }
  const out = [];
  const mk = (pp, nn, cc, mat, ro) => { if (!pp.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); if (ro) m.renderOrder = ro; out.push(m); };
  mk(P, N, C, decoMat); mk(FP, FN, FC, decoFlatMat, 2);
  return out;
}
{
  const _rbc = rebuildRoadChunk;
  rebuildRoadChunk = function (c) {
    _rbc(c);
    const list = chunkMeshes.get(c); if (!list) return;
    try { for (const m of roadDeco(c)) { scene.add(m); list.push(m); } } catch (e) { console.error('roadDeco', e); }
  };
}

// ---------- 9/195/69/134/44: pannello della strada ----------
const MX_OPTS = {
  curb: [() => L('Marciapiede', 'Sidewalk'), { std: () => L('Normale', 'Standard'), stone: () => L('Pietra', 'Stone'), green: () => L('Aiuola', 'Grass strip'), redwhite: () => L('Bordo rosso-bianco', 'Red-white kerb') }],
  deco: [() => L('Bordo strada', 'Roadside'), { none: () => L('Niente', 'None'), rail: () => L('Guard rail', 'Guard rail'), bollard: () => L('Paletti', 'Bollards'), flowers: () => L('Fioriere', 'Planters'), hedge: () => L('Siepe', 'Hedge'), oldlamp: () => L('Lampioni antichi', 'Old lamps') }],
  cross: [() => L('Strisce pedonali', 'Crosswalks'), { std: () => L('Normali', 'Standard'), wide: () => L('Larghe', 'Wide'), color: () => L('Colorate', 'Coloured'), diag: () => L('In diagonale', 'Diagonal') }],
  line: [() => L('Linea di mezzo', 'Centre line'), { white: () => L('Normale', 'Standard'), yellow: () => L('Gialla', 'Yellow') }],
};
function mxSelects(cur, act) {
  let h = '';
  for (const k in MX_OPTS) { const [nm, o] = MX_OPTS[k]; h += `<span>${nm()}:</span><select onchange="${act}'${k}',this.value)">` + Object.keys(o).map(v => `<option value="${v}" ${cur[k] === v ? 'selected' : ''}>${o[v]()}</option>`).join('') + '</select>'; }
  h += `<label style="white-space:nowrap"><input type="checkbox" ${cur.bike ? 'checked' : ''} onchange="${act}'bike',this.checked)"> 🚲 ${L('Pista ciclabile', 'Bike lane')}</label>`;
  h += `<label style="white-space:nowrap" title="${L('Le auto si mettono sempre nella corsia della freccia (anche nelle rotonde)', 'Cars always use the lane of their arrow (roundabouts too)')}"><input type="checkbox" ${cur.arrows ? 'checked' : ''} onchange="${act}'arrows',this.checked)"> ⬆️ ${L('Frecce sulle corsie', 'Lane arrows')}</label>`;
  return h;
}
function segMxSet(id, k, v) { const s = segs.get(id); if (!s) return; if (k === 'bike' || k === 'arrows') v = !!v; mxSet(s, k, v); flushRoads(); refreshPanels(); }
function stairStyleHTML(cur, act) { return `<span>${L('Stile', 'Style')}:</span><select onchange="${act}'st',this.value)">` + Object.keys(STAIR_ST).map(k => `<option value="${k}" ${cur === k ? 'selected' : ''}>${STAIR_ST[k][0]()}</option>`).join('') + '</select>'; }
{
  const _seh = segExtraHTML;
  segExtraHTML = function (o) {
    let h = _seh(o);
    h += `<div class="sec">🎨 ${L('Aspetto della strada', 'Road look')}</div><div class="subopts" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${mxSelects(mxOf(o), 'segMxSet(' + o.id + ',')}</div>`;
    h += `<div style="margin-top:6px"><button onclick="setTool('sign','post');buildSub()">🪧 ${L('Metti un cartello qui', 'Add a sign here')}</button></div>`;
    return h;
  };
}
const TOOLMX = { ...MX_DEF };
function toolMxSet(k, v) { if (k === 'bike' || k === 'arrows') v = !!v; TOOLMX[k] = v; buildSub(); }
{
  const _roh = roadOptsHTML;
  roadOptsHTML = function () {
    let h = _roh();
    const rt = RT[TOOL.sub];
    if (rt && rt.stairs) h += stairStyleHTML(TOOLMX.st, 'toolMxSet(');
    else if (rt && !rt.ped && !rt.rail) h += `<details style="display:inline-block"><summary style="cursor:pointer">🎨 ${L('Aspetto', 'Look')}</summary><div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${mxSelects(TOOLMX, 'toolMxSet(')}</div></details>`;
    h += `<span>🚦 ${L('Semafori', 'Signals')}:</span><select onchange="S.lstyle=this.value;buildSub()">` + Object.keys(LSTYLES).map(k => `<option value="${k}" ${(S.lstyle || 'ball') === k ? 'selected' : ''}>${LSTYLES[k]()}</option>`).join('') + '</select>';
    return h;
  };
}
// le strade nuove prendono l'aspetto scelto
{
  const _tc = toolClick;
  toolClick = function (e) {
    const before = nextSegId, kind = TOOL.kind, type = TOOL.sub;
    _tc(e);
    if (kind === 'road' && RT[type] && Object.keys(MX_DEF).some(k => TOOLMX[k] !== MX_DEF[k])) {
      for (const s of segs.values()) if (s.id >= before && s.type === type) { s.mx = { ...TOOLMX }; roadDirty.add(s.chunk); }
      flushRoads();
    }
  };
}

// ---------- 22 + 195: cartelli stradali e portali ----------
const SIGNS = { list: [], group: new THREE.Group(), forS: null };
scene.add(SIGNS.group);
const SIGN_KINDS = {
  post: () => L('Cartello su palo', 'Sign on a post'),
  gantry: () => L('Portale sopra la strada', 'Overhead gantry'),
  arrow: () => L('Freccia di direzione', 'Direction arrow'),
  name: () => L('Nome della via', 'Street name plate'),
};
const SIGN_COLS = { blue: ['#1f4fa8', '#ffffff'], green: ['#1d7a3a', '#ffffff'], white: ['#f2f2ee', '#111111'], brown: ['#7a4a22', '#ffffff'], yellow: ['#f2c21c', '#111111'] };
const SIGN_COL_N = { blue: () => L('Blu', 'Blue'), green: () => L('Verde', 'Green'), white: () => L('Bianco', 'White'), brown: () => L('Marrone (turistico)', 'Brown (tourist)'), yellow: () => L('Giallo (lavori)', 'Yellow (works)') };
const signTexCache = new Map();
function signTex(txt, col, arrow) {
  const key = txt + '|' + col + '|' + arrow; if (signTexCache.has(key)) return signTexCache.get(key);
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'), [bg, fg] = SIGN_COLS[col] || SIGN_COLS.blue;
  g.fillStyle = bg; g.fillRect(0, 0, 256, 96); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(6, 6, 244, 84);
  g.fillStyle = fg; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = String(txt || '').slice(0, 40).split('|');
  lines.forEach((l, i) => g.fillText(l.trim(), arrow ? 110 : 128, 48 + (i - (lines.length - 1) / 2) * 34, arrow ? 190 : 230));
  if (arrow) { g.beginPath(); g.moveTo(212, 30); g.lineTo(244, 48); g.lineTo(212, 66); g.closePath(); g.fill(); g.fillRect(196, 42, 18, 12); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; signTexCache.set(key, t); return t;
}
const signPoleMat = new THREE.MeshLambertMaterial({ color: 0x8a8d92 });
function signMesh(sg) {
  const grp = new THREE.Group(); grp.position.set(sg.x, sg.y, sg.z); grp.rotation.y = -sg.yaw;
  const pole = (x, h) => { const m = new THREE.Mesh(boxGeo, signPoleMat); m.scale.set(0.18, h, 0.18); m.position.set(x, 0, 0); grp.add(m); };
  const panel = (x, y, w, h) => { const mat = new THREE.MeshLambertMaterial({ map: signTex(sg.txt, sg.col, sg.kind === 'arrow') }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, 0.12); grp.add(m); const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signPoleMat); b.position.set(x, y, 0.1); b.rotation.y = Math.PI; grp.add(b); };
  if (sg.kind === 'gantry') { const w = sg.w || 12; pole(-w / 2, 7.5); pole(w / 2, 7.5); const beam = new THREE.Mesh(boxGeo, signPoleMat); beam.scale.set(w, 0.5, 0.4); beam.position.set(0, 7, 0); grp.add(beam); panel(0, 6, Math.min(w - 1, 9), 2.6); }
  else if (sg.kind === 'name') { pole(0, 3); panel(0, 3, 2.4, 0.7); }
  else { pole(0, 3.2); panel(0, 2.8, 2.6, 1.0); }
  return grp;
}
function signsRebuild() {
  while (SIGNS.group.children.length) SIGNS.group.remove(SIGNS.group.children[0]);
  for (const sg of SIGNS.list) SIGNS.group.add(signMesh(sg));
  SIGNS.forS = S;
}
function signPlaceAt(g, preview) {
  const f0 = findNearSeg(g.x, g.z, 25, q => !RT[q.type].rail && !RT[q.type].ped); if (!f0) return null;
  const s = f0.seg, fr = segFrame(s, clamp(f0.along, 0, s.len)), hw = RT[s.type].w / 2;
  const side = (g.x - fr.x) * fr.nx + (g.z - fr.z) * fr.nz >= 0 ? 1 : -1;
  const kind = TOOL.sub || 'post';
  if (kind === 'gantry') return { kind, x: fr.x, y: fr.y, z: fr.z, yaw: Math.atan2(fr.nz, fr.nx), w: RT[s.type].w + 1.5, txt: TOOL.signTxt || L('Centro', 'Centre'), col: TOOL.signCol || 'green' };
  return { kind, x: fr.x + fr.nx * side * (hw + 0.6), y: fr.y, z: fr.z + fr.nz * side * (hw + 0.6), yaw: Math.atan2(fr.nz, fr.nx) + (side < 0 ? Math.PI : 0), txt: TOOL.signTxt || (kind === 'name' ? (s.nm || (typeof streetNameOf === 'function' ? streetNameOf(s) : '') || L('Via', 'Street')) : L('Centro', 'Centre')), col: TOOL.signCol || (kind === 'name' ? 'white' : 'blue') };
}
function signsHTML() {
  let h = `<div class="subopts"><span>${L('Tipo', 'Kind')}:</span>`;
  for (const k in SIGN_KINDS) h += `<button class="${TOOL.sub === k ? 'on' : ''}" onclick="TOOL.sub='${k}';buildSub()">${SIGN_KINDS[k]()}</button>`;
  h += `<span>${L('Scritta', 'Text')}:</span><input id="signTxt" maxlength="40" style="width:140px" placeholder="${L('Centro | Stazione', 'Centre | Station')}" value="${(TOOL.signTxt || '').replace(/"/g, '&quot;')}" oninput="TOOL.signTxt=this.value">`;
  h += `<span>${L('Colore', 'Colour')}:</span><select onchange="TOOL.signCol=this.value">` + Object.keys(SIGN_COLS).map(k => `<option value="${k}" ${(TOOL.signCol || '') === k ? 'selected' : ''}>${SIGN_COL_N[k]()}</option>`).join('') + '</select>';
  h += `<span style="color:var(--mute)">${L('Usa | per andare a capo. Clic destro su un cartello per toglierlo', 'Use | for a new line. Right-click a sign to remove it')}</span></div>`;
  return h;
}
{
  const _ug = updateGhost;
  updateGhost = function () {
    if (S && SIGNS.forS !== S) { SIGNS.list = S.signs || []; signsRebuild(); }
    if (TOOL.kind === 'sign') {
      clearGhost(); const g = mouse.g; if (!g) return;
      const sg = signPlaceAt(g); if (!sg) { tipShow(L('Avvicinati a una strada', 'Move closer to a road')); return; }
      const m = signMesh(sg); m.traverse(o => { if (o.material) o.material = ghostMatOk; }); ghost.add(m);
      tipShow(`<b>${SIGN_KINDS[sg.kind]()}</b> · ${fmtMoney(sg.kind === 'gantry' ? 6000 : 400)}`); return;
    }
    _ug();
    if (TOOL.kind === 'road' && TOOL.p0 && mouse.g) bridgePreview(TOOL.p0, mouse.g);
  };
  const _tc2 = toolClick;
  toolClick = function (e) {
    if (TOOL.kind === 'sign') {
      const g = groundAt(e.clientX, e.clientY); if (!g) return; const sg = signPlaceAt(g); if (!sg) return;
      if (!isOwned(sg.x, sg.z)) { toast(L('Fuori dal tuo territorio', 'Outside your land'), 2000); return; }
      if (!spend(sg.kind === 'gantry' ? 6000 : 400)) return;
      SIGNS.list.push(sg); S.signs = SIGNS.list; SIGNS.group.add(signMesh(sg)); toast('🪧 ' + SIGN_KINDS[sg.kind]() + ' ✓', 1500); return;
    }
    _tc2(e);
  };
  addEventListener('contextmenu', ev => {
    if (TOOL.kind !== 'sign' || !mouse.g) return;
    let bi = -1, bd = 12; SIGNS.list.forEach((sg, i) => { const d = Math.hypot(sg.x - mouse.g.x, sg.z - mouse.g.z); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0) { SIGNS.list.splice(bi, 1); signsRebuild(); toast(L('Cartello tolto', 'Sign removed'), 1200); }
  });
  const _bs = buildSub;
  buildSub = function () {
    _bs();
    if (openCat === 'roads') {
      const el = $('sub'); if (!el) return;
      const div = document.createElement('div'); div.style.display = 'contents';
      div.innerHTML = `<button class="item ${TOOL.kind === 'sign' ? 'on' : ''}" onclick="setTool('sign','${TOOL.kind === 'sign' ? TOOL.sub : 'post'}');buildSub()"><span class="n">🪧 ${L('Cartelli e portali', 'Signs & gantries')}</span><span class="l">${L('Scrivi tu il testo', 'Write your own text')}</span></button>` + (TOOL.kind === 'sign' ? signsHTML() : '');
      const first = el.querySelector('.subopts'); if (first) el.insertBefore(div, first); else el.appendChild(div);
    }
  };
}

// ---------- 7: anteprima del ponte mentre disegni ----------
function bridgePreview(p0, g) {
  const dx = g.x - p0.x, dz = g.z - p0.z, l = Math.hypot(dx, dz); if (l < 30) return;
  let a = -1, b = -1; for (let k = 0; k <= 40; k++) { const x = p0.x + dx * k / 40, z = p0.z + dz * k / 40; if (getH(x, z) < WATER + 0.5 || isWater(x, z)) { if (a < 0) a = k; b = k; } }
  if (a < 0 || b - a < 2) return;
  const st = TOOL.bst || 'beam', u0 = a / 40, u1 = b / 40, um = (u0 + u1) / 2, span = (u1 - u0) * l, tx = dx / l, tz = dz / l, yaw = Math.atan2(tx, tz);
  const at = u => ({ x: p0.x + dx * u, z: p0.z + dz * u }), y0 = Math.max(WATER, 0) + 7;
  const bx = (u, h, w, d, yb = y0) => { const q = at(u), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), ghostMatOk); m.position.set(q.x, yb, q.z); m.rotation.y = yaw; ghost.add(m); };
  const w = RT[TOOL.sub]?.w || 12;
  if (st === 'susp' || st === 'cable') { for (const u of st === 'susp' ? [u0 + (u1 - u0) * 0.2, u1 - (u1 - u0) * 0.2] : [um]) bx(u, Math.min(90, span * 0.3 + 25), w + 2, 3); }
  else if (st === 'arch') { for (let k = 0; k <= 10; k++) { const u = u0 + (u1 - u0) * k / 10; bx(u, 1.5, w, 2, y0 + Math.sin(Math.PI * k / 10) * Math.min(40, span * 0.18)); } }
  else if (st === 'double') bx(um, 7, w, span * 0.95, y0 - 8);
  else if (st === 'wood') bx(um, 1, w + 1, span * 0.95, y0 + 6);
  else if (st === 'draw') { bx(um - 0.03, 1, w, span * 0.25, y0 + 8); bx(um + 0.03, 1, w, span * 0.25, y0 + 8); }
  else for (let k = 1; k < 6; k++) bx(u0 + (u1 - u0) * k / 6, 7, 3, 3, Math.max(WATER, 0) - 1);
  const el = $('tip'); if (el && el.style.display === 'block') el.innerHTML += ` · 🌉 ${BRIDGES[st]()} ${Math.round(span)} m`;
}

// ---------- 121: stili di semaforo ----------
const LSTYLES = {
  ball: () => L('Classico (luci sole)', 'Classic (lights only)'),
  post: () => L('Su palo', 'On a post'),
  mast: () => L('A braccio sopra la strada', 'Mast arm over the road'),
  wire: () => L('Appeso a un filo', 'Hanging on a span wire'),
  horiz: () => L('Orizzontale', 'Horizontal'),
  double: () => L('Doppio (palo + braccio)', 'Double (post + arm)'),
};
const lPole = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0x5d6166 }), 9000);
const lHouse = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0x2a2c30 }), 9000);
{
  const _dl = drawLights;
  const yawOf = (dx, dz) => Math.atan2(dx, dz);
  drawLights = function () {
    const st = S?.lstyle || 'ball';
    if (st === 'ball') { if (lPole.mesh.count || lHouse.mesh.count) { lPole.mesh.count = 0; lHouse.mesh.count = 0; lPole.dirty(); lHouse.dirty(); } return _dl(); }
    let n = 0, np = 0, nh = 0;
    const pole = (x, y, z, h, yaw, sx = 0.22, sz = 0.22) => { if (np < lPole.max) setInst(lPole.mesh, np++, x, y, z, yaw, sx, h, sz); };
    const house = (x, y, z, yaw, w, h, d) => { if (nh < lHouse.max) setInst(lHouse.mesh, nh++, x, y, z, yaw, w, h, d); };
    const lamp = (x, y, z, g) => { if (n >= lightPool.max) return; setInst(lightPool.mesh, n, x, y, z, 0, 0.32, 0.32, 0.32); setInstCol(lightPool.mesh, n, g ? 0.1 : 1, g ? 1 : 0.1, 0.1); n++; };
    if (cam.dist < 1500) for (const nd of nodes.values()) {
      if ((!nd.light && !nd.stop) || Math.abs(nd.x - cam.tx) > 1500 || Math.abs(nd.z - cam.tz) > 1500) continue;
      for (const sid of nd.segs) {
        const s = segs.get(sid); if (!s) continue;
        for (const e of s.edges) {
          if (e.to !== nd.id || e.rail || e.ped) continue;
          const p = e.pts[e.pts.length - 3] || e.pts[0], q = e.pts[e.pts.length - 1]; const dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1, rx = -dz / l, rz = dx / l, hw = RT[s.type].w / 2, yw = yawOf(dx, dz);
          const kx = p.x + rx * hw, kz = p.z + rz * hw;
          if (nd.stop) { pole(kx, p.y, kz, 2.4, yw, 0.1, 0.1); if (n < lightPool.max) { setInst(lightPool.mesh, n, kx, p.y + 2.6, kz, 0, 0.7, 0.7, 0.18); setInstCol(lightPool.mesh, n, 0.9, 0.05, 0.05); n++; } continue; }
          const g = lightGreen(nd, e);
          if (st === 'post' || st === 'double') { pole(kx, p.y, kz, 3.4, yw); house(kx, p.y + 3.4, kz, yw, 0.45, 1.3, 0.35); lamp(kx - dx / l * 0.2, p.y + (g ? 3.65 : 4.45), kz - dz / l * 0.2, g); }
          if (st === 'mast' || st === 'double' || st === 'horiz') {
            const reach = Math.min(hw * 0.75, 9), ax = kx - rx * reach, az = kz - rz * reach;
            pole(kx, p.y, kz, 6.4, yw, 0.3, 0.3); pole((kx + ax) / 2, p.y + 6.1, (kz + az) / 2, 0.22, yw + Math.PI / 2, reach, 0.18);
            if (st === 'horiz') { house(ax, p.y + 5.3, az, yw + Math.PI / 2, 1.4, 0.5, 0.35); lamp(ax + rx * (g ? 0.45 : -0.45), p.y + 5.55, az + rz * (g ? 0.45 : -0.45), g); }
            else { house(ax, p.y + 4.7, az, yw, 0.45, 1.3, 0.35); lamp(ax - dx / l * 0.2, p.y + (g ? 4.95 : 5.75), az - dz / l * 0.2, g); }
          }
          if (st === 'wire') {
            const ax = p.x - rx * hw * 0.1, az = p.z - rz * hw * 0.1;
            pole(kx, p.y, kz, 7, yw, 0.25, 0.25); pole((kx + ax) / 2, p.y + 6.8, (kz + az) / 2, 0.05, yw + Math.PI / 2, Math.hypot(kx - ax, kz - az), 0.05);
            house(ax, p.y + 5.4, az, yw, 0.45, 1.3, 0.35); lamp(ax - dx / l * 0.2, p.y + (g ? 5.65 : 6.45), az - dz / l * 0.2, g);
          }
        }
      }
    }
    lightPool.mesh.count = n; lightPool.dirty(); lPole.mesh.count = np; lPole.dirty(); lHouse.mesh.count = nh; lHouse.dirty();
  };
}

// ---------- 29: neve che si accumula, tracce delle gomme, scioglimento lento ----------
const snowTrack = new InstPool(boxGeo, new THREE.MeshBasicMaterial({ color: 0x6d7076, transparent: true, opacity: 0.55, depthWrite: false }), 5000);
snowTrack.mesh.renderOrder = 3;
const ROAD_TINT = new THREE.Color(1, 1, 1);
let snowT = 0;
{
  const _us = updateSky;
  updateSky = function (...a) {
    const r = _us.apply(this, a);
    if (typeof S === 'undefined' || !S) return r;
    const now = performance.now() / 1000, dt = Math.min(1, now - (snowT || now)); snowT = now;
    const plough = maintCovers(), snowing = WEATHER.kind === 'snow' && WEATHER.snow > 0.3;
    let rs = WEATHER.roadSnow ?? 0;
    if (snowing && !plough) rs += 0.0025 * dt * 60 * (typeof gameSpeed !== 'undefined' ? Math.max(1, gameSpeed) : 1) / 4;
    else if (plough) rs -= 0.01 * dt * 60;
    else if (WEATHER.snow < 0.4 || WEATHER.temp > 2) rs -= 0.0004 * dt * 60; // si scioglie piano piano
    rs = clamp(rs, 0, WEATHER.snow > 0.2 ? 1 : rs);
    WEATHER.roadSnow = rs;
    WEATHER.snowRoad = rs > 0.45;
    const k = SET.noSnow ? 0 : Math.max(WEATHER.snow * 0.18, rs * 0.95);
    if (Math.abs((updateSky.rk2 ?? -1) - k) > 0.01 || updateSky.rk !== updateSky.rk3) { updateSky.rk2 = k; updateSky.rk3 = updateSky.rk; for (const t in roadMats) roadMats[t].color.copy(ROAD_TINT).lerp(_snowCol, k); }
    return r;
  };
}
function drawSnowTracks() {
  const rs = SET.noSnow ? 0 : (WEATHER.roadSnow || 0);
  let n = 0;
  if (rs > 0.15 && cam.dist < 1300) for (const e of activeEdges) {
    if (e.rail || e.ped || n >= snowTrack.max - 40) continue;
    if (!e.pts.some((m, i) => i % 4 === 0 && Math.abs(m.x - cam.tx) < 900 && Math.abs(m.z - cam.tz) < 900)) continue;
    for (let k = 0; k < e.cars.length; k++) for (let i = 0; i < e.pts.length - 1 && n < snowTrack.max - 2; i++) {
      const a = e.pts[i], b = e.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); if (l < 0.5) continue;
      const off = laneOffset(e, k), nx = -dz / l, nz = dx / l, yw = Math.atan2(dx, dz);
      for (const w of [-0.8, 0.8]) setInst(snowTrack.mesh, n++, (a.x + b.x) / 2 + nx * (off + w) - nx * 0, (a.y + b.y) / 2 + 0.2, (a.z + b.z) / 2 + nz * (off + w), yw, 0.35, 0.03, l);
    }
  }
  snowTrack.mesh.count = n; snowTrack.dirty();
}
{
  const _dl2 = drawLights;
  let lastT = 0;
  drawLights = function () { _dl2(); const t = performance.now(); if (t - lastT > 700) { lastT = t; drawSnowTracks(); } };
}

// ---------- 21: passi carrai davanti alle case · 6: edifici deformati ----------
const DEFS = {
  none: () => L('Normale', 'Normal'), lean: () => L('Inclinato', 'Leaning'), twist: () => L('Ritorto', 'Twisted'), taper: () => L('Rastremato', 'Tapered'), odd: () => L('Lotto strano (un po\' di tutto)', 'Odd lot (a bit of each)'),
};
const DEF_VAL = { lean: { ln: 0.08 }, twist: { tw: 0.5 }, taper: { tp: 0.35 }, odd: { ln: 0.04, tw: 0.25, tp: 0.15 } };
function applyDeform(b) {
  const d = DEF_VAL[b.def]; if (!d) return;
  let H = 1; for (const h of b.parts) if (h.geo) H = Math.max(H, h.geo[1] + h.geo[5] - b.y);
  const ldx = Math.cos(b.ang), ldz = -Math.sin(b.ang);
  for (const h of b.parts) {
    const P = POOLS[h.pool]; if (!P || !h.geo || h.i < 0) continue;
    let [x, y, z, yaw, sx, sy, sz] = h.geo; const t0 = (y - b.y) / H, tm = (y + sy / 2 - b.y) / H;
    let rx = x - b.x, rz = z - b.z;
    if (d.tw) { const a = d.tw * tm, c = Math.cos(a), s = Math.sin(a); [rx, rz] = [rx * c + rz * s, -rx * s + rz * c]; yaw += a; }
    if (d.tp) { const k = 1 - d.tp * tm; rx *= k; rz *= k; sx *= k; sz *= k; }
    const lo = (d.ln || 0) * (y - b.y);
    setInst(P.mesh, h.i, b.x + rx + ldx * lo, y, b.z + rz + ldz * lo, yaw, sx, sy, sz);
    if (d.ln) { const e = P.mesh.instanceMatrix.array, o = h.i * 16; e[o + 4] = ldx * d.ln * sy; e[o + 6] = ldz * d.ln * sy; }
    P.dirty(); void t0;
  }
}
{
  const _db = drawBuilding;
  drawBuilding = function (b) {
    _db(b);
    if (b.ruin || b.cons > 0) return;
    if (b.def) applyDeform(b);
    // passo carraio: il marciapiede si abbassa davanti al lotto
    const s = segs.get(b.seg); const rt = s && RT[s.type];
    if (rt && rt.zone && (rt.side || 0) > 1 && b.parts.length && SET.driveways !== false) {
      const prev = curRef; curRef = b;
      const fx = Math.sin(b.ang), fz = Math.cos(b.ang), off = -(b.cd * CELL) / 2 - rt.side / 2 + 0.3;
      const ww = Math.min(4, b.cw * CELL * 0.4);
      addPart(b.parts, 'plain', b.x + fx * off, b.y + 0.02, b.z + fz * off, b.ang, ww, 0.2, rt.side + 0.6, 0x8c8c88);
      curRef = prev;
    }
  };
  const _bd = bldData;
  bldData = function (b) { const d = _bd(b); if (b.def) d.def = b.def; return d; };
  const _cb = createBuilding;
  createBuilding = function (zone, cs, data) { const b = _cb(zone, cs, data); if (b && data && data.def) { b.def = data.def; drawBuilding(b); } return b; };
  const _beh = bldExtraHTML;
  bldExtraHTML = function (o) {
    let h = _beh(o);
    h += `<div class="sec">🔀 ${L('Forma dell\'edificio', 'Building shape')}</div><div style="display:flex;gap:4px;flex-wrap:wrap">` + Object.keys(DEFS).map(k => `<button class="${(o.def || 'none') === k ? 'on' : ''}" onclick="setBldDef(${o.id},'${k}')">${DEFS[k]()}</button>`).join('') + '</div>';
    return h;
  };
}
function setBldDef(id, k) { const b = buildings.get(id); if (!b) return; b.def = k === 'none' ? null : k; drawBuilding(b); refreshPanels(); }

if (typeof __cm !== 'undefined') Object.assign(__cm, { bestLaneV, ichgPlan, buildInterchange, SIGNS, signsRebuild, roadDeco, applyDeform, mxSet, segMxSet, toolMxSet, LSTYLES, drawLights });
