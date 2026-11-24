// =====================================================================
//  Idee prese dalle mod più usate di Cities: Skylines II - Blocco 3:
//  strumenti e regole. Tutto rifatto da zero, niente codice delle mod.
//  1/2/45/50 aree disegnate (parcheggi, parchi, piazze, spiagge, natura,
//  mercati, complessi di condomini) · 91 riempi l'isolato · 38 oggetti su misura
//  40/123 mappa della città · 51 ricalca una mappa · 101/185 prestazioni
//  122 grafica · 162 eventi · 165 città sotto pressione e Tesoro · 190 vita notturna
//  198 "da finire" e schermo calmo · 232 zone personalizzate · 71 maxischermi
//  151 centro di controllo
// =====================================================================

// ---------- strumenti comuni ----------
function pip(P, x, z) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1] || 1e-9) + a[0]) ins = !ins; } return ins; }
function polyArea(P) { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); }
function meshBuilder() {
  const P = [], N = [], C = [];
  const tri = (a, b, c, col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); N.push(nx / l, ny / l, nz / l); C.push(col[0], col[1], col[2]); } };
  const quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
  const box = (x, y0, h, z, wa, wb, yaw, col, top = col) => {
    const c = Math.cos(yaw), s = Math.sin(yaw), Q = (sa, sb, y) => [x + c * wa * sa + s * wb * sb, y, z - s * wa * sa + c * wb * sb], y1 = y0 + h, cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) { const [a1, b1] = cs[i], [a2, b2] = cs[(i + 1) % 4]; quad(Q(a1, b1, y0), Q(a2, b2, y0), Q(a2, b2, y1), Q(a1, b1, y1), col); }
    quad(Q(-1, -1, y1), Q(1, -1, y1), Q(1, 1, y1), Q(-1, 1, y1), top);
  };
  const mesh = (mat) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return new THREE.Mesh(g, mat); };
  return { tri, quad, box, mesh, P };
}
const hexRGB = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const areaMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 });
const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const gY = (x, z) => Math.max(getH(x, z), WATER) + 0.3;

// ---------- 1 / 2 / 45 / 50: aree disegnate ----------
const AREA_T = {
  parking: { col: 0x4a4b50, cost: 25, n: () => L('Parcheggio', 'Parking lot'), d: () => L('Posti auto con le strisce, alberi sul bordo: le auto ci stanno davvero e paga la sosta', 'Striped bays and trees around: cars really park and pay') },
  park: { col: 0x5f9f4a, cost: 18, n: () => L('Parco', 'Park'), d: () => L('Prato, vialetti verso le strade, alberi, panchine e fontana: case vicine più felici', 'Lawn, paths to the streets, trees, benches and a fountain: happier homes nearby') },
  plaza: { col: 0xc8bba4, cost: 30, n: () => L('Piazza', 'Plaza'), d: () => L('Pavimento in pietra, fontana, panchine e lampioni', 'Stone paving, fountain, benches and lamps') },
  beach: { col: 0xe8d6a0, cost: 12, n: () => L('Spiaggia', 'Beach'), d: () => L('Sabbia, ombrelloni e lettini: piace ai turisti', 'Sand, parasols and loungers: tourists love it') },
  nature: { col: 0x6f9a50, cost: 6, n: () => L('Area naturale', 'Nature area'), d: () => L('Prato selvatico e bosco fitto', 'Wild meadow and dense woods') },
  market: { col: 0xb9a98e, cost: 28, n: () => L('Mercato all\'aperto', 'Open-air market'), d: () => L('Bancarelle colorate: più negozi felici', 'Colourful stalls: happier shops') },
  complex: { col: 0x8fb07a, cost: 40, n: () => L('Complesso di condomini', 'Apartment complex'), d: () => L('Riempie di condomini le celle dentro l\'area, con vialetti, parcheggio e verde', 'Fills the cells inside with apartment blocks, paths, parking and green') },
};
const AREAS = { group: new THREE.Group(), forS: null };
scene.add(AREAS.group);
function areaBuild(a) {
  const M = meshBuilder(), MS = meshBuilder(), P = a.pts, T = AREA_T[a.t], col = hexRGB(T.col);
  const contour = P.map(p => new THREE.Vector2(p[0], p[1])); const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  for (const [i, j, k] of tris) M.tri([P[i][0], gY(P[i][0], P[i][1]), P[i][1]], [P[j][0], gY(P[j][0], P[j][1]), P[j][1]], [P[k][0], gY(P[k][0], P[k][1]), P[k][1]], col);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cz = P.reduce((s, p) => s + p[1], 0) / P.length;
  const R = mulberry32(a.id * 97 + 5), inside = (x, z, m = 2) => pip(P, x, z) && pip(P, x + m, z) && pip(P, x - m, z) && pip(P, x, z + m) && pip(P, x, z - m);
  const flat = (x, z, wa, wb, yaw, c) => { const y = gY(x, z) + 0.05, cc = Math.cos(yaw), s = Math.sin(yaw), Q = (sa, sb) => [x + cc * wa * sa + s * wb * sb, y, z - s * wa * sa + cc * wb * sb]; M.quad(Q(-1, -1), Q(1, -1), Q(1, 1), Q(-1, 1), c); };
  const tree = (x, z, s = 1) => { const y = gY(x, z); MS.box(x, y, 2.4 * s, z, 0.25, 0.25, 0, [0.4, 0.28, 0.16]); MS.box(x, y + 2.4 * s, 3.6 * s, z, 1.5 * s, 1.5 * s, R() * 3, [0.24 + R() * 0.1, 0.46 + R() * 0.1, 0.2]); };
  const bench = (x, z, yaw) => { const y = gY(x, z); MS.box(x, y + 0.4, 0.1, z, 0.9, 0.25, yaw, [0.5, 0.33, 0.2]); MS.box(x, y, 0.4, z, 0.8, 0.05, yaw, [0.2, 0.2, 0.2]); };
  const fountain = (x, z, r = 4) => { const y = gY(x, z); MS.box(x, y, 0.6, z, r, r, 0.4, [0.75, 0.75, 0.72], [0.4, 0.62, 0.85]); MS.box(x, y + 0.6, 2, z, 0.5, 0.5, 0, [0.8, 0.8, 0.78], [0.7, 0.85, 1]); };
  const step = a.t === 'nature' ? 7 : 9;
  // vialetti verso la strada più vicina ai vertici (per parco e piazza)
  if (a.t === 'park') for (const p of P) { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1, yaw = Math.atan2(dx, dz); for (let u = 0; u < l - 3; u += 3) flat(cx + dx / l * u, cz + dz / l * u, 1.2, 1.6, yaw + Math.PI / 2, [0.84, 0.78, 0.64]); }
  if (a.t === 'parking') {
    const yaw = Math.atan2(P[1][0] - P[0][0], P[1][1] - P[0][1]), ux = Math.sin(yaw), uz = Math.cos(yaw), vx = uz, vz = -ux;
    for (let v = -400; v < 400; v += 13) for (let u = -400; u < 400; u += 2.8) {
      const x = cx + ux * u + vx * v, z = cz + uz * u + vz * v; if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      for (const sd of [-1, 1]) { const px = x + vx * sd * 3.2, pz = z + vz * sd * 3.2; if (!inside(px, pz, 2.4)) continue; flat(px - ux * 1.4, pz - uz * 1.4, 0.06, 2.6, yaw + Math.PI / 2, [0.95, 0.95, 0.95]); if (R() < 0.6) { const c = [[0.85, 0.85, 0.85], [0.15, 0.15, 0.17], [0.7, 0.12, 0.1], [0.2, 0.3, 0.6], [0.6, 0.6, 0.62]][Math.floor(R() * 5)], yy = gY(px, pz); MS.box(px, yy + 0.25, 0.75, pz, 0.85, 2.1, yaw + Math.PI / 2 + (R() - 0.5) * 0.1, c); MS.box(px, yy + 1, 0.5, pz, 0.75, 1.1, yaw + Math.PI / 2, [0.25, 0.3, 0.36], c); } }
    }
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], L0 = Math.hypot(q[0] - p[0], q[1] - p[1]); for (let u = 4; u < L0; u += 12) { const x = p[0] + (q[0] - p[0]) * u / L0, z = p[1] + (q[1] - p[1]) * u / L0; tree(x + (cx - x) * 0.02, z + (cz - z) * 0.02, 0.8); } }
  } else if (a.t !== 'complex') {
    for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) {
      const jx = x + (R() - 0.5) * step * 0.7, jz = z + (R() - 0.5) * step * 0.7; if (!inside(jx, jz, 2)) continue; const r = R();
      if (a.t === 'park') { if (r < 0.3) tree(jx, jz); else if (r < 0.36) bench(jx, jz, R() * 3); }
      else if (a.t === 'nature') { if (r < 0.75) tree(jx, jz, 0.8 + R() * 0.6); }
      else if (a.t === 'plaza') { flat(jx, jz, step / 2 - 0.3, step / 2 - 0.3, 0, (Math.round(x / step) + Math.round(z / step)) % 2 ? [0.74, 0.68, 0.58] : [0.8, 0.74, 0.64]); if (r < 0.08) bench(jx, jz, R() * 3); else if (r < 0.12) { const y = gY(jx, jz); MS.box(jx, y, 4.5, jz, 0.1, 0.1, 0, [0.15, 0.15, 0.15]); MS.box(jx, y + 4.5, 0.5, jz, 0.3, 0.3, 0, [1, 0.9, 0.6]); } }
      else if (a.t === 'beach') { if (r < 0.12) { const y = gY(jx, jz), c = [[0.9, 0.2, 0.2], [0.2, 0.5, 0.9], [0.95, 0.8, 0.2], [0.2, 0.7, 0.4]][Math.floor(R() * 4)]; MS.box(jx, y, 2.4, jz, 0.05, 0.05, 0, [0.9, 0.9, 0.9]); MS.box(jx, y + 2.3, 0.3, jz, 1.4, 1.4, R(), c); MS.box(jx + 1.5, y, 0.3, jz, 0.4, 1, 0, [0.95, 0.95, 0.95]); } }
      else if (a.t === 'market') { if (r < 0.35) { const y = gY(jx, jz), c = [[0.9, 0.3, 0.25], [0.95, 0.75, 0.2], [0.25, 0.6, 0.85], [0.35, 0.7, 0.35], [0.85, 0.85, 0.85]][Math.floor(R() * 5)], yw = Math.round(R() * 2) * Math.PI / 2; MS.box(jx, y, 0.9, jz, 1.5, 1, yw, [0.55, 0.4, 0.25]); MS.box(jx, y + 2.2, 0.25, jz, 1.8, 1.3, yw, c); MS.box(jx + 1.4, y, 2.2, jz, 0.05, 0.05, 0, [0.3, 0.3, 0.3]); } }
    }
    if (a.t === 'park' || a.t === 'plaza') fountain(cx, cz, a.t === 'plaza' ? 5 : 3.5);
  } else { // complesso: vialetti, aiuole, parcheggio. I palazzi veri crescono sulle celle
    for (let x = x0 + 6; x < x1; x += 12) for (let z = z0 + 6; z < z1; z += 12) { if (!inside(x, z, 3)) continue; const r = R(); if (r < 0.25) tree(x, z, 0.8); else if (r < 0.45) flat(x, z, 6, 1, 0, [0.84, 0.78, 0.64]); else if (r < 0.55) flat(x, z, 5.5, 2.4, 0, [0.35, 0.36, 0.4]); }
  }
  const g = new THREE.Group(); g.add(M.mesh(areaMat)); if (MS.P.length) g.add(MS.mesh(solidMat)); g.userData.id = a.id; g.children[0].renderOrder = 1; return g;
}
function areasRebuild() {
  while (AREAS.group.children.length) { const g = AREAS.group.children.pop(); g.traverse(o => o.geometry && o.geometry.dispose()); }
  for (const a of S.areas || []) AREAS.group.add(areaBuild(a));
  AREAS.forS = S; areaGrid = null;
}
function finishArea() {
  const P = TOOL.poly; TOOL.poly = null; clearGhost();
  if (!P || P.length < 3) { toast(L('Servono almeno 3 punti', 'You need at least 3 points'), 2000); return; }
  const pts = P.map(p => [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]), A = polyArea(pts), t = TOOL.sub, cost = Math.round(A * AREA_T[t].cost);
  if (A < 40) { toast(L('Area troppo piccola', 'Area too small'), 2000); return; }
  if (A > 400000) { toast(L('Area troppo grande (massimo 40 ettari)', 'Area too large (max 40 ha)'), 2500); return; }
  if (pts.some(p => !isOwned(p[0], p[1]))) { toast(L('Fuori dal tuo territorio', 'Outside your land'), 2000); return; }
  if (!spend(cost)) return;
  S.areas = S.areas || []; S.nextArea = (S.nextArea || 1);
  const a = { id: S.nextArea++, t, pts }; S.areas.push(a); AREAS.group.add(areaBuild(a)); areaGrid = null;
  if (t === 'complex') { // condomini veri sulle celle dentro l'area
    let n = 0; const z = unlocked(ZT[3].ms) ? 2 : 2;
    for (const c of cells) if (c && !c.b && pip(pts, c.x, c.z)) { setZone(c, z); }
    for (const c of cells) if (c && !c.b && c.zone === z && pip(pts, c.x, c.z)) { if (trySpawn(c)) n++; }
    toast('🏢 ' + n + ' ' + L('condomini in costruzione', 'apartment blocks under construction'), 2500);
  }
  toast(AREA_T[t].n() + ' ✓ · ' + fmtMoney(cost), 1800);
}
let areaGrid = null;
function areaNear(x, z, types, r = 150) { // c'è un'area di questi tipi vicino?
  if (!S.areas || !S.areas.length) return false;
  if (!areaGrid) { areaGrid = new Map(); for (const a of S.areas) { for (const p of a.pts.concat([[a.pts.reduce((s, q) => s + q[0], 0) / a.pts.length, a.pts.reduce((s, q) => s + q[1], 0) / a.pts.length]])) { const k = Math.floor(p[0] / 200) + ',' + Math.floor(p[1] / 200); if (!areaGrid.has(k)) areaGrid.set(k, []); areaGrid.get(k).push(a); } } }
  const gx = Math.floor(x / 200), gz = Math.floor(z / 200);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const a of areaGrid.get((gx + i) + ',' + (gz + j)) || []) if (types.includes(a.t)) for (const p of a.pts) if (Math.hypot(p[0] - x, p[1] - z) < r) return a;
  return false;
}
function removeAreaAt(g) {
  if (!S.areas) return false; const i = S.areas.findIndex(a => pip(a.pts, g.x, g.z)); if (i < 0) return false;
  S.areas.splice(i, 1); areasRebuild(); toast(L('Area tolta', 'Area removed'), 1200); return true;
}

// ---------- 91: riempi l'isolato ----------
function fillBlock(g) {
  const near = findNearSeg(g.x, g.z, 40, s => RT[s.type].zone); if (!near) { toast(L('Clicca vicino a una strada con le zone', 'Click near a zoned road'), 2000); return; }
  const s = near.seg, side = ((g.x - near.x) * -near.tz + (g.z - near.z) * near.tx) >= 0 ? 1 : -1, z = TOOL.sub || 2;
  if (!unlocked(ZT[z].ms)) return;
  let n = 0, cost = 0;
  for (const id of s.cells) { const c = cells[id]; if (c && c.side === side && !c.b && (!c.zone || c.zone === z)) setZone(c, z); }
  const list = s.cells.map(id => cells[id]).filter(c => c && c.side === side && c.d === 0).sort((a, b) => a.k - b.k);
  for (const c of list) if (!c.b && c.zone === z) { cost += 4000; if (S.money < cost && !S.opts.unlimited) break; if (trySpawn(c)) n++; }
  if (!S.opts.unlimited) S.money -= n * 4000;
  // giardini negli spazi rimasti vuoti
  let gN = 0; for (const c of list) if (!c.b && rand() < 0.5) { plantTree(c.x, c.z); gN++; }
  toast('🏘️ ' + n + ' ' + L('edifici attaccati', 'attached buildings') + (gN ? ' · 🌳 ' + gN : '') + ' · ' + fmtMoney(n * 4000), 2500);
}

// ---------- 38 + 71: oggetti su misura e maxischermi ----------
const OBJ_SH = { box: () => L('Cubo', 'Box'), cyl: () => L('Cilindro', 'Cylinder'), sphere: () => L('Sfera', 'Sphere'), cone: () => L('Cono', 'Cone'), pyr: () => L('Piramide', 'Pyramid'), ring: () => L('Anello', 'Ring'), arch: () => L('Arco', 'Arch'), led: () => L('Maxischermo LED', 'LED screen'), edit: () => '✏️ ' + L('Modifica / togli', 'Edit / remove') };
const OBJS = { group: new THREE.Group(), forS: null, sel: null };
scene.add(OBJS.group);
const ledCanvas = document.createElement('canvas'); ledCanvas.width = 256; ledCanvas.height = 128;
const ledTex = new THREE.CanvasTexture(ledCanvas); ledTex.encoding = THREE.sRGBEncoding;
const ledMat = new THREE.MeshBasicMaterial({ map: ledTex, side: THREE.DoubleSide });
const LED_ADS = [['Gelateria Polare', '#3ad1ff', '#08223a'], ['Pizza Vulcano', '#ff6a2a', '#2a0a04'], ['Cinema Aurora', '#ffd23a', '#1a0a3a'], ['Concerto stasera!', '#ff3fd0', '#12002a'], ['Banca del Fiume', '#7dff8a', '#04220c'], ['Caffè Tram', '#ffbb6a', '#2a1404']];
function ledDraw() {
  const g = ledCanvas.getContext('2d'), t = performance.now() / 1000, slide = Math.floor(t / 5) % (LED_ADS.length + 2);
  if (slide < LED_ADS.length) { const [txt, fg, bg] = LED_ADS[slide]; g.fillStyle = bg; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 12; i++) { g.fillStyle = `hsla(${(t * 60 + i * 30) % 360},90%,60%,.25)`; g.beginPath(); g.arc(128 + Math.cos(t + i) * 100, 64 + Math.sin(t * 1.3 + i) * 50, 14 + i * 2, 0, 7); g.fill(); } g.fillStyle = fg; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 64 + Math.sin(t * 3) * 4, 240); }
  else if (slide === LED_ADS.length) { g.fillStyle = '#05080f'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#5affc8'; g.font = 'bold 46px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; const h = S ? S.time % 24 : 0; g.fillText(String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'), 128, 50); g.font = '20px sans-serif'; g.fillText((S ? S.name : '') + ' · ' + fmtNum(stats.pop || 0), 128, 100, 240); }
  else { for (let x = 0; x < 256; x += 16) for (let y = 0; y < 128; y += 16) { g.fillStyle = `hsl(${(x + y + t * 120) % 360},85%,${45 + 15 * Math.sin(t * 4 + x * 0.1)}%)`; g.fillRect(x, y, 15, 15); } }
  ledTex.needsUpdate = true;
}
let ledAudio = null, ledLastSound = 0;
function ledSoundTick() {
  if (!SET.ledSound || !(S?.objs || []).some(o => o.s === 'led' && Math.hypot(o.x - cam.tx, o.z - cam.tz) < 300 && cam.dist < 400)) return;
  const now = performance.now(); if (now - ledLastSound < 25000) return; ledLastSound = now;
  try { ledAudio = ledAudio || new (window.AudioContext || window.webkitAudioContext)(); const ac = ledAudio; [523, 659, 784, 1047].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, ac.currentTime + i * 0.15); g.gain.linearRampToValueAtTime(0.03, ac.currentTime + i * 0.15 + 0.02); g.gain.linearRampToValueAtTime(0, ac.currentTime + i * 0.15 + 0.3); o.connect(g); g.connect(ac.destination); o.start(ac.currentTime + i * 0.15); o.stop(ac.currentTime + i * 0.15 + 0.35); }); } catch (e) { }
}
function objMesh(o) {
  if (o.s === 'led') { const g = new THREE.Group(); const sc = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.w / 2), ledMat); sc.position.y = o.h + o.w / 4; g.add(sc); const fr = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x222428 })); fr.scale.set(o.w + 0.6, o.w / 2 + 0.6, 0.4); fr.position.set(0, o.h - 0.3, -0.25); g.add(fr); if (o.h > 0.5) { const p = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x55585e })); p.scale.set(0.6, o.h, 0.6); p.position.z = -0.4; g.add(p); } g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot; return g; }
  const geo = o.s === 'cyl' ? new THREE.CylinderGeometry(0.5, 0.5, 1, 24).translate(0, 0.5, 0) : o.s === 'sphere' ? new THREE.SphereGeometry(0.5, 24, 16).translate(0, 0.5, 0) : o.s === 'cone' ? new THREE.ConeGeometry(0.5, 1, 24).translate(0, 0.5, 0) : o.s === 'pyr' ? new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0) : o.s === 'ring' ? new THREE.TorusGeometry(0.4, 0.1, 10, 32).translate(0, 0.5, 0) : o.s === 'arch' ? new THREE.TorusGeometry(0.42, 0.08, 8, 24, Math.PI) : boxGeo;
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: o.col })); m.scale.set(o.w, o.h, o.d); m.position.set(o.x, o.y, o.z); m.rotation.y = o.rot; return m;
}
function objsRebuild() {
  while (OBJS.group.children.length) { const m = OBJS.group.children.pop(); m.traverse(q => { if (q.geometry && q.geometry !== boxGeo) q.geometry.dispose(); }); }
  for (const o of S.objs || []) { const m = objMesh(o); m.userData.id = o.id; OBJS.group.add(m); }
  OBJS.forS = S;
}
function objTopAt(x, z) { let top = null; bldNear(x, z, 60, b => { if (!b.ruin && obbContains({ x: b.x, z: b.z, ang: b.ang, w: b.cw * CELL - 2, d: b.cd * CELL - 2 }, x, z)) top = Math.max(top ?? -1e9, b.y + (b.h || 8)); }); return top; }
function objPlace(g) {
  const sh = TOOL.sub || 'box';
  if (sh === 'edit') { let best = null, bd = 20; for (const o of S.objs || []) { const d = Math.hypot(o.x - g.x, o.z - g.z); if (d < bd) { bd = d; best = o; } } OBJS.sel = best ? best.id : null; buildSub(); return; }
  const roof = objTopAt(g.x, g.z), y = roof ?? Math.max(getH(g.x, g.z), WATER);
  const o = { id: (S.nextObj = (S.nextObj || 1) + 1), s: sh, x: g.x, z: g.z, y, w: TOOL.oW || 6, h: sh === 'led' ? (roof != null ? 0.5 : (TOOL.oH || 6)) : (TOOL.oH || 6), d: TOOL.oD || 6, rot: (TOOL.oRot || 0) * Math.PI / 180 + (sh === 'led' ? cam.yaw : 0), col: TOOL.oCol || 0xd8d4cc };
  const cost = sh === 'led' ? 15000 : Math.round(200 + o.w * o.h * o.d * 2); if (!spend(cost)) return;
  (S.objs = S.objs || []).push(o); const m = objMesh(o); m.userData.id = o.id; OBJS.group.add(m);
}
function objEdit(k, v) { const o = (S.objs || []).find(q => q.id === OBJS.sel); if (!o) return; if (k === 'del') { S.objs = S.objs.filter(q => q !== o); OBJS.sel = null; } else o[k] = k === 'rot' ? v * Math.PI / 180 : k === 'col' ? parseInt(String(v).slice(1), 16) : +v; objsRebuild(); }
function objHTML() {
  let h = `<div class="subopts"><span>${L('Forma', 'Shape')}:</span>` + Object.keys(OBJ_SH).map(k => `<button class="${(TOOL.sub || 'box') === k ? 'on' : ''}" onclick="TOOL.sub='${k}';buildSub()">${OBJ_SH[k]()}</button>`).join('');
  const sl = (k, n, min, max, v) => `<span>${n}</span><input type="range" min="${min}" max="${max}" value="${v}" oninput="TOOL.${k}=+this.value;this.nextElementSibling.textContent=this.value"><b>${v}</b>`;
  if (TOOL.sub !== 'edit') h += sl('oW', L('Largo', 'Width'), 1, 60, TOOL.oW || 6) + (TOOL.sub === 'led' ? '' : sl('oD', L('Profondo', 'Depth'), 1, 60, TOOL.oD || 6)) + sl('oH', L('Alto', 'Height'), 1, 120, TOOL.oH || 6) + sl('oRot', L('Gira', 'Rotate'), 0, 359, TOOL.oRot || 0) + (TOOL.sub === 'led' ? `<label><input type="checkbox" ${SET.ledSound ? 'checked' : ''} onchange="SET.ledSound=this.checked;saveSettings()"> 🔊 ${L('suono vicino', 'sound nearby')}</label>` : `<span>${L('Colore', 'Colour')}</span><input type="color" value="#${(TOOL.oCol || 0xd8d4cc).toString(16).padStart(6, '0')}" onchange="TOOL.oCol=parseInt(this.value.slice(1),16)">`);
  else { const o = (S.objs || []).find(q => q.id === OBJS.sel); if (!o) h += `<span style="color:var(--mute)">${L('Clicca un oggetto per modificarlo', 'Click an object to edit it')}</span>`; else { const sl2 = (k, n, min, max, v) => `<span>${n}</span><input type="range" min="${min}" max="${max}" value="${v}" onchange="objEdit('${k}',this.value)">`; h += `<b>${OBJ_SH[o.s]()}</b>` + sl2('w', L('Largo', 'Width'), 1, 60, o.w) + sl2('d', L('Profondo', 'Depth'), 1, 60, o.d) + sl2('h', L('Alto', 'Height'), 1, 120, o.h) + sl2('rot', L('Gira', 'Rotate'), 0, 359, Math.round(o.rot * 180 / Math.PI) % 360) + `<input type="color" value="#${o.col.toString(16).padStart(6, '0')}" onchange="objEdit('col',this.value)"><button onclick="objEdit('del')">🗑️ ${L('Togli', 'Remove')}</button>`; } }
  return h + `<span style="color:var(--mute)">${L('Sopra un palazzo va sul tetto', 'Over a building it goes on the roof')}</span></div>`;
}

// ---------- 165 + 151: città sotto pressione, operazioni, editti, Tesoro, centro di controllo ----------
SV.ctrlcenter = { cat: 'misc', w: 90, d: 90, cost: 600000, upk: 9000, ms: 6, unique: true, attr: 3, h: 30, xp: 1500, n: () => L('Centro di controllo della città', 'City control centre'), d2: () => L('Uffici del comune intorno a un parco: operazioni e editti costano il 30% in meno', 'City offices around a park: operations and edicts cost 30% less') };
TREE.push({ id: 't_ctrl', cat: 'misc', cost: 3, items: ['ctrlcenter'], n: () => L('Centro di controllo', 'Control centre') });
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
const OPS = {
  raid: { cost: 40000, m: 2, n: () => L('🚔 Operazione anticrimine', '🚔 Anti-crime operation'), d: () => L('2 mesi: il crimine scende in fretta', '2 months: crime drops fast') },
  vacc: { cost: 30000, m: 3, n: () => L('💉 Campagna di salute', '💉 Health campaign'), d: () => L('3 mesi: meno malati', '3 months: fewer sick people') },
  fireinsp: { cost: 20000, m: 3, n: () => L('🧯 Controlli antincendio', '🧯 Fire inspections'), d: () => L('3 mesi: meno incendi', '3 months: fewer fires') },
  clean: { cost: 25000, m: 2, n: () => L('🧹 Grande pulizia', '🧹 Big clean-up'), d: () => L('2 mesi: meno rifiuti e più felicità', '2 months: less garbage, more happiness') },
};
const EDICTS = {
  curfew: { n: () => L('🌙 Coprifuoco', '🌙 Curfew'), d: () => L('Meno crimine, gente un po\' meno felice', 'Less crime, people a bit less happy') },
  fest: { n: () => L('🎉 Festa cittadina ogni mese', '🎉 Monthly city festival'), d: () => L('Più felici, costa 0,5 € per abitante', 'Happier, costs €0.5 per citizen') },
  solid: { n: () => L('🤝 Tassa di solidarietà', '🤝 Solidarity tax'), d: () => L('+1 € per abitante al mese, un po\' meno felici', '+€1 per citizen per month, a bit less happy') },
};
const opCost = k => Math.round(OPS[k].cost * (1 + stats.pop / 50000) * ([...svcs.values()].some(s => s.type === 'ctrlcenter' && s.on) ? 0.7 : 1));
function runOp(k) { if (!spend(opCost(k))) return; S.ops = S.ops || {}; S.ops[k] = OPS[k].m; toast(OPS[k].n() + ' ✓', 2000); refreshPanels(); }
function toggleEdict(k) { S.edicts = S.edicts || {}; S.edicts[k] = !S.edicts[k]; refreshPanels(); }
{
  const _ub = updateBuilding;
  updateBuilding = function (b) {
    _ub(b); if (b.ruin) return;
    const ops = S.ops || {}, ed = S.edicts || {};
    if (S.strain) { const k = 1 + stats.pop / 150000; b.crime = Math.min(100, b.crime + 0.03 * k); b.sick = (b.sick || 0) + (rand() < 0.002 * k ? 1 : 0); }
    if (ops.raid) b.crime = Math.max(0, b.crime - 0.15);
    if (ops.vacc && b.sick > 0 && rand() < 0.05) b.sick--;
    if (ops.fireinsp && b.fire > 0 && rand() < 0.2) b.fire = 0;
    if (ops.clean) { if (b.garb) b.garb = Math.max(0, b.garb - 0.5); b.happy = Math.min(100, b.happy + 0.03); }
    if (ed.curfew) { b.crime = Math.max(0, b.crime - 0.06); b.happy = Math.max(0, b.happy - 0.02); }
    if (ed.fest) b.happy = Math.min(100, b.happy + 0.04);
    if (ed.solid) b.happy = Math.max(0, b.happy - 0.015);
    if (ZT[b.zone]?.night) b.crime = Math.min(100, b.crime + 0.05);
    // aree vicine: parchi, piazze, natura, spiagge, mercati
    if ((b.n13 = (b.n13 || 0) + 1) % 8 === 0) b.nearArea = !!areaNear(b.x, b.z, ['park', 'plaza', 'nature', 'beach', 'market'], 160);
    if (b.nearArea) b.happy = Math.min(100, b.happy + 0.02);
  };
  const _mo = monthly;
  monthly = function () {
    _mo();
    if (S.ops) for (const k in S.ops) { S.ops[k]--; if (S.ops[k] <= 0) delete S.ops[k]; }
  };
  const _bn = budgetNow;
  budgetNow = function () {
    const bg = _bn(), inc = bg.inc, exp = bg.exp, ed = S.edicts || {};
    let night = 0; for (const b of buildings.values()) if (!b.ruin && !b.aband && ZT[b.zone]?.night && b.jobs) night += (b.wk || 0) * (0.8 + 0.2 * b.level) * 1.7 * 1.5;
    inc.night = Math.round(night * taxEff('C'));
    inc.parkareas = Math.round((S.areas || []).filter(a => a.t === 'parking').reduce((s, a) => s + polyArea(a.pts) * 0.02, 0) * (S.policies.paidpark ? 2 : 1));
    inc.tolls = 0;
    if (ed.solid) inc.solid = stats.pop; if (ed.fest) exp.services = (exp.services || 0) + stats.pop * 0.5;
    bg.ti = Object.keys(inc).reduce((a, k) => a + (typeof inc[k] === 'number' ? inc[k] : 0), 0);
    bg.te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + (exp[k] || 0), 0); bg.net = bg.ti - bg.te;
    return bg;
  };
}
function controlHTML() {
  const bg = budgetNow(), ops = S.ops || {}, ed = S.edicts || {}, has = [...svcs.values()].some(s => s.type === 'ctrlcenter' && s.on);
  let h = `<h3>🏛️ ${L('Centro di controllo', 'Control centre')}<button class="x" onclick="closeSide()">✕</button></h3>`;
  if (!has) h += `<div style="font-size:12px;color:var(--mute)">${L('Costruisci il Centro di controllo (menu Varie) per pagare il 30% in meno.', 'Build the Control centre (Misc menu) to pay 30% less.')}</div>`;
  const avg = k => { let s = 0, n = 0; for (const b of buildings.values()) if (!b.ruin) { s += b[k] || 0; n++; } return n ? s / n : 0; };
  h += `<div class="sec">📋 ${L('Situazione', 'Status')}</div><div class="row"><span>👥 ${L('Abitanti', 'Citizens')}</span><b>${fmtNum(stats.pop)}</b></div><div class="row"><span>🙂 ${L('Felicità', 'Happiness')}</span><b>${Math.round(stats.happy || 0)}%</b></div><div class="row"><span>🚓 ${L('Crimine medio', 'Average crime')}</span><b>${avg('crime').toFixed(1)}</b></div><div class="row"><span>🤒 ${L('Malati', 'Sick')}</span><b>${fmtNum(Math.round(avg('sick') * buildings.size))}</b></div><div class="row"><span>🔥 ${L('Incendi', 'Fires')}</span><b>${[...buildings.values()].filter(b => b.fire > 0).length}</b></div>`;
  h += `<label class="row" title="${L('Crimine e malattie crescono con la città', 'Crime and illness grow with the city')}"><span>⚠️ ${L('Città sotto pressione (più difficile)', 'City under strain (harder)')}</span><input type="checkbox" ${S.strain ? 'checked' : ''} onchange="S.strain=this.checked"></label>`;
  h += `<div class="sec">🛠️ ${L('Operazioni a pagamento', 'Paid operations')}</div>` + Object.keys(OPS).map(k => `<div class="row"><span title="${OPS[k].d()}">${OPS[k].n()}${ops[k] ? ' · ' + ops[k] + ' ' + L('mesi', 'months') : ''}</span><button ${ops[k] ? 'disabled' : ''} onclick="runOp('${k}')">${fmtMoney(opCost(k))}</button></div>`).join('');
  h += `<div class="sec">📜 ${L('Editti', 'Edicts')}</div>` + Object.keys(EDICTS).map(k => `<label class="row" title="${EDICTS[k].d()}"><span>${EDICTS[k].n()}</span><input type="checkbox" ${ed[k] ? 'checked' : ''} onchange="toggleEdict('${k}')"></label>`).join('');
  h += `<div class="sec">💰 ${L('Tesoro: questo mese', 'Treasury: this month')}</div>`;
  const NM = { res: L('Tasse case', 'Home taxes'), com: L('Tasse negozi', 'Shop taxes'), ind: L('Tasse industria', 'Industry taxes'), off: L('Tasse uffici', 'Office taxes'), tour: L('Turismo', 'Tourism'), transit: L('Biglietti trasporti', 'Transit fares'), night: L('Vita notturna', 'Nightlife'), parking: L('Parcheggi', 'Parking'), parkareas: L('Parcheggi disegnati', 'Drawn parking'), solid: L('Solidarietà', 'Solidarity'), tickets: L('Biglietti parchi', 'Park tickets') };
  for (const k in bg.inc) if (typeof bg.inc[k] === 'number' && Math.round(bg.inc[k])) h += `<div class="row"><span>${NM[k] || k}</span><span style="color:var(--good)">+${fmtMoney(Math.round(bg.inc[k]))}</span></div>`;
  for (const k of ['services', 'roads', 'lines', 'loans', 'policies', 'import']) if (Math.round(bg.exp[k] || 0)) h += `<div class="row"><span>${{ services: L('Servizi', 'Services'), roads: L('Strade', 'Roads'), lines: L('Linee', 'Lines'), loans: L('Prestiti', 'Loans'), policies: L('Politiche', 'Policies'), import: L('Importazioni', 'Imports') }[k]}</span><span style="color:var(--bad)">-${fmtMoney(Math.round(bg.exp[k]))}</span></div>`;
  h += `<div class="row"><b>${L('Saldo', 'Net')}</b><b style="color:${bg.net >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtMoney(Math.round(bg.net))}</b></div>`;
  const hist = (S.hist || []).slice(-12);
  if (hist.length) h += `<div class="sec">📈 ${L('Ultimi mesi', 'Last months')}</div><table class="ltab"><tr><th>${L('Mese', 'Month')}</th><th>${L('Entrate', 'In')}</th><th>${L('Uscite', 'Out')}</th><th>${L('Cassa', 'Cash')}</th></tr>` + hist.map((r, i) => `<tr><td>${hist.length - i}</td><td>${fmtMoney(r.inc || 0)}</td><td>${fmtMoney(r.exp || 0)}</td><td>${fmtMoney(r.money || 0)}</td></tr>`).join('') + '</table>';
  return h;
}

// ---------- 162: eventi nei locali ----------
const VENUES = new Set(['stadium', 'arena', 'theatre', 'hubmall']);
const EV_T = { match: [() => L('⚽ Partita', '⚽ Match'), 25, 900], concert: [() => L('🎤 Concerto', '🎤 Concert'), 35, 700], fair: [() => L('🎪 Fiera', '🎪 Fair'), 12, 1200] };
function planEvent(svId, k) {
  const sv = svcs.get(svId); if (!sv) return; S.evq = S.evq || [];
  if (S.evq.some(e => e.sv === svId && !e.done)) { toast(L('C\'è già un evento in programma qui', 'An event is already planned here'), 2000); return; }
  if (!spend(20000)) return;
  const h = S.time % 24, start = S.time + ((20 - h + 24) % 24 || 24) - 2; // la sera (arrivi dalle 18)
  S.evq.push({ sv: svId, k, start, done: false, went: false, back: false });
  toast(EV_T[k][0]() + ' ' + L('in programma stasera', 'planned for tonight'), 2500); refreshPanels();
}
function eventCrowd(sv, n, toVenue) {
  const vs = segs.get(sv.seg); if (!vs) return 0; let made = 0;
  const pool = lists.res.length ? lists.res : [...buildings.values()];
  for (let i = 0; i < n * 2 && made < n; i++) {
    const b = pool[Math.floor(rand() * pool.length)]; const bs = b && segs.get(b.seg); if (!bs) continue;
    const legs = toVenue ? findPath(bs, b.along ?? bs.len / 2, vs, sv.along) : findPath(vs, sv.along, bs, b.along ?? bs.len / 2);
    if (legs && spawnVehicle(rand() < 0.15 ? 'taxi' : 'car', legs)) made++;
  }
  return made;
}
{
  const _st = simTick;
  simTick = function () {
    _st();
    for (const e of S.evq || []) {
      if (e.done) continue; const sv = svcs.get(e.sv); if (!sv) { e.done = true; continue; }
      const [nm, price, cap] = EV_T[e.k], people = Math.round(Math.min(cap, 50 + stats.pop * 0.02));
      if (!e.went && S.time >= e.start) { e.went = true; const n = eventCrowd(sv, Math.min(160, Math.round(people / 6)), true); const inc = people * price; if (!S.opts.unlimited) S.money += inc; S.evIn = (S.evIn || 0) + inc; toast(nm() + ': ' + fmtNum(people) + ' ' + L('persone', 'people') + ' · +' + fmtMoney(inc) + ' · 🚗 ' + n, 3500); }
      if (e.went && !e.back && S.time >= e.start + 3) { e.back = true; eventCrowd(sv, Math.min(160, Math.round(people / 6)), false); e.done = true; }
    }
    if (S.evq && S.evq.length > 30) S.evq = S.evq.filter(e => !e.done);
    if (SET.bigcity) stats.stayHome = Math.max(0, Math.round(20 + stats.pop * 0.045 + stats.tourists * 0.02) - maxVehicles);
  };
  const _sx = svcExtraHTML;
  svcExtraHTML = function (o) {
    let h = _sx(o);
    if (VENUES.has(o.type)) {
      const next = (S.evq || []).find(e => e.sv === o.id && !e.done);
      h += `<div class="sec">🎟️ ${L('Eventi', 'Events')}</div>` + (next ? `<div>${EV_T[next.k][0]()} · ${next.went ? L('in corso', 'on now') : L('stasera', 'tonight')}</div>` : Object.keys(EV_T).map(k => `<button onclick="planEvent(${o.id},'${k}')">${EV_T[k][0]()} · ${fmtMoney(20000)}</button>`).join(' ')) + `<div style="font-size:12px;color:var(--mute)">${L('Arriva tanta gente in auto: occhio al traffico. Incassi', 'Lots of people arrive by car: watch the traffic. Earned')} ${fmtMoney(Math.round(S.evIn || 0))}</div>`;
    }
    return h;
  };
}

// ---------- 190: zona commerciale vita notturna ----------
POOLS.nlneon = new InstPool(boxGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 12000);
ZT[18] = { k: 'C', dens: 1, like: 5, night: true, col: 0xff5fb0, ms: 3, n: () => L('Vita notturna (locali e neon: +150% tasse, più crimine)', 'Nightlife (bars & neon: +150% taxes, more crime)'), sh: () => L('Notte', 'Nightlife') };
if (!ZONE_ORDER.includes(18)) ZONE_ORDER.splice(ZONE_ORDER.indexOf(5) + 1, 0, 18);
{
  const _db = drawBuilding;
  drawBuilding = function (b) {
    const z = ZT[b.zone];
    if (z && z.custom) { // zone personalizzate: si disegnano come una delle zone scelte
      const looks = z.looks && z.looks.length ? z.looks : [z.like], real = b.zone; b.zone = looks[Math.floor(mulberry32(b.id * 31 + 7)() * looks.length)];
      try { _db(b); } finally { b.zone = real; }
      return;
    }
    _db(b);
    if (!z || !z.night || b.ruin || b.cons > 0) return;
    const prev = curRef; curRef = b;
    const W = b.cw * CELL - 1.6, D = b.cd * CELL - 1.6, fx = Math.sin(b.ang), fz = Math.cos(b.ang), rx = Math.cos(b.ang), rz = -Math.sin(b.ang), h = Math.max(6, b.h || 8), r = mulberry32(b.id * 17);
    const cols = [0xff3fa8, 0xffd23a, 0xff5fd8, 0x3ae8ff, 0xffa03a];
    for (let i = 0; i < 3; i++) { const a = (r() - 0.5) * W * 0.7, y = 2.5 + r() * (h - 4), off = -D / 2 - 0.15; addPart(b.parts, 'nlneon', b.x + fx * off + rx * a, b.y + y, b.z + fz * off + rz * a, b.ang, 2 + r() * 4, 0.6 + r() * 0.8, 0.2, cols[Math.floor(r() * cols.length)]); }
    addPart(b.parts, 'nlneon', b.x - fx * (D / 2 + 0.1), b.y + h - 0.4, b.z - fz * (D / 2 + 0.1), b.ang, W * 0.9, 0.25, 0.2, cols[Math.floor(r() * cols.length)]);
    curRef = prev;
  };
  const _us = updateSky;
  updateSky = function (...a) { const r = _us.apply(this, a); const n = bldU.uNight.value; POOLS.nlneon.mesh.material.color.setScalar(0.25 + n * 1.1); return r; };
}

// ---------- 232: zone personalizzate ----------
function czRegister(list) {
  for (const c of list || []) {
    const base = ZT[c.base]; if (!base) continue;
    ZT[c.id] = { ...base, like: zl(c.base), col: c.col, custom: true, looks: c.looks, n: () => c.name, sh: () => c.name, ms: 0 };
    if (!ZONE_ORDER.includes(c.id)) ZONE_ORDER.push(c.id);
  }
}
function czCreate() {
  const name = ($('czName')?.value || '').trim().slice(0, 24), base = +($('czBase')?.value || 1), col = parseInt(($('czCol')?.value || '#ff8800').slice(1), 16);
  if (!name) { toast(L('Scrivi un nome', 'Type a name'), 1500); return; }
  const looks = [...document.querySelectorAll('.czLook:checked')].map(e => +e.value);
  S.czones = S.czones || []; const id = Math.max(29, ...S.czones.map(c => c.id)) + 1;
  const c = { id, name, base, col, looks: looks.length ? looks : [base] }; S.czones.push(c); czRegister([c]);
  toast('🧩 ' + name + ' ✓', 1500); buildSub();
}
function czHTML() {
  const bases = Object.keys(ZT).map(Number).filter(k => !ZT[k].custom && !ZT[k].spec);
  const curBase = +(window._czBase || 1), k = ZT[curBase]?.k;
  let h = `<details style="width:100%"><summary style="cursor:pointer">🧩 ${L('Crea la tua zona', 'Create your own zone')}</summary><div class="subopts" style="flex-wrap:wrap"><span>${L('Nome', 'Name')}</span><input id="czName" maxlength="24" style="width:120px"><span>${L('Si comporta come', 'Behaves like')}</span><select id="czBase" onchange="window._czBase=this.value;buildSub()">` + bases.map(b => `<option value="${b}" ${b === curBase ? 'selected' : ''}>${ZT[b].sh()}</option>`).join('') + `</select><span>${L('Colore', 'Colour')}</span><input type="color" id="czCol" value="#ff8800"><span>${L('Edifici che ci crescono', 'Buildings that grow')}:</span>`;
  h += bases.filter(b => ZT[b].k === k).map(b => `<label style="white-space:nowrap"><input type="checkbox" class="czLook" value="${b}" ${b === curBase ? 'checked' : ''}> ${ZT[b].sh()}</label>`).join('');
  return h + `<button onclick="czCreate()">✓ ${L('Crea', 'Create')}</button></div></details>`;
}
{
  const _des = deserializeG;
  deserializeG = function* (json) {
    try { const i = json.indexOf('"czones"'); if (i >= 0) { const D = JSON.parse(json); czRegister(D.S && D.S.czones); } } catch (e) { }
    yield* _des(json);
    if (S && S.czones) czRegister(S.czones);
    areasRebuild(); objsRebuild();
  };
}

// ---------- 40 + 123 + 51: mappa della città e ricalco ----------
const CMAP = { el: null, cv: null, sc: 0.1, cx: 0, cz: 0, style: 'light', route: null, pickA: null, mode: 'look', hl: null, ovl: null };
const CMAP_ST = { light: { bg: '#eef0ec', water: '#9ec9ea', road: '#ffffff', edge: '#c9cbc6', hw: '#f2c45a', rail: '#6a6a6a', txt: '#333' }, dark: { bg: '#141820', water: '#1d3550', road: '#59606e', edge: '#2a303a', hw: '#c99a3a', rail: '#8a8a8a', txt: '#ddd' }, metro: { bg: '#ffffff', water: '#d6ebf8', road: '#e6e6e6', edge: '#e6e6e6', hw: '#e0e0e0', rail: '#bbbbbb', txt: '#222' } };
function cmapOpen() {
  if (!CMAP.el) {
    const el = document.createElement('div'); el.id = 'cmap'; el.style.cssText = 'position:fixed;inset:60px 20px 20px 20px;z-index:40;background:var(--panel,#1b2029);border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;color:var(--txt,#eee);font:13px system-ui,sans-serif';
    el.innerHTML = `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px"><b>🗺️ ${L('Mappa della città', 'City map')}</b><input id="cmS" placeholder="${L('Cerca una via o un edificio…', 'Search a street or building…')}" style="width:200px"><button id="cmGo">🔍</button><select id="cmSt"><option value="light">${L('Moderna chiara', 'Modern light')}</option><option value="dark">${L('Scura', 'Dark')}</option><option value="metro">${L('Schema delle linee', 'Line diagram')}</option></select><button id="cmR">🧭 ${L('Percorso A → B', 'Route A → B')}</button><button id="cmDl">⬇️ ${L('Scarica immagine', 'Download image')}</button><span style="flex:1"></span><label>🖼️ ${L('Ricalca una mappa', 'Trace a map')} <input type="file" id="cmF" accept="image/*" style="width:180px"></label><button id="cmX">✕</button></div><div id="cmI" style="padding:0 8px 6px;font-size:12px;opacity:.85"></div><canvas id="cmC" style="flex:1;width:100%;cursor:grab"></canvas>`;
    document.body.appendChild(el); CMAP.el = el; CMAP.cv = el.querySelector('#cmC');
    el.querySelector('#cmX').onclick = () => { el.style.display = 'none'; };
    el.querySelector('#cmSt').onchange = e => { CMAP.style = e.target.value; cmapDraw(); };
    el.querySelector('#cmR').onclick = () => { CMAP.mode = 'A'; CMAP.route = null; cmapInfo(L('Clicca la partenza sulla mappa', 'Click the start on the map')); };
    el.querySelector('#cmGo').onclick = cmapSearch; el.querySelector('#cmS').onkeydown = e => { if (e.key === 'Enter') cmapSearch(); };
    el.querySelector('#cmDl').onclick = cmapDownload;
    el.querySelector('#cmF').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) traceLoad(f); };
    const cv = CMAP.cv; let drag = null;
    cv.addEventListener('wheel', e => { e.preventDefault(); const k = e.deltaY > 0 ? 0.85 : 1.18, r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, wx = CMAP.cx + (mx - cv.width / 2) / CMAP.sc, wz = CMAP.cz + (my - cv.height / 2) / CMAP.sc; CMAP.sc = clamp(CMAP.sc * k, 0.004, 3); CMAP.cx = wx - (mx - cv.width / 2) / CMAP.sc; CMAP.cz = wz - (my - cv.height / 2) / CMAP.sc; cmapDraw(); }, { passive: false });
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, cx: CMAP.cx, cz: CMAP.cz, moved: false }; });
    addEventListener('mousemove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; CMAP.cx = drag.cx - dx / CMAP.sc; CMAP.cz = drag.cz - dy / CMAP.sc; if (drag.moved) cmapDraw(); });
    addEventListener('mouseup', e => { if (!drag) return; const d = drag; drag = null; if (d.moved) return; const r = cv.getBoundingClientRect(); if (e.clientX < r.left || e.clientY < r.top || e.clientX > r.right || e.clientY > r.bottom) return; const wx = CMAP.cx + (e.clientX - r.left - cv.width / 2) / CMAP.sc, wz = CMAP.cz + (e.clientY - r.top - cv.height / 2) / CMAP.sc; cmapClick(wx, wz); });
  }
  CMAP.el.style.display = 'flex';
  const r = CMAP.cv.getBoundingClientRect(); CMAP.cv.width = Math.max(300, r.width | 0); CMAP.cv.height = Math.max(200, r.height | 0);
  CMAP.cx = cam.tx; CMAP.cz = cam.tz; CMAP.sc = clamp(CMAP.cv.width / Math.max(1500, cam.dist * 2.5), 0.004, 3);
  cmapDraw(); cmapInfo(L('Rotellina per lo zoom, trascina per muoverti. Clic su una via per vederne il nome.', 'Wheel to zoom, drag to move. Click a street to see its name.'));
}
function cmapInfo(t) { const e = document.getElementById('cmI'); if (e) e.innerHTML = t; }
function cmapRender(cv, sc, cx, cz, styleK) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, st = CMAP_ST[styleK], X = x => (x - cx) * sc + W / 2, Z = z => (z - cz) * sc + H / 2;
  g.fillStyle = st.bg; g.fillRect(0, 0, W, H);
  const x0 = cx - W / 2 / sc, x1 = cx + W / 2 / sc, z0 = cz - H / 2 / sc, z1 = cz + H / 2 / sc, step = Math.max(8, 6 / sc);
  g.fillStyle = st.water; for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) if (isWater(x, z)) g.fillRect(X(x) - 0.5, Z(z) - 0.5, step * sc + 1, step * sc + 1);
  for (const ar of S?.areas || []) { g.fillStyle = '#' + AREA_T[ar.t].col.toString(16).padStart(6, '0'); g.globalAlpha = 0.6; g.beginPath(); ar.pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))); g.closePath(); g.fill(); g.globalAlpha = 1; }
  if (styleK !== 'metro') for (const b of buildings.values()) { if (b.ruin || b.x < x0 - 50 || b.x > x1 + 50 || b.z < z0 - 50 || b.z > z1 + 50) continue; const w = Math.max(1.2, b.cw * CELL * sc * 0.85), d = Math.max(1.2, b.cd * CELL * sc * 0.85); g.save(); g.translate(X(b.x), Z(b.z)); g.rotate(-b.ang); const c = ZT[b.zone]?.col ?? 0x999999; g.fillStyle = styleK === 'dark' ? '#' + ((c >> 1) & 0x7f7f7f).toString(16).padStart(6, '0') : '#' + c.toString(16).padStart(6, '0'); g.globalAlpha = 0.55; g.fillRect(-w / 2, -d / 2, w, d); g.restore(); }
  g.globalAlpha = 1;
  for (const sv of svcs.values()) { if (sv.x < x0 - 800 || sv.x > x1 + 800 || sv.z < z0 - 800 || sv.z > z1 + 800) continue; g.save(); g.translate(X(sv.x), Z(sv.z)); g.rotate(-sv.ang); g.fillStyle = SV[sv.type].cat === 'parks' ? '#7fbf6a' : '#b8b0c8'; g.globalAlpha = 0.8; g.fillRect(-sv.w * sc / 2, -sv.d * sc / 2, sv.w * sc, sv.d * sc); g.restore(); }
  g.globalAlpha = 1; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pass of [0, 1]) for (const s of segs.values()) {
    const rt = RT[s.type]; const p0 = s.pts[0]; if (Math.min(...[p0.x, s.pts[s.pts.length - 1].x]) > x1 + 300 || Math.max(p0.x, s.pts[s.pts.length - 1].x) < x0 - 300) continue;
    g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z)));
    if (rt.rail) { if (pass) { g.strokeStyle = st.rail; g.lineWidth = Math.max(1, 2 * sc); g.setLineDash([6, 4]); g.stroke(); g.setLineDash([]); } continue; }
    const w = Math.max(rt.ped ? 0.6 : 1, rt.w * sc);
    g.strokeStyle = pass ? (rt.hw ? st.hw : rt.ped ? st.edge : st.road) : st.edge; g.lineWidth = pass ? w : w + 2; g.stroke();
  }
  if (CMAP.route) { g.strokeStyle = '#e8304a'; g.lineWidth = Math.max(3, 5 * sc); g.beginPath(); CMAP.route.pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z))); g.stroke(); }
  for (const ln of lines) { const stp = ln.stops.map(s => s.svc ? svcs.get(s.svc) : s).filter(Boolean); if (stp.length < 2) continue; g.strokeStyle = '#' + ln.col.toString(16).padStart(6, '0'); g.lineWidth = styleK === 'metro' ? 6 : 3; g.globalAlpha = styleK === 'metro' ? 1 : 0.8; g.beginPath(); stp.concat([stp[0]]).forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z))); g.stroke(); g.globalAlpha = 1; for (const [i, s] of ln.stops.entries()) if (!s.wp) { const p = stp[i] || s; g.fillStyle = '#fff'; g.strokeStyle = '#' + ln.col.toString(16).padStart(6, '0'); g.lineWidth = 2; g.beginPath(); g.arc(X(p.x), Z(p.z), styleK === 'metro' ? 5 : 3, 0, 7); g.fill(); g.stroke(); } }
  if (sc > 0.25) { g.fillStyle = st.txt; g.font = '11px system-ui,sans-serif'; g.textAlign = 'center'; const seen = new Set(); for (const s of segs.values()) { const nm = typeof streetName === 'function' ? streetName(s) : ''; if (!nm || seen.has(nm)) continue; const m = s.pts[s.pts.length >> 1]; if (m.x < x0 || m.x > x1 || m.z < z0 || m.z > z1) continue; seen.add(nm); g.fillText(nm, X(m.x), Z(m.z) - 4); } }
  if (CMAP.hl) { g.strokeStyle = '#ff2a6a'; g.lineWidth = 3; g.beginPath(); g.arc(X(CMAP.hl.x), Z(CMAP.hl.z), 14, 0, 7); g.stroke(); }
  g.fillStyle = st.txt; g.font = 'bold 14px system-ui,sans-serif'; g.textAlign = 'left'; g.fillText(S?.name || '', 10, H - 12);
  const bar = 500 * sc; g.fillRect(W - 20 - bar, H - 16, bar, 3); g.font = '11px system-ui,sans-serif'; g.fillText('500 m', W - 20 - bar, H - 22);
}
function cmapDraw() { if (CMAP.cv) cmapRender(CMAP.cv, CMAP.sc, CMAP.cx, CMAP.cz, CMAP.style); }
function cmapSearch() {
  const q = ($('cmS')?.value || '').trim().toLowerCase(); if (!q) return;
  let hit = null;
  for (const s of segs.values()) { const nm = typeof streetName === 'function' ? streetName(s) : ''; if (nm && nm.toLowerCase().includes(q)) { const m = s.pts[s.pts.length >> 1]; hit = { x: m.x, z: m.z, n: nm }; break; } }
  if (!hit) for (const b of buildings.values()) { const nm = bldName(b); if (nm && nm.toLowerCase().includes(q)) { hit = { x: b.x, z: b.z, n: nm }; break; } }
  if (!hit) for (const sv of svcs.values()) { const nm = sv.name || SV[sv.type].n(); if (nm.toLowerCase().includes(q)) { hit = { x: sv.x, z: sv.z, n: nm }; break; } }
  if (!hit) { cmapInfo(L('Non trovato', 'Not found')); return; }
  CMAP.hl = hit; CMAP.cx = hit.x; CMAP.cz = hit.z; CMAP.sc = Math.max(CMAP.sc, 0.4); cmapDraw(); cmapInfo('📍 ' + hit.n + ` <button onclick="cam.tx=${hit.x.toFixed(1)};cam.tz=${hit.z.toFixed(1)};cam.dist=400;document.getElementById('cmap').style.display='none'">${L('Vai lì', 'Go there')}</button>`);
}
function cmapClick(x, z) {
  if (CMAP.mode === 'A' || CMAP.mode === 'B') {
    const n = findNearSeg(x, z, 200, s => !RT[s.type].rail && !RT[s.type].ped); if (!n) { cmapInfo(L('Clicca più vicino a una strada', 'Click closer to a road')); return; }
    if (CMAP.mode === 'A') { CMAP.pickA = n; CMAP.mode = 'B'; CMAP.hl = { x: n.x, z: n.z }; cmapDraw(); cmapInfo(L('Ora clicca l\'arrivo', 'Now click the destination')); return; }
    const legs = findPath(CMAP.pickA.seg, CMAP.pickA.along, n.seg, n.along); CMAP.mode = 'look';
    if (!legs) { cmapInfo(L('Nessuna strada collega i due punti', 'No road connects the two points')); return; }
    const pts = []; let len = 0; for (const lg of legs) { const e = lg.e; for (let i = 0; i < e.pts.length; i++) if (e.cum[i] >= (lg.s0 ?? 0) - 1 && e.cum[i] <= (lg.s1 ?? e.len) + 1) pts.push(e.pts[i]); len += (lg.s1 ?? e.len) - (lg.s0 ?? 0); }
    CMAP.route = { pts }; CMAP.hl = { x: n.x, z: n.z }; cmapDraw();
    cmapInfo(`🧭 ${(len / 1000).toFixed(2)} km · 🚗 ~${Math.max(1, Math.round(len / 1000 / 35 * 60))} min · 🚶 ~${Math.max(1, Math.round(len / 1000 / 4.5 * 60))} min`); return;
  }
  const n = findNearSeg(x, z, 30); if (n) { const nm = typeof streetName === 'function' ? streetName(n.seg) : ''; cmapInfo('📍 ' + (nm || RT[n.seg.type].n()) + ' · ' + RT[n.seg.type].n()); }
}
function cmapDownload() {
  const c = document.createElement('canvas'); c.width = 2400; c.height = 1600;
  cmapRender(c, CMAP.sc * 2400 / CMAP.cv.width, CMAP.cx, CMAP.cz, CMAP.style);
  const a = document.createElement('a'); a.download = (S?.name || 'citta').replace(/[^\w\- ]/g, '') + '-mappa.png'; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
}
// ricalco: un'immagine semitrasparente sopra il terreno
const TRACE = { mesh: null, op: 0.5, size: 4000, rot: 0 };
function traceLoad(file) {
  const url = URL.createObjectURL(file); new THREE.TextureLoader().load(url, t => {
    t.encoding = THREE.sRGBEncoding; if (TRACE.mesh) { scene.remove(TRACE.mesh); TRACE.mesh.material.map?.dispose(); }
    const asp = t.image.height / t.image.width;
    TRACE.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, asp).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: TRACE.op, depthWrite: false, depthTest: false }));
    TRACE.mesh.renderOrder = 10; TRACE.mesh.position.set(cam.tx, Math.max(getH(cam.tx, cam.tz), WATER) + 40, cam.tz); TRACE.mesh.scale.setScalar(TRACE.size); scene.add(TRACE.mesh);
    if (CMAP.el) CMAP.el.style.display = 'none'; traceBar();
  });
}
function traceBar() {
  let el = document.getElementById('tracebar'); if (!el) { el = document.createElement('div'); el.id = 'tracebar'; el.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:30;background:rgba(15,20,28,.85);color:#fff;border-radius:10px;padding:6px 10px;font:12px system-ui,sans-serif;display:flex;gap:8px;align-items:center'; document.body.appendChild(el); }
  el.style.display = TRACE.mesh ? 'flex' : 'none'; if (!TRACE.mesh) return;
  el.innerHTML = `🖼️ ${L('Ricalco', 'Trace')} <span>${L('Trasparenza', 'Opacity')}</span><input type="range" min="5" max="100" value="${TRACE.op * 100}" oninput="TRACE.op=this.value/100;TRACE.mesh.material.opacity=TRACE.op"><span>${L('Grandezza', 'Size')}</span><input type="range" min="300" max="40000" step="100" value="${TRACE.size}" oninput="TRACE.size=+this.value;TRACE.mesh.scale.setScalar(TRACE.size)"><span>${L('Gira', 'Rotate')}</span><input type="range" min="0" max="359" value="${TRACE.rot}" oninput="TRACE.rot=+this.value;TRACE.mesh.rotation.y=TRACE.rot*Math.PI/180"><button onclick="TRACE.mesh.position.x=cam.tx;TRACE.mesh.position.z=cam.tz">📍 ${L('Porta qui', 'Move here')}</button><button onclick="scene.remove(TRACE.mesh);TRACE.mesh=null;traceBar()">✕</button>`;
}

// ---------- 198: "da finire" e schermo calmo ----------
function todoList() {
  const out = [];
  for (const ln of lines) if (!ln.ok && !ln.off) { const p = ln.stops[0] && (ln.stops[0].svc ? svcs.get(ln.stops[0].svc) : ln.stops[0]); out.push(['🚌 ' + ln.name + ': ' + L('linea non funziona (servono almeno 2 fermate collegate)', 'line not working (needs at least 2 connected stops)'), p]); }
  for (const sv of svcs.values()) if (!sv.on && SV[sv.type].upk) out.push(['🏗️ ' + (sv.name || SV[sv.type].n()) + ': ' + L('spento o senza corrente/acqua', 'off or without power/water'), sv]);
  let dead = 0, first = null; for (const n of nodes.values()) if (n.segs.length === 1 && !n.outside && !n.rhw) { const s = segs.get(n.segs[0]); if (s && RT[s.type].zone && s.len > 30) { dead++; first = first || n; } }
  if (dead) out.push(['🛣️ ' + dead + ' ' + L('strade senza uscita (forse da collegare)', 'dead-end roads (maybe unfinished)'), first]);
  let empty = 0, fz = null; for (const c of cells) if (c && c.zone && !c.b) { empty++; fz = fz || c; } if (empty > 200) out.push(['🧱 ' + fmtNum(empty) + ' ' + L('celle con la zona ma ancora vuote', 'zoned cells still empty'), fz]);
  return out.slice(0, 40);
}
function todoHTML() {
  let h = `<h3>📝 ${L('Da finire', 'To finish')}<button class="x" onclick="closeSide()">✕</button></h3>`;
  if (S.lastTool) h += `<div class="row"><span>${L('Stavi usando', 'You were using')}: <b>${S.lastTool}</b></span><button onclick="cam.tx=${(S.lastPos || [cam.tx])[0]};cam.tz=${(S.lastPos || [0, cam.tz])[1]};cam.dist=500">📍</button></div>`;
  const L0 = todoList(); if (!L0.length) h += `<div style="color:var(--good)">✓ ${L('Niente di lasciato a metà', 'Nothing left half-done')}</div>`;
  L0.forEach(([t, p]) => { h += `<div class="row"><span style="font-size:12px">${t}</span>${p ? `<button onclick="cam.tx=${p.x.toFixed(1)};cam.tz=${p.z.toFixed(1)};cam.dist=450">📍</button>` : ''}</div>`; });
  h += `<div class="sec">✏️ ${L('I tuoi appunti', 'Your notes')}</div><textarea style="width:100%;height:90px" oninput="S.notes=this.value" placeholder="${L('Es. finire il quartiere nord, collegare la metro…', 'E.g. finish the north district, connect the metro…')}">${(S.notes || '').replace(/</g, '&lt;')}</textarea>`;
  h += `<label class="row"><span>🧘 ${L('Schermo calmo (meno messaggi e scritte)', 'Calm screen (fewer messages and labels)')}</span><input type="checkbox" ${SET.calm ? 'checked' : ''} onchange="SET.calm=this.checked;saveSettings();applyCalm()"></label>`;
  return h;
}
function applyCalm() { const f = $('feed'); if (f) f.style.display = SET.calm ? 'none' : ''; document.body.classList.toggle('calm', !!SET.calm); }
{ const st = document.createElement('style'); st.textContent = 'body.calm .lbl, body.calm .warn{opacity:.25}'; document.head.appendChild(st); }
{
  const _tt = toast;
  toast = function (t, ms) { if (SET.calm && ms && ms < 2600 && !/⚠|💥|🔥|❗/.test(String(t))) return; return _tt(t, ms); };
  const _set = setTool;
  setTool = function (kind, sub) { _set(kind, sub); if (kind && S) { S.lastTool = (kind === 'road' && RT[sub] ? RT[sub].n() : kind === 'zone' && ZT[sub] ? ZT[sub].sh() : kind === 'svc' && SV[sub] ? SV[sub].n() : kind === 'area' && AREA_T[sub] ? AREA_T[sub].n() : kind); S.lastPos = [Math.round(cam.tx), Math.round(cam.tz)]; } };
}

// ---------- 101 / 185 / 122: prestazioni e grafica ----------
const ROAD_TINTS = { normal: [1, 1, 1], dark: [0.75, 0.75, 0.78], light: [1.25, 1.25, 1.22], red: [1.2, 0.95, 0.9], warm: [1.1, 1.04, 0.92] };
function applyGfx() {
  const c = renderer.domElement; c.style.filter = `brightness(${SET.gBri ?? 1}) contrast(${SET.gCon ?? 1}) saturate(${SET.gSat ?? 1})`;
  const t = ROAD_TINTS[SET.gRoad || 'normal'] || ROAD_TINTS.normal; ROAD_TINT.setRGB(t[0], t[1], t[2]); updateSky.rk2 = -1;
  if (SET.turbo) { SET.parkedCars = false; SET.railSignals = false; } else { SET.parkedCars = SET.parkedCars0 ?? true; SET.railSignals = true; }
  for (const c2 of chunkMeshes.keys()) roadDirty.add(c2);
}
{
  const _ms = menuSettings;
  menuSettings = function () {
    _ms();
    const p = $('menuPan'); if (!p) return; const back = [...p.querySelectorAll('button.big')].pop();
    const d = document.createElement('div');
    const sl = (id, n, min, max, st, v) => `<div class="r"><span>${n}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${st}" value="${v}"></div>`;
    d.innerHTML = `<h3 style="margin:14px 0 6px">⚡ ${L('Prestazioni', 'Performance')}</h3>
      <div class="r"><span>${L('Città grande: chi non trova posto in strada resta a casa (ma conta)', 'Big city: people who don\'t fit on the roads stay home (but count)')}</span><input type="checkbox" id="sBig" ${SET.bigcity ? 'checked' : ''}></div>
      <div class="r"><span>${L('Turbo: niente auto parcheggiate e segnali dei treni (PC lenti)', 'Turbo: no parked cars and rail signals (slow PCs)')}</span><input type="checkbox" id="sTurbo" ${SET.turbo ? 'checked' : ''}></div>
      <div class="r"><span>${L('Auto parcheggiate (anche storte)', 'Parked cars (some crooked)')}</span><input type="checkbox" id="sPark" ${SET.parkedCars0 !== false ? 'checked' : ''}></div>
      <h3 style="margin:14px 0 6px">🎨 ${L('Grafica', 'Graphics')}</h3>
      ${sl('sBri', L('Luminosità', 'Brightness'), 0.6, 1.4, 0.02, SET.gBri ?? 1)}${sl('sCon', L('Contrasto', 'Contrast'), 0.7, 1.4, 0.02, SET.gCon ?? 1)}${sl('sSat', L('Colori', 'Saturation'), 0.3, 1.8, 0.02, SET.gSat ?? 1)}
      <div class="r"><span>${L('Colore dell\'asfalto', 'Asphalt colour')}</span><select id="sRoadT">${Object.keys(ROAD_TINTS).map(k => `<option value="${k}" ${(SET.gRoad || 'normal') === k ? 'selected' : ''}>${{ normal: L('Normale', 'Normal'), dark: L('Scuro', 'Dark'), light: L('Chiaro', 'Light'), red: L('Rossiccio', 'Reddish'), warm: L('Caldo', 'Warm') }[k]}</option>`).join('')}</select></div>`;
    if (back) p.insertBefore(d, back); else p.appendChild(d);
    const on = (id, f) => { const e = $(id); if (e) e.oninput = e.onchange = ev => { f(ev.target); saveSettings(); applyGfx(); }; };
    on('sBig', e => SET.bigcity = e.checked); on('sTurbo', e => SET.turbo = e.checked); on('sPark', e => SET.parkedCars0 = e.checked);
    on('sBri', e => SET.gBri = +e.value); on('sCon', e => SET.gCon = +e.value); on('sSat', e => SET.gSat = +e.value); on('sRoadT', e => SET.gRoad = e.value);
  };
  const _tt = tripTarget;
  tripTarget = function () { const t = _tt(); if (!SET.bigcity) return t; const h = S.time % 24, rush = (h > 7 && h < 9.5) || (h > 17 && h < 19.5); return Math.round(t * (rush ? 0.85 : 1.05)); }; // ora di punta distribuita
  const _stats = typeof statsHTML === 'function' ? statsHTML : null; void _stats;
}

// ---------- strumenti nel menu delle zone e pulsanti a destra ----------
{
  const _bs = buildSub;
  buildSub = function () {
    _bs();
    const el = $('sub'); if (!el || !openCat) return;
    const card = (on, act, n, l) => `<button class="item ${on ? 'on' : ''}" onclick="${act}"><span class="n">${n}</span><span class="l">${l}</span></button>`;
    let h = '';
    if (openCat === 'zones') {
      h += card(TOOL.kind === 'area', `setTool('area','${TOOL.kind === 'area' ? TOOL.sub : 'park'}');buildSub()`, '✏️ ' + L('Disegna un\'area', 'Draw an area'), L('Parcheggi, parchi, piazze, spiagge, mercati, condomini', 'Parking, parks, plazas, beaches, markets, apartments'));
      h += card(TOOL.kind === 'fillblock', `setTool('fillblock',${TOOL.kind === 'fillblock' ? TOOL.sub : 2});buildSub()`, '🏘️ ' + L('Riempi l\'isolato', 'Fill the block'), L('Edifici attaccati lungo un lato della strada, in un clic', 'Attached buildings along one side of the road, in one click'));
      h += card(TOOL.kind === 'obj', `setTool('obj','${TOOL.kind === 'obj' ? TOOL.sub : 'box'}');buildSub()`, '🧊 ' + L('Oggetti su misura', 'Custom objects'), L('Forme, colori e maxischermi LED', 'Shapes, colours and LED screens'));
      if (TOOL.kind === 'area') h += `<div class="subopts">` + Object.keys(AREA_T).map(k => `<button class="${TOOL.sub === k ? 'on' : ''}" title="${AREA_T[k].d()}" onclick="TOOL.sub='${k}';buildSub()">${AREA_T[k].n()} · ${AREA_T[k].cost} €/m²</button>`).join('') + `<span style="color:var(--mute)">${L('Clic sui vertici, clic sul primo per chiudere. Clic destro dentro un\'area per toglierla', 'Click the corners, click the first one to close. Right-click inside an area to remove it')}</span></div>`;
      if (TOOL.kind === 'fillblock') h += `<div class="subopts"><span>${L('Zona', 'Zone')}:</span>` + ZONE_ORDER.filter(z => ZT[z] && !ZT[z].spec && unlocked(ZT[z].ms)).map(z => `<button class="${TOOL.sub === z ? 'on' : ''}" onclick="TOOL.sub=${z};buildSub()">${ZT[z].sh()}</button>`).join('') + `<span style="color:var(--mute)">${L('4.000 € a edificio', '€4,000 per building')}</span></div>`;
      if (TOOL.kind === 'obj') h += objHTML();
      h += czHTML();
    }
    if (h) { const d = document.createElement('div'); d.style.display = 'contents'; d.innerHTML = h; const first = el.querySelector('.subopts'); if (first && openCat === 'zones' && TOOL.kind !== 'area' && TOOL.kind !== 'fillblock' && TOOL.kind !== 'obj') el.insertBefore(d, first); else el.appendChild(d); }
  };
  const _bt = buildToolbar;
  buildToolbar = function () {
    _bt();
    const r = $('right'); if (!r || r.querySelector('#mapbtn')) return;
    const mk = (id, ic, t, f) => { const b = document.createElement('button'); b.id = id; b.title = t; b.textContent = ic; b.onclick = f; return b; };
    const menu = [...r.children].pop();
    r.insertBefore(mk('mapbtn', '🗺️', L('Mappa della città', 'City map'), cmapOpen), menu);
    r.insertBefore(mk('ctrlbtn', '🏛️', L('Centro di controllo e Tesoro', 'Control centre & treasury'), () => openSide('ctrl')), menu);
    r.insertBefore(mk('todobtn', '📝', L('Da finire', 'To finish'), () => openSide('todo')), menu);
  };
  const _rp = refreshPanels;
  refreshPanels = function () {
    if (sideOpen === 'ctrl' || sideOpen === 'todo') { const el = $('side'); el.innerHTML = sideOpen === 'ctrl' ? controlHTML() : todoHTML(); return; }
    _rp();
  };
  const _tc = toolClick;
  toolClick = function (e) {
    if (TOOL.kind === 'area' || TOOL.kind === 'fillblock' || TOOL.kind === 'obj') {
      const g = groundAt(e.clientX, e.clientY); if (!g) return;
      if (TOOL.kind === 'area') { const P = TOOL.poly || (TOOL.poly = []); if (P.length >= 3 && Math.hypot(P[0].x - g.x, P[0].z - g.z) < Math.max(12, cam.dist * 0.02)) finishArea(); else P.push({ x: g.x, z: g.z }); return; }
      if (TOOL.kind === 'fillblock') return fillBlock(g);
      return objPlace(g);
    }
    _tc(e);
  };
  const _cancel = toolCancel;
  toolCancel = function (full) {
    if (TOOL.kind === 'area') { if (TOOL.poly && TOOL.poly.length >= 3) { finishArea(); return; } if (TOOL.poly) { TOOL.poly = null; clearGhost(); return; } if (mouse.g && removeAreaAt(mouse.g)) return; }
    return _cancel(full);
  };
  const _ug = updateGhost;
  updateGhost = function () {
    if (S && AREAS.forS !== S) areasRebuild();
    if (S && OBJS.forS !== S) objsRebuild();
    if (TOOL.kind === 'area') {
      clearGhost(); const g = mouse.g; if (!g) return; const P = (TOOL.poly || []).concat([g]);
      if (P.length > 1) ghost.add(ribbon(P.concat(P.length > 2 ? [P[0]] : []).map(p => ({ x: p.x, z: p.z, y: Math.max(getH(p.x, p.z), WATER) })), 2, ghostMatOk, 1));
      const A = P.length > 2 ? polyArea(P.map(p => [p.x, p.z])) : 0; tipShow(`<b>${AREA_T[TOOL.sub].n()}</b>${A ? ' · ' + fmtNum(Math.round(A)) + ' m² · ' + fmtMoney(Math.round(A * AREA_T[TOOL.sub].cost)) : ''}`); return;
    }
    if (TOOL.kind === 'fillblock') { clearGhost(); const g = mouse.g; if (!g) return; const n = findNearSeg(g.x, g.z, 40, s => RT[s.type].zone); if (n) ghost.add(ribbon(n.seg.pts.map(p => ({ x: p.x, z: p.z, y: p.y })), RT[n.seg.type].w + 30, ghostMatOk, 0.8)); tipShow('🏘️ ' + L('Clicca il lato della strada da riempire', 'Click the side of the road to fill')); return; }
    if (TOOL.kind === 'obj') { clearGhost(); const g = mouse.g; if (!g) return; if (TOOL.sub !== 'edit') ghost.add(disc(g.x, g.z, Math.max(TOOL.oW || 6, TOOL.oD || 6) / 2, ghostMatOk)); tipShow(OBJ_SH[TOOL.sub || 'box']()); return; }
    _ug();
  };
  let ledT = 0;
  const _dl = drawLights;
  drawLights = function () { _dl(); const t = performance.now(); if (t - ledT > 450 && (S?.objs || []).some(o => o.s === 'led')) { ledT = t; ledDraw(); ledSoundTick(); } };
}
setTimeout(() => { try { applyGfx(); applyCalm(); } catch (e) { } }, 0);

if (typeof __cm !== 'undefined') Object.assign(__cm, { AREAS, areasRebuild, finishArea, fillBlock, objPlace, objsRebuild, cmapOpen, cmapRender, controlHTML, todoHTML, czRegister, planEvent, runOp, applyGfx });
