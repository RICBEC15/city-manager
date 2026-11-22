// =====================================================================
//  Novità dal wiki - Blocco 3: trasporti pubblici e merci
// =====================================================================
// ---------- traghetti ----------
LK.ferry = { n: () => L('Traghetto', 'Ferry'), depot: 'ferrydepot', cap: 100, upk: 1200, price: 3, wait: 10, catch: 550, col: 0x1a9ab0, ms: 5, st: 'ferry', spd: 9 };
LMOD.ferry = [{ n: () => L('Traghetto piccolo (100)', 'Small ferry (100)'), cap: 1, upk: 1 }, { n: () => L('Traghetto grande (200)', 'Large ferry (200)'), cap: 2, upk: 1.7 }];
Object.assign(SV, {
  ferrydepot: { cat: 'transport', w: 50, d: 40, cost: 90000, upk: 2400, ms: 5, depot: 'ferry', shore: true, n: () => L('Deposito traghetti', 'Ferry depot'), d2: () => L('Sulla riva: serve per le linee dei traghetti', 'On the shore: needed for ferry lines') },
  ferrystop: { cat: 'transport', w: 16, d: 14, cost: 12000, upk: 300, ms: 5, station: 'ferry', shore: true, n: () => L('Fermata del traghetto', 'Ferry stop'), d2: () => L('Un pontile sulla riva per salire sul traghetto', 'A pier on the shore to board the ferry') },
  ferryterm: { cat: 'transport', w: 60, d: 40, cost: 70000, upk: 1800, ms: 6, station: 'ferry', shore: true, attr: 2, n: () => L('Terminal dei traghetti', 'Ferry terminal'), d2: () => L('Grande stazione dei traghetti con sala d\'attesa', 'Big ferry station with a waiting hall') },
  // taxi
  taxistand: { cat: 'transport', w: 12, d: 5, cost: 2500, upk: 60, ms: 2, n: () => L('Posteggio taxi', 'Taxi stand'), d2: () => L('I taxi aspettano qui i clienti. Senza centrale prendono clienti solo ai posteggi.', 'Taxis wait here. Without a dispatch centre they only pick up at stands.') },
  taxidisp: { cat: 'transport', w: 20, d: 16, cost: 30000, upk: 900, ms: 4, n: () => L('Centrale dei taxi', 'Taxi dispatch centre'), d2: () => L('I clienti chiamano e il taxi arriva ovunque', 'Customers call and taxis go anywhere') },
  taxi2: { cat: 'transport', w: 70, d: 50, cost: 60000, upk: 2600, ms: 5, veh: 'taxi', fleet: 25, n: () => L('Deposito taxi grande', 'Large taxi depot'), d2: () => L('25 taxi', '25 taxis') },
  // bus intercity
  icbus: { cat: 'transport', w: 70, d: 44, cost: 80000, upk: 2200, ms: 5, n: () => L('Terminal bus intercity', 'Intercity bus terminal'), d2: () => L('Bus da fuori città, collegati alle strade esterne: portano turisti', 'Buses from outside, linked to the outside roads: they bring tourists') },
  // stazioni e merci
  train2: { cat: 'transport', w: 140, d: 50, cost: 320000, upk: 9000, ms: 7, station: 'train', rail: true, plat: 8, attr: 3, h: 24, n: () => L('Stazione centrale', 'Central station'), d2: () => L('8 binari, negozi e sala d\'attesa: più treni insieme e passeggeri più contenti', '8 platforms, shops and a waiting hall: more trains at once, happier passengers') },
  transship: { cat: 'transport', w: 140, d: 70, cost: 280000, upk: 6500, ms: 7, rail: true, noise: 5, n: () => L('Stazione di trasbordo merci', 'Cargo transfer station'), d2: () => L('Le merci passano dal treno ai camion: meno camion che arrivano da fuori, più guadagno dal commercio', 'Goods move from train to trucks: fewer trucks from outside, more trade income') },
  dryport: { cat: 'transport', w: 120, d: 80, cost: 160000, upk: 4000, ms: 6, noise: 5, n: () => L('Porto secco (piazzale merci)', 'Dry port (cargo yard)'), d2: () => L('Piazzale container su strada: le fabbriche spediscono qui invece che fuori città', 'Road container yard: factories ship here instead of outside') },
  cargoport2: { cat: 'transport', w: 220, d: 120, cost: 600000, upk: 14000, ms: 8, cargo: 'ship', shore: true, noise: 8, port: 3, n: () => L('Porto merci medio', 'Medium cargo port'), d2: () => L('3 navi insieme, ampliamenti: dogana, gru, container, serbatoi, terminal col treno, passeggeri, sicurezza', '3 ships at once; extensions: customs, cranes, containers, tanks, rail terminal, passengers, security') },
  cargoport3: { cat: 'transport', w: 340, d: 160, cost: 1400000, upk: 30000, ms: 10, cargo: 'ship', shore: true, noise: 10, port: 4, n: () => L('Porto merci grande', 'Large cargo port'), d2: () => L('4 navi insieme: il porto più grande', '4 ships at once: the biggest port') },
});
SV.taxi.fleet = 8; SV.taxi.d2 = () => L('8 taxi (deposito piccolo)', '8 taxis (small depot)');
SV.train.plat = 3;
const EXT_PORT = [
  { k: 'wh', cost: 60000, upk: 1500, n: () => L('Magazzini: una nave in più', 'Warehouses: one more ship') },
  { k: 'crane', cost: 90000, upk: 2500, n: () => L('Gru per container: una nave in più', 'Container cranes: one more ship') },
  { k: 'yard', cost: 70000, upk: 1800, n: () => L('Piazzale container (+commercio)', 'Container yard (+trade)') },
  { k: 'tanks', cost: 80000, upk: 2000, n: () => L('Serbatoi per petrolio e carburante (+commercio)', 'Oil and fuel tanks (+trade)') },
  { k: 'customs', cost: 120000, upk: 3500, n: () => L('Dogana (+guadagno dal commercio)', 'Customs (+trade income)') },
  { k: 'inter', cost: 150000, upk: 4000, n: () => L('Terminal intermodale col treno', 'Intermodal rail terminal') },
  { k: 'pax', cost: 110000, upk: 3000, n: () => L('Terminal passeggeri (navi da crociera)', 'Passenger terminal (cruise ships)') },
  { k: 'sec', cost: 50000, upk: 1500, n: () => L('Sicurezza del porto (meno criminalità vicino)', 'Port security (less crime nearby)') },
];
Object.assign(EXT, {
  cargoport: EXT_PORT, cargoport2: EXT_PORT, cargoport3: EXT_PORT,
  busdepot: (EXT.busdepot || []).concat([{ k: 'ev', cost: 40000, upk: 600, n: () => L('Ricarica per bus elettrici (niente smog)', 'Electric bus charging (no smog)') }]),
  busstation: (EXT.busstation || []).concat([{ k: 'ev', cost: 40000, upk: 600, n: () => L('Ricarica per bus elettrici (niente smog)', 'Electric bus charging (no smog)') }]),
  taxi: [{ k: 'ev', cost: 20000, upk: 300, n: () => L('Taxi elettrici (niente smog)', 'Electric taxis (no smog)') }],
  taxi2: [{ k: 'ev', cost: 45000, upk: 700, n: () => L('Taxi elettrici (niente smog)', 'Electric taxis (no smog)') }],
  train: (EXT.train || []).concat([{ k: 'plat', cost: 60000, upk: 1500, n: () => L('Due binari in più', 'Two more platforms') }, { k: 'shop', cost: 30000, upk: 600, n: () => L('Negozi e sala d\'attesa (più comodità)', 'Shops and waiting hall (more comfort)') }]),
  ferryterm: [{ k: 'shop', cost: 25000, upk: 500, n: () => L('Bar e sala d\'attesa (più comodità)', 'Café and waiting hall (more comfort)') }],
});
POLICIES.push({ id: 'taxifare', n: () => L('Tariffa minima dei taxi', 'Taxi minimum fare'), d: () => L('Ogni corsa paga almeno 6 €: più incassi, un po\' meno clienti', 'Each ride pays at least €6: more income, slightly fewer customers'), cost: 0 });
TREE.push(
  { id: 't_ferry', cat: 'transport', cost: 3, items: ['ferrydepot', 'ferrystop', 'ferryterm'], n: () => L('Traghetti', 'Ferries') },
  { id: 't_taxi2', cat: 'transport', cost: 2, req: 't_taxi', items: ['taxi2', 'taxidisp'], n: () => L('Taxi: deposito grande e centrale', 'Taxi: large depot and dispatch') },
  { id: 't_icbus', cat: 'transport', cost: 2, items: ['icbus'], n: () => L('Bus intercity', 'Intercity buses') },
  { id: 't_train2', cat: 'transport', cost: 4, items: ['train2'], n: () => L('Stazione centrale', 'Central station') },
  { id: 't_cargo2', cat: 'transport', cost: 4, items: ['cargoport2', 'transship', 'dryport'], n: () => L('Porto medio, trasbordo e porto secco', 'Medium port, transfer station and dry port') },
  { id: 't_cargo3', cat: 'transport', cost: 6, req: 't_cargo2', items: ['cargoport3'], n: () => L('Porto merci grande', 'Large cargo port') },
);
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;

// disegno
const _drawSvc3 = drawSvc;
drawSvc = function (sv) {
  const T = sv.type;
  if (!['ferrydepot', 'ferrystop', 'ferryterm', 'taxistand', 'taxidisp', 'taxi2', 'icbus', 'train2', 'transship', 'dryport', 'cargoport2', 'cargoport3'].includes(T)) return _drawSvc3(sv);
  if (T === 'cargoport2' || T === 'cargoport3') { const t = sv.type; sv.type = 'cargoport'; try { _drawSvc3(sv); } finally { sv.type = t; } return; }
  removeParts(sv.parts); curRef = sv;
  const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
  const cols = [0xc0462a, 0x2a6ac0, 0x3a9a4a, 0xd8a030];
  switch (T) {
    case 'ferrydepot': slab(0x8a8a8a); box(-W / 5, -D / 5, W * 0.5, 9, D * 0.45, 0x1a9ab0); box(W / 4, D * 0.35, 6, 3, D * 0.5, 0x6a5a48, 'plain'); break;
    case 'ferrystop': box(0, D * 0.2, 5, 1, D * 0.9, 0x8a7a6a, 'plain', -0.4); box(0, -D * 0.3, 6, 3, 3, 0x1a9ab0); break;
    case 'ferryterm': slab(0xc8beaa); box(0, -D / 5, W * 0.7, 9, D * 0.4, 0xe8f0f4); box(0, D * 0.35, 6, 1.2, D * 0.5, 0x8a7a6a, 'plain', -0.4); box(0, -D / 5, W * 0.72, 0.6, D * 0.42, 0x1a9ab0, 'body', 9); break;
    case 'taxistand': slab(0x5a5a5e); box(-W / 3, 0, 1.2, 3, 1.2, 0xe0c02a); for (const a of [-2, 2]) box(a, 0, 1.8, 1.4, 4.2, 0xf0c020); break;
    case 'taxidisp': box(0, 0, W * 0.8, 8, D * 0.7, 0xd8d0b8); box(0, 0, 2, 6, 2, 0x999999, 'plain', 8); box(0, 0, W * 0.3, 1, 1, 0xe0c02a, 'body', 8); break;
    case 'taxi2': slab(0x6a6a6e); box(0, D / 6, W * 0.9, 9, D * 0.6, 0xe0c02a); for (let i = -3; i <= 3; i++) box(i * 8, -D * 0.38, 2, 1.4, 4.4, 0xf0c020); break;
    case 'icbus': slab(0x7a7a7a); box(0, -D / 4, W * 0.7, 8, D * 0.35, 0xd8d8e0); box(0, D / 6, W * 0.92, 0.5, D * 0.5, 0x8a3ab0, 'body', 7); for (let i = -2; i <= 2; i++) box(i * 12, D / 6, 2.5, 3, 12, 0x8a3ab0); break;
    case 'train2': slab(0x9a9a92); box(0, -D * 0.25, W * 0.7, 20, D * 0.4, 0xc8b89a); box(0, -D * 0.25, W * 0.72, 3, D * 0.42, 0x7a4a3a, 'body', 20); box(-W * 0.38, -D * 0.25, 8, 34, 8, 0xc8b89a); box(0, D * 0.25, W, 0.5, D * 0.4, 0x5a5a5e, 'plain', 6); break;
    case 'transship': slab(0x8a8a8a); for (let i = -4; i <= 4; i++) box(i * 14, D / 6, 11, 2.6 * (1 + (i & 1)), 4, cols[(i + 4) % 4], 'plain'); box(0, -D / 4, W, 16, 2, 0xd8a030, 'plain'); box(0, -D / 4, W * 0.9, 0.4, 3, 0xd8a030, 'plain', 16); break;
    case 'dryport': slab(0x7a7a74); for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) box(i * 14, j * 18, 12, 2.6 * (1 + ((i + j) & 1)), 5, cols[(i + j + 8) % 4], 'plain'); box(-W * 0.4, -D * 0.4, 14, 6, 8, 0xd8d8d0); break;
  }
  if (EXT[T]) extOf(sv).forEach((e, i) => box((i % 2 ? 1 : -1) * W * 0.36, D * 0.36, W * 0.2, 5, D * 0.2, 0xb8a888));
};
// ---------- traghetti che si muovono sull'acqua ----------
const ferryGroup = new THREE.Group(); scene.add(ferryGroup);
const ferryGeo = new THREE.BoxGeometry(9, 4, 26), ferryMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), ferryTopMat = new THREE.MeshLambertMaterial({ color: 0x1a9ab0 });
function drawFerries() {
  const list = metroTrains.filter(m => lines.find(l => l.id === m.line)?.kind === 'ferry');
  while (ferryGroup.children.length > list.length) ferryGroup.remove(ferryGroup.children[ferryGroup.children.length - 1]);
  while (ferryGroup.children.length < list.length) { const g = new THREE.Group(), a = new THREE.Mesh(ferryGeo, ferryMat), b = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 12), ferryTopMat); b.position.y = 3.2; g.add(a, b); ferryGroup.add(g); }
  list.forEach((m, k) => {
    const ln = lines.find(l => l.id === m.line), a = svcs.get(ln.stops[m.i]?.svc), b = svcs.get(ln.stops[(m.i + 1) % ln.stops.length]?.svc), g = ferryGroup.children[k];
    if (!a || !b) { g.visible = false; return; }
    g.visible = true; g.position.set(lerp(a.x, b.x, m.t), WATER + 1, lerp(a.z, b.z, m.t)); g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
  });
}
// ---------- taxi: depositi, posteggi e centrale ----------
function taxiHour() {
  const deps = [...svcs.values()].filter(s => s.on && SV[s.type].fleet);
  if (!deps.length) return;
  const disp = [...svcs.values()].some(s => s.on && s.type === 'taxidisp');
  const stands = [...svcs.values()].filter(s => s.on && s.type === 'taxistand');
  const fare = S.policies.taxifare;
  for (const sv of deps) {
    const mine = [...vehicles].filter(v => v.kind === 'taxi' && v.svc === sv.id).length;
    if (mine >= SV[sv.type].fleet || rand() > (fare ? 0.4 : 0.55)) continue;
    let b = null;
    if (disp) b = pick(rand() < 0.6 && lists.com.length ? lists.com : lists.res.length ? lists.res : lists.com);
    else if (stands.length) { const st = pick(stands); const near = []; bldNear(st.x, st.z, 500, q => { if (q.seg != null && !q.ruin) near.push(q); }); b = pick(near); }
    if (!b) continue;
    const v = dispatch(sv, 'taxi', b, null); if (v) { v.ev = sv.ext.includes('ev'); stats.taxiN = (stats.taxiN || 0) + 1; if (!S.opts.unlimited) S.money += fare ? 6 : 3; }
  }
}
// ---------- smog dei bus e dei taxi (niente se elettrici) ----------
function gridHook(airS, noiseS, filt) {
  const bd = [...svcs.values()].filter(s => s.on && (s.type === 'busdepot' || s.type === 'busstation')), ev = bd.length ? bd.filter(s => s.ext.includes('ev')).length / bd.length : 0;
  for (const ln of lines) if (ln.kind === 'bus' && ln.ok) for (const st of ln.stops) { if (st.x == null) continue; airS[gIdx(st.x, st.z)] += 0.35 * ln.nveh / Math.max(1, ln.stops.length) * (1 - ev) * filt; }
  for (const sv of svcs.values()) if (sv.on && SV[sv.type].fleet && !sv.ext.includes('ev')) airS[gIdx(sv.x, sv.z)] += SV[sv.type].fleet * 0.12 * filt;
}
// ---------- bus intercity e porti: ogni ora ----------
const _hourly3 = hourly;
hourly = function () {
  _hourly3();
  const outs = outsideNodes();
  for (const sv of svcs.values()) {
    if (!sv.on) continue;
    if (sv.type === 'icbus' && outs.length && sv.seg != null && rand() < 0.6) {
      const g = gateLeg(pick(outs)), s1 = segs.get(sv.seg); if (!g || !s1) continue;
      const legs = findPath(g.seg, g.along, s1, sv.along); if (!legs) continue;
      const v = spawnVehicle('bus', legs, { col: 0x8a3ab0, icb: true });
      if (v) v.onArrive = () => { stats.icbN = (stats.icbN || 0) + 1; const back = findPath(s1, sv.along, g.seg, g.along); if (back) spawnVehicle('bus', back, { col: 0x8a3ab0, icb: true }); };
    }
    if (sv.ext.includes('pax') && SV[sv.type].port && sv.dock && !ships.some(s => s.cruise && s.sv === sv.id) && rand() < 0.04) spawnShip(sv, false, true);
  }
};
const _monthly3 = monthly;
monthly = function () { _monthly3(); stats.icbM = stats.icbN || 0; stats.icbN = 0; stats.taxiM = stats.taxiN || 0; stats.taxiN = 0; S.cargoHub = [...svcs.values()].some(s => s.on && (s.type === 'transship' || s.type === 'dryport')); };
// sicurezza del porto
const _computeCoverage3 = computeCoverage;
computeCoverage = function () { _computeCoverage3(); for (const sv of svcs.values()) if (sv.on && sv.ext.includes('sec')) bldNear(sv.x, sv.z, 700, b => { if (b.cov) b.cov.police = Math.max(b.cov.police || 0, 0.6); }); };
// ---------- schede: binari, comodità, flotta ----------
function stationLoad(sv) { let r = 0; for (const ln of lines) if (ln.stops.some(s => s.svc === sv.id)) r += ln.riders || 0; return r; }
function svcExtraHTML(o) {
  const d = SV[o.type]; let h = '';
  if (d.station === 'train' || d.station === 'ferry') {
    const plat = (d.plat || 2) + (o.ext.includes('plat') ? 2 : 0), used = lines.filter(l => l.ok && l.stops.some(s => s.svc === o.id)).reduce((a, l) => a + l.nveh, 0);
    const load = stationLoad(o), comfort = clamp(70 - Math.max(0, used - plat) * 12 - load / 400 + (o.ext.includes('shop') ? 20 : 0) + (o.type === 'train2' || o.type === 'ferryterm' ? 10 : 0), 0, 100);
    h += `<div class="row"><span>🛤️ ${d.station === 'train' ? L('Binari', 'Platforms') : L('Pontili', 'Piers')}</span><span>${plat} · ${L('mezzi sulle linee', 'vehicles on lines')}: ${used}</span></div><div class="row"><span>🪑 ${L('Comodità', 'Comfort')}</span><span>${Math.round(comfort)}%</span></div>` + bar(comfort / 100, comfort < 40 ? 'var(--bad)' : 'var(--good)');
    if (used > plat) h += `<div style="font-size:12px;color:var(--bad)">${L('Troppi mezzi per i binari: aggiungi binari o una stazione più grande', 'Too many vehicles for the platforms: add platforms or a bigger station')}</div>`;
  }
  if (d.fleet) { const n = [...vehicles].filter(v => v.kind === 'taxi' && v.svc === o.id).length; h += `<div class="row"><span>🚕 ${L('Taxi in giro', 'Taxis out')}</span><span>${n} / ${d.fleet}</span></div><div class="row"><span>${L('Corse nell\'ultimo mese (tutta la città)', 'Rides last month (whole city)')}</span><span>${fmtNum(stats.taxiM || 0)}</span></div>` + (![...svcs.values()].some(s => s.on && s.type === 'taxidisp') ? `<div style="font-size:12px;color:var(--mute)">${L('Senza centrale i taxi prendono clienti solo ai posteggi', 'Without a dispatch centre taxis only pick up at stands')}</div>` : ''); }
  if (o.type === 'icbus') h += `<div class="row"><span>🚌 ${L('Bus intercity arrivati l\'ultimo mese', 'Intercity buses last month')}</span><span>${fmtNum(stats.icbM || 0)}</span></div>`;
  return h;
}
// ogni fotogramma: traghetti
const _updateVehicles3 = updateVehicles;
updateVehicles = function (dt) { _updateVehicles3(dt); drawFerries(); };
