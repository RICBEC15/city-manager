// =====================================================================
//  Mod di Cities: Skylines II - Blocco 9 (26 nov 2026): marchi parodia (mod 167)
//  L'idea della mod (insegne di aziende sui palazzi) rifatta da zero con 124 marchi INVENTATI:
//  nomi buffi nostri e loghi disegnati dal gioco (forme e colori), niente marchi o loghi veri.
//  - ogni negozio, ufficio e fabbrica ha il suo marchio, con l'insegna sulla facciata
//    (di notte si accende); le case a uso misto hanno l'insegna piccola al piano terra
//  - nella scheda dell'edificio: logo, nome e motto, "Cambia marchio"
//  - pannello 🏷️ Marchi: tutti i marchi con quanti ce ne sono in città, insegne sì/no
//  Salvataggio: S.brand = { off, pick: { idEdificio: numeroMarchio } } (i vecchi salvataggi non ce l'hanno: marchi scelti a caso, sempre uguali)
//  ATTENZIONE: aggiungere marchi nuovi SOLO in fondo alla lista, così i numeri salvati restano giusti.
// =====================================================================

// [nome, settore C negozi / O uffici / I industria, motto IT, motto EN]
const BRANDS = [
  // ----- negozi e locali (0-43) -----
  ['Burger Bisonte', 'C', 'Panini grandi come un bisonte', 'Burgers as big as a bison'],
  ['Pizza Pianeta', 'C', 'La pizza che gira intorno al sole', 'The pizza that orbits the sun'],
  ['Caffè Cometa', 'C', 'Un espresso alla velocità della luce', 'Espresso at light speed'],
  ['Gelato Galattico', 'C', 'Gusti da un\'altra galassia', 'Flavours from another galaxy'],
  ['SuperSpesa Sole', 'C', 'Tutto il carrello sotto il sole', 'A whole trolley in the sun'],
  ['MegaMarket Merlo', 'C', 'Fischia che c\'è lo sconto', 'Whistle, it\'s on sale'],
  ['Tacos Tornado', 'C', 'Ti spettinano dal gusto', 'They blow your hair back'],
  ['Sushi Sorriso', 'C', 'Pesce fresco e buonumore', 'Fresh fish, good mood'],
  ['Pollo Pazzo', 'C', 'Croccante fuori, pazzo dentro', 'Crispy outside, crazy inside'],
  ['Forno Pagnotta', 'C', 'Pane caldo alle sei del mattino', 'Warm bread at six a.m.'],
  ['Bottega Bislacca', 'C', 'Cose strane a prezzi normali', 'Odd things, normal prices'],
  ['Moda Mirtillo', 'C', 'Vestiti di tutti i colori del bosco', 'Clothes in every forest colour'],
  ['Scarpe Saltello', 'C', 'Fai un salto da noi', 'Hop on in'],
  ['Ottica Occhiolino', 'C', 'Ci vediamo benissimo', 'See you clearly'],
  ['Farmacia Fiordaliso', 'C', 'Ci prendiamo cura di te', 'We take care of you'],
  ['Libreria Lumaca', 'C', 'Leggi con calma', 'Read slowly'],
  ['Giochi Gufo', 'C', 'Giocattoli per chi sta sveglio', 'Toys for night owls'],
  ['ElettroLampo', 'C', 'Elettrodomestici in un lampo', 'Appliances in a flash'],
  ['Ferramenta Bullone', 'C', 'Abbiamo la vite che cerchi', 'We\'ve got your screw'],
  ['Fiori Farfalla', 'C', 'Mazzi che volano via', 'Bouquets that fly away'],
  ['Profumi Pervinca', 'C', 'Un profumo per ogni giorno', 'A scent for every day'],
  ['Bibite Bollicina', 'C', 'Frizzanti come te', 'Fizzy like you'],
  ['Ciambelle Dondolo', 'C', 'Dolci tondi e allegri', 'Round and happy treats'],
  ['Kebab Koala', 'C', 'Abbraccia il tuo panino', 'Hug your wrap'],
  ['Noodle Nuvola', 'C', 'Spaghetti soffici come nuvole', 'Noodles soft as clouds'],
  ['Frullati Fragola', 'C', 'Frutta in un bicchiere', 'Fruit in a glass'],
  ['Vinile Vortice', 'C', 'Musica che gira', 'Music that spins'],
  ['Sport Scoiattolo', 'C', 'Corri, salta, arrampica', 'Run, jump, climb'],
  ['Pet Pappagallo', 'C', 'Tutto per i tuoi animali', 'Everything for your pets'],
  ['Mobili Morbidi', 'C', 'Divani dove ti addormenti', 'Sofas you fall asleep on'],
  ['Cioccolato Castoro', 'C', 'Costruito con amore', 'Built with love'],
  ['Hot Dog Hula', 'C', 'Balla con la senape', 'Dance with mustard'],
  ['Panino Pinguino', 'C', 'Freschi come il polo', 'Fresh as the pole'],
  ['Taverna Tricheco', 'C', 'Mangia, ridi, ripeti', 'Eat, laugh, repeat'],
  ['Bar Barbagianni', 'C', 'Aperto fino a tardi', 'Open till late'],
  ['Discount Dodo', 'C', 'Prezzi estinti', 'Extinct prices'],
  ['TechTartaruga', 'C', 'Computer che durano cent\'anni', 'Computers that last a century'],
  ['Cartoleria Cactus', 'C', 'Penne che pungono di idee', 'Pens prickly with ideas'],
  ['Gioielli Gazza', 'C', 'Tutto ciò che luccica', 'All that glitters'],
  ['Formaggi Gaia', 'C', 'Stagionati con pazienza', 'Patiently aged'],
  ['Lavanderia Lontra', 'C', 'Panni puliti, cuore leggero', 'Clean clothes, light heart'],
  ['Palestra Pantera', 'C', 'Allenati come un felino', 'Train like a cat'],
  ['Cinema Civetta', 'C', 'Film da vedere al buio', 'Films to watch in the dark'],
  ['Pasticceria Pavone', 'C', 'Dolci da mostrare', 'Cakes worth showing off'],
  // ----- uffici (44-83) -----
  ['Banca Balena', 'O', 'I tuoi risparmi al sicuro in fondo al mare', 'Your savings safe at the bottom of the sea'],
  ['Assicurazioni Armadillo', 'O', 'Una corazza per la tua casa', 'Armour for your home'],
  ['Nuvola Software', 'O', 'Programmi leggeri come l\'aria', 'Software light as air'],
  ['Pixel Pinguino', 'O', 'Grafica che non si scioglie', 'Graphics that never melt'],
  ['Gufo Consulenze', 'O', 'Consigli saggi, anche di notte', 'Wise advice, even at night'],
  ['Byte Bradipo', 'O', 'Lenti ma sicuri', 'Slow but sure'],
  ['Orbita Telecom', 'O', 'Ti chiamiamo da lassù', 'Calling you from up there'],
  ['Polpo Pubblicità', 'O', 'Otto braccia di idee', 'Eight arms of ideas'],
  ['Faro Finanza', 'O', 'La luce sui tuoi conti', 'A light on your accounts'],
  ['Quokka Quotidiano', 'O', 'Le notizie col sorriso', 'News with a smile'],
  ['Lince Legale', 'O', 'Vediamo ogni cavillo', 'We spot every loophole'],
  ['Zebra Viaggi', 'O', 'Viaggi a strisce', 'Trips in stripes'],
  ['Cicogna Immobiliare', 'O', 'Ti portiamo la casa nuova', 'We deliver your new home'],
  ['Razzo Rete', 'O', 'Internet a reazione', 'Jet-powered internet'],
  ['Volpe Investimenti', 'O', 'Furbi coi tuoi soldi', 'Clever with your money'],
  ['Studio Tasso', 'O', 'Le tasse fatte bene', 'Taxes done right'],
  ['Mappamondo Media', 'O', 'Il mondo in uno schermo', 'The world on a screen'],
  ['Camaleonte Creativi', 'O', 'Cambiamo colore alle idee', 'We recolour ideas'],
  ['Ape Analisi', 'O', 'Numeri dolci come il miele', 'Numbers sweet as honey'],
  ['Gru Gruppo', 'O', 'Pensiamo in grande', 'Thinking tall'],
  ['Delfino Dati', 'O', 'Nuotiamo tra i numeri', 'Swimming in data'],
  ['Chiocciola Posta', 'O', 'Email che arrivano sempre', 'Emails that always arrive'],
  ['Bussola Broker', 'O', 'Sempre la direzione giusta', 'Always the right way'],
  ['Fenice Fondi', 'O', 'I tuoi soldi rinascono', 'Your money rises again'],
  ['Koala Cloud', 'O', 'I tuoi file appesi a un ramo', 'Your files hanging on a branch'],
  ['Lama Lingue', 'O', 'Traduzioni in tutte le lingue', 'Translations in every language'],
  ['Riccio Ricerca', 'O', 'Idee pungenti', 'Prickly ideas'],
  ['Struzzo Studio', 'O', 'Progetti a passo lungo', 'Long-stride projects'],
  ['Orso Assicura', 'O', 'Un abbraccio forte', 'A strong hug'],
  ['Canguro Credito', 'O', 'Prestiti che fanno un salto', 'Loans that jump'],
  ['Ghiro Giochi', 'O', 'Videogiochi da non dormire', 'Games that keep you up'],
  ['Talpa Tecnologie', 'O', 'Scaviamo nel futuro', 'Digging into the future'],
  ['Merlo Marketing', 'O', 'Fischiamo il tuo nome', 'We whistle your name'],
  ['Pellicano Prestiti', 'O', 'Un becco pieno di soldi', 'A beak full of money'],
  ['Aquila Avvocati', 'O', 'Dall\'alto vediamo tutto', 'We see it all from above'],
  ['Granchio Grafica', 'O', 'Disegni che pizzicano', 'Designs that pinch'],
  ['Tucano Turismo', 'O', 'Vacanze coloratissime', 'Very colourful holidays'],
  ['Narvalo Network', 'O', 'Connessi fino al polo', 'Connected to the pole'],
  ['Panda Paghe', 'O', 'Stipendi puntuali e morbidi', 'Wages on time and soft'],
  ['Cervo Certificati', 'O', 'Timbri a regola d\'arte', 'Stamps done properly'],
  // ----- industria (84-123) -----
  ['Acciaierie Alce', 'I', 'Acciaio con le corna', 'Steel with antlers'],
  ['Bulloni Bufalo', 'I', 'Stringono forte', 'They grip hard'],
  ['Cementi Cammello', 'I', 'Resistono anche nel deserto', 'They hold even in the desert'],
  ['Plastiche Platano', 'I', 'Leggere come foglie', 'Light as leaves'],
  ['Chimica Camomilla', 'I', 'Chimica tranquilla', 'Calm chemistry'],
  ['Motori Mammut', 'I', 'Potenza preistorica', 'Prehistoric power'],
  ['Legnami Lupo', 'I', 'Tavole robuste dal bosco', 'Sturdy boards from the forest'],
  ['Cartiera Cervo', 'I', 'Carta per ogni idea', 'Paper for every idea'],
  ['Vetri Vespa', 'I', 'Trasparenti e pungenti', 'Clear and sharp'],
  ['Tessiture Tigre', 'I', 'Tessuti a strisce e non', 'Fabrics, striped or not'],
  ['Elettronica Elica', 'I', 'Circuiti che girano', 'Circuits that spin'],
  ['Conserve Coccinella', 'I', 'Il pomodoro a puntini', 'Spotted tomatoes'],
  ['Birrificio Bue', 'I', 'Birra con calma', 'Beer, slowly'],
  ['Mulino Marmotta', 'I', 'Farina dopo il letargo', 'Flour after hibernation'],
  ['Pasta Paperotto', 'I', 'Cuoce in un quack', 'Cooked in a quack'],
  ['Gomme Gazzella', 'I', 'Gomme che corrono', 'Tyres that run'],
  ['Vernici Variopinte', 'I', 'Tutti i colori del mondo', 'All the world\'s colours'],
  ['Robot Rinoceronte', 'I', 'Robot che non si fermano', 'Robots that never stop'],
  ['Imballaggi Istrice', 'I', 'Scatole che proteggono', 'Boxes that protect'],
  ['Frigo Foca', 'I', 'Freddi per natura', 'Cold by nature'],
  ['Camion Cicala', 'I', 'Consegne che cantano', 'Deliveries that sing'],
  ['Pellicano Pacchi', 'I', 'Il tuo pacco nel becco', 'Your parcel in our beak'],
  ['Mattoni Mulo', 'I', 'Testardi e solidi', 'Stubborn and solid'],
  ['Batterie Bombo', 'I', 'Ronzano di energia', 'Buzzing with energy'],
  ['Cavi Cobra', 'I', 'Lunghi e flessibili', 'Long and flexible'],
  ['Saponi Salamandra', 'I', 'Bolle sempre fresche', 'Always fresh bubbles'],
  ['Biscotti Bassotto', 'I', 'Lunghi e croccanti', 'Long and crunchy'],
  ['Giocattoli Giraffa', 'I', 'Fatti per crescere', 'Made to grow'],
  ['Ricambi Ramarro', 'I', 'Il pezzo che manca', 'The missing part'],
  ['Latte Lontra', 'I', 'Fresco dal fiume', 'Fresh from the river'],
  ['Turbine Tonno', 'I', 'Girano a tutto mare', 'Spinning full sea'],
  ['Aerei Airone', 'I', 'Ali leggere', 'Light wings'],
  ['Bici Bruco', 'I', 'Pedala e diventa farfalla', 'Pedal and turn into a butterfly'],
  ['Pneumatici Pitone', 'I', 'Stringono la strada', 'They hug the road'],
  ['Tubi Tapiro', 'I', 'Tubi per ogni nasone', 'Pipes for every nose'],
  ['Fonderia Formica', 'I', 'Piccoli ma fortissimi', 'Small but mighty'],
  ['Distilleria Donnola', 'I', 'Gocce agili', 'Nimble drops'],
  ['Ottoni Opossum', 'I', 'Brillano anche di notte', 'Shining at night too'],
  ['Pannelli Pavone', 'I', 'Pannelli a ventaglio', 'Fan-shaped panels'],
  ['Isolanti Iguana', 'I', 'Caldo dentro, freddo fuori', 'Warm inside, cold outside'],
];
const BR_BY = { C: [], O: [], I: [] }; BRANDS.forEach((b, i) => BR_BY[b[1]].push(i));
const BR_COL = ['#d6332b', '#1f6fd1', '#1e9a52', '#f0b21a', '#7d3fc4', '#0f9a92', '#ef6c1a', '#263a52', '#e2457f', '#5a8a1e', '#b8202a', '#2b2b2b', '#0a7bbf', '#9a5a1a', '#c2185b', '#3a3ad0'];
const BR_COLS = 8, BR_ROWS = 16, BR_W = 256, BR_H = 128; // tavolozza: 8 x 16 = 128 loghi (ne usiamo 124)

// ---------- loghi disegnati dal gioco (forme semplici, tutti inventati) ----------
function brStyle(i) { const r = mulberry32(i * 7717 + 11); const bg = BR_COL[Math.floor(r() * BR_COL.length)]; let ac = BR_COL[Math.floor(r() * BR_COL.length)]; if (ac === bg) ac = '#ffffff'; return { bg, ac, sh: Math.floor(r() * 8), light: r() < 0.3 }; }
function brDrawLogo(g, i, x, y) {
  const [nm] = BRANDS[i], st = brStyle(i), W = BR_W, Hh = BR_H, words = nm.split(' ');
  const bg = st.light ? '#f6f3ea' : st.bg, fg = st.light ? st.bg : '#ffffff', em = st.light ? st.bg : st.ac === st.bg ? '#ffffff' : st.ac;
  g.save(); g.translate(x, y);
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  g.fillStyle = fg; g.fillRect(0, Hh - 8, W, 8); // riga sotto
  // emblema a sinistra
  const cx = 62, cy = 60, R = 44; g.fillStyle = em; g.strokeStyle = em; g.lineWidth = 7; g.beginPath();
  switch (st.sh) {
    case 0: g.arc(cx, cy, R, 0, Math.PI * 2); g.fill(); break; // tondo
    case 1: g.moveTo(cx, cy - R); g.lineTo(cx + R, cy); g.lineTo(cx, cy + R); g.lineTo(cx - R, cy); g.closePath(); g.fill(); break; // rombo
    case 2: for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k & 1 ? R * 0.45 : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); break; // stella
    case 3: g.arc(cx, cy, R * 0.55, 0, Math.PI * 2); g.fill(); g.beginPath(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.moveTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.stroke(); break; // sole
    case 4: for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - R, cy - 24 + k * 22); for (let t = 0; t <= 20; t++) g.lineTo(cx - R + t * R / 10, cy - 24 + k * 22 + Math.sin(t * 0.63) * 7); g.stroke(); } break; // onde
    case 5: g.moveTo(cx, cy - R); g.lineTo(cx + R, cy + R * 0.8); g.lineTo(cx - R, cy + R * 0.8); g.closePath(); g.fill(); break; // triangolo
    case 6: g.lineWidth = 12; g.moveTo(cx - R, cy - 6); g.lineTo(cx, cy - R + 6); g.lineTo(cx + R, cy - 6); g.moveTo(cx - R, cy + 26); g.lineTo(cx, cy - 10); g.lineTo(cx + R, cy + 26); g.stroke(); break; // frecce
    default: { const s = R * 1.6; const r0 = 16; g.moveTo(cx - s / 2 + r0, cy - s / 2); g.arcTo(cx + s / 2, cy - s / 2, cx + s / 2, cy + s / 2, r0); g.arcTo(cx + s / 2, cy + s / 2, cx - s / 2, cy + s / 2, r0); g.arcTo(cx - s / 2, cy + s / 2, cx - s / 2, cy - s / 2, r0); g.arcTo(cx - s / 2, cy - s / 2, cx + s / 2, cy - s / 2, r0); g.fill(); } // quadrato tondo
  }
  // iniziale dentro l'emblema
  const filled = st.sh !== 4 && st.sh !== 6; g.fillStyle = filled ? bg : fg;
  g.font = 'bold 46px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (filled) g.fillText(words[words.length - 1][0].toUpperCase(), cx, cy + (st.sh === 5 ? 12 : 2));
  // nome a destra su 1 o 2 righe
  g.fillStyle = fg; g.textAlign = 'left';
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [nm];
  for (let k = 0; k < lines.length; k++) {
    const t = k === lines.length - 1 && lines.length > 1 ? lines[k].toUpperCase() : lines[k];
    let fs = lines.length > 1 ? (k ? 40 : 28) : 40; g.font = `bold ${fs}px Arial, Helvetica, sans-serif`;
    while (g.measureText(t).width > W - 126 && fs > 12) { fs -= 2; g.font = `bold ${fs}px Arial, Helvetica, sans-serif`; }
    g.fillText(t, 116, lines.length > 1 ? (k ? 78 : 38) : 60);
  }
  g.restore();
}
const BR_ATLAS = (() => {
  const c = document.createElement('canvas'); c.width = BR_COLS * BR_W; c.height = BR_ROWS * BR_H; const g = c.getContext('2d');
  g.fillStyle = '#444'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < BRANDS.length && i < BR_COLS * BR_ROWS; i++) brDrawLogo(g, i, (i % BR_COLS) * BR_W, Math.floor(i / BR_COLS) * BR_H);
  return c;
})();
const brTex = new THREE.CanvasTexture(BR_ATLAS); brTex.anisotropy = 4;
const brImgCache = {};
function brImg(i) { // piccolo logo per i pannelli
  if (brImgCache[i]) return brImgCache[i];
  const c = document.createElement('canvas'); c.width = BR_W / 2; c.height = BR_H / 2;
  c.getContext('2d').drawImage(BR_ATLAS, (i % BR_COLS) * BR_W, Math.floor(i / BR_COLS) * BR_H, BR_W, BR_H, 0, 0, BR_W / 2, BR_H / 2);
  return (brImgCache[i] = c.toDataURL());
}

// ---------- insegne: un solo pezzo per tutti i loghi (il numero del logo viaggia nel colore) ----------
const brMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: brTex });
brMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, bldU);
  sh.fragmentShader = 'uniform float uNight;\n' + sh.fragmentShader
    .replace('#include <map_fragment>', `float bi = floor(vColor.r * 255.0 + 0.5) * 256.0 + floor(vColor.g * 255.0 + 0.5);
      float isLogo = (abs(vColor.b * 255.0 - 165.0) < 0.6 && bi < ${BR_COLS * BR_ROWS}.0) ? 1.0 : 0.0;
      vec4 texelColor = vec4(vColor * 0.7, 1.0);
      if (isLogo > 0.5) { vec2 cell = vec2(mod(bi, ${BR_COLS}.0), ${BR_ROWS - 1}.0 - floor(bi / ${BR_COLS}.0)); texelColor = texture2D(map, (cell + 0.015 + vUv * 0.97) / vec2(${BR_COLS}.0, ${BR_ROWS}.0)); }
      diffuseColor *= texelColor;`)
    .replace('#include <color_fragment>', '')
    .replace('#include <envmap_fragment>', '#include <envmap_fragment>\n outgoingLight += diffuseColor.rgb * uNight * isLogo * 0.85;');
};
const brGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY(Math.PI); // guarda verso la strada
POOLS.brand = new InstPool(brGeo, brMat, 30000);
function brShadows() { POOLS.brand.mesh.castShadow = false; POOLS.brand.mesh.receiveShadow = false; } // insegne piatte: niente ombre (eviterebbero righe strane)
brShadows();
{ const _as = applySettings; applySettings = function () { _as(); brShadows(); }; }
const brHex = i => ((i >> 8) << 16) | ((i & 255) << 8) | 165;

// ---------- quale marchio ha ogni edificio ----------
function brKind(b) {
  const z = ZT[b.zone]; if (!z || b.spec || !b.jobs) return null;
  return z.k === 'M' ? 'C' : BR_BY[z.k] ? z.k : null;
}
function brandOf(b) {
  const k = brKind(b); if (!k) return -1;
  const p = S && S.brand && S.brand.pick ? S.brand.pick[b.id] : undefined;
  if (p != null && BRANDS[p]) return p;
  const l = BR_BY[k]; return l[Math.floor(mulberry32(b.id * 977 + 3)() * l.length)];
}
const brOn = () => !(S && S.brand && S.brand.off);

// insegna sulla facciata del pezzo più grande dell'edificio (vale per tutte le forme, anche gli stili e i palazzi futuristici)
// se davanti ci sono tende, insegne o balconi, l'insegna sale finché trova la facciata libera
const BR_MASS = new Set(['body', 'plain', 'stb', 'stp', 'stg', 'cyl', 'stc', 'pfb', 'pfg', 'pfcw', 'pfcg', 'pfp']); // pezzi che possono essere la facciata
function brSign(b) {
  const i = brandOf(b); if (i < 0) return;
  const fx = Math.sin(b.ang), fz = Math.cos(b.ang), rx = Math.cos(b.ang), rz = -Math.sin(b.ang);
  const box = h => { // pezzo nel sistema dell'edificio: a = di lato, d = verso il fondo del lotto (la strada è verso d negativo)
    const [x, y, z, yw, sx, sy, sz] = h.geo, dx = x - b.x, dz = z - b.z, t = yw - b.ang, c = Math.abs(Math.cos(t)), sn = Math.abs(Math.sin(t));
    return { a: dx * rx + dz * rz, d: dx * fx + dz * fz, y0: y - b.y, y1: y - b.y + sy, ha: (c * sx + sn * sz) / 2, hd: (c * sz + sn * sx) / 2, v: sx * sy * sz };
  };
  let best = null;
  const all = [];
  for (const h of b.parts) {
    if (!h.geo || h.pool === 'brand') continue;
    const q = box(h); all.push(q);
    if (BR_MASS.has(h.pool) && q.y1 - q.y0 >= 2.5 && (!best || q.v > best.v)) best = q;
  }
  if (!best) return;
  const top = best.y1, fw = best.ha * 2, mixed = ZT[b.zone].k === 'M';
  let sw, sh, y0;
  if (mixed) { sw = clamp(fw * 0.35, 2, 5); sh = sw / 2; y0 = 2.7; }
  else if (top < 5.4) { sw = clamp(fw * 0.5, 2, 7); sh = sw / 2; y0 = top; } // casetta bassa: insegna in piedi sul tetto
  else if (top < 14) { sw = clamp(Math.min(fw * 0.6, (top - 3.4) * 2), 2, 10); sh = sw / 2; y0 = Math.max(3.3, top - sh - 0.4); }
  else { sw = clamp(fw * 0.6, 3, 18); sh = sw / 2; y0 = top - sh - 1.2; }
  const face = best.d - best.hd; // facciata del pezzo grande
  const frontAt = yy => { let f = face; for (const q of all) if (Math.abs(q.a - best.a) < q.ha + sw / 2 && q.y1 > yy + 0.02 && q.y0 < yy + sh - 0.02 && q.d + q.hd > face - 0.3 && q.d - q.hd > face - 3) f = Math.min(f, q.d - q.hd); return f; };
  let f = frontAt(y0);
  if (face - f > 0.5 && y0 < top) { // qualcosa sporge davanti: cerco più in alto una facciata libera
    for (let yy = y0 + 0.5; yy <= top - sh - 0.2; yy += 0.5) { const g = frontAt(yy); if (face - g <= 0.5) { y0 = yy; f = g; break; } }
  }
  const dd = f - 0.07, prev = curRef; curRef = b;
  addPart(b.parts, 'brand', b.x + fx * dd + rx * best.a, b.y + y0, b.z + fz * dd + rz * best.a, b.ang, sw, sh, 1, brHex(i));
  if (y0 >= top - 0.01) addPart(b.parts, 'plain', b.x + fx * (dd + 0.15) + rx * best.a, b.y + top, b.z + fz * (dd + 0.15) + rz * best.a, b.ang, sw * 0.9, sh * 0.35, 0.2, 0x55585c); // sostegno
  curRef = prev;
}
{
  const _db = drawBuilding;
  drawBuilding = function (b) {
    _db(b);
    if (b.ruin || b.cons > 0 || !brOn()) return;
    try { brSign(b); } catch (e) { console.warn('marchio', e); }
    if (b.aband) tintParts(b, 0x5a524a);
  };
}
function brRedrawAll() { for (const b of buildings.values()) if (brKind(b)) { drawBuilding(b); if (b.aband) tintParts(b, 0x5a524a); } }

// ---------- scheda dell'edificio ----------
{
  const _ch = companyHTML;
  companyHTML = function (b) {
    const i = brandOf(b); if (i < 0) return _ch(b);
    const [nm, k, mi, me] = BRANDS[i], sec = { C: L('Negozio', 'Shop'), O: L('Uffici', 'Offices'), I: L('Industria', 'Industry') }[k];
    const prod = k === 'I' ? chainName(CHAIN[Math.floor(mulberry32(b.id * 71 + 5)() * CHAIN.length)][0]) : '';
    return `<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><img src="${brImg(i)}" style="width:96px;height:48px;border-radius:4px;flex:none" alt=""><div><b>${nm}</b><div style="font-size:12px;color:var(--mute)">“${L(mi, me)}”</div><div style="font-size:12px;color:var(--mute)">${sec}${prod ? ' · ' + prod : ''}</div></div></div>` +
      `<div style="display:flex;gap:4px;flex-wrap:wrap"><button onclick="brChange(${b.id},1)">🔄 ${L('Cambia marchio', 'Change brand')}</button><button onclick="brTab='${k}';openSide('brands')">🏷️ ${L('Tutti i marchi', 'All brands')}</button></div>`;
  };
}
function brSet(id, i) {
  const b = buildings.get(id); if (!b || !BRANDS[i]) return;
  S.brand = S.brand || {}; S.brand.pick = S.brand.pick || {}; S.brand.pick[id] = i;
  drawBuilding(b); if (b.aband) tintParts(b, 0x5a524a); refreshPanels();
}
function brChange(id, dir) {
  const b = buildings.get(id), k = b && brKind(b); if (!k) return;
  const l = BR_BY[k], cur = l.indexOf(brandOf(b)); brSet(id, l[(cur + dir + l.length) % l.length]);
}
function brToggle() { S.brand = S.brand || {}; S.brand.off = !S.brand.off; brRedrawAll(); refreshPanels(); }

// ---------- pannello 🏷️ Marchi ----------
let brTab = 'C';
function brandsHTML() {
  const cnt = {}; for (const b of buildings.values()) { const i = brandOf(b); if (i >= 0) cnt[i] = (cnt[i] || 0) + 1; }
  const sb = selected && selected.kind === 'bld' && buildings.has(selected.obj.id) ? selected.obj : null, sk = sb && brKind(sb);
  let h = `<h3>🏷️ ${L('Marchi', 'Brands')}<button class="x" onclick="closeSide()">✕</button></h3>`;
  h += `<div style="font-size:12px;color:var(--mute)">${L('124 marchi inventati per negozi, uffici e fabbriche: le insegne sono sulle facciate e di notte si accendono.', '124 made-up brands for shops, offices and factories: signs on the façades that light up at night.')}</div>`;
  h += `<div class="row"><span>${L('Insegne sui palazzi', 'Signs on buildings')}</span><button onclick="brToggle()">${brOn() ? L('✅ Sì', '✅ On') : L('⬜ No', '⬜ Off')}</button></div>`;
  if (sk) h += `<div style="font-size:12px;color:var(--acc2);margin:4px 0">${L('Clicca un marchio per metterlo su', 'Click a brand to put it on')} <b>${bldName(sb)}</b></div>`;
  h += `<div style="display:flex;gap:4px;margin:6px 0">` + [['C', L('🛍️ Negozi', '🛍️ Shops')], ['O', L('🏢 Uffici', '🏢 Offices')], ['I', L('🏭 Industria', '🏭 Industry')]].map(([k, n]) => `<button class="${brTab === k ? 'on' : ''}" onclick="brTab='${k}';refreshPanels()">${n}</button>`).join('') + `</div>`;
  for (const i of BR_BY[brTab]) {
    const can = sk === brTab, on = sb && brandOf(sb) === i;
    h += `<div class="row" style="align-items:center;${can ? 'cursor:pointer;' : ''}${on ? 'background:rgba(120,180,255,.15);' : ''}" ${can ? `onclick="brSet(${sb.id},${i})"` : ''}><span style="display:flex;gap:6px;align-items:center"><img src="${brImg(i)}" style="width:64px;height:32px;border-radius:3px" alt=""><span><b>${BRANDS[i][0]}</b><br><span style="font-size:11px;color:var(--mute)">${L(BRANDS[i][2], BRANDS[i][3])}</span></span></span><span>${cnt[i] || 0}</span></div>`;
  }
  return h;
}
{
  const _bt = buildToolbar;
  buildToolbar = function () {
    _bt();
    const r = $('right'); if (!r || r.querySelector('#brandbtn')) return;
    const b = document.createElement('button'); b.id = 'brandbtn'; b.title = L('Marchi', 'Brands'); b.textContent = '🏷️'; b.onclick = () => { const sb = selected && selected.kind === 'bld' ? selected.obj : null, k = sb && brKind(sb); if (k) brTab = k; openSide('brands'); };
    r.insertBefore(b, [...r.children].pop());
  };
  const _rp = refreshPanels;
  refreshPanels = function () {
    if (sideOpen === 'brands') { $('side').innerHTML = brandsHTML(); return; }
    _rp();
  };
}
