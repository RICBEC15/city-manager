// =====================================================================
//  Anteprima della mappa nel menu "Nuova città": quando scegli una mappa
//  compare a destra un disegno dall'alto (rilievo, acqua, autostrade),
//  con il riquadro del centro città ingrandito. Disegno leggero su canvas 2D.
// =====================================================================
const PREV = { cache: {}, timer: 0, token: 0 };
// colori: acqua per profondità, terra per altezza
function prevLand(h) {
  const st = [[0, 112, 150, 84], [40, 132, 165, 92], [120, 170, 172, 104], [300, 160, 140, 98], [600, 135, 118, 96], [1000, 150, 145, 140], [1600, 235, 235, 238]];
  if (h <= st[0][0]) return st[0].slice(1);
  for (let i = 1; i < st.length; i++) if (h < st[i][0]) { const a = st[i - 1], b = st[i], t = (h - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  return st[st.length - 1].slice(1);
}
// griglia di altezze (n x n) su un quadrato di lato 'size' metri centrato in (0,0)
function prevGrid(mapId, seed, size, n) {
  const real = MAPH[mapId], wreal = MAPH['w_' + mapId], h = new Float32Array(n * n), half = size / 2;
  if (wreal || real) {
    // mappe delle città: dati veri (al centro quelli precisi da 20 m, fuori quelli da 160 m)
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = -half + (i + 0.5) * size / n, z = -half + (j + 0.5) * size / n;
      if (real && Math.abs(x) < OHALF && Math.abs(z) < OHALF) h[j * n + i] = real[Math.round((z + OHALF) / OHC) * OHN + Math.round((x + OHALF) / OHC)];
      else if (wreal) h[j * n + i] = wreal[clamp(Math.round((z + HALF) / CC), 0, CN - 1) * CN + clamp(Math.round((x + HALF) / CC), 0, CN - 1)];
    }
    return h;
  }
  // mappe generate: stessa formula del gioco, poi rimetto il rumore com'era (se c'è una partita aperta)
  const keep = [NOISE, PN1, PN2];
  NOISE = makeNoise(seed); PN1 = makeNoise(seed + 11); PN2 = makeNoise(seed + 23);
  try {
    const M = MAPS[mapId]; if (mapId !== 'valley') extendFeatures(M);
    const at = mapId === 'valley' ? valleyAt : (x, z) => presetAt(M, x, z);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = at(-half + (i + 0.5) * size / n, -half + (j + 0.5) * size / n)[0];
  } finally { [NOISE, PN1, PN2] = keep; }
  return h;
}
// disegna la griglia con un'ombra leggera da nord-ovest
function prevPaint(ctx, h, n, W, size, water) {
  const img = ctx.createImageData(n, n), d = img.data, cell = size / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, v = h[k], o = k * 4; let c;
    if (v < water) { const t = clamp((water - v) / 25, 0, 1); c = [lerp(70, 28, t), lerp(140, 82, t), lerp(190, 150, t)]; }
    else {
      c = prevLand(v);
      const gx = h[j * n + Math.min(n - 1, i + 1)] - h[j * n + Math.max(0, i - 1)], gz = h[Math.min(n - 1, j + 1) * n + i] - h[Math.max(0, j - 1) * n + i];
      const sh = clamp(1 - (gx + gz) / (2 * cell) * 2.2, 0.55, 1.35); c = c.map(q => q * sh);
    }
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = n; tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, 0, 0, W, W);
}
function prevRoads(ctx, mapId, W, size, wMain) {
  const c = RHW.ready && RHW.city[mapId]; if (!c) return;
  const s = W / size, half = size / 2;
  ctx.lineCap = ctx.lineJoin = 'round';
  for (const pass of [0, 1]) for (const ch of c.chains) {
    const ramp = ch.kind >= 2;
    ctx.strokeStyle = pass ? (ramp ? '#ffd27a' : '#ffb347') : 'rgba(60,30,0,.55)';
    ctx.lineWidth = (ramp ? wMain * 0.6 : wMain) + (pass ? 0 : 1.6);
    ctx.beginPath();
    for (let i = 0; i < ch.xs.length; i++) { const x = (ch.xs[i] + half) * s, y = (ch.zs[i] + half) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
}
async function drawMapPreview() {
  const box = $('mapPrev'), sel = $('ngMap'); if (!box || !sel) return;
  const id = sel.value, seed = parseInt($('ngSeed')?.value) || 1, tok = ++PREV.token;
  $('mpT').textContent = MAPS[id].n();
  try { await MAPS_READY; await RHW_READY; } catch (e) { }
  if (tok !== PREV.token) return;
  const real = !!(MAPH[id] || MAPH['w_' + id]), key = id + (real ? '' : '_' + seed);
  let pc = PREV.cache[key];
  if (!pc) {
    pc = PREV.cache[key] = { big: prevGrid(id, seed, MAP, real ? 320 : 200), small: prevGrid(id, seed, OHALF * 2, real ? 256 : 160) };
  }
  // 1) tutta la mappa
  const cv = $('mpBig'), W = cv.width, ctx = cv.getContext('2d');
  prevPaint(ctx, pc.big, real ? 320 : 200, W, MAP, real ? 0.5 : 0);
  prevRoads(ctx, id, W, MAP, 2.2);
  const q = OHALF * 2 / MAP * W, o = (W - q) / 2; // riquadro del centro città
  ctx.setLineDash([5, 4]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(o, o, q, q); ctx.setLineDash([]);
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillText(L('N ↑', 'N ↑'), W - 20, 20); ctx.shadowBlur = 0;
  // 2) il centro ingrandito (10 km)
  const cs = $('mpSmall'), Ws = cs.width, cx = cs.getContext('2d');
  prevPaint(cx, pc.small, real ? 256 : 160, Ws, OHALF * 2, real ? 0.5 : 0);
  prevRoads(cx, id, Ws, OHALF * 2, 3);
}
function showMapPreview() {
  let box = $('mapPrev');
  if (!box) {
    box = document.createElement('div'); box.id = 'mapPrev'; box.className = 'pan';
    box.innerHTML = `<div class="mpH"><b id="mpT"></b><span>${L('Anteprima della mappa', 'Map preview')}</span></div>
      <div class="mpW"><canvas id="mpBig" width="560" height="560"></canvas>
        <div class="mpI"><canvas id="mpSmall" width="200" height="200"></canvas><div>${L('Centro città · 10 km', 'City centre · 10 km')}</div></div></div>
      <div class="mpL"><span><i style="background:#3f7fb8"></i>${L('acqua', 'water')}</span><span><i style="background:#7aa55a"></i>${L('pianura', 'plains')}</span><span><i style="background:#a08c62"></i>${L('colline', 'hills')}</span><span><i style="background:#d8d8dc"></i>${L('montagne', 'mountains')}</span><span><i style="background:#ffb347"></i>${L('autostrade', 'motorways')}</span><span><i style="border:1.5px dashed #fff;background:none"></i>${L('centro città', 'city centre')}</span></div>
      <div class="mpN">${L('Tutta la mappa: 100 x 100 km', 'Whole map: 100 x 100 km')}</div>`;
    $('menu').appendChild(box);
  }
  box.style.display = '';
  const sel = $('ngMap'), seedEl = $('ngSeed');
  sel.addEventListener('change', drawMapPreview);
  seedEl.addEventListener('input', () => { clearTimeout(PREV.timer); PREV.timer = setTimeout(drawMapPreview, 350); });
  drawMapPreview();
}
function hideMapPreview() { const b = $('mapPrev'); if (b) b.style.display = 'none'; }
const _menuNew26 = menuNew;
menuNew = function () { _menuNew26(); showMapPreview(); };
{ // le altre pagine del menu (e l'inizio della partita) nascondono l'anteprima
  const wrap = old => function (...a) { hideMapPreview(); return old.apply(this, a); };
  menuMain = wrap(menuMain); menuSaves = wrap(menuSaves); menuSettings = wrap(menuSettings); menuHelp = wrap(menuHelp); closeMenu = wrap(closeMenu);
}
