// =====================================================================
//  Popolazione vera (23 nov 2026): nessuna persona inventata.
//  Ogni abitante esiste davvero: ha una famiglia, una casa (che ha un massimo di persone),
//  al massimo UN posto di lavoro (che ha un massimo di impiegati) e sta in un solo posto alla volta.
//  Si entra in città solo arrivando da fuori (strada, treno, nave) o nascendo;
//  si esce partendo o morendo. Le auto e i pedoni che si vedono sono persone vere che fanno un viaggio vero.
//
//  Contatori da leggere (anche per altri pannelli):
//   stats.pop        abitanti veri (con casa + senzatetto)
//   stats.where      { casa, lavoro, negozi, viaggio, fuori } : dove sono adesso gli abitanti e i pendolari
//   stats.commuters  pendolari veri che vivono fuori e lavorano qui
//   stats.arriving   persone in arrivo (famiglie in viaggio verso la casa nuova)
//   stats.tourists   turisti entrati nelle ultime 24 ore (= un mese di gioco); stats.tourHere = turisti in città adesso
//   S.flow           totali dall'inizio: in {strada, treno, nave, nati}, out {partiti, morti}
//   stats.flowM      gli stessi numeri ma solo del mese in corso; stats.flowLast = mese scorso
//   b.res / b.cap    abitanti / massimo abitanti di una casa;  b.occ = famiglie, b.hh = massimo famiglie
//   b.wk / b.jobs    impiegati / massimo impiegati;  b.cust / b.cmax = clienti adesso / massimo clienti
// =====================================================================
const ST = { CASA: 0, VIAGGIO: 1, LAVORO: 2, NEGOZIO: 3, FUORI: 4 };
const OUTH = -2, NOHOME = -1; // casa = fuori città (pendolari) / nessuna casa (senzatetto)
const POP = { p: new Map(), f: new Map(), nP: 1, nF: 1, unemp: new Set(), arr: [], trips: [], walk: [], tour: new Map(), nT: 1, tourLog: [], where: [0, 0, 0, 0, 0], comm: 0, hl: 0, adults: 0, ages: [0, 0, 0, 0], carOf: new Map(), outs: [], rail: false, ship: false };
function popReset() {
  POP.p.clear(); POP.f.clear(); POP.nP = 1; POP.nF = 1; POP.unemp.clear(); POP.arr = []; POP.trips = []; POP.walk = []; POP.tour.clear(); POP.nT = 1; POP.tourLog = [];
  POP.where = [0, 0, 0, 0, 0]; POP.comm = 0; POP.hl = 0; POP.adults = 0; POP.ages = [0, 0, 0, 0]; POP.carOf.clear();
}
const flowZero = () => ({ in: { strada: 0, treno: 0, nave: 0, nati: 0 }, out: { partiti: 0, morti: 0 } });
function flowAdd(dir, k, n) { if (!S) return; S.flow = S.flow || flowZero(); S.flow[dir][k] += n; stats.flowM = stats.flowM || flowZero(); stats.flowM[dir][k] += n; }
const workAge = p => p.a >= 18 && p.a < 65;

// ---------- capienza di ogni edificio ----------
const _bldCapacityP = bldCapacity;
bldCapacity = function (b) {
  _bldCapacityP(b);
  const k = ZT[b.zone].k;
  b.cap = b.hh * 5; // al massimo 5 persone per appartamento
  b.cmax = k === 'C' || k === 'M' ? Math.max(6, b.jobs * 3) : 0; // clienti dentro nello stesso momento
  if (b.res == null) { b.res = 0; b.wk = 0; b.cust = 0; b.resv = 0; }
  if (!b.fams) b.fams = new Set(); if (!b.wl) b.wl = new Set();
};
const jobSite = j => j > 0 ? buildings.get(j) : j < 0 ? svcs.get(-j) : null;
function siteMax(o) {
  if (!o) return 0;
  if (o.zone != null) return o.aband || o.ruin || o.cons > 0 ? 0 : o.jobs || 0;
  const d = SV[o.type]; return o.on && d && d.spec ? d.jobs || 0 : 0;
}
function siteKind(j) { const o = jobSite(j); if (!o) return ''; return o.zone != null ? ZT[o.zone].k : 'S'; }

// ---------- persone e famiglie ----------
function stSet(p, s, at) {
  POP.where[p.s]--;
  if (p.s === ST.NEGOZIO) { const b = buildings.get(p.at); if (b) b.cust = Math.max(0, (b.cust || 0) - 1); }
  p.s = s; p.at = at || 0; POP.where[s]++;
  if (s === ST.NEGOZIO) { const b = buildings.get(p.at); if (b) b.cust = (b.cust || 0) + 1; }
}
function popNew(f, h, a) {
  const p = { id: POP.nP++, f: f ? f.id : 0, h, a, j: 0, s: h === OUTH ? ST.FUORI : ST.CASA, at: h > 0 ? h : 0, t: 0, sh: 7, to: 0, ts: 0, m: '' };
  POP.p.set(p.id, p); POP.where[p.s]++;
  if (f) f.m.push(p.id);
  if (h !== OUTH && workAge(p)) POP.unemp.add(p.id);
  return p;
}
function popHire(p, o, jid) {
  p.j = jid; o.wl = o.wl || new Set(); o.wl.add(p.id); o.wk = o.wl.size; if (o.zone != null && !o.hh) o.occ = o.wk;
  POP.unemp.delete(p.id);
  const k = o.zone != null ? ZT[o.zone].k : 'I';
  p.sh = k === 'I' && rand() < 0.3 ? 22 : k === 'C' || k === 'M' ? 8 + Math.floor(rand() * 5) : 6 + Math.floor(rand() * 4);
}
function popFire(p) {
  if (!p.j) return; const o = jobSite(p.j);
  if (o && o.wl) { o.wl.delete(p.id); o.wk = o.wl.size; if (o.zone != null && !o.hh) o.occ = o.wk; }
  p.j = 0;
  if (p.s === ST.LAVORO) homeNow(p);
  if (p.h === OUTH) { popDel(p); return; } // i pendolari esistono qui solo finché lavorano qui
  if (workAge(p)) POP.unemp.add(p.id);
}
function popDel(p) {
  if (!POP.p.has(p.id)) return;
  if (p.j) { const o = jobSite(p.j); if (o && o.wl) { o.wl.delete(p.id); o.wk = o.wl.size; if (o.zone != null && !o.hh) o.occ = o.wk; } p.j = 0; }
  POP.unemp.delete(p.id);
  stSet(p, ST.CASA, 0); POP.where[ST.CASA]--;
  POP.p.delete(p.id);
  if (p.h === OUTH) POP.comm--;
  const f = POP.f.get(p.f);
  if (f) { f.m = f.m.filter(x => x !== p.id); const b = f.h > 0 ? buildings.get(f.h) : null; if (b) b.res = Math.max(0, b.res - 1); if (!f.m.length) famDrop(f); }
}
function famDrop(f) { const b = f.h > 0 ? buildings.get(f.h) : null; if (b) { b.fams.delete(f.id); b.occ = b.fams.size; } POP.f.delete(f.id); }
function homeNow(p) { if (p.h > 0) stSet(p, ST.CASA, p.h); else if (p.h === OUTH) stSet(p, ST.FUORI, 0); else stSet(p, ST.CASA, 0); }
function famIn(f, b) {
  f.h = b.id; b.fams.add(f.id); b.occ = b.fams.size;
  for (const id of f.m) { const p = POP.p.get(id); if (!p) continue; p.h = b.id; b.res++; if (p.s === ST.CASA) p.at = b.id; }
}
function famOut(f) {
  const b = f.h > 0 ? buildings.get(f.h) : null;
  if (b) { b.fams.delete(f.id); b.occ = b.fams.size; b.res = Math.max(0, b.res - f.m.length); f.lx = b.x; f.lz = b.z; }
  f.h = NOHOME;
  for (const id of f.m) { const p = POP.p.get(id); if (!p) continue; p.h = NOHOME; if (p.s === ST.CASA) p.at = 0; }
}
// una famiglia lascia la città: si vede la sua auto che va verso l'uscita
function famLeave(f) {
  const b = f.h > 0 ? buildings.get(f.h) : null, n = f.m.length;
  if (b && POP.outs.length) POP.trips.push({ k: 'out', A: b, G: pick(POP.outs), t: S.time });
  for (const id of [...f.m]) { const p = POP.p.get(id); if (p) popDel(p); }
  if (POP.f.has(f.id)) POP.f.delete(f.id);
  flowAdd('out', 'partiti', n);
}
const homeFree = b => b && b.hh && !b.aband && !b.ruin && !(b.cons > 0) && b.occ + (b.resv || 0) < b.hh;
function freeHome(x, z, not) {
  let best = null, bd = 1e18;
  for (const b of buildings.values()) { if (b === not || !homeFree(b)) continue; const d = (b.x - x) ** 2 + (b.z - z) ** 2; if (d < bd) { bd = d; best = b; } }
  return best;
}
// edificio che si svuota (demolito, abbandonato, distrutto): chi ci vive e chi ci lavora deve andare via
function popEvict(b, mode) {
  if (!b) return;
  if (b.fams) for (const fid of [...b.fams]) {
    const f = POP.f.get(fid); if (!f) { b.fams.delete(fid); continue; }
    if (mode === 'ruin' && rand() < 0.5) { famOut(f); continue; } // metà diventa senzatetto
    const nb = mode === 'move' ? freeHome(b.x, b.z, b) : null;
    if (nb) { famOut(f); famIn(f, nb); } else famLeave(f);
  }
  if (b.wl) for (const id of [...b.wl]) { const p = POP.p.get(id); if (p) popFire(p); else b.wl.delete(id); }
  if (b.cust) for (const p of POP.p.values()) if (p.s === ST.NEGOZIO && p.at === b.id) homeNow(p);
  for (const g of POP.tour.values()) if (g.at === b.id && g.s === 1) { g.t2 = S.time; }
  b.occ = 0; b.res = 0; b.wk = 0; b.cust = 0;
}
// una famiglia sola (affitto troppo alto): diventa senzatetto
function popEvictOne(b) { if (!b.fams || !b.fams.size) return; const f = POP.f.get([...b.fams][0]); if (f) famOut(f); }
function popFireOne(b) { if (!b.wl || !b.wl.size) return; const p = POP.p.get([...b.wl][0]); if (p) popFire(p); }
// morte vera: la persona sparisce e il corpo resta in casa finché arriva il carro funebre
function popDie(p) { const b = p.h > 0 ? buildings.get(p.h) : null; if (b) b.dead++; popDel(p); flowAdd('out', 'morti', 1); }
function popKillIn(b) { if (!b || !b.fams || !b.fams.size) return false; const f = POP.f.get([...b.fams][Math.floor(rand() * b.fams.size)]); if (!f || !f.m.length) return false; const p = POP.p.get(pick(f.m)); if (!p) return false; popDie(p); return true; }

// ---------- arrivi in città ----------
function famComp() {
  const r = rand(), ad = () => 20 + rand() * 25, kid = () => rand() * 16;
  if (r < 0.2) return [ad()];
  if (r < 0.45) return [ad(), ad()];
  if (r < 0.9) { const x = [ad(), ad(), kid()]; if (rand() < 0.5) x.push(kid()); if (rand() < 0.25) x.push(kid()); return x; }
  return [62 + rand() * 15, 62 + rand() * 15];
}
function arrOrigin() {
  const o = [];
  if (POP.outs.length) o.push(['strada', 1]);
  if (POP.rail) o.push(['treno', 0.35]);
  if (POP.ship) o.push(['nave', 0.2]);
  if (!o.length) return 'strada';
  let t = o.reduce((a, x) => a + x[1], 0) * rand(); for (const [k, w] of o) { t -= w; if (t <= 0) return k; } return o[0][0];
}
function popArrive(b) {
  b.resv = (b.resv || 0) + 1;
  const a = { b: b.id, ages: famComp(), or: arrOrigin(), t: S.time + 0.5 + rand() * 1.5, car: false, done: false };
  POP.arr.push(a);
  if (a.or === 'strada' && POP.outs.length) POP.trips.push({ k: 'in', arr: a, G: pick(POP.outs), B: b, t: S.time });
}
function popSettle(a) {
  if (a.done) return; a.done = true;
  let b = buildings.get(a.b); if (b) b.resv = Math.max(0, (b.resv || 0) - 1);
  if (!homeFree(b)) b = b ? freeHome(b.x, b.z) : null;
  if (!b) return; // la casa non c'è più e non ce ne sono altre: non entrano
  const f = { id: POP.nF++, h: NOHOME, m: [] }; POP.f.set(f.id, f);
  const room = Math.max(1, Math.min(a.ages.length, b.cap - b.res));
  for (let i = 0; i < room; i++) popNew(f, NOHOME, a.ages[i]);
  famIn(f, b);
  flowAdd('in', a.or, room);
}

// ---------- ogni edificio: chi arriva, chi se ne va, chi viene assunto ----------
function popBuilding(b) {
  if (b.hh) {
    const free = b.hh - b.occ - (b.resv || 0);
    if (free > 0 && stats.demand.R > 10 && b.happy > 30 && rand() < 0.6) { const n = Math.max(1, Math.round(free * 0.25 * rand())); for (let i = 0; i < n; i++) popArrive(b); }
    if (b.happy < 25 && b.occ > 0 && rand() < 0.3) { const f = POP.f.get([...b.fams][0]); if (f) famLeave(f); }
  }
  if (b.jobs) jobFill(b, b.id);
}
function commCap() { return POP.outs.length ? Math.round(Math.min(stats.jobs * 0.35, 150 + stats.pop * 0.15)) : 0; }
function pickWorker(o) {
  let best = null, bd = 1e18, n = 0;
  for (const id of POP.unemp) {
    const p = POP.p.get(id); if (!p || p.j || !workAge(p)) { POP.unemp.delete(id); continue; }
    const h = p.h > 0 ? buildings.get(p.h) : null, d = h ? (h.x - o.x) ** 2 + (h.z - o.z) ** 2 : 25e6;
    if (d < bd) { bd = d; best = p; } if (++n >= 16) break;
  }
  return best;
}
function jobFill(o, jid) {
  if (!o.wl) o.wl = new Set();
  const max = siteMax(o);
  while (o.wl.size > max) { const p = POP.p.get([...o.wl][o.wl.size - 1]); if (p) popFire(p); else o.wl.delete([...o.wl][o.wl.size - 1]); }
  o.wk = o.wl.size; if (o.zone != null && !o.hh) o.occ = o.wk;
  let need = Math.min(max - o.wk, Math.max(1, Math.ceil(max * 0.2)));
  while (need > 0) { const p = pickWorker(o); if (!p) break; popHire(p, o, jid); need--; }
  const cap = commCap();
  while (need > 0 && POP.comm < cap) { const p = popNew(null, OUTH, 22 + rand() * 40); POP.comm++; popHire(p, o, jid); need--; }
}

// ---------- giornata: casa -> lavoro -> negozi -> casa ----------
const sitePos = j => jobSite(j);
function popPlace(p) { // da dove parte adesso
  if (p.s === ST.LAVORO) return jobSite(p.j);
  if (p.s === ST.NEGOZIO) return buildings.get(p.at);
  if (p.h > 0) return buildings.get(p.h);
  return null;
}
function goTo(p, to, st, force) {
  const A = popPlace(p), B = st === ST.LAVORO ? jobSite(to) : st === ST.CASA && p.h > 0 ? buildings.get(p.h) : buildings.get(to);
  const fromOut = !A && p.h === OUTH, toOut = st === ST.FUORI;
  if ((!A && !fromOut) || (!B && !toOut)) { homeNow(p); return; }
  const ax = A ? A.x : B.x, az = A ? A.z : B.z, bx = B ? B.x : ax, bz = B ? B.z : az;
  const d = fromOut || toOut ? 6000 : Math.hypot(ax - bx, az - bz);
  const hb = p.h > 0 ? buildings.get(p.h) : null;
  p.m = force ? 'c' : d < 800 ? 'w' : hb && hb.cov?.transit > 0.3 && rand() < (stats.transitShare || 0) * 1.6 ? 'b' : 'c';
  stSet(p, ST.VIAGGIO, 0); p.to = to; p.ts = st; p.t = S.time + (p.m === "w" ? clamp(d / 1500, 0.4, 2) : clamp(d / 12000, 0.2, 2)); p.car = false; p.ws = A || B; p.wa = A;
  if (p.m === 'w') POP.walk.push(p.id);
  else if (p.m === 'c') POP.trips.push({ k: 'p', pid: p.id, A: A, G: fromOut || toOut ? pick(POP.outs) : null, B: B, t: S.time });
}
function goHome(p) { if (p.h > 0) goTo(p, p.h, ST.CASA); else if (p.h === OUTH) { if (POP.outs.length) goTo(p, 0, ST.FUORI); else homeNow(p); } else homeNow(p); }
function popReach(p) {
  p.car = false;
  if (p.ts === ST.LAVORO) { if (p.j && p.j === p.to && jobSite(p.j)) stSet(p, ST.LAVORO, p.j); else goHome(p); return; }
  if (p.ts === ST.NEGOZIO) { const b = buildings.get(p.to); if (b && !b.aband && !b.ruin && (b.cust || 0) < b.cmax) { stSet(p, ST.NEGOZIO, b.id); p.t2 = S.time + 1 + rand() * 2; } else homeNow(p); return; }
  homeNow(p);
}
function pickShop(p) {
  const h = buildings.get(p.h); if (!h || !lists.com.length) return null;
  let best = null, bd = 1e18;
  for (let i = 0; i < 6; i++) { const b = pick(lists.com); if (!b || (b.cust || 0) >= b.cmax) continue; const d = (b.x - h.x) ** 2 + (b.z - h.z) ** 2; if (d < bd) { bd = d; best = b; } }
  return best;
}
function popHour() {
  const hr = Math.floor(S.time % 24);
  POP.outs = outsideNodes();
  POP.rail = typeof outsideRail === 'function' && outsideRail().length > 0 && [...svcs.values()].some(s => s.on && s.type === 'train');
  POP.ship = [...svcs.values()].some(s => s.on && s.type === 'harbor');
  // famiglie in arrivo
  for (const a of POP.arr) if (!a.done && S.time >= a.t + (a.car ? 6 : 0)) popSettle(a);
  POP.arr = POP.arr.filter(a => !a.done);
  // pendolari: se in città ci sono disoccupati prendono il loro posto, e non più del limite
  const cap = commCap(); let over = POP.comm - cap, rep = Math.min(POP.comm, POP.unemp.size) * 0.3;
  if (over > 0 || rep >= 1) for (const p of POP.p.values()) { if (p.h !== OUTH) continue; if (over > 0) { over--; popFire(p); } else if (rep >= 1) { rep--; popFire(p); } else break; }
  // ognuno fa la sua giornata
  const ages = [0, 0, 0, 0]; let adults = 0, hl = 0;
  for (const p of POP.p.values()) {
    if (p.h !== OUTH) { ages[p.a < 13 ? 0 : p.a < 18 ? 1 : p.a < 65 ? 2 : 3]++; if (workAge(p)) adults++; if (p.h === NOHOME) hl++; }
    if (p.s === ST.VIAGGIO) { if (S.time >= p.t + (p.car ? 4 : 0)) popReach(p); continue; }
    if (p.j) {
      if (p.s !== ST.LAVORO && hr === p.sh) { goTo(p, p.j, ST.LAVORO); continue; }
      if (p.s === ST.LAVORO && hr === (p.sh + 8) % 24) { goHome(p); continue; }
    }
    if (p.s === ST.NEGOZIO) { if (S.time >= p.t2) goHome(p); continue; }
    if (p.s === ST.CASA && p.h > 0 && hr >= 8 && hr <= 21 && rand() < (p.j ? 0.02 : p.a < 13 ? 0.015 : 0.05)) { const b = pickShop(p); if (b) goTo(p, b.id, ST.NEGOZIO); }
  }
  POP.ages = ages; POP.adults = adults; POP.hl = hl; S.homeless = hl;
  POP.trips = POP.trips.filter(t => S.time - t.t < 1.5).slice(-4000); // i viaggi non disegnati si fanno lo stesso: solo non si vedono
  POP.walk = POP.walk.filter(id => { const p = POP.p.get(id); return p && p.s === ST.VIAGGIO && p.m === 'w'; });
  tourHour();
}
// ---------- ogni mese: compleanni, nascite, morti ----------
function popMonth() {
  stats.flowLast = stats.flowM || flowZero(); stats.flowM = flowZero();
  let births = 0, deaths = 0;
  const hp = (stats.happy || 60) / 60;
  for (const p of [...POP.p.values()]) {
    if (p.h === OUTH) continue;
    const was = p.a; p.a += 1 / 12;
    if (was < 18 && p.a >= 18 && !p.j) POP.unemp.add(p.id);
    if (was < 65 && p.a >= 65) { if (p.j) popFire(p); POP.unemp.delete(p.id); }
    const b = p.h > 0 ? buildings.get(p.h) : null;
    const risk = (p.a < 60 ? 0.0003 : clamp((p.a - 60) * 0.004, 0, 0.3)) * (b && b.sick > 0 ? 1.5 : 1) * (p.h === NOHOME ? 2 : 1);
    if (rand() < risk) { popDie(p); deaths++; }
  }
  for (const f of POP.f.values()) {
    if (f.h <= 0 || f.m.length >= 5) continue; const b = buildings.get(f.h); if (!b || b.res >= b.cap) continue;
    let par = 0; for (const id of f.m) { const p = POP.p.get(id); if (p && p.a >= 20 && p.a < 43) par++; }
    if (par && rand() < 0.03 * par * hp) { const p = popNew(f, b.id, 0); b.res++; births++; flowAdd('in', 'nati', 1); }
  }
  stats.births = births; stats.deaths = deaths;
  popRehome();
}
// senzatetto: una parte trova casa (di più con l'assistenza sociale), qualcuno lascia la città
function popRehome() {
  const welfare = [...svcs.values()].some(s => s.on && SV[s.type].eff === 'welfare');
  let n = 0;
  for (const f of [...POP.f.values()]) {
    if (f.h !== NOHOME) continue; if (++n > 300) break;
    if (rand() < (welfare ? 0.5 : 0.2)) { const nb = freeHome(f.lx ?? cam.tx, f.lz ?? cam.tz); if (nb) { famIn(f, nb); continue; } }
    if (rand() < 0.1) famLeave(f);
  }
}
// ---------- turisti: gruppi veri che entrano, restano qualche ora nei negozi e ripartono ----------
function tourHour() {
  const target = stats.tourTarget || 0; // turisti al mese che la città attira (stesse regole di prima)
  POP.tourLog = POP.tourLog.filter(x => S.time - x[0] < 24);
  const lastDay = POP.tourLog.reduce((a, x) => a + x[1], 0);
  let want = Math.max(0, Math.round(target / 24 + (target - lastDay) * 0.05));
  const canCome = POP.outs.length || POP.rail || POP.ship || stats.cruise;
  while (want > 0 && canCome && lists.com.length) {
    const b = pick(lists.com); if (!b || (b.cust || 0) >= b.cmax) { want -= 3; continue; }
    const n = Math.min(want, 1 + Math.floor(rand() * 5), b.cmax - (b.cust || 0)); want -= n;
    const or = stats.cruise && rand() < 0.3 ? 'nave' : arrOrigin();
    const g = { id: POP.nT++, n, at: b.id, s: 0, t: S.time + 0.5 + rand(), t2: 0, or };
    POP.tour.set(g.id, g); POP.tourLog.push([S.time, n]);
    if (or === 'strada' && POP.outs.length) POP.trips.push({ k: 'tin', g, G: pick(POP.outs), B: b, t: S.time });
  }
  let here = 0, coming = 0;
  for (const g of [...POP.tour.values()]) {
    const b = buildings.get(g.at);
    if (g.s === 0) { if (S.time >= g.t) { if (b && (b.cust || 0) + g.n <= b.cmax) { g.s = 1; g.t2 = S.time + 3 + rand() * 9; b.cust = (b.cust || 0) + g.n; } else { POP.tour.delete(g.id); continue; } } else { coming += g.n; continue; } }
    if (g.s === 1 && (S.time >= g.t2 || !b)) { if (b) b.cust = Math.max(0, (b.cust || 0) - g.n); if (b && POP.outs.length) POP.trips.push({ k: 'out', A: b, G: pick(POP.outs), t: S.time }); POP.tour.delete(g.id); continue; }
    here += g.n;
  }
  stats.tourHere = here; stats.tourComing = coming;
  stats.tourists = POP.tourLog.reduce((a, x) => a + x[1], 0);
}

// ---------- veicoli: ogni auto privata porta una persona vera nel suo viaggio vero ----------
const legOf = o => o ? { seg: segs.get(o.seg), along: o.along } : null;
const gateOf = g => g ? outsideLeg(g) : null;
function spawnPersonTrip(t) {
  let A, B, kind = 'car', mode = 'car', opts = {};
  if (t.k === 'p') {
    const p = POP.p.get(t.pid); if (!p || p.s !== ST.VIAGGIO || p.car) return false;
    const old = POP.carOf.get(p.id); if (old && vehicles.has(old)) return false;
    A = t.A ? legOf(t.A) : gateOf(t.G); B = t.B ? legOf(t.B) : gateOf(t.G);
    mode = p.a < 19 ? 'young' : p.a >= 65 ? 'senior' : 'car'; opts.pid = p.id;
  } else if (t.k === 'in') { if (t.arr.done) return false; A = gateOf(t.G); B = legOf(t.B); opts.mv = 1; }
  else if (t.k === 'tin') { if (t.g.s !== 0) return false; A = gateOf(t.G); B = legOf(t.B); opts.tour = t.g.id; }
  else { A = legOf(t.A); B = gateOf(t.G); opts.mv = 1; }
  if (!A || !B || !A.seg || !B.seg) return false;
  const legs = findPath(A.seg, A.along, B.seg, B.along, mode);
  if (!legs) { if (t.k === 'p') stats.noRoute = (stats.noRoute || 0) + 1; return false; }
  if (t.k === 'p' && t.A && t.B && legsLen(legs) > TRIP_MAX.work) { stats.tooFar = (stats.tooFar || 0) + 1; return false; }
  const v = spawnVehicle(kind, legs, opts); if (!v) return false;
  if (t.k === 'p') { const p = POP.p.get(t.pid); p.car = true; POP.carOf.set(p.id, v); v.onArrive = () => { if (POP.carOf.get(p.id) === v) POP.carOf.delete(p.id); const q = POP.p.get(p.id); if (q && q.s === ST.VIAGGIO && q.car) popReach(q); }; }
  else if (t.k === 'in') { t.arr.car = true; v.onArrive = () => popSettle(t.arr); }
  else if (t.k === 'tin') { v.onArrive = () => { if (t.g.s === 0) t.g.t = Math.min(t.g.t, S.time); }; }
  return true;
}
// camion e furgoni delle merci e chi attraversa la città senza fermarsi (non sono abitanti)
function spawnGoodsTrip() {
  const outs = POP.outs, r = rand(); let from = null, to = null, fromO = null, toO = null, kind = 'truck';
  if (r < 0.5 && lists.ind.length) { from = pick(lists.ind); kind = rand() < 0.6 ? 'truck' : 'van'; if (rand() < 0.5 && outs.length && !S.cargoHub) toO = pick(outs); else if (lists.com.length) to = pick(lists.com); else return false; }
  else if (r < 0.75 && outs.length && (lists.com.length || lists.ind.length)) { fromO = pick(outs); to = pick(lists.ind.length ? lists.ind : lists.com); }
  else if (outs.length >= 2) { fromO = pick(outs); toO = pick(outs); if (fromO === toO) return false; kind = rand() < 0.3 ? 'truck' : 'car'; }
  else return false;
  if (kind === 'truck' && S.policies.heavy && to && ZT[to.zone].k !== 'I' && rand() < 0.6) kind = 'van';
  const A = fromO ? outsideLeg(fromO) : legOf(from), B = toO ? outsideLeg(toO) : legOf(to);
  if (!A || !B || !A.seg || !B.seg) return false;
  const legs = findPath(A.seg, A.along, B.seg, B.along, 'car'); if (!legs) return false;
  const nv = spawnVehicle(kind, legs, { goods: kind !== 'car' });
  if (nv && fromO && toO) { nv.thru = true; stats.thruN = (stats.thruN || 0) + 1; }
  return !!nv;
}
genTrips = function () {
  pathBudget = 5;
  if (!S) return;
  const hour = S.time % 24, night = hour < 5.5 || hour > 22.5;
  const target = tripTarget() * (night ? 0.35 : 1);
  let cars = 0, other = 0; for (const v of vehicles) if (!v.line && !VK[v.kind].rail) { cars++; if (v.goods || v.thru) other++; }
  while (cars < target && pathBudget > 0) {
    pathBudget--;
    if (POP.trips.length && (other >= target * 0.3 || rand() < 0.8)) { if (spawnPersonTrip(POP.trips.pop())) cars++; continue; }
    if (spawnGoodsTrip()) { cars++; other++; }
  }
};
// i veicoli tolti a metà strada (bloccati, strada demolita): la persona arriva lo stesso più tardi
const _despawnVehicleP = despawnVehicle;
despawnVehicle = function (v) { if (v.pid && POP.carOf.get(v.pid) === v) POP.carOf.delete(v.pid); _despawnVehicleP(v); };

// ---------- seguire un cittadino vero ----------
function citName(p) { const f = p.f || p.id; return NAMES_F[(p.id * 7) % NAMES_F.length] + ' ' + NAMES_P[(f * 13) % NAMES_P.length]; }
function citJob(p) {
  if (p.a < 6) return L('all\'asilo', 'at preschool'); if (p.a < 18) return L('studente', 'student');
  if (p.j) { const o = jobSite(p.j), k = siteKind(p.j); const w = k === 'C' || k === 'M' ? L('lavora in un negozio', 'works in a shop') : k === 'O' ? L('impiegato in ufficio', 'office worker') : k === 'I' ? L('operaio', 'factory worker') : L('lavora in ', 'works at ') + (o && SV[o.type] ? SV[o.type].n() : ''); return w + (o && o.seg != null && segs.get(o.seg) && streetName(segs.get(o.seg)) ? ' (' + streetName(segs.get(o.seg)) + ')' : ''); }
  if (p.a >= 65) return L('in pensione', 'retired'); return L('cerca lavoro', 'unemployed');
}
const ST_N = () => [L('a casa', 'at home'), L('in viaggio', 'travelling'), L('al lavoro', 'at work'), L('nei negozi', 'shopping'), L('fuori città', 'out of town')];
followCitizen = function (pid) {
  const p = POP.p.get(pid); if (!p) return;
  let v = POP.carOf.get(pid); if (v && !vehicles.has(v)) v = null;
  if (!v) {
    if (p.s !== ST.VIAGGIO) {
      if (p.s === ST.CASA && p.j && siteMax(jobSite(p.j))) goTo(p, p.j, ST.LAVORO, true);
      else if (p.s === ST.CASA) { const b = pickShop(p); if (b) goTo(p, b.id, ST.NEGOZIO, true); }
      else goHome(p);
    }
    if (p.s === ST.VIAGGIO) {
      const last = POP.trips[POP.trips.length - 1]; if (last && last.pid === pid) POP.trips.pop();
      const dst = p.ts === ST.LAVORO ? jobSite(p.j) : p.ts === ST.CASA ? (p.h > 0 ? buildings.get(p.h) : null) : buildings.get(p.to);
      p.m = 'c'; p.car = false; p.t = Math.max(p.t, S.time + 1);
      if (spawnPersonTrip({ k: 'p', pid, A: p.wa, B: dst, G: !p.wa || !dst ? pick(POP.outs) : null, t: S.time })) v = POP.carOf.get(pid);
    }
  }
  if (!v) { toast(L('Non trova una strada per uscire', 'No route to go anywhere'), 2500); return; }
  const hb = p.h > 0 ? buildings.get(p.h) : null, dst = p.ts === ST.LAVORO ? jobSite(p.j) : buildings.get(p.to);
  const goal = (p.ts === ST.LAVORO ? L('al lavoro in ', 'to work in ') : p.ts === ST.NEGOZIO ? L('a fare la spesa in ', 'shopping in ') : L('verso casa in ', 'home to ')) + (dst && segs.get(dst.seg) ? streetName(segs.get(dst.seg)) || '?' : L('fuori città', 'out of town'));
  v.cit = { name: citName(p), age: Math.floor(p.a), job: citJob(p), addr: hb ? bldAddr(hb) : L('fuori città', 'out of town'), goal };
  const cb = v.onArrive; v.onArrive = (x) => { if (cb) cb(x); toast('👤 ' + v.cit.name + L(' è arrivato', ' has arrived'), 3000); };
  followVeh = v; selected = { kind: 'veh', obj: v }; openSide('sel'); cam.dist = Math.min(cam.dist, 260);
};
// scheda dell'edificio: chi ci vive / chi ci lavora, con i numeri veri
function popCardHTML(o) {
  const row = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`; let h = '';
  if (o.hh) {
    let home = 0; const ppl = []; for (const fid of o.fams || []) { const f = POP.f.get(fid); if (f) for (const id of f.m) { const p = POP.p.get(id); if (p) { ppl.push(p); if (p.s === ST.CASA) home++; } } }
    h += row(L('Famiglie', 'Households'), `${o.occ} / ${o.hh}`) + row(L('Abitanti', 'Residents'), `${o.res || 0} / ${o.cap} ${L('max', 'max')}`) + row(L('In casa adesso', 'At home now'), home) + ((o.resv || 0) ? row(L('Famiglie in arrivo', 'Families moving in'), o.resv) : '');
    if (ppl.length) {
      h += `<div class="sec">${L('Chi ci vive', 'Who lives here')}</div>`;
      for (const p of ppl.slice(0, 8)) { const nm = citName(p); h += `<div class="row"><span>${nm}, ${Math.floor(p.a)}</span><span style="text-align:right">${citJob(p)} · ${ST_N()[p.s]} <button title="${L('Segui', 'Follow')}" style="padding:0 5px" onclick="followCitizen(${p.id})">🎥</button></span></div>`; }
      if (ppl.length > 8) h += `<div style="font-size:12px;color:var(--mute)">${L('e altri', 'and')} ${ppl.length - 8} ${L('', 'more')}</div>`;
    }
  }
  if (o.jobs) {
    let at = 0, comm = 0; for (const id of o.wl || []) { const p = POP.p.get(id); if (!p) continue; if (p.s === ST.LAVORO) at++; if (p.h === OUTH) comm++; }
    h += row(L('Impiegati', 'Employees'), `${o.wk || 0} / ${o.jobs} ${L('max', 'max')}`) + row(L('Al lavoro adesso', 'At work now'), at) + (comm ? row(L('di cui pendolari da fuori', 'of which commuters'), comm) : '');
    if (o.cmax) h += row(L('Clienti adesso', 'Customers now'), `${o.cust || 0} / ${o.cmax} ${L('max', 'max')}`);
  }
  return h;
}

// ---------- pedoni: solo le persone vere che stanno camminando ----------
function popWalkersNear(cx, cz, r, max) {
  const out = [];
  for (const id of POP.walk) { const p = POP.p.get(id); if (!p || p.s !== ST.VIAGGIO || p.m !== 'w' || !p.ws) continue; if (Math.abs(p.ws.x - cx) > r || Math.abs(p.ws.z - cz) > r) continue; out.push(p); if (out.length >= max) break; }
  return out;
}

// ---------- salvataggi: le persone vengono salvate una per una ----------
function popPack() {
  const pp = []; for (const p of POP.p.values()) pp.push(p.id, p.f, p.h, Math.round(p.a * 10), p.j, p.sh);
  const tg = []; for (const g of POP.tour.values()) if (g.s === 1) tg.push(g.n, g.at, Math.round((g.t2 - S.time) * 10));
  return { v: 1, p: pp, t: tg, nP: POP.nP, nF: POP.nF, nT: POP.nT, log: POP.tourLog.map(x => [Math.round((x[0] - S.time) * 10), x[1]]) };
}
function popClearBlds() { for (const b of buildings.values()) { b.res = 0; b.wk = 0; b.cust = 0; b.resv = 0; b.fams = new Set(); b.wl = new Set(); if (b.hh || b.jobs) b.occ = 0; } for (const s of svcs.values()) { s.wl = new Set(); s.wk = 0; } }
function popUnpack(d) {
  popReset(); popClearBlds();
  POP.nP = d.nP || 1; POP.nF = d.nF || 1; POP.nT = d.nT || 1;
  const fams = new Map(), jobs = [];
  for (let i = 0; i < d.p.length; i += 6) {
    const [id, fid, h, a10, j, sh] = d.p.slice(i, i + 6);
    const p = { id, f: fid, h, a: a10 / 10, j: 0, s: h === OUTH ? ST.FUORI : ST.CASA, at: 0, t: 0, sh, to: 0, ts: 0, m: '' };
    POP.p.set(id, p); POP.where[p.s]++;
    if (h === OUTH) POP.comm++;
    else { let f = fams.get(fid); if (!f) { f = { id: fid, h: NOHOME, m: [] }; fams.set(fid, f); POP.f.set(fid, f); } f.m.push(id); }
    if (j) jobs.push([p, j]);
  }
  for (const f of fams.values()) { const hid = POP.p.get(f.m[0])?.h; const b = buildings.get(hid); if (b && b.hh && b.occ < b.hh) famIn(f, b); else famOut(f); }
  for (const p of POP.p.values()) if (p.h !== OUTH && workAge(p)) POP.unemp.add(p.id);
  for (const [p, j] of jobs) { const o = jobSite(j); if (o && (o.wk || 0) < siteMax(o)) { const sh = p.sh; popHire(p, o, j); p.sh = sh; } else if (p.h === OUTH) popDel(p); }
  for (let i = 0; i < (d.t || []).length; i += 3) { const b = buildings.get(d.t[i + 1]); if (!b) continue; const g = { id: POP.nT++, n: d.t[i], at: b.id, s: 1, t: S.time, t2: S.time + d.t[i + 2] / 10, or: 'strada' }; POP.tour.set(g.id, g); b.cust = (b.cust || 0) + g.n; }
  POP.tourLog = (d.log || []).map(x => [S.time + x[0] / 10, x[1]]);
}
// vecchi salvataggi (prima delle persone vere): dalle famiglie e dai lavoratori salvati si creano persone vere
function popMigrate() {
  const oldOcc = new Map(); for (const b of buildings.values()) oldOcc.set(b.id, b.occ || 0);
  popReset(); popClearBlds(); POP.outs = outsideNodes();
  for (const b of buildings.values()) {
    if (!b.hh || b.aband || b.ruin) continue;
    const n = Math.min(b.hh, oldOcc.get(b.id));
    for (let i = 0; i < n; i++) { const f = { id: POP.nF++, h: NOHOME, m: [] }; POP.f.set(f.id, f); for (const a of famComp()) popNew(f, NOHOME, a); famIn(f, b); }
  }
  for (const b of buildings.values()) {
    if (!b.jobs || b.aband || b.ruin) continue;
    let need = Math.min(siteMax(b), b.hh ? Math.round(b.jobs * 0.8) : oldOcc.get(b.id));
    while (need > 0) { const p = pickWorker(b); if (!p) break; popHire(p, b, b.id); need--; }
    while (need > 0 && POP.outs.length) { const p = popNew(null, OUTH, 22 + rand() * 40); POP.comm++; popHire(p, b, b.id); need--; }
  }
}
const _serializeP = serialize;
serialize = function () { S.ppl = popPack(); try { return _serializeP(); } finally { delete S.ppl; } };
const _deserializeGP = deserializeG;
deserializeG = function* (json) {
  yield* _deserializeGP(json);
  const d = S.ppl; delete S.ppl;
  if (d && d.v === 1) popUnpack(d); else popMigrate();
  S.flow = S.flow || flowZero();
  popHour(); computeStats(); computeDemand(); refreshLists();
};
const _resetWorldP = resetWorld;
resetWorld = function () { popReset(); stats.flowM = flowZero(); stats.flowLast = flowZero(); _resetWorldP(); };
const _destroyBuildingP = destroyBuilding;
destroyBuilding = function (b, keepCells) { if (b && buildings.has(b.id)) popEvict(b, 'move'); _destroyBuildingP(b, keepCells); };
const _hourlyP = hourly;
hourly = function () { _hourlyP(); if (S) popHour(); };
// statistiche finali con i numeri veri (dopo tutte le altre regole)
const _computeStatsP = computeStats;
computeStats = function () {
  _computeStatsP();
  stats.tourTarget = stats.tourists; stats.tourists = POP.tourLog.reduce((a, x) => a + x[1], 0);
  const w = POP.where; stats.where = { casa: w[0], viaggio: w[1], lavoro: w[2], negozi: w[3], fuori: w[4] };
  let arriving = 0; for (const a of POP.arr) if (!a.done) arriving += a.ages.length; stats.arriving = arriving;
  stats.homeless = POP.hl;
};
// pannello Statistiche: dove sono adesso le persone e quante sono entrate/uscite
function popWhereHTML(row) {
  const w = stats.where || {}, F = S.flow || flowZero(), M = stats.flowM || flowZero();
  return `<div class="sec">${L('Dove sono adesso', 'Where people are now')}</div>` +
    row('🏠 ' + L('A casa', 'At home'), fmtNum(w.casa || 0)) + row('💼 ' + L('Al lavoro', 'At work'), fmtNum(w.lavoro || 0)) + row('🛍️ ' + L('Nei negozi', 'Shopping'), fmtNum(w.negozi || 0)) + row('🚗 ' + L('In viaggio', 'Travelling'), fmtNum(w.viaggio || 0)) + row('🛣️ ' + L('Pendolari ancora fuori città', 'Commuters still outside'), fmtNum(w.fuori || 0)) +
    row('🏕️ ' + L('Senzatetto', 'Homeless'), fmtNum(stats.homeless || 0)) + row('📦 ' + L('Famiglie in arrivo (persone)', 'Moving in (people)'), fmtNum(stats.arriving || 0)) + row('📸 ' + L('Turisti in città adesso', 'Tourists in town now'), fmtNum(stats.tourHere || 0)) +
    `<div class="sec">${L('Entrati e usciti', 'In and out')} <span style="font-weight:normal;color:var(--mute)">(${L('questo mese / da sempre', 'this month / all time')})</span></div>` +
    row('🛣️ ' + L('Arrivati in auto', 'Arrived by road'), `${fmtNum(M.in.strada)} / ${fmtNum(F.in.strada)}`) + row('🚆 ' + L('Arrivati in treno', 'Arrived by train'), `${fmtNum(M.in.treno)} / ${fmtNum(F.in.treno)}`) + row('⛴️ ' + L('Arrivati in nave', 'Arrived by ship'), `${fmtNum(M.in.nave)} / ${fmtNum(F.in.nave)}`) + row('👶 ' + L('Nati', 'Born'), `${fmtNum(M.in.nati)} / ${fmtNum(F.in.nati)}`) +
    row('🚚 ' + L('Partiti', 'Moved away'), `${fmtNum(M.out.partiti)} / ${fmtNum(F.out.partiti)}`) + row('⚰️ ' + L('Morti', 'Died'), `${fmtNum(M.out.morti)} / ${fmtNum(F.out.morti)}`);
}
