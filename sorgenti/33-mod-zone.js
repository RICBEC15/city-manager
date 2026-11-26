// =====================================================================
//  Mod di Cities: Skylines II - Blocco 5 (26 nov 2026): zone e stili dei palazzi
//  Le idee di 36 mod (8, 10, 13, 14, 15, 24, 25, 27, 28, 35, 46, 53, 57, 60, 66, 67, 77, 82, 87, 96,
//  104, 114, 141, 144, 145, 163, 177, 182, 184, 205, 206, 211, 225, 235, 236, 240) rifatte da zero
//  con forme semplici: niente codice né modelli delle mod.
//  - 39 stili: ognuno è una zona sua con un numero fisso da 101 in su (i salvataggi restano giusti)
//  - menu Zone: scegli una zona (per esempio Case) e sotto compare la riga 🎨 Stile
//  - regole nuove: case in collina anche sui pendii ripidi, industria urbana pulita (niente smog),
//    hotel e motel che portano turisti, ville di lusso (tasse ×3), case che cambiano epoca a ogni
//    livello, palazzi italiani attaccati l'uno all'altro, torrette d'angolo agli incroci
// =====================================================================

// ---------- forme nuove: tetto a padiglione, tetto a una falda, arco ----------
function stGeo(tris, c) { // triangoli girati sempre verso fuori rispetto al punto c (forme convesse)
  const p = [];
  for (const [A, B, C] of tris) {
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [(A[0] + B[0] + C[0]) / 3 - c[0], (A[1] + B[1] + C[1]) / 3 - c[1], (A[2] + B[2] + C[2]) / 3 - c[2]];
    p.push(...A, ...(n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0 ? [...C, ...B] : [...B, ...C]));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}
const stQ = (a, b, c, d) => [[a, b, c], [a, c, d]];
const stHipGeo = stGeo([...stQ([-.5, 0, -.5], [.5, 0, -.5], [.25, 1, 0], [-.25, 1, 0]), ...stQ([.5, 0, .5], [-.5, 0, .5], [-.25, 1, 0], [.25, 1, 0]),
  [[-.5, 0, .5], [-.5, 0, -.5], [-.25, 1, 0]], [[.5, 0, -.5], [.5, 0, .5], [.25, 1, 0]], ...stQ([-.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [-.5, 0, .5])], [0, 0.3, 0]);
const stShedGeo = stGeo([...stQ([-.5, 0, -.5], [.5, 0, -.5], [.5, 1, .5], [-.5, 1, .5]), ...stQ([-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5]),
  [[-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5]], [[.5, 0, -.5], [.5, 0, .5], [.5, 1, .5]], ...stQ([-.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [-.5, 0, .5])], [0, 0.3, 0.2]);
const stArchGeo = new THREE.TorusGeometry(0.5, 0.11, 4, 10, Math.PI); // mezzo anello in piedi, largo 1
Object.assign(POOLS, {
  stb: new InstPool(boxGeo, bldMat, 40000), stp: new InstPool(boxGeo, plainMat, 70000),
  str: new InstPool(roofGeo, plainMat, 20000), sth: new InstPool(stHipGeo, plainMat, 16000),
  sts: new InstPool(stShedGeo, plainMat, 8000), sta: new InstPool(stArchGeo, plainMat, 8000),
  stc: new InstPool(cylGeo, plainMat, 16000), stk: new InstPool(pfConeGeo, plainMat, 4000),
  stg: new InstPool(boxGeo, pfGlassMat, 12000), stn: new InstPool(boxGeo, pfNeonMat, 10000),
  stt: new InstPool(pfCrownGeo, plainMat, 10000),
});
function stShadows() { const on = !!SET.shadows && AQ.lv < 2; for (const k in POOLS) if (k.startsWith('st')) { POOLS[k].mesh.castShadow = on && k !== 'stn'; POOLS[k].mesh.receiveShadow = on; } }
stShadows();
{ const _as = applySettings; applySettings = function () { _as(); stShadows(); }; }

// ---------- colori ----------
const SC = {
  brick: [0x8a4a36, 0x9a5a40, 0x7a3e30, 0xa0624a, 0x8e5038, 0x6e3a2c], buff: [0xc8a878, 0xd2b48a, 0xbfa070],
  stone: [0xb8b0a0, 0xa8a298, 0xc8c0b0, 0xc4bba6], white: [0xf2f2ee, 0xeceff0, 0xf6f4ee, 0xe8e4da], cream: [0xf0e6cc, 0xe8dcc0, 0xf2ead8],
  pastel: [0xe8c8b8, 0xd8e0c8, 0xc8d8e0, 0xf0dcb0, 0xe0c8d8], italy: [0xd9a654, 0xc87850, 0xe8c878, 0xd89a8a, 0xeadcb8, 0xb86a50, 0xe0b890],
  stucco: [0xeadcc4, 0xf2e6d0, 0xe4cfb0, 0xf4ece0, 0xe8c8b0, 0xe0d8c8], wood: [0x9a7050, 0x8a6040, 0xb08458, 0x7a5236], dwood: [0x5a3e2a, 0x6a4a30, 0x4e3626],
  modern: [0xf2f2ee, 0x3a3d42, 0x9a7050, 0xc8c8c4, 0x5a5e64], terra: [0xb5562f, 0xa84a2a, 0xc0643a], tiles: [0x9a3a28, 0x8c3b2a, 0xa8482e, 0x7a3424],
  dark: [0x3e4247, 0x4a4f57, 0x55585e, 0x2e3236], awn: [0xc0392b, 0x2e7d32, 0x1f5fa8, 0xd08a1e, 0x6a3d9a, 0x1e8a8a, 0x8a2a4a],
  neon: [0xff2bd6, 0x22e4ff, 0xff3a5c, 0xffd23a, 0x2dffa0, 0xffa03a, 0x9a5bff], green: [0x4f9a3a, 0x3f8a35, 0x5fae45, 0x6ab04c],
  cars: [0xc0392b, 0x2c3e50, 0xecf0f1, 0x7f8c8d, 0x2980b9, 0x16a085, 0xf1c40f, 0x1a1a1a],
};

// ---------- pezzi che si ripetono ----------
// B(forma, a, d, larghezza, altezza, profondità, colore, y0, rotazione): a = di lato, d = verso il fondo del lotto (d negativo = verso la strada)
const stPk = (r, a) => a[Math.floor(r() * a.length)];
function stRoof(B, t, a, d, w, dd, y, h, col, ov = 0.45) {
  if (t === 'g') B('str', a, d, w + ov * 2, h, dd + ov * 2, col, y); // due falde, timpano verso la strada
  else if (t === 'G') B('str', a, d, dd + ov * 2, h, w + ov * 2, col, y, Math.PI / 2); // due falde, colmo lungo la strada
  else if (t === 'h') { if (w >= dd) B('sth', a, d, w + ov * 2, h, dd + ov * 2, col, y); else B('sth', a, d, dd + ov * 2, h, w + ov * 2, col, y, Math.PI / 2); } // padiglione
  else if (t === 's') B('sts', a, d, w + ov * 2, h, dd + ov * 2, col, y); // una falda, alta dietro
  else if (t === 'S') B('sts', a, d, w + ov * 2, h, dd + ov * 2, col, y, Math.PI); // una falda, alta davanti
  else B('stp', a, d, w + ov * 2, Math.max(0.3, h), dd + ov * 2, col, y); // piano col cornicione
}
function stHouse(B, a, d, w, dd, h, wall, rt, rh, rc, y = 0, ov) { B('stb', a, d, w, h, dd, wall, y); stRoof(B, rt, a, d, w, dd, y + h, rh, rc, ov); }
function stDormer(B, a, dEdge, half, rh, H, dw, wall, rc) { // abbaino sulla falda davanti (dEdge = bordo del tetto verso la strada)
  const k = rh / half, hd = 1.4, tf = 0.45 / k, tb = Math.min(half * 0.85, (hd + 0.45) / k + 0.3);
  if (tb - tf < 0.6) return;
  B('stb', a, dEdge + (tf + tb) / 2, dw, hd + 0.2, tb - tf, wall, H + 0.25); stRoof(B, 'g', a, dEdge + (tf + tb) / 2, dw, tb - tf, H + 0.45 + hd, 0.7, rc, 0.12);
}
const stTree = (B, r, a, d, s = 4, y = 0) => { B('stc', a, d, s * 0.12, s * 0.55, s * 0.12, 0x6b4a2b, y); B('stt', a, d, s, s * (1.05 + r() * 0.3), s, stPk(r, SC.green), y + s * 0.45); };
const stPalm = (B, r, a, d, y = 0) => { const h = 7 + r() * 3; B('stc', a, d, 0.45, h, 0.45, 0x8a7350, y); B('stt', a, d, 4.4, 1.5, 4.4, 0x4f8a3a, y + h - 0.3); };
const stCar = (B, r, a, d, rot = 0) => B('stp', a, d, 1.9, 1.45, 4.3, stPk(r, SC.cars), 0.05, rot);
const stLawn = (B, a, d, w, dd, col = 0x6fae55) => B('stp', a, d, w, 0.1, dd, col, 0.02);
function stUnits(W, uw) { const n = Math.max(1, Math.round(W / uw)), w = W / n; return Array.from({ length: n }, (_, i) => ({ a: -W / 2 + w * (i + 0.5), w })); }
const ERA_N = [() => L('vittoriana (1890)', 'Victorian (1890s)'), () => L('anni \'20', '1920s'), () => L('anni \'50', '1950s'), () => L('anni \'90', '1990s'), () => L('di oggi', 'today')];

// ---------- i 39 stili: id = numero della zona (non cambiarli mai: sono nei salvataggi) ----------
const STY = {
  // ===== Case (bassa densità) =====
  tedesche: { id: 101, base: 1, mod: 13, col: 0x8fd16e, n: () => L('Case tedesche: intonaco chiaro e tetti rossi ripidi', 'German houses: light plaster and steep red roofs'), sh: () => L('Tedesche', 'German'), bn: ['Casa ', 'House '],
    h: (b, r) => 5.6 + r * 1.2,
    draw(B, b, W, D, H, r) {
      const gar = W > 12 && r() < 0.7, w = Math.min(W - (gar ? 5 : 1.2), 10.5), dd = Math.min(D * 0.55, 9), a0 = gar ? -(W - w) / 2 + 0.6 : 0, d0 = -D / 2 + 3.2 + dd / 2, f = d0 - dd / 2;
      const wall = stPk(r, [...SC.cream, ...SC.white]), rc = stPk(r, SC.tiles), along = w > dd, rh = (along ? dd : w) * 0.75;
      stHouse(B, a0, d0, w, dd, H, wall, along ? 'G' : 'g', rh, rc);
      if (r() < 0.45) for (const s of [-0.3, 0, 0.3]) B('stp', a0 + s * w, f - 0.05, 0.22, H - 3.1, 0.12, 0x4a3a2c, 3.1); // travi a vista al primo piano
      if (along) stDormer(B, a0, f - 0.45, dd / 2 + 0.45, rh, H, Math.min(2.4, w * 0.24), wall, rc);
      if (gar) stHouse(B, a0 + w / 2 + 2.3, d0 + dd / 2 - 3.2, 3.6, 6.2, 2.7, wall, 'f', 0.3, 0x8a8a86, 0, 0.15);
      stLawn(B, 0, -D / 2 + 1.6, W, 3.2); B('stp', 0, -D / 2 + 0.3, W, 1.1, 0.6, 0x3f6a32); // giardino e siepe
    } },
  svedesi: { id: 102, base: 1, mod: 67, col: 0xc0d65a, n: () => L('Villette svedesi di legno: rosse, gialle o bianche con gli angoli bianchi', 'Swedish wooden villas: red, yellow or white with white corners'), sh: () => L('Svedesi', 'Swedish'), bn: ['Villetta ', 'Villa '],
    h: (b, r) => 4.8 + r * 1.6,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 1.6, 9.5), dd = Math.min(D * 0.5, 8), d0 = -D / 2 + 4 + dd / 2, f = d0 - dd / 2, q = r();
      const wall = q < 0.6 ? stPk(r, [0x8e2b20, 0x9a3324, 0x82281e]) : q < 0.85 ? stPk(r, [0xe0b050, 0xd8a840]) : stPk(r, [0xf2f0e8, 0xbcd0dc, 0xb8c4a8]), wt = 0xf8f8f2, rc = stPk(r, [0x2e3236, 0x4a4f57, 0x6a3a2a]);
      stLawn(B, 0, 0, W, D, 0x74b35a);
      stHouse(B, 0, d0, w, dd, H, wall, 'G', dd * 0.55, rc, 0, 0.35);
      for (const sa of [-1, 1]) for (const sd of [-1, 1]) B('stp', sa * (w / 2 + 0.02), d0 + sd * (dd / 2 + 0.02), 0.3, H, 0.3, wt); // angoli bianchi
      B('stp', 0, f - 0.02, w + 0.1, 0.35, 0.1, wt, H - 0.35);
      if (r() < 0.55) { const gw = w * 0.36; B('stb', 0, f + 1.2, gw, 1.6, 2.4, wall, H); stRoof(B, 'g', 0, f + 1.2, gw, 2.4, H + 1.6, gw * 0.5, rc, 0.2); } // frontone sulla facciata
      const pa = w * 0.25; B('stp', pa, f - 0.9, 2.4, 0.2, 1.8, wt, 2.6); for (const s of [-1, 1]) B('stc', pa + s * 1.05, f - 1.65, 0.16, 2.6, 0.16, wt); // portichetto
      B('stp', 0, -D / 2 + 0.35, W - 0.4, 0.9, 0.08, wt); // steccato bianco
    } },
  chaletmod: { id: 103, base: 1, mod: 57, col: 0x5fd38a, lot: r => [r < 0.65 ? 2 : 1, 2], n: () => L('Chalet moderni: legno, pietra e grandi vetrate', 'Modern chalets: wood, stone and big windows'), sh: () => L('Chalet moderni', 'Modern chalets'), bn: ['Chalet ', 'Chalet '],
    h: (b, r) => 6.2 + r * 2,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 1.6, 11), dd = Math.min(D * 0.56, 9.5), d0 = -D / 2 + 3.6 + dd / 2, f = d0 - dd / 2;
      const stn = stPk(r, [0x8a8780, 0x9a968e, 0x7e7a72]), wd = stPk(r, SC.wood), rc = stPk(r, [0x3a3d42, 0x55585e, 0x2e3236]);
      B('stp', 0, d0, w + 0.3, 1.5, dd + 0.3, stn); // zoccolo di pietra
      B('stb', 0, d0, w, H - 1.5, dd, wd, 1.5);
      B('stg', 0, f - 0.06, w * 0.62, H - 2.1, 0.2, stPk(r, [0x6a8aa8, 0x5a7a96]), 1.7); // vetrata
      stRoof(B, 'g', 0, d0, w, dd, H, w * 0.3, rc, 1.3);
      B('stp', 0, f - 0.85, w + 1, 0.25, 1.7, wd, 4.3); B('stg', 0, f - 1.7, w + 1, 1, 0.08, 0x9ab8cc, 4.55); // balcone col parapetto di vetro
      B('stp', w * 0.28, d0 + dd * 0.15, 0.8, 2.4, 0.8, stn, H + w * 0.12); // camino
    } },
  chalettrad: { id: 104, base: 1, mod: 205, col: 0x4fb36b, lot: r => [r < 0.6 ? 2 : 1, 2], n: () => L('Chalet tradizionali: pietra sotto, legno scuro sopra, balconi fioriti', 'Traditional chalets: stone below, dark wood above, flower balconies'), sh: () => L('Chalet antichi', 'Old chalets'), bn: ['Chalet ', 'Chalet '],
    h: (b, r) => 5.8 + r * 1.4,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 1.8, 10.5), dd = Math.min(D * 0.55, 9.5), d0 = -D / 2 + 3.6 + dd / 2, f = d0 - dd / 2;
      const base = stPk(r, [0xe8e4dc, 0xd8d4c8, 0x9a968e]), wd = stPk(r, SC.dwood), rc = stPk(r, [0x4a4038, 0x5a5a5e, 0x6e4a3a]);
      B('stb', 0, d0, w, 3, dd, base); B('stb', 0, d0, w, H - 3, dd, wd, 3);
      stRoof(B, 'g', 0, d0, w, dd, H, w * 0.38, rc, 1.2);
      B('stp', 0, f - 0.7, w + 0.6, 0.22, 1.4, wd, 3); B('stp', 0, f - 1.35, w + 0.6, 1, 0.1, wd, 3.2); B('stp', 0, f - 1.35, w + 0.4, 0.3, 0.32, stPk(r, [0xd03a4a, 0xe05a8a, 0xc8303a]), 4.2); // balcone, ringhiera e fiori
      if (r() < 0.5) B('stp', -w / 2 - 0.5, d0 + dd * 0.2, 0.8, 1.4, dd * 0.4, 0x7a5a3a); // legna sotto la gronda
    } },
  bungalow: { id: 105, base: 1, mod: 60, col: 0xa3c95a, lot: r => [r < 0.5 ? 1 : 2, 3], n: () => L('Bungalow col portico davanti e il garage nel vicolo dietro', 'Bungalows with a front porch and a garage on the back alley'), sh: () => L('Bungalow', 'Bungalows'), bn: ['Bungalow ', 'Bungalow '],
    h: (b, r) => 3.6 + r * 0.7,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 1.4, 11), dd = Math.min(D * 0.42, 10), d0 = -D / 2 + 4.2 + dd / 2, f = d0 - dd / 2;
      const wall = stPk(r, [0xd8c8a8, 0x8a5a40, 0x9ab0a0, 0xe8e0d0, 0xb8a078]), rc = stPk(r, [0x5a4a40, 0x4a4f55, 0x6e4a3a]), hip = r() < 0.4, rh = (hip ? Math.min(w, dd) : dd) * 0.34;
      stLawn(B, 0, -D / 2 + 2, W, 4);
      stHouse(B, 0, d0, w, dd, H, wall, hip ? 'h' : 'G', rh, rc, 0, 0.7);
      if (!hip && r() < 0.6) stDormer(B, 0, f - 0.7, dd / 2 + 0.7, rh, H, Math.min(3, w * 0.3), wall, rc);
      B('stp', 0, f - 1.3, w * 0.9, 0.4, 2.6, 0xa8a49a); B('stp', 0, f - 1.3, w * 0.92, 0.3, 2.7, rc, 2.9); // portico: pavimento e tettoia
      const n = w > 8 ? 3 : 2; for (let i = 0; i < n; i++) B('stc', -w * 0.42 + i * w * 0.84 / (n - 1), f - 2.4, 0.5, 2.9, 0.5, 0xf2efe6);
      if (D > 20) { const ga = (W - 6.4) / 2 * (r() < 0.5 ? -1 : 1); stHouse(B, ga, D / 2 - 3.4, 5.8, 6, 2.8, wall, 'g', 1.3, rc, 0, 0.2); B('stp', ga, D / 2 - 0.3, 3.2, 0.08, 0.8, 0x9a9a96); } // garage sul vicolo
    } },
  chibung: { id: 106, base: 1, mod: 53, col: 0x6aa84f, lot: () => [1, 3], n: () => L('Bungalow in mattoni col bovindo davanti (stile Chicago)', 'Brick bungalows with a bay front (Chicago style)'), sh: () => L('Bungalow in mattoni', 'Brick bungalows'), bn: ['Bungalow ', 'Bungalow '],
    h: () => 4.2,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 0.9, 7.5), dd = Math.min(D * 0.58, 13), d0 = -D / 2 + 3.4 + dd / 2, f = d0 - dd / 2;
      const br = stPk(r, [0x7a3e30, 0x6e3a2c, 0x8a5038, 0x9a6a48]), st = 0xd8d0bc, rc = stPk(r, [0x4a3f3a, 0x5a5f66, 0x3e4247]);
      stLawn(B, 0, -D / 2 + 1.5, W, 3);
      B('stp', 0, d0, w + 0.2, 1, dd + 0.2, st); B('stb', 0, d0, w, H, dd, br, 0.3); stRoof(B, 'h', 0, d0, w, dd, H + 0.3, 2.2, rc, 0.5);
      B('stb', 0, f - 0.7, w * 0.62, 3.2, 1.4, br, 0.3); stRoof(B, 'h', 0, f - 0.7, w * 0.62, 1.4, 3.5, 0.7, rc, 0.2); // bovindo
      B('stb', 0, f + 1.1, 2.2, 1.6, 1.4, br, H + 0.3); stRoof(B, 'h', 0, f + 1.1, 2.2, 1.4, H + 1.9, 0.6, rc, 0.2); // abbaino
      B('stp', w / 2 - 0.9, f - 0.9, 1.3, 0.9, 1.6, st); // scalini
      if (D > 20) stHouse(B, 0, D / 2 - 3.4, Math.min(W - 0.8, 6), 6, 2.8, br, 'f', 0.3, 0x6a6a66, 0, 0.15); // garage sul vicolo
    } },
  californiane: { id: 107, base: 1, mod: 77, col: 0xc2d94f, lot: r => [r < 0.75 ? 2 : 1, 2], n: () => L('Case californiane: intonaco chiaro, tetti bassi di coppi, garage e palme', 'Californian houses: light stucco, low tiled roofs, garage and palms'), sh: () => L('Californiane', 'Californian'), bn: ['Casa ', 'House '],
    h: (b, r) => r < 0.6 ? 3.4 : 6.4,
    draw(B, b, W, D, H, r) {
      const gar = W > 12, w = Math.min(W - (gar ? 7.4 : 1.2), 10.5), dd = Math.min(D * 0.56, 9), a0 = gar ? -W / 2 + 0.6 + w / 2 : 0, d0 = -D / 2 + 4.4 + dd / 2, f = d0 - dd / 2;
      const wall = stPk(r, SC.stucco), tile = r() < 0.7, rc = tile ? stPk(r, SC.terra) : 0xd8d0c0;
      stLawn(B, 0, -D / 2 + 2.1, W, 4.2, r() < 0.6 ? 0x7cbf5e : 0xd8ccb0);
      stHouse(B, a0, d0, w, dd, H, wall, tile ? 'h' : 'f', tile ? Math.min(w, dd) * 0.24 : 0.5, rc, 0, tile ? 0.6 : 0.2);
      if (gar) { const gw = Math.min(6.2, W - w - 1.6), ga = a0 + w / 2 + 0.2 + gw / 2; stHouse(B, ga, f + 3.1, gw, 6.2, 3, wall, tile ? 'h' : 'f', tile ? 1.2 : 0.4, rc, 0, 0.3); B('stp', ga, f - 0.02, gw * 0.84, 2.3, 0.1, 0xe8e4dc); B('stp', ga, (f - D / 2) / 2, gw * 0.9, 0.08, f + D / 2, 0xc8c4bc, 0.03); } // garage, porta e vialetto
      if (r() < 0.6) stPalm(B, r, -W / 2 + 1.4, -D / 2 + 1.6);
    } },
  moderne: { id: 108, base: 1, mod: 96, col: 0x9ccf3f, lot: () => [1, 2], n: () => L('Case moderne su lotti stretti: cubi, tetti piani e vetrate', 'Modern houses on narrow lots: cubes, flat roofs and glass'), sh: () => L('Moderne strette', 'Modern narrow'), bn: ['Casa ', 'House '],
    h: (b, r) => r < 0.55 ? 6.4 : 9.6,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 0.8, 7.5), dd = Math.min(D * 0.6, 9.5), d0 = -D / 2 + 3.2 + dd / 2, f = d0 - dd / 2;
      const c1 = stPk(r, SC.modern); let c2 = stPk(r, SC.modern); if (c2 === c1) c2 = c1 === 0xf2f2ee ? 0x3a3d42 : 0xf2f2ee;
      B('stp', 0, -D / 2 + 1.5, W, 0.08, 3, 0xb8b6b0, 0.02);
      B('stb', 0, d0, w, 3.2, dd, c1);
      B('stb', (r() - 0.5) * 0.8, d0 - 1, w, H - 3.2, dd * 0.92, c2, 3.2); // piano di sopra a sbalzo verso la strada
      B('stp', 0, d0 - 1, w + 0.15, 0.3, dd * 0.92 + 0.15, 0x2e3034, H);
      B('stg', (r() < 0.5 ? -1 : 1) * (w / 2 - 1.1), f - 1 - dd * 0.04 - 0.06, 1.6, H - 3.6, 0.14, 0x5a7a96, 3.4); // finestra a nastro
      B('stp', w * 0.2, f - 0.04, 2.6, 2.4, 0.1, 0x3a3c40); // porta del garage
      if (r() < 0.6) stTree(B, r, -w * 0.3, -D / 2 + 1.5, 3.2);
    } },
  epoche: { id: 109, base: 1, mod: 87, col: 0x88c070, era: true, lot: r => [r < 0.5 ? 1 : 2, 2], n: () => L('Case del nord-ovest: a ogni livello un\'epoca diversa (vittoriana → di oggi)', 'North-west houses: every level a different era (Victorian → today)'), sh: () => L('Epoche', 'Eras'), bn: ['Casa ', 'House '],
    h: b => [6.4, 4.2, 3.4, 6.2, 6.6][Math.min(5, b.level) - 1],
    draw(B, b, W, D, H, r) {
      const lv = Math.min(5, b.level), f0 = -D / 2 + 3.6;
      stLawn(B, 0, -D / 2 + 1.6, W, 3.2);
      if (lv === 1) { // vittoriana: timpano ripido, bovindo, portico e a volte la torretta
        const w = Math.min(W - 1.6, 8.5), dd = Math.min(D * 0.56, 10), d0 = f0 + dd / 2, wall = stPk(r, [0x9aae8c, 0x8a9fb4, 0xe8dcb8, 0xc9a0a0, 0xb8b0d0]), rc = stPk(r, [0x4a4f57, 0x5a3e30, 0x3e4247]), wt = 0xf6f4ee;
        stHouse(B, 0, d0, w, dd, H, wall, 'g', w * 0.8, rc, 0, 0.3);
        B('stp', 0, f0 - 0.03, w * 0.96, 0.3, 0.12, wt, H - 0.3);
        B('stb', -w * 0.22, f0 - 0.5, w * 0.34, 5.4, 1, wall); B('stp', -w * 0.22, f0 - 0.5, w * 0.34 + 0.2, 0.25, 1.2, wt, 5.4);
        B('stp', w * 0.25, f0 - 1.1, w * 0.46, 0.22, 2.2, wt, 2.8); for (const s of [0, 1]) B('stc', w * 0.04 + s * w * 0.42, f0 - 2.05, 0.2, 2.8, 0.2, wt);
        if (r() < 0.45) { B('stc', w / 2 - 0.4, f0 + 0.8, 2.6, H + 1.4, 2.6, wall); B('stk', w / 2 - 0.4, f0 + 0.8, 3, 3.4, 3, rc, H + 1.4); }
      } else if (lv === 2) { // anni '20: tetto basso e largo, portico con colonne su basi di pietra
        const w = Math.min(W - 1.4, 10), dd = Math.min(D * 0.55, 10), d0 = f0 + dd / 2, wall = stPk(r, [0x7d8a5a, 0x8a6a48, 0x4e6a4a, 0xa0583a, 0xb8a070]), rc = stPk(r, [0x4a3f3a, 0x5a4a40, 0x3e4247]);
        stHouse(B, 0, d0, w, dd, H, wall, 'g', w * 0.34, rc, 0, 0.9);
        stRoof(B, 'g', 0, f0 - 1.2, w * 0.9, 2.4, 2.9, 1.1, rc, 0.4);
        for (const s of [-1, 1]) { B('stp', s * w * 0.36, f0 - 2.1, 0.9, 1, 0.9, 0x9a968e); B('stc', s * w * 0.36, f0 - 2.1, 0.55, 1.9, 0.55, 0xf0ece0, 1); }
        B('stp', 0, f0 - 1.2, w * 0.9, 0.35, 2.4, 0xa8a49a);
      } else if (lv === 3) { // anni '50: casa lunga e bassa, vetrata, posto auto coperto
        const w = Math.min(W - 1.2, 13), dd = Math.min(D * 0.46, 8.5), d0 = f0 + dd / 2, wall = stPk(r, [0xf2efe6, 0xbfe0dc, 0xf0e0a0, 0xe8e4dc]), rc = stPk(r, [0x5a5f66, 0x7a6a5a, 0x4a4f55]);
        const cp = W > 12, wh = cp ? w - 4 : w, ah = cp ? -2 : 0;
        stHouse(B, ah, d0, wh, dd, H, wall, 'h', 1.1, rc, 0, 0.8);
        B('stg', ah, f0 - 0.06, wh * 0.5, 1.5, 0.12, 0x6a8aa8, 0.9); B('stp', ah + wh * 0.32, f0 - 0.05, wh * 0.22, H - 0.4, 0.1, 0x9a8f80);
        if (cp) { B('stp', w / 2 - 1.8, d0, 3.8, 0.25, dd, rc, 2.6); for (const s of [-1, 1]) B('stc', w / 2 - 0.3, d0 + s * dd * 0.4, 0.2, 2.6, 0.2, 0xe8e4dc); }
      } else if (lv === 4) { // anni '90: villetta col garage davanti
        const w = Math.min(W - 1.2, 10), dd = Math.min(D * 0.5, 9.5), d0 = f0 + 1.2 + dd / 2, wall = stPk(r, [0xd8d0c2, 0xc4c0b4, 0xe6dcc4, 0xb9c2b0]), rc = stPk(r, [0x55575c, 0x6e4a3a, 0x4a4f57]);
        stHouse(B, 0, d0, w, dd, H, wall, 'h', 2.4, rc, 0, 0.5);
        const gw = Math.min(w * 0.45, 6); stHouse(B, w / 2 - gw / 2, f0 + 0.2, gw, 5.2, 3, wall, 'h', 1.2, rc, 0, 0.3); B('stp', w / 2 - gw / 2, f0 - 2.45, gw * 0.85, 2.3, 0.1, 0xf2f2ee);
      } else { // di oggi: volumi squadrati, legno, vetro e pannelli solari
        const w = Math.min(W - 1.2, 11), dd = Math.min(D * 0.55, 9.5), d0 = f0 + dd / 2, c1 = stPk(r, [0xf2f2ee, 0x2e3034, 0xc8c8c4]), wd = stPk(r, SC.wood);
        B('stb', 0, d0, w, 3.3, dd, c1);
        B('stb', w * 0.12, d0 + 0.6, w * 0.7, H - 3.3, dd * 0.86, wd, 3.3); B('sts', w * 0.12, d0 + 0.6, w * 0.7 + 0.6, 1.4, dd * 0.86 + 0.6, 0x2e3034, H, Math.PI);
        B('stg', -w * 0.25, d0 - dd / 2 - 0.06, w * 0.4, 2.6, 0.12, 0x5a7a96, 0.3);
        B('stp', -w * 0.28, d0, w * 0.4, 0.15, dd * 0.7, 0x24324a, 3.32);
      }
    } },
  collina: { id: 110, base: 1, mod: 27, col: 0xb8b45a, hill: true, lot: r => [r < 0.5 ? 1 : 2, r < 0.5 ? 2 : 3], n: () => L('Case in collina: a gradoni lungo il pendio, anche dove è ripido (le altre zone lì non si possono fare)', 'Hillside houses: stepped down the slope, even where it is steep (other zones cannot go there)'), sh: () => L('In collina', 'Hillside'), bn: ['Casa ', 'House '],
    h: (b, r) => 6.2 + r * 1.2,
    draw(B, b, W, D, H, r, X) {
      const w0 = Math.min(W - 1, 11), n = D > 20 ? 3 : 2, sd = (D - 2.4) / n, wall = stPk(r, [0xf4f0ea, 0xeadcc4, 0xe8e4dc, 0xf2e6d0]), acc = stPk(r, [...SC.wood, 0x3a3d42]), tile = r() < 0.4, rc = tile ? stPk(r, SC.terra) : 0xd8d4cc;
      for (let i = 0; i < n; i++) {
        const dc = -D / 2 + 1.2 + sd * (i + 0.5), g = [X.gy(0, dc - sd / 2), X.gy(0, dc + sd / 2), X.gy(-w0 / 2, dc), X.gy(w0 / 2, dc), X.gy(0, dc)];
        const lo = Math.min(...g), hi = Math.max(...g), fl = i === 0 ? Math.max(hi, X.gy(0, -D / 2)) : hi, w = w0 * (i % 2 ? 0.86 : 1), a = (i % 2 ? 1 : -1) * w0 * 0.06;
        const hs = i === 0 ? Math.max(3.2, H * 0.55) : H, top = fl + hs;
        if (i > 0 && fl - lo > 3.2) { // sbalzo sui pilastri dove il terreno scende tanto
          B('stb', a, dc, w, hs + 0.3, sd - 0.5, wall, fl - 0.3);
          for (const sa of [-1, 1]) for (const s2 of [-1, 1]) B('stc', a + sa * (w / 2 - 0.5), dc + s2 * (sd / 2 - 0.8), 0.5, fl - lo + 0.3, 0.5, 0xc8c4bc, lo - 0.3);
        } else B('stb', a, dc, w, top - lo + 0.3, sd - 0.5, i % 2 ? acc : wall, lo - 0.3);
        if (tile && i === n - 1) stRoof(B, 'h', a, dc, w, sd - 0.5, top, 1.6, rc, 0.5);
        else { B('stp', a, dc, w + 0.3, 0.35, sd - 0.2, 0xd8d4cc, top); B('stg', a, dc - sd / 2 + 0.3, w, 1, 0.08, 0x9ab8cc, top + 0.35); } // terrazza col parapetto di vetro
      }
      B('stp', -w0 * 0.25, -D / 2 + 1.2 + 0.02 - 0.25, 3, 2.5, 0.1, 0x3a3c40, Math.max(X.gy(-w0 * 0.25, -D / 2 + 1), 0)); // porta del garage sulla strada
    } },
  ville: { id: 111, base: 1, mod: 66, col: 0xd8c050, rich: true, lot: r => [r < 0.55 ? 2 : 3, r < 0.5 ? 3 : 4], minW: 2, minD: 3, n: () => L('Ville di lusso: lotti grandi, una famiglia ricca per villa (paga il triplo di tasse e alza il valore dei terreni vicini)', 'Luxury villas: big lots, one rich family per villa (pays triple taxes and raises nearby land value)'), sh: () => L('Ville di lusso', 'Luxury villas'), bn: ['Villa ', 'Villa '],
    h: (b, r) => 7.2 + r * 0.8,
    cap(b) { b.hh = 1 + (b.level >= 4 ? 1 : 0); },
    draw(B, b, W, D, H, r) {
      const w = Math.min(W * 0.52, 15), dd = Math.min(D * 0.36, 12), d0 = -D / 2 + 7.5 + dd / 2, f = d0 - dd / 2;
      const wall = stPk(r, [0xf2efe6, 0xe8dcc0, 0xd8c3a8, 0xb8a088, 0x9a5a40]), rc = stPk(r, [0x4a4f57, 0x3e4247, 0x6e4a3a]), wt = 0xf6f4ee;
      stLawn(B, 0, 0, W, D, 0x6fae55);
      stHouse(B, 0, d0, w, dd, H, wall, 'h', 3, rc, 0, 0.6);
      const ww = Math.min((W - w) / 2 - 1, 6.5);
      if (ww >= 3) for (const s of [-1, 1]) stHouse(B, s * (w / 2 + ww / 2 - 0.1), d0 + 1.2, ww, dd * 0.72, 4.6, wall, 'h', 2, rc, 0, 0.4); // ali
      const pw = Math.min(w * 0.38, 6); for (let i = 0; i < 4; i++) B('stc', -pw / 2 + i * pw / 3, f - 2.4, 0.55, H - 0.6, 0.55, wt);
      B('stp', 0, f - 1.3, pw + 0.8, 0.6, 2.8, wt, H - 0.6); stRoof(B, 'g', 0, f - 1.3, pw + 0.6, 2.8, H, 1.6, wt, 0.1); // portico col frontone
      B('stp', 0, (f - 2.6 - D / 2) / 2, 3.4, 0.1, f - 2.6 + D / 2, 0xd8ccb0, 0.04); // viale
      const back = D / 2 - (d0 + dd / 2);
      if (back > 8) { B('stp', 0, d0 + dd / 2 + back / 2, 9.4, 0.12, 5.2, 0xd8d0c0, 0.04); B('stp', 0, d0 + dd / 2 + back / 2, 8, 0.16, 4, 0x3fa8d8, 0.05); } // piscina
      if (W > 20) { const ga = (W / 2 - 5.5) * (r() < 0.5 ? -1 : 1); stHouse(B, ga, -D / 2 + 5, 9, 6.4, 3.2, wall, 'h', 1.6, rc, 0, 0.3); B('stp', ga, -D / 2 + 1.75, 8, 2.4, 0.1, 0xe8e4dc); } // garage da tre auto
      for (const s of [-1, 1]) { stTree(B, r, s * (W / 2 - 2), D / 2 - 2.4, 4.6); stTree(B, r, s * (W / 2 - 2), d0 + dd / 2 + 1.5, 4); }
    } },
  // ===== Case a schiera (attaccate) =====
  vittoriane: { id: 112, base: 12, mod: 10, col: 0x7fc06a, att: true, lot: r => [r < 0.6 ? 2 : 3, 3], n: () => L('Case a schiera vittoriane: mattoni, timpani ripidi e bovindi', 'Victorian row houses: brick, steep gables and bay windows'), sh: () => L('Vittoriane', 'Victorian'), bn: ['Case a schiera ', 'Row houses '],
    h: (b, r) => 3.1 * (b.level >= 3 ? 3 : 2) + r * 0.6,
    draw(B, b, W, D, H, r) {
      const br = r() < 0.6 ? stPk(r, SC.brick) : stPk(r, SC.buff), dd = Math.min(D * 0.6, 12), f = -D / 2 + 2.6, d0 = f + dd / 2, rc = stPk(r, [0x4a4f57, 0x3e4247, 0x5a3e30]), wt = 0xf6f4ee;
      stLawn(B, 0, -D / 2 + 1.3, W, 2.6);
      for (const u of stUnits(W, 5.3)) {
        const c = r() < 0.2 ? stPk(r, [0xe8e0d0, 0xc8c4bc, 0x9aae8c]) : br, h = H + (r() - 0.5) * 0.4, bh = Math.min(h, 6.1) - 0.2;
        stHouse(B, u.a, d0, u.w - 0.04, dd, h, c, 'g', u.w * 0.85, rc, 0, 0.1);
        const bw = u.w * 0.42, ba = u.a - u.w * 0.18; B('stb', ba, f - 0.45, bw, bh, 0.9, c); B('stp', ba, f - 0.45, bw + 0.2, 0.25, 1.1, wt, bh); // bovindo
        B('stp', u.a + u.w * 0.28, f - 0.9, 1.3, 0.8, 1.8, 0xa8a49a); // scalini
        B('stp', u.a, f - 0.03, u.w - 0.3, 0.25, 0.1, wt, h - 0.25);
      }
    } },
  greystone: { id: 113, base: 12, mod: 53, col: 0x58c07a, att: true, lot: r => [r < 0.6 ? 2 : 3, 3], n: () => L('Greystone e case a due piani: pietra grigia, cornicioni e bovindi (stile Chicago)', 'Greystones and two-flats: grey stone, cornices and bay fronts (Chicago style)'), sh: () => L('Greystone', 'Greystones'), bn: ['Case ', 'Houses '],
    h: b => 3.2 * (b.level >= 3 ? 3 : 2) + 0.8,
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D * 0.62, 14), f = -D / 2 + 2.8, d0 = f + dd / 2;
      stLawn(B, 0, -D / 2 + 1.4, W, 2.8);
      let i = 0; for (const u of stUnits(W, 6.5)) {
        const grey = (i++ + (b.id & 1)) % 2 === 0, c = grey ? stPk(r, [0xb8ae98, 0xc4bba6, 0xa9a08a, 0xbcb4a4]) : stPk(r, SC.brick), h = grey ? H : Math.max(6.6, H - 3.2);
        B('stb', u.a, d0, u.w - 0.04, h, dd, c);
        B('stp', u.a, d0 - 0.25, u.w + 0.02, 0.9, dd + 0.5, grey ? 0x8a8478 : 0x4a3a30, h); // cornicione
        if (grey) { B('stb', u.a - u.w * 0.12, f - 0.55, u.w * 0.5, h - 0.4, 1.1, c); B('stp', u.a + u.w * 0.3, f - 1.1, 1.4, 1.5, 2.2, 0xa8a090); } // bovindo alto e scalinata
        else { B('stp', u.a + u.w * 0.2, f - 1, u.w * 0.5, 0.25, 2, 0x3a3a3a, 2.9); B('stp', u.a + u.w * 0.2, f - 1, u.w * 0.5, 0.6, 2, 0x9a968e); } // portichetto
      }
    } },
  cal_schiera: { id: 114, base: 12, mod: 163, col: 0x6ccf6a, att: true, lot: r => [r < 0.5 ? 2 : 3, 3], n: () => L('Case a schiera californiane: intonaco, garage sotto, balconi', 'Californian townhouses: stucco, garage below, balconies'), sh: () => L('Schiera californiana', 'Cal townhouses'), bn: ['Case a schiera ', 'Townhouses '],
    h: b => 3.1 * (b.level >= 3 ? 3 : 2) + 0.4,
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D * 0.6, 13), tile = r() < 0.5;
      let i = 0; for (const u of stUnits(W, 5.6)) {
        const f = -D / 2 + 2.6 + (i++ % 2 ? 0.9 : -0.9), d0 = f + dd / 2, c = stPk(r, SC.stucco);
        B('stb', u.a, d0, u.w - 0.04, H, dd, c);
        if (tile) stRoof(B, 'h', u.a, d0, u.w - 0.04, dd, H, 1.2, stPk(r, SC.terra), 0.3); else B('stp', u.a, d0, u.w + 0.1, 0.45, dd + 0.2, stPk(r, SC.terra), H);
        B('stp', u.a, f - 0.03, u.w * 0.6, 2.3, 0.1, 0xe4e0d8); // garage
        B('stp', u.a, f - 0.5, u.w * 0.7, 0.2, 1, 0xd8d0c0, 3.1); B('stp', u.a, f - 0.97, u.w * 0.7, 0.9, 0.06, 0x3a3a3a, 3.3); // balcone
      }
    } },
  schieramod: { id: 115, base: 12, mod: 225, col: 0x8ad06a, att: true, lot: r => [r < 0.5 ? 2 : 3, 3], n: () => L('Case a schiera moderne: tetti piani, colori alternati, terrazze sul tetto', 'Modern townhouses: flat roofs, alternating colours, roof terraces'), sh: () => L('Schiera moderna', 'Modern rows'), bn: ['Case a schiera ', 'Townhouses '],
    h: () => 9.4,
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D * 0.6, 12), f = -D / 2 + 3, d0 = f + dd / 2, cols = [0xf2f2ee, 0x3a3d42, 0x9a7050, 0xc8c8c4];
      B('stp', 0, -D / 2 + 1.5, W, 0.08, 3, 0xb8b6b0, 0.02);
      let i = b.id % 4; for (const u of stUnits(W, 5.6)) {
        const c = cols[i % 4], h = H - (i++ % 2 ? 0 : 0.6);
        B('stb', u.a, d0, u.w - 0.05, h, dd, c);
        B('stg', u.a - u.w * 0.15, f - 0.06, u.w * 0.45, h - 3.6, 0.14, 0x5a7a96, 3.2);
        B('stg', u.a, f + 0.2, u.w - 0.4, 1, 0.06, 0x9ab8cc, h); // parapetto della terrazza
        B('stp', u.a + u.w * 0.2, f - 0.03, u.w * 0.42, 2.4, 0.1, 0x2e3034);
      }
    } },
  mattoncini: { id: 116, base: 12, mod: 235, col: 0x4fa85a, att: true, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 2 : 3], n: () => L('Case a schiera in mattoni a due piani, con le tendine sulle porte', 'Two-storey brick row houses with door awnings'), sh: () => L('Mattoni e tendine', 'Brick & awnings'), bn: ['Case a schiera ', 'Row houses '],
    h: () => 6.4,
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D * 0.66, 12), f = -D / 2 + 1.2, d0 = f + dd / 2;
      for (const u of stUnits(W, 4.6)) {
        B('stb', u.a, d0, u.w - 0.04, H, dd, stPk(r, SC.brick));
        B('stp', u.a, d0 - 0.2, u.w, 0.5, dd + 0.4, stPk(r, [0xf2f2ee, 0x2e3034, 0x8a8a86]), H);
        B('stp', u.a + u.w * 0.22, f - 0.5, 1.8, 0.14, 1, stPk(r, SC.awn), 2.6); // tendina
        B('stp', u.a + u.w * 0.22, f - 0.5, 1.3, 0.5, 1, 0xf0eeea); // gradino di marmo
      }
    } },
  // ===== Palazzine (media densità) =====
  mattoni: { id: 117, base: 2, mod: 46, col: 0x2f8a40, n: () => L('Palazzi in mattoni d\'epoca: basamento di pietra, cornicioni, serbatoio sul tetto', 'Brick revival apartments: stone base, cornices, rooftop water tank'), sh: () => L('Mattoni', 'Brick'), bn: ['Palazzo ', 'Apartments '],
    h: (b, r) => 3.2 * (4 + b.level * 0.8 + r * 2),
    draw(B, b, W, D, H, r) {
      const w = W - 0.4, dd = Math.min(D - 3, 18), f = -D / 2 + 1, d0 = f + dd / 2, br = stPk(r, SC.brick), st = stPk(r, SC.stone);
      B('stb', 0, d0, w, H, dd, br);
      B('stp', 0, d0, w + 0.4, 3.4, dd + 0.4, st); // basamento
      B('stp', 0, d0, w + 0.9, 0.9, dd + 0.9, st, H - 0.9); B('stp', 0, d0, w + 0.25, 0.35, dd + 0.25, st, H * 0.55); // cornicione e fascia
      B('stp', 0, f - 0.8, 3.2, 0.25, 1.6, 0x2a3a2a, 3.1); // pensilina
      if (r() < 0.6) B('stp', w * 0.3, f - 0.45, 2.4, H - 5, 0.9, 0x2a2a2a, 4); // scala antincendio
      if (r() < 0.55) { const ta = (r() - 0.5) * w * 0.5, td = d0 + dd * 0.15; B('stc', ta, td, 0.5, 2.4, 0.5, 0x4a3a30, H); B('stp', ta, td, 3.6, 0.3, 3.6, 0x4a3a30, H + 2.2); B('stc', ta, td, 3.2, 3.4, 3.2, 0x7a5a40, H + 2.5); B('stk', ta, td, 3.6, 1.6, 3.6, 0x4a4040, H + 5.9); } // serbatoio dell'acqua
    } },
  corte: { id: 118, base: 2, mod: 53, col: 0x2e7a52, lot: r => [r < 0.6 ? 3 : 4, 4], minW: 3, minD: 4, n: () => L('Condomini a corte: palazzi a U di mattoni col giardino in mezzo', 'Courtyard apartments: U-shaped brick buildings around a garden'), sh: () => L('A corte', 'Courtyard'), bn: ['Corte ', 'Court '],
    h: (b, r) => 3.2 * (3 + (b.level >= 3 ? 1 : 0) + (r < 0.4 ? 1 : 0)),
    draw(B, b, W, D, H, r) {
      const br = stPk(r, [...SC.brick, ...SC.buff]), cr = stPk(r, SC.stone), wd = 8.6;
      if (W < 20) { B('stb', 0, 0, W - 0.6, H, D - 2, br); B('stp', 0, 0, W - 0.2, 0.8, D - 1.6, cr, H); return; }
      for (const s of [-1, 1]) { B('stb', s * (W / 2 - 0.3 - wd / 2), 0.3, wd, H, D - 1.6, br); B('stp', s * (W / 2 - 0.3 - wd / 2), 0.3, wd + 0.4, 0.8, D - 1.2, cr, H); }
      const iw = W - 0.6 - wd * 2 + 0.2; B('stb', 0, D / 2 - 0.5 - wd / 2, iw, H, wd, br); B('stp', 0, D / 2 - 0.5 - wd / 2, iw, 0.8, wd + 0.4, cr, H);
      const cd = D - 1.6 - wd; stLawn(B, 0, -D / 2 + 0.5 + cd / 2, iw, cd);
      for (const t of [-1, 1]) stTree(B, r, t * iw * 0.25, -D / 2 + cd * 0.55, 4.4);
      B('stp', 0, -D / 2 + 0.7, iw, 1.2, 0.12, 0x2a2a2a); // cancellata
    } },
  moderni: { id: 119, base: 2, mod: 82, col: 0x45a85a, n: () => L('Palazzine moderne: bianche con parti di legno o grigio scuro, balconi di vetro', 'Modern apartments: white with wood or dark grey parts, glass balconies'), sh: () => L('Moderne', 'Modern'), bn: ['Residenza ', 'Residence '],
    h: (b, r) => 3.1 * (4 + b.level * 0.4 + r * 2),
    draw(B, b, W, D, H, r) {
      const w = W - 0.8, dd = Math.min(D - 4, 16), f = -D / 2 + 2, d0 = f + dd / 2, c = stPk(r, [0xf2f2ee, 0xe8e6e0, 0xd8d8d4]), acc = stPk(r, [0x3a3d42, 0x9a7050, 0x5a5e64, 0xb07a50]);
      B('stb', 0, d0, w, H, dd, c);
      const aw = w * 0.38, aa = (r() < 0.5 ? -1 : 1) * (w - aw) / 2; B('stb', aa, f - 0.2, aw, H - 3.1, 0.5, acc, 3.1);
      const nf = Math.floor(H / 3.1), nb = Math.min(4, nf - 1); for (let i = 0; i < nb; i++) { const y = 3.1 * (1 + Math.floor(i * (nf - 1) / nb)); B('stp', -aa * 0.3, f - 0.75, w * 0.5, 0.2, 1.5, 0xe8e8e4, y); B('stg', -aa * 0.3, f - 1.45, w * 0.5, 1, 0.06, 0x9ab8cc, y + 0.2); }
      if (H > 14) B('stb', -aa * 0.2, d0 + 1, w * 0.55, 3, dd * 0.6, acc, H); // attico
      B('stp', 0, d0, w - 0.4, 0.15, dd - 0.4, 0x6a9a4a, H + 0.02); // tetto verde
    } },
  russi: { id: 120, base: 2, mod: 114, col: 0x5aa83a, n: () => L('Palazzi storici russi: facciate gialle, verdi o rosa con lesene bianche, tetti di lamiera', 'Historic Russian buildings: yellow, green or pink facades with white pilasters, metal roofs'), sh: () => L('Russi storici', 'Russian'), bn: ['Palazzo ', 'House '],
    h: (b, r) => 3.4 * (3 + b.level * 0.4 + r * 1.5),
    draw(B, b, W, D, H, r) {
      const w = W - 0.4, dd = Math.min(D - 3, 15), f = -D / 2 + 1, d0 = f + dd / 2, c = stPk(r, [0xe6c35c, 0xa8c8a0, 0xe8a89a, 0xa8c4dc, 0xe8d8b0]), wt = 0xf6f4ee, rc = stPk(r, [0x4e7a5e, 0x6a7a84, 0x5e6a5a, 0x8a4a3a]);
      B('stb', 0, d0, w, H, dd, c);
      B('stp', 0, d0, w + 0.25, 3.4, dd + 0.25, 0xe8e4dc); B('stp', 0, d0, w + 0.6, 0.8, dd + 0.6, wt, H - 0.8);
      const np = Math.max(2, Math.round(w / 4.5)); for (let i = 0; i <= np; i++) B('stp', -w / 2 + 0.3 + i * (w - 0.6) / np, f - 0.08, 0.55, H - 4.2, 0.22, wt, 3.4); // lesene
      stRoof(B, 'h', 0, d0, w, dd, H, Math.min(w, dd) * 0.3, rc, 0.4);
      if (r() < 0.4) { const ta = (r() < 0.5 ? -1 : 1) * (w / 2 - 1.6); B('stc', ta, f + 1.6, 3.6, H + 3.4, 3.6, c); B('stt', ta, f + 1.6, 3.4, 3.6, 3.4, stPk(r, [0xc8a040, 0x4e8a6a, 0x3a6a9a]), H + 3.4); B('stk', ta, f + 1.6, 0.5, 2.6, 0.5, 0xc8a040, H + 6.6); } // torretta con la cupola a cipolla
    } },
  intonacate: { id: 121, base: 2, mod: 141, col: 0x52b04a, n: () => L('Case intonacate: palazzine semplici color pastello col tetto a falde', 'Plaster houses: simple pastel blocks with pitched roofs'), sh: () => L('Intonacate', 'Plaster'), bn: ['Casa ', 'House '],
    h: (b, r) => 3.1 * (3 + r * 1.5),
    draw(B, b, W, D, H, r) {
      const w = W * 0.88, dd = Math.min(D - 5, 13), f = -D / 2 + 2.5, d0 = f + dd / 2, c = stPk(r, [...SC.pastel, ...SC.cream]), rc = r() < 0.6 ? stPk(r, SC.terra) : stPk(r, SC.dark);
      stLawn(B, 0, -D / 2 + 1.2, W, 2.4);
      B('stb', 0, d0, w, H, dd, c); B('stp', 0, d0, w + 0.2, 1, dd + 0.2, 0x9a948a);
      stRoof(B, r() < 0.5 ? 'h' : 'G', 0, d0, w, dd, H, Math.min(w, dd) * 0.28, rc, 0.5);
      const nf = Math.floor(H / 3.1); for (let k = 1; k < Math.min(nf, 4); k++) for (const s of [-1, 1]) if (r() < 0.6) B('stp', s * w * 0.25, f - 0.55, 2.6, 0.18, 1.1, 0xe8e4dc, 3.1 * k);
    } },
  giapponesi: { id: 122, base: 2, mod: 145, col: 0x3aa870, lot: r => [r < 0.5 ? 1 : 2, 3], n: () => L('Palazzine giapponesi: piastrelle chiare, balconi pieni a ogni piano, serbatoio sul tetto', 'Japanese apartments: light tiles, solid balconies on every floor, rooftop tank'), sh: () => L('Giapponesi', 'Japanese'), bn: ['Residenza ', 'Mansion '],
    h: (b, r) => 3 * (4 + b.level * 0.8 + r * 2),
    draw(B, b, W, D, H, r) {
      const w = W - 0.6, dd = Math.min(D - 3, 14), f = -D / 2 + 1.5, d0 = f + dd / 2, c = stPk(r, [0xeeeae2, 0xd8ccb4, 0xc4c2bc, 0xa08870]), pc = stPk(r, [0xd8dcdc, 0xe8e8e4, 0xb8c0c4]);
      B('stb', 0, d0, w, H, dd, c);
      const nf = Math.floor(H / 3); for (let k = 1; k < nf && k <= 8; k++) B('stp', 0, f - 0.6, w, 1.1, 1.2, pc, 3 * k);
      B('stp', w * 0.2, d0 + 1, 3, 2.6, 3, c, H); B('stp', -w * 0.2, d0 + 2, 2.2, 2, 2.2, 0x9ab8d0, H);
      if (r() < 0.35) B('stn', (r() < 0.5 ? -1 : 1) * (w / 2 + 0.25), f + 0.8, 0.4, Math.min(H * 0.6, 12), 1.2, stPk(r, SC.neon), H * 0.3);
    } },
  cal_palazzine: { id: 123, base: 2, mod: 163, col: 0x5ac080, n: () => L('Palazzine californiane: intonaco, bordo di coppi, ingresso ad arco e palme', 'Californian apartments: stucco, tiled edge, arched entrance and palms'), sh: () => L('Californiane', 'Californian'), bn: ['Residence ', 'Residence '],
    h: (b, r) => 3.1 * (3 + r * 1.5 + b.level * 0.2),
    draw(B, b, W, D, H, r) {
      const w = W - 0.8, dd = Math.min(D - 4, 16), f = -D / 2 + 2.6, d0 = f + dd / 2, c = stPk(r, SC.stucco), tc = stPk(r, SC.terra);
      B('stb', 0, d0, w, H, dd, c); B('stp', 0, d0, w + 0.6, 0.45, dd + 0.6, tc, H);
      const nf = Math.floor(H / 3.1); for (let k = 1; k < Math.min(nf, 4); k++) { B('stp', w * 0.22, f - 0.5, w * 0.36, 0.18, 1, c, 3.1 * k); B('stp', w * 0.22, f - 0.97, w * 0.36, 0.9, 0.06, 0x2e2a28, 3.1 * k + 0.18); }
      B('stp', -w * 0.2, f + 0.4, 3, 3.2, 1, 0x4a3a30); B('sta', -w * 0.2, f - 0.12, 3, 2, 2.4, c, 2.1); // ingresso ad arco
      for (const s of [-1, 1]) stPalm(B, r, s * (W / 2 - 1.3), -D / 2 + 1.3);
    } },
  palazzine_it: { id: 124, base: 2, mod: 182, col: 0x2e9a5a, n: () => L('Palazzine italiane: staccate, col giardinetto davanti e i balconi su ogni piano', 'Italian palazzine: detached, front garden and balconies on every floor'), sh: () => L('Palazzine italiane', 'Italian palazzine'), bn: ['Palazzina ', 'Palazzina '],
    h: (b, r) => 3.1 * (4 + b.level * 0.4 + r * 2),
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 2.4, 13), dd = Math.min(D - 6, 13), f = -D / 2 + 3.4, d0 = f + dd / 2, c = stPk(r, [0xd9a654, 0xe0a080, 0xeedfb8, 0xefd98a, 0xd08870, 0xe8d0b0]), bc = stPk(r, [0xf2efe6, 0xe8e4dc, c]);
      stLawn(B, 0, -D / 2 + 1.9, W - 1, 2.8);
      B('stb', 0, d0, w, H, dd, c); B('stp', 0, d0, w + 0.3, 3.1, dd + 0.3, 0xd8d0bc);
      const nf = Math.floor(H / 3.1); for (let k = 1; k < nf && k <= 6; k++) B('stp', 0, f - 0.65, w * 0.86, 1.05, 1.3, bc, 3.1 * k);
      if (r() < 0.5) stRoof(B, 'h', 0, d0, w, dd, H, 2.2, stPk(r, SC.terra), 0.4); else B('stp', 0, d0, w + 0.3, 1, dd + 0.3, bc, H);
      B('stp', 0, -D / 2 + 0.4, W - 1, 1.1, 0.35, 0xd8d0bc); B('stp', W * 0.3, -D / 2 + 0.4, 1.6, 1.6, 0.4, 0x2a2a2a, 0.1); // muretto e cancello
      stTree(B, r, -W * 0.32, -D / 2 + 1.8, 3.6);
    } },
  storico_it: { id: 125, base: 2, mod: 184, col: 0xc8a050, att: true, lot: r => [r < 0.5 ? 1 : 2, r < 0.5 ? 2 : 3], n: () => L('Centro storico italiano: palazzi attaccati color ocra e rosso, tetti di coppi, portoni ad arco (crescono da 2 a 5 piani)', 'Italian historic centre: attached ochre and red buildings, tiled roofs, arched doorways (grow from 2 to 5 floors)'), sh: () => L('Centro storico', 'Historic centre'), bn: ['Palazzo ', 'Palazzo '],
    h: b => 3.3 * [2, 3, 3, 4, 5][Math.min(5, b.level) - 1],
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D - 1, 13), f = -D / 2 + 0.4, d0 = f + dd / 2;
      for (const u of stUnits(W, 6.5)) {
        const c = stPk(r, SC.italy), q = r(), hh = Math.max(6.6, H + (q < 0.35 ? 3.3 : q > 0.85 ? -3.3 : 0));
        B('stb', u.a, d0, u.w - 0.02, hh, dd, c);
        B('stp', u.a, d0 - 0.25, u.w, 0.45, dd + 0.5, 0xe8e0cc, hh - 0.45); // cornicione
        stRoof(B, r() < 0.7 ? 'G' : 'h', u.a, d0, u.w - 0.02, dd, hh, dd * 0.2, stPk(r, SC.terra), 0.3);
        const da = u.a + (r() - 0.5) * u.w * 0.3; B('stp', da, f - 0.03, 2, 2.4, 0.1, 0x4a3426); B('sta', da, f - 0.1, 2.2, 1.8, 1.6, 0xd8d0bc, 2.2); // portone ad arco
        if (r() < 0.6) { B('stp', u.a, f - 0.45, 2.4, 0.15, 0.9, 0xd8d0bc, 3.3); B('stp', u.a, f - 0.88, 2.4, 0.9, 0.05, 0x2a2a2a, 3.45); } // balconcino
      }
    } },
  // ===== Uso misto (negozi sotto, case sopra) =====
  misto_mattoni: { id: 126, base: 10, mod: 25, col: 0x3fa8a0, att: true, lot: r => [r < 0.5 ? 2 : 3, 3], n: () => L('Case a schiera di mattoni coi negozi al piano terra', 'Brick row houses with shops on the ground floor'), sh: () => L('Schiera e negozi', 'Rows & shops'), bn: ['Case e botteghe ', 'Shops & homes '],
    h: (b, r) => 3.2 * (3 + (b.level >= 4 ? 1 : 0)) + r * 0.6,
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D * 0.66, 14), f = -D / 2 + 1.2, d0 = f + dd / 2;
      for (const u of stUnits(W, 5.3)) {
        const c = stPk(r, [0x6e4636, ...SC.brick]), h = H + (r() - 0.5) * 0.6;
        B('stb', u.a, d0, u.w - 0.04, h, dd, c);
        B('stp', u.a, d0 - 0.25, u.w, 0.6, dd + 0.5, stPk(r, [0x2e3034, 0xe8e4dc, 0x5a4a40]), h);
        if (r() < 0.65) { B('stg', u.a, f - 0.06, u.w * 0.8, 2.6, 0.12, 0x6a8aa8, 0.3); B('stp', u.a, f - 0.6, u.w * 0.85, 0.15, 1.2, stPk(r, SC.awn), 3); } // vetrina e tenda
        else B('stp', u.a + u.w * 0.25, f - 1, 1.4, 1.2, 2, 0x9a8a78); // scalinata
      }
    } },
  corso: { id: 127, base: 10, mod: 28, col: 0x2fb0c0, att: true, lot: r => [r < 0.5 ? 1 : 2, 3], n: () => L('Corso commerciale: palazzi di mattoni con vetrine, insegne e frontoni', 'Commercial corridor: brick blocks with shop windows, signs and parapets'), sh: () => L('Corso', 'Main street'), bn: ['Palazzo ', 'Block '],
    h: (b, r) => 3.3 * (2 + b.level * 0.4 + r * 1.2),
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D - 1.5, 18), f = -D / 2 + 0.5, d0 = f + dd / 2;
      for (const u of stUnits(W, 8)) {
        const c = stPk(r, [...SC.brick, ...SC.buff, 0xb8b0a0]), h = Math.max(6.6, H + (r() - 0.5) * 2);
        B('stb', u.a, d0, u.w - 0.03, h, dd, c);
        B('stg', u.a, f - 0.07, u.w * 0.9, 3, 0.14, 0x6a8aa8, 0.2); // vetrine
        B('stp', u.a, f - 0.12, u.w * 0.9, 0.9, 0.2, stPk(r, SC.awn), 3.3); // insegna
        B('stp', u.a, f + 0.2, u.w, 1.2, 0.4, c, h); B('stp', u.a, f + 0.2, u.w * 0.32, 0.8, 0.4, c, h + 1.2); // parapetto col frontone
        if (r() < 0.5) B('stp', u.a, f - 0.7, u.w * 0.8, 0.12, 1.4, stPk(r, SC.awn), 3.1);
      }
    } },
  condomini_misti: { id: 128, base: 10, mod: 35, col: 0x48c8b8, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 3 : 4], n: () => L('Condomini moderni misti: negozi a vetri sotto, case sopra, torretta d\'angolo agli incroci', 'Modern mixed condos: glass shops below, homes above, corner tower at junctions'), sh: () => L('Condomini misti', 'Mixed condos'), bn: ['Condominio ', 'Condos '],
    h: (b, r) => 3.2 * (5 + b.level * 0.6 + r * 2),
    draw(B, b, W, D, H, r, X) {
      const w = W - 0.6, dd = Math.min(D - 2, 18), f = -D / 2 + 1, d0 = f + dd / 2, c = stPk(r, [0xe8e4dc, 0xb05a3a, 0x6a6e74, 0xd8c8a8, 0x8a5040]);
      B('stg', 0, d0, w, 4, dd, 0x5a7a96); B('stb', 0, d0, w, H - 4, dd, c, 4);
      B('stp', 0, d0, w + 0.4, 0.3, dd + 0.4, 0xd8d8d4, 4);
      const nf = Math.floor((H - 4) / 3.2); for (let i = 1; i <= Math.min(3, nf - 1); i++) { const y = 4 + 3.2 * Math.round(i * nf / 4); B('stp', 0, f - 0.65, w * 0.8, 0.2, 1.3, 0xe8e8e4, y); B('stg', 0, f - 1.28, w * 0.8, 1, 0.06, 0x9ab8cc, y + 0.2); }
      B('stb', 0, d0 + 1, w * 0.78, 3.2, dd * 0.75, c, H);
      const cs = X.corner; if (cs) { const ca = cs * (w / 2 - 3.6); B('pfcw', ca, f + 3.6, 7.6, H + 3.4, 7.6, c); B('pfcg', ca, f + 3.6, 7.7, 4, 7.7, 0x5a7a96); B('pfc', ca, f + 3.6, 8.2, 0.5, 8.2, 0xd8d8d4, H + 3.4); } // pezzo d'angolo
    } },
  cinesi: { id: 129, base: 10, mod: 144, col: 0x5ad0c8, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 4 : 5], minD: 4, n: () => L('Residenze cinesi: torri alte sopra un basamento di negozi (tante famiglie su poco terreno)', 'Chinese-style residences: tall towers on a podium of shops (many families on little land)'), sh: () => L('Torri e negozi', 'Towers & shops'), bn: ['Residenze ', 'Residences '],
    h: (b, r) => 3.1 * (12 + b.level * 3 + r * 8),
    cap(b) { b.hh = Math.round(b.hh * 3.2); b.jobs = Math.round(b.jobs * 1.4); },
    draw(B, b, W, D, H, r) {
      const pw = W - 0.4, pd = D - 1.6, f = -D / 2 + 0.8, two = W > 20, tw = two ? Math.min(W * 0.4, 13) : Math.min(W * 0.7, 15), td = Math.min(D * 0.45, 15), c = stPk(r, [0xf0ece4, 0xe4dccc, 0xd8d4cc, 0xc8ccd0]), pc = stPk(r, [0xb8b4ac, 0x9a968e, 0xc8c0b0]);
      B('stb', 0, 0, pw, 7, pd, pc); B('stg', 0, f - 0.06, pw * 0.9, 3.4, 0.14, 0x5a7a96, 0.3);
      for (let i = 0; i < 2; i++) B('stn', (i ? 1 : -1) * pw * 0.25, f - 0.15, 3.4, 1, 0.2, stPk(r, SC.neon), 4.4);
      for (const s of two ? [-1, 1] : [0]) {
        const a = s * (W / 2 - tw / 2 - 0.8), th = H * (s > 0 ? 0.86 : 1);
        B('stb', a, 1, tw, th - 7, td, c, 7);
        for (const q of [-0.3, 0.3]) B('stp', a + q * tw, 1 - td / 2 - 0.1, 0.9, th - 9, 0.3, pc, 8);
        B('stp', a, 1, tw + 1.2, 0.5, td + 1.2, pc, th - 1); stRoof(B, 'h', a, 1, tw, td, th, 3, 0x4a4f57, 0.6);
      }
    } },
  misto_it: { id: 130, base: 10, mod: 211, col: 0xd0a868, att: true, lot: r => [r < 0.5 ? 1 : 2, 3], n: () => L('Misto italiano attaccato: botteghe al piano terra, case sopra, tetti di coppi', 'Italian wall-to-wall mixed: shops on the ground floor, homes above, tiled roofs'), sh: () => L('Misto italiano', 'Italian mixed'), bn: ['Palazzo ', 'Palazzo '],
    h: (b, r) => 3.3 * (3 + b.level * 0.4 + r * 1.5),
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D - 1, 15), f = -D / 2 + 0.4, d0 = f + dd / 2;
      for (const u of stUnits(W, 7)) {
        const c = stPk(r, [...SC.italy, 0xc8c0b0]), h = Math.max(6.6, H + (r() < 0.3 ? 3.3 : 0));
        B('stb', u.a, d0, u.w - 0.02, h, dd, c);
        B('stp', u.a, d0 - 0.25, u.w, 0.4, dd + 0.5, 0xe8e0cc, h - 0.4);
        stRoof(B, 'G', u.a, d0, u.w - 0.02, dd, h, dd * 0.18, stPk(r, SC.terra), 0.3);
        if (r() < 0.45) for (const s of [-1, 1]) { B('stp', u.a + s * u.w * 0.22, f - 0.03, u.w * 0.32, 2.4, 0.1, 0x2e2a28); B('sta', u.a + s * u.w * 0.22, f - 0.1, u.w * 0.34, 1.5, 1.4, 0xd8d0bc, 2.4); } // botteghe ad arco
        else B('stp', u.a, f - 0.03, u.w * 0.72, 2.8, 0.1, 0x2e2a28); // vetrina con la saracinesca
        B('stp', u.a, f - 0.1, u.w * 0.5, 0.45, 0.15, stPk(r, SC.awn), 2.85); // insegna
        if (r() < 0.6) { const by = h >= 9.9 ? 6.6 : 3.3; B('stp', u.a, f - 0.42, 2.2, 0.15, 0.85, 0xd8d0bc, by); B('stp', u.a, f - 0.82, 2.2, 0.9, 0.05, 0x2a2a2a, by + 0.15); }
      }
    } },
  portici: { id: 131, base: 10, mod: 240, col: 0x7ac8d8, att: true, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 3 : 4], n: () => L('Misto italiano moderno (anni \'30-\'70): portici coi negozi e balconi lunghi su ogni piano', 'Modern Italian mixed (1930s-70s): shop arcades and long balconies on every floor'), sh: () => L('Portici', 'Arcades'), bn: ['Palazzo ', 'Palazzo '],
    h: (b, r) => 3.1 * (5 + b.level * 0.5 + r * 2) + 1.1,
    draw(B, b, W, D, H, r) {
      const w = W - 0.02, dd = Math.min(D - 1, 16), f = -D / 2 + 0.4, d0 = f + dd / 2, g = 4.2, c = stPk(r, [0xe8dcc4, 0xd9b48a, 0xe0a888, 0xd0d0c8, 0xc8a070, 0xb8c4c8]), tv = 0xddd4c0;
      B('stb', 0, d0, w, H - g, dd, c, g); // piani sopra il portico
      B('stb', 0, d0 + 1.6, w, g, dd - 3.2, c); B('stg', 0, f + 3.14, w * 0.92, 3, 0.12, 0x6a8aa8, 0.3); // negozi in fondo al portico
      B('stp', 0, f + 1.5, w, 0.06, 3, 0xc8c0b0, 0.02);
      const n = Math.max(2, Math.round(w / 4.2)); for (let i = 0; i <= n; i++) B('stp', -w / 2 + 0.4 + i * (w - 0.8) / n, f + 0.35, 0.7, g, 0.7, tv); // pilastri
      B('stp', 0, f + 0.35, w, 0.6, 0.8, tv, g - 0.6);
      const nf = Math.floor((H - g) / 3.1); for (let k = 0; k < nf && k < 6; k++) B('stp', 0, f - 0.6, w * 0.9, 1, 1.2, k % 2 && r() < 0.5 ? tv : c, g + 0.1 + 3.1 * k); // balconi lunghi
      if (r() < 0.5) stRoof(B, 'h', 0, d0, w, dd, H, 2, stPk(r, SC.terra), 0.3); else B('stp', 0, d0, w + 0.3, 0.6, dd + 0.6, tv, H);
    } },
  // ===== Negozi =====
  hotel: { id: 132, base: 5, mod: 104, col: 0x7ab8f0, hotel: true, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 3 : 4], minW: 2, minD: 3, n: () => L('Hotel e motel: prima motel col parcheggio, poi alberghi alti (portano turisti)', 'Hotels & motels: motels with parking first, then tall hotels (bring tourists)'), sh: () => L('Hotel e motel', 'Hotels & motels'),
    bn: b => b.level <= 2 ? ['Motel ', 'Motel '] : ['Hotel ', 'Hotel '],
    h: (b, r) => b.level <= 2 ? 6.4 : 3.2 * ([0, 0, 0, 6, 9, 14][Math.min(5, b.level)] + r * 5),
    draw(B, b, W, D, H, r) {
      const acc = stPk(r, [0xc0392b, 0x1f5fa8, 0x2e7d32, 0xd08a1e, 0x6a3d9a]), c = stPk(r, [0xf2efe6, 0xe8dcc0, 0xd8d4cc, 0xf0e0c8]);
      if (b.level <= 2) { // motel: ala in fondo, ballatoio, parcheggio davanti e insegna alta
        const md = 9, bd = D / 2 - 0.6 - md / 2, pd = D - md - 1.6;
        B('stb', 0, bd, W - 1, H, md, c); B('stp', 0, bd, W - 0.6, 0.7, md + 0.4, acc, H);
        B('stp', 0, bd - md / 2 - 0.8, W - 1, 0.25, 1.6, 0xd8d4cc, 3.1); B('stp', 0, bd - md / 2 - 1.55, W - 1, 0.9, 0.06, 0xf2f2ee, 3.35); // ballatoio
        if (pd > 8) { B('stb', -W / 2 + 4.6, -D / 2 + 0.8 + pd / 2, 8, H * 0.5, pd, c); B('stp', -W / 2 + 4.6, -D / 2 + 0.8 + pd / 2, 8.4, 0.7, pd + 0.4, acc, H * 0.5); } // reception
        B('stp', 2.2, -D / 2 + 0.8 + pd / 2, W - 6, 0.06, pd - 0.2, 0x55585c, 0.02);
        for (let i = 0; i < 4; i++) if (r() < 0.7) stCar(B, r, -W / 2 + 10 + i * 2.8, bd - md / 2 - 4.2);
        B('stc', W / 2 - 1.2, -D / 2 + 1.2, 0.35, 8, 0.35, 0x8a8a86); B('stn', W / 2 - 1.2, -D / 2 + 1.2, 3.4, 1.8, 0.4, stPk(r, SC.neon), 7);
      } else { // albergo: basamento, torre, insegna sul tetto, pensilina e piscina
        const pd = D * 0.7, pf = -D / 2 + 1.5, tw = Math.min(W * 0.62, 20), td = Math.min(D * 0.42, 15), at = -(W - 1) / 2 + tw / 2 + 0.5;
        B('stb', 0, pf + pd / 2, W - 1, 7, pd, c); B('stg', 0, pf - 0.06, W * 0.55, 4, 0.14, 0x5a7a96, 0.3);
        B('stb', at, pf + td / 2 + 1, tw, H - 7, td, c, 7);
        B('stn', at, pf + 0.9, tw * 0.7, 2.2, 0.3, acc, H - 2.6);
        B('stp', 0, pf - 2, 8, 0.4, 4, acc, 4.2); for (const s of [-1, 1]) B('stc', s * 3.4, pf - 3.6, 0.35, 4.2, 0.35, 0xd8d8d4);
        const free = (W - 1) - tw - 0.5; if (free > 8) { const pa = at + tw / 2 + free / 2; B('stp', pa, pf + pd / 2, 7, 0.1, 5, 0xd8d0c0, 7.02); B('stp', pa, pf + pd / 2, 6, 0.15, 4, 0x3fa8d8, 7.04); } // piscina sul tetto del basamento
      }
    } },
  stripmall: { id: 133, base: 5, mod: 177, col: 0x5ab8e0, lot: r => [r < 0.5 ? 3 : 4, 3], minW: 3, minD: 3, n: () => L('Centro commerciale lineare: una fila di negozi col parcheggio davanti', 'Strip mall: a row of shops with parking in front'), sh: () => L('Strip mall', 'Strip mall'), bn: ['Galleria ', 'Plaza '],
    h: () => 5.4,
    draw(B, b, W, D, H, r) {
      const bd = Math.min(D * 0.46, 13), bf = D / 2 - 0.5 - bd, c = stPk(r, [0xd8cfc0, 0xc8bca8, 0xe0dcd4, 0xb8b0a4]), acc = stPk(r, [0x8a3a2a, 0x2a4a6a, 0x3a5a3a, 0x5a4a3a]);
      B('stb', 0, bf + bd / 2, W - 1, H, bd, c);
      B('stp', 0, bf - 1.3, W - 1, 0.5, 2.6, acc, 3.9); B('stg', 0, bf - 0.06, W - 1.6, 3, 0.12, 0x6a8aa8, 0.3);
      const n = Math.max(2, Math.round((W - 1) / 7)), uw = (W - 1) / n;
      for (let i = 0; i < n; i++) { B('stp', -W / 2 + 0.5 + uw * (i + 0.5), bf - 2.62, uw * 0.7, 0.9, 0.15, SC.awn[(b.id + i) % SC.awn.length], 4.45); if (i) B('stc', -W / 2 + 0.5 + uw * i, bf - 2.3, 0.3, 3.9, 0.3, 0xd8d8d4); } // insegne dei negozi
      const pk = bf - 3 + D / 2; B('stp', 0, -D / 2 + pk / 2, W - 1, 0.06, pk, 0x55585c, 0.02); // parcheggio
      for (let i = 0; i < 6; i++) if (r() < 0.75) stCar(B, r, -W / 2 + 3 + i * (W - 6) / 5, -D / 2 + pk * 0.55);
      B('stp', -W / 2 + 1.4, -D / 2 + 1, 0.5, 6.4, 0.5, 0x8a8a86); B('stp', -W / 2 + 1.4, -D / 2 + 1, 2.4, 2.8, 0.5, acc, 5.2); B('stn', -W / 2 + 1.4, -D / 2 + 0.72, 2.2, 0.7, 0.1, stPk(r, SC.neon), 6.6); // cartello
    } },
  tokyo: { id: 134, base: 6, mod: 206, col: 0x4a7ad8, lot: r => [2, r < 0.5 ? 3 : 4], minD: 3, n: () => L('Vie dei locali di Tokyo: palazzi stretti pieni di insegne luminose', 'Tokyo nightlife streets: narrow buildings full of glowing signs'), sh: () => L('Insegne di Tokyo', 'Tokyo signs'), bn: ['Palazzo ', 'Building '],
    h: (b, r) => 3.3 * (4 + b.level * 1.6 + r * 4),
    draw(B, b, W, D, H, r) {
      const dd = Math.min(D - 2, 16), f = -D / 2 + 0.8, d0 = f + dd / 2;
      let bill = true; for (const u of stUnits(W, 5.5)) {
        const h = Math.max(10, H * (0.55 + r() * 0.6)), c = stPk(r, [0xd4d0c8, 0xb8b4ac, 0xe8e4dc, 0x8a8e94, 0x6a6460, 0xc8b8a8]);
        B('stb', u.a, d0, u.w - 0.3, h, dd, c); B('stg', u.a, f - 0.06, u.w * 0.8, 3, 0.12, 0x6a8aa8, 0.2);
        B('stn', u.a + (r() < 0.5 ? -1 : 1) * (u.w / 2 - 0.7), f - 0.5, 0.9, Math.min(h * 0.7, 16), 0.5, stPk(r, SC.neon), 3.4); // insegna verticale
        for (let k = 0; k < 2; k++) if (r() < 0.7) B('stn', u.a, f - 0.15, u.w * 0.75, 0.8, 0.2, stPk(r, SC.neon), 4 + r() * (h - 6));
        if (bill && r() < 0.6) { bill = false; B('stp', u.a, d0, 0.4, 1.2, 0.4, 0x4a4a4a, h); B('stn', u.a, d0 - 0.5, u.w * 0.9, 3, 0.3, stPk(r, SC.neon), h + 1.2); } // cartellone sul tetto
      }
    } },
  // ===== Uffici =====
  uffici_moderni: { id: 135, base: 11, mod: 14, col: 0xb088e8, lot: r => [2, r < 0.6 ? 3 : 2], n: () => L('Uffici moderni: vetrate, fasce bianche e giardino sul tetto', 'Modern offices: glass, white bands and a roof garden'), sh: () => L('Uffici moderni', 'Modern offices'), bn: ['Uffici ', 'Offices '],
    h: (b, r) => 3.6 * (3 + b.level * 1.1 + r * 2),
    draw(B, b, W, D, H, r) {
      const w = W - 1, dd = Math.min(D - 4, 17), f = -D / 2 + 2, d0 = f + dd / 2, g = stPk(r, [0x4a7aa8, 0x5a8aaa, 0x3f6a8e, 0x6a8a9a]), wt = stPk(r, [0xf2f2ee, 0xe0e0dc, 0x3a3d42]);
      B('stg', 0, d0, w, H, dd, g);
      if (r() < 0.6) { const nb = Math.min(4, Math.floor(H / 7.2)); for (let i = 1; i <= nb; i++) B('stp', 0, d0, w + 0.3, 0.5, dd + 0.3, wt, i * H / (nb + 1)); }
      else for (let i = 0; i < 4; i++) B('stp', -w / 2 + 0.4 + i * (w - 0.8) / 3, f - 0.4, 0.3, H, 0.8, wt); // pinne verticali
      B('stp', 0, d0, w + 0.2, 0.3, dd + 0.2, wt, H);
      B('stg', -w * 0.15, d0 + 1, w * 0.6, 3.4, dd * 0.6, g, H + 0.3); B('stp', w * 0.32, d0 - dd * 0.15, w * 0.3, 0.2, dd * 0.5, 0x6a9a4a, H + 0.3); stTree(B, r, w * 0.32, d0 - dd * 0.15, 3, H + 0.5); // attico e giardino
      B('stp', 0, f - 1, 4.5, 0.3, 2, wt, 3.4); // pensilina
    } },
  uffici_tokyo: { id: 136, base: 11, mod: 236, col: 0x9a70d8, lot: r => [r < 0.5 ? 1 : 2, 3], n: () => L('Uffici di Tokyo: palazzi stretti e alti con insegne sul fianco e sul tetto', 'Tokyo offices: narrow tall buildings with side and rooftop signs'), sh: () => L('Uffici di Tokyo', 'Tokyo offices'), bn: ['Uffici ', 'Offices '],
    h: (b, r) => 3.4 * (5 + b.level * 1.5 + r * 3),
    draw(B, b, W, D, H, r) {
      const w = W - 0.6, dd = Math.min(D - 3, 15), f = -D / 2 + 1, d0 = f + dd / 2, c = stPk(r, [0xb8b4aa, 0xa8a8a8, 0x8a8a8e, 0xd0c8b8, 0x5a6470]);
      B('stb', 0, d0, w, H, dd, c); B('stg', 0, f - 0.06, w * 0.9, 3.5, 0.12, 0x6a8aa8, 0.2);
      B('stn', (r() < 0.5 ? -1 : 1) * (w / 2 - 0.6), f - 0.55, 1.1, Math.min(H * 0.75, 18), 0.5, stPk(r, SC.neon), 4);
      B('stp', w * 0.15, d0 + 1.5, 3, 2.2, 3, 0x9a9a9a, H);
      if (r() < 0.5) { B('stp', 0, f + 1, 0.4, 0.8, 0.4, 0x4a4a4a, H); B('stn', 0, f + 0.6, w * 0.7, 2.4, 0.3, stPk(r, SC.neon), H + 0.8); }
    } },
  // ===== Industria =====
  urbana: { id: 137, base: 8, mod: 15, col: 0x9ad070, clean: true, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 3 : 4], n: () => L('Industria urbana: laboratori e officine puliti, niente smog e poco rumore (va bene vicino alle case)', 'Urban industry: clean workshops and labs, no smog and little noise (fine next to homes)'), sh: () => L('Industria pulita', 'Clean industry'), bn: ['Laboratorio ', 'Workshop '],
    h: (b, r) => 4.5 + r * 4 + b.level,
    draw(B, b, W, D, H, r) {
      const w = W - 1, dd = Math.min(D - 5, 20), f = -D / 2 + 3.2, d0 = f + dd / 2, c = stPk(r, [0x8a4a36, 0x5e6670, 0x3e5a6e, 0x9a5a40, 0x7a7a72]), rc = stPk(r, [0x6a6e74, 0x8a8e94, 0x5a5e64]);
      B('stb', 0, d0, w, H, dd, c);
      if (r() < 0.6) { const n = Math.max(2, Math.round(dd / 5)); for (let i = 0; i < n; i++) B('sts', 0, f + (i + 0.5) * dd / n, w, 1.9, dd / n, rc, H); } // tetto a denti di sega
      else { B('stp', 0, d0, w + 0.2, 0.4, dd + 0.2, rc, H); B('stp', 0, d0 + 1, w * 0.8, 0.25, dd * 0.6, 0x24324a, H + 0.4); } // pannelli solari
      B('stg', -w * 0.12, f - 0.06, w * 0.6, Math.min(3.4, H - 1), 0.12, 0x6a8aa8, 0.5);
      B('stp', w / 2 - 2.6, f - 0.04, 4, Math.min(4, H - 0.5), 0.1, 0x3a3c40);
      B('stp', 0, -D / 2 + 1.5, W - 1, 0.1, 2.6, 0x6fae55, 0.02); for (const s of [-1, 1]) stTree(B, r, s * (W / 2 - 2.5), -D / 2 + 1.5, 3.4);
    } },
  magazzini: { id: 138, base: 8, mod: 24, col: 0xd0a040, lot: r => [r < 0.5 ? 2 : 3, r < 0.5 ? 3 : 4], n: () => L('Magazzini industriali d\'inizio Novecento: mattoni, ciminiera, serbatoio sul tetto', 'Early 1900s industrial warehouses: brick, chimney, rooftop tank'), sh: () => L('Magazzini d\'epoca', 'Old warehouses'), bn: ['Magazzini ', 'Warehouses '],
    h: (b, r) => 3.8 * (3 + r * 2) + b.level,
    draw(B, b, W, D, H, r) {
      const w = W - 0.8, dd = Math.min(D - 4, 22), f = -D / 2 + 2.6, d0 = f + dd / 2, br = stPk(r, SC.brick), dk = 0x5a3428;
      B('stb', 0, d0, w, H, dd, br); B('stp', 0, d0, w + 0.4, 1, dd + 0.4, dk, H - 1); B('stp', 0, f + 0.25, w * 0.35, 1.6, 0.5, br, H);
      B('stp', 0, f - 0.04, w * 0.7, 2, 0.08, 0xd8ccb0, H - 3.6); // scritta sbiadita
      B('stp', 0, f - 1.25, w * 0.8, 1.2, 2.5, 0x8a8478); for (let i = -1; i <= 1; i++) B('stp', i * w * 0.26, f - 0.04, 3, 3.2, 0.1, 0x3a2e28, 1.2); // banchina di carico e portoni
      if (r() < 0.6) B('stc', w / 2 - 1.5, d0 + dd / 2 - 1.5, 2, H + 16, 2, dk); // ciminiera
      if (r() < 0.45) { B('stc', -w * 0.25, d0 + 2, 0.6, 2.6, 0.6, 0x3a3a3a, H); B('stc', -w * 0.25, d0 + 2, 3.6, 3.2, 3.6, 0x6e5640, H + 2.6); B('stk', -w * 0.25, d0 + 2, 4, 1.6, 4, 0x4a4040, H + 5.8); }
    } },
  // ===== Fronte mare =====
  spiaggia: { id: 139, base: 13, mod: 8, col: 0x6ae0c0, n: () => L('Case sulla spiaggia: su palafitte, colori chiari e verande (solo vicino all\'acqua)', 'Beach houses: on stilts, light colours and decks (only near water)'), sh: () => L('Spiaggia', 'Beach'), bn: ['Casa al mare ', 'Beach house '],
    h: (b, r) => 6 + r * 2.4,
    draw(B, b, W, D, H, r) {
      const w = Math.min(W - 3.2, 9), dd = Math.min(D * 0.5, 8), d0 = -D / 2 + 4.2 + dd / 2, f = d0 - dd / 2, c = stPk(r, [0xa8d8e8, 0xb8e0c8, 0xf0e0a0, 0xf4f0ea, 0xf0b8a0, 0xd8c8e8]), rc = stPk(r, [0xf0f0ea, 0x9aa8b0, 0x6a8aa0]), dk = 0xc8a878, y0 = 2.4;
      B('stp', 0, 0, W, 0.08, D, 0xe6d6a8, 0.02); // sabbia
      for (const sa of [-1, 1]) for (const sd of [-1, 0, 1]) B('stc', sa * (w / 2 + 0.8), d0 + sd * (dd / 2 + 0.8), 0.35, y0, 0.35, 0x8a7350); // palafitte
      B('stp', 0, d0, w + 2.4, 0.25, dd + 2.4, dk, y0); B('stp', 0, f - 1.17, w + 2.4, 1, 0.06, 0xf8f8f2, y0 + 0.25); // veranda e ringhiera
      stHouse(B, 0, d0, w, dd, H - y0, c, r() < 0.5 ? 'h' : 'G', Math.min(w, dd) * 0.32, rc, y0 + 0.25, 0.6);
      B('stp', w / 2 - 0.4, f - 2.3, 1.2, y0, 2.2, dk); // scala
    } },
};

// ---------- ogni stile diventa una zona (nascosta dalla lista: si sceglie dalla riga 🎨 Stile) ----------
const STY_BY = {};
for (const k in STY) {
  const s = STY[k], base = ZT[s.base]; s.k = k;
  const zt = { ...base, like: zl(s.base), base: s.base, sty: k, col: s.col, n: s.n, sh: s.sh, ms: base.ms };
  delete zt.pf; delete zt.custom; delete zt.looks; delete zt.night;
  for (const f of ['hill', 'clean', 'rich', 'hotel', 'att', 'era']) if (s[f]) zt[f] = true;
  Object.defineProperty(ZT, s.id, { value: zt, enumerable: false, writable: true, configurable: true }); // non enumerabile: non riempie i messaggi dei traguardi
  (STY_BY[s.base] = STY_BY[s.base] || []).push(s.id);
}
const styOf = b => { const z = b && ZT[b.zone]; return z && z.sty ? STY[z.sty] : null; };
const STYB = new Map(); // stile → numeri degli edifici
function stCorner(b) { // -1/+1 = di che lato c'è un incrocio vero vicino al lotto, 0 = nessuno
  const s = segs.get(b.seg); if (!s) return 0;
  const nK = Math.floor((s.len - 8) / CELL), deg = id => nodes.get(id)?.segs.length || 0;
  const kd = b.k0 <= 1 && deg(s.a) >= 3 ? -1 : b.k0 + b.cw >= nK - 1 && deg(s.b) >= 3 ? 1 : 0; // la prima cella vicino all'incrocio non c'è mai (troppo vicina all'altra strada)
  return kd * b.side;
}

// ---------- disegno ----------
{
  const _db = drawBuilding;
  drawBuilding = function (b) {
    const st = styOf(b); if (!st || b.ruin || b.spec) return _db(b);
    removeParts(b.parts); curRef = b;
    const W = b.cw * CELL - (st.att ? 0.2 : 1.6), D = b.cd * CELL - 1.6, y = b.y, yaw = b.ang, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    if (b.cons > 0) { // cantiere: la solita gru gialla
      const cx = b.x + fx * (D / 2 - 2), cz = b.z + fz * (D / 2 - 2), mh = (b.h || 8) + 10;
      addPart(b.parts, 'body', cx, y, cz, yaw, 1.2, mh, 1.2, 0xe0b020);
      addPart(b.parts, 'plain', cx - rx * W * 0.3, y + mh, cz - rz * W * 0.3, yaw, W * 0.9 + 6, 0.8, 0.8, 0xe0b020);
    }
    const X = { gy: (a, d) => getH(b.x + fx * d + rx * a, b.z + fz * d + rz * a) - y, get corner() { return stCorner(b); } };
    try { st.draw(pfAdder(b.parts, b.x, b.z, y, yaw), b, W, D, Math.max(3, b.h || 6), mulberry32(b.id * 31 + 5), X); } catch (e) { console.warn('stile', st.k, e); }
    if (b.cons > 0) return;
    if (b.def) applyDeform(b);
    const s = segs.get(b.seg), rt = s && RT[s.type];
    if (!st.att && rt && rt.zone && (rt.side || 0) > 1 && b.parts.length && SET.driveways !== false) { // passo carraio, come le altre case
      const off = -(b.cd * CELL) / 2 - rt.side / 2 + 0.3, ww = Math.min(4, b.cw * CELL * 0.4);
      addPart(b.parts, 'plain', b.x + fx * off, b.y + 0.02, b.z + fz * off, b.ang, ww, 0.2, rt.side + 0.6, 0x8c8c88);
    }
  };
  const _bh = bldHeight;
  bldHeight = function (b) { const st = styOf(b); return st && st.h && !b.spec ? Math.max(3, Math.min(st.h(b, mulberry32(b.id * 7 + 3)()), airCap(b.x, b.z))) : _bh(b); }; // altezza fissa per edificio (sale solo col livello), sempre sotto il limite degli aeroporti
  const _bn = bldName;
  bldName = function (b) {
    const st = styOf(b); if (!st || !st.bn) return _bn(b);
    const r = mulberry32(b.id * 13), a = NAMES_A[Math.floor(r() * NAMES_A.length)], p = NAMES_P[Math.floor(r() * NAMES_P.length)], bn = typeof st.bn === 'function' ? st.bn(b) : st.bn;
    return L(bn[0], bn[1]) + (st.base === 1 || st.base === 12 || st.base === 13 ? p : a);
  };
  const _bc = bldCapacity;
  bldCapacity = function (b) {
    _bc(b); const st = styOf(b); if (!st || !st.cap) return;
    st.cap(b); const k = ZT[b.zone].k; b.cap = b.hh * 5; b.cmax = k === 'C' || k === 'M' ? Math.max(6, b.jobs * 3) : 0;
  };
  const _ts = trySpawn;
  trySpawn = function (c) { // lotti su misura per gli stili che ne hanno bisogno (ville, strip mall, hotel, torri...)
    const st = styOf(c); if (!st || !st.lot) return _ts(c);
    const s = segs.get(c.seg); if (!s || !s.cellMap) return null;
    const [w, d] = st.lot(rand()), minD = st.minD || Math.min(2, d), minW = st.minW || 1;
    for (let tryD = d; tryD >= minD; tryD--) for (let tryW = w; tryW >= minW; tryW--) for (let k0 = c.k - tryW + 1; k0 <= c.k; k0++) {
      const cs = []; let ok = true;
      for (let k = k0; k < k0 + tryW && ok; k++) for (let dd = 0; dd < tryD; dd++) {
        const id = s.cellMap.get(cellKey(c.side, k, dd)); const cc = id != null ? cells[id] : null;
        if (!cc || cc.zone !== c.zone || cc.b) { ok = false; break; } cs.push(cc);
      }
      if (ok && cs.length) return createBuilding(c.zone, cs);
    }
    return null;
  };
}

// ---------- case in collina: celle anche sui pendii ripidi, solo per questa zona ----------
// Le celle "deboli" (c.weak) nascono dove il pendio è troppo ripido per le zone normali (fino a 7 m ogni 8 m).
// Hanno una griglia di occupazione tutta loro (WCLAIM): le celle normali nascono esattamente come prima,
// così le città già fatte e i vecchi salvataggi restano uguali. Una cella debole cede sempre il posto,
// tranne quando ha una zona o una casa (allora vale la regola di sempre: vince la strada più vecchia).
// Le celle delle case in collina già fatte (HOLD) rinascono anche se il terreno vicino alla strada è cambiato
// (ogni strada spiana un po' il terreno a ogni caricamento): così le case in collina non spariscono.
const ST_STEEP = 7;
let stLoading = false;
const WCLAIM = new Map();
// HOLD: celle in collina prese (zona o casa), mentre non esistono (durante il ricalcolo e il caricamento)
const HOLD = new Set();
const hk = (seg, side, k, d) => ((seg * 2 + (side > 0 ? 1 : 0)) * 4096 + k) * 8 + d;
const weakHeld = oc => oc.b || oc.zone || HOLD.has(hk(oc.seg, oc.side, oc.k, oc.d));
const stHeldCell = c => c && (c.weak ? c.zone || c.b : ZT[c.zone]?.hill);
function stHoldFromCells() { HOLD.clear(); for (const c of cells) if (stHeldCell(c)) HOLD.add(hk(c.seg, c.side, c.k, c.d)); }
function cellPointSteepBad(x, z, s, lim = ST_STEEP) { // come cellPointBad, ma col pendio fino a lim
  if (!inMap(x, z) || !isOwned(x, z)) return true;
  const h = getH(x, z); if (h < 0.4) return true;
  if (Math.abs(getH(x + 4, z) - getH(x - 4, z)) > lim || Math.abs(getH(x, z + 4) - getH(x, z - 4)) > lim) return true;
  for (const id of segsNear(x, z, 40)) {
    const o = segs.get(id); if (!o) continue;
    const r = nearestOnSeg(o, x, z);
    if (r.d < RT[o.type].w / 2 + 3.6 && !(o === s && r.d > RT[o.type].w / 2 + 3)) return true;
  }
  if (svcAt(x, z)) return true;
  return false;
}
genCells = function (s) {
  if (!RT[s.type].zone || s.elev) return;
  const hw = RT[s.type].w / 2;
  s.cellMap = new Map();
  const nK = Math.floor((s.len - 8) / CELL);
  for (const side of [1, -1]) for (let k = 0; k < nK; k++) {
    const along = 4 + 4 + k * CELL;
    const f = segFrame(s, along);
    let hd = -1; if (HOLD.size) for (let d = DEPTH - 1; d >= 0; d--) if (HOLD.has(hk(s.id, side, k, d))) { hd = d; break; } // fin dove la colonna ha celle in collina da rifare
    if (f.y - getH(f.x, f.z) > 2 && hd < 0) continue;
    let weak = false;
    for (let d = 0; d < DEPTH; d++) {
      const off = hw + 4 + d * CELL;
      const x = f.x + f.nx * side * off, z = f.z + f.nz * side * off;
      const lim = d <= hd ? Infinity : ST_STEEP; // le case in collina già fatte non spariscono se il pendio è cambiato
      if (!weak) { if (cellPointBad(x, z, s)) { if (cellPointSteepBad(x, z, s, lim)) break; weak = true; } }
      else if (cellPointSteepBad(x, z, s, lim)) break;
      const ux = f.tx * 3, uz = f.tz * 3, vx = f.nx * 3, vz = f.nz * 3;
      const pts = [cgIdx(x, z), cgIdx(x + ux, z + uz), cgIdx(x - ux, z - uz), cgIdx(x + vx, z + vz), cgIdx(x - vx, z - vz)];
      let blocked = false; const toKill = new Set();
      if (!weak) {
        // controllo sovrapposizione identico a prima (vince il segmento con id più basso)
        for (const g of pts) { if (g < 0) { blocked = true; break; } const c = claimM.get(g) || 0; if (c) { const oc = cells[c - 1]; if (oc && oc.seg !== s.id) { if (oc.seg < s.id) { blocked = true; break; } else toKill.add(oc); } } }
        // le celle deboli vuote lasciano il posto; quelle con una casa contano come celle normali
        if (!blocked) for (const g of pts) { const w = WCLAIM.get(g) || 0; if (!w) continue; const oc = cells[w - 1]; if (!oc || !oc.weak || oc.seg === s.id) continue; if (!weakHeld(oc) || oc.seg > s.id) toKill.add(oc); else { blocked = true; break; } }
      } else {
        for (const g of pts) {
          if (g < 0) { blocked = true; break; }
          const c = claimM.get(g) || 0; if (c) { const oc = cells[c - 1]; if (oc && oc.seg !== s.id) { blocked = true; break; } } // non toglie mai il posto a una cella normale
          const w = WCLAIM.get(g) || 0; if (w) { const oc = cells[w - 1]; if (oc && oc.weak && oc.seg !== s.id) { if (!weakHeld(oc) && HOLD.has(hk(s.id, side, k, d))) toKill.add(oc); else { blocked = true; break; } } } // solo una casa salvata riprende il suo posto
        }
      }
      if (blocked) break;
      for (const oc of toKill) killCell(oc);
      const id = freeCells.length ? freeCells.pop() : cells.length;
      const c = { id, seg: s.id, side, k, d, x, z, ang: Math.atan2(f.nx * side, f.nz * side), zone: 0, b: 0, cl: [] };
      cells[id] = c;
      if (weak) { c.weak = 1; for (const g of pts) if (!WCLAIM.get(g)) { WCLAIM.set(g, id + 1); c.cl.push(g); } }
      else for (const g of pts) if (!claimM.get(g)) { claimM.set(g, id + 1); c.cl.push(g); }
      s.cells.push(id); s.cellMap.set(cellKey(side, k, d), id);
    }
  }
  cellsDirty = true;
};
{
  const _kc = killCell;
  killCell = function (c) { if (c && c.weak) for (const g of c.cl) if (WCLAIM.get(g) === c.id + 1) WCLAIM.delete(g); return _kc(c); };
  const _cap = cellAtPoint;
  cellAtPoint = function (x, z) { const c = _cap(x, z); if (c) return c; const g = cgIdx(x, z); if (g < 0) return null; const w = WCLAIM.get(g) || 0, oc = w ? cells[w - 1] : null; return oc && oc.weak ? oc : null; };
}
const stSweep = () => { for (const c of cells) if (c && c.weak && c.zone && !ZT[c.zone]?.hill && !c.b) c.zone = 0; }; // sui pendii ripidi restano solo le zone in collina
{
  const _sz = setZone;
  setZone = function (c, zone) { if (zone && c.weak && !ZT[zone]?.hill) return; _sz(c, zone); }; // sui pendii ripidi solo le case in collina
  const _cb = createBuilding;
  createBuilding = function (zone, cs, data) {
    const b = _cb(zone, cs, data); if (!b) return b;
    const st = ZT[zone]?.sty; if (st) { let set = STYB.get(st); if (!set) STYB.set(st, set = new Set()); set.add(b.id); }
    return b;
  };
  const _dbd = destroyBuilding;
  destroyBuilding = function (b, keepCells) {
    if (b) {
      const st = ZT[b.zone]?.sty; if (st) STYB.get(st)?.delete(b.id);
    }
    return _dbd(b, keepCells);
  };
  const _rcn = regenCellsNear;
  regenCellsNear = function (s) { stHoldFromCells(); try { _rcn(s); } finally { HOLD.clear(); stSweep(); } }; // le celle deboli prese riprendono il loro posto
  const _rat = regenAllCellsInTile;
  regenAllCellsInTile = function (t) { stHoldFromCells(); try { _rat(t); } finally { HOLD.clear(); stSweep(); } };
  flushCells = function () { // come prima, ma le celle sui pendii si vedono solo con le case in collina
    if (!cellsDirty) return; cellsDirty = false;
    const hillTool = TOOL.kind === 'zone' && !!ZT[TOOL.sub]?.hill;
    let n = 0;
    for (const c of cells) {
      if (!c || c.b) continue;
      if (!c.zone && (!showEmptyCells || (c.weak && !hillTool))) continue;
      if (n >= cellPool.max) break;
      setInst(cellPool.mesh, n, c.x, getH(c.x, c.z) + 0.35, c.z, c.ang, 1, 1, 1);
      if (c.zone) { _c.setHex(ZT[c.zone].col); setInstCol(cellPool.mesh, n, _c.r, _c.g, _c.b); } else if (c.weak) setInstCol(cellPool.mesh, n, 0.86, 0.7, 0.45); else setInstCol(cellPool.mesh, n, 0.92, 0.92, 0.92);
      n++;
    }
    cellPool.mesh.count = n; cellPool.dirty();
  };
  const _ser = serialize;
  serialize = function () {
    const hold = []; for (const c of cells) if (stHeldCell(c)) hold.push(hk(c.seg, c.side, c.k, c.d));
    S.hillHold = hold; try { return _ser(); } finally { delete S.hillHold; }
  };
  if (typeof __cm !== 'undefined') __cm.serialize = serialize;
  const _des = deserializeG;
  deserializeG = function* (json) {
    stLoading = true; HOLD.clear(); STYB.clear();
    const m = /"hillHold":\[([0-9,]*)\]/.exec(json); if (m && m[1]) for (const v of m[1].split(',')) HOLD.add(+v);
    try { yield* _des(json); } finally { stLoading = false; }
    HOLD.clear(); stSweep();
    if (typeof POP !== 'undefined' && typeof outsideNodes === 'function') POP.outs = outsideNodes(); // (correzione) i camion da fuori ripartono subito dalla città caricata
  };
  const _rw = resetWorld;
  resetWorld = function (...a) {
    if (!stLoading) HOLD.clear(); STYB.clear(); WCLAIM.clear();
    if (typeof POP !== 'undefined') POP.outs = []; // (correzione) dopo un caricamento i camion non partono più dagli incroci della partita vecchia
    return _rw.apply(this, a);
  };
}

// ---------- regole delle zone nuove ----------
{
  // industria urbana: niente smog né inquinamento del suolo, un quarto del rumore
  const _gh = gridHook;
  gridHook = function (airS, noiseS, filt) {
    const set = STYB.get('urbana');
    if (set && set.size) {
      const cur = S.policies.curfew && (S.time % 24 < 6 || S.time % 24 > 22) ? 0.7 : 1;
      for (const id of set) {
        const b = buildings.get(id); if (!b || b.ruin) continue;
        const k = gIdx(b.x, b.z), act = b.aband ? 0.2 : clamp(b.occ / Math.max(1, b.jobs || b.hh), 0.2, 1);
        airS[k] = Math.max(0, airS[k] - 2.2 * b.cw * act * filt); GROUND[k] = Math.max(0, GROUND[k] - 0.05 * b.cw * act); noiseS[k] = Math.max(0, noiseS[k] - 3 * act * cur * 0.75);
      }
    }
    _gh(airS, noiseS, filt);
  };
  // ville di lusso: il triplo delle tasse sulla casa e terreni più cari intorno
  const _bn = budgetNow;
  budgetNow = function () {
    const bg = _bn(), set = STYB.get('ville'); if (!set || !set.size) return bg;
    let extra = 0; for (const id of set) { const b = buildings.get(id); if (!b || b.ruin || b.aband || !b.hh) continue; extra += (b.res || 0) * 1.25 * (0.8 + 0.2 * b.level) * rTaxFor(b) * 2; }
    if (extra) { bg.inc.res = (bg.inc.res || 0) + extra; bg.ti += extra; bg.net = bg.ti - bg.te; }
    return bg;
  };
  const _cg = computeGrids;
  computeGrids = function () { _cg(); const set = STYB.get('ville'); if (set) for (const id of set) { const b = buildings.get(id); if (b && !b.ruin && !b.aband) stampLV(b.x, b.z, 200, 1.5); } };
  // hotel e motel: ogni camera porta turisti (anche senza monumenti) e gli alberghi aumentano quelli che arrivano
  const _cs = computeStats;
  computeStats = function () {
    _cs();
    let n = 0, rooms = 0; const set = STYB.get('hotel');
    if (set) for (const id of set) { const b = buildings.get(id); if (!b || b.ruin || b.aband || b.cons > 0) continue; n++; rooms += b.cw * b.cd * (b.level <= 2 ? 2 : b.level * 2.5); }
    stats.hotelZ = n; stats.hotelRooms = Math.round(rooms);
    if (n) { stats.hotels = (stats.hotels || 0) + n; stats.tourTarget = Math.round((stats.tourTarget || 0) * (1 + Math.min(0.6, n * 0.03)) + rooms * 0.8); }
  };
  // scheda dell'edificio: una riga sulla regola speciale
  const _bx = bldExtraHTML;
  bldExtraHTML = function (o) {
    let h = _bx(o); const st = styOf(o); if (!st) return h;
    const t = [];
    if (st.era) t.push('🕰️ ' + L('Epoca: ', 'Era: ') + ERA_N[Math.min(5, o.level) - 1]() + L(' (salendo di livello cambia stile)', ' (changes style when it levels up)'));
    if (st.hill) t.push('⛰️ ' + L('Costruita a gradoni sul pendio', 'Built in steps on the slope'));
    if (st.rich) t.push('💎 ' + L('Famiglia ricca: paga il triplo di tasse', 'Rich family: pays triple taxes'));
    if (st.clean) t.push('🍃 ' + L('Niente smog, poco rumore', 'No smog, little noise'));
    if (st.hotel) t.push('🏨 ' + L('Camere: ', 'Rooms: ') + Math.round(o.cw * o.cd * (o.level <= 2 ? 2 : o.level * 2.5)) + L(' · porta turisti in città', ' · brings tourists to town'));
    if (t.length) h += `<div style="font-size:12px;margin:4px 0">${t.join('<br>')}</div>`;
    return h;
  };
}

// ---------- menu Zone: riga 🎨 Stile sotto la zona scelta ----------
{
  const _bs = buildSub;
  buildSub = function () {
    _bs();
    const el = $('sub'); if (!el || openCat !== 'zones') return;
    const cardOf = base => el.querySelector(`button.item[onclick^="setTool('zone',${base});"]`);
    for (const base in STY_BY) { const n = cardOf(base)?.querySelector('.n'); if (n && !n.dataset.sty) { n.dataset.sty = 1; n.textContent += ' 🎨'; } }
    const kind = TOOL.kind; if (kind !== 'zone' && kind !== 'fillblock') return;
    const cur = TOOL.sub, base = ZT[cur]?.sty ? ZT[cur].base : cur, list = STY_BY[base]; if (!list) return;
    if (cur !== base) (kind === 'zone' ? cardOf(base) : el.querySelector(`.subopts button[onclick^="TOOL.sub=${base};"]`))?.classList.add('on');
    const act = id => kind === 'zone' ? `setTool('zone',${id});buildSub()` : `TOOL.sub=${id};buildSub()`, q = s => s.replace(/"/g, '&quot;');
    const row = document.createElement('div'); row.className = 'subopts'; row.style.flexWrap = 'wrap';
    row.innerHTML = `<span>🎨 ${L('Stile', 'Style')}:</span>` + [base, ...list].map(id => `<button class="${cur === id ? 'on' : ''}" title="${q(ZT[id].n())}" onclick="${act(id)}" style="border-bottom:3px solid #${ZT[id].col.toString(16).padStart(6, '0')}">${id === base ? L('Normale', 'Standard') : ZT[id].sh()}</button>`).join('');
    const first = el.querySelector(':scope > .subopts');
    if (kind === 'zone' && first) el.insertBefore(row, first); else el.appendChild(row);
  };
}
if (typeof __cm !== 'undefined') Object.assign(__cm, { STY, STY_BY, styOf, stCorner, HOLD, STYB, WCLAIM, cellPointSteepBad, stHoldFromCells });
