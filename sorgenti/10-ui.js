// =====================================================================
//  Interfaccia: barra in alto, strumenti, pannelli, viste a colori
// =====================================================================
const $ = id => document.getElementById(id);
const SET = Object.assign({ tempF: false, h12: false, ui: 1, lang: 'it', sens: 5, invert: false, shadows: false, traffic: 1600, trees: 1, quality: 1, autosave: true, fps: true, autoQ: true }, (() => { try { return JSON.parse(lsGet('settings')) || {}; } catch (e) { return {}; } })());
LANG = SET.lang;
let autosaveOn = SET.autosave;
function saveSettings() { lsSet('settings', JSON.stringify(SET)); }
let toastT = 0;
function toast(t, ms = 2500) { const el = $('toast'); el.innerHTML = t; el.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => el.style.display = 'none', ms); }
function tipShow(t) { const el = $('tip'); el.innerHTML = t; el.style.display = 'block'; el.style.left = (mouse.x + 16) + 'px'; el.style.top = (mouse.y + 18) + 'px'; }
function tipHide() { $('tip').style.display = 'none'; }
let lastSpeed = 1;
function setSpeed(v) { if (v) lastSpeed = v; S.speed = v; hudSpeed(); }
function hudSpeed() { $('cSpeed').innerHTML = [0, 1, 2, 3].map(v => `<button class="${S.speed === v ? 'on' : ''}" onclick="setSpeed(${v})" title="${v ? v + 'x' : L('Pausa', 'Pause')}">${v ? '▶'.repeat(v) : '⏸'}</button>`).join(''); }
const SPEEDMUL = [0, 1, 2.5, 5];
function updateHUD() {
  if (!S) return;
  const bg = S.lastBudget || budgetNow();
  $('cityName').textContent = S.name;
  $('cMoney').innerHTML = `💰 <b>${S.opts.unlimited ? '∞' : fmtMoney(S.money)}</b> <small style="color:${bg.net >= 0 ? 'var(--good)' : 'var(--bad)'}">${bg.net >= 0 ? '▲ +' : '▼ '}${fmtMoney(bg.net)}/${L('mese', 'mo')}</small>`;
  { const pp = S.hist?.length ? S.hist[S.hist.length - 1].pop ?? stats.pop : stats.pop; $('cPop').innerHTML = `👥 <b>${fmtNum(stats.pop)}</b> <small style="color:${stats.pop >= pp ? 'var(--good)' : 'var(--bad)'}">${stats.pop > pp ? '▲' : stats.pop < pp ? '▼' : ''}</small>`; }
  const d = Math.floor(S.time / 24), h = S.time % 24;
  $('cDate').innerHTML = `📅 ${MONTHS()[d % 12]} ${L('anno', 'year')} ${Math.floor(d / 12) + 1} · <b>${SET.h12 ? ((Math.floor(h) + 11) % 12 + 1) + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0') + (h < 12 ? ' am' : ' pm') : String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0')}</b>`;
  $('cWeather').innerHTML = `${weatherIcon()} ${SET.tempF ? Math.round(WEATHER.temp * 9 / 5 + 32) + '°F' : Math.round(WEATHER.temp) + '°C'} <small>${seasonInfo().name}</small>`;
  $('cWeather').title = weatherName() + ' · ' + L('vento', 'wind') + ' ' + Math.round(WEATHER.wind * 60) + ' km/h' + ' · ' + L('clima', 'climate') + ' ' + CLIM[climOf()].n().split(' (')[0].toLowerCase() + (S.opts?.south ? ' · ' + L('emisfero sud', 'southern hemisphere') : '') + (tempPowMul() > 1.05 ? ' · ' + L('corrente', 'power use') + ' +' + Math.round((tempPowMul() - 1) * 100) + '%' : '');
  const nx = MS[S.ms + 1]; const xp = cityXP(); const pr = nx ? clamp((xp - MS[S.ms].pop) / (nx.pop - MS[S.ms].pop), 0, 1) : 1;
  $('cMs').innerHTML = `🏆 ${MS[S.ms].n()} <span id="msbar"><i style="width:${pr * 100}%"></i></span>`;
  $('cMs').title = nx ? L('Prossimo: ', 'Next: ') + nx.n() + ' (' + fmtNum(xp) + ' / ' + fmtNum(nx.pop) + ' XP)' : '';
  const dm = stats.demand, cols = { R: '#5cc25a', C: '#5aa2e6', I: '#e3c03e', O: '#b07ae6' };
  $('cDem').onclick = () => openSide('demand'); $('cDem').style.cursor = 'pointer';
  $('cDem').innerHTML = ['R', 'C', 'I', 'O'].map(k => `<div class="demcol" title="${{ R: L('Domanda case', 'Housing demand'), C: L('Domanda negozi', 'Shop demand'), I: L('Domanda industria', 'Industry demand'), O: L('Domanda uffici', 'Office demand') }[k]}: ${Math.round(dm[k])}%"><div class="dem"><i style="height:${4 + dm[k] * 0.22}px;background:${cols[k]}"></i></div><span>${k}</span></div>`).join('');
  const hp = stats.happy; $('cHappy').innerHTML = `${hp > 70 ? '😄' : hp > 55 ? '🙂' : hp > 40 ? '😐' : '😠'} <b>${Math.round(hp)}%</b>`;
  $('cHappy').title = L('Felicità media', 'Average happiness');
  if (feedDirty) { feedDirty = false; $('feed').innerHTML = `<h4>💬 ${L('Voci della città', 'City voices')}<span style="color:var(--mute);font-weight:400">${S.feed.length}</span></h4>` + S.feed.slice(0, 14).map(f => `<div class="m"><span class="w">${f.who}</span> ${f.t}</div>`).join(''); }
}
// ---------- barra strumenti ----------
const TB = [
  { id: 'roads', i: '🛣️', n: () => L('Strade', 'Roads') },
  { id: 'zones', i: '🏘️', n: () => L('Zone', 'Zoning') },
  ...Object.keys(CAT).map(k => ({ id: k, i: CAT[k].i, n: CAT[k].n })),
  { id: 'lines', i: '🚏', n: () => L('Linee di trasporto', 'Transit lines') },
  { id: 'terrain', i: '⛰️', n: () => L('Terreno e alberi', 'Terrain & trees') },
  { id: 'districts', i: '🗺️', n: () => L('Quartieri', 'Districts') },
  { id: 'bull', i: '🧨', n: () => L('Demolisci (B)', 'Bulldoze (B)') },
  { id: 'info', i: '🎨', n: () => L('Viste a colori', 'Info views') },
];
let openCat = null;
function buildToolbar() {
  $('toolbar').innerHTML = TB.map(t => `<button id="tb_${t.id}" class="${openCat === t.id || (t.id === 'bull' && TOOL.kind === 'bull') ? 'on' : ''}" title="${t.n()}" onclick="tbClick('${t.id}')">${t.i}</button>`).join('');
  $('right').innerHTML = [['stats', '📊', L('Statistiche', 'Statistics')], ['budget', '💶', L('Bilancio e tasse', 'Budget & taxes')], ['progress', '🏆', L('Progressi e terreno', 'Progress & land')], ['policies', '📜', L('Politiche', 'Policies')], ['lines', '🚌', L('Linee', 'Lines')], ['production', '🏭', L('Produzione', 'Production')], ['radio', '📻', L('Radio', 'Radio')], ['photo', '📷', L('Modalità foto (P)', 'Photo mode (P)')], ['walk', '🚶', L('Cammina (V)', 'Walk (V)')], ['menu', '☰', L('Menu (Esc)', 'Menu (Esc)')]].map(([id, i, n]) => `<button title="${n}" onclick="rightClick('${id}')">${i}</button>`).join('');
  buildSub();
}
function bldAddr(o) { const s = segs.get(o.seg), c0 = cells[o.cells[0]]; return s && streetName(s) ? `${streetName(s)}, ${(c0 ? c0.k : 0) * 2 + (o.side > 0 ? 1 : 2)}` : ''; }
// seguire un cittadino: parte in auto dalla sua casa verso il lavoro, un negozio o fuori città
function followCitizen(bid, name, age, job) {
  const b = buildings.get(bid); if (!b) return; const from = segs.get(b.seg); if (!from) return;
  const pool = age < 19 ? lists.res : age > 67 || /cerca|unempl/.test(job) ? lists.com : lists.job; let to = null, legs = null;
  for (let t = 0; t < 12 && !legs; t++) { to = pool.length ? pool[Math.floor(rand() * pool.length)] : null; if (!to || to === b) continue; const ts = segs.get(to.seg); if (ts) legs = findPath(from, b.along, ts, to.along); }
  if (!legs) { toast(L('Non trova una strada per uscire', 'No route to go anywhere'), 2500); return; }
  const v = spawnVehicle('car', legs, { cit: { name, age, job, addr: bldAddr(b), goal: (age < 19 ? L('da un amico in ', 'to a friend in ') : age > 67 || /cerca|unempl/.test(job) ? L('a fare la spesa in ', 'shopping in ') : L('al lavoro in ', 'to work in ')) + (streetName(segs.get(to.seg)) || '?') } });
  if (!v) return; v.onArrive = () => toast('👤 ' + name + L(' è arrivato', ' has arrived'), 3000);
  followVeh = v; selected = { kind: 'veh', obj: v }; openSide('sel'); cam.dist = Math.min(cam.dist, 260);
}
// ---------- radio della città ----------
const RADIO = { ch: 0, vol: 0.5, ac: null, g: null, t: 0, beat: 0, news: [], said: 0 };
const RADIO_CH = () => [L('Spenta', 'Off'), '🎵 ' + L('Musica tranquilla', 'Easy music'), '📰 ' + L('Notizie della città', 'City news')];
function radioNews() {
  const p = stats.pop || 0, n = S.name, u = Math.round((stats.unemp || 0) * 100), h = Math.round(stats.happy || 0), out = [];
  out.push(L(`Buongiorno ${n}! Qui Radio Città. Oggi siamo in ${fmtNum(Math.round(p))} abitanti.`, `Good morning ${n}! This is City Radio. Today we are ${fmtNum(Math.round(p))} residents.`));
  out.push(L(`Il tempo: ${weatherName()}, ${Math.round(WEATHER.temp)} gradi.`, `Weather: ${weatherName()}, ${Math.round(WEATHER.temp)} degrees.`));
  out.push(h > 70 ? L('I cittadini sono contenti del sindaco.', 'Citizens are happy with the mayor.') : h < 45 ? L('Molti cittadini si lamentano: il sindaco deve fare qualcosa.', 'Many citizens complain: the mayor must act.') : L('In città l\'umore è nella media.', 'The city mood is average.'));
  if (u > 10) out.push(L(`Disoccupazione al ${u} per cento: servono posti di lavoro.`, `Unemployment at ${u} percent: we need jobs.`));
  if ((stats.congestion || 0) > 0.5) out.push(L('Traffico intenso sulle strade principali: meglio prendere i mezzi pubblici.', 'Heavy traffic on main roads: better take public transport.'));
  if ((stats.crime || 0) > 30) out.push(L('Cresce la criminalità in alcuni quartieri.', 'Crime is rising in some districts.'));
  if (stats.sick > 20) out.push(L('Molti malati: gli ospedali sono pieni.', 'Many sick people: hospitals are full.'));
  if (S.money < 0) out.push(L('Le casse del comune sono in rosso!', 'The city treasury is in the red!'));
  out.push(pick2(Math.random, [L('Pubblicità: Pizzeria Il Forno Allegro, la pizza più calda del quartiere!', 'Ad: Happy Oven Pizzeria, the hottest pizza in town!'), L('Pubblicità: Ferramenta Bullone, tutto per la casa.', 'Ad: Bolt Hardware, everything for your home.'), L('Pubblicità: Gelateria Polo Nord, aperta tutto l\'anno.', 'Ad: North Pole Ice Cream, open all year.')]));
  return out;
}
function radioSet(ch) {
  RADIO.ch = ch; try { speechSynthesis.cancel(); } catch (e) { }
  if (ch && !RADIO.ac) { try { RADIO.ac = new (window.AudioContext || window.webkitAudioContext)(); RADIO.g = RADIO.ac.createGain(); RADIO.g.connect(RADIO.ac.destination); } catch (e) { } }
  if (RADIO.g) RADIO.g.gain.value = ch === 1 ? RADIO.vol * 0.25 : 0;
  if (ch === 2) { RADIO.news = radioNews(); RADIO.said = 0; radioSay(); }
  refreshPanels();
}
function radioSay() {
  if (RADIO.ch !== 2) return; const t = RADIO.news[RADIO.said % RADIO.news.length]; RADIO.cur = t; RADIO.said++; if (RADIO.said % RADIO.news.length === 0) RADIO.news = radioNews();
  if (sideOpen === 'radio') refreshPanels();
  try { const u = new SpeechSynthesisUtterance(t); u.lang = SET.lang === 'en' ? 'en-GB' : 'it-IT'; u.volume = RADIO.vol; u.rate = 1.02; u.onend = () => setTimeout(radioSay, 1500); speechSynthesis.speak(u); } catch (e) { setTimeout(radioSay, 6000); }
}
// musica: accordi lenti suonati con l'audio del browser
const RCH = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]];
function radioTick(dt) {
  if (RADIO.ch !== 1 || !RADIO.ac) return; RADIO.t -= dt; if (RADIO.t > 0) return;
  const ac = RADIO.ac, ch = RCH[RADIO.beat % 4], now = ac.currentTime, len = 2.4; RADIO.t = len; RADIO.beat++;
  ch.forEach((n, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = 220 * Math.pow(2, (n - (i ? 0 : 12)) / 12); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 0.3); g.gain.exponentialRampToValueAtTime(0.001, now + len + 0.6); o.connect(g); g.connect(RADIO.g); o.start(now); o.stop(now + len + 0.7); });
  for (let k = 0; k < 4; k++) { const o = ac.createOscillator(), g = ac.createGain(), t0 = now + k * len / 4 + (Math.random() < 0.3 ? len / 8 : 0); o.type = 'sine'; o.frequency.value = 440 * Math.pow(2, (ch[Math.floor(Math.random() * 4)] + 12 * (Math.random() < 0.5 ? 0 : 1)) / 12); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.09, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5); o.connect(g); g.connect(RADIO.g); o.start(t0); o.stop(t0 + 0.6); }
}
function rightClick(id) { if (id === 'menu') openMenu(); else if (id === 'walk') toggleWalk(); else openSide(id); }
function tbClick(id) {
  if (id === 'bull') { setTool(TOOL.kind === 'bull' ? null : 'bull'); openCat = null; buildToolbar(); return; }
  openCat = openCat === id ? null : id;
  if (!openCat) setTool(null);
  buildToolbar();
}
function lockTxt(ms) { return `<span class="req">🔒 ${L('Serve il traguardo', 'Requires milestone')} ${ms}: ${MS[ms].n()}</span>`; }
// messaggi verdi "+XP" in basso a sinistra
function xpMsg(t) { const el = $('xpfeed'); if (!el) return; const d = document.createElement('div'); d.textContent = t; el.appendChild(d); while (el.children.length > 5) el.firstChild.remove(); setTimeout(() => d.remove(), 3300); }
// finestra al centro dello schermo
function showModal(html) { $('modalBox').innerHTML = html; $('modal').style.display = 'flex'; }
function closeModal() { $('modal').style.display = 'none'; if (modalResume) { setSpeed(modalResume); modalResume = 0; } }
let modalResume = 0, confirmCb = null;
function askConfirm(text, cb) { confirmCb = cb; showModal(`<div style="font-size:15px;margin:6px 0 10px">${text}</div><button onclick="closeModal();confirmCb&&confirmCb()">${L('Sì, demolisci', 'Yes, demolish')}</button><button onclick="closeModal()">${L('No', 'No')}</button>`); }
function unlocksAt(ms) {
  const u = [];
  const tr = k => TREE_ITEM[k] && !S.opts.unlockAll ? ' 🔒' : '';
  for (const k in RT) if (RT[k].ms === ms) u.push('🛣️ ' + RT[k].n() + tr(k));
  for (const k in ICHG) if (ICHG[k].ms === ms) u.push('🛣️ ' + ICHG[k].n() + tr(k));
  for (const k in ZT) if (ZT[k].ms === ms) u.push('🏘️ ' + ZT[k].n());
  for (const k in SV) if (SV[k].ms === ms) u.push(CAT[SV[k].cat].i + ' ' + SV[k].n() + tr(k));
  for (const k in LK) if (LK[k].ms === ms) u.push('🚏 ' + LK[k].n());
  return u;
}
function showMilestone(ms, bonus, dev) {
  const u = unlocksAt(ms), tiles = tilesFor(ms) - tilesFor(ms - 1);
  if (S.speed) { modalResume = S.speed; setSpeed(0); }
  showModal(`<div style="font-size:42px">🏆</div><h2>${L('Traguardo raggiunto!', 'Milestone reached!')}</h2><div style="font-size:18px;color:var(--acc2);font-weight:700">${ms}. ${MS[ms].n()}</div>
    <div class="sec">${L('Premi', 'Rewards')}</div><div>💶 +${fmtMoney(bonus)} · ⭐ +${dev} ${L('punti sviluppo', 'development points')} · 🗺️ +${tiles} ${L('caselle da comprare', 'tiles to buy')} · 🏦 ${L('limite prestiti', 'loan limit')} ${fmtMoney(loanLimit())}</div>
    ${u.length ? `<div class="sec">${L('Adesso puoi costruire', 'Now you can build')}</div><div class="ul">${u.map(x => `<div>${x}</div>`).join('')}</div>${u.some(x => x.includes('🔒')) ? `<div style="font-size:12px;color:var(--mute);margin-top:4px">🔒 = ${L('da sbloccare con i punti nell\'albero di sviluppo', 'unlock with points in the development tree')}</div>` : ''}` : ''}
    <button onclick="closeModal();openSide('progress')">${L('Pannello progressi', 'Progress panel')}</button><button onclick="closeModal()">${L('Chiudi', 'Close')}</button>`);
}
// prestito con il cursore: il tasso sale con la cifra
function loanRate(a) { return Math.max(0.005, 0.023 + 0.177 * a / Math.max(1, loanLimit()) - ([...svcs.values()].some(s => s.on && s.type === 'cityhall') ? 0.01 : 0) - ([...svcs.values()].some(s => s.on && s.type === 'cbank') ? 0.02 : 0)); }
function loanFree() { return Math.max(0, loanLimit() - S.loans.reduce((t, l) => t + l.amt, 0)); }
function loanUI(v) { const a = +v, r = loanRate(a), m = a > 300000 ? 48 : 24; $('loanTxt').innerHTML = `${fmtMoney(a)} · ${(r * 100).toFixed(1)}% · ${m} ${L('mesi', 'months')} · ${L('rata', 'payment')} ${fmtMoney(Math.round(a * (1 + r) / m))}/${L('mese', 'mo')}`; }
function takeLoanSlider() { const a = +$('loanAmt').value; if (a <= 0) return; takeLoan(a, loanRate(a), a > 300000 ? 48 : 24); }
function buildSub() {
  const el = $('sub'); if (!openCat) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  let h = '';
  const cardT = (key, on, act, name, cost, extra, ms) => unlocked(ms) && !treeOk(key) ? `<button class="item" disabled><span class="n">${name}</span>${cost != null ? `<span class="c">${fmtMoney(cost)}</span>` : ''}<span class="l">${treeLockTxt(key)}</span></button>` : card(on, act, name, cost, extra, ms);
  const card = (on, act, name, cost, extra, ms) => `<button class="item ${on ? 'on' : ''}" ${unlocked(ms) ? `onclick="${act}"` : 'disabled'}><span class="n">${name}</span>${cost != null ? `<span class="c">${fmtMoney(cost)}</span>` : ''}<span class="l">${unlocked(ms) ? extra || '' : lockTxt(ms)}</span></button>`;
  if (openCat === 'roads') {
    for (const k in RT) h += cardT(k, TOOL.kind === 'road' && TOOL.sub === k, `setTool('road','${k}');buildSub()`, RT[k].n(), null, fmtMoney(RT[k].cost) + '/m · ' + RT[k].d(), RT[k].ms);
    h += card(TOOL.kind === 'round', `setTool('round');buildSub()`, L('Rotonda', 'Roundabout'), 15000, L('Su un incrocio esistente', 'On an existing intersection'), 2);
    if (TOOL.kind === 'round') h += roundOptsHTML();
    for (const k in ICHG) h += cardT(k, TOOL.kind === 'ichg' && TOOL.sub === k, `setTool('ichg','${k}');buildSub()`, ICHG[k].n(), ICHG[k].cost, ICHG[k].d(), ICHG[k].ms);
    h += card(TOOL.kind === 'noleft', `setTool('noleft');buildSub()`, L('Divieti di svolta', 'Turn bans'), null, L('Clic sull\'incrocio: sinistra → destra → tutte e due → niente. Inversione a U sempre vietata agli incroci', 'Click a junction: left → right → both → none. U-turns are never allowed at junctions'), 2);
    h += card(TOOL.kind === 'light', `setTool('light');buildSub()`, L('Semafori e stop', 'Lights & stop signs'), null, L('Clic sull\'incrocio: semaforo → stop → niente', 'Click a junction: lights → stop → none'), 0);
    h += `<div class="subopts"><span>${L('Forma', 'Shape')}:</span><button class="${TOOL.mode === 'straight' ? 'on' : ''}" onclick="TOOL.mode='straight';TOOL.cp=null;buildSub()">📏 ${L('Dritta', 'Straight')}</button><button class="${TOOL.mode === 'curve' ? 'on' : ''}" onclick="TOOL.mode='curve';TOOL.cp=null;buildSub()">➰ ${L('Curva', 'Curve')}</button><button class="${TOOL.mode === 'grid' ? 'on' : ''}" onclick="TOOL.mode='grid';TOOL.cp=null;TOOL.p0=null;buildSub()" title="${L('Clicca due angoli: costruisce tutti gli isolati', 'Click two corners: builds all the blocks')}">▦ ${L('Griglia', 'Grid')}</button><button class="${TOOL.mode === 'curve2' ? 'on' : ''}" onclick="TOOL.mode='curve2';TOOL.cp=null;TOOL.c4=[];buildSub()" title="${L('4 clic: inizio, due punti di controllo, fine', '4 clicks: start, two control points, end')}">〰 ${L('Curva complessa', 'Complex curve')}</button><button class="${TOOL.single ? '' : 'on'}" onclick="TOOL.single=!TOOL.single;buildSub()" title="${L('Continua: la strada riparte da dove finisce', 'Continuous: the road starts again where it ends')}">⛓ ${L('Continua', 'Continuous')}</button>
      ${roadOptsHTML()}
      <button onclick="doUndo()">↶ ${L('Annulla', 'Undo')} (Ctrl+Z)</button><span style="color:var(--mute)">${L('Sopra l\'acqua i ponti si fanno da soli', 'Bridges over water are automatic')}</span></div>`;
  } else if (openCat === 'zones') {
    for (const k of ZONE_ORDER) { const z = ZT[k]; h += `<button class="item ${TOOL.kind === 'zone' && TOOL.sub === k ? 'on' : ''}" ${unlocked(z.ms) ? `onclick="setTool('zone',${k});buildSub()"` : 'disabled'} style="border-left:5px solid #${z.col.toString(16).padStart(6, '0')}"><span class="n">${z.sh()}</span><span class="l">${unlocked(z.ms) ? z.n() : lockTxt(z.ms)}</span></button>`; }
    h += card(TOOL.kind === 'zone' && TOOL.sub === 0, `setTool('zone',0);buildSub()`, L('Cancella zona', 'Remove zone'), null, '', 0);
    h += `<div class="subopts"><span>${L('Pennello', 'Brush')}:</span>${[['small', L('Piccolo', 'Small')], ['big', L('Grande', 'Large')], ['fill', L('Tutto il lato della strada', 'Whole road side')], ['rect', L('Rettangolo', 'Rectangle')]].map(([k, n]) => `<button class="${TOOL.brush === k ? 'on' : ''}" onclick="TOOL.brush='${k}';buildSub()">${n}</button>`).join('')}<span style="color:var(--mute)">${L('Tieni premuto e trascina. Le zone nascono solo lungo le strade.', 'Hold and drag. Zones exist only along roads.')}</span></div>`;
  } else if (CAT[openCat]) {
    for (const k in SV) { const d = SV[k]; if (d.cat !== openCat) continue; if (d.need && unlocked(d.ms) && !signOk(k)) { const nd = d.need, c = Math.min(signCount(nd.k), nd.n); h += `<button class="item" disabled><span class="n">${d.n()}</span><span class="c">${fmtMoney(d.cost)}</span><span class="l"><span class="req">🔒 ${signNeedTxt(k)}</span>${bar(c / nd.n, '#e3a03e')}</span></button>`; continue; } h += cardT(k, TOOL.kind === 'svc' && TOOL.sub === k, `setTool('svc','${k}');buildSub()`, d.n(), d.cost, d.d2(), d.ms); }
    if (openCat === 'power') h += card(TOOL.kind === 'power', `setTool('power');buildSub()`, L('Linea elettrica', 'Power line'), null, L('15 €/m. Collega reti separate, o la rete all\'autostrada per vendere corrente', '€15/m. Links separate grids, or the grid to the highway to trade power'), 0);
    if (openCat === 'transport') h += `<div class="subopts"><span style="color:var(--mute)">${L('Le linee si disegnano con il pulsante 🚏', 'Draw lines with the 🚏 button')}</span></div>`;
    h += `<div class="subopts"><span style="color:var(--mute)">${L('R ruota · Il cerchio mostra la zona coperta · Budget del servizio nel pannello 💶', 'R rotates · The circle shows coverage · Service budget in the 💶 panel')}</span></div>`;
  } else if (openCat === 'lines') {
    for (const k in LK) h += card(TOOL.kind === 'line' && TOOL.sub === k, `setTool('line','${k}');buildSub()`, L('Nuova linea: ', 'New line: ') + LK[k].n(), null, k === 'bus' ? L('Fermate sulle strade', 'Stops on roads') : k === 'tram' ? L('Fermate sulle strade', 'Stops on roads') : L('Tra le stazioni', 'Between stations'), LK[k].ms);
    h += `<div class="subopts"><button class="${TOOL.wp ? 'on' : ''}" onclick="TOOL.wp=!TOOL.wp;buildSub()">◆ ${L('Punto di passaggio (senza fermata)', 'Waypoint (no stop)')}</button></div>`;
    h += `<div class="subopts"><span style="color:var(--mute)">${L('Clicca le fermate una dopo l\'altra. Clicca di nuovo la prima, o clic destro, per chiudere la linea.', 'Click stops one after another. Click the first again, or right click, to close the line.')}</span></div>`;
  } else if (openCat === 'terrain') {
    for (const [k, n] of [['raise', L('Alza', 'Raise')], ['lower', L('Abbassa', 'Lower')], ['level', L('Livella', 'Level')], ['smooth', L('Ammorbidisci', 'Smooth')], ['fill', L('Riempi il mare', 'Fill the sea')], ['canal', L('Scava un canale', 'Dig a canal')]]) h += card(TOOL.kind === 'terrain' && TOOL.tmode === k, `setTool('terrain');TOOL.tmode='${k}';buildSub()`, n, null, k === 'fill' ? L('Terra nuova, banchine e isole · ~150 €/s', 'New land, quays and islands · ~€150/s') : L('~60 €/s', '~€60/s'), 0);
    h += card(TOOL.kind === 'tree' && TOOL.sub === 'plant', `setTool('tree','plant');buildSub()`, L('Pianta alberi', 'Plant trees'), 40, L('Riduce rumore, abbellisce', 'Reduces noise, looks nice'), 0);
    h += card(TOOL.kind === 'tree' && TOOL.sub === 'remove', `setTool('tree','remove');buildSub()`, L('Togli alberi', 'Remove trees'), null, '', 0);
    h += terrainExtraHTML();
  } else if (openCat === 'districts') {
    h += S.districts.map(d => `<button class="item ${TOOL.kind === 'dist' && TOOL.dist === d.id ? 'on' : ''}" onclick="setTool('dist');TOOL.dist=${d.id};buildSub()" style="border-left:5px solid #${d.col.toString(16).padStart(6, '0')}"><span class="n">${d.name}</span><span class="l">${L('Dipingi', 'Paint')}</span></button>`).join('');
    h += card(TOOL.kind === 'distpoly', `setTool('distpoly');showInfo('dist',true);buildSub()`, '⬠ ' + L('Disegna confine', 'Draw border'), null, L('Clicca i punti del confine: nasce un quartiere nuovo', 'Click border points: creates a new district'), 0);
    h += card(TOOL.kind === 'dist' && TOOL.dist === 0, `setTool('dist');TOOL.dist=0;buildSub()`, L('Cancella', 'Erase'), null, '', 0);
    h += `<div class="subopts"><input type="text" id="distName" placeholder="${L('Nome del nuovo quartiere', 'New district name')}" style="background:rgba(255,255,255,.1);border:1px solid var(--line);color:var(--fg);padding:6px;border-radius:6px"><button onclick="newDistrict()">➕ ${L('Crea quartiere', 'Create district')}</button></div>`;
  } else if (openCat === 'info') {
    for (const [k, n] of INFOMODES()) h += `<button class="item ${INFO.mode === k ? 'on' : ''}" onclick="showInfo(INFO.mode==='${k}'?null:'${k}');buildSub()"><span class="n">${n}</span></button>`;
  }
  el.innerHTML = h;
}
function newDistrict(poly) {
  const n = ($('distName')?.value || '').trim() || L('Quartiere ', 'District ') + (S.districts.length + 1);
  if (S.districts.length >= 250) return;
  const id = (S.districts.reduce((a, d) => Math.max(a, d.id), 0)) + 1;
  S.districts.push({ id, name: n, col: LINE_COLS[id % LINE_COLS.length] });
  if (poly) return id;
  setTool('dist'); TOOL.dist = id; buildSub();
}
function openDistrict(id) { TOOL.distSel = id; openSide('district'); }
// le celle di un quartiere stanno nella zona delle caselle comprate
function distEach(fn) { const W = actWin(); for (let j = W.j0; j <= W.j1; j++) for (let i = W.i0, k = j * G + W.i0; i <= W.i1; i++, k++) if (distGrid[k]) fn(k, i, j); }
let distVer = 1; const distC = new Map();
function distCenter(id) { let c = distC.get(id); if (c && c.v === distVer) return c; let sx = 0, sz = 0, n = 0; distEach((k, i, j) => { if (distGrid[k] === id) { sx += i; sz += j; n++; } }); c = { v: distVer, n, x: -HALF + (sx / Math.max(n, 1) + 0.5) * GC, z: -HALF + (sz / Math.max(n, 1) + 0.5) * GC }; distC.set(id, c); return c; }
function focusDistrict(id) { const c = distCenter(id), n = c.n; if (!n) return; cam.tx = c.x; cam.tz = c.z; cam.dist = clamp(Math.sqrt(n) * GC * 1.6, 400, 5000); showInfo('dist'); }
function delDistrict(id) { distEach(k => { if (distGrid[k] === id) distGrid[k] = 0; }); distVer++; S.districts = S.districts.filter(d => d.id !== id); for (const sv of svcs.values()) if (sv.dist === id) sv.dist = 0; infoDirty = true; covDirty = true; closeSide(); buildSub(); }
function districtStats(id) {
  const r = { pop: 0, hh: 0, jobs: 0, work: 0, happy: 0, nb: 0, edu: 0, lv: 0, cells: 0, svc: 0, cov: { health: 0, police: 0, fire: 0, edu1: 0, park: 0, garb: 0, transit: 0 } };
  distEach(k => { if (distGrid[k] === id) { r.cells++; r.lv += LV[k]; } });
  for (const b of buildings.values()) { if (distGrid[gIdx(b.x, b.z)] !== id) continue; r.nb++; if (b.hh) { r.pop += b.occ * 2.6; r.hh += b.occ; r.happy += b.happy * b.occ; r.edu += (b.edu || 0) * b.occ; } else { r.jobs += b.jobs || 0; r.work += b.occ; } for (const k in r.cov) r.cov[k] += Math.min(1, b.cov?.[k] || 0); }
  for (const sv of svcs.values()) if (distGrid[gIdx(sv.x, sv.z)] === id) r.svc++;
  return r;
}
// ---------- viste a colori ----------
const INFO = { mode: null, tinted: false };
let infoDirty = true;
const INFOMODES = () => [['pgrid', '🔌 ' + L('Rete elettrica', 'Power grid')], ['gw', '💧 ' + L('Falde e correnti', 'Groundwater & currents')], ['traffic', '🚗 ' + L('Traffico', 'Traffic')], ['roads', '🛣️ ' + L('Condizioni delle strade', 'Road condition')], ['lv', '💎 ' + L('Valore del terreno', 'Land value')], ['air', '🏭 ' + L('Inquinamento aria', 'Air pollution')], ['ground', '🟤 ' + L('Inquinamento suolo', 'Ground pollution')], ['noise', '🔊 ' + L('Rumore', 'Noise')], ['water', '🚱 ' + L('Inquinamento acqua', 'Water pollution')], ['power', '⚡ ' + L('Elettricità', 'Electricity')], ['wat', '💧 ' + L('Acqua', 'Water')], ['happy', '😊 ' + L('Felicità', 'Happiness')], ['crime', '🚓 ' + L('Criminalità', 'Crime')], ['health', '🏥 ' + L('Sanità', 'Healthcare')], ['fire', '🚒 ' + L('Pompieri', 'Fire')], ['edu', '🎓 ' + L('Istruzione', 'Education')], ['garb', '🗑️ ' + L('Rifiuti', 'Garbage')], ['transit', '🚌 ' + L('Trasporti', 'Transit')], ['level', '⭐ ' + L('Livello edifici', 'Building level')], ['parking', '🅿️ ' + L('Parcheggi', 'Parking')], ['firerisk', '🔥 ' + L('Rischio incendio', 'Fire risk')], ['mail', '✉️ ' + L('Posta', 'Mail')], ['age', '🏚️ ' + L('Età degli edifici', 'Building age')], ['jobedu', '👷 ' + L('Lavoro per istruzione', 'Jobs by education')], ['profit', '💹 ' + L('Redditività aziende', 'Company profitability')], ['suit', '🧭 ' + L('Adatto alle zone', 'Zone suitability')], ['pcons', '🔌 ' + L('Consumi elettrici', 'Power use')], ['res', '🌾 ' + L('Risorse naturali', 'Natural resources')], ['wind', '🌬️ ' + L('Vento', 'Wind')], ['dist', '🗺️ ' + L('Quartieri', 'Districts')], ['disaster', '🌪️ ' + L('Controllo disastri', 'Disaster control')], ...INFO_EXTRA()];
function ramp(v) { v = clamp(v, 0, 1); return v < 0.5 ? [lerp(47, 232, v * 2), lerp(191, 208, v * 2), lerp(74, 64, v * 2)] : [lerp(232, 224, (v - 0.5) * 2), lerp(208, 64, (v - 0.5) * 2), lerp(64, 47, (v - 0.5) * 2)]; }
function showInfo(mode, temp) {
  if (!temp) INFO.keep = mode;
  INFO.mode = mode; infoDirty = true;
  if (!mode && INFO.tinted) { for (const b of buildings.values()) tintParts(b, b.aband ? 0x5a524a : undefined); INFO.tinted = false; }
  redrawLines();
  const lg = $('legend');
  if (!mode) { lg.style.display = 'none'; return; }
  const name = (INFOMODES().find(m => m[0] === mode) || [, ''])[1];
  const good = ['profit', 'suit', 'mail', 'lv', 'happy', 'health', 'fire', 'edu', 'transit', 'level', 'power', 'wat'].includes(mode);
  lg.innerHTML = `<b>${name}</b> ${mode === 'pgrid' ? '🟩 ' + L('corrente ok', 'power ok') + ' 🟧 ' + L('collo di bottiglia: serve un trasformatore', 'bottleneck: needs a transformer') + ' 🟥 ' + L('manca corrente', 'not enough power') : mode === 'gw' ? '🟦 ' + L('acqua sotto terra', 'groundwater') + ' 🟫 ' + L('falda inquinata', 'polluted groundwater') + ' ➤ ' + L('corrente', 'current') : mode === 'res' ? '🟨 ' + L('campi', 'farmland') + ' 🟩 ' + L('boschi', 'forest') + ' ⬛ ' + L('petrolio', 'oil') + ' 🟫 ' + L('minerali', 'ore') : mode === 'wind' ? L('Freccia: da dove soffia. ', 'Arrow: wind direction. ') + Math.round(WEATHER.wind * 60) + ' km/h' : mode === 'dist' ? '' : `${good ? L('scarso', 'poor') : L('poco', 'low')}<span class="g" style="${good ? 'transform:scaleX(-1)' : ''}"></span>${good ? L('ottimo', 'great') : L('tanto', 'high')}`}`;
  lg.style.display = 'block';
}
let trafficOv = null;
// la vista a colori copre la zona delle caselle comprate (più un margine)
const OVR = [0, 0, 1]; let ovKey = '';
function ovWindow() {
  let a = NT, b = -1, c = NT, d = -1; for (let i = 0; i < NT * NT; i++) if (TILES[i]) { const x = i % NT, z = (i / NT) | 0; a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z); }
  if (b < 0) { a = b = c = d = NT / 2; }
  const sz = Math.max(b - a, d - c) + 3, cx = (a + b + 1) / 2, cz = (c + d + 1) / 2;
  OVR[0] = -HALF + (cx - sz / 2) * TILE; OVR[1] = -HALF + (cz - sz / 2) * TILE; OVR[2] = sz * TILE;
  terrU.uOvR.value.set(OVR[0], OVR[1], OVR[2], 0);
}
function renderInfo() {
  if (!infoDirty) return; infoDirty = false;
  const m = INFO.mode;
  terrU.uOvAmt.value = m && m !== 'traffic' && m !== 'suit' && m !== 'pgrid' ? 0.75 : 0;
  if (trafficOv) { scene.remove(trafficOv); trafficOv.geometry.dispose(); trafficOv = null; }
  if (!m) return;
  const grid = { lv: LV, air: AIR, ground: GROUND, noise: NOIS, water: WPOL }[m];
  const covKey = { mail: 'mail', health: 'health', fire: 'fire', edu: 'edu1', crime: null, garb: 'garb', transit: 'transit' }[m];
  ovData.fill(0); ovWindow();
  const OX = OVR[0], OZ = OVR[1], OS = OVR[2] / OVN, oK = (i, j) => gIdx(OX + (i + 0.5) * OS, OZ + (j + 0.5) * OS), toI = x => (x - OX) / OS, toJ = z => (z - OZ) / OS;
  const put = (i, j, r, g, b, a) => { const k = (j * OVN + i) * 4; ovData[k] = r; ovData[k + 1] = g; ovData[k + 2] = b; ovData[k + 3] = a; };
  if (grid) {
    const sc = m === 'lv' ? 1 / 45 : 1 / 40;
    for (let j = 0; j < OVN; j++) for (let i = 0; i < OVN; i++) { const v = grid[oK(i, j)] * sc; if (m !== 'lv' && v < 0.03) continue; const c = ramp(m === 'lv' ? 1 - v : v); put(i, j, c[0], c[1], c[2], m === 'lv' ? 200 : clamp(v * 400, 0, 220)); }
  } else if (m === 'res') {
    for (let j = 0; j < OVN; j++) for (let i = 0; i < OVN; i++) { const k = oK(i, j); const f = RES.fert[k], fo = RES.forest[k], o = RES.oil[k], r = RES.ore[k]; const mx = Math.max(f, fo, o, r); if (mx < 0.2) continue; const c = mx === f ? [230, 210, 60] : mx === fo ? [40, 160, 60] : mx === o ? [30, 30, 30] : [150, 90, 50]; put(i, j, c[0], c[1], c[2], mx * 230); }
  } else if (m === 'gw') { // falde sotto terra (blu) e frecce della corrente sull'acqua
    const cd = (MAPS[MAPID]?.cur ?? 0.6), cx = Math.cos(cd), cz = Math.sin(cd);
    for (let j = 0; j < OVN; j++) for (let i = 0; i < OVN; i++) { const k = oK(i, j), x = OX + (i + 0.5) * OS, z = OZ + (j + 0.5) * OS;
      if (isWater(x, z)) { const u = (x * cx + z * cz) / 40, v = (-x * cz + z * cx) / 40, a = ((u % 14) + 14) % 14, b = ((v % 10) + 10) % 10; if (a < 6 && Math.abs(b - 5) < (a < 4 ? 0.8 : 2.6 - (a - 4))) put(i, j, 235, 245, 255, 200); continue; }
      const g = RES.gw[k] * (1 - clamp(GROUND[k] / 40, 0, 1) * 0.7); if (g < 0.12) continue; const pol = GROUND[k] > 8; put(i, j, pol ? 150 : 40, pol ? 110 : 120, pol ? 60 : 230, clamp(g * 260, 40, 210)); }
  } else if (m === 'dist') {
    for (let j = 0; j < OVN; j++) for (let i = 0; i < OVN; i++) { const id = distGrid[oK(i, j)]; if (!id) continue; const d = S.districts.find(x => x.id === id); if (!d) continue; _c.setHex(d.col); put(i, j, _c.r * 255, _c.g * 255, _c.b * 255, 150); }
  } else if (m === 'wind') {
    const wx = Math.cos(WEATHER.windDir), wz = Math.sin(WEATHER.windDir);
    for (let j = 0; j < OVN; j++) for (let i = 0; i < OVN; i++) { const ph = ((i * wx + j * wz) * 0.5 - simClock * 0.5) % 6; if (ph > 0 && ph < 1.2) put(i, j, 200, 230, 255, 120 * WEATHER.wind); }
  } else if (covKey || m === 'crime' || m === 'disaster') {
    for (const sv of svcs.values()) {
      const d = SV[sv.type]; if (!d.r) continue;
      const match = m === 'garb' ? !!d.gcap : m === 'edu' ? d.cat === 'edu' : m === 'crime' ? d.eff === 'police' : m === 'disaster' ? !!d.dis : d.eff === covKey; if (!match) continue;
      const ci = toI(sv.x), cj = toJ(sv.z), rr = d.r / OS;
      for (let j = Math.floor(cj - rr); j <= cj + rr; j++) for (let i = Math.floor(ci - rr); i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= OVN || j >= OVN) continue; const dd = Math.hypot(i - ci, j - cj) / rr; if (dd > 1) continue; const k = (j * OVN + i) * 4; ovData[k] = 60; ovData[k + 1] = 200; ovData[k + 2] = 90; ovData[k + 3] = Math.max(ovData[k + 3], (1 - dd * 0.6) * 150); }
    }
    if (m === 'transit') for (const ln of lines) for (const st of ln.stops) { const ci = toI(st.x), cj = toJ(st.z), rr = LK[ln.kind].catch / OS; for (let j = Math.floor(cj - rr); j <= cj + rr; j++) for (let i = Math.floor(ci - rr); i <= ci + rr; i++) { if (i < 0 || j < 0 || i >= OVN || j >= OVN || Math.hypot(i - ci, j - cj) > rr) continue; const k = (j * OVN + i) * 4; ovData[k] = 60; ovData[k + 1] = 140; ovData[k + 2] = 230; ovData[k + 3] = 140; } }
  }
  ovTex.needsUpdate = true;
  // edifici colorati
  const bmode = ['age', 'jobedu', 'profit', 'mail', 'firerisk', 'pcons', 'parking', 'power', 'wat', 'happy', 'crime', 'health', 'fire', 'edu', 'garb', 'level', 'transit', 'lv', 'air', 'noise', 'ground'].includes(m);
  if (bmode) {
    for (const b of buildings.values()) {
      let v; const c = b.cov || {};
      switch (m) { case 'firerisk': v = fireRisk(b); break; case 'pcons': v = clamp((b.pu || 0) / 1.2, 0, 1); break; case 'parking': v = (ZT[b.zone].k === 'C' || ZT[b.zone].k === 'O') ? 1 - Math.min(1, c.parking || 0) : -1; break; case 'power': v = b.pow ? 0 : 1; break; case 'wat': v = b.wat && b.sew ? 0 : 1; break; case 'happy': v = 1 - b.happy / 100; break; case 'crime': v = b.crime / 60; break; case 'health': v = 1 - (c.health || 0); break; case 'fire': v = 1 - (c.fire || 0); break; case 'edu': v = 1 - b.edu; break; case 'garb': v = b.garb / 120; break; case 'level': v = 1 - (b.level - 1) / 4; break; case 'transit': v = 1 - (c.transit || 0); break; case 'mail': v = 1 - Math.min(1, c.mail || 0); break; case 'age': v = clamp((b.age || 0) / 120, 0, 1); break; case 'jobedu': v = b.jobs ? { O: 0.05, C: 0.45, M: 0.45, I: 0.9 }[ZT[b.zone].k] ?? -1 : -1; break; case 'profit': v = b.jobs ? 1 - profitOf(b) : -1; break; default: v = -1; }
      if (v < 0) { tintParts(b, 0xd8d8d8); continue; }
      const col = ramp(v); tintParts(b, (Math.round(col[0]) << 16) | (Math.round(col[1]) << 8) | Math.round(col[2]));
    }
    INFO.tinted = true;
  } else if (INFO.tinted) { for (const b of buildings.values()) tintParts(b, b.aband ? 0x5a524a : undefined); INFO.tinted = false; }
  if (m === 'pgrid') { // strade colorate secondo la loro rete: verde ok, arancione collo di bottiglia, rosso manca corrente, grigio nessuna rete
    const p = [], col = [];
    for (const s of segs.values()) { if (RT[s.type].rail || RT[s.type].ped) continue; const c = s.net; const cc = !c || (!c.pP && !c.out) ? [0.55, 0.55, 0.6] : c.pLost > 1 ? [0.95, 0.6, 0.15] : c.pR < 0.95 && !c.out ? [0.9, 0.25, 0.2] : [0.25, 0.8, 0.35], hw = RT[s.type].w * 0.42;
      for (let i = 0; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw; const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]]; for (const t of [0, 1, 2, 0, 2, 3]) { p.push(...q[t]); col.push(...cc); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
  }
  if (m === 'suit') { // strade colorate: verde = buon posto per le case (valore alto, poco inquinamento)
    const p = [], col = [];
    for (const s of segs.values()) { if (!RT[s.type].zone) continue; const mid = s.pts[s.pts.length >> 1], k = gIdx(mid.x, mid.z); const c = ramp(1 - clamp((LV[k] - AIR[k] * 0.6 - NOIS[k] * 0.4 - GROUND[k] * 0.5 + 10) / 50, 0, 1)), hw = RT[s.type].w * 0.42;
      for (let i = 0; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw; const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]]; for (const kk of [0, 1, 2, 0, 2, 3]) { p.push(...q[kk]); col.push(c[0] / 255, c[1] / 255, c[2] / 255); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
  }
  if (m === 'traffic') {
    const p = [], col = [];
    for (const s of segs.values()) {
      if (RT[s.type].ped) continue; let cars = 0; for (const e of s.edges) for (const l of e.cars) cars += l.length;
      const dens = clamp(cars / (Math.max(s.len, 20) * Math.max(1, RT[s.type].lanes) * (RT[s.type].two ? 2 : 1) / 9), 0, 1);
      const c = ramp(dens), hw = RT[s.type].w * 0.42;
      for (let i = 0; i < s.pts.length - 1; i++) {
        const a = s.pts[i], b = s.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw;
        const q = [[a.x - nx, a.y + 0.6, a.z - nz], [a.x + nx, a.y + 0.6, a.z + nz], [b.x + nx, b.y + 0.6, b.z + nz], [b.x - nx, b.y + 0.6, b.z - nz]];
        for (const k of [0, 1, 2, 0, 2, 3]) { p.push(...q[k]); col.push(c[0] / 255, c[1] / 255, c[2] / 255); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    trafficOv = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 })); trafficOv.renderOrder = 7; scene.add(trafficOv);
  }
}
// ---------- selezione e pannello laterale ----------
let selected = null, sideOpen = null, followVeh = null;
const selBox = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xffe070, wireframe: true, transparent: true, opacity: 0.8 })); selBox.visible = false; scene.add(selBox);
function selectNone() { selected = null; selBox.visible = false; if (sideOpen === 'sel') closeSide(); }
function selectAt(sx, sy, g) {
  const v = g && pickVehicle(g);
  if (v && Math.hypot(v.x - g.x, v.z - g.z) < 8) { selected = { kind: 'veh', obj: v }; openSide('sel'); return; }
  const h = pickAt(sx, sy, g);
  if (!h) { selectNone(); return; }
  selected = h; openSide('sel');
}
function closeSide() { sideOpen = null; $('side').classList.add('hidden'); if (selected) { selected = null; selBox.visible = false; } }
function openSide(k) { sideOpen = k; $('side').classList.remove('hidden'); refreshPanels(); }
function bar(v, col) { return `<div class="bar"><i style="width:${clamp(v, 0, 1) * 100}%;background:${col || 'var(--acc)'}"></i></div>`; }
function row(a, b) { return `<div class="row"><span>${a}</span><span>${b}</span></div>`; }
const FACN = () => ({ mail: L('Posta affidabile', 'Reliable mail'), pow: L('Elettricità', 'Electricity'), wat: L('Acqua', 'Water'), sew: L('Fogne', 'Sewage'), health: L('Sanità', 'Healthcare'), police: L('Sicurezza', 'Safety'), fire: L('Pompieri', 'Fire'), edu: L('Istruzione', 'Education'), park: L('Parchi', 'Parks'), transit: L('Trasporti e internet', 'Transit & internet'), pollution: L('Inquinamento', 'Pollution'), garbage: L('Rifiuti', 'Garbage'), taxes: L('Tasse', 'Taxes'), work: L('Lavoro', 'Jobs'), death: L('Morti da portare via', 'Uncollected dead'), lv: L('Bellezza del quartiere', 'Neighbourhood'), traffic: L('Traffico', 'Traffic') });
function facList(f) { const N = FACN(); return Object.keys(f).filter(k => Math.abs(f[k]) >= 0.5).sort((a, b) => f[a] - f[b]).map(k => `<div class="row"><span>${N[k] || k}</span><span style="color:${f[k] >= 0 ? 'var(--good)' : 'var(--bad)'}">${f[k] > 0 ? '+' : ''}${f[k].toFixed(1)}</span></div>`).join(''); }
function refreshPanels() {
  if (!sideOpen) return;
  const el = $('side'); let h = '';
  const head = t => `<h3>${t}<button class="x" onclick="closeSide()">✕</button></h3>`;
  if (sideOpen === 'sel' && selected) {
    const o = selected.obj;
    if (selected.kind === 'bld') {
      if (!buildings.has(o.id)) { closeSide(); return; }
      const z = ZT[o.zone], c = o.cov || {}, dist = districtOf(o.x, o.z);
      h += head(bldName(o));
      { const a = bldAddr(o); if (a) h += `<div style="font-size:12px;color:var(--mute)">📍 ${a}</div>`; }
      h += `<div style="color:var(--mute);margin-bottom:6px">${z.n()}${o.spec ? ' · ' + { farm: L('campi', 'farm'), forest: L('boschi', 'forest'), oil: L('petrolio', 'oil'), ore: L('minerali', 'ore') }[o.spec] : ''} · ${L('livello', 'level')} ${o.level}${dist ? ' · ' + dist.name : ''}</div>`;
      h += bldExtraHTML(o);
      if (o.ruin) h += `<div style="color:var(--bad)">${L('Distrutto. Le macerie verranno tolte e si ricostruirà.', 'Destroyed. Rubble will be cleared and it will be rebuilt.')}</div>`;
      if (o.aband) h += `<div style="color:var(--bad)">${L('Abbandonato! Manca qualcosa: guarda sotto.', 'Abandoned! Something is missing: see below.')}</div>`;
      if (o.fire) h += `<div style="color:var(--bad)">🔥 ${L('Sta bruciando!', 'On fire!')}</div>`;
      if (o.hh) h += row(L('Famiglie', 'Households'), `${o.occ} / ${o.hh}`) + row(L('Abitanti', 'Residents'), fmtNum(o.occ * 2.6));
      if (o.jobs) { const k = z.k, pr = profitOf(o); h += row(L('Lavoratori', 'Workers'), `${o.occ} / ${o.jobs}`) + row(L('Istruzione richiesta', 'Education needed'), k === 'O' ? L('alta (laurea)', 'high (degree)') : k === 'I' ? L('bassa', 'low') : L('media', 'medium')) + row(L('Redditività', 'Profitability'), pr > 0.66 ? L('guadagna bene', 'profitable') : pr > 0.33 ? L('così così', 'break-even') : L('in perdita', 'losing money')) + bar(pr, pr > 0.5 ? 'var(--good)' : 'var(--bad)');
        if (k === 'I') h += row(L('Produce', 'Produces'), o.spec ? RAWN()[{ farm: 'food', forest: 'wood', oil: 'oil', ore: 'ore' }[o.spec]][1] + ' · ' + fmtNum(Math.round(o.occ * 1.5)) + ' t/' + L('mese', 'mo') : L('merci', 'goods') + ' · ' + fmtNum(Math.round(o.occ)) + ' ' + L('al mese', 'per month'));
        if (k === 'C' || k === 'M') h += row(L('Vende', 'Sells'), TAXPN()[TAXP.C[o.id % TAXP.C.length]]); }
      h += row(L('Felicità', 'Happiness'), Math.round(o.happy) + '%') + bar(o.happy / 100, o.happy > 50 ? 'var(--good)' : 'var(--bad)');
      h += row('⚡ / 💧 / 🚽', `${o.pow ? '✅' : '❌'} ${o.wat ? '✅' : '❌'} ${o.sew ? '✅' : '❌'}`);
      h += row(L('Rifiuti', 'Garbage'), Math.round(o.garb)) + row(L('Criminalità', 'Crime'), Math.round(o.crime) + '%') + row(L('Malati', 'Sick'), o.sick) + (o.dead ? row(L('Morti da portare via', 'Dead to collect'), o.dead) : '');
      if (o.hh) h += row(L('Istruzione media', 'Average education'), Math.round(o.edu * 100) + '%');
      h += row(L('Valore del terreno', 'Land value'), Math.round(LV[gIdx(o.x, o.z)]));
      h += `<div class="sec">${L('Perché sono così felici', 'Why this happiness')}</div>` + (o.fac ? facList(o.fac) : '');
      if (o.hh && o.occ) {
        h += `<div class="sec">${L('Chi ci vive', 'Who lives here')}</div>`;
        const r = mulberry32(o.id * 97);
        for (let i = 0; i < Math.min(4, o.occ); i++) {
          const nm = NAMES_F[Math.floor(r() * NAMES_F.length)] + ' ' + NAMES_P[Math.floor(r() * NAMES_P.length)], age = 4 + Math.floor(r() * 80);
          const job = age < 6 ? L('all\'asilo', 'at preschool') : age < 19 ? L('studente', 'student') : age > 67 ? L('in pensione', 'retired') : r() < stats.unemp ? L('cerca lavoro', 'unemployed') : pick2(r, [L('impiegato', 'office worker'), L('commessa', 'shop assistant'), L('operaio', 'factory worker'), L('infermiere', 'nurse'), L('insegnante', 'teacher'), L('autista', 'driver'), L('cuoco', 'cook'), L('programmatrice', 'programmer')]);
          h += `<div class="row"><span>${nm}, ${age}</span><span>${job} <button title="${L('Segui', 'Follow')}" style="padding:0 5px" onclick="followCitizen(${o.id},'${nm.replace(/'/g, '')}',${age},'${job.replace(/'/g, '')}')">🎥</button></span></div>`;
        }
      }
      h += `<div style="margin-top:10px;display:flex;gap:6px"><button onclick="destroyBuilding(selected.obj);closeSide()">🧨 ${L('Demolisci', 'Demolish')}</button></div>`;
      selBox.visible = true; selBox.position.set(o.x, o.y, o.z); selBox.rotation.y = o.ang; selBox.scale.set(o.cw * CELL, (o.h || 8) + 3, o.cd * CELL);
    } else if (selected.kind === 'svc') {
      if (!svcs.has(o.id)) { closeSide(); return; }
      const d = SV[o.type]; h += head(d.n());
      h += `<div style="color:var(--mute);margin-bottom:6px">${d.d2()}</div>`;
      h += row(L('Mantenimento', 'Upkeep'), fmtMoney((d.upk + extUpk(o)) * S.budget[d.cat] / 100) + '/' + L('mese', 'mo'));
      if (d.p) h += row(L('Produzione', 'Output'), Math.round(d.p) + ' MW');
      if (d.spec) { const rw = stats.raw?.[d.spec.prod]; h += row(L('Risorsa nel recinto', 'Resource in the area'), Math.round((o.res || 0) * 100) + '%') + bar(o.res || 0, '#4cbf5a') + row(L('Produzione', 'Output'), fmtNum(o.prod || 0) + ' t/' + L('mese', 'mo')) + row(L('Posti di lavoro', 'Jobs'), d.jobs) + (rw ? row(RAWN()[d.spec.prod][0] + ' ' + L('In città: prodotto / richiesto', 'City: made / needed'), fmtNum(Math.round(rw.p)) + ' / ' + fmtNum(rw.n)) : ''); }
      if (d.wat) h += row(L('Acqua', 'Water'), fmtNum(d.wat) + ' m³') + row(L('Acqua sporca', 'Polluted water'), Math.round(waterPollAt(o.x + Math.sin(o.ang) * o.d, o.z + Math.cos(o.ang) * o.d)) + '%');
      if (d.sew) h += row(L('Fogne', 'Sewage'), fmtNum(d.sew) + ' m³');
      if (d.store) h += row(L('Riempimento', 'Filled'), Math.round(o.fill / svStore(o) * 100) + '%') + bar(o.fill / svStore(o), 'var(--acc2)');
      if (d.r) h += row(L('Raggio', 'Radius'), d.r + ' m');
      { const ef = svcEff(o); h += row(L('Efficienza', 'Efficiency'), Math.round(ef.e * 100) + '%') + bar(ef.e, ef.e > 0.8 ? 'var(--good)' : ef.e > 0.5 ? 'var(--acc2)' : 'var(--bad)') + ef.why.map(([t, v]) => `<div class="row" style="font-size:12px"><span style="color:var(--mute)">· ${t}</span><span style="color:${v >= 1 ? 'var(--good)' : 'var(--bad)'}">${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}%</span></div>`).join(''); }
      if (d.cap) h += row(d.cat === 'edu' ? L('Studenti', 'Students') : d.cat === 'health' ? L('Pazienti', 'Patients') : L('Persone servite', 'People served'), `${fmtNum(Math.round((o.load || 0) * (d.cat === 'edu' ? 0.25 : d.cat === 'health' ? 0.05 : 1)))} / ${fmtNum(Math.round(d.cap * extMul(o, 'capM') * (d.cat === 'edu' ? 0.25 : d.cat === 'health' ? 0.05 : 1)))}`);
      if (d.cat === 'edu') h += row(L('Diplomati al mese', 'Graduates per month'), fmtNum(Math.round((o.load || 0) * 0.25 * 0.03 * (o.capEff ?? 1))));
      if (d.cat === 'health' && d.cap) h += row('💊 ' + L('Farmaci in magazzino', 'Medicine in stock'), Math.round(o.med ?? 100) + '%') + bar((o.med ?? 100) / 100, (o.med ?? 100) < 20 ? 'var(--bad)' : 'var(--good)');
      if (d.r && d.eff && S.districts.length) h += `<div class="row"><span>${L('Serve solo il quartiere', 'Serves only district')}</span><select onchange="selected.obj.dist=+this.value;covDirty=true;refreshPanels()"><option value="0">${L('Tutta la città', 'Whole city')}</option>${S.districts.map(x => `<option value="${x.id}" ${o.dist === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>`;
      if (SV[o.type].port || o.type === 'cargotrain') h += cargoCard(o);
      if (SV[o.type].port || o.type === 'harbor') h += `<div class="row"><span>🧭 ${L('Rotta delle navi', 'Ship route')}: ${o.route ? L('disegnata da te', 'drawn by you') : L('automatica', 'automatic')}</span><span><button onclick="startShipRoute(selected.obj)">✏️ ${L('Disegna', 'Draw')}</button>${o.route ? `<button onclick="selected.obj.route=null;selected.obj.dock=findDock(selected.obj);refreshPanels()">↺</button>` : ''}</span></div>`;
      if (o.seg == null && !d.free && o.type !== 'metro') h += `<div style="color:var(--bad)">${L('Non tocca una strada', 'Not connected to a road')}</div>`;
      if (o.type === 'train' || o.type === 'cargotrain') h += trainYard(o);
      h += svcExtraHTML(o);
      if (EXT[o.type]) h += `<div class="sec">🏗️ ${L('Ampliamenti', 'Extensions')}</div>` + EXT[o.type].map(e => o.ext.includes(e.k) ? row(e.n(), '✅') : `<div class="row"><span>${e.n()}<br><small style="color:var(--mute)">+${fmtMoney(e.upk)}/${L('mese', 'mo')}</small></span><button onclick="buyExt(${o.id},'${e.k}',${e.cost})">${fmtMoney(e.cost)}</button></div>`).join('');
      if (o.type === 'harbor') h += row('🛳️ ' + L('Navi da crociera in porto', 'Cruise ships docked'), stats.cruise || 0);
      h += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button onclick="selected.obj.on=!selected.obj.on;drawSvc(selected.obj);netDirty=covDirty=true;refreshPanels()">${o.on ? '⏸ ' + L('Spegni', 'Turn off') : '▶ ' + L('Accendi', 'Turn on')}</button>${d.store === SV.landfill.store && o.type === 'landfill' ? `<button onclick="selected.obj.fill=Math.max(0,selected.obj.fill-20000);toast('${L('Svuotata in parte (costa 8.000 €)', 'Partly emptied (costs €8,000)')}');spend(8000);refreshPanels()">🚛 ${L('Svuota', 'Empty')}</button>` : ''}<button onclick="moveSvc(selected.obj)">✥ ${L('Sposta', 'Move')}</button><button onclick="bulldozeSel()">🧨 ${L('Demolisci', 'Demolish')}</button></div>`;
      selBox.visible = true; selBox.position.set(o.x, o.y, o.z); selBox.rotation.y = o.ang; selBox.scale.set(o.w, (d.h || 12) + 3, o.d);
    } else if (selected.kind === 'veh') {
      if (!vehicles.has(o)) { closeSide(); return; }
      const names = { car: L('Auto', 'Car'), taxi: 'Taxi', truck: L('Camion', 'Truck'), van: L('Furgone', 'Van'), bus: L('Autobus', 'Bus'), tram: 'Tram', garbage: L('Camion dei rifiuti', 'Garbage truck'), ambulance: L('Ambulanza', 'Ambulance'), hearse: L('Carro funebre', 'Hearse'), police: L('Polizia', 'Police'), fire: L('Pompieri', 'Fire truck'), maint: L('Spazzaneve', 'Snowplow'), train: L('Treno', 'Train'), cargotrain: L('Treno merci', 'Cargo train') };
      h += head(names[o.kind] || o.kind);
      h += row(L('Velocità', 'Speed'), Math.round(o.v * 3.6) + ' km/h') + row(L('Strada', 'Road'), RT[o.legs[o.li]?.e.seg.type]?.n() || '');
      if (o.cit) h += `<div class="sec">👤 ${o.cit.name}</div>` + row(L('Età', 'Age'), o.cit.age) + row(L('Lavoro', 'Job'), o.cit.job) + row(L('Abita in', 'Lives at'), o.cit.addr) + row(L('Sta andando', 'Going'), o.cit.goal); if (o.cit) h += diaryHTML(o.cit);
      if (o.line != null) { const ln = lines.find(l => l.id === o.line); h += row(L('Linea', 'Line'), ln?.name || '') + row(L('Passeggeri', 'Passengers'), o.pax || 0); }
      if (o.crash > 0) h += `<div style="color:var(--bad)">${L('Incidente! Aspetta i soccorsi.', 'Accident! Waiting for help.')}</div>`;
      h += `<div style="margin-top:10px"><button onclick="followVeh=followVeh?null:selected.obj;refreshPanels()">${followVeh === o ? L('Smetti di seguire', 'Stop following') : '🎥 ' + L('Segui', 'Follow')}</button></div>`;
    } else if (selected.kind === 'seg') {
      if (!segs.has(o.id)) { closeSide(); return; }
      let cars = 0; for (const e of o.edges) for (const l of e.cars) cars += l.length;
      h += head(RT[o.type].n()) + row(L('Lunghezza', 'Length'), Math.round(o.len) + ' m') + row(L('Veicoli ora', 'Vehicles now'), cars) + row(L('Velocità massima', 'Speed limit'), Math.round(RT[o.type].speed * 3.6) + ' km/h');
      if (!RT[o.type].rail && !RT[o.type].ped && !RT[o.type].hw) h += `<div class="sec">${L('Tram', 'Tram')}</div><button onclick="toggleTram(${o.id})">🚋 ${o.tram ? L('Togli i binari del tram', 'Remove tram tracks') : L('Binari del tram su questa strada', 'Tram tracks on this road') + ' · ' + fmtMoney(Math.round(o.len * 40))}</button>`;
      if (RT[o.type].two && RT[o.type].lanes >= 2 && RT[o.type].zone) h += `<div class="sec">${L('Autobus', 'Buses')}</div><button onclick="toggleBusLane(${o.id})">🚌 ${o.busLane ? L('Togli le corsie riservate', 'Remove bus lanes') : L('Corsie riservate ai bus', 'Add bus lanes') + ' · ' + fmtMoney(Math.round(o.len * 15))}</button>`;
      if (RT[o.type].hw || o.type === 'large' || RT[o.type].rail) h += `<div class="sec">${L('Rumore', 'Noise')}</div><button onclick="toggleBarrier(${o.id})">${o.barrier ? '🧱 ' + L('Togli barriere antirumore', 'Remove noise barriers') : '🧱 ' + L('Metti barriere antirumore', 'Add noise barriers') + ' · ' + fmtMoney(Math.round(o.len * 40))}</button><div style="font-size:12px;color:var(--mute)">${L('Muri ai lati: -70% rumore della strada', 'Side walls: -70% road noise')}</div>`;
      if (!RT[o.type].rail && !RT[o.type].ped) h += segExtraHTML(o);
      h += `<div class="sec">${L('Cambia tipo', 'Change type')}</div><div style="display:flex;gap:4px;flex-wrap:wrap">` + Object.keys(RT).filter(k => !RT[k].rail && !RT[k].ped && k !== o.type && unlocked(RT[k].ms) && !RT[o.type].rail).map(k => `<button onclick="upgradeSeg(${o.id},'${k}')">${RT[k].n()}</button>`).join('') + `<button onclick="reverseSeg(${o.id})">⇄ ${L('Inverti senso', 'Reverse')}</button></div>`;
    }
  } else if (sideOpen === 'stats') {
    h += head('📊 ' + L('Statistiche', 'Statistics'));
    h += citizensHTML();
    h += row(L('Abitanti', 'Population'), fmtNum(stats.pop)) + row(L('Famiglie', 'Households'), fmtNum(stats.hh)) + row(L('Lavoratori', 'Workforce'), fmtNum(stats.workforce)) + row(L('Posti di lavoro', 'Jobs'), fmtNum(stats.jobs)) + row(L('Pendolari da fuori', 'Commuters from outside'), fmtNum(stats.commuters || 0)) + row(L('Disoccupazione', 'Unemployment'), Math.round(stats.unemp * 100) + '%') + `<div style="font-size:12px;color:var(--mute);margin:2px 0 6px">${stats.unemp < 0.07 ? L('Sotto il 10%: servono più abitanti, aggiungi case.', 'Below 10%: you need more people, add housing.') : stats.unemp > 0.13 ? L('Sopra il 10%: servono posti di lavoro (uffici, negozi, industria).', 'Above 10%: you need jobs (offices, shops, industry).') : L('Intorno al 10%: va bene così.', 'Around 10%: that is fine.')}</div>`;
    h += row(L('Turisti al mese', 'Tourists per month'), fmtNum(stats.tourists)) + row(L('Attrattività', 'Attractiveness'), Math.round(stats.attr)) + row(L('Passeggeri mezzi pubblici', 'Transit riders'), fmtNum(stats.riders)) + row(L('Uso dei mezzi pubblici', 'Transit share'), Math.round(stats.transitShare * 100) + '%') + row(L('Traffico (ingorghi)', 'Congestion'), Math.round(stats.congestion * 100) + '%') + row(L('Veicoli in strada', 'Vehicles on roads'), vehicles.size) + row(L('Incidenti', 'Accidents'), stats.accidents);
    h += `<div class="sec">${L('Età', 'Age')}</div>` + [L('Bambini', 'Children'), L('Ragazzi', 'Teens'), L('Adulti', 'Adults'), L('Anziani', 'Seniors')].map((n, i) => row(n, Math.round(stats.ages[i] * 100) + '%')).join('') + row(L('Nascite / morti al mese', 'Births / deaths per month'), `${stats.births} / ${stats.deaths}`);
    const te = stats.edu.reduce((a, b) => a + b, 0) || 1;
    h += `<div class="sec">${L('Istruzione', 'Education')}</div>` + [L('Nessuna', 'None'), L('Elementari', 'Elementary'), L('Superiori', 'High school'), L('Università', 'University')].map((n, i) => row(n, Math.round(stats.edu[i] / te * 100) + '%')).join('');
    h += `<div class="sec">${L('Servizi', 'Utilities')}</div>` + row('⚡ ' + L('Elettricità', 'Electricity'), `${Math.round(NET.cityPow.use)} / ${Math.round(NET.cityPow.prod)} MW`) + bar(NET.cityPow.use / Math.max(1, NET.cityPow.prod), NET.cityPow.use > NET.cityPow.prod ? 'var(--bad)' : 'var(--good)') + row('💧 ' + L('Acqua', 'Water'), `${fmtNum(NET.cityWat.use)} / ${fmtNum(NET.cityWat.prod)} m³`) + bar(NET.cityWat.use / Math.max(1, NET.cityWat.prod), NET.cityWat.use > NET.cityWat.prod ? 'var(--bad)' : 'var(--good)') + row('🚽 ' + L('Fogne', 'Sewage'), `${fmtNum(NET.citySew.use)} / ${fmtNum(NET.citySew.prod)} m³`) + bar(NET.citySew.use / Math.max(1, NET.citySew.prod), NET.citySew.use > NET.citySew.prod ? 'var(--bad)' : 'var(--good)');
    h += row(L('Merci prodotte / richieste', 'Goods produced / needed'), `${fmtNum(stats.goodsP)} / ${fmtNum(stats.goodsC)}`) + row(L('Malati', 'Sick'), stats.sick) + row(L('Morti da portare via', 'Uncollected dead'), stats.dead);
    h += `<div class="sec">${L('Felicità: cosa pesa di più', 'Happiness: what matters most')}</div>` + facList(stats.fac || {});
    if (S.districts.length) { h += `<div class="sec">${L('Quartieri', 'Districts')}</div>`; for (const d of S.districts) { let p = 0; for (const b of buildings.values()) if (b.hh && distGrid[gIdx(b.x, b.z)] === d.id) p += b.occ * 2.6; h += row(d.name, fmtNum(p) + ' ' + L('ab.', 'pop.')); } }
    h += `<div class="sec">${L('Storico', 'History')}</div>` + chart();
  } else if (sideOpen === 'budget') {
    const bg = budgetNow(); h += head('💶 ' + L('Bilancio mensile', 'Monthly budget'));
    const I = bg.inc, E = bg.exp;
    { const IN = [[L('Tasse case', 'Residential tax'), I.res], [L('Tasse negozi', 'Commercial tax'), I.com], [L('Tasse industria', 'Industrial tax'), I.ind], [L('Tasse uffici', 'Office tax'), I.off], [L('Tariffe dei servizi', 'Service fees'), I.fees], [L('Contributo del governo', 'Government subsidy'), I.subsidy], [L('Turismo', 'Tourism'), I.tour], [L('Biglietti', 'Tickets'), I.transit], [L('Vendita luce/acqua', 'Power/water sales'), I.trade], [L('Vendita merci', 'Goods export'), I.goods], [L('Parcheggi', 'Parking'), I.parking]];
      const EX = [[L('Servizi', 'Services'), E.services], [L('Strade', 'Roads'), E.roads], [L('Mezzi pubblici', 'Transit vehicles'), E.lines], [L('Acquisti da fuori', 'Imports'), E.import], [L('Prestiti', 'Loans'), E.loans], [L('Politiche', 'Policies'), E.policies]];
      const mx = Math.max(1, ...IN.map(x => x[1]), ...EX.map(x => x[1])), col = (list, c, tot, t) => `<div style="flex:1;min-width:0"><div style="color:${c};font-weight:700;font-size:12px;text-transform:uppercase">${t}</div><div style="font-size:17px;font-weight:700;color:${c}">${fmtMoney(tot)}</div>` + list.filter(x => x[1] >= 1).map(([a, b]) => `<div style="font-size:11.5px;margin-top:3px"><div style="display:flex;justify-content:space-between;gap:4px"><span style="color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a}</span><span>${fmtMoney(b)}</span></div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px"><i style="display:block;height:5px;border-radius:3px;width:${b / mx * 100}%;background:${c}"></i></div></div>`).join('') + '</div>';
      h += `<div style="display:flex;gap:10px;margin-top:4px">${col(IN, 'var(--good)', bg.ti, L('Entrate', 'Income'))}${col(EX, 'var(--bad)', bg.te, L('Uscite', 'Expenses'))}</div>`; }
    h += row('<b>' + L('Saldo', 'Balance') + '</b>', `<b style="color:${bg.net >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtMoney(bg.net)}</b>`);
    h += `<div class="sec">${L('Tasse', 'Taxes')}</div>` + ['R', 'C', 'I', 'O'].map(k => `<div class="slider"><span>${{ R: L('Case', 'Residential'), C: L('Negozi', 'Commercial'), I: L('Industria', 'Industrial'), O: L('Uffici', 'Offices') }[k]}</span><input id="tax${k}" type="range" min="-10" max="30" value="${S.tax[k]}" oninput="S.tax.${k}=+this.value;this.nextElementSibling.textContent=this.value+'%'"><span>${S.tax[k]}%</span></div>`).join('') + `<div style="font-size:12px;color:var(--mute);margin-top:4px">${L('Case: correzione per istruzione degli abitanti', 'Residential: adjustment by education')}</div>` + [['lo', L('Senza diploma', 'No diploma')], ['mid', L('Diplomati', 'High school')], ['hi', L('Laureati', 'Graduates')]].map(([k, n]) => { const T = S.taxE || (S.taxE = { lo: 0, mid: 0, hi: 0 }); return `<div class="slider"><span>${n}</span><input type="range" min="-10" max="10" value="${T[k]}" oninput="S.taxE.${k}=+this.value;this.nextElementSibling.textContent=(this.value>0?'+':'')+this.value+'%'"><span>${T[k] > 0 ? '+' : ''}${T[k]}%</span></div>`; }).join('');
    h += `<details style="margin-top:6px"><summary style="cursor:pointer;color:var(--acc2)">${L('Tasse per prodotto', 'Taxes by product')}</summary>` + ['C', 'I'].map(k => `<div style="font-weight:700;margin-top:4px">${k === 'C' ? L('Negozi', 'Commercial') : L('Industria', 'Industrial')} · ${L('effettiva', 'effective')} ${taxEff(k).toFixed(1)}%</div>` + TAXP[k].map(p => `<div class="slider"><span>${TAXPN()[p]}</span><input type="range" min="-10" max="10" value="${taxP()[k][p]}" oninput="taxP().${k}.${p}=+this.value;this.nextElementSibling.textContent=(this.value>0?'+':'')+this.value+'%'"><span>${taxP()[k][p] > 0 ? '+' : ''}${taxP()[k][p]}%</span></div>`).join('')).join('') + `</details>`;
    h += `<div class="sec">${L('Tariffe dei servizi', 'Service fees')}</div>` + Object.keys(FEES).map(k => `<div class="slider"><span>${FEES[k][1]} ${CAT[k].n()}</span><input type="range" min="0" max="200" step="10" value="${fees()[k]}" oninput="fees().${k}=+this.value;this.nextElementSibling.textContent=this.value+'%'"><span>${fees()[k]}%</span></div>`).join('') + `<div style="font-size:12px;color:var(--mute)">${L('Quanto pagano i cittadini. Tariffe alte = più entrate ma cittadini meno felici.', 'What citizens pay. High fees = more income but less happy citizens.')}</div>`;
    h += `<div class="sec">${L('Budget dei servizi', 'Service budgets')}</div>` + Object.keys(CAT).map(k => `<div class="slider"><span>${CAT[k].i} ${CAT[k].n()}</span><input id="bud${k}" type="range" min="50" max="150" step="5" value="${S.budget[k]}" oninput="S.budget.${k}=+this.value;this.nextElementSibling.textContent=this.value+'%';netDirty=covDirty=true"><span>${S.budget[k]}%</span></div>`).join('');
    h += budgetEffHTML();
    h += `<div style="color:var(--mute);font-size:12px">${L('Più budget = più copertura e più spesa', 'More budget = more coverage and higher cost')}</div>`;
    h += `<div class="sec">${L('Prestiti', 'Loans')}</div>` + S.loans.map(l => row(fmtMoney(l.amt), fmtMoney(l.pay) + '/' + L('mese', 'mo') + ' · ' + l.left + ' ' + L('mesi', 'months'))).join('') + row(L('Limite prestiti (cresce coi traguardi)', 'Loan limit (grows with milestones)'), fmtMoney(loanLimit())) + (loanFree() >= 10000 ? `<div class="slider"><span>${L('Cifra', 'Amount')}</span><input id="loanAmt" type="range" min="10000" max="${loanFree()}" step="10000" value="${Math.min(100000, loanFree())}" oninput="loanUI(this.value)"></div><div id="loanTxt" style="font-size:12.5px;margin:2px 0 6px"></div><button onclick="takeLoanSlider()">🏦 ${L('Chiedi il prestito', 'Take the loan')}</button><div style="font-size:12px;color:var(--mute)">${L('Più chiedi, più alto è il tasso. Il consiglio è di evitarli.', 'The more you borrow, the higher the rate. Best avoided.')}</div>` : `<div style="color:var(--mute)">${L('Hai raggiunto il limite dei prestiti', 'Loan limit reached')}</div>`) + (budgetNow().net < 0 ? `<div style="color:var(--bad);font-weight:600;margin-top:4px">⚠ ${L('Il bilancio è in deficit', 'The budget is in deficit')}</div>` : '');
    h += econExtraHTML();
    h += `<div class="sec">${L('Scambi con l\'esterno', 'Outside trade')}</div><label class="row"><span>${L('Vendi e compra luce e acqua dove la rete tocca l\'autostrada esterna', 'Buy and sell power and water where the grid touches the outside highway')}</span><input type="checkbox" ${S.trade ? 'checked' : ''} onchange="S.trade=this.checked;netDirty=true"></label>` + row(L('Elettricità', 'Power'), `${Math.round(NET.trade.pow || 0)} MW`) + row(L('Acqua', 'Water'), `${fmtNum(NET.trade.wat || 0)} m³`);
  } else if (sideOpen === 'progress') {
    h += head('🏆 ' + L('Progressi', 'Progress'));
    h += MS.map((m, i) => `<div class="row" style="${i === S.ms ? 'color:var(--acc2);font-weight:700' : i < S.ms ? '' : 'opacity:.55'}"><span style="color:inherit">${i <= S.ms ? '✅' : '⬜'} ${m.n()}</span><span>${fmtNum(m.pop)} XP</span></div>`).join('') + row(L('I tuoi XP', 'Your XP'), fmtNum(cityXP())) + `<div style="font-size:12px;color:var(--mute)">${L('Gli XP vengono dagli abitanti e da ciò che costruisci: parchi +100, monumenti +4.000, edifici firma +500.', 'XP comes from population and from what you build: parks +100, landmarks +4,000, signature buildings +500.')}</div>`;
    { const open = GOALS.filter(g => !(S.goals || []).includes(g.id)).slice(0, 5); h += `<div class="sec">🎯 ${L('Obiettivi', 'Goals')} (${(S.goals || []).length}/${GOALS.length})</div>` + (open.length ? open.map(g => { const [a, b] = g.v(); return `<div style="margin:4px 0"><div class="row"><span style="color:var(--fg)">${g.n()}</span><span>+${fmtNum(g.xp)} XP</span></div>${bar(a / b, 'var(--acc2)')}<div style="font-size:11px;color:var(--mute);text-align:right">${fmtNum(Math.min(a, b))} / ${fmtNum(b)}</div></div>`; }).join('') : `<div style="color:var(--good)">${L('Tutti completati!', 'All done!')}</div>`); }
    h += achHTML();
    h += `<div class="sec">🌳 ${L('Albero di sviluppo', 'Development tree')} · ${L('punti', 'points')}: ${S.dev} ⭐</div><div style="font-size:12px;color:var(--mute);margin-bottom:4px">${L('Ogni traguardo dà punti. Spendili per sbloccare edifici, strade e miglioramenti.', 'Each milestone gives points. Spend them to unlock buildings, roads and upgrades.')}</div>`;
    for (const c in TREE_CATS) { const ns = TREE.filter(t => t.cat === c); if (!ns.length) continue; h += `<div style="margin-top:6px;font-weight:700">${TREE_CATS[c].i} ${TREE_CATS[c].n()}</div>`;
      for (const t of ns) { const own = UPG.has(t.id) || S.opts.unlockAll, can = !own && S.dev >= t.cost && (!t.req || UPG.has(t.req)); h += `<div class="row" style="${t.req ? 'padding-left:16px' : ''}"><span style="color:var(--fg)">${t.req ? '└ ' : ''}${t.n()}${t.items ? ' <small style="color:var(--mute)">(' + L('sblocca', 'unlocks') + ')</small>' : ''}</span>${own ? '✅' : `<button ${can ? '' : 'disabled'} onclick="buyNode('${t.id}')">${t.cost} ⭐</button>`}</div>`; } }
    h += `<div class="sec">${L('Terreno', 'Land')}</div>` + row(L('Caselle tue', 'Tiles owned'), `${TILES.reduce((a, b) => a + b, 0)} / ${tilesAllowed()} ${L('possibili ora', 'allowed now')}`) + row(L('Area di una casella', 'Tile area'), '1,64 km²') + `<button onclick="setTool('buy');closeSide()">🗺️ ${L('Compra caselle sulla mappa', 'Buy tiles on the map')}</button>`;
  } else if (sideOpen === 'district') {
    const d = S.districts.find(x => x.id === TOOL.distSel);
    if (!d) h += head(L('Quartiere', 'District')); else {
      const r = districtStats(d.id), nb = Math.max(1, r.nb), pc = v => Math.round(v / nb * 100) + '%';
      h += head('🗺️ ' + d.name) + `<div class="row"><input type="text" value="${d.name.replace(/"/g, '&quot;')}" maxlength="30" onchange="S.districts.find(x=>x.id===${d.id}).name=this.value.trim()||'?';refreshPanels()" style="flex:1;background:rgba(255,255,255,.1);border:1px solid var(--line);color:var(--fg);padding:5px;border-radius:6px"><input type="color" value="#${d.col.toString(16).padStart(6, '0')}" onchange="S.districts.find(x=>x.id===${d.id}).col=parseInt(this.value.slice(1),16);infoDirty=true" style="width:34px;height:26px;padding:0;border:0;background:none"></div>`;
      h += row(L('Superficie', 'Area'), (r.cells * GC * GC / 1e6).toFixed(2) + ' km²') + row('👥 ' + L('Abitanti', 'Residents'), fmtNum(Math.round(r.pop))) + row('🏠 ' + L('Famiglie', 'Households'), fmtNum(r.hh)) + row('💼 ' + L('Posti di lavoro', 'Jobs'), `${fmtNum(r.work)} / ${fmtNum(r.jobs)}`) + row('🏢 ' + L('Edifici', 'Buildings'), r.nb) + row('🏛️ ' + L('Servizi', 'Services'), r.svc);
      if (r.hh) { const hp = r.happy / r.hh; h += row('🙂 ' + L('Felicità', 'Happiness'), Math.round(hp) + '%') + bar(hp / 100, hp > 60 ? 'var(--good)' : 'var(--bad)'); }
      h += row('💎 ' + L('Valore del terreno', 'Land value'), Math.round(r.lv / Math.max(1, r.cells)));
      h += `<div class="sec">${L('Servizi coperti', 'Service coverage')}</div>` + [['health', '🏥', L('Salute', 'Health')], ['police', '🚓', L('Polizia', 'Police')], ['fire', '🚒', L('Pompieri', 'Fire')], ['edu1', '🎓', L('Scuola', 'School')], ['park', '🌳', L('Parchi', 'Parks')], ['garb', '🗑️', L('Rifiuti', 'Garbage')], ['transit', '🚌', L('Mezzi pubblici', 'Transit')]].map(([k, i, n]) => row(i + ' ' + n, pc(r.cov[k]))).join('');
      h += `<div class="sec"></div><button onclick="focusDistrict(${d.id})">🔍 ${L('Trova', 'Find')}</button> <button onclick="if(this.dataset.c){delDistrict(${d.id})}else{this.dataset.c=1;this.textContent='${L('Sicuro?', 'Sure?')}'}">🗑 ${L('Elimina quartiere', 'Delete district')}</button>`;
    }
  } else if (sideOpen === 'radio') {
    h += head('📻 ' + L('Radio della città', 'City radio'));
    h += RADIO_CH().map((n, i) => `<button class="item ${RADIO.ch === i ? 'on' : ''}" style="width:100%;margin:3px 0" onclick="radioSet(${i})"><span class="n">${n}</span></button>`).join('');
    h += `<div class="slider"><span>${L('Volume', 'Volume')}</span><input type="range" min="0" max="1" step="0.05" value="${RADIO.vol}" oninput="RADIO.vol=+this.value;if(RADIO.g&&RADIO.ch===1)RADIO.g.gain.value=RADIO.vol*0.25"><span></span></div>`;
    if (RADIO.ch === 2 && RADIO.cur) h += `<div class="sec">${L('In onda', 'On air')}</div><div style="font-size:13px;line-height:1.4">🎙️ ${RADIO.cur}</div>`;
    h += `<div style="font-size:11px;color:var(--mute);margin-top:8px">${L('Le notizie parlano di quello che succede nella tua città.', 'The news talks about what happens in your city.')}</div>`;
  } else if (sideOpen === 'tile') {
    const i = TOOL.tileSel ?? 0, tx = i % NT, tz = Math.floor(i / NT), x0 = -HALF + tx * TILE, z0 = -HALF + tz * TILE;
    let f = 0, fo = 0, o = 0, r = 0, g = 0, fl = 0, n = 0;
    for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) { const x = x0 + (a + 0.5) / 16 * TILE, z = z0 + (b + 0.5) / 16 * TILE; n++; if (isWater(x, z)) continue; const k = gIdx(x, z); f += RES.fert[k]; fo += RES.forest[k]; o += RES.oil[k]; r += RES.ore[k]; g += RES.gw[k]; if (slopeAt(x, z) < 0.08) fl++; }
    const w = tileWater(i), pc = v => Math.round(v / n * 100) + '%', own = TILES.reduce((a, b) => a + b, 0);
    h += head('🗺️ ' + L('Casella', 'Tile') + ' ' + String.fromCharCode(65 + tx) + (tz + 1));
    h += row(L('Superficie', 'Area'), (TILE * TILE / 1e6).toFixed(2) + ' km²') + row('🌊 ' + L('Acqua', 'Water'), Math.round(w * 100) + '%') + row('🏗️ ' + L('Terra piana per costruire', 'Flat buildable land'), pc(fl));
    h += `<div class="sec">${L('Risorse naturali', 'Natural resources')}</div>` + row('🌾 ' + L('Terra fertile', 'Fertile land'), pc(f)) + row('🌲 ' + L('Boschi', 'Forest'), pc(fo)) + row('🛢️ ' + L('Petrolio', 'Oil'), pc(o)) + row('⛏️ ' + L('Minerali', 'Ore'), pc(r)) + row('💧 ' + L('Acqua sotto terra', 'Groundwater'), pc(g));
    h += `<div class="sec">${L('Acquisto', 'Purchase')}</div>`;
    if (TILES[i]) h += `<div style="color:var(--good)">✓ ${L('Questa casella è tua', 'You own this tile')}</div>`;
    else { h += row(L('Prezzo', 'Price'), fmtMoney(tileCost(i))) + row(L('Caselle comprate', 'Tiles bought'), `${own} / ${tilesAllowed()}`);
      h += tileBuyable(i) ? `<button class="big" onclick="buyTile(${i});refreshPanels()">💰 ${L('Compra questa casella', 'Buy this tile')}</button>` : `<div style="color:var(--bad)">${L('Puoi comprare solo caselle vicine alle tue', 'You can only buy tiles next to yours')}</div>`; }
  } else if (sideOpen === 'production') {
    h += head('🏭 ' + L('Produzione', 'Production'));
    const box = (t, v, c) => `<div style="flex:1;background:rgba(255,255,255,.06);border:1px solid ${c || 'rgba(255,255,255,.15)'};border-radius:8px;padding:5px 6px;font-size:12px;text-align:center">${t}<br><b>${v}</b></div>`, arr = '<div style="align-self:center;color:var(--acc2);font-size:18px">→</div>';
    h += `<div style="font-size:12px;color:var(--mute);margin-bottom:6px">${L('Materie prime → industria → merci → negozi. Quello che manca si compra da fuori, quello che avanza si vende.', 'Raw materials → industry → goods → shops. What is missing is imported, the extra is sold.')}</div>`;
    const R = stats.raw || {}, N = RAWN();
    for (const k of RAWK) { const r = R[k] || { p: 0, n: 0 }, ok = r.p >= r.n; h += `<div style="display:flex;gap:4px;margin:5px 0">${box(N[k][0] + ' ' + N[k][1], fmtNum(Math.round(r.p)) + ' t', ok ? '#4cbf5a' : '#e35d4f')}${arr}${box(L('Richiesto', 'Needed'), fmtNum(r.n) + ' t')}${arr}${box(r.p === r.n ? L('In pari', 'Balanced') : ok ? L('Avanza: si vende', 'Extra: sold') : L('Manca: si compra', 'Missing: imported'), fmtNum(Math.abs(Math.round(r.p - r.n))) + ' t', ok ? '#4cbf5a' : '#e35d4f')}</div>`; }
    const gs = stats.goodsP - stats.goodsC;
    h += `<div class="sec">${L('Merci', 'Goods')}</div><div style="display:flex;gap:4px">${box('🏭 ' + L('Industria', 'Industry'), fmtNum(Math.round(stats.goodsP)))}${arr}${box('🛒 ' + L('Negozi e cittadini', 'Shops & citizens'), fmtNum(Math.round(stats.goodsC)))}${arr}${box(gs >= 0 ? L('Esportate', 'Exported') : L('Importate', 'Imported'), fmtNum(Math.abs(Math.round(gs))), gs >= 0 ? '#4cbf5a' : '#e35d4f')}</div>`;
    h += `<div style="margin-top:8px"><button onclick="openCat='spec';buildToolbar()">🌾 ${L('Costruisci industria specializzata', 'Build specialized industry')}</button></div>`;
  } else if (sideOpen === 'policies') {
    h += head('📜 ' + L('Politiche della città', 'City policies'));
    h += POLICIES.map(p => `<label class="row" style="align-items:center"><span style="color:var(--fg)"><b>${p.n()}</b><br><small style="color:var(--mute)">${p.d()}</small></span><input type="checkbox" ${S.policies[p.id] ? 'checked' : ''} onchange="S.policies['${p.id}']=this.checked;netDirty=true"></label>`).join('');
  } else if (sideOpen === 'demand') {
    h += head('📶 ' + L('Domanda', 'Demand'));
    const dm = stats.demand, why = dm.why || {}, nm = { R: L('Case', 'Housing'), C: L('Negozi', 'Shops'), I: L('Industria', 'Industry'), O: L('Uffici', 'Offices') }, cols = { R: '#5cc25a', C: '#5aa2e6', I: '#e3c03e', O: '#b07ae6' };
    for (const k of ['R', 'C', 'I', 'O']) {
      h += `<div class="sec" style="display:flex;justify-content:space-between"><span>${nm[k]}</span><span>${Math.round(dm[k])}%</span></div><div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px"><div style="height:8px;width:${dm[k]}%;background:${cols[k]};border-radius:4px"></div></div>`;
      h += (why[k] || []).filter(x => Math.abs(x[1]) >= 0.5).map(([n, v]) => `<div class="row"><span>${n}</span><span style="color:${v >= 0 ? 'var(--good)' : 'var(--bad)'}">${v > 0 ? '▲' : '▼'}</span></div>`).join('');
    }
    h += `<div style="font-size:12px;color:var(--mute);margin-top:8px">${L('Disoccupazione', 'Unemployment')} ${Math.round(stats.unemp * 100)}% · ${L('obiettivo 5-10%', 'target 5-10%')}</div>`;
  } else if (sideOpen === 'lines') {
    h += head('🚌 ' + L('Linee di trasporto', 'Transit lines'));
    if (!lines.length) h += `<div style="color:var(--mute)">${L('Nessuna linea. Usa il pulsante 🚏 in basso per crearne una.', 'No lines yet. Use the 🚏 button below to create one.')}</div>`;
    if (lines.length) h += `<table class="ltab"><tr><th></th><th>${L('Linea', 'Line')}</th><th>${L('Fermate', 'Stops')}</th><th>${L('Uso', 'Usage')}</th><th></th></tr>` + lines.map(ln => `<tr><td><i style="background:${lnHex(ln)}"></i></td><td>${ln.name}</td><td>${lineStops(ln).length}</td><td>${lineUse(ln)}%</td><td><button title="${L('Mostra/nascondi', 'Show/hide')}" onclick="lnSet(${ln.id},'hide',!lnGet(${ln.id}).hide);redrawLines()">${ln.hide ? '🙈' : '👁'}</button><button title="${L('Trova', 'Find')}" onclick="findLine(${ln.id})">🔍</button><button title="${L('Elimina', 'Delete')}" onclick="lines=lines.filter(l=>l.id!==${ln.id});redrawLines();refreshPanels()">🗑</button></td></tr>`).join('') + '</table>';
    for (const ln of lines) {
      const mods = LMOD[ln.kind] || [], st = ln.stops;
      h += `<div style="border-left:5px solid ${lnHex(ln)};padding-left:8px;margin:12px 0"><div class="row"><b>${ln.name}</b><input type="color" value="${lnHex(ln)}" title="${L('Colore', 'Colour')}" onchange="lnSet(${ln.id},'col',parseInt(this.value.slice(1),16));redrawLines()" style="width:34px;height:22px;padding:0;border:0;background:none"></div>${ln.ok ? '' : '<span style="color:var(--bad)">⚠ ' + (!lineRuns(ln) && !ln.off ? L('ferma di notte', 'stopped at night') : L('non funziona', 'not working')) + '</span>'}` +
        `<div class="lschema" style="--lc:${lnHex(ln)}">${st.map((s, i) => `<span class="${s.wp ? 'wp' : ''}"><i></i><em>${s.wp ? '' : (s.svc ? (svcs.get(s.svc)?.name || SV[svcs.get(s.svc)?.type]?.n() || '') : streetName(segs.get(s.seg)) || '')}</em></span>`).join('')}<span class="back">↺</span></div>` +
        row(L('Fermate', 'Stops'), lineStops(ln).length + (st.length > lineStops(ln).length ? ` + ${st.length - lineStops(ln).length} ◆` : '')) + row(L('Passeggeri all\'ora', 'Riders per hour'), fmtNum(ln.riders)) + row(L('Uso', 'Usage'), `<b style="color:${lineUse(ln) > 100 ? 'var(--bad)' : lineUse(ln) > 70 ? 'var(--acc2)' : 'var(--good)'}">${lineUse(ln)}%</b>`) +
        `<label class="row"><span>${L('Linea attiva', 'Line active')}</span><input type="checkbox" ${ln.off ? '' : 'checked'} onchange="lnSet(${ln.id},'off',!this.checked);refreshPanels()"></label>` + (lineUse(ln) > 100 ? `<div style="font-size:12px;color:var(--bad)">${L('Troppo piena: aggiungi mezzi', 'Too full: add vehicles')}</div>` : '') +
        (mods.length ? `<div class="row"><span>${L('Modello del mezzo', 'Vehicle model')}</span><select onchange="lnSet(${ln.id},'model',+this.value);refreshPanels()">${mods.map((m, i) => `<option value="${i}" ${(ln.model || 0) === i ? 'selected' : ''}>${m.n()} · ${Math.round(LK[ln.kind].cap * m.cap)} ${L('posti', 'seats')}</option>`).join('')}</select></div>` : '') +
        `<div class="row"><span>${L('Orario', 'Schedule')}</span><select onchange="lnSet(${ln.id},'sched',+this.value);refreshPanels()">${LSCHED().map((t, i) => `<option value="${i}" ${(ln.sched || 0) === i ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` +
        row(L('Costo al mese', 'Cost per month'), fmtMoney(Math.round(ln.nveh * LK[ln.kind].upk * lineMod(ln).upk * (ln.sched ? 0.7 : 1)))) +
        `<div class="slider"><span>${L('Mezzi', 'Vehicles')}</span><input id="lnv${ln.id}" type="range" min="1" max="${maxVeh(ln)}" value="${ln.nveh}" oninput="lnSet(${ln.id},'nveh',+this.value);this.nextElementSibling.textContent=this.value"><span>${ln.nveh}</span></div>` +
        `<div class="slider"><span>${L('Biglietto', 'Ticket')}</span><input id="lnp${ln.id}" type="range" min="0" max="10" step="0.5" value="${ln.price}" oninput="lnSet(${ln.id},'price',+this.value);this.nextElementSibling.textContent=this.value+' €'"><span>${ln.price} €</span></div></div>`;
    }
  }
  el.innerHTML = h; if ($("loanAmt")) loanUI($("loanAmt").value);
}
function bulldozeSel() { const o = selected.obj; const refund = Math.round(SV[o.type].cost * 0.5); if (!S.opts.unlimited) S.money += refund; removeSvc(o); closeSide(); }
const lnHex = ln => '#' + ln.col.toString(16).padStart(6, '0');
const lnGet = id => lines.find(l => l.id === id);
function lnSet(id, k, v) { const l = lnGet(id); if (l) l[k] = v; }
function findLine(id) { const l = lnGet(id); if (!l || !l.stops.length) return; l.hide = false; showInfo('transit'); const xs = l.stops.map(s => s.x), zs = l.stops.map(s => s.z); cam.tx = (Math.min(...xs) + Math.max(...xs)) / 2; cam.tz = (Math.min(...zs) + Math.max(...zs)) / 2; cam.dist = clamp(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 1.3, 300, 4000); redrawLines(); }
function maxVeh(ln) { return 20 + (ln.kind === 'bus' ? 5 * [...svcs.values()].filter(s => s.type === 'busdepot' && s.ext.includes('bay')).length : 0); }
function lineUse(ln) { return ln.off || !ln.nveh ? 0 : Math.round(ln.riders / (lineCap(ln) * ln.nveh * 0.6) * 100); }
function profitOf(b) { const k = ZT[b.zone].k, fill = b.jobs ? b.occ / b.jobs : 0, t = taxEff(k === 'M' ? 'C' : k); return clamp(fill * 0.8 + (k === 'C' || k === 'M' ? Math.min(1, (stats.demand?.C ?? 0) / 60 + 0.4) : k === 'I' ? (stats.goodsP <= stats.goodsC ? 0.5 : 0.25) : 0.4) * 0.5 - (t - 10) / 40 + (b.level - 1) * 0.04, 0, 1); }
function fireRisk(b) { return clamp((1 - (b.cov?.fire || 0)) * (ZT[b.zone].k === 'I' ? 1 : 0.6) * (UPG.has('fir1') ? 0.5 : 1), 0, 1); }
function takeLoan(a, r, m) { S.loans.push({ amt: a, pay: Math.round(a * (1 + r) / m), left: m }); if (!S.opts.unlimited) S.money += a; refreshPanels(); toast(L('Prestito ottenuto', 'Loan taken'), 1500); }
function buyUpg(id) { const u = UPGRADES.find(x => x.id === id); if (S.dev < u.cost) return; S.dev -= u.cost; UPG.add(id); S.upg = [...UPG]; refreshPanels(); toast('⭐ ' + u.n(), 2500); }
function toggleBusLane(id) { const s = segs.get(id); if (!s) return; if (!s.busLane && !spend(Math.round(s.len * 15))) return; s.busLane = !s.busLane; roadDirty.add(s.chunk); flushRoads(); refreshPanels(); }
function toggleBarrier(id) { const s = segs.get(id); if (!s) return; if (!s.barrier && !spend(Math.round(s.len * 40))) return; s.barrier = !s.barrier; roadDirty.add(s.chunk); flushRoads(); refreshPanels(); }
function upgradeSeg(id, type) {
  const s = segs.get(id); if (!s) return; const cost = Math.max(0, Math.round(s.len * (RT[type].cost - RT[s.type].cost * 0.5)));
  if (!spend(cost)) return;
  const a = nodes.get(s.a), b = nodes.get(s.b), keep = captureZones(s), cx = s.cx, cz = s.cz, el = s.elev;
  removeSeg(id, true); const ns = addSeg(a, b, type, cx, cz, el); restoreZones(keep);
  selected = { kind: 'seg', obj: ns }; refreshPanels();
}
function reverseSeg(id) { const s = segs.get(id); if (!s) return; const a = nodes.get(s.a), b = nodes.get(s.b), keep = captureZones(s), t = s.type, cx = s.cx, cz = s.cz, el = s.elev; removeSeg(id, true); const ns = addSeg(b, a, t, cx, cz, el); restoreZones(keep); selected = { kind: 'seg', obj: ns }; refreshPanels(); }
const CHS = () => [['pop', L('Abitanti', 'Population'), '#4fb3a9'], ['money', L('Soldi', 'Money'), '#e3c03e'], ['inc', L('Entrate', 'Income'), '#5cc26a'], ['exp', L('Uscite', 'Expenses'), '#e35d4f'], ['happy', L('Felicità', 'Happiness'), '#b07ae6'], ['unemp', L('Disoccupazione %', 'Unemployment %'), '#e3a03e'], ['jobs', L('Posti di lavoro', 'Jobs'), '#5aa2e6'], ['tour', L('Turisti', 'Tourists'), '#f08ac0']];
let chartSel = new Set(['pop', 'inc', 'exp']), chartRange = 0;
function chart() {
  const all = S.hist, n = chartRange || all.length, hs = all.slice(-n); if (hs.length < 2) return `<div style="color:var(--mute)">${L('Servono almeno 2 mesi', 'Needs at least 2 months')}</div>`;
  const W = 300, Hh = 110;
  let h = `<div style="display:flex;gap:4px;margin-bottom:4px">` + [[12, L('1 anno', '1 year')], [60, L('5 anni', '5 years')], [0, L('Tutto', 'All')]].map(([v, t]) => `<button style="${chartRange === v ? 'background:var(--acc);color:#000' : ''}" onclick="chartRange=${v};refreshPanels()">${t}</button>`).join('') + `</div><svg viewBox="0 0 ${W} ${Hh}" width="100%" style="background:rgba(255,255,255,.04);border-radius:6px">`;
  for (let k = 1; k < 4; k++) h += `<line x1="0" x2="${W}" y1="${k * Hh / 4}" y2="${k * Hh / 4}" stroke="rgba(255,255,255,.07)"/>`;
  for (const [k, , c] of CHS()) { if (!chartSel.has(k)) continue; const v = hs.map(x => x[k] ?? 0), mx = Math.max(...v, 1), mn = Math.min(0, ...v);
    h += `<path d="${v.map((y, i) => `${i ? 'L' : 'M'}${(i / (hs.length - 1) * W).toFixed(1)},${(Hh - 4 - (y - mn) / (mx - mn || 1) * (Hh - 10)).toFixed(1)}`).join('')}" fill="none" stroke="${c}" stroke-width="2"/>`; }
  h += `</svg><div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:12px;margin-top:4px">` + CHS().map(([k, t, c]) => { const v = hs[hs.length - 1][k]; return `<label style="cursor:pointer"><input type="checkbox" ${chartSel.has(k) ? 'checked' : ''} onchange="chartSel[this.checked?'add':'delete']('${k}');refreshPanels()"> <span style="color:${c}">■</span> ${t}${v != null ? ' <b>' + fmtNum(Math.round(v)) + '</b>' : ''}</label>`; }).join('') + `</div><div style="font-size:11px;color:var(--mute)">${L('Ogni linea ha la sua scala. Un punto = un mese.', 'Each line has its own scale. One point = one month.')}</div>`;
  return h;
}
// ---------- avvisi sopra gli edifici dei servizi ----------
// spostare un edificio di servizio già costruito (gratis)
function moveSvc(sv) { const keep = { id: sv.id, fill: sv.fill, on: sv.on, ext: sv.ext, dist: sv.dist, med: sv.med, name: sv.name, old: { type: sv.type, x: sv.x, z: sv.z, y: sv.y, ang: sv.ang, seg: sv.seg, along: sv.along } }; removeSvc(sv); closeSide(); openCat = SV[sv.type].cat; buildToolbar(); setTool('svc', sv.type); TOOL.moving = keep; TOOL.rot = sv.ang; toast(L('Clicca dove vuoi spostarlo. Esc per annullare.', 'Click where to move it. Esc to cancel.'), 3000); }
// scheda del terminal merci: cosa c'è in magazzino e i mezzi
function cargoCard(sv) {
  const R = stats.raw || {}, N = RAWN(), sh = Math.max(1, [...svcs.values()].filter(s => SV[s.type].port || s.type === 'cargotrain').length);
  let h = `<div class="sec">📦 ${L('In magazzino', 'In storage')}</div>`;
  for (const k of RAWK) { const r = R[k]; if (!r || (!r.p && !r.n)) continue; h += row(N[k][0] + ' ' + N[k][1], fmtNum(Math.round(Math.abs(r.p - r.n) / sh)) + ' t ' + (r.p >= r.n ? '⬆' : '⬇')); }
  h += row('📦 ' + L('Merci', 'Goods'), fmtNum(Math.round(Math.abs(stats.goodsP - stats.goodsC) / sh)) + ' ' + (stats.goodsP >= stats.goodsC ? '⬆' : '⬇'));
  h += `<div style="font-size:11px;color:var(--mute)">⬆ ${L('in partenza (si vende)', 'outgoing (sold)')} · ⬇ ${L('in arrivo (si compra)', 'incoming (bought)')}</div>`;
  const vs = SV[sv.type].port ? ships.filter(s => s.sv === sv.id).map(s => `<div class="row"><span>🚢 ${s.cruise ? L('Nave da crociera', 'Cruise ship') : L('Nave merci', 'Cargo ship')}</span><span>${s.docked ? L('al molo', 'docked') : s.dir === 1 ? L('in arrivo', 'arriving') : L('in partenza', 'leaving')}</span></div>`) : [];
  return h + (SV[sv.type].port ? `<div class="sec">${L('Navi', 'Ships')} (${vs.length})</div>` + (vs.join('') || `<div style="color:var(--mute)">${L('Nessuna nave adesso', 'No ships now')}</div>`) : '');
}
function buyExt(id, k, cost) { const sv = svcs.get(id); if (!sv || sv.ext.includes(k) || !spend(cost)) return; sv.ext.push(k); drawSvc(sv); addXP(50, L('ampliamento costruito', 'upgrade built')); refreshPanels(); }
// scheda della stazione: i treni e cosa stanno facendo
function trainYard(sv) {
  const list = [];
  for (const v of vehicles) {
    if (v.kind !== 'train' && v.kind !== 'cargotrain') continue;
    let what = null;
    if (v.st === sv.id) what = v.wait > 0 ? L('fermo in stazione', 'waiting at the station') : v.inb ? L('in arrivo da fuori città', 'arriving from outside') : L('in partenza verso fuori città', 'leaving town');
    else if (v.line != null) { const ln = lines.find(l => l.id === v.line); if (ln && ln.stops.some(s => s.svc === sv.id)) what = (v.wait > 0 ? L('fermo alla fermata', 'stopped') : L('in viaggio', 'travelling')) + ' · ' + ln.name; }
    if (what) list.push(`<div class="row"><span>${v.kind === 'cargotrain' ? '🚃 ' + L('Treno merci', 'Cargo train') : '🚆 ' + L('Treno', 'Train')}</span><span>${what}</span></div>`);
  }
  return `<div class="sec">${L('Treni', 'Trains')} (${list.length})</div>` + (list.join('') || `<div style="color:var(--mute)">${L('Nessun treno in questo momento', 'No trains right now')}</div>`);
}
function svcWarn(sv) {
  const d = SV[sv.type], w = [];
  if (!sv.on) return w;
  if (sv.seg == null && !d.free && d.cat !== 'parks' && d.cat !== 'sign' && sv.type !== 'antenna' && sv.type !== 'telecom') w.push(L('Nessun accesso stradale', 'No road access'));
  const util = d.cat !== 'power' && d.cat !== 'water' && d.cat !== 'parks' && sv.type !== 'mailbox';
  if (util && sv.pow === false) w.push(L('Manca l\'elettricità', 'No electricity'));
  if (util && sv.wat === false) w.push(L('Manca l\'acqua', 'No water'));
  if ((d.cargo === 'ship' || d.station === 'ship') && !sv.dock) w.push(L('Nessun collegamento via acqua', 'No water connection'));
  if (d.rail && sv.seg == null) w.push(L('Nessun collegamento ai binari', 'No rail connection'));
  if (SV[sv.type].port && ![...segsNear(sv.x, sv.z, 500)].some(id => RT[segs.get(id)?.type]?.rail)) w.push(L('Nessun collegamento ferroviario', 'No rail connection'));
  if (d.spec && (sv.res ?? 1) < 0.15) w.push(L('Poche risorse qui', 'Few resources here'));
  if (d.spec && stats.raw && stats.raw[d.spec.prod].p < stats.raw[d.spec.prod].n) w.push(L('Produzione in deficit', 'Production deficit'));
  if (d.cat === 'health' && d.cap && (sv.med ?? 100) < 10) w.push(L('Nessuna fornitura medica', 'No medical supplies'));
  if (d.p && sv.net?.pLost > 1) w.push(L('Collo di bottiglia: serve un trasformatore', 'Bottleneck: build a transformer'));
  if (d.store && sv.fill >= svStore(sv)) w.push(L('Pieno', 'Full'));
  return w;
}
function updateWarns() {
  const el = $('warns'); if (!S || walk.on || cam.dist > 3000) { el.innerHTML = ''; return; }
  let h = '', n = 0;
  for (const sv of svcs.values()) {
    if (Math.abs(sv.x - cam.tx) > cam.dist * 1.5 || Math.abs(sv.z - cam.tz) > cam.dist * 1.5) continue;
    const w = svcWarn(sv); if (!w.length) continue;
    _v3.set(sv.x, sv.y + (SV[sv.type].h || 12) + 6, sv.z).project(camera); if (_v3.z > 1 || Math.abs(_v3.x) > 1 || Math.abs(_v3.y) > 1) continue;
    h += `<div class="warn" style="left:${(_v3.x + 1) / 2 * innerWidth}px;top:${(1 - _v3.y) / 2 * innerHeight}px">⚠ ${w[0]}</div>`; if (++n > 25) break;
  }
  el.innerHTML = h;
}
// ---------- nomi delle vie (da vicino) ----------
function updateStreets() {
  const el = $('streets'); if (!S || walk.on || cam.dist > 1100) { el.innerHTML = ''; return; }
  let h = '', n = 0; const seen = new Set();
  for (const id of segsNear(cam.tx, cam.tz, cam.dist * 1.2)) {
    const s = segs.get(id); if (!s || s.nm == null || s.len < 50) continue; const nm = streetName(s); if (!nm || seen.has(s.nm + s.type)) continue;
    const m = s.pts[s.pts.length >> 1], q = s.pts[Math.min(s.pts.length - 1, (s.pts.length >> 1) + 1)];
    _v3.set(m.x, m.y + 1, m.z).project(camera); if (_v3.z > 1 || Math.abs(_v3.x) > 0.95 || Math.abs(_v3.y) > 0.95) continue;
    const x0 = (_v3.x + 1) / 2 * innerWidth, y0 = (1 - _v3.y) / 2 * innerHeight;
    _v3.set(q.x, q.y + 1, q.z).project(camera); let a = Math.atan2((1 - _v3.y) / 2 * innerHeight - y0, (_v3.x + 1) / 2 * innerWidth - x0) * 180 / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180;
    seen.add(s.nm + s.type); h += `<div style="left:${x0}px;top:${y0}px;transform:translate(-50%,-50%) rotate(${a.toFixed(0)}deg)">${nm}</div>`; if (++n > 30) break;
  }
  el.innerHTML = h;
}
// ---------- pannello con numeri e ciambella nelle viste a colori ----------
function donut(parts) { let a = 0, g = []; const tot = parts.reduce((t, p) => t + p[1], 0); if (!tot) return `<div style="color:var(--mute);margin-top:6px">${L('Ancora nessun dato', 'No data yet')}</div>`; for (const [, v, c] of parts) { const b = a + v / tot * 360; g.push(`${c} ${a}deg ${b}deg`); a = b; } return `<div style="display:flex;gap:10px;align-items:center;margin-top:6px"><div style="width:64px;height:64px;border-radius:50%;background:conic-gradient(${g.join(',')});-webkit-mask:radial-gradient(circle,transparent 18px,#000 19px);mask:radial-gradient(circle,transparent 18px,#000 19px);flex:none"></div><div style="font-size:12px">${parts.map(([n, v, c]) => `<div><span style="color:${c}">■</span> ${n} ${Math.round(v / tot * 100)}%</div>`).join('')}</div></div>`; }
function updateInfoSide() {
  const el = $('infoside'), m = INFO.mode; if (!S || !m || walk.on) { el.style.display = 'none'; return; }
  const R = (a, b) => `<div class="row"><span>${a}</span><b>${b}</b></div>`, G3 = (g, n, b) => [[L('buono', 'good'), g, '#4cbf5a'], [L('medio', 'fair'), n, '#e3c03e'], [L('scarso', 'poor'), b, '#e35d4f']];
  let h = '', bs = [...buildings.values()].filter(b => !b.ruin);
  const cnt3 = f => { let g = 0, n = 0, p = 0; for (const b of bs) { const v = f(b); if (v < 0) continue; if (v < 0.33) g++; else if (v < 0.66) n++; else p++; } return [g, n, p]; };
  const cov = k => cnt3(b => 1 - Math.min(1, (b.cov || {})[k] || 0));
  switch (m) {
    case 'edu': { const e = stats.edu || [0, 0, 0, 0]; h += R(L('Istruzione media', 'Average education'), Math.round((stats.eduAvg || 0) * 100) + '%') + donut([[L('nessuna', 'none'), e[0], '#e35d4f'], [L('elementari', 'elementary'), e[1], '#e3c03e'], [L('superiori', 'high school'), e[2], '#5aa2e6'], [L('laurea', 'degree'), e[3], '#4cbf5a']]); break; }
    case 'power': { const p = NET.cityPow?.prod || 0, c = NET.cityPow?.use || 0; h += R(L('Prodotta', 'Produced'), Math.round(p) + ' MW') + R(L('Consumata', 'Used'), Math.round(c) + ' MW') + donut([[L('con corrente', 'powered'), bs.filter(b => b.pow).length, '#4cbf5a'], [L('senza', 'without'), bs.filter(b => !b.pow).length, '#e35d4f']]); break; }
    case 'wat': h += donut([[L('con acqua e fogne', 'with water & sewage'), bs.filter(b => b.wat && b.sew).length, '#4cbf5a'], [L('senza', 'without'), bs.filter(b => !(b.wat && b.sew)).length, '#e35d4f']]); break;
    case 'happy': h += R(L('Felicità media', 'Average happiness'), Math.round(stats.happy) + '%') + donut(G3(...cnt3(b => 1 - b.happy / 100))); break;
    case 'crime': h += R(L('Criminalità media', 'Average crime'), Math.round(stats.crime || 0)) + donut(G3(...cnt3(b => b.crime / 60))); break;
    case 'health': h += R(L('Malati', 'Sick'), fmtNum(stats.sick || 0)) + donut(G3(...cov('health'))); break;
    case 'fire': h += R(L('Incendi ora', 'Fires now'), bs.filter(b => b.fire).length) + donut(G3(...cov('fire'))); break;
    case 'firerisk': h += donut(G3(...cnt3(b => fireRisk(b)))); break;
    case 'mail': h += donut(G3(...cov('mail'))); break;
    case 'garb': h += R(L('Rifiuti da raccogliere', 'Garbage to collect'), fmtNum(Math.round(bs.reduce((t, b) => t + b.garb, 0)))) + donut(G3(...cnt3(b => b.garb / 120))); break;
    case 'transit': h += R(L('Passeggeri al mese', 'Monthly riders'), fmtNum(stats.riders || 0)) + R(L('Usa i mezzi', 'Use transit'), Math.round((stats.transitShare || 0) * 100) + '%') + donut(G3(...cov('transit'))); break;
    case 'level': { const lv = [0, 0, 0, 0, 0]; for (const b of bs) lv[b.level - 1]++; h += donut(lv.map((v, i) => [L('livello', 'level') + ' ' + (i + 1), v, ['#e35d4f', '#e3a03e', '#e3c03e', '#8fcf5a', '#4cbf5a'][i]])); break; }
    case 'pcons': h += R(L('Consumo totale', 'Total use'), Math.round(NET.cityPow?.use || 0) + ' MW') + donut(G3(...cnt3(b => clamp((b.pu || 0) / 1.2, 0, 1)))); break;
    case 'parking': h += donut(G3(...cnt3(b => (ZT[b.zone].k === 'C' || ZT[b.zone].k === 'O') ? 1 - Math.min(1, (b.cov || {}).parking || 0) : -1))); break;
    case 'traffic': h += R(L('Traffico', 'Traffic flow'), Math.round(100 - (stats.congestion || 0) * 100) + '%') + R(L('Veicoli', 'Vehicles'), fmtNum(vehicles.size)) + R(L('Incidenti', 'Accidents'), stats.accidents || 0); break;
    case 'lv': h += R(L('Valore medio', 'Average value'), Math.round(stats.lv || 0)); break;
    case 'age': h += donut(G3(...cnt3(b => clamp((b.age || 0) / 120, 0, 1))).map((x, i) => [[L('nuovi', 'new'), L('di mezza età', 'middle-aged'), L('vecchi', 'old')][i], x[1], x[2]])); break;
    case 'jobedu': { let lo = 0, mi = 0, hi = 0; for (const b of bs) { if (!b.jobs) continue; const k = ZT[b.zone].k; if (k === 'O') hi += b.jobs; else if (k === 'I') lo += b.jobs; else mi += b.jobs; } h += R(L('Posti di lavoro', 'Jobs'), fmtNum(lo + mi + hi)) + donut([[L('poca istruzione', 'low education'), lo, '#e3c03e'], [L('media', 'medium'), mi, '#5aa2e6'], [L('alta', 'high'), hi, '#b07ae6']]); break; }
    case 'profit': h += donut(G3(...cnt3(b => b.jobs ? 1 - profitOf(b) : -1)).map((x, i) => [[L('guadagnano bene', 'profitable'), L('così così', 'break-even'), L('in perdita', 'losing money')][i], x[1], x[2]])); break;
    case 'suit': h += `<div style="font-size:12px;color:var(--mute);margin-top:4px">${L('Le strade verdi sono un buon posto per le case: valore alto e poco inquinamento. Le rosse vanno meglio per l\'industria.', 'Green roads are good for homes: high value, little pollution. Red ones suit industry better.')}</div>`; break;
    default: el.style.display = 'none'; return;
  }
  el.innerHTML = `<b>${(INFOMODES().find(x => x[0] === m) || [, ''])[1]}</b>` + h; el.style.display = 'block';
}
// ---------- nomi dei quartieri sullo schermo ----------
function updateLabels() {
  const el = $('labels'); if (!S || !S.districts.length || walk.on) { el.innerHTML = ''; return; }
  let h = '';
  for (const d of S.districts) {
    const dc = distCenter(d.id), n = dc.n; if (!n) continue; const x = dc.x, z = dc.z;
    _v3.set(x, Math.max(getH(x, z), 0) + 30, z).project(camera); if (_v3.z > 1) continue;
    h += `<div onclick="openDistrict(${d.id})" style="left:${(_v3.x + 1) / 2 * innerWidth}px;top:${(1 - _v3.y) / 2 * innerHeight}px;font-size:${clamp(Math.sqrt(n) * GC / cam.dist * 60, 13, 28).toFixed(0)}px">${d.name}</div>`;
  }
  el.innerHTML = h;
}
// ---------- modalità camminare ----------
const walk = { on: false, x: 0, z: 0, y: 0, yaw: 0, pitch: 0.25, vy: 0, zoom: 7, ground: true };
const avatar = new THREE.Group();
{ const m = c => new THREE.MeshLambertMaterial({ color: c }); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.8, 10), m(0x2f6fd0)); body.position.y = 1.15; const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.75, 0.22), m(0x333344)); legs.position.y = 0.38; const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), m(0xf0c8a0)); head.position.y = 1.72; avatar.add(body, legs, head); avatar.visible = false; scene.add(avatar); }
function toggleWalk() {
  walk.on = !walk.on; avatar.visible = walk.on;
  if (walk.on) { walk.x = cam.tx; walk.z = cam.tz; walk.y = groundWalk(walk.x, walk.z); walk.yaw = cam.yaw + Math.PI; setTool(null); openCat = null; buildToolbar(); $('walkhint').style.display = 'block'; $('walkhint').innerHTML = L('🚶 W A S D cammina · Shift corri · Spazio salta · trascina il mouse per girarti · V per tornare alla vista dall\'alto', '🚶 W A S D walk · Shift run · Space jump · drag the mouse to look · V to go back to the top view'); }
  else { cam.tx = walk.x; cam.tz = walk.z; cam.dist = 300; $('walkhint').style.display = 'none'; }
}
function groundWalk(x, z) {
  let y = Math.max(getH(x, z), WATER - 1.2);
  const s = findNearSeg(x, z, 0); if (s && s.d < RT[s.seg.type].w / 2 + 0.5) y = Math.max(y, s.y + 0.15);
  return y;
}
function walkBlocked(x, z) { let hit = false; bldNear(x, z, 60, b => { if (!hit && !b.ruin && obbContains({ x: b.x, z: b.z, ang: b.ang, w: b.cw * CELL - 2, d: b.cd * CELL - 2 }, x, z)) hit = true; }); if (!hit) { const sv = svcAt(x, z); if (sv && SV[sv.type].cat !== 'parks') hit = true; } return hit; }
function updateWalk(dt) {
  if (!walk.on) return;
  let f = 0, r = 0; if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyA || keys.ArrowLeft) r -= 1; if (keys.KeyD || keys.ArrowRight) r += 1;
  if (keys.KeyQ) walk.yaw += dt * 2; if (keys.KeyE) walk.yaw -= dt * 2;
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 7 : 2.8) * dt;
  const dx = -Math.sin(walk.yaw) * f + Math.cos(walk.yaw) * r, dz = -Math.cos(walk.yaw) * f - Math.sin(walk.yaw) * r;
  const nx = walk.x + dx * sp, nz = walk.z + dz * sp;
  if (!walkBlocked(nx, nz) && inMap(nx, nz)) { walk.x = nx; walk.z = nz; }
  const g = groundWalk(walk.x, walk.z);
  if (walk.jump && walk.y <= g + 0.05) { walk.vy = 4.5; } walk.jump = false;
  walk.vy -= 9.8 * dt; walk.y += walk.vy * dt; if (walk.y < g) { walk.y = g; walk.vy = 0; }
  avatar.position.set(walk.x, walk.y, walk.z); avatar.rotation.y = walk.yaw + Math.PI;
  if (f || r) avatar.children[1].scale.y = 1 + Math.sin(simClock * 12) * 0.05;
  const z = walk.zoom; const cp = Math.cos(walk.pitch);
  camera.position.set(walk.x + Math.sin(walk.yaw) * cp * z, walk.y + 1.7 + Math.sin(walk.pitch) * z, walk.z + Math.cos(walk.yaw) * cp * z);
  const gg = groundWalk(camera.position.x, camera.position.z) + 0.5; if (camera.position.y < gg) camera.position.y = gg;
  camera.lookAt(walk.x, walk.y + 1.5, walk.z); camera.near = 0.2; camera.updateProjectionMatrix();
  cam.tx = walk.x; cam.tz = walk.z;
}
