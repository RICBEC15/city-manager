// =====================================================================
//  Novità dal wiki - Blocco 2: strade e traffico
// =====================================================================
// ---------- opzioni dello strumento strada ----------
function elevTxt() { const e = TOOL.elev; return e <= -2 ? L('in galleria', 'in a tunnel') : e === -1 ? L('in trincea', 'in a trench') : e > 0 ? L('sopraelevata', 'elevated') + ' +' + ELEV * e + ' m' : L('a terra', 'on the ground'); }
function roadOptsHTML() {
  const b = (on, act, txt, tip = '') => `<button class="${on ? 'on' : ''}" onclick="${act};buildSub()" title="${tip}">${txt}</button>`;
  const isPed = RT[TOOL.sub]?.ped;
  let h = `<span>${L('Altezza', 'Height')}:</span>`;
  if (isPed) h += b(TOOL.elev <= -2, 'TOOL.elev=-2', '🚇 ' + L('Sottopassaggio', 'Underpass'), L('Sentiero in galleria sotto strade e colline', 'Footpath in a tunnel under roads and hills'));
  if (!isPed) h += b(TOOL.elev <= -2, 'TOOL.elev=-2', '🚇 ' + L('Galleria', 'Tunnel'), L('Sotto terra, anche sotto l\'acqua', 'Underground, even under water')) + b(TOOL.elev === -1, 'TOOL.elev=-1', '⛏️ ' + L('Trincea', 'Trench'));
  h += b(!TOOL.elev, 'TOOL.elev=0', L('A terra', 'Ground') + ' (J)');
  for (const k of [1, 2, 3]) h += b(TOOL.elev === k, 'TOOL.elev=' + k, (isPed && k === 1 ? '🌉 ' + L('Ponte pedonale', 'Footbridge') + ' ' : '') + '+' + ELEV * k + ' m' + (k === 1 ? ' (U)' : ''));
  h += `<span>${L('Parallela', 'Parallel')}:</span><select onchange="TOOL.par=+this.value;buildSub()">` + [0, 16, 24, 32, 48, 64].map(v => `<option value="${v}" ${(TOOL.par || 0) === v ? 'selected' : ''}>${v ? v + ' m' : L('no', 'off')}</option>`).join('') + '</select>';
  h += b(TOOL.replace, 'TOOL.replace=!TOOL.replace', '🔁 ' + L('Sostituisci', 'Replace'), L('Clicca una strada: diventa del tipo scelto (o prende lo stile di ponte scelto)', 'Click a road: it becomes the chosen type (or takes the chosen bridge style)'));
  h += b(!TOOL.nosnap, 'TOOL.nosnap=!TOOL.nosnap', '🧲 ' + L('Aggancio angoli', 'Angle snap'));
  h += `<span>${L('Ponti', 'Bridges')}:</span><select onchange="TOOL.bst=this.value;buildSub()">` + Object.keys(BRIDGES).map(k => `<option value="${k}" ${(TOOL.bst || 'beam') === k ? 'selected' : ''}>${BRIDGES[k]()}</option>`).join('') + '</select>';
  return h;
}
const RSIZES = [[16, () => L('Piccola', 'Small')], [30, () => L('Media', 'Medium')], [45, () => L('Grande', 'Large')], [60, () => L('Molto grande', 'Very large')]];
function roundOptsHTML() {
  let h = `<div class="subopts"><span>${L('Taglia', 'Size')}:</span>`;
  for (const [r, n] of RSIZES) h += `<button class="${(TOOL.rsize || 30) === r ? 'on' : ''}" onclick="TOOL.rsize=${r};buildSub()">${n()} · ${fmtMoney(Math.round(15000 * (r / 30) ** 2))}</button>`;
  h += `<span>${L('Centro', 'Centre')}:</span>`;
  for (const [k, n] of [['grass', L('Erba', 'Grass')], ['trees', L('Alberi', 'Trees')], ['concrete', L('Cemento', 'Concrete')]]) h += `<button class="${(TOOL.rcenter || 'grass') === k ? 'on' : ''}" onclick="TOOL.rcenter='${k}';buildSub()">${n}</button>`;
  return h + `<span style="color:var(--mute)">${L('Chi è già nella rotonda ha la precedenza', 'Cars already in the roundabout have priority')}</span></div>`;
}
// curva complessa: 4 clic -> due curve semplici che seguono la curva
function buildCubic(p0, c1, c2, p3, type) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
  const P01 = mid(p0, c1), P12 = mid(c1, c2), P23 = mid(c2, p3), A = mid(P01, P12), B = mid(P12, P23), M = mid(A, B);
  const q1 = { x: (3 * (P01.x + A.x) - p0.x - M.x) / 4, z: (3 * (P01.z + A.z) - p0.z - M.z) / 4 }, q2 = { x: (3 * (B.x + P23.x) - M.x - p3.x) / 4, z: (3 * (B.z + P23.z) - M.z - p3.z) / 4 };
  const r1 = buildRoad(p0, M, q1, type, TOOL.elev); if (!r1) return null;
  return buildRoad({ x: r1.last.x, z: r1.last.z, node: r1.last }, p3, q2, type, TOOL.elev);
}
// modalità parallela: una seconda strada accanto (per i sensi unici va nel verso opposto)
function buildParallel(p0, p1, cp, type) {
  const dx = p1.x - p0.x, dz = p1.z - p0.z, l = Math.hypot(dx, dz) || 1, d = TOOL.par, nx = -dz / l * d, nz = dx / l * d;
  const a = snapRoad(p0.x + nx, p0.z + nz, type), b = snapRoad(p1.x + nx, p1.z + nz, type), c = cp ? { x: cp.x + nx, z: cp.z + nz } : null;
  const one = !RT[type].two; TOOL.par = 0;
  try { one ? buildRoad(b, a, c, type, TOOL.elev) : buildRoad(a, b, c, type, TOOL.elev); } finally { TOOL.par = d; }
}
// centro delle rotonde
const roundGroup = new THREE.Group(); scene.add(roundGroup);
let roundKey = '';
function drawRounds() {
  const list = S?.rounds || [], key = list.length + ':' + (list[0]?.x ?? '');
  roundKey = key;
  while (roundGroup.children.length) { const c = roundGroup.children.pop(); c.geometry.dispose(); }
  for (const r of list) {
    const ri = Math.max(4, r.R - 7), y = getH(r.x, r.z) + 0.35, col = r.st === 'concrete' ? 0xb8b6b0 : 0x5f9a48;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(ri, ri, 0.5, 28), new THREE.MeshLambertMaterial({ color: col })); m.position.set(r.x, y, r.z); roundGroup.add(m);
    if (r.st === 'trees') for (let k = 0; k < Math.max(3, ri / 4); k++) { const a = k * 2.4, d = k ? ri * 0.55 : 0, t = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 6), new THREE.MeshLambertMaterial({ color: 0x3f7a38 })); t.position.set(r.x + Math.cos(a) * d, y + 4.5, r.z + Math.sin(a) * d); roundGroup.add(t); }
    if (r.st === 'concrete') { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 6, 10), new THREE.MeshLambertMaterial({ color: 0xd8d6d0 })); s.position.set(r.x, y + 3, r.z); roundGroup.add(s); }
  }
}
// ---------- percorsi per età, distanze massime ----------
function pickAgeMode() { const a = stats.ages, tot = a ? a.reduce((x, y) => x + y, 0) : 0; const r = rand(); if (!tot) return r < 0.15 ? 'senior' : r < 0.3 ? 'young' : 'car'; const sen = a[a.length - 1] / tot, yo = a[1] / tot; return r < sen ? 'senior' : r < sen + yo ? 'young' : 'car'; }
function legsLen(legs) { let l = 0; for (const g of legs) l += Math.abs(g.s1 - g.s0); return l; }
const TRIP_MAX = { work: 30000, shop: 9000, thru: 1e9 };
// ---------- incidenti ----------
const litRoad = s => { const rt = RT[s.type]; return rt.zone && !rt.gravel && !rt.alley; };
function crashRisk(e) {
  const s = e.seg; let r = 1 + 2 * (s.wear || 0);
  if (nightAmt > 0.5) r += litRoad(s) ? 0.2 : 0.9;
  if (WEATHER.kind === 'rain' || WEATHER.kind === 'storm') r += 0.6; if (WEATHER.snowRoad) r += 1;
  if (typeof tornados !== 'undefined' && tornados.length) r += 1.5;
  if (S.policies.speed) r *= 0.7;
  return r;
}
function crashTime(v, e) {
  const p = e.pts[Math.min(e.pts.length - 1, Math.floor(e.pts.length / 2))]; let t = 60;
  if (svNear(['police', 'policehq'], p.x, p.z)) t *= 0.6; if (svNear(['maint'], p.x, p.z)) t *= 0.6;
  return t;
}
function onCrash(v, e) {
  const along = e.dir === 1 ? v.s : e.seg.len - v.s, at = { seg: e.seg.id, along: clamp(along, 1, e.seg.len - 1) };
  const p = e.pts[Math.min(e.pts.length - 1, Math.floor(e.pts.length / 2))];
  for (const [types, kind] of [[['hospital', 'clinic'], 'ambulance'], [['police', 'policehq'], 'police'], [['maint'], 'maint']]) { const sv = svNear(types, p.x, p.z); if (sv && sv.seg != null) dispatch(sv, kind, at); }
  stats.crashM = (stats.crashM || 0) + 1;
}
// ---------- usura delle strade ----------
function roadWearMonth() {
  const depots = [...svcs.values()].filter(s => s.on && s.type === 'maint').map(s => ({ s, cap: 40 * extMul(s, 'capM') * clamp(S.budget[SV.maint.cat] / 100, 0.3, 1.5) }));
  let worn = 0, n = 0;
  for (const s of segs.values()) {
    const rt = RT[s.type]; if (rt.ped || rt.rail) continue;
    let f = 0, heavy = 0; for (const e of s.edges) { f += e.flow; for (const l of e.cars) for (const v of l) if (v.kind === 'truck' || v.kind === 'bus') heavy++; }
    let w = (s.wear || 0) + (rt.gravel ? 0.012 : 0.004) + 0.03 * Math.min(1, f / 600) + 0.004 * heavy;
    const m = s.pts[s.pts.length >> 1];
    if (w > 0.15) for (const d of depots) if (d.cap > 0 && Math.hypot(d.s.x - m.x, d.s.z - m.z) < SV.maint.r) { w = Math.max(0, w - 0.35); d.cap--; break; }
    s.wear = clamp(w, 0, 1); worn += s.wear; n++;
  }
  stats.roadWear = n ? worn / n : 0;
}
const _monthly2 = monthly;
monthly = function () { _monthly2(); roadWearMonth(); stats.thruM = stats.thruN || 0; stats.thruN = 0; stats.tooFarM = stats.tooFar || 0; stats.tooFar = 0; stats.noRouteM = stats.noRoute || 0; stats.noRoute = 0; stats.crashMM = stats.crashM || 0; stats.crashM = 0; };
// ---------- parcheggi lungo le strade ----------
const _computeCoverage2 = computeCoverage;
computeCoverage = function () {
  _computeCoverage2();
  for (const s of segs.values()) { if (!RT[s.type].park) continue; for (let i = 0; i < s.pts.length; i += 5) { const p = s.pts[i]; bldNear(p.x, p.z, 45, b => { if (b.cov) b.cov.parking = Math.min(1.2, (b.cov.parking || 0) + 0.25); }); } }
};
// ---------- vista "Condizioni delle strade" ----------
const _renderInfo2 = renderInfo;
renderInfo = function () {
  const was = infoDirty; _renderInfo2();
  if (!was || INFO.mode !== 'roads') return;
  terrU.uOvAmt.value = 0;
  const p = [], col = [];
  for (const s of segs.values()) {
    const rt = RT[s.type]; if (rt.ped || rt.rail) continue; const c = ramp(s.wear || 0), hw = rt.w * 0.42;
    for (let i = 0; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw; const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]]; for (const k of [0, 1, 2, 0, 2, 3]) { p.push(...q[k]); col.push(c[0] / 255, c[1] / 255, c[2] / 255); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
};
const _showInfo2 = showInfo;
showInfo = function (mode, temp) {
  _showInfo2(mode, temp);
  if (!S) return;
  const lg = $('legend');
  if (mode === 'roads') lg.innerHTML += `<div style="margin-top:4px">🟩 ${L('strada nuova', 'new road')} 🟥 ${L('strada consumata: più lenta e più incidenti', 'worn road: slower, more accidents')} · ${L('usura media', 'average wear')}: <b>${Math.round((stats.roadWear || 0) * 100)}%</b><br>${L('I depositi di manutenzione riparano le strade nel loro raggio', 'Maintenance depots repair roads in their range')}</div>`;
  if (mode === 'traffic') lg.innerHTML += `<div style="margin-top:4px;font-size:12px">${L('Traffico di passaggio (non porta soldi)', 'Through traffic (brings no money)')}: <b>${fmtNum(stats.thruM || 0)}</b> ${L('al mese', 'per month')} · ${L('incidenti', 'accidents')}: <b>${fmtNum(stats.crashMM || 0)}</b> · ${L('viaggi rinunciati perché troppo lontani', 'trips given up as too far')}: <b>${fmtNum(stats.tooFarM || 0)}</b> · ${L('senza strada', 'no route')}: <b>${fmtNum(stats.noRouteM || 0)}</b></div>`;
};
// scheda della strada: condizioni, ponte
function segExtraHTML(o) {
  let h = `<div class="sec">${L('Condizioni', 'Condition')}</div><div class="row"><span>${L('Usura', 'Wear')}</span><span>${Math.round((o.wear || 0) * 100)}%</span></div>` + `<div class="bar"><i style="width:${Math.round((1 - (o.wear || 0)) * 100)}%;background:${(o.wear || 0) > 0.6 ? 'var(--bad)' : 'var(--good)'}"></i></div>`;
  if ((o.wear || 0) > 0.05) h += `<button onclick="repairSeg(${o.id})">🛠️ ${L('Ripara subito', 'Repair now')} · ${fmtMoney(Math.round(o.len * RT[o.type].cost * 0.3 * o.wear))}</button>`;
  if (o.elev <= -2) h += `<div style="font-size:12px;color:var(--mute)">🚇 ${L('Galleria', 'Tunnel')}</div>`;
  if (o.pts.some(q => q.y - q.h > 4)) h += `<div class="sec">${L('Ponte', 'Bridge')}</div><div style="display:flex;gap:4px;flex-wrap:wrap">` + Object.keys(BRIDGES).map(k => `<button class="${(o.bst || 'beam') === k ? 'on' : ''}" onclick="setBridge(${o.id},'${k}')">${BRIDGES[k]()}</button>`).join('') + '</div>' + (o.bst === 'draw' ? `<div style="font-size:12px;color:var(--mute)">${L('Si alza quando passa una nave: le auto aspettano', 'Opens when a ship passes: cars wait')}${o.open ? ' · <b>' + L('aperto ora', 'open now') + '</b>' : ''}</div>` : '');
  return h;
}
function repairSeg(id) { const s = segs.get(id); if (!s) return; if (!spend(Math.round(s.len * RT[s.type].cost * 0.3 * (s.wear || 0)))) return; s.wear = 0; infoDirty = true; refreshPanels(); }
function setBridge(id, k) { const s = segs.get(id); if (!s) return; if (k !== 'beam' && (s.bst || 'beam') === 'beam' && !spend(Math.round(s.len * RT[s.type].cost * 0.3))) return; s.bst = k === 'beam' ? null : k; if (s.leaf && k !== 'draw') { drawLeaves.remove(s.leaf); s.leaf = null; s.open = false; } roadDirty.add(s.chunk); flushRoads(); refreshPanels(); }
// ---------- ogni fotogramma: ponti levatoi e centri delle rotonde ----------
const _updateVehicles2 = updateVehicles;
let dbT = 0;
updateVehicles = function (dt) { _updateVehicles2(dt); dbT += dt; if (dbT > 0.25) { updateDrawbridges(dbT); dbT = 0; } const list = S?.rounds || []; if (list.length + ':' + (list[0]?.x ?? '') !== roundKey) drawRounds(); };
