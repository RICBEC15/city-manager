// =====================================================================
//  Strade, binari, incroci, grafo e percorsi
// =====================================================================
const LW = 3.3; // larghezza corsia
const RT = {
  small:   { w: 10, lanes: 1, two: true,  speed: 11, cost: 22,  upk: 0.035, zone: true,  ms: 0, med: 0.2, side: 2,   n: () => L('Strada piccola', 'Small road'), d: () => L('2 corsie, per i quartieri', '2 lanes, for neighbourhoods') },
  gravel:  { w: 9,  lanes: 1, two: true,  speed: 7,  cost: 10,  upk: 0.012, zone: true,  ms: 0, med: 0,   side: 0,   gravel: true, n: () => L('Strada sterrata', 'Gravel road'), d: () => L('Economica e lenta, per la campagna', 'Cheap and slow, for the countryside') },
  medium:  { w: 16, lanes: 2, two: true,  speed: 14, cost: 45,  upk: 0.07,  zone: true,  ms: 1, med: 0.3, side: 1.7, n: () => L('Strada media', 'Medium road'), d: () => L('4 corsie', '4 lanes') },
  large:   { w: 26, lanes: 3, two: true,  speed: 17, cost: 95,  upk: 0.13,  zone: true,  ms: 3, med: 1.8, side: 1.6, n: () => L('Viale grande', 'Large avenue'), d: () => L('6 corsie con alberi in mezzo', '6 lanes with trees in the middle') },
  oneway:  { w: 10, lanes: 2, two: false, speed: 13, cost: 30,  upk: 0.045, zone: true,  ms: 1, med: 0,   side: 1.7, n: () => L('Senso unico', 'One-way road'), d: () => L('2 corsie, una direzione', '2 lanes, one direction') },
  highway: { w: 22, lanes: 2, two: true,  speed: 28, cost: 180, upk: 0.25,  zone: false, ms: 4, med: 1.6, side: 0.8, hw: true, n: () => L('Autostrada 2+2', 'Highway 2+2'), d: () => L('Doppio senso, 2 corsie per lato', 'Two-way, 2 lanes each side') },
  hw3:     { w: 29, lanes: 3, two: true,  speed: 28, cost: 260, upk: 0.34,  zone: false, ms: 5, med: 1.6, side: 0.8, hw: true, n: () => L('Autostrada 3+3', 'Highway 3+3'), d: () => L('Doppio senso, 3 corsie per lato', 'Two-way, 3 lanes each side') },
  hwo2:    { w: 10, lanes: 2, two: false, speed: 28, cost: 100, upk: 0.13,  zone: false, ms: 4, med: 0,   side: 0.8, hw: true, n: () => L('Autostrada senso unico 2', 'One-way highway 2'), d: () => L('2 corsie in una direzione: fanne due vicine', '2 lanes one way: build them in pairs') },
  hwo3:    { w: 13, lanes: 3, two: false, speed: 28, cost: 140, upk: 0.18,  zone: false, ms: 5, med: 0,   side: 0.8, hw: true, n: () => L('Autostrada senso unico 3', 'One-way highway 3'), d: () => L('3 corsie in una direzione', '3 lanes one way') },
  hwo4:    { w: 16, lanes: 4, two: false, speed: 28, cost: 180, upk: 0.23,  zone: false, ms: 6, med: 0,   side: 0.8, hw: true, n: () => L('Autostrada senso unico 4', 'One-way highway 4'), d: () => L('4 corsie in una direzione', '4 lanes one way') },
  ramp:    { w: 8,  lanes: 1, two: false, speed: 20, cost: 80,  upk: 0.1,   zone: false, ms: 4, med: 0,   side: 0.8, hw: true, n: () => L('Autostrada 1 corsia (rampa)', '1-lane highway (ramp)'), d: () => L('Senso unico veloce per gli svincoli', 'Fast one-way for interchanges') },
  rail:    { w: 8,  lanes: 1, two: true,  speed: 30, cost: 110, upk: 0.1,   zone: false, ms: 5, rail: true, n: () => L('Binari', 'Railway'), d: () => L('Per treni passeggeri e merci', 'For passenger and cargo trains') },
  pedst:   { w: 10, lanes: 1, two: true,  speed: 4,  cost: 30,  upk: 0.03,  zone: true,  ms: 1, med: 0,   side: 0,   pedst: true, n: () => L('Strada pedonale', 'Pedestrian street'), d: () => L('Solo pedoni e mezzi di servizio; si fanno le zone', 'Pedestrians and service vehicles only; zoneable') },
  asym21:  { w: 17, lanes: 2, lanesB: 1, two: true, speed: 13, cost: 36, upk: 0.055, zone: true, ms: 1, med: 0.2, side: 1.7, n: () => L('Strada 3 corsie (2+1)', '3-lane road (2+1)'), d: () => L('Due corsie da una parte e una dall\'altra', 'Two lanes one way, one the other') },
  asym31:  { w: 24, lanes: 3, lanesB: 1, two: true, speed: 14, cost: 50, upk: 0.075, zone: true, ms: 2, med: 0.3, side: 1.7, n: () => L('Strada 4 corsie (3+1)', '4-lane road (3+1)'), d: () => L('Tre corsie da una parte e una dall\'altra', 'Three lanes one way, one the other') },
  asym32:  { w: 24, lanes: 3, lanesB: 2, two: true, speed: 15, cost: 62, upk: 0.09, zone: true, ms: 2, med: 0.3, side: 1.6, n: () => L('Strada 5 corsie (3+2)', '5-lane road (3+2)'), d: () => L('Tre corsie da una parte e due dall\'altra', 'Three lanes one way, two the other') },
  meddiv:  { w: 20, lanes: 2, two: true, speed: 15, cost: 58, upk: 0.08, zone: true, ms: 2, med: 1.8, side: 1.6, n: () => L('Strada 4 corsie divisa', 'Divided 4-lane road'), d: () => L('4 corsie con aiuola in mezzo: niente svolte a sinistra fuori dagli incroci', '4 lanes with a central median') },
  oneway5: { w: 21, lanes: 5, two: false, speed: 15, cost: 70, upk: 0.1, zone: true, ms: 3, med: 0, side: 1.6, n: () => L('Senso unico 5 corsie', '5-lane one-way'), d: () => L('Grande senso unico per il centro', 'Big one-way for downtown') },
  gravel1: { w: 6,  lanes: 1, two: false, speed: 7, cost: 7, upk: 0.008, zone: true, ms: 0, med: 0, side: 0, gravel: true, n: () => L('Sterrata a senso unico', 'One-way gravel road'), d: () => L('Stretta ed economica', 'Narrow and cheap') },
  alley:   { w: 7,  lanes: 1, two: true, speed: 6, cost: 14, upk: 0.02, zone: true, ms: 0, med: 0, side: 0, alley: true, n: () => L('Vicolo', 'Alley'), d: () => L('Stretto, senza marciapiedi, per lotti piccoli', 'Narrow, no sidewalks') },
  alley1:  { w: 5,  lanes: 1, two: false, speed: 6, cost: 10, upk: 0.015, zone: true, ms: 0, med: 0, side: 0, alley: true, n: () => L('Vicolo a senso unico', 'One-way alley'), d: () => L('Il più stretto di tutti', 'The narrowest of all') },
  parkS:   { w: 20, lanes: 1, two: true, speed: 10, cost: 32, upk: 0.04, zone: true, ms: 1, med: 0.2, side: 1.8, park: 'perp', n: () => L('Strada piccola con parcheggi a pettine', 'Small road with perpendicular parking'), d: () => L('Posti auto ai lati: negozi e uffici trovano parcheggio', 'Parking on both sides: shops and offices find parking') },
  parkM:   { w: 24, lanes: 2, two: true, speed: 13, cost: 60, upk: 0.08, zone: true, ms: 2, med: 0.3, side: 1.6, park: 'angle', n: () => L('Strada media con parcheggi obliqui', 'Medium road with angled parking'), d: () => L('4 corsie e posti auto obliqui ai lati', '4 lanes and angled parking') },
  parkD:   { w: 30, lanes: 2, two: true, speed: 14, cost: 72, upk: 0.09, zone: true, ms: 3, med: 1.8, side: 1.6, park: 'angle', n: () => L('Strada divisa con parcheggi', 'Divided road with parking'), d: () => L('Aiuola in mezzo e posti auto ai lati', 'Median and parking on both sides') },
  parkA:   { w: 13, lanes: 1, two: false, speed: 6, cost: 22, upk: 0.025, zone: true, ms: 1, med: 0, side: 0, alley: true, park: 'angle', n: () => L('Vicolo con parcheggi', 'Alley with parking'), d: () => L('Vicolo a senso unico con posti auto', 'One-way alley with parking') },
  pedsm:   { w: 6,  lanes: 1, two: true, speed: 4, cost: 20, upk: 0.02, zone: true, ms: 1, med: 0, side: 0, pedst: true, n: () => L('Strada pedonale piccola', 'Small pedestrian street'), d: () => L('Stretta, solo pedoni e servizi', 'Narrow, pedestrians and services only') },
  quay:    { w: 16, lanes: 2, two: true, speed: 13, cost: 120, upk: 0.08, zone: true, ms: 2, med: 0.3, side: 1.7, quay: true, n: () => L('Banchina con strada', 'Quay road'), d: () => L('Strada sul bordo dell\'acqua con muro di pietra: crea terra dove passa', 'Road on the water\'s edge with a stone wall: makes land where it goes') },
  path:    { w: 4,  lanes: 0, two: true,  speed: 2,  cost: 8,   upk: 0.01,  zone: false, ms: 0, ped: true, n: () => L('Sentiero pedonale', 'Footpath'), d: () => L('Passeggiate e lungomare', 'Walks and waterfronts') },
};
const ELEV = 11;
// nomi delle vie (inventati)
const STREET_IT = ['dei Tigli', 'delle Rose', 'dei Pini', 'del Mulino', 'delle Querce', 'dei Ciliegi', 'del Sole', 'della Fonte', 'dei Gelsi', 'delle Viole', 'del Lago', 'dei Castagni', 'delle Betulle', 'del Ponte', 'dei Platani', 'della Collina', 'degli Ulivi', 'delle Mimose', 'dei Faggi', 'del Bosco', 'della Stazione', 'dei Girasoli', 'delle Ginestre', 'del Porto', 'dei Narcisi', 'dell\'Orto', 'dei Salici', 'delle Acacie', 'del Vento', 'della Valle', 'dei Mandorli', 'delle Lucciole', 'del Fiume', 'dei Glicini', 'della Pace', 'delle Rondini', 'dei Larici', 'del Faro', 'delle Margherite', 'dei Pioppi'];
const STREET_EN = ['Linden', 'Rose', 'Pine', 'Mill', 'Oak', 'Cherry', 'Sunny', 'Spring', 'Mulberry', 'Violet', 'Lake', 'Chestnut', 'Birch', 'Bridge', 'Plane Tree', 'Hill', 'Olive', 'Mimosa', 'Beech', 'Wood', 'Station', 'Sunflower', 'Broom', 'Harbour', 'Daffodil', 'Orchard', 'Willow', 'Acacia', 'Windy', 'Valley', 'Almond', 'Firefly', 'River', 'Wisteria', 'Peace', 'Swallow', 'Larch', 'Lighthouse', 'Daisy', 'Poplar'];
const STREET_PRE = { asym21: ['Via', 'Street'], asym31: ['Corso', 'Road'], asym32: ['Corso', 'Road'], meddiv: ['Viale', 'Boulevard'], oneway5: ['Corso', 'Road'], gravel1: ['Strada', 'Lane'], alley: ['Vicolo', 'Alley'], alley1: ['Vicolo', 'Alley'], parkS: ['Via', 'Street'], parkM: ['Corso', 'Road'], parkD: ['Viale', 'Boulevard'], parkA: ['Vicolo', 'Alley'], pedsm: ['Via', 'Walk'], quay: ['Lungomare', 'Quay'], pedst: ['Via', 'Walk'], small: ['Via', 'Street'], gravel: ['Strada', 'Lane'], medium: ['Corso', 'Road'], large: ['Viale', 'Avenue'], oneway: ['Via', 'Street'], path: ['Sentiero', 'Path'] };
let nextStreetName = 0, forceStreetName = null;
function streetName(s) { if (s.nm == null || !STREET_PRE[s.type]) return ''; const k = s.nm % STREET_IT.length, rep = Math.floor(s.nm / STREET_IT.length), p = STREET_PRE[s.type]; return (SET.lang === 'en' ? STREET_EN[k] + ' ' + p[1] : p[0] + ' ' + STREET_IT[k]) + (rep ? ' ' + (rep + 1) : ''); }
function nameSeg(s) {
  if (!STREET_PRE[s.type]) return;
  if (forceStreetName != null) { s.nm = forceStreetName; return; }
  const dir = q => { const p0 = q.pts[0], p1 = q.pts[q.pts.length - 1]; return Math.atan2(p1.z - p0.z, p1.x - p0.x); };
  const d0 = dir(s);
  for (const nid of [s.a, s.b]) { const n = nodes.get(nid); if (!n) continue; for (const id of n.segs) { const q = segs.get(id); if (!q || q === s || q.nm == null || q.type !== s.type) continue; const dd = Math.abs(Math.sin(dir(q) - d0)); if (dd < 0.45) { s.nm = q.nm; return; } } }
  s.nm = nextStreetName++;
}
const nodes = new Map(), segs = new Map();
let nextNodeId = 1, nextSegId = 1, roadVersion = 0;
const SB = 1600, SBC = MAP / SB; // secchi spaziali 64 m per segmenti
const segBuckets = new Map();
function bucketAddSeg(s) {
  s.bk = new Set();
  for (const p of s.pts) for (const [ox, oz] of [[0, 0], [15, 15], [-15, -15], [15, -15], [-15, 15]]) s.bk.add(Math.floor((p.z + oz + HALF) / SBC) * SB + Math.floor((p.x + ox + HALF) / SBC));
  for (const b of s.bk) { if (!segBuckets.has(b)) segBuckets.set(b, new Set()); segBuckets.get(b).add(s.id); }
}
function bucketDelSeg(s) { if (s.bk) for (const b of s.bk) segBuckets.get(b)?.delete(s.id); }
function segsNear(x, z, r) {
  const out = new Set();
  const b0 = Math.floor((x - r + HALF) / SBC), b1 = Math.floor((x + r + HALF) / SBC), c0 = Math.floor((z - r + HALF) / SBC), c1 = Math.floor((z + r + HALF) / SBC);
  for (let bz = c0; bz <= c1; bz++) for (let bx = b0; bx <= b1; bx++) { const l = segBuckets.get(bz * SB + bx); if (l) for (const id of l) out.add(id); }
  return out;
}
function bez(ax, az, cx, cz, bx, bz, t) { const u = 1 - t; return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * az + 2 * u * t * cz + t * t * bz]; }
const TRENCH = 7; // profondità dei binari in trincea
const TUNNEL = 16; // profondità delle gallerie
const deepPt = (s, p) => s.elev <= -2 && p.h - p.y > 6; // punto dentro la galleria
function groundTarget(x, z, elev) { if (elev <= -2) { const r = 30, h = Math.min(getH(x, z), getH(x + r, z), getH(x - r, z), getH(x, z + r), getH(x, z - r)); return h - TUNNEL; } if (elev < 0) { const r = 44, hh = (getH(x + r, z) + getH(x - r, z) + getH(x, z + r) + getH(x, z - r)) / 4; return Math.max(hh, 1.5) - TRENCH; } const h = getH(x, z); if (elev) return Math.max(h, 0) + ELEV * elev; return h < 1.2 ? 7 : h; }
function nodeY(x, z, elev) { return groundTarget(x, z, elev); }
function makeNode(x, z, elev = 0, y) { const n = { id: nextNodeId++, x, z, y: y ?? nodeY(x, z, elev), segs: [], elev }; nodes.set(n.id, n); return n; }

function computeSegPts(s) {
  const a = nodes.get(s.a), b = nodes.get(s.b);
  const cx = s.cx ?? (a.x + b.x) / 2, cz = s.cz ?? (a.z + b.z) / 2;
  let L0 = 0, px = a.x, pz = a.z;
  for (let i = 1; i <= 16; i++) { const [x, z] = bez(a.x, a.z, cx, cz, b.x, b.z, i / 16); L0 += Math.hypot(x - px, z - pz); px = x; pz = z; }
  const n = Math.max(2, Math.ceil(L0 / 8));
  const pts = [], cum = [0]; let len = 0;
  for (let i = 0; i <= n; i++) { const [x, z] = bez(a.x, a.z, cx, cz, b.x, b.z, i / n); pts.push({ x, z, y: 0, h: getH(x, z) }); if (i) { len += Math.hypot(x - pts[i - 1].x, z - pts[i - 1].z); cum.push(len); } }
  // altezze: segue il terreno, ponti sopra l'acqua, rampe dolci
  const sl = 0.11;
  for (let i = 0; i <= n; i++) pts[i].y = (i === 0) ? a.y : (i === n ? b.y : groundTarget(pts[i].x, pts[i].z, s.elev));
  for (let i = 1; i <= n; i++) pts[i].y = Math.max(pts[i].y, pts[i - 1].y - sl * (cum[i] - cum[i - 1]));
  for (let i = n - 1; i >= 0; i--) pts[i].y = Math.max(pts[i].y, pts[i + 1].y - sl * (cum[i + 1] - cum[i]));
  for (let i = 0; i <= n; i++) {
    const lim = Math.min(a.y + sl * cum[i] * 1.6, b.y + sl * (len - cum[i]) * 1.6);
    pts[i].y = s.elev < 0 ? Math.min(pts[i].y, lim) : Math.max(pts[i].h, Math.min(pts[i].y, lim));
  }
  pts[0].y = a.y; pts[n].y = b.y;
  if (RT[s.type].quay && !s.elev) for (let i = 1; i < n; i++) if (pts[i].h < 2.5) pts[i].y = Math.max(2.5, Math.min(pts[i].y, 2.5 + Math.min(cum[i], len - cum[i]) * 0.1));
  s.pts = pts; s.cum = cum; s.len = len;
}
function flattenUnder(s) {
  const rt = RT[s.type], hw = rt.w / 2;
  let i0 = 1e9, j0 = 1e9, i1 = -1, j1 = -1;
  for (const p of s.pts) {
    if (deepPt(s, p)) continue;
    if (!rt.quay && (p.y - p.h > 4.5 || p.h < 0.8)) continue;
    const tr = s.elev < 0, r = tr ? hw + HC * 1.25 : rt.quay ? hw + 1.5 : hw + 10, ci = Math.round((p.x + HALF) / HC), cj = Math.round((p.z + HALF) / HC), rr = Math.ceil(r / HC);
    for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) {
      if (i < 0 || j < 0 || i >= HN || j >= HN) continue;
      const x = -HALF + i * HC, z = -HALF + j * HC, d = Math.hypot(x - p.x, z - p.z);
      if (d > r) continue;
      const k = j * HN + i; if (H[k] < 0.8 && !rt.quay) continue;
      const w = tr || rt.quay ? 1 : d < hw + 2 ? 1 : smooth(r, hw + 2, d) * 0.85;
      const target = p.y - 0.3;
      H[k] = lerp(H[k], target, w);
      i0 = Math.min(i0, i); j0 = Math.min(j0, j); i1 = Math.max(i1, i); j1 = Math.max(j1, j);
    }
  }
  if (i1 >= 0) { updateTerrain(i0 - 1, j0 - 1, i1 + 1, j1 + 1); terrainChanged(i0, j0, i1, j1); }
}
const changedTerrain = [];
function terrainChanged(i0, j0, i1, j1) { changedTerrain.push([i0, j0, i1, j1]); }

// ---------- archi del grafo ----------
let nextEdgeId = 1;
function makeEdges(s) {
  const rt = RT[s.type];
  const mk = dir => {
    const pts = dir === 1 ? s.pts : s.pts.slice().reverse();
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    const lanes = rt.ped ? 0 : dir === -1 && rt.lanesB ? rt.lanesB : rt.lanes;
    return { id: nextEdgeId++, seg: s, dir, from: dir === 1 ? s.a : s.b, to: dir === 1 ? s.b : s.a, pts, cum, len: cum[cum.length - 1], lanes, speed: rt.speed, cars: Array.from({ length: Math.max(lanes, 1) }, () => []), flow: 0, dead: false, rail: !!rt.rail, ped: !!rt.ped };
  };
  s.edges = [mk(1)];
  if (rt.two) s.edges.push(mk(-1));
}
function laneOffset(e, k) {
  const rt = RT[e.seg.type];
  const lh = S?.opts?.leftHand ? -1 : 1; // guida a sinistra: tutto specchiato
  if (rt.rail) return rt.two ? 2 * lh : 0;
  if (rt.two) return (rt.med + (k + 0.5) * LW) * lh;
  return (k + 0.5) * LW - e.lanes * LW / 2;
}

// ---------- aggiunta / rimozione ----------
function addSeg(a, b, type, cx = null, cz = null, elev = 0, id = null) {
  const s = { id: id ?? nextSegId++, a: a.id, b: b.id, type, cx, cz, elev, cells: [] };
  if (id) nextSegId = Math.max(nextSegId, id + 1);
  computeSegPts(s);
  segs.set(s.id, s);
  a.segs.push(s.id); b.segs.push(s.id);
  makeEdges(s);
  if (s.nm == null) nameSeg(s);
  bucketAddSeg(s);
  flattenUnder(s);
  const hw = RT[s.type].w / 2 + (s.elev < 0 ? 16 : 2);
  for (const p of s.pts) clearTrees((x, z) => true, p.x, p.z, hw);
  s.chunk = tileIdx(s.pts[s.pts.length >> 1].x, s.pts[s.pts.length >> 1].z);
  markRoadDirty(s); updateNodeLights(a); updateNodeLights(b);
  roadVersion++; netDirty = true;
  if (RT[type].zone && !elev) genCells(s);
  invalidateCellsNear(s);
  return s;
}
function removeSeg(id, keepNodes = false) {
  const s = segs.get(id); if (!s) return;
  removeCellsOfSeg(s);
  for (const e of s.edges) { e.dead = true; for (const lane of e.cars) for (const v of lane.slice()) despawnVehicle(v); }
  bucketDelSeg(s);
  segs.delete(id);
  markRoadDirty(s);
  for (const nid of [s.a, s.b]) {
    const n = nodes.get(nid); if (!n) continue;
    n.segs = n.segs.filter(x => x !== id);
    if (!n.segs.length && !n.outside && !keepNodes && !n.keep) { nodes.delete(nid); markNodeDirty(n); }
    else updateNodeLights(n);
  }
  roadVersion++; netDirty = true;
  regenCellsNear(s);
}
const roadDirty = new Set();
function markRoadDirty(s) { roadDirty.add(s.chunk); const a = nodes.get(s.a), b = nodes.get(s.b); if (a) roadDirty.add(tileIdx(a.x, a.z)); if (b) roadDirty.add(tileIdx(b.x, b.z)); }
function markNodeDirty(n) { roadDirty.add(tileIdx(n.x, n.z)); }

// punto più vicino su un segmento
function nearestOnSeg(s, x, z) {
  let best = 1e18, bi = 0, bt = 0;
  for (let i = 0; i < s.pts.length - 1; i++) {
    const p = s.pts[i], q = s.pts[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - p.x) * dx + (z - p.z) * dz) / l2, 0, 1), px = p.x + dx * t, pz = p.z + dz * t, d = dist2(x, z, px, pz);
    if (d < best) { best = d; bi = i; bt = t; }
  }
  const p = s.pts[bi], q = s.pts[bi + 1];
  const along = s.cum[bi] + (s.cum[bi + 1] - s.cum[bi]) * bt;
  return { d: Math.sqrt(best), x: lerp(p.x, q.x, bt), z: lerp(p.z, q.z, bt), y: lerp(p.y, q.y, bt), i: bi, along, t: (bi + bt) / (s.pts.length - 1), tx: (q.x - p.x) / (s.cum[bi + 1] - s.cum[bi] || 1), tz: (q.z - p.z) / (s.cum[bi + 1] - s.cum[bi] || 1) };
}
function findNearSeg(x, z, r, filter) {
  let best = null;
  for (const id of segsNear(x, z, r + 30)) {
    const s = segs.get(id); if (!s || (filter && !filter(s))) continue;
    const o = nearestOnSeg(s, x, z);
    if (o.d < r + RT[s.type].w / 2 && (!best || o.d < best.d)) best = { seg: s, ...o };
  }
  return best;
}
function findNearNode(x, z, r, filter) {
  let best = null, bd = r * r;
  for (const id of segsNear(x, z, r)) {
    const s = segs.get(id); if (!s) continue;
    for (const nid of [s.a, s.b]) { const n = nodes.get(nid); if (!n || (filter && !filter(n))) continue; const d = dist2(x, z, n.x, n.z); if (d < bd) { bd = d; best = n; } }
  }
  return best;
}
// divide un segmento nel punto t (0..1) e restituisce il nuovo nodo
function splitSeg(s, t, elevOverride) {
  const a = nodes.get(s.a), b = nodes.get(s.b);
  const cx = s.cx ?? (a.x + b.x) / 2, cz = s.cz ?? (a.z + b.z) / 2;
  const c1x = lerp(a.x, cx, t), c1z = lerp(a.z, cz, t), c2x = lerp(cx, b.x, t), c2z = lerp(cz, b.z, t);
  const mx = lerp(c1x, c2x, t), mz = lerp(c1z, c2z, t);
  const near = nearestOnSeg(s, mx, mz);
  const keep = captureZones(s);
  const m = makeNode(mx, mz, s.elev, near.y);
  const curved = s.cx != null;
  const type = s.type, elev = s.elev;
  removeSeg(s.id, true);
  forceStreetName = s.nm ?? null;
  const s1 = addSeg(a, m, type, curved ? c1x : null, curved ? c1z : null, elev);
  const s2 = addSeg(m, b, type, curved ? c2x : null, curved ? c2z : null, elev);
  forceStreetName = null;
  for (const q of [s1, s2]) { if (s.barrier) q.barrier = true; if (s.pre) q.pre = true; }
  restoreZones(keep, [s1, s2]);
  return m;
}

// ---------- semafori ----------
function updateNodeLights(n) {
  const inc = [];
  for (const sid of n.segs) { const s = segs.get(sid); if (!s) continue; for (const e of s.edges) if (e.to === n.id && !e.rail && !e.ped) inc.push(e); }
  const big = n.segs.some(sid => { const s = segs.get(sid); return s && (s.type === 'medium' || s.type === 'large'); });
  const auto = inc.length >= 3 && big && !n.segs.some(sid => RT[segs.get(sid)?.type]?.hw && segs.get(sid).type !== 'ramp');
  n.light = n.lightMode === 'on' ? inc.length >= 3 : (n.lightMode === 'off' || n.lightMode === 'stop') ? false : auto;
  n.stop = n.lightMode === 'stop' && inc.length >= 2;
  n.groups = new Map();
  if (n.light && inc.length) {
    const ang = e => { const p = e.pts[e.pts.length - 2], q = e.pts[e.pts.length - 1]; return Math.atan2(q.z - p.z, q.x - p.x); };
    const a0 = ang(inc[0]);
    for (const e of inc) n.groups.set(e.id, Math.abs(Math.cos(ang(e) - a0)) > 0.7 ? 0 : 1);
  }
  markNodeDirty(n);
}
function lightGreen(n, e) {
  if (!n.light) return true;
  const g = n.groups.get(e.id) ?? 0, ph = (simClock + n.id * 7.3) % 36;
  return g === 0 ? ph < 16 : (ph >= 18 && ph < 34);
}

// ---------- percorsi (A*) ----------
class Heap { constructor() { this.a = []; } push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } } pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; } get size() { return this.a.length; } }
function edgeOk(e, mode) { if (e.dead) return false; if (mode === 'rail') return e.rail; if (mode === 'tram') return !e.rail && !e.ped && !!e.seg.tram; return !e.rail && !e.ped; }
function edgeCost(e, mode) { if (mode === 'rail') return e.len / e.speed; if (RT[e.seg.type].pedst) return e.len * 4; if (mode === 'young') return e.len / 10 + (nodes.get(e.to)?.light ? 2 : 0); if (mode === 'senior') return e.len / e.speed * (RT[e.seg.type].hw ? 1.7 : 1) * (1 + (e.seg.wear || 0)) + (nodes.get(e.to)?.light ? 3 : 2); const bl = (e.seg.busLane ? 1.25 : 1) * (1 + 0.5 * (e.seg.wear || 0)); const dens = e.lanes ? e.cars.reduce((a, l) => a + l.length, 0) / (e.lanes * Math.max(e.len, 10)) : 0; return bl * e.len / e.speed * (1 + dens * 60) + (nodes.get(e.to)?.light ? 6 : nodes.get(e.to)?.stop ? 3 : 1); }
// >0 svolta a destra, <0 a sinistra (guida a destra)
function turnSide(a, b) { const p = a.pts[a.pts.length - 2], q = a.pts[a.pts.length - 1], r = b.pts[0], t = b.pts[1]; const ax = q.x - p.x, az = q.z - p.z, bx = t.x - r.x, bz = t.z - r.z; const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1; return (ax * bz - az * bx) / (la * lb); }
// da (seg,along) a (seg,along) -> lista di tratti {e, s0, s1}
function findPath(fromSeg, fromAlong, toSeg, toAlong, mode = 'car') {
  if (!fromSeg || !toSeg) return null;
  const legs0 = [];
  for (const e of fromSeg.edges) if (edgeOk(e, mode)) { const s0 = e.dir === 1 ? fromAlong : fromSeg.len - fromAlong; legs0.push({ e, s0 }); }
  if (fromSeg === toSeg) {
    for (const { e, s0 } of legs0) { const s1 = e.dir === 1 ? toAlong : toSeg.len - toAlong; if (s1 >= s0) return [{ e, s0, s1 }]; }
  }
  const target = new Map();
  for (const e of toSeg.edges) if (edgeOk(e, mode)) target.set(e.from, { e, s1: e.dir === 1 ? toAlong : toSeg.len - toAlong });
  if (!target.size || !legs0.length) return null;
  const tn = nodes.get(toSeg.a);
  // ricerca per tratti (archi) così si rispettano i divieti di svolta
  const g = new Map(), prev = new Map(), h = new Heap(), E = new Map();
  const vmax = mode === 'rail' ? 30 : 28;
  const banned = (ie, oe) => { if (mode === 'rail' || mode === 'emerg') return false; const nn = nodes.get(ie.to); if (!nn) return false; const t = turnSide(ie, oe); return (nn.noLeft && t < -0.35) || (nn.noRight && t > 0.35); };
  for (const { e, s0 } of legs0) { const c = (e.len - s0) / e.speed; E.set(e.id, e); if (!g.has(e.id) || g.get(e.id) > c) { g.set(e.id, c); prev.set(e.id, { start: s0 }); const nn = nodes.get(e.to); h.push(c + Math.hypot(nn.x - tn.x, nn.z - tn.z) / vmax, e.id); } }
  let found = null, it = 0;
  while (h.size && it++ < 40000) {
    const [, eid] = h.pop(); const ie = E.get(eid), gn = g.get(eid);
    const tg = target.get(ie.to);
    if (tg && !banned(ie, tg.e)) { found = eid; break; }
    const nn = nodes.get(ie.to); if (!nn) continue;
    for (const sid of nn.segs) {
      const s = segs.get(sid); if (!s) continue;
      for (const e of s.edges) {
        if (e.from !== ie.to || !edgeOk(e, mode) || mode !== 'rail' && mode !== 'emerg' && e.seg === ie.seg && nn.segs.length > 1) continue;
        if (banned(ie, e)) continue;
        const c = gn + edgeCost(e, mode);
        if (!g.has(e.id) || g.get(e.id) > c) { g.set(e.id, c); E.set(e.id, e); prev.set(e.id, { from: eid }); const m = nodes.get(e.to); h.push(c + Math.hypot(m.x - tn.x, m.z - tn.z) / vmax, e.id); }
      }
    }
  }
  if (found == null) return null;
  const fe = E.get(found), tg = target.get(fe.to);
  const legs = [{ e: tg.e, s0: 0, s1: tg.s1 }];
  let id = found;
  for (let k = 0; k < 5000; k++) {
    const p = prev.get(id), e = E.get(id); if (!p) return null;
    if (p.start != null) { legs.unshift({ e, s0: p.start, s1: e.len }); break; }
    legs.unshift({ e, s0: 0, s1: e.len }); id = p.from;
  }
  return legs;
}

// ---------- disegno delle strade ----------
function parkMarks(g, px, a0, a1, b0, b1, kind) { // posti auto disegnati ai lati
  g.fillStyle = '#e8e8e8';
  for (const [u0, u1] of [[a0, a1], [b1, b0]]) {
    if (u1 - u0 < 2) continue;
    for (let y = 0; y < 256; y += 22) {
      if (kind === 'perp') g.fillRect(px(u0), y, px(u1) - px(u0), 2);
      else { g.save(); g.translate(px(u0), y); g.rotate(-0.6); g.fillRect(0, 0, (px(u1) - px(u0)) * 1.25, 2); g.restore(); }
    }
  }
}
function roadTexture(type) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  const rt = RT[type], W = rt.w, px = v => v / W * 128;
  if (rt.rail) {
    g.fillStyle = '#6f675c'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${rand() < .5 ? 40 : 160},${rand() < .5 ? 40 : 150},${rand() < .5 ? 40 : 140},.25)`; g.fillRect(rand() * 128, rand() * 256, 2, 2); }
    for (let y = 0; y < 256; y += 21) { g.fillStyle = '#5a4430'; g.fillRect(px(0.8), y, px(W - 1.6), 8); }
    g.fillStyle = '#c9c9cf'; for (const x of [W / 2 - 0.85 - 2, W / 2 + 0.85 - 2, W / 2 - 0.85 + 2, W / 2 + 0.85 + 2]) g.fillRect(px(x) - 1.5, 0, 3, 256);
  } else if (rt.gravel) {
    g.fillStyle = '#9a8a6a'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 3500; i++) { const v = 110 + rand() * 70 | 0; g.fillStyle = `rgba(${v},${v - 12},${v - 35},.55)`; g.fillRect(rand() * 128, rand() * 256, 2, 2); }
    g.fillStyle = 'rgba(80,66,44,.35)'; g.fillRect(28, 0, 14, 256); g.fillRect(86, 0, 14, 256);
  } else if (rt.pedst) { // lastricato a mattonelle
    g.fillStyle = '#b8aa94'; g.fillRect(0, 0, 128, 256);
    g.strokeStyle = 'rgba(90,80,60,.35)'; g.lineWidth = 1; for (let y = 0; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); for (let x = (y / 16) % 2 ? 8 : 0; x < 128; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
    g.fillStyle = '#9a8c74'; g.fillRect(0, 0, 6, 256); g.fillRect(122, 0, 6, 256);
  } else if (rt.ped) {
    g.fillStyle = '#c9b48f'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(90,70,40,.15)'; g.fillRect(rand() * 128, rand() * 256, 2, 2); }
    g.fillStyle = '#a99674'; g.fillRect(0, 0, 8, 256); g.fillRect(120, 0, 8, 256);
  } else {
    g.fillStyle = '#44464b'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 2500; i++) { const v = 50 + rand() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(rand() * 128, rand() * 256, 1.5, 1.5); }
    const sw = rt.side;
    if (sw > 1) { g.fillStyle = '#a8a8a2'; g.fillRect(0, 0, px(sw), 256); g.fillRect(128 - px(sw), 0, px(sw), 256); g.fillStyle = '#8b8b86'; g.fillRect(px(sw) - 1, 0, 2, 256); g.fillRect(128 - px(sw) - 1, 0, 2, 256); }
    const mid = W / 2;
    g.fillStyle = '#e8e8e8';
    const line = (x, dash) => { if (!dash) g.fillRect(px(x) - 1, 0, 2, 256); else for (let y = 0; y < 256; y += 64) g.fillRect(px(x) - 1, y, 2, 32); };
    if (rt.two) {
      const inner = rt.med;
      if (rt.med > 1) { g.fillStyle = '#5d7c43'; g.fillRect(px(mid - rt.med + 0.3), 0, px(2 * rt.med - 0.6), 256); g.fillStyle = '#e8e8e8'; }
      else { g.fillStyle = '#e8c23a'; g.fillRect(px(mid) - 3, 0, 2, 256); g.fillRect(px(mid) + 1, 0, 2, 256); g.fillStyle = '#e8e8e8'; }
      const lb = rt.lanesB || rt.lanes;
      for (let k = 1; k < rt.lanes; k++) line(mid + inner + k * LW, true);
      for (let k = 1; k < lb; k++) line(mid - inner - k * LW, true);
      line(mid + inner + rt.lanes * LW, false); line(mid - inner - lb * LW, false);
      if (rt.park) parkMarks(g, px, mid + inner + rt.lanes * LW, W - sw, mid - inner - lb * LW, sw, rt.park);
    } else {
      for (let k = 1; k < rt.lanes; k++) line(mid - rt.lanes * LW / 2 + k * LW, true);
      line(mid - rt.lanes * LW / 2, false); line(mid + rt.lanes * LW / 2, false);
      if (rt.park) parkMarks(g, px, mid + rt.lanes * LW / 2, W - sw, mid - rt.lanes * LW / 2, sw, rt.park);
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.encoding = THREE.sRGBEncoding;
  return t;
}
const roadMats = {};
for (const k in RT) roadMats[k] = new THREE.MeshLambertMaterial({ map: roadTexture(k), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
const structMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const discMat = new THREE.MeshLambertMaterial({ color: 0x303236, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
const chunkMeshes = new Map(); // chunk -> [meshes]
function rebuildRoadChunk(c) {
  const old = chunkMeshes.get(c); if (old) for (const m of old) { scene.remove(m); m.geometry.dispose(); }
  const out = [];
  const byType = {};
  const sp = [], sn = [], sc = []; // struttura (piloni, fianchi)
  const quad = (a, b, cc, d, col) => { // 4 punti [x,y,z]
    const nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const l = Math.hypot(nx, ny, nz) || 1;
    for (const p of [a, b, cc, a, cc, d]) { sp.push(p[0], p[1], p[2]); sn.push(nx / l, ny / l, nz / l); sc.push(col[0], col[1], col[2]); }
  };
  const box = (x, y0, y1, z, w, yaw, col) => {
    const c2 = Math.cos(yaw) * w, s2 = Math.sin(yaw) * w;
    const P = (sx, sz, y) => [x + sx * c2 - sz * s2, y, z + sx * s2 + sz * c2];
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) { const [ax, az] = cs[i], [bx, bz] = cs[(i + 1) % 4]; quad(P(ax, az, y0), P(bx, bz, y0), P(bx, bz, y1), P(ax, az, y1), col); }
  };
  for (const s of segs.values()) {
    if (s.chunk !== c) continue;
    const rt = RT[s.type], hw = rt.w / 2;
    const B = byType[s.type] || (byType[s.type] = { p: [], u: [], i: [] });
    const base = B.p.length / 3;
    const n = s.pts.length;
    for (let i = 0; i < n; i++) {
      const p = s.pts[i], q = s.pts[Math.min(i + 1, n - 1)], o = s.pts[Math.max(i - 1, 0)];
      let tx = q.x - o.x, tz = q.z - o.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = -tz, nz = tx, y = p.y + 0.15;
      B.p.push(p.x - nx * hw, y, p.z - nz * hw, p.x + nx * hw, y, p.z + nz * hw);
      B.u.push(0, s.cum[i] / (rt.w * 2), 1, s.cum[i] / (rt.w * 2));
      const deep = i < n - 1 && (deepPt(s, p) && deepPt(s, s.pts[i + 1]) || s.bst === 'draw' && drawGap(s, i));
      if (i < n - 1 && !deep) { const k = base + i * 2; B.i.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      if (i < n - 1 && s.elev <= -2 && deepPt(s, p) !== deepPt(s, s.pts[i + 1])) { // imbocco della galleria
        const q = deepPt(s, p) ? s.pts[i + 1] : p, top = Math.max(q.h, q.y + 6) + 1.5, yaw = Math.atan2(nz, nx);
        box(q.x + nx * (hw + 1), q.y, top, q.z + nz * (hw + 1), 1, yaw, [0.55, 0.55, 0.53]); box(q.x - nx * (hw + 1), q.y, top, q.z - nz * (hw + 1), 1, yaw, [0.55, 0.55, 0.53]);
        for (let a = -hw; a <= hw; a += 2) box(q.x + nx * a, top - 1.5, top, q.z + nz * a, 1.1, yaw, [0.5, 0.5, 0.48]);
      }
      if (i < n - 1 && !rt.ped && !deep) {
        const p2 = s.pts[i + 1];
        if (rt.quay) for (const sd of [-1, 1]) { const ox = p.x + sd * nx * (hw + 0.5), oz = p.z + sd * nz * (hw + 0.5), o2x = p2.x + sd * nx * (hw + 0.5), o2z = p2.z + sd * nz * (hw + 0.5); if (getH(ox + sd * nx * 6, oz + sd * nz * 6) < y - 1.2) quad([ox, y + 0.6, oz], [o2x, p2.y + 0.75, o2z], [o2x, Math.min(WATER, p2.y) - 3, o2z], [ox, Math.min(WATER, y) - 3, oz], [0.56, 0.53, 0.48]); }
        if (s.bst && (p.y - p.h > 4 || p2.y - p2.h > 4)) bridgeDeco(s, i, p, p2, nx, nz, hw, y, quad, box);
        const elevated = p.y - p.h > 1.5 || p2.y - p2.h > 1.5;
        if (elevated) {
          const col = [0.62, 0.62, 0.6];
          const q2x = p2.x, q2z = p2.z;
          for (const sd of [-1, 1]) quad([p.x + sd * nx * hw, y, p.z + sd * nz * hw], [q2x + sd * nx * hw, p2.y + 0.15, q2z + sd * nz * hw], [q2x + sd * nx * hw, p2.y - 1.3, q2z + sd * nz * hw], [p.x + sd * nx * hw, y - 1.3, p.z + sd * nz * hw], col);
          quad([p.x - nx * hw, y - 1.3, p.z - nz * hw], [p.x + nx * hw, y - 1.3, p.z + nz * hw], [q2x + nx * hw, p2.y - 1.3, q2z + nz * hw], [q2x - nx * hw, p2.y - 1.3, q2z - nz * hw], [0.5, 0.5, 0.5]);
        }
        if (s.elev < 0) for (const sd of [-1, 1]) { const o = hw + 14, t1 = Math.max(p.h, y + 1) + 0.6, t2 = Math.max(p2.h, p2.y + 1) + 0.6; if (t1 - y > 1.2 || t2 - p2.y > 1.2) quad([p.x + sd * nx * o, y - 0.3, p.z + sd * nz * o], [p2.x + sd * nx * o, p2.y - 0.15, p2.z + sd * nz * o], [p2.x + sd * nx * o, t2, p2.z + sd * nz * o], [p.x + sd * nx * o, t1, p.z + sd * nz * o], [0.68, 0.66, 0.62]); } // muri di contenimento
        if (s.barrier) for (const sd of [-1, 1]) quad([p.x + sd * nx * (hw + 0.3), y, p.z + sd * nz * (hw + 0.3)], [p2.x + sd * nx * (hw + 0.3), p2.y + 0.15, p2.z + sd * nz * (hw + 0.3)], [p2.x + sd * nx * (hw + 0.3), p2.y + 4, p2.z + sd * nz * (hw + 0.3)], [p.x + sd * nx * (hw + 0.3), y + 3.85, p.z + sd * nz * (hw + 0.3)], [0.55, 0.62, 0.66]);
        if (p.y - Math.max(p.h, -8) > 3 && i % 4 === 2) box(p.x, Math.max(p.h, -8) - 2, p.y - 1.2, p.z, Math.min(hw * 0.25, 2.2), Math.atan2(nz, nx), [0.58, 0.58, 0.56]);
        if (rt.zone && !rt.gravel && i % 5 === 2) for (const sd of (rt.two ? [-1, 1] : [1])) { // lampioni
          const lx = p.x + sd * nx * (hw - 0.6), lz = p.z + sd * nz * (hw - 0.6);
          box(lx, y, y + 7, lz, 0.12, 0, [0.35, 0.36, 0.38]); box(lx - sd * nx * 0.9, y + 6.8, y + 7.2, lz - sd * nz * 0.9, 0.5, Math.atan2(nz, nx), [0.95, 0.9, 0.7]);
        }
        if (s.tram && !rt.rail) for (const sd of (rt.two ? [-1, 1] : [0])) for (const rr of [-0.72, 0.72]) { const oc = (rt.two ? rt.med + LW * 0.5 : 0) + rr, o0 = oc - 0.09, o1 = oc + 0.09, q = sd || 1; quad([p.x + q * nx * o0, y + 0.08, p.z + q * nz * o0], [p2.x + q * nx * o0, p2.y + 0.23, p2.z + q * nz * o0], [p2.x + q * nx * o1, p2.y + 0.23, p2.z + q * nz * o1], [p.x + q * nx * o1, y + 0.08, p.z + q * nz * o1], [0.3, 0.3, 0.32]); }
        if (s.busLane && rt.two && rt.lanes >= 2) for (const sd of [-1, 1]) { const o0 = rt.med + (rt.lanes - 1) * LW, o1 = o0 + LW; quad([p.x + sd * nx * o0, y + 0.06, p.z + sd * nz * o0], [p2.x + sd * nx * o0, p2.y + 0.21, p2.z + sd * nz * o0], [p2.x + sd * nx * o1, p2.y + 0.21, p2.z + sd * nz * o1], [p.x + sd * nx * o1, y + 0.06, p.z + sd * nz * o1], [0.62, 0.22, 0.2]); }
        if (rt.med > 1 && rt.zone && i % 3 === 1) { // alberi nel viale
          box(p.x, y, y + 2.5, p.z, 0.25, 0, [0.4, 0.28, 0.16]);
          box(p.x, y + 2.5, y + 6, p.z, 1.3, 0.7, [0.3, 0.52, 0.25]);
        }
      }
    }
  }
  // strisce pedonali vicino agli incroci
  for (const s of segs.values()) {
    if (s.chunk !== c) continue; const rt = RT[s.type]; if (!rt.zone || rt.gravel || rt.pedst || s.elev) continue;
    for (const [nid, along, dir] of [[s.a, 0, 1], [s.b, s.len, -1]]) {
      const nd = nodes.get(nid); if (!nd || nd.segs.length < 3) continue;
      let r = 0; for (const id of nd.segs) { const q = segs.get(id); if (q) r = Math.max(r, RT[q.type].w / 2); }
      const at = along + dir * (r + 2.2); if (at < 0 || at > s.len) continue; const f = segFrame(s, at), hw = rt.w / 2 - 0.4;
      for (let k = -hw + 0.4; k < hw; k += 1.2) { const cx = f.x + f.nx * k, cz = f.z + f.nz * k, y = f.y + 0.2; quad([cx - f.tx * 1.4, y, cz - f.tz * 1.4], [cx + f.tx * 1.4, y, cz + f.tz * 1.4], [cx + f.tx * 1.4 + f.nx * 0.55, y, cz + f.tz * 1.4 + f.nz * 0.55], [cx - f.tx * 1.4 + f.nx * 0.55, y, cz - f.tz * 1.4 + f.nz * 0.55], [0.92, 0.92, 0.9]); }
    }
  }
  // incroci
  const dp = [], dn = [];
  for (const nd of nodes.values()) {
    if (tileIdx(nd.x, nd.z) !== c) continue;
    let r = 0, cnt = 0, types = new Set(), dirs = [];
    for (const sid of nd.segs) { const s = segs.get(sid); if (!s) continue; const rt = RT[s.type]; if (rt.rail || rt.ped) continue; r = Math.max(r, rt.w / 2); cnt++; types.add(s.type); }
    if (!cnt) continue;
    if (cnt === 2 && types.size === 1) continue;
    if (cnt === 1 && !nd.outside && nd.segs.length === 1 && RT[[...types][0]].zone) r *= 1.7; // slargo per girare
    const y = nd.y + 0.2, N = 14;
    for (let k = 0; k < N; k++) { const a1 = k / N * Math.PI * 2, a2 = (k + 1) / N * Math.PI * 2; dp.push(nd.x, y, nd.z, nd.x + Math.cos(a2) * r, y, nd.z + Math.sin(a2) * r, nd.x + Math.cos(a1) * r, y, nd.z + Math.sin(a1) * r); dn.push(0, 1, 0, 0, 1, 0, 0, 1, 0); }
  }
  for (const t in byType) {
    const B = byType[t], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
    const nor = new Float32Array(B.p.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(B.u, 2)); g.setIndex(B.i); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, roadMats[t]); m.renderOrder = 1; out.push(m);
  }
  if (sp.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(sn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); g.computeBoundingSphere(); out.push(new THREE.Mesh(g, structMat)); }
  if (dp.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(dn, 3)); g.computeBoundingSphere(); const m = new THREE.Mesh(g, discMat); m.renderOrder = 1; out.push(m); }
  for (const m of out) scene.add(m);
  chunkMeshes.set(c, out);
}
// ponti di tipi diversi (s.bst): legno coperto, ad arco, sospeso, strallato, a due piani, levatoio
const BRIDGES = { beam: () => L('Normale', 'Standard'), wood: () => L('In legno coperto', 'Covered wooden'), arch: () => L('Ad arco', 'Arch'), susp: () => L('Sospeso', 'Suspension'), cable: () => L('Strallato', 'Cable-stayed'), double: () => L('A due piani', 'Double-deck'), draw: () => L('Levatoio', 'Drawbridge') };
function brSpan(s) {
  if (s._bsp && s._bsp.pts === s.pts) return s._bsp;
  let i0 = -1, i1 = -1; s.pts.forEach((p, i) => { if (p.y - p.h > 4) { if (i0 < 0) i0 = i; i1 = i; } });
  const L0 = i0 >= 0 ? s.cum[i1] - s.cum[i0] : 0; return s._bsp = { pts: s.pts, i0, i1, a: s.cum[Math.max(i0, 0)], L: Math.max(L0, 1) };
}
function bridgeDeco(s, i, p, p2, nx, nz, hw, y, quad, box) {
  const sp = brSpan(s), u = (s.cum[i] - sp.a) / sp.L, u2 = (s.cum[i + 1] - sp.a) / sp.L, y2 = p2.y + 0.15, yaw = Math.atan2(nz, nx);
  const wood = [0.45, 0.3, 0.18], steel = [0.75, 0.25, 0.2], white = [0.88, 0.88, 0.86], grey = [0.6, 0.6, 0.58];
  const rib = (h1, h2, sd, col, t = 0.5) => { const o = sd * (hw + 0.4); quad([p.x + nx * o, h1, p.z + nz * o], [p2.x + nx * o, h2, p2.z + nz * o], [p2.x + nx * o, h2 - t, p2.z + nz * o], [p.x + nx * o, h1 - t, p.z + nz * o], col); };
  switch (s.bst) {
    case 'wood': for (const sd of [-1, 1]) rib(y + 3.5, y2 + 3.5, sd, wood, 3.5); { const r1 = y + 5.5, r2 = y2 + 5.5; for (const sd of [-1, 1]) quad([p.x + sd * nx * (hw + 0.8), y + 3.4, p.z + sd * nz * (hw + 0.8)], [p2.x + sd * nx * (hw + 0.8), y2 + 3.4, p2.z + sd * nz * (hw + 0.8)], [p2.x, r2, p2.z], [p.x, r1, p.z], [0.35, 0.22, 0.14]); } break;
    case 'arch': { const H = Math.min(sp.L * 0.18, 60), a1 = y + 2 + H * 4 * u * (1 - u), a2 = y2 + 2 + H * 4 * u2 * (1 - u2); for (const sd of [-1, 1]) rib(a1 + 1.5, a2 + 1.5, sd, steel, 1.5); if (i % 2 === 0 && a1 > y + 3) for (const sd of [-1, 1]) box(p.x + sd * nx * (hw + 0.4), y, a1, p.z + sd * nz * (hw + 0.4), 0.12, yaw, steel); break; }
    case 'susp': { const T = 45, c = v => { const w = v < 0.2 ? v / 0.2 : v > 0.8 ? (1 - v) / 0.2 : 1 - 0.85 * Math.sin((v - 0.2) / 0.6 * Math.PI); return 2 + T * (v < 0.2 || v > 0.8 ? w : w); }; for (const sd of [-1, 1]) rib(y + c(u), y2 + c(u2), sd, steel, 0.6); if (i % 2 === 0) for (const sd of [-1, 1]) box(p.x + sd * nx * (hw + 0.4), y, y + c(u), p.z + sd * nz * (hw + 0.4), 0.08, yaw, grey);
      for (const t of [0.2, 0.8]) if (u <= t && u2 > t) for (const sd of [-1, 1]) box(p.x + sd * nx * (hw + 1), Math.min(p.h, y) - 4, y + T + 4, p.z + sd * nz * (hw + 1), 1.3, yaw, steel); break; }
    case 'cable': { const T = 55; if (u <= 0.5 && u2 > 0.5) { s._tw = [p.x, p.z, y]; for (const sd of [-1, 1]) box(p.x + sd * nx * (hw + 1), Math.min(p.h, y) - 4, y + T, p.z + sd * nz * (hw + 1), 1.2, yaw, white); }
      const tw = s._tw || (() => { const k = sp.i0 + ((sp.i1 - sp.i0) >> 1), q = s.pts[k]; return [q.x, q.z, q.y]; })();
      if (i % 3 === 0 && Math.abs(u - 0.5) > 0.05) for (const sd of [-1, 1]) { const o = sd * (hw + 0.4), tx = tw[0] + nx * o, tz = tw[1] + nz * o; quad([tx, tw[2] + T - 4, tz], [tx, tw[2] + T - 4.4, tz], [p.x + nx * o, y + 0.4, p.z + nz * o], [p.x + nx * o, y + 0.8, p.z + nz * o], white); } break; }
    case 'double': quad([p.x - nx * hw, y - 7, p.z - nz * hw], [p.x + nx * hw, y - 7, p.z + nz * hw], [p2.x + nx * hw, y2 - 7, p2.z + nz * hw], [p2.x - nx * hw, y2 - 7, p2.z - nz * hw], [0.42, 0.42, 0.44]); for (const sd of [-1, 1]) rib(y - 0.5, y2 - 0.5, sd, grey, 6); break;
    case 'draw': if (u <= 0.5 && u2 > 0.5) for (const sd of [-1, 1]) for (const f of [-1, 1]) { const q = f < 0 ? p : p2; box(q.x + sd * nx * (hw + 2) + f * nz * 0, y - 2, y + 14, q.z + sd * nz * (hw + 2), 2, yaw, [0.55, 0.5, 0.45]); } break;
  }
}
// ponti levatoi: si aprono quando passa una nave
function drawGap(s, i) { const sp = brSpan(s); if (sp.i0 < 0) return false; const k = sp.i0 + ((sp.i1 - sp.i0) >> 1); return Math.abs(s.cum[i] - s.cum[k]) < 14 || Math.abs(s.cum[i + 1] - s.cum[k]) < 14 && s.cum[i] < s.cum[k]; }
const drawLeaves = new THREE.Group(); scene.add(drawLeaves);
const leafMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
function updateDrawbridges(dt) {
  for (const s of segs.values()) {
    if (s.bst !== 'draw') { if (s.leaf) { drawLeaves.remove(s.leaf); s.leaf = null; } continue; }
    const sp = brSpan(s); if (sp.i0 < 0) continue;
    const k = sp.i0 + ((sp.i1 - sp.i0) >> 1), m = s.pts[k], q = s.pts[Math.min(k + 1, s.pts.length - 1)];
    let near = false; for (const sh of (typeof ships !== 'undefined' ? ships : [])) { const q2 = sh.pts?.[sh.i]; if (q2 && Math.hypot(q2.x - m.x, q2.z - m.z) < 300) { near = true; break; } }
    s.openT = clamp((s.openT || 0) + (near ? dt : -dt) * 0.25, 0, 1); s.open = s.openT > 0.05;
    if (!s.leaf) { s.leaf = new THREE.Group(); const w = RT[s.type].w; for (const f of [-1, 1]) { const piv = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, 14), leafMat); b.position.z = -f * 7; piv.add(b); piv.position.z = f * 14; piv.userData.f = f; s.leaf.add(piv); } drawLeaves.add(s.leaf); }
    s.leaf.position.set(m.x, m.y + 0.3, m.z); s.leaf.rotation.y = Math.atan2(q.x - m.x, q.z - m.z);
    for (const piv of s.leaf.children) piv.rotation.x = piv.userData.f * s.openT * 1.2;
  }
}
function flushRoads() { for (const c of roadDirty) rebuildRoadChunk(c); roadDirty.clear(); }

// semafori visibili
const lightPool = new InstPool(new THREE.SphereGeometry(0.9, 6, 4), new THREE.MeshBasicMaterial(), 4000);
function drawLights() {
  let n = 0;
  if (cam.dist < 1500) for (const nd of nodes.values()) {
    if ((!nd.light && !nd.stop) || Math.abs(nd.x - cam.tx) > 1500 || Math.abs(nd.z - cam.tz) > 1500) continue;
    for (const sid of nd.segs) { const s = segs.get(sid); if (!s) continue; for (const e of s.edges) { if (e.to !== nd.id || e.rail || e.ped) continue; if (n >= lightPool.max) break;
      const p = e.pts[e.pts.length - 3] || e.pts[0], q = e.pts[e.pts.length - 1]; const dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1, rx = -dz / l, rz = dx / l, hw = RT[s.type].w / 2;
      if (nd.stop) { setInst(lightPool.mesh, n, p.x + rx * hw, p.y + 2.6, p.z + rz * hw, 0, 1.1, 1.1, 0.25); setInstCol(lightPool.mesh, n, 0.9, 0.05, 0.05); n++; continue; }
      setInst(lightPool.mesh, n, p.x + rx * hw, p.y + 5, p.z + rz * hw, 0, 1, 1, 1);
      const g = lightGreen(nd, e); setInstCol(lightPool.mesh, n, g ? 0.1 : 1, g ? 1 : 0.1, 0.1); n++; } }
  }
  lightPool.mesh.count = n; lightPool.dirty();
}
