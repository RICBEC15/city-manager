// ---------- rotellina in alto a destra: statistiche dei primi 10 minuti di gioco ----------
// Conta solo il tempo in cui il gioco va (non in pausa, non nel menu). Legge gli stessi dati del gioco:
// famiglie nelle case (b.occ), soldi (S.money e il bilancio mensile S.lastBudget), edifici, servizi e strade.
// Tutto è salvato in S.st10, quindi resta anche caricando la partita.
const ST10_DUR = 600; // secondi reali
const st10 = { lk: { need: false, key: '', mesh: null, t: 0 }, S: null, prev: new Map(), money: 0, bud: null, t: 0, tick: 0, open: false, rot: 0, rotT: 0 };
function st10New() {
  return { real: 1, arrF: 0, t: 0, t0: S.time, done: 0, arr: 0, left: 0, orig: {}, min: Array(10).fill(0), spent: 0, earned: 0, loans: 0, snap: null };
}
// da dove arrivano: le stesse strade/binari/porti che collegano la città al bordo della mappa (senza nomi di città)
function st10Dir(dx, dz) {
  const a = Math.atan2(dx, -dz) * 180 / Math.PI, i = Math.round(((a + 360) % 360) / 45) % 8;
  return (LANG === 'en' ? ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] : ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'])[i];
}
function st10Origins(b) {
  const o = [];
  const outs = outsideNodes();
  if (outs.length) {
    let best = null, bd = Infinity; for (const n of outs) { const d = (n.x - b.x) ** 2 + (n.z - b.z) ** 2; if (d < bd) { bd = d; best = n; } }
    const hw = best.segs.some(id => { const s = segs.get(id); return s && RT[s.type] && RT[s.type].hw; });
    o.push([(hw ? '🛣️ ' + L('Autostrada da ', 'Highway from the ') : '🚗 ' + L('Strada esterna da ', 'Outside road from the ')) + st10Dir(best.x - b.x, best.z - b.z), 3]);
  }
  const rail = typeof outsideRail === 'function' && outsideRail().length > 0;
  for (const sv of svcs.values()) {
    if (!sv.on) continue;
    if (rail && (sv.type === 'train' || sv.type === 'train2')) o.push(['🚆 ' + L('Treno (ferrovia dal bordo mappa)', 'Train (railway from the map edge)'), sv.type === 'train2' ? 3 : 1.5]);
    else if (sv.type === 'harbor') o.push(['🚢 ' + L('Nave (porto passeggeri)', 'Ship (passenger harbor)'), 1.5]);
    else if (sv.type === 'icbus') o.push(['🚌 ' + L('Bus intercity (dall\'autostrada)', 'Intercity bus (from the highway)'), 1]);
  }
  if (!o.length) o.push(['🗺️ ' + L('Bordo della mappa', 'Map edge'), 1]);
  return o;
}
function st10Add(b, n) {
  const st = S.st10, o = st10Origins(b); let tot = 0; for (const x of o) tot += x[1];
  // divido le famiglie tra i collegamenti in proporzione al peso (senza perdere nessuno)
  let r = n; o.forEach((x, i) => { const k = i === o.length - 1 ? r : Math.min(r, Math.round(n * x[1] / tot)); r -= k; if (k > 0) st.orig[x[0]] = (st.orig[x[0]] || 0) + k; });
  st.arr += n; st10Roll(st); st.min[Math.floor(st.t / 60) - st.m0] += n;
}
// arrivi veri (25-popolazione.js): persone esatte e il collegamento da cui sono davvero entrate
function st10Real(b, n, or) {
  const st = S && S.st10; if (!st || !st.real || st.done) return;
  let k;
  if (or === 'treno') k = '🚆 ' + L('Treno (ferrovia dal bordo mappa)', 'Train (railway from the map edge)');
  else if (or === 'nave') k = '🚢 ' + L('Nave (porto passeggeri)', 'Ship (passenger harbor)');
  else if (or === 'nati') k = '👶 ' + L('Nati in città', 'Born in the city');
  else k = st10Origins(b)[0][0];
  st.orig[k] = (st.orig[k] || 0) + n; st.arr += n; if (or !== 'nati') st.arrF++; st10Roll(st); st.min[Math.floor(st.t / 60) - st.m0] += n;
}
function st10LeftReal(n) { const st = S && S.st10; if (st && st.real && !st.done) st.left += n; }
// arrivi minuto per minuto: gli ultimi 10 minuti (la lista scorre)
function st10Roll(st) { const m = Math.floor(st.t / 60); if (st.m0 == null) st.m0 = 0; while (m > st.m0 + 9) { st.min.shift(); st.min.push(0); st.m0++; } }
function st10Counts() {
  const c = { R: 0, M: 0, C: 0, O: 0, I: 0, svc: 0, km: 0, pop: stats.pop || 0, jobs: stats.jobs || 0 };
  for (const b of buildings.values()) { if (b.ruin) continue; const z = ZT[b.zone]; if (z) c[z.k]++; }
  c.svc = svcs.size;
  for (const s of segs.values()) if (!s.pre && RT[s.type] && !RT[s.type].rail) c.km += s.len || 0;
  c.km /= 1000; return c;
}
function st10Base() { st10.prev.clear(); for (const b of buildings.values()) if (b.hh) st10.prev.set(b, b.occ || 0); }
function st10Step(dt) {
  if (S !== st10.S) { // partita nuova o caricata
    st10.S = S; if (!S.st10) S.st10 = st10New(); if (S.st10.done) { S.st10.done = 0; S.st10.t = Math.max(S.st10.t, ST10_DUR); } st10Show(false); st10Link(true);
    st10Base(); st10.money = S.money; st10.bud = S.lastBudget; st10.loans = S.loans.length; st10.open && st10Draw();
    return;
  }
  const st = S.st10, run = !menuOpen && S.speed > 0;
  // soldi: il bilancio del mese conta per entrate e uscite intere, il resto (costruzioni, rimborsi, prestiti) per segno
  if (!st.done) {
    let d = S.money - st10.money;
    if (S.lastBudget && S.lastBudget !== st10.bud) { const bg = S.lastBudget; st.earned += bg.ti || 0; st.spent += bg.te || 0; d -= bg.net || 0; }
    if (S.loans.length > (st10.loans || 0) && d > 0) { const l = S.loans[S.loans.length - 1]; st.loans += l.amt; d -= l.amt; }
    if (d > 0) st.earned += d; else st.spent -= d;
  }
  st10.money = S.money; st10.bud = S.lastBudget; st10.loans = S.loans.length;
  if (run && !st.done) st.t += dt;
  // famiglie arrivate / andate via: confronto le case ogni mezzo secondo
  st10.tick += dt;
  if (!st.done && st10.tick > 0.5) {
    st10.tick = 0;
    const seen = new Set();
    if (!st.real) for (const b of buildings.values()) {
      if (!b.hh || b.ruin) continue; seen.add(b);
      const o = st10.prev.get(b) || 0, n = b.occ || 0;
      if (n > o) st10Add(b, n - o); else if (n < o) st.left += o - n;
      st10.prev.set(b, n);
    }
    if (!st.real) for (const [b, o] of st10.prev) if (!seen.has(b)) { st.left += o; st10.prev.delete(b); }
    if (false) { st.done = 1; st.t = ST10_DUR; st.snap = st10Counts(); st.days = (S.time - st.t0) / 24; toast(L('📊 Primi 10 minuti finiti: il riepilogo è nella rotellina in alto a destra', '📊 First 10 minutes over: the summary is in the dial at the top right'), 5000); }
  }
  st10.rotT += dt; if (st10.rotT > 3) { st10.rotT = 0; st10.rot++; }
}
// ---------- disegno ----------
(function () {
  const css = document.createElement('style');
  css.textContent = `#st10{position:fixed;top:6px;right:10px;display:flex;align-items:center;gap:6px;cursor:pointer;z-index:30;pointer-events:auto}
#st10 .tk{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:5px 10px;font-size:12.5px;width:200px;height:20px;line-height:20px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:right}
#st10 .tk span{display:inline-block;animation:st10in .45s ease-out}
@keyframes st10in{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
#st10 .bt{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:5px 10px;font-size:13px;font-weight:600;height:30px;box-sizing:border-box;display:flex;align-items:center;gap:5px;white-space:nowrap}
#st10 .bt:hover{border-color:#4aa3ff}
#st10.on .bt{border-color:#4aa3ff;background:rgba(74,163,255,.18)}
#st10.lkw .bt{border-color:#ffd23c;box-shadow:0 0 8px rgba(255,210,60,.6)}
#st10:not(.on) .tk,#st10:not(.on) svg{display:none}
#st10 svg{display:block;background:var(--panel);border-radius:50%;border:1px solid var(--line)}
#st10p{position:fixed;top:100px;right:10px;width:330px;max-height:calc(100vh - 160px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:13px;z-index:31;display:none}
#st10p h3{margin:0 0 6px;font-size:16px;display:flex;justify-content:space-between;align-items:center}
#st10p h4{margin:10px 0 4px;font-size:13px;opacity:.8}
#st10p .row{display:flex;justify-content:space-between;margin:2px 0}
#st10p .bar{height:6px;border-radius:3px;background:#4aa3ff;margin:1px 0 5px}
#st10p .mins{display:flex;align-items:flex-end;gap:3px;height:46px}
#st10p .mins div{flex:1;background:#5ec27a;border-radius:2px 2px 0 0;min-height:2px;position:relative}
#st10p .lk{background:rgba(255,210,60,.15);border:1px solid rgba(255,210,60,.5);border-radius:8px;padding:5px 8px;margin:4px 0;font-size:12.5px}
#st10p .ml{display:flex;gap:3px;font-size:10px;opacity:.7}#st10p .ml span{flex:1;text-align:center}
#hud #top{padding-right:150px}#hud.st10on #top{padding-right:370px}`;
  document.head.appendChild(css);
  const w = document.createElement('div'); w.id = 'st10';
  w.innerHTML = '<div class="tk" id="st10tk"></div><svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="4"/><circle id="st10ring" cx="20" cy="20" r="16" fill="none" stroke="#5ec27a" stroke-width="4" stroke-linecap="round" transform="rotate(-90 20 20)" stroke-dasharray="100.5" stroke-dashoffset="100.5"/><text id="st10txt" x="20" y="24.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">0\'</text></svg><div class="bt" id="st10bt"></div>';
  w.onclick = () => st10Show(!st10.open); // le statistiche si vedono solo dopo aver cliccato il pulsante; un altro clic le nasconde
  const p = document.createElement('div'); p.id = 'st10p';
  const hud = $('hud'); hud.appendChild(w); hud.appendChild(p);
})();
st10Show(false);
// apre/chiude le statistiche (rotellina, scritta che scorre e pannello); la strada gialla resta sempre visibile
function st10Show(on) {
  st10.open = on; const w = $('st10'); w.classList.toggle('on', on); $('hud').classList.toggle('st10on', on);
  $('st10bt').textContent = on ? '✕ ' + L('Chiudi', 'Close') : '📊 ' + L('Statistiche', 'Statistics');
  w.title = on ? L('Nascondi le statistiche', 'Hide the statistics') : L('Mostra le statistiche', 'Show the statistics');
  $('st10p').style.display = on ? 'block' : 'none';
  if (on && S && S.st10) { st10Wheel(); st10Draw(); }
}
const st10Time = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
function st10Ppl() { if (S && S.st10 && S.st10.real) return 1; return stats.hh > 0 && stats.pop > 0 ? stats.pop / stats.hh : 2.6; }
function st10Wheel() {
  const st = S.st10, f = Math.min(1, st.t / ST10_DUR);
  $('st10ring').setAttribute('stroke-dashoffset', (100.5 * (1 - f)).toFixed(1));
  $('st10ring').setAttribute('stroke', f >= 1 ? '#4aa3ff' : '#5ec27a');
  $('st10txt').textContent = Math.floor(st.t / 60) + '\'';
  const c = st.done ? st.snap : st10Counts(), ppl = st10Ppl();
  const top = Object.entries(st.orig).sort((a, b) => b[1] - a[1])[0];
  const items = [
    '⏱️ ' + L('Tempo di gioco ', 'Play time ') + st10Time(st.t),
    '👥 ' + L('Arrivati ', 'Arrived ') + fmtNum(st.arr * ppl) + L(' abitanti', ' residents'),
    top ? L('Da: ', 'From: ') + top[0] : '🛣️ ' + L('Nessun arrivo ancora', 'No arrivals yet'),
    '💸 ' + L('Spesi ', 'Spent ') + fmtMoney(st.spent),
    '💰 ' + L('Guadagnati ', 'Earned ') + fmtMoney(st.earned),
    `🏠 ${c.R}  🏪 ${c.C}  🏢 ${c.O}  🏭 ${c.I}`,
  ];
  const s = items[st10.rot % items.length], tk = $('st10tk');
  if (tk.dataset.s !== s) { tk.dataset.s = s; tk.innerHTML = '<span></span>'; tk.firstChild.textContent = s; }
}
function st10Draw() {
  if (!S || !S.st10) return;
  const st = S.st10, c = st.done ? st.snap : st10Counts(), ppl = st10Ppl();
  const row = (a, b) => `<div class="row"><span>${a}</span><b>${b}</b></div>`;
  const days = st.done ? st.days : (S.time - st.t0) / 24;
  let h = `<h3><span>📊 ${L('La tua città', 'Your city')}</span></h3>`;
  if (st10.lk.need) h += `<div class="lk">🟡 ${L('La strada evidenziata in giallo è quella da cui arrivano gli abitanti: collegala alla città con una strada.', 'The road highlighted in yellow is where residents arrive from: link it to the city with a road.')}</div>`;
  h += `<div style="opacity:.75;font-size:12px">${st.done ? L('Finiti: questi sono i numeri dei primi 10 minuti.', 'Done: these are the numbers of the first 10 minutes.') : L('Il tempo conta solo quando il gioco non è in pausa.', 'Time only counts while the game is not paused.')}</div>`;
  h += `<h4>⏱️ ${L('Tempo', 'Time')}</h4>` + row(L('Tempo di gioco', 'Play time'), st10Time(st.t)) + row(L('Tempo passato nella città', 'Time passed in the city'), Math.floor(days) + L(' giorni ', ' days ') + Math.floor((days % 1) * 24) + L(' ore', ' h'));
  h += `<h4>👥 ${L('Abitanti', 'Residents')}</h4>` + row(L('Arrivati in città', 'Moved in'), fmtNum(st.arr * ppl) + ` <span style="opacity:.6;font-weight:400">(${fmtNum(st.real ? st.arrF : st.arr)} ${L('famiglie', 'households')})</span>`) + row(L('Andati via', 'Moved out'), fmtNum(st.left * ppl)) + row(L('In città adesso', 'In the city now'), fmtNum(stats.pop || 0));
  h += `<h4>🧭 ${L('Da dove arrivano', 'Where they come from')}</h4>`;
  const og = Object.entries(st.orig).sort((a, b) => b[1] - a[1]);
  if (!og.length) h += `<div style="opacity:.7">${L('Ancora nessuno: servono strade collegate all\'autostrada, zone residenziali, acqua ed elettricità.', 'Nobody yet: you need roads linked to the highway, residential zones, water and power.')}</div>`;
  for (const [k, v] of og) { const pc = v / Math.max(1, st.arr); h += row(k, fmtNum(v * ppl) + ' · ' + Math.round(pc * 100) + '%') + `<div class="bar" style="width:${Math.max(2, pc * 100)}%"></div>`; }
  const mx = Math.max(1, ...st.min), m0 = st.m0 || 0;
  h += `<h4>📈 ${L('Arrivi minuto per minuto (ultimi 10)', 'Arrivals minute by minute (last 10)')}</h4><div class="mins">${st.min.map((v, i) => `<div title="${L('minuto', 'minute')} ${m0 + i + 1}: ${fmtNum(v * ppl)}" style="height:${v / mx * 100}%;${m0 + i === Math.floor(st.t / 60) ? 'background:#e8d040' : ''}"></div>`).join('')}</div><div class="ml">${st.min.map((_, i) => `<span>${m0 + i + 1}</span>`).join('')}</div>`;
  h += `<h4>💶 ${L('Soldi', 'Money')}</h4>` + (S.opts.unlimited ? `<div style="opacity:.7">${L('Partita con soldi illimitati: non si contano.', 'Unlimited money game: not counted.')}</div>` : row(L('Spesi', 'Spent'), `<span style="color:#ff8a7a">${fmtMoney(st.spent)}</span>`) + row(L('Guadagnati', 'Earned'), `<span style="color:#7ee08a">${fmtMoney(st.earned)}</span>`) + (st.loans ? row(L('Prestiti presi', 'Loans taken'), fmtMoney(st.loans)) : '') + row(L('Differenza', 'Difference'), fmtMoney(st.earned - st.spent)));
  h += `<h4>🏙️ ${L('Edifici', 'Buildings')}${st.done ? L(' (al minuto 10)', ' (at minute 10)') : ''}</h4>` + row('🏠 ' + L('Case', 'Homes'), c.R) + row('🏘️ ' + L('Misti (negozi + case)', 'Mixed (shops + homes)'), c.M) + row('🏪 ' + L('Negozi', 'Shops'), c.C) + row('🏢 ' + L('Uffici', 'Offices'), c.O) + row('🏭 ' + L('Industrie', 'Industries'), c.I) + row('🏛️ ' + L('Servizi pubblici', 'Public services'), c.svc) + row('🛣️ ' + L('Strade costruite', 'Roads built'), c.km.toFixed(1).replace('.', LANG === 'en' ? '.' : ',') + ' km') + row('💼 ' + L('Posti di lavoro', 'Jobs'), fmtNum(st.done ? c.jobs : stats.jobs || 0));
  $('st10p').innerHTML = h;
}
(function () {
  let last = performance.now(), drawT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (!S) return;
    st10Step(dt * (S.speed ? 1 : 0) || 0); // in pausa il tempo non conta
    drawT += dt; if (drawT > 0.5) { drawT = 0; $('st10').classList.toggle('lkw', !st10.open && st10.lk.need); if (st10.open) { st10Wheel(); st10Draw(); } $('st10p').style.right = $('side').classList.contains('hidden') ? '10px' : '360px'; }
    st10.lk.t += dt; if (st10.lk.t > 1) { st10.lk.t = 0; st10Link(); }
    if (st10.lk.mesh) st10.lk.mesh.material.opacity = 0.45 + 0.3 * Math.sin(now / 250);
  }
  requestAnimationFrame(loop);
})();

// ---------- strada da cui arrivano gli abitanti: evidenziata in giallo finché non è collegata alla città ----------
// è la strada già pronta che porta fuori dalla mappa (autostrada, rampe, viale): appena una tua strada la tocca, l'evidenziatura sparisce
function st10Link(force) {
  if (!S || S.picking) { st10LinkMesh(null); return; }
  const pre = []; for (const s of segs.values()) if (s.pre && RT[s.type] && !RT[s.type].rail) pre.push(s);
  const preN = new Set(); for (const s of pre) { preN.add(s.a); preN.add(s.b); }
  let linked = false;
  for (const s of segs.values()) if (!s.pre && RT[s.type] && !RT[s.type].rail && (preN.has(s.a) || preN.has(s.b))) { linked = true; break; }
  st10.lk.need = pre.length > 0 && !linked;
  const key = st10.lk.need ? pre.length + ':' + pre.reduce((a, s) => a + s.id, 0) : '';
  if (!force && key === st10.lk.key) return;
  st10.lk.key = key; st10LinkMesh(st10.lk.need ? pre : null);
}
function st10LinkMesh(pre) {
  const lk = st10.lk;
  if (lk.mesh) { scene.remove(lk.mesh); lk.mesh.geometry.dispose(); lk.mesh.material.dispose(); lk.mesh = null; }
  if (!pre) return;
  const p = [];
  for (const s of pre) {
    const w = (RT[s.type].w || 10) * 0.5 + 5, pts = s.pts; if (!pts || pts.length < 2) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / l * w, nz = (b.x - a.x) / l * w;
      const ya = Math.max(a.h ?? getH(a.x, a.z), WATER) + (a.y || 0) + 1.5, yb = Math.max(b.h ?? getH(b.x, b.z), WATER) + (b.y || 0) + 1.5;
      p.push(a.x - nx, ya, a.z - nz, a.x + nx, ya, a.z + nz, b.x + nx, yb, b.z + nz, a.x - nx, ya, a.z - nz, b.x + nx, yb, b.z + nz, b.x - nx, yb, b.z - nz);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  lk.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
  lk.mesh.renderOrder = 5; lk.mesh.frustumCulled = false; scene.add(lk.mesh);
}
