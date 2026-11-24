'use strict';
// =====================================================================
//  CITY MANAGER - base: lingua, utilità, terreno, risorse, caselle
// =====================================================================
let LANG = 'it';
const L = (it, en) => (LANG === 'en' ? en : it);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);
const rand = Math.random;
const pick = a => a[Math.floor(rand() * a.length)];
function fmtNum(v) { return Math.round(v).toLocaleString(LANG === 'en' ? 'en-US' : 'it-IT'); }
function fmtMoney(v) { return (v < 0 ? '-' : '') + '€ ' + fmtNum(Math.abs(v)); }
function hash32(n) { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function makeNoise(seed) {
  const r = mulberry32(seed), p = new Uint8Array(512), perm = [];
  for (let i = 0; i < 256; i++) perm.push(i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const g = (h, x, y) => { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
  const f = t => t * t * t * (t * (t * 6 - 15) + 10);
  return function (x, y) {
    let X = Math.floor(x), Y = Math.floor(y); x -= X; y -= Y; X &= 255; Y &= 255;
    const u = f(x), v = f(y), a = p[X] + Y, b = p[X + 1] + Y;
    return lerp(lerp(g(p[a], x, y), g(p[b], x - 1, y), u), lerp(g(p[a + 1], x, y - 1), g(p[b + 1], x - 1, y - 1), u), v) * 0.75;
  };
}
function fbm(n, x, y, oct) { let s = 0, a = 1, f = 1, t = 0; for (let i = 0; i < oct; i++) { s += n(x * f, y * f) * a; t += a; a *= 0.5; f *= 2.03; } return s / t; }

// ---------- Mappa: 102,4 x 102,4 km = 10.486 km² ----------
const MAP = 102400, HALF = 51200;
const HN = 2561, HC = MAP / (HN - 1);         // altezze ogni 40 m
const G = 1024, GC = MAP / G;                   // griglia simulazione: 100 m
const TILE = 1280, NT = 80;                     // 6400 caselle da 1,28 km
const OHALF = 5120, OHN = 513, OHC = 20;        // la vecchia mappa da 10 km (centro): salvataggi e mappe vere
const CN = 641, CC = MAP / (CN - 1);            // mondo grezzo ogni 160 m
const DETR = 11000;                             // fino a qui dal centro il terreno è calcolato preciso
let H = new Float32Array(HN * HN);              // altezze attuali
let H0 = new Float32Array(HN * HN);             // altezze generate (per i salvataggi)
let WATER = 0;                                  // livello del mare (si alza con le alluvioni)
const RES = { fert: new Float32Array(G * G), forest: new Float32Array(G * G), oil: new Float32Array(G * G), ore: new Float32Array(G * G), gw: new Float32Array(G * G) };
let NOISE = null;

function riverX(z) { return 650 + Math.sin(z / 1500) * 600 + Math.sin(z / 530 + 1) * 170 + NOISE(z / 2000, 7.3) * 300; }
function coastZ(x) { return 3150 + NOISE(x / 2500, 3.1) * 700 + Math.sin(x / 1800) * 260; }
function riverW(z) { return 45 + smooth(-5000, 3000, z) * 45; }

// ---------- mappe ispirate a luoghi veri (forme semplificate: coste, fiumi, isole, colline) ----------
// coordinate: x verso est, z verso sud, la mappa va da -5120 a +5120 m
const MAPS = {
  valley: { n: () => L('Valle del fiume', 'River valley'), d: () => L('Montagne a nord, un fiume che scende al mare a sud, un lago in collina.', 'Mountains to the north, a river flowing to the sea in the south, a hill lake.'), temp: 0 },
  tokyo: { n: () => 'Tokyo', temp: 2, hill: 0.35, d: () => L('Il centro di Tokyo con la baia, i canali e le isole artificiali del porto, il fiume Sumida.', 'Central Tokyo with the bay, the canals, the port\'s artificial islands and the Sumida river.'),
    f: [{ t: 'sea', n: [0.45, 0.89], off: 3400, wig: 500 }, { t: 'river', p: [[600, -5200], [900, -2500], [500, 0], [1200, 2000], [1500, 4200]], w: 70 }, { t: 'river', p: [[2800, -5200], [2500, -2000], [3300, 1000], [3600, 3000]], w: 110 }, { t: 'range', n: [-1, 0], off: 3400, width: 1400, hgt: 520 }, { t: 'island', c: [4300, 4300], r: 260, hgt: 12 }] },
  newyork: { n: () => 'New York', temp: 0, hill: 0.3, d: () => L('Manhattan tra l\'Hudson e l\'East River, con Brooklyn, il New Jersey e il porto.', 'Manhattan between the Hudson and the East River, with Brooklyn, New Jersey and the harbor.'),
    f: [{ t: 'river', p: [[-1900, -5200], [-1750, -2000], [-1650, 1000], [-1300, 3200]], w: 420 }, { t: 'river', p: [[5200, -2700], [2000, -2600], [700, -1600], [450, 1000], [-200, 3000]], w: 190 }, { t: 'disc', c: [-700, 3900], r: 1700, wig: 300 }, { t: 'sea', n: [0.35, 0.94], off: 4300, wig: 350 }, { t: 'island', c: [-2600, 4400], r: 900, hgt: 40 }, { t: 'peak', c: [-3800, -2500], r: 1300, hgt: 90 }] },
  hongkong: { n: () => 'Hong Kong', temp: 6, hill: 0.6, d: () => L('Il porto di Victoria tra Kowloon e l\'isola di Hong Kong, con le sue montagne ripide.', 'Victoria Harbour between Kowloon and Hong Kong Island, with its steep mountains.'),
    f: [{ t: 'river', p: [[-5300, 1700], [-2000, 1400], [0, 1250], [2500, 1500], [5300, 1100]], w: 380 }, { t: 'sea', n: [0, 1], off: 3900, wig: 350 }, { t: 'disc', c: [-4600, 3000], r: 1500, wig: 300 }, { t: 'peak', c: [-200, 2650], r: 1300, hgt: 420 }, { t: 'peak', c: [2300, 2700], r: 1000, hgt: 300 }, { t: 'range', n: [0, -1], off: 2300, width: 1300, hgt: 620 }, { t: 'island', c: [-4300, 4200], r: 1000, hgt: 260 }, { t: 'island', c: [3800, 4400], r: 450, hgt: 90 }, { t: 'island', c: [1200, 4600], r: 320, hgt: 60 }] },
  canarie: { n: () => L('Isole Canarie', 'Canary Islands'), temp: 6, hill: 0.8, d: () => L('Las Palmas di Gran Canaria: la città sulla costa, la penisola della Isleta e le colline dell\'interno.', 'Las Palmas de Gran Canaria: the city on the coast, the Isleta peninsula and the inland hills.'),
    f: [{ t: 'sea', n: [0, 1], off: 3300, wig: 450 }, { t: 'sea', n: [-1, 0], off: 4100, wig: 450 }, { t: 'volcano', c: [2200, -3000], r: 2600, hgt: 950 }, { t: 'island', c: [-3600, 4400], r: 750, hgt: 120 }, { t: 'peak', c: [-3600, -2600], r: 1500, hgt: 220 }] },
  london: { n: () => L('Londra', 'London'), temp: -1, hill: 0.3, d: () => L('Il centro di Londra con il Tamigi che fa le sue anse, da Westminster all\'Isle of Dogs.', 'Central London with the winding Thames, from Westminster to the Isle of Dogs.'),
    f: [{ t: 'river', p: [[-5300, 300], [-3800, 1300], [-2600, 500], [-1500, 1300], [-500, 900], [400, 1000], [900, 1600], [1600, 1900], [2100, 1300], [2900, 1200], [3800, 1700], [5300, 1500]], w: 120 }, { t: 'peak', c: [-1200, -2800], r: 1500, hgt: 110 }, { t: 'peak', c: [800, 4000], r: 1700, hgt: 120 }] },
  tampere: { n: () => 'Tampere', temp: -7, hill: 0.45, d: () => L('Tampere tra il lago Näsijärvi a nord e il Pyhäjärvi a sud, unite dalle rapide. Inverni con tanta neve.', 'Tampere between lake Näsijärvi to the north and Pyhäjärvi to the south, joined by the rapids. Snowy winters.'),
    f: [{ t: 'disc', c: [-400, -4300], r: 2600, wig: 500 }, { t: 'disc', c: [3000, -3600], r: 1700, wig: 400 }, { t: 'disc', c: [-1200, 4300], r: 2400, wig: 500 }, { t: 'disc', c: [2600, 3800], r: 1500, wig: 400 }, { t: 'river', p: [[-300, -1900], [-250, 0], [-500, 2000]], w: 35 }, { t: 'island', c: [-1300, -3600], r: 300, hgt: 15 }, { t: 'island', c: [900, -4200], r: 420, hgt: 20 }, { t: 'island', c: [-500, 3700], r: 350, hgt: 15 }, { t: 'disc', c: [4400, 300], r: 600, wig: 200 }] },
  seoul: { n: () => 'Seoul', temp: -3, hill: 0.55, d: () => L('Il centro di Seoul con la collina di Namsan, le montagne intorno e il fiume Han a sud.', 'Central Seoul with Namsan hill, the surrounding mountains and the Han river to the south.'),
    f: [{ t: 'river', p: [[5300, 2000], [3500, 1600], [1800, 2300], [0, 1700], [-1800, 1200], [-3500, 1700], [-5300, 1200]], w: 330 }, { t: 'peak', c: [-700, 300], r: 600, hgt: 190 }, { t: 'range', n: [0, -1], off: 2300, width: 1500, hgt: 650 }, { t: 'range', n: [0, 1], off: 3700, width: 900, hgt: 450 }, { t: 'island', c: [-2400, 1450], r: 260, hgt: 4 }] },
  oslo: { n: () => 'Oslo', temp: -5, hill: 0.6, d: () => L('Oslo in fondo al fiordo, con le isolette e le colline coperte di boschi.', 'Oslo at the head of the fjord, with small islands and forested hills.'),
    f: [{ t: 'river', p: [[600, 5300], [300, 4000], [-300, 3100], [-200, 2400]], w: 900 }, { t: 'disc', c: [-600, 2500], r: 1200, wig: 250 }, { t: 'disc', c: [-2300, 2900], r: 800, wig: 250 }, { t: 'island', c: [-400, 2900], r: 230, hgt: 25 }, { t: 'island', c: [300, 3700], r: 300, hgt: 30 }, { t: 'island', c: [-1300, 2600], r: 180, hgt: 15 }, { t: 'range', n: [0, -1], off: 2000, width: 1600, hgt: 480 }, { t: 'range', n: [1, 0], off: 3200, width: 1500, hgt: 380 }, { t: 'range', n: [-1, 0], off: 3800, width: 1200, hgt: 380 }] },
};
const MAP_ORDER = ['valley', 'tokyo', 'newyork', 'hongkong', 'canarie', 'london', 'tampere', 'seoul', 'oslo'];
let MAPID = 'valley';
const WD = new Float32Array(G * G); // distanza dall'acqua (per i terreni fertili), sulla griglia della simulazione
function polyDist(p, x, z) { let b = 1e9; for (let k = 0; k < p.length - 1; k++) { const [ax, az] = p[k], [bx, bz] = p[k + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); b = Math.min(b, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return b; }
// estende i fiumi oltre la vecchia mappa (continuano dritti fino al bordo del mondo)
function extendFeatures(M) {
  if (!M.f || M.fx) return; M.fx = true;
  for (const f of M.f) if (f.t === 'river' && f.ext !== 'none') { const p = f.p, ext = (a, b) => { const dx = a[0] - b[0], dz = a[1] - b[1], l = Math.hypot(dx, dz) || 1; return [a[0] + dx / l * 60000, a[1] + dz / l * 60000]; }; f.p = [...(f.ext === 'b' ? [] : [ext(p[0], p[1])]), ...p, ...(f.ext === 'a' ? [] : [ext(p[p.length - 1], p[p.length - 2])])]; }
}
let PN1 = null, PN2 = null;
// colori e risorse del terreno che cambiano da mappa a mappa: rocce e neve più in alto sulle Alpi, sabbia nel deserto, tundra in Alaska
const TFX = { rock: 380, snow: 600, fert: 60, forest: 520, gw: 400, sand: null, tundra: 0 };
let DESN = null; // rumore fisso per il bordo del deserto (uguale anche nell'anteprima del menu)
function desertMask(f, x, z) { const far = smooth(5000, 15000, Math.hypot(x, z)); if (!DESN) DESN = makeNoise(4242); return smooth(f.off, f.off + f.w, x * f.n[0] + z * f.n[1] + Math.sin(x / 2300) * 600 + Math.sin(z / 1700 + 1.3) * 450 + (far > 0 ? far * (DESN(x / 18000 + 5.1, z / 18000 - 3.3) * 15000 + Math.sin(z / 9000 + 0.7) * 2500) : 0)); }
function mapSandFn(M) { const ds = ((M && M.f) || []).filter(f => f.t === 'desert'); if (!ds.length) return null; return (x, z) => { let m = 0; for (const f of ds) m = Math.max(m, desertMask(f, x, z)); return m; }; }
function setTFX(M) { M = M || {}; TFX.rock = M.rockH ?? 380; TFX.snow = M.snowH ?? 600; TFX.fert = M.fertH ?? 60; TFX.forest = M.forestH ?? 520; TFX.gw = M.gwH ?? 400; TFX.sand = mapSandFn(M); TFX.tundra = M.tundra || 0; }
// rilievo lontano dal centro: colline basse, pianure e qua e là gruppi di montagne
function farRelief(x, z, k) {
  const hills = (fbm(PN1, x / 11000, z / 11000, 3) * 0.5 + 0.5) * 70;
  const mask = smooth(0.18, 0.5, fbm(PN2, x / 32000 + 3.1, z / 32000 - 1.7, 2));
  const mount = Math.max(0, 1 - Math.abs(fbm(PN2, x / 6500, z / 6500, 4) * 1.7)) ** 2 * 1100 * mask * k;
  return hills + mount;
}
function presetAt(M, x, z) {
  let h = 14 + fbm(PN1, x / 3200, z / 3200, 4) * 40 * M.hill;
  const corr = 1 - 0.9 * smooth(650, 300, Math.abs(z + 950)) * (M.corrX ? smooth(M.corrX + 3000, M.corrX, Math.abs(x)) : 1);
  const ridge = Math.max(0, 1 - Math.abs(fbm(PN2, x / 1900, z / 1900, 5) * 1.6));
  let sw = -1e9, isl = -1e9, wb = null, wq = null; // sw > 0 dentro l'acqua
  for (const f of M.f) {
    const wn = f.t === 'sea' || f.t === 'disc' ? (f.wig ? (wb ??= fbm(NOISE, x / 2300 + 5.3, z / 2300 - 2.1, 4)) * f.wig * 4.5 : (wq ??= NOISE(x / 900, z / 900)) * 25) : 0;
    if (f.t === 'sea') sw = Math.max(sw, x * f.n[0] + z * f.n[1] - f.off + wn + (f.big ? NOISE(x / 16000 + 2.2, z / 16000 - 1.3) * f.big * smooth(5000, 15000, Math.hypot(x, z)) : 0));
    else if (f.t === 'river') sw = Math.max(sw, f.w - polyDist(f.p, x, z) + NOISE(x / 600, z / 600) * f.w * 0.15);
    else if (f.t === 'disc') sw = Math.max(sw, f.r - Math.hypot(x - f.c[0], z - f.c[1]) + wn);
    else if (f.t === 'island') { const d = Math.hypot(x - f.c[0], z - f.c[1]) + NOISE(x / 400, z / 400) * f.r * 0.35; isl = Math.max(isl, f.r - d); if (d < f.r) h = Math.max(h, 3) + f.hgt * smooth(f.r, f.r * 0.2, d) * (0.7 + ridge * 0.6); }
    else if (f.t === 'peak') { const d = Math.hypot(x - f.c[0], z - f.c[1]); h += f.hgt * (1 - smooth(0, f.r, d)) ** 1.6 * (0.6 + ridge * 0.6) * corr; }
    else if (f.t === 'range') { const m = smooth(f.off, f.off + f.width, x * f.n[0] + z * f.n[1] + (f.rw ? NOISE(x / 4000 + 1.9, z / 4000 - 0.6) * f.rw : 0)) * corr * (1 - (f.keep == null ? 0.85 : 1 - f.keep) * smooth(7000, 16000, Math.max(Math.abs(x), Math.abs(z)))); h += m * (ridge ** 2 * f.hgt + f.hgt * 0.12); }
    else if (f.t === 'desert') { const m = desertMask(f, x, z); if (m > 0) h += m * (Math.abs(NOISE(x / 190 + 3.3, z / 520 - 1.1)) * 16 + 3); }
    else if (f.t === 'lakes') { const m = smooth(f.r0 || 0, (f.r0 || 0) + 2500, Math.hypot(x + 640, z - 640)), u = x / f.s, v = z / f.s, wq2 = NOISE(u * 0.35 + 1.7, v * 0.35 - 2.9) * 0.9, dens = NOISE(x / 26000 - 7.7, z / 26000 + 4.4) * 0.3; sw = Math.max(sw, (fbm(NOISE, u * 0.7 + wq2 + 9.1, v * 1.3 - wq2 * 0.6 - 4.7, 4) - f.th + dens - (1 - m) * 0.6) * f.s * 0.9); }
    else if (f.t === 'volcano') { const d = Math.hypot(x - f.c[0], z - f.c[1]) + NOISE(x / 500, z / 500) * 160; const cone = (1 - smooth(0, f.r, d)) ** 1.4 * f.hgt * corr; const crater = (1 - smooth(f.r * 0.04, f.r * 0.1, d)) * f.hgt * 0.12 * corr; h += cone - crater + (d < f.r ? ridge * 70 * corr : 0); }
  }
  // fuori dalla vecchia mappa: colline e montagne lontane
  const far = smooth(7000, 16000, Math.max(Math.abs(x), Math.abs(z)));
  if (far > 0) h += far * farRelief(x, z, 0.4 + M.hill);
  if (isl > -1e8) sw = Math.min(sw, -isl);
  if (sw > -700) h = lerp(Math.min(h, 4 + Math.max(0, -sw) * 0.01), h, smooth(-40, -700, sw));
  if (sw > -20) h = lerp(h, -6 - Math.min(Math.max(sw, 0), 1500) * 0.012, smooth(-20, 60, sw));
  return [h, Math.max(0, -sw)];
}
// caricamenti a passi: i generatori restituiscono (yield) a che punto sono, da 0 a 1
function runSync(g) { let r; do r = g.next(); while (!r.done); return r.value; }
function* sub(g, a, b) { let r; while (!(r = g.next()).done) if (typeof r.value === 'number') yield a + (b - a) * r.value; return r.value; }
let MAPS_PROG = 0;
// le mappe delle città usano le altezze vere, decompresse all'avvio
const MAPH = {};
const MAPS_READY = (async () => {
  const keys = Object.keys(MAPDATA); let done = 0;
  for (const k in MAPDATA) {
    try {
      const bin = atob(MAPDATA[k]), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const ab = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const n = (k.startsWith('w_') || k.startsWith('m_')) ? CN : OHN, dl = new Int16Array(ab), h = new Float32Array(n * n);
      for (let j = 0; j < n; j++) { let q = 0; for (let i = 0; i < n; i++) { q += dl[j * n + i]; h[j * n + i] = q / 2; } }
      MAPH[k] = h; MAPS_PROG = ++done / keys.length;
    } catch (e) { console.error('mappa', k, e); }
  }
})();
// mondo da 100 km: una griglia grezza (160 m) per tutto, più precisa (40 m) al centro, più un po' di rilievo fine
function genTerrain(seed, mapId) { runSync(genTerrainG(seed, mapId)); }
function* genTerrainG(seed, mapId) {
  NOISE = makeNoise(seed); PN1 = makeNoise(seed + 11); PN2 = makeNoise(seed + 23);
  MAPID = MAPS[mapId] ? mapId : 'valley';
  const M = MAPS[MAPID]; if (MAPID !== 'valley') extendFeatures(M); setTFX(M);
  const at = MAPID === 'valley' ? valleyAt : (x, z) => presetAt(M, x, z);
  const real = MAPH[MAPID], wreal = MAPH['w_' + MAPID], mreal = MAPH['m_' + MAPID];
  // 1) grezzo
  const CH = new Float32Array(CN * CN), CW = new Float32Array(CN * CN);
  for (let j = 0; j < CN; j++) for (let i = 0; i < CN; i++) {
    const x = -HALF + i * CC, z = -HALF + j * CC, k = j * CN + i;
    if (wreal) { CH[k] = wreal[k]; CW[k] = wreal[k] < 0.5 ? 0 : 2000; } else { const r = at(x, z); CH[k] = r[0]; CW[k] = r[1]; }
  }
  const cS = (A, x, z) => { let fx = clamp((x + HALF) / CC, 0, CN - 1.001), fz = clamp((z + HALF) / CC, 0, CN - 1.001); const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * CN + i; return lerp(lerp(A[k], A[k + 1], u), lerp(A[k + CN], A[k + CN + 1], u), v); };
  yield 0.25;
  // 2) dettaglio: rilievo fine sulla terra (senza toccare coste e acqua)
  const dn = makeNoise(seed + 77);
  for (let j = 0; j < HN; j++) { if (j % 400 === 399) yield 0.25 + 0.5 * j / HN; const z = -HALF + j * HC; for (let i = 0; i < HN; i++) { const x = -HALF + i * HC; let h = cS(CH, x, z); if (h > 4) h += (dn(x / 700, z / 700) * 9 + dn(x / 230, z / 230) * 3) * smooth(4, 30, h); H[j * HN + i] = h; } }
  // 2b) riquadro medio vero (40 m, 25,6 km) per le mappe che ce l'hanno, con i bordi sfumati
  if (mreal && M.mid) {
    const MH = (CN - 1) * HC / 2, i0 = Math.round((M.mid[0] - MH + HALF) / HC), j0 = Math.round((M.mid[1] - MH + HALF) / HC);
    for (let b = 0; b < CN; b++) { const j = j0 + b; if (j < 0 || j >= HN) continue; for (let a = 0; a < CN; a++) { const i = i0 + a; if (i < 0 || i >= HN) continue; const k = j * HN + i; H[k] = lerp(H[k], mreal[b * CN + a], smooth(0, 1200, Math.min(a, b, CN - 1 - a, CN - 1 - b) * HC)); } }
  }
  yield 0.78;
  // 3) centro preciso: la vecchia mappa (uguale a prima, così i salvataggi vecchi funzionano)
  const n = Math.ceil(DETR / HC), c = (HN - 1) / 2;
  for (let j = c - n; j <= c + n; j++) for (let i = c - n; i <= c + n; i++) {
    const x = -HALF + i * HC, z = -HALF + j * HC, d = Math.max(Math.abs(x), Math.abs(z)), k = j * HN + i;
    let hp;
    if (real) { if (d > OHALF + 1500) continue; const oi = (x + OHALF) / OHC, oj = (z + OHALF) / OHC; if (oi < 0 || oj < 0 || oi > OHN - 1 || oj > OHN - 1) continue; hp = real[Math.round(oj) * OHN + Math.round(oi)]; if (d > OHALF - 1) { H[k] = lerp(hp, H[k], 1); continue; } }
    else hp = at(x, z)[0];
    const w = real ? 1 : smooth(DETR, DETR - 2500, d);
    H[k] = lerp(H[k], hp, w);
  }
  if (real) { // fascia di raccordo fuori dalla vecchia mappa vera
    for (let j = c - n; j <= c + n; j++) for (let i = c - n; i <= c + n; i++) { const x = -HALF + i * HC, z = -HALF + j * HC, d = Math.max(Math.abs(x), Math.abs(z)); if (d <= OHALF || d > OHALF + 1500) continue; const ex = clamp(x, -OHALF, OHALF), ez = clamp(z, -OHALF, OHALF), he = real[Math.round((ez + OHALF) / OHC) * OHN + Math.round((ex + OHALF) / OHC)], k = j * HN + i; H[k] = lerp(he, H[k], smooth(OHALF, OHALF + 1500, d)); }
  }
  yield 0.9;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) WD[j * G + i] = real && Math.max(Math.abs(-HALF + (i + 0.5) * GC), Math.abs(-HALF + (j + 0.5) * GC)) < OHALF ? (getH(-HALF + (i + 0.5) * GC, -HALF + (j + 0.5) * GC) < 0.5 ? 0 : 2000) : cS(CW, -HALF + (i + 0.5) * GC, -HALF + (j + 0.5) * GC);
  genResources(seed);
}
function valleyAt(x, z) {
  let h = 22 + fbm(PN1, x / 3200, z / 3200, 4) * 40;
  const corr = 1 - 0.88 * smooth(750, 200, Math.abs(z + 750));
  const far = smooth(7000, 18000, Math.hypot(x, z));
  const mMask = corr * Math.min(1, smooth(-1300, -4300, z) + smooth(-1800, -4900, x) * 0.8 + smooth(2600, 4900, x) * 0.5 * smooth(1500, -3000, z)) * (1 - far);
  const ridge = 1 - Math.abs(fbm(PN2, x / 1900, z / 1900, 5) * 1.6);
  h += mMask * (Math.max(0, ridge) ** 2 * 700 + 50);
  // lontano dal centro: le Alpi a nord, colline altrove
  if (far > 0) h += far * (farRelief(x, z, 0.7) + smooth(-14000, -34000, z) * Math.max(0, 1 - Math.abs(fbm(PN2, x / 7000, z / 7000, 4) * 1.7)) ** 2 * 1500);
  // costa e mare a sud
  const cz = coastZ(x), d = z - cz;
  if (d > -500) h = lerp(h, -22 - Math.min(Math.max(d, 0), 1800) * 0.015, smooth(-500, 140, d));
  // fiume da nord verso il mare
  if (d < 250) {
    const rx = riverX(z), dr = Math.abs(x - rx), w = riverW(z);
    const valley = smooth(w + 30, w + 950, dr);
    h = lerp(Math.min(h, 7), h, valley);
    const bank = smooth(w * 0.55, w + 25, dr);
    h = lerp(-5.5, h, bank);
  }
  // un lago in collina a est
  const ld = Math.sqrt(dist2(x, z, 3300, -1700)) + NOISE(x / 300, z / 300) * 90;
  if (ld < 520) h = lerp(-4, h, smooth(330, 520, ld));
  return [h, Math.abs(x - riverX(z))];
}
function genResources(seed) {
  H0.set(H);
  // risorse naturali
  const n3 = makeNoise(seed + 37), n4 = makeNoise(seed + 41), n5 = makeNoise(seed + 53);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const x = -HALF + (i + 0.5) * GC, z = -HALF + (j + 0.5) * GC, h = getH(x, z), k = j * G + i;
    const sl = slopeAt(x, z);
    RES.fert[k] = h > 1 && h < TFX.fert && sl < 0.08 ? clamp(0.3 + NOISE(x / 900, z / 900) * 1.2 + (1 - smooth(200, 1600, WD[k])) * 0.5, 0, 1) : 0;
    RES.forest[k] = h > 2 && h < TFX.forest ? clamp(fbm(n3, x / 1400, z / 1400, 3) * 2.2 + 0.15, 0, 1) : 0;
    RES.oil[k] = h > 1 ? clamp((n4(x / 1100, z / 1100) - 0.28) * 4, 0, 1) : 0;
    RES.gw[k] = h > 1.5 && h < TFX.gw ? clamp(fbm(n5, x / 1300, z / 1300, 3) * 2.4 - 0.02 + (1 - smooth(150, 1200, WD[k])) * 0.25, 0, 1) : 0;
    RES.ore[k] = h > 60 ? clamp((n4(x / 800 + 50, z / 800) - 0.18) * 3 + smooth(80, 300, h) * 0.4, 0, 1) : 0;
    if (TFX.sand) { const s = TFX.sand(x, z); if (s > 0) { RES.fert[k] *= 1 - s; RES.forest[k] *= 1 - s; RES.gw[k] *= 1 - s * 0.7; } }
    if (TFX.tundra) RES.fert[k] *= 1 - TFX.tundra * 0.5;
  }
}
function getH(x, z) {
  let fx = (x + HALF) / HC, fz = (z + HALF) / HC;
  fx = clamp(fx, 0, HN - 1.001); fz = clamp(fz, 0, HN - 1.001);
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * HN + i;
  return lerp(lerp(H[k], H[k + 1], u), lerp(H[k + HN], H[k + HN + 1], u), v);
}
function slopeAt(x, z) { const d = 20; return Math.max(Math.abs(getH(x + d, z) - getH(x - d, z)), Math.abs(getH(x, z + d) - getH(x, z - d))) / (2 * d); }
const isWater = (x, z) => getH(x, z) < WATER - 0.3;
const inMap = (x, z) => x > -HALF + 1 && x < HALF - 1 && z > -HALF + 1 && z < HALF - 1;
const gIdx = (x, z) => clamp(Math.floor((z + HALF) / GC), 0, G - 1) * G + clamp(Math.floor((x + HALF) / GC), 0, G - 1);
function gSample(arr, x, z) { return arr[gIdx(x, z)]; }

// caselle di terreno acquistabili
let TILES = new Uint8Array(NT * NT);
const tileIdx = (x, z) => clamp(Math.floor((z + HALF) / TILE), 0, NT - 1) * NT + clamp(Math.floor((x + HALF) / TILE), 0, NT - 1);
const isOwned = (x, z) => inMap(x, z) && TILES[tileIdx(x, z)] === 1;
function tileWater(i) { const tx = i % NT, tz = Math.floor(i / NT); let w = 0; for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) if (isWater(-HALF + (tx + (a + 0.5) / 8) * TILE, -HALF + (tz + (b + 0.5) / 8) * TILE)) w++; return w / 64; }
function tileCost(i) { const tx = i % NT, tz = Math.floor(i / NT); const owned = TILES.reduce((a, b) => a + b, 0); const sea = tileWater(i) > 0.6 ? 0.5 : 1; return Math.round((60000 + owned * 22000) * (1 + 0.3 * Math.hypot(tx - 39.5, tz - 39.5) / 4) * sea); }
function tileBuyable(i) {
  if (TILES[i]) return false;
  const tx = i % NT, tz = Math.floor(i / NT);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const x = tx + a, z = tz + b; return x >= 0 && z >= 0 && x < NT && z < NT && TILES[z * NT + x]; });
}

// ---------- Archivio dei salvataggi ----------
const PREF = 'cityManager_';
function lsGet(k) { try { return localStorage.getItem(PREF + k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(PREF + k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(PREF + k); } catch (e) {} }
async function packStr(str) {
  try {
    if (typeof CompressionStream === 'undefined') throw 0;
    const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return 'Z' + btoa(s);
  } catch (e) { return 'J' + str; }
}
async function unpackStr(s) {
  if (!s) return null;
  if (s[0] === 'J') return s.slice(1);
  const bin = atob(s.slice(1)), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
