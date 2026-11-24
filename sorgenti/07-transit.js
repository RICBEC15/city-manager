// =====================================================================
//  Trasporto pubblico: linee bus/tram/metro/treno, navi, aerei, pedoni
// =====================================================================
const LK = {
  bus: { n: () => L('Autobus', 'Bus'), veh: 'bus', depot: 'busdepot', cap: 60, upk: 380, price: 2, wait: 6, catch: 380, col: 0x2f6fd0, ms: 1 },
  train: { n: () => L('Treno passeggeri', 'Passenger train'), veh: 'train', cap: 600, upk: 2200, price: 5, wait: 14, catch: 900, col: 0xd8a030, ms: 5, st: 'train' },
};
const LINE_COLS = [0xe6194b, 0x3cb44b, 0xffe119, 0x4363d8, 0xf58231, 0x911eb4, 0x46f0f0, 0xf032e6, 0xbcf60c, 0x008080, 0x9a6324, 0x800000];
let lines = []; let nextLineId = 1;
const ABSTR = new Set(['metro', 'ferry']); // linee che non usano le strade (sotto terra o sull'acqua)
// modelli dei mezzi e orari delle linee
const LMOD = { bus: [{ n: () => L('Autobus normale', 'Standard bus'), cap: 1, upk: 1 }, { n: () => L('Autobus snodato', 'Articulated bus'), cap: 1.6, upk: 1.35 }], train: [{ n: () => L('Treno da 4 carrozze', '4-car train'), cap: 1, upk: 1, cars: 4 }, { n: () => L('Treno da 8 carrozze', '8-car train'), cap: 2, upk: 1.8, cars: 8 }] };
const lineMod = ln => (LMOD[ln.kind] || [{ cap: 1, upk: 1 }])[ln.model || 0] || { cap: 1, upk: 1 };
const lineCap = ln => LK[ln.kind].cap * lineMod(ln).cap;
const LSCHED = () => [L('Sempre (giorno e notte)', 'Always (day and night)'), L('Solo di giorno (6-22)', 'Daytime only (6-22)'), L('Solo di notte (22-6)', 'Night only (22-6)')];
function lineRuns(ln) { const h = S.time % 24, day = h >= 6 && h < 22; return !ln.sched || (ln.sched === 2 ? !day : day); }
const lineStops = ln => ln.stops.filter(s => !s.wp);
let lineGroup = new THREE.Group(); scene.add(lineGroup);
function newLine(kind) { const n = lines.filter(l => l.kind === kind).length + 1; const ln = { id: nextLineId++, kind, name: LK[kind].n() + ' ' + n, col: LINE_COLS[(nextLineId - 2) % LINE_COLS.length], stops: [], nveh: 2, price: LK[kind].price, riders: 0, ridersDay: 0, veh: [], paths: null, ver: -1 }; lines.push(ln); return ln; }
function linePaths(ln) {
  if (ln.paths && ln.ver === roadVersion) return ln.paths;
  ln.paths = []; ln.ver = roadVersion;
  if (ABSTR.has(ln.kind)) return ln.paths;
  const mode = ln.kind === 'train' ? 'rail' : ln.kind === 'tram' ? 'tram' : 'car';
  const st = ln.stops;
  for (let i = 0; i < st.length; i++) {
    const a = st[i], b = st[(i + 1) % st.length];
    const sa = segs.get(a.seg), sb = segs.get(b.seg);
    ln.paths.push(sa && sb ? findPath(sa, a.along, sb, b.along, mode) : null);
  }
  return ln.paths;
}
function stopFromPoint(kind, x, z) {
  if (ABSTR.has(kind) || kind === 'train') {
    const sv = [...svcs.values()].find(s => SV[s.type].station === kind && obbContains(s, x, z, 15));
    if (!sv) return null;
    if (ABSTR.has(kind)) return { svc: sv.id, x: sv.x, z: sv.z };
    const rs = segs.get(sv.seg); if (!rs) return null;
    return { svc: sv.id, seg: rs.id, along: sv.along, x: sv.x, z: sv.z };
  }
  const n = findNearSeg(x, z, 12, s => !RT[s.type].rail && !RT[s.type].ped && !RT[s.type].hw && (kind !== 'tram' || s.tram));
  if (!n) return null;
  return { seg: n.seg.id, along: clamp(n.along, 5, n.seg.len - 5), x: n.x, z: n.z };
}
function lineValid(ln) {
  if (ln.stops.length < 2) return false;
  const d = LK[ln.kind];
  if (d.depot && ![...svcs.values()].some(s => s.type === d.depot && s.on)) return false;
  if (ABSTR.has(ln.kind)) return ln.stops.every(s => svcs.has(s.svc));
  return linePaths(ln).every(p => p);
}
function lineNext(v) {
  const ln = lines.find(l => l.id === v.line);
  const e = v.legs[v.li]?.e; if (e) { const lnA = e.cars[v.lane]; const i = lnA.indexOf(v); if (i >= 0) lnA.splice(i, 1); }
  if (!ln || !lineValid(ln)) { v.onArrive = null; despawnVehicleRaw(v); return; }
  v.stopIdx = (v.stopIdx + 1) % ln.stops.length;
  const p = linePaths(ln)[v.stopIdx];
  if (!p) { despawnVehicleRaw(v); return; }
  v.legs = p; v.li = 0; v.s = p[0].s0; v.pi = 0; v.wait = ln.stops[v.stopIdx]?.wp ? 0 : LK[ln.kind].wait; v.lane = p[0].e.lanes > 1 ? p[0].e.lanes - 1 : 0;
  v.lane = Math.min(v.lane, p[0].e.cars.length - 1);
  p[0].e.cars[v.lane].push(v); activeEdges.add(p[0].e);
  v.pax = Math.round(clamp(ln.riders / Math.max(1, ln.nveh) * (0.4 + rand() * 0.8), 0, lineCap(ln)));
}
function despawnVehicleRaw(v) { // il veicolo è già stato tolto dalla corsia
  vehicles.delete(v);
  if (v.hb.i >= 0) vBody.remove(v.hb.i, 'i'); if (v.ht && v.ht.i >= 0) vTop.remove(v.ht.i, 'i'); if (v.cars) for (const h of v.cars) vBody.remove(h.i, 'i');
  if (followVeh === v) followVeh = null;
}
const _arrive0 = arrive;
arrive = function (v) { if (v.line != null) { lineNext(v); return; } _arrive0(v); };
// metropolitana: treni che vanno dritti sotto terra
const metroTrains = [];
function updateLines(dt) {
  for (const ln of lines) {
    const ok = lineValid(ln) && !ln.off && lineRuns(ln);
    ln.ok = ok;
    if (ABSTR.has(ln.kind)) {
      const list = metroTrains.filter(m => m.line === ln.id);
      if (!ok) { for (const m of list) metroTrains.splice(metroTrains.indexOf(m), 1); continue; }
      while (list.length < ln.nveh) { const m = { line: ln.id, i: Math.floor(rand() * ln.stops.length), t: rand(), wait: 0 }; metroTrains.push(m); list.push(m); }
      while (list.length > ln.nveh) metroTrains.splice(metroTrains.indexOf(list.pop()), 1);
      for (const m of list) {
        if (m.wait > 0) { m.wait -= dt; continue; }
        const a = svcs.get(ln.stops[m.i].svc), b = svcs.get(ln.stops[(m.i + 1) % ln.stops.length].svc); if (!a || !b) continue;
        const L0 = Math.hypot(b.x - a.x, b.z - a.z) || 1; m.t += (LK[ln.kind].spd || 22) * dt / L0;
        if (m.t >= 1) { m.t = 0; m.i = (m.i + 1) % ln.stops.length; m.wait = 8; }
      }
      continue;
    }
    const mine = [...vehicles].filter(v => v.line === ln.id);
    if (!ok) { for (const v of mine) despawnVehicle(v); continue; }
    if (mine.length < ln.nveh && rand() < dt * 0.2) {
      const i = mine.length * Math.floor(ln.stops.length / Math.max(1, ln.nveh)) % ln.stops.length;
      const p = linePaths(ln)[i];
      if (p) { const v = spawnVehicle(LK[ln.kind].veh, p, { line: ln.id, stopIdx: i, col: ln.col, ncars: lineMod(ln).cars || 4 }); if (v) v.lane = 0; }
    } else if (mine.length > ln.nveh) despawnVehicle(mine[mine.length - 1]);
  }
}
// passeggeri e copertura del trasporto pubblico (una volta all'ora di gioco)
function computeRidership() {
  for (const b of buildings.values()) if (b.cov) b.cov.transit = 0;
  let tot = 0;
  for (const ln of lines) {
    ln.riders = 0; if (!ln.ok) continue;
    const d = LK[ln.kind]; let res = 0, jobs = 0;
    const seen = new Set();
    for (const st of lineStops(ln)) bldNear(st.x, st.z, d.catch, b => { if (seen.has(b.id)) return; seen.add(b.id); if (b.cov) b.cov.transit = Math.max(b.cov.transit, 1); res += b.hh ? (b.res || 0) : 0; jobs += b.wk || 0; });
    const freq = clamp(ln.nveh / Math.max(1, lineStops(ln).length * 0.5), 0.2, 1.5) * (ln.sched ? 0.85 : 1);
    const price = S.policies.freeTransit ? 1.4 : clamp(1.6 - ln.price / (d.price * 2.5), 0.3, 1.3);
    ln.riders = Math.round(Math.min(Math.sqrt(res * jobs) * 0.35 * freq * price, lineCap(ln) * ln.nveh * 3));
    tot += ln.riders;
  }
  stats.riders = tot;
  stats.transitShare = clamp(tot / Math.max(1, stats.pop * 0.5), 0, 0.6);
}
function redrawLines() {
  scene.remove(lineGroup); lineGroup.traverse(o => o.geometry?.dispose());
  lineGroup = new THREE.Group();
  const show = INFO.mode === 'transit' || TOOL.kind === 'line';
  if (show) for (const ln of lines) { if (ln.hide && TOOL.line !== ln) continue;
    const pts = [];
    if (ABSTR.has(ln.kind)) for (const s of ln.stops.concat(ln.stops.length > 1 ? [ln.stops[0]] : [])) { const sv = svcs.get(s.svc); if (sv) pts.push(new THREE.Vector3(sv.x, Math.max(getH(sv.x, sv.z), WATER) + 6, sv.z)); }
    else for (const p of (ln.stops.length > 1 ? linePaths(ln) : [])) if (p) for (const leg of p) { const e = leg.e; for (let i = 0; i < e.pts.length; i++) if (e.cum[i] >= leg.s0 - 8 && e.cum[i] <= leg.s1 + 8) pts.push(new THREE.Vector3(e.pts[i].x, e.pts[i].y + 4, e.pts[i].z)); }
    if (pts.length > 1) lineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: ln.col, depthTest: false, transparent: true })));
    for (const s of ln.stops) { const m = new THREE.Mesh(s.wp ? new THREE.OctahedronGeometry(3.2) : new THREE.CylinderGeometry(4, 4, 6, 10), new THREE.MeshBasicMaterial({ color: ln.col, depthTest: false, transparent: true, opacity: 0.85 })); m.position.set(s.x, Math.max(getH(s.x, s.z), WATER) + 5, s.z); m.renderOrder = 9; lineGroup.add(m); }
  }
  lineGroup.renderOrder = 9; scene.add(lineGroup);
}
// ---------- treni da fuori, navi, aerei ----------
const extra = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 3000);
const ships = [], planes = [];
const WG = 1024, WGC = MAP / WG;
function findDock(sv) {
  const d = SV[sv.type]; const fx = Math.sin(sv.ang), fz = Math.cos(sv.ang);
  for (const k of [0.8, 1.2, 1.6, 2.2, 3]) { const x = sv.x + fx * d.d * k, z = sv.z + fz * d.d * k; if (isWater(x, z) && getH(x, z) < WATER - 2) return waterRoute(x, z); }
  return null;
}
function waterRoute(x, z) {
  const ok = (i, j) => i >= 0 && j >= 0 && i < WG && j < WG && getH(-HALF + (i + 0.5) * WGC, -HALF + (j + 0.5) * WGC) < WATER - 1.5;
  const si = clamp(Math.floor((x + HALF) / WGC), 0, WG - 1), sj = clamp(Math.floor((z + HALF) / WGC), 0, WG - 1);
  const prev = new Int32Array(WG * WG).fill(-1), q = [sj * WG + si]; prev[q[0]] = q[0];
  let end = -1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], i = c % WG, j = Math.floor(c / WG);
    if (j === WG - 1 || j === 0 || i === 0 || i === WG - 1) { end = c; break; }
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b, n = nj * WG + ni; if (ok(ni, nj) && prev[n] < 0) { prev[n] = c; q.push(n); } }
  }
  if (end < 0) return null;
  const pts = []; let c = end;
  while (true) { pts.push({ x: -HALF + (c % WG + 0.5) * WGC, z: -HALF + (Math.floor(c / WG) + 0.5) * WGC }); if (prev[c] === c) break; c = prev[c]; }
  pts.push({ x, z });
  { const i = end % WG, j = Math.floor(end / WG); if (j === WG - 1) pts[0].z = HALF + 400; else if (j === 0) pts[0].z = -HALF - 400; else if (i === 0) pts[0].x = -HALF - 400; else pts[0].x = HALF + 400; }
  return pts; // dal bordo al molo
}
function shipStart(pts) { for (let i = 0; i < pts.length; i++) if (nearAct(pts[i].x, pts[i].z, 4000)) return Math.max(0, i - 1); return 0; }
function spawnShip(sv, cargo, cruise) { if (!sv.dock) return; const i0 = shipStart(sv.dock); ships.push({ sv: sv.id, pts: sv.dock, i: i0, i0, t: 0, dir: 1, wait: 0, cargo, cruise, parts: [{ i: extra.add({}) }, { i: extra.add({}) }].concat(cruise ? [{ i: extra.add({}) }, { i: extra.add({}) }] : []) }); ships[ships.length - 1].parts.forEach(p => extra.owner[p.i] = p); }
function updateShipsPlanes(dt) {
  for (let k = ships.length - 1; k >= 0; k--) {
    const sh = ships[k]; const sv = svcs.get(sh.sv);
    if (!sv) { sh.parts.forEach(p => extra.remove(p.i, 'i')); ships.splice(k, 1); continue; }
    if (sh.wait > 0) { sh.wait -= dt; if (sh.wait <= 0) { sh.dir = -1; sh.docked = false; } }
    else {
      const a = sh.pts[sh.i], b = sh.dir === -1 && sh.i <= (sh.i0 || 0) ? null : sh.pts[sh.i + sh.dir]; if (!b) { if (sh.dir === 1) { sh.wait = sh.cruise ? 150 : 60; sh.docked = true; } else { sh.parts.forEach(p => extra.remove(p.i, 'i')); ships.splice(k, 1); continue; } }
      else { const L0 = Math.hypot(b.x - a.x, b.z - a.z) || 1; sh.t += 9 * dt / L0; if (sh.t >= 1) { sh.t = 0; sh.i += sh.dir; } }
    }
    const a = sh.pts[sh.i], b = sh.pts[sh.i + sh.dir] || a; let x = lerp(a.x, b.x, sh.t), z = lerp(a.z, b.z, sh.t);
    const yaw = Math.atan2(b.x - a.x, b.z - a.z) || sh.yaw || 0; sh.yaw = yaw;
    if (sh.cruise) { // nave da crociera: lunga, bianca, con i ponti e il fumaiolo
      { const o = 58 * sh.dir; x -= Math.sin(yaw) * o; z -= Math.cos(yaw) * o; } // la prua si ferma al molo
      setInst(extra.mesh, sh.parts[0].i, x, WATER - 3, z, yaw, 22, 9, 120); setInstCol(extra.mesh, sh.parts[0].i, 0.96, 0.96, 0.98);
      setInst(extra.mesh, sh.parts[1].i, x, WATER + 6, z, yaw, 18, 8, 90); setInstCol(extra.mesh, sh.parts[1].i, 0.92, 0.93, 0.97);
      setInst(extra.mesh, sh.parts[2].i, x, WATER + 14, z, yaw, 14, 6, 60); setInstCol(extra.mesh, sh.parts[2].i, 0.2, 0.35, 0.65);
      setInst(extra.mesh, sh.parts[3].i, x - Math.sin(yaw) * 20, WATER + 20, z - Math.cos(yaw) * 20, yaw, 6, 9, 8); setInstCol(extra.mesh, sh.parts[3].i, 0.8, 0.2, 0.15);
      continue;
    }
    const L1 = sh.cargo ? 70 : 40;
    setInst(extra.mesh, sh.parts[0].i, x, WATER - 2, z, yaw, sh.cargo ? 14 : 10, 6, L1); _c.setHex(sh.cargo ? 0x3a3a4a : 0xf0f0f0); setInstCol(extra.mesh, sh.parts[0].i, _c.r, _c.g, _c.b);
    setInst(extra.mesh, sh.parts[1].i, x, WATER + 4, z, yaw, sh.cargo ? 12 : 8, sh.cargo ? 5 : 6, L1 * 0.6); _c.setHex(sh.cargo ? 0xc0462a : 0x2a6ac0); setInstCol(extra.mesh, sh.parts[1].i, _c.r, _c.g, _c.b);
  }
  for (let k = planes.length - 1; k >= 0; k--) {
    const p = planes[k]; p.t += dt / 90; const sv = svcs.get(p.sv);
    if (!sv || p.t > 1) { extra.remove(p.h.i, 'i'); extra.remove(p.h2.i, 'i'); planes.splice(k, 1); continue; }
    const fx = Math.cos(sv.ang), fz = -Math.sin(sv.ang); // lungo la pista
    const t = p.t; let s, alt;
    if (t < 0.45) { s = lerp(-4000, -150, t / 0.45); alt = lerp(500, 0, smooth(0, 1, t / 0.45)); } else if (t < 0.55) { s = lerp(-150, 150, (t - 0.45) / 0.1); alt = 0; } else { s = lerp(150, 5000, (t - 0.55) / 0.45); alt = lerp(0, 700, smooth(0, 1, (t - 0.55) / 0.45)); }
    const x = sv.x + fx * s, z = sv.z + fz * s, y = sv.y + 3 + alt, yaw = Math.atan2(fx, fz);
    setInst(extra.mesh, p.h.i, x, y, z, yaw, 4, 4, 38); setInst(extra.mesh, p.h2.i, x, y + 1.5, z, yaw, 34, 0.8, 6);
    setInstCol(extra.mesh, p.h.i, 0.95, 0.95, 0.97); setInstCol(extra.mesh, p.h2.i, 0.85, 0.85, 0.9);
  }
  // metro (visibile solo nella vista trasporti)
  let mc = 0; extra.metroN = extra.metroN || [];
  for (const h of extra.metroN) extra.remove(h.i, 'i'); extra.metroN = [];
  if (INFO.mode === 'transit') for (const m of metroTrains) {
    const ln = lines.find(l => l.id === m.line); if (!ln) continue;
    const a = svcs.get(ln.stops[m.i]?.svc), b = svcs.get(ln.stops[(m.i + 1) % ln.stops.length]?.svc); if (!a || !b) continue;
    const x = lerp(a.x, b.x, m.t), z = lerp(a.z, b.z, m.t); const h = { i: extra.add(null) }; extra.owner[h.i] = h; extra.metroN.push(h);
    setInst(extra.mesh, h.i, x, Math.max(getH(x, z), WATER) + 3, z, Math.atan2(b.x - a.x, b.z - a.z), 3, 3, 40); _c.setHex(ln.col); setInstCol(extra.mesh, h.i, _c.r, _c.g, _c.b); mc++;
  }
  extra.dirty();
}
function spawnPlane(sv) { const h = { i: extra.add(null) }, h2 = { i: extra.add(null) }; extra.owner[h.i] = h; extra.owner[h2.i] = h2; planes.push({ sv: sv.id, t: 0, h, h2 }); }
function outsideRail() { return [...nodes.values()].filter(n => n.outside && n.rail && n.segs.length); }
function spawnIntercity() {
  const outs = outsideRail(); if (!outs.length) return;
  const st = [...svcs.values()].filter(s => s.on && (s.type === 'train' || s.type === 'cargotrain' || SV[s.type].bigTrain) && segs.get(s.seg));
  if (!st.length) return;
  const sv = pick(st), o = pick(outs), gl = gateLeg(o); if (!gl) return; const os = gl.seg, oa = gl.along;
  const legs = findPath(os, oa, segs.get(sv.seg), sv.along, 'rail'); if (!legs) return;
  const cargo = sv.type === 'cargotrain';
  const v = spawnVehicle(cargo ? 'cargotrain' : 'train', legs, { ncars: cargo ? 7 : 5, col: cargo ? 0x8a4a2a : 0xe0e0e0 });
  if (v) { v.st = sv.id; v.inb = true; }
  if (v) v.onArrive = () => { const back = findPath(segs.get(sv.seg), sv.along, os, oa, 'rail'); if (back) { const w = spawnVehicle(cargo ? 'cargotrain' : 'train', back, { ncars: cargo ? 7 : 5, col: cargo ? 0x8a4a2a : 0xe0e0e0 }); if (w) { w.wait = 20; w.st = sv.id; w.inb = false; } } };
}
// ---------- pedoni (solo vicino alla telecamera) ----------
const peds = []; const pedPool = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 900);
const PED_COLS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad, 0x34495e, 0xe67e22, 0xecf0f1, 0x16a085];
let pedT = 0;
function updatePeds(dt) {
  const want = cam.dist < 600 || walk.on ? 700 : 0;
  const cx = walk.on ? walk.x : cam.tx, cz = walk.on ? walk.z : cam.tz;
  // solo persone vere che stanno camminando (un pedone = un abitante, finché arriva)
  while (peds.length > want) { const p = peds.pop(); pedPool.remove(p.h.i, 'i'); }
  if (want && (pedT = (pedT || 0) + 1) % 15 === 1) {
    const shown = new Set(peds.map(p => p.pid));
    for (const w of popWalkersNear(cx, cz, 800, want)) {
      if (peds.length >= want) break; if (shown.has(w.id)) continue; const o = w.ws, s = o && segs.get(o.seg); if (!s) continue;
      const p = { pid: w.id, seg: s.id, a: clamp(o.along ?? rand() * s.len, 0, s.len), side: o.side || (rand() < 0.5 ? 1 : -1), dir: rand() < 0.5 ? 1 : -1, sp: 1 + rand() * 0.6, h: { i: -1 }, col: PED_COLS[w.id % PED_COLS.length] };
      p.h.i = pedPool.add(p.h); peds.push(p);
    }
  }
  for (let i = peds.length - 1; i >= 0; i--) {
    const p = peds[i], s = segs.get(p.seg), w = POP.p.get(p.pid);
    if (!s || !w || w.s !== ST.VIAGGIO || w.m !== 'w' || Math.hypot(s.pts[0].x - cx, s.pts[0].z - cz) > 900) { pedPool.remove(p.h.i, 'i'); peds.splice(i, 1); continue; }
    p.a += p.dir * p.sp * dt; if (p.a < 0 || p.a > s.len) { p.dir *= -1; p.a = clamp(p.a, 0, s.len); }
    const f = segFrame(s, p.a), off = RT[s.type].w / 2 - 1;
    setInst(pedPool.mesh, p.h.i, f.x + f.nx * off * p.side, f.y + 0.15, f.z + f.nz * off * p.side, Math.atan2(f.tx * p.dir, f.tz * p.dir), 0.55, 1.7, 0.35);
    _c.setHex(p.col); setInstCol(pedPool.mesh, p.h.i, _c.r, _c.g, _c.b);
  }
  pedPool.dirty();
}
