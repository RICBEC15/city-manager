// =====================================================================
//  Idee prese dalle mod più usate di Cities: Skylines II - Blocco 2:
//  trasporti. Tutto rifatto da zero, niente codice né modelli delle mod.
//  146 caselli · 43/140 guida tu (auto, taxi, consegne, bus) · 33 pianificatore
//  19 aeroporto in più (futuristico) · 120 terminal lineare · 197 una pista alla volta
//  199 pista d'aviazione e piazzali · 222 segnali ferroviari · 179/64/224/152 stazioni
//  227 robotaxi · 107/89/196 treni nuovi · 106 tram · 143 navi d'epoca
// =====================================================================

// ---------- nuovi edifici dei trasporti ----------
Object.assign(SV, {
  airport3: { cat: 'transport', w: 1400, d: 520, cost: 5500000, upk: 180000, ms: 9, attr: 12, noise: 13, unique: true, xp: 6000, station: 'metro', free: false, runways: 2, gates: 20,
    n: () => L('Aeroporto Boreale', 'Boreal Airport'), d2: () => L('Un secondo aeroporto, futuristico: 2 piste, 20 gate, terminal merci e una stazione sopraelevata dove fermano le metro', 'A second, futuristic airport: 2 runways, 20 gates, cargo terminal and an elevated station where metro lines stop') },
  airfield: { cat: 'transport', w: 760, d: 140, cost: 320000, upk: 9000, ms: 6, attr: 2, noise: 7, xp: 400, runways: 1, small: true,
    n: () => L('Pista d\'aviazione', 'Airfield'), d2: () => L('Una pista con raccordo e piccolo terminal: aerei piccoli e voli privati', 'A runway with taxiway and small terminal: small planes and private flights') },
  apron: { cat: 'transport', w: 160, d: 110, cost: 140000, upk: 4000, ms: 7, n: () => L('Piazzale e hangar', 'Apron and hangar'), d2: () => L('Vicino a un aeroporto (1,5 km): un aereo in più alla volta', 'Near an airport (1.5 km): one more plane at a time') },
  unionst: { cat: 'transport', w: 170, d: 80, cost: 480000, upk: 12000, ms: 7, station: 'train', station2: 'metro', rail: true, bigTrain: true, plat: 6, attr: 5, xp: 900,
    n: () => L('Stazione Unione (sotterranea)', 'Union Station (underground)'), d2: () => L('Treni e metro sotto terra, sopra un parco con la grande sala d\'ingresso', 'Trains and metro underground, a park and a grand hall on top') },
  metrohub: { cat: 'transport', w: 44, d: 44, cost: 170000, upk: 3800, ms: 6, station: 'metro', free: true, plat: 4, n: () => L('Nodo metro interrato', 'Sunken metro hub'), d2: () => L('2 banchine e 4 binari: le linee si incrociano qui', '2 platforms and 4 tracks: lines meet here') },
  bigstation: { cat: 'transport', w: 230, d: 100, cost: 650000, upk: 16000, ms: 8, station: 'train', rail: true, bigTrain: true, plat: 14, attr: 4, h: 30, xp: 1200,
    n: () => L('Grande stazione sopraelevata', 'Grand elevated station'), d2: () => L('6 banchine e 14 binari sopra la strada, tetto ondulato', '6 platforms and 14 tracks above the street, wavy roof') },
  hubmall: { cat: 'transport', w: 96, d: 64, cost: 520000, upk: 9500, ms: 8, station: 'metro', free: true, attr: 6, shopping: true, xp: 900,
    n: () => L('Ala Bianca (nodo e negozi)', 'White Wing (hub and shops)'), d2: () => L('Stazione metro con galleria di negozi sotto due grandi ali bianche: turisti e commercio', 'Metro station with a shopping hall under two great white wings: tourists and trade') },
  robotaxi: { cat: 'transport', w: 60, d: 44, cost: 90000, upk: 700, ms: 6, veh: 'taxi', fleet: 15, n: () => L('Robotaxi e ricarica', 'Robotaxi depot'), d2: () => L('15 taxi senza autista, elettrici, con tetto solare: costano poco', '15 driverless electric taxis with a solar roof: cheap to run') },
});
EXT.airport = (EXT.airport || []).concat([{ k: 'linterm', cost: 380000, upk: 9000, n: () => L('Terminal lineare (+gate)', 'Linear terminal (+gates)') }]);
EXT.airport2 = (EXT.airport2 || []).concat([{ k: 'linterm', cost: 600000, upk: 14000, n: () => L('Terminal lineare (+gate)', 'Linear terminal (+gates)') }]);
EXT.airport3 = [{ k: 'cargo', cost: 300000, upk: 9000, n: () => L('Terminal merci (aerei cargo)', 'Cargo terminal (cargo planes)') }, { k: 'linterm', cost: 600000, upk: 14000, n: () => L('Terminal lineare (+gate)', 'Linear terminal (+gates)') }];
TREE.push(
  { id: 't_air3', cat: 'transport', cost: 8, req: 't_air', items: ['airport3', 'apron'], n: () => L('Aeroporto Boreale e piazzali', 'Boreal Airport and aprons') },
  { id: 't_airfield', cat: 'transport', cost: 3, items: ['airfield'], n: () => L('Pista d\'aviazione', 'Airfield') },
  { id: 't_bigst', cat: 'transport', cost: 5, items: ['unionst', 'bigstation', 'metrohub', 'hubmall'], n: () => L('Grandi stazioni', 'Grand stations') },
  { id: 't_robo', cat: 'transport', cost: 3, req: 't_taxi', items: ['robotaxi'], n: () => L('Robotaxi', 'Robotaxis') },
);
for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
const AIRPORTS = new Set(['airport', 'airport2', 'airport3', 'airfield']);
const runwaysOf = sv => SV[sv.type].runways || (sv.type === 'airport2' ? 2 : 1);

{ // disegno
  const _ds = drawSvc;
  drawSvc = function (sv) {
    const T = sv.type, mine = ['airport3', 'airfield', 'apron', 'unionst', 'metrohub', 'bigstation', 'hubmall', 'robotaxi'].includes(T);
    if (!mine) { _ds(sv); if (sv.ext && sv.ext.includes('linterm') && AIRPORTS.has(T)) { curRef = sv; const yaw = sv.ang, fx = Math.sin(yaw), fz = Math.cos(yaw), b = -sv.d * 0.47; addPart(sv.parts, 'body', sv.x + fx * b, sv.y, sv.z + fz * b, yaw, sv.w * 0.6, 10, 22, 0xdfe4ea); } return; }
    removeParts(sv.parts); curRef = sv;
    const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
    const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0, yw = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw + yw, w, h, dd, c); };
    const cyl = (a, b, r, h, c, y0 = 0, pool = 'cyl') => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, 0, r, h, r, c); };
    const has = POOLS.pfg ? 'pfg' : 'body', neon = POOLS.pfn ? 'pfn' : 'plain', dome = POOLS.pfd ? 'pfd' : 'cyl';
    switch (T) {
      case 'airport3': {
        box(0, 0, W, 0.3, D, 0x5f7f58, 'plain');
        for (const b of [D * 0.33, -D * 0.02]) { box(0, b, W * 0.96, 0.35, 46, 0x2f3034, 'plain'); for (let a = -W * 0.45; a < W * 0.45; a += 40) box(a, b, 14, 0.4, 1, 0xf2f2f2, 'plain'); }
        box(0, D * 0.16, W * 0.9, 0.32, 14, 0x3c3d42, 'plain'); // raccordo
        // terminal a mezzaluna di vetro con 20 gate
        for (let i = -10; i < 10; i++) { const a = (i + 0.5) * W * 0.035, bb = -D * 0.3 + Math.abs(i + 0.5) * 2.2; box(a, bb, W * 0.036, 14, 30, 0x9fd3ff, has); box(a, bb + 26, 2.4, 5, 24, 0xd8dce2, 'body', 0); }
        box(0, -D * 0.3 - 12, W * 0.72, 2, 10, 0xeef2f6, 'plain', 14);
        for (const a of [-W * 0.3, 0, W * 0.3]) box(a, -D * 0.38, 40, 0.6, 3, 0x22e4ff, neon, 15);
        cyl(W * 0.42, -D * 0.12, 5, 55, 0xe8eef4); { const [x, z] = at(W * 0.42, -D * 0.12); addPart(P, dome, x, y + 55, z, 0, 9, 6, 9, 0x9fd3ff); }
        // stazione sopraelevata con la monorotaia
        box(-W * 0.2, -D * 0.46, W * 0.5, 2, 12, 0xcfd6de, 'body', 12); for (let a = -W * 0.44; a < W * 0.05; a += 30) box(a, -D * 0.46, 2.5, 12, 2.5, 0xbfc6ce);
        box(-W * 0.2, -D * 0.46, 46, 9, 16, 0x9fd3ff, has, 14);
        box(W * 0.33, -D * 0.38, W * 0.22, 12, 40, 0xb8bcc2); // merci
        break;
      }
      case 'airfield': {
        box(0, 0, W, 0.25, D, 0x6a8a5a, 'plain'); box(0, D * 0.12, W * 0.95, 0.32, 30, 0x34353a, 'plain');
        for (let a = -W * 0.44; a < W * 0.44; a += 36) box(a, D * 0.12, 12, 0.36, 0.8, 0xf0f0f0, 'plain');
        box(0, -D * 0.12, W * 0.6, 0.3, 9, 0x3e3f44, 'plain'); box(-W * 0.32, -D * 0.32, 60, 0.3, 30, 0x46474c, 'plain');
        box(-W * 0.4, -D * 0.34, 26, 7, 18, 0xd8d0c0); box(-W * 0.4, -D * 0.34, 27, 1, 19, 0x8a3a2a, 'body', 7); cyl(-W * 0.28, -D * 0.4, 2, 14, 0xe8e8e8); box(-W * 0.28, -D * 0.4, 5, 3, 5, 0x9fd3ff, has, 14);
        break;
      }
      case 'apron': {
        box(0, 0, W, 0.3, D, 0x45464b, 'plain'); box(-W * 0.22, -D * 0.2, W * 0.5, 14, D * 0.5, 0xb8bec6); box(-W * 0.22, -D * 0.2, W * 0.52, 2, D * 0.52, 0x8a9098, 'body', 14);
        for (let a = 0; a < 3; a++) box(W * 0.1 + a * 18, D * 0.18, 14, 0.35, 0.6, 0xf2d020, 'plain');
        break;
      }
      case 'unionst': {
        box(0, 0, W, 0.4, D, 0x5f9a48, 'plain');
        for (let i = 0; i < 18; i++) { const [x, z] = at((((i * 37) % 17) / 17 - 0.5) * W * 0.85, (((i * 53) % 13) / 13 - 0.5) * D * 0.7); if (POOLS.pft) addPart(P, 'pft', x, y + 3, z, 0, 5, 6, 5, 0x3e7a35); }
        box(0, -D * 0.1, W * 0.42, 16, D * 0.42, 0xd9cfb8); box(0, -D * 0.1, W * 0.44, 2, D * 0.44, 0xa89c84, 'body', 16);
        { const [x, z] = at(0, -D * 0.1); addPart(P, dome, x, y + 18, z, 0, 18, 10, 18, 0x8fb6c8); }
        for (const a of [-W * 0.4, W * 0.4]) box(a, -D * 0.38, 16, 4, 12, 0x6a6e74);
        break;
      }
      case 'metrohub': {
        box(0, 0, W, 0.3, D, 0xb9b4a8, 'plain'); box(0, 0, W * 0.6, 3, D * 0.6, 0x55575c); box(0, 0, W * 0.62, 0.8, D * 0.62, 0x2a5ad0, 'body', 3);
        box(0, -D * 0.4, 8, 3.5, 4, 0x2a5ad0); box(0, -D * 0.4, 4, 0.8, 4.4, 0xf2f2f2, 'body', 3.5);
        break;
      }
      case 'bigstation': {
        box(0, 0, W, 0.3, D, 0x6a6c70, 'plain');
        for (let a = -W * 0.45; a <= W * 0.45; a += W * 0.1) for (const b of [-D * 0.3, D * 0.3]) box(a, b, 3, 14, 3, 0xc8ccd2);
        box(0, 0, W * 0.98, 2, D * 0.9, 0xb0b4ba, 'body', 14);
        for (let i = 0; i < 7; i++) box(0, -D * 0.4 + i * D * 0.133, W * 0.96, 0.3, 1.2, 0x3a3a3e, 'plain', 16);
        for (let i = 0; i < 12; i++) { const a = -W * 0.45 + i * W * 0.082; box(a, 0, W * 0.084, 6 + Math.sin(i * 0.9) * 4, D * 0.92, 0xe6eaee, 'body', 18); }
        box(0, -D * 0.47, W * 0.4, 12, 10, 0x9fd3ff, has, 2);
        break;
      }
      case 'hubmall': {
        box(0, 0, W, 0.3, D, 0xd8d4cc, 'plain'); box(0, 0, W * 0.55, 8, D * 0.5, 0xeeeeea);
        for (let i = 0; i < 14; i++) { const a = -W * 0.3 + i * W * 0.045; for (const sd of [-1, 1]) box(a, sd * D * 0.12, 1.4, 18 + Math.sin(i / 13 * Math.PI) * 14, 1.4, 0xf8f8f6, 'body', 8, sd * 0.35); }
        box(0, 0, W * 0.62, 1, 3, 0xf8f8f6, 'body', 8);
        break;
      }
      case 'robotaxi': {
        box(0, 0, W, 0.3, D, 0x55575c, 'plain');
        for (let a = -2; a <= 2; a++) box(a * W * 0.18, 0, W * 0.15, 0.4, D * 0.5, 0xf2f2f2, 'plain');
        for (const a of [-W * 0.27, 0, W * 0.27]) { box(a, 0, 3, 0.15, 3, 0x2aa0ff, neon, 0.2); }
        for (let a = -2; a <= 2; a++) { box(a * W * 0.18, D * 0.3, 0.4, 4, 0.4, 0xb8bcc2); box(a * W * 0.18, D * 0.2, W * 0.17, 0.3, D * 0.28, 0x22306a, 'body', 4); }
        box(-W * 0.38, -D * 0.35, 10, 6, 8, 0xeaeaea);
        break;
      }
    }
    POOLS.body.dirty();
  };
}
// le metro possono fermarsi anche nelle stazioni che hanno "station2: metro"
{
  const _sfp = stopFromPoint;
  stopFromPoint = function (kind, x, z) {
    const r = _sfp(kind, x, z); if (r || kind !== 'metro') return r;
    const sv = [...svcs.values()].find(s => SV[s.type].station2 === 'metro' && obbContains(s, x, z, 15));
    return sv ? { svc: sv.id, x: sv.x, z: sv.z } : null;
  };
  if (typeof __cm !== 'undefined') __cm.stopFromPoint = stopFromPoint;
}
// case basse vicino alle piste e più uffici con gli aeroporti nuovi
{
  const _ac = airCap;
  airCap = function (x, z) {
    let cap = _ac(x, z);
    for (const sv of svcs.values()) {
      if (sv.type !== 'airport3' && sv.type !== 'airfield') continue;
      const ax = Math.cos(sv.ang), az = -Math.sin(sv.ang), dx = x - sv.x, dz = z - sv.z, a = Math.abs(dx * ax + dz * az), l = Math.abs(-dx * az + dz * ax);
      if (l > sv.d / 2 + 250) continue;
      const over = a - sv.w / 2; cap = Math.min(cap, over < 0 ? 12 : 12 + over * 0.05);
    }
    return cap;
  };
  const _cd = computeDemand;
  computeDemand = function () {
    _cd();
    const d = stats.demand; if (!d.why || !d.why.O) return;
    let k = 0; for (const sv of svcs.values()) if (sv.on) { if (sv.type === 'airport3') k += 8; if (sv.type === 'airfield') k += 2; if (sv.type === 'hubmall') k += 2; }
    if (k) { d.why.O.push([L('Aeroporti e nodi nuovi', 'New airports and hubs'), k]); d.O = clamp(d.O + k, 0, 100); }
  };
}

// ---------- 197 + 199 + 120: aerei che aspettano la pista libera ----------
function planeSlots(sv) {
  let n = sv.type === 'airport2' || sv.type === 'airport3' ? 4 : sv.type === 'airfield' ? 2 : 2;
  if (sv.ext && sv.ext.includes('linterm')) n += 2;
  for (const a of svcs.values()) if (a.type === 'apron' && a.on && Math.hypot(a.x - sv.x, a.z - sv.z) < 1500) n++;
  return n;
}
{
  const _st = simTick;
  simTick = function () {
    _st();
    for (const sv of svcs.values()) {
      if (!sv.on || !AIRPORTS.has(sv.type)) continue;
      const cnt = planes.filter(p => p.sv === sv.id).length, base = sv.type === 'airport2' ? 4 : 2;
      // l'originale arriva fino a 2 (o 4): qui i posti in più e gli aeroporti nuovi
      if ((sv.type === 'airport3' || sv.type === 'airfield' || cnt >= base) && cnt < planeSlots(sv) && rand() < 0.5) { spawnPlane(sv); planes[planes.length - 1].small = sv.type === 'airfield'; }
    }
  };
}
{
  const _usp = updateShipsPlanes;
  updateShipsPlanes = function (dt) {
    // prima: chi sta per atterrare o decollare aspetta se le piste sono occupate
    const busy = new Map();
    for (const p of planes) if (p.t >= 0.45 && p.t < 0.6) busy.set(p.sv, (busy.get(p.sv) || 0) + 1);
    for (const p of planes) {
      const sv = svcs.get(p.sv); if (!sv) continue;
      const next = p.t + dt / 90;
      if (p.t < 0.45 && next >= 0.45 && (busy.get(p.sv) || 0) >= runwaysOf(sv)) { p.t -= dt / 90; p.hold = true; }
      else if (p.t < 0.45 && next >= 0.45) { busy.set(p.sv, (busy.get(p.sv) || 0) + 1); p.hold = false; }
    }
    _usp(dt);
    for (const p of planes) if (p.small) { // aerei piccoli
      const e = extra.mesh.instanceMatrix.array;
      for (const [h, k] of [[p.h, 0.4], [p.h2, 0.35]]) { const o = h.i * 16; for (const q of [0, 1, 2, 4, 5, 6, 8, 9, 10]) e[o + q] *= k; }
    }
    shipDeco(); extra.dirty();
  };
}

// ---------- 143: navi d'epoca ----------
const shipBits = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 600);
{
  const _sp = spawnShip;
  spawnShip = function (sv, cargo, cruise) { const n = ships.length; _sp(sv, cargo, cruise); const sh = ships[ships.length - 1]; if (ships.length > n && sh && !sh.cruise && rand() < 0.3) sh.vint = cargo ? 'steam' : rand() < 0.5 ? 'steam' : 'schooner'; };
}
function shipDeco() {
  let n = 0; const e = extra.mesh.instanceMatrix.array;
  const put = (x, y, z, yaw, w, h, d, c) => { if (n >= shipBits.max) return; setInst(shipBits.mesh, n, x, y, z, yaw, w, h, d); _c.setHex(c); setInstCol(shipBits.mesh, n, _c.r, _c.g, _c.b); n++; };
  for (const sh of ships) {
    if (!sh.vint) continue;
    const i0 = sh.parts[0].i, o = i0 * 16, x = e[o + 12], z = e[o + 14], sz = Math.hypot(e[o + 8], e[o + 10]) || 1, yaw = Math.atan2(e[o + 8], e[o + 10]);
    if (!isFinite(x) || e[o + 13] < -500) continue;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), L0 = sz;
    if (sh.vint === 'steam') {
      _c.setHex(0x1e1e22); setInstCol(extra.mesh, i0, _c.r, _c.g, _c.b); _c.setHex(0xf0ece0); setInstCol(extra.mesh, sh.parts[1].i, _c.r, _c.g, _c.b);
      for (const k of [-0.08, 0.12]) { put(x + fx * L0 * k, WATER + 8, z + fz * L0 * k, yaw, 3, 9, 3, 0xb0281e); put(x + fx * L0 * k, WATER + 17, z + fz * L0 * k, yaw, 3.1, 2, 3.1, 0x111111); }
      put(x + fx * L0 * 0.38, WATER + 2, z + fz * L0 * 0.38, yaw, 0.5, 18, 0.5, 0x6a4a2a);
    } else {
      _c.setHex(0x5a3a22); setInstCol(extra.mesh, i0, _c.r, _c.g, _c.b); _c.setHex(0x8a6a44); setInstCol(extra.mesh, sh.parts[1].i, _c.r, _c.g, _c.b);
      for (const k of [-0.18, 0.15]) { put(x + fx * L0 * k, WATER + 2, z + fz * L0 * k, yaw, 0.6, 26, 0.6, 0x4a3420); put(x + fx * L0 * k - fx * 3, WATER + 8, z + fz * L0 * k - fz * 3, yaw, 0.25, 15, 7, 0xf4efe2); }
    }
  }
  shipBits.mesh.count = n; shipBits.dirty();
}

// ---------- 107/89/196 treni, 106 tram: modelli nuovi ----------
VK.hstrain = { ...VK.train, l: 22, v: 1.7, col: 0xf4f4f4 };
VK.regtrain = { ...VK.train, l: 17, v: 1.15 };
VK.ictrain = { ...VK.train, l: 20, v: 1.35, h: 4.4 };
LMOD.train.push(
  { n: () => L('Alta velocità 300 km/h (muso lungo)', 'High-speed 300 km/h (long nose)'), cap: 1.6, upk: 2.6, cars: 8, veh: 'hstrain', col: 0xf4f4f4 },
  { n: () => L('Regionale snodato', 'Articulated regional'), cap: 1.1, upk: 0.9, cars: 4, veh: 'regtrain' },
  { n: () => L('Intercity a due piani', 'Double-deck intercity'), cap: 2.2, upk: 1.9, cars: 7, veh: 'ictrain' },
);
LMOD.tram = [
  { n: () => L('Tram normale', 'Standard tram'), cap: 1, upk: 1 },
  { n: () => L('Tram classico anni \'60 (rosso e crema)', 'Classic 1960s tram (red and cream)'), cap: 0.75, upk: 0.7, col: 0xc8402e },
  { n: () => L('Tram lungo moderno', 'Long modern tram'), cap: 1.6, upk: 1.4 },
];
{
  const _sv = spawnVehicle;
  spawnVehicle = function (kind, legs, opts = {}) {
    if (opts.line != null) { const ln = lines.find(l => l.id === opts.line); const m = ln && lineMod(ln); if (m && m.veh && VK[m.veh]) kind = m.veh; if (m && m.col) opts = { ...opts, col: m.col }; }
    return _sv(kind, legs, opts);
  };
  const _dp = dispatch;
  dispatch = function (sv, kind, b, onArrive) { const v = _dp(sv, kind, b, onArrive); if (v && sv && sv.type === 'robotaxi') { v.col = 0xf6f6f6; v.robo = true; v.ev = true; } return v; };
}

// ---------- 222: segnali ferroviari a 3 luci ----------
const rsPole = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0x4a4d52 }), 4000);
const rsLamp = new InstPool(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial(), 4000);
function trainOn(e) { for (const ln of e.cars) if (ln.length) return true; return false; }
function drawRailSignals() {
  let np = 0, nl = 0;
  if (cam.dist < 2500 && SET.railSignals !== false) for (const s of segs.values()) {
    if (!RT[s.type].rail || s.len < 40) continue;
    const m = s.pts[s.pts.length >> 1]; if (Math.abs(m.x - cam.tx) > 2000 || Math.abs(m.z - cam.tz) > 2000) continue;
    for (const e of s.edges) {
      if (!e.rail && !RT[e.seg.type].rail) continue;
      if (np >= rsPole.max - 2 || nl >= rsLamp.max - 3) break;
      const p = e.pts[Math.max(0, e.pts.length - 3)], q = e.pts[e.pts.length - 1], dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1, rx = -dz / l, rz = dx / l;
      const x = p.x + rx * 4.2, z = p.z + rz * 4.2, y = p.y;
      // rosso: treno su questo tratto o su quello dopo · giallo: due tratti più avanti · verde: libero
      const nd = nodes.get(e.to); let st = trainOn(e) ? 0 : 2;
      if (st && nd) for (const sid of nd.segs) { const s2 = segs.get(sid); if (!s2 || s2 === s || !RT[s2.type].rail) continue; for (const e2 of s2.edges) if (e2.from === nd.id || e2.to !== nd.id) { if (trainOn(e2)) st = 0; else if (st === 2) { const n2 = nodes.get(e2.to); if (n2) for (const id3 of n2.segs) { const s3 = segs.get(id3); if (s3 && s3 !== s2 && RT[s3.type].rail) for (const e3 of s3.edges) if (trainOn(e3)) st = 1; } } } }
      setInst(rsPole.mesh, np++, x, y, z, Math.atan2(dx, dz), 0.25, 6, 0.25);
      setInst(rsPole.mesh, np++, x, y + 5.2, z, Math.atan2(dx, dz), 0.8, 2.6, 0.5);
      const cols = [[1, 0.08, 0.05], [1, 0.75, 0.05], [0.1, 1, 0.2]];
      for (let k = 0; k < 3; k++) { setInst(rsLamp.mesh, nl, x - dx / l * 0.3, y + 7.3 - k * 0.8, z - dz / l * 0.3, 0, 0.28, 0.28, 0.28); const on = k === st, c = cols[k]; setInstCol(rsLamp.mesh, nl, on ? c[0] : 0.12, on ? c[1] : 0.12, on ? c[2] : 0.12); nl++; }
    }
  }
  rsPole.mesh.count = np; rsLamp.mesh.count = nl; rsPole.dirty(); rsLamp.dirty();
}
{ const _dl = drawLights; drawLights = function () { _dl(); drawRailSignals(); }; }

// ---------- 146: caselli autostradali ----------
const tollGroup = new THREE.Group(); scene.add(tollGroup);
const tollMat = { roof: new THREE.MeshLambertMaterial({ color: 0xe8eef2 }), booth: new THREE.MeshLambertMaterial({ color: 0x2a6ac0 }), post: new THREE.MeshLambertMaterial({ color: 0x9a9ea4 }) };
function tollRebuild() {
  while (tollGroup.children.length) { const c = tollGroup.children.pop(); c.traverse?.(o => o.geometry && o.geometry !== boxGeo && o.geometry.dispose()); }
  for (const s of segs.values()) {
    if (!s.toll) continue;
    const f = segFrame(s, s.len / 2), w = RT[s.type].w + 4, g = new THREE.Group(); g.position.set(f.x, f.y, f.z); g.rotation.y = Math.atan2(f.tx, f.tz);
    const B = (mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(boxGeo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); };
    B(tollMat.roof, 0, 6.5, 0, w, 0.8, 14);
    const n = s.toll; for (let i = 0; i < n; i++) { const x = -w / 2 + 1 + (i + 0.5) * (w - 2) / n; B(tollMat.booth, x, 0.1, 0, 1.4, 2.8, 3.2); B(tollMat.post, x, 0.1, 5, 0.3, 6.4, 0.3); B(tollMat.post, x, 0.1, -5, 0.3, 6.4, 0.3); }
    tollGroup.add(g);
  }
}
onEdgeEnter = function (v, e) {
  const k = VK[v.kind]; if (k.rail || EMERG.has(v.kind) || v.stopAt != null) return;
  const leg = v.legs[v.li], mid = e.len / 2; if (!leg || leg.s0 > mid - 2 || leg.s1 < mid + 2) return;
  const n = e.seg.toll || 2;
  v.stopAt = mid; v.onStop = q => { q.wait = clamp(4 / n, 0.6, 2.2); const fee = (S.tollFee ?? 3) * (q.kind === 'truck' ? 2.5 : 1); if (!S.opts.unlimited) S.money += fee; S.tollIn = (S.tollIn || 0) + fee; };
};
function setToll(id, n) {
  const s = segs.get(id); if (!s) return;
  if (n && !s.toll && !spend(40000 + n * 15000)) return;
  if (n && s.toll && n > s.toll && !spend((n - s.toll) * 15000)) return;
  s.toll = n || null; tollRebuild(); refreshPanels();
}
{
  const _seh = segExtraHTML;
  segExtraHTML = function (o) {
    let h = _seh(o);
    if (RT[o.type].hw && o.len > 60) {
      h += `<div class="sec">🛂 ${L('Casello', 'Toll plaza')}</div><div style="display:flex;gap:4px;flex-wrap:wrap">` + [0, 2, 4, 6].map(n => `<button class="${(o.toll || 0) === n ? 'on' : ''}" onclick="setToll(${o.id},${n})">${n ? n + ' ' + L('cabine', 'booths') : L('Niente', 'None')}</button>`).join('') + '</div>';
      if (o.toll) h += `<div class="slider"><span>${L('Pedaggio', 'Toll')}</span><input type="range" min="0" max="12" step="0.5" value="${S.tollFee ?? 3}" oninput="S.tollFee=+this.value;this.nextElementSibling.textContent=this.value+' €'"><span>${S.tollFee ?? 3} €</span></div><div style="font-size:12px;color:var(--mute)">${L('Incassato in tutto', 'Collected so far')}: ${fmtMoney(Math.round(S.tollIn || 0))} · ${L('meno cabine = più coda', 'fewer booths = longer queues')}</div>`;
    }
    return h;
  };
  const _ser = serialize;
  serialize = function () { S.segToll = [...segs.values()].filter(s => s.toll).map(s => [s.id, s.toll]); try { return _ser(); } finally { delete S.segToll; } };
  if (typeof __cm !== 'undefined') __cm.serialize = serialize;
  const _des = deserializeG;
  deserializeG = function* (json) { yield* _des(json); if (S && S.segToll) { for (const [id, n] of S.segToll) { const s = segs.get(id); if (s) s.toll = n; } delete S.segToll; } tollRebuild(); };
  const _split = splitSeg;
  splitSeg = function (s, t, eo) { const had = s.toll, m = _split(s, t, eo); if (had && m) { const q = segs.get(m.segs[m.segs.length - 1]); if (q) q.toll = had; tollRebuild(); } return m; };
}

// ---------- 33: pianificatore dei trasporti ----------
function lineLoopLen(ln) { const st = ln.stops.map(s => s.svc ? svcs.get(s.svc) : s).filter(Boolean); let L0 = 0; for (let i = 0; i < st.length; i++) { const a = st[i], b = st[(i + 1) % st.length]; L0 += Math.hypot(b.x - a.x, b.z - a.z); } return L0 * 1.25; }
function netMapSVG() {
  const pts = []; for (const ln of lines) for (const s of ln.stops) { const p = s.svc ? svcs.get(s.svc) : s; if (p) pts.push(p); }
  if (!pts.length) return '';
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  const W = 300, H = 200, sc = Math.min((W - 20) / Math.max(1, x1 - x0), (H - 20) / Math.max(1, z1 - z0)), X = x => 10 + (x - x0) * sc, Z = z => 10 + (z - z0) * sc;
  let h = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;background:rgba(127,127,127,.12);border-radius:8px">`;
  for (const ln of lines) {
    const st = ln.stops.map(s => s.svc ? svcs.get(s.svc) : s).filter(Boolean); if (st.length < 2) continue;
    h += `<polyline fill="none" stroke="${lnHex(ln)}" stroke-width="${ln.kind === 'metro' || ln.kind === 'train' ? 4 : 2.5}" stroke-linejoin="round" ${ln.ok ? '' : 'stroke-dasharray="4 3"'} points="${st.concat([st[0]]).map(p => X(p.x).toFixed(1) + ',' + Z(p.z).toFixed(1)).join(' ')}"/>`;
    for (const [i, s] of ln.stops.entries()) if (!s.wp) { const p = st[i] || s; h += `<circle cx="${X(p.x).toFixed(1)}" cy="${Z(p.z).toFixed(1)}" r="2.6" fill="#fff" stroke="${lnHex(ln)}" stroke-width="1.5"/>`; }
  }
  return h + '</svg>';
}
function plannerHTML() {
  if (!lines.length) return '';
  let h = `<div class="sec">🗺️ ${L('Mappa della rete', 'Network map')}</div>${netMapSVG()}`;
  h += `<div class="sec">🕒 ${L('Tabella delle linee', 'Line table')}</div><table class="ltab"><tr><th></th><th>${L('Linea', 'Line')}</th><th>${L('Giro', 'Loop')}</th><th>${L('Un mezzo ogni', 'One every')}</th><th>${L('Stato', 'Status')}</th></tr>`;
  for (const ln of lines) {
    const len = lineLoopLen(ln), gap = ln.nveh ? len / ln.nveh : 0, use = lineUse(ln);
    const stt = !ln.ok ? '⚠️ ' + L('ferma', 'stopped') : use > 100 ? '🔴 ' + L('troppo piena', 'too full') : gap > 1500 ? '🟠 ' + L('passa di rado', 'rare') : use < 15 ? '🟡 ' + L('quasi vuota', 'nearly empty') : '🟢 ok';
    h += `<tr><td><i style="background:${lnHex(ln)}"></i></td><td>${ln.name}</td><td>${(len / 1000).toFixed(1)} km</td><td>${gap ? Math.round(gap) + ' m' : '-'}</td><td>${stt}</td></tr>`;
  }
  h += `</table><div style="font-size:12px;color:var(--mute)">${L('Vista a colori "Dove non arrivano i trasporti" in 🎨', 'Colour view "Where transit does not reach" in 🎨')}</div>`;
  return h;
}
{
  const _rp = refreshPanels;
  refreshPanels = function () {
    _rp();
    if (sideOpen !== 'lines') return;
    const el = $('side'); if (!el) return; const h3 = el.querySelector('h3'); const d = document.createElement('div'); d.innerHTML = plannerHTML();
    if (h3 && h3.nextSibling) el.insertBefore(d, h3.nextSibling); else el.appendChild(d);
  };
  const _ie = INFO_EXTRA;
  INFO_EXTRA = function () { return _ie().concat([['transit', '🚏 ' + L('Dove non arrivano i trasporti', 'Where transit does not reach')]]); };
  EXTRA_MODES.push('transit');
  const _ri = renderInfo;
  renderInfo = function () {
    const was = infoDirty; _ri();
    if (!was || INFO.mode !== 'transit') return;
    const pts = [];
    for (const ln of lines) if (!ln.off) for (const s of ln.stops) { if (s.wp) continue; const p = s.svc ? svcs.get(s.svc) : s; if (p) pts.push([p.x, p.z, (LK[ln.kind]?.catch || 380) ** 2]); }
    for (const b of buildings.values()) {
      if (b.ruin) continue; let best = 1;
      for (const [x, z, r2] of pts) { const d2 = (b.x - x) ** 2 + (b.z - z) ** 2; if (d2 < r2) { best = Math.min(best, d2 / r2 * 0.6); if (best < 0.1) break; } }
      const c = ramp(best); tintParts(b, (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]));
    }
    INFO.tinted = true;
  };
}

// ---------- 43 + 140: guida tu ----------
const DRIVE = { on: false, x: 0, z: 0, y: 0, yaw: 0, v: 0, kind: 'car', view: 'chase', job: null, earned: 0, mute: false, keys: {}, t: 0 };
const DRIVE_KINDS = { car: [4.4, 1.8, 1.4, 0xc8282e, 40], taxi: [4.5, 1.8, 1.45, 0xf0c020, 40], van: [6, 2.1, 2.4, 0xf2f2f2, 30], bus: [12, 2.5, 3.1, 0x2f6fd0, 24] };
const driveMesh = new THREE.Group(); driveMesh.visible = false; scene.add(driveMesh);
const driveMark = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x2dffa0, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); driveMark.visible = false; scene.add(driveMark);
function driveBuildMesh() {
  while (driveMesh.children.length) driveMesh.remove(driveMesh.children[0]);
  const [l, w, h, col] = DRIVE_KINDS[DRIVE.kind], M = c => new THREE.MeshLambertMaterial({ color: c });
  const B = (c, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(boxGeo, M(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); driveMesh.add(m); };
  if (DRIVE.kind === 'bus' || DRIVE.kind === 'van') { B(col, 0, 0.35, 0, w, h - 0.35, l); B(0x223040, 0, h * 0.55, l / 2 - 0.05, w * 0.92, h * 0.35, 0.12); }
  else { B(col, 0, 0.3, 0, w, h * 0.5, l); B(0x2a3644, 0, 0.3 + h * 0.5, -0.2, w * 0.86, h * 0.45, l * 0.5); if (DRIVE.kind === 'taxi') B(0xffffff, 0, 0.3 + h * 0.95, -0.2, 0.7, 0.25, 0.3); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(0x111111, sx * w / 2, 0, sz * l * 0.32, 0.3, 0.7, 0.75);
  B(0xfff6c0, -w * 0.32, 0.6, l / 2, 0.4, 0.25, 0.05); B(0xfff6c0, w * 0.32, 0.6, l / 2, 0.4, 0.25, 0.05);
}
let driveAudio = null;
function driveSound() {
  if (DRIVE.mute || !DRIVE.on) { if (driveAudio) driveAudio.g.gain.value = 0; return; }
  try {
    if (!driveAudio) { const ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(ac.destination); o.start(); driveAudio = { ac, o, g }; }
    driveAudio.o.frequency.value = 38 + Math.abs(DRIVE.v) * 3.2 + (DRIVE.kind === 'bus' ? -12 : 0); driveAudio.g.gain.value = 0.025 + Math.min(0.03, Math.abs(DRIVE.v) * 0.001);
  } catch (e) { DRIVE.mute = true; }
}
function startDrive(kind = 'car') {
  if (walk.on) toggleWalk();
  const near = findNearSeg(cam.tx, cam.tz, 600, s => !RT[s.type].rail && !RT[s.type].ped);
  if (!near) { toast(L('Costruisci prima una strada vicino alla telecamera', 'Build a road near the camera first'), 3000); return; }
  const f = segFrame(near.seg, clamp(near.along, 0, near.seg.len));
  Object.assign(DRIVE, { on: true, kind, x: f.x, z: f.z, y: f.y, yaw: Math.atan2(f.tx, f.tz), v: 0, job: null, earned: 0, keys: {} });
  followVeh = null; setTool(null); openCat = null; buildToolbar(); closeSide?.();
  driveBuildMesh(); driveMesh.visible = true; driveHud(true);
  if (kind === 'taxi') newDriveJob('taxi'); else if (kind === 'van') newDriveJob('deliv'); else if (kind === 'bus') newDriveJob('bus');
}
function stopDrive() {
  DRIVE.on = false; driveMesh.visible = false; driveMark.visible = false; driveHud(false); driveSound();
  cam.tx = DRIVE.x; cam.tz = DRIVE.z; cam.dist = 300;
}
function pickBld(list, from, dmin, dmax) {
  for (let t = 0; t < 30; t++) { const b = list[Math.floor(rand() * list.length)]; if (!b) break; const d = Math.hypot(b.x - from.x, b.z - from.z); if (d > dmin && d < dmax) return b; }
  return list.length ? list[Math.floor(rand() * list.length)] : null;
}
function newDriveJob(type) {
  const all = [...buildings.values()].filter(b => !b.ruin);
  if (type === 'bus') {
    const ls = lines.filter(l => l.kind === 'bus' && lineStops(l).length >= 2);
    if (!ls.length) { DRIVE.job = null; toast(L('Nessuna linea di autobus: guidi libero', 'No bus lines: free driving'), 3000); return; }
    const ln = ls[Math.floor(rand() * ls.length)]; DRIVE.job = { type, line: ln.id, i: 0, stops: lineStops(ln).map(s => ({ x: s.x, z: s.z })) }; return;
  }
  if (!all.length) { DRIVE.job = null; toast(L('Non ci sono ancora edifici: guidi libero', 'No buildings yet: free driving'), 3000); return; }
  const src = type === 'deliv' ? (lists.com.length ? lists.com : lists.ind.length ? lists.ind : all) : all;
  const a = pickBld(src, DRIVE, 80, 1500); if (!a) return;
  const dst = pickBld(type === 'deliv' ? (lists.res.length ? lists.res : all) : all, a, 300, 2500);
  DRIVE.job = { type, a: { x: a.x, z: a.z }, b: dst ? { x: dst.x, z: dst.z } : null, stage: 0 };
}
function driveTarget() {
  const j = DRIVE.job; if (!j) return null;
  if (j.type === 'bus') return j.stops[j.i % j.stops.length];
  return j.stage === 0 ? j.a : j.b;
}
function driveJobTick() {
  const j = DRIVE.job, t = driveTarget(); if (!j || !t) return;
  const d = Math.hypot(t.x - DRIVE.x, t.z - DRIVE.z);
  if (d < 22 && Math.abs(DRIVE.v) < 3) {
    const pay = (n, msg) => { if (!S.opts.unlimited) S.money += n; DRIVE.earned += n; toast(msg + ' +' + fmtMoney(n), 2200); };
    if (j.type === 'bus') { j.i++; pay(4, '🚏 ' + L('Fermata servita', 'Stop served')); return; }
    if (j.stage === 0) { j.stage = 1; j.t0 = DRIVE.t; toast(j.type === 'taxi' ? '🙋 ' + L('Cliente a bordo! Portalo a destinazione', 'Passenger on board! Take them to the destination') : '📦 ' + L('Pacco caricato! Consegnalo', 'Parcel loaded! Deliver it'), 2500); return; }
    const dist = Math.hypot(j.b.x - j.a.x, j.b.z - j.a.z);
    pay(Math.round((j.type === 'taxi' ? 6 : 9) + dist / 90), j.type === 'taxi' ? '🚕 ' + L('Corsa finita', 'Ride done') : '📦 ' + L('Consegnato', 'Delivered'));
    newDriveJob(j.type);
  }
}
function driveHud(show) {
  let el = document.getElementById('drivehud');
  if (!el) { el = document.createElement('div'); el.id = 'drivehud'; el.style.cssText = 'position:fixed;left:50%;top:92px;transform:translateX(-50%);z-index:30;background:rgba(15,20,28,.82);color:#fff;border-radius:12px;padding:8px 14px;font:13px system-ui,sans-serif;text-align:center;pointer-events:auto;min-width:300px'; document.body.appendChild(el); }
  el.style.display = show ? 'block' : 'none';
}
function driveHudUpdate() {
  const el = document.getElementById('drivehud'); if (!el) return;
  const t = driveTarget(), j = DRIVE.job;
  let gps = '';
  if (t) { const a = Math.atan2(t.x - DRIVE.x, t.z - DRIVE.z) - DRIVE.yaw, d = Math.hypot(t.x - DRIVE.x, t.z - DRIVE.z); gps = `<span style="display:inline-block;transform:rotate(${(-a * 180 / Math.PI).toFixed(0)}deg);font-size:22px">⬆</span> ${d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'}`; }
  const what = !j ? L('Guida libera', 'Free driving') : j.type === 'bus' ? '🚌 ' + L('Prossima fermata', 'Next stop') + ' ' + (j.i % j.stops.length + 1) + '/' + j.stops.length : j.type === 'taxi' ? (j.stage ? '🚕 ' + L('Porta il cliente', 'Drop the passenger') : '🙋 ' + L('Vai a prendere il cliente', 'Pick up the passenger')) : (j.stage ? '📦 ' + L('Consegna il pacco', 'Deliver the parcel') : '📦 ' + L('Ritira il pacco', 'Collect the parcel'));
  el.innerHTML = `<b style="font-size:20px">${Math.round(Math.abs(DRIVE.v) * 3.6)} km/h</b> · ${what} · ${gps} · 💶 ${fmtMoney(DRIVE.earned)}<div style="font-size:11px;opacity:.75;margin-top:3px">${L('W/S gas e freno · A/D sterza · Spazio freno a mano · C visuale · M motore · 📻 radio in alto · Esc esci', 'W/S throttle & brake · A/D steer · Space handbrake · C camera · M engine · 📻 radio top · Esc exit')}</div><div style="margin-top:4px">` +
    Object.keys(DRIVE_KINDS).map(k => `<button onclick="startDrive('${k}')" style="margin:0 2px">${{ car: '🚗 ' + L('Auto', 'Car'), taxi: '🚕 Taxi', van: '📦 ' + L('Consegne', 'Delivery'), bus: '🚌 Bus' }[k]}</button>`).join('') + `<button onclick="stopDrive()" style="margin-left:6px">✕</button></div>`;
}
function driveUpdate(dt) {
  DRIVE.t += dt;
  const K = DRIVE.keys, gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g) : null;
  let thr = (K.KeyW || K.ArrowUp ? 1 : 0), brk = (K.KeyS || K.ArrowDown ? 1 : 0), steer = (K.KeyA || K.ArrowLeft ? 1 : 0) - (K.KeyD || K.ArrowRight ? 1 : 0), hand = K.Space ? 1 : 0;
  if (gp) { thr = Math.max(thr, gp.buttons[7]?.value || 0); brk = Math.max(brk, gp.buttons[6]?.value || 0); if (Math.abs(gp.axes[0]) > 0.15) steer = -gp.axes[0]; if (gp.buttons[0]?.pressed) hand = 1; const y = !!gp.buttons[3]?.pressed; if (y && !DRIVE.gpY) DRIVE.view = DRIVE.view === 'chase' ? 'cockpit' : 'chase'; DRIVE.gpY = y; }
  const kind = DRIVE_KINDS[DRIVE.kind], near = findNearSeg(DRIVE.x, DRIVE.z, 0), onRoad = near && near.d < RT[near.seg.type].w / 2 + 0.5 && !RT[near.seg.type].rail;
  const vmax = onRoad ? Math.max(14, RT[near.seg.type].speed * 1.35) * (kind[4] / 40) : 9;
  let a = thr * (DRIVE.kind === 'bus' ? 2.6 : 5.5);
  if (brk) a += DRIVE.v > 0.3 ? -10 : -3.5;
  if (hand) a += DRIVE.v > 0 ? -16 : 16 * (DRIVE.v < 0 ? 1 : 0);
  a -= DRIVE.v * 0.08 + Math.sign(DRIVE.v) * 0.4 * (thr ? 0 : 1);
  DRIVE.v = clamp(DRIVE.v + a * dt, -7, vmax); if (!thr && !brk && Math.abs(DRIVE.v) < 0.3) DRIVE.v = 0;
  if (DRIVE.v > vmax) DRIVE.v = lerp(DRIVE.v, vmax, 0.1);
  DRIVE.yaw += steer * DRIVE.v * dt * 0.09 / (1 + Math.abs(DRIVE.v) * 0.025) * (DRIVE.kind === 'bus' ? 0.7 : 1);
  const fx = Math.sin(DRIVE.yaw), fz = Math.cos(DRIVE.yaw), nx = DRIVE.x + fx * DRIVE.v * dt, nz = DRIVE.z + fz * DRIVE.v * dt;
  if (!inMap(nx, nz) || walkBlocked(nx + fx * kind[0] / 2, nz + fz * kind[0] / 2)) { if (Math.abs(DRIVE.v) > 6) toast('💥 ' + L('Bum!', 'Bump!'), 900); DRIVE.v *= -0.25; }
  else { DRIVE.x = nx; DRIVE.z = nz; }
  const gy = groundWalk(DRIVE.x, DRIVE.z); DRIVE.y = lerp(DRIVE.y, gy, 0.35);
  driveMesh.position.set(DRIVE.x, DRIVE.y, DRIVE.z); driveMesh.rotation.y = DRIVE.yaw;
  const t = driveTarget(); driveMark.visible = !!t; if (t) driveMark.position.set(t.x, getH(t.x, t.z) + 30, t.z);
  if (DRIVE.view === 'cockpit') {
    const h = kind[2] * (DRIVE.kind === 'bus' ? 0.75 : 0.85) + 0.3, f0 = kind[0] * 0.22;
    camera.position.set(DRIVE.x + fx * f0, DRIVE.y + h, DRIVE.z + fz * f0); camera.lookAt(DRIVE.x + fx * 40, DRIVE.y + h - 1, DRIVE.z + fz * 40);
  } else {
    const back = 9 + kind[0], up = 3.5 + kind[2];
    const cx = DRIVE.x - fx * back, cz = DRIVE.z - fz * back, cy = Math.max(DRIVE.y + up, groundWalk(cx, cz) + 1.5);
    camera.position.lerp(_dv.set(cx, cy, cz), 0.25); camera.lookAt(DRIVE.x + fx * 6, DRIVE.y + 1.6, DRIVE.z + fz * 6);
  }
  camera.near = 0.2; camera.updateProjectionMatrix();
  cam.tx = DRIVE.x; cam.tz = DRIVE.z; cam.dist = 80;
  driveJobTick(); driveSound();
  if ((DRIVE.hudT = (DRIVE.hudT || 0) + dt) > 0.2) { DRIVE.hudT = 0; driveHudUpdate(); }
}
const _dv = new THREE.Vector3();
{
  let lastT = performance.now();
  const _uc = updateCamera;
  updateCamera = function () { const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now; if (DRIVE.on && S) return driveUpdate(dt); return _uc(); };
  const GRAB = new Set(['Space', 'KeyV', 'KeyB', 'KeyC', 'KeyM', 'KeyU', 'KeyJ', 'KeyR', 'KeyF', 'KeyQ', 'KeyE', 'Escape', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyP', 'KeyK']);
  addEventListener('keydown', e => {
    if (!DRIVE.on) return; const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    DRIVE.keys[e.code] = true;
    if (e.code === 'KeyC') DRIVE.view = DRIVE.view === 'chase' ? 'cockpit' : 'chase';
    if (e.code === 'KeyM') { DRIVE.mute = !DRIVE.mute; driveSound(); }
    if (e.code === 'Escape') stopDrive();
    if (GRAB.has(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  addEventListener('keyup', e => { DRIVE.keys[e.code] = false; }, true);
  addEventListener('blur', () => { DRIVE.keys = {}; });
  const _bt = buildToolbar;
  buildToolbar = function () {
    _bt();
    const r = $('right'); if (!r || r.querySelector('#drivebtn')) return;
    const b = document.createElement('button'); b.id = 'drivebtn'; b.title = L('Guida tu (auto, taxi, consegne, bus)', 'Drive yourself (car, taxi, delivery, bus)'); b.textContent = '🚗';
    b.onclick = () => DRIVE.on ? stopDrive() : startDrive('car');
    const w = [...r.children].find(c => (c.getAttribute('onclick') || '').includes("'walk'")); if (w) r.insertBefore(b, w.nextSibling); else r.appendChild(b);
  };
}

if (typeof __cm !== 'undefined') Object.assign(__cm, { DRIVE, startDrive, stopDrive, driveUpdate, setToll, tollRebuild, drawRailSignals, plannerHTML, netMapSVG, planeSlots, shipDeco });
