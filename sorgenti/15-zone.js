// =====================================================================
//  Novità dal wiki - Blocco 4: zone, edifici e valore del terreno
// =====================================================================
// ---------- zone nuove: case a schiera più basse, zone fronte mare solo vicino all'acqua ----------
const _bldHeight4 = bldHeight;
bldHeight = function (b) { const h = _bldHeight4(b); return b.zone === 12 ? Math.min(h, 3.3 * (2 + b.level * 0.25)) : h; };
const nearWater = (x, z) => { for (const [a, c] of [[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40], [70, 0], [-70, 0], [0, 70], [0, -70]]) if (isWater(x + a, z + c)) return true; return false; };
const _setZone4 = setZone;
setZone = function (c, zone) { if (zone && ZT[zone]?.water && !nearWater(c.x, c.z)) return; _setZone4(c, zone); };
// ---------- strumento Rettangolo e cancellazione col tasto destro ----------
function zoneRect(a, b, zone) {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z);
  if ((x1 - x0) * (z1 - z0) > 2.5e6) { toast(L('Rettangolo troppo grande', 'Rectangle too big'), 1800); return; }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, r = Math.hypot(x1 - x0, z1 - z0) / 2;
  let n = 0; for (const id of segsNear(cx, cz, r + 60)) { const s = segs.get(id); if (!s) continue; for (const cid of s.cells) { const c = cells[cid]; if (c && c.x >= x0 && c.x <= x1 && c.z >= z0 && c.z <= z1) { setZone(c, zone); n++; } } }
  return n;
}
canvas.addEventListener('mousedown', e => { if (TOOL.kind === 'zone' && TOOL.brush === 'rect') TOOL.r0 = groundAt(e.clientX, e.clientY); });
addEventListener('mouseup', e => {
  if (TOOL.kind !== 'zone' || TOOL.brush !== 'rect' || !TOOL.r0) return;
  const g = groundAt(e.clientX, e.clientY); if (g && Math.hypot(g.x - TOOL.r0.x, g.z - TOOL.r0.z) > 6) zoneRect(TOOL.r0, g, e.button === 2 ? 0 : TOOL.sub);
  TOOL.r0 = null; clearGhost();
});
const _updateGhost4 = updateGhost;
updateGhost = function () {
  _updateGhost4();
  if (TOOL.kind !== 'zone') return;
  if (TOOL.brush === 'rect' && TOOL.r0 && mouse.down && mouse.g) {
    const a = TOOL.r0, b = mouse.g, P = [[a.x, a.z], [b.x, a.z], [b.x, b.z], [a.x, b.z], [a.x, a.z]].map(([x, z]) => ({ x, z, y: getH(x, z) }));
    for (let i = 0; i < 4; i++) ghost.add(ribbon([P[i], P[i + 1]], 3, mouse.btn === 2 ? ghostMatBad : ghostMatOk, 0.8));
    tipShow(`▭ ${Math.round(Math.abs(b.x - a.x))} × ${Math.round(Math.abs(b.z - a.z))} m · ${mouse.btn === 2 ? L('cancella', 'erase') : ZT[TOOL.sub]?.sh() || L('cancella', 'erase')}`);
  } else if (ZT[TOOL.sub]?.water && mouse.g && !nearWater(mouse.g.x, mouse.g.z)) tipShow('🌊 ' + L('Questa zona si fa solo vicino all\'acqua', 'This zone only works near water'));
};
// ---------- idoneità mentre si disegnano le zone ----------
const _setTool4 = setTool;
setTool = function (kind, sub) {
  _setTool4(kind, sub);
  if (kind === 'zone' && sub && ZT[sub]) { const k = ZT[sub].k; showInfo(k === 'R' || k === 'M' ? 'suit' : k === 'C' ? 'suitC' : k === 'I' && ZT[sub].spec ? 'res' : k === 'O' ? 'jobedu' : null, true); }
};
// ---------- valore del terreno: si sparge lungo le strade, sale solo se i bisogni sono soddisfatti ----------
function stampLV(x, z, r, v) { const ci = Math.floor((x + HALF) / GC), cj = Math.floor((z + HALF) / GC), rr = Math.ceil(r / GC); for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= G || j >= G) continue; const d = Math.hypot((i - ci) * GC, (j - cj) * GC); if (d > r) continue; const k = j * G + i; LV[k] = clamp(LV[k] + v * (1 - d / r), 0, 100); } }
const _computeGrids4 = computeGrids;
computeGrids = function () {
  _computeGrids4();
  for (const b of buildings.values()) {
    if (b.ruin || !b.hh) continue;
    const ok = b.pow && b.wat && b.sew !== false, cov = b.cov || {}, needs = (cov.health > 0.2) + (cov.edu1 > 0.2) + (cov.police > 0.2) + (cov.fire > 0.2) + (cov.park > 0.2) + (cov.garb > 0.2);
    stampLV(b.x, b.z, 140, ok ? (needs - 3) * 0.9 : -3);
  }
  // lungo le strade: un po' del valore di una cella passa alle celle vicine sulla stessa strada
  for (const s of segs.values()) {
    if (!RT[s.type].zone || s.pts.length < 3) continue;
    const a = s.pts[0], m = s.pts[s.pts.length >> 1], z = s.pts[s.pts.length - 1], va = LV[gIdx(a.x, a.z)], vm = LV[gIdx(m.x, m.z)], vz = LV[gIdx(z.x, z.z)], avg = (va + vm + vz) / 3;
    for (const p of [a, m, z]) { const k = gIdx(p.x, p.z); LV[k] = lerp(LV[k], avg, 0.3); }
  }
  for (const c of S.collapses || []) stampLV(c.x, c.z, 250, -12 * Math.max(0, 1 - (S.time - c.t) / (24 * 6)));
  S.collapses = (S.collapses || []).filter(c => S.time - c.t < 24 * 6);
};
// ---------- affitto, senzatetto, abbandono e crolli ----------
function bldRent(b) { // affitto mensile per famiglia
  const lv = LV[gIdx(b.x, b.z)], z = ZT[b.zone];
  let r = (150 + lv * 4 + b.level * 80) * (z.cheap ? 0.5 : 1);
  if (z.dens === 0 && z.k === 'R') r *= 1.5; // casa bassa: una sola famiglia paga tutto
  return Math.round(r);
}
const wageOf = edu => Math.round(1500 + 1200 * clamp(edu, 0, 1));
const _updateBuilding4 = updateBuilding;
updateBuilding = function (b) {
  _updateBuilding4(b);
  if (!buildings.has(b.id) || b.ruin) return;
  if (b.aband) { // abbandonato: dopo 3 mesi crolla
    if (b.abSince == null) b.abSince = S.time;
    if (S.time - b.abSince > 72) {
      const inside = Math.round((b.hh || b.jobs || 1) * 0.3 * rand());
      if (inside && rand() < 0.4) { S.casualties = (S.casualties || 0) + 1; stats.injured = (stats.injured || 0) + inside; }
      S.collapses = S.collapses || []; S.collapses.push({ x: b.x, z: b.z, t: S.time });
      ruinBuilding(b); addFeed('collapse', b); b.abSince = null;
    }
    return;
  }
  b.abSince = null;
  if (!b.hh || !b.occ) return;
  const rent = bldRent(b), income = wageOf(b.edu || 0), ratio = rent / (income * 0.35);
  b.rent = rent; b.rentR = ratio;
  const pen = ratio > 1 ? -Math.min(20, (ratio - 1) * 25) : 0;
  if (b.fac) b.fac.rent = pen; b.happy = clamp(b.happy + pen * 0.3, 0, 100);
  if (ratio > 1.3 && rand() < 0.12) { b.occ--; S.homeless = (S.homeless || 0) + 2.6; }
  if (ratio < 0.8 && b.lvlT > 0) b.lvlT += 0.4; // l'affitto copre bene la manutenzione: sale prima di livello
};
const _ruinBuilding4 = ruinBuilding;
ruinBuilding = function (b) { if (b.hh && b.occ) S.homeless = (S.homeless || 0) + b.occ * 2.6 * 0.5; _ruinBuilding4(b); };
// senzatetto: ogni mese una parte trova casa (se ci sono case libere e assistenza), gli altri vivono nei parchi
const _monthly4 = monthly;
monthly = function () {
  _monthly4();
  let h = S.homeless || 0; if (!h) return;
  const free = Math.max(0, stats.hhCap - stats.hh) * 2.6, welfare = [...svcs.values()].some(s => s.on && SV[s.type].eff === 'welfare');
  h -= Math.min(h, free * 0.3 + (welfare ? h * 0.25 : h * 0.05)); S.homeless = Math.max(0, Math.round(h));
  drawTents();
};
const tentGroup = new THREE.Group(); scene.add(tentGroup);
const tentGeo = new THREE.ConeGeometry(1.8, 2.2, 4), tentMats = [0x3a6ac0, 0xd07a2a, 0x5a9a4a].map(c => new THREE.MeshLambertMaterial({ color: c }));
function drawTents() {
  while (tentGroup.children.length) tentGroup.remove(tentGroup.children[0]);
  let n = Math.min(60, Math.round((S.homeless || 0) / 15)); if (!n) return;
  const parks = [...svcs.values()].filter(s => s.on && SV[s.type].park && SV[s.type].cat === 'parks'), ab = [...buildings.values()].filter(b => b.aband);
  const spots = parks.concat(ab); if (!spots.length) return;
  for (let i = 0; i < n; i++) { const s = spots[i % spots.length], r = mulberry32(i * 17 + 3), x = s.x + (r() - 0.5) * (s.w || 16) * 0.6, z = s.z + (r() - 0.5) * (s.d || 16) * 0.6, m = new THREE.Mesh(tentGeo, tentMats[i % 3]); m.position.set(x, getH(x, z) + 1.1, z); m.rotation.y = r() * 3; tentGroup.add(m); }
}
// i senzatetto nei parchi: un po' di criminalità e parchi meno piacevoli
const _computeCoverage4 = computeCoverage;
computeCoverage = function () {
  _computeCoverage4();
  const h = S.homeless || 0; if (h < 30) return;
  for (const sv of svcs.values()) if (sv.on && SV[sv.type].park && SV[sv.type].cat === 'parks') bldNear(sv.x, sv.z, 300, b => { if (b.cov) b.cov.park = Math.max(0, (b.cov.park || 0) - Math.min(0.3, h / 4000)); });
};
// scheda dell'edificio: affitto e stato
function bldExtraHTML(o) {
  let h = '';
  if (o.hh && o.rent) h += `<div class="row"><span>🏠 ${L('Affitto per famiglia', 'Rent per household')}</span><span>${fmtMoney(o.rent)}/${L('mese', 'mo')}</span></div><div class="row"><span>${L('Pesa sullo stipendio', 'Share of wage')}</span><span style="color:${o.rentR > 1 ? 'var(--bad)' : 'inherit'}">${Math.round(o.rentR * 35)}%</span></div>`;
  if (o.aband && !o.ruin) { const left = Math.max(0, 72 - (S.time - (o.abSince ?? S.time))); h += `<div style="color:var(--bad)">🏚️ ${L('Abbandonato: crollerà fra', 'Abandoned: will collapse in')} ${Math.ceil(left / 24)} ${L('mesi se nessuno torna', 'months if nobody returns')}</div>`; }
  return h;
}
// ---------- vista: dove conviene il commercio (clienti vicini) ----------
const _renderInfo4 = renderInfo;
renderInfo = function () {
  const was = infoDirty; _renderInfo4();
  if (!was || INFO.mode !== 'suitC') return;
  terrU.uOvAmt.value = 0;
  const p = [], col = [];
  let mx = 1; const val = new Map();
  for (const s of segs.values()) { if (!RT[s.type].zone) continue; const m = s.pts[s.pts.length >> 1]; let n = 0; bldNear(m.x, m.z, 500, b => { if (b.hh) n += b.occ; }); val.set(s, n); mx = Math.max(mx, n); }
  for (const [s, n] of val) {
    const c = ramp(1 - n / mx), hw = RT[s.type].w * 0.42;
    for (let i = 0; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw; const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]]; for (const k of [0, 1, 2, 0, 2, 3]) { p.push(...q[k]); col.push(c[0] / 255, c[1] / 255, c[2] / 255); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
};
const _showInfo4 = showInfo;
showInfo = function (mode, temp) {
  _showInfo4(mode, temp);
  if (!S) return; const lg = $('legend');
  if (mode === 'suitC') lg.innerHTML = `<b>🛍️ ${L('Dove conviene il commercio', 'Where shops do well')}</b> 🟩 ${L('tanti clienti vicini', 'many customers nearby')} 🟥 ${L('pochi clienti', 'few customers')}`;
  if (mode === 'suit' && TOOL.kind === 'zone') lg.innerHTML += `<div style="font-size:12px">${L('Per le case conta anche l\'inquinamento del suolo', 'For homes, ground pollution counts too')}</div>`;
  if (mode === 'happy' || mode === 'lv') lg.innerHTML += `<div style="font-size:12px">🏕️ ${L('Senzatetto', 'Homeless')}: <b>${fmtNum(Math.round(S.homeless || 0))}</b> · ${L('vivono nei parchi e negli edifici abbandonati', 'living in parks and abandoned buildings')}</div>`;
};
// ---------- edifici firma nuovi (nomi nostri) ----------
Object.assign(SV, {
  villalimoni: { cat: 'sign', need: { k: 'R', n: 800 }, w: 34, d: 30, cost: 110000, upk: 450, ms: 4, r: 650, park: 6, attr: 2, unique: true, xp: 500, h: 11, n: () => L('Villa dei Limoni', 'Lemon Villa'), d2: () => L('Edificio firma: più benessere intorno', 'Signature building: more wellbeing around') },
  torrevele: { cat: 'sign', need: { k: 'L5', n: 40 }, w: 40, d: 40, cost: 400000, upk: 1500, ms: 6, r: 1000, park: 5, attr: 6, unique: true, xp: 800, h: 160, n: () => L('Torre delle Vele', 'Sails Tower'), d2: () => L('Si sblocca con 40 edifici al livello 5', 'Unlocked with 40 level-5 buildings') },
  cielo: { cat: 'sign', need: { k: 'L5', n: 120 }, w: 60, d: 60, cost: 2500000, upk: 9000, ms: 9, r: 1600, park: 8, attr: 15, unique: true, xp: 3000, h: 600, n: () => L('Grattacielo Cielo Alto (600 m)', 'Highsky Skyscraper (600 m)'), d2: () => L('Il più alto della città. Ampliamenti: posto di polizia, ospedale, centro benessere', 'The tallest in town. Extensions: police post, hospital, wellness centre') },
  giardinoalto: { cat: 'sign', need: { k: 'HAP', n: 80 }, w: 44, d: 44, cost: 300000, upk: 1200, ms: 6, r: 1100, park: 9, attr: 5, unique: true, xp: 800, h: 90, n: () => L('Torre Giardino', 'Garden Tower'), d2: () => L('Si sblocca quando la felicità arriva a 80', 'Unlocked when happiness reaches 80') },
  bistrot: { cat: 'sign', need: { k: 'C', n: 150 }, w: 18, d: 16, cost: 45000, upk: 220, ms: 3, r: 450, park: 3, attr: 3, unique: true, xp: 500, h: 7, n: () => L('Bistrot del Porto', 'Harbour Bistro'), d2: () => L('Edificio firma commerciale', 'Commercial signature building') },
  museomare: { cat: 'sign', need: { k: 'C', n: 300 }, w: 50, d: 40, cost: 180000, upk: 800, ms: 5, r: 900, park: 4, attr: 8, unique: true, xp: 700, h: 22, n: () => L('Museo del Mare', 'Sea Museum'), d2: () => L('Attira turisti', 'Draws tourists') },
  congressi: { cat: 'sign', need: { k: 'O', n: 120 }, w: 70, d: 50, cost: 260000, upk: 1100, ms: 6, r: 900, park: 3, attr: 7, unique: true, xp: 700, h: 26, n: () => L('Centro congressi Le Vele', 'Le Vele Convention Centre'), d2: () => L('Più turisti d\'affari e domanda di uffici', 'More business tourists and office demand') },
  cantiere: { cat: 'sign', need: { k: 'GOODS', n: 400 }, w: 90, d: 60, cost: 240000, upk: 1000, ms: 6, r: 700, park: 2, attr: 4, unique: true, shore: true, xp: 700, h: 30, n: () => L('Cantiere navale Ancora', 'Anchor Shipyard'), d2: () => L('Si sblocca producendo tante merci. Va sulla riva.', 'Unlocked by producing lots of goods. Goes on the shore.') },
});
Object.assign(EXT, { cielo: [{ k: 'pol', cost: 80000, upk: 1500, n: () => L('Posto di polizia (copre 800 m)', 'Police post (covers 800 m)') }, { k: 'hosp', cost: 150000, upk: 3000, n: () => L('Piano ospedale (copre 800 m)', 'Hospital floor (covers 800 m)') }, { k: 'well', cost: 60000, upk: 1200, n: () => L('Centro benessere (+felicità)', 'Wellness centre (+happiness)') }] });
const _computeCoverage4b = computeCoverage;
computeCoverage = function () { _computeCoverage4b(); for (const sv of svcs.values()) { if (!sv.on || sv.type !== 'cielo') continue; bldNear(sv.x, sv.z, 800, b => { if (!b.cov) return; if (sv.ext.includes('pol')) b.cov.police = Math.max(b.cov.police || 0, 0.7); if (sv.ext.includes('hosp')) b.cov.health = Math.max(b.cov.health || 0, 0.7); if (sv.ext.includes('well')) b.cov.park = (b.cov.park || 0) + 0.3; }); } };
const _signCount4 = signCount;
signCount = function (k) {
  if (k === 'L5') { let n = 0; for (const b of buildings.values()) if (!b.ruin && b.level >= 5) n++; return n; }
  if (k === 'HAP') return Math.round(stats.happy || 0);
  if (k === 'GOODS') return Math.round(stats.goodsP || 0);
  return _signCount4(k);
};
{ const _sk = SIGNK; SIGNK = () => Object.assign(_sk(), { L5: L('edifici al livello 5', 'level-5 buildings'), HAP: L('di felicità', 'happiness'), GOODS: L('merci prodotte', 'goods produced') }); }
const _drawSvc4 = drawSvc;
drawSvc = function (sv) {
  const T = sv.type; if (!['villalimoni', 'torrevele', 'cielo', 'giardinoalto', 'bistrot', 'museomare', 'congressi', 'cantiere'].includes(T)) return _drawSvc4(sv);
  removeParts(sv.parts); curRef = sv;
  const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => addPart(P, pool, sv.x + fx * b + rx * a, y + y0, sv.z + fz * b + rz * a, yaw, w, h, dd, c);
  switch (T) {
    case 'villalimoni': box(0, 0, W, 0.3, D, 0x6aa84a, 'plain'); box(0, -D / 6, W * 0.6, 8, D * 0.45, 0xf0e0a0); box(0, -D / 6, W * 0.62, 3, D * 0.47, 0xb05a3a, 'roof', 8); for (const a of [-1, 1]) box(a * W * 0.35, D * 0.3, 3, 4, 3, 0xe8d040); break;
    case 'torrevele': box(0, 0, W * 0.8, 120, D * 0.5, 0xd8e4ee); box(0, 0, W * 0.5, 40, D * 0.35, 0xeef4f8, 'body', 120); box(W * 0.3, 0, 2, 160, 2, 0xb0b8c0); break;
    case 'cielo': box(0, 0, W * 0.9, 200, D * 0.9, 0x6a8aa8); box(0, 0, W * 0.7, 200, D * 0.7, 0x7a9ab8, 'body', 200); box(0, 0, W * 0.45, 170, D * 0.45, 0x8aaac8, 'body', 400); box(0, 0, 2, 30, 2, 0xd0d0d0, 'body', 570); break;
    case 'giardinoalto': for (let i = 0; i < 6; i++) { box(0, 0, W * (0.8 - i * 0.05), 14, D * (0.8 - i * 0.05), 0xd8d4c8, 'body', i * 15); box(0, 0, W * (0.82 - i * 0.05), 1.2, D * (0.82 - i * 0.05), 0x4a8a3a, 'plain', i * 15 + 14); } break;
    case 'bistrot': box(0, 0, W * 0.8, 6, D * 0.7, 0xe8d8c0); box(0, -D * 0.42, W * 0.82, 0.4, 3, 0xc0402a, 'plain', 3.2); break;
    case 'museomare': box(0, 0, W * 0.9, 14, D * 0.8, 0xe8eef4); box(0, 0, W * 0.4, 8, D * 0.4, 0x3a7ac0, 'body', 14); break;
    case 'congressi': box(0, 0, W * 0.95, 0.3, D * 0.95, 0xb8b6b0, 'plain'); box(0, 0, W * 0.8, 18, D * 0.7, 0xdce6ee); for (const a of [-1, 0, 1]) box(a * W * 0.3, 0, 10, 8, D * 0.5, 0xf4f4f4, 'roof', 18); break;
    case 'cantiere': box(0, 0, W, 0.3, D, 0x8a8a8a, 'plain'); box(-W / 4, 0, W * 0.4, 20, D * 0.5, 0x6a7a8a); box(W / 4, D * 0.2, 6, 40, 6, 0xd8a030); box(W / 4, D * 0.2, 30, 2, 2, 0xd8a030, 'plain', 40); box(W / 6, D * 0.35, 14, 8, 30, 0x2a4a6a); break;
  }
};
// ---------- stile europeo o nordamericano anche per gli alberi ----------
const _plantTree4 = plantTree;
plantTree = function (x, z) { const r = _plantTree4(x, z); if (usTheme()) { const t = trees[trees.length - 1]; if (t) { t.c *= 0.78; t.s *= 1.2; } } return r; };
// voci della città per i crolli
{ const _af = addFeed; addFeed = function (kind, b) { if (kind === 'collapse') { (S.feed = S.feed || []); return _af('aband', b); } return _af(kind, b); }; }
