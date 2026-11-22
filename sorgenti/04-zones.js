// =====================================================================
//  Zone (celle lungo le strade) ed edifici che crescono
// =====================================================================
const ZT = {
  1: { k: 'R', dens: 0, col: 0x67c25a, ms: 0, n: () => L('Residenziale bassa densità', 'Low density residential'), sh: () => L('Case', 'Houses') },
  2: { k: 'R', dens: 1, col: 0x3d9a37, ms: 2, n: () => L('Residenziale media densità', 'Medium density residential'), sh: () => L('Palazzine', 'Row houses') },
  3: { k: 'R', dens: 2, col: 0x1e6b22, ms: 5, n: () => L('Residenziale alta densità', 'High density residential'), sh: () => L('Grattacieli', 'Towers') },
  4: { k: 'R', dens: 1, cheap: true, col: 0x9bc25a, ms: 3, n: () => L('Case popolari (affitto basso)', 'Low rent housing'), sh: () => L('Popolari', 'Low rent') },
  10: { k: 'M', dens: 1, col: 0x3fbfae, ms: 3, n: () => L('Uso misto (negozi + case)', 'Mixed use (shops + homes)'), sh: () => L('Misto', 'Mixed') },
  5: { k: 'C', dens: 0, col: 0x5aa2e6, ms: 0, n: () => L('Commerciale bassa densità', 'Low density commercial'), sh: () => L('Negozi', 'Shops') },
  6: { k: 'C', dens: 2, col: 0x2b62c4, ms: 4, n: () => L('Commerciale alta densità', 'High density commercial'), sh: () => L('Centri comm.', 'Malls') },
  11: { k: 'O', dens: 0, col: 0xc9a2ee, ms: 2, n: () => L('Uffici bassa densità', 'Low density offices'), sh: () => L('Uffici bassi', 'Low offices') },
  7: { k: 'O', dens: 2, col: 0xb07ae6, ms: 4, n: () => L('Uffici alta densità', 'High density offices'), sh: () => L('Uffici alti', 'High offices') },
  8: { k: 'I', dens: 1, col: 0xe3c03e, ms: 0, n: () => L('Industria', 'Industry'), sh: () => L('Industria', 'Industry') },
  12: { k: 'R', dens: 1, like: 2, row: true, col: 0x58b04a, ms: 1, n: () => L('Case a schiera', 'Row houses'), sh: () => L('A schiera', 'Row') },
  13: { k: 'R', dens: 0, like: 1, water: true, col: 0x4fc7a0, ms: 3, n: () => L('Case fronte mare (solo vicino all\'acqua)', 'Waterfront homes (only near water)'), sh: () => L('Fronte mare', 'Waterfront') },
  14: { k: 'C', dens: 0, like: 5, water: true, col: 0x5ac8e6, ms: 3, n: () => L('Negozi fronte mare (solo vicino all\'acqua)', 'Waterfront shops (only near water)'), sh: () => L('Negozi mare', 'Sea shops') },
  9: { k: 'I', spec: true, col: 0xc0803a, ms: 2, n: () => L('Industria specializzata (campi, boschi, petrolio, miniere)', 'Specialized industry (farms, forest, oil, ore)'), sh: () => L('Risorse', 'Resources') },
};
const ZONE_ORDER = [1, 12, 2, 3, 4, 10, 13, 5, 6, 14, 11, 7, 8, 9];
const zl = z => ZT[z]?.like || z; // le zone nuove si comportano come una zona base
const CELL = 8, DEPTH = 6;
const cells = []; const freeCells = [];
const CG = 12800, CGC = MAP / CG; // griglia 8 m per occupare il suolo (sparsa: la mappa è enorme)
const claimM = new Map();
const claim = { get: g => claimM.get(g) || 0 };
const cgIdx = (x, z) => { const i = Math.floor((x + HALF) / CGC), j = Math.floor((z + HALF) / CGC); return (i < 0 || j < 0 || i >= CG || j >= CG) ? -1 : j * CG + i; };
let cellsDirty = true;
const cellKey = (side, k, d) => ((side > 0 ? 1 : 0) * 10000 + k) * 8 + d;

function segFrame(s, along) {
  let i = 0; while (i < s.cum.length - 2 && s.cum[i + 1] < along) i++;
  const p = s.pts[i], q = s.pts[i + 1], l = s.cum[i + 1] - s.cum[i] || 1, t = clamp((along - s.cum[i]) / l, 0, 1);
  const tx = (q.x - p.x) / l, tz = (q.z - p.z) / l;
  return { x: lerp(p.x, q.x, t), z: lerp(p.z, q.z, t), y: lerp(p.y, q.y, t), tx, tz, nx: -tz, nz: tx };
}
function cellPointBad(x, z, s) {
  if (!inMap(x, z) || !isOwned(x, z)) return true;
  const h = getH(x, z); if (h < 0.4) return true;
  if (Math.abs(getH(x + 4, z) - getH(x - 4, z)) > 3.5 || Math.abs(getH(x, z + 4) - getH(x, z - 4)) > 3.5) return true;
  for (const id of segsNear(x, z, 40)) {
    const o = segs.get(id); if (!o) continue;
    const r = nearestOnSeg(o, x, z);
    if (r.d < RT[o.type].w / 2 + 3.6 && !(o === s && r.d > RT[o.type].w / 2 + 3)) return true;
  }
  if (svcAt(x, z)) return true;
  return false;
}
function genCells(s) {
  if (!RT[s.type].zone || s.elev) return;
  const hw = RT[s.type].w / 2;
  s.cellMap = new Map();
  const nK = Math.floor((s.len - 8) / CELL);
  for (const side of [1, -1]) for (let k = 0; k < nK; k++) {
    const along = 4 + 4 + k * CELL;
    const f = segFrame(s, along);
    if (f.y - getH(f.x, f.z) > 2) continue;
    for (let d = 0; d < DEPTH; d++) {
      const off = hw + 4 + d * CELL;
      const x = f.x + f.nx * side * off, z = f.z + f.nz * side * off;
      if (cellPointBad(x, z, s)) break;
      // controllo sovrapposizione (vince il segmento con id più basso)
      const ux = f.tx * 3, uz = f.tz * 3, vx = f.nx * 3, vz = f.nz * 3;
      const pts = [cgIdx(x, z), cgIdx(x + ux, z + uz), cgIdx(x - ux, z - uz), cgIdx(x + vx, z + vz), cgIdx(x - vx, z - vz)];
      let blocked = false; const toKill = new Set();
      for (const g of pts) { if (g < 0) { blocked = true; break; } const c = claimM.get(g) || 0; if (c) { const oc = cells[c - 1]; if (oc && oc.seg !== s.id) { if (oc.seg < s.id) { blocked = true; break; } else toKill.add(oc); } } }
      if (blocked) break;
      for (const oc of toKill) killCell(oc);
      const id = freeCells.length ? freeCells.pop() : cells.length;
      const c = { id, seg: s.id, side, k, d, x, z, ang: Math.atan2(f.nx * side, f.nz * side), zone: 0, b: 0, cl: [] };
      cells[id] = c;
      for (const g of pts) if (!claimM.get(g)) { claimM.set(g, id + 1); c.cl.push(g); }
      s.cells.push(id); s.cellMap.set(cellKey(side, k, d), id);
    }
  }
  cellsDirty = true;
}
function killCell(c) {
  if (c.b) destroyBuilding(buildings.get(c.b));
  for (const g of c.cl) if (claimM.get(g) === c.id + 1) claimM.delete(g);
  const s = segs.get(c.seg); if (s) { s.cells = s.cells.filter(i => i !== c.id); s.cellMap?.delete(cellKey(c.side, c.k, c.d)); }
  cells[c.id] = null; freeCells.push(c.id); cellsDirty = true;
}
function removeCellsOfSeg(s) { for (const id of s.cells.slice()) { const c = cells[id]; if (c) killCell(c); } s.cells = []; s.cellMap = new Map(); }
function invalidateCellsNear(s) {
  const hw = RT[s.type].w / 2;
  const seen = new Set();
  for (const p of s.pts) for (const id of segsNear(p.x, p.z, 70)) seen.add(id);
  for (const id of seen) {
    const o = segs.get(id); if (!o || o === s) continue;
    for (const cid of o.cells.slice()) { const c = cells[cid]; if (!c) continue; const r = nearestOnSeg(s, c.x, c.z); if (r.d < hw + 3.6) killCell(c); }
  }
}
function captureZones(list) {
  if (!Array.isArray(list)) list = [list];
  const z = [], bl = [];
  for (const s of list) for (const id of s.cells) { const c = cells[id]; if (!c) continue; if (c.zone) z.push({ x: c.x, z: c.z, zone: c.zone }); if (c.b && !bl.some(b => b.id === c.b)) { const b = buildings.get(c.b); if (b) bl.push({ id: b.id, data: bldData(b), pts: b.cells.map(ci => ({ x: cells[ci].x, z: cells[ci].z })) }); } }
  return { z, bl };
}
function cellAtPoint(x, z) { const g = cgIdx(x, z); if (g < 0) return null; const c = claimM.get(g) || 0; return c ? cells[c - 1] : null; }
function restoreZones(keep) {
  for (const r of keep.z) { const c = cellAtPoint(r.x, r.z); if (c && !c.zone && Math.hypot(c.x - r.x, c.z - r.z) < 3) c.zone = r.zone; }
  for (const r of keep.bl) {
    const cs = r.pts.map(p => cellAtPoint(p.x, p.z));
    if (cs.some(c => !c || c.b || Math.hypot(c.x - 0, 0) < 0) || cs.some((c, i) => Math.hypot(c.x - r.pts[i].x, c.z - r.pts[i].z) > 3)) continue;
    if (new Set(cs.map(c => c.seg + ':' + c.side)).size !== 1) continue;
    createBuilding(r.data.zone, cs, r.data);
  }
  cellsDirty = true;
}
function regenCellsNear(s) {
  const seen = new Set();
  for (const p of s.pts) for (const id of segsNear(p.x, p.z, 80)) seen.add(id);
  const list = [...seen].map(id => segs.get(id)).filter(o => o && o !== s && RT[o.type].zone && !o.elev).sort((a, b) => a.id - b.id);
  if (!list.length) return;
  const keep = captureZones(list);
  for (const o of list) removeCellsOfSeg(o);
  for (const o of list) genCells(o);
  restoreZones(keep);
}
function regenAllCellsInTile(t) {
  const list = [...segs.values()].filter(s => RT[s.type].zone && !s.elev && s.pts.some(p => tileIdx(p.x, p.z) === t || Math.abs(p.x - (-HALF + (t % NT + 0.5) * TILE)) < TILE * 0.5 + 60 && Math.abs(p.z - (-HALF + (Math.floor(t / NT) + 0.5) * TILE)) < TILE * 0.5 + 60)).sort((a, b) => a.id - b.id);
  const keep = captureZones(list);
  for (const o of list) removeCellsOfSeg(o);
  for (const o of list) genCells(o);
  restoreZones(keep);
}

// celle visibili
const cellGeo = new THREE.PlaneGeometry(7.4, 7.4).rotateX(-Math.PI / 2);
const cellMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
let cellPool = new InstPool(cellGeo, cellMat, 120000);
cellPool.mesh.renderOrder = 3;
let showEmptyCells = false;
function flushCells() {
  if (!cellsDirty) return; cellsDirty = false;
  let n = 0;
  for (const c of cells) {
    if (!c || c.b) continue;
    if (!c.zone && !showEmptyCells) continue;
    if (n >= cellPool.max) break;
    setInst(cellPool.mesh, n, c.x, getH(c.x, c.z) + 0.35, c.z, c.ang, 1, 1, 1);
    if (c.zone) { _c.setHex(ZT[c.zone].col); setInstCol(cellPool.mesh, n, _c.r, _c.g, _c.b); } else setInstCol(cellPool.mesh, n, 0.92, 0.92, 0.92);
    n++;
  }
  cellPool.mesh.count = n; cellPool.dirty();
}

// =================== EDIFICI ===================
const buildings = new Map(); let nextBldId = 1;
const BB = 1600, BBC = MAP / BB; const bldBuckets = new Map();
function bkKey(x, z) { return Math.floor((z + HALF) / BBC) * BB + Math.floor((x + HALF) / BBC); }
function bldNear(x, z, r, fn) {
  const b0 = Math.floor((x - r + HALF) / BBC), b1 = Math.floor((x + r + HALF) / BBC), c0 = Math.floor((z - r + HALF) / BBC), c1 = Math.floor((z + r + HALF) / BBC), r2 = r * r;
  for (let bz = c0; bz <= c1; bz++) for (let bx = b0; bx <= b1; bx++) { const l = bldBuckets.get(bz * BB + bx); if (l) for (const id of l) { const b = buildings.get(id); if (b && dist2(b.x, b.z, x, z) <= r2) fn(b); } }
}
// materiale con finestre (si accendono di notte)
const bldU = { uNight: { value: 0 } };
const bldMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
bldMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, bldU);
  sh.vertexShader = 'varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vec4 wq = modelMatrix * instanceMatrix * vec4(transformed,1.0); vWp = wq.xyz; vWn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);`);
  sh.fragmentShader = 'uniform float uNight; varying vec3 vWp; varying vec3 vWn;\n float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n' +
    sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float win = 0.0; float lit = 0.0;
      if (abs(vWn.y) < 0.5) {
        vec2 t = normalize(vec2(-vWn.z, vWn.x));
        float u = dot(vWp.xz, t);
        vec2 cc = vec2(fract(u/3.1), fract(vWp.y/3.3));
        win = step(0.22,cc.x)*step(cc.x,0.78)*step(0.32,cc.y)*step(cc.y,0.82);
        float r = hsh(vec2(floor(u/3.1), floor(vWp.y/3.3)) + floor(vWp.xz/97.0));
        lit = win * step(r, 0.5) * uNight;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22,0.27,0.34), win*0.65);
      }`).replace('#include <envmap_fragment>', '#include <envmap_fragment>\n outgoingLight += vec3(1.0,0.82,0.5)*lit*0.9;');
};
const plainMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const roofGeo = (() => { const g = new THREE.BufferGeometry(); const p = [-.5, 0, -.5, .5, 0, -.5, 0, 1, -.5, .5, 0, .5, -.5, 0, .5, 0, 1, .5, -.5, 0, -.5, 0, 1, -.5, 0, 1, .5, -.5, 0, -.5, 0, 1, .5, -.5, 0, .5, .5, 0, -.5, .5, 0, .5, 0, 1, .5, .5, 0, -.5, 0, 1, .5, 0, 1, -.5]; g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g; })();
const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0);
const POOLS = { body: new InstPool(boxGeo, bldMat, 60000), roof: new InstPool(roofGeo, plainMat, 40000), plain: new InstPool(boxGeo, plainMat, 60000), cyl: new InstPool(cylGeo, plainMat, 12000) };
let curRef = null;
function addPart(list, pool, x, y, z, yaw, sx, sy, sz, col) {
  const h = { pool, i: -1, col, ref: curRef }; const p = POOLS[pool]; h.i = p.add(h); if (h.i < 0) return null;
  setInst(p.mesh, h.i, x, y, z, yaw, sx, sy, sz); _c.setHex(col); setInstCol(p.mesh, h.i, _c.r, _c.g, _c.b); p.dirty(); list.push(h); h.geo = [x, y, z, yaw, sx, sy, sz]; return h;
}
function removeParts(list) { for (const h of list) { POOLS[h.pool].remove(h.i, 'i'); } list.length = 0; }
function tintParts(b, hex) { for (const h of b.parts) { const p = POOLS[h.pool]; _c.setHex(hex ?? h.col); setInstCol(p.mesh, h.i, _c.r, _c.g, _c.b); p.dirty(); } }

const PAL = {
  R: [0xe8dcc0, 0xf2efe6, 0xd9a57c, 0xe9d38f, 0xc9d4d9, 0xd8c3a8, 0xbfa58a, 0xf0e2d0],
  C: [0x9fc1df, 0xe7e7e2, 0x8fb0c9, 0xd6cfc0, 0xb8c9d6],
  O: [0x6f9cbf, 0x8ab4cf, 0x5b84a8, 0xa8c3d6, 0x7fa1b7],
  I: [0xa9a49a, 0x9a8f80, 0xb7b0a2, 0x8c8f93, 0xa48b6c],
  roof: [0x8c3b2a, 0x6e4a3a, 0x5a5f66, 0x9c5a3c, 0x4b4f55],
};
// stile America: legno chiaro, tetti scuri, prati davanti e garage
const PAL_US = { R: [0xf4f4f0, 0xc9d8e4, 0xe6dcc4, 0xb9c2b0, 0xd8d0c2, 0x9fb3c4, 0xece4cf, 0xc4a68a], roof: [0x3e4247, 0x55575c, 0x4a3f3a, 0x5f6670, 0x2f3236] };
const usTheme = () => typeof S !== 'undefined' && S && S.opts && S.opts.theme === 'us';
const SPEC = ['farm', 'forest', 'oil', 'ore'];
function specAt(x, z) {
  const k = gIdx(x, z); const v = { farm: RES.fert[k], forest: RES.forest[k] * 0.9, oil: RES.oil[k] * 1.1, ore: RES.ore[k] * 1.1 };
  let best = 'farm', bv = 0.15; for (const s of SPEC) if (v[s] > bv) { bv = v[s]; best = s; }
  return bv > 0.15 ? best : null;
}
function bldCapacity(b) {
  const z = ZT[b.zone], area = b.cw * b.cd, lm = 1 + 0.3 * (b.level - 1) + (b.level >= 3 ? 0.25 : 0) + (b.level >= 5 ? 0.35 : 0);
  const f = { 1: 0.55, 2: 2.2, 3: 5.5, 4: 3, 10: 1.4, 5: 1.6, 6: 4.5, 7: 6, 11: 2.4, 8: 2.6, 9: 0.7 }[zl(b.zone)];
  let hh = 0, jobs = 0;
  if (z.k === 'R') hh = Math.max(1, Math.round(area * f * lm));
  else if (z.k === 'M') { hh = Math.max(1, Math.round(area * f * lm)); jobs = Math.max(1, Math.round(area * 0.9 * lm)); }
  else jobs = Math.max(2, Math.round(area * f * lm * (b.spec === 'farm' ? 0.6 : 1)));
  b.hh = hh; b.jobs = jobs;
}
function bldHeight(b) {
  const r = mulberry32(b.id * 7 + b.level)(), lv = b.level;
  switch (zl(b.zone)) {
    case 1: return 5 + r * 1.5;
    case 2: return 3.3 * (3 + lv * 0.6 + r * 2);
    case 4: return 3.3 * (4 + lv * 0.6 + r * 2);
    case 3: return 3.3 * (8 + lv * 5 + r * 12) * (b.cd >= 4 ? 1 : 0.6);
    case 10: return 3.3 * (3 + lv * 0.7 + r * 2);
    case 5: return 4.5 + r * 3;
    case 6: return 3.3 * (4 + lv * 3 + r * 7);
    case 7: return 3.3 * (7 + lv * 5 + r * 14);
    case 11: return 3.3 * (2 + lv * 0.8 + r * 2);
    case 8: return 7 + r * 6 + lv;
    default: return 6;
  }
}
const NAMES_A = ['Aurora', 'Belvedere', 'Gemma', 'Le Querce', 'Il Gelso', 'Rondine', 'Sole', 'Primavera', 'Torre Azzurra', 'Corallo', 'Delfino', 'Faro', 'Olmo', 'Ginepro', 'Lavanda', 'Mirto', 'Vela', 'Smeraldo', 'Zefiro', 'Melograno'];
const NAMES_P = ['Rossi', 'Bianchi', 'Esposito', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferri', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli'];
const NAMES_F = ['Giulia', 'Marco', 'Sofia', 'Luca', 'Aurora', 'Matteo', 'Alice', 'Lorenzo', 'Emma', 'Leonardo', 'Giorgia', 'Andrea', 'Martina', 'Francesco', 'Chiara', 'Tommaso', 'Sara', 'Riccardo', 'Anna', 'Davide', 'Elena', 'Pietro', 'Noemi', 'Gabriele', 'Beatrice', 'Simone', 'Viola', 'Alessandro', 'Greta', 'Edoardo'];
function bldName(b) {
  const r = mulberry32(b.id * 13); const a = NAMES_A[Math.floor(r() * NAMES_A.length)], p = NAMES_P[Math.floor(r() * NAMES_P.length)];
  const z = ZT[b.zone];
  if (zl(b.zone) === 1) return L('Casa ', 'House ') + p;
  if (zl(b.zone) === 11) return L('Uffici ', 'Offices ') + p;
  if (z.k === 'R' || z.k === 'M') return L('Condominio ', 'Apartments ') + a;
  if (z.k === 'C') return pick2(r, [L('Negozio ', 'Shop ') + p, L('Bar ', 'Café ') + a, L('Supermercato ', 'Market ') + a, L('Ristorante ', 'Restaurant ') + a, L('Hotel ', 'Hotel ') + a]);
  if (z.k === 'O') return L('Uffici ', 'Offices ') + a;
  if (b.spec) return { farm: L('Fattoria ', 'Farm ') + p, forest: L('Segheria ', 'Sawmill ') + p, oil: L('Pozzo petrolifero ', 'Oil well ') + a, ore: L('Miniera ', 'Mine ') + a }[b.spec];
  return L('Fabbrica ', 'Factory ') + p;
}
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }

function drawBuilding(b) {
  removeParts(b.parts); curRef = b;
  const r = mulberry32(b.id * 31 + b.level);
  const z = ZT[b.zone], W = b.cw * CELL - 1.6, D = b.cd * CELL - 1.6, y = b.y, yaw = b.ang;
  const fx = Math.sin(yaw), fz = Math.cos(yaw); // verso il fondo del lotto (lontano dalla strada)
  const at = off => [b.x + fx * off, b.z + fz * off];
  if (b.ruin) { addPart(b.parts, 'plain', b.x, y, b.z, yaw, W, 0.8, D, 0x3b3734); for (let i = 0; i < 4; i++) addPart(b.parts, 'body', b.x + (r() - 0.5) * W * 0.6, y, b.z + (r() - 0.5) * D * 0.6, r() * 3, 2 + r() * 3, 0.8 + r() * 1.5, 2 + r() * 2, 0x2a2725); return; }
  if (b.cons > 0 && !b.spec) { // cantiere: gru gialla
    const [cx, cz] = at(D / 2 - 2), mh = (b.h || 8) + 10;
    addPart(b.parts, 'body', cx, y, cz, yaw, 1.2, mh, 1.2, 0xe0b020);
    addPart(b.parts, 'plain', cx - Math.cos(yaw) * W * 0.3, y + mh, cz + Math.sin(yaw) * W * 0.3, yaw, W * 0.9 + 6, 0.8, 0.8, 0xe0b020);
  }
  if (b.spec === 'farm') {
    addPart(b.parts, 'plain', b.x, y, b.z, yaw, W, 0.25, D, r() < 0.5 ? 0xc9b65a : 0x7fa14a);
    const [bx, bz] = at(-D / 2 + 6); addPart(b.parts, 'body', bx, y, bz, yaw, 7, 5, 9, 0x9b3b2b); addPart(b.parts, 'roof', bx, y + 5, bz, yaw, 7, 2.5, 9, 0x5a5f66);
    return;
  }
  if (b.spec === 'forest') {
    const [bx, bz] = at(-D / 2 + 7); addPart(b.parts, 'body', bx, y, bz, yaw, W * 0.6, 6, 10, 0x8a6a48);
    for (let i = 0; i < 4; i++) { const [px, pz] = at(D / 2 - 5 - i * 4); addPart(b.parts, 'cyl', px, y, pz, yaw, 2.2, 2.2, 2.2, 0x7a5432); }
    return;
  }
  if (b.spec === 'oil') {
    addPart(b.parts, 'plain', b.x, y, b.z, yaw, W, 0.2, D, 0x8a826e);
    for (let i = 0; i < 2; i++) { const [px, pz] = at(-D / 4 + i * D / 2); addPart(b.parts, 'plain', px, y, pz, yaw, 1.2, 7, 6, 0x3a3a3a); addPart(b.parts, 'cyl', px, y, pz + 3, yaw, 3, 4, 3, 0x9a2f2f); }
    return;
  }
  if (b.spec === 'ore') {
    const [bx, bz] = at(-D / 4); addPart(b.parts, 'body', bx, y, bz, yaw, W * 0.7, 9, D * 0.4, 0x6d6a64);
    const [px, pz] = at(D / 4); addPart(b.parts, 'roof', px, y, pz, yaw + 0.5, W * 0.6, 6, D * 0.35, 0x7d6145);
    return;
  }
  const h = b.h;
  const colList = (z.k === 'M' || z.k === 'R') && usTheme() ? PAL_US.R : z.k === 'M' ? PAL.R : PAL[z.k];
  const col = b.col ?? (b.col = colList[Math.floor(r() * colList.length)]);
  if (zl(b.zone) === 1 && usTheme()) { // villetta americana: arretrata, prato davanti, vialetto e garage
    const w = Math.min(W * 0.62, 11), d = Math.min(D * 0.42, 10); const [hx, hz] = at(-D / 2 + d / 2 + 1), [ox, oz] = [hx + Math.cos(yaw) * (W / 2 - w / 2 - 0.5), hz - Math.sin(yaw) * (W / 2 - w / 2 - 0.5)];
    addPart(b.parts, 'body', ox, y, oz, yaw, w, h, d, col);
    addPart(b.parts, 'roof', ox, y + h, oz, yaw + (w > d ? 0 : Math.PI / 2), w > d ? w + 0.8 : d + 0.8, 2.6, w > d ? d + 0.8 : w + 0.8, PAL_US.roof[Math.floor(r() * PAL_US.roof.length)]);
    const gx0 = hx - Math.cos(yaw) * (W / 2 - 2.6), gz0 = hz + Math.sin(yaw) * (W / 2 - 2.6); addPart(b.parts, 'body', gx0, y, gz0, yaw, 4.6, 3, 6, col);
    const [lx, lz] = at(D / 4 + 1); addPart(b.parts, 'plain', lx, y, lz, yaw, W, 0.12, D / 2, 0x7cbf5e);
    const [dx, dz] = at(D / 6 + 2); addPart(b.parts, 'plain', dx - Math.cos(yaw) * (W / 2 - 2.6), y + 0.05, dz + Math.sin(yaw) * (W / 2 - 2.6), yaw, 3.6, 0.14, D * 0.62, 0x9a9a96);
    return;
  }
  if (zl(b.zone) === 1) {
    const w = Math.min(W, 10), d = Math.min(D * 0.55, 11); const [hx, hz] = at(-D / 2 + d / 2 + 2);
    addPart(b.parts, 'body', hx, y, hz, yaw, w, h, d, col);
    addPart(b.parts, 'roof', hx, y + h, hz, yaw + (w > d ? 0 : Math.PI / 2), w > d ? w + 0.6 : d + 0.6, 3, w > d ? d + 0.6 : w + 0.6, PAL.roof[Math.floor(r() * PAL.roof.length)]);
    const [gx, gz] = at(D / 4 + 1); addPart(b.parts, 'plain', gx, y, gz, yaw, W, 0.12, D / 2, 0x6fae55);
    return;
  }
  if (zl(b.zone) === 5) {
    addPart(b.parts, 'body', b.x, y, b.z, yaw, W, h, D * 0.8, col);
    const [ax, az] = at(-D * 0.4); addPart(b.parts, 'plain', ax, y + 3, az, yaw, W, 0.4, 2.2, [0xd04a3a, 0x3a7ad0, 0x3aa060, 0xe0a030][Math.floor(r() * 4)]);
    return;
  }
  if (zl(b.zone) === 8) {
    addPart(b.parts, 'body', b.x, y, b.z, yaw, W, h, D, col);
    addPart(b.parts, 'roof', b.x, y + h, b.z, yaw, W, 2, D, 0x7d8088);
    if (r() < 0.6) { const [cx, cz] = at(D / 3); addPart(b.parts, 'cyl', cx + 3, y, cz, 0, 2, h + 14, 2, 0x8a5a4a); }
    if (r() < 0.5) { const [tx, tz] = at(-D / 4); addPart(b.parts, 'cyl', tx - 5, y, tz, 0, 5, 7, 5, 0xc8c8c0); }
    return;
  }
  // palazzi
  let ww = W, dd = D;
  if (zl(b.zone) === 3 || zl(b.zone) === 7) { ww = W * (0.65 + r() * 0.3); dd = D * (0.65 + r() * 0.3); }
  addPart(b.parts, 'body', b.x, y, b.z, yaw, ww, h, dd, col);
  if (h > 30 && r() < 0.6) addPart(b.parts, 'body', b.x, y + h, b.z, yaw, ww * 0.6, h * 0.12, dd * 0.6, col);
  addPart(b.parts, 'plain', b.x, y + h, b.z, yaw, Math.min(ww * 0.3, 6), 1.8, Math.min(dd * 0.3, 6), 0x9a9a9a);
  if (z.k === 'M' || zl(b.zone) === 6) { const [ax, az] = at(-dd * 0.5); addPart(b.parts, 'plain', ax, y + 3.4, az, yaw, ww, 0.4, 1.8, 0x3a7ad0); }
}
function createBuilding(zone, cs, data) {
  const b = { id: data?.id ?? nextBldId++, zone, cells: cs.map(c => c.id), seg: cs[0].seg, side: cs[0].side, parts: [], level: data?.level ?? 1, occ: data?.occ ?? 0, happy: data?.happy ?? 60, edu: data?.edu ?? 0.2, age: data?.age ?? 0, garb: 0, crime: 0, sick: 0, dead: 0, fire: 0, ruin: data?.ruin ?? 0, aband: data?.aband ?? 0, noPow: 0, noWat: 0, col: data?.col, lvlT: 0, goods: 0 };
  if (data?.id) nextBldId = Math.max(nextBldId, data.id + 1);
  const ks = cs.map(c => c.k), ds = cs.map(c => c.d);
  b.cw = Math.max(...ks) - Math.min(...ks) + 1; b.cd = Math.max(...ds) + 1;
  b.k0 = Math.min(...ks);
  b.x = cs.reduce((a, c) => a + c.x, 0) / cs.length; b.z = cs.reduce((a, c) => a + c.z, 0) / cs.length;
  b.ang = cs[0].ang;
  b.y = Math.min(...cs.map(c => getH(c.x, c.z))) - 0.3;
  const s = segs.get(b.seg); b.along = s ? nearestOnSeg(s, b.x, b.z).along : 0;
  if (ZT[zone].spec) b.spec = data?.spec ?? specAt(b.x, b.z) ?? 'farm';
  if (!data) b.cons = 3;
  bldCapacity(b); b.h = bldHeight(b);
  if (b.occ > (b.hh || b.jobs)) b.occ = b.hh || b.jobs;
  for (const c of cs) c.b = b.id;
  buildings.set(b.id, b);
  const k = bkKey(b.x, b.z); if (!bldBuckets.has(k)) bldBuckets.set(k, new Set()); bldBuckets.get(k).add(b.id);
  drawBuilding(b); if (b.aband) tintParts(b, 0x5a524a);
  const rad = Math.max(b.cw, b.cd) * CELL * 0.75;
  clearTrees((x, z) => true, b.x, b.z, rad);
  cellsDirty = true;
  return b;
}
function destroyBuilding(b, keepCells) {
  if (!b) return;
  removeParts(b.parts);
  for (const id of b.cells) { const c = cells[id]; if (c && c.b === b.id) c.b = 0; }
  buildings.delete(b.id);
  bldBuckets.get(bkKey(b.x, b.z))?.delete(b.id);
  if (selected?.kind === 'bld' && selected.obj === b) selectNone();
  cellsDirty = true;
}
function bldData(b) { return { id: b.id, zone: b.zone, level: b.level, occ: b.occ, happy: b.happy, edu: b.edu, ruin: b.ruin, aband: b.aband, col: b.col, spec: b.spec }; }
function levelUp(b) { b.level++; bldCapacity(b); b.h = bldHeight(b); drawBuilding(b); }

// prova a far nascere un edificio su una cella di fronte alla strada
function trySpawn(c) {
  const z = ZT[c.zone], s = segs.get(c.seg); if (!s || !s.cellMap) return null;
  const r = rand();
  let w, d;
  switch (zl(c.zone)) {
    case 1: w = r < 0.6 ? 1 : 2; d = 2; break;
    case 2: case 4: case 10: w = 2; d = 3 + (r < 0.5 ? 1 : 0); break;
    case 3: case 6: case 7: w = 2 + (r < 0.5 ? 1 : 0); d = 4 + Math.floor(rand() * 3); break;
    case 5: case 11: w = r < 0.5 ? 1 : 2; d = 2 + (rand() < 0.4 ? 1 : 0); break;
    case 8: w = 2 + Math.floor(r * 3); d = 3 + Math.floor(rand() * 3); break;
    case 9: w = 3 + Math.floor(r * 2); d = 4 + Math.floor(rand() * 3); break;
  }
  for (let tryD = d; tryD >= Math.min(2, d); tryD--) for (let tryW = w; tryW >= 1; tryW--) {
    for (let k0 = c.k - tryW + 1; k0 <= c.k; k0++) {
      const cs = []; let ok = true;
      for (let k = k0; k < k0 + tryW && ok; k++) for (let dd = 0; dd < tryD; dd++) {
        const id = s.cellMap.get(cellKey(c.side, k, dd)); const cc = id != null ? cells[id] : null;
        if (!cc || cc.zone !== c.zone || cc.b) { ok = false; break; } cs.push(cc);
      }
      if (ok && cs.length) { if ([3, 7, 6].includes(zl(c.zone))) { if (tryD < 3) continue; } return createBuilding(c.zone, cs); }
    }
  }
  return null;
}
