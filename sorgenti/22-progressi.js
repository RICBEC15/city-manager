// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 11: progressione e interfaccia
//  20 traguardi, albero a 1/2/4/8 punti, 44 trofei, viste nuove,
//  modalità foto e telecamera cinematografica, politiche nuove
// =====================================================================
// ---------- 20 traguardi (nomi nostri) ----------
MS.push(
  { pop: 170000, n: () => L('Area metropolitana', 'Metro area') }, { pop: 230000, n: () => L('Grande area metropolitana', 'Greater metro area') },
  { pop: 300000, n: () => L('Città regione', 'City region') }, { pop: 380000, n: () => L('Capitale regionale', 'Regional capital') },
  { pop: 470000, n: () => L('Città mondiale', 'World city') }, { pop: 570000, n: () => L('Megacittà', 'Megacity') },
  { pop: 680000, n: () => L('Faro del continente', 'Beacon of the continent') }, { pop: 800000, n: () => L('Città leggendaria', 'Legendary city') },
);
// ---------- albero di sviluppo: livelli da 1, 2, 4 e 8 punti ----------
const PT4 = c => c <= 1 ? 1 : c <= 2 ? 2 : c <= 6 ? 4 : 8;
for (const t of TREE) t.cost = PT4(t.cost);
for (const u of UPGRADES) u.cost = PT4(u.cost);

// ---------- politiche nuove ----------
POLICIES.push(
  { id: 'gated', n: () => L('Comunità recintata', 'Gated community'), d: () => L('Cancelli e guardiani nei quartieri ricchi: meno criminalità nelle case di livello 3 o più, ma un po\' meno felicità per gli altri', 'Gates and guards in rich areas: less crime in level 3+ homes, but a bit less happiness for others'), cost: 0.3 },
  { id: 'nocomb', n: () => L('Divieto dei motori a scoppio', 'Combustion engine ban'), d: () => L('Solo mezzi elettrici: niente smog da bus e taxi, strade meno rumorose. I negozi vendono un po\' meno.', 'Only electric vehicles: no smog from buses and taxis, quieter roads. Shops sell a bit less.'), cost: 0.4 },
  { id: 'hwfree', n: () => L('Autostrade senza limite di velocità', 'No highway speed limit'), d: () => L('+30% di velocità in autostrada, ma più incidenti e più rumore', '+30% highway speed, but more accidents and noise'), cost: 0 },
  { id: 'advpol', n: () => L('Gestione avanzata dell\'inquinamento', 'Advanced pollution management'), d: () => L('Filtri obbligatori: -25% inquinamento dell\'industria, ma le fabbriche rendono il 5% in meno', 'Mandatory filters: -25% industrial pollution, but factories earn 5% less'), cost: 0.2 },
);
const _updateBuilding11 = updateBuilding;
updateBuilding = function (b) {
  _updateBuilding11(b); if (b.ruin || !buildings.has(b.id)) return;
  if (S.policies.gated && b.hh) { if ((b.level || 1) >= 3) b.crime = Math.max(0, b.crime - 0.06); else b.happy = Math.max(0, b.happy - 0.05); }
};
const _gridHook11 = gridHook;
gridHook = function (airS, noiseS, filt) { _gridHook11(airS, noiseS, S.policies.nocomb ? 0 : filt); };
const _crashRisk11 = crashRisk;
crashRisk = function (e) { const r = _crashRisk11(e); return S.policies.hwfree && RT[e.seg.type].hw ? r * 1.6 : r; };
const _budgetNow11 = budgetNow;
budgetNow = function () {
  const bg = _budgetNow11(), inc = bg.inc, exp = bg.exp;
  if (S.policies.advpol) inc.ind = (inc.ind || 0) * 0.95;
  if (S.policies.nocomb) inc.com = (inc.com || 0) * 0.97;
  bg.ti = Object.keys(inc).reduce((a, k) => a + (typeof inc[k] === 'number' ? inc[k] : 0), 0);
  bg.te = ['import', 'services', 'roads', 'lines', 'loans', 'policies'].reduce((a, k) => a + (exp[k] || 0), 0); bg.net = bg.ti - bg.te;
  return bg;
};

// ---------- trofei: 38 normali + 6 speciali ----------
const cnt = k => (S.cnt || {})[k] || 0;
function cntAdd(k, n = 1) { S.cnt = S.cnt || {}; S.cnt[k] = (S.cnt[k] || 0) + n; }
const svT = f => [...svcs.values()].filter(s => s.on && f(s, SV[s.type]));
const lnK = k => lines.filter(l => l.kind === k && l.ok).length;
const RENEW = ['wind', 'windmill', 'windsmall', 'solar', 'hydro', 'geo', 'battery'];
const ACH = [
  ['road', '🛣️', 'Il primo nastro d\'asfalto', 'The first ribbon of asphalt', 'Costruisci la prima strada', 'Build your first road', () => [...segs.values()].some(s => !s.pre && !RT[s.type].hw)],
  ['pop1', '👪', 'Mille anime', 'A thousand souls', '1.000 abitanti', '1,000 citizens', () => stats.pop >= 1000],
  ['pop2', '🏘️', 'Diecimila voci', 'Ten thousand voices', '10.000 abitanti', '10,000 citizens', () => stats.pop >= 10000],
  ['pop3', '🏙️', 'Città vera', 'A real city', '50.000 abitanti', '50,000 citizens', () => stats.pop >= 50000],
  ['pop4', '🌆', 'Centomila', 'One hundred thousand', '100.000 abitanti', '100,000 citizens', () => stats.pop >= 100000],
  ['pop5', '🌃', 'Formicaio', 'Anthill', '250.000 abitanti', '250,000 citizens', () => stats.pop >= 250000],
  ['tree1', '🌳', 'Pollice verde', 'Green thumb', 'Pianta 100 alberi', 'Plant 100 trees', () => cnt('trees') >= 100],
  ['tree2', '🌲', 'Bosco fatto a mano', 'Hand-made forest', 'Pianta 1.000 alberi', 'Plant 1,000 trees', () => cnt('trees') >= 1000],
  ['tile1', '🗺️', 'Confini più larghi', 'Wider borders', 'Possiedi 20 caselle', 'Own 20 tiles', () => TILES.reduce((a, b) => a + b, 0) >= 20],
  ['tile2', '🧭', 'Padrone della valle', 'Master of the valley', 'Possiedi 150 caselle', 'Own 150 tiles', () => TILES.reduce((a, b) => a + b, 0) >= 150],
  ['line1', '🚏', 'Rete di linee', 'Line network', '10 linee di trasporto', '10 transit lines', () => lines.filter(l => l.ok).length >= 10],
  ['line2', '🚇', 'Ragnatela dei trasporti', 'Transit web', '50 linee di trasporto', '50 transit lines', () => lines.filter(l => l.ok).length >= 50],
  ['renew', '♻️', 'Solo sole, vento e acqua', 'Only sun, wind and water', 'Almeno 50 MW e solo centrali rinnovabili', 'At least 50 MW and only renewable plants', () => { const p = svT((s, d) => d.cat === 'power' && (d.p || d.bat)); return p.length > 0 && p.every(s => RENEW.includes(s.type)) && NET.cityPow.prod >= 50; }],
  ['happy', '😊', 'Città sorridente', 'Smiling city', 'Felicità all\'85% con 5.000 abitanti', '85% happiness with 5,000 citizens', () => stats.pop >= 5000 && stats.happy >= 85],
  ['rich', '💰', 'Forziere pieno', 'Full chest', '10 milioni in cassa (senza soldi infiniti)', '10 million in the bank (no unlimited money)', () => !S.opts.unlimited && S.money >= 1e7],
  ['debt', '🏦', 'Debiti pagati', 'Debts paid', 'Chiudi tutti i prestiti dopo averne preso uno', 'Pay off all loans after taking one', () => cnt('hadLoan') > 0 && !S.loans.length],
  ['edu', '🎓', 'Città di studiosi', 'City of scholars', 'Istruzione media al 70%', '70% average education', () => stats.pop >= 2000 && stats.eduAvg >= 0.7],
  ['transit', '🚌', 'Tutti sul bus', 'Everyone on the bus', '30% degli spostamenti coi mezzi pubblici', '30% of trips by public transport', () => stats.pop >= 3000 && (stats.transitShare || 0) >= 0.3],
  ['tour', '📸', 'Meta turistica', 'Tourist hotspot', '10.000 turisti al mese', '10,000 tourists a month', () => (stats.tourists || 0) >= 10000],
  ['ms10', '🏆', 'Metà strada', 'Halfway there', 'Raggiungi il traguardo 10', 'Reach milestone 10', () => S.ms >= 10],
  ['ms19', '👑', 'In cima', 'At the top', 'Raggiungi l\'ultimo traguardo', 'Reach the last milestone', () => S.ms >= MS.length - 1],
  ['sign', '⭐', 'Firme d\'autore', 'Signature style', '5 edifici firma', '5 signature buildings', () => svT((s, d) => d.cat === 'sign').length >= 5],
  ['parks', '🌷', 'Città giardino', 'Garden city', '20 parchi', '20 parks', () => svT((s, d) => d.cat === 'parks' && d.park).length >= 20],
  ['land', '🗽', 'Collezionista di monumenti', 'Landmark collector', '5 monumenti unici', '5 unique landmarks', () => svT((s, d) => d.cat === 'parks' && d.unique).length >= 5],
  ['safe', '🛡️', 'Strade tranquille', 'Quiet streets', 'Criminalità sotto il 5% con 10.000 abitanti', 'Crime below 5% with 10,000 citizens', () => stats.pop >= 10000 && stats.crime < 5],
  ['dist', '🧩', 'Città a quartieri', 'City of districts', 'Crea 5 quartieri', 'Create 5 districts', () => (S.districts || []).length >= 5],
  ['pol', '📜', 'Legislatore', 'Lawmaker', '5 politiche attive insieme', '5 policies active at once', () => Object.values(S.policies || {}).filter(Boolean).length >= 5],
  ['air', '✈️', 'Decollo', 'Take-off', 'Costruisci un aeroporto', 'Build an airport', () => svT(s => s.type === 'airport' || s.type === 'airport2').length > 0],
  ['port', '⚓', 'Porta sul mare', 'Gateway to the sea', 'Costruisci un porto merci', 'Build a cargo port', () => svT((s, d) => !!d.port).length > 0],
  ['metro', '🚇', 'Sotto la città', 'Under the city', 'Una linea della metropolitana', 'A metro line', () => lnK('metro') > 0],
  ['tram', '🚋', 'Ding ding', 'Ding ding', 'Una linea del tram', 'A tram line', () => lnK('tram') > 0],
  ['ferry', '⛴️', 'Traversata', 'Crossing', 'Una linea di traghetti', 'A ferry line', () => lnK('ferry') > 0],
  ['spec', '🌾', 'Terra generosa', 'Generous land', '4 tipi di industria specializzata', '4 kinds of specialised industry', () => new Set(svT((s, d) => d.cat === 'spec').map(s => s.type)).size >= 4],
  ['office', '💼', 'Distretto degli affari', 'Business district', '5.000 posti negli uffici', '5,000 office jobs', () => (stats.jobsO || 0) >= 5000],
  ['budget', '📈', 'Conti in ordine', 'Books in order', 'Guadagna 100.000 € in un mese', 'Earn €100,000 in a month', () => (S.lastBudget?.net || 0) >= 100000],
  ['plvl', '🎡', 'Parco da cinque stelle', 'Five-star park', 'Un\'area parco al livello 5', 'A park area at level 5', () => typeof parkLevel === 'function' && Object.values(S.parks || {}).some(p => parkLevel(p) >= 5)],
  ['research', '🔭', 'Mente curiosa', 'Curious mind', 'Tutti e 3 i centri di ricerca', 'All 3 research centres', () => ['radiotel', 'geocenter', 'accel'].every(t => svT(s => s.type === t).length)],
  ['follow', '👀', 'Osservatore', 'Observer', 'Segui 25 cittadini', 'Follow 25 citizens', () => cnt('follow') >= 25],
  // speciali
  ['x_dis', '🌪️', 'Siamo ancora qui', 'Still standing', 'Supera un disastro naturale', 'Survive a natural disaster', () => cnt('disasters') > 0, 1],
  ['x_night', '🌙', 'Città che non dorme', 'City that never sleeps', 'Una linea che gira solo di notte', 'A line that runs only at night', () => lines.some(l => l.ok && l.sched === 2), 1],
  ['x_clean', '🍃', 'Aria di montagna', 'Mountain air', '50.000 abitanti e aria pulita', '50,000 citizens and clean air', () => stats.pop >= 50000 && avgAir() < 2, 1],
  ['x_snow', '❄️', 'Spazzaneve', 'Snowplough', 'Neve alta ma strade pulite, con 5.000 abitanti', 'Deep snow but clear roads, with 5,000 citizens', () => stats.pop >= 5000 && WEATHER.snow > 0.5 && !WEATHER.snowRoad, 1],
  ['x_photo', '📷', 'Fotografo di città', 'City photographer', 'Scatta 10 foto', 'Take 10 photos', () => cnt('photos') >= 10, 1],
  ['x_cine', '🎬', 'Regista', 'Film director', 'Crea un percorso di telecamera con 5 punti', 'Make a camera path with 5 points', () => (S.cine || []).length >= 5, 1],
];
function avgAir() { let a = 0, n = 0; for (const b of buildings.values()) if (b.hh) { a += AIR[gIdx(b.x, b.z)]; n++; } return n ? a / n : 0; }
function checkAch() {
  if (typeof S === 'undefined' || !S) return; S.ach = S.ach || {};
  if (S.loans?.length) S.cnt = Object.assign(S.cnt || {}, { hadLoan: 1 });
  for (const a of ACH) { if (S.ach[a[0]]) continue; let ok = false; try { ok = a[6](); } catch (e) { ok = false; } if (!ok) continue;
    S.ach[a[0]] = Math.floor(S.time / 24) + 1; addXP(a[7] ? 800 : 400, L('trofeo', 'trophy')); toast(`${a[1]} ${L('Trofeo', 'Trophy')}: <b>${L(a[2], a[3])}</b>`, 4500); }
}
function achHTML() {
  S.ach = S.ach || {}; const done = ACH.filter(a => S.ach[a[0]]).length;
  let h = `<details><summary class="sec" style="cursor:pointer">🏅 ${L('Trofei', 'Trophies')} (${done}/${ACH.length})</summary>`;
  for (const a of ACH) { const ok = S.ach[a[0]], hid = a[7] && !ok; h += `<div class="row" style="${ok ? '' : 'opacity:.6'}"><span style="color:var(--fg)">${ok ? a[1] : '⬜'} ${hid ? '??? ' + L('(speciale)', '(special)') : L(a[2], a[3])}<br><small style="color:var(--mute)">${hid ? L('Trofeo segreto', 'Secret trophy') : L(a[4], a[5])}</small></span><span>${ok ? L('mese', 'month') + ' ' + ok : ''}</span></div>`; }
  return h + '</details>';
}
const _monthly11 = monthly;
monthly = function () { _monthly11(); checkAch(); };
const _plantTree11 = plantTree;
plantTree = function (x, z) { const r = _plantTree11(x, z); if (TOOL.kind === 'tree' && TOOL.sub === 'plant' && TOOL.painting && typeof S !== 'undefined' && S) cntAdd('trees'); return r; };
const _followCitizen11 = followCitizen;
followCitizen = function (...a) { _followCitizen11(...a); if (followVeh) cntAdd('follow'); };
const _logEvent11 = logEvent;
logEvent = function (t) { _logEvent11(t); cntAdd('disasters'); };

// ---------- viste nuove ----------
function INFO_EXTRA() { return [['trade', '🚢 ' + L('Collegamenti esterni', 'Outside connections')], ['wealth', '💰 ' + L('Ricchezza', 'Wealth')], ['net', '📶 ' + L('Telecomunicazioni', 'Telecom')], ['tour', '🧳 ' + L('Turismo', 'Tourism')], ['wflow', '🚰 ' + L('Flusso dell\'acqua', 'Water flow')]]; }
const EXTRA_MODES = ['trade', 'wealth', 'net', 'tour', 'wflow'];
const _renderInfo11 = renderInfo;
renderInfo = function () {
  const was = infoDirty; _renderInfo11();
  const m = INFO.mode; if (!was || !EXTRA_MODES.includes(m)) return;
  const tint = (b, v) => { if (v < 0) { tintParts(b, 0xd8d8d8); return; } const c = ramp(v); tintParts(b, (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2])); };
  if (m === 'wealth' || m === 'net' || m === 'tour' || m === 'trade') {
    for (const b of buildings.values()) {
      const k = ZT[b.zone].k; let v = -1;
      if (m === 'wealth') v = b.hh ? 1 - clamp((b.edu || 0) * 0.55 + ((b.level || 1) - 1) / 4 * 0.3 + LV[gIdx(b.x, b.z)] / 300, 0, 1) : -1;
      else if (m === 'net') v = 1 - clamp(b.cov?.net || 0, 0, 1);
      else if (m === 'tour') v = (k === 'C' || k === 'M') ? (b.nearAttr ? 0 : 0.7) : -1;
      else if (m === 'trade') v = k === 'I' ? 0.1 : (k === 'C' || k === 'M') ? 0.55 : -1;
      tint(b, v);
    }
    INFO.tinted = true;
  }
  // strade colorate: collegamenti con l'esterno o rete dell'acqua
  if (m === 'trade' || m === 'wflow') {
    terrU.uOvAmt.value = 0;
    const p = [], col = [];
    for (const s of segs.values()) {
      const rt = RT[s.type]; if (rt.ped) continue; let c = null;
      if (m === 'trade') { const out = nodes.get(s.a)?.outside || nodes.get(s.b)?.outside; c = out ? [0.2, 0.5, 0.95] : rt.hw ? [0.35, 0.7, 0.95] : rt.rail ? [0.75, 0.5, 0.95] : null; }
      else { if (rt.rail) continue; const n = s.net; c = !n || (!n.wP && !n.out) ? [0.55, 0.55, 0.6] : n.wR < 0.95 && !n.out ? [0.9, 0.25, 0.2] : n.sR < 0.95 && !n.out ? [0.95, 0.6, 0.15] : [0.2, 0.55, 0.95]; }
      if (!c) continue; const hw = rt.w * 0.42;
      for (let i = 0; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw; const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]]; for (const t of [0, 1, 2, 0, 2, 3]) { p.push(...q[t]); col.push(...c); } }
    }
    if (trafficOv) { scene.remove(trafficOv); trafficOv.geometry.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
  }
  if (m === 'tour' || m === 'net') { // cerchi intorno ad attrazioni o antenne
    ovData.fill(0); ovWindow(); const OX = OVR[0], OZ = OVR[1], OS = OVR[2] / OVN;
    for (const sv of svcs.values()) {
      const d = SV[sv.type]; if (!sv.on) continue;
      const r = m === 'tour' ? (d.attr ? 200 + d.attr * 40 : 0) : (d.eff === 'net' || sv.type === 'server' ? d.r : 0); if (!r) continue;
      const ci = (sv.x - OX) / OS, cj = (sv.z - OZ) / OS, rr = r / OS;
      for (let j = Math.floor(cj - rr); j <= cj + rr; j++) for (let i = Math.floor(ci - rr); i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= OVN || j >= OVN) continue; const dd = Math.hypot(i - ci, j - cj) / rr; if (dd > 1) continue; const k = (j * OVN + i) * 4; ovData[k] = m === 'tour' ? 240 : 80; ovData[k + 1] = m === 'tour' ? 170 : 150; ovData[k + 2] = m === 'tour' ? 60 : 240; ovData[k + 3] = Math.max(ovData[k + 3], (1 - dd) * 150 + 40); }
    }
    ovTex.needsUpdate = true; terrU.uOvAmt.value = 0.75;
  }
};
const _showInfo11 = showInfo;
showInfo = function (mode, temp) {
  _showInfo11(mode, temp);
  if (!S || !EXTRA_MODES.includes(mode)) return; const lg = $('legend'), name = (INFOMODES().find(x => x[0] === mode) || [, ''])[1];
  const R = stats.raw || {}; let ex = 0, im = 0; for (const k in R) { if (R[k].p > R[k].n) ex += R[k].p - R[k].n; else im += R[k].n - R[k].p; }
  const leg = {
    trade: `🟦 ${L('strade verso fuori città e autostrade', 'roads to the outside and highways')} 🟪 ${L('ferrovie', 'railways')} · ${L('edifici', 'buildings')}: 🟩 ${L('industria (esporta)', 'industry (exports)')} 🟨 ${L('negozi (importano)', 'shops (import)')}<div style="font-size:12px">${L('Materie prime: vendute fuori', 'Raw materials: sold outside')} ${fmtNum(Math.round(ex))} t · ${L('comprate fuori', 'bought outside')} ${fmtNum(Math.round(im))} t · ${L('turisti', 'tourists')} ${fmtNum(stats.tourists || 0)}</div>`,
    wealth: `🟩 ${L('famiglie ricche', 'wealthy households')} 🟥 ${L('famiglie povere', 'poor households')}`,
    net: `🟦 ${L('copertura di antenne e server', 'antenna and server coverage')} · 🟩 ${L('internet buono', 'good internet')} 🟥 ${L('internet scarso', 'poor internet')}`,
    tour: `🟧 ${L('zona delle attrazioni', 'attraction area')} · 🟩 ${L('negozi vicini ai turisti', 'shops near tourists')} · ${L('turisti al mese', 'tourists per month')} ${fmtNum(stats.tourists || 0)} · ${L('attrattività', 'attractiveness')} ${Math.round(stats.attr || 0)}`,
    wflow: `🟦 ${L('acqua e fogne ok', 'water and sewage ok')} 🟥 ${L('manca acqua', 'not enough water')} 🟧 ${L('fogne piene', 'sewage full')} ⬜ ${L('nessuna rete', 'no network')} · ${L('acqua', 'water')} ${fmtNum(Math.round(NET.cityWat.use))}/${fmtNum(Math.round(NET.cityWat.prod))}`,
  }[mode];
  lg.innerHTML = `<b>${name}</b> ${leg}`;
};

// ---------- modalità foto e telecamera cinematografica ----------
const PHOTO = { on: false, hidden: [], play: null };
function photoMode(on) {
  if (on === PHOTO.on) return; PHOTO.on = on;
  if (on) {
    PHOTO.hidden = []; for (const el of document.body.children) { if (el === renderer.domElement || el.id === 'photoPan' || el.tagName === 'SCRIPT' || el.contains(renderer.domElement)) continue; PHOTO.hidden.push([el, el.style.display]); el.style.display = 'none'; }
    let p = $('photoPan'); if (!p) { p = document.createElement('div'); p.id = 'photoPan'; p.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:50;background:rgba(15,20,30,.78);color:#fff;border-radius:12px;padding:8px 10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font:13px system-ui,sans-serif;max-width:calc(100vw - 32px)'; document.body.appendChild(p); }
    p.style.display = 'flex'; photoPanel();
  } else { for (const [el, d] of PHOTO.hidden) el.style.display = d; PHOTO.hidden = []; const p = $('photoPan'); if (p) p.style.display = 'none'; PHOTO.play = null; }
}
function photoPanel() {
  const p = $('photoPan'); if (!p) return; S.cine = S.cine || [];
  const b = (act, t) => `<button onclick="${act}" style="padding:5px 9px;border-radius:8px;border:0;background:#2c3a52;color:#fff;cursor:pointer">${t}</button>`;
  p.innerHTML = `<b>📷 ${L('Foto', 'Photo')}</b>` + b('photoShot()', '📸 ' + L('Scatta', 'Shoot')) + `<span style="margin-left:6px">🎬 ${L('Telecamera', 'Camera')} (${S.cine.length} ${L('punti', 'points')})</span>` + b('cineAdd()', '➕ ' + L('Punto', 'Point')) + b('cinePlay()', PHOTO.play ? '⏹️ ' + L('Ferma', 'Stop') : '▶️ ' + L('Riproduci', 'Play')) + b('S.cine=[];photoPanel()', '🗑️') +
    `<label>${L('Durata', 'Length')} <select onchange="S.cineT=+this.value">${[10, 20, 40, 60].map(v => `<option ${(S.cineT || 20) === v ? 'selected' : ''} value="${v}">${v} s</option>`).join('')}</select></label>` + b('photoMode(false)', '✖ ' + L('Esci (P)', 'Exit (P)'));
}
function photoShot() {
  renderer.render(scene, camera);
  const fn = (S.name || 'citta').replace(/[^\w]+/g, '_') + '_' + Math.floor(S.time / 24) + '.png';
  renderer.domElement.toBlob(async blob => {
    if (!blob) return;
    // dentro claude.ai si salva con la finestra di conferma; aperto dal PC basta un link
    const dl = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
    if (dl) { try { await dl.save({ filename: fn, data: blob }); } catch (e) { if (e?.code !== 'declined') toast(L('Non riesco a salvare la foto qui', 'Cannot save the photo here'), 2500); } return; }
    try { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); } catch (e) { console.warn(e); }
  }, 'image/png');
  cntAdd('photos'); checkAch();
  const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:.7;z-index:60;pointer-events:none;transition:opacity .4s'; document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = 0; setTimeout(() => f.remove(), 450); });
}
function cineAdd() { S.cine = S.cine || []; S.cine.push([cam.tx, cam.tz, cam.dist, cam.yaw, cam.pitch]); if (S.cine.length > 30) S.cine.shift(); photoPanel(); checkAch(); }
function cinePlay() {
  if (PHOTO.play) { PHOTO.play = null; photoPanel(); return; }
  const K = S.cine || []; if (K.length < 2) { toast(L('Servono almeno 2 punti: muovi la telecamera e premi "Punto"', 'You need at least 2 points: move the camera and press "Point"'), 3000); return; }
  followVeh = null; PHOTO.play = { t0: performance.now(), T: (S.cineT || 20) * 1000 }; photoPanel();
  const step = () => {
    if (!PHOTO.play) return; const u = (performance.now() - PHOTO.play.t0) / PHOTO.play.T; if (u >= 1) { PHOTO.play = null; photoPanel(); return; }
    const f = u * (K.length - 1), i = Math.min(K.length - 2, Math.floor(f)), t = f - i, s = t * t * (3 - 2 * t), a = K[i], b = K[i + 1];
    let dy = b[3] - a[3]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    cam.tx = lerp(a[0], b[0], s); cam.tz = lerp(a[1], b[1], s); cam.dist = lerp(a[2], b[2], s); cam.yaw = a[3] + dy * s; cam.pitch = lerp(a[4], b[4], s); cam.vx = cam.vz = 0;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const _rightClick11 = rightClick;
rightClick = function (id) { if (id === 'photo') photoMode(true); else _rightClick11(id); };
addEventListener('keydown', e => { if (e.code !== 'KeyP' || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return; if (typeof menuOpen !== 'undefined' && menuOpen) return; if (typeof S === 'undefined' || !S) return; photoMode(!PHOTO.on); });
