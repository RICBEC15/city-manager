// =====================================================================
//  Menu, salvataggi, nuova partita, ciclo principale
// =====================================================================
let menuOpen = true;
function resetWorld() {
  for (const v of [...vehicles]) despawnVehicle(v);
  for (const b of buildings.values()) removeParts(b.parts); buildings.clear(); bldBuckets.clear();
  for (const sv of svcs.values()) removeParts(sv.parts); svcs.clear(); svcBuckets.clear();
  for (const [, ms] of chunkMeshes) for (const m of ms) { scene.remove(m); m.geometry.dispose(); } chunkMeshes.clear();
  segs.clear(); nodes.clear(); segBuckets.clear(); roadDirty.clear(); nextNodeId = 1; nextSegId = 1; nextBldId = 1; nextSvcId = 1; nextLineId = 1;
  cells.length = 0; freeCells.length = 0; claimM.clear(); cellsDirty = true;
  lines = []; metroTrains.length = 0; powerLines = []; rebuildPowerLines();
  for (const s of ships) s.parts.forEach(p => extra.remove(p.i, 'i')); ships.length = 0;
  for (const p of planes) { extra.remove(p.h.i, 'i'); extra.remove(p.h2.i, 'i'); } planes.length = 0;
  for (const p of peds) pedPool.remove(p.h.i, 'i'); peds.length = 0;
  burning.clear(); tornados.length = 0; flood = null; WATER = 0; activeEdges.clear(); undoStack.length = 0; plantedTrees = [];
  distGrid.fill(0); AIR.fill(0); GROUND.fill(0); NOIS.fill(0); WPOL.fill(0); LV.fill(0);
  selected = null; selBox.visible = false; followVeh = null; UPG.clear(); stats.accidents = 0;
  clearGhost(); setTool(null); openCat = null; INFO.mode = null; showInfo(null);
}
function* initMap(seed) {
  yield* sub(genTerrainG(seed, S && S.map), 0, 0.6); updateTerrain(); computeCoast(); genTrees(seed, SET.trees);
  yield 0.62;
  // costruisce i pezzi di terreno a gruppi, per far vedere l'avanzamento
  for (let k = 0; k < 40; k++) { updateTerrainLOD(false, 40); yield 0.62 + 0.38 * (k + 1) / 40; }
  updateTerrainLOD(true);
}
// sulle mappe vere autostrada e ferrovia cercano da sole un percorso: poca acqua, poca pendenza, vicino alla città
function autoRoute(fromSide, toSide, opt) {
  const R = 128, C = MAP / R, cell = (i, j) => [-HALF + (i + 0.5) * C, -HALF + (j + 0.5) * C];
  const cost = new Float32Array(R * R);
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
    const [x, z] = cell(i, j); let w = 0, sl = 0;
    for (const [a, b] of [[0, 0], [-50, -50], [50, 50], [-50, 50], [50, -50]]) { if (getH(x + a, z + b) < 0.5) w++; sl = Math.max(sl, slopeAt(x + a, z + b)); }
    let c = 1 + w * opt.water + sl * opt.slope + Math.hypot(x - opt.cx, z - opt.cz) / opt.pull;
    if (opt.avoid) for (const q of opt.avoid) if (Math.hypot(q.x - x, q.z - z) < 260) c += 25;
    cost[j * R + i] = c;
  }
  const side = (sd, i, j) => typeof sd === 'object' ? (Math.abs(cell(i, j)[0] - sd.x) <= C / 2 && Math.abs(cell(i, j)[1] - sd.z) <= C / 2) : sd === 'W' ? i === 0 : sd === 'E' ? i === R - 1 : sd === 'N' ? j === 0 : sd === 'S' ? j === R - 1 : sd === 'C' ? Math.hypot(cell(i, j)[0] - opt.cx, cell(i, j)[1] - opt.cz) < 400 && getH(...cell(i, j)) > 0.5 : false;
  const g = new Float32Array(R * R).fill(1e9), prev = new Int32Array(R * R).fill(-1), h = new Heap();
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) if (side(fromSide, i, j)) { g[j * R + i] = cost[j * R + i] * 3; h.push(g[j * R + i], j * R + i); }
  let end = -1;
  while (h.size) {
    const [gv, k] = h.pop(); if (gv > g[k]) continue; const i = k % R, j = (k / R) | 0;
    if (side(toSide, i, j)) { end = k; break; }
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= R || jj >= R) continue; const kk = jj * R + ii, c = gv + cost[kk] * Math.hypot(a, b); if (c < g[kk]) { g[kk] = c; prev[kk] = k; h.push(c, kk); } }
  }
  if (end < 0) return null;
  const path = []; for (let k = end; k >= 0; k = prev[k]) path.push(cell(k % R, (k / R) | 0));
  path.reverse();
  // un nodo ogni ~1 km, evitando di metterlo in acqua
  const pts = [path[0]]; let acc = 0;
  for (let k = 1; k < path.length; k++) { acc += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); if ((acc > 900 && getH(...path[k]) > 0.5) || k === path.length - 1) { pts.push(path[k]); acc = 0; } }
  // i punti sul bordo vanno proprio sul bordo
  const snap = (p, sd) => typeof sd === 'object' ? [sd.x, sd.z] : sd === 'W' ? [-HALF + 10, p[1]] : sd === 'E' ? [HALF - 10, p[1]] : sd === 'N' ? [p[0], -HALF + 10] : sd === 'S' ? [p[0], HALF - 10] : p;
  pts[0] = snap(pts[0], fromSide); pts[pts.length - 1] = snap(pts[pts.length - 1], toSide);
  return { pts: pts.map(([x, z]) => ({ x, z })), cost: g[end] };
}
function preplaceReal() {
  const o = { water: 30, slope: 120, pull: 900, cx: -640, cz: 640 };
  let best = null;
  for (const [a, b] of [['W', 'E'], ['N', 'S']]) { const r = autoRoute(a, b, o); if (r && (!best || r.cost < best.cost)) best = r; }
  const chain = (pts, type, outsideEnds, rail) => { let prev = null; pts.forEach((p, i) => { const n = makeNode(p.x, p.z, 0); n.keep = true; if (rail) n.rail = true; if (outsideEnds.includes(i)) n.outside = true; if (prev) { const s = addSeg(prev, n, type); s.pre = true; } prev = n; }); };
  if (best) chain(best.pts, 'highway', [0, best.pts.length - 1], false);
  let rb = null;
  for (const sd of ['W', 'N', 'E', 'S']) { const r = autoRoute('C', sd, { water: 60, slope: 300, pull: 1e9, cx: -1700, cz: -500, avoid: best ? best.pts : null }); if (r && (!rb || r.cost < rb.cost)) rb = r; }
  if (rb) { rb.pts.reverse(); chain(rb.pts, 'rail', [0], true); }
}
// prolunga una strada o un binario già fatto fino al bordo del mondo
function extendToEdge(n, sd, type, rail) {
  const r = autoRoute({ x: n.x, z: n.z }, sd, { water: 40, slope: 150, pull: 1e9, cx: 0, cz: 0 }); if (!r) return;
  let prev = n; n.outside = false;
  r.pts.slice(1).forEach((p, i, a) => { const m = makeNode(p.x, p.z, 0); m.keep = true; if (rail) m.rail = true; if (i === a.length - 1) m.outside = true; const s = addSeg(prev, m, type); s.pre = true; prev = m; });
}
function preplace() {
  if (MAPH[MAPID]) return preplaceReal();
  const hp = [-5110, -3800, -2600, -1500, -500, 500, 1500, 2600, 3800, 5110].map((x, i) => ({ x, z: -750 + Math.sin(i * 1.3) * 90 }));
  let prev = null;
  for (let i = 0; i < hp.length; i++) {
    const n = makeNode(hp[i].x, hp[i].z, 0); if (i === 0 || i === hp.length - 1) n.outside = true; n.keep = true;
    if (prev) { const s = addSeg(prev, n, 'highway'); s.pre = true; }
    prev = n;
  }
  const rp = [-5110, -4200, -3200, -2200, -1100];
  prev = null;
  for (let i = 0; i < rp.length; i++) {
    const n = makeNode(rp[i], -1180 + Math.sin(i) * 30, 0); n.rail = true; n.keep = true; if (i === 0) n.outside = true;
    if (prev) { const s = addSeg(prev, n, 'rail'); s.pre = true; }
    prev = n;
  }
  const ends = [...nodes.values()].filter(n => n.outside);
  for (const n of ends) extendToEdge(n, n.x < 0 ? 'W' : 'E', n.rail ? 'rail' : 'highway', n.rail);
}
function newGame(o) { runSync(newGameG(o)); }
function* newGameG(o) {
  resetWorld();
  S = newState(o);
  yield* sub(initMap(S.seed), 0, 0.8);
  TILES.fill(0); for (let z = 39; z <= 41; z++) for (let x = 38; x <= 40; x++) TILES[z * NT + x] = 1; gateVer++; actWin(); updateTileTex();
  preplace(); yield 0.9;
  Object.assign(stats, { fillRatio: 1, hhCap: 0, hh: 0, jobs: 0, pop: 0, demand: { R: 80, C: 15, I: 55, O: 0 }, happy: 60, fac: {}, ages: [0.22, 0.1, 0.53, 0.15], tourists: 0, riders: 0, transitShare: 0 });
  cam.tx = MAPH[MAPID] ? -640 : -700; cam.tz = MAPH[MAPID] ? 640 : -500; cam.dist = MAPH[MAPID] ? 2600 : 1400; cam.yaw = 0.5; cam.pitch = 0.9;
  S.lastDay = 3; updateWeather(); computeNetworks(); computeGrids();
  S.feed = []; addFeed('happy');
  startPlay();
  toast(L('Benvenuto sindaco! Collega una strada all\'autostrada, poi disegna le zone. Servono elettricità e acqua.', 'Welcome, mayor! Connect a road to the highway, then paint zones. You will need power and water.'), 9000);
}
function startPlay() {
  $('hud').classList.remove('hidden'); buildToolbar(); hudSpeed(); closeMenu(); feedDirty = true; updateHUD();
}
// ---------- salvataggi ----------
function serialize() {
  const nd = [...nodes.values()].map(n => [n.id, +n.x.toFixed(2), +n.z.toFixed(2), +n.y.toFixed(2), n.elev ? 1 : 0, n.outside ? 1 : 0, n.rail ? 1 : 0, n.lightMode || '', n.keep ? 1 : 0, n.noLeft ? 1 : 0, n.noRight ? 1 : 0]);
  const sg = [...segs.values()].sort((a, b) => a.id - b.id).map(s => [s.id, s.a, s.b, s.type, s.cx == null ? null : +s.cx.toFixed(2), s.cz == null ? null : +s.cz.toFixed(2), s.elev, s.pre ? 1 : 0, s.barrier ? 1 : 0, s.nm ?? null, s.busLane ? 1 : 0, s.tram ? 1 : 0, s.wear ? +s.wear.toFixed(3) : 0, s.bst || 0, s.ring ? 1 : 0]);
  const zn = []; for (const c of cells) if (c && c.zone) zn.push(c.seg, c.side, c.k, c.d, c.zone);
  const bl = [...buildings.values()].filter(b => !b.ruin).map(b => [b.seg, b.side, b.k0, b.cw, b.cd, bldData(b)]);
  const sv = [...svcs.values()].map(s => [s.id, s.type, +s.x.toFixed(2), +s.z.toFixed(2), +s.y.toFixed(2), +s.ang.toFixed(4), s.seg, +s.along.toFixed(2), Math.round(s.fill), s.on ? 1 : 0, s.ext.length ? s.ext : 0, s.dist || 0, Math.round(s.med ?? 100), s.route ? s.route.flatMap(p => [p.x, p.z]) : 0]);
  const ln = lines.map(l => ({ id: l.id, kind: l.kind, name: l.name, col: l.col, stops: l.stops, nveh: l.nveh, price: l.price, model: l.model || 0, sched: l.sched || 0, hide: l.hide ? 1 : 0 }));
  const td = []; for (let i = 0; i < H.length; i++) { const d = H[i] - H0[i]; if (Math.abs(d) > 0.03) td.push(i, Math.round(d * 20)); }
  const dg = []; let cur = distGrid[0], run = 0; for (let i = 0; i < distGrid.length; i++) { if (distGrid[i] === cur) run++; else { dg.push(cur, run); cur = distGrid[i]; run = 1; } } dg.push(cur, run);
  const pt = plantedTrees.filter(i => trees[i].alive).map(i => [Math.round(trees[i].x), Math.round(trees[i].z)]);
  S.upg = [...UPG];
  return JSON.stringify({ S, tiles: [...TILES], nd, sg, zn, bl, sv, ln, pl: powerLines, td, dg, pt, ages: stats.ages, acc: stats.accidents, cam: [cam.tx, cam.tz, cam.dist, cam.yaw, cam.pitch], ids: [nextNodeId, nextSegId, nextBldId, nextSvcId, nextLineId] });
}
function deserialize(json) { runSync(deserializeG(json)); }
function* deserializeG(json) {
  const D = JSON.parse(json);
  resetWorld();
  S = D.S; S.speed = 1;
  for (const k in CAT) if (S.budget[k] == null) S.budget[k] = 100;
  yield* sub(initMap(S.seed), 0, 0.6);
  const old = !(S.mapV >= 2); // salvataggio della vecchia mappa da 10 km: sta al centro del mondo nuovo
  const OFF = (HN - 1) / 2 - (OHN - 1) / 4, TOFF = (NT - 8) / 2;
  for (let i = 0; i < D.td.length; i += 2) { let k = D.td[i]; if (old) { const oi = k % OHN, oj = (k / OHN) | 0; if (oi & 1 || oj & 1) continue; k = (oj / 2 + OFF) * HN + oi / 2 + OFF; } H[k] = H0[k] + D.td[i + 1] / 20; }
  updateTerrain();
  if (old) { TILES.fill(0); D.tiles.forEach((v, i) => { if (v) TILES[(((i / 8) | 0) + TOFF) * NT + (i % 8) + TOFF] = 1; }); } else TILES.set(D.tiles);
  gateVer++; actWin(); updateTileTex();
  for (const n of D.nd) nodes.set(n[0], { id: n[0], x: n[1], z: n[2], y: n[3], elev: n[4], outside: !!n[5], rail: !!n[6], lightMode: n[7] || undefined, keep: !!n[8], noLeft: !!n[9], noRight: !!n[10], segs: [] });
  nextNodeId = D.ids[0];
  for (const s of D.sg) { const a = nodes.get(s[1]), b = nodes.get(s[2]); if (!a || !b) continue; forceStreetName = s[9] ?? null; const q = addSeg(a, b, s[3], s[4], s[5], s[6], s[0]); forceStreetName = null; if (s[7]) q.pre = true; if (s[8]) q.barrier = true; if (s[10]) q.busLane = true; if (s[11]) q.tram = true; if (s[12]) q.wear = s[12]; if (s[13]) q.bst = s[13]; if (s[14]) q.ring = true; if (s[9] != null) nextStreetName = Math.max(nextStreetName, s[9] + 1); }
  nextSegId = Math.max(nextSegId, D.ids[1]);
  yield 0.7;
  for (const v of D.sv) if (SV[v[1]]) placeSvc({ type: v[1], x: v[2], z: v[3], y: v[4], ang: v[5], seg: v[6], along: v[7] }, { id: v[0], fill: v[8], on: !!v[9], ext: v[10] || [], dist: v[11] || 0, med: v[12] ?? 100, route: v[13] ? v[13].reduce((a, x, i) => (i % 2 ? a[a.length - 1].z = x : a.push({ x, z: 0 }), a), []) : null });
  for (let i = 0; i < D.zn.length; i += 5) { const s = segs.get(D.zn[i]); if (!s || !s.cellMap) continue; const id = s.cellMap.get(cellKey(D.zn[i + 1], D.zn[i + 2], D.zn[i + 3])); if (id != null && cells[id]) cells[id].zone = D.zn[i + 4]; }
  yield 0.78;
  for (const [sid, side, k0, cw, cd, data] of D.bl) {
    const s = segs.get(sid); if (!s || !s.cellMap) continue; const cs = [];
    let ok = true; for (let k = k0; k < k0 + cw && ok; k++) for (let d = 0; d < cd; d++) { const id = s.cellMap.get(cellKey(side, k, d)); const c = id != null ? cells[id] : null; if (!c || c.b) { ok = false; break; } cs.push(c); }
    if (ok && cs.length) createBuilding(data.zone, cs, data);
  }
  yield 0.9;
  lines = D.ln.filter(l => LK[l.kind]).map(l => ({ ...l, riders: 0, paths: null, ver: -1 }));
  powerLines = (D.pl || []).filter(pl => (!pl.a.svc || svcs.has(pl.a.svc)) && (!pl.b.svc || svcs.has(pl.b.svc))); rebuildPowerLines();
  if (old) { const og = new Uint8Array(128 * 128); let p = 0; for (let i = 0; i < D.dg.length; i += 2) { og.fill(D.dg[i], p, p + D.dg[i + 1]); p += D.dg[i + 1]; }
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const x = -HALF + (i + 0.5) * GC, z = -HALF + (j + 0.5) * GC; if (Math.abs(x) >= OHALF || Math.abs(z) >= OHALF) continue; const v = og[Math.floor((z + OHALF) / 80) * 128 + Math.floor((x + OHALF) / 80)]; if (v) distGrid[j * G + i] = v; } }
  else { let p = 0; for (let i = 0; i < D.dg.length; i += 2) { distGrid.fill(D.dg[i], p, p + D.dg[i + 1]); p += D.dg[i + 1]; } }
  distVer++; S.mapV = 2;
  for (const [x, z] of D.pt || []) plantTree(x, z);
  flushTrees();
  UPG.clear(); for (const u of S.upg || []) UPG.add(u);
  treeMigrate();
  if (!S.pgV) { for (const sv of svcs.values()) if ((SV[sv.type].p || 0) > PDIRECT && !sv.ext.includes('tr')) sv.ext.push('tr'); S.pgV = 1; netDirty = true; } // salvataggi vecchi: le centrali già costruite hanno il trasformatore incluso
  stats.ages = D.ages || stats.ages; stats.accidents = D.acc || 0;
  [cam.tx, cam.tz, cam.dist, cam.yaw, cam.pitch] = D.cam;
  [, , nextBldId, nextSvcId, nextLineId] = D.ids; nextBldId = Math.max(nextBldId, ...[...buildings.keys(), 0].map(x => x + 1));
  S.feed = S.feed || []; S.districts = S.districts || []; S.policies = S.policies || {};
  yield 0.95;
  updateWeather(); computeNetworks(); computeCoverage(); computeGrids(); computeStats(); computeDemand(); refreshLists();
  startPlay();
}
async function saveSlot(k) {
  if (!S) return false;
  const data = await packStr(serialize());
  const ok = lsSet('slot_' + k, data);
  if (ok) lsSet('meta_' + k, JSON.stringify({ name: S.name, pop: stats.pop, day: Math.floor(S.time / 24), when: Date.now(), ms: S.ms }));
  else toast(L('Salvataggio non riuscito: memoria del browser piena. Elimina un vecchio salvataggio.', 'Save failed: browser storage is full. Delete an old save.'), 5000);
  return ok;
}
// barra di caricamento in basso a sinistra
let loading = false;
function loadBar(f, txt) {
  let el = $('loadBar');
  if (!el) { el = document.createElement('div'); el.id = 'loadBar'; el.innerHTML = '<div class="lbT"></div><div class="lbB"><div class="lbF"></div></div>'; document.body.appendChild(el); }
  if (f == null) { el.style.display = 'none'; return; }
  el.style.display = 'block'; el.querySelector('.lbT').textContent = txt + ' ' + Math.round(f * 100) + '%'; el.querySelector('.lbF').style.width = (f * 100).toFixed(1) + '%';
}
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
async function runLoad(g, txt) {
  if (loading) return; loading = true;
  try {
    const t = txt || L('Caricamento mappa…', 'Loading map…');
    while (MAPS_PROG < 1 && typeof MAPDATA !== 'undefined' && Object.keys(MAPDATA).length) { loadBar(MAPS_PROG * 0.15, L('Preparo le mappe…', 'Preparing maps…')); await Promise.race([MAPS_READY, nextFrame()]); if (MAPS_PROG >= 1) break; }
    await MAPS_READY;
    loadBar(0.15, t); await nextFrame(); await nextFrame();
    let last = performance.now(), r;
    while (!(r = g.next()).done) { if (typeof r.value === 'number' && performance.now() - last > 30) { loadBar(0.15 + 0.85 * r.value, t); await nextFrame(); last = performance.now(); } }
    loadBar(1, t); await nextFrame();
  } finally { loading = false; loadBar(null); }
}
function newGameAsync(o) { return runLoad(newGameG(o)); }
async function loadSlot(k) {
  try { const s = await unpackStr(lsGet('slot_' + k)); if (!s) return; await runLoad(deserializeG(s), L('Caricamento partita…', 'Loading game…')); toast(L('Partita caricata', 'Game loaded'), 2000); }
  catch (e) { console.error(e); toast(L('Non riesco a leggere questo salvataggio', 'Cannot read this save'), 4000); }
}
function autosave() { if (SET.autosave) saveSlot('auto'); }
function saveQuick() { saveSlot('auto').then(ok => ok && toast(L('Salvato (automatico)', 'Saved (auto slot)'), 1500)); }
function metaOf(k) { try { return JSON.parse(lsGet('meta_' + k)); } catch (e) { return null; } }
function latestSlot() { let best = null; for (const k of ['auto', '1', '2', '3']) { const m = metaOf(k); if (m && (!best || m.when > best.m.when)) best = { k, m }; } return best; }
// ---------- menu ----------
function openMenu() { menuOpen = true; $('menu').style.display = 'flex'; menuMain(); }
function closeMenu() { menuOpen = false; $('menu').style.display = 'none'; }
function menuMain() {
  const last = latestSlot();
  $('menuPan').innerHTML = `<h1>City manager</h1><div class="sub">${L('Costruisci e gestisci la tua città', 'Build and run your own city')}</div>
    ${S ? `<button class="big" onclick="closeMenu()">▶ ${L('Torna al gioco', 'Back to the game')}</button>` : ''}
    <button class="big" onclick="menuNew()">🏙️ ${L('Gioca: nuova città', 'Play: new city')}</button>
    <button class="big" ${last ? '' : 'disabled'} onclick="loadSlot('${last?.k}')">⏩ ${L('Continua', 'Continue')}${last ? ` <small>(${last.m.name}, ${fmtNum(last.m.pop)} ${L('ab.', 'pop.')})</small>` : ''}</button>
    <button class="big" onclick="menuSaves()">💾 ${L('Salvataggi', 'Saves')}</button>
    <button class="big" onclick="menuSettings()">⚙️ ${L('Impostazioni', 'Settings')}</button>
    <button class="big" onclick="menuHelp()">❔ ${L('Comandi e consigli', 'Controls and tips')}</button>
    <div class="note">${L('Durante il gioco premi Esc per tornare qui.', 'Press Esc during the game to come back here.')}</div>`;
}
function menuNew() {
  $('menuPan').innerHTML = `<h2>${L('Nuova città', 'New city')}</h2>
    <div class="r"><span>${L('Nome della città', 'City name')}</span><input type="text" id="ngName" value="${L('Nuova Città', 'New Town')}" maxlength="30"></div>
    <div class="r"><span>${L('Mappa', 'Map')} · 10.486 km²</span><select id="ngMap" onchange="$('ngMapD').textContent=MAPS[this.value].d();$('ngLeft').checked=['london','tokyo','hongkong'].includes(this.value);$('ngTheme').value=this.value==='newyork'?'us':'eu';$('ngClim').value=MAPS[this.value].clim||'temp'">${MAP_ORDER.map(k => `<option value="${k}">${MAPS[k].n()}</option>`).join('')}</select></div>
    <div class="note" id="ngMapD">${MAPS.valley.d()}</div>
    <div class="r"><span>${L('Variante della mappa (numero)', 'Map variant (number)')}</span><input type="text" id="ngSeed" value="${1 + Math.floor(Math.random() * 9999)}" style="width:90px"></div>
    <div class="r"><span>${L('Stile delle case', 'House style')}</span><select id="ngTheme"><option value="eu">${L('Europa', 'Europe')}</option><option value="us">${L('America', 'North America')}</option></select></div>
    <div class="r"><span>${L('Clima', 'Climate')}</span><select id="ngClim">${Object.keys(CLIM).map(k => `<option value="${k}">${CLIM[k].n()}</option>`).join('')}</select></div>
    <div class="r"><span>${L('Emisfero sud (stagioni invertite)', 'Southern hemisphere (seasons reversed)')}</span><input type="checkbox" id="ngSouth"></div>
    <div class="r"><span>${L('Guida a sinistra', 'Left-hand traffic')}</span><input type="checkbox" id="ngLeft"></div>
    <div class="r"><span>${L('Soldi illimitati', 'Unlimited money')}</span><input type="checkbox" id="ngMoney"></div>
    <div class="r"><span>${L('Tutto sbloccato subito', 'Everything unlocked')}</span><input type="checkbox" id="ngAll"></div>
    <div class="r"><span>${L('Disastri naturali (incendi boschivi, grandine, tornado...)', 'Natural disasters (forest fires, hail, tornadoes...)')}</span><input type="checkbox" id="ngDis"></div>
    <div class="note">${L('Si parte con 9 caselle di terreno (14,7 km²), poi se ne comprano altre fino a 6.400: tutta la mappa da 100 km per 100 km. Le mappe delle città usano le altezze e l\'acqua vere, prese dai dati satellitari.', 'You start with 9 land tiles (14.7 km²) and can buy more, up to 6,400: the whole 100 by 100 km map. The city maps use the real heights and water, taken from satellite data.')}</div>
    <button class="big" onclick="newGameAsync({name:$('ngName').value.trim()||'City',map:$('ngMap').value,seed:(parseInt($('ngSeed').value)||1),unlimited:$('ngMoney').checked,unlockAll:$('ngAll').checked,disasters:$('ngDis').checked,leftHand:$('ngLeft').checked,theme:$('ngTheme').value,climate:$('ngClim').value,south:$('ngSouth').checked})">🏗️ ${L('Inizia', 'Start')}</button>
    <button class="big" onclick="menuMain()">${L('Indietro', 'Back')}</button>`;
}
function menuSaves() {
  let h = `<h2>${L('Salvataggi', 'Saves')}</h2>`;
  for (const k of ['1', '2', '3', 'auto']) {
    const m = metaOf(k);
    h += `<div class="slot"><div class="t"><b>${k === 'auto' ? L('Automatico', 'Autosave') : L('Slot ', 'Slot ') + k}</b><br>${m ? `${m.name} · ${fmtNum(m.pop)} ${L('ab.', 'pop.')} · ${MS[m.ms || 0].n()}<br><small>${new Date(m.when).toLocaleString(LANG === 'en' ? 'en-GB' : 'it-IT')}</small>` : `<small>${L('vuoto', 'empty')}</small>`}</div>
      ${S && k !== 'auto' ? `<button onclick="saveSlot('${k}').then(ok=>{ok&&toast('${L('Salvato', 'Saved')}');menuSaves()})">${L('Salva', 'Save')}</button>` : ''}
      ${m ? `<button onclick="loadSlot('${k}')">${L('Carica', 'Load')}</button><button onclick="if(this.dataset.c){lsDel('slot_${k}');lsDel('meta_${k}');menuSaves()}else{this.dataset.c=1;this.textContent='${L('Sicuro?', 'Sure?')}'}">🗑</button>` : ''}</div>`;
  }
  h += `<div class="note">${L('I salvataggi restano in questo browser. Il gioco salva da solo una volta al mese di gioco.', 'Saves stay in this browser. The game autosaves once per game month.')}</div><button class="big" onclick="menuMain()">${L('Indietro', 'Back')}</button>`;
  $('menuPan').innerHTML = h;
}
function menuSettings() {
  $('menuPan').innerHTML = `<h2>${L('Impostazioni', 'Settings')}</h2>
    <div class="r"><span>${L('Lingua', 'Language')}</span><select id="sLang"><option value="it">Italiano</option><option value="en">English</option></select></div>
    <div class="r"><span>${L('Sensibilità mouse', 'Mouse sensitivity')}</span><input type="range" id="sSens" min="1" max="10" value="${SET.sens}"></div>
    <div class="r"><span>${L('Inverti su/giù', 'Invert up/down')}</span><input type="checkbox" id="sInv" ${SET.invert ? 'checked' : ''}></div>
    <div class="r"><span>${L('Qualità immagine', 'Image quality')}</span><select id="sQ"><option value="0.75">${L('Bassa (PC lento)', 'Low (slow PC)')}</option><option value="1">${L('Media', 'Medium')}</option><option value="1.25">${L('Alta', 'High')}</option><option value="1.75">${L('Massima', 'Max')}</option></select></div>
    <div class="r"><span>${L('Mostra FPS', 'Show FPS')}</span><input type="checkbox" id="sFps" ${SET.fps ? 'checked' : ''}></div>
    <div class="r"><span>${L('Nascondi la neve (solo grafica)', 'Hide snow (graphics only)')}</span><input type="checkbox" id="sNoSnow" ${SET.noSnow ? 'checked' : ''}></div>
    <div class="r"><span>${L('Grafica automatica (si abbassa se gli FPS scendono)', 'Auto graphics (lowers when FPS drops)')}</span><input type="checkbox" id="sAQ" ${SET.autoQ ? 'checked' : ''}></div>
    <div class="r"><span>${L('Ombre', 'Shadows')}</span><input type="checkbox" id="sSh" ${SET.shadows ? 'checked' : ''}></div>
    <div class="r"><span>${L('Quante auto al massimo', 'Max vehicles')}: <b id="vTr">${SET.traffic}</b></span><input type="range" id="sTr" min="300" max="4000" step="100" value="${SET.traffic}"></div>
    <div class="r"><span>${L('Salvataggio automatico', 'Autosave')}</span><input type="checkbox" id="sAuto" ${SET.autosave ? 'checked' : ''}></div>
    <div class="r"><span>${L('Temperatura', 'Temperature')}</span><select id="sTf"><option value="0">°C</option><option value="1">°F</option></select></div>
    <div class="r"><span>${L('Orologio', 'Clock')}</span><select id="sH12"><option value="0">24 ${L('ore', 'h')}</option><option value="1">12 ${L('ore', 'h')} (am/pm)</option></select></div>
    <div class="r"><span>${L('Dimensione del testo', 'Text size')}</span><select id="sUi"><option value="0.9">${L('Piccolo', 'Small')}</option><option value="1">${L('Normale', 'Normal')}</option><option value="1.15">${L('Grande', 'Large')}</option><option value="1.3">${L('Molto grande', 'Very large')}</option></select></div>
    <button class="big" onclick="menuMain()">${L('Indietro', 'Back')}</button>`;
  $('sLang').value = SET.lang; $('sQ').value = String(SET.quality);
  $('sLang').onchange = e => { SET.lang = LANG = e.target.value; saveSettings(); menuSettings(); if (S) { buildToolbar(); hudSpeed(); feedDirty = true; refreshPanels(); } };
  $('sSens').oninput = e => { SET.sens = +e.target.value; saveSettings(); };
  $('sInv').onchange = e => { SET.invert = e.target.checked; saveSettings(); };
  $('sFps').onchange = e => { SET.fps = e.target.checked; saveSettings(); };
  $('sNoSnow').onchange = e => { SET.noSnow = e.target.checked; saveSettings(); updateSky.rk = -1; };
  $('sAQ').onchange = e => { SET.autoQ = e.target.checked; saveSettings(); if (!SET.autoQ) setAQ(0); };
  $('sQ').onchange = e => { SET.quality = +e.target.value; saveSettings(); applySettings(); };
  $('sSh').onchange = e => { SET.shadows = e.target.checked; saveSettings(); applySettings(); };
  $('sTr').oninput = e => { SET.traffic = +e.target.value; $('vTr').textContent = SET.traffic; saveSettings(); applySettings(); };
  $('sAuto').onchange = e => { SET.autosave = e.target.checked; saveSettings(); };
  $('sTf').value = SET.tempF ? '1' : '0'; $('sH12').value = SET.h12 ? '1' : '0'; $('sUi').value = String(SET.ui);
  $('sTf').onchange = e => { SET.tempF = e.target.value === '1'; saveSettings(); };
  $('sH12').onchange = e => { SET.h12 = e.target.value === '1'; saveSettings(); };
  $('sUi').onchange = e => { SET.ui = +e.target.value; saveSettings(); applySettings(); };
}
function menuHelp() {
  $('menuPan').innerHTML = `<h2>${L('Comandi', 'Controls')}</h2><div class="note" style="font-size:14px;color:#e8e0d4">
    ${L(`<b>Telecamera:</b> W A S D o frecce per spostarti · Q / E ruota · rotellina zoom · tasto destro + trascina per girare · tasto centrale o sinistro (senza strumento) + trascina per spostare · R / F inclina<br>
    <b>Tempo:</b> Spazio pausa · 1 2 3 velocità<br><b>Costruire:</b> scegli in basso · clic sinistro per costruire · clic destro o Esc per smettere · R ruota gli edifici · U / J strada sopraelevata o a terra · Ctrl+Z annulla · B demolisci<br>
    <b>Camminare:</b> V entra ed esce · W A S D · Shift corri · Spazio salta<br><b>Salvare:</b> F2 salvataggio veloce · menu Salvataggi<br><br>
    <b>Come iniziare:</b> 1) collega una strada all'autostrada grigia; 2) fai qualche strada piccola a griglia; 3) dipingi zone verdi (case), blu (negozi) e gialle (industria, lontano dalle case); 4) metti una pala eolica o una centrale e una pompa dell'acqua sul fiume con uno scarico più a valle; 5) guarda le barre R C I O in alto: dicono cosa serve alla città. Quando cresci arrivano nuovi edifici, strade e caselle da comprare.`,
    `<b>Camera:</b> W A S D or arrows to move · Q / E rotate · wheel zoom · right drag to orbit · middle or left drag (no tool) to pan · R / F tilt<br>
    <b>Time:</b> Space pause · 1 2 3 speed<br><b>Build:</b> choose below · left click to build · right click or Esc to stop · R rotates buildings · U / J elevated or ground road · Ctrl+Z undo · B bulldoze<br>
    <b>Walk:</b> V to enter and leave · W A S D · Shift run · Space jump<br><b>Save:</b> F2 quick save · Saves menu<br><br>
    <b>Getting started:</b> 1) connect a road to the grey highway; 2) build a small grid of roads; 3) paint green (homes), blue (shops) and yellow (industry, away from homes) zones; 4) add a wind turbine or power plant and a water pump on the river with a sewage outlet downstream; 5) watch the R C I O bars at the top: they tell you what the city needs. As you grow you unlock new buildings, roads and land tiles.`)}</div>
    <button class="big" onclick="menuMain()">${L('Indietro', 'Back')}</button>`;
}
function applySettings() {
  document.documentElement.style.setProperty('--uiz', SET.ui || 1);
  const shOn = SET.shadows && AQ.lv < 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SET.quality) * AQ_PR[AQ.lv]); resize();
  renderer.shadowMap.enabled = shOn; sun.castShadow = shOn;
  for (const p of Object.values(POOLS)) { p.mesh.castShadow = shOn; p.mesh.receiveShadow = shOn; }
  for (const m of terrMeshes()) m.receiveShadow = shOn;
  LODK = AQ_LOD[AQ.lv];
  for (const m of [bldMat, plainMat, terrMat]) m.needsUpdate = true;
  maxVehicles = SET.traffic;
}
// ---------- ciclo principale ----------
let lastT = performance.now(), slowT = 0, ghostTT = 0, panT = 0, trT = 0, visT = 0;
const _eul = new THREE.Euler();
function spinParts() {
  if (cam.dist > 3000) return;
  for (const sv of svcs.values()) {
    if (!sv.blade || !sv.on) continue;
    const n = sv.blade.length;
    sv.blade.forEach((h, i) => {
      const g = h.geo; const a = simClock * (sv.type === 'wind' || sv.type === 'windsmall' ? 1.5 * (0.4 + WEATHER.wind) : sv.type === 'windmill' ? 0.6 * (0.4 + WEATHER.wind) : 0.15) + i * Math.PI * 2 / n;
      _eul.set(0, sv.type === 'wind' || sv.type === 'windsmall' ? sv.x * 0.001 : sv.ang, a, 'YXZ'); _q.setFromEuler(_eul);
      _m4.compose(_v3.set(g[0], g[1], g[2]), _q, _s3.set(g[4], g[5], g[6]));
      if (sv.type === 'wheel') _m4.multiply(new THREE.Matrix4().makeTranslation(0, -0.5, 0));
      POOLS[h.pool].mesh.setMatrixAt(h.i, _m4);
    });
    POOLS.plain.dirty();
  }
}
// ---------- FPS, grafica automatica e vista mappa da lontano ----------
const AQ = { lv: 0, acc: 0, n: 0, t: 0, fps: 60, hold: 0, low: 0, high: 0 };
const AQ_PR = [1, 0.85, 0.7, 0.55], AQ_LOD = [1, 0.8, 0.6, 0.45];
function setAQ(lv) { if (lv === AQ.lv) return; AQ.lv = lv; AQ.hold = 3; applySettings(); }
function fpsTick(rdt) {
  AQ.acc += rdt; AQ.n++;
  if (AQ.acc < 0.5) return;
  AQ.fps = AQ.n / AQ.acc; AQ.acc = 0; AQ.n = 0;
  let el = $('fpsBox'); if (!el) { el = document.createElement('div'); el.id = 'fpsBox'; document.body.appendChild(el); }
  el.style.display = SET.fps && S && !menuOpen ? 'block' : 'none';
  if (SET.fps) { const f = Math.round(AQ.fps); el.innerHTML = `<b style="color:${f >= 45 ? 'var(--good)' : f >= 25 ? 'var(--acc2)' : 'var(--bad)'}">${f}</b> FPS` + (SET.autoQ && AQ.lv ? ` · ${L('grafica', 'graphics')} -${AQ.lv}` : '') + (MAPV.on ? ` · ${L('vista mappa', 'map view')}` : ''); }
  if (!SET.autoQ || menuOpen || loading) return;
  if (AQ.hold > 0) { AQ.hold -= 0.5; return; }
  // sotto 28 FPS per 2 secondi: abbassa; sopra 52 per 6 secondi: rialza
  AQ.low = AQ.fps < 28 ? AQ.low + 0.5 : 0; AQ.high = AQ.fps > 52 ? AQ.high + 0.5 : 0;
  if (AQ.low >= 2 && AQ.lv < 3) { AQ.low = 0; setAQ(AQ.lv + 1); }
  else if (AQ.high >= 6 && AQ.lv > 0) { AQ.high = 0; setAQ(AQ.lv - 1); }
}
// da molto lontano: una sola immagine piatta della mappa (terreno, acqua, strade, case) invece di tutto il 3D
const MAPV = { on: false, mesh: null, tex: null, cv: null, ver: '', t: 99, D: 45000 };
function mapViewImage() {
  const N = 1024, cv = MAPV.cv || (MAPV.cv = document.createElement('canvas')); cv.width = cv.height = N;
  const cx = cv.getContext('2d'), img = cx.createImageData(N, N), d = img.data, step = (HN - 1) / N, tc = new Float32Array(9);
  if (!colNoise) colNoise = makeNoise(99);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const gi = Math.min(HN - 1, Math.round((i + 0.5) * step)), gj = Math.min(HN - 1, Math.round((j + 0.5) * step)), o = (j * N + i) * 4;
    terrColorAt(gi, gj, tc); let r = tc[6], g = tc[7], b = tc[8];
    const sh = clamp(0.55 + 0.45 * (tc[3] * -0.5 + tc[4] * 0.7 + tc[5] * -0.5) / 0.86, 0.45, 1.1); r *= sh; g *= sh; b *= sh;
    if (tc[1] < WATER) { const dp = clamp(-tc[1] / 30, 0, 1); r = lerp(0.3, 0.17, dp); g = lerp(0.5, 0.38, dp); b = lerp(0.62, 0.55, dp); }
    d[o] = Math.min(255, r * 255); d[o + 1] = Math.min(255, g * 255); d[o + 2] = Math.min(255, b * 255); d[o + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const k = N / MAP, P = (x, z) => [(x + HALF) * k, (z + HALF) * k];
  cx.fillStyle = 'rgba(205,196,182,0.95)';
  for (const bd of buildings.values()) { const [x, y] = P(bd.x, bd.z); cx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
  for (const sg of segs.values()) {
    const rt = RT[sg.type] || {}, rail = !!rt.rail, hw = !!rt.hw;
    cx.strokeStyle = rail ? '#6b5f55' : hw ? '#f0c060' : '#e9e6df'; cx.lineWidth = hw ? 1.8 : rail ? 1.1 : 0.9;
    cx.beginPath(); sg.pts.forEach((q, n) => { const [x, y] = P(q.x, q.z); n ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke();
  }

  if (!MAPV.tex) { MAPV.tex = new THREE.CanvasTexture(cv); MAPV.tex.encoding = THREE.sRGBEncoding; MAPV.tex.anisotropy = 4; } else MAPV.tex.needsUpdate = true;
  if (!MAPV.mesh) {
    MAPV.mesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP, MAP).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: MAPV.tex, fog: false }));
    MAPV.mesh.position.y = WATER + 2; MAPV.mesh.layers.set(1); scene.add(MAPV.mesh);
  }
}
function mapViewTick(dt) {
  const want = !walk.on && cam.dist > MAPV.D;
  if (want) {
    MAPV.t += dt; const ver = roadVersion + ':' + buildings.size + ':' + S.map + ':' + S.seed + ':' + S.name;
    if (!MAPV.mesh || (ver !== MAPV.ver && MAPV.t > 10)) { MAPV.ver = ver; MAPV.t = 0; mapViewImage(); }
  }
  if (want !== MAPV.on) {
    MAPV.on = want;
    if (want) { camera.layers.set(1); for (const o of [sky, stars, water]) o.layers.enable(1); scene.traverse(o => { if (o.isLight) o.layers.enable(1); }); }
    else camera.layers.set(0);
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = (now - lastT) / 1000, dt = Math.min(0.1, rdt); lastT = now;
  if (rdt > 0 && rdt < 2) fpsTick(rdt);
  if (!S) return;
  const gdt = menuOpen ? 0 : dt * SPEEDMUL[S.speed];
  if (gdt > 0) {
    S.time += gdt * 0.1; simAcc += gdt;
    let n = 0; while (simAcc >= 1 && n < 6) { simAcc -= 1; simTick(); n++; }
    if (simAcc > 6) simAcc = 0;
    let vdt = gdt * 1.3; while (vdt > 0) { const st = Math.min(vdt, 0.12); updateVehicles(st); vdt -= st; }
    updateLines(gdt); updateShipsPlanes(gdt); updateDisasters(gdt); genTrips();
  }
  if (!menuOpen) { camKeys(dt); paintTick(dt); }
  if (followVeh && vehicles.has(followVeh) && followVeh.x != null) { cam.tx = followVeh.x; cam.tz = followVeh.z; }
  if (walk.on) updateWalk(dt); else updateCamera();
  mapViewTick(dt);
  if (!MAPV.on) updateTerrainLOD();
  sky.position.copy(camera.position); stars.position.copy(camera.position); stars.scale.copy(sky.scale);
  if (SET.shadows) { const r = clamp(cam.dist * 0.9, 150, 2500); const c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.updateProjectionMatrix(); }
  ghostTT += dt;
  if (ghostTT > 0.06 && !menuOpen) { ghostTT = 0; mouse.g = groundAt(mouse.x, mouse.y); if (TOOL.kind) updateGhost(); }
  updateSky(); waterU.uTime.value += dt;
  updatePrecip(dt); updateSmoke(dt); radioTick(dt);
  flushRoads(); flushCells(); flushTrees(); drawVehicles(); updatePeds(dt * (S.speed ? 1 : 0)); spinParts();
  slowT += dt; panT += dt; trT += dt; visT += dt;
  if (slowT > 0.25) { slowT = 0; updateHUD(); drawLights(); drawFires(); updateLabels(); updateWarns(); updateStreets(); updateInfoSide(); renderInfo(); }
  if (trT > 2 && (INFO.mode === 'traffic' || INFO.mode === 'wind')) { trT = 0; infoDirty = true; }
  if (panT > 1 && (sideOpen === 'sel' || sideOpen === 'stats' || sideOpen === 'demand' || sideOpen === 'production')) { panT = 0; refreshPanels(); }
  if (visT > 0.5) { visT = 0; updateTreeVisibility(); if (changedTerrain.length) changedTerrain.length = 0; }
  renderer.render(scene, camera);
}
// ---------- avvio ----------
resize(); applySettings();
openMenu();
requestAnimationFrame(frame);
window.__cm = { cam, TILES, newLine, stopFromPoint, lineValid, updateLines, updateShipsPlanes, updateDisasters, rollDisaster, ships, planes, updateTileTex, regenAllCellsInTile, LK, genTrips, updateVehicles, findPath, lists: () => lists, outsideNodes, tripTarget, get S() { return S; }, renderer, scene, camera, frameStats: () => renderer.info.render, stats, segs, nodes, buildings, svcs, cells, vehicles, newGame, buildRoad, snapRoad, placeSvc, svcPlacement, setZone, paintZones, simTick, serialize, deserialize, lines, NET, budgetNow, computeNetworks };
