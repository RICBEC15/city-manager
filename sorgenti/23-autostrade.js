// =====================================================================
//  Autostrade vere nelle mappe delle città (dati © OpenStreetMap,
//  tramite Overture Maps) e scelta della casella di partenza.
//  Per non pesare sul PC le autostrade diventano strade vere solo vicino
//  alle caselle tue; il resto si vede come nastro grigio leggero e
//  diventa strada vera quando compri le caselle lì vicino.
// =====================================================================
const RHW = { city: {}, ready: false, mesh: null, keyNode: new Map() };
const RHW_READY = (async () => {
  for (const k in HWDATA) {
    try {
      const bin = atob(HWDATA[k]), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const txt = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      const arr = JSON.parse(txt), chains = []; let base = 0;
      for (const [kind, d, f] of arr) {
        const n = d.length / 2, xs = new Float32Array(n), zs = new Float32Array(n); let x = 0, z = 0;
        for (let i = 0; i < n; i++) { x += d[i * 2]; z += d[i * 2 + 1]; xs[i] = x; zs[i] = z; }
        chains.push({ kind, xs, zs, f, base }); base += n - 1;
      }
      // per ogni punto: i tratti che lo toccano (servono per sapere dove l'autostrada continua)
      const adj = new Map(); const kk = (x, z) => Math.round(x) + ',' + Math.round(z);
      chains.forEach((c, ci) => { for (let i = 0; i < c.xs.length; i++) { const key = kk(c.xs[i], c.zs[i]); let l = adj.get(key); if (!l) adj.set(key, l = []); if (i > 0) l.push(c.base + i - 1); if (i < c.xs.length - 1) l.push(c.base + i); } });
      RHW.city[k] = { chains, adj, n: base };
    } catch (e) { console.error('autostrade', k, e); }
  }
  RHW.ready = true;
})();
const rhwKey = (x, z) => Math.round(x) + ',' + Math.round(z);
const RHW_TYPE = ['hwo3', 'highway', 'ramp', 'highway'];
// caselle tue più una di margine
function rhwRegion() { const r = new Uint8Array(NT * NT), X = new Set((typeof S !== 'undefined' && S && S.rhwX) || []); for (let j = 0; j < NT; j++) for (let i = 0; i < NT; i++) if (TILES[j * NT + i] || X.has(j * NT + i)) for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const x = i + a, z = j + b; if (x >= 0 && z >= 0 && x < NT && z < NT) r[z * NT + x] = 1; } return r; }
function rhwSync() {
  if (typeof S === 'undefined' || !S || !MAPH[MAPID]) return 0;
  const C = RHW.city[MAPID]; if (!C) return 0;
  const done = new Set(S.rhw || []), reg = rhwRegion(), inR = (x, z) => reg[tileIdx(x, z)];
  // nodi già fatti (anche dopo un caricamento)
  RHW.keyNode.clear(); for (const n of nodes.values()) if (n.rhw) RHW.keyNode.set(rhwKey(n.x, n.z), n.id);
  let made = 0;
  const nodeAt = (x, z, elev) => {
    const key = rhwKey(x, z), id = RHW.keyNode.get(key); const old = id != null ? nodes.get(id) : null; if (old) return old;
    if (elev === 0 && isWater(x, z)) elev = 1;
    const n = makeNode(x, z, elev); n.keep = true; n.rhw = 1; RHW.keyNode.set(key, n.id); return n;
  };
  for (const c of C.chains) {
    const n = c.xs.length;
    for (let i = 0; i < n - 1; i++) {
      const id = c.base + i; if (done.has(id)) continue;
      if (!inR(c.xs[i], c.zs[i]) && !inR(c.xs[i + 1], c.zs[i + 1])) continue;
      const fl = +c.f[i], el = fl === 1 ? 1 : fl === 2 ? -2 : 0;
      const ea = el && (i === 0 || +c.f[i - 1] === fl) ? el : 0, eb = el && (i === n - 2 || +c.f[i + 1] === fl) ? el : 0;
      const a = nodeAt(c.xs[i], c.zs[i], ea), b = nodeAt(c.xs[i + 1], c.zs[i + 1], eb);
      if (a === b) { done.add(id); continue; }
      let se = el; if (!se && (a.elev > 0 || b.elev > 0)) se = 1;
      const s = addSeg(a, b, RHW_TYPE[c.kind], null, null, se); s.pre = true; done.add(id); made++;
    }
  }
  S.rhw = [...done];
  // dove l'autostrada continua oltre le caselle (o finisce in una strada normale) c'è l'uscita verso il resto del mondo
  for (const [key, nid] of RHW.keyNode) {
    const nd = nodes.get(nid); if (!nd) continue; const l = C.adj.get(key) || [];
    const open = l.some(p => !done.has(p)), main = nd.segs.some(sid => { const s = segs.get(sid); return s && s.type !== 'ramp'; });
    nd.outside = open || (l.length <= 1 && main && nd.segs.length === 1);
  }
  rhwDrawRest(C, done);
  if (made) { netDirty = true; roadVersion++; }
  return made;
}
// il resto delle autostrade: un nastro grigio leggero (un solo disegno per tutta la mappa)
function rhwDrawRest(C, done, wide) {
  if (RHW.mesh) { scene.remove(RHW.mesh); RHW.mesh.geometry.dispose(); RHW.mesh = null; }
  if (!C) return;
  const p = [];
  for (const c of C.chains) {
    const w = (c.kind >= 2 ? 3.5 : c.kind === 1 ? 11 : 6.5) * (wide ? (c.kind >= 2 ? 12 : 18) : 1);
    for (let i = 0; i < c.xs.length - 1; i++) {
      if (done.has(c.base + i) || c.f[i] === '2') continue;
      const ax = c.xs[i], az = c.zs[i], bx = c.xs[i + 1], bz = c.zs[i + 1], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l * w, nz = (bx - ax) / l * w;
      const br = wide ? 25 : c.f[i] === '1' ? 9 : 1.2, ya = Math.max(getH(ax, az), WATER) + br, yb = Math.max(getH(bx, bz), WATER) + br;
      p.push(ax - nx, ya, az - nz, ax + nx, ya, az + nz, bx + nx, yb, bz + nz, ax - nx, ya, az - nz, bx + nx, yb, bz + nz, bx - nx, yb, bz - nz);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  RHW.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: wide ? 0xffa030 : 0x585b61, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  RHW.mesh.renderOrder = 2; RHW.mesh.frustumCulled = false; scene.add(RHW.mesh);
}
function rhwClear() { if (RHW.mesh) { scene.remove(RHW.mesh); RHW.mesh.geometry.dispose(); RHW.mesh = null; } RHW.keyNode.clear(); }
const _resetWorld12 = resetWorld;
resetWorld = function () { rhwClear(); _resetWorld12(); };

// ---------- dove parte la città ----------
function startCenter() { return S && S.start ? { x: S.start[0], z: S.start[1] } : MAPH[MAPID] ? { x: -640, z: 640 } : { x: -700, z: -500 }; }
const _preplaceReal12 = preplaceReal;
preplaceReal = function () {
  const c = startCenter();
  const made = RHW.ready && RHW.city[MAPID] ? rhwSync() : 0;
  const hasHw = made > 0 && [...nodes.values()].some(n => n.rhw && n.segs.length);
  const chain = (pts, type, outsideEnds, rail) => { let prev = null; pts.forEach((p, i) => { const n = makeNode(p.x, p.z, 0); n.keep = true; if (rail) n.rail = true; if (outsideEnds.includes(i)) n.outside = true; if (prev) { const s = addSeg(prev, n, type); s.pre = true; } prev = n; }); };
  let best = null;
  if (!hasHw || !outsideNodes().length) best = rhwLink(c, chain);
  if (!best && !outsideNodes().length) { // mappa senza autostrade raggiungibili: collegamento inventato verso il bordo
    const o = { water: 30, slope: 120, pull: 900, cx: c.x, cz: c.z };
    for (const [a, b] of [['W', 'E'], ['N', 'S']]) { const r = autoRoute(a, b, o); if (r && (!best || r.cost < best.cost)) best = r; }
    if (best) chain(best.pts, 'highway', [0, best.pts.length - 1], false);
  }
  rhwRail(c, chain, best, -1060, -1140);
};
// la ferrovia parte vicino alla città: se lì c'è acqua provo altri punti intorno
function rhwRail(c, chain, best, ox, oz) {
  for (const [a, b] of [[ox, oz], [-ox, oz], [ox, -oz], [-ox, -oz], [0, oz], [ox, 0], [0, -oz], [-ox, 0]]) {
    let rb = null;
    for (const sd of ['W', 'N', 'E', 'S']) { const r = autoRoute('C', sd, { water: 60, slope: 300, pull: 1e9, cx: c.x + a, cz: c.z + b, avoid: best ? best.pts : null }); if (r && (!rb || r.cost < rb.cost)) rb = r; }
    if (rb) { rb.pts.reverse(); chain(rb.pts, 'rail', [0], true); return true; }
  }
  return false;
}
// lontano dalle autostrade: un viale va dalla città fino all'uscita vera più vicina (la fine di una rampa, dove nella realtà arrivano le strade normali)
function rhwLink(c, chain) {
  const C = RHW.city[MAPID]; if (!C) return null;
  const cand = [];
  for (const ch of C.chains) {
    if (ch.kind < 2) continue;
    for (const i of [0, ch.xs.length - 1]) {
      const x = ch.xs[i], z = ch.zs[i]; if (Math.abs(x) > HALF - 2000 || Math.abs(z) > HALF - 2000 || isWater(x, z)) continue;
      const l = C.adj.get(rhwKey(x, z)); if (!l || l.length !== 1) continue;
      cand.push({ x, z, d: Math.hypot(x - c.x, z - c.z), ex: ch.kind === 3 || i > 0, en: ch.kind === 3 || i === 0 });
    }
  }
  // serve uno svincolo completo: una rampa per uscire dall'autostrada e una per entrarci
  for (const q of cand) { let ex = q.ex, en = q.en; for (const r of cand) if (Math.abs(r.x - q.x) < 700 && Math.abs(r.z - q.z) < 700 && Math.hypot(r.x - q.x, r.z - q.z) < 700) { ex = ex || r.ex; en = en || r.en; } q.full = ex && en; }
  cand.sort((a, b) => (a.full ? a.d : a.d + 1e6) - (b.full ? b.d : b.d + 1e6));
  const pick = []; for (const q of cand) { if (pick.length >= 4) break; if (q.d > 1500 && pick.every(p => Math.hypot(p.x - q.x, p.z - q.z) > 2500)) pick.push(q); }
  let best = null;
  for (const q of pick) { const r = autoRoute({ x: c.x, z: c.z }, { x: q.x, z: q.z }, { water: 30, slope: 120, pull: 1e9, cx: c.x, cz: c.z }); if (r && (!best || r.cost < best.cost)) { best = r; best.q = q; } }
  if (!best) return null;
  S.rhwX = [...(S.rhwX || []), tileIdx(best.q.x, best.q.z)];
  rhwSync();
  const end = nodes.get(RHW.keyNode.get(rhwKey(best.q.x, best.q.z))); if (!end) return null;
  const pts = best.pts.slice(0, -1);
  if (pts.length > 1 && Math.hypot(pts[pts.length - 1].x - end.x, pts[pts.length - 1].z - end.z) < 300) pts.pop();
  let prev = null;
  pts.forEach(p => { const n = makeNode(p.x, p.z, 0); n.keep = true; if (prev) { const s = addSeg(prev, n, 'large'); s.pre = true; } prev = n; });
  if (prev) { const s = addSeg(prev, end, 'large'); s.pre = true; }
  // le altre rampe dello svincolo (entrata e uscita) arrivano allo stesso viale, come nella realtà arrivano alla stessa strada
  for (const n of [...nodes.values()]) {
    if (!n.rhw || n === end || n.segs.length !== 1 || segs.get(n.segs[0])?.type !== 'ramp') continue;
    const d = Math.hypot(n.x - end.x, n.z - end.z); if (d < 5 || d > 700) continue;
    const s = addSeg(end, n, 'medium'); s.pre = true;
  }
  return best;
}
// mappa inventata: con la casella scelta, autostrada e ferrovia passano vicino
const _preplace12 = preplace;
preplace = function () {
  if (MAPH[MAPID] || !S.start) return _preplace12();
  const c = startCenter();
  const chain = (pts, type, ends, rail) => { let prev = null; pts.forEach((p, i) => { const n = makeNode(p.x, p.z, 0); n.keep = true; if (rail) n.rail = true; if (ends.includes(i)) n.outside = true; if (prev) { const s = addSeg(prev, n, type); s.pre = true; } prev = n; }); };
  let best = null; const o = { water: 30, slope: 120, pull: 900, cx: c.x, cz: c.z - 250 };
  for (const [a, b] of [['W', 'E'], ['N', 'S']]) { const r = autoRoute(a, b, o); if (r && (!best || r.cost < best.cost)) best = r; }
  if (best) chain(best.pts, 'highway', [0, best.pts.length - 1], false);
  rhwRail(c, chain, best, -400, -680);
};
// comprando caselle le autostrade vere lì vicino diventano strade vere
const _buyTile12 = buyTile;
buyTile = function (i) { const had = TILES[i]; _buyTile12(i); if (!had && TILES[i] && MAPH[MAPID]) { rhwSync(); flushRoads?.(); } };
// la prima volta che si vede una partita (nuova o caricata): nodi delle autostrade vere, uscite e nastro grigio
const _computeNetworks12 = computeNetworks;
const RHWS = new WeakSet();
computeNetworks = function () {
  if (typeof S !== 'undefined' && S && !RHWS.has(S) && RHW.ready) {
    RHWS.add(S);
    for (const [id, el] of S.rhwN || []) { const n = nodes.get(id); if (n) { n.rhw = 1; n.elev = el; } }
    if (MAPH[MAPID]) {
      if (!S.rhw) { // partita salvata prima delle autostrade vere: non tocco la città già fatta, quelle vere arrivano comprando caselle nuove
        const C = RHW.city[MAPID], reg = rhwRegion(), skip = [];
        if (C) for (const c of C.chains) for (let i = 0; i < c.xs.length - 1; i++) if (reg[tileIdx(c.xs[i], c.zs[i])] || reg[tileIdx(c.xs[i + 1], c.zs[i + 1])]) skip.push(c.base + i);
        S.rhw = skip;
      }
      rhwSync();
    }
  }
  _computeNetworks12();
};
// i salvataggi ricordano quali nodi sono delle autostrade vere (e se sono in galleria)
const _serialize12 = serialize;
serialize = function () { S.rhwN = [...nodes.values()].filter(n => n.rhw).map(n => [n.id, n.elev || 0]); return _serialize12(); };
if (typeof __cm !== 'undefined') __cm.serialize = serialize;
// prima di preparare una partita aspetto che i dati delle autostrade siano pronti
const _runLoad12 = runLoad;
runLoad = async function (g, t) { await RHW_READY; return _runLoad12(g, t); };

// ---------- scelta della casella di partenza ----------
function startPick() {
  S.picking = true; setSpeed(0); setTool('pickstart');
  terrU.uTileShow.value = 0.9;
  const c = startCenter(); cam.tx = c.x; cam.tz = c.z; cam.dist = 30000; cam.pitch = 1.42;
  if (MAPH[MAPID] && RHW.ready) rhwDrawRest(RHW.city[MAPID], new Set(), true);
  toast(L('Scegli dove nasce la tua città: clicca una casella sulla mappa (avrai le 3 x 3 caselle intorno).', 'Choose where your city starts: click a tile on the map (you get the 3 x 3 tiles around it).') + (MAPH[MAPID] ? ' ' + L('Le strisce arancioni sono le autostrade vere.', 'The orange stripes are the real highways.') : ''), 12000);
}
let PICKC = null;
function pickInfo(g) {
  const ti = clamp(Math.floor((g.x + HALF) / TILE), 1, NT - 2), tj = clamp(Math.floor((g.z + HALF) / TILE), 1, NT - 2);
  if (PICKC && PICKC.ti === ti && PICKC.tj === tj && PICKC.map === MAPID) return PICKC;
  let w = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) w += tileWater((tj + b) * NT + ti + a); w /= 9;
  let hw = 0; const C = RHW.city[MAPID];
  if (C) { const x0 = -HALF + (ti - 2) * TILE, x1 = -HALF + (ti + 3) * TILE, z0 = -HALF + (tj - 2) * TILE, z1 = -HALF + (tj + 3) * TILE; for (const c of C.chains) { for (let i = 0; i < c.xs.length; i++) if (c.xs[i] > x0 && c.xs[i] < x1 && c.zs[i] > z0 && c.zs[i] < z1) { hw++; break; } } }
  return PICKC = { ti, tj, w, hw, map: MAPID, cx: -HALF + (ti + 0.5) * TILE, cz: -HALF + (tj + 0.5) * TILE };
}
function pickStartAt(g) {
  const p = pickInfo(g);
  if (p.w > 0.75) { toast(L('Lì è quasi tutta acqua: scegli un posto con più terra', 'That is almost all water: pick a spot with more land'), 3000); return; }
  TILES.fill(0); for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) TILES[(p.tj + b) * NT + p.ti + a] = 1;
  S.start = [p.cx, p.cz]; S.picking = false; S.rhw = [];
  gateVer++; actWin(); updateTileTex();
  setTool(null); terrU.uTileShow.value = 0.35;
  preplace(); flushRoads?.();
  netDirty = true; computeNetworks(); computeGrids();
  cam.tx = p.cx; cam.tz = p.cz; cam.dist = 2600; cam.pitch = 0.9;
  setSpeed(1); buildToolbar();
  toast(L('Benvenuto sindaco! Collega una strada all\'autostrada, poi disegna le zone. Servono elettricità e acqua.', 'Welcome, mayor! Connect a road to the highway, then paint zones. You will need power and water.'), 9000);
}
const _toolClick12 = toolClick;
toolClick = function (e) { if (TOOL.kind === 'pickstart') { const g = groundAt(e.clientX, e.clientY); if (g) pickStartAt(g); return; } _toolClick12(e); };
const _updateGhost12 = updateGhost;
updateGhost = function () {
  if (S && S.picking && TOOL.kind !== 'pickstart') { setTool('pickstart'); terrU.uTileShow.value = 0.9; }
  if (TOOL.kind !== 'pickstart') return _updateGhost12();
  clearGhost(); const g = mouse.g; if (!g) return;
  const p = pickInfo(g); ghost.add(circle(p.cx, p.cz, TILE * 1.5, p.w > 0.75 ? ghostMatBad : ghostMatOk));
  tipShow(`<b>${L('Inizia qui', 'Start here')}</b> · 3 x 3 ${L('caselle', 'tiles')}${p.w > 0.05 ? ' · 🌊 ' + Math.round(p.w * 100) + '% ' + L('acqua', 'water') : ''}${MAPH[MAPID] ? ' · ' + (p.hw ? '🛣️ ' + L('autostrada vicina', 'highway nearby') : L('nessuna autostrada vicina: ne faremo una di collegamento', 'no highway nearby: we will add a link road')) : ''}`);
};
if (typeof __cm !== 'undefined') Object.assign(__cm, { RHW, RHW_READY, rhwSync, startPick, pickStartAt, newGame });
