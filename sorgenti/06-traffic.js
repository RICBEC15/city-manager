// =====================================================================
//  Traffico vero: ogni veicolo ha un percorso, corsie, code, semafori
// =====================================================================
const VK = {
  car: { l: 4.3, w: 1.8, h: 1.4, v: 1, top: true },
  taxi: { l: 4.4, w: 1.8, h: 1.45, v: 1, top: true, col: 0xf0c020 },
  truck: { l: 9, w: 2.4, h: 3.3, v: 0.8 },
  van: { l: 6, w: 2.1, h: 2.4, v: 0.9 },
  bus: { l: 12, w: 2.5, h: 3.1, v: 0.85, col: 0x2f6fd0 },
  tram: { l: 26, w: 2.4, h: 3.2, v: 0.8, col: 0x2aa07a },
  garbage: { l: 8, w: 2.4, h: 3, v: 0.8, col: 0x4f8a3a },
  ambulance: { l: 6, w: 2.2, h: 2.6, v: 1.15, col: 0xf4f4f4 },
  hearse: { l: 5.5, w: 1.9, h: 1.6, v: 0.9, col: 0x222222, top: true },
  police: { l: 4.6, w: 1.85, h: 1.45, v: 1.15, col: 0x2a4ab0, top: true },
  fire: { l: 9, w: 2.5, h: 3.2, v: 1.1, col: 0xc8281e },
  maint: { l: 7, w: 2.4, h: 2.8, v: 0.8, col: 0xe08a2a },
  train: { l: 18, w: 3, h: 3.8, v: 1, col: 0xd8d8d8, rail: true },
  cargotrain: { l: 16, w: 3, h: 3.6, v: 0.8, col: 0x8a4a2a, rail: true },
};
const CAR_COLS = [0xd8d8d8, 0x222222, 0x8a1c1c, 0x1c3a8a, 0x7a7a7a, 0xe8e8e8, 0x2a5a2a, 0xb06a20, 0x4a4a5a, 0xa0a8b0, 0x6a1c4a];
const vehicles = new Set(); let nextVehId = 1;
const EMERG = new Set(['ambulance', 'police', 'fire']);
const vBody = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 9000);
const vTop = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 6000);
const activeEdges = new Set();
let simClock = 0; // secondi di gioco (per i semafori)
let maxVehicles = 1600;

function spawnVehicle(kind, legs, opts = {}) {
  if (!legs || !legs.length) return null;
  const k = VK[kind];
  const v = { id: nextVehId++, kind, legs, li: 0, s: legs[0].s0, v: 2, lane: 0, pi: 0, l: k.l, stuck: 0, ...opts };
  v.col = opts.col ?? k.col ?? CAR_COLS[Math.floor(rand() * CAR_COLS.length)];
  const e = legs[0].e; v.lane = Math.floor(rand() * Math.max(1, e.lanes));
  e.cars[v.lane].push(v); activeEdges.add(e);
  v.hb = { i: -1 }; v.hb.i = vBody.add(v.hb);
  if (k.top) { v.ht = { i: -1 }; v.ht.i = vTop.add(v.ht); }
  if (kind === 'train' || kind === 'cargotrain') { v.cars = []; for (let i = 0; i < (opts.ncars || 4); i++) { const h = { i: -1 }; h.i = vBody.add(h); v.cars.push(h); } }
  vehicles.add(v);
  return v;
}
function despawnVehicle(v) {
  if (!vehicles.has(v)) return;
  vehicles.delete(v);
  const e = v.legs[v.li]?.e; if (e) { const ln = e.cars[v.lane]; const i = ln.indexOf(v); if (i >= 0) ln.splice(i, 1); }
  if (v.hb.i >= 0) vBody.remove(v.hb.i, 'i');
  if (v.ht && v.ht.i >= 0) vTop.remove(v.ht.i, 'i');
  if (v.cars) for (const h of v.cars) vBody.remove(h.i, 'i');
  if (followVeh === v) followVeh = null;
  if (selected?.obj === v) selectNone();
}
function edgePos(e, s, lane, v) {
  let i = v ? v.pi : 0; const c = e.cum;
  if (i >= c.length - 1 || c[i] > s) i = 0;
  while (i < c.length - 2 && c[i + 1] < s) i++;
  if (v) v.pi = i;
  const p = e.pts[i], q = e.pts[i + 1], l = c[i + 1] - c[i] || 1, t = clamp((s - c[i]) / l, 0, 1);
  const dx = (q.x - p.x) / l, dz = (q.z - p.z) / l, off = laneOffset(e, lane);
  return { x: lerp(p.x, q.x, t) - dz * off, y: lerp(p.y, q.y, t) + 0.15, z: lerp(p.z, q.z, t) + dx * off, yaw: Math.atan2(dx, dz), dx, dz };
}
function canEnter(e2, lane, need) { const ln = e2.cars[lane]; let m = 1e9; for (const o of ln) if (o.s < m) m = o.s - o.l; return m > need; }
function bestLane(e2) { let best = 0, bs = -1e9; for (let k = 0; k < e2.cars.length; k++) { let m = 1e9; for (const o of e2.cars[k]) m = Math.min(m, o.s - o.l); m += rand() * 4; if (m > bs) { bs = m; best = k; } } return best; }

function updateVehicles(dt) {
  if (dt <= 0) return;
  simClock += dt;
  for (const e of activeEdges) { let any = false; for (const ln of e.cars) { if (ln.length > 1) ln.sort((a, b) => b.s - a.s); if (ln.length) any = true; } if (!any) activeEdges.delete(e); }
  for (const e of activeEdges) {
    for (let li = 0; li < e.cars.length; li++) {
      const ln = e.cars[li];
      for (let i = 0; i < ln.length; i++) {
        const v = ln[i]; if (v._moved === simClock) continue; v._moved = simClock;
        const leg = v.legs[v.li], k = VK[v.kind];
        if (v.wait > 0) { v.wait -= dt; v.v = 0; continue; }
        if (v.crash > 0) { v.crash -= dt; v.v = 0; continue; }
        let gap = 1e9;
        if (i > 0) gap = ln[i - 1].s - ln[i - 1].l - v.s - 1.5;
        const last = v.li === v.legs.length - 1;
        const toEnd = leg.s1 - v.s;
        if (!last && toEnd < 40) {
          const nd = nodes.get(e.to);
          const nl = v.legs[v.li + 1];
          const emerg = EMERG.has(v.kind) && v.sirena;
          let block = nd && !lightGreen(nd, e) && toEnd > 1.5 && !k.rail && !emerg;
          if (nl && nl.e.seg.open && !k.rail && toEnd > 1.5) block = true; // ponte levatoio aperto
          // stop: ci si ferma un attimo davanti all'incrocio e poi si riparte
          if (nd && nd.stop && !k.rail && !emerg && v.stopLi !== v.li) { if (toEnd < 3 && v.v < 1) { v.stopLi = v.li; v.wait = 0.8; } else block = true; }
          if (!block && nl) { if (v.nextLane == null) v.nextLane = bestLane(nl.e); const gapIn = nl.e.seg.ring && !e.seg.ring ? v.l + 9 : v.l + 1.5; if (!canEnter(nl.e, v.nextLane, gapIn)) { v.nextLane = bestLane(nl.e); block = !canEnter(nl.e, v.nextLane, gapIn); } }
          if (block) gap = Math.min(gap, toEnd - 1);
        }
        if (v.stopAt != null) gap = Math.min(gap, v.stopAt - v.s + 0.5);
        const vmax = e.speed * k.v * (S.policies.speed && !e.rail ? 0.85 : 1) * (S.policies.hwfree && !e.rail && RT[e.seg.type].hw ? 1.3 : 1) * (S.policies.bumps && (e.seg.type === 'small' || e.seg.type === 'gravel') ? 0.75 : 1) * (WEATHER.snowRoad ? 0.7 : 1) * (v.kind === 'bus' && e.seg.busLane ? 1.3 : 1) * (1 - 0.35 * (e.seg.wear || 0)) * (EMERG.has(v.kind) && v.sirena ? 1.25 : 1);
        const vg = Math.max(0, gap) / 1.1;
        let vt = Math.min(vmax, vg);
        if (vt < v.v) v.v = vt; else v.v = Math.min(vt, v.v + (k.rail ? 1 : 3) * dt);
        v.s += v.v * dt;
        if (v.v < 0.2) v.stuck += dt; else v.stuck = 0;
        if (v.stopAt != null && v.s >= v.stopAt - 0.5) { v.s = Math.min(v.s, v.stopAt); const cb = v.onStop; v.stopAt = null; v.onStop = null; if (cb) cb(v); continue; }
        if (v.s >= leg.s1) {
          if (last) { arrive(v); i--; continue; }
          const nl = v.legs[v.li + 1]; const lane = v.nextLane ?? bestLane(nl.e);
          if (nl.e.dead) { despawnVehicle(v); i--; continue; }
          ln.splice(i, 1); i--;
          v.li++; v.s = nl.s0 + (v.s - leg.s1); v.lane = Math.min(lane, nl.e.cars.length - 1); v.pi = 0; v.nextLane = null;
          nl.e.cars[v.lane].push(v); activeEdges.add(nl.e); nl.e.flow++;
        }
        if (v.stuck > 70 && !k.rail && v.kind !== 'bus' && v.kind !== 'tram') { despawnVehicle(v); i--; continue; }
        if (v.stuck > 140) { despawnVehicle(v); i--; continue; }
        if (rand() < 0.0000025 * dt * 60 * crashRisk(e) && ln.length > 3 && !k.rail && !EMERG.has(v.kind)) { v.crash = crashTime(v, e); stats.accidents++; onCrash(v, e); }
      }
    }
  }
}
function arrive(v) {
  const cb = v.onArrive;
  despawnVehicle(v);
  if (cb) cb(v);
}
function drawVehicles() {
  const B = vBody.mesh, T = vTop.mesh;
  const far = cam.dist > 6000;
  for (const v of vehicles) {
    const leg = v.legs[v.li]; if (!leg) continue; const k = VK[v.kind];
    const p = edgePos(leg.e, v.s, v.lane, v);
    v.x = p.x; v.y = p.y; v.z = p.z; v.yaw = p.yaw;
    const cx = p.x - p.dx * v.l / 2, cz = p.z - p.dz * v.l / 2;
    if (far) { setInst(B, v.hb.i, 0, -999, 0, 0, 0, 0, 0); if (v.ht) setInst(T, v.ht.i, 0, -999, 0, 0, 0, 0, 0); continue; }
    setInst(B, v.hb.i, cx, p.y, cz, p.yaw, k.w, k.top ? k.h * 0.55 : k.h, v.cars ? k.l * 0.9 : v.l);
    const fl = v.crash > 0 && Math.floor(simClock * 3) % 2 ? 0xff3030 : v.col;
    _c.setHex(fl); setInstCol(B, v.hb.i, _c.r, _c.g, _c.b);
    if (v.ht) { setInst(T, v.ht.i, cx - p.dx * 0.3, p.y + k.h * 0.55, cz - p.dz * 0.3, p.yaw, k.w * 0.85, k.h * 0.45, v.l * 0.5); _c.setHex(v.col).multiplyScalar(0.8); setInstCol(T, v.ht.i, _c.r * 0.7 + 0.1, _c.g * 0.7 + 0.12, _c.b * 0.7 + 0.15); }
    if (v.cars) {
      for (let i = 0; i < v.cars.length; i++) {
        const q = posBack(v, v.l * 0.95 * (i + 1));
        if (!q) { setInst(B, v.cars[i].i, 0, -999, 0, 0, 0, 0, 0); continue; }
        setInst(B, v.cars[i].i, q.x - q.dx * k.l * 0.45, q.y, q.z - q.dz * k.l * 0.45, q.yaw, k.w, k.h, k.l * 0.9);
        _c.setHex(i % 2 && v.kind === 'cargotrain' ? 0x2a5a8a : v.col); setInstCol(B, v.cars[i].i, _c.r, _c.g, _c.b);
      }
    }
  }
  vBody.dirty(); vTop.dirty();
}
function posBack(v, off) {
  let li = v.li, s = v.s - off;
  while (s < (v.legs[li].s0 ?? 0) && li > 0) { const over = (v.legs[li].s0 ?? 0) - s; li--; s = v.legs[li].s1 - over; }
  if (s < 0) s = 0;
  const leg = v.legs[li]; return edgePos(leg.e, clamp(s, 0, leg.e.len), v.lane);
}

// ---------- generazione dei viaggi ----------
let lists = { res: [], job: [], com: [], ind: [], hotel: [], off: [] };
function refreshLists() {
  lists = { res: [], job: [], com: [], ind: [], off: [] };
  for (const b of buildings.values()) {
    if (b.ruin || b.aband || b.occ <= 0) continue; const z = ZT[b.zone].k;
    if (b.hh) lists.res.push(b);
    if (b.jobs) lists.job.push(b);
    if (z === 'C' || z === 'M') lists.com.push(b);
    if (z === 'I') lists.ind.push(b);
    if (z === 'O') lists.off.push(b);
  }
}
const outsideNodes = () => [...nodes.values()].filter(n => n.outside && !n.rail && n.segs.length);
// le uscite stanno al bordo del mondo (anche a 50 km): i mezzi da fuori compaiono alla "porta",
// il punto dell'autostrada a circa 2,5 km dalle caselle comprate, e lì spariscono quando escono
let gateVer = 0;
function nearAct(x, z, m) { const W = ACT; return x > -HALF + W.i0 * GC - m && x < -HALF + (W.i1 + 1) * GC + m && z > -HALF + W.j0 * GC - m && z < -HALF + (W.j1 + 1) * GC + m; }
function gateLeg(n) {
  const key = roadVersion + ':' + gateVer; if (n._gk === key) return n._gl; n._gk = key;
  let cur = n, prev = null, last = null;
  for (let k = 0; k < 2000; k++) {
    if (nearAct(cur.x, cur.z, 2500) || (cur !== n && cur.segs.length !== 2)) break;
    const sid = cur.segs.find(id => id !== prev); if (sid == null) break; const s = segs.get(sid); if (!s) break;
    prev = sid; last = s; cur = nodes.get(s.a === cur.id ? s.b : s.a); if (!cur) break;
  }
  n._gl = last ? { seg: last, along: last.a === cur.id ? 0 : last.len } : (() => { const s = segs.get(n.segs[0]); return s ? { seg: s, along: s.a === n.id ? 0 : s.len } : null; })();
  return n._gl;
}
function outsideLeg(n) { return gateLeg(n); }
function pathB2B(a, b) { return findPath(segs.get(a.seg), a.along, segs.get(b.seg), b.along); }
let pathBudget = 0;
function tripTarget() {
  const pop = stats.pop;
  return Math.min(maxVehicles, Math.round(20 + pop * 0.045 + stats.tourists * 0.02));
}
function genTrips() {
  pathBudget = 5;
  const outs = outsideNodes();
  const hour = (S.time % 24);
  const night = hour < 5.5 || hour > 22.5;
  let target = tripTarget() * (night ? 0.35 : 1);
  if (!outs.length && !lists.res.length) return;
  let cars = 0; for (const v of vehicles) if (!v.line && !VK[v.kind].rail) cars++;
  while (cars < target && pathBudget > 0) {
    pathBudget--;
    const r = rand();
    let from, to, kind = 'car', fromO = null, toO = null;
    const commuteAM = hour > 6 && hour < 9.5, commutePM = hour > 16 && hour < 19.5;
    if (r < (commuteAM ? 0.45 : 0.15) && lists.res.length && lists.job.length) { from = pick(lists.res); to = pick(lists.job); if (from.cov?.transit > 0.3 && rand() < stats.transitShare * 1.6) continue; }
    else if (r < (commutePM ? 0.6 : 0.3) && lists.res.length && lists.job.length) { from = pick(lists.job); to = pick(lists.res); if (to.cov?.transit > 0.3 && rand() < stats.transitShare * 1.6) continue; }
    else if (r < 0.5 && lists.res.length && lists.com.length) { from = pick(lists.res); to = pick(lists.com); }
    else if (r < 0.68 && lists.ind.length) { from = pick(lists.ind); kind = rand() < 0.6 ? 'truck' : 'van'; if (rand() < 0.5 && outs.length && !S.cargoHub) toO = pick(outs); else if (lists.com.length) to = pick(lists.com); else continue; }
    else if (r < 0.8 && outs.length && (lists.com.length || lists.ind.length)) { fromO = pick(outs); kind = rand() < 0.5 ? 'truck' : 'car'; to = kind === 'truck' ? pick(lists.ind.length ? lists.ind : lists.com) : pick(lists.com.length ? lists.com : lists.res); }
    else if (r < 0.9 && outs.length >= 2) { fromO = pick(outs); toO = pick(outs); if (fromO === toO) continue; kind = rand() < 0.3 ? 'truck' : 'car'; }
    else if (outs.length && lists.res.length) { if (rand() < 0.5) { fromO = pick(outs); to = pick(lists.res); } else { from = pick(lists.res); toO = pick(outs); } }
    else continue;
    if (kind === 'truck' && S.policies.heavy && to && ZT[to.zone].k !== 'I' && rand() < 0.6) kind = 'van';
    const A = fromO ? outsideLeg(fromO) : from ? { seg: segs.get(from.seg), along: from.along } : null;
    const Bt = toO ? outsideLeg(toO) : to ? { seg: segs.get(to.seg), along: to.along } : null;
    if (!A || !Bt || !A.seg || !Bt.seg) continue;
    const age = kind === 'car' && from && ZT[from.zone]?.k === 'R' ? pickAgeMode() : 'car';
    const legs = findPath(A.seg, A.along, Bt.seg, Bt.along, age);
    if (!legs) { if (from && !fromO) stats.noRoute = (stats.noRoute || 0) + 1; continue; }
    const kindTrip = fromO && toO ? 'thru' : !fromO && !toO && to && ZT[to.zone]?.k === 'C' ? 'shop' : 'work';
    if (!fromO && !toO && legsLen(legs) > TRIP_MAX[kindTrip]) { stats.tooFar = (stats.tooFar || 0) + 1; continue; }
    const nv = spawnVehicle(kind, legs);
    if (nv && kindTrip === 'thru') { nv.thru = true; stats.thruN = (stats.thruN || 0) + 1; }
    cars++;
  }
}
// veicoli di servizio (camion rifiuti, ambulanze, pompieri...)
function dispatch(sv, kind, b, onArrive) {
  const s1 = segs.get(sv.seg), s2 = segs.get(b.seg); if (!s1 || !s2) return null;
  const em = EMERG.has(kind); const legs = findPath(s1, sv.along, s2, b.along, em ? 'emerg' : 'car'); if (!legs) return null;
  const v = spawnVehicle(kind, legs, { svc: sv.id, sirena: em });
  if (v) v.onArrive = () => { if (onArrive) onArrive(); const back = findPath(s2, b.along, s1, sv.along); if (back) spawnVehicle(kind, back, { svc: sv.id }); };
  return v;
}
