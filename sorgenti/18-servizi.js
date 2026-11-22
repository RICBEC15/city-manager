// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 7: servizi
//  scuole, università, ricerca, sanità, posta, telecomunicazioni,
//  falde che si svuotano, pesca e petrolio in mare
// =====================================================================
// ---------- nuovi edifici ----------
Object.assign(SV, {
  school_s: { cat: 'edu', w: 24, d: 20, cost: 30000, upk: 1700, ms: 3, r: 800, cap: 1500, eff: 'edu1', h: 16, n: () => L('Scuola elementare di città', 'City elementary school'), d2: () => L('Piccola e alta: entra tra i palazzi del centro', 'Small and tall: fits between downtown blocks') },
  high_t: { cat: 'edu', w: 30, d: 28, cost: 95000, upk: 4600, ms: 5, r: 1500, cap: 5000, eff: 'edu2', h: 42, n: () => L('Liceo di città (a torre)', 'City high school (tower)'), d2: () => L('Liceo su tanti piani: poco spazio, tanti studenti', 'High school on many floors: little space, many students') },
  uni_tech: { cat: 'edu', w: 90, d: 70, cost: 380000, upk: 12000, ms: 7, r: 4500, cap: 12000, eff: 'edu3', h: 26, unique: true, n: () => L('Università tecnica', 'Technical university'), d2: () => L('Laureati tecnici: +8% di rendimento per industria e uffici', 'Technical graduates: +8% output for industry and offices') },
  uni_med: { cat: 'edu', w: 90, d: 70, cost: 380000, upk: 12000, ms: 7, r: 4500, cap: 12000, eff: 'edu3', h: 26, unique: true, n: () => L('Università di medicina', 'Medical university'), d2: () => L('Ospedali più efficienti e meno malati. Ampliamento: clinica di pratica.', 'More efficient hospitals and fewer sick people. Upgrade: teaching clinic.') },
  radiotel: { cat: 'edu', w: 70, d: 70, cost: 450000, upk: 9000, ms: 8, unique: true, free: true, h: 40, n: () => L('Radiotelescopio', 'Radio telescope'), d2: () => L('Ricerca: chi va all\'università si laurea più in fretta', 'Research: university students graduate faster') },
  geocenter: { cat: 'edu', w: 50, d: 40, cost: 420000, upk: 8000, ms: 8, unique: true, h: 18, n: () => L('Centro di ricerca geologica', 'Geological research centre'), d2: () => L('Ricerca: i giacimenti di petrolio e minerali durano 3 volte di più', 'Research: oil and ore deposits last 3 times longer') },
  accel: { cat: 'edu', w: 140, d: 140, cost: 900000, upk: 16000, ms: 9, unique: true, h: 12, n: () => L('Acceleratore di particelle', 'Particle accelerator'), d2: () => L('Ricerca: più domanda di uffici e industria, +25% software ed elettronica', 'Research: more office and industry demand, +25% software and electronics') },
  kidclinic: { cat: 'health', w: 30, d: 26, cost: 40000, upk: 1800, ms: 3, r: 1100, cap: 2500, eff: 'health', veh: 'ambulance', n: () => L('Clinica dei bambini', 'Children\'s clinic'), d2: () => L('Cura i più piccoli: le famiglie vicine sono più contente', 'Treats children: nearby families are happier') },
  medheli: { cat: 'health', w: 40, d: 40, cost: 160000, upk: 5200, ms: 5, r: 7000, cap: 6000, eff: 'health', n: () => L('Base elicotteri ambulanza', 'Ambulance helicopter depot'), d2: () => L('Arriva lontano e senza traffico: copre 7 km', 'Reaches far with no traffic: covers 7 km') },
  disease: { cat: 'health', w: 50, d: 40, cost: 220000, upk: 6000, ms: 6, unique: true, h: 16, n: () => L('Centro controllo malattie', 'Disease control centre'), d2: () => L('In tutta la città la gente si ammala di meno e guarisce prima', 'Citywide, people get sick less and recover sooner') },
  post_s: { cat: 'misc', w: 16, d: 14, cost: 12000, upk: 500, ms: 1, r: 900, eff: 'mail', veh: 'van', n: () => L('Ufficio postale piccolo', 'Small post office'), d2: () => L('Per il quartiere: pochi furgoni', 'For the neighbourhood: a few vans') },
  radiomast: { cat: 'misc', w: 8, d: 8, cost: 18000, upk: 400, ms: 3, free: true, dis: true, h: 40, n: () => L('Antenna radio', 'Radio mast'), d2: () => L('Manda gli allarmi dei disastri nel raggio di 1,5 km', 'Sends disaster alerts within 1.5 km') },
  server: { cat: 'misc', w: 50, d: 40, cost: 260000, upk: 7000, ms: 6, r: 6000, h: 14, n: () => L('Server farm', 'Server farm'), d2: () => L('Internet via cavo per 6 km: passa anche le colline', 'Cabled internet for 6 km: gets past hills too') },
  uplink: { cat: 'misc', w: 40, d: 40, cost: 300000, upk: 6000, ms: 7, unique: true, r: 9000, park: 1, attr: 6, h: 10, n: () => L('Uplink satellitare', 'Satellite uplink'), d2: () => L('TV e intrattenimento per tutti: +attrattività', 'TV and entertainment for all: +attractiveness') },
  fisharea: { cat: 'spec', w: 200, d: 200, cost: 30000, upk: 900, ms: 3, sea: true, fish: 120, jobs: 20, n: () => L('Area di pesca', 'Fishing area'), d2: () => L('In mare: pesce per l\'industria del cibo. L\'acqua sporca dà meno pesce.', 'At sea: fish for the food industry. Dirty water gives less fish.') },
  fishsea: { cat: 'spec', w: 60, d: 40, cost: 45000, upk: 1200, ms: 4, sea: true, fish: 90, jobs: 25, n: () => L('Allevamento di pesce in mare', 'Sea fish farm'), d2: () => L('Gabbie in mare: pesce sicuro tutto l\'anno', 'Sea pens: steady fish all year') },
  fishland: { cat: 'spec', w: 50, d: 40, cost: 50000, upk: 1500, ms: 4, gwNeed: true, fish: 70, jobs: 25, n: () => L('Allevamento di pesce a terra', 'Land fish farm'), d2: () => L('Vasche a terra: usa l\'acqua della falda (vista Falde)', 'Land tanks: uses groundwater (Groundwater view)') },
  coldstore: { cat: 'spec', w: 40, d: 30, cost: 40000, upk: 1100, ms: 4, jobs: 15, n: () => L('Celle frigorifere', 'Cold storage'), d2: () => L('Il pesce non si rovina: +25% di pesce venduto', 'Fish doesn\'t spoil: +25% fish sold') },
  oilrig: { cat: 'spec', w: 50, d: 50, cost: 400000, upk: 9000, ms: 7, sea: true, oil: 220, jobs: 60, air: 6, n: () => L('Piattaforma petrolifera in mare', 'Offshore oil platform'), d2: () => L('Petrolio dal fondo del mare, portato via dalle petroliere', 'Oil from the seabed, carried away by tankers') },
});
// ampliamenti
EXT_SCHOOL.push(
  { k: 'gym', cost: 15000, upk: 400, n: () => L('Palestra (+benessere vicino)', 'Gym (+wellbeing nearby)') },
  { k: 'field', cost: 12000, upk: 300, n: () => L('Campo sportivo', 'Sports field') },
  { k: 'book', cost: 18000, upk: 450, n: () => L('Biblioteca (più diplomati)', 'Library (more graduates)') },
  { k: 'play', cost: 8000, upk: 200, n: () => L('Parco giochi', 'Playground') },
);
Object.assign(EXT, {
  school_s: EXT_SCHOOL, high_t: EXT_SCHOOL,
  uni_tech: [{ k: 'dorm', cost: 80000, upk: 1500, capM: 1.5, n: () => L('Studentato', 'Dormitory') }],
  uni_med: [{ k: 'pclinic', cost: 60000, upk: 2000, n: () => L('Clinica di pratica (cura il quartiere)', 'Teaching clinic (treats the area)') }, { k: 'dorm', cost: 80000, upk: 1500, capM: 1.5, n: () => L('Studentato', 'Dormitory') }],
  medheli: [{ k: 'pad', cost: 40000, upk: 1500, capM: 1.5, n: () => L('Elicottero in più', 'Extra helicopter') }],
  post_s: [{ k: 'van', cost: 6000, upk: 200, capM: 1.5, rM: 1.2, n: () => L('Garage furgoni', 'Van garage') }],
  postsort: [{ k: 'auto', cost: 70000, upk: 1800, rM: 1.25, n: () => L('Smistamento automatico', 'Automatic sorting') }, { k: 'ramp', cost: 30000, upk: 800, rM: 1.15, n: () => L('Rampe di carico in più', 'Extra loading ramps') }],
  oilrig: [{ k: 'tank', cost: 120000, upk: 2500, n: () => L('Seconda petroliera (+40% petrolio)', 'Second tanker (+40% oil)') }],
});
EXT.post.push({ k: 'garage', cost: 15000, upk: 500, capM: 1.3, n: () => L('Garage furgoni', 'Van garage') }, { k: 'wh', cost: 25000, upk: 700, rM: 1.2, n: () => L('Magazzino pacchi', 'Parcel warehouse') });
TREE.push(
  { id: 't_cityedu', cat: 'edu', cost: 2, items: ['school_s', 'high_t'], n: () => L('Scuole di città', 'City schools') },
  { id: 't_uni2', cat: 'edu', cost: 4, req: 't_uni', items: ['uni_tech', 'uni_med'], n: () => L('Università specializzate', 'Specialised universities') },
  { id: 't_research', cat: 'edu', cost: 6, req: 't_uni2', items: ['radiotel', 'geocenter', 'accel'], n: () => L('Centri di ricerca', 'Research centres') },
  { id: 't_medheli', cat: 'health', cost: 3, req: 't_hosp', items: ['medheli', 'kidclinic'], n: () => L('Elisoccorso e clinica dei bambini', 'Air ambulance and children\'s clinic') },
  { id: 't_disease', cat: 'health', cost: 4, req: 't_medheli', items: ['disease'], n: () => L('Controllo malattie', 'Disease control') },
  { id: 't_server', cat: 'misc', cost: 3, req: 't_telecom', items: ['server', 'uplink'], n: () => L('Server farm e satellite', 'Server farm and satellite') },
  { id: 't_fish', cat: 'spec', cost: 2, items: ['fisharea', 'fishsea', 'fishland', 'coldstore'], n: () => L('Pesca e allevamenti di pesce', 'Fishing and fish farms') },
  { id: 't_oilrig', cat: 'spec', cost: 5, req: 't_fish', items: ['oilrig'], n: () => L('Petrolio in mare', 'Offshore oil') },
);
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;

// ---------- piazzare in mare / sopra la falda ----------
const _svcPlacement7 = svcPlacement;
svcPlacement = function (type, x, z, rot) {
  const d = SV[type];
  if (!d.sea) {
    const o = _svcPlacement7(type, x, z, rot);
    if (o.ok && d.gwNeed && gSample(RES.gw, o.x, o.z) < 0.2) { o.ok = false; o.why = L('Qui non c\'è acqua sotto terra: guarda la vista Falde', 'No groundwater here: check the Groundwater view'); }
    return o;
  }
  const o = { type, x, z, ang: rot, w: d.w, d: d.d, ok: true, why: '', y: WATER + 0.5 };
  for (const [cx, cz] of obbCorners(o).concat([[x, z]])) {
    if (!isOwned(cx, cz)) { o.ok = false; o.why = L('Fuori dal tuo territorio: compra la casella', 'Outside your land: buy the tile'); break; }
    if (!isWater(cx, cz) || getH(cx, cz) > WATER - 2) { o.ok = false; o.why = L('Va messa in mare aperto, lontano dalla riva', 'Must be placed in open water, away from the shore'); break; }
  }
  if (o.ok) for (const sv of svcs.values()) if (Math.hypot(sv.x - o.x, sv.z - o.z) < (Math.hypot(sv.w, sv.d) + Math.hypot(o.w, o.d)) / 2 && obbOverlap(sv, o)) { o.ok = false; o.why = L('Si sovrappone a un altro edificio', 'Overlaps another building'); break; }
  if (o.ok && d.unique && [...svcs.values()].some(s => s.type === type)) { o.ok = false; o.why = L('Ne puoi costruire solo uno', 'You can build only one'); }
  return o;
};
const _placeSvc7 = placeSvc;
placeSvc = function (o, data) { const sv = _placeSvc7(o, data); if (sv && sv.type === 'oilrig' && !sv.dock) { const p = waterRoute(sv.x, sv.z); if (p) sv.dock = p; } return sv; };

// ---------- falde: si svuotano e si sporcano ----------
const GWS = new WeakSet(); let GW0 = null;
function gwSync() { if (typeof S === 'undefined' || !S || GWS.has(S)) return; GWS.add(S); GW0 = RES.gw.slice(); S.gwMod = S.gwMod || {}; S.gwp = S.gwp || {}; for (const k in S.gwMod) RES.gw[k] = S.gwMod[k] / 1000; }
function gwPolAt(sv) { return S.gwp?.[sv.id] || 0; }
function gwMonth() {
  gwSync();
  const use = NET.cityWat.prod > 0 ? clamp(NET.cityWat.use / NET.cityWat.prod, 0.2, 1) : 0.5;
  const touched = new Set(Object.keys(S.gwMod).map(Number));
  for (const sv of svcs.values()) {
    const d = SV[sv.type]; if (!sv.on || !(d.gw || d.gwNeed)) continue;
    const ci = Math.floor((sv.x + HALF) / GC), cj = Math.floor((sv.z + HALF) / GC), pull = (d.wat ? d.wat / 600 : 0.6) * use * 0.014;
    for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) { const i = ci + a, j = cj + b; if (i < 0 || j < 0 || i >= G || j >= G) continue; const k = j * G + i, f = 1 - Math.hypot(a, b) / 4.5; if (f <= 0) continue; RES.gw[k] = Math.max(0, RES.gw[k] - pull * f); touched.add(k); }
    // il suolo inquinato sporca la falda piano piano; senza inquinamento si pulisce
    const g = gSample(GROUND, sv.x, sv.z), p = S.gwp[sv.id] || 0;
    S.gwp[sv.id] = Math.round((g > p ? p + (g - p) * 0.12 : p * 0.95) * 10) / 10;
    sv.gwLvl = gSample(RES.gw, sv.x, sv.z); sv.gw0 = GW0 ? GW0[gIdx(sv.x, sv.z)] : sv.gwLvl;
  }
  for (const id in S.gwp) if (!svcs.has(+id)) delete S.gwp[id];
  const mod = {};
  for (const k of touched) { if (!GW0) break; RES.gw[k] = Math.min(GW0[k], RES.gw[k] + 0.006); if (GW0[k] - RES.gw[k] > 0.002) mod[k] = Math.round(RES.gw[k] * 1000); }
  S.gwMod = mod; netDirty = true;
}
const _computeNetworks7 = computeNetworks;
computeNetworks = function () { gwSync(); _computeNetworks7(); };

// ---------- giacimenti che durano di più ----------
function geoMul() { return hasSvc('geocenter') ? 3 : 1; }

// ---------- copertura: scuole, sanità, posta, internet ----------
const _computeCoverage7 = computeCoverage;
computeCoverage = function () {
  _computeCoverage7();
  const bud = c => clamp(S.budget[c] / 100, 0.3, 1.5);
  const med = hasSvc('uni_med');
  for (const b of buildings.values()) { b.libB = 0; b.kidB = 0; }
  let hasSort = false, dish = [];
  for (const sv of svcs.values()) {
    if (!sv.on) continue; const T = sv.type;
    if (T === 'postsort') hasSort = true;
    if (T === 'antenna' || T === 'telecom') dish.push(sv);
    if (EXT[T] === EXT_SCHOOL) {
      const pk = (sv.ext.includes('gym') ? 1 : 0) + (sv.ext.includes('field') ? 1.5 : 0) + (sv.ext.includes('play') ? 1 : 0);
      if (pk) bldNear(sv.x, sv.z, 600, b => { b.cov.park = Math.min(15, b.cov.park + pk * (1 - Math.hypot(b.x - sv.x, b.z - sv.z) / 600)); });
      if (sv.ext.includes('book')) bldNear(sv.x, sv.z, SV[T].r, b => { b.libB = 1; });
    }
    if (T === 'kidclinic') bldNear(sv.x, sv.z, SV.kidclinic.r, b => { if (b.hh) b.kidB = 1; });
    if (T === 'uni_med' && sv.ext.includes('pclinic')) bldNear(sv.x, sv.z, 1200, b => { b.cov.health = Math.max(b.cov.health, (1 - smooth(700, 1200, Math.hypot(b.x - sv.x, b.z - sv.z))) * bud('health')); });
  }
  // internet: le colline bloccano le antenne, la server farm passa col cavo
  for (const sv of dish) { const r = SV[sv.type].r * 1.05; bldNear(sv.x, sv.z, r, b => { if (getH(b.x, b.z) - sv.y > 60) b._hill = 1; }); }
  for (const b of buildings.values()) { if (b._hill) { b.cov.net *= 0.5; b._hill = 0; } }
  for (const sv of svcs.values()) if (sv.on && sv.type === 'server') { const r = SV.server.r; bldNear(sv.x, sv.z, r, b => { b.cov.net = Math.max(b.cov.net, (1 - smooth(r * 0.6, r, Math.hypot(b.x - sv.x, b.z - sv.z))) * bud('misc')); }); }
  for (const b of buildings.values()) {
    if (med && b.cov.health) b.cov.health = Math.min(1, b.cov.health * 1.15);
    if (!hasSort && stats.pop > 2000 && b.cov.mail) b.cov.mail *= 0.75; // la posta va smistata fuori città: arriva più tardi
  }
  stats.mailOut = !hasSort && stats.pop > 2000;
};

// ---------- ogni edificio ----------
const _updateBuilding7 = updateBuilding;
updateBuilding = function (b) {
  _updateBuilding7(b);
  if (b.ruin || !buildings.has(b.id)) return; const c = b.cov || {};
  if (b.hh) {
    if (b.libB) b.edu = Math.min(1, (b.edu || 0) + 0.0012 * (c.edu1 || 0) + 0.0012 * (c.edu2 || 0));
    if (RESEARCH.tel && (c.edu3 || 0) > 0.1) b.edu = Math.min(1, (b.edu || 0) + 0.0008);
    if (b.kidB) b.happy = Math.min(100, b.happy + 0.15);
  }
  if (b.sick > 0 && ((RESEARCH.dis && rand() < 0.18) || (RESEARCH.med && rand() < 0.08))) b.sick--;
};
const RESEARCH = { tel: false, dis: false, med: false, acc: false, tech: false };

// ---------- produzione: pesce, petrolio, prigione, riciclo ----------
const _computeStats7 = computeStats;
computeStats = function () {
  _computeStats7();
  RESEARCH.tel = hasSvc('radiotel'); RESEARCH.dis = hasSvc('disease'); RESEARCH.med = hasSvc('uni_med'); RESEARCH.acc = hasSvc('accel'); RESEARCH.tech = hasSvc('uni_tech');
  const R = stats.raw; if (!R) return;
  const cold = hasSvc('coldstore'), sb = clamp(S.budget.spec / 100, 0.5, 1.5);
  let fish = 0, oil = 0, jobs = 0;
  for (const sv of svcs.values()) {
    const d = SV[sv.type]; if (!sv.on) continue;
    if (d.fish) { let f = d.fish * sb; if (d.sea && typeof WPOL !== 'undefined') f *= clamp(1 - waterPollAt(sv.x, sv.z) / 40, 0.2, 1); if (d.gwNeed) f *= clamp(gSample(RES.gw, sv.x, sv.z) * 2, 0.2, 1); sv.prod = Math.round(f * (cold ? 1.25 : 1)); fish += sv.prod; }
    if (d.oil) { sv.prod = Math.round(d.oil * sb * (sv.ext.includes('tank') ? 1.4 : 1)); oil += sv.prod; }
    if (sv.type === 'recycle') { sv.prodM = Math.round(SV.recycle.gcap * 0.08 * clamp(S.budget.garbage / 100, 0.3, 1.5)); R.ore.p += Math.round(sv.prodM * 0.6); R.oil.p += Math.round(sv.prodM * 0.4); }
    if (d.jobs && !d.spec) jobs += d.jobs;
  }
  R.food.p += fish; R.oil.p += oil; stats.fish = fish; stats.oilSea = oil;
  const pr = S.prisoners || 0; stats.prisonProd = hasSvc('prison') ? Math.round(pr * 0.04) : 0; R.wood.p += Math.round(stats.prisonProd * 0.5); R.stone.p += Math.round(stats.prisonProd * 0.5);
  stats.jobs += jobs; stats.jobsI += jobs;
  // internet nei negozi e nelle fabbriche
  let nc = 0, cc = 0, ni = 0, ci = 0; for (const b of buildings.values()) { if (b.ruin) continue; const k = ZT[b.zone].k; if (k === 'C' || k === 'M') { cc++; nc += Math.min(1, b.cov?.net || 0); } else if (k === 'I') { ci++; ni += Math.min(1, b.cov?.net || 0); } }
  stats.netC = cc ? nc / cc : 0; stats.netI = ci ? ni / ci : 0;
};
const _computeChain7 = computeChain;
computeChain = function () { _computeChain7(); const ch = stats.chain; if (!ch || !RESEARCH.acc) return; for (const k of ['electronics', 'software']) if (ch[k]) { ch[k].p = Math.round(ch[k].p * 1.25); if (ch[k].imp) ch[k].imp = Math.max(0, ch[k].n - ch[k].p); } };
const _computeDemand7 = computeDemand;
computeDemand = function () {
  _computeDemand7(); const d = stats.demand, W = d.why || {};
  if (RESEARCH.acc && buildings.size) { d.O = clamp(d.O + 8, 0, 100); d.I = clamp(d.I + 5, 0, 100); W.O?.push([L('Acceleratore di particelle: serve software', 'Particle accelerator: software wanted'), 8]); W.I?.push([L('Acceleratore di particelle: serve elettronica', 'Particle accelerator: electronics wanted'), 5]); }
  if (RESEARCH.tel && buildings.size) { d.O = clamp(d.O + 4, 0, 100); W.O?.push([L('Radiotelescopio: più ricercatori', 'Radio telescope: more researchers'), 4]); }
};
const _budgetNow7 = budgetNow;
budgetNow = function () {
  const bg = _budgetNow7(), inc = bg.inc, exp = bg.exp;
  if (RESEARCH.tech) { inc.ind = (inc.ind || 0) * 1.08; inc.off = (inc.off || 0) * 1.08; }
  inc.com = (inc.com || 0) * (1 + 0.1 * (stats.netC || 0)); // vendite online
  exp.import = (exp.import || 0) * (1 - 0.08 * (stats.netI || 0)); // materiali comprati online costano meno
  if (stats.mailOut) exp.import += Math.round(stats.pop * 0.01); // posta smistata fuori città
  bg.ti = Object.keys(inc).reduce((a, k) => a + (typeof inc[k] === 'number' ? inc[k] : 0), 0);
  bg.te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + (exp[k] || 0), 0); bg.net = bg.ti - bg.te;
  return bg;
};

// ---------- ogni mese: falde, fanghi del depuratore ----------
const _monthly7 = monthly;
monthly = function () {
  _monthly7(); gwMonth();
  const fills = [...svcs.values()].filter(s => s.on && s.type === 'landfill');
  for (const sv of svcs.values()) {
    if (!sv.on || sv.type !== 'treat') continue;
    const sl = Math.round(250 * clamp(NET.citySew.use / Math.max(1, NET.citySew.prod), 0.2, 1));
    let best = null, bd = 1e9; for (const f of fills) { const dd = Math.hypot(f.x - sv.x, f.z - sv.z); if (dd < bd && f.fill < svStore(f)) { bd = dd; best = f; } }
    if (best) { best.fill = Math.min(svStore(best), best.fill + sl); sv.sludge = best.id; }
    else { sv.sludge = 0; const k = gIdx(sv.x, sv.z); GROUND[k] = Math.min(100, GROUND[k] + 2); }
  }
};
// petroliere: una nave fa avanti e indietro dalla piattaforma
const _hourly7 = hourly;
hourly = function () {
  _hourly7();
  for (const sv of svcs.values()) if (sv.on && sv.type === 'oilrig' && sv.dock && ships.filter(s => s.sv === sv.id).length < (sv.ext.includes('tank') ? 2 : 1) && rand() < 0.08) spawnShip(sv, true, false);
};

// ---------- scheda dell'edificio ----------
const _svcExtraHTML7 = svcExtraHTML;
svcExtraHTML = function (o) {
  let h = _svcExtraHTML7(o); const d = SV[o.type], r = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
  if (d.fish || d.oil) h += r(d.oil ? '🛢️ ' + L('Petrolio', 'Oil') : '🐟 ' + L('Pesce', 'Fish'), fmtNum(o.prod || 0) + ' t/' + L('mese', 'mo'));
  if (d.fish && d.sea && typeof WPOL !== 'undefined' && waterPollAt(o.x, o.z) > 8) h += `<div style="font-size:12px;color:var(--bad)">${L('Acqua inquinata: meno pesce', 'Polluted water: less fish')}</div>`;
  if (d.gw || d.gwNeed) {
    const lv = gSample(RES.gw, o.x, o.z), l0 = o.gw0 || lv;
    h += r('💧 ' + L('Falda qui sotto', 'Groundwater below'), Math.round(lv * 100) + '%' + (l0 - lv > 0.03 ? ' (' + L('si sta svuotando', 'running low') + ')' : ''));
    const p = gwPolAt(o); if (p > 2) h += r('☣️ ' + L('Falda inquinata', 'Groundwater polluted'), Math.round(p) + '%');
  }
  if (o.type === 'treat') { const f = o.sludge ? svcs.get(o.sludge) : null; h += r('🟫 ' + L('Fanghi', 'Sludge'), f ? L('vanno in discarica', 'go to the landfill') : L('nessuna discarica: inquinano il suolo!', 'no landfill: they pollute the ground!')); }
  if (o.type === 'recycle') h += r('♻️ ' + L('Materie per l\'industria', 'Materials for industry'), fmtNum(o.prodM || 0) + ' t/' + L('mese', 'mo'));
  if (o.type === 'prison') h += r('🪚 ' + L('Laboratori dei detenuti', 'Inmate workshops'), fmtNum(stats.prisonProd || 0) + ' t/' + L('mese', 'mo'));
  if (o.type === 'post' || o.type === 'post_s' || o.type === 'mailbox') if (stats.mailOut) h += `<div style="font-size:12px;color:var(--bad)">${L('Senza centro di smistamento la posta va smistata fuori città: arriva tardi e costa', 'Without a sorting facility mail is sorted outside the city: slow and costly')}</div>`;
  if (o.type === 'oilrig') h += r('🚢 ' + L('Petroliere', 'Tankers'), ships.filter(s => s.sv === o.id).length);
  return h;
};

// ---------- disegno ----------
const _drawSvc7 = drawSvc;
drawSvc = function (sv) {
  const T = sv.type;
  if (!['radiotel', 'accel', 'uplink', 'medheli', 'fisharea', 'fishsea', 'oilrig', 'radiomast', 'server', 'high_t'].includes(T)) return _drawSvc7(sv);
  removeParts(sv.parts); curRef = sv;
  const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
  const cyl = (a, b, r, h, c, y0 = 0) => { const [x, z] = at(a, b); return addPart(P, 'cyl', x, y + y0, z, 0, r, h, r, c); };
  switch (T) {
    case 'radiotel': slab(0x9aa08e); cyl(0, 0, 3, 22, 0xd8d8d8); box(0, 0, 34, 3, 34, 0xf0f0f0, 'body', 22); cyl(0, 0, 1, 14, 0xb0b0b0, 25); box(W / 3, D / 3, 8, 5, 8, 0xc8c2b4); break;
    case 'accel': for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; box(Math.cos(t) * W * 0.42, Math.sin(t) * D * 0.42, 14, 3, 6, 0xb8b8b0); } box(0, 0, 30, 12, 24, 0xd8d4c8); box(0, 0, 18, 4, 18, 0x4a7ab0, 'body', 12); break;
    case 'uplink': slab(0x8a8a82); for (const [a, b] of [[-10, -10], [10, -10], [0, 10]]) { cyl(a, b, 1, 4, 0xc0c0c0); box(a, b, 12, 1, 12, 0xf4f4f4, 'body', 5); } box(W / 3, -D / 3, 8, 4, 6, 0xd0ccc0); break;
    case 'medheli': slab(0x8a8a86); box(0, 0, 22, 0.5, 22, 0xe0e0e0, 'plain', 0.3); box(0, 0, 3, 0.6, 14, 0xc8302a, 'plain', 0.5); box(0, 0, 14, 0.6, 3, 0xc8302a, 'plain', 0.5); box(-W / 3, D / 3, 10, 7, 9, 0xe8e4dc); break;
    case 'fisharea': for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2; cyl(Math.cos(t) * W * 0.45, Math.sin(t) * D * 0.45, 1, 2, 0xe86a1a, -0.8); } box(0, 0, 4, 2, 10, 0x2a4a7a, 'body', -0.5); break;
    case 'fishsea': for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b += 2) cyl(a * 18, b * 9, 7, 1, 0x6a6e70, -0.6); box(0, 0, W, 0.6, 2, 0x8a7a5a, 'plain', 0); break;
    case 'oilrig': for (const [a, b] of [[-15, -15], [15, -15], [15, 15], [-15, 15]]) cyl(a, b, 2, 18, 0x6a6a6a, -6); box(0, 0, 42, 4, 42, 0x8a8a8a, 'body', 12); box(-8, -8, 12, 8, 12, 0xd8c040, 'body', 16); box(10, 8, 4, 30, 4, 0xc8c8c8, 'body', 16); box(14, -14, 10, 0.5, 10, 0xe0e0e0, 'plain', 16.3); break;
    case 'radiomast': cyl(0, 0, 0.8, 40, 0xd04030); box(0, 0, W, 2, D, 0x9a9a92); break;
    case 'server': slab(0x8a8a86); for (let i = -1; i <= 1; i++) box(i * W / 3, 0, W / 3.4, 9, D * 0.7, 0x3a4250); box(0, D * 0.42, W * 0.8, 3, 3, 0x6ab0e0); break;
    case 'high_t': slab(0x8a8a86); box(0, -D / 6, W * 0.8, 42, D * 0.55, 0xd8c8a8); box(0, D / 3, W * 0.9, 1, D * 0.3, 0xb06030, 'plain', 0.3); break;
  }
};
