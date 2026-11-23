// =====================================================================
//  Simulazione: tempo, meteo, domanda, cittadini, economia, inquinamento,
//  valore del terreno, traguardi, politiche, disastri
// =====================================================================
let S = null;
const UPG = new Set();
const MONTHS = () => LANG === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MS = [
  { pop: 0, n: () => L('Accampamento', 'Camp') }, { pop: 750, n: () => L('Borgo', 'Hamlet') }, { pop: 1500, n: () => L('Villaggio', 'Village') },
  { pop: 2000, n: () => L('Grande villaggio', 'Large village') }, { pop: 4000, n: () => L('Paese vivace', 'Busy town') }, { pop: 7000, n: () => L('Paese in boom', 'Boom town') },
  { pop: 12000, n: () => L('Grande paese', 'Big town') }, { pop: 20000, n: () => L('Grande città', 'Large city') }, { pop: 32000, n: () => L('Capoluogo', 'Capital') },
  { pop: 50000, n: () => L('Metropoli', 'Metropolis') }, { pop: 80000, n: () => L('Grande metropoli', 'Great metropolis') }, { pop: 120000, n: () => L('Megalopoli', 'Megalopolis') },
];
const UPGRADES = [
  { id: 'pow1', cat: 'power', cost: 3, n: () => L('Centrali più efficienti: +15% energia', 'More efficient plants: +15% power') },
  { id: 'wat1', cat: 'water', cost: 3, n: () => L('Tubi nuovi: -20% acqua usata', 'New pipes: -20% water used') },
  { id: 'garb1', cat: 'garbage', cost: 3, n: () => L('Camion compattatori: +30% raccolta rifiuti', 'Compactor trucks: +30% garbage collection') },
  { id: 'hea1', cat: 'health', cost: 4, n: () => L('Prevenzione: -30% malati', 'Prevention: -30% sickness') },
  { id: 'pol1', cat: 'police', cost: 4, n: () => L('Polizia di quartiere: -20% criminalità', 'Community policing: -20% crime') },
  { id: 'fir1', cat: 'fire', cost: 3, n: () => L('Prevenzione incendi: -50% incendi', 'Fire prevention: -50% fires') },
  { id: 'edu1', cat: 'edu', cost: 5, n: () => L('Scuole digitali: istruzione più veloce', 'Digital schools: faster education') },
  { id: 'tra1', cat: 'transport', cost: 4, n: () => L('Mezzi elettrici: meno rumore, +10% passeggeri', 'Electric vehicles: less noise, +10% riders') },
  { id: 'ind1', cat: 'garbage', cost: 5, n: () => L('Filtri per ciminiere: -30% inquinamento dell\'aria', 'Chimney filters: -30% air pollution') },
  { id: 'tour1', cat: 'parks', cost: 4, n: () => L('Promozione turistica: +25% turisti', 'Tourism campaign: +25% tourists') },
  { id: 'zon1', cat: 'misc', cost: 5, n: () => L('Edilizia moderna: gli edifici salgono di livello più in fretta', 'Modern building: faster level ups') },
  { id: 'eco1', cat: 'misc', cost: 6, n: () => L('Agenzia per le imprese: +10% tasse dalle aziende', 'Business agency: +10% business taxes') },
];
// albero di sviluppo: i punti sbloccano edifici, strade e miglioramenti, categoria per categoria
const TREE_CATS = { roads: { i: '🛣️', n: () => L('Strade', 'Roads') }, power: CAT.power, water: CAT.water, garbage: CAT.garbage, health: CAT.health, police: CAT.police, fire: CAT.fire, edu: CAT.edu, parks: CAT.parks, transport: CAT.transport, misc: CAT.misc };
const TREE = [
  { id: 't_hw3', cat: 'roads', cost: 2, items: ['hw3', 'hwo3'], n: () => L('Autostrade larghe', 'Wide highways') },
  { id: 't_hw4', cat: 'roads', cost: 2, req: 't_hw3', items: ['hwo4'], n: () => L('Autostrade a 4 corsie', '4-lane highways') },
  { id: 't_ichg', cat: 'roads', cost: 2, items: ['diamond'], n: () => L('Incroci: svincolo a rombo', 'Intersections: diamond') },
  { id: 't_clover', cat: 'roads', cost: 4, req: 't_ichg', items: ['clover'], n: () => L('Svincolo a quadrifoglio', 'Cloverleaf') },
  { id: 't_gas', cat: 'power', cost: 2, items: ['gas'], n: () => L('Centrale a gas', 'Gas plant') },
  { id: 'pow1', cat: 'power', cost: 3, req: 't_gas' },
  { id: 't_treat', cat: 'water', cost: 2, items: ['treat'], n: () => L('Depurazione', 'Sewage treatment') },
  { id: 'wat1', cat: 'water', cost: 3 },
  { id: 't_recy', cat: 'garbage', cost: 2, items: ['recycle'], n: () => L('Riciclaggio', 'Recycling') },
  { id: 't_incin', cat: 'garbage', cost: 3, req: 't_recy', items: ['incin'], n: () => L('Inceneritore', 'Incinerator') },
  { id: 'garb1', cat: 'garbage', cost: 3 }, { id: 'ind1', cat: 'garbage', cost: 5, req: 't_incin' },
  { id: 't_hosp', cat: 'health', cost: 3, items: ['hospital'], n: () => L('Ospedale', 'Hospital') },
  { id: 't_crem', cat: 'health', cost: 2, items: ['cremat'], n: () => L('Crematorio', 'Crematorium') },
  { id: 'hea1', cat: 'health', cost: 4, req: 't_hosp' },
  { id: 't_phq', cat: 'police', cost: 3, items: ['policehq'], n: () => L('Questura', 'Police HQ') },
  { id: 't_prison', cat: 'police', cost: 3, req: 't_phq', items: ['prison'], n: () => L('Prigione', 'Prison') },
  { id: 'pol1', cat: 'police', cost: 4 },
  { id: 't_fhq', cat: 'fire', cost: 3, items: ['firehq'], n: () => L('Comando dei pompieri', 'Fire HQ') },
  { id: 'fir1', cat: 'fire', cost: 3 },
  { id: 't_college', cat: 'edu', cost: 3, items: ['college'], n: () => L('College', 'College') },
  { id: 't_uni', cat: 'edu', cost: 5, req: 't_college', items: ['uni'], n: () => L('Università', 'University') },
  { id: 'edu1', cat: 'edu', cost: 5, req: 't_college' },
  { id: 't_pool', cat: 'parks', cost: 1, items: ['pool'], n: () => L('Piscina comunale', 'Public pool') },
  { id: 't_wpark', cat: 'parks', cost: 4, req: 't_pool', items: ['waterpark'], n: () => L('Parco acquatico', 'Water park') },
  { id: 'tour1', cat: 'parks', cost: 4 },
  { id: 't_busst', cat: 'transport', cost: 2, items: ['busstation'], n: () => L('Stazione degli autobus', 'Bus station') },
  { id: 't_taxi', cat: 'transport', cost: 2, items: ['taxi'], n: () => L('Taxi', 'Taxi') },
  { id: 't_garage', cat: 'transport', cost: 2, items: ['parkgar'], n: () => L('Parcheggio multipiano', 'Parking garage') },
  { id: 'tra1', cat: 'transport', cost: 4, req: 't_busst' },
  { id: 't_telecom', cat: 'misc', cost: 3, items: ['telecom'], n: () => L('Torre delle telecomunicazioni', 'Telecom tower') },
  { id: 't_sort', cat: 'misc', cost: 3, items: ['postsort'], n: () => L('Centro smistamento posta', 'Post sorting') },
  { id: 'zon1', cat: 'misc', cost: 5 }, { id: 'eco1', cat: 'misc', cost: 6, req: 'zon1' },
];
for (const t of TREE) if (!t.n) { const u = UPGRADES.find(x => x.id === t.id); t.n = u.n; }
const TREE_ITEM = {}; for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
const treeNode = id => TREE.find(t => t.id === id);
function treeOk(key) { return !S || S.opts.unlockAll || !TREE_ITEM[key] || UPG.has(TREE_ITEM[key]); }
function treeLockTxt(key) { const t = treeNode(TREE_ITEM[key]); return `<span class="req">🔒 ${L('Sblocca nell\'albero di sviluppo', 'Unlock in the development tree')}: ${t.n()} (${t.cost} ⭐)</span>`; }
function buyNode(id) { const t = treeNode(id); if (!t || UPG.has(id) || S.dev < t.cost || (t.req && !UPG.has(t.req))) return; S.dev -= t.cost; UPG.add(id); S.upg = [...UPG]; buildSub(); refreshPanels(); toast('⭐ ' + t.n(), 2500); }
// salvataggi vecchi: quello che è già costruito resta sbloccato
function treeMigrate() {
  if (S.treeV) return; S.treeV = 1;
  const grant = id => { const t = treeNode(id); if (!t || UPG.has(id)) return; if (t.req) grant(t.req); UPG.add(id); };
  for (const sv of svcs.values()) if (TREE_ITEM[sv.type]) grant(TREE_ITEM[sv.type]);
  for (const s of segs.values()) if (!s.pre && TREE_ITEM[s.type]) grant(TREE_ITEM[s.type]);
  S.upg = [...UPG];
}
const RAWK = ['food', 'cotton', 'wood', 'oil', 'ore', 'stone'];
const RAWSH = { food: 0.3, cotton: 0.06, wood: 0.2, oil: 0.2, ore: 0.15, stone: 0.09 };
const RAWN = () => ({ food: ['🌾', L('Cibo', 'Food')], cotton: ['🧶', L('Cotone', 'Cotton')], wood: ['🪵', L('Legname', 'Timber')], oil: ['🛢️', L('Petrolio', 'Oil')], ore: ['⛏️', L('Minerali', 'Ore')], stone: ['🪨', L('Pietra', 'Stone')] });
const POLICIES = [
  { id: 'bumps', n: () => L('Dossi nelle strade piccole', 'Speed bumps on small roads'), d: () => L('Auto più lente nei quartieri: meno rumore e meno scorciatoie', 'Slower cars in neighbourhoods: less noise and fewer shortcuts'), cost: 0.05 },
  { id: 'paidpark', n: () => L('Parcheggio a pagamento', 'Paid parking'), d: () => L('Raddoppia gli incassi dei parcheggi, negozi un po\' meno contenti', 'Doubles parking income, shops slightly less happy'), cost: 0 },
  { id: 'smoke', n: () => L('Divieto di fumo', 'Smoking ban'), d: () => L('Meno malati, un po\' meno felicità', 'Less sickness, slightly less happiness'), cost: 0 },
  { id: 'recycle', n: () => L('Raccolta differenziata', 'Recycling'), d: () => L('-20% rifiuti, costa 0,3 € a cittadino', '-20% garbage, costs €0.3 per citizen'), cost: 0.3 },
  { id: 'heavy', n: () => L('Divieto di camion pesanti in città', 'Heavy traffic ban'), d: () => L('Più furgoni e meno camion, -5% industria', 'More vans fewer trucks, -5% industry'), cost: 0 },
  { id: 'freeTransit', n: () => L('Trasporti pubblici gratis', 'Free public transport'), d: () => L('+40% passeggeri, niente biglietti', '+40% riders, no ticket income'), cost: 0 },
  { id: 'energy', n: () => L('Risparmio energetico', 'Power saving'), d: () => L('-15% elettricità usata, costa 0,4 € a cittadino', '-15% power use, costs €0.4 per citizen'), cost: 0.4 },
  { id: 'speed', n: () => L('Limite di velocità', 'Speed limits'), d: () => L('Meno incidenti e rumore, auto più lente', 'Fewer accidents and noise, slower cars'), cost: 0 },
  { id: 'hightech', n: () => L('Case ad alta tecnologia', 'High-tech housing'), d: () => L('+valore del terreno, costa 0,5 € a cittadino', '+land value, costs €0.5 per citizen'), cost: 0.5 },
  { id: 'curfew', n: () => L('Industria silenziosa di notte', 'Quiet industry at night'), d: () => L('-30% rumore industriale, -8% produzione', '-30% industrial noise, -8% production'), cost: 0 },
];
function newState(o) {
  return {
    v: 1, treeV: 1, pgV: 1, mapV: 2, name: o.name || 'Nuova Città', seed: o.seed, money: o.unlimited ? 1e9 : 500000, time: 3 * 24 + 7, speed: 1,
    tax: { R: 10, C: 10, I: 10, O: 10 }, budget: Object.fromEntries(Object.keys(CAT).map(k => [k, 100])),
    loans: [], map: MAPS[o.map] ? o.map : 'valley', opts: { unlimited: !!o.unlimited, unlockAll: !!o.unlockAll, disasters: !!o.disasters, leftHand: !!o.leftHand, theme: o.theme === 'us' ? 'us' : 'eu', climate: CLIM[o.climate] ? o.climate : (MAPS[o.map]?.clim || 'temp'), south: !!o.south }, ms: 0, dev: 0, upg: [], policies: {}, trade: true,
    districts: [], hist: [], lastBudget: null, feed: [], casualties: 0,
  };
}
const stats = { fillRatio: 1, commuters: 0, congestion: 0, hhCap: 0, jobsC: 0, jobsI: 0, jobsO: 0, eduAvg: 0, pop: 0, hh: 0, workforce: 0, jobs: 0, filled: 0, unemp: 0, happy: 60, edu: [0, 0, 0, 0], sick: 0, dead: 0, crime: 0, tourists: 0, riders: 0, transitShare: 0, accidents: 0, garb: 0, demand: { R: 70, C: 20, I: 50, O: 0 }, fac: {}, ages: [0.22, 0.1, 0.53, 0.15], births: 0, deaths: 0, goodsP: 0, goodsC: 0, lv: 0, attr: 0 };
const distGrid = new Uint8Array(G * G);
const AIR = new Float32Array(G * G), GROUND = new Float32Array(G * G), NOIS = new Float32Array(G * G), WPOL = new Float32Array(G * G), LV = new Float32Array(G * G), COAST = new Float32Array(G * G);
function computeCoast() {
  const wat = new Uint8Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) wat[j * G + i] = getH(-HALF + (i + 0.5) * GC, -HALF + (j + 0.5) * GC) < 0 ? 1 : 0;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { let m = 0; for (let b = -4; b <= 4; b++) for (let a = -4; a <= 4; a++) { const x = i + a, z = j + b; if (x >= 0 && z >= 0 && x < G && z < G && wat[z * G + x]) m = Math.max(m, 1 - Math.hypot(a, b) / 5); } COAST[j * G + i] = wat[j * G + i] ? 0 : m; }
}
const waterPollAt = (x, z) => WPOL[gIdx(x, z)];
// ---------- tempo, giorno/notte, stagioni, meteo ----------
const WEATHER = { kind: 'clear', wind: 0.5, windDir: 0.8, temp: 18, next: 6, snowRoad: false, snow: 0 };
let sunUp = 1, nightAmt = 0;
function seasonInfo() { const m = Math.floor(S.time / 24) % 12; return { m, winter: m === 11 || m <= 1, summer: m >= 5 && m <= 7, name: [L('Inverno', 'Winter'), L('Primavera', 'Spring'), L('Estate', 'Summer'), L('Autunno', 'Autumn')][m === 11 || m <= 1 ? 0 : m <= 4 ? 1 : m <= 7 ? 2 : 3] }; }
function updateWeather() {
  const se = seasonInfo();
  WEATHER.next = S.time + 4 + rand() * 8;
  const r = rand();
  if (se.winter) WEATHER.kind = r < 0.35 ? 'snow' : r < 0.6 ? 'cloudy' : r < 0.72 ? 'fog' : 'clear';
  else if (se.summer) WEATHER.kind = r < 0.65 ? 'clear' : r < 0.8 ? 'cloudy' : r < 0.92 ? 'storm' : 'rain';
  else WEATHER.kind = r < 0.4 ? 'clear' : r < 0.62 ? 'cloudy' : r < 0.85 ? 'rain' : r < 0.93 ? 'fog' : 'storm';
  WEATHER.wind = clamp(WEATHER.wind + (rand() - 0.5) * 0.5 + (WEATHER.kind === 'storm' ? 0.4 : 0), 0.05, 1);
  WEATHER.windDir += (rand() - 0.5) * 0.9;
  WEATHER.temp = [3, 5, 10, 14, 19, 24, 28, 27, 22, 16, 9, 4][se.m] + (MAPS[MAPID]?.temp || 0) + (rand() - 0.5) * 6 + (WEATHER.kind === 'clear' ? 2 : -2);
}
function weatherIcon() { return { clear: nightAmt > 0.5 ? '🌙' : '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', fog: '🌫️', snow: '🌨️' }[WEATHER.kind]; }
function weatherName() { return { clear: L('Sereno', 'Clear'), cloudy: L('Nuvoloso', 'Cloudy'), rain: L('Pioggia', 'Rain'), storm: L('Temporale', 'Storm'), fog: L('Nebbia', 'Fog'), snow: L('Neve', 'Snow') }[WEATHER.kind]; }
const _skyDay = new THREE.Color(0x3d7bd0), _skyNight = new THREE.Color(0x050a18), _horDay = new THREE.Color(0xbcd6ec), _horNight = new THREE.Color(0x0d1426), _horSet = new THREE.Color(0xe8a070), _grey = new THREE.Color(0x8a96a3);
const _treeCol = new THREE.Color(), _snowCol = new THREE.Color(2.4, 2.45, 2.55);
function updateSky() {
  const hour = S.time % 24, se = seasonInfo();
  // alberi: verdi d'estate, arancioni in autunno, bianchi con la neve
  if (WEATHER.snow > 0.35 && !SET.noSnow) _treeCol.setRGB(1.5, 1.55, 1.65); else _treeCol.setHex( (se.m >= 8 && se.m <= 10) ? [0xffd890, 0xffb070, 0xd89a70][se.m - 8] : 0xffffff); treeMat.color.lerp(_treeCol, 0.05);
  const maxEl = se.summer ? 1.15 : se.winter ? 0.62 : 0.9;
  const dayLen = dayLenFor(se), rise = 12 - dayLen / 2;
  const t = (hour - rise) / dayLen; const el = Math.sin(clamp(t, -0.2, 1.2) * Math.PI) * maxEl;
  sunUp = clamp(el * 2, 0, 1); nightAmt = clamp(1 - (el + 0.12) * 5, 0, 1);
  const az = lerp(-1.6, 1.6, clamp(t, 0, 1));
  const sd = new THREE.Vector3(Math.sin(az) * Math.cos(Math.max(el, 0.02)), Math.sin(Math.max(el, -0.3)), Math.cos(az) * Math.cos(Math.max(el, 0.02)) * 0.5 - 0.4).normalize();
  sun.position.set(cam.tx + sd.x * 3000, sd.y * 3000, cam.tz + sd.z * 3000); sun.target.position.set(cam.tx, 0, cam.tz);
  const bad = WEATHER.kind === 'rain' || WEATHER.kind === 'storm' || WEATHER.kind === 'snow' ? 0.6 : WEATHER.kind === 'cloudy' || WEATHER.kind === 'fog' ? 0.35 : 0;
  sun.intensity = sunUp * 0.95 * (1 - bad * 0.7);
  hemi.intensity = lerp(0.12, 0.68, 1 - nightAmt) * (1 - bad * 0.25);
  hemi.color.setHex(0xdfeeff).lerp(new THREE.Color(0x4a5a8a), nightAmt);
  const setAmt = clamp(1 - Math.abs(el) * 6, 0, 1) * (1 - bad);
  skyU.uTop.value.copy(_skyDay).lerp(_skyNight, nightAmt).lerp(_grey.clone().multiplyScalar(1 - nightAmt * 0.8), bad * 0.8);
  skyU.uHor.value.copy(_horDay).lerp(_horSet, setAmt * 0.7).lerp(_horNight, nightAmt).lerp(_grey.clone().multiplyScalar(1 - nightAmt * 0.8), bad * 0.7);
  skyU.uSun.value.copy(sd); skyU.uSunCol.value.setRGB(1, 0.85 - setAmt * 0.3, 0.6 - setAmt * 0.3).multiplyScalar(1 - bad);
  scene.fog.color.copy(skyU.uHor.value);
  const fogK = WEATHER.kind === 'fog' ? 0.12 : WEATHER.kind === 'rain' || WEATHER.kind === 'snow' ? 0.4 : WEATHER.kind === 'storm' ? 0.3 : 1;
  { const fd = typeof cam !== 'undefined' ? cam.dist : 0, base = 2500 * fogK + 200; scene.fog.near = Math.max(base, fd * 1.6); scene.fog.far = Math.max(24000 * fogK + 1500, fd * 1.6 + Math.max(30000, fd * 2) * Math.max(fogK, 0.5)); } // da lontano niente nebbia
  stars.material.opacity = nightAmt * (1 - bad);
  bldU.uNight.value = clamp(nightAmt * 1.3 + bad * 0.15, 0, 1);
  WEATHER.snow = lerp(WEATHER.snow, se.winter && (WEATHER.kind === 'snow' || WEATHER.snow > 0.3) ? 1 : se.winter ? WEATHER.snow : 0, 0.002);
  if (!se.winter) WEATHER.snow = Math.max(0, WEATHER.snow - 0.004);
  terrU.uSnow.value = SET.noSnow ? 0 : WEATHER.snow; terrU.uTime.value = performance.now() / 1000; terrU.uCloud.value = lerp(terrU.uCloud.value, WEATHER.kind === 'clear' ? 0.13 : WEATHER.kind === 'fog' ? 0 : 0.3, 0.01) * (1 - nightAmt * 0.8);
  cellMat.color.setScalar(1 - nightAmt * 0.65);
  WEATHER.snowRoad = WEATHER.snow > 0.5 && !maintCovers();
  // neve vera: strade bianche se non passano gli spazzaneve
  { const k = SET.noSnow ? 0 : WEATHER.snow * (WEATHER.snowRoad ? 0.75 : 0.18); if (Math.abs((updateSky.rk ?? -1) - k) > 0.01) { updateSky.rk = k; for (const t in roadMats) roadMats[t].color.setScalar(1).lerp(_snowCol, k); } }
}
function maintCovers() { return [...svcs.values()].some(s => s.type === 'maint' && s.on); }
// pioggia e neve vicino alla telecamera
const precipGeo = new THREE.BufferGeometry(); { const a = new Float32Array(6000 * 3); for (let i = 0; i < a.length; i++) a[i] = (rand() - 0.5) * 2; precipGeo.setAttribute('position', new THREE.BufferAttribute(a, 3)); }
const precip = new THREE.Points(precipGeo, new THREE.PointsMaterial({ color: 0xcfd8e6, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6, depthWrite: false }));
precip.frustumCulled = false; scene.add(precip);
let precipT = 0;
function updatePrecip(dt) {
  const k = WEATHER.kind, on = k === 'rain' || k === 'storm' || k === 'snow';
  precip.visible = on && cam.dist < 3000;
  if (!precip.visible) return;
  precipT += dt * (k === 'snow' ? 0.15 : 1.2);
  const R = Math.min(cam.dist, 800) + 100;
  precip.scale.set(R, R * 0.6, R);
  precip.position.set(camera.position.x, camera.position.y - R * 0.3 - ((precipT * R * 0.6) % (R * 1.2)) + R * 0.6, camera.position.z);
  precip.material.color.setHex(k === 'snow' ? 0xffffff : 0xa8b8cc); precip.material.size = k === 'snow' ? 3 : 1.5;
}
// ---------- fumo dalle ciminiere ----------
const CHIMNEY = { coal: [1 / 3, 1 / 4, 70], gas: [1 / 3, 1 / 4, 50], incin: [1 / 3, 1 / 4, 45], ironpress: [1 / 3, 1 / 4, 30], cremat: [1 / 4, 0, 20] };
const SMN = 600, smokeGeo = new THREE.BufferGeometry(), smokeA = new Float32Array(SMN * 3).fill(-9999); smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokeA, 3));
const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ color: 0x8e8e8c, size: 42, map: smokeTex, transparent: true, opacity: 0.5, depthWrite: false }));
smoke.frustumCulled = false; scene.add(smoke);
const smokeP = []; let smokeI = 0, smokeT = 0;
function updateSmoke(dt) {
  smokeT += dt;
  smokeT = Math.min(smokeT, 1); while (smokeT > 0.25 && cam.dist < 4000) { smokeT -= 0.25;
    for (const sv of svcs.values()) { const c = CHIMNEY[sv.type]; if (!c || !sv.on || Math.abs(sv.x - cam.tx) > 3000 || Math.abs(sv.z - cam.tz) > 3000) continue;
      const a = sv.w * c[0], b = sv.d * c[1], x = sv.x + Math.sin(sv.ang) * b + Math.cos(sv.ang) * a, z = sv.z + Math.cos(sv.ang) * b - Math.sin(sv.ang) * a;
      smokeP[smokeI] = { x, y: sv.y + c[2] + 2, z, t: 0 }; smokeI = (smokeI + 1) % SMN; } }
  const wx = Math.cos(WEATHER.windDir) * (2 + WEATHER.wind * 10), wz = Math.sin(WEATHER.windDir) * (2 + WEATHER.wind * 10), sp = (S?.speed ? 1 : 0.3);
  for (let i = 0; i < SMN; i++) { const p = smokeP[i]; if (!p || p.t > 12) { smokeA[i * 3 + 1] = -9999; continue; } p.t += dt * sp; p.x += wx * dt * sp; p.z += wz * dt * sp; p.y += 5 * dt * sp; smokeA[i * 3] = p.x; smokeA[i * 3 + 1] = p.y; smokeA[i * 3 + 2] = p.z; }
  smokeGeo.attributes.position.needsUpdate = true;
}
// ---------- simulazione principale ----------
let tickCount = 0, simAcc = 0;
function simTick() {
  tickCount++;
  growBuildings();
  const arr = [...buildings.values()]; const n = arr.length;
  const from = Math.floor((tickCount % 10) / 10 * n), to = Math.floor(((tickCount % 10) + 1) / 10 * n);
  for (let i = from; i < to; i++) updateBuilding(arr[i]);
  updateFires();
  if (tickCount % 10 === 0) hourly();
  if (S.time >= WEATHER.next) updateWeather();
}
function hourly() {
  if (netDirty || tickCount % 30 === 0) computeNetworks(); else computeNetworks();
  computeCoverage(); computeRidership();
  computeGrids(); computeStats(); computeDemand(); refreshLists();
  dispatchServices();
  for (const e of edgesAll()) e.flow *= 0.6;
  feedTick();
  if (Math.floor(S.time / 24) !== S.lastDay) { S.lastDay = Math.floor(S.time / 24); monthly(); }
  const fr = S.time % 24;
  // treni da fuori, navi e aerei
  for (const sv of svcs.values()) {
    if (!sv.on) continue;
    if ((SV[sv.type].port || sv.type === 'harbor') && sv.dock && ships.filter(s => s.sv === sv.id).length < (SV[sv.type].port || 2) + (sv.ext.includes('wh') ? 1 : 0) + (sv.ext.includes('crane') ? 1 : 0) && rand() < 0.5) spawnShip(sv, !!SV[sv.type].port);
    if (sv.type === 'harbor' && sv.dock && !ships.some(s => s.cruise) && rand() < 0.04) spawnShip(sv, false, true);
    if ((sv.type === 'airport' || sv.type === 'airport2') && planes.filter(p => p.sv === sv.id).length < (sv.type === 'airport2' ? 4 : 2) && rand() < 0.5) spawnPlane(sv);
  }
  if (rand() < 0.5) spawnIntercity();
  if (S.time > 2 && fr > 0.9 && fr < 1.1 && autosaveOn) autosave();
}
function* edgesAllGen() { for (const s of segs.values()) for (const e of s.edges) yield e; }
function edgesAll() { return edgesAllGen(); }
// nascita di nuovi edifici
function growBuildings() {
  const dem = stats.demand;
  let tries = 60 + Math.floor(cells.length / 400);
  let spawned = 0, maxSp = 1 + Math.floor(stats.pop / 4000);
  const vacR = stats.hhCap > 0 && stats.hh / stats.hhCap < 0.8;
  const noWorkers = stats.jobs > 80 && stats.fillRatio < 0.8;
  while (tries-- > 0 && spawned < maxSp) {
    const c = cells[Math.floor(rand() * cells.length)];
    if (!c || !c.zone || c.b || c.d !== 0) continue;
    const z = ZT[c.zone], k = z.k;
    let d = k === 'M' ? Math.max(dem.R, dem.C) : dem[k];
    if ((k === 'R' || k === 'M') && vacR) continue;
    if (k !== 'R' && k !== 'M' && noWorkers) continue;
    if (rand() * 100 > d || rand() > 0.5) continue;
    const s = segs.get(c.seg); if (!s) continue;
    if (trySpawn(c)) spawned++;
  }
}
function updateBuilding(b) {
  if (b.ruin) { b.ruinT = (b.ruinT || 0) + 1; if (b.ruinT > 120) destroyBuilding(b); return; }
  if (b.cons > 0) { b.cons--; if (b.cons <= 0) { drawBuilding(b); S.bxp = (S.bxp || 0) + 3; } else return; }
  const z = ZT[b.zone], cov = b.cov || {}, k = gIdx(b.x, b.z);
  const air = AIR[k], gr = GROUND[k], no = NOIS[k], lv = LV[k];
  const people = b.hh ? (b.res || 0) : (b.wk || 0);
  // servizi di base
  if (!b.pow) b.noPow++; else b.noPow = 0;
  if (!b.wat) b.noWat++; else b.noWat = 0;
  // rifiuti, criminalità, malattie
  b.garb += (people * 0.006 + (z.k === 'I' ? 0.25 : 0.06)) * (S.policies.recycle ? 0.8 : 1) * (1.12 - 0.06 * b.level);
  b.garb = Math.max(0, b.garb - (cov.garb || 0) * (UPG.has('garb1') ? 1.3 : 1) * (b.garb * 0.5 + 6));
  b.crime = clamp(b.crime + 0.04 + stats.pop / 400000 + stats.unemp * 0.8 - (cov.police || 0) * (UPG.has('pol1') ? 3 : 2.4) - (cov.welfare || 0) * 1.2 - ([...svcs.values()].some(s => s.type === 'prison') ? 0.3 : 0), 0, 100);
  const sickRisk = (air * 0.004 + gr * 0.005 + (b.polWater || 0) * 0.002 + 0.0015) * (S.policies.smoke ? 0.7 : 1) * (UPG.has('hea1') ? 0.7 : 1);
  if (b.hh && rand() < sickRisk) b.sick++;
  if ((cov.health || 0) > 0.2 && b.sick > 0 && rand() < cov.health) b.sick--;
  b.sick = Math.min(b.sick, Math.max(1, Math.round(people * 0.3)));
  if ((cov.death || 0) > 0.2 && b.dead > 0 && rand() < cov.death * 0.6) { b.dead--; deathcareFill(b); }
  // istruzione
  if (b.hh) { const t = clamp((cov.edu1 || 0) * 0.45 + (cov.edu2 || 0) * 0.3 + (cov.edu3 || 0) * 0.25, 0, 1); b.edu = lerp(b.edu, t, 0.01 * (UPG.has('edu1') ? 1.5 : 1)); }
  // felicità con i suoi motivi
  const f = {};
  f.pow = b.pow ? 0 : -25; f.wat = b.wat ? 0 : -25; f.sew = b.sew ? 0 : -12;
  f.health = (cov.health || 0) * 8 - (b.sick > 0 && !(cov.health > 0.2) ? 5 : 0);
  f.police = (cov.police || 0) * 6 - b.crime * 0.12 + (cov.welfare || 0) * (z.cheap ? 5 : 2);
  f.fire = (cov.fire || 0) * 4;
  f.edu = b.hh ? ((cov.edu1 || 0) + (cov.edu2 || 0) + (cov.edu3 || 0) * 0.5) * 3 : 0;
  f.park = Math.min(cov.park || 0, 12) * (0.7 + 0.35 * Math.min(1, cov.pmaint || 0));
  f.transit = (cov.transit || 0) * 3 + (cov.net || 0) * 3;
  f.mail = (cov.mail || 0) * 3 - (stats.pop > 3000 && !(cov.mail > 0.2) ? 3 : 0);
  f.pollution = -(air * 0.35 + gr * 0.5 + no * 0.25) - (b.polWater || 0) * 20;
  f.garbage = b.garb > 80 ? -10 : b.garb > 40 ? -4 : 0;
  f.taxes = -((b.hh ? rTaxFor(b) : taxEff(z.k === 'M' ? 'R' : z.k)) - 10) * 1.6 - (b.hh ? feeMood() : 0);
  if (S.policies.paidpark && z.k === 'C') f.taxes -= 2;
  f.work = b.hh ? -stats.unemp * 35 : 0;
  f.death = b.dead > 0 ? -8 : 0;
  f.lv = lv * 0.08 + (S.policies.hightech ? 3 : 0) + (S.policies.smoke ? -1 : 0);
  f.traffic = -(stats.congestion || 0) * 6 - ((z.k === 'C' || z.k === 'O') && stats.pop > 1500 ? (1 - Math.min(1, cov.parking || 0)) * 3 : 0);
  let h = 58; for (const kk in f) h += f[kk];
  b.fac = f; b.happy = lerp(b.happy, clamp(h, 0, 100), 0.3);
  // abitanti e lavoratori
  if (b.aband) {
    if (b.occ || b.wk) popEvict(b, 'move');
    if (b.pow && b.wat && b.happy > 40) { b.abT = (b.abT || 0) + 1; if (b.abT > 20) { b.aband = 0; b.abT = 0; tintParts(b); } }
    return;
  }
  // persone vere: arrivano da fuori, se ne vanno, vengono assunte (25-popolazione.js)
  popBuilding(b);
  // abbandono
  if (b.noPow > 60 || b.noWat > 60 || b.garb > 200 || (b.happy < 10 && b.occ > 0 && rand() < 0.1)) { popEvict(b, 'move'); b.aband = 1; b.occ = 0; tintParts(b, 0x5a524a); addFeed('aband', b); return; }
  // salita di livello
  const maxL = { 1: 5, 2: 5, 3: 5, 4: 3, 10: 5, 5: 3, 6: 5, 7: 5, 8: 3, 9: 1, 11: 3 }[zl(b.zone)];
  const score = lv * 0.6 + b.happy * 0.5 + (b.hh ? b.edu * 20 : 0) + (cov.park || 0);
  const need = [0, 45, 58, 70, 82][b.level] || 999;
  if (b.level < maxL && score > need && b.pow && b.wat && b.occ >= (b.hh || b.jobs) * 0.7) { b.lvlT += UPG.has('zon1') ? 1.6 : 1; if (b.lvlT > 30) { b.lvlT = 0; levelUp(b); } }
  else b.lvlT = Math.max(0, b.lvlT - 0.5);
  // incendi
  if (!b.fire && rand() < 0.00008 * (1.5 - (cov.fire || 0)) * (UPG.has('fir1') ? 0.5 : 1) * (z.k === 'I' ? 2 : 1)) startFire(b);
}
function deathcareFill(b) {
  let best = null, bd = 1e18;
  for (const sv of svcs.values()) if (sv.type === 'cemetery' && sv.fill < svStore(sv)) { const d = dist2(sv.x, sv.z, b.x, b.z); if (d < bd) { bd = d; best = sv; } }
  if (best) best.fill++;
}
// ---------- incendi ----------
const burning = new Set();
function startFire(b) { if (b.ruin || b.fire) return; b.fire = 0.01; burning.add(b); b.fireSent = false; addFeed('fire', b); }
function updateFires() {
  for (const b of burning) {
    if (!buildings.has(b.id)) { burning.delete(b); continue; }
    b.fire += 0.1;
    if (!b.fireSent && (b.cov?.fire || 0) > 0.15) {
      b.fireSent = true;
      let best = null, bd = 1e18; for (const sv of svcs.values()) if ((sv.type === 'fire' || sv.type === 'firehq') && sv.on) { const d = dist2(sv.x, sv.z, b.x, b.z); if (d < bd) { bd = d; best = sv; } }
      if (best && !dispatch(best, 'fire', b, () => { if (b.fire) { b.fire = 0; burning.delete(b); tintParts(b); } })) b.fireAuto = true;
      else if (!best) b.fireAuto = true;
    }
    if (b.fireAuto && b.fire > 0.8 && (b.cov?.fire || 0) > 0.3) { b.fire = 0; burning.delete(b); tintParts(b); continue; }
    if (rand() < 0.006) bldNear(b.x, b.z, 18, o => { if (o !== b && !o.fire && rand() < 0.25) startFire(o); });
    if (b.fire > 3) { burning.delete(b); b.fire = 0; ruinBuilding(b); }
  }
}
function ruinBuilding(b) { popEvict(b, 'ruin'); b.ruin = 1; b.occ = 0; b.ruinT = 0; drawBuilding(b); }
const firePts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xff7a20, size: 9, transparent: true, opacity: 0.9, depthWrite: false }));
firePts.frustumCulled = false; scene.add(firePts);
function drawFires() {
  const a = [];
  for (const b of burning) for (let i = 0; i < 14; i++) a.push(b.x + (rand() - 0.5) * b.cw * 7, b.y + b.h * rand() * 1.1 + 2, b.z + (rand() - 0.5) * 8);
  for (const t of tornados) for (let i = 0; i < 60; i++) { const h = rand() * 160, r = 6 + h * 0.25, an = rand() * 6.28; a.push(t.x + Math.cos(an) * r, getH(t.x, t.z) + h, t.z + Math.sin(an) * r); }
  firePts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
  firePts.material.color.setHex(tornados.length && !burning.size ? 0x8a8a8a : 0xff7a20);
  for (const b of burning) { const fl = 0.6 + Math.sin(simClock * 9 + b.id) * 0.3; tintParts(b, new THREE.Color(1, 0.3 * fl, 0.1).getHex()); }
}
// ---------- servizi con mezzi veri ----------
function dispatchServices() {
  let budget = 6;
  for (const sv of svcs.values()) {
    if (!sv.on || budget <= 0) continue; const d = SV[sv.type]; if (!d.veh || !d.r) continue;
    if (rand() > 0.35) continue;
    let target = null, best = 0;
    bldNear(sv.x, sv.z, d.r, b => {
      let need = 0;
      if (d.veh === 'garbage') need = b.garb; else if (d.veh === 'ambulance') need = b.sick * 30; else if (d.veh === 'hearse') need = b.dead * 40; else if (d.veh === 'police') need = b.crime; else if (d.veh === 'van') need = b.occ > 0 ? 12 + rand() * 20 : 0; else if (d.veh === 'maint') need = WEATHER.snowRoad ? 50 : rand() * 10;
      need *= 0.5 + rand();
      if (need > best) { best = need; target = b; }
    });
    if (!target || best < 20) continue;
    budget--;
    const b = target;
    dispatch(sv, d.veh, b, () => {
      if (d.veh === 'garbage') { const g = b.garb; b.garb = 0; if (sv.type === 'landfill') sv.fill += g; }
      if (d.veh === 'ambulance') b.sick = 0;
      if (d.veh === 'hearse') { b.dead = 0; if (sv.type === 'cemetery') sv.fill += 1; }
      if (d.veh === 'police') b.crime *= 0.5;
    });
  }
  for (const sv of svcs.values()) if (sv.type === 'landfill' && Math.floor(sv.fill / 5000) !== sv.lastFillDraw) { sv.lastFillDraw = Math.floor(sv.fill / 5000); drawSvc(sv); }
  // taxi
  taxiHour();
}
// ---------- griglie: inquinamento e valore del terreno ----------
// zona attiva della simulazione: le caselle comprate più un margine (la mappa è enorme, si calcola solo qui)
const ACT = { i0: 0, j0: 0, i1: G - 1, j1: G - 1 };
function actWin() {
  let a = NT, b = -1, c = NT, d = -1; for (let i = 0; i < NT * NT; i++) if (TILES[i]) { const x = i % NT, z = (i / NT) | 0; if (x < a) a = x; if (x > b) b = x; if (z < c) c = z; if (z > d) d = z; }
  if (b < 0) { a = b = c = d = NT / 2; }
  const m = 1500;
  ACT.i0 = clamp(Math.floor((-HALF + a * TILE - m + HALF) / GC), 0, G - 1); ACT.i1 = clamp(Math.ceil((-HALF + (b + 1) * TILE + m + HALF) / GC), 0, G - 1);
  ACT.j0 = clamp(Math.floor((-HALF + c * TILE - m + HALF) / GC), 0, G - 1); ACT.j1 = clamp(Math.ceil((-HALF + (d + 1) * TILE + m + HALF) / GC), 0, G - 1);
  return ACT;
}
const _gt = new Float32Array(G * G), _airS = new Float32Array(G * G), _noiseS = new Float32Array(G * G), _na = new Float32Array(G * G);
function blur(a, n) { const W = ACT, t = _gt; for (let it = 0; it < n; it++) { for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0; i <= W.i1; i++) { let s = 0, c = 0; for (let b = -1; b <= 1; b++) for (let q = -1; q <= 1; q++) { const x = i + q, z = j + b; if (x >= 0 && z >= 0 && x < G && z < G) { s += a[z * G + x]; c++; } } t[j * G + i] = s / c; } for (let j = W.j0; j <= W.j1; j++) { const o = j * G; a.set(t.subarray(o + W.i0, o + W.i1 + 1), o + W.i0); } } }
function computeGrids() {
  const W = actWin(), airS = _airS, noiseS = _noiseS; airS.fill(0); noiseS.fill(0);
  const filt = (UPG.has('ind1') ? 0.7 : 1) * (S.policies.advpol ? 0.75 : 1), cur = S.policies.curfew && (S.time % 24 < 6 || S.time % 24 > 22) ? 0.7 : 1;
  for (const b of buildings.values()) {
    if (b.ruin) continue; const k = gIdx(b.x, b.z), z = ZT[b.zone];
    const act = b.aband ? 0.2 : clamp(b.occ / Math.max(1, b.jobs || b.hh), 0.2, 1);
    if (z.k === 'I') { if (!b.spec) { airS[k] += 2.2 * b.cw * act * filt; GROUND[k] += 0.05 * b.cw * act; } else if (b.spec === 'oil' || b.spec === 'ore') GROUND[k] += 0.08 * act; noiseS[k] += 3 * act * cur; }
    if (z.k === 'C') noiseS[k] += 1.2; if (z.k === 'O') noiseS[k] += 0.4;
  }
  for (const sv of svcs.values()) { if (!sv.on) continue; const d = SV[sv.type], k = gIdx(sv.x, sv.z); if (d.air) airS[k] += d.air * filt; if (d.ground) GROUND[k] += d.ground * 0.02; if (d.noise) noiseS[k] += d.noise; }
  gridHook(airS, noiseS, filt);
  for (const s of segs.values()) { const rt = RT[s.type]; if (rt.ped) continue; let f = 0; for (const e of s.edges) f += e.flow; const m = s.pts[s.pts.length >> 1]; const k = gIdx(m.x, m.z); noiseS[k] += ((rt.hw && s.type !== 'ramp' ? (S.policies.hwfree ? 2.6 : 2) : rt.rail ? 1 : 0.2) + f * 0.08 * (S.policies.nocomb && !rt.rail ? 0.6 : 1) * (S.policies.bumps && (s.type === 'small' || s.type === 'gravel') ? 0.6 : 1) * (UPG.has('tra1') ? 0.7 : 1) * (S.policies.speed ? 0.8 : 1)) * (s.barrier ? 0.3 : 1); }
  // aria: si sposta col vento e si allarga
  const wx = Math.cos(WEATHER.windDir) * WEATHER.wind, wz = Math.sin(WEATHER.windDir) * WEATHER.wind;
  const na = _na;
  for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0; i <= W.i1; i++) { const si = clamp(Math.round(i - wx * 1.5), 0, G - 1), sj = clamp(Math.round(j - wz * 1.5), 0, G - 1); na[j * G + i] = AIR[sj * G + si] * 0.72 + airS[j * G + i] * 6; }
  const eachW = f => { for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0, k = j * G + W.i0; i <= W.i1; i++, k++) f(k, i, j); };
  eachW(k => { AIR[k] = na[k]; }); blur(AIR, 2);
  eachW(k => { AIR[k] = Math.min(AIR[k], 100); GROUND[k] = Math.min(GROUND[k] * 0.999, 100); NOIS[k] = noiseS[k] * 8; }); blur(NOIS, 2); eachW(k => { NOIS[k] = Math.min(NOIS[k], 100); });
  // acqua: gli scarichi sporcano, il fiume porta verso sud, il mare diluisce
  for (const sv of svcs.values()) { const d = SV[sv.type]; if (!d.wpol || !sv.on) continue; const fx = Math.sin(sv.ang), fz = Math.cos(sv.ang); const k = gIdx(sv.x + fx * sv.d, sv.z + fz * sv.d); const use = NET.citySew.use / Math.max(1, NET.citySew.prod); WPOL[k] = Math.min(100, WPOL[k] + 40 * d.wpol * clamp(use, 0.2, 1.5)); }
  const nw = _gt;
  for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0; i <= W.i1; i++) {
    const k = j * G + i; const x = -HALF + (i + 0.5) * GC, z = -HALF + (j + 0.5) * GC; if (getH(x, z) > 0) { nw[k] = 0; continue; }
    let s = WPOL[k] * 0.5, c = 0.5;
    for (const [a, b, wgt] of [[0, -1, 1.6], [1, 0, 0.6], [-1, 0, 0.6], [0, 1, 0.3]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= G || jj >= G) continue; const kk = jj * G + ii; if (getH(-HALF + (ii + 0.5) * GC, -HALF + (jj + 0.5) * GC) > 0) continue; s += WPOL[kk] * wgt * 0.25; c += wgt * 0.25; }
    nw[k] = s / c * 0.985;
  }
  eachW(k => { WPOL[k] = nw[k]; });
  // valore del terreno
  eachW(k => { LV[k] = 12 + COAST[k] * 18; });
  const stamp = (x, z, r, v) => { const ci = Math.floor((x + HALF) / GC), cj = Math.floor((z + HALF) / GC), rr = Math.ceil(r / GC); for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= G || j >= G) continue; const d = Math.hypot((i - ci) * GC, (j - cj) * GC); if (d < r) LV[j * G + i] += v * (1 - d / r); } };
  for (const sv of svcs.values()) { if (!sv.on) continue; const d = SV[sv.type]; if (d.park) stamp(sv.x, sv.z, d.r * 1.3, d.park * 2.2); else if (d.eff && d.eff !== 'death') stamp(sv.x, sv.z, d.r * 0.8, 6); if (d.attr) stamp(sv.x, sv.z, 900, d.attr); if (sv.type === 'landfill' || sv.type === 'outlet') stamp(sv.x, sv.z, 500, -15); }
  for (const b of buildings.values()) { const z = ZT[b.zone].k; if ((z === 'C' || z === 'O') && !b.aband) stamp(b.x, b.z, 260, 1.2 * b.level); }
  for (const ln of lines) if (ln.ok) for (const st of ln.stops) stamp(st.x, st.z, LK[ln.kind].catch, 5);
  const ht = S.policies.hightech ? 6 : 0; eachW(k => { LV[k] = clamp(LV[k] - AIR[k] * 0.4 - GROUND[k] * 0.6 - NOIS[k] * 0.2 + ht, 0, 100); });
  infoDirty = true;
}
// ---------- statistiche e domanda ----------
function computeStats() {
  let filled = 0, pop = 0, hh = 0, hhCap = 0, jobs = 0, jobsC = 0, jobsI = 0, jobsO = 0, happyS = 0, happyN = 0, sick = 0, dead = 0, crime = 0, garb = 0, eduS = 0, edu = [0, 0, 0, 0], prodI = 0, lvS = 0;
  const fac = {};
  for (const b of buildings.values()) {
    if (b.ruin) continue;
    if (b.hh) {
      const p = b.res || 0; pop += p; hh += b.occ; if (!b.aband) hhCap += b.hh;
      const e = b.edu; edu[e < 0.25 ? 0 : e < 0.5 ? 1 : e < 0.75 ? 2 : 3] += p; eduS += e * p;
      happyS += b.happy * p; happyN += p; sick += b.sick; dead += b.dead;
      if (b.fac) for (const k in b.fac) fac[k] = (fac[k] || 0) + b.fac[k] * p;
      lvS += LV[gIdx(b.x, b.z)] * p;
    }
    if (b.jobs && !b.aband) { filled += b.wk || 0; jobs += b.jobs; const k = ZT[b.zone].k; if (k === 'C' || k === 'M') jobsC += b.jobs; if (k === 'I') { jobsI += b.jobs; prodI += b.occ * (b.spec ? 1.3 : 1) * (S.policies.heavy ? 0.95 : 1) * (S.policies.curfew ? 0.92 : 1); } if (k === 'O') jobsO += b.jobs; }
    crime += b.crime; garb += b.garb;
  }
  // industria specializzata: materie prime prodotte e richieste dall'industria
  const raw = {}; for (const k of RAWK) raw[k] = { p: 0, n: 0 };
  for (const sv of svcs.values()) { const d = SV[sv.type]; if (!d.spec || !sv.on) continue; jobs += d.jobs; jobsI += d.jobs; jobFill(sv, -sv.id); filled += sv.wk || 0; sv.prod = Math.round(160 * clamp(sv.res ?? 0.5, 0, 1) * clamp(S.budget.spec / 100, 0.5, 1.5) * (0.6 + 0.4 * (sv.wk || 0) / Math.max(1, d.jobs))); raw[d.spec.prod].p += sv.prod; }
  for (const b of buildings.values()) if (b.spec && !b.ruin && !b.aband) raw[{ farm: 'food', forest: 'wood', oil: 'oil', ore: 'ore' }[b.spec]].p += b.occ * 1.5;
  for (const k of RAWK) raw[k].n = Math.round(prodI * RAWSH[k] * 0.8 + (k === 'food' ? pop * 0.03 : 0)); stats.raw = raw;
  const n = Math.max(1, buildings.size);
  stats.pop = Math.round(pop) + POP.hl; stats.hh = hh; stats.hhCap = hhCap; stats.jobs = jobs; stats.jobsC = jobsC; stats.jobsI = jobsI; stats.jobsO = jobsO;
  stats.happy = happyN ? happyS / happyN : 60; stats.sick = sick; stats.dead = dead; stats.crime = crime / n; stats.garb = garb;
  stats.eduAvg = pop ? eduS / pop : 0; stats.edu = edu; stats.lv = pop ? lvS / pop : 0;
  for (const k in fac) fac[k] /= Math.max(1, happyN); stats.fac = fac;
  // lavoratori veri: adulti che abitano qui, pendolari veri da fuori, disoccupati veri
  stats.workforce = POP.adults;
  const outside = outsideNodes().length > 0;
  stats.commuters = POP.comm;
  stats.fillRatio = jobs > 0 ? clamp(filled / jobs, 0, 1) : 1;
  stats.filled = filled;
  stats.unemp = POP.adults > 0 ? clamp(POP.unemp.size / POP.adults, 0, 1) : 0;
  stats.goodsP = prodI; stats.goodsC = jobsC * 0.7 + pop * 0.04;
  let cong = 0, ce = 0; for (const e of activeEdges) { if (e.rail || !e.lanes) continue; const c = e.cars.reduce((a, l) => a + l.length, 0) / (e.lanes * Math.max(e.len, 20) / 7); cong += clamp(c, 0, 1); ce++; }
  stats.congestion = ce ? cong / ce : 0;
  let attr = 0; for (const sv of svcs.values()) if (sv.on) attr += SV[sv.type].attr || 0;
  for (const b of buildings.values()) if (b.zone === 6 && COAST[gIdx(b.x, b.z)] > 0.3) attr += 0.3;
  stats.cruise = ships.filter(s => s.cruise && s.docked).length;
  stats.attr = attr;
  stats.tourists = Math.round(attr * 35 * (UPG.has('tour1') ? 1.25 : 1) * (outside ? 1 : 0.2) * (0.6 + stats.happy / 100)) + stats.cruise * 450 + (stats.icbM || 0) * 40;
  // età (lenta)
  // età vere degli abitanti (bambini <13, ragazzi <18, adulti <65, anziani)
  { const g = POP.ages, n = g[0] + g[1] + g[2] + g[3]; if (n) stats.ages = g.map(x => x / n); }
}
function computeDemand() {
  const p = stats.pop, d = stats.demand, t = { R: S.tax.R, C: taxEff('C'), I: taxEff('I'), O: S.tax.O };
  if (!buildings.size) { d.R = 80; d.C = 15; d.I = 55; d.O = 0; return; }
  const vac = stats.hhCap > 0 ? 1 - stats.hh / stats.hhCap : 0;
  const jobsFree = stats.jobs - stats.workforce;
  const W = d.why = {};
  W.R = [[L('Posti di lavoro liberi', 'Free jobs'), jobsFree / Math.max(60, p * 0.15) * 30], [L('Felicità', 'Happiness'), (stats.happy - 55) * 0.6], [L('Tasse', 'Taxes'), -(t.R - 10) * 4], [L('Case vuote', 'Empty homes'), -vac * 120], [L('Città piccola: tutti vogliono venire', 'Small town: everyone wants to come'), p < 400 ? 25 : 0]];
  d.R = clamp(40 + W.R.reduce((a, x) => a + x[1], 0), 0, 100);
  const needC = p * 0.16 + stats.tourists * 0.04;
  W.C = [[L('Clienti (abitanti e turisti)', 'Customers (residents and tourists)'), (needC - stats.jobsC) / Math.max(15, needC) * 90], [L('Tasse', 'Taxes'), -(t.C - 10) * 4], [L('Merci prodotte in città', 'Goods made in town'), stats.goodsP > stats.goodsC ? 5 : 0]];
  d.C = clamp(25 + W.C.reduce((a, x) => a + x[1], 0), 0, 100);
  const needI = p * 0.17 + stats.jobsC * 0.25 + 40;
  W.I = [[L('Merci richieste da negozi e abitanti', 'Goods wanted by shops and residents'), (needI - stats.jobsI) / Math.max(20, needI) * 80], [L('Tasse', 'Taxes'), -(t.I - 10) * 4], [L('Disoccupati in cerca di lavoro', 'Unemployed looking for work'), stats.unemp * 60]];
  d.I = clamp(30 + W.I.reduce((a, x) => a + x[1], 0), 0, 100);
  const eduW = stats.workforce * stats.eduAvg;
  const needO = eduW * 0.28 + ([...svcs.values()].some(s => s.type === 'antenna') ? 30 : 0);
  W.O = [[L('Lavoratori istruiti', 'Educated workers'), (needO - stats.jobsO) / Math.max(20, needO) * 90], [L('Tasse', 'Taxes'), -(t.O - 10) * 4]];
  d.O = clamp(W.O.reduce((a, x) => a + x[1], 0), 0, 100);
  if (stats.eduAvg < 0.2) { d.O = Math.min(d.O, 15); W.O.push([L('Troppo pochi laureati e diplomati', 'Too few graduates'), -1]); }
}
// ---------- economia mensile (un giorno di gioco = un mese) ----------
function budgetNow() {
  const inc = {}, exp = {};
  let rTax = 0, cTax = 0, iTax = 0, oTax = 0;
  const eco = UPG.has('eco1') ? 1.1 : 1;
  for (const b of buildings.values()) {
    if (b.ruin || b.aband) continue; const k = ZT[b.zone].k, lm = 0.8 + 0.2 * b.level;
    if (b.hh) rTax += (b.res || 0) * 1.25 * lm * (ZT[b.zone].cheap ? 0.6 : 1) * rTaxFor(b);
    if (b.jobs) { const w = (b.wk || 0) * lm; if (k === 'C' || k === 'M') cTax += w * 1.7; else if (k === 'I') iTax += w * (b.spec ? 1.7 : 1.4); else if (k === 'O') oTax += w * 2.3; }
  }
  inc.res = rTax; inc.com = cTax * taxEff('C') * eco; inc.ind = iTax * taxEff('I') * eco; inc.off = oTax * S.tax.O * eco;
  inc.tour = stats.tourists * 2.5;
  { const F = fees(); inc.fees = 0; for (const k in FEES) inc.fees += stats.pop * FEES[k][0] * F[k] / 100; }
  inc.subsidy = 1500 + S.ms * 1200; // contributo del governo, cresce coi traguardi
  inc.parking = [...svcs.values()].reduce((a, s) => a + (s.on && SV[s.type].eff === 'parking' ? SV[s.type].cap * 0.4 * (S.policies.paidpark ? 2 : 1) : 0), 0);
  inc.transit = S.policies.freeTransit ? 0 : lines.reduce((a, l) => a + l.riders * l.price * 4, 0);
  const tp = NET.trade.pow || 0, tw = NET.trade.wat || 0;
  inc.trade = (tp > 0 ? tp * 30 : 0) + (tw > 0 ? tw * 0.4 : 0);
  const surplus = stats.goodsP - stats.goodsC;
  const hub = [...svcs.values()].reduce((a, s) => a + (s.on && (SV[s.type].port || s.type === 'cargotrain' || s.type === 'transship' || s.type === 'dryport') ? (SV[s.type].port || 1) / (SV[s.type].port ? 2 : 1) + (s.ext.includes('customs') ? 0.6 : 0) + (s.ext.includes('yard') ? 0.3 : 0) + (s.ext.includes('tanks') ? 0.3 : 0) + (s.ext.includes('inter') ? 0.4 : 0) : 0), 0);
  let rawS = 0, rawD = 0; for (const k of RAWK) { const r = stats.raw?.[k]; if (!r) continue; if (r.p > r.n) rawS += r.p - r.n; else rawD += r.n - r.p; }
  inc.goods = (surplus > 0 ? surplus * 6 * (1 + hub * 0.2) : 0) + rawS * 5;
  exp.import = ([...svcs.values()].some(s => s.type === 'cityhall' && s.on) ? 0.8 : 1) * ((tp < 0 ? -tp * 45 : 0) + (tw < 0 ? -tw * 0.7 : 0) + ((NET.trade.sew || 0) < 0 ? -(NET.trade.sew) * 0.5 : 0) + (surplus < 0 ? -surplus * 4 : 0) + rawD * 6);
  exp.services = 0; const byCat = {};
  for (const sv of svcs.values()) { if (!sv.on) continue; const d = SV[sv.type]; const c = (d.upk + extUpk(sv)) * S.budget[d.cat] / 100; byCat[d.cat] = (byCat[d.cat] || 0) + c; exp.services += c; }
  exp.byCat = byCat;
  let roads = 0; for (const s of segs.values()) if (!s.pre) roads += s.len * RT[s.type].upk * (s.elev ? 2 : 1);
  exp.roads = roads;
  exp.lines = lines.reduce((a, l) => a + (l.ok || (!l.off && !lineRuns(l)) ? l.nveh * LK[l.kind].upk * lineMod(l).upk * (l.sched ? 0.7 : 1) : 0), 0) * S.budget.transport / 100;
  exp.loans = S.loans.reduce((a, l) => a + l.pay, 0);
  exp.policies = POLICIES.reduce((a, p) => a + (S.policies[p.id] ? p.cost * stats.pop : 0), 0);
  const ti = Object.keys(inc).reduce((a, k) => a + inc[k], 0);
  const te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + exp[k], 0);
  return { inc, exp, ti, te, net: ti - te };
}
function monthly() {
  const bg = budgetNow();
  S.lastBudget = bg;
  if (!S.opts.unlimited) S.money += bg.net;
  for (const l of S.loans) l.left--; S.loans = S.loans.filter(l => l.left > 0);
  S.hist.push({ t: Math.floor(S.time / 24), pop: stats.pop, money: Math.round(S.money), inc: Math.round(bg.ti), exp: Math.round(bg.te), happy: Math.round(stats.happy), unemp: Math.round(stats.unemp * 100), tour: stats.tourists, jobs: stats.jobs });
  if (S.hist.length > 120) S.hist.shift();
  // nascite e morti vere (i morti restano nelle case finché non arriva il carro funebre)
  popMonth();
  { const dp = stats.pop - (S.lastPopXP ?? stats.pop); if (dp > 0) { S.maxPop = Math.max(S.maxPop || 0, stats.pop); xpMsg('+' + fmtNum(dp) + ' XP ' + L('popolazione aumentata', 'population grew')); }
    const hp = Math.round(stats.happy), dh = hp - (S.maxHappyXP ?? hp); if (dh > 0) addXP(dh * 20, L('felicità dei cittadini aumentata', 'citizens happier'));
    S.lastPopXP = stats.pop; S.maxHappyXP = Math.max(S.maxHappyXP ?? hp, hp); }
  for (const sv of svcs.values()) if (SV[sv.type].cat === 'health' && SV[sv.type].cap) { sv.med = clamp((sv.med ?? 100) - (sv.load || 0) / Math.max(1, SV[sv.type].cap) * 25 + (sv.seg != null && outsideNodes().length ? 35 : 0), 0, 100); }
  checkMilestone(); checkSignature(); checkGoals();
  if (S.money < 0 && !S.opts.unlimited) addFeed('debt');
  refreshPanels();
}
// XP: la popolazione più alta raggiunta + i punti dati da ciò che si costruisce (fermate, parchi, monumenti...)
function addXP(n, why) { if (!S || !n) return; S.bxp = (S.bxp || 0) + n; xpMsg('+' + fmtNum(Math.round(n)) + ' XP ' + why); }
function cityXP() { S.maxPop = Math.max(S.maxPop || 0, stats.pop); return S.maxPop + (S.bxp || 0); }
const loanLimit = () => 60000 + S.ms * 90000;
// tassa sulla casa secondo l'istruzione di chi ci abita (si può anche andare sotto zero per attirare laureati)
// tasse per prodotto (negozi e industria) e tariffe dei servizi pagate dai cittadini
const TAXP = { C: ['food', 'clothes', 'electronics', 'furniture', 'fuel'], I: ['food', 'wood', 'metals', 'textiles', 'plastics'] };
const TAXPN = () => ({ food: L('Alimentari', 'Food'), clothes: L('Vestiti', 'Clothes'), electronics: L('Elettronica', 'Electronics'), furniture: L('Mobili', 'Furniture'), fuel: L('Carburante', 'Fuel'), wood: L('Legno', 'Timber'), metals: L('Metalli', 'Metals'), textiles: L('Tessuti', 'Textiles'), plastics: L('Plastica', 'Plastics') });
function taxP() { return S.taxP || (S.taxP = { C: Object.fromEntries(TAXP.C.map(k => [k, 0])), I: Object.fromEntries(TAXP.I.map(k => [k, 0])) }); }
function taxEff(k) { if (k !== 'C' && k !== 'I') return S.tax[k]; const P = taxP()[k], v = Object.values(P); return clamp(S.tax[k] + v.reduce((a, b) => a + b, 0) / v.length, -10, 30); }
const FEES = { power: [0.25, '⚡'], water: [0.2, '💧'], garbage: [0.12, '🗑️'], health: [0.1, '🏥'], edu: [0.08, '🎓'] };
function fees() { return S.fees || (S.fees = { power: 100, water: 100, garbage: 100, health: 100, edu: 100 }); }
function feeMood() { const F = fees(); let m = 0; for (const k in FEES) m += (F[k] - 100) / 100 * 2.2; return m; }
function rTaxFor(b) { const T = S.taxE || (S.taxE = { lo: 0, mid: 0, hi: 0 }); const e = b.edu || 0; return clamp(S.tax.R + (e < 0.33 ? T.lo : e < 0.66 ? T.mid : T.hi), -10, 30); }
function checkMilestone() {
  while (S.ms < MS.length - 1 && cityXP() >= MS[S.ms + 1].pop) {
    S.ms++;
    const bonus = 60000 + 40000 * S.ms; if (!S.opts.unlimited) S.money += bonus;
    S.dev += 2 + S.ms;
    showMilestone(S.ms, bonus, 2 + S.ms);
    addFeed('ms');
    buildToolbar();
  }
}
// obiettivi con la barra di avanzamento: danno XP quando li completi
const svcN = t => [...svcs.values()].filter(s => (Array.isArray(t) ? t.includes(s.type) : SV[s.type].cat === t) && s.on).length;
const GOALS = [
  { id: 'g_pop1', xp: 200, n: () => L('Arriva a 500 abitanti', 'Reach 500 citizens'), v: () => [stats.pop, 500] },
  { id: 'g_pow', xp: 100, n: () => L('Costruisci una centrale elettrica', 'Build a power plant'), v: () => [svcN('power'), 1] },
  { id: 'g_wat', xp: 100, n: () => L('Costruisci una pompa dell\'acqua e uno scarico', 'Build a water pump and a sewage outlet'), v: () => [Math.min(1, svcN(['pump', 'tower'])) + Math.min(1, svcN(['outlet', 'treat'])), 2] },
  { id: 'g_school', xp: 150, n: () => L('Costruisci una scuola', 'Build a school'), v: () => [svcN('edu'), 1] },
  { id: 'g_health', xp: 150, n: () => L('Costruisci un ambulatorio e un cimitero', 'Build a clinic and a cemetery'), v: () => [Math.min(1, svcN(['clinic', 'hospital'])) + Math.min(1, svcN(['cemetery', 'cremat'])), 2] },
  { id: 'g_safe', xp: 150, n: () => L('Costruisci polizia e pompieri', 'Build police and fire stations'), v: () => [Math.min(1, svcN('police')) + Math.min(1, svcN('fire')), 2] },
  { id: 'g_bus', xp: 200, n: () => L('Attiva una linea di autobus', 'Run a bus line'), v: () => [lines.filter(l => l.kind === 'bus' && l.ok).length, 1] },
  { id: 'g_tile', xp: 200, n: () => L('Compra una casella nuova', 'Buy a new tile'), v: () => [TILES.reduce((a, b) => a + b, 0) - 9, 1] },
  { id: 'g_pop2', xp: 500, n: () => L('Arriva a 2.000 abitanti', 'Reach 2,000 citizens'), v: () => [stats.pop, 2000] },
  { id: 'g_happy', xp: 400, n: () => L('Felicità sopra il 70%', 'Happiness above 70%'), v: () => [Math.round(stats.happy), 70] },
  { id: 'g_money', xp: 400, n: () => L('Bilancio mensile in attivo con 1.000 abitanti', 'Positive monthly balance with 1,000 citizens'), v: () => [stats.pop >= 1000 && (S.lastBudget?.net ?? -1) > 0 ? 1 : 0, 1] },
  { id: 'g_park', xp: 200, n: () => L('Costruisci 3 parchi', 'Build 3 parks'), v: () => [svcN('parks'), 3] },
  { id: 'g_pop3', xp: 1000, n: () => L('Arriva a 10.000 abitanti', 'Reach 10,000 citizens'), v: () => [stats.pop, 10000] },
  { id: 'g_tour', xp: 800, n: () => L('Attira 1.000 turisti al mese', 'Attract 1,000 tourists a month'), v: () => [stats.tourists, 1000] },
  { id: 'g_spec', xp: 600, n: () => L('Costruisci un\'industria specializzata', 'Build a specialized industry'), v: () => [svcN('spec'), 1] },
  { id: 'g_pop4', xp: 3000, n: () => L('Arriva a 50.000 abitanti', 'Reach 50,000 citizens'), v: () => [stats.pop, 50000] },
];
function checkGoals() { S.goals = S.goals || []; for (const g of GOALS) { if (S.goals.includes(g.id)) continue; const [a, b] = g.v(); if (a >= b) { S.goals.push(g.id); addXP(g.xp, L('obiettivo', 'goal') + ': ' + g.n()); toast('🎯 ' + L('Obiettivo completato', 'Goal completed') + ': ' + g.n(), 3500); } } }
// edifici firma: si sbloccano quando la città ha abbastanza edifici di quel tipo
let SIGNK = () => ({ R: L('case', 'homes'), C: L('negozi', 'shops'), I: L('industrie', 'industries'), O: L('uffici', 'offices') });
function signCount(k) { let n = 0; for (const b of buildings.values()) if (!b.ruin && ZT[b.zone].k === k) n++; return n; }
function signOk(t) { return S.opts.unlockAll || !SV[t].need || (S.signUnl || []).includes(t) || [...svcs.values()].some(s => s.type === t); }
function signNeedTxt(t) { const nd = SV[t].need; return L('Servono', 'Needs') + ` ${nd.n} ${SIGNK()[nd.k]} (${L('ora', 'now')} ${Math.min(signCount(nd.k), nd.n)})`; }
function checkSignature() {
  S.signUnl = S.signUnl || [];
  for (const t in SV) {
    const d = SV[t]; if (!d.need || S.signUnl.includes(t) || !unlocked(d.ms) || signCount(d.need.k) < d.need.n) continue;
    S.signUnl.push(t);
    if ($('modal').style.display === 'flex') { toast('⭐ ' + L('Nuovo edificio firma', 'New signature building') + ': ' + d.n(), 4000); continue; }
    if (S.speed) { modalResume = S.speed; setSpeed(0); }
    showModal(`<div style="font-size:42px">⭐</div><h2>${L('Nuovo edificio firma!', 'New signature building!')}</h2><div style="font-size:18px;color:var(--acc2);font-weight:700">${d.n()}</div><p>${d.d2()}</p><p style="color:var(--mute)">${L('Lo trovi nel menu', 'Find it in the menu')} ⭐ ${CAT.sign.n()} · ${fmtMoney(d.cost)} · +500 XP</p><button onclick="closeModal();openCat='sign';buildSub()">${L('Mostrami', 'Show me')}</button><button onclick="closeModal()">${L('Chiudi', 'Close')}</button>`);
  }
}
const unlocked = ms => S.opts.unlockAll || ms <= S.ms;
const tilesFor = ms => { let t = 9; for (let k = 1; k <= ms; k++) t += k * k + 2; return ms >= MS.length - 1 ? NT * NT : Math.min(NT * NT, t); };
const tilesAllowed = () => S.opts.unlockAll ? NT * NT : tilesFor(S.ms);
// ---------- voci dei cittadini ----------
function citizenName(seed) { const r = mulberry32(seed); return '@' + NAMES_F[Math.floor(r() * NAMES_F.length)] + '_' + NAMES_P[Math.floor(r() * NAMES_P.length)]; }
function addFeed(kind, b) {
  const M = {
    aband: [L('Hanno abbandonato il palazzo vicino a me, che tristezza.', 'The building next to mine was abandoned. So sad.')],
    fire: [L('C\'è un incendio! Chiamate i pompieri!', 'There\'s a fire! Call the firefighters!')],
    ms: [L('La nostra città cresce! Sono orgoglioso!', 'Our city is growing! So proud!'), L('Che bello vedere tanti nuovi vicini.', 'Lovely to see so many new neighbours.')],
    debt: [L('Il comune è in rosso... speriamo non alzino le tasse!', 'The city is in debt... hope taxes don\'t go up!')],
    pow: [L('Di nuovo senza corrente! Il frigo è caldo.', 'No power again! My fridge is warm.')],
    wat: [L('Dal rubinetto non esce acqua. Aiuto!', 'No water from my tap. Help!')],
    garb: [L('La spazzatura è ovunque, puzza tutto.', 'Garbage everywhere, it stinks.')],
    crime: [L('Mi hanno rubato la bici. Serve più polizia.', 'Someone stole my bike. We need more police.')],
    tax: [L('Le tasse sono troppo alte!', 'Taxes are way too high!')],
    traffic: [L('Un\'ora in coda per andare al lavoro...', 'An hour in traffic to get to work...')],
    poll: [L('L\'aria qui è irrespirabile per colpa delle fabbriche.', 'The air here is awful because of the factories.')],
    unemp: [L('Cerco lavoro, ma non ce n\'è.', 'Looking for work, but there\'s none.')],
    sick: [L('Sono malato e non c\'è un medico vicino.', 'I\'m sick and there\'s no doctor nearby.')],
    dead: [L('Il nonno è morto e nessuno è venuto a prenderlo. Serve un cimitero!', 'Grandpa died and nobody came. We need a cemetery!')],
    park: [L('Che bel parco hanno fatto! Ci vado ogni giorno.', 'What a lovely park! I go every day.')],
    happy: [L('Adoro vivere qui!', 'I love living here!'), L('Bel quartiere, gente gentile.', 'Nice neighbourhood, kind people.'), L('Il sindaco sta facendo un buon lavoro.', 'The mayor is doing a good job.')],
    bus: [L('Finalmente un autobus vicino a casa!', 'Finally a bus near my home!')],
    disaster: [L('Che paura! Speriamo che tutti stiano bene.', 'So scary! Hope everyone is fine.')],
    snow: [L('Strade piene di neve, servono gli spazzaneve!', 'Roads full of snow, we need snowplows!')],
  };
  const list = M[kind]; if (!list) return;
  S.feed.unshift({ who: citizenName(Math.floor(rand() * 1e9)), t: pick(list), k: kind, d: Math.floor(S.time) });
  if (S.feed.length > 40) S.feed.pop();
  feedDirty = true;
}
let feedDirty = true;
function feedTick() {
  if (rand() > 0.25 || !stats.pop) return;
  const f = stats.fac, opts = [];
  if (f.pow < -2) opts.push('pow'); if (f.wat < -2) opts.push('wat'); if (f.garbage < -2) opts.push('garb'); if (stats.crime > 40) opts.push('crime');
  if (S.tax.R > 14) opts.push('tax'); if (stats.congestion > 0.35) opts.push('traffic'); if (f.pollution < -6) opts.push('poll'); if (stats.unemp > 0.12) opts.push('unemp');
  if (stats.sick > stats.pop * 0.02) opts.push('sick'); if (stats.dead > 3) opts.push('dead'); if (WEATHER.snowRoad) opts.push('snow');
  if (f.park > 4) opts.push('park'); if (stats.happy > 65) opts.push('happy', 'happy'); if (stats.transitShare > 0.1) opts.push('bus');
  if (opts.length) addFeed(pick(opts));
}
// ---------- disastri ----------
const tornados = [];
let flood = null;
function warned(x, z) { return [...svcs.values()].some(s => (s.type === 'siren' && Math.hypot(s.x - x, s.z - z) < SV.siren.r || s.type === 'radiomast' && Math.hypot(s.x - x, s.z - z) < 1500) && s.on); }
function shelterSave() { let cap = 0; for (const s of svcs.values()) if (SV[s.type].shel && s.on) cap += SV[s.type].shel; return clamp(cap / Math.max(1, stats.pop), 0, 0.9); }
function ownedCenter() { const own = []; for (let i = 0; i < NT * NT; i++) if (TILES[i]) own.push(i); const t = pick(own); return { x: -HALF + (t % NT + rand()) * TILE, z: -HALF + (Math.floor(t / NT) + rand()) * TILE }; }
function rollDisaster(force) {
  const r = force ? { tornado: 0, quake: 0.34, flood: 0.67, meteor: 0.9 }[force] : rand();
  if (r < 0.34) { const c = ownedCenter(), a = rand() * Math.PI * 2; tornados.push({ x: c.x - Math.cos(a) * 1500, z: c.z - Math.sin(a) * 1500, dx: Math.cos(a), dz: Math.sin(a), t: 0 }); disasterMsg(L('🌪️ Tornado in arrivo!', '🌪️ Tornado incoming!'), c.x, c.z); }
  else if (r < 0.67) { const c = ownedCenter(); disasterMsg(L('🌍 Terremoto!', '🌍 Earthquake!'), c.x, c.z); shake.t = 8; let n = 0; bldNear(c.x, c.z, 1000, b => { const d = Math.hypot(b.x - c.x, b.z - c.z); if (rand() < 0.35 * (1 - d / 1000) / b.level) { ruinBuilding(b); n++; } }); casualties(n * 3, c.x, c.z); }
  else if (r < 0.9) { flood = { t: 0, max: 4 + rand() * 2.5 }; disasterMsg(L('🌊 Alluvione: il mare si alza!', '🌊 Flood: the sea is rising!'), 0, HALF * 0.6); }
  else { const c = ownedCenter(); disasterMsg(L('☄️ Meteorite!', '☄️ Meteor strike!'), c.x, c.z); shake.t = 4; let n = 0; bldNear(c.x, c.z, 180, b => { ruinBuilding(b); n++; }); clearTrees(() => true, c.x, c.z, 200); casualties(n * 5, c.x, c.z); }
}
function disasterMsg(t, x, z) { toast(t + (warned(x, z) ? L(' La sirena ha avvisato i cittadini.', ' The siren warned citizens.') : ''), 8000); addFeed('disaster'); }
function casualties(n, x, z) { const k = (1 - shelterSave()) * (warned(x, z) ? 0.4 : 1); const c = Math.round(n * k); S.casualties += c; for (let i = 0, t = 0; i < c && lists.res.length && t < c * 4; t++) if (popKillIn(pick(lists.res))) i++; }
function lightning() { const c = ownedCenter(); let best = null; bldNear(c.x, c.z, 300, b => { if (!best || b.h > best.h) best = b; }); if (best && rand() < 0.5) startFire(best); flash = 1; }
let flash = 0;
function updateDisasters(dt) {
  for (let i = tornados.length - 1; i >= 0; i--) {
    const t = tornados[i]; t.t += dt; t.x += t.dx * 22 * dt; t.z += t.dz * 22 * dt;
    if (rand() < dt * 3) bldNear(t.x, t.z, 40, b => { if (!b.ruin && rand() < 0.5) { ruinBuilding(b); casualties(1, t.x, t.z); } });
    clearTrees(() => rand() < 0.3, t.x, t.z, 30);
    if (t.t > 150) tornados.splice(i, 1);
  }
  if (flood) {
    flood.t += dt;
    const T = flood.t, rise = 60, hold = 120, fall = 100;
    WATER = T < rise ? flood.max * T / rise : T < rise + hold ? flood.max : Math.max(0, flood.max * (1 - (T - rise - hold) / fall));
    if (T > rise && T < rise + hold && rand() < dt) bldNear(cam.tx, cam.tz, 3000, b => { if (b.y < WATER - 1 && !b.ruin && rand() < 0.15) { ruinBuilding(b); casualties(1, b.x, b.z); } });
    if (T > rise + hold + fall) { flood = null; WATER = 0; }
  }
  water.position.y = WATER;
  if (shake.t > 0) { shake.t -= dt; shake.x = (rand() - 0.5) * 6 * Math.min(1, shake.t); shake.y = (rand() - 0.5) * 6 * Math.min(1, shake.t); } else shake.x = shake.y = 0;
  if (flash > 0) { flash -= dt * 4; hemi.intensity += flash * 1.5; }
}
