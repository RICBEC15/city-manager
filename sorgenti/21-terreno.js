// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 10: terreno e decorazioni
//  pennello del terreno regolabile, pendenza tra due punti, terra messa
//  da parte, pittura dei materiali, superfici e oggetti decorativi,
//  sentieri in galleria e ponti pedonali, curve di livello con un tasto
// =====================================================================
// ---------- pennello e terra da parte ----------
TOOL.tR = 60; TOOL.tS = 100; // raggio (m) e forza (%)
function soilTxt() { return fmtNum(Math.round((S.soil || 0) / 1000)) + ' ' + L('mila m³', 'thousand m³'); }
const _terraform10 = terraform;
terraform = function (g, dt) {
  const mode = TOOL.tmode;
  if (mode === 'paint') return paintGround(g, dt);
  if (mode === 'slope') return slopeClick(g);
  const R = clamp(TOOL.tR || 60, 10, 1000), str = clamp((TOOL.tS || 100) / 100, 0.01, 1), rr = Math.ceil(R / HC), ci = Math.round((g.x + HALF) / HC), cj = Math.round((g.z + HALF) / HC);
  if (!isOwned(g.x, g.z)) { tipShow(L('Fuori dal tuo territorio', 'Outside your land')); return; }
  const area = Math.max(1, (R / 60) ** 2);
  if (!spend(Math.round((mode === 'fill' || mode === 'canal' ? 150 : 60) * dt * str * Math.min(area, 40)))) return;
  if (mode === 'level' && TOOL.lvl == null) TOOL.lvl = TOOL.lvlSet != null && TOOL.lvlSet !== '' ? +TOOL.lvlSet : getH(g.x, g.z);
  let avg = 0, n = 0; for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) if (i >= 0 && j >= 0 && i < HN && j < HN) { avg += H[j * HN + i]; n++; } avg /= Math.max(1, n);
  let dv = 0; // metri cubi: + scavati, - riportati
  const cellA = HC * HC;
  for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) {
    if (i < 1 || j < 1 || i >= HN - 1 || j >= HN - 1) continue;
    const x = -HALF + i * HC, z = -HALF + j * HC, d = Math.hypot(x - g.x, z - g.z); if (d > R) continue;
    if (!isOwned(x, z)) continue;
    const w = smooth(R, R * 0.3, d) * dt * str, k = j * HN + i, h0 = H[k];
    if (mode === 'canal') { const tg = WATER - 5; if (H[k] > tg) H[k] = lerp(H[k], tg, clamp(smooth(R * 0.6, R * 0.45, d) * dt * 5 * str, 0, 1)); }
    else if (mode === 'fill') { const tg = WATER + 2.5; if (H[k] < tg) H[k] = lerp(H[k], tg, clamp(smooth(R, R * 0.75, d) * dt * 6 * str, 0, 1)); }
    else if (mode === 'raise') { let up = 12 * w; if ((S.soil || 0) < up * cellA && !S.opts.unlimited) { if (!spend(Math.round(up * cellA * 0.02))) continue; } H[k] += up; }
    else if (mode === 'lower') H[k] -= 12 * w;
    else if (mode === 'level') H[k] = lerp(H[k], TOOL.lvl, clamp(w * 4, 0, 1));
    else H[k] = lerp(H[k], avg, clamp(w * 3, 0, 1));
    dv += (h0 - H[k]) * cellA;
  }
  S.soil = Math.max(0, (S.soil || 0) + dv);
  updateTerrain(ci - rr - 1, cj - rr - 1, ci + rr + 1, cj + rr + 1);
  treesNear(g.x, g.z, R, t => treeDirty.add(t.chunk));
  terrainChanged(ci - rr, cj - rr, ci + rr, cj + rr);
  if ((mode === 'fill' || mode === 'canal') && (TOOL.dockT = (TOOL.dockT || 0) + dt) > 1) { TOOL.dockT = 0; for (const sv of svcs.values()) if (!sv.route && (SV[sv.type].cargo === 'ship' || SV[sv.type].station === 'ship')) sv.dock = findDock(sv); }
  TOOL.soilT = (TOOL.soilT || 0) + dt; if (TOOL.soilT > 0.5) { TOOL.soilT = 0; const el = $('soilInfo'); if (el) el.textContent = soilTxt(); }
};
// pendenza: primo clic = punto A, secondo clic = punto B, il terreno tra i due diventa una rampa
function slopeClick(g) {
  if (TOOL.slHeld) return; TOOL.slHeld = true;
  if (!isOwned(g.x, g.z)) { tipShow(L('Fuori dal tuo territorio', 'Outside your land')); return; }
  if (!TOOL.slA) { TOOL.slA = { x: g.x, z: g.z, h: getH(g.x, g.z) }; toast(L('Ora clicca il secondo punto della pendenza', 'Now click the second point of the slope'), 2500); return; }
  const A = TOOL.slA, B = { x: g.x, z: g.z, h: getH(g.x, g.z) }; TOOL.slA = null;
  const len = Math.hypot(B.x - A.x, B.z - A.z); if (len < 20) return;
  const R = clamp(TOOL.tR || 60, 10, 1000), ux = (B.x - A.x) / len, uz = (B.z - A.z) / len;
  const i0 = Math.max(1, Math.floor((Math.min(A.x, B.x) - R + HALF) / HC)), i1 = Math.min(HN - 2, Math.ceil((Math.max(A.x, B.x) + R + HALF) / HC));
  const j0 = Math.max(1, Math.floor((Math.min(A.z, B.z) - R + HALF) / HC)), j1 = Math.min(HN - 2, Math.ceil((Math.max(A.z, B.z) + R + HALF) / HC));
  let dv = 0, n = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = -HALF + i * HC, z = -HALF + j * HC; if (!isOwned(x, z)) continue;
    const t = clamp(((x - A.x) * ux + (z - A.z) * uz) / len, 0, 1), px = A.x + ux * len * t, pz = A.z + uz * len * t, d = Math.hypot(x - px, z - pz); if (d > R) continue;
    const k = j * HN + i, h0 = H[k], tg = lerp(A.h, B.h, t); H[k] = lerp(H[k], tg, smooth(R, R * 0.5, d) * clamp((TOOL.tS || 100) / 100, 0.01, 1)); dv += (h0 - H[k]) * HC * HC; n++;
  }
  if (!spend(Math.round(n * 4))) return;
  S.soil = Math.max(0, (S.soil || 0) + dv);
  updateTerrain(i0 - 1, j0 - 1, i1 + 1, j1 + 1); terrainChanged(i0, j0, i1, j1);
  treesNear((A.x + B.x) / 2, (A.z + B.z) / 2, len / 2 + R, t => treeDirty.add(t.chunk));
  toast(L('Pendenza fatta', 'Slope done'), 1500);
}
const _paintTick10 = paintTick;
paintTick = function (dt) { if (!TOOL.painting) { TOOL.slHeld = false; if (TOOL.kind === 'terrain') TOOL.lvl = null; } _paintTick10(dt); };

// ---------- pittura dei materiali del terreno ----------
const PN = 2048, PAINT_C = [[0.34, 0.55, 0.24], [0.47, 0.36, 0.23], [0.52, 0.51, 0.49], [0.86, 0.79, 0.57]];
const PMAT = () => [L('Erba', 'Grass'), L('Terra', 'Dirt'), L('Roccia', 'Rock'), L('Sabbia', 'Sand'), L('Gomma (togli)', 'Eraser')];
let PAINT = null;
terrU.uPaint = { value: new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat) }; terrU.uPaint.value.needsUpdate = true;
terrU.uPaintOn = { value: 0 };
function paintAlloc() { if (PAINT) return; PAINT = new Uint8Array(PN * PN * 4); const t = new THREE.DataTexture(PAINT, PN, PN, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; terrU.uPaint.value = t; terrU.uPaintOn.value = 1; }
function paintGround(g, dt) {
  if (!isOwned(g.x, g.z)) { tipShow(L('Fuori dal tuo territorio', 'Outside your land')); return; }
  if (!spend(Math.max(1, Math.round(10 * dt * (TOOL.tR / 60))))) return;
  paintAlloc();
  const R = clamp(TOOL.tR || 60, 10, 1000), PC = MAP / PN, rr = Math.ceil(R / PC) + 1, ci = Math.floor((g.x + HALF) / PC), cj = Math.floor((g.z + HALF) / PC);
  const m = TOOL.pmat ?? 0, str = clamp((TOOL.tS || 100) / 100, 0.01, 1) * dt * 6;
  for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) {
    if (i < 0 || j < 0 || i >= PN || j >= PN) continue;
    const x = -HALF + (i + 0.5) * PC, z = -HALF + (j + 0.5) * PC, d = Math.hypot(x - g.x, z - g.z); if (d > R + PC * 0.7) continue; if (!isOwned(x, z)) continue;
    const w = clamp(str * (R < PC ? 1 : smooth(R + PC * 0.7, R * 0.4, d)), 0, 1), k = (j * PN + i) * 4;
    for (let c = 0; c < 4; c++) { const tg = c === m ? 255 : 0; PAINT[k + c] = Math.round(lerp(PAINT[k + c], tg, w)); }
  }
  TOOL.pT = (TOOL.pT || 0) + dt; if (TOOL.pT > 0.2) { TOOL.pT = 0; terrU.uPaint.value.needsUpdate = true; }
  S.paintDirty = true;
}
// salvataggio: solo i punti dipinti
const PNS = new WeakSet();
function paintSync() {
  if (typeof S === 'undefined' || !S || PNS.has(S)) return; PNS.add(S);
  if (PAINT) PAINT.fill(0);
  const D = S.paintD; if (D && D.length) { paintAlloc(); for (let i = 0; i < D.length; i += 2) { const k = D[i] * 4, v = D[i + 1]; PAINT[k] = v & 255; PAINT[k + 1] = (v >>> 8) & 255; PAINT[k + 2] = (v >>> 16) & 255; PAINT[k + 3] = (v >>> 24) & 255; } }
  if (PAINT) terrU.uPaint.value.needsUpdate = true;
}
function paintPack() { if (!PAINT || !S.paintDirty) return; const out = []; for (let i = 0, n = PN * PN; i < n; i++) { const k = i * 4; if (PAINT[k] | PAINT[k + 1] | PAINT[k + 2] | PAINT[k + 3]) out.push(i, (PAINT[k] | PAINT[k + 1] << 8 | PAINT[k + 2] << 16 | PAINT[k + 3] << 24) >>> 0); } S.paintD = out; S.paintDirty = false; }
const _computeNetworks10 = computeNetworks;
computeNetworks = function () { paintSync(); _computeNetworks10(); };
const _serialize10 = serialize;
serialize = function () { paintSync(); paintPack(); return _serialize10(); };
if (typeof __cm !== 'undefined') __cm.serialize = serialize;

// ---------- superfici e oggetti decorativi ----------
CAT.deco = { i: '🪴', n: () => L('Superfici e decorazioni', 'Surfaces & decorations') };
SVCOL.deco = 0xb0a890;
Object.assign(SV, {
  surf_conc: { cat: 'deco', w: 30, d: 30, cost: 600, upk: 5, ms: 0, free: true, deco: 'surf', col: 0xb4b2ac, n: () => L('Superficie di cemento', 'Concrete surface'), d2: () => L('Piazzale grigio 30 x 30 m', 'Grey 30 x 30 m area') },
  surf_grass: { cat: 'deco', w: 30, d: 30, cost: 300, upk: 3, ms: 0, free: true, deco: 'surf', col: 0x5f9a45, park: 0.2, r: 120, n: () => L('Superficie d\'erba', 'Grass surface'), d2: () => L('Prato curato 30 x 30 m', 'Neat 30 x 30 m lawn') },
  surf_pave: { cat: 'deco', w: 30, d: 30, cost: 800, upk: 5, ms: 0, free: true, deco: 'surf', col: 0xc2a888, n: () => L('Pavimentazione', 'Pavement'), d2: () => L('Mattonelle per piazze e cortili', 'Paving for squares and yards') },
  surf_sand: { cat: 'deco', w: 30, d: 30, cost: 300, upk: 2, ms: 0, free: true, deco: 'surf', col: 0xdcc890, n: () => L('Superficie di sabbia', 'Sand surface'), d2: () => L('Sabbia 30 x 30 m', 'Sand 30 x 30 m') },
  surf_tile: { cat: 'deco', w: 30, d: 30, cost: 900, upk: 5, ms: 0, free: true, deco: 'surf', col: 0xa8483a, n: () => L('Piastrelle', 'Tiles'), d2: () => L('Piastrelle rosse a quadri', 'Red checkered tiles') },
  deco_vase: { cat: 'deco', w: 2, d: 2, cost: 150, upk: 1, ms: 0, free: true, deco: 'obj', park: 0.15, r: 80, n: () => L('Vaso di fiori', 'Flower pot'), d2: () => L('Un tocco di colore', 'A touch of colour') },
  deco_bench: { cat: 'deco', w: 4, d: 2, cost: 200, upk: 1, ms: 0, free: true, deco: 'obj', park: 0.2, r: 80, n: () => L('Panchina', 'Bench'), d2: () => L('Per sedersi un momento', 'For a short rest') },
  deco_rubble: { cat: 'deco', w: 8, d: 8, cost: 50, upk: 0, ms: 0, free: true, deco: 'obj', n: () => L('Detriti', 'Rubble'), d2: () => L('Mucchio di macerie (per cantieri e scene)', 'Pile of debris (for building sites and scenes)') },
  deco_fount: { cat: 'deco', w: 8, d: 8, cost: 2500, upk: 20, ms: 1, free: true, deco: 'obj', park: 0.4, r: 150, n: () => L('Fontanella', 'Small fountain'), d2: () => L('Acqua che zampilla in piazza', 'Bubbling water for a square') },
});
for (const k in CAT) if (typeof S !== 'undefined' && S && S.budget && S.budget[k] == null) S.budget[k] = 100;
// le decorazioni si mettono anche sopra le superfici e non chiedono la strada
const _svcPlacement10 = svcPlacement;
svcPlacement = function (type, x, z, rot) {
  const d = SV[type]; if (!d.deco) return _svcPlacement10(type, x, z, rot);
  if (S.budget.deco == null) S.budget.deco = 100;
  const o = { type, x, z, ang: rot, w: d.w, d: d.d, ok: true, why: '' };
  for (const [cx, cz] of obbCorners(o).concat([[x, z]])) {
    if (!isOwned(cx, cz)) { o.ok = false; o.why = L('Fuori dal tuo territorio: compra la casella', 'Outside your land: buy the tile'); break; }
    if (isWater(cx, cz)) { o.ok = false; o.why = L('Non sull\'acqua', 'Not on water'); break; }
  }
  if (o.ok) for (const id of segsNear(x, z, Math.hypot(d.w, d.d) / 2 + 12)) { const s = segs.get(id); if (!s || (s.elev || 0) !== 0) continue; for (const p of s.pts) if (obbContains(o, p.x, p.z, RT[s.type].w / 2 - 1)) { o.ok = false; o.why = L('Si sovrappone a una strada', 'Overlaps a road'); break; } if (!o.ok) break; }
  if (o.ok) for (const sv of svcs.values()) { const e = SV[sv.type]; if (d.deco === 'obj' && e.deco === 'surf') continue; if (d.deco === 'surf' && e.deco === 'obj') continue; if (Math.hypot(sv.x - x, sv.z - z) < (Math.hypot(sv.w, sv.d) + Math.hypot(o.w, o.d)) / 2 && obbOverlap(sv, o)) { o.ok = false; o.why = L('Si sovrappone a un altro edificio', 'Overlaps another building'); break; } }
  o.y = getH(x, z) + (d.deco === 'obj' && [...svcs.values()].some(s => SV[s.type].deco === 'surf' && obbContains(s, x, z, 0)) ? 0.35 : 0);
  return o;
};
const _drawSvc10 = drawSvc;
drawSvc = function (sv) {
  const d = SV[sv.type]; if (!d.deco) return _drawSvc10(sv);
  removeParts(sv.parts); curRef = sv;
  const y = sv.y, yaw = sv.ang, W = sv.w, D = sv.d, P = sv.parts;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const cyl = (a, b, r, h, c, y0 = 0) => { const [x, z] = at(a, b); return addPart(P, 'cyl', x, y + y0, z, 0, r, h, r, c); };
  switch (sv.type) {
    case 'surf_tile': box(0, 0, W, 0.3, D, d.col, 'plain'); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2) box((a - 1) * W / 3, (b - 1) * D / 3, W / 3, 0.32, D / 3, 0xe8e0d0, 'plain'); break;
    case 'surf_pave': box(0, 0, W, 0.3, D, d.col, 'plain'); box(0, 0, W * 0.5, 0.32, D * 0.5, 0xa88c6c, 'plain'); break;
    case 'deco_vase': cyl(0, 0, 0.7, 0.9, 0x9a5a3a); cyl(0, 0, 0.9, 0.7, 0xd04a7a, 0.9); break;
    case 'deco_bench': box(0, 0, 3.6, 0.5, 0.9, 0x8a5a32, 'body', 0.45); box(0, -0.4, 3.6, 0.6, 0.15, 0x8a5a32, 'body', 0.9); box(-1.5, 0, 0.2, 0.45, 0.8, 0x3a3a3a); box(1.5, 0, 0.2, 0.45, 0.8, 0x3a3a3a); break;
    case 'deco_rubble': for (let i = 0; i < 7; i++) box(((i * 37) % 7 - 3) * 0.9, ((i * 53) % 7 - 3) * 0.9, 1.5 + (i % 3), 0.6 + (i % 4) * 0.4, 1.4 + (i % 2), i % 2 ? 0x8a8478 : 0x6e665a, 'body', 0); break;
    case 'deco_fount': cyl(0, 0, 3.6, 0.8, 0xc8c4b8); cyl(0, 0, 3, 0.2, 0x5aa0d0, 0.75); cyl(0, 0, 0.5, 2.6, 0xc8c4b8); cyl(0, 0, 1.2, 0.3, 0x5aa0d0, 2.6); break;
    default: box(0, 0, W, 0.3, D, d.col || SVCOL.deco, 'plain');
  }
};

// ---------- opzioni nel menu Terreno ----------
function terrainExtraHTML() {
  const on = (k) => TOOL.kind === 'terrain' && TOOL.tmode === k;
  const it = (o, act, n, c, l) => `<button class="item ${o ? 'on' : ''}" onclick="${act}"><span class="n">${n}</span>${c != null ? `<span class="c">${fmtMoney(c)}</span>` : ''}<span class="l">${l || ''}</span></button>`;
  let h = it(on('slope'), `setTool('terrain');TOOL.tmode='slope';TOOL.slA=null;buildSub()`, L('Pendenza tra due punti', 'Slope between two points'), null, L('Clicca il punto A e poi il punto B', 'Click point A, then point B'));
  h += it(on('paint'), `setTool('terrain');TOOL.tmode='paint';buildSub()`, L('Dipingi il terreno', 'Paint the ground'), null, L('Erba, terra, roccia, sabbia', 'Grass, dirt, rock, sand'));
  for (const k in SV) { const d = SV[k]; if (d.cat !== 'deco') continue; h += it(TOOL.kind === 'svc' && TOOL.sub === k, `setTool('svc','${k}');buildSub()`, d.n(), d.cost, d.d2()); }
  h += `<div class="subopts"><span>${L('Pennello', 'Brush')}: <b id="tRv">${TOOL.tR} m</b></span><input type="range" min="10" max="1000" step="10" value="${TOOL.tR}" oninput="TOOL.tR=+this.value;$('tRv').textContent=this.value+' m'" style="width:130px">`;
  h += `<span>${L('Forza', 'Strength')}: <b id="tSv">${TOOL.tS}%</b></span><input type="range" min="1" max="100" value="${TOOL.tS}" oninput="TOOL.tS=+this.value;$('tSv').textContent=this.value+'%'" style="width:100px"></div>`;
  if (on('level')) h += `<div class="subopts"><span>${L('Altezza voluta (m, vuoto = dove clicchi)', 'Target height (m, empty = where you click)')}:</span><input type="number" style="width:80px" value="${TOOL.lvlSet ?? ''}" oninput="TOOL.lvlSet=this.value===''?null:+this.value"></div>`;
  if (on('paint')) h += `<div class="subopts"><span>${L('Materiale', 'Material')}:</span>` + PMAT().map((n, i) => `<button class="${(TOOL.pmat ?? 0) === i ? 'on' : ''}" onclick="TOOL.pmat=${i};buildSub()">${n}</button>`).join('') + '</div>';
  h += `<div class="subopts"><span>⛏️ ${L('Terra messa da parte', 'Stored soil')}: <b id="soilInfo">${soilTxt()}</b></span><span style="color:var(--mute)">${L('Quello che scavi serve per alzare. Se finisce, la terra si compra.', 'What you dig is used to raise. When it runs out, soil is bought.')}</span></div>`;
  h += `<div class="subopts"><button class="${SET.contour ? 'on' : ''}" onclick="toggleContour();buildSub()">〰️ ${L('Curve di livello sempre (tasto K)', 'Contour lines always (K key)')}</button></div>`;
  return h;
}
function toggleContour() { SET.contour = !SET.contour; saveSettings(); terrU.uContour.value = SET.contour || TOOL.kind === 'terrain' ? 1 : 0; toast(SET.contour ? L('Curve di livello accese', 'Contour lines on') : L('Curve di livello spente', 'Contour lines off'), 1500); }
addEventListener('keydown', e => { if (e.code !== 'KeyK' || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return; if (typeof menuOpen !== 'undefined' && menuOpen) return; toggleContour(); });
setTimeout(() => { if (SET.contour) terrU.uContour.value = 1; }, 0);
