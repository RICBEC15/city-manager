// =====================================================================
//  Mod di Cities: Skylines II - Blocco 4: mappe nuove
//  - Alpi svizzere (Jungfrau): Interlaken tra i laghi, la valle di Lauterbrunnen
//    con le pareti di roccia e le cascate, Eiger, Mönch e Jungfrau (altezze vere)
//  - Alaska vulcanica (Capo Lazaref, isola di Unimak): tundra, oceano, vulcano che fuma (altezze vere)
//  - tre mappe inventate: laghi e isole, costa con stretti e deserto, lunga valle tra le montagne
//  Le idee vengono dalle mappe delle mod; forme, nomi e codice sono nostri.
// =====================================================================
CLIM.subpolar = { n: () => L('Subpolare (fresco tutto l\'anno, vento e neve)', 'Subpolar (cool all year, wind and snow)'), amp: 0.6, off: -8, day: 4.5 };

Object.assign(MAPS, {
  jungfrau: {
    n: () => L('Alpi svizzere (Jungfrau)', 'Swiss Alps (Jungfrau)'), temp: -3, hill: 0.6, f: [], theme: 'eu',
    mid: [5000, 11000], rockH: 1450, snowH: 2050, fertH: 650, forestH: 1350, gwH: 1300,
    falls: [[2628, 10625], [2450, 11900], [3350, 11400], [3187, 14132], [2150, 15400], [2900, 16600]],
    d: () => L('Interlaken tra il lago di Thun e il lago di Brienz. A sud la valle di Lauterbrunnen con le pareti di roccia alte 500 metri e le cascate, poi Eiger, Mönch e Jungfrau con i ghiacciai. Altezze vere, valle disegnata con precisione.',
      'Interlaken between Lake Thun and Lake Brienz. To the south, the Lauterbrunnen valley with its 500-metre rock walls and waterfalls, then the Eiger, Mönch and Jungfrau with their glaciers. Real heights, detailed valley.'),
  },
  alaska: {
    n: () => L('Alaska vulcanica (Capo Lazaref)', 'Volcanic Alaska (Cape Lazaref)'), temp: -3, hill: 0.5, f: [], clim: 'subpolar', theme: 'us',
    rockH: 520, snowH: 820, forestH: 0, tundra: 1, smoke: [[-25969, -13097]],
    d: () => L('Capo Lazaref sull\'isola di Unimak: tundra senza alberi, laghetti e l\'oceano Pacifico. A nord-ovest il vulcano Shishaldin che fuma, a est lo stretto di Isanotski. Fresco e ventoso tutto l\'anno. Altezze vere.',
      'Cape Lazaref on Unimak Island: treeless tundra, small lakes and the Pacific Ocean. To the north-west the smoking Shishaldin volcano, to the east Isanotski Strait. Cool and windy all year. Real heights.'),
  },
  laghi: {
    n: () => L('Laghi e isole', 'Lakes and islands'), temp: -1, hill: 0.45,
    d: () => L('Mappa inventata: una città da costruire tra laghi, fiumi e tante isole, con ponti dappertutto. Fuori dal centro ancora laghi a non finire.',
      'Made-up map: a city to build among lakes, rivers and many islands, with bridges everywhere. Beyond the centre, endless lakes.'),
    f: [
      { t: 'disc', c: [-2700, -2300], r: 1800, wig: 650 },
      { t: 'disc', c: [2600, 2600], r: 1500, wig: 600 },
      { t: 'disc', c: [3300, -2600], r: 850, wig: 200 },
      { t: 'disc', c: [-3400, 3400], r: 900, wig: 220 },
      { t: 'river', p: [[-1500, -1200], [-700, -300], [-100, 300], [700, 900], [1500, 1700]], w: 120, ext: 'none' },
      { t: 'river', p: [[-2500, -5300], [-2350, -3900]], w: 90, ext: 'a' },
      { t: 'river', p: [[3800, 2800], [5300, 3100]], w: 100, ext: 'b' },
      { t: 'river', p: [[2900, -1900], [2600, -900], [1900, 200], [1100, 1100]], w: 70, ext: 'none' },
      { t: 'river', p: [[-2900, 2900], [-1900, 2300], [-900, 1900], [0, 1300], [500, 800]], w: 70, ext: 'none' },
      { t: 'disc', c: [-150, 250], r: 430, wig: 60 },
      { t: 'lakes', s: 2600, th: 0.1, r0: 5000 },
      { t: 'island', c: [-3150, -1900], r: 430, hgt: 28 },
      { t: 'island', c: [-2300, -2950], r: 300, hgt: 14 },
      { t: 'island', c: [-1900, -1700], r: 260, hgt: 10 },
      { t: 'island', c: [-3500, -1500], r: 320, hgt: 15 },
      { t: 'island', c: [2950, 2200], r: 380, hgt: 22 },
      { t: 'island', c: [2150, 3050], r: 250, hgt: 10 },
      { t: 'island', c: [3200, 3100], r: 260, hgt: 8 },
      { t: 'island', c: [-150, 250], r: 210, hgt: 6 },
      { t: 'island', c: [3300, -2600], r: 260, hgt: 12 },
      { t: 'peak', c: [800, -3400], r: 1600, hgt: 140 },
      { t: 'peak', c: [-4300, 400], r: 1200, hgt: 110 },
    ],
  },
  stretti: {
    n: () => L('Stretti del sole', 'Sun straits'), temp: 7, hill: 0.6,
    d: () => L('Mappa inventata: costa calda con spiagge, isole divise da stretti di mare, montagne con le valli a nord e il deserto di sabbia a est.',
      'Made-up map: a warm coast with beaches, islands split by sea straits, mountains and valleys to the north and a sand desert to the east.'),
    f: [
      { t: 'sea', n: [-0.45, 0.89], off: 2700, wig: 420, big: 14000 },
      { t: 'river', p: [[-5300, -700], [-3900, -400], [-2700, 200], [-1800, 1200], [-1000, 2700]], w: 170, ext: 'a' },
      { t: 'island', c: [-2600, 4100], r: 950, hgt: 160 },
      { t: 'island', c: [-500, 4300], r: 750, hgt: 70 },
      { t: 'island', c: [1500, 4700], r: 850, hgt: 110 },
      { t: 'island', c: [3200, 5600], r: 600, hgt: 45 },
      { t: 'island', c: [-4400, 3300], r: 650, hgt: 120 },
      { t: 'island', c: [-4300, 1000], r: 500, hgt: 90 },
      { t: 'range', n: [0, -1], off: 1900, width: 1600, hgt: 820, keep: 0, rw: 1500 },
      { t: 'peak', c: [-3900, -400], r: 1300, hgt: 380 },
      { t: 'desert', n: [1, 0], off: 1200, w: 2200 },
    ],
  },
  argento: {
    n: () => L('Valle d\'argento', 'Silver valley'), temp: -2, hill: 0.55, corrX: 5500,
    d: () => L('Mappa inventata: una lunga valle tra due catene di montagne alte e innevate, con un fiume che fa le anse, un torrente che scende da ovest e un lago in fondo.',
      'Made-up map: a long valley between two high snowy mountain ranges, with a winding river, a stream coming down from the west and a lake at the end.'),
    f: [
      { t: 'range', n: [1, 0], off: 1500, width: 1700, hgt: 1050, keep: 0.55 },
      { t: 'range', n: [-1, 0], off: 2700, width: 1600, hgt: 1150, keep: 0.55 },
      { t: 'river', p: [[200, -7000], [200, -5300], [-300, -3200], [400, -1700], [-500, -300], [200, 1100], [-200, 2600], [500, 3800], [600, 6500]], w: 75 },
      { t: 'disc', c: [700, 4700], r: 950, wig: 260 },
      { t: 'river', p: [[-5300, -1900], [-3300, -1300], [-1600, -900], [-500, -300]], w: 35, ext: 'none' },
      { t: 'peak', c: [-4300, -3300], r: 1300, hgt: 650 },
      { t: 'peak', c: [4200, 2800], r: 1100, hgt: 600 },
    ],
  },
});
MAP_ORDER.splice(1, 0, 'laghi', 'stretti', 'argento');
MAP_ORDER.push('jungfrau', 'alaska');

// nel menu: scegliendo la mappa cambia anche lo stile delle case (l'Alaska ha le case americane)
{
  const _mn = menuNew;
  menuNew = function (...a) {
    const r = _mn.apply(this, a);
    const sel = $('ngMap');
    if (sel) sel.addEventListener('change', () => { const M = MAPS[sel.value]; if (M?.theme && $('ngTheme')) $('ngTheme').value = M.theme; });
    return r;
  };
}

// ---------- cascate e fumo del vulcano ----------
const MAPDECO = { group: null, falls: [], smoke: [], tex: null, stex: null };
function mapDecoClear() {
  if (MAPDECO.group) { scene.remove(MAPDECO.group); MAPDECO.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== MAPDECO.fallMat && o.material !== MAPDECO.mistMat) o.material.dispose?.(); }); }
  MAPDECO.group = null; MAPDECO.falls = []; MAPDECO.smoke = [];
}
function fallTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  const img = g.createImageData(64, 256), d = img.data, r = mulberry32(7), col = [], fr = [], ph = [];
  for (let i = 0; i < 64; i++) { col.push(0.5 + r() * 0.5); fr.push(2 + Math.floor(r() * 4)); ph.push(r() * 6.28); }
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
    const edge = Math.sin(Math.PI * x / 63) ** 0.6, st = col[x] * (0.55 + 0.45 * Math.sin(y / 256 * Math.PI * 2 * fr[x] + ph[x]));
    const o = (y * 64 + x) * 4; d[o] = 225 + 30 * st; d[o + 1] = 238 + 17 * st; d[o + 2] = 255; d[o + 3] = clamp(edge * (0.3 + 0.7 * st), 0, 1) * 235;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; return t;
}
function puffTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
// pendenza e direzione in discesa del terreno in un punto
function mdGrad(x, z) { const e = 10, gx = (getH(x + e, z) - getH(x - e, z)) / (2 * e), gz = (getH(x, z + e) - getH(x, z - e)) / (2 * e); return { gx, gz, s: Math.hypot(gx, gz) }; }
// una cascata: dal ciglio della parete di roccia giù fino al fondo valle, seguendo il terreno
function fallPath(x0, z0) {
  // il punto più ripido lì vicino (con almeno 120 m di salto sotto)
  let best = null;
  for (let r = 0; r <= 360; r += 40) for (let a = 0; a < (r ? 16 : 1); a++) {
    const x = x0 + Math.cos(a / 16 * 6.283) * r, z = z0 + Math.sin(a / 16 * 6.283) * r, g = mdGrad(x, z);
    if (g.s > 1.1 && (!best || g.s > best.s)) best = { x, z, s: g.s };
  }
  if (!best) return null;
  let x = best.x, z = best.z; const hb = getH(x, z);
  for (let k = 0; k < 60; k++) { const g = mdGrad(x, z); if (g.s < 0.6 || getH(x, z) - hb > 220) break; x += g.gx / g.s * 6; z += g.gz / g.s * 6; } // su fino al ciglio
  const pts = [{ x, z }], h0 = getH(x, z);
  for (let k = 0; k < 160; k++) {
    const g = mdGrad(x, z); if (g.s < 0.35 && h0 - getH(x, z) > 60) break; if (g.s < 0.02) break;
    x -= g.gx / g.s * 6; z -= g.gz / g.s * 6; pts.push({ x, z });
  }
  return h0 - getH(x, z) > 100 && pts.length > 6 ? pts : null;
}
function fallMesh(pts) {
  const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, n - 1)], o = pts[Math.max(i - 1, 0)];
    let dx = q.x - o.x, dz = q.z - o.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const g = mdGrad(p.x, p.z), nl = Math.hypot(g.gx, 1, g.gz), nx = -g.gx / nl, ny = 1 / nl, nz = -g.gz / nl;
    const t = i / (n - 1), w = (12 + 16 * t) / 2, y = getH(p.x, p.z) + ny * 3 + 0.8, cx = p.x + nx * 3, cz = p.z + nz * 3;
    pos.set([cx - dz * w, y, cz + dx * w, cx + dz * w, y, cz - dx * w], i * 6);
    if (i) acc += Math.hypot(p.x - pts[i - 1].x, getH(p.x, p.z) - getH(pts[i - 1].x, pts[i - 1].z), p.z - pts[i - 1].z);
    uv.set([0, acc / 45, 1, acc / 45], i * 4);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, MAPDECO.fallMat); m.renderOrder = 3; return m;
}
function mapDecoBuild() {
  mapDecoClear();
  const M = MAPS[MAPID]; if (!M || (!M.falls && !M.smoke)) return;
  const grp = MAPDECO.group = new THREE.Group(); scene.add(grp);
  if (M.falls) {
    if (!MAPDECO.tex) MAPDECO.tex = fallTex();
    if (!MAPDECO.stex) MAPDECO.stex = puffTex();
    MAPDECO.fallMat = MAPDECO.fallMat || new THREE.MeshBasicMaterial({ map: MAPDECO.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    MAPDECO.mistMat = MAPDECO.mistMat || new THREE.SpriteMaterial({ map: MAPDECO.stex, transparent: true, depthWrite: false, opacity: 0.4 });
    for (const [x, z] of M.falls) {
      const pts = fallPath(x, z); if (!pts) continue;
      grp.add(fallMesh(pts));
      const b = pts[pts.length - 1], mist = [];
      for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(MAPDECO.mistMat); s.position.set(b.x + (k - 1) * 14, getH(b.x, b.z) + 10 + k * 7, b.z + (k - 1) * 6); s.scale.setScalar(45 + k * 18); grp.add(s); mist.push(s); }
      MAPDECO.falls.push({ pts, mist, top: pts[0], bot: b });
    }
  }
  if (M.smoke) {
    if (!MAPDECO.stex) MAPDECO.stex = puffTex();
    for (const [x0, z0] of M.smoke) {
      let top = { x: x0, z: z0, h: getH(x0, z0) }; // la cima: il punto più alto lì vicino
      for (let r = 0; r <= 2400; r += 120) for (let a = 0; a < 24; a++) { const x = x0 + Math.cos(a / 24 * 6.283) * r, z = z0 + Math.sin(a / 24 * 6.283) * r, h = getH(x, z); if (h > top.h) top = { x, z, h }; }
      const puffs = [];
      for (let k = 0; k < 22; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAPDECO.stex, transparent: true, depthWrite: false, opacity: 0, fog: false })); grp.add(s); puffs.push({ s, ph: k / 22, sp: 0.75 + (k * 7 % 5) * 0.12 }); }
      MAPDECO.smoke.push({ top, puffs });
    }
  }
}
function mapDecoUpdate(dt) {
  if (!MAPDECO.group) return;
  const night = (typeof waterU !== 'undefined' && waterU.uNight) ? waterU.uNight.value : 0, lit = 1 - night * 0.78;
  if (MAPDECO.tex) MAPDECO.tex.offset.y -= dt * 1.1;
  if (MAPDECO.fallMat) MAPDECO.fallMat.color.setScalar(lit);
  if (MAPDECO.mistMat) { MAPDECO.mistMat.color.setScalar(lit); MAPDECO.mistMat.opacity = 0.32 + Math.sin(performance.now() / 900) * 0.06; }
  const wx = Math.cos(WEATHER.windDir) * (0.4 + WEATHER.wind), wz = Math.sin(WEATHER.windDir) * (0.4 + WEATHER.wind);
  for (const v of MAPDECO.smoke) for (const p of v.puffs) {
    p.ph += dt * 0.018 * p.sp; if (p.ph >= 1) p.ph -= 1;
    const t = p.ph, s = p.s;
    s.position.set(v.top.x + wx * t * 2600, v.top.h + 40 + t * 1500 + Math.sin(t * 7 + p.sp * 9) * 40, v.top.z + wz * t * 2600);
    s.scale.setScalar(260 + t * 1300);
    s.material.opacity = 0.85 * Math.sin(Math.PI * Math.min(1, 0.08 + t * 1.1)) ** 0.7;
    s.material.color.setScalar((0.55 + t * 0.25) * lit);
  }
}
{
  const _im = initMap;
  initMap = function* (seed) { yield* _im(seed); try { mapDecoBuild(); } catch (e) { console.error('decorazioni mappa', e); } };
  const _us = updateSky;
  let last = performance.now();
  updateSky = function (...a) { const r = _us.apply(this, a); const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; mapDecoUpdate(dt); return r; };
  const _rw = resetWorld;
  resetWorld = function (...a) { mapDecoClear(); return _rw.apply(this, a); };
}
if (typeof __cm !== 'undefined') Object.assign(__cm, { MAPDECO, mapDecoBuild, fallPath, TFX });
