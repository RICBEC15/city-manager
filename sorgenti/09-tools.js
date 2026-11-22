// =====================================================================
//  Strumenti: costruire strade, zone, servizi, demolire, linee, terreno...
// =====================================================================
const TOOL = { kind: null, sub: null, mode: 'straight', elev: 0, p0: null, cp: null, rot: 0, brush: 'small', line: null, dist: 1, tmode: 'raise', pl: null };
const undoStack = [];
const ghost = new THREE.Group(); scene.add(ghost);
const ghostMatOk = new THREE.MeshBasicMaterial({ color: 0x4fe0a0, transparent: true, opacity: 0.45, depthWrite: false });
const ghostMatBad = new THREE.MeshBasicMaterial({ color: 0xff5040, transparent: true, opacity: 0.45, depthWrite: false });
const ringMat = new THREE.MeshBasicMaterial({ color: 0x80c8ff, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide });
let mouse = { x: 0, y: 0, g: null, down: false, btn: -1, dragged: false, sx: 0, sy: 0 };
function clearGhost() { while (ghost.children.length) { const c = ghost.children.pop(); c.geometry?.dispose(); } }
function spend(cost) { if (S.opts.unlimited) return true; if (S.money < cost) { toast(L('Soldi insufficienti! Servono ', 'Not enough money! You need ') + fmtMoney(cost), 3000); return false; } S.money -= cost; return true; }
function setTool(kind, sub) {
  if (TOOL.moving) { const m = TOOL.moving; TOOL.moving = null; placeSvc({ ...m.old }, m); } // annullato: torna dov'era
  TOOL.kind = kind; TOOL.sub = sub; TOOL.p0 = null; TOOL.cp = null; TOOL.pl = null; TOOL.poly = null;
  if (kind !== 'line') TOOL.line = null;
  if (kind === 'road' && RT[sub]?.ped && TOOL.elev === -1) TOOL.elev = 0;
  showEmptyCells = kind === 'zone'; cellsDirty = true;
  terrU.uTileShow.value = kind === 'buy' ? 0.9 : 0.35;
  terrU.uContour.value = kind === 'terrain' || SET.contour ? 1 : 0;
  if (kind === 'buy' && !TOOL.camB) { TOOL.camB = { pitch: cam.pitch, dist: cam.dist, tx: cam.tx, tz: cam.tz }; cam.pitch = 1.48; cam.dist = Math.max(cam.dist, 11000); cam.tx = cam.tz = 0; }
  else if (kind !== 'buy' && TOOL.camB) { Object.assign(cam, TOOL.camB); TOOL.camB = null; if (sideOpen === 'tile') closeSide(); }
  clearGhost(); redrawLines(); tipHide();
  if (kind === 'svc' && SV[sub]?.spec) showInfo('res', true);
  else if (kind === 'svc' && SV[sub]?.r) showInfo(SV[sub].eff === 'death' ? 'health' : SV[sub].cat === 'parks' ? 'lv' : null, true);
}
// ---------- aggancio per le strade ----------
function snapRoad(x, z, type) {
  const isRail = RT[type].rail;
  const f = s => isRail ? RT[s.type].rail : !RT[s.type].rail;
  const n = findNearNode(x, z, 14, nd => nd.segs.some(id => { const s = segs.get(id); return s && f(s); }));
  if (n) return { x: n.x, z: n.z, node: n };
  const s = findNearSeg(x, z, 3, f);
  if (s && s.d < RT[s.seg.type].w / 2 + 3) return { x: s.x, z: s.z, seg: s.seg, t: s.t };
  return { x, z };
}
function snapAngle(p0, x, z) {
  if (TOOL.nosnap) return { x, z };
  const dx = x - p0.x, dz = z - p0.z, L0 = Math.hypot(dx, dz); if (L0 < 1) return { x, z };
  let base = 0;
  if (p0.node && p0.node.segs.length) { const s = segs.get(p0.node.segs[0]); if (s) { const a = s.pts[0], b = s.pts[s.pts.length - 1]; base = Math.atan2(b.z - a.z, b.x - a.x); } }
  const a = Math.atan2(dz, dx);
  for (const b of [base, 0]) for (let k = -8; k <= 8; k++) { const t = b + k * Math.PI / 4; let d = a - t; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 0.06) { const len = Math.round(L0 / 8) * 8; return { x: p0.x + Math.cos(t) * len, z: p0.z + Math.sin(t) * len, snapped: true }; } }
  return { x, z };
}
function curvePts(p0, cp, p1, n = 24) { const out = []; const cx = cp ? cp.x : (p0.x + p1.x) / 2, cz = cp ? cp.z : (p0.z + p1.z) / 2; for (let i = 0; i <= n; i++) { const [x, z] = bez(p0.x, p0.z, cx, cz, p1.x, p1.z, i / n); out.push({ x, z }); } return out; }
function segInter(a, b, c, d) { const r1 = b.x - a.x, r2 = b.z - a.z, s1 = d.x - c.x, s2 = d.z - c.z, den = r1 * s2 - r2 * s1; if (Math.abs(den) < 1e-9) return null; const t = ((c.x - a.x) * s2 - (c.z - a.z) * s1) / den, u = ((c.x - a.x) * r2 - (c.z - a.z) * r1) / den; if (t < 0 || t > 1 || u < 0 || u > 1) return null; return { t, u, x: a.x + r1 * t, z: a.z + r2 * t }; }
function roadCost(type, len, elev, pts) { let c = len * RT[type].cost * (elev <= -2 ? 4 : elev ? 2.5 + Math.max(0, elev - 1) * 0.6 : 1) * (TOOL.bst && TOOL.bst !== 'beam' ? 1.3 : 1); let wet = 0; for (const p of pts) if (isWater(p.x, p.z)) wet++; c *= 1 + 2 * wet / pts.length; return Math.round(c); }
function planRoad(p0, p1, cp, type, elev) {
  const pts = curvePts(p0, cp, p1, 32); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  const plan = { pts, len, cost: roadCost(type, len, elev, pts), ok: true, why: '', cross: [] };
  if (len < 12) { plan.ok = false; plan.why = L('Troppo corta', 'Too short'); }
  if (len > 1500) { plan.ok = false; plan.why = L('Troppo lunga: massimo 1,5 km per volta', 'Too long: 1.5 km max at a time'); }
  for (const p of pts) if (!isOwned(p.x, p.z)) { plan.ok = false; plan.why = L('Fuori dal tuo territorio', 'Outside your land'); break; }
  for (const p of pts) if (svcAt(p.x, p.z)) { plan.ok = false; plan.why = L('Passa sopra un edificio di servizio', 'Crosses a service building'); break; }
  if (elev === -1 && pts.some(p => isWater(p.x, p.z))) { plan.ok = false; plan.why = L('Non si può scavare sotto l\'acqua', 'Cannot dig under water'); }
  if (cp) { const a1 = Math.atan2(cp.z - p0.z, cp.x - p0.x), a2 = Math.atan2(p1.z - cp.z, p1.x - cp.x); let d = Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1))); if (d > 2.3) { plan.ok = false; plan.why = L('Curva troppo stretta', 'Curve too tight'); } }
  // incroci con strade esistenti (solo se allo stesso livello)
  if (!elev) {
    const isRail = !!RT[type].rail;
    const seen = new Set(); for (const p of pts) for (const id of segsNear(p.x, p.z, 40)) seen.add(id);
    for (const id of seen) {
      const s = segs.get(id); if (!s || s.elev || (p0.seg === s && p1.seg === s)) continue;
      if (RT[s.type].ped !== RT[type].ped && (RT[s.type].ped || RT[type].ped)) continue;
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < s.pts.length - 1; j++) {
        const r = segInter(pts[i], pts[i + 1], s.pts[j], s.pts[j + 1]); if (!r) continue;
        const tNew = (i + r.t) / (pts.length - 1), tOld = (j + r.u) / (s.pts.length - 1);
        if (Math.hypot(r.x - p0.x, r.z - p0.z) < 12 || Math.hypot(r.x - p1.x, r.z - p1.z) < 12) continue;
        const y = lerp(s.pts[j].y, s.pts[j + 1].y, r.u); if (y - getH(r.x, r.z) > 4) continue; // ponte: si passa sotto
        if (plan.cross.some(c => Math.hypot(c.x - r.x, c.z - r.z) < 14)) continue;
        plan.cross.push({ seg: s, t: tNew, tOld, x: r.x, z: r.z });
      }
    }
    plan.cross.sort((a, b) => a.t - b.t);
  }
  return plan;
}
function resolveEnd(p, elev) {
  if (p.node && nodes.has(p.node.id)) return p.node;
  if (p.seg && segs.has(p.seg.id)) { const near = nearestOnSeg(p.seg, p.x, p.z); if (near.along < 6) return nodes.get(p.seg.a); if (near.along > p.seg.len - 6) return nodes.get(p.seg.b); return splitSeg(p.seg, near.t); }
  const n = findNearNode(p.x, p.z, 4); if (n) return n;
  return makeNode(p.x, p.z, elev);
}
function blossom(p0, cp, p1, t0, t1) { const cx = cp ? cp.x : (p0.x + p1.x) / 2, cz = cp ? cp.z : (p0.z + p1.z) / 2; return { x: p0.x * (1 - t0) * (1 - t1) + cx * ((1 - t0) * t1 + t0 * (1 - t1)) + p1.x * t0 * t1, z: p0.z * (1 - t0) * (1 - t1) + cz * ((1 - t0) * t1 + t0 * (1 - t1)) + p1.z * t0 * t1 }; }
function buildRoad(p0, p1, cp, type, elev, free) {
  const plan = planRoad(p0, p1, cp, type, elev);
  if (!plan.ok) { toast(plan.why, 2500); return null; }
  if (!free && !spend(plan.cost)) return null;
  if (!free) addXP(Math.max(1, Math.round(Math.hypot(p1.x - p0.x, p1.z - p0.z) / 20)), L('strada costruita', 'road built'));
  const made = [];
  const A = resolveEnd(p0, elev);
  // nodi agli incroci
  const cn = [];
  for (const c of plan.cross) {
    const s = segs.get(c.seg.id) ? c.seg : findNearSeg(c.x, c.z, 4)?.seg; if (!s) continue;
    const near = nearestOnSeg(s, c.x, c.z);
    let n; if (near.along < 8) n = nodes.get(s.a); else if (near.along > s.len - 8) n = nodes.get(s.b); else n = splitSeg(s, near.t);
    cn.push({ t: c.t, n });
  }
  const B = resolveEnd(p1, elev);
  const chain = [{ t: 0, n: A }, ...cn, { t: 1, n: B }];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i], b = chain[i + 1]; if (a.n === b.n) continue;
    if (a.n.segs.some(id => { const s = segs.get(id); return s && ((s.a === a.n.id && s.b === b.n.id) || (s.b === a.n.id && s.a === b.n.id)); })) continue;
    let c = null; if (cp) { c = blossom(p0, cp, p1, a.t, b.t); }
    const ns = addSeg(a.n, b.n, type, c ? c.x : null, c ? c.z : null, elev); if (TOOL.bst && TOOL.bst !== 'beam' && ns.pts.some(q => q.y - q.h > 4)) ns.bst = TOOL.bst; made.push(ns);
  }
  undoStack.push({ k: 'road', segs: made.map(s => s.id), cost: free ? 0 : plan.cost });
  if (undoStack.length > 30) undoStack.shift();
  return { last: B, made };
}
// ---------- svincoli già pronti (rombo e quadrifoglio) ----------
const ICHG = {
  diamond: { cost: 120000, ms: 4, n: () => L('Svincolo a rombo', 'Diamond interchange'), d: () => L('Clicca su un\'autostrada: strada che passa sopra e 4 rampe', 'Click a highway: a road over it and 4 ramps') },
  clover: { cost: 450000, ms: 5, n: () => L('Svincolo a quadrifoglio', 'Cloverleaf interchange'), d: () => L('Clicca su un\'autostrada: un\'altra autostrada sopra e 8 rampe', 'Click a highway: another highway over it and 8 ramps') },
};
function ichgPlan(kind, x, z) {
  const near = findNearSeg(x, z, 30, s => RT[s.type].hw && RT[s.type].two);
  if (!near) return { ok: false, why: L('Clicca su un\'autostrada a doppio senso', 'Click a two-way highway') };
  const s = near.seg, cl = kind === 'clover', U = cl ? 200 : 160, V = cl ? 200 : 130, E = cl ? 420 : 200;
  if (near.along < U + 20 || near.along > s.len - U - 20) return { ok: false, why: L('Tratto di autostrada troppo corto: allungalo o clicca più in mezzo', 'Highway stretch too short: click nearer its middle') };
  const f = segFrame(s, near.along), P = (u, v) => ({ x: f.x + f.tx * u + f.nx * v, z: f.z + f.tz * u + f.nz * v });
  const A1 = segFrame(s, near.along - U), A2 = segFrame(s, near.along + U);
  const plan = { ok: true, why: '', cost: ICHG[kind].cost, seg: s, along: near.along, f, P, U, V, E, A1, A2, curves: [] };
  const C1 = P(0, -V), C2 = P(0, V);
  plan.curves.push([P(0, -E), null, P(0, E)]);
  const quad = cl ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [];
  if (cl) for (const [su, sv] of quad) { const a = su < 0 ? A1 : A2, b = sv < 0 ? C1 : C2; plan.curves.push([a, P(su * U * 0.95, sv * V * 0.95), b], [b, P(su * U * 0.22, sv * V * 0.22), a]); }
  else plan.curves.push([A1, P(-U * 0.06, V * 0.2), C2], [C2, P(U * 0.06, V * 0.2), A2], [A2, P(U * 0.06, -V * 0.2), C1], [C1, P(-U * 0.06, -V * 0.2), A1]);
  for (const [a, c, b] of plan.curves) for (const p of curvePts(a, c, b, 16)) {
    if (!isOwned(p.x, p.z)) { plan.ok = false; plan.why = L('Fuori dal tuo territorio', 'Outside your land'); }
    else if (svcAt(p.x, p.z)) { plan.ok = false; plan.why = L('C\'è un edificio di servizio in mezzo', 'A service building is in the way'); }
    else if (isWater(p.x, p.z)) { plan.ok = false; plan.why = L('Non sull\'acqua', 'Not on water'); }
    if (!plan.ok) return plan;
  }
  return plan;
}
function buildInterchange(kind, x, z) {
  const pl = ichgPlan(kind, x, z);
  if (!pl.ok) { toast(pl.why, 2500); return; }
  if (!spend(pl.cost)) return;
  const cl = kind === 'clover', made = [], s = pl.seg;
  // due nodi sull'autostrada
  const t2 = nearestOnSeg(s, pl.A2.x, pl.A2.z).t; const N2 = splitSeg(s, t2);
  const near1 = findNearSeg(pl.A1.x, pl.A1.z, 6, q => q.type === s.type); const N1 = splitSeg(near1.seg, near1.t);
  const P = pl.P, ct = cl ? 'highway' : 'medium';
  const E1 = makeNode(P(0, -pl.E).x, P(0, -pl.E).z), C1 = makeNode(P(0, -pl.V).x, P(0, -pl.V).z), C2 = makeNode(P(0, pl.V).x, P(0, pl.V).z), E2 = makeNode(P(0, pl.E).x, P(0, pl.E).z);
  made.push(addSeg(E1, C1, ct), addSeg(C1, C2, ct, null, null, 1), addSeg(C2, E2, ct));
  const ramp = (a, c, b) => made.push(addSeg(a, b, 'ramp', c.x, c.z));
  if (cl) for (const [su, sv] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const a = su < 0 ? N1 : N2, b = sv < 0 ? C1 : C2; ramp(a, P(su * pl.U * 0.95, sv * pl.V * 0.95), b); ramp(b, P(su * pl.U * 0.22, sv * pl.V * 0.22), a); }
  else { ramp(N1, P(-pl.U * 0.06, pl.V * 0.2), C2); ramp(C2, P(pl.U * 0.06, pl.V * 0.2), N2); ramp(N2, P(pl.U * 0.06, -pl.V * 0.2), C1); ramp(C1, P(-pl.U * 0.06, -pl.V * 0.2), N1); }
  for (const n of [N1, N2, C1, C2]) { n.lightMode = 'off'; updateNodeLights(n); }
  undoStack.push({ k: 'road', segs: made.map(q => q.id), cost: pl.cost });
  addXP(cl ? 60 : 25, L('svincolo costruito', 'interchange built'));
  toast(ICHG[kind].n() + ' ✓', 2000);
}
// modalità griglia: un rettangolo di isolati in un colpo (strade ogni 96 m: zone piene su tutti e due i lati)
const GRID_STEP = 96;
function gridLines(p0, p1) {
  const nx = Math.max(1, Math.round(Math.abs(p1.x - p0.x) / GRID_STEP)), nz = Math.max(1, Math.round(Math.abs(p1.z - p0.z) / GRID_STEP));
  const sx = Math.sign(p1.x - p0.x) || 1, sz = Math.sign(p1.z - p0.z) || 1, out = [];
  if (nx > 16 || nz > 16) return null;
  for (let i = 0; i <= nz; i++) out.push([{ x: p0.x, z: p0.z + sz * i * GRID_STEP }, { x: p0.x + sx * nx * GRID_STEP, z: p0.z + sz * i * GRID_STEP }]);
  for (let i = 0; i <= nx; i++) out.push([{ x: p0.x + sx * i * GRID_STEP, z: p0.z }, { x: p0.x + sx * i * GRID_STEP, z: p0.z + sz * nz * GRID_STEP }]);
  return out;
}
function buildGrid(p0, p1, type) {
  const ls = gridLines(p0, p1); if (!ls) { toast(L('Griglia troppo grande', 'Grid too big'), 2000); return; }
  let n = 0; for (const [a, b] of ls) { const r = buildRoad(snapRoad(a.x, a.z, type), snapRoad(b.x, b.z, type), null, type, TOOL.elev); if (r) n++; else break; }
  if (n) toast(L('Griglia costruita', 'Grid built') + ` (${n})`, 1800);
}
function buildRoundabout(x, z) {
  const n = findNearNode(x, z, 20, nd => nd.segs.length >= 2 && nd.segs.every(id => !RT[segs.get(id)?.type]?.rail));
  if (!n) { toast(L('Clicca su un incrocio', 'Click on an intersection'), 2500); return; }
  const R = TOOL.rsize || 30, cost = Math.round(15000 * (R / 30) ** 2); if (!spend(cost)) return;
  const ring = [];
  for (const sid of n.segs.slice()) {
    const s = segs.get(sid); if (!s) continue;
    if (s.len < R + 14) continue;
    const fromA = s.a === n.id; const along = fromA ? R : s.len - R;
    const f = nearestOnSeg(s, segFrame(s, along).x, segFrame(s, along).z);
    const m = splitSeg(s, f.t);
    // togli la parte interna
    for (const id of m.segs.slice()) { const q = segs.get(id); if (q && (q.a === n.id || q.b === n.id)) removeSeg(id, true); }
    ring.push(m);
  }
  if (ring.length < 2) { toast(L('Strade troppo corte per una rotonda', 'Roads too short for a roundabout'), 2500); return; }
  const cx = n.x, cz = n.z; if (!n.segs.length) { nodes.delete(n.id); markNodeDirty(n); }
  const ang = m => Math.atan2(m.z - cz, m.x - cz * 0 - cx);
  ring.sort((a, b) => ang(b) - ang(a));
  // nodi extra perché il cerchio sia rotondo
  const all = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]; all.push(a);
    let a1 = ang(a), a2 = ang(b); let d = a1 - a2; if (d <= 0) d += Math.PI * 2;
    const extra = Math.floor(d / 1.2);
    for (let k = 1; k <= extra; k++) { const t = a1 - d * k / (extra + 1); all.push(makeNode(cx + Math.cos(t) * R, cz + Math.sin(t) * R, 0)); }
  }
  for (let i = 0; i < all.length; i++) {
    const a = all[i], b = all[(i + 1) % all.length];
    let a1 = ang(a), a2 = ang(b); let d = a1 - a2; if (d <= 0) d += Math.PI * 2; const mid = a1 - d / 2, k = R / Math.cos(d / 2);
    const rs = addSeg(a, b, R >= 45 ? 'hwo2' : 'oneway', cx + Math.cos(mid) * k, cz + Math.sin(mid) * k, 0); rs.ring = true;
  }
  for (const m of all) { m.lightMode = 'off'; updateNodeLights(m); }
  S.rounds = S.rounds || []; S.rounds.push({ x: cx, z: cz, R, st: TOOL.rcenter || 'grass' }); drawRounds();
  undoStack.push({ k: 'none' });
}
// ---------- demolire ----------
function bulldozeAt(g, sx, sy) {
  const hit = pickAt(sx, sy, g);
  if (!hit) return;
  if ((hit.kind === 'svc' || hit.kind === 'bld') && !bulldozeAt.ok) { askConfirm(L('Sei sicuro di voler demolire questo edificio?', 'Are you sure you want to demolish this building?'), () => { bulldozeAt.ok = true; bulldozeAt(g, sx, sy); bulldozeAt.ok = false; }); return; }
  if (hit.kind === 'svc') { const sv = hit.obj; const refund = Math.round(SV[sv.type].cost * 0.5); if (!S.opts.unlimited) S.money += refund; removeSvc(sv); toast(L('Demolito. Rimborso ', 'Demolished. Refund ') + fmtMoney(refund), 1800); }
  else if (hit.kind === 'bld') { destroyBuilding(hit.obj); }
  else if (hit.kind === 'seg') { const s = hit.obj; if (s.pre) { toast(L('Questa strada collega la città al resto del mondo: non si può togliere', 'This road links the city to the outside: it cannot be removed'), 3000); return; } const refund = Math.round(s.len * RT[s.type].cost * 0.4); if (!S.opts.unlimited) S.money += refund; removeSeg(s.id); }
}
function pickAt(sx, sy, g) {
  _ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(_ndc, camera);
  const hits = ray.intersectObjects([POOLS.body.mesh, POOLS.plain.mesh, POOLS.roof.mesh, POOLS.cyl.mesh], false);
  for (const h of hits) { const pool = Object.values(POOLS).find(p => p.mesh === h.object); const own = pool?.owner[h.instanceId]; if (own?.ref) return own.ref.zone ? { kind: 'bld', obj: own.ref } : { kind: 'svc', obj: own.ref }; }
  if (!g) return null;
  const sv = svcAt(g.x, g.z); if (sv) return { kind: 'svc', obj: sv };
  const c = cellAtPoint(g.x, g.z); if (c && c.b) return { kind: 'bld', obj: buildings.get(c.b) };
  const s = findNearSeg(g.x, g.z, 2); if (s) return { kind: 'seg', obj: s.seg };
  return null;
}
function pickVehicle(g) { let best = null, bd = 100; for (const v of vehicles) { if (v.x == null) continue; const d = dist2(v.x, v.z, g.x, g.z); if (d < bd) { bd = d; best = v; } } return best; }
// ---------- zone ----------
function paintZones(g, zone) {
  const r = TOOL.brush === 'big' ? 40 : TOOL.brush === 'small' ? 10 : 0;
  if (TOOL.brush === 'fill') { const c = cellAtPoint(g.x, g.z); if (!c) return; const s = segs.get(c.seg); for (const id of s.cells) { const q = cells[id]; if (q && q.side === c.side) setZone(q, zone); } return; }
  const near = [...segsNear(g.x, g.z, r + 60)];
  for (const id of near) { const s = segs.get(id); if (!s) continue; for (const cid of s.cells) { const c = cells[cid]; if (c && dist2(c.x, c.z, g.x, g.z) < (r + 4) * (r + 4)) setZone(c, zone); } }
}
function setZone(c, zone) {
  if (zone && !unlocked(ZT[zone].ms)) return;
  if (c.zone === zone) return;
  if (c.b) { const b = buildings.get(c.b); if (b && b.zone !== zone) destroyBuilding(b); }
  c.zone = zone; cellsDirty = true;
}
// ---------- terreno ----------
function terraform(g, dt) {
  const R = 60, rr = Math.ceil(R / HC), ci = Math.round((g.x + HALF) / HC), cj = Math.round((g.z + HALF) / HC);
  if (!isOwned(g.x, g.z)) { tipShow(L('Fuori dal tuo territorio', 'Outside your land')); return; }
  if (!spend(Math.round((TOOL.tmode === 'fill' || TOOL.tmode === 'canal' ? 150 : 60) * dt))) return;
  if (TOOL.tmode === 'level' && !TOOL.lvl) TOOL.lvl = getH(g.x, g.z);
  let avg = 0, n = 0; for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) if (i >= 0 && j >= 0 && i < HN && j < HN) { avg += H[j * HN + i]; n++; } avg /= n;
  for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) {
    if (i < 1 || j < 1 || i >= HN - 1 || j >= HN - 1) continue;
    const x = -HALF + i * HC, z = -HALF + j * HC, d = Math.hypot(x - g.x, z - g.z); if (d > R) continue;
    if (!isOwned(x, z)) continue;
    const w = smooth(R, R * 0.3, d) * dt, k = j * HN + i;
    if (TOOL.tmode === 'canal') { const tg = WATER - 5; if (H[k] > tg) H[k] = lerp(H[k], tg, clamp(smooth(R * 0.6, R * 0.45, d) * dt * 5, 0, 1)); }
    else if (TOOL.tmode === 'fill') { const tg = WATER + 2.5; if (H[k] < tg) H[k] = lerp(H[k], tg, clamp(smooth(R, R * 0.75, d) * dt * 6, 0, 1)); } // terra nuova: bordi ripidi come banchine
    else if (TOOL.tmode === 'raise') H[k] += 12 * w; else if (TOOL.tmode === 'lower') H[k] -= 12 * w; else if (TOOL.tmode === 'level') H[k] = lerp(H[k], TOOL.lvl, clamp(w * 4, 0, 1)); else H[k] = lerp(H[k], avg, clamp(w * 3, 0, 1));
  }
  updateTerrain(ci - rr - 1, cj - rr - 1, ci + rr + 1, cj + rr + 1);
  treesNear(g.x, g.z, R, t => treeDirty.add(t.chunk));
  terrainChanged(ci - rr, cj - rr, ci + rr, cj + rr);
  if ((TOOL.tmode === 'fill' || TOOL.tmode === 'canal') && (TOOL.dockT = (TOOL.dockT || 0) + dt) > 1) { TOOL.dockT = 0; for (const sv of svcs.values()) if (!sv.route && (SV[sv.type].cargo === 'ship' || SV[sv.type].station === 'ship')) sv.dock = findDock(sv); }
}
// ---------- quartieri ----------
function paintDistrict(g, id) {
  const r = 3; const ci = Math.floor((g.x + HALF) / GC), cj = Math.floor((g.z + HALF) / GC);
  for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) if (i >= 0 && j >= 0 && i < G && j < G && Math.hypot(i - ci, j - cj) <= r) distGrid[j * G + i] = id;
  infoDirty = true; distVer++;
}
// quartiere a poligono: clic sui vertici, clic sul primo (o clic destro) per chiudere
function polyClick(g) {
  const P = TOOL.poly || (TOOL.poly = []);
  if (P.length >= 3 && Math.hypot(P[0].x - g.x, P[0].z - g.z) < Math.max(25, cam.dist * 0.02)) { finishPoly(); return; }
  P.push({ x: g.x, z: g.z }); clearGhost();
}
function finishPoly() {
  const P = TOOL.poly; TOOL.poly = null; clearGhost();
  if (!P || P.length < 3) { toast(L('Servono almeno 3 punti', 'You need at least 3 points'), 2000); return; }
  const id = newDistrict(true);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  let n = 0;
  for (let j = Math.max(0, Math.floor((z0 + HALF) / GC)); j <= Math.min(G - 1, Math.floor((z1 + HALF) / GC)); j++) for (let i = Math.max(0, Math.floor((x0 + HALF) / GC)); i <= Math.min(G - 1, Math.floor((x1 + HALF) / GC)); i++) {
    const x = -HALF + (i + 0.5) * GC, z = -HALF + (j + 0.5) * GC; let ins = false;
    for (let a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a].z > z) !== (P[b].z > z) && x < (P[b].x - P[a].x) * (z - P[a].z) / (P[b].z - P[a].z) + P[a].x) ins = !ins;
    if (ins) { distGrid[j * G + i] = id; n++; }
  }
  infoDirty = true; covDirty = true; distVer++; toast(L('Quartiere creato', 'District created'), 1800); openDistrict(id);
}
// rotta navale disegnata a mano: dal molo al bordo della mappa, solo sull'acqua
function startShipRoute(sv) { const pier = findDock(sv); if (!pier) { toast(L('Il porto non tocca acqua profonda', 'The port does not reach deep water'), 2500); return; } closeSide(); setTool('shiproute'); TOOL.rsv = sv.id; TOOL.rpts = [pier[pier.length - 1]]; toast(L('Clicca sull\'acqua fino al bordo della mappa', 'Click on water up to the map edge'), 3500); }
function waterLine(a, b) { const l = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(l / 15)); for (let i = 1; i <= n; i++) { const x = lerp(a.x, b.x, i / n), z = lerp(a.z, b.z, i / n); if (Math.abs(x) < HALF && Math.abs(z) < HALF && getH(x, z) > WATER - 1.5) return false; } return true; }
function shipRouteClick(g) {
  const P = TOOL.rpts, last = P[P.length - 1];
  if (!waterLine(last, g)) { toast(L('La nave non passa: serve acqua profonda', 'The ship cannot pass: needs deep water'), 2000); return; }
  P.push({ x: g.x, z: g.z });
  if (Math.max(Math.abs(g.x), Math.abs(g.z)) > HALF - 250) { // arrivati al bordo: la rotta è pronta
    const e = P[P.length - 1]; if (Math.abs(e.x) >= Math.abs(e.z)) e.x = Math.sign(e.x) * (HALF + 400); else e.z = Math.sign(e.z) * (HALF + 400);
    const sv = svcs.get(TOOL.rsv); if (sv) { const pts = []; for (let i = P.length - 1; i > 0; i--) { const a = P[i], b = P[i - 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 60)); for (let k = 0; k < n; k++) pts.push({ x: Math.round(lerp(a.x, b.x, k / n)), z: Math.round(lerp(a.z, b.z, k / n)) }); } pts.push({ x: Math.round(P[0].x), z: Math.round(P[0].z) }); sv.route = pts; sv.dock = pts; addXP(150, L('via d\'acqua', 'waterway')); toast(L('Rotta navale pronta!', 'Shipping route ready!'), 2500); }
    setTool(null); buildSub();
  }
}
function districtOf(x, z) { const id = distGrid[gIdx(x, z)]; return S.districts.find(d => d.id === id); }
// ---------- input ----------
const keys = {};
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  mouse.down = true; mouse.btn = e.button; mouse.dragged = false; mouse.sx = e.clientX; mouse.sy = e.clientY; mouse.lx = e.clientX; mouse.ly = e.clientY;
  if (e.button === 0 && !walk.on) toolDown(e);
});
addEventListener('mouseup', e => {
  if (mouse.btn === 2 && !mouse.dragged && !walk.on) toolCancel();
  else if (mouse.btn === 0 && !mouse.dragged && !walk.on && e.target === canvas) toolClick(e);
  mouse.down = false; mouse.btn = -1; TOOL.lvl = null; TOOL.painting = false;
});
addEventListener('mousemove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (mouse.down) {
    const dx = e.clientX - mouse.lx, dy = e.clientY - mouse.ly; mouse.lx = e.clientX; mouse.ly = e.clientY;
    if (Math.abs(e.clientX - mouse.sx) + Math.abs(e.clientY - mouse.sy) > 5) mouse.dragged = true;
    const sens = SET.sens / 5;
    if (walk.on) { walk.yaw -= dx * 0.005 * sens; walk.pitch = clamp(walk.pitch + dy * 0.004 * sens * (SET.invert ? -1 : 1), -0.6, 1.2); return; }
    if (mouse.btn === 2 && TOOL.kind === 'zone') { /* tasto destro trascinato: cancella le zone */ }
    else if (mouse.btn === 2) { cam.yaw -= dx * 0.005 * sens; cam.pitch = clamp(cam.pitch + dy * 0.004 * sens * (SET.invert ? -1 : 1), 0.12, 1.5); }
    else if (mouse.btn === 1 || (mouse.btn === 0 && !TOOL.kind)) { const k = cam.dist * 0.0018; const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw); cam.tx -= (dx * c + dy * s) * k; cam.tz -= (-dx * s + dy * c) * k; }
  }
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (walk.on) { walk.zoom = clamp((walk.zoom || 7) * (e.deltaY > 0 ? 1.15 : 0.87), 2.5, 40); return; }
  if (TOOL.kind === 'svc' && e.shiftKey) { TOOL.rot += e.deltaY > 0 ? 0.2 : -0.2; return; }
  const f = e.deltaY > 0 ? 1.15 : 0.87;
  const g = groundAt(e.clientX, e.clientY);
  const nd = clamp(cam.dist * f, 25, 5e6);
  if (g && f < 1) { const k = 1 - nd / cam.dist; cam.tx += (g.x - cam.tx) * k; cam.tz += (g.z - cam.tz) * k; }
  cam.dist = nd;
}, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'Escape') { if (TOOL.kind) { toolCancel(true); return; } if (sideOpen) { closeSide(); return; } openMenu(); return; }
  if (menuOpen) return;
  if (e.code === 'Space') { e.preventDefault(); if (!walk.on) setSpeed(S.speed ? 0 : (lastSpeed || 1)); else walk.jump = true; }
  if (e.code === 'Digit1') setSpeed(1); if (e.code === 'Digit2') setSpeed(2); if (e.code === 'Digit3') setSpeed(3);
  if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) doUndo();
  if (e.code === 'KeyR' && TOOL.kind === 'svc') TOOL.rot += Math.PI / 8;
  if (e.code === 'KeyV') toggleWalk();
  if (e.code === 'KeyB') setTool('bull');
  if (e.code === 'PageUp' || e.code === 'KeyU') { TOOL.elev = Math.min(3, TOOL.elev + 1); buildSub(); }
  if (e.code === 'PageDown' || e.code === 'KeyJ') { TOOL.elev = Math.max(-2, TOOL.elev - 1); buildSub(); }
  if (e.code === 'F2') { e.preventDefault(); saveQuick(); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
function camKeys(dt) {
  if (walk.on || menuOpen) return;
  const sp = cam.dist * 1.1 * dt * (keys.ShiftLeft ? 2.5 : 1);
  let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz -= 1; if (keys.KeyS || keys.ArrowDown) fz += 1; if (keys.KeyA || keys.ArrowLeft) fx -= 1; if (keys.KeyD || keys.ArrowRight) fx += 1;
  const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  cam.tx += (fx * c + fz * s) * sp; cam.tz += (-fx * s + fz * c) * sp;
  if (keys.KeyQ) cam.yaw += dt * 1.4; if (keys.KeyE) cam.yaw -= dt * 1.4;
  if (keys.KeyR && TOOL.kind !== 'svc') cam.pitch += dt; if (keys.KeyF) cam.pitch -= dt;
  if (keys.Equal || keys.NumpadAdd) cam.dist *= 1 - dt * 1.5; if (keys.Minus || keys.NumpadSubtract) cam.dist *= 1 + dt * 1.5;
}
function toolCancel(full) {
  if (TOOL.kind === 'road' && (TOOL.p0 || TOOL.cp)) { TOOL.p0 = null; TOOL.cp = null; clearGhost(); return; }
  if (TOOL.kind === 'line' && TOOL.line) { finishLine(); return; }
  if (TOOL.kind === 'distpoly' && TOOL.poly) { if (TOOL.poly.length >= 3) finishPoly(); else { TOOL.poly = null; clearGhost(); } return; }
  if (TOOL.kind === 'power' && TOOL.pl) { TOOL.pl = null; clearGhost(); return; }
  setTool(null); buildSub(); if (full) tipHide();
}
function toolDown(e) { if (['zone', 'terrain', 'tree', 'dist'].includes(TOOL.kind)) { TOOL.painting = true; } }
function toolClick(e) {
  const g = groundAt(e.clientX, e.clientY);
  if (!TOOL.kind) { selectAt(e.clientX, e.clientY, g); return; }
  if (!g) return;
  switch (TOOL.kind) {
    case 'road': {
      const type = TOOL.sub;
      if (TOOL.replace) { const f = findNearSeg(g.x, g.z, 12, q => !RT[q.type].rail === !RT[type].rail); if (f && f.seg.type !== type && !f.seg.pre) upgradeSeg(f.seg.id, type); else if (f && TOOL.bst && f.seg.pts.some(q => q.y - q.h > 4)) { f.seg.bst = TOOL.bst === 'beam' ? null : TOOL.bst; roadDirty.add(f.seg.chunk); flushRoads(); } break; }
      let p = snapRoad(g.x, g.z, type);
      if (!TOOL.p0) { TOOL.p0 = p; break; }
      if (TOOL.mode === 'curve2') { TOOL.c4 = TOOL.c4 || []; if (TOOL.c4.length < 2) { TOOL.c4.push({ x: g.x, z: g.z }); break; } const r = buildCubic(TOOL.p0, TOOL.c4[0], TOOL.c4[1], p, type); TOOL.c4 = []; if (r) TOOL.p0 = TOOL.single ? null : { x: r.last.x, z: r.last.z, node: r.last }; break; }
      if (TOOL.mode === 'grid') { buildGrid(TOOL.p0, g, type); TOOL.p0 = null; break; }
      if (TOOL.mode === 'curve' && !TOOL.cp) { TOOL.cp = { x: g.x, z: g.z }; break; }
      if (TOOL.mode === 'straight' && !p.node && !p.seg) p = { ...p, ...snapAngle(TOOL.p0, p.x, p.z) };
      const r = buildRoad(TOOL.p0, p, TOOL.mode === 'curve' ? TOOL.cp : null, type, TOOL.elev);
      if (r && TOOL.par) buildParallel(TOOL.p0, p, TOOL.mode === 'curve' ? TOOL.cp : null, type);
      if (r) { TOOL.p0 = TOOL.single ? null : { x: r.last.x, z: r.last.z, node: r.last }; TOOL.cp = null; }
      break;
    }
    case 'zone': paintZones(g, TOOL.sub); break;
    case 'svc': {
      const o = svcPlacement(TOOL.sub, g.x, g.z, TOOL.rot);
      if (!o.ok) { toast(o.why, 2200); break; }
      if (TOOL.moving) { placeSvc(o, TOOL.moving); TOOL.moving = null; toast(L('Spostato', 'Moved'), 1500); setTool(null); break; }
      if (!spend(SV[TOOL.sub].cost)) break;
      const sv = placeSvc(o); undoStack.push({ k: 'svc', id: sv.id, cost: SV[TOOL.sub].cost });
      if (SV[TOOL.sub].unique) setTool(null);
      break;
    }
    case 'bull': bulldozeAt(g, e.clientX, e.clientY); break;
    case 'line': lineClick(g); break;
    case 'dist': paintDistrict(g, TOOL.dist); break;
    case 'distpoly': polyClick(g); break;
    case 'shiproute': shipRouteClick(g); break;
    case 'tree': if (TOOL.sub === 'plant') { if (!isOwned(g.x, g.z)) break; if (!spend(40)) break; plantTree(g.x, g.z); flushTrees(); } else { clearTrees(() => true, g.x, g.z, 15); } break;
    case 'power': {
      const p = plEndpoint(g.x, g.z);
      if (!TOOL.pl) { TOOL.pl = p; break; }
      const L0 = Math.hypot(p.x - TOOL.pl.x, p.z - TOOL.pl.z); if (L0 < 10) break;
      if (!spend(Math.round(L0 * 15))) break;
      powerLines.push({ a: TOOL.pl, b: p }); rebuildPowerLines(); netDirty = true; TOOL.pl = p; clearGhost();
      break;
    }
    case 'light': { const n = findNearNode(g.x, g.z, 20); if (!n) break; n.lightMode = n.light ? 'stop' : n.stop ? 'off' : 'on'; updateNodeLights(n); if (!n.light && !n.stop && n.lightMode === 'on') { n.lightMode = 'stop'; updateNodeLights(n); } toast(n.light ? L('Semaforo acceso', 'Traffic light on') : n.stop ? L('Segnali di stop', 'Stop signs') : L('Incrocio libero', 'Free intersection'), 1500); break; }
    case 'noleft': { const n = findNearNode(g.x, g.z, 20); if (!n || n.segs.length < 3) { toast(L('Clicca su un incrocio', 'Click an intersection'), 1500); break; } const st = (n.noLeft ? 1 : 0) + (n.noRight ? 2 : 0), nx = (st + 1) % 4; n.noLeft = !!(nx & 1); n.noRight = !!(nx & 2); toast([L('Tutte le svolte permesse', 'All turns allowed'), L('Vietato svoltare a sinistra', 'No left turns'), L('Vietato svoltare a destra', 'No right turns'), L('Vietato svoltare a destra e a sinistra', 'No left or right turns')][nx], 1500); break; }
    case 'round': buildRoundabout(g.x, g.z); break;
    case 'ichg': buildInterchange(TOOL.sub, g.x, g.z); break;
    case 'buy': TOOL.tileSel = tileIdx(g.x, g.z); openSide('tile'); break;
  }
}
function buyTile(i) {
  if (TILES[i]) { toast(L('Questa casella è già tua', 'You already own this tile'), 2000); return; }
  if (!tileBuyable(i)) { toast(L('Puoi comprare solo caselle vicine alle tue', 'You can only buy tiles next to yours'), 2500); return; }
  if (TILES.reduce((a, b) => a + b, 0) >= tilesAllowed()) { toast(L('Raggiungi il prossimo traguardo per comprare altre caselle', 'Reach the next milestone to buy more tiles'), 3000); return; }
  if (!spend(tileCost(i))) return;
  TILES[i] = 1; gateVer++; actWin(); updateTileTex(); regenAllCellsInTile(i); toast(L('Nuova casella comprata!', 'New tile bought!'), 2000);
}
function updateTileTex() { for (let i = 0; i < NT * NT; i++) { tileData[i * 4] = TILES[i] ? 255 : 0; tileData[i * 4 + 3] = 255; } tileTex.needsUpdate = true; }
function doUndo() {
  const u = undoStack.pop(); if (!u) return;
  if (u.k === 'road') { for (const id of u.segs) removeSeg(id); if (!S.opts.unlimited) S.money += u.cost; }
  if (u.k === 'svc') { const sv = svcs.get(u.id); if (sv) { removeSvc(sv); if (!S.opts.unlimited) S.money += u.cost; } }
  toast(L('Annullato', 'Undone'), 1200);
}
// ---------- anteprima ----------
function ribbon(pts, w, mat, yOff = 1) {
  const p = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const y = (pts[i].y ?? Math.max(getH(pts[i].x, pts[i].z), WATER)) + yOff;
    p.push(pts[i].x + tz * w / 2, y, pts[i].z - tx * w / 2, pts[i].x - tz * w / 2, y, pts[i].z + tx * w / 2);
    if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.renderOrder = 8; return m;
}
function circle(x, z, r, mat) { const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.97, r, 64).rotateX(-Math.PI / 2), mat); m.position.set(x, Math.max(getH(x, z), WATER) + 3, z); m.renderOrder = 8; return m; }
function disc(x, z, r, mat) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), mat); m.position.set(x, Math.max(getH(x, z), WATER) + 2, z); m.renderOrder = 8; return m; }
let ghostT = 0;
const guideMat = new THREE.MeshBasicMaterial({ color: 0xffe070, transparent: true, opacity: 0.85, depthTest: false });
// angolo rispetto alla strada da cui si parte
function roadAngleTxt(p0, p1) {
  const n = p0.node || (p0.seg ? { segs: [p0.seg.id] } : null); if (!n || !n.segs.length) return '';
  const s = segs.get(n.segs[0]); if (!s) return '';
  const a = s.pts[0], b = s.pts[s.pts.length - 1]; const d1 = Math.atan2(b.z - a.z, b.x - a.x), d2 = Math.atan2(p1.z - p0.z, p1.x - p0.x);
  let deg = Math.abs(Math.atan2(Math.sin(d2 - d1), Math.cos(d2 - d1))) * 180 / Math.PI; if (deg > 90) deg = 180 - deg;
  return ` · ${L('angolo', 'angle')} ${Math.round(deg)}°`;
}
// pendenza massima della strada che si sta disegnando (nei video: ideale sotto il 10%)
function slopeTxt(pts) {
  let m = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(b.x - a.x, b.z - a.z); if (d > 2 && a.y != null && b.y != null) m = Math.max(m, Math.abs(b.y - a.y) / d); }
  const pc = Math.round(m * 100), col = pc <= 10 ? '#5cc26a' : pc <= 15 ? '#e3a03e' : '#e35d4f';
  return `<span style="color:${col}">${L('pendenza', 'slope')} ${pc}%</span>`;
}
function updateGhost() {
  const g = mouse.g; if (!TOOL.kind || !g) { if (TOOL.kind) clearGhost(); return; }
  clearGhost();
  switch (TOOL.kind) {
    case 'road': {
      const type = TOOL.sub; let p = snapRoad(g.x, g.z, type);
      ghost.add(disc(p.x, p.z, RT[type].w / 2 + 1, p.node || p.seg ? ghostMatOk : ringMat));
      if (TOOL.p0) {
        if (TOOL.mode === 'grid') { const ls = gridLines(TOOL.p0, g); if (ls) { let c = 0; for (const [a, b] of ls) { c += roadCost(type, Math.hypot(b.x - a.x, b.z - a.z), TOOL.elev, [a, b]); ghost.add(ribbon([{ ...a, y: getH(a.x, a.z) }, { ...b, y: getH(b.x, b.z) }], RT[type].w, ghostMatOk, 0.6)); } tipShow(`${L('Griglia', 'Grid')} ${Math.round(Math.abs(g.x - TOOL.p0.x) / GRID_STEP)}×${Math.round(Math.abs(g.z - TOOL.p0.z) / GRID_STEP)} ${L('isolati', 'blocks')} · <b>${fmtMoney(c)}</b>`); } else tipShow('⚠ ' + L('Griglia troppo grande', 'Grid too big')); break; }
        if (TOOL.mode === 'straight' && !p.node && !p.seg) p = { ...p, ...snapAngle(TOOL.p0, p.x, p.z) };
        // linea guida tratteggiata quando la strada è dritta a 45° o 90°
        if (p.snapped) { const dx = p.x - TOOL.p0.x, dz = p.z - TOOL.p0.z, l = Math.hypot(dx, dz) || 1; for (let k = 0; k < 10; k++) { const a = l + 10 + k * 24; const g0 = { x: TOOL.p0.x + dx / l * a, z: TOOL.p0.z + dz / l * a }, g1 = { x: TOOL.p0.x + dx / l * (a + 12), z: TOOL.p0.z + dz / l * (a + 12) }; ghost.add(ribbon([{ ...g0, y: getH(g0.x, g0.z) }, { ...g1, y: getH(g1.x, g1.z) }], 1.2, guideMat, 0.8)); } }
        const cp = TOOL.mode === 'curve' ? (TOOL.cp || null) : null;
        const end = TOOL.mode === 'curve' && !TOOL.cp ? { x: g.x, z: g.z } : p;
        const plan = planRoad(TOOL.p0, end, cp, type, TOOL.elev);
        const pts = plan.pts.map(q => ({ x: q.x, z: q.z, y: Math.max(getH(q.x, q.z), WATER < 1 && getH(q.x, q.z) < 1 ? 7 : -99) + (TOOL.elev > 0 ? ELEV * TOOL.elev : TOOL.elev === -1 ? -TRENCH : TOOL.elev <= -2 ? -TUNNEL : 0) }));
        ghost.add(ribbon(pts, RT[type].w, plan.ok ? ghostMatOk : ghostMatBad, 0.6));
        if (TOOL.mode === 'curve' && !TOOL.cp) tipShow(L('Clicca per scegliere la curva', 'Click to set the curve'));
        else tipShow(plan.ok ? `${RT[type].n()} · ${Math.round(plan.len)} m${roadAngleTxt(TOOL.p0, cp || p)} · ${slopeTxt(plan.pts.some(q => q.y) ? plan.pts : pts)} · <b>${fmtMoney(plan.cost)}</b>${TOOL.elev ? ' · ' + elevTxt() : ''}` : '⚠ ' + plan.why);
      } else tipShow(RT[TOOL.sub].n() + ' · ' + L('clicca per iniziare', 'click to start') + ' · ' + elevTxt());
      break;
    }
    case 'svc': {
      const o = svcPlacement(TOOL.sub, g.x, g.z, TOOL.rot), d = SV[TOOL.sub];
      const m = new THREE.Mesh(boxGeo, o.ok ? ghostMatOk : ghostMatBad); m.position.set(o.x, o.y, o.z); m.rotation.y = o.ang; m.scale.set(d.w, d.h || 10, d.d); m.renderOrder = 8; ghost.add(m);
      if (d.r) ghost.add(disc(o.x, o.z, d.r * (0.75 + 0.25 * S.budget[d.cat] / 100), ringMat));
      tipShow(o.ok ? `${d.n()} · <b>${fmtMoney(d.cost)}</b> · ${L('mantenimento', 'upkeep')} ${fmtMoney(d.upk)}/${L('mese', 'month')}` : '⚠ ' + o.why);
      break;
    }
    case 'zone': { const r = TOOL.brush === 'big' ? 40 : TOOL.brush === 'small' ? 10 : 6; ghost.add(circle(g.x, g.z, r + 4, ghostMatOk)); tipShow(TOOL.sub ? ZT[TOOL.sub].n() : L('Cancella zona', 'Remove zoning')); break; }
    case 'terrain': ghost.add(circle(g.x, g.z, TOOL.tR || 60, ghostMatOk)); if (TOOL.tmode === 'slope' && TOOL.slA) ghost.add(circle(TOOL.slA.x, TOOL.slA.z, 12, ghostMatOk)); tipShow(L('Tieni premuto per modificare il terreno', 'Hold to shape the terrain')); break;
    case 'shiproute': { const P = (TOOL.rpts || []).concat([g]), ok = P.length < 2 || waterLine(P[P.length - 2], g); ghost.add(ribbon(P.map(p => ({ x: p.x, z: p.z, y: WATER + 0.5 })), Math.max(6, cam.dist * 0.006), ok ? ghostMatOk : ghostMatBad, 1)); tipShow(ok ? L('Clicca sull\'acqua · arriva al bordo della mappa per finire · clic destro annulla', 'Click on water · reach the map edge to finish · right click cancels') : L('Qui la nave non passa', 'The ship cannot pass here')); break; }
    case 'distpoly': { const P = (TOOL.poly || []).concat([g]); if (P.length > 1) ghost.add(ribbon(P.map(p => ({ x: p.x, z: p.z, y: Math.max(getH(p.x, p.z), WATER) })), Math.max(3, cam.dist * 0.004), ghostMatOk, 2)); for (const p of TOOL.poly || []) ghost.add(disc(p.x, p.z, Math.max(5, cam.dist * 0.008), ghostMatOk)); tipShow((TOOL.poly?.length || 0) >= 3 ? L('Clicca il primo punto o clic destro per chiudere', 'Click the first point or right click to close') : L('Clicca i punti del confine', 'Click the border points')); break; }
    case 'dist': ghost.add(circle(g.x, g.z, 3.5 * GC, ghostMatOk)); tipShow((S.districts.find(d => d.id === TOOL.dist)?.name || L('Cancella quartiere', 'Erase district'))); break;
    case 'tree': ghost.add(circle(g.x, g.z, TOOL.sub === 'plant' ? 4 : 15, ghostMatOk)); tipShow(TOOL.sub === 'plant' ? L('Pianta un albero: 40 €', 'Plant a tree: €40') : L('Togli alberi', 'Remove trees')); break;
    case 'bull': { const h = pickAt(mouse.x, mouse.y, g); if (h) { const o = h.obj; if (h.kind === 'seg') ghost.add(ribbon(o.pts, RT[o.type].w + 2, ghostMatBad, 0.8)); else { const m = new THREE.Mesh(boxGeo, ghostMatBad); m.position.set(o.x, o.y, o.z); m.rotation.y = o.ang; m.scale.set(o.w ?? o.cw * CELL, (o.h || 12) + 2, o.d ?? o.cd * CELL); m.renderOrder = 8; ghost.add(m); } tipShow(L('Demolisci: ', 'Demolish: ') + (h.kind === 'seg' ? RT[o.type].n() : h.kind === 'svc' ? SV[o.type].n() : bldName(o))); } else tipShow(L('Demolisci', 'Bulldoze')); break; }
    case 'line': { const st = stopFromPoint(TOOL.sub, g.x, g.z); if (st) ghost.add(disc(st.x, st.z, 6, ghostMatOk)); tipShow(TOOL.line ? L('Aggiungi fermate. Clic destro o Esc per finire.', 'Add stops. Right click or Esc to finish.') : L('Clicca la prima fermata', 'Click the first stop') + (TOOL.sub === 'metro' || TOOL.sub === 'train' ? ' (' + L('una stazione', 'a station') + ')' : '')); break; }
    case 'power': { const p = plEndpoint(g.x, g.z); ghost.add(disc(p.x, p.z, 8, ghostMatOk)); if (TOOL.pl) { const L0 = Math.hypot(p.x - TOOL.pl.x, p.z - TOOL.pl.z); ghost.add(ribbon([{ x: TOOL.pl.x, z: TOOL.pl.z }, { x: p.x, z: p.z }], 3, ghostMatOk, 20)); tipShow(`${Math.round(L0)} m · ${fmtMoney(L0 * 15)}`); } else tipShow(L('Clicca su una centrale o su una strada', 'Click on a power plant or a road')); break; }
    case 'noleft': { const n = findNearNode(g.x, g.z, 20); if (n) ghost.add(disc(n.x, n.z, 10, ghostMatOk)); tipShow(L('Clicca un incrocio per vietare o permettere la svolta a sinistra', 'Click a junction to ban or allow left turns')); break; }
    case 'light': { const n = findNearNode(g.x, g.z, 20); if (n) ghost.add(disc(n.x, n.z, 10, ghostMatOk)); tipShow(L('Clicca un incrocio per accendere o spegnere il semaforo', 'Click an intersection to toggle its traffic light')); break; }
    case 'ichg': { const pl = ichgPlan(TOOL.sub, g.x, g.z); if (pl.curves) for (const [a, c, b] of pl.curves) ghost.add(ribbon(curvePts(a, c, b, 20), 8, pl.ok ? ghostMatOk : ghostMatBad, 0.8)); tipShow(pl.ok ? `${ICHG[TOOL.sub].n()} · <b>${fmtMoney(pl.cost)}</b>` : '⚠ ' + pl.why); break; }
    case 'round': { const n = findNearNode(g.x, g.z, 20); if (n) ghost.add(circle(n.x, n.z, 30, ghostMatOk)); tipShow(L('Rotonda su un incrocio: ', 'Roundabout on an intersection: ') + fmtMoney(15000)); break; }
    case 'buy': { const i = tileIdx(g.x, g.z); const own = TILES.reduce((a, b) => a + b, 0); tipShow(TILES[i] ? L('Già tua', 'Already yours') : tileBuyable(i) ? `${tileWater(i) > 0.6 ? '🌊 ' + L('Casella di mare (metà prezzo)', 'Sea tile (half price)') : L('Compra casella', 'Buy tile')}: <b>${fmtMoney(tileCost(i))}</b> · ${own}/${tilesAllowed()}` : L('Non vicina alle tue', 'Not next to yours')); break; }
  }
}
function paintTick(dt) {
  if (TOOL.kind === 'zone' && mouse.down && mouse.btn === 2 && mouse.dragged && mouse.g && TOOL.brush !== 'rect') paintZones(mouse.g, 0);
  if (!TOOL.painting || !mouse.g) return;
  if (TOOL.kind === 'zone' && TOOL.brush !== 'rect') paintZones(mouse.g, TOOL.sub);
  if (TOOL.kind === 'terrain') terraform(mouse.g, dt);
  if (TOOL.kind === 'dist') paintDistrict(mouse.g, TOOL.dist);
  if (TOOL.kind === 'tree' && TOOL.sub === 'remove') clearTrees(() => true, mouse.g.x, mouse.g.z, 15);
  if (TOOL.kind === 'tree' && TOOL.sub === 'plant' && rand() < dt * 8) { const x = mouse.g.x + (rand() - 0.5) * 20, z = mouse.g.z + (rand() - 0.5) * 20; if (isOwned(x, z) && !isWater(x, z) && spend(40)) { plantTree(x, z); flushTrees(); } }
}
// ---------- linee ----------
function lineClick(g) {
  const st = stopFromPoint(TOOL.sub, g.x, g.z);
  if (!st) { toast(TOOL.sub === 'metro' ? L('Clicca su una stazione della metro', 'Click a metro station') : TOOL.sub === 'train' ? L('Clicca su una stazione ferroviaria', 'Click a train station') : L('Clicca su una strada', 'Click on a road'), 2200); return; }
  if (!TOOL.line) {
    const d = LK[TOOL.sub];
    if (d.depot && ![...svcs.values()].some(s => s.type === d.depot)) toast(L('Attenzione: serve un ', 'Note: you need a ') + SV[d.depot].n() + L(' per far partire i mezzi', ' for vehicles to run'), 4000);
    TOOL.line = newLine(TOOL.sub);
  }
  const ln = TOOL.line;
  if (lineStops(ln).length >= 2 && Math.hypot(ln.stops[0].x - st.x, ln.stops[0].z - st.z) < 12) { finishLine(); return; }
  if (TOOL.wp && ln.kind !== 'metro') { if (!ln.stops.length) { toast(L('La prima deve essere una fermata vera', 'The first must be a real stop'), 2200); return; } st.wp = true; }
  ln.stops.push(st); ln.paths = null; redrawLines();
}
function finishLine() {
  const ln = TOOL.line; TOOL.line = null;
  if (ln && lineStops(ln).length < 2) { lines = lines.filter(l => l !== ln); toast(L('Una linea ha bisogno di almeno 2 fermate', 'A line needs at least 2 stops'), 2500); }
  else if (ln) { ln.paths = null; if (!lineValid(ln)) toast(L('La linea non funziona ancora: controlla deposito e strade', 'The line does not work yet: check depot and roads'), 3500); else toast(L('Linea creata: ', 'Line created: ') + ln.name, 2500); openSide('lines'); }
  redrawLines();
}
