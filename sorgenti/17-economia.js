// =====================================================================
//  Novità dal wiki - Blocco 6: economia
// =====================================================================
// banca centrale: prestiti meno cari
SV.cbank = { cat: 'misc', w: 50, d: 40, cost: 350000, upk: 3000, ms: 6, unique: true, h: 34, n: () => L('Banca centrale', 'Central bank'), d2: () => L('Gli interessi dei prestiti scendono del 2%', 'Loan interest drops by 2%') };
TREE.push({ id: 't_cbank', cat: 'misc', cost: 3, items: ['cbank'], n: () => L('Banca centrale', 'Central bank') }); TREE_ITEM.cbank = 't_cbank';
{ const _d = drawSvc; drawSvc = function (sv) { if (sv.type !== 'cbank') return _d(sv); removeParts(sv.parts); curRef = sv; const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts; addPart(P, 'body', sv.x, y, sv.z, yaw, W * 0.85, 20, D * 0.7, 0xd8d0c0); addPart(P, 'roof', sv.x, y + 20, sv.z, yaw, W * 0.87, 5, D * 0.72, 0x8a8a7a); for (let i = -3; i <= 3; i++) addPart(P, 'cyl', sv.x + Math.cos(yaw) * i * W * 0.12 + Math.sin(yaw) * (-D * 0.38), y, sv.z - Math.sin(yaw) * i * W * 0.12 + Math.cos(yaw) * (-D * 0.38), 0, 1, 18, 1, 0xf0ece0); }; }
// ---------- tariffe: sotto il 100% si consuma di più ma si è più contenti; sopra, il contrario e doppio ----------
function feeD(k) { const f = (typeof S !== 'undefined' && S && S.fees) ? S.fees[k] ?? 100 : 100; return 100 - f; }
function feeCons(k) { const d = feeD(k); return d >= 0 ? 1 + 0.002 * d : 1 + 0.004 * d; }
function feeHappy() { let h = 0; for (const k of ['power', 'water']) { const d = feeD(k); h += d >= 0 ? 0.05 * d : 0.1 * d; } return h; }
function feeBiz() { let e = 0; for (const k of ['power', 'water']) { const d = feeD(k); e += d >= 0 ? 0.002 * d : 0.004 * d; } return 1 + e; }
// ---------- budget dei servizi: efficienza dal 25% (budget 50%) al 125% (budget 150%) ----------
function budEff(cat) { const b = S.budget[cat] ?? 100; return b <= 100 ? 0.25 + (b - 50) / 50 * 0.75 : 1 + (b - 100) / 50 * 0.25; }
const COVCAT = { health: 'health', death: 'health', police: 'police', fire: 'fire', edu1: 'edu', edu2: 'edu', edu3: 'edu', garb: 'garbage', park: 'parks', pmaint: 'parks', maint: 'misc', net: 'misc', welfare: 'misc' };
const _computeCoverage6 = computeCoverage;
computeCoverage = function () {
  _computeCoverage6();
  const m = {}; for (const k in COVCAT) m[k] = budEff(COVCAT[k]) / (0.75 + 0.25 * clamp(S.budget[COVCAT[k]] / 100, 0.3, 1.5)); // il raggio era già ridotto: qui il resto
  for (const b of buildings.values()) if (b.cov) for (const k in m) if (b.cov[k]) b.cov[k] *= m[k];
};
function budgetEffHTML() { return `<div style="font-size:12px;color:var(--mute);margin-top:2px">${L('Efficienza', 'Efficiency')}: ` + Object.keys(CAT).filter(k => k !== 'sign' && k !== 'spec').map(k => `${CAT[k].i} ${Math.round(budEff(k) * 100)}%`).join(' · ') + `<br>${L('Con meno budget: meno mezzi e raggio più piccolo', 'Less budget: fewer vehicles and smaller range')}</div>`; }
// ---------- servizi importati dalle città vicine (politica) ----------
POLICIES.push({ id: 'importSvc', n: () => L('Importa servizi dalle città vicine', 'Import services from neighbours'), d: () => L('Polizia, pompieri, sanità, cimiteri e rifiuti da fuori dove i tuoi non arrivano: lenti e a pagamento (0,6 € a cittadino)', 'Police, fire, health, deathcare and garbage from outside where yours don\'t reach: slow and paid (€0.6 per citizen)'), cost: 0.6 });
const _updateBuilding6 = updateBuilding;
updateBuilding = function (b) {
  _updateBuilding6(b);
  if (!buildings.has(b.id) || b.ruin) return;
  b.happy = clamp(b.happy + feeHappy() * 0.1, 0, 100);
  if (b.fac) b.fac.fees = feeHappy();
  if (!S.policies.importSvc) return;
  const c = b.cov || {};
  if ((c.garb || 0) < 0.1) b.garb *= 0.97;
  if ((c.death || 0) < 0.1 && b.dead > 0 && rand() < 0.05) b.dead--;
  if ((c.health || 0) < 0.1 && b.sick > 0 && rand() < 0.03) b.sick--;
  if ((c.police || 0) < 0.1) b.crime = Math.max(0, b.crime - 0.02);
  if ((c.fire || 0) < 0.1 && b.fire && rand() < 0.01) { b.fire = 0; burning.delete(b); }
};
// ---------- catena completa dei beni ----------
const CHAIN = [
  ['timber', ['wood'], '🪵', ['Legname', 'Timber']], ['paper', ['timber'], '📄', ['Carta', 'Paper']], ['furniture', ['timber'], '🪑', ['Mobili', 'Furniture']],
  ['metals', ['ore'], '🔩', ['Metalli', 'Metals']], ['steel', ['coal', 'metals'], '🏗️', ['Acciaio', 'Steel']], ['machinery', ['metals', 'steel'], '⚙️', ['Macchinari', 'Machinery']],
  ['minerals', ['stone'], '💎', ['Minerali', 'Minerals']], ['concrete', ['stone'], '🧱', ['Cemento', 'Concrete']],
  ['petrochem', ['oil', 'grain'], '🧴', ['Petrolchimici', 'Petrochemicals']], ['chemicals', ['oil', 'minerals'], '⚗️', ['Chimici', 'Chemicals']], ['plastics', ['chemicals', 'petrochem'], '🧪', ['Plastica', 'Plastics']], ['pharma', ['chemicals'], '💊', ['Farmaci', 'Pharmaceuticals']],
  ['electronics', ['minerals', 'plastics'], '📱', ['Elettronica', 'Electronics']], ['vehicles', ['metals', 'plastics'], '🚗', ['Veicoli', 'Vehicles']],
  ['beverages', ['grain', 'veg'], '🥤', ['Bevande', 'Beverages']], ['conv', ['grain', 'livestock'], '🥫', ['Cibo pronto', 'Convenience food']], ['food2', ['livestock', 'veg'], '🍲', ['Cibo', 'Food']], ['textiles', ['cotton', 'livestock', 'petrochem'], '👕', ['Tessuti', 'Textiles']],
];
const OFFICE_P = [['software', '💻', ['Software', 'Software']], ['telecom', '📡', ['Telecomunicazioni', 'Telecom']], ['finance', '🏦', ['Finanza', 'Finance']], ['media', '🎬', ['Media', 'Media']]];
const COM_P = [['lodging', '🛏️', ['Alloggio', 'Lodging']], ['meals', '🍽️', ['Pasti', 'Meals']], ['entertain', '🎭', ['Intrattenimento', 'Entertainment']], ['leisure', '🎳', ['Svago', 'Recreation']]];
function computeChain() {
  const R = stats.raw || {}, base = { wood: R.wood?.p || 0, ore: R.ore?.p || 0, stone: R.stone?.p || 0, oil: R.oil?.p || 0, cotton: R.cotton?.p || 0, grain: (R.food?.p || 0) * 0.4, veg: (R.food?.p || 0) * 0.3, livestock: (R.food?.p || 0) * 0.3, coal: (R.ore?.p || 0) * 0.3 };
  let fac = 0, off = 0, com = 0; for (const b of buildings.values()) { if (b.ruin || b.aband) continue; const k = ZT[b.zone].k; if (k === 'I' && !b.spec) fac += b.occ; else if (k === 'O') off += b.occ; else if (k === 'C' || k === 'M') com += b.wk || 0; }
  const P = { ...base }, out = {};
  const cap = fac * 0.6 * feeBiz() * specMul();
  for (const [k, ins] of CHAIN) { const have = Math.min(...ins.map(i => P[i] || 0)), need = cap / CHAIN.length; const made = Math.round(Math.min(have, need) * 0.9 + (have < need ? 0 : 0)); P[k] = made; out[k] = { p: made, n: Math.round(need), imp: Math.max(0, Math.round(need - made)) }; }
  for (const [k] of OFFICE_P) out[k] = { p: Math.round(off * 0.25), n: Math.round(off * 0.22) };
  for (const [k] of COM_P) out[k] = { p: Math.round(com * 0.25), n: Math.round((stats.pop * 0.02 + stats.tourists * 0.01)) };
  stats.chain = out;
  // specializzazione: il bene prodotto di più
  let best = null, bv = 0; for (const k in out) if (out[k].p > bv) { bv = out[k].p; best = k; }
  S.specGood = bv > 200 ? best : null; S.specLvl = bv > 200 ? clamp((bv - 200) / 1500, 0, 1) : 0;
}
function specMul() { return 1 + 0.15 * (S.specLvl || 0); }
function chainName(k) { const c = CHAIN.find(x => x[0] === k) || OFFICE_P.find(x => x[0] === k) || COM_P.find(x => x[0] === k); if (!c) return k; const n = c.length === 4 ? c[3] : c[2], i = c.length === 4 ? c[2] : c[1]; return i + ' ' + L(n[0], n[1]); }
// ---------- risorse che finiscono o si rovinano ----------
let RES0 = null;
function resourcesMonth() {
  if (!RES0) RES0 = { fert: RES.fert.slice(), forest: RES.forest.slice() };
  for (const b of buildings.values()) {
    if (!b.spec || b.ruin || !b.occ) continue; const k = gIdx(b.x, b.z);
    if (b.spec === 'oil') RES.oil[k] = Math.max(0, RES.oil[k] - 0.004 * b.occ / 10 / geoMul());
    if (b.spec === 'ore') RES.ore[k] = Math.max(0, RES.ore[k] - 0.004 * b.occ / 10 / geoMul());
    b.depleted = (b.spec === 'oil' || b.spec === 'ore') && RES[b.spec][k] < 0.05;
  }
  const W = actWin();
  for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0; i <= W.i1; i++) {
    const k = j * G + i, pol = (GROUND[k] || 0) + (AIR[k] || 0) * 0.3;
    for (const key of ['fert', 'forest']) { const a = RES[key], a0 = RES0[key]; if (pol > 20) a[k] = Math.max(0, a[k] - 0.004 * pol / 20); else if (a[k] < a0[k]) a[k] = Math.min(a0[k], a[k] + 0.003); }
  }
}
const _updateBuilding6b = updateBuilding;
updateBuilding = function (b) { _updateBuilding6b(b); if (b.depleted && buildings.has(b.id) && !b.ruin) popFireOne(b); };
// ---------- ogni mese ----------
const _monthly6 = monthly;
monthly = function () { _monthly6(); computeChain(); resourcesMonth(); };
// ---------- bilancio: sussidio che cala, commercio di luce, importazioni dei beni ----------
const _budgetNow6 = budgetNow;
budgetNow = function () {
  const bg = _budgetNow6(), inc = bg.inc, exp = bg.exp;
  const lastNet = S.lastBudget ? S.lastBudget.net : 0;
  inc.subsidy = Math.round((1500 + S.ms * 1200) * clamp(1 - Math.max(0, lastNet) / 60000, 0.1, 1));
  const tp = NET.trade?.pow || 0; inc.trade = (inc.trade || 0) - (tp > 0 ? tp * 30 : 0) + (tp > 0 ? tp * 25 : 0); exp.import = (exp.import || 0) + (tp < 0 ? -tp * 5 : 0); // vendi a 2.500, compri a 5.000 per MW (scala del gioco)
  if (S.specGood) inc.goods = (inc.goods || 0) * specMul();
  const ch = stats.chain || {}; let imp = 0; for (const k in ch) imp += ch[k].imp || 0; exp.import += imp * 0.8;
  bg.ti = Object.keys(inc).reduce((a, k) => a + (typeof inc[k] === 'number' ? inc[k] : 0), 0);
  bg.te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + (exp[k] || 0), 0); bg.net = bg.ti - bg.te;
  return bg;
};
// ---------- aziende con nome e logo inventati ----------
const CO_A = ['Lince', 'Faro', 'Quercia', 'Cometa', 'Ancora', 'Delta', 'Vento', 'Brillo', 'Nido', 'Orbita', 'Fiocco', 'Zenit', 'Riva', 'Pigna', 'Lampo', 'Gelso'];
const CO_B = () => ({ C: [L('Market', 'Market'), L('Bottega', 'Store'), L('Bistrò', 'Bistro'), L('Moda', 'Fashion')], I: [L('Industrie', 'Industries'), L('Officine', 'Works'), L('Meccanica', 'Engineering'), L('Lavorazioni', 'Processing')], O: [L('Digitale', 'Digital'), L('Consulenze', 'Consulting'), L('Finanziaria', 'Finance'), L('Media', 'Media')] });
const CO_COL = ['#c0392b', '#2980b9', '#27ae60', '#d4a017', '#8e44ad', '#16a085', '#e67e22', '#34495e'];
function companyHTML(b) {
  const k = ZT[b.zone].k === 'M' ? 'C' : ZT[b.zone].k; const B = CO_B(); if (!B[k] || !b.jobs) return '';
  const r = mulberry32(b.id * 71 + 5), a = CO_A[Math.floor(r() * CO_A.length)], s = B[k][Math.floor(r() * 4)], col = CO_COL[Math.floor(r() * CO_COL.length)], shape = r() < 0.5 ? '50%' : '6px';
  const prod = k === 'I' ? chainName(CHAIN[Math.floor(r() * CHAIN.length)][0]) : k === 'O' ? chainName(OFFICE_P[Math.floor(r() * 4)][0]) : chainName(COM_P[Math.floor(r() * 4)][0]);
  return `<div class="row" style="align-items:center"><span style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:26px;height:26px;border-radius:${shape};background:${col};color:#fff;font-weight:800;align-items:center;justify-content:center">${a[0]}</span><b>${a} ${s}</b></span><span>${prod}</span></div>` + (b.depleted ? `<div style="color:var(--bad);font-size:12px">${L('Giacimento esaurito: la produzione si ferma', 'Deposit used up: production stops')}</div>` : '');
}
{ const _bx = bldExtraHTML; bldExtraHTML = function (o) { let h = companyHTML(o) + _bx(o); if (o.spec === 'oil' || o.spec === 'ore') h += `<div class="row"><span>${L('Giacimento rimasto', 'Deposit left')}</span><span>${Math.round((RES[o.spec][gIdx(o.x, o.z)] || 0) * 100)}%</span></div>`; if (o.spec === 'farm' || o.spec === 'forest') { const key = o.spec === 'farm' ? 'fert' : 'forest'; h += `<div class="row"><span>${o.spec === 'farm' ? L('Terra fertile', 'Fertile land') : L('Bosco', 'Forest')}</span><span>${Math.round((RES[key][gIdx(o.x, o.z)] || 0) * 100)}%</span></div><div style="font-size:12px;color:var(--mute)">${L('Si rovina con l\'inquinamento e poi si rigenera', 'Damaged by pollution, then it regrows')}</div>`; } return h; }; }
// ---------- pannello economia: catena, specializzazione, sussidio ----------
function econExtraHTML() {
  const ch = stats.chain || {}, lastNet = S.lastBudget ? S.lastBudget.net : 0;
  let h = `<div class="sec">🏛️ ${L('Sussidio statale', 'State subsidy')}</div><div style="font-size:12px;color:var(--mute)">${L('Cala man mano che la città guadagna', 'Shrinks as the city earns more')}: ${Math.round(clamp(1 - Math.max(0, lastNet) / 60000, 0.1, 1) * 100)}%</div>`;
  if (S.specGood) h += `<div class="row"><span>🏅 ${L('Città specializzata in', 'City specialised in')} ${chainName(S.specGood)}</span><span>+${Math.round((specMul() - 1) * 100)}%</span></div>`;
  const rows = Object.keys(ch).map(k => `<div class="row" style="font-size:12px"><span>${chainName(k)}</span><span>${fmtNum(ch[k].p)} / ${fmtNum(ch[k].n)}${ch[k].imp ? ' · <span style="color:var(--bad)">' + L('importa', 'import') + ' ' + fmtNum(ch[k].imp) + '</span>' : ''}</span></div>`).join('');
  h += `<details style="margin-top:6px"><summary style="cursor:pointer;color:var(--acc2)">🔗 ${L('Catena dei beni (prodotto / richiesto)', 'Goods chain (made / needed)')}</summary>${rows || `<div style="color:var(--mute)">${L('Si calcola alla fine del mese', 'Calculated at month end')}</div>`}<div style="font-size:12px;color:var(--mute);margin-top:4px">${L('Legno → legname → carta e mobili; minerale → metalli; carbone + metalli → acciaio; metalli + acciaio → macchinari; pietra → minerali e cemento; petrolio + grano → petrolchimici; petrolio + minerali → chimici; chimici + petrolchimici → plastica; chimici → farmaci; minerali + plastica → elettronica; metalli + plastica → veicoli; grano + verdura → bevande; grano + bestiame → cibo pronto; bestiame + verdura → cibo; cotone + bestiame + petrolchimici → tessuti', 'Wood → timber → paper and furniture; ore → metals; coal + metals → steel; metals + steel → machinery; stone → minerals and concrete; oil + grain → petrochemicals; oil + minerals → chemicals; chemicals + petrochemicals → plastics; chemicals → pharmaceuticals; minerals + plastics → electronics; metals + plastics → vehicles; grain + vegetables → beverages; grain + livestock → convenience food; livestock + vegetables → food; cotton + livestock + petrochemicals → textiles')}</div></details>`;
  h += `<div style="font-size:12px;color:var(--mute);margin-top:4px">⚡ ${L('Corrente: vendi a 2.500, compri a 5.000 per MW', 'Power: sell at 2,500, buy at 5,000 per MW')} · ${L('Tasse da -10% a +30%', 'Taxes from -10% to +30%')} · ${L('Prestiti dal 2,3% al 20% (municipio -1%, banca centrale -2%)', 'Loans 2.3% to 20% (city hall -1%, central bank -2%)')}</div>`;
  return h;
}
