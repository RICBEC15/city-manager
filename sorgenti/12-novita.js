// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 1: metro, tram, aerei,
//  energie pulite e nucleare, disastri, prevenzione e rifugi
// =====================================================================
// ---------- linee: tram e metropolitana ----------
Object.assign(LK, {
  tram: { n: () => L('Tram', 'Tram'), veh: 'tram', depot: 'tramdepot', cap: 180, upk: 900, price: 2, wait: 7, catch: 450, col: 0x2aa07a, ms: 4 },
  metro: { n: () => L('Metropolitana', 'Metro'), depot: 'metrodepot', cap: 900, upk: 2600, price: 3, wait: 8, catch: 700, col: 0x2a5ad0, ms: 6, st: 'metro' },
});
Object.assign(LMOD, {
  tram: [{ n: () => L('Tram corto', 'Short tram'), cap: 1, upk: 1 }, { n: () => L('Tram lungo (doppio)', 'Long tram (double)'), cap: 1.8, upk: 1.5 }],
  metro: [{ n: () => L('Treno da 4 carrozze', '4-car train'), cap: 1, upk: 1 }, { n: () => L('Treno da 6 carrozze', '6-car train'), cap: 1.5, upk: 1.35 }],
});
function toggleTram(id) { const s = segs.get(id); if (!s) return; if (!s.tram && !spend(Math.round(s.len * 40))) return; s.tram = !s.tram; roadVersion++; for (const ln of lines) ln.ver = -1; roadDirty.add(s.chunk); flushRoads(); refreshPanels(); }

// ---------- nuovi edifici ----------
const DIS = true; // segna gli edifici della vista "Controllo disastri"
Object.assign(SV, {
  windmill: { cat: 'power', w: 10, d: 10, cost: 8500, upk: 250, ms: 0, p: 2, free: true, h: 14, n: () => L('Mulino a vento', 'Windmill'), d2: () => L('2 MW col vento, non inquina. Non serve la strada se tocca un\'altra centrale o un palo.', '2 MW with wind, no pollution. No road needed if it touches another plant or a pole.') },
  windsmall: { cat: 'power', w: 18, d: 18, cost: 17000, upk: 500, ms: 1, p: 4, free: true, n: () => L('Pala eolica piccola', 'Small wind turbine'), d2: () => L('4 MW quando c\'è vento. Meglio in collina e sulla costa.', '4 MW when windy. Best on hills and coasts.') },
  wind: { cat: 'power', w: 30, d: 30, cost: 25000, upk: 750, ms: 2, p: 6, free: true, n: () => L('Pala eolica', 'Wind turbine'), d2: () => L('6 MW col vento. Ampliamenti: rotore avanzato (+2,5 MW) e batteria.', '6 MW with wind. Upgrades: advanced rotor (+2.5 MW) and battery.') },
  solar: { cat: 'power', w: 80, d: 64, cost: 60000, upk: 1500, ms: 2, p: 14, n: () => L('Campo solare', 'Solar farm'), d2: () => L('14 MW col sole: -25% con le nuvole, niente di notte. Ampliamento: batteria per la notte.', '14 MW in sunshine: -25% when cloudy, none at night. Upgrade: battery for the night.') },
  battery: { cat: 'power', w: 22, d: 14, cost: 30000, upk: 600, ms: 3, bat: 15, n: () => L('Batterie di accumulo', 'Battery storage'), d2: () => L('Di notte o senza vento dà 15 MW messi da parte di giorno', 'At night or without wind it gives 15 MW stored during the day') },
  geo: { cat: 'power', w: 46, d: 38, cost: 320000, upk: 7000, ms: 5, p: 90, geo: true, noise: 3, h: 18, n: () => L('Centrale geotermica', 'Geothermal plant'), d2: () => L('90 MW pulita dal calore della terra: va messa sopra una falda (vista Falde).', '90 MW clean, from the earth\'s heat: place it over groundwater (Groundwater view).') },
  hydro: { cat: 'power', w: 70, d: 30, cost: 650000, upk: 9000, ms: 6, p: 300, hydro: true, shore: true, n: () => L('Diga idroelettrica', 'Hydroelectric dam'), d2: () => L('300 MW puliti dall\'acqua che scorre. Sulla riva di un fiume o del mare; d\'estate rende meno, con la pioggia di più.', '300 MW clean from flowing water. On a river or sea shore; less in summer, more with rain.') },
  nuclear: { cat: 'power', w: 120, d: 100, cost: 2500000, upk: 40000, ms: 8, p: 1200, noise: 4, n: () => L('Centrale nucleare', 'Nuclear power plant'), d2: () => L('1200 MW: basta per quasi ogni città. Carissima. Servono trasformatori.', '1200 MW: enough for almost any city. Very expensive. Needs transformers.') },
  firewatch: { cat: 'fire', w: 10, d: 10, cost: 15000, upk: 400, ms: 3, r: 3000, free: true, dis: DIS, h: 24, n: () => L('Torre di avvistamento incendi', 'Firewatch tower'), d2: () => L('Nel raggio di 3 km gli incendi nei boschi sono più rari e si vedono subito', 'Within 3 km forest fires are rarer and spotted at once') },
  heli: { cat: 'fire', w: 54, d: 44, cost: 180000, upk: 6000, ms: 5, r: 8000, dis: DIS, n: () => L('Base elicotteri antincendio', 'Firefighting helicopter depot'), d2: () => L('Gli elicotteri spengono gli incendi nei boschi e dove i camion non arrivano (8 km)', 'Helicopters fight forest fires and reach where trucks can\'t (8 km)') },
  siren: { cat: 'fire', w: 8, d: 8, cost: 25000, upk: 300, ms: 4, r: 3000, free: true, dis: DIS, h: 14, n: () => L('Sistema di allerta disastri', 'Early disaster warning system'), d2: () => L('Avvisa prima: la gente si mette al riparo e ci sono meno vittime', 'Warns earlier: people take cover and fewer die') },
  shelter: { cat: 'fire', w: 30, d: 24, cost: 30000, upk: 300, ms: 4, shel: 2000, dis: DIS, r: 900, n: () => L('Rifugio d\'emergenza piccolo', 'Small emergency shelter'), d2: () => L('2.000 posti: i disastri non lo distruggono', '2,000 places: disasters can\'t destroy it') },
  shelter2: { cat: 'fire', w: 60, d: 44, cost: 120000, upk: 1200, ms: 6, shel: 8000, evac: true, dis: DIS, r: 2000, n: () => L('Rifugio d\'emergenza grande', 'Large emergency shelter'), d2: () => L('8.000 posti e bus di evacuazione che passano prima da scuole e ospedali', '8,000 places and evacuation buses that serve schools and hospitals first') },
  tramdepot: { cat: 'transport', w: 60, d: 40, cost: 100000, upk: 2600, ms: 4, depot: 'tram', n: () => L('Deposito tram', 'Tram depot'), d2: () => L('Serve per le linee del tram. I binari si mettono sulle strade dalla scheda della strada.', 'Needed for tram lines. Add tracks to roads from the road panel.') },
  metro: { cat: 'transport', w: 24, d: 24, cost: 90000, upk: 2400, ms: 6, station: 'metro', free: true, n: () => L('Stazione della metro', 'Metro station'), d2: () => L('Sotterranea: si mette ovunque, i treni viaggiano sotto terra e non trovano traffico', 'Underground: place anywhere, trains run below ground with no traffic') },
  metrodepot: { cat: 'transport', w: 90, d: 40, cost: 200000, upk: 5400, ms: 6, depot: 'metro', n: () => L('Deposito della metro', 'Metro yard'), d2: () => L('Serve per le linee della metropolitana', 'Needed for metro lines') },
  airport: { cat: 'transport', w: 1000, d: 240, cost: 750000, upk: 37500, ms: 7, attr: 5, noise: 10, unique: true, xp: 1000, n: () => L('Aeroporto', 'Airport'), d2: () => L('Aerei da e per il resto del mondo: +5 attrattività, più domanda di uffici. Vicino alla pista le case non possono essere alte.', 'Planes to and from the world: +5 attractiveness, more office demand. Near the runway buildings must stay low.') },
  airport2: { cat: 'transport', w: 1500, d: 420, cost: 4000000, upk: 150000, ms: 9, attr: 10, noise: 14, unique: true, xp: 5000, n: () => L('Aeroporto internazionale', 'International airport'), d2: () => L('Due piste, 18 gate, terminal merci e stazione bus integrata: +10 attrattività, più studenti universitari e più domanda di uffici', 'Two runways, 18 gates, cargo terminal and built-in bus station: +10 attractiveness, more university students and office demand') },
  space: { cat: 'parks', w: 160, d: 120, cost: 4800000, upk: 180000, ms: 10, r: 3000, park: 8, attr: 30, unique: true, xp: 6000, h: 90, n: () => L('Centro spaziale', 'Space centre'), d2: () => L('Museo dello spazio e lanci di razzi: attira tantissimi turisti, più interesse per l\'università e per l\'elettronica', 'Space museum and rocket launches: draws huge crowds, more interest in university and electronics') },
});
Object.assign(EXT, {
  wind: [{ k: 'rotor', cost: 15000, upk: 250, n: () => L('Rotore avanzato (+2,5 MW)', 'Advanced rotor (+2.5 MW)') }, { k: 'bat', cost: 12000, upk: 300, n: () => L('Batteria (+4 MW senza vento)', 'Battery (+4 MW without wind)') }],
  solar: [{ k: 'bat', cost: 20000, upk: 400, n: () => L('Batteria per la notte (+4 MW)', 'Night battery (+4 MW)') }],
  tramdepot: [{ k: 'gar', cost: 30000, upk: 800, n: () => L('Rimessa in più', 'Extra garage') }],
  metrodepot: [{ k: 'gar', cost: 50000, upk: 1200, n: () => L('Binari in più', 'Extra tracks') }],
  airport: [{ k: 'cargo', cost: 250000, upk: 9000, n: () => L('Terminal merci (aerei cargo)', 'Cargo terminal (cargo planes)') }, { k: 'lounge', cost: 120000, upk: 4000, n: () => L('Sala d\'attesa d\'affari (+uffici)', 'Business lounge (+offices)') }],
});
// albero di sviluppo
TREE.push(
  { id: 't_wind', cat: 'power', cost: 1, items: ['windsmall', 'wind'], n: () => L('Energia dal vento', 'Wind power') },
  { id: 't_solar', cat: 'power', cost: 2, items: ['solar', 'battery'], n: () => L('Energia solare e batterie', 'Solar power and batteries') },
  { id: 't_geo', cat: 'power', cost: 4, req: 't_solar', items: ['geo'], n: () => L('Geotermico', 'Geothermal') },
  { id: 't_hydro', cat: 'power', cost: 4, req: 't_wind', items: ['hydro'], n: () => L('Idroelettrico', 'Hydroelectric') },
  { id: 't_nuke', cat: 'power', cost: 8, req: 't_gas', items: ['nuclear'], n: () => L('Nucleare', 'Nuclear') },
  { id: 't_heli', cat: 'fire', cost: 4, req: 't_fhq', items: ['heli'], n: () => L('Elicotteri antincendio', 'Firefighting helicopters') },
  { id: 't_shel2', cat: 'fire', cost: 2, items: ['shelter2'], n: () => L('Rifugi grandi con bus di evacuazione', 'Large shelters with evacuation buses') },
  { id: 't_tram', cat: 'transport', cost: 2, items: ['tramdepot'], n: () => L('Tram', 'Tram') },
  { id: 't_metro', cat: 'transport', cost: 4, req: 't_busst', items: ['metrodepot', 'metro'], n: () => L('Metropolitana', 'Metro') },
  { id: 't_air', cat: 'transport', cost: 4, items: ['airport'], n: () => L('Aeroporto', 'Airport') },
  { id: 't_air2', cat: 'transport', cost: 8, req: 't_air', items: ['airport2'], n: () => L('Aeroporto internazionale', 'International airport') },
  { id: 't_space', cat: 'parks', cost: 8, req: 'tour1', items: ['space'], n: () => L('Centro spaziale', 'Space centre') },
);
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;

// ---------- disegno dei nuovi edifici ----------
const _drawSvc0 = drawSvc;
drawSvc = function (sv) {
  const T = sv.type;
  if (!['windmill', 'windsmall', 'battery', 'geo', 'hydro', 'firewatch', 'heli', 'shelter2', 'metrodepot', 'airport2', 'space'].includes(T)) return _drawSvc0(sv);
  removeParts(sv.parts); curRef = sv;
  const d = SV[T], y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
  const cyl = (a, b, r, h, c, y0 = 0) => { const [x, z] = at(a, b); return addPart(P, 'cyl', x, y + y0, z, 0, r, h, r, c); };
  switch (T) {
    case 'windmill': { box(0, 0, 5, 9, 5, 0xe8e0cc); box(0, 0, 3.6, 3, 3.6, 0x8a4a2a, 'body', 9); const [x, z] = at(0, -2.6); sv.blade = []; for (let i = 0; i < 4; i++) sv.blade.push(addPart(P, 'plain', x, y + 10.5, z, 0, 0.6, 7, 0.3, 0xd8d0c0)); break; }
    case 'windsmall': { cyl(0, 0, 1.1, 26, 0xf2f2f2); const [x, z] = at(0, 0); sv.blade = []; for (let i = 0; i < 3; i++) sv.blade.push(addPart(P, 'plain', x, y + 26, z, 0, 0.6, 11, 0.4, 0xf8f8f8)); break; }
    case 'battery': slab(0x9a9a92); for (let i = -2; i <= 2; i++) box(i * 4, 0, 3, 3, D * 0.7, 0xe8e8e8); break;
    case 'geo': slab(0x8a8478); box(-W / 5, 0, W * 0.45, 10, D * 0.6, 0xc8c2b4); cyl(W / 4, -D / 5, 8, 18, 0xd8d8d4); cyl(W / 4, D / 5, 6, 14, 0xd8d8d4); break;
    case 'hydro': box(0, D * 0.1, W, 14, D * 0.5, 0xa8a8a0); box(0, -D * 0.3, W * 0.3, 8, D * 0.3, 0xd8d8d0); for (const a of [-W / 3, 0, W / 3]) box(a, D * 0.42, 6, 9, 3, 0x6a6e74); break;
    case 'firewatch': cyl(0, 0, 0.8, 20, 0x6a5a48); box(0, 0, 4, 3, 4, 0x8a4a2a, 'body', 20); box(0, 0, 4.6, 0.6, 4.6, 0x5a3a2a, 'body', 23); break;
    case 'heli': slab(0x7a7a7a); box(-W / 4, D / 6, W * 0.4, 9, D * 0.5, 0xc0463a); for (const a of [W / 5, W / 2.6]) { const [x, z] = at(a, -D / 6); addPart(P, 'plain', x, y + 0.35, z, yaw, 14, 0.1, 14, 0xe0e0e0); addPart(P, 'body', x, y + 0.4, z, yaw, 3, 2.4, 9, 0xc8281e); } break;
    case 'shelter2': box(0, 0, W * 0.85, 5, D * 0.8, 0x8a8a7a); box(0, -D * 0.38, 10, 5.5, 3, 0xe0b020); box(W * 0.3, D * 0.2, 8, 7, 8, 0x6a6a60); break;
    case 'metrodepot': slab(0x55575c); box(0, D / 8, W * 0.92, 9, D * 0.55, 0x2a5ad0); for (let i = -2; i <= 2; i++) box(0, i * 5 - D * 0.3, W * 0.95, 0.2, 1.2, 0x3a3a3e, 'plain'); break;
    case 'airport2': slab(0x6a8a5a); box(0, D * 0.3, W * 0.95, 0.35, 45, 0x3a3a3e, 'plain'); box(0, -D * 0.02, W * 0.95, 0.35, 45, 0x3a3a3e, 'plain'); box(0, -D * 0.33, W * 0.4, 16, D * 0.2, 0xd8d8e0); box(-W * 0.3, -D * 0.33, W * 0.12, 9, D * 0.2, 0xc8c8d0); cyl(W * 0.25, -D * 0.33, 6, 42, 0xd8d8e0); break;
    case 'space': slab(0xb8b8b0); box(-W / 4, 0, W * 0.4, 18, D * 0.5, 0xe8e8ec); cyl(W / 4, 0, 6, 70, 0xf4f4f4); box(W / 4, 0, 24, 90, 4, 0x8a8a8a, 'plain'); cyl(W / 4, 0, 6.5, 6, 0x2a3a6a, 70); break;
  }
};

// ---------- aeroporto: case basse vicino alla pista ----------
function airCap(x, z) {
  let cap = 1e9;
  for (const sv of svcs.values()) {
    if (sv.type !== 'airport' && sv.type !== 'airport2') continue;
    const ax = Math.cos(sv.ang), az = -Math.sin(sv.ang); // lungo la pista
    const dx = x - sv.x, dz = z - sv.z, a = Math.abs(dx * ax + dz * az), l = Math.abs(-dx * az + dz * ax);
    if (l > sv.d / 2 + 250) continue;
    const over = a - sv.w / 2; cap = Math.min(cap, over < 0 ? 12 : 12 + over * 0.05);
  }
  return cap;
}
const _bldHeight0 = bldHeight;
bldHeight = function (b) { const h = _bldHeight0(b); return Math.max(3, Math.min(h, airCap(b.x, b.z))); };
// domanda di uffici e università con gli aeroporti
const _computeDemand0 = computeDemand;
computeDemand = function () {
  _computeDemand0();
  const d = stats.demand; if (!d.why || !d.why.O) return;
  let k = 0; for (const sv of svcs.values()) if (sv.on) { if (sv.type === 'airport') k += 4 + (sv.ext.includes('lounge') ? 3 : 0); if (sv.type === 'airport2') k += 8; if (sv.type === 'space') k += 4; }
  if (k) { d.why.O.push([L('Aeroporti e centro spaziale', 'Airports and space centre'), k]); d.O = clamp(d.O + k, 0, 100); }
};

// ---------- disastri: incendi boschivi, grandine, e giornale eventi ----------
const forestFires = [];
let hail = null;
const ffPts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xff6a10, size: 10, transparent: true, opacity: 0.9, depthWrite: false }));
ffPts.frustumCulled = false; scene.add(ffPts);
const smkPts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0x6a6a6a, size: 26, transparent: true, opacity: 0.45, depthWrite: false }));
smkPts.frustumCulled = false; scene.add(smkPts);
const hailPts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffffff, size: 3, transparent: true, opacity: 0.95, depthWrite: false }));
hailPts.frustumCulled = false; scene.add(hailPts);
const rocket = { m: new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 40, 10), new THREE.MeshLambertMaterial({ color: 0xf4f4f4 })), t: -1, sv: 0, next: 30 };
rocket.m.visible = false; scene.add(rocket.m);
const svNear = (types, x, z) => { for (const sv of svcs.values()) if (sv.on && types.includes(sv.type) && Math.hypot(sv.x - x, sv.z - z) < (SV[sv.type].r || 0)) return sv; return null; };
function logEvent(t) { S.events = S.events || []; S.events.unshift({ d: Math.floor(S.time / 24), t }); if (S.events.length > 40) S.events.length = 40; }
const _disasterMsg0 = disasterMsg;
disasterMsg = function (t, x, z) { _disasterMsg0(t, x, z); logEvent(t); evacuate(x, z); };
function evacuate(x, z) { // bus di evacuazione dai rifugi grandi: prima scuole e ospedali
  const sh = [...svcs.values()].filter(s => s.on && SV[s.type].evac && s.seg != null); if (!sh.length || !warned(x, z)) return;
  const targets = [...svcs.values()].filter(s => s.seg != null && ['school', 'high', 'clinic', 'hospital'].includes(s.type)).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
  const res = lists.res.filter(b => Math.hypot(b.x - x, b.z - z) < 2000).slice(0, 6);
  let n = 0;
  for (const tg of targets.slice(0, 4).concat(res)) {
    if (n >= 8) break; const s0 = sh[n % sh.length], a = segs.get(s0.seg), b = segs.get(tg.seg); if (!a || !b) continue;
    const p = findPath(b, tg.along ?? b.len / 2, a, s0.along ?? a.len / 2); if (p && spawnVehicle('bus', p, { col: 0xe0a020, evac: true })) n++;
  }
  if (n) toast(L(`🚌 ${n} bus di evacuazione verso i rifugi`, `🚌 ${n} evacuation buses heading to shelters`), 4000);
}
function startForestFire() {
  const c = ownedCenter();
  for (let k = 0; k < 300; k++) {
    const x = c.x + (rand() - 0.5) * 9000, z = c.z + (rand() - 0.5) * 9000;
    if (Math.abs(x) > HALF - 500 || Math.abs(z) > HALF - 500 || getH(x, z) < WATER + 0.5 || gSample(RES.forest, x, z) < 0.3) continue;
    const watch = svNear(['firewatch'], x, z);
    if (watch && rand() < 0.5) return false; // la torre l'ha visto subito: spento sul nascere
    forestFires.push({ x, z, r: 25, t: 0, seen: !!watch });
    disasterMsg(L('🔥 Incendio nel bosco!', '🔥 Forest fire!'), x, z); addFeed('fire');
    return true;
  }
  return false;
}
function startHail() { hail = { t: 0, cost: 0, hits: 0 }; const c = ownedCenter(); disasterMsg(L('🧊 Grandinata! La gente resta in casa.', '🧊 Hailstorm! People stay indoors.'), c.x, c.z); }
function rollNewDisaster() {
  if (!S.opts.disasters || S.ms < 3) return;
  const se = seasonInfo(), T = WEATHER.temp, dry = WEATHER.kind === 'clear' && T > 22;
  const watch = [...svcs.values()].some(s => s.type === 'firewatch' && s.on) ? 0.5 : 1;
  if (rand() < (dry ? 0.22 : se.summer ? 0.06 : 0.015) * watch) { startForestFire(); return; }
  if (T > 0 && T < 11 && (WEATHER.kind === 'rain' || WEATHER.kind === 'storm') && rand() < 0.25) { startHail(); return; }
  const r = rand();
  if (r < 0.025) rollDisaster('tornado');
  else if (r < 0.035) rollDisaster('quake');
  else if (r < 0.042) rollDisaster('flood');
  else if (r < 0.046) rollDisaster('meteor');
  else if (WEATHER.kind === 'storm' && r < 0.2) lightning();
}
const _monthly0 = monthly;
monthly = function () { _monthly0(); rollNewDisaster(); };
const _updateDisasters0 = updateDisasters;
updateDisasters = function (dt) { _updateDisasters0(dt); updateNewDisasters(dt); };
function updateNewDisasters(dt) {
  const fp = [], sp = [];
  for (let i = forestFires.length - 1; i >= 0; i--) {
    const f = forestFires[i]; f.t += dt;
    const heli = svNear(['heli'], f.x, f.z), grow = (f.seen ? 0.5 : 1) * (WEATHER.kind === 'rain' ? 0.3 : 1);
    f.r += dt * 1.6 * grow;
    if (rand() < dt * 0.5) bldNear(f.x, f.z, f.r + 25, b => { if (!b.fire && !b.ruin && rand() < 0.15) startFire(b); });
    if (rand() < dt) clearTrees(() => rand() < 0.4, f.x, f.z, f.r);
    const out = heli ? 45 : WEATHER.kind === 'rain' || WEATHER.kind === 'storm' ? 60 : 180;
    if (f.t > out) { // spento: il bosco bruciato rende meno legname per un po'
      const r2 = f.r; for (let j = -3; j <= 3; j++) for (let k = -3; k <= 3; k++) { const x = f.x + j * r2 / 3, z = f.z + k * r2 / 3; if (Math.hypot(x - f.x, z - f.z) > r2) continue; const g = gIdx(x, z); if (g >= 0) RES.forest[g] *= 0.3; }
      forestFires.splice(i, 1); logEvent(L(`🔥 Incendio nel bosco spento${heli ? ' dagli elicotteri' : ''} (${Math.round(r2 * 2)} m di fronte)`, `🔥 Forest fire put out${heli ? ' by helicopters' : ''} (${Math.round(r2 * 2)} m front)`)); continue;
    }
    const yb = Math.max(getH(f.x, f.z), WATER);
    for (let k = 0; k < 70; k++) { const a = rand() * 6.28, rr = f.r * (0.6 + rand() * 0.4), x = f.x + Math.cos(a) * rr, z = f.z + Math.sin(a) * rr; fp.push(x, getH(x, z) + 1 + rand() * 8, z); }
    for (let k = 0; k < 25; k++) { const a = rand() * 6.28, rr = f.r * rand(), h = 20 + rand() * 120; sp.push(f.x + Math.cos(a) * rr + h * 0.4 * Math.cos(WEATHER.windDir), yb + h, f.z + Math.sin(a) * rr + h * 0.4 * Math.sin(WEATHER.windDir)); }
    if (heli && rand() < dt * 2) { const a = simClock * 0.6 + i; sp.push(f.x + Math.cos(a) * f.r, yb + 60, f.z + Math.sin(a) * f.r); }
  }
  ffPts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); ffPts.visible = fp.length > 0;
  smkPts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); smkPts.visible = sp.length > 0;
  // grandine
  const hp = [];
  if (hail) {
    hail.t += dt;
    if (rand() < dt * 1.5 && lists.res.length) { const b = pick(buildings.size ? [...buildings.values()] : []); if (b && !b.ruin) { const c = Math.round(150 + b.level * 120); hail.cost += c; hail.hits++; } }
    for (let k = 0; k < 400; k++) { const x = cam.tx + (rand() - 0.5) * 900, z = cam.tz + (rand() - 0.5) * 900; hp.push(x, Math.max(getH(x, z), WATER) + ((simClock * 80 + k * 13) % 120), z); }
    if (hail.t > 40) { if (!S.opts.unlimited) S.money -= hail.cost; logEvent(L(`🧊 Grandine finita: ${hail.hits} edifici riparati, ${fmtMoney(hail.cost)}`, `🧊 Hail over: ${hail.hits} buildings repaired, ${fmtMoney(hail.cost)}`)); toast(L('Grandine finita. Riparazioni: ', 'Hail over. Repairs: ') + fmtMoney(hail.cost), 4000); hail = null; }
  }
  hailPts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); hailPts.visible = hp.length > 0;
  // razzi del centro spaziale
  const sc = [...svcs.values()].find(s => s.type === 'space' && s.on);
  if (sc) {
    if (rocket.t < 0) { rocket.next -= dt; if (rocket.next < 0) { rocket.t = 0; rocket.sv = sc.id; rocket.next = 120 + rand() * 120; } }
    else {
      rocket.t += dt; const h = rocket.t < 4 ? 0 : (rocket.t - 4) ** 2 * 6, ax = sc.x + Math.cos(sc.ang) * sc.w / 4, az = sc.z - Math.sin(sc.ang) * sc.w / 4;
      rocket.m.visible = true; rocket.m.position.set(ax, sc.y + 26 + h, az);
      if (rocket.t > 4) { const s = []; for (let k = 0; k < 40; k++) s.push(ax + (rand() - 0.5) * 12, sc.y + 6 + h * rand(), az + (rand() - 0.5) * 12); const old = smkPts.geometry.getAttribute('position'); const arr = old ? Array.from(old.array).concat(s) : s; smkPts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); smkPts.visible = true; }
      if (h > 4000) { rocket.t = -1; rocket.m.visible = false; logEvent(L('🚀 Lancio riuscito dal centro spaziale', '🚀 Successful launch from the space centre')); }
    }
  } else rocket.m.visible = false;
}
// giornale degli eventi nella vista "Controllo disastri"
const _showInfo0 = showInfo;
showInfo = function (mode, temp) {
  _showInfo0(mode, temp);
  if (mode !== 'disaster' || !S) return;
  const lg = $('legend'); let cap = 0; for (const s of svcs.values()) if (s.on && SV[s.type].shel) cap += SV[s.type].shel;
  const ev = (S.events || []).slice(0, 8).map(e => `<div style="font-size:12px">${L('Mese', 'Month')} ${e.d}: ${e.t}</div>`).join('') || `<div style="font-size:12px;color:var(--mute)">${L('Nessun evento finora', 'No events yet')}</div>`;
  lg.innerHTML += `<div style="margin-top:4px">🟩 ${L('copertura di allerta, torri e rifugi', 'warning, watchtower and shelter coverage')} · ${L('posti nei rifugi', 'shelter places')}: <b>${fmtNum(cap)}</b> / ${fmtNum(stats.pop)} · ${L('disastri', 'disasters')}: <b>${S.opts.disasters ? L('attivi', 'on') : L('spenti', 'off')}</b></div><div style="margin-top:4px"><b>${L('Giornale degli eventi', 'Event journal')}</b>${ev}</div>`;
};
