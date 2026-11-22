// =====================================================================
//  Novità dal wiki - Blocco 5: cittadini
// =====================================================================
const CIT = { crimes: [], arrestN: 0, escN: 0 };
const hasSvc = t => [...svcs.values()].some(s => s.on && s.type === t);
// ---------- età, salari, condizioni: calcolati una volta al mese ----------
function citizensMonth() {
  const a = stats.ages || [0.2, 0.15, 0.5, 0.15], pop = stats.pop || 0;
  // ragazzi: studiano se il reddito futuro da laureati conviene e c'è il liceo
  const hs = hasSvc('high') ? 1 : 0, gain = wageOf(1) - wageOf(0.25);
  stats.teenStudy = clamp(0.35 + gain / 4000 + hs * 0.25 - (stats.unemp || 0) * 0.5, 0.1, 0.95);
  // salari e tasse sul reddito (sopra 1.400)
  let wS = 0, wN = 0, tax = 0;
  for (const b of buildings.values()) if (b.hh && b.occ && !b.ruin) { const w = wageOf(b.edu || 0); wS += w * b.occ; wN += b.occ; tax += Math.max(0, w - 1400) * 0.1 * b.occ; }
  stats.wageAvg = wN ? Math.round(wS / wN) : 0; stats.incomeTax = Math.round(tax);
  stats.commWage = Math.round((stats.wageAvg || 1600) * 1.1);
  // assegni pagati dallo Stato (non dal comune)
  stats.allow = { fam: Math.round(pop * a[0] * 40), pens: Math.round(pop * a[3] * 900), unemp: Math.round(pop * a[2] * (stats.unemp || 0) * 1200 / 3) };
  // condizioni dei cittadini
  const hc = (() => { let s = 0, n = 0; for (const b of buildings.values()) if (b.hh && b.cov) { s += Math.min(1, b.cov.health || 0); n++; } return n ? s / n : 0; })();
  let unhappy = 0, trapped = 0, danger = 0;
  for (const b of buildings.values()) { if (!b.hh || !b.occ) continue; if (b.happy < 30) unhappy += b.occ * 2.6; if (b.fire) trapped += b.occ * 0.3; }
  for (const f of forestFires) bldNear(f.x, f.z, f.r + 300, b => { if (b.hh) danger += b.occ * 2.6; });
  if (typeof tornados !== 'undefined') for (const t of tornados) bldNear(t.x, t.z, 600, b => { if (b.hh) danger += b.occ * 2.6; });
  stats.cond = { sick: stats.sick || 0, injured: Math.round(stats.injured || 0), weak: Math.round(pop * a[3] * 0.25 * (1 - hc)), unhappy: Math.round(unhappy), danger: Math.round(danger), trapped: Math.round(trapped), evac: Math.round(stats.evacM || 0) };
  stats.injured = (stats.injured || 0) * 0.5; stats.evacM = 0;
  // gite fuori città e studenti
  stats.away = Math.round(pop * 0.015 * (seasonInfo().summer ? 2.5 : 1));
  const uni = hasSvc('uni') || hasSvc('college');
  stats.studOut = uni ? Math.round(pop * a[1] * 0.04) : Math.round(pop * a[1] * 0.25);
  stats.studIn = uni ? Math.round(pop * a[1] * 0.12) : 0;
  stats.arrestM = CIT.arrestN; stats.escM = CIT.escN; CIT.arrestN = 0; CIT.escN = 0;
  // celle -> prigione (o fuori città)
  S.jail = S.jail || 0; S.prisoners = S.prisoners || 0;
  const pcap = [...svcs.values()].filter(s => s.on && s.type === 'prison').length * 2000;
  const move = Math.round(S.jail * 0.7); S.jail -= move;
  if (pcap) S.prisoners = Math.min(pcap, S.prisoners + move); // senza prigione vanno fuori città
  S.prisoners = Math.round(S.prisoners * (S.policies.rehab ? 0.85 : 0.93));
}
const _monthly5 = monthly;
monthly = function () { _monthly5(); citizensMonth(); };
// ---------- ogni edificio: anziani più fragili, ragazzi che studiano, politica rilascio con istruzione ----------
const _updateBuilding5 = updateBuilding;
updateBuilding = function (b) {
  _updateBuilding5(b);
  if (!buildings.has(b.id) || b.ruin || !b.hh || !b.occ) return;
  const a = stats.ages || [0.2, 0.15, 0.5, 0.15];
  if (rand() < 0.004 * a[3]) b.sick++;
  if (b.cov && (b.cov.edu2 || 0) > 0.2) b.edu = Math.min(1, (b.edu || 0) + 0.0003 * (stats.teenStudy || 0.5) * a[1] * 4);
  if (S.policies.rehab && hasSvc('prison')) b.crime = Math.max(0, b.crime - 0.03);
};
POLICIES.push({ id: 'rehab', n: () => L('Rilascio con istruzione', 'Educational release'), d: () => L('I detenuti studiano: escono prima e tornano meno a delinquere (serve la prigione)', 'Inmates study: released sooner, less repeat crime (needs a prison)'), cost: 0.2 });
// ---------- criminalità vera: allarme, auto della polizia, arresto o fuga ----------
const _hourly5 = hourly;
hourly = function () {
  _hourly5();
  if (CIT.crimes.length > 6) return;
  const cand = lists.res.concat(lists.com).filter(b => b.crime > 35);
  if (!cand.length || rand() > Math.min(0.9, cand.length / 30)) return;
  const b = pick(cand); if (b.seg == null) return;
  const ev = { b: b.id, t0: simClock, x: b.x, z: b.z, done: false };
  CIT.crimes.push(ev);
  b.happy = Math.max(0, b.happy - 8); // la vittima perde benessere
  let best = null, bd = 1e18; for (const s of svcs.values()) if (s.on && (s.type === 'police' || s.type === 'policehq') && s.seg != null) { const d = (s.x - b.x) ** 2 + (s.z - b.z) ** 2; if (d < bd) { bd = d; best = s; } }
  if (!best) return;
  dispatch(best, 'police', b, () => { if (ev.done) return; ev.done = true; if (simClock - ev.t0 < 90) { CIT.arrestN++; S.jail = (S.jail || 0) + 1; b.crime = Math.max(0, b.crime - 10); } else CIT.escN++; });
};
const _updateDisasters5 = updateDisasters;
updateDisasters = function (dt) { _updateDisasters5(dt); for (let i = CIT.crimes.length - 1; i >= 0; i--) { const e = CIT.crimes[i]; if (!e.done && simClock - e.t0 > 90) { e.done = true; CIT.escN++; } if (e.done) CIT.crimes.splice(i, 1); } drawCrimeAlarms(); };
const alarmPool = new InstPool(new THREE.SphereGeometry(2.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a2a }), 16);
function drawCrimeAlarms() { let n = 0; const on = Math.floor(simClock * 3) % 2; for (const e of CIT.crimes) { if (e.done || n >= 16) continue; const y = getH(e.x, e.z) + 22; setInst(alarmPool.mesh, n, e.x, y, e.z, 0, on ? 1 : 0.4, on ? 1 : 0.4, on ? 1 : 0.4); n++; } alarmPool.mesh.count = n; alarmPool.dirty(); }
// ---------- animali domestici (solo per bellezza): cani al guinzaglio dei pedoni ----------
const petPool = new InstPool(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 200);
const PET_COLS = [0x8a5a2a, 0x222222, 0xd8c8a8, 0xb07a3a, 0xf0f0f0];
const _updatePeds5 = updatePeds;
updatePeds = function (dt) {
  _updatePeds5(dt);
  let n = 0;
  for (let i = 0; i < peds.length && n < petPool.max; i += 6) {
    const p = peds[i], s = segs.get(p.seg); if (!s) continue;
    const f = segFrame(s, clamp(p.a - p.dir * 1.4, 0, s.len)), off = RT[s.type].w / 2 - 1.5;
    setInst(petPool.mesh, n, f.x + f.nx * off * p.side, f.y + 0.15, f.z + f.nz * off * p.side, Math.atan2(f.tx * p.dir, f.tz * p.dir), 0.3, 0.45, 0.8); _c.setHex(PET_COLS[i % PET_COLS.length]); setInstCol(petPool.mesh, n, _c.r, _c.g, _c.b); n++;
  }
  petPool.mesh.count = n; petPool.dirty();
};
// ---------- diario della vita del cittadino seguito ----------
function diaryHTML(c) {
  const r = mulberry32(c.name.length * 131 + c.age * 7), ev = [], y0 = Math.floor(S.time / 24 / 12) + 1;
  const add = (yearsAgo, t) => ev.push({ y: yearsAgo, t });
  if (c.age >= 19) add(Math.min(c.age - 18, 3 + Math.floor(r() * 8)), c.age > 23 && r() < 0.5 ? '🎓 ' + L('Laurea', 'Graduated from university') : '🎓 ' + L('Diploma', 'Finished high school'));
  if (c.age >= 26 && r() < 0.6) add(Math.floor(r() * Math.min(15, c.age - 25)), '💍 ' + L('Si è sposato', 'Got married'));
  if (c.age >= 19 && c.age <= 67) add(Math.floor(r() * 3), '💼 ' + L('Nuovo lavoro', 'New job') + ': ' + c.job);
  add(Math.floor(r() * 4), '🏠 ' + L('Si è trasferito in ', 'Moved to ') + c.addr);
  if (r() < 0.5) add(0, '✈️ ' + L('Gita fuori città con la famiglia', 'Trip out of town with the family'));
  const msgs = [L('Adoro il nuovo parco vicino a casa!', 'I love the new park near home!'), L('Il traffico stamattina era terribile.', 'Traffic this morning was awful.'), L('Finalmente il bus passa anche da noi.', 'The bus finally comes our way.'), L('Il mio cane ha conosciuto tutto il quartiere.', 'My dog has met the whole neighbourhood.'), L('L\'affitto è salito di nuovo...', 'Rent went up again...')];
  add(0, '💬 "' + msgs[Math.floor(r() * msgs.length)] + '"');
  ev.sort((a, b) => b.y - a.y);
  return `<div class="sec">📔 ${L('Diario', 'Life diary')}</div>` + ev.map(e => `<div style="font-size:12px">${e.y ? e.y + ' ' + L(e.y === 1 ? 'anno fa' : 'anni fa', e.y === 1 ? 'year ago' : 'years ago') : L('Quest\'anno', 'This year')}: ${e.t}</div>`).join('');
}
// ---------- tempo libero e meteo, giovani che escono di casa, turisti ----------
const badWeather = () => WEATHER.kind === 'rain' || WEATHER.kind === 'storm' || WEATHER.kind === 'snow' || WEATHER.temp < 5;
const _computeCoverage5 = computeCoverage;
computeCoverage = function () { _computeCoverage5(); const f = badWeather() ? 0.75 : WEATHER.kind === 'clear' && WEATHER.temp > 15 ? 1.1 : 1; if (f !== 1) for (const b of buildings.values()) if (b.cov) b.cov.park = (b.cov.park || 0) * f; };
const _computeDemand5 = computeDemand;
computeDemand = function () {
  _computeDemand5();
  const d = stats.demand; if (!d.why) return;
  if (d.why.C && badWeather()) { d.why.C.push([L('Brutto tempo: tutti nei negozi e nei locali', 'Bad weather: everyone in shops and bars'), 6]); d.C = clamp(d.C + 6, 0, 100); }
  if (d.why.R) { let s = 0, n = 0; for (const b of buildings.values()) if (b.rentR) { s += b.rentR; n++; } const avg = n ? s / n : 0.8; const v = avg < 0.9 ? 6 : -4; d.why.R.push([avg < 0.9 ? L('Giovani che possono permettersi di uscire di casa', 'Young adults who can afford to move out') : L('Giovani che restano coi genitori (affitti alti)', 'Young adults staying with parents (high rent)'), v]); d.R = clamp(d.R + v, 0, 100); }
};
const _computeStats5 = computeStats;
computeStats = function () {
  _computeStats5();
  // turisti: stagione, meteo, alberghi e distanza delle attrazioni dagli ingressi
  const se = seasonInfo(), sf = se.summer ? 1.2 : se.winter ? 0.8 : 1, wf = badWeather() ? 0.85 : 1;
  let hotels = 0; if ((stats.attr || 0) > 30) for (const b of buildings.values()) if (ZT[b.zone].k === 'C' && b.id % 6 === 0 && !b.ruin) hotels++;
  stats.hotels = hotels;
  const outs = typeof outsideNodes === 'function' ? outsideNodes() : [];
  let df = 1; if (outs.length) { let s = 0, n = 0; for (const sv of svcs.values()) if (sv.on && SV[sv.type].attr) { let m = 1e9; for (const o of outs) m = Math.min(m, Math.hypot(o.x - sv.x, o.z - sv.z)); s += m; n++; } if (n) df = clamp(1.15 - s / n / 20000, 0.7, 1.1); }
  stats.tourists = Math.round((stats.tourists || 0) * sf * wf * df * (0.85 + Math.min(0.3, hotels * 0.01)));
};
// ---------- pannello Cittadini (nelle statistiche) ----------
function citizensHTML() {
  const a = stats.ages || [0, 0, 0, 0], p = stats.pop || 0, c = stats.cond || {}, al = stats.allow || {};
  const r = (k, v) => `<div class="row"><span>${k}</span><span>${v}</span></div>`;
  return `<details style="margin-bottom:6px"><summary><b>👥 ${L('Cittadini', 'Citizens')}</b></summary>` +
    r('🧒 ' + L('Bambini (a scuola)', 'Children (at school)'), fmtNum(Math.round(p * a[0]))) + r('🧑 ' + L('Ragazzi', 'Teens'), fmtNum(Math.round(p * a[1])) + ' · ' + Math.round((stats.teenStudy || 0.5) * 100) + '% ' + L('studia', 'study')) + r('🧔 ' + L('Adulti', 'Adults'), fmtNum(Math.round(p * a[2]))) + r('👴 ' + L('Anziani', 'Seniors'), fmtNum(Math.round(p * a[3]))) +
    `<div class="sec">💶 ${L('Stipendi', 'Wages')}</div>` + r(L('Stipendio medio', 'Average wage'), fmtMoney(stats.wageAvg || 0) + ' (1.500 → 2.700)') + r(L('Tassa sul reddito (sopra 1.400)', 'Income tax (above 1,400)'), fmtMoney(stats.incomeTax || 0)) + r(L('Pendolari da fuori (stipendio ×1,1, non tassati)', 'Commuters from outside (wage ×1.1, untaxed)'), fmtNum(Math.round(stats.commuters || 0))) +
    r(L('Assegni familiari, pensioni, disoccupazione (paga lo Stato)', 'Family, pension, unemployment benefits (paid by the state)'), fmtMoney((al.fam || 0) + (al.pens || 0) + (al.unemp || 0))) +
    `<div class="sec">🩺 ${L('Condizioni', 'Conditions')}</div>` + r('🤒 ' + L('Malati', 'Sick'), fmtNum(c.sick || 0)) + r('🩹 ' + L('Feriti', 'Injured'), fmtNum(c.injured || 0)) + r('🧓 ' + L('Deboli (poca salute)', 'Weak (poor health)'), fmtNum(c.weak || 0)) + r('😠 ' + L('Scontenti (rischio criminalità)', 'Unhappy (crime risk)'), fmtNum(c.unhappy || 0)) + r('⚠️ ' + L('In pericolo', 'In danger'), fmtNum(c.danger || 0)) + r('🔥 ' + L('Intrappolati', 'Trapped'), fmtNum(c.trapped || 0)) + r('🚌 ' + L('Evacuati', 'Evacuated'), fmtNum(c.evac || 0)) + r('🏕️ ' + L('Senzatetto', 'Homeless'), fmtNum(Math.round(S.homeless || 0))) +
    `<div class="sec">🚓 ${L('Criminalità', 'Crime')}</div>` + r(L('Arresti l\'ultimo mese', 'Arrests last month'), fmtNum(stats.arrestM || 0)) + r(L('Criminali fuggiti', 'Criminals escaped'), fmtNum(stats.escM || 0)) + r(L('In cella / in prigione', 'In cells / in prison'), fmtNum(S.jail || 0) + ' / ' + fmtNum(S.prisoners || 0)) +
    `<div class="sec">✈️ ${L('Viaggi', 'Travel')}</div>` + r(L('In gita fuori città', 'On trips out of town'), fmtNum(stats.away || 0)) + r(L('Studenti che vanno a studiare fuori', 'Students studying elsewhere'), fmtNum(stats.studOut || 0)) + r(L('Studenti che vengono da fuori', 'Students from elsewhere'), fmtNum(stats.studIn || 0)) + r('🏨 ' + L('Alberghi', 'Hotels'), fmtNum(stats.hotels || 0)) +
    '</details>';
}
// gli evacuati contano nelle condizioni
const _evacuate5 = evacuate;
evacuate = function (x, z) { _evacuate5(x, z); let n = 0; bldNear(x, z, 2000, b => { if (b.hh) n += b.occ * 2.6; }); if ([...svcs.values()].some(s => s.on && SV[s.type].shel)) stats.evacM = (stats.evacM || 0) + Math.round(n * 0.5); };
