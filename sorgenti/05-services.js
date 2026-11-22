// =====================================================================
//  Servizi: catalogo, posizionamento, reti (luce/acqua), copertura
// =====================================================================
const CAT = {
  power: { i: '⚡', n: () => L('Elettricità', 'Electricity') },
  water: { i: '💧', n: () => L('Acqua e fogne', 'Water & sewage') },
  garbage: { i: '🗑️', n: () => L('Rifiuti', 'Garbage') },
  health: { i: '🏥', n: () => L('Salute e cimiteri', 'Health & deathcare') },
  police: { i: '🚓', n: () => L('Polizia', 'Police') },
  fire: { i: '🚒', n: () => L('Pompieri', 'Fire') },
  edu: { i: '🎓', n: () => L('Istruzione', 'Education') },
  parks: { i: '🌳', n: () => L('Parchi e monumenti', 'Parks & landmarks') },
  transport: { i: '🚌', n: () => L('Trasporti', 'Transport') },
  misc: { i: '📡', n: () => L('Comunicazioni e manutenzione', 'Telecom & maintenance') },
  sign: { i: '⭐', n: () => L('Edifici firma', 'Signature buildings') },
  spec: { i: '🌾', n: () => L('Industria specializzata', 'Specialized industry') },
};
// p = produzione elettrica (MW), wat = acqua, sew = fogne; r = raggio (m)
const SV = {
  coal: { cat: 'power', w: 48, d: 40, cost: 45000, upk: 2400, ms: 0, p: 20, air: 40, ground: 10, noise: 8, n: () => L('Centrale a carbone', 'Coal power plant'), d2: () => L('20 MW, piccola, inquina aria e suolo', '20 MW, small, pollutes air and ground') },
  gas: { cat: 'power', w: 70, d: 56, cost: 420000, upk: 14000, ms: 3, p: 250, air: 15, noise: 5, n: () => L('Centrale a gas', 'Gas power plant'), d2: () => L('250 MW, grande e cara, inquina meno del carbone', '250 MW, big and expensive, cleaner than coal') },
  transformer: { cat: 'power', w: 22, d: 22, cost: 18000, upk: 600, ms: 2, tcap: 150, noise: 2, n: () => L('Trasformatore', 'Transformer'), d2: () => L('Porta la corrente forte delle centrali grandi nelle strade: +150 MW. Senza, una centrale grande ne dà solo 40.', 'Brings the strong current of big plants into the streets: +150 MW. Without it a big plant gives only 40.') },
  gwpump: { cat: 'water', w: 16, d: 16, cost: 12000, upk: 450, ms: 1, wat: 600, gw: true, n: () => L('Pompa di falda', 'Groundwater pump'), d2: () => L('Prende l\'acqua da sotto terra, anche lontano dalla riva. Mettila dove la vista Falde è blu. Il suolo inquinato sporca l\'acqua.', 'Takes water from underground, even far from the shore. Place it where the Groundwater view is blue. Polluted ground makes the water dirty.') },
  pump: { cat: 'water', w: 20, d: 20, cost: 15000, upk: 700, ms: 0, wat: 1200, shore: true, n: () => L('Pompa dell\'acqua', 'Water pump'), d2: () => L('Va messa sulla riva. Se l\'acqua è sporca i cittadini si ammalano!', 'Place on the shore. Dirty water makes people sick!') },
  tower: { cat: 'water', w: 14, d: 14, cost: 9000, upk: 450, ms: 0, wat: 400, n: () => L('Pompa di falda', 'Groundwater pump'), d2: () => L('Prende l\'acqua dal sottosuolo. Non metterla vicino a suolo inquinato!', 'Takes groundwater. Keep it away from polluted ground!') },
  outlet: { cat: 'water', w: 16, d: 16, cost: 9000, upk: 350, ms: 0, sew: 1500, shore: true, wpol: 1, n: () => L('Scarico fognario', 'Sewage outlet'), d2: () => L('Sulla riva. Mettilo a valle delle pompe!', 'On the shore. Put it downstream of pumps!') },
  treat: { cat: 'water', w: 60, d: 50, cost: 120000, upk: 4800, ms: 4, sew: 5000, shore: true, wpol: 0.1, n: () => L('Depuratore', 'Treatment plant'), d2: () => L('Pulisce le fogne prima di scaricarle', 'Cleans sewage before releasing it') },
  landfill: { cat: 'garbage', w: 64, d: 64, cost: 28000, upk: 1400, ms: 1, r: 2600, gcap: 900, store: 60000, ground: 12, noise: 3, veh: 'garbage', n: () => L('Discarica', 'Landfill'), d2: () => L('Raccoglie i rifiuti. Si riempie col tempo.', 'Collects garbage. Fills up over time.') },
  incin: { cat: 'garbage', w: 44, d: 40, cost: 140000, upk: 5500, ms: 5, r: 3200, gcap: 2200, p: 8, air: 18, veh: 'garbage', n: () => L('Inceneritore', 'Incinerator'), d2: () => L('Brucia i rifiuti e fa 8 MW di corrente', 'Burns garbage and makes 8 MW') },
  recycle: { cat: 'garbage', w: 44, d: 40, cost: 85000, upk: 4000, ms: 4, r: 2600, gcap: 1300, veh: 'garbage', n: () => L('Centro di riciclaggio', 'Recycling center'), d2: () => L('Ricicla i rifiuti e vende i materiali', 'Recycles garbage and sells materials') },
  clinic: { cat: 'health', w: 30, d: 24, cost: 24000, upk: 1500, ms: 1, r: 1000, cap: 2500, eff: 'health', veh: 'ambulance', n: () => L('Ambulatorio', 'Clinic'), d2: () => L('Cura i malati nel quartiere', 'Treats the sick nearby') },
  hospital: { cat: 'health', w: 64, d: 50, cost: 150000, upk: 7500, ms: 4, r: 2400, cap: 12000, eff: 'health', veh: 'ambulance', h: 30, n: () => L('Ospedale', 'Hospital'), d2: () => L('Grande, copre mezza città', 'Large, covers half the city') },
  cemetery: { cat: 'health', w: 54, d: 54, cost: 20000, upk: 600, ms: 1, r: 2800, store: 4000, eff: 'death', veh: 'hearse', n: () => L('Cimitero', 'Cemetery'), d2: () => L('Senza cimitero i morti restano nelle case!', 'Without one, the dead stay at home!') },
  cremat: { cat: 'health', w: 32, d: 30, cost: 70000, upk: 2400, ms: 4, r: 3500, cap: 9000, eff: 'death', veh: 'hearse', n: () => L('Crematorio', 'Crematorium'), d2: () => L('Non si riempie mai', 'Never fills up') },
  police: { cat: 'police', w: 30, d: 24, cost: 30000, upk: 1700, ms: 1, r: 1000, cap: 3500, eff: 'police', veh: 'police', n: () => L('Stazione di polizia', 'Police station'), d2: () => L('Riduce la criminalità', 'Reduces crime') },
  policehq: { cat: 'police', w: 52, d: 42, cost: 120000, upk: 5800, ms: 5, r: 2200, cap: 15000, eff: 'police', veh: 'police', n: () => L('Questura', 'Police HQ'), d2: () => L('Copre una zona grande', 'Covers a large area') },
  prison: { cat: 'police', w: 64, d: 64, cost: 150000, upk: 5000, ms: 6, n: () => L('Prigione', 'Prison'), d2: () => L('-15% criminalità in tutta la città', '-15% crime citywide') },
  fire: { cat: 'fire', w: 30, d: 26, cost: 30000, upk: 1700, ms: 1, r: 1100, cap: 4000, eff: 'fire', veh: 'fire', n: () => L('Caserma dei pompieri', 'Fire station'), d2: () => L('Spegne gli incendi', 'Puts out fires') },
  firehq: { cat: 'fire', w: 52, d: 42, cost: 110000, upk: 5200, ms: 5, r: 2400, cap: 16000, eff: 'fire', veh: 'fire', n: () => L('Comando dei pompieri', 'Fire HQ'), d2: () => L('Più camion, copre di più', 'More trucks, bigger coverage') },
  welfare: { cat: 'police', w: 26, d: 22, cost: 22000, upk: 1100, ms: 2, r: 1100, cap: 4000, eff: 'welfare', n: () => L('Ufficio assistenza sociale', 'Welfare office'), d2: () => L('Aiuta i più poveri e riduce la criminalità intorno', 'Helps the poorest and reduces crime nearby') },
  school: { cat: 'edu', w: 40, d: 32, cost: 38000, upk: 2400, ms: 1, r: 1100, cap: 3000, eff: 'edu1', n: () => L('Scuola elementare', 'Elementary school'), d2: () => L('Prima istruzione', 'Basic education') },
  high: { cat: 'edu', w: 52, d: 40, cost: 90000, upk: 4800, ms: 3, r: 1800, cap: 6000, eff: 'edu2', n: () => L('Liceo', 'High school'), d2: () => L('Serve per gli uffici', 'Needed for offices') },
  college: { cat: 'edu', w: 64, d: 50, cost: 150000, upk: 6500, ms: 4, r: 2600, cap: 5000, eff: 'edu3', h: 16, n: () => L('College', 'College'), d2: () => L('Più laureati: servono a uffici e negozi', 'More graduates for offices and shops') },
  uni: { cat: 'edu', w: 96, d: 72, cost: 300000, upk: 11000, ms: 6, r: 4500, cap: 15000, eff: 'edu3', h: 22, n: () => L('Università', 'University'), d2: () => L('Lavoratori molto istruiti, attira studenti', 'Highly educated workers, attracts students') },
  park: { cat: 'parks', w: 18, d: 18, cost: 3000, upk: 70, ms: 0, r: 280, park: 4, n: () => L('Giardinetto', 'Small park'), d2: () => L('Fa salire il valore del terreno', 'Raises land value') },
  playground: { cat: 'parks', w: 18, d: 18, cost: 2500, upk: 60, ms: 0, r: 260, park: 3, n: () => L('Parco giochi', 'Playground'), d2: () => L('I bambini sono felici', 'Kids are happy') },
  plaza: { cat: 'parks', w: 26, d: 26, cost: 6000, upk: 120, ms: 2, r: 320, park: 5, attr: 1, n: () => L('Piazza con fontana', 'Plaza with fountain'), d2: () => L('Bella in centro', 'Nice downtown') },
  bigpark: { cat: 'parks', w: 70, d: 70, cost: 24000, upk: 500, ms: 2, r: 650, park: 10, attr: 3, n: () => L('Parco grande', 'Large park'), d2: () => L('Tanti alberi e un laghetto', 'Lots of trees and a pond') },
  sports: { cat: 'parks', w: 54, d: 36, cost: 15000, upk: 400, ms: 3, r: 520, park: 7, n: () => L('Campo sportivo', 'Sports field'), d2: () => L('Calcio e atletica', 'Football and athletics') },
  dogpark: { cat: 'parks', w: 26, d: 22, cost: 10000, upk: 150, ms: 1, r: 300, park: 3, n: () => L('Parco per cani', 'Dog park'), d2: () => L('Recinto con l\'erba per i cani del quartiere', 'Fenced lawn for the neighbourhood dogs') },
  firepit: { cat: 'parks', w: 24, d: 24, cost: 30000, upk: 300, ms: 2, r: 380, park: 4, n: () => L('Area falò', 'Fire pit area'), d2: () => L('Panche intorno al fuoco: la sera si sta insieme', 'Benches around a fire: evenings together') },
  beach: { cat: 'parks', w: 60, d: 30, cost: 20000, upk: 250, ms: 2, r: 600, park: 6, attr: 4, summer: true, shore: true, n: () => L('Spiaggia', 'Beach'), d2: () => L('Sabbia lungo la riva: svago d\'estate e turisti', 'Sand along the shore: summer fun and tourists') },
  basket: { cat: 'parks', w: 30, d: 20, cost: 5000, upk: 120, ms: 1, r: 320, park: 4, n: () => L('Campo da basket', 'Basketball court'), d2: () => L('Sport all\'aperto', 'Outdoor sport') },
  gym: { cat: 'parks', w: 22, d: 22, cost: 4500, upk: 100, ms: 1, r: 300, park: 4, n: () => L('Palestra all\'aperto', 'Outdoor gym'), d2: () => L('Sport all\'aperto', 'Outdoor sport') },
  pool: { cat: 'parks', w: 44, d: 32, cost: 30000, upk: 900, ms: 3, r: 700, park: 7, summer: true, n: () => L('Piscina comunale', 'Public pool'), d2: () => L('D\'estate piace tantissimo', 'Very popular in summer') },
  waterpark: { cat: 'parks', w: 90, d: 70, cost: 160000, upk: 4000, ms: 5, r: 1600, park: 9, attr: 10, summer: true, unique: true, xp: 1000, n: () => L('Parco acquatico', 'Water park'), d2: () => L('Uno per città. D\'estate attira tanti turisti', 'One per city. Big summer attraction') },
  pmaint: { cat: 'parks', w: 30, d: 24, cost: 18000, upk: 700, ms: 2, r: 2600, eff: 'pmaint', n: () => L('Manutenzione parchi', 'Park maintenance'), d2: () => L('Tiene puliti i parchi: funzionano meglio', 'Keeps parks clean so they work better') },
  hotel: { cat: 'parks', w: 40, d: 30, cost: 300000, upk: 4000, ms: 4, r: 1200, park: 6, attr: 17, indoor: true, unique: true, h: 34, xp: 4000, n: () => L('Grand Hotel', 'Grand Hotel'), d2: () => L('Monumento: svago al chiuso, utile d\'inverno', 'Landmark: indoor leisure, good in winter') },
  botanic: { cat: 'parks', w: 80, d: 60, cost: 250000, upk: 3500, ms: 4, r: 1300, park: 9, attr: 14, unique: true, xp: 4000, n: () => L('Giardino botanico', 'Botanical garden'), d2: () => L('Monumento: bello in collina', 'Landmark: lovely on a hill') },
  gallery: { cat: 'parks', w: 46, d: 36, cost: 280000, upk: 3800, ms: 5, r: 1200, park: 6, attr: 14, indoor: true, unique: true, h: 18, xp: 4000, n: () => L('Galleria d\'arte nazionale', 'National art gallery'), d2: () => L('Monumento: svago al chiuso', 'Landmark: indoor leisure') },
  statue: { cat: 'parks', w: 14, d: 14, cost: 60000, upk: 600, ms: 3, r: 600, park: 4, attr: 5, unique: true, h: 18, xp: 4000, n: () => L('Statua di bronzo', 'Bronze statue'), d2: () => L('Monumento piccolo', 'Small landmark') },
  castle: { cat: 'parks', w: 60, d: 60, cost: 500000, upk: 5000, ms: 7, r: 1500, park: 7, attr: 22, unique: true, h: 26, xp: 6000, n: () => L('Castello medievale', 'Medieval castle'), d2: () => L('Monumento: tanti turisti', 'Landmark: many tourists') },
  wheel: { cat: 'parks', w: 32, d: 32, cost: 200000, upk: 3000, ms: 5, r: 900, park: 8, attr: 15, unique: true, h: 60, n: () => L('Ruota panoramica', 'Ferris wheel'), d2: () => L('Monumento: attira turisti', 'Landmark: attracts tourists') },
  stadium: { cat: 'parks', w: 120, d: 90, cost: 480000, upk: 7000, ms: 8, r: 1500, park: 10, attr: 22, unique: true, n: () => L('Stadio', 'Stadium'), d2: () => L('Monumento: tanti turisti', 'Landmark: many tourists') },
  tower2: { cat: 'parks', w: 30, d: 30, cost: 400000, upk: 5000, ms: 7, r: 1200, park: 6, attr: 28, unique: true, h: 160, n: () => L('Torre Belvedere', 'Belvedere Tower'), d2: () => L('Monumento: simbolo della città', 'Landmark: the city icon') },
  antenna: { cat: 'misc', w: 12, d: 12, cost: 20000, upk: 900, ms: 3, r: 1600, eff: 'net', h: 46, n: () => L('Antenna internet', 'Internet antenna'), d2: () => L('Gli uffici e i giovani la vogliono', 'Offices and young people want it') },
  telecom: { cat: 'misc', w: 20, d: 20, cost: 90000, upk: 2600, ms: 5, r: 3800, eff: 'net', h: 95, n: () => L('Torre delle telecomunicazioni', 'Telecom tower'), d2: () => L('Internet affidabile per una grande zona', 'Reliable internet over a large area') },
  pmansion: { cat: 'sign', need: { k: 'R', n: 150 }, w: 30, d: 30, cost: 60000, upk: 300, ms: 2, r: 500, park: 5, unique: true, xp: 500, h: 10, n: () => L('Villa del pittore', 'Painter mansion'), d2: () => L('Edificio firma: più benessere intorno', 'Signature: more well-being nearby') },
  rmansion: { cat: 'sign', need: { k: 'R', n: 400 }, w: 34, d: 34, cost: 90000, upk: 400, ms: 3, r: 600, park: 6, attr: 2, unique: true, xp: 500, h: 12, n: () => L('Villa del musicista rock', 'Rock musician mansion'), d2: () => L('Edificio firma: benessere e un po\' di turisti', 'Signature: well-being and some tourists') },
  ironpress: { cat: 'sign', need: { k: 'I', n: 60 }, w: 50, d: 40, cost: 120000, upk: 600, ms: 3, r: 700, park: 4, attr: 4, unique: true, xp: 500, h: 16, n: () => L('Pressa di ferro (fabbrica storica)', 'Iron press (historic factory)'), d2: () => L('Edificio firma: attrattività e benessere', 'Signature: attractiveness and well-being') },
  diner: { cat: 'sign', need: { k: 'C', n: 60 }, w: 20, d: 16, cost: 40000, upk: 200, ms: 2, r: 450, park: 3, attr: 2, unique: true, xp: 500, h: 6, n: () => L('Diner anni \'50', '50s diner'), d2: () => L('Edificio firma commerciale', 'Commercial signature building') },
  principi: { cat: 'sign', need: { k: 'O', n: 50 }, w: 36, d: 36, cost: 220000, upk: 900, ms: 5, r: 900, eff: 'welfare', park: 3, unique: true, xp: 500, h: 70, n: () => L('Torre uffici Principi', 'Principi office tower'), d2: () => L('Edificio firma uffici: meno criminalità, più laureati', 'Signature office: less crime, more graduates') },
  cityhall: { cat: 'misc', w: 50, d: 40, cost: 120000, upk: 2500, ms: 3, unique: true, h: 24, xp: 1000, n: () => L('Municipio', 'City hall'), d2: () => L('Uno per città: le merci comprate da fuori costano il 20% in meno', 'One per city: imported goods cost 20% less') },
  mailbox: { cat: 'misc', w: 4, d: 4, cost: 800, upk: 25, ms: 2, r: 260, eff: 'mail', n: () => L('Cassetta delle lettere', 'Mailbox'), d2: () => L('Piccola: la posta del quartiere', 'Small: mail for the block') },
  post: { cat: 'misc', w: 30, d: 24, cost: 32000, upk: 1300, ms: 2, r: 1500, eff: 'mail', veh: 'van', n: () => L('Ufficio postale', 'Post office'), d2: () => L('Lettere e pacchi: i cittadini vogliono una posta affidabile', 'Letters and parcels: people want reliable mail') },
  postsort: { cat: 'misc', w: 60, d: 46, cost: 140000, upk: 4200, ms: 5, r: 3800, eff: 'mail', veh: 'van', n: () => L('Centro smistamento posta', 'Post sorting facility'), d2: () => L('Smista la posta di tutta la città', 'Sorts mail for the whole city') },
  sp_grain: { cat: 'spec', w: 140, d: 170, cost: 45000, upk: 900, ms: 2, jobs: 30, spec: { res: 'fert', prod: 'food', fc: 0xd8c060 }, n: () => L('Azienda cerealicola', 'Grain farm'), d2: () => L('Campi di grano recintati. Serve terra fertile.', 'Fenced wheat fields. Needs fertile land.') },
  sp_veg: { cat: 'spec', w: 140, d: 170, cost: 45000, upk: 900, ms: 2, jobs: 34, spec: { res: 'fert', prod: 'food', fc: 0x5f9a3a }, n: () => L('Orti e serre', 'Vegetable farm'), d2: () => L('Ortaggi per i negozi. Serve terra fertile.', 'Vegetables for the shops. Needs fertile land.') },
  sp_live: { cat: 'spec', w: 140, d: 170, cost: 50000, upk: 1000, ms: 2, jobs: 26, spec: { res: 'fert', prod: 'food', fc: 0x8ab05a }, n: () => L('Allevamento', 'Livestock farm'), d2: () => L('Mucche al pascolo. Serve terra fertile.', 'Grazing cows. Needs fertile land.') },
  sp_cotton: { cat: 'spec', w: 140, d: 170, cost: 50000, upk: 1000, ms: 3, jobs: 30, spec: { res: 'fert', prod: 'cotton', fc: 0xe8e6dc }, n: () => L('Piantagione di cotone', 'Cotton farm'), d2: () => L('Cotone per i tessuti. Serve terra fertile.', 'Cotton for textiles. Needs fertile land.') },
  sp_wood: { cat: 'spec', w: 140, d: 170, cost: 55000, upk: 1000, ms: 2, jobs: 28, spec: { res: 'forest', prod: 'wood', fc: 0x4f7a3a }, n: () => L('Taglio del legname', 'Forestry'), d2: () => L('Legname dai boschi. Mettila dove ci sono foreste.', 'Timber from woods. Place it on forests.') },
  sp_oil: { cat: 'spec', w: 140, d: 170, cost: 90000, upk: 1600, ms: 3, jobs: 24, spec: { res: 'oil', prod: 'oil', fc: 0x6a6a5a }, n: () => L('Estrazione di petrolio', 'Oil extractor'), d2: () => L('Pompe di petrolio. Serve un giacimento.', 'Oil pumps. Needs an oil field.') },
  sp_ore: { cat: 'spec', w: 140, d: 170, cost: 80000, upk: 1500, ms: 3, jobs: 32, spec: { res: 'ore', prod: 'ore', fc: 0x8a7a6a }, n: () => L('Miniera di minerali', 'Ore mine'), d2: () => L('Ferro e metalli. Serve un giacimento di minerali.', 'Iron and metals. Needs ore deposits.') },
  sp_stone: { cat: 'spec', w: 140, d: 170, cost: 60000, upk: 1100, ms: 3, jobs: 26, spec: { res: 'ore', prod: 'stone', fc: 0xb8b0a0 }, n: () => L('Cava di pietra', 'Stone quarry'), d2: () => L('Pietra per costruire. Va bene in collina e montagna.', 'Building stone. Good on hills and mountains.') },
  maint: { cat: 'misc', w: 40, d: 30, cost: 28000, upk: 1200, ms: 2, r: 3000, eff: 'maint', veh: 'maint', n: () => L('Deposito manutenzione strade', 'Road maintenance depot'), d2: () => L('Spazzaneve in inverno e riparazioni', 'Snowplows in winter and repairs') },
  busdepot: { cat: 'transport', w: 50, d: 40, cost: 25000, upk: 1200, ms: 1, depot: 'bus', n: () => L('Deposito autobus', 'Bus depot'), d2: () => L('Serve per le linee di autobus', 'Needed for bus lines') },
  busstation: { cat: 'transport', w: 60, d: 40, cost: 60000, upk: 2000, ms: 4, depot: 'bus', n: () => L('Stazione degli autobus', 'Bus station'), d2: () => L('Capolinea grande per tante linee', 'Big hub for many lines') },
  parking: { cat: 'transport', w: 40, d: 30, cost: 12000, upk: 300, ms: 2, r: 450, cap: 1500, eff: 'parking', n: () => L('Parcheggio a raso', 'Parking lot'), d2: () => L('Le auto non girano più a cercare posto', 'Cars stop circling for a spot') },
  parkgar: { cat: 'transport', w: 36, d: 36, cost: 60000, upk: 1200, ms: 5, r: 700, cap: 5000, eff: 'parking', h: 16, n: () => L('Parcheggio multipiano', 'Parking garage'), d2: () => L('Tanti posti in poco spazio', 'Many spots in little space') },
  taxi: { cat: 'transport', w: 40, d: 30, cost: 24000, upk: 1100, ms: 3, veh: 'taxi', n: () => L('Deposito taxi', 'Taxi depot'), d2: () => L('Taxi che girano per la città', 'Taxis roam the city') },
  train: { cat: 'transport', w: 80, d: 30, cost: 120000, upk: 4200, ms: 5, station: 'train', rail: true, n: () => L('Stazione ferroviaria', 'Train station'), d2: () => L('Vicino ai binari. Arrivano anche turisti.', 'Next to tracks. Tourists arrive too.') },
  cargotrain: { cat: 'transport', w: 100, d: 40, cost: 150000, upk: 4500, ms: 5, cargo: 'train', rail: true, n: () => L('Scalo merci ferroviario', 'Cargo train terminal'), d2: () => L('Le merci viaggiano in treno', 'Goods travel by train') },
  cargoport: { cat: 'transport', w: 120, d: 80, cost: 250000, upk: 7000, ms: 6, cargo: 'ship', shore: true, noise: 6, port: 2, n: () => L('Porto merci', 'Cargo port'), d2: () => L('Navi merci: import ed export', 'Cargo ships: import and export') },
  harbor: { cat: 'transport', w: 60, d: 40, cost: 120000, upk: 3500, ms: 6, station: 'ship', shore: true, attr: 6, n: () => L('Porto passeggeri', 'Passenger harbor'), d2: () => L('Traghetti e turisti dal mare', 'Ferries and tourists by sea') },
};
// ampliamenti dei servizi (si comprano dalla scheda dell'edificio)
const EXT_SCHOOL = [{ k: 'wing', cost: 20000, upk: 600, capM: 1.5, n: () => L('Ala con aule in più', 'Extra classroom wing') }, { k: 'lab', cost: 25000, upk: 500, rM: 1.2, n: () => L('Laboratorio di scienze', 'Science lab') }];
const EXT = {
  school: EXT_SCHOOL, high: EXT_SCHOOL, college: [{ k: 'lib', cost: 40000, upk: 900, capM: 1.4, n: () => L('Biblioteca', 'Library') }], uni: [{ k: 'dorm', cost: 80000, upk: 1500, capM: 1.5, n: () => L('Studentato', 'Dormitory') }, { k: 'lab', cost: 90000, upk: 1800, rM: 1.2, n: () => L('Centro di ricerca', 'Research centre') }],
  clinic: [{ k: 'ward', cost: 15000, upk: 600, capM: 1.5, n: () => L('Ambulatorio in più', 'Extra ward') }],
  hospital: [{ k: 'ward', cost: 50000, upk: 2000, capM: 1.4, n: () => L('Reparto in più', 'Extra ward') }, { k: 'lab', cost: 40000, upk: 1500, rM: 1.15, n: () => L('Laboratorio analisi', 'Medical lab') }, { k: 'heli', cost: 90000, upk: 2500, rM: 1.4, n: () => L('Elisoccorso', 'Helipad') }],
  cemetery: [{ k: 'field', cost: 15000, upk: 300, storeM: 2, n: () => L('Campo in più', 'Extra field') }],
  police: [{ k: 'cells', cost: 15000, upk: 600, capM: 1.5, n: () => L('Celle', 'Holding cells') }], policehq: [{ k: 'cells', cost: 40000, upk: 1500, capM: 1.4, n: () => L('Celle', 'Holding cells') }],
  fire: [{ k: 'garage', cost: 15000, upk: 600, capM: 1.5, n: () => L('Rimessa per un camion in più', 'Extra truck garage') }], firehq: [{ k: 'garage', cost: 40000, upk: 1500, capM: 1.4, n: () => L('Rimessa per i camion', 'Truck garage') }],
  landfill: [{ k: 'pit', cost: 30000, upk: 500, storeM: 1.6, n: () => L('Fossa in più', 'Extra pit') }],
  busdepot: [{ k: 'bay', cost: 20000, upk: 500, n: () => L('Rimessa autobus: +5 autobus per linea', 'Bus bay: +5 buses per line') }],
  cargoport: [{ k: 'wh', cost: 60000, upk: 1500, n: () => L('Magazzini: 3 navi insieme', 'Warehouses: 3 ships at once') }],
  post: [{ k: 'van', cost: 12000, upk: 400, capM: 1.5, rM: 1.2, n: () => L('Furgoni in più', 'Extra vans') }],
};
const extOf = sv => (EXT[sv.type] || []).filter(e => sv.ext?.includes(e.k));
function extMul(sv, key) { let m = 1; for (const e of extOf(sv)) if (e[key]) m *= e[key]; return m; }
function svcEff(sv) {
  const d = SV[sv.type], why = []; let e = 1;
  const b = clamp(S.budget[d.cat] / 100, 0.3, 1.5); if (b !== 1) why.push([L('Budget', 'Budget'), b]); e *= Math.min(1.2, b);
  if (d.cat !== 'power' && d.cat !== 'water' && d.cat !== 'parks' && sv.pow === false) { e *= 0.5; why.push([L('Manca l\'elettricità', 'No electricity'), 0.5]); }
  if (d.cat !== 'power' && d.cat !== 'water' && d.cat !== 'parks' && sv.wat === false) { e *= 0.7; why.push([L('Manca l\'acqua', 'No water'), 0.7]); }
  const noMed = d.cat === 'health' && d.cap && (sv.med ?? 100) < 10, ce = Math.min(1, (sv.capEff ?? 1) / (noMed && sv.capEff < 0.6 ? 0.5 : 1));
  if (ce < 0.99 && d.cap) { e *= ce; why.push([L('Troppe persone da servire', 'Too many people to serve'), ce]); }
  if (noMed) { e *= 0.5; why.push([L('Nessuna fornitura medica', 'No medical supplies'), 0.5]); }
  if (sv.seg == null && d.eff && d.cat !== 'parks') { e *= 0.3; why.push([L('Nessun accesso stradale', 'No road access'), 0.3]); }
  return { e: clamp(e, 0, 1.2), why };
}
function extUpk(sv) { return extOf(sv).reduce((t, e) => t + e.upk, 0); }
const svStore = sv => SV[sv.type].store * extMul(sv, 'storeM');
const svcs = new Map(); let nextSvcId = 1;
const svcBuckets = new Map();
function obbContains(o, x, z, pad = 0) { const dx = x - o.x, dz = z - o.z, c = Math.cos(o.ang), s = Math.sin(o.ang); const lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) <= o.w / 2 + pad && Math.abs(lz) <= o.d / 2 + pad; }
function svcAt(x, z) { const k = bkKey(x, z); for (const dz of [-1, 0, 1]) for (const dx of [-1, 0, 1]) { const l = svcBuckets.get(k + dz * BB + dx); if (l) for (const id of l) { const o = svcs.get(id); if (o && obbContains(o, x, z, 0)) return o; } } return null; }
function obbCorners(o) { const c = Math.cos(o.ang), s = Math.sin(o.ang), r = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = a * o.w / 2, lz = b * o.d / 2; r.push([o.x + lx * c + lz * s, o.z - lx * s + lz * c]); } return r; }
function obbOverlap(a, b) {
  const axes = [a.ang, a.ang + Math.PI / 2, b.ang, b.ang + Math.PI / 2], ca = obbCorners(a), cb = obbCorners(b);
  for (const t of axes) { const ax = Math.cos(t), az = -Math.sin(t); let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const [x, z] of ca) { const p = x * ax + z * az; a0 = Math.min(a0, p); a1 = Math.max(a1, p); } for (const [x, z] of cb) { const p = x * ax + z * az; b0 = Math.min(b0, p); b1 = Math.max(b1, p); } if (a1 < b0 || b1 < a0) return false; }
  return true;
}
// proposta di posizione mentre si muove il mouse
function svcPlacement(type, x, z, rot) {
  const d = SV[type]; const o = { type, x, z, ang: rot, w: d.w, d: d.d, ok: true, why: '' };
  const near = findNearSeg(x, z, Math.max(60, Math.hypot(d.w, d.d) * 0.75), s => d.rail ? s.type === 'rail' : (!RT[s.type].rail && !RT[s.type].ped));
  if (near) {
    const s = near.seg, hw = RT[s.type].w / 2, nx = -near.tz, nz = near.tx;
    const side = ((x - near.x) * nx + (z - near.z) * nz) >= 0 ? 1 : -1;
    const off = hw + d.d / 2 + 1.5;
    o.x = near.x + nx * side * off; o.z = near.z + nz * side * off; o.ang = Math.atan2(nx * side, nz * side);
    o.seg = s.id; o.along = near.along;
  } else if (!d.free && type !== 'antenna') { o.ok = false; o.why = d.rail ? L('Mettila accanto ai binari', 'Place it next to the railway') : L('Deve toccare una strada', 'Must touch a road'); }
  for (const [cx, cz] of obbCorners(o).concat([[o.x, o.z]])) {
    if (!isOwned(cx, cz)) { o.ok = false; o.why = L('Fuori dal tuo territorio: compra la casella', 'Outside your land: buy the tile'); break; }
  }
  const fx = Math.sin(o.ang), fz = Math.cos(o.ang);
  if (d.shore) {
    let wet = false; for (const k of [0.5, 0.8, 1.2, 1.8]) if (isWater(o.x + fx * d.d * k, o.z + fz * d.d * k)) wet = true;
    if (!wet) { o.ok = false; o.why = L('Va messa sulla riva, con l\'acqua dietro', 'Must be on the shore, with water behind'); }
    if (isWater(o.x - fx * d.d * 0.3, o.z - fz * d.d * 0.3)) { o.ok = false; o.why = L('Il davanti deve stare sulla terra', 'The front must be on land'); }
  } else if ((d.gw || d.geo) && gSample(RES.gw, o.x, o.z) < 0.2) { o.ok = false; o.why = L('Qui non c\'è acqua sotto terra: guarda la vista Falde', 'No groundwater here: check the Groundwater view'); }
  if (d.shore) {} else if (o.ok) {
    for (const [cx, cz] of obbCorners(o).concat([[o.x, o.z]])) if (isWater(cx, cz)) { o.ok = false; o.why = L('Non sull\'acqua', 'Not on water'); break; }
  }
  if (o.ok) {
    const r = Math.hypot(d.w, d.d) / 2 + 10;
    for (const id of segsNear(o.x, o.z, r)) { const s = segs.get(id); if (!s) continue; for (const p of s.pts) if (obbContains(o, p.x, p.z, RT[s.type].w / 2 - 1)) { o.ok = false; o.why = L('Si sovrappone a una strada', 'Overlaps a road'); break; } if (!o.ok) break; }
  }
  if (o.ok) for (const sv of svcs.values()) if (Math.hypot(sv.x - o.x, sv.z - o.z) < (Math.hypot(sv.w, sv.d) + Math.hypot(o.w, o.d)) / 2 && obbOverlap(sv, o)) { o.ok = false; o.why = L('Si sovrappone a un altro edificio', 'Overlaps another building'); break; }
  if (o.ok && d.spec) { o.res = specRes(o); if (o.res < 0.1) { o.ok = false; o.why = L('Qui la risorsa non c\'è o è troppo poca: guarda la vista Risorse naturali', 'Not enough of this resource here: check the Natural resources view'); } }
  if (o.ok && d.need && !signOk(type)) { o.ok = false; o.why = signNeedTxt(type); }
  if (o.ok && d.unique && [...svcs.values()].some(s => s.type === type)) { o.ok = false; o.why = L('Ne puoi costruire solo uno', 'You can build only one'); }
  o.y = Math.max(WATER + 0.5, Math.min(...obbCorners(o).map(([a, b]) => Math.max(getH(a, b), WATER + 0.5)), getH(o.x, o.z)));
  return o;
}
function specRes(o) { const d = SV[o.type]; if (!d.spec) return 0; let t = 0, n = 0; const c = Math.cos(o.ang), s = Math.sin(o.ang); for (let a = -2; a <= 2; a++) for (let b = -1; b <= 3; b++) { const lx = a * o.w / 5.5, lz = b * o.d / 8, x = o.x + lx * c + lz * s, z = o.z - lx * s + lz * c; t += gSample(RES[d.spec.res], x, z); n++; } return t / n; }
function placeSvc(o, data) {
  const d = SV[o.type];
  const sv = { id: data?.id ?? nextSvcId++, type: o.type, x: o.x, z: o.z, y: o.y, ang: o.ang, w: d.w, d: d.d, seg: o.seg ?? null, along: o.along ?? 0, parts: [], fill: data?.fill ?? 0, on: data?.on ?? true, name: data?.name, ext: data?.ext || [], dist: data?.dist || 0, med: data?.med ?? 100 };
  if (d.spec) sv.res = specRes(sv);
  if (data?.id) nextSvcId = Math.max(nextSvcId, data.id + 1);
  svcs.set(sv.id, sv);
  const k = bkKey(sv.x, sv.z); if (!svcBuckets.has(k)) svcBuckets.set(k, new Set()); svcBuckets.get(k).add(sv.id);
  // spiana il terreno sotto e toglie celle ed edifici
  const pad = 4, r = Math.hypot(sv.w, sv.d) / 2 + pad;
  let i0 = 1e9, j0 = 1e9, i1 = -1, j1 = -1;
  for (let j = Math.floor((sv.z - r + HALF) / HC); j <= Math.ceil((sv.z + r + HALF) / HC); j++) for (let i = Math.floor((sv.x - r + HALF) / HC); i <= Math.ceil((sv.x + r + HALF) / HC); i++) {
    if (i < 0 || j < 0 || i >= HN || j >= HN) continue;
    const x = -HALF + i * HC, z = -HALF + j * HC;
    if (!obbContains(sv, x, z, pad + 8)) continue;
    const kk = j * HN + i; if (H[kk] < WATER + 0.3 && d.shore) continue;
    const w = obbContains(sv, x, z, pad) ? 1 : 0.5;
    H[kk] = lerp(H[kk], sv.y - 0.2, w);
    i0 = Math.min(i0, i); j0 = Math.min(j0, j); i1 = Math.max(i1, i); j1 = Math.max(j1, j);
  }
  if (i1 >= 0) { updateTerrain(i0 - 1, j0 - 1, i1 + 1, j1 + 1); terrainChanged(i0, j0, i1, j1); }
  for (const c of cells) if (c && Math.abs(c.x - sv.x) < r + 8 && Math.abs(c.z - sv.z) < r + 8 && obbContains(sv, c.x, c.z, 3)) killCell(c);
  bldNear(sv.x, sv.z, r + 30, b => { if (b.cells.some(id => !cells[id])) destroyBuilding(b); });
  clearTrees((x, z) => obbContains(sv, x, z, 2), sv.x, sv.z, r);
  drawSvc(sv);
  if (!data && typeof S !== 'undefined') addXP(d.xp || (d.cat === 'parks' ? 100 : d.station ? 10 : d.r ? 300 : 100), d.n());
  netDirty = true; covDirty = true;
  if (data?.route) sv.route = data.route;
  if (d.cargo === 'ship' || d.station === 'ship') sv.dock = sv.route || findDock(sv);
  return sv;
}
function removeSvc(sv) {
  removeParts(sv.parts); svcs.delete(sv.id); svcBuckets.get(bkKey(sv.x, sv.z))?.delete(sv.id);
  for (const ln of lines) if (ln.stations) ln.stations = ln.stations.filter(id => id !== sv.id);
  powerLines = powerLines.filter(pl => { const ok = pl.a.svc !== sv.id && pl.b.svc !== sv.id; return ok; }); rebuildPowerLines();
  netDirty = true; covDirty = true;
  if (selected?.obj === sv) selectNone();
  // rigenera le celle intorno
  const near = new Set(); for (const id of segsNear(sv.x, sv.z, Math.hypot(sv.w, sv.d) / 2 + 60)) near.add(segs.get(id));
  for (const s of near) if (s) regenCellsNear({ pts: s.pts });
}
const SVCOL = { spec: 0xc0803a, sign: 0xd8b060, power: 0xd8c070, water: 0x6aa6d8, garbage: 0x8f8a5a, health: 0xf0f0f0, police: 0x4a6ab8, fire: 0xc0463a, edu: 0xd89a5a, parks: 0x6aa84f, transport: 0xb8b8c0, misc: 0x9a9aa8 };
function drawSvc(sv) {
  removeParts(sv.parts); curRef = sv;
  const d = SV[sv.type], y = sv.y, yaw = sv.ang, W = sv.w - 1, D = sv.d - 1, P = sv.parts, col = SVCOL[d.cat];
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const at = (a, b) => [sv.x + fx * b + rx * a, sv.z + fz * b + rz * a]; // a: lato, b: profondità
  const box = (a, b, w, h, dd, c, pool = 'body', y0 = 0) => { const [x, z] = at(a, b); return addPart(P, pool, x, y + y0, z, yaw, w, h, dd, c); };
  const slab = c => box(0, 0, W, 0.3, D, c, 'plain');
  switch (sv.type) {
    case 'wind': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 1.6, 42, 1.6, 0xf2f2f2); sv.blade = []; for (let i = 0; i < 3; i++) sv.blade.push(addPart(P, 'plain', x, y + 42, z, 0, 0.8, 18, 0.5, 0xf8f8f8)); break; }
    case 'solar': slab(0x6c7a5a); for (let r = -2; r <= 2; r++) for (let c = -3; c <= 3; c++) box(c * 9, r * 11, 7.5, 1.2, 6, 0x23365a, 'plain', 0.4); break;
    case 'coal': case 'gas': slab(0x777777); box(-W / 5, 0, W * 0.5, 22, D * 0.7, 0xa29a88); box(W / 4, -D / 4, 10, d.cat ? 14 : 14, 14, 0x8a8a8a); { const [x, z] = at(W / 3, D / 4); addPart(P, 'cyl', x, y, z, 0, 7, sv.type === 'coal' ? 70 : 50, 7, 0xb8b0a0); } if (sv.type === 'coal') box(-W / 3, D / 3, 18, 6, 14, 0x222222, 'roof'); break;
    case 'nuclear': slab(0x888888); for (const a of [-W / 4, W / 4]) { const [x, z] = at(a, D / 6); addPart(P, 'cyl', x, y, z, 0, 34, 55, 34, 0xd8d8d4); } box(0, -D / 3, W * 0.6, 18, D * 0.25, 0xc8c8c8); break;
    case 'transformer': slab(0x9a9a92); for (const a of [-1, 1]) box(a * W * 0.22, 0, W * 0.3, 7, D * 0.45, 0x6a6e74); box(0, -D * 0.35, W * 0.9, 2.2, 0.4, 0x888888, 'plain'); break;
    case 'gwpump': box(0, -D * 0.15, W * 0.55, 4, D * 0.5, 0x6aa6d8); { const [x, z] = at(W * 0.2, D * 0.25); addPart(P, 'cyl', x, y, z, 0, 2.5, 9, 2.5, 0x5a8ab8); } break;
    case 'pump': case 'outlet': box(0, 0, W * 0.7, 6, D * 0.6, sv.type === 'pump' ? 0x6aa6d8 : 0x7a6a4a); { const [x, z] = at(0, D / 2); addPart(P, 'cyl', x, y - 4, z, 0, 3, 6, 3, 0x777777); } break;
    case 'tower': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 2.5, 16, 2.5, 0x999999); addPart(P, 'cyl', x, y + 16, z, 0, 11, 6, 11, 0x6aa6d8); } break;
    case 'treat': slab(0x8a8a8a); for (const a of [-W / 4, W / 4]) for (const b of [-D / 5, D / 5]) { const [x, z] = at(a, b); addPart(P, 'cyl', x, y, z, 0, 16, 2.5, 16, 0x4f7f8f); } box(0, -D * 0.42, W * 0.4, 7, 6, 0xd0d0d0); break;
    case 'landfill': box(0, 0, W, 0.3, D, 0x6b6248, 'plain'); box(0, D / 6, W * 0.8, 3 + Math.min(12, sv.fill / 5000), D * 0.55, 0x5c5a3e, 'roof'); box(-W / 3, -D * 0.4, 12, 5, 8, 0x8f8a5a); break;
    case 'incin': case 'recycle': slab(0x777777); box(0, 0, W * 0.8, 15, D * 0.6, sv.type === 'incin' ? 0x8a6a5a : 0x5f9a5a); if (sv.type === 'incin') { const [x, z] = at(W / 3, D / 4); addPart(P, 'cyl', x, y, z, 0, 5, 45, 5, 0x999088); } break;
    case 'cemetery': slab(0x5f8a4a); for (let r = -3; r <= 3; r++) for (let c = -3; c <= 3; c++) box(c * 6, r * 6, 1.5, 1.2, 0.5, 0xbcbcbc, 'plain'); box(0, -D * 0.42, 8, 6, 5, 0xd8d0c0); break;
    case 'cremat': box(0, 0, W * 0.7, 9, D * 0.6, 0xbab0a0); { const [x, z] = at(W / 4, 0); addPart(P, 'cyl', x, y, z, 0, 2.4, 20, 2.4, 0x777777); } break;
    case 'clinic': case 'hospital': box(0, 0, W * 0.85, d.h || 10, D * 0.7, 0xf2f2f2); box(0, 0, W * 0.3, 0.6, W * 0.06, 0xd02020, 'plain', (d.h || 10) + 0.1); box(0, 0, W * 0.06, 0.6, W * 0.3, 0xd02020, 'plain', (d.h || 10) + 0.1); break;
    case 'police': case 'policehq': box(0, 0, W * 0.85, sv.type === 'police' ? 9 : 18, D * 0.7, 0xdedbd2); box(0, -D * 0.35, W * 0.85, 1.5, 1, 0x2a4aa8, 'plain', 4); break;
    case 'prison': slab(0x777777); box(0, 0, W * 0.6, 12, D * 0.6, 0xa09a90); for (const s of [-1, 1]) { box(s * W / 2, 0, 1, 6, D, 0x8a8a8a, 'plain'); box(0, s * D / 2, W, 6, 1, 0x8a8a8a, 'plain'); } break;
    case 'fire': case 'firehq': box(0, 0, W * 0.85, sv.type === 'fire' ? 9 : 14, D * 0.7, 0xc0463a); box(W / 3, D / 4, 5, 18, 5, 0xc0463a); break;
    case 'school': case 'high': case 'uni': box(0, D / 6, W * 0.9, d.h || 11, D * 0.5, sv.type === 'uni' ? 0xc8a070 : 0xe0b070); box(0, -D * 0.3, W * 0.6, 0.15, D * 0.3, 0x8a6a4a, 'plain'); if (sv.type === 'uni') { box(-W / 3, -D / 4, 16, 16, 16, 0xc8a070); box(W / 3, -D / 4, 16, 16, 16, 0xc8a070); } break;
    case 'pool': case 'waterpark': slab(0xc8beaa); box(0, 0, W * 0.6, 0.2, D * 0.55, 0x3ab0e0, 'plain', 0.3); if (sv.type === 'waterpark') { box(W / 3, D / 4, 6, 14, 6, 0xe0503a); box(-W / 3, D / 4, 6, 10, 6, 0xe0c03a); } box(0, -D * 0.4, W * 0.5, 5, 4, 0xe8e8f0); break;
    case 'basket': case 'gym': slab(0x3a6a8a); box(0, 0, W * 0.8, 0.1, D * 0.7, sv.type === 'basket' ? 0xc06a3a : 0x5fa04a, 'plain', 0.3); box(W * 0.35, 0, 0.4, 4, 0.4, 0xffffff, 'plain'); break;
    case 'beach': { slab(0xe6d29a); box(0, D * 0.3, W, 0.2, D * 0.4, 0xd8c48a, 'plain', 0.2); const r = mulberry32(sv.id); for (let i = 0; i < 7; i++) { const a = (r() - 0.5) * W * 0.85, b = (r() - 0.5) * D * 0.5; const [x, z] = at(a, b); addPart(P, 'cyl', x, y, z, 0, 0.15, 2.6, 0.15, 0xdddddd); addPart(P, 'cyl', x, y + 2.6, z, 0, 2.2, 0.5, 2.2, [0xe04a3a, 0x3a8ae0, 0xf0d040, 0xffffff][i % 4]); } box(-W * 0.4, -D * 0.4, 4, 3, 3, 0xf0f0f0); break; }
    case 'cityhall': box(0, D / 8, W * 0.85, 14, D * 0.55, 0xe8dcc4); box(0, D / 8, W * 0.3, 24, D * 0.3, 0xd8ccb4); box(0, -D * 0.3, W * 0.6, 0.15, D * 0.3, 0xc8beaa, 'plain'); for (let i = -2; i <= 2; i++) box(i * W * 0.12, -D * 0.16, 1.2, 12, 1.2, 0xf8f8f0, 'plain'); break;
    case 'mailbox': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 0.7, 1.4, 0.7, 0xd8b020); addPart(P, 'plain', x, y + 1.4, z, yaw, 1.1, 0.4, 0.8, 0xd8b020); break; }
    case 'post': box(0, D / 8, W * 0.8, 8, D * 0.6, 0xe8e0c8); box(0, -D * 0.3, W * 0.8, 1.2, 0.8, 0xd8b020, 'plain', 6); break;
    case 'postsort': slab(0x777777); box(0, D / 8, W * 0.85, 12, D * 0.6, 0xd8d0b8); box(0, -D * 0.3, W * 0.85, 1.4, 0.8, 0xd8b020, 'plain', 10); for (let i = -2; i <= 2; i++) box(i * 9, -D * 0.42, 6, 3, 4, 0xd8b020, 'body'); break;
    case 'sp_grain': case 'sp_veg': case 'sp_live': case 'sp_cotton': case 'sp_wood': case 'sp_oil': case 'sp_ore': case 'sp_stone': {
      const sp = d.spec, b0 = -D * 0.36, A = D * 0.86, ac = b0 + A / 2 + D * 0.07; // recinto dietro la sede
      box(0, -D * 0.43, 24, 7, 14, 0xd8c8a8); box(10, -D * 0.43, 8, 10, 8, 0xa04a3a);
      box(0, ac, W * 0.96, 0.25, A * 0.96, sp.fc, 'plain', 0.05);
      for (const s of [-1, 1]) { box(s * W * 0.48, ac, 0.3, 1.6, A * 0.96, 0x8a7050, 'plain'); box(0, ac + s * A * 0.48, W * 0.96, 1.6, 0.3, 0x8a7050, 'plain'); }
      const r = mulberry32(sv.id), rp = () => [(r() - 0.5) * W * 0.85, ac + (r() - 0.5) * A * 0.85];
      if (sv.type === 'sp_grain' || sv.type === 'sp_veg' || sv.type === 'sp_cotton') for (let i = -5; i <= 5; i++) box(i * W * 0.085, ac, 1.2, 0.5, A * 0.9, sv.type === 'sp_grain' ? 0xc0a040 : sv.type === 'sp_veg' ? 0x3f7a2a : 0xffffff, 'plain', 0.2);
      if (sv.type === 'sp_veg') for (let i = 0; i < 3; i++) box(-W * 0.3 + i * W * 0.3, ac - A * 0.3, 18, 4, 10, 0xd8e8f0, 'plain');
      if (sv.type === 'sp_live') { for (let i = 0; i < 18; i++) { const [a, b] = rp(); box(a, b, 1.2, 1.4, 2.4, i % 3 ? 0xf2f2f2 : 0x3a2a20, 'plain'); } box(-W * 0.3, ac - A * 0.3, 16, 6, 10, 0xa04a3a); }
      if (sv.type === 'sp_wood') { for (let i = 0; i < 40; i++) { const [a, b] = rp(); const [x, z] = at(a, b); addPart(P, 'cyl', x, y, z, 0, 0.6, 3, 0.6, 0x6b4a2b); addPart(P, 'roof', x, y + 3, z, r() * 3, 5, 8, 5, 0x2f6a30); } for (let i = 0; i < 4; i++) box(-W * 0.3 + i * 4, ac - A * 0.36, 2.5, 2.5, 12, 0x9a6a3a, 'plain'); }
      if (sv.type === 'sp_oil') for (let i = 0; i < 6; i++) { const [a, b] = rp(); box(a, b, 2, 4, 6, 0x3a3a3a); box(a, b, 1, 1, 9, 0xd8a030, 'plain', 4); }
      if (sv.type === 'sp_ore' || sv.type === 'sp_stone') { box(0, ac, W * 0.6, 0.3, A * 0.55, sv.type === 'sp_ore' ? 0x6a5a4a : 0xd0c8b8, 'plain', 0.2); for (let i = 0; i < 5; i++) { const [a, b] = rp(); const [x, z] = at(a, b); addPart(P, 'roof', x, y, z, r() * 3, 8, 5, 8, sv.type === 'sp_ore' ? 0x5a4a3a : 0xc8c0b0); } box(W * 0.3, ac - A * 0.3, 6, 12, 6, 0x777777); }
      break;
    }
    case 'dogpark': slab(0x6aa84f); for (const s of [-1, 1]) { box(s * W * 0.48, 0, 0.3, 1.2, D, 0x8a7a5a, 'plain'); box(0, s * D * 0.48, W, 1.2, 0.3, 0x8a7a5a, 'plain'); } box(W * 0.25, 0, 2, 1.6, 2, 0xa0784a); break;
    case 'firepit': { slab(0xb8a888); const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 3, 0.6, 3, 0x6a5a4a); addPart(P, 'cyl', x, y + 0.6, z, 0, 1.4, 1.2, 1.4, 0xff7a20); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; box(Math.cos(a) * 7, Math.sin(a) * 7, 3, 0.6, 0.8, 0x8a5a3a); } } break;
    case 'pmaint': box(0, 0, W * 0.8, 7, D * 0.6, 0x5f9a4a); break;
    case 'welfare': box(0, 0, W * 0.8, 8, D * 0.7, 0xe0c8a0); box(0, -D * 0.36, W * 0.5, 1.4, 1, 0xe08a2a, 'plain', 5); break;
    case 'college': box(0, D / 6, W * 0.9, 16, D * 0.5, 0xb87a5a); box(0, -D * 0.3, W * 0.6, 0.15, D * 0.3, 0x5fa04a, 'plain'); break;
    case 'telecom': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 3, 95, 3, 0xe8e8e8); addPart(P, 'cyl', x, y + 70, z, 0, 9, 8, 9, 0xd03a3a); box(0, 0, 10, 4, 10, 0x888888); } break;
    case 'hotel': box(0, 0, W * 0.9, 34, D * 0.7, 0xe8d8b8); box(0, 0, W * 0.95, 2, D * 0.75, 0xb08a3a, 'plain', 34); break;
    case 'gallery': box(0, 0, W * 0.9, 14, D * 0.8, 0xe8e4dc); for (let i = -2; i <= 2; i++) box(i * W / 6, -D * 0.42, 1.4, 12, 1.4, 0xf8f8f8, 'plain'); break;
    case 'botanic': slab(0x4f9a3a); box(0, 0, W * 0.4, 12, D * 0.3, 0xa8d8e8); box(0, 0, W * 0.9, 0.1, 3, 0xc8beaa, 'plain', 0.35); break;
    case 'statue': { slab(0xc8beaa); box(0, 0, 4, 4, 4, 0xbcbcbc); const [x, z] = at(0, 0); addPart(P, 'cyl', x, y + 4, z, 0, 1.4, 9, 1.4, 0x8a6a3a); } break;
    case 'castle': slab(0x7a8a5a); box(0, 0, W * 0.7, 12, D * 0.7, 0xa09888); for (const a of [-1, 1]) for (const b of [-1, 1]) { const [x, z] = at(a * W * 0.35, b * D * 0.35); addPart(P, 'cyl', x, y, z, 0, 7, 22, 7, 0x8f887a); } break;
    case 'pmansion': case 'rmansion': box(0, D / 8, W * 0.6, d.h, D * 0.5, sv.type === 'pmansion' ? 0xe8d0b0 : 0x3a3a44); box(0, -D * 0.3, W * 0.4, 0.15, D * 0.25, 0x3ab0e0, 'plain', 0.3); break;
    case 'ironpress': box(0, 0, W * 0.85, 14, D * 0.7, 0x8a4a3a); { const [x, z] = at(W / 3, D / 4); addPart(P, 'cyl', x, y, z, 0, 3, 30, 3, 0x6a3a2a); } break;
    case 'diner': box(0, 0, W * 0.8, 5, D * 0.6, 0xd8d8e0); box(0, -D * 0.3, W * 0.8, 1, 0.6, 0xe03a5a, 'plain', 4.5); break;
    case 'principi': box(0, 0, W * 0.7, 70, D * 0.7, 0x5a6a7a); box(0, 0, W * 0.5, 10, D * 0.5, 0x9ab0c0, 'body', 70); break;
    case 'parking': slab(0x55575c); for (let i = -3; i <= 3; i++) box(i * 5, 0, 0.3, 0.05, D * 0.6, 0xf0f0f0, 'plain', 0.35); break;
    case 'parkgar': box(0, 0, W * 0.9, 16, D * 0.9, 0x9a9a9a); for (let i = 1; i <= 3; i++) box(0, 0, W * 0.92, 0.6, D * 0.92, 0x6a6a6a, 'plain', i * 4); break;
    case 'busstation': box(0, D / 6, W * 0.9, 9, D * 0.6, 0x3a7ad0); box(0, -D * 0.35, W * 0.9, 0.2, D * 0.3, 0x55575c, 'plain'); break;
    case 'park': case 'playground': case 'plaza': case 'bigpark': case 'sports': {
      slab(sv.type === 'plaza' ? 0xc8beaa : sv.type === 'sports' ? 0x3f8a3a : 0x5fa04a);
      if (sv.type === 'sports') { box(0, 0, W * 0.8, 0.1, D * 0.75, 0x56a84a, 'plain', 0.3); box(0, 0, 0.4, 0.12, D * 0.75, 0xffffff, 'plain', 0.35); }
      if (sv.type === 'plaza') { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 8, 1, 8, 0x8ab8d8); addPart(P, 'cyl', x, y, z, 0, 1, 4, 1, 0xd8d0c0); }
      if (sv.type === 'bigpark') { const [x, z] = at(W / 5, 0); addPart(P, 'cyl', x, y, z, 0, 22, 0.5, 16, 0x4a8ab8); }
      if (sv.type === 'playground') { box(-3, 0, 5, 3, 1, 0xe04a3a, 'plain'); box(4, 3, 3, 2, 3, 0x3a8ae0, 'plain'); }
      const nt = sv.type === 'bigpark' ? 26 : sv.type === 'plaza' ? 4 : sv.type === 'sports' ? 0 : 5; const r = mulberry32(sv.id);
      for (let i = 0; i < nt; i++) { const a = (r() - 0.5) * W * 0.9, b = (r() - 0.5) * D * 0.9; const [x, z] = at(a, b); const h = addPart(P, 'cyl', x, y, z, 0, 0.6, 3, 0.6, 0x6b4a2b); addPart(P, 'roof', x, y + 3, z, r() * 3, 5, 7, 5, 0x3f7a35); }
      break;
    }
    case 'wheel': { slab(0xc8beaa); const [x, z] = at(0, 0); addPart(P, 'plain', x, y, z, yaw, 2, 30, 2, 0x999999); sv.blade = []; for (let i = 0; i < 4; i++) sv.blade.push(addPart(P, 'plain', x, y + 30, z, yaw, 0.6, 52, 0.6, 0xd04a8a)); break; }
    case 'stadium': slab(0x999999); { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, yaw, W * 0.9, 22, D * 0.9, 0xd8d8d8); addPart(P, 'cyl', x, y + 0.5, z, yaw, W * 0.7, 22, D * 0.6, 0x4f9a4a); } break;
    case 'tower2': { slab(0xc8beaa); const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 10, 120, 10, 0xe8e8f0); addPart(P, 'cyl', x, y + 120, z, 0, 22, 10, 22, 0x6a9ad0); addPart(P, 'cyl', x, y + 130, z, 0, 2, 30, 2, 0xcccccc); } break;
    case 'antenna': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 1.5, 46, 1.5, 0xd03a3a); box(0, 0, 5, 3, 5, 0x888888); } break;
    case 'siren': { const [x, z] = at(0, 0); addPart(P, 'cyl', x, y, z, 0, 0.8, 12, 0.8, 0x888888); addPart(P, 'plain', x, y + 12, z, 0, 2.4, 1.5, 2.4, 0xe0b020); } break;
    case 'shelter': box(0, 0, W * 0.8, 4, D * 0.8, 0x8a8a7a); box(0, -D * 0.38, 6, 4.5, 3, 0xe0b020); break;
    case 'maint': box(0, 0, W * 0.85, 8, D * 0.6, 0xe08a2a); break;
    case 'busdepot': case 'tramdepot': case 'taxi': box(0, D / 6, W * 0.9, 9, D * 0.6, sv.type === 'taxi' ? 0xe0c02a : sv.type === 'tramdepot' ? 0x2aa07a : 0x3a7ad0); box(0, -D * 0.35, W * 0.9, 0.2, D * 0.3, 0x55575c, 'plain'); break;
    case 'metro': box(0, 0, 10, 4, 8, 0x2a5ad0); box(0, 0, 3, 1, 3, 0xffffff, 'plain', 4.1); break;
    case 'train': box(0, -D / 4, W * 0.8, 12, D * 0.45, 0xb08a6a); box(0, D * 0.3, W, 0.6, D * 0.3, 0xa8a8a8, 'plain'); box(0, D * 0.3, W * 0.9, 0.4, 4, 0x777777, 'plain', 5); break;
    case 'cargotrain': slab(0x8a8a8a); for (let i = -3; i <= 3; i++) box(i * 12, -D / 5, 10, 2.6 * (1 + (i & 1)), 4, [0xc0462a, 0x2a6ac0, 0x3a9a4a][(i + 3) % 3], 'plain'); box(0, D / 4, W, 18, 2, 0xd8a030, 'plain'); break;
    case 'cargoport': case 'cargoport2': case 'cargoport3': if (sv.ext?.includes('wh')) for (const a of [-1, 1]) box(a * W * 0.3, -D * 0.38, W * 0.32, 10, D * 0.2, 0xb8a888); slab(0x8a8a8a); box(0, D * 0.7, W, 2, D * 0.6, 0x7a7a7a, 'plain', -1); for (let i = -2; i <= 2; i++) box(i * 22, D * 0.75, 4, 32, 4, 0xd8a030, 'plain'); for (let i = 0; i < 18; i++) box(-W / 2 + 8 + (i % 6) * 14, -D / 4 + Math.floor(i / 6) * 8, 12, 2.6, 2.4, [0xc0462a, 0x2a6ac0, 0x3a9a4a, 0xd8a030][i % 4], 'plain', 0.3); break;
    case 'harbor': slab(0xc8beaa); box(0, D * 0.8, W * 0.3, 1.5, D * 0.9, 0x8a7a6a, 'plain', -0.5); box(0, -D / 5, W * 0.7, 8, D * 0.4, 0xe8e8f0); break;
    case 'airport': slab(0x6a8a5a); box(0, D * 0.15, W * 0.95, 0.35, 45, 0x3a3a3e, 'plain'); box(0, -D * 0.33, W * 0.35, 12, D * 0.25, 0xd8d8e0); { const [x, z] = at(W * 0.25, -D * 0.33); addPart(P, 'cyl', x, y, z, 0, 5, 34, 5, 0xd8d8e0); } break;
    default: box(0, 0, W * 0.8, d.h || 10, D * 0.7, col);
  }
  // ampliamenti: piccoli edifici sul retro del lotto
  if (!SV[sv.type].port) extOf(sv).forEach((e, i) => { const s = i % 2 ? 1 : -1; box(s * W * 0.36, D * 0.36, W * 0.24, e.k === 'field' || e.k === 'pit' ? 0.4 : e.k === 'heli' ? 0.5 : 6, D * 0.24, e.k === 'field' ? 0x5f8a4a : e.k === 'pit' ? 0x5c5a3e : e.k === 'heli' ? 0x55575c : col, e.k === 'field' || e.k === 'pit' || e.k === 'heli' ? 'plain' : 'body'); });
  if (!sv.on) tintParts(sv, 0x555555);
}

// ---------- linee elettriche ----------
let powerLines = []; // {a:{x,z,svc?,node?}, b:{...}}
let plGroup = null;
function rebuildPowerLines() {
  if (plGroup) { scene.remove(plGroup); plGroup.traverse(o => o.geometry?.dispose()); }
  plGroup = new THREE.Group();
  const wire = [], posts = [];
  for (const pl of powerLines) {
    const L0 = Math.hypot(pl.b.x - pl.a.x, pl.b.z - pl.a.z), n = Math.max(1, Math.round(L0 / 90));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const x = lerp(pl.a.x, pl.b.x, i / n), z = lerp(pl.a.z, pl.b.z, i / n), y = Math.max(getH(x, z), WATER) + 22;
      posts.push([x, Math.max(getH(x, z), WATER), z]);
      if (prev) for (const o of [-2.5, 2.5]) { const dx = (pl.b.z - pl.a.z) / L0 * o, dz = -(pl.b.x - pl.a.x) / L0 * o; wire.push(prev[0] + dx, prev[1], prev[2] + dz, x + dx, y, z + dz); }
      prev = [x, y, z];
    }
  }
  if (wire.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); plGroup.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x333333 }))); }
  if (posts.length) { const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.8, 23, 4).translate(0, 11.5, 0), new THREE.MeshLambertMaterial({ color: 0x777777 }), posts.length); posts.forEach((p, i) => setInst(m, i, p[0], p[1], p[2], 0, 1, 1, 1)); plGroup.add(m); }
  scene.add(plGroup);
}
function plEndpoint(x, z) {
  const sv = svcAt(x, z) || [...svcs.values()].find(s => obbContains(s, x, z, 12));
  if (sv) return { x: sv.x, z: sv.z, svc: sv.id };
  const n = findNearNode(x, z, 60, n => n.segs.some(id => !RT[segs.get(id)?.type]?.rail));
  if (n) return { x: n.x, z: n.z, node: n.id };
  const s = findNearSeg(x, z, 20, s => !RT[s.type].rail);
  if (s) return { x: s.x, z: s.z, node: s.seg.a };
  return { x, z };
}

// ---------- reti: elettricità, acqua, fogne ----------
let netDirty = true, covDirty = true;
const PDIRECT = 40; // corrente che una centrale manda nelle strade senza trasformatore
const NET = { comps: new Map(), cityPow: { prod: 0, use: 0 }, cityWat: { prod: 0, use: 0 }, citySew: { prod: 0, use: 0 }, trade: { pow: 0, wat: 0 } };
function svcNodeKey(sv) { const s = sv.seg != null ? segs.get(sv.seg) : null; return s ? 'n' + s.a : 's' + sv.id; }
function computeNetworks() {
  const par = new Map();
  const find = k => { let r = k; while (par.has(r) && par.get(r) !== r) r = par.get(r); let c = k; while (par.has(c) && par.get(c) !== r) { const n = par.get(c); par.set(c, r); c = n; } return r; };
  const uni = (a, b) => { if (!par.has(a)) par.set(a, a); if (!par.has(b)) par.set(b, b); const ra = find(a), rb = find(b); if (ra !== rb) par.set(ra, rb); };
  for (const s of segs.values()) if (!RT[s.type].rail) uni('n' + s.a, 'n' + s.b);
  for (const pl of powerLines) { const ka = pl.a.svc ? svcNodeKey(svcs.get(pl.a.svc) || {}) : pl.a.node ? 'n' + pl.a.node : null; const kb = pl.b.svc ? svcNodeKey(svcs.get(pl.b.svc) || {}) : pl.b.node ? 'n' + pl.b.node : null; if (ka && kb) uni(ka, kb); }
  // centrali vicine si collegano da sole se si toccano (campi eolici)
  const free = [...svcs.values()].filter(s => s.seg == null);
  for (const a of free) for (const b of svcs.values()) if (a !== b && Math.hypot(a.x - b.x, a.z - b.z) < (a.w + b.w) / 2 + 30) uni(svcNodeKey(a), svcNodeKey(b));
  const comps = new Map();
  const C = k => { const r = par.has(k) ? find(k) : k; if (!comps.has(r)) comps.set(r, { pP: 0, pU: 0, wP: 0, wU: 0, sP: 0, sU: 0, out: false, polW: 0 }); return comps.get(r); };
  for (const n of nodes.values()) if (n.outside && !n.rail) C('n' + n.id).out = true;
  const bud = k => S.budget[k] / 100;
  for (const sv of svcs.values()) {
    if (!sv.on) continue; const d = SV[sv.type], c = C(svcNodeKey(sv)); sv.net = c;
    let p = d.p || 0;
    if (sv.type === 'wind') p *= 0.5 + WEATHER.wind * 0.9;
    if (sv.type === 'windmill' || sv.type === 'windsmall') p *= 0.5 + WEATHER.wind * 0.9;
    if (sv.ext.includes('rotor')) p += 2.5 * (0.5 + WEATHER.wind * 0.9);
    if (sv.type === 'solar') p *= clamp(sunUp * 1.2, 0, 1) * (WEATHER.kind === 'clear' ? 1 : WEATHER.kind === 'snow' ? 0.5 : 0.75);
    if (d.bat || sv.ext.includes('bat')) p += (d.bat || 4) * (sunUp < 0.3 || WEATHER.wind < 0.25 ? 1 : 0.15);
    if (d.geo) p *= clamp(gSample(RES.gw, sv.x, sv.z) * 1.5, 0.3, 1);
    if (d.hydro) p *= clamp(0.6 + (MAPS[MAPID]?.cur != null ? 0.3 : 0.15) + (WEATHER.kind === 'rain' || WEATHER.kind === 'storm' ? 0.15 : 0) - (seasonInfo().summer ? 0.15 : 0), 0.4, 1.1);
    if (UPG.has('pow1')) p *= 1.15;
    p *= bud('power'); c.pRaw = (c.pRaw || 0) + p; c.pDir = (c.pDir || 0) + (sv.ext.includes('tr') ? p : Math.min(p, PDIRECT)); if (d.tcap) c.tcap = (c.tcap || 0) + d.tcap * bud('power');
    if (d.gw) { c.wP += d.wat * bud('water') * clamp(gSample(RES.gw, sv.x, sv.z) * 1.6, 0.2, 1); c.polW = Math.max(c.polW, gwPolAt(sv)); }
    else if (d.wat) { c.wP += d.wat * bud('water'); c.polW = Math.max(c.polW, waterPollAt(sv.x + Math.sin(sv.ang) * sv.d, sv.z + Math.cos(sv.ang) * sv.d)); }
    if (d.sew) c.sP += d.sew * bud('water');
    c.pU += d.deco ? 0 : 0.15;
  }
  for (const c of comps.values()) if (c.pRaw) { const big = c.pRaw - c.pDir, through = Math.min(big, c.tcap || 0); c.pP = c.pDir + through; c.pLost = big - through; }
  const policyPow = S.policies.energy ? 0.85 : 1, winter = tempPowMul() / 1.2;
  for (const b of buildings.values()) {
    if (b.ruin) continue; const s = segs.get(b.seg); if (!s) continue;
    const c = C('n' + s.a); b.net = c;
    const z = ZT[b.zone]; const people = (b.hh ? b.occ * 2.6 : b.occ);
    const pu = (z.k === 'I' ? 0.006 : z.k === 'C' || z.k === 'O' ? 0.004 : 0.0022) * Math.max(people, 1) * policyPow * winter * (1.12 - 0.06 * (b.level || 1)) * feeCons('power');
    c.pU += pu; c.wU += people * feeCons('water'); c.sU += people * 1.0;
    b.pu = pu;
  }
  // scambi con le città vicine se la rete tocca l'autostrada esterna
  NET.trade = { pow: 0, wat: 0 };
  let tp = 0, tu = 0, wp = 0, wu = 0, sp = 0, su = 0;
  for (const c of comps.values()) {
    tp += c.pP; tu += c.pU; wp += c.wP; wu += c.wU; sp += c.sP; su += c.sU;
    c.pR = c.pU > 0 ? clamp(c.pP / c.pU, 0, 1) : 1; c.wR = c.wU > 0 ? clamp(c.wP / c.wU, 0, 1) : 1; c.sR = c.sU > 0 ? clamp(c.sP / c.sU, 0, 1) : 1;
    if (c.out && S.trade) {
      const dp = c.pP - c.pU; NET.trade.pow += dp; if (dp < 0) c.pR = 1; // compra il mancante
      const dw = c.wP - c.wU; NET.trade.wat += dw; if (dw < 0) c.wR = 1;
      if (c.sP < c.sU) c.sR = 1, NET.trade.sew = (NET.trade.sew || 0) + (c.sP - c.sU);
    }
  }
  NET.comps = comps;
  NET.cityPow = { prod: tp, use: tu }; NET.cityWat = { prod: wp, use: wu }; NET.citySew = { prod: sp, use: su };
  for (const sv of svcs.values()) { const c = sv.net; sv.pow = !c || c.pR > 0.5; sv.wat = !c || c.wR > 0.5; sv.sewOk = !c || c.sR > 0.5; }
  for (const b of buildings.values()) {
    const c = b.net; if (!c) { b.pow = b.wat = b.sew = false; continue; }
    const h = (hash32(b.id) % 1000) / 1000;
    b.pow = h < c.pR; b.wat = h < c.wR; b.sew = h < c.sR; b.polWater = c.polW;
  }
  for (const s of segs.values()) if (!RT[s.type].rail) s.net = par.has('n' + s.a) ? comps.get(find('n' + s.a)) : null;
  netDirty = false;
}
// ---------- copertura dei servizi ----------
// svago per stagione: d'inverno contano i posti al chiuso, d'estate piscine e parchi acquatici
function leisureMul(d) { const w = typeof WEATHER !== 'undefined' && WEATHER.temp < 5, su = typeof WEATHER !== 'undefined' && WEATHER.temp > 22; if (d.indoor) return w ? 1.3 : 1; if (d.summer) return su ? 1.4 : w ? 0.4 : 0.9; return w ? 0.75 : 1; }
function computeCoverage() {
  for (const b of buildings.values()) b.cov = { health: 0, police: 0, fire: 0, edu1: 0, edu2: 0, edu3: 0, park: 0, death: 0, garb: 0, net: 0, welfare: 0, pmaint: 0, parking: 0, shelter: 0, warn: 0, maint: 0, transit: b.cov?.transit || 0 };
  const bud = c => clamp(S.budget[c] / 100, 0.3, 1.5);
  for (const sv of svcs.values()) {
    if (!sv.on) continue; const d = SV[sv.type];
    if (!d.r) continue;
    const r = d.r * (0.75 + 0.25 * bud(d.cat)) * extMul(sv, 'rM');
    let load = 0; const list = [];
    bldNear(sv.x, sv.z, r, b => { if (sv.dist && distGrid[gIdx(b.x, b.z)] !== sv.dist) return; list.push(b); load += b.hh ? b.occ * 2.6 : b.occ * 0.5; });
    const capEff = d.cap ? clamp(d.cap * extMul(sv, 'capM') * bud(d.cat) / Math.max(load, 1), 0.2, 1) * (d.cat === 'health' && (sv.med ?? 100) < 10 ? 0.5 : 1) : 1;
    sv.load = load; sv.capEff = capEff;
    let full = 1;
    if (d.store) full = sv.fill >= svStore(sv) ? 0 : 1;
    for (const b of list) {
      const dd = Math.hypot(b.x - sv.x, b.z - sv.z), fall = 1 - smooth(r * 0.6, r, dd);
      const v = fall * capEff * full * bud(d.cat);
      if (d.eff) b.cov[d.eff] = Math.max(b.cov[d.eff], v);
      if (d.gcap) b.cov.garb = Math.max(b.cov.garb, v * full);
      if (d.park) b.cov.park = Math.min(15, b.cov.park + d.park * fall * leisureMul(d));
    }
  }
  covDirty = false;
}
