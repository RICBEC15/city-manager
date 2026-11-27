// =====================================================================
//  Idee prese dalle mod più usate di Cities: Skylines II - Blocco 7:
//  servizi, parchi e divertimenti. Tutto rifatto da zero, con nomi
//  inventati e senza marchi veri (niente codice né modelli delle mod).
//  Negozi grandi: 16 multisala · 23/214 ipermercati · 55/127/76/128 supermercati
//    142 fai-da-te · 158 centro di quartiere · 221 paninoteca · 237 noleggio furgoni
//  Svago: 26/112 molo dei divertimenti a moduli (95 113 118 125 130 136)
//    47 minigolf · 75 area festival · 84 spiaggia attrezzata · 65 torre dell'acqua
//    32 acquario del conservificio · 220 cubo del sapere (scherzo)
//  Servizi in stile nuovo: 34/186/194 scuole · 99 università storica · 39/109 ospedali
//    147 biblioteca · 116/174 metro · 183 stazione · 172 terminal regionali
//    180 centro pacchi · 191 centro logistico · 193 centrale a 4 reattori · 233 centro dati
// =====================================================================

// ---------- nuovo menu 🛒 ----------
CAT.shop = { i: '🛒', n: () => L('Negozi grandi', 'Big shops') };
SVCOL.shop = 0xd8b890;
if (!TB.some(t => t.id === 'shop')) TB.splice(TB.findIndex(t => t.id === 'lines'), 0, { id: 'shop', i: CAT.shop.i, n: CAT.shop.n });

// shop = clienti che il negozio serve (abitanti nel raggio r); eff2 = coperture in più
Object.assign(SV, {
  // --- negozi grandi ---
  cinemall: { cat: 'shop', w: 110, d: 80, cost: 380000, upk: 5200, ms: 5, r: 1500, shop: 9000, park: 5, attr: 6, indoor: true, h: 22, xp: 900,
    n: () => L('Multisala Cinestella con negozi', 'Cinestella multiplex & shops'), d2: () => L('Cinema con 8 sale, ristoranti e una galleria di negozi: svago al chiuso e turisti', 'Cinema with 8 screens, restaurants and a shopping hall: indoor leisure and tourists') },
  hyper1: { cat: 'shop', w: 120, d: 100, cost: 260000, upk: 3200, ms: 4, r: 2200, shop: 12000, eff2: ['parking'], h: 12, xp: 600,
    n: () => L('Ipermercato Granaio', 'Granary hypermarket'), d2: () => L('Spesa per migliaia di famiglie, con un grande parcheggio davanti', 'Groceries for thousands of families, with a big car park in front') },
  hyper2: { cat: 'shop', w: 140, d: 110, cost: 320000, upk: 3900, ms: 5, r: 2500, shop: 15000, eff2: ['parking'], noise: 3, h: 13, xp: 700,
    n: () => L('Ipermercato Grande Cesto', 'Big Basket hypermarket'), d2: () => L('Il più grande: baie di carico per i camion sul retro e parcheggio enorme', 'The biggest: truck loading bays at the back and a huge car park') },
  smkt00: { cat: 'shop', w: 50, d: 44, cost: 70000, upk: 900, ms: 2, r: 900, shop: 3000, eff2: ['parking'], h: 7,
    n: () => L('Supermercato Spigolo (anni 2000)', 'Spigolo supermarket (2000s)'), d2: () => L('Supermercato di quartiere col tetto di tegole e qualche posto auto', 'Neighbourhood supermarket with a tiled roof and a few parking spaces') },
  smkt20: { cat: 'shop', w: 60, d: 52, cost: 95000, upk: 1100, ms: 3, r: 1000, shop: 3800, eff2: ['parking'], h: 8,
    n: () => L('Supermercato Vetrina (moderno)', 'Vetrina supermarket (modern)'), d2: () => L('Tutto di vetro, con parcheggio e colonnine per ricaricare le auto elettriche', 'All glass, with a car park and chargers for electric cars') },
  smkt20b: { cat: 'shop', w: 56, d: 46, cost: 90000, upk: 1050, ms: 3, r: 1000, shop: 3600, eff2: ['parking'], h: 9,
    n: () => L('Supermercato Falda (tetto inclinato)', 'Falda supermarket (sloped roof)'), d2: () => L('Moderno, con il tetto inclinato e grandi vetrate', 'Modern, with a sloping roof and large windows') },
  smktcity: { cat: 'shop', w: 30, d: 26, cost: 55000, upk: 700, ms: 2, r: 600, shop: 2500, h: 10,
    n: () => L('Supermercato di città (in mattoni)', 'City supermarket (brick)'), d2: () => L('Piccolo e senza parcheggio: perfetto in centro, dove si va a piedi', 'Small and without parking: perfect downtown, where people walk') },
  diy: { cat: 'shop', w: 100, d: 80, cost: 210000, upk: 2400, ms: 4, r: 2400, shop: 7000, eff2: ['parking'], p: 4, h: 11, xp: 500,
    n: () => L('Fai-da-te Martello Verde', 'Green Hammer DIY store'), d2: () => L('Attrezzi e giardino: tetto verde con pannelli solari (4 MW) e ricarica per le auto elettriche', 'Tools and garden: green roof with solar panels (4 MW) and electric car charging') },
  stripctr: { cat: 'shop', w: 64, d: 40, cost: 60000, upk: 700, ms: 2, r: 700, shop: 2200, eff2: ['parking'], park: 1, h: 6,
    n: () => L('Centro di quartiere Fiocco', 'Fiocco neighbourhood centre'), d2: () => L('Lavanderia a gettoni, negozio di bevande e un parcheggio', 'Laundromat, drinks shop and a car park') },
  sandwich: { cat: 'shop', w: 22, d: 20, cost: 25000, upk: 300, ms: 1, r: 450, shop: 900, park: 1, h: 5,
    n: () => L('Paninoteca Mezzo Metro', 'Mezzo Metro sandwich bar'), d2: () => L('Panini da asporto con la terrazza e gli ombrelloni', 'Takeaway sandwiches with a terrace and parasols') },
  vanrent: { cat: 'shop', w: 44, d: 40, cost: 45000, upk: 500, ms: 2, r: 1500, shop: 1200, h: 6,
    n: () => L('Noleggio furgoni Traslocasa', 'Traslocasa van rental'), d2: () => L('Furgoni a noleggio per i traslochi: le famiglie si spostano più volentieri in città', 'Rental vans for moving house: families move into the city more easily') },
  // --- svago ---
  minigolf: { cat: 'parks', w: 46, d: 36, cost: 22000, upk: 350, ms: 2, r: 500, park: 5, attr: 1, n: () => L('Minigolf', 'Mini golf'), d2: () => L('9 buche con la club house: piace a tutte le età', '9 holes with a club house: fun for all ages') },
  festival: { cat: 'parks', w: 150, d: 110, cost: 180000, upk: 2500, ms: 5, r: 1600, park: 5, attr: 10, noise: 6, summer: true, unique: true, xp: 1500,
    n: () => L('Prato dei concerti', 'Concert meadow'), d2: () => L('Area festival con palchi e stand: d\'estate arrivano tantissimi turisti (un po\' di rumore)', 'Festival grounds with stages and stalls: lots of tourists in summer (some noise)') },
  beachshop: { cat: 'parks', w: 70, d: 26, cost: 30000, upk: 400, ms: 2, r: 700, shop: 1500, park: 3, attr: 3, summer: true, shore: true,
    n: () => L('Negozi sulla spiaggia', 'Beach shops'), d2: () => L('Chioschi, gelati e noleggio ombrelloni lungo la riva', 'Kiosks, ice cream and parasol rental along the shore') },
  beachsport: { cat: 'parks', w: 60, d: 36, cost: 18000, upk: 250, ms: 2, r: 650, park: 7, attr: 2, summer: true, shore: true,
    n: () => L('Beach volley e surf', 'Beach volleyball & surf'), d2: () => L('Campi da beach volley e tavole da surf: sport in riva al mare', 'Volleyball courts and surfboards: sport by the sea') },
  beachpark: { cat: 'parks', w: 110, d: 50, cost: 45000, upk: 600, ms: 3, r: 1000, park: 9, attr: 4, summer: true, shore: true,
    n: () => L('Grande parco della spiaggia', 'Big beach park'), d2: () => L('Dune, palme, passerelle di legno e docce: tutta la spiaggia diventa un parco', 'Dunes, palms, boardwalks and showers: the whole beach becomes a park') },
  watertw: { cat: 'water', w: 22, d: 22, cost: 70000, upk: 900, ms: 3, wat: 500, r: 600, park: 2, attr: 3, h: 34, unique: true, xp: 600,
    n: () => L('Torre dell\'acqua Belvedere', 'Belvedere water tower'), d2: () => L('Torre in mattoni: pompa l\'acqua e in cima c\'è una terrazza panoramica che attira turisti', 'Brick tower: pumps water, and on top a viewing terrace draws tourists') },
  cannery: { cat: 'parks', w: 80, d: 50, cost: 300000, upk: 3800, ms: 6, r: 1300, park: 6, attr: 14, indoor: true, unique: true, shore: true, h: 14, xp: 3000,
    n: () => L('Acquario del Vecchio Conservificio', 'Old Cannery Aquarium'), d2: () => L('Un vecchio conservificio sul mare trasformato in acquario: turisti tutto l\'anno', 'An old seaside cannery turned into an aquarium: tourists all year round') },
  readcube: { cat: 'edu', w: 8, d: 8, cost: 15000, upk: 100, ms: 1, unique: true, free: true, h: 6,
    n: () => L('Cubo del Sapere (per scherzo)', 'Cube of Knowledge (a joke)'), d2: () => L('Un cubo che non fa niente... ma i cittadini dicono che li fa studiare: un pizzico di istruzione in più in tutta la città', 'A cube that does nothing... but people say it makes them study: a pinch more education citywide') },
  // --- 26/112 molo dei divertimenti a moduli ---
  pa_pier: { cat: 'parks', w: 50, d: 140, cost: 90000, upk: 1800, ms: 4, r: 1500, park: 3, attr: 5, parea: true, shore: true, summer: true, noise: 3,
    n: () => L('Molo dei divertimenti', 'Amusement pier'), d2: () => L('Un lungo molo sul mare con giostre a moduli: montagne russe di legno, ruota, seggiovia, chioschi...', 'A long pier over the sea with rides as modules: wooden coaster, wheel, sky glider, food stalls...') },
  // --- scuole, università, biblioteca ---
  school_h: { cat: 'edu', w: 44, d: 34, cost: 42000, upk: 2500, ms: 1, r: 1150, cap: 3200, eff: 'edu1', h: 13, n: () => L('Scuola elementare storica', 'Historic elementary school'), d2: () => L('Mattoni rossi e finestre ad arco, come le scuole di una volta', 'Red brick and arched windows, like the old schools') },
  high_h: { cat: 'edu', w: 58, d: 42, cost: 98000, upk: 5000, ms: 3, r: 1900, cap: 6500, eff: 'edu2', h: 18, n: () => L('Liceo storico con torre', 'Historic high school with tower'), d2: () => L('Grande liceo in mattoni con la torre dell\'orologio', 'Large brick high school with a clock tower') },
  school_30: { cat: 'edu', w: 50, d: 36, cost: 52000, upk: 2900, ms: 2, r: 1300, cap: 4200, eff: 'edu1', h: 15, n: () => L('Scuola media anni \'30', '1930s middle school'), d2: () => L('Edificio storico a tre piani con il portone in pietra', 'Historic three-storey building with a stone doorway') },
  high_p: { cat: 'edu', w: 80, d: 60, cost: 120000, upk: 5400, ms: 3, r: 1800, cap: 6000, eff: 'edu2', park: 4, h: 12, n: () => L('Liceo nel parco', 'Park high school'), d2: () => L('Liceo moderno con parco, campo sportivo e campo da basket aperti al quartiere', 'Modern high school with a park, sports field and basketball court open to the neighbourhood') },
  uni_h: { cat: 'edu', w: 150, d: 110, cost: 650000, upk: 20000, ms: 7, r: 6000, cap: 40000, eff: 'edu3', attr: 4, unique: true, h: 28, xp: 3000,
    n: () => L('Università dei Colli (storica)', 'Hills University (historic)'), d2: () => L('Grande università storica con chiostri e torre: fino a 40.000 studenti', 'Grand historic university with cloisters and a tower: up to 40,000 students') },
  bookhill: { cat: 'edu', w: 44, d: 44, cost: 160000, upk: 2600, ms: 4, r: 1200, cap: 4000, eff: 'edu2', park: 2, attr: 5, indoor: true, unique: true, h: 30, xp: 1500,
    n: () => L('Biblioteca Montagna di Libri', 'Book Mountain Library'), d2: () => L('Una biblioteca a piramide di scaffali dentro una teca di vetro: più diplomati e qualche turista', 'A pyramid of shelves inside a glass box: more graduates and some tourists') },
  // --- ospedali ---
  hospcamp: { cat: 'health', w: 120, d: 90, cost: 320000, upk: 12000, ms: 5, r: 3000, cap: 18000, eff: 'health', eff2: ['death', 'parking'], veh: 'ambulance', h: 24, xp: 1000,
    n: () => L('Campus ospedaliero', 'Hospital campus'), d2: () => L('8 edifici: ospedale, cliniche, servizi funebri e un parcheggio multipiano', '8 buildings: hospital, clinics, funeral services and a parking garage') },
  hosp_m: { cat: 'health', w: 90, d: 70, cost: 380000, upk: 13000, ms: 6, r: 4200, cap: 22000, eff: 'health', veh: 'ambulance', h: 48, xp: 1200,
    n: () => L('Policlinico moderno con eliporto', 'Modern teaching hospital with helipad'), d2: () => L('Torre ospedaliera universitaria: l\'eliporto sul tetto fa arrivare i soccorsi lontano', 'University hospital tower: the rooftop helipad lets help reach far') },
  // --- trasporti ---
  metro_v: { cat: 'transport', w: 26, d: 22, cost: 95000, upk: 2400, ms: 6, station: 'metro', free: true, attr: 1, n: () => L('Stazione metro d\'epoca', 'Vintage metro station'), d2: () => L('Ingresso con mosaici e vecchi manifesti, i treni passano sotto terra', 'Entrance with mosaics and old posters, trains run underground') },
  metro_e: { cat: 'transport', w: 60, d: 26, cost: 130000, upk: 2800, ms: 6, station: 'metro', free: true, h: 14, n: () => L('Stazione metro sopraelevata', 'Elevated metro station'), d2: () => L('Banchine in alto con il tetto inclinato e una piazza coperta sotto', 'Raised platforms under a sloping roof, with a covered square below') },
  trainjp: { cat: 'transport', w: 90, d: 34, cost: 140000, upk: 4400, ms: 5, station: 'train', rail: true, bigTrain: true, plat: 4, h: 12, n: () => L('Stazione Pruno (2 banchine)', 'Pruno station (2 platforms)'), d2: () => L('Stazione bianca in stile giapponese con 2 banchine coperte e il ponte pedonale', 'White Japanese-style station with 2 covered platforms and a footbridge') },
  parcel: { cat: 'misc', w: 80, d: 60, cost: 170000, upk: 4800, ms: 5, r: 4600, eff: 'mail', veh: 'van', noise: 3, n: () => L('Centro pacchi Fulmine', 'Fulmine parcel centre'), d2: () => L('Smista i pacchi: i furgoni girano per tutta la città', 'Sorts parcels: vans drive all over the city') },
  logist: { cat: 'transport', w: 150, d: 90, cost: 210000, upk: 5000, ms: 6, noise: 5, n: () => L('Centro logistico Spaziomerci', 'Spaziomerci logistics centre'), d2: () => L('Magazzini enormi per le merci su strada: come il porto secco, le fabbriche spediscono qui', 'Huge warehouses for road freight: like the dry port, factories ship here') },
  // --- energia e dati ---
  nuke4: { cat: 'power', w: 220, d: 170, cost: 4200000, upk: 65000, ms: 9, p: 2000, noise: 5, h: 60, n: () => L('Centrale a quattro reattori', 'Four-reactor power plant'), d2: () => L('2000 MW con 4 reattori e i laghi di raffreddamento. Servono trasformatori.', '2000 MW from 4 reactors with cooling ponds. Needs transformers.') },
  datacenter: { cat: 'misc', w: 110, d: 80, cost: 480000, upk: 11000, ms: 7, r: 7000, eff: 'net', h: 16, xp: 1000, n: () => L('Centro dati Nuvola', 'Nuvola data centre'), d2: () => L('Enorme centro dati: internet per 7 km e software che fa guadagnare di più gli uffici', 'Huge data centre: internet for 7 km and software that makes offices earn more') },
});
// moduli: il molo, e 3 giostre nuove anche per il luna park
Object.assign(PMOD, {
  pcoaster: { attr: 4, park: 0.6 }, chairs: { attr: 2, park: 0.7 }, pwheel: { attr: 3, park: 0.6 }, glider: { attr: 2, park: 0.6 },
  snacks: { attr: 1, park: 0.6 }, midway: { attr: 2, park: 0.7 }, pierext: { attr: 1, park: 0.8 },
});
PAREA.push('pa_pier');
EXT.pa_pier = [PM_('pcoaster', 90000, 1600, 'Montagne russe di legno', 'Wooden roller coaster'), PM_('pwheel', 60000, 1000, 'Ruota panoramica del molo', 'Pier Ferris wheel'),
  PM_('chairs', 28000, 500, 'Giostra con le catene', 'Swing ride'), PM_('glider', 40000, 700, 'Seggiovia sul molo', 'Sky glider'),
  PM_('snacks', 9000, 200, 'Chioschi: pizza, zucchero filato, mele caramellate', 'Food stalls: pizza, candy floss, toffee apples'), PM_('midway', 15000, 300, 'Giochi da luna park', 'Midway games'),
  PM_('pierext', 20000, 300, 'Prolunga del molo', 'Pier extension')];
EXT.pa_fun = (EXT.pa_fun || []).concat([PM_('chairs', 28000, 500, 'Giostra con le catene', 'Swing ride'), PM_('glider', 40000, 700, 'Seggiovia', 'Sky glider'), PM_('midway', 15000, 300, 'Giochi da luna park', 'Midway games')]);
EXT.uni_h = [{ k: 'wing', cost: 160000, upk: 4000, capM: 1.25, n: () => L('Nuova ala (più posti)', 'New wing (more places)') }];
EXT.airport = (EXT.airport || []).concat([{ k: 'regterm', cost: 260000, upk: 7000, n: () => L('Terminal regionali (9 gate e 4 merci)', 'Regional terminals (9 gates, 4 cargo)') }]);
// albero di sviluppo: le versioni nuove si sbloccano insieme a quelle che ci sono già
{
  const add = (id, ...ks) => { const t = TREE.find(t => t.id === id); if (t) t.items.push(...ks); };
  add('t_nuke', 'nuke4'); add('t_metro', 'metro_v', 'metro_e'); add('t_uni', 'uni_h'); add('t_hosp', 'hospcamp', 'hosp_m');
  add('t_server', 'datacenter'); add('t_cargo2', 'logist'); add('t_parea2', 'pa_pier'); add('t_sort', 'parcel');
  for (const t of TREE) for (const k of t.items || []) TREE_ITEM[k] = t.id;
}
// 172: più aerei insieme con i terminal regionali
{ const _ps = planeSlots; planeSlots = function (sv) { return _ps(sv) + (sv.ext && sv.ext.includes('regterm') ? 3 : 0); }; }

// ---------- regole: spesa, coperture in più, scherzi ----------
let cubeOn = false;
{
  const _cc = computeCoverage;
  computeCoverage = function () {
    _cc();
    for (const b of buildings.values()) b.cov.shop = 0;
    cubeOn = [...svcs.values()].some(s => s.on && s.type === 'readcube');
    for (const sv of svcs.values()) {
      if (!sv.on) continue; const d = SV[sv.type]; if (!d || (!d.shop && !d.eff2)) continue;
      const r = (d.r || 600) * (0.75 + 0.25 * clamp(S.budget[d.cat] / 100, 0.3, 1.5)); let load = 0;
      if (d.shop) bldNear(sv.x, sv.z, r, b => { if (b.hh) load += b.res || 0; });
      if (d.shop) sv.load = load;
      const capEff = d.shop ? clamp(d.shop / Math.max(load, 1), 0.25, 1) : 1;
      bldNear(sv.x, sv.z, r, b => {
        const fall = 1 - smooth(r * 0.6, r, Math.hypot(b.x - sv.x, b.z - sv.z));
        if (d.shop) b.cov.shop = Math.max(b.cov.shop, fall * capEff);
        for (const e of d.eff2 || []) b.cov[e] = Math.max(b.cov[e] || 0, fall);
      });
    }
  };
  const _ub = updateBuilding;
  updateBuilding = function (b) {
    _ub(b); if (b.ruin || b.cons > 0 || !b.fac) return;
    if (b.hh && b.cov?.shop > 0) { const v = b.cov.shop * 3; b.fac.shop = v; b.happy = clamp(b.happy + v * 0.3, 0, 100); }
    if (b.hh && cubeOn && b.edu < 1) b.edu = Math.min(1, b.edu + 0.0004);
  };
  const _fl = facList;
  facList = function (f) { return _fl(f).replace(/<span>shop<\/span>/, `<span>${L('Negozi grandi vicini', 'Big shops nearby')}</span>`); };
  const _bn = budgetNow;
  budgetNow = function () {
    const bg = _bn(); let shop = 0, data = 0;
    for (const sv of svcs.values()) {
      if (!sv.on) continue; const d = SV[sv.type]; if (!d) continue;
      if (d.shop) shop += shopIncome(sv);
      if (sv.type === 'datacenter') data += (bg.inc.off || 0) * 0.08;
    }
    if (shop || data) {
      bg.inc.com = (bg.inc.com || 0) + shop; bg.inc.off = (bg.inc.off || 0) + Math.min(data, 30000);
      bg.ti = Object.keys(bg.inc).reduce((a, k) => a + (typeof bg.inc[k] === 'number' ? bg.inc[k] : 0), 0); bg.net = bg.ti - bg.te;
    }
    return bg;
  };
  const _cd = computeDemand;
  computeDemand = function () {
    _cd();
    const d = stats.demand; if (!d || !d.why || !d.why.R) return;
    if ([...svcs.values()].some(s => s.on && s.type === 'vanrent')) { d.why.R.push([L('Noleggio furgoni per i traslochi', 'Van rental for moving'), 2]); d.R = clamp(d.R + 2, 0, 100); }
  };
  const _mo = monthly;
  monthly = function () {
    _mo();
    if ([...svcs.values()].some(s => s.on && s.type === 'logist')) S.cargoHub = true;
  };
}
function shopIncome(sv) { const d = SV[sv.type]; return Math.round(Math.min(sv.load || 0, d.shop) * 0.08 * Math.max(0, taxEff('C'))); }
{
  const _sx = svcExtraHTML;
  svcExtraHTML = function (o) {
    let h = _sx(o); const d = SV[o.type]; if (!d || !d.shop) return h;
    const r = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
    h += `<div class="sec">🛒 ${L('Negozio', 'Shop')}</div>` + r(L('Clienti nel raggio', 'Customers in range'), fmtNum(Math.round(o.load || 0)) + ' / ' + fmtNum(d.shop));
    h += r(L('Incasso (tasse negozi)', 'Income (shop taxes)'), fmtMoney(shopIncome(o)) + '/' + L('mese', 'mo'));
    if ((o.load || 0) > d.shop) h += `<div style="font-size:12px;color:var(--bad)">${L('Troppi clienti: costruisci un altro negozio vicino', 'Too many customers: build another shop nearby')}</div>`;
    return h;
  };
}

// ---------- disegno ----------
{
  const MINE = new Set(['cinemall', 'hyper1', 'hyper2', 'smkt00', 'smkt20', 'smkt20b', 'smktcity', 'diy', 'stripctr', 'sandwich', 'vanrent', 'minigolf', 'festival', 'beachshop', 'beachsport', 'beachpark',
    'watertw', 'cannery', 'readcube', 'pa_pier', 'school_h', 'high_h', 'school_30', 'high_p', 'uni_h', 'bookhill', 'hospcamp', 'hosp_m', 'metro_v', 'metro_e', 'trainjp', 'parcel', 'logist', 'nuke4', 'datacenter']);
  const _ds = drawSvc;
  drawSvc = function (sv) {
    const T = sv.type;
    if (!MINE.has(T)) {
      _ds(sv);
      const ex = sv.ext || [];
      if (T === 'pa_fun' && (ex.includes('chairs') || ex.includes('glider') || ex.includes('midway'))) drawRides(sv, true);
      if (T === 'airport' && ex.includes('regterm')) { curRef = sv; const yaw = sv.ang, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw); for (let i = 0; i < 9; i++) { const a = -sv.w * 0.42 + i * 16, b = -sv.d * 0.4; addPart(sv.parts, 'body', sv.x + fx * b + rx * a, sv.y, sv.z + fz * b + rz * a, yaw, 12, 7, 16, i < 5 ? 0xe4e8ec : 0xc8ccd0); } }
      return;
    }
    removeParts(sv.parts); curRef = sv; sv.anim = null;
    const y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
    const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0, yw = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw + yw, w, h, dd, c); };
    const cyl = (a, b, r, h, c, y0 = 0, pool = 'cyl') => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, 0, r, h, r, c); };
    const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
    const glass = POOLS.pfg ? 'pfg' : 'body', neon = POOLS.pfn ? 'pfn' : 'plain', dome = POOLS.pfd ? 'pfd' : 'cyl';
    const tree = (a, b, s = 1) => { if (POOLS.pft) { const [x, z] = at(a, b); cyl(a, b, 0.35 * s, 2.5 * s, 0x6a4a2a); addPart(P, 'pft', x, y + 2.2 * s, z, 0, 3.2 * s, 3.6 * s, 3.2 * s, 0x3f7a35); } else { cyl(a, b, 0.5, 3, 0x6a4a2a); cyl(a, b, 3 * s, 4 * s, 0x3f7a35, 3); } };
    const palm = (a, b) => { cyl(a, b, 0.35, 7, 0x8a6a4a); for (let i = 0; i < 4; i++) box(a, b, 5, 0.3, 1.1, 0x4f8a3a, 'plain', 7, i * Math.PI / 4); };
    // parcheggio: asfalto con le strisce
    const lot = (a, b, w, dd, cars = true) => {
      box(a, b, w, 0.32, dd, 0x4a4b50, 'plain');
      const n = Math.floor(w / 3.2); for (let i = 0; i <= n; i++) for (const s of [-1, 1]) box(a - w / 2 + 1.6 + i * 3.2, b + s * dd * 0.25, 0.2, 0.36, dd * 0.4, 0xe8e8e8, 'plain');
      if (cars) { const R = mulberry32(sv.id * 7 + Math.round(a)); const cc = [0xc0392b, 0x2e86c1, 0xf4f6f7, 0x1c2833, 0x7f8c8d, 0xd4ac0d]; for (let i = 0; i < n; i++) for (const s of [-1, 1]) if (R() < 0.55) box(a - w / 2 + 3.2 + i * 3.2 - 1.6, b + s * dd * 0.25, 1.9, 1.4, 4.2, cc[Math.floor(R() * cc.length)], 'body', 0.3); }
    };
    const shopFront = (a, b, w, h, dd, wall, sign, roof) => { box(a, b, w, h, dd, wall, 'plain'); box(a, b - dd / 2, w * 0.9, h * 0.45, 0.6, 0x9fd3ff, glass, 0.4); box(a, b - dd / 2 - 0.4, w * 0.5, 1.6, 0.4, sign, neon, h - 2.2); if (roof) box(a, b, w + 1, 0.8, dd + 1, roof, 'body', h); };
    switch (T) {
      case 'cinemall': {
        slab(0x9a9890); lot(0, -D * 0.36, W * 0.9, D * 0.24);
        box(0, D * 0.12, W * 0.9, 14, D * 0.5, 0xe8e2d6, 'plain'); box(0, D * 0.12, W * 0.92, 1, D * 0.52, 0x8a8478, 'plain', 14);
        box(-W * 0.22, D * 0.12, W * 0.36, 8, D * 0.42, 0x3a3c48, 'plain', 14); // sale
        box(W * 0.2, -D * 0.13, W * 0.3, 11, 1, 0x9fd3ff, glass, 1); box(W * 0.2, -D * 0.14, W * 0.26, 2.4, 0.6, 0xff3a5a, neon, 12);
        cyl(W * 0.36, -D * 0.12, 4, 22, 0xe8e2d6); box(W * 0.36, -D * 0.12, 5, 3, 5, 0xffd23a, neon, 22);
        break;
      }
      case 'hyper1': case 'hyper2': {
        const big = T === 'hyper2'; slab(0x8f8e88); lot(0, -D * 0.3, W * 0.95, D * 0.36);
        shopFront(0, D * 0.22, W * 0.85, 11, D * 0.5, big ? 0xe6e2da : 0xd8d2c4, big ? 0xe02a2a : 0x2a8a3a, 0xb8b4aa);
        box(0, D * 0.22, W * 0.3, 2, D * 0.3, 0xa8a69e, 'body', 11.8);
        if (big) for (let i = -3; i <= 3; i++) { box(i * W * 0.11, D * 0.48, W * 0.08, 4, 1, 0x5a5c62, 'body', 0); box(i * W * 0.11, D * 0.52, 3, 3.5, 6, 0xd8d8d8, 'body', 0.5); }
        else box(W * 0.38, D * 0.48, 12, 4, 2, 0x5a5c62);
        cyl(-W * 0.45, -D * 0.47, 0.4, 9, 0x888888); box(-W * 0.45, -D * 0.47, 6, 3, 0.8, big ? 0xe02a2a : 0x2a8a3a, neon, 9);
        break;
      }
      case 'smkt00': {
        slab(0x8f8e88); lot(-W * 0.05, -D * 0.33, W * 0.85, D * 0.3);
        box(0, D * 0.2, W * 0.8, 5.5, D * 0.5, 0xe6d6b8, 'plain'); box(0, D * 0.2, W * 0.86, 3, D * 0.56, 0xa8462e, 'roof', 5.5);
        box(0, D * 0.2 - D * 0.25 - 0.3, W * 0.5, 3, 0.4, 0x9fd3ff, glass, 0.4); box(-W * 0.25, -D * 0.06, 6, 1.6, 0.4, 0xf2c200, neon, 4);
        break;
      }
      case 'smkt20': {
        slab(0x8f8e88); lot(0, -D * 0.33, W * 0.9, D * 0.3);
        box(0, D * 0.2, W * 0.8, 7, D * 0.5, 0x9fd3ff, glass); box(0, D * 0.2, W * 0.84, 0.8, D * 0.54, 0xeeeeee, 'body', 7); box(0, D * 0.2, W * 0.8, 0.25, D * 0.5, 0x23365a, 'plain', 7.9);
        for (let i = 0; i < 4; i++) { box(-W * 0.4 + i * 4, -D * 0.47, 0.7, 1.6, 0.5, 0x2aa0ff, neon); }
        break;
      }
      case 'smkt20b': {
        slab(0x8f8e88); lot(0, -D * 0.33, W * 0.9, D * 0.3);
        box(0, D * 0.2, W * 0.8, 6, D * 0.5, 0xd8d8d4, 'plain'); box(0, -0.2 + D * 0.2 - D * 0.25, W * 0.76, 5, 0.6, 0x9fd3ff, glass, 0.4);
        for (let i = 0; i < 6; i++) box(0, D * 0.2 - D * 0.22 + i * D * 0.09, W * 0.86, 0.7, D * 0.1, 0x6a6e74, 'body', 6 + i * 0.6);
        break;
      }
      case 'smktcity': {
        box(0, 0, W * 0.95, 10, D * 0.9, 0x9a4a32); box(0, 0, W, 0.8, D * 0.95, 0x6a3020, 'body', 10);
        box(0, -D * 0.46, W * 0.8, 3.5, 0.5, 0x9fd3ff, glass, 0.4); box(0, -D * 0.47, W * 0.4, 1.3, 0.4, 0x2a6ad0, neon, 4.5);
        break;
      }
      case 'diy': {
        slab(0x8f8e88); lot(0, -D * 0.32, W * 0.95, D * 0.34);
        shopFront(0, D * 0.2, W * 0.9, 10, D * 0.55, 0xd8d4cc, 0xff7a1a, null);
        box(-W * 0.22, D * 0.2, W * 0.42, 0.6, D * 0.52, 0x5f9a48, 'plain', 10); // tetto verde
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) box(W * 0.08 + i * W * 0.075, D * 0.04 + j * D * 0.13, W * 0.06, 0.5, D * 0.1, 0x23365a, 'plain', 10.3);
        box(W * 0.4, D * 0.2, W * 0.12, 3, D * 0.4, 0x6a8a4a); // vivaio
        for (let i = 0; i < 4; i++) box(W * 0.45, -D * 0.47 + i * 3, 0.7, 1.6, 0.5, 0x2aa0ff, neon);
        break;
      }
      case 'stripctr': {
        slab(0x8f8e88); lot(0, -D * 0.25, W * 0.9, D * 0.36);
        const cols = [0x6ab0e0, 0xe0a040, 0xd8d0c0];
        for (let i = 0; i < 3; i++) shopFront(-W * 0.3 + i * W * 0.3, D * 0.27, W * 0.29, 5, D * 0.42, 0xe8e2d4, cols[i], 0x8a8478);
        break;
      }
      case 'sandwich': {
        slab(0xb8b0a0); shopFront(0, D * 0.15, W * 0.7, 5, D * 0.55, 0xf4f0e0, 0x2aa84a, 0x2a7a3a);
        for (const a of [-W * 0.3, 0, W * 0.3]) { cyl(a, -D * 0.32, 0.12, 2.5, 0x777777); box(a, -D * 0.32, 3, 0.4, 3, a ? 0xf2c200 : 0x2aa84a, 'body', 2.5); box(a, -D * 0.32, 1.4, 0.9, 1.4, 0xe8e0d0); }
        break;
      }
      case 'vanrent': {
        slab(0x6a6c70); shopFront(-W * 0.2, D * 0.25, W * 0.5, 6, D * 0.4, 0xeeeeee, 0xff6a00, 0xff6a00);
        for (let i = 0; i < 5; i++) { box(-W * 0.4 + i * 8, -D * 0.25, 2.8, 3.2, 6, 0xf4f4f4, 'body', 0.3); box(-W * 0.4 + i * 8, -D * 0.25, 2.85, 0.8, 6.05, 0xff6a00, 'plain', 2); }
        break;
      }
      case 'minigolf': {
        slab(0x5f9a48);
        for (let i = 0; i < 9; i++) { const a = -W * 0.38 + (i % 3) * W * 0.38, b = -D * 0.25 + Math.floor(i / 3) * D * 0.25; box(a, b, 9, 0.35, 4, 0x3fbf5a, 'plain', 0.2, i * 0.5); box(a, b, 10, 0.6, 0.3, 0xe8e0c8, 'plain', 0.2, i * 0.5); cyl(a + 3, b, 0.08, 1.5, 0xffffff); box(a + 3, b, 0.8, 0.5, 0.05, 0xff2a2a, 'plain', 1.5); }
        box(W * 0.38, -D * 0.42, 9, 4, 5, 0xe8e0c8); box(W * 0.38, -D * 0.42, 9.6, 2.5, 5.6, 0x3a7a8a, 'roof', 4);
        break;
      }
      case 'festival': {
        slab(0x7aa858);
        box(0, D * 0.36, W * 0.35, 2, D * 0.18, 0x3a3a40); for (const a of [-1, 1]) box(a * W * 0.17, D * 0.36, 1, 14, 1, 0x555555); box(0, D * 0.36, W * 0.37, 1.5, D * 0.2, 0x222228, 'body', 14);
        box(0, D * 0.28, W * 0.2, 4, 0.5, 0xff3ad0, neon, 3);
        box(-W * 0.4, -D * 0.1, W * 0.12, 1.5, D * 0.12, 0x3a3a40); box(-W * 0.4, -D * 0.1, 1, 9, 1, 0x555555); // palco piccolo
        const cc = [0xe04a3a, 0xf2c200, 0x2a8ad0, 0x3ab05a, 0xe07a2a];
        for (let i = 0; i < 10; i++) { box(-W * 0.3 + i * W * 0.065, -D * 0.4, 4, 3, 4, 0xf4f0e0); box(-W * 0.3 + i * W * 0.065, -D * 0.4, 4.6, 2, 4.6, cc[i % 5], 'roof', 3); }
        for (let i = 0; i < 8; i++) box(W * 0.3 + (i % 4) * 5, -D * 0.05 + Math.floor(i / 4) * 6, 3, 1.8, 3, 0x6ab0e0, 'body', 0); // tende
        break;
      }
      case 'beachshop': {
        box(0, 0, W, 0.25, D, 0xe6d29a, 'plain');
        const cc = [0xff6a6a, 0x6ab0ff, 0xffd23a, 0x6ad08a, 0xff9ad0];
        for (let i = 0; i < 5; i++) { const a = -W * 0.4 + i * W * 0.2; box(a, -D * 0.2, 9, 3.5, 6, 0xf4f0e8); box(a, -D * 0.2, 10, 1.2, 7, cc[i], 'roof', 3.5); }
        for (let i = 0; i < 8; i++) { const a = -W * 0.42 + i * W * 0.12; cyl(a, D * 0.22, 0.08, 2.2, 0xdddddd); cyl(a, D * 0.22, 1.6, 0.3, cc[i % 5], 2.2); }
        break;
      }
      case 'beachsport': {
        box(0, 0, W, 0.25, D, 0xe6d29a, 'plain');
        for (const a of [-W * 0.22, W * 0.22]) { box(a, -D * 0.05, 16, 0.08, 8, 0xd8c48a, 'plain', 0.25); box(a, -D * 0.05, 0.1, 2.4, 8.5, 0xf2f2f2, 'plain', 0); box(a, -D * 0.05, 0.12, 0.8, 8.5, 0x222222, 'plain', 1.6); }
        const cc = [0xff5a3a, 0x2a8ad0, 0xf2c200, 0x3ab05a];
        for (let i = 0; i < 8; i++) box(-W * 0.4 + i * W * 0.11, D * 0.36, 0.5, 2.3, 0.15, cc[i % 4], 'plain', 0, 0.2);
        break;
      }
      case 'beachpark': {
        box(0, 0, W, 0.25, D, 0xe6d29a, 'plain');
        for (let i = 0; i < 5; i++) box(-W * 0.4 + i * W * 0.2, -D * 0.25, W * 0.14, 1.5, D * 0.28, 0xd8c48a, 'roof', 0.1); // dune
        box(0, 0, W * 0.9, 0.5, 2.5, 0xa88a5a, 'plain', 0.25); for (let i = -2; i <= 2; i++) box(i * W * 0.2, D * 0.15, 2.5, 0.5, D * 0.3, 0xa88a5a, 'plain', 0.25);
        for (let i = 0; i < 9; i++) palm(-W * 0.44 + i * W * 0.11, (i % 2 ? -1 : 1) * D * 0.18);
        for (const a of [-W * 0.3, W * 0.3]) { cyl(a, D * 0.3, 0.1, 3, 0xcccccc); box(a, D * 0.3, 2, 0.2, 0.4, 0xcccccc, 'plain', 3); }
        break;
      }
      case 'watertw': {
        slab(0x9a9a8a); cyl(0, 0, 9, 26, 0x9a4a32); cyl(0, 0, 9.6, 1.2, 0x6a3020, 9); cyl(0, 0, 9.6, 1.2, 0x6a3020, 18);
        cyl(0, 0, 11, 1, 0xd8d0c0, 26); cyl(0, 0, 8, 5, 0x9a4a32, 27); cyl(0, 0, 8.5, 3, 0x5a6a7a, 32); cyl(0, 0, 11, 1.2, 0xeeeeee, 27);
        box(0, -9.5, 2, 4, 0.5, 0x5a3a2a, 'body', 0);
        break;
      }
      case 'cannery': {
        slab(0x9a9a92); box(0, D * 0.32, W, 1, D * 0.5, 0x7a6a5a, 'body', -0.5); // pontile
        for (let i = 0; i < 3; i++) { box(-W * 0.3 + i * W * 0.3, 0, W * 0.27, 10, D * 0.55, 0xb8b0a0); box(-W * 0.3 + i * W * 0.3, 0, W * 0.29, 4, D * 0.57, 0x6a6c70, 'roof', 10); }
        cyl(W * 0.42, -D * 0.3, 2, 22, 0x9a4a32);
        box(0, D * 0.28, W * 0.6, 7, 0.6, 0x3ab0e0, glass, 1); box(0, -D * 0.28, W * 0.3, 1.6, 0.4, 0x2ad0ff, neon, 8);
        break;
      }
      case 'readcube': { box(0, 0, 4.5, 4.5, 4.5, 0xd8c070, 'body', 0.6); box(0, -2.3, 3, 2.6, 0.1, 0x6a4a2a, 'plain', 1.4); box(0, 0, 6, 0.6, 6, 0x9a9a92, 'plain'); break; }
      case 'pa_pier': {
        const ext = sv.ext.includes('pierext'), L0 = ext ? D * 1.15 : D * 0.9;
        box(0, -D * 0.45, W * 0.6, 4, 6, 0xe04a6a); box(0, -D * 0.45, W * 0.62, 1.2, 6.4, 0xffd23a, neon, 4);
        box(0, -D * 0.5 + L0 / 2, W, 0.8, L0, 0xa88a5a, 'body', 1.2);
        for (let b = -D * 0.45; b < -D * 0.5 + L0; b += 10) for (const s of [-1, 1]) cyl(s * W * 0.46, b, 0.5, 4, 0x6a5a4a, -2.5);
        for (const s of [-1, 1]) box(s * W * 0.49, -D * 0.5 + L0 / 2, 0.3, 1, L0, 0xf2f2f2, 'plain', 2);
        drawRides(sv, false);
        break;
      }
      case 'school_h': case 'school_30': case 'high_h': {
        const hh = SV[T].h, wall = T === 'school_30' ? 0xb86a4a : 0x9a4a32;
        slab(0x8a8a7a); box(0, D * 0.12, W * 0.88, hh, D * 0.5, wall); box(0, D * 0.12, W * 0.9, 1, D * 0.52, 0xd8d0c0, 'body', hh);
        for (let i = -3; i <= 3; i++) box(i * W * 0.12, D * 0.12 - D * 0.25 - 0.2, 2.2, hh * 0.6, 0.4, 0xd8d0c0, 'plain', hh * 0.2);
        box(0, D * 0.12 - D * 0.26, 6, 5, 1, 0xd8d0c0); box(0, -D * 0.3, W * 0.5, 0.2, D * 0.25, 0x8a6a4a, 'plain');
        if (T === 'high_h') { box(0, D * 0.12, 8, hh + 12, 8, wall); box(0, D * 0.12, 8.6, 4, 8.6, 0x4a5a4a, 'roof', hh + 12); cyl(0, D * 0.12 - 4.1, 2, 0.1, 0xf4f0e0, hh + 8); }
        break;
      }
      case 'high_p': {
        slab(0x6aa84f); box(-W * 0.22, D * 0.18, W * 0.5, 12, D * 0.4, 0xe0d8c8); box(-W * 0.22, D * 0.18 - D * 0.2 - 0.2, W * 0.46, 7, 0.4, 0x9fd3ff, glass, 2);
        box(W * 0.25, D * 0.15, W * 0.4, 0.2, D * 0.5, 0x3a8a3a, 'plain', 0.3); box(W * 0.25, D * 0.15, W * 0.34, 0.1, D * 0.42, 0xc06a3a, 'plain', 0.4); // pista
        box(W * 0.25, D * 0.15, W * 0.22, 0.1, D * 0.3, 0x4ab04a, 'plain', 0.5);
        box(-W * 0.22, -D * 0.3, 15, 0.2, 9, 0xc06a3a, 'plain', 0.3); for (let i = 0; i < 6; i++) tree(W * 0.05 + i * W * 0.08, -D * 0.38);
        break;
      }
      case 'uni_h': {
        slab(0x6aa84f); const st = 0xc8b494, rf = 0x6a5a4a;
        for (const [a, b, w, dd] of [[0, D * 0.3, W * 0.8, 16], [-W * 0.38, 0, 16, D * 0.6], [W * 0.38, 0, 16, D * 0.6], [-W * 0.18, -D * 0.3, W * 0.4, 16]]) { box(a, b, w, 18, dd, st); box(a, b, w + 1, 6, dd + 1, rf, 'roof', 18); }
        box(W * 0.22, -D * 0.3, 14, 40, 14, st); box(W * 0.22, -D * 0.3, 15, 10, 15, rf, 'roof', 40);
        box(0, 0, W * 0.4, 0.3, D * 0.3, 0x4f8a3a, 'plain', 0.2); for (let i = 0; i < 4; i++) tree(-W * 0.15 + i * W * 0.1, 0);
        if (sv.ext.includes('wing')) { box(0, -D * 0.46, W * 0.5, 14, 8, 0xd8d0c0); box(0, -D * 0.46 - 4.1, W * 0.46, 9, 0.4, 0x9fd3ff, glass, 2); }
        break;
      }
      case 'bookhill': {
        slab(0x9a9a92); box(0, 0, W * 0.9, 30, D * 0.9, 0xbfe0f0, glass);
        for (let i = 0; i < 5; i++) box(0, 0, W * (0.8 - i * 0.15), 5.5, D * (0.8 - i * 0.15), [0x8a4a2a, 0xa86a3a, 0xc8a050, 0x6a3a2a, 0xd8b060][i], 'body', i * 5.6);
        box(0, 0, W * 0.92, 0.8, D * 0.92, 0xe8e8e8, 'body', 30);
        break;
      }
      case 'hospcamp': {
        slab(0x9a9a92); lot(W * 0.3, -D * 0.35, W * 0.36, D * 0.24, true);
        box(-W * 0.15, D * 0.1, W * 0.45, 24, D * 0.4, 0xf2f2f2); box(-W * 0.15, D * 0.1, W * 0.16, 0.6, 3, 0xd02020, 'plain', 24.1); box(-W * 0.15, D * 0.1, 3, 0.6, W * 0.16, 0xd02020, 'plain', 24.1);
        const k = [[W * 0.3, D * 0.25, 22, 12, 22], [W * 0.3, D * 0.02, 22, 9, 14], [-W * 0.42, -D * 0.25, 14, 8, 16], [-W * 0.2, -D * 0.3, 18, 10, 14], [W * 0.05, -D * 0.25, 14, 7, 14], [-W * 0.42, D * 0.32, 12, 6, 10]];
        for (const [a, b, w, h, dd] of k) box(a, b, w, h, dd, 0xe8eef2);
        box(W * 0.3, -D * 0.35, W * 0.34, 9, D * 0.2, 0x8a8c90, 'body', 0.3); // multipiano
        box(-W * 0.42, D * 0.32, 12, 0.3, 10, 0x4a6a4a, 'plain', 6); cyl(-W * 0.48, D * 0.32, 1, 9, 0x8a8a8a); // servizi funebri
        break;
      }
      case 'hosp_m': {
        slab(0x9a9a92); box(0, D * 0.12, W * 0.85, 12, D * 0.6, 0xe8eef2); box(-W * 0.1, D * 0.1, W * 0.4, 36, D * 0.36, 0xf4f6f8);
        box(-W * 0.1, D * 0.1 - D * 0.18 - 0.2, W * 0.36, 30, 0.4, 0x9fd3ff, glass, 8);
        cyl(-W * 0.1, D * 0.1, 8, 0.6, 0x3a3c40, 48); cyl(-W * 0.1, D * 0.1, 6, 0.2, 0xf2f2f2, 48.6); box(-W * 0.1, D * 0.1, 1, 0.3, 6, 0x3a3c40, 'plain', 48.8);
        box(W * 0.32, -D * 0.3, 14, 5, 10, 0xd02020); box(W * 0.32, -D * 0.36, 8, 1.6, 0.4, 0xff2a2a, neon, 3);
        break;
      }
      case 'metro_v': {
        box(0, 0, W, 0.3, D, 0xc8b89a, 'plain'); box(0, 0, W * 0.6, 4, D * 0.4, 0x9a7a5a); box(0, 0, W * 0.64, 1.6, D * 0.44, 0x2a5a3a, 'roof', 4);
        box(0, -D * 0.2 - 0.25, W * 0.4, 2.6, 0.3, 0xd84a2a, 'plain', 0.6); for (const a of [-W * 0.4, W * 0.4]) { cyl(a, -D * 0.3, 0.2, 4, 0x2a2a2a); box(a, -D * 0.3, 1.4, 1.4, 1.4, 0xe03a2a, neon, 4); }
        break;
      }
      case 'metro_e': {
        box(0, 0, W, 0.3, D, 0xb9b4a8, 'plain');
        for (let a = -W * 0.42; a <= W * 0.42; a += W * 0.21) for (const b of [-D * 0.3, D * 0.3]) box(a, b, 1.6, 10, 1.6, 0xc8ccd2);
        box(0, 0, W * 0.96, 1.6, D * 0.9, 0xb0b4ba, 'body', 10); box(0, 0, W * 0.94, 0.3, 2, 0x3a3a3e, 'plain', 11.7);
        for (let i = 0; i < 4; i++) box(0, -D * 0.4 + i * D * 0.25, W * 0.98, 0.5, D * 0.3, 0xe6eaee, 'body', 15 + i * 1.3);
        box(0, 0, W * 0.25, 9, D * 0.5, 0x9fd3ff, glass, 0.3);
        break;
      }
      case 'trainjp': {
        box(0, 0, W, 0.3, D, 0x8a8c90, 'plain');
        for (const b of [-D * 0.3, D * 0.3]) { box(0, b, W * 0.95, 1, 5, 0xc8c8c4, 'body', 0.3); for (let a = -W * 0.4; a <= W * 0.4; a += W * 0.2) box(a, b, 0.5, 4, 0.5, 0xeeeeee, 'body', 1.3); box(0, b, W * 0.9, 0.5, 6, 0xf4f4f4, 'body', 5.3); }
        box(-W * 0.32, 0, 6, 9, D * 0.75, 0xf4f4f4, 'body', 0); box(-W * 0.32, 0, 6.5, 1, D * 0.8, 0x2a5ad0, 'body', 9); // ponte pedonale
        box(W * 0.3, -D * 0.46, 22, 7, 3, 0xf4f4f4); box(W * 0.3, -D * 0.48, 12, 1.4, 0.4, 0x2a8a3a, neon, 5);
        break;
      }
      case 'parcel': {
        slab(0x6a6c70); box(0, D * 0.15, W * 0.8, 12, D * 0.5, 0xd8b86a, 'plain'); box(0, D * 0.15, W * 0.82, 1, D * 0.52, 0x6a4a2a, 'body', 12);
        for (let i = -4; i <= 4; i++) box(i * W * 0.085, D * 0.15 - D * 0.25 - 0.2, W * 0.06, 4.5, 0.4, 0x5a5c62, 'plain', 0);
        for (let i = 0; i < 8; i++) { box(-W * 0.4 + i * W * 0.11, -D * 0.3, 2.4, 2.8, 5.5, 0x6a4a2a, 'body', 0.3); }
        break;
      }
      case 'logist': {
        slab(0x6a6c70);
        for (const a of [-W * 0.26, W * 0.26]) { box(a, D * 0.1, W * 0.44, 13, D * 0.55, 0xc8ccd2, 'plain'); box(a, D * 0.1, W * 0.45, 1, D * 0.56, 0x2a6ad0, 'body', 13); for (let i = -4; i <= 4; i++) box(a + i * W * 0.045, D * 0.1 - D * 0.275 - 0.2, W * 0.035, 4.5, 0.4, 0x5a5c62, 'plain'); }
        for (let i = 0; i < 10; i++) { box(-W * 0.42 + i * W * 0.09, -D * 0.32, 2.8, 3.6, 12, [0xe04a3a, 0x2a8ad0, 0xf2c200, 0xf4f4f4][i % 4], 'body', 0.3); }
        break;
      }
      case 'nuke4': {
        slab(0x8a8a86);
        for (let i = 0; i < 4; i++) { const a = -W * 0.36 + i * W * 0.24, b = -D * 0.02; box(a, b + D * 0.12, W * 0.18, 12, D * 0.12, 0xc8c8c4, 'plain'); cyl(a, b, 30, 26, 0xe6e4de); const [x, z] = at(a, b); addPart(P, dome, x, y + 26, z, 0, 30, 12, 30, 0xeeece6); }
        box(0, -D * 0.3, W * 0.9, 14, D * 0.12, 0xb8b8b4, 'plain'); cyl(W * 0.47, -D * 0.3, 5, 70, 0xd8d4cc); cyl(W * 0.47, -D * 0.3, 5.3, 3, 0xd02020, 62);
        for (const a of [-W * 0.25, W * 0.25]) box(a, D * 0.34, W * 0.42, 0.3, D * 0.26, 0x3a80b0, 'plain', 0.2); // laghi di raffreddamento
        break;
      }
      case 'datacenter': {
        slab(0x8a8a86);
        for (let i = 0; i < 4; i++) { box(-W * 0.36 + i * W * 0.24, D * 0.05, W * 0.2, 12, D * 0.6, 0x3a4250, 'plain'); box(-W * 0.36 + i * W * 0.24, D * 0.05, W * 0.18, 0.4, D * 0.55, 0x8a8a8a, 'plain', 12); for (let j = 0; j < 3; j++) cyl(-W * 0.36 + i * W * 0.24, D * 0.05 - D * 0.2 + j * D * 0.2, 2.2, 1.6, 0x9a9a9a, 12.3); }
        box(0, -D * 0.33, W * 0.6, 7, D * 0.16, 0xe8e8e8); box(0, -D * 0.42, W * 0.5, 0.8, 0.4, 0x2ad0ff, neon, 6);
        break;
      }
    }
    POOLS.body.dirty();
  };
  // giostre animate del molo e del luna park
  function drawRides(sv, inFun) {
    curRef = sv; const P = sv.parts, has = k => sv.ext.includes(k), y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a];
    const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0, yw = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw + yw, w, h, dd, c); };
    const cyl = (a, b, r, h, c, y0 = 0) => { const [x, z] = at(a, b); return addPart(P, 'cyl', x, y + y0, z, 0, r, h, r, c); };
    const A = sv.anim = [], dy = inFun ? 0 : 2;
    // posti: sul molo in fila lungo la passerella, nel luna park negli angoli liberi
    const spot = inFun ? { chairs: [-W * 0.05, -D * 0.3], glider: [0, D * 0.42], midway: [W * 0.05, D * 0.4] }
      : { pwheel: [0, -D * 0.28], chairs: [0, -D * 0.1], snacks: [0, -D * 0.38], midway: [0, D * 0.05], pcoaster: [0, D * 0.22], glider: [0, D * 0.38] };
    if (has('pwheel') && spot.pwheel) {
      const [a, b] = spot.pwheel, R = 14, hub = R + 4, sp = 0.18;
      for (const s of [-1, 1]) box(a, b + s * 1.6, 0.7, hub, 0.7, 0xdddddd, 'plain', dy);
      box(a, b, 0.9, 0.9, 3.6, 0x999999, 'plain', dy + hub - 0.45);
      for (let i = 0; i < 8; i++) { const h = box(a, b, 0.3, R, 0.3, 0xe8e8e8, 'plain', dy + hub); if (h) A.push({ h, k: 'rot', a, b, R: 0, y0: dy + hub, ph: i / 8 * Math.PI * 2, ro: 0, sp }); }
      const n = 20, dt = Math.PI * 2 / n, seg = 2 * R * Math.sin(dt / 2) + 0.2;
      for (let i = 0; i < n; i++) { const h = box(a, b, 0.4, seg, 0.4, 0xd04a8a, 'plain', dy + hub); if (h) A.push({ h, k: 'rot', a, b, R, y0: dy + hub, ph: i * dt, ro: dt / 2 + Math.PI / 2, sp }); }
      const cc = [0xe04a3a, 0x2a8ad0, 0xf2c200, 0x3ab05a];
      for (let i = 0; i < 10; i++) { const h = box(a, b, 1.8, 1.8, 1.8, cc[i % 4]); if (h) A.push({ h, k: 'cab', a, b, R, y0: dy + hub, ph: i / 10 * Math.PI * 2, sp }); }
    }
    if (has('chairs')) {
      const [a, b] = spot.chairs; cyl(a, b, 1, dy + 12, 0xd8c070); cyl(a, b, 7, 1.2, 0xe04a6a, dy + 11); box(a, b, 3, 3, 3, 0xffd23a, 'body', dy + 12);
      for (let i = 0; i < 12; i++) { const h = box(a, b, 1, 1, 1, [0x2a8ad0, 0xf2c200, 0xe04a3a][i % 3]); if (h) A.push({ h, k: 'spin', a, b, R: 9, y0: dy + 6, ph: i / 12 * Math.PI * 2, sp: 1.2 }); }
    }
    if (has('glider')) {
      const [a, b] = spot.glider, w = inFun ? W * 0.8 : W * 0.8, ax = inFun ? 1 : 0;
      const pA = inFun ? [a - w / 2, b] : [W * 0.42, -D * 0.2], pB = inFun ? [a + w / 2, b] : [W * 0.42, D * 0.36];
      for (const p of [pA, pB]) box(p[0], p[1], 1, dy + 14, 1, 0x8a8a8a);
      { const mx = (pA[0] + pB[0]) / 2, mb = (pA[1] + pB[1]) / 2, len = Math.hypot(pB[0] - pA[0], pB[1] - pA[1]); box(mx, mb, ax ? len : 0.2, 0.2, ax ? 0.2 : len, 0x333333, 'plain', dy + 13.5); }
      for (let i = 0; i < 6; i++) { const h = box(pA[0], pA[1], 1.6, 1.4, 1.6, [0xff6a6a, 0x6ab0ff, 0xffd23a, 0x6ad08a, 0xff9ad0, 0xb06aff][i]); if (h) A.push({ h, k: 'glide', pA, pB, y0: dy + 11.5, ph: i / 6, sp: 0.04 }); }
    }
    if (has('pcoaster') && spot.pcoaster) {
      const [a, b] = spot.pcoaster, Rx = W * 0.36, Rz = D * 0.12;
      for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; const hh = 6 + 5 * Math.sin(t * 2); box(a + Math.cos(t) * Rx, b + Math.sin(t) * Rz, 0.8, dy + hh, 0.8, 0x9a7a5a); box(a + Math.cos(t) * Rx, b + Math.sin(t) * Rz, 2.6, 0.5, 2.6, 0xc8a070, 'plain', dy + hh); }
      for (let i = 0; i < 4; i++) { const h = box(a, b, 2, 1.4, 2, i ? 0xe04a3a : 0xf2c200); if (h) A.push({ h, k: 'coaster', a, b, Rx, Rz, y0: dy, ph: -i * 0.14, sp: 0.5 }); }
    }
    if (has('snacks') && spot.snacks) { const [a, b] = spot.snacks, cc = [0xe04a3a, 0xff9ad0, 0xc83a2a, 0xf2c200]; for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1; box(a + s * W * 0.32, b + (i % 2) * 7, 5, 3, 4, 0xf4f0e0, 'body', dy); box(a + s * W * 0.32, b + (i % 2) * 7, 5.6, 1, 4.6, cc[i], 'roof', dy + 3); } }
    if (has('midway')) { const [a, b] = spot.midway; for (let i = 0; i < 3; i++) { box(a - 9 + i * 9, b, 7, 3.5, 4, [0xe04a3a, 0x2a8ad0, 0x3ab05a][i], 'body', dy); box(a - 9 + i * 9, b - 2.1, 5, 1.2, 0.3, 0xffd23a, POOLS.pfn ? 'pfn' : 'plain', dy + 2.6); } }
    if (!A.length) sv.anim = null; else animSv(sv, performance.now() / 1000);
    POOLS.body.dirty();
  }
  // movimento: solo da vicino, come le pale e la ruota panoramica
  function animSv(sv, t) {
    const yaw = sv.ang, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    for (const m of sv.anim) {
      const h = m.h, g = h.geo, p = POOLS[h.pool]; if (!p || h.i < 0) continue;
      let a = 0, b = 0, yy = 0, yw = yaw, roll = null;
      if (m.k === 'rot' || m.k === 'cab') { // ruota: gira nel piano laterale, le cabine restano appese
        const q = t * m.sp + m.ph; a = m.a - Math.sin(q) * m.R; b = m.b; yy = m.y0 + Math.cos(q) * m.R;
        if (m.k === 'cab') yy -= 2.2; else roll = q + m.ro;
      } else if (m.k === 'spin') { const q = t * m.sp + m.ph; a = m.a + Math.cos(q) * m.R; b = m.b + Math.sin(q) * m.R; yy = m.y0; yw = yaw - q; }
      else if (m.k === 'glide') { const f = (t * m.sp + m.ph) % 1, u = f < 0.5 ? f * 2 : 2 - f * 2; a = m.pA[0] + (m.pB[0] - m.pA[0]) * u; b = m.pA[1] + (m.pB[1] - m.pA[1]) * u; yy = m.y0; }
      else if (m.k === 'coaster') { const q = t * m.sp + m.ph; a = m.a + Math.cos(q) * m.Rx; b = m.b + Math.sin(q) * m.Rz; yy = m.y0 + 6.5 + 5 * Math.sin(q * 2); yw = yaw - q; }
      const x = sv.x + fx * b + rx * a, z = sv.z + fz * b + rz * a;
      if (roll === null) setInst(p.mesh, h.i, x, sv.y + yy, z, yw, g[4], g[5], g[6]);
      else { _eul.set(0, yaw, roll, 'YXZ'); _q.setFromEuler(_eul); _m4.compose(_v3.set(x, sv.y + yy, z), _q, _s3.set(g[4], g[5], g[6])); p.mesh.setMatrixAt(h.i, _m4); }
      p.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  const _sp = spinParts;
  spinParts = function () {
    _sp(); if (cam.dist > 2500) return;
    const t = performance.now() / 1000;
    for (const sv of svcs.values()) if (sv.anim && sv.on) animSv(sv, t);
  };
}
