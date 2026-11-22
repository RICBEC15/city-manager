// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 8: parchi, turismo e mare
//  aree parco a moduli con livelli e conti, fari e moli, attrazioni,
//  politica "promozione della città"
// =====================================================================
// moduli delle aree parco: attr = turisti in più, park = svago per chi abita vicino
const PMOD = {
  tea: { attr: 1, park: 0.6 }, green: { attr: 2, park: 0.6 }, maze: { attr: 2, park: 0.8 }, kiosk: { attr: 0.5, park: 0.5 },
  coaster: { attr: 4, park: 0.6 }, carousel: { attr: 2, park: 0.8 }, bumper: { attr: 2, park: 0.6 }, wheel2: { attr: 3, park: 0.6 },
  trail: { attr: 1, park: 0.8 }, lodge: { attr: 2, park: 0.5 }, lookout: { attr: 2, park: 0.5 }, camp: { attr: 2, park: 0.6 },
  savanna: { attr: 4, park: 0.5 }, bears: { attr: 3, park: 0.5 }, aviary: { attr: 2, park: 0.5 }, reptile: { attr: 2, park: 0.5 },
};
const PAREA = ['pa_city', 'pa_fun', 'pa_nature', 'pa_zoo'];
Object.assign(SV, {
  pa_city: { cat: 'parks', w: 160, d: 140, cost: 60000, upk: 1200, ms: 2, r: 1400, park: 4, attr: 2, parea: true, n: () => L('Area parco cittadino', 'City park area'), d2: () => L('Si costruisce a moduli (casa del tè, serra, labirinto...). Sale di livello con i visitori.', 'Built in modules (tea house, greenhouse, maze...). Levels up with visitors.') },
  pa_fun: { cat: 'parks', w: 180, d: 150, cost: 120000, upk: 2500, ms: 4, r: 1800, park: 3, attr: 5, parea: true, noise: 4, n: () => L('Luna park', 'Amusement park'), d2: () => L('Montagne russe e giostre a moduli: tanti turisti, un po\' di rumore', 'Roller coasters and rides as modules: many tourists, some noise') },
  pa_nature: { cat: 'parks', w: 260, d: 220, cost: 50000, upk: 800, ms: 3, r: 2200, park: 3, attr: 3, parea: true, free: true, n: () => L('Riserva naturale', 'Nature reserve'), d2: () => L('Sentieri, rifugio e belvedere nel verde. Non serve la strada.', 'Trails, lodge and lookout in nature. No road needed.') },
  pa_zoo: { cat: 'parks', w: 200, d: 170, cost: 150000, upk: 3000, ms: 5, r: 1800, park: 3, attr: 6, parea: true, n: () => L('Zoo', 'Zoo'), d2: () => L('Recinti con gli animali a moduli: piace alle famiglie e ai turisti', 'Animal enclosures as modules: families and tourists love it') },
  lighthouse: { cat: 'parks', w: 14, d: 14, cost: 15000, upk: 200, ms: 2, r: 500, park: 1, attr: 1, shore: true, free: true, h: 28, n: () => L('Faro', 'Lighthouse'), d2: () => L('Sulla riva: guida le navi e piace a chi passeggia', 'On the shore: guides ships, nice for walkers') },
  lighthouse2: { cat: 'parks', w: 30, d: 30, cost: 160000, upk: 1800, ms: 5, r: 1200, park: 4, attr: 9, shore: true, unique: true, h: 44, n: () => L('Faro storico', 'Historic lighthouse'), d2: () => L('Attrazione: si sale in cima a guardare il mare', 'Attraction: climb to the top to see the sea') },
  pier: { cat: 'parks', w: 20, d: 70, cost: 25000, upk: 400, ms: 2, r: 700, park: 4, attr: 2, summer: true, shore: true, n: () => L('Molo per lo svago', 'Leisure pier'), d2: () => L('Passeggiata e pesca sul mare', 'Walking and fishing over the sea') },
  seapark: { cat: 'parks', w: 80, d: 40, cost: 40000, upk: 700, ms: 3, r: 900, park: 6, attr: 3, shore: true, n: () => L('Parco sul mare', 'Seaside park'), d2: () => L('Prato e panchine con vista sull\'acqua', 'Lawn and benches with a view of the water') },
  museum: { cat: 'parks', w: 56, d: 44, cost: 260000, upk: 3500, ms: 5, r: 1200, park: 5, attr: 14, indoor: true, unique: true, h: 20, xp: 3000, n: () => L('Museo delle scienze', 'Science museum'), d2: () => L('Monumento al chiuso: turisti tutto l\'anno', 'Indoor landmark: tourists all year round') },
  aquarium: { cat: 'parks', w: 70, d: 50, cost: 340000, upk: 4500, ms: 6, r: 1300, park: 6, attr: 16, indoor: true, unique: true, shore: true, h: 16, xp: 4000, n: () => L('Oceanario', 'Aquarium'), d2: () => L('Sulla riva: vasche enormi con i pesci del mare', 'On the shore: huge tanks with sea life') },
  theatre: { cat: 'parks', w: 50, d: 50, cost: 300000, upk: 4000, ms: 6, r: 1300, park: 6, attr: 12, indoor: true, unique: true, h: 26, xp: 4000, n: () => L('Teatro dell\'opera', 'Opera house'), d2: () => L('Spettacoli la sera: svago al chiuso e turisti', 'Evening shows: indoor leisure and tourists') },
  arena: { cat: 'parks', w: 90, d: 80, cost: 450000, upk: 6000, ms: 7, r: 1500, park: 8, attr: 18, indoor: true, unique: true, h: 24, noise: 4, xp: 5000, n: () => L('Arena coperta', 'Indoor arena'), d2: () => L('Concerti e partite al coperto: tantissima gente', 'Concerts and games under a roof: huge crowds') },
});
const PM_ = (k, cost, upk, it, en) => ({ k, cost, upk, n: () => L(it, en) });
Object.assign(EXT, {
  pa_city: [PM_('tea', 15000, 300, 'Casa del tè', 'Tea house'), PM_('green', 30000, 600, 'Serra', 'Greenhouse'), PM_('maze', 20000, 400, 'Labirinto di siepi', 'Hedge maze'), PM_('kiosk', 6000, 150, 'Chiosco', 'Kiosk')],
  pa_fun: [PM_('coaster', 80000, 1500, 'Montagne russe', 'Roller coaster'), PM_('carousel', 25000, 500, 'Giostra', 'Carousel'), PM_('bumper', 30000, 600, 'Autoscontri', 'Bumper cars'), PM_('wheel2', 45000, 800, 'Ruota panoramica piccola', 'Small Ferris wheel')],
  pa_nature: [PM_('trail', 8000, 150, 'Sentieri', 'Trails'), PM_('lodge', 25000, 400, 'Rifugio', 'Lodge'), PM_('lookout', 15000, 250, 'Belvedere', 'Lookout'), PM_('camp', 12000, 300, 'Campeggio', 'Campsite')],
  pa_zoo: [PM_('savanna', 70000, 1600, 'Recinto della savana', 'Savanna enclosure'), PM_('bears', 45000, 1000, 'Recinto degli orsi', 'Bear enclosure'), PM_('aviary', 30000, 700, 'Voliera', 'Aviary'), PM_('reptile', 35000, 800, 'Rettilario', 'Reptile house')],
});
TREE.push(
  { id: 't_parea', cat: 'parks', cost: 2, items: ['pa_city', 'pa_nature'], n: () => L('Aree parco', 'Park areas') },
  { id: 't_parea2', cat: 'parks', cost: 4, req: 't_parea', items: ['pa_fun', 'pa_zoo'], n: () => L('Luna park e zoo', 'Amusement parks and zoos') },
  { id: 't_seaside', cat: 'parks', cost: 2, items: ['lighthouse', 'lighthouse2', 'pier', 'seapark'], n: () => L('Fari e svago sul mare', 'Lighthouses and seaside leisure') },
);
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
POLICIES.push({ id: 'promo', n: () => L('Promozione della città', 'City promotion'), d: () => L('Pubblicità della città: +20% turisti, ma più criminalità vicino alle attrazioni', 'City advertising: +20% tourists, but more crime near attractions'), cost: 0.25 });

// ---------- stato delle aree parco (salvato in S.parks) ----------
const PLVL = [0, 3000, 10000, 25000, 50000];
function parkData(sv) { S.parks = S.parks || {}; return S.parks[sv.id] || (S.parks[sv.id] = { t: 5, st: 100, xp: 0, c: 1, sf: 1, v: 0 }); }
function parkLevel(p) { let l = 1; for (let i = 1; i < PLVL.length; i++) if (p.xp >= PLVL[i]) l = i + 1; return l; }
function parkMods(sv) { return sv.ext.filter(k => PMOD[k]); }
function parkRating(sv) { const p = parkData(sv); return Math.round(100 * clamp(0.35 * p.c + 0.25 * p.sf + 0.25 * Math.min(1, parkMods(sv).length / 4) + 0.15 * (1 - p.t / 20), 0, 1)); }
function parkMul(sv) { const p = parkData(sv); return (1 + 0.15 * (parkLevel(p) - 1)) * (0.5 + parkRating(sv) / 200); }
function parkAdj(id, key, dv) {
  const sv = svcs.get(id); if (!sv) return; const p = parkData(sv);
  if (key === 't') p.t = clamp(p.t + dv, 0, 20); else p.st = clamp(p.st + dv, 50, 150);
  covDirty = true; refreshPanels();
}
function parkMonth() {
  S.parks = S.parks || {};
  for (const id in S.parks) if (!svcs.has(+id)) delete S.parks[id];
  const totAttr = Math.max(1, stats.attr || 1);
  for (const sv of svcs.values()) {
    const d = SV[sv.type]; if (!sv.on || !d.parea) continue; const p = parkData(sv), mods = parkMods(sv).length;
    let near = 0; bldNear(sv.x, sv.z, d.r * 1.5, b => { if (b.hh) near += b.occ * 2.6; });
    const at = (d.attr + parkMods(sv).reduce((a, k) => a + PMOD[k].attr, 0)) * parkMul(sv);
    p.v = Math.round((near * 0.06 + (stats.tourists || 0) * at / totAttr * 0.5) * (1 - p.t / 30) * (0.6 + mods * 0.1) * (0.5 + parkRating(sv) / 200));
    const old = parkLevel(p); p.xp += p.v; const nl = parkLevel(p);
    if (nl > old) { toast('🎡 ' + d.n() + ': ' + L('livello', 'level') + ' ' + nl, 3500); addXP(100 * nl, L('area parco di livello più alto', 'park area levelled up')); }
    const cap = 4000 + 1500 * mods, staff = p.st / 100;
    p.c = lerp(p.c, clamp(staff * 1.1 - p.v / cap * 0.4, 0, 1), 0.3);
    let pol = 0, n = 0; bldNear(sv.x, sv.z, 500, b => { pol += b.cov?.police || 0; n++; });
    p.sf = lerp(p.sf, clamp((n ? pol / n : 0) * 0.7 + staff * 0.3 + 0.1, 0, 1), 0.3);
  }
  covDirty = true;
}

// ---------- copertura: moduli, livelli e politica ----------
const _computeCoverage8 = computeCoverage;
computeCoverage = function () {
  _computeCoverage8();
  for (const b of buildings.values()) b.nearAttr = 0;
  for (const sv of svcs.values()) {
    const d = SV[sv.type]; if (!sv.on) continue;
    if (d.attr >= 5 || d.parea) bldNear(sv.x, sv.z, 800, b => { b.nearAttr = 1; });
    if (!d.parea) continue;
    const r = d.r, m = parkMul(sv), add = parkMods(sv).reduce((a, k) => a + PMOD[k].park, 0) * m + d.park * (m - 1);
    if (add > 0) bldNear(sv.x, sv.z, r, b => { b.cov.park = Math.max(0, Math.min(15, b.cov.park + add * (1 - smooth(r * 0.6, r, Math.hypot(b.x - sv.x, b.z - sv.z))) * leisureMul(d))); });
  }
};
const _updateBuilding8 = updateBuilding;
updateBuilding = function (b) { _updateBuilding8(b); if (S.policies.promo && b.nearAttr && !b.ruin) b.crime = Math.min(100, b.crime + 0.06); };
const _computeStats8 = computeStats;
computeStats = function () {
  _computeStats8();
  let extra = 0;
  for (const sv of svcs.values()) { const d = SV[sv.type]; if (!sv.on || !d.parea) continue; extra += (d.attr + parkMods(sv).reduce((a, k) => a + PMOD[k].attr, 0)) * parkMul(sv) - d.attr; }
  stats.attr = (stats.attr || 0) + extra; stats.tourists = Math.max(0, Math.round((stats.tourists || 0) + extra * 30));
  if (S.policies.promo) stats.tourists = Math.round(stats.tourists * 1.2);
};
const _budgetNow8 = budgetNow;
budgetNow = function () {
  const bg = _budgetNow8(), inc = bg.inc, exp = bg.exp;
  let tk = 0, st = 0;
  for (const sv of svcs.values()) { const d = SV[sv.type]; if (!sv.on || !d.parea) continue; const p = parkData(sv); tk += p.v * p.t * 0.05; st += (d.upk + extUpk(sv)) * (p.st - 100) / 100; }
  inc.tickets = Math.round(tk); exp.services = (exp.services || 0) + st;
  bg.ti = Object.keys(inc).reduce((a, k) => a + (typeof inc[k] === 'number' ? inc[k] : 0), 0);
  bg.te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + (exp[k] || 0), 0); bg.net = bg.ti - bg.te;
  return bg;
};
const _monthly8 = monthly;
monthly = function () { _monthly8(); parkMonth(); };

// ---------- scheda dell'area parco ----------
const _svcExtraHTML8 = svcExtraHTML;
svcExtraHTML = function (o) {
  let h = _svcExtraHTML8(o); const d = SV[o.type]; if (!d.parea) return h;
  const p = parkData(o), lv = parkLevel(p), nx = PLVL[lv] ?? null, rt = parkRating(o);
  const r = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
  const btn = (k, dv, t) => `<button style="padding:2px 9px" onclick="parkAdj(${o.id},'${k}',${dv})">${t}</button>`;
  h += `<div class="sec">🎡 ${L('Area parco', 'Park area')}</div>` + r(L('Livello', 'Level'), lv + ' / 5' + (nx ? ` · ${fmtNum(p.xp)} / ${fmtNum(nx)}` : ''));
  h += r(L('Visitatori al mese', 'Visitors per month'), fmtNum(p.v)) + r(L('Moduli', 'Modules'), parkMods(o).length + ' / ' + (EXT[o.type] || []).length);
  h += r('⭐ ' + L('Valutazione', 'Rating'), rt + '%') + r('🧹 ' + L('Pulizia', 'Cleanliness'), Math.round(p.c * 100) + '%') + r('🛡️ ' + L('Sicurezza', 'Safety'), Math.round(p.sf * 100) + '%');
  h += `<div class="row" style="align-items:center"><span>🎟️ ${L('Biglietto', 'Ticket')}</span><span>${btn('t', -1, '−')} € ${p.t} ${btn('t', 1, '+')}</span></div>`;
  h += `<div class="row" style="align-items:center"><span>👷 ${L('Personale', 'Staff')}</span><span>${btn('st', -10, '−')} ${p.st}% ${btn('st', 10, '+')}</span></div>`;
  h += r(L('Incasso biglietti', 'Ticket income'), fmtMoney(Math.round(p.v * p.t * 0.05)) + '/' + L('mese', 'mo'));
  if (p.c < 0.4) h += `<div style="font-size:12px;color:var(--bad)">${L('Il parco è sporco: aumenta il personale', 'The park is dirty: add staff')}</div>`;
  if (p.sf < 0.4) h += `<div style="font-size:12px;color:var(--bad)">${L('Il parco è poco sicuro: serve la polizia vicino o più personale', 'The park feels unsafe: police nearby or more staff needed')}</div>`;
  return h;
};

// ---------- disegno ----------
const _drawSvc8 = drawSvc;
drawSvc = function (sv) {
  const T = sv.type;
  if (!PAREA.includes(T) && !['lighthouse', 'lighthouse2', 'pier', 'seapark', 'theatre', 'arena', 'aquarium'].includes(T)) return _drawSvc8(sv);
  removeParts(sv.parts); curRef = sv;
  const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts, has = k => sv.ext.includes(k);
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
  const cyl = (a, b, r, h, c, y0 = 0) => { const [x, z] = at(a, b); return addPart(P, 'cyl', x, y + y0, z, 0, r, h, r, c); };
  const tree = (a, b) => { cyl(a, b, 0.5, 3, 0x6a4a2a); cyl(a, b, 3, 4, 0x3f7a35, 3); };
  switch (T) {
    case 'pa_city': slab(0x6aa84f); box(0, -D * 0.45, 10, 3, 4, 0xd8cfa8); for (let i = 0; i < 8; i++) tree(-W * 0.4 + (i % 4) * W * 0.27, i < 4 ? -D * 0.2 : D * 0.3);
      if (has('tea')) box(-W * 0.3, D * 0.05, 12, 5, 10, 0x9a5a3a); if (has('green')) box(W * 0.3, D * 0.05, 18, 7, 12, 0xcfe8f0); if (has('maze')) for (let i = 0; i < 4; i++) box(0, D * 0.05, 26 - i * 6, 1.8, 26 - i * 6, 0x2f6a2a); if (has('kiosk')) box(W * 0.1, -D * 0.35, 4, 3, 4, 0xe0a030); break;
    case 'pa_fun': slab(0xb8a888); box(0, -D * 0.45, 14, 6, 5, 0xd04060);
      if (has('coaster')) { for (let i = 0; i < 10; i++) { const t = i / 10 * Math.PI * 2; cyl(Math.cos(t) * W * 0.3, D * 0.1 + Math.sin(t) * D * 0.25, 0.6, 8 + 6 * Math.sin(t * 2), 0xc8c8c8); } box(0, D * 0.1, W * 0.6, 0.8, 2, 0xd03030, 'body', 12); }
      if (has('carousel')) { cyl(-W * 0.3, -D * 0.2, 8, 2, 0xf0d050); cyl(-W * 0.3, -D * 0.2, 9, 1.5, 0xd04040, 6); }
      if (has('bumper')) box(W * 0.3, -D * 0.2, 20, 4, 14, 0x4060c0); if (has('wheel2')) box(W * 0.35, D * 0.3, 2, 26, 26, 0xe0e0e0); break;
    case 'pa_nature': for (let i = 0; i < 14; i++) tree((((i * 37) % 11) / 10 - 0.5) * W * 0.85, (((i * 53) % 13) / 12 - 0.5) * D * 0.85);
      if (has('trail')) for (let i = -2; i <= 2; i++) box(i * W * 0.15, 0, 3, 0.4, D * 0.5, 0xc8b080, 'plain', 0.2); if (has('lodge')) box(-W * 0.3, D * 0.3, 14, 6, 10, 0x7a5a3a); if (has('lookout')) { cyl(W * 0.3, -D * 0.3, 2, 14, 0x8a6a4a); box(W * 0.3, -D * 0.3, 7, 1, 7, 0x8a6a4a, 'body', 14); }
      if (has('camp')) for (let i = 0; i < 4; i++) box(W * 0.25 + i * 7, D * 0.3, 4, 2.5, 4, 0xe0a040); break;
    case 'pa_zoo': slab(0x7aa858); box(0, -D * 0.45, 16, 6, 6, 0x8a6a3a);
      if (has('savanna')) box(-W * 0.25, D * 0.1, W * 0.4, 0.5, D * 0.45, 0xd8c070, 'plain', 0.3); if (has('bears')) box(W * 0.25, D * 0.2, W * 0.3, 0.5, D * 0.3, 0x8a8a70, 'plain', 0.3);
      if (has('aviary')) cyl(W * 0.25, -D * 0.2, 12, 14, 0xd0d8d8); if (has('reptile')) box(-W * 0.25, -D * 0.25, 20, 6, 14, 0x5a8a5a); break;
    case 'lighthouse': cyl(0, 0, 3, 24, 0xf2f2f2); cyl(0, 0, 3.2, 3, 0xc83a2a, 10); cyl(0, 0, 2.6, 4, 0xffe68a, 24); break;
    case 'lighthouse2': slab(0x9a9a92); box(W * 0.2, 0, 12, 6, 14, 0xe8e0d0); cyl(-W * 0.15, 0, 5, 38, 0xf4f4f4); cyl(-W * 0.15, 0, 5.3, 4, 0xc83a2a, 14); cyl(-W * 0.15, 0, 5.3, 4, 0xc83a2a, 28); cyl(-W * 0.15, 0, 4, 5, 0xffe68a, 38); break;
    case 'pier': box(0, D * 0.2, W, 1, D * 1.2, 0x9a7a5a, 'body', 0.5); for (let i = -2; i <= 3; i++) { cyl(-W / 2, i * D * 0.2, 0.5, 3, 0x6a5a4a, -2); cyl(W / 2, i * D * 0.2, 0.5, 3, 0x6a5a4a, -2); } box(0, D * 0.75, 8, 4, 6, 0xd8d0c0, 'body', 1.5); break;
    case 'seapark': slab(0x6aa84f); for (let i = -3; i <= 3; i++) tree(i * W * 0.13, -D * 0.25); box(0, D * 0.3, W, 0.4, 4, 0xc8c0a8, 'plain', 0.3); break;
    case 'theatre': slab(0x9a9a92); box(0, 0, W * 0.8, 18, D * 0.7, 0xe8dcc4); cyl(0, D * 0.1, W * 0.3, 8, 0x5a8aa0, 18); for (let i = -3; i <= 3; i++) cyl(i * W * 0.11, -D * 0.38, 1, 14, 0xf4f0e8); break;
    case 'arena': slab(0x8a8a86); cyl(0, 0, W * 0.45, 20, 0xc8c8c8); cyl(0, 0, W * 0.38, 4, 0x6a90b8, 20); break;
    case 'aquarium': slab(0x9a9a92); box(0, -D * 0.1, W * 0.8, 12, D * 0.6, 0x3a80b0); cyl(W * 0.25, D * 0.1, 10, 16, 0x9ad0e8); break;
  }
};
