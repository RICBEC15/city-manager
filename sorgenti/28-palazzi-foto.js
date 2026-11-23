// =====================================================================
//  Palazzi delle foto (23 nov 2026): 21 palazzi nuovi, forme ispirate alle 5 foto
//  di città mandate da Riccardo (originali: niente marchi né scritte vere).
//  - crescono da soli in 3 zone nuove: 15 residenziale futuristica, 16 commerciale al neon,
//    17 uffici futuristici (si comportano come le zone ad alta densità 3, 6 e 7)
//  - si possono costruire anche uno per uno dal menu 🏙️ Palazzi futuristici (come monumenti)
// =====================================================================
// ---------- forme e materiali nuovi (pochi poligoni, tutto con istanze) ----------
const pfCylGeo = (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12).toNonIndexed(); g.computeVertexNormals(); return g.translate(0, 0.5, 0); })(); // a facce piatte: le finestre restano dritte
const pfDiscGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 20).translate(0, 0.5, 0);
const pfConeGeo = new THREE.ConeGeometry(0.5, 1, 8).translate(0, 0.5, 0);
const pfPyrGeo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0); // base quadrata 1x1
const pfDomeGeo = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1); // mezza sfera alta 1
const pfCrownGeo = new THREE.IcosahedronGeometry(0.5, 0).translate(0, 0.5, 0); // chioma degli alberi sui tetti
// vetro: tante lastre sottili, riflesso del cielo di giorno, luci accese di notte
const pfGlassMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
pfGlassMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, bldU);
  sh.vertexShader = 'varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vec4 wq = modelMatrix * instanceMatrix * vec4(transformed,1.0); vWp = wq.xyz; vWn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);`);
  sh.fragmentShader = 'uniform float uNight; varying vec3 vWp; varying vec3 vWn;\n float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n' +
    sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float gl = 0.0; float lit = 0.0; vec3 sky = vec3(0.0);
      if (abs(vWn.y) < 0.5) {
        vec2 t = normalize(vec2(-vWn.z, vWn.x));
        float u = dot(vWp.xz, t);
        vec2 cc = vec2(fract(u/1.9), fract(vWp.y/3.3));
        gl = step(0.07,cc.x)*step(cc.x,0.93)*step(0.1,cc.y)*step(cc.y,0.93);
        float r = hsh(vec2(floor(u/1.9), floor(vWp.y/3.3)) + floor(vWp.xz/61.0));
        lit = gl * step(r, 0.38) * uNight;
        sky = mix(vec3(0.45,0.6,0.78), vec3(0.86,0.91,0.97), clamp(fract(vWp.y/140.0 + u/230.0)*1.2, 0.0, 1.0));
        diffuseColor.rgb = mix(diffuseColor.rgb*0.85, diffuseColor.rgb*0.72 + sky*0.16*(1.0-uNight*0.9), gl);
      }`).replace('#include <envmap_fragment>', '#include <envmap_fragment>\n outgoingLight += sky*gl*0.1*(1.0-uNight) + vec3(0.8,0.9,1.0)*lit*0.85;');
};
const pfNeonMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // insegne e maxischermi: brillano sempre
const pfDomeMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, shininess: 90, specular: 0x8899aa, depthWrite: false });
Object.assign(POOLS, {
  pfb: new InstPool(boxGeo, bldMat, 24000), pfg: new InstPool(boxGeo, pfGlassMat, 20000),
  pfcw: new InstPool(pfCylGeo, bldMat, 6000), pfcg: new InstPool(pfCylGeo, pfGlassMat, 8000),
  pfp: new InstPool(boxGeo, plainMat, 30000), pfc: new InstPool(pfDiscGeo, plainMat, 20000),
  pfk: new InstPool(pfConeGeo, plainMat, 6000), pfy: new InstPool(pfPyrGeo, plainMat, 2000),
  pfd: new InstPool(pfDomeGeo, pfDomeMat, 2000), pft: new InstPool(pfCrownGeo, plainMat, 14000),
  pfn: new InstPool(boxGeo, pfNeonMat, 20000), pfnc: new InstPool(pfDiscGeo, pfNeonMat, 8000),
});
function pfShadows() { const on = !!SET.shadows && AQ.lv < 2; for (const k in POOLS) if (k.startsWith('pf')) { POOLS[k].mesh.castShadow = on && k !== 'pfd' && k !== 'pfn' && k !== 'pfnc'; POOLS[k].mesh.receiveShadow = on && k !== 'pfd'; } }
pfShadows();
{ const _as = applySettings; applySettings = function () { _as(); pfShadows(); for (const m of [pfGlassMat, pfNeonMat, pfDomeMat]) m.needsUpdate = true; }; }
// il clic sugli edifici deve vedere anche le forme nuove
pickAt = function (sx, sy, g) {
  _ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(_ndc, camera);
  const ps = Object.values(POOLS).filter(p => p.mesh.count > 0);
  const hits = ray.intersectObjects(ps.map(p => p.mesh), false);
  for (const h of hits) { const pool = ps.find(p => p.mesh === h.object); const own = pool?.owner[h.instanceId]; if (own?.ref) return own.ref.zone ? { kind: 'bld', obj: own.ref } : { kind: 'svc', obj: own.ref }; }
  if (!g) return null;
  const sv = svcAt(g.x, g.z); if (sv) return { kind: 'svc', obj: sv };
};

// ---------- colori ----------
const PFC = {
  neon: [0xff2bd6, 0x22e4ff, 0xff3a5c, 0x9a5bff, 0x2dffa0, 0xffb020, 0x3a7bff],
  dark: [0x2c2e3a, 0x34303f, 0x262b34, 0x3b3646, 0x2e3440],
  glass: [0x3f74a8, 0x4a86b8, 0x5a92c2, 0x36648e, 0x6aa2cc, 0x2f5f86],
  white: [0xf2f2ee, 0xeceff0, 0xf6f4ee],
  green: [0x4f9a3a, 0x3f8a35, 0x5fae45, 0x6ab04c],
  brick: [0x8a4a36, 0x9a5a40, 0x7a3e30, 0xa0624a],
  stone: [0xb8b0a0, 0xa8a298, 0xc8c0b0, 0x9a98a8],
};
const pfPick = (r, a) => a[Math.floor(r() * a.length)];
const pfTree = (B, r, a, b, y0, s) => B('pft', a, b, s, s * (1.05 + r() * 0.3), s, pfPick(r, PFC.green), y0);
const pfTrees = (B, r, n, rad, y0, s) => { const o = r() * 6.28; for (let i = 0; i < n; i++) { const t = o + i / n * Math.PI * 2; pfTree(B, r, Math.sin(t) * rad, Math.cos(t) * rad, y0, s); } };
// B(forma, a, b, larghezza, altezza, profondità, colore, y0, rotazione): a = di lato, b = verso il fondo del lotto (b negativo = verso la strada)
function pfAdder(P, x0, z0, y, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return (pool, a, b, w, h, d, c, y0 = 0, rot = 0) => addPart(P, pool, x0 + fx * b + rx * a, y + y0, z0 + fz * b + rz * a, yaw + rot, w, h, d, c);
}

// ---------- i 21 palazzi: k = zona dove crescono, fw/fd/h = misure quando si costruiscono dal menu ----------
const PF = {
  // ===== residenziali (zona "Case del futuro") =====
  verdi: { k: 'R', fw: 28, fd: 40, h: 120, n: () => L('Torre bianca dei giardini', 'White garden tower'), d: () => L('Torre ovale bianca con balconi pieni di piante a ogni piano', 'White oval tower with plant-filled balconies on every floor'),
    draw(B, W, D, H, r) {
      const w = Math.min(W * 0.9, 24), d = Math.min(D * 0.72, 36), wc = pfPick(r, PFC.white);
      B('pfc', 0, 0, w * 1.15, 4, d * 1.1, wc);
      B('pfcw', 0, 0, w, H, d, wc);
      const st = Math.max(9.9, H / 12);
      for (let y = st; y < H - 3; y += st) { B('pfc', 0, 0, w * 1.1, 0.8, d * 1.08, 0xf8f8f4, y); B('pfc', 0, 0, w * 1.08, 1.1, d * 1.06, pfPick(r, PFC.green), y + 0.8); }
      for (const s of [-1, 1]) B('pfp', 0, s * d * 0.5, 1.4, H + 3, 1.4, 0xffffff);
      B('pfc', 0, 0, w * 0.92, 0.8, d * 0.92, pfPick(r, PFC.green), H);
      pfTrees(B, r, 4, Math.min(w, d) * 0.25, H + 0.8, 3.2);
    } },
  ovale: { k: 'R', fw: 28, fd: 40, h: 110, n: () => L('Torre ovale di vetro', 'Glass oval tower'), d: () => L('Vetro azzurro con costole bianche e fasce di piante', 'Blue glass with white ribs and bands of plants'),
    draw(B, W, D, H, r) {
      const w = Math.min(W * 0.88, 24), d = Math.min(D * 0.7, 34), wc = pfPick(r, PFC.white);
      B('pfcg', 0, 0, w, H, d, pfPick(r, [0x7fa6c0, 0x8fb4cc, 0x6f98b4]));
      B('pfc', 0, 0, w * 1.05, 3.5, d * 1.05, wc);
      B('pfc', 0, 0, w * 1.07, 3, d * 1.07, wc, H - 3);
      for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2; B('pfp', Math.sin(t) * w * 0.5, Math.cos(t) * d * 0.5, 1.3, H, 1.3, wc); }
      const st = Math.max(13.2, H / 7);
      for (let y = st; y < H - 6; y += st) B('pfc', 0, 0, w * 1.04, 1, d * 1.04, pfPick(r, PFC.green), y);
      B('pfc', 0, 0, w * 0.6, 4, d * 0.6, wc, H);
    } },
  gemelle: { k: 'R', fw: 26, fd: 56, h: 120, n: () => L('Torri gemelle col ponte giardino', 'Twin towers with sky garden bridge'), d: () => L('Due torri bianche unite in alto da un ponte con gli alberi', 'Two white towers joined high up by a bridge with trees'),
    draw(B, W, D, H, r) {
      const tw = Math.min(W * 0.85, 20), td = Math.min(D * 0.34, 16), wc = pfPick(r, PFC.white), g = D * 0.27, h2 = H * 0.82;
      for (const [b, h] of [[-g, H], [g, h2]]) {
        B('pfcw', 0, b, tw, h, td, wc);
        const st = Math.max(9.9, h / 10);
        for (let y = st; y < h - 3; y += st) B('pfc', 0, b, tw * 1.08, 1, td * 1.1, pfPick(r, PFC.green), y);
        B('pfc', 0, b, tw * 0.9, 0.8, td * 0.9, pfPick(r, PFC.green), h);
        pfTree(B, r, 0, b, h + 0.8, 3);
      }
      const yb = h2 * 0.62, L0 = 2 * g;
      B('pfp', 0, 0, tw * 0.8, 2.6, L0, wc, yb);
      B('pfp', 0, 0, tw * 0.72, 0.6, L0 - td * 0.6, pfPick(r, PFC.green), yb + 2.6);
      for (let i = -1; i <= 1; i++) pfTree(B, r, (r() - 0.5) * tw * 0.3, i * L0 * 0.2, yb + 3.2, 3.4);
      B('pfp', 0, 0, tw * 0.5, 2, L0, wc, yb * 0.42);
    } },
  balconi: { k: 'R', fw: 32, fd: 32, h: 100, n: () => L('Torre rotonda dei balconi verdi', 'Round tower with green balconies'), d: () => L('Balconi rotondi uno sopra l\'altro, con piante e luci calde', 'Round balconies stacked up, with plants and warm lights'),
    draw(B, W, D, H, r) {
      const s = Math.min(W, D, 30) * 0.92;
      B('pfcg', 0, 0, s * 0.78, H, s * 0.78, pfPick(r, [0x8fb0c4, 0x9ab8cc]));
      const st = Math.max(6.6, H / 12);
      for (let y = st; y < H; y += st) { B('pfc', 0, 0, s, 0.6, s, 0xf2f2ee, y - 0.6); B('pfc', 0, 0, s * 0.95, 0.9, s * 0.95, pfPick(r, PFC.green), y); B('pfnc', 0, 0, s * 1.005, 0.25, s * 1.005, 0xffd08a, y - 0.85); }
      B('pfc', 0, 0, s * 1.02, 1.2, s * 1.02, 0xf2f2ee, H);
      B('pfc', 0, 0, s * 0.4, 5, s * 0.4, 0xf2f2ee, H + 1.2);
    } },
  fasce: { k: 'R', fw: 28, fd: 36, h: 90, n: () => L('Torre a fasce bianche', 'White band tower'), d: () => L('Vetro scuro e balconi bianchi lunghi tutto il piano, come sul mare', 'Dark glass and full-length white balconies, seaside style'),
    draw(B, W, D, H, r) {
      const w = W * 0.86, d = Math.min(D * 0.7, 32), wc = pfPick(r, PFC.white);
      B('pfg', 0, 0, w * 0.94, H, d * 0.94, pfPick(r, [0x4e6a7e, 0x5a7488, 0x46627a]));
      const n = Math.max(1, Math.min(16, Math.floor(H / 6.6))), st = H / n;
      for (let i = 1; i <= n; i++) B('pfp', 0, 0, w, 0.7, d, wc, i * st - 0.7);
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) B('pfp', sa * w * 0.47, sb * d * 0.47, 1.2, H, 1.2, wc);
      B('pfp', 0, 0, w * 0.45, 3.5, d * 0.45, 0xd8d8d8, H);
    } },
  passerelle: { k: 'R', fw: 24, fd: 32, h: 50, n: () => L('Palazzo delle scale di ferro', 'Iron stairs block'), d: () => L('Palazzo scuro con balconi di ferro e piccole insegne al neon', 'Dark block with iron balconies and small neon signs'),
    draw(B, W, D, H, r) {
      const w = W * 0.9, d = D * 0.8, f = -d / 2;
      B('pfb', 0, 0, w, H, d, pfPick(r, [0x4a4038, 0x3a3a44, 0x524a44, 0x40384a]));
      const n = Math.max(1, Math.min(14, Math.floor(H / 6.6)));
      for (let i = 1; i <= n; i++) B('pfp', -w * 0.22, f - 0.8, w * 0.42, 0.3, 1.6, 0x24242a, i * 6.6 - 3.3);
      B('pfp', -w * 0.02, f - 0.8, 0.3, n * 6.6 - 3, 0.3, 0x24242a);
      B('pfn', 0, f - 0.3, w * 0.9, 1.1, 0.3, pfPick(r, PFC.neon), 4);
      B('pfn', w * 0.3, f - 1.4, 0.5, Math.min(12, H * 0.3), 2.4, pfPick(r, PFC.neon), 6);
      B('pfn', w * 0.5 + 0.3, -d * 0.1, 0.3, 3, 4, pfPick(r, PFC.neon), H * 0.5);
      B('pfc', w * 0.25, d * 0.2, 4.5, 5, 4.5, 0x5a4a3a, H);
      B('pfp', -w * 0.2, 0, 3.5, 1.6, 2.5, 0x777777, H);
    } },
  mattoni: { k: 'R', fw: 24, fd: 30, h: 40, maxH: 46, n: () => L('Palazzo di mattoni', 'Brick building'), d: () => L('Mattoni rossi, cornicione di pietra e serbatoio dell\'acqua sul tetto', 'Red brick, stone cornice and a water tank on the roof'),
    draw(B, W, D, H, r) {
      const w = W * 0.92, d = D * 0.84, c = pfPick(r, PFC.brick);
      B('pfb', 0, 0, w, H, d, c);
      B('pfp', 0, 0, w * 1.01, 4.2, d * 1.01, 0xb8ab94);
      B('pfp', 0, 0, w * 1.04, 1.2, d * 1.04, 0xd8ccb4, H - 1.2);
      const a = w * 0.22, b = d * 0.18;
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) B('pfp', a + sa * 1.6, b + sb * 1.6, 0.35, 3, 0.35, 0x3a3a3a, H);
      B('pfc', a, b, 4.6, 5, 4.6, 0x8a6a4a, H + 3);
      B('pfk', a, b, 5, 2.2, 5, 0x5a4a3a, H + 8);
    } },
  // ===== commerciali (zona "Neon") =====
  cilindro: { k: 'C', fw: 36, fd: 36, h: 110, n: () => L('Torre rotonda dei maxischermi', 'Round big-screen tower'), d: () => L('Torre a cilindro con schermi giganti e anelli di luce', 'Cylinder tower with giant screens and rings of light'),
    draw(B, W, D, H, r) {
      const s = Math.min(W, D, 34) * 0.92;
      B('pfb', 0, 0, W * 0.96, 6, D * 0.9, 0x2a2630);
      B('pfn', 0, -D * 0.45 - 0.2, W * 0.8, 1.2, 0.3, pfPick(r, PFC.neon), 4.4);
      B('pfcw', 0, 0, s, H, s, pfPick(r, [0x3a3440, 0x342f3a, 0x2e3038]));
      const sh = Math.min(H * 0.3, 36), sy = H * 0.42;
      for (const t of [Math.PI - 0.55, Math.PI + 0.55, 0.3]) B('pfn', Math.sin(t) * (s / 2 + 0.3), Math.cos(t) * (s / 2 + 0.3), s * 0.42, sh, 0.4, pfPick(r, PFC.neon), sy, t);
      B('pfnc', 0, 0, s * 1.03, 0.7, s * 1.03, 0xffb040, sy - 2);
      B('pfnc', 0, 0, s * 1.03, 0.7, s * 1.03, 0xffb040, sy + sh + 1.3);
      B('pfc', 0, 0, s * 1.1, 2.6, s * 1.1, 0x22222a, H);
      B('pfnc', 0, 0, s * 0.72, 0.5, s * 0.72, 0x22e4ff, H + 2.6);
    } },
  schermo: { k: 'C', fw: 26, fd: 34, h: 90, n: () => L('Torre del maxischermo', 'Giant screen tower'), d: () => L('Grattacielo scuro con uno schermo enorme sulla facciata', 'Dark skyscraper with a huge screen on its front'),
    draw(B, W, D, H, r) {
      const w = W * 0.86, d = Math.min(D * 0.72, 32), f = -d / 2;
      B('pfb', 0, 0, w, H, d, pfPick(r, PFC.dark));
      const sh = Math.min(H * 0.34, 42), sy = Math.max(8, H * 0.5);
      B('pfp', 0, f - 0.15, w * 0.9, sh + 1.6, 0.3, 0x16161c, sy - 0.8);
      B('pfn', 0, f - 0.4, w * 0.84, sh, 0.3, pfPick(r, PFC.neon), sy);
      B('pfn', w / 2 + 0.3, d * 0.05, 0.3, H * 0.22, d * 0.6, pfPick(r, PFC.neon), H * 0.18);
      B('pfn', 0, f - 0.3, w * 0.95, 1, 0.3, 0xf0f0ff, 4);
      B('pfp', 0, 0, w * 0.55, 0.8, 0.8, 0x222222, H);
      B('pfn', 0, 0, w * 0.5, 3.2, 0.5, pfPick(r, PFC.neon), H + 0.8);
    } },
  neon: { k: 'C', fw: 24, fd: 30, h: 60, n: () => L('Palazzo delle insegne al neon', 'Neon sign building'), d: () => L('Insegne verticali, strisce di luce e una grande insegna rossa sul tetto', 'Vertical signs, light strips and a big red sign on the roof'),
    draw(B, W, D, H, r) {
      const w = W * 0.86, d = Math.min(D * 0.75, 32), f = -d / 2;
      B('pfb', 0, 0, w, H, d, pfPick(r, PFC.dark));
      const vh = Math.min(H * 0.45, 30);
      for (const s of [-1, 1]) B('pfn', s * (w / 2 - 1.2), f - 1.4, 0.5, vh, 2.6, pfPick(r, PFC.neon), 5 + r() * 4);
      for (let i = 0; i < 3; i++) B('pfn', 0, f - 0.2, w * 0.92, 0.45, 0.3, pfPick(r, PFC.neon), 3.6 + i * Math.max(3.3, H / 8));
      B('pfn', w / 2 + 0.4, f + 2.5, 0.5, 3.6, 3.6, 0xff3040, H * 0.72);
      B('pfp', 0, 0, w * 0.62, 6.5, 0.5, 0x18181c, H);
      B('pfn', 0, -0.35, w * 0.56, 4.6, 0.3, pfPick(r, [0xff2040, 0xff2bd6, 0x22e4ff]), H + 0.9);
      B('pfc', w * 0.3, d * 0.3, 0.5, 12, 0.5, 0x888888, H);
    } },
  padiglione: { k: 'C', fw: 44, fd: 44, h: 22, maxH: 26, n: () => L('Padiglione rotondo a terrazze', 'Round terraced pavilion'), d: () => L('Tre piani rotondi di vetro, ognuno con il suo giardino', 'Three round glass floors, each with its own garden'),
    draw(B, W, D, H, r) {
      const s0 = Math.min(W, D) * 0.96, th = Math.max(5, H / 3);
      for (let i = 0; i < 3; i++) {
        const s = s0 * (1 - i * 0.24), y = i * th;
        B('pfc', 0, 0, s, 0.9, s, 0xf2f2ee, y);
        B('pfcg', 0, 0, s * 0.94, th - 1.8, s * 0.94, 0x8fb8cc, y + 0.9);
        B('pfc', 0, 0, s * 1.02, 0.9, s * 1.02, 0xf2f2ee, y + th - 0.9);
        B('pfc', 0, 0, s * 0.99, 0.6, s * 0.99, pfPick(r, PFC.green), y + th);
        pfTrees(B, r, i === 2 ? 3 : 5, s * (i === 2 ? 0.25 : 0.44), y + th + 0.6, Math.min(2.8, s * 0.12));
      }
    } },
  cupola: { k: 'C', fw: 48, fd: 48, h: 26, maxH: 30, n: () => L('Cupola di vetro', 'Glass dome'), d: () => L('Una grande cupola trasparente con un giardino dentro', 'A big see-through dome with a garden inside'),
    draw(B, W, D, H, r) {
      const s = Math.min(W, D) * 0.96, dh = Math.min(s * 0.5, Math.max(8, H - 4)), b0 = -D / 2 + s / 2 + 0.4;
      B('pfc', 0, b0, s, 4, s, 0xf0f0ec);
      B('pfnc', 0, b0, s * 0.95, 0.4, s * 0.95, 0x22e4ff, 4);
      pfTrees(B, r, 4, s * 0.2, 4, Math.min(3.4, s * 0.12)); pfTree(B, r, 0, b0, 4, Math.min(4.5, s * 0.15));
      B('pfd', 0, b0, s * 0.92, dh, s * 0.92, 0xbfe0f0, 4);
      B('pfc', 0, b0, s * 0.12, 1.5, s * 0.12, 0xf0f0ec, 4 + dh - 0.5);
      const bb = -D / 2 + s + 1.5, Lb = D / 2 - bb; // dietro la cupola, se il lotto è lungo, una galleria di negozi
      if (Lb > 6) { B('pfb', 0, bb + Lb / 2, W * 0.9, 9, Lb, 0xe8ecef); B('pfn', 0, bb + 0.1, W * 0.7, 1, 0.3, pfPick(r, PFC.neon), 6.5); B('pfc', 0, bb + Lb / 2, Math.min(W, Lb) * 0.5, 0.6, Math.min(W, Lb) * 0.5, pfPick(r, PFC.green), 9); }
    } },
  piazzaluci: { k: 'C', fw: 28, fd: 34, h: 70, n: () => L('Palazzo dei mille schermi', 'Thousand screens building'), d: () => L('La parte bassa è coperta di schermi colorati, come una piazza di luci', 'The lower part is covered in colourful screens, like a square of lights'),
    draw(B, W, D, H, r) {
      const w = W * 0.9, d = Math.min(D * 0.8, 34), f = -d / 2, lim = Math.min(H * 0.62, 44);
      B('pfb', 0, 0, w, H, d, pfPick(r, PFC.dark));
      let y = 4.5, i = 0;
      while (y < lim - 2 && i < 6) { const sh = Math.min(4 + r() * 6, lim - y), sw = w * (0.5 + r() * 0.45), a = (r() - 0.5) * (w - sw); B('pfn', a, f - 0.3 - i * 0.06, sw, sh, 0.3, pfPick(r, PFC.neon), y); y += sh + 0.8; i++; }
      for (const s of [-1, 1]) B('pfn', s * (w / 2 + 0.3), f + d * 0.2, 0.3, Math.min(lim, 18), d * 0.35, pfPick(r, PFC.neon), 6);
      B('pfn', 0, f - 0.35, w * 0.98, 0.9, 0.3, 0xffffff, 3);
      B('pfp', 0, 0, w * 0.4, 4, d * 0.4, 0x555560, H);
    } },
  // ===== uffici (zona "Uffici del futuro") =====
  guglia: { k: 'O', fw: 32, fd: 40, h: 200, n: () => L('Grattacielo a guglia', 'Spire skyscraper'), d: () => L('Vetro azzurro che si stringe salendo e finisce con una punta', 'Blue glass that narrows as it rises, ending in a point'),
    draw(B, W, D, H, r) {
      const s = Math.min(W * 0.9, D * 0.62, 26), gc = pfPick(r, PFC.glass), h1 = H * 0.46, h2 = H * 0.3, h3 = H - h1 - h2;
      B('pfb', 0, 0, W * 0.95, 8, D * 0.9, 0xd8dde4);
      B('pfg', 0, 0, s, h1, s, gc);
      B('pfg', 0, 0, s * 0.78, h2, s * 0.78, gc, h1);
      B('pfg', 0, 0, s * 0.56, h3, s * 0.56, gc, h1 + h2);
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) B('pfp', sa * s / 2, sb * s / 2, 1.1, h1, 1.1, 0xe8eef4);
      B('pfnc', 0, 0, s * 0.6, 0.5, s * 0.6, 0x7ad8ff, H - 1.5);
      B('pfk', 0, 0, s * 0.56, H * 0.22, s * 0.56, 0xdfe8f0, H);
      B('pfc', 0, 0, 0.7, H * 0.14, 0.7, 0xd0d8e0, H * 1.2);
    } },
  guglie: { k: 'O', fw: 36, fd: 44, h: 180, n: () => L('Tre guglie unite', 'Three joined spires'), d: () => L('Tre torri sottili a punta, unite da un ponte di vetro', 'Three slim pointed towers joined by a glass bridge'),
    draw(B, W, D, H, r) {
      const s = Math.min(W * 0.42, D * 0.4, 15), gc = pfPick(r, PFC.glass);
      B('pfb', 0, 0, W * 0.95, 10, D * 0.9, 0xd0d8e0);
      for (const [a, b, h] of [[-s * 0.58, -D * 0.1, H], [s * 0.58, -D * 0.1, H * 0.8], [0, D * 0.26, H * 0.58]]) {
        B('pfg', a, b, s, h * 0.78, s, gc);
        B('pfg', a, b, s * 0.72, h * 0.22, s * 0.72, gc, h * 0.78, Math.PI / 4);
        B('pfk', a, b, s * 0.9, h * 0.24, s * 0.9, 0xe0e8f0, h);
        B('pfc', a, b, 0.5, h * 0.1, 0.5, 0xd8e0e8, h * 1.24);
      }
      B('pfp', 0, -D * 0.1, s * 1.3, 3, s * 0.5, 0xe8eef4, H * 0.5);
    } },
  anelli: { k: 'O', fw: 36, fd: 36, h: 150, n: () => L('Torre degli anelli', 'Ring tower'), d: () => L('Torre rotonda di vetro con grandi dischi bianchi e luci azzurre', 'Round glass tower with big white discs and blue lights'),
    draw(B, W, D, H, r) {
      const m = Math.min(W, D), s = Math.min(m * 0.6, 20), gc = pfPick(r, PFC.glass), big = Math.max(W, D);
      B('pfc', 0, 0, m * 0.95, 6, m * 0.95, 0xeef2f6);
      B('pfcg', 0, 0, s, H, s, gc);
      [[0.36, 2.3], [0.62, 2.0], [0.84, 1.6]].forEach(([fy, fs], i) => {
        const ds = Math.min(s * fs, big * 1.05), y = H * fy;
        B('pfc', 0, 0, ds, 1.8, ds, 0xeef2f6, y); B('pfnc', 0, 0, ds * 1.01, 0.5, ds * 1.01, 0x7ad8ff, y + 0.65);
        if (i === 1) B('pfcg', 0, 0, ds * 0.8, 2.6, ds * 0.8, 0x9ac8e0, y + 1.8);
      });
      B('pfk', 0, 0, s * 0.7, H * 0.12, s * 0.7, 0xe0e8f0, H);
      B('pfc', 0, 0, 0.5, H * 0.1, 0.5, 0xd8e0e8, H * 1.12);
    } },
  gradoni: { k: 'O', fw: 30, fd: 40, h: 190, n: () => L('Grattacielo a gradoni', 'Stepped skyscraper'), d: () => L('Pietra grigia a gradini, cima illuminata e antenna, stile anni \'30', 'Grey stone in steps, lit-up top and antenna, 1930s style'),
    draw(B, W, D, H, r) {
      const c = pfPick(r, PFC.stone), w = W * 0.9, d = Math.min(D * 0.8, 36), hs = [0.52, 0.2, 0.14, 0.14].map(f => f * H), sz = [1, 0.76, 0.54, 0.34];
      let y = 0; for (let i = 0; i < 4; i++) { B('pfb', 0, 0, w * sz[i], hs[i], d * sz[i], c, y); y += hs[i]; }
      B('pfn', 0, 0, w * 0.345, hs[3] * 0.45, d * 0.345, pfPick(r, [0xb8a0ff, 0xffe0a0, 0x9ad8ff]), H - hs[3] * 0.45);
      B('pfc', 0, 0, 2, H * 0.12, 2, 0xc8c8d0, H);
      B('pfc', 0, 0, 0.6, H * 0.12, 0.6, 0xe0e0e8, H * 1.12);
    } },
  piramide: { k: 'O', fw: 30, fd: 44, h: 130, n: () => L('Torre col tetto a piramide', 'Pyramid roof tower'), d: () => L('Torre scura con un tetto a piramide verde rame', 'Dark tower with a copper-green pyramid roof'),
    draw(B, W, D, H, r) {
      const s = Math.min(W * 0.86, D * 0.6, 28), c = pfPick(r, [0x8a8278, 0x9a948a, 0x7a7684, 0xa8a090]), b = -D * 0.12;
      B('pfb', 0, D * 0.22, W * 0.9, H * 0.3, D * 0.5, c);
      B('pfb', 0, b, s, H, s, c);
      B('pfp', 0, b, s * 1.05, 1.6, s * 1.05, 0xc8c0b0, H - 1.6);
      B('pfy', 0, b, s * 1.02, s * 0.85, s * 1.02, pfPick(r, [0x4f9a7a, 0x5aa88a, 0x3f8a6a]), H);
      B('pfc', 0, b, 0.6, 7, 0.6, 0xd8c070, H + s * 0.85);
    } },
  vetro: { k: 'O', fw: 30, fd: 40, h: 160, n: () => L('Grattacielo di vetro azzurro', 'Blue glass skyscraper'), d: () => L('Tutto vetro azzurro, con un gradino in cima e l\'eliporto', 'All blue glass, with a step at the top and a helipad'),
    draw(B, W, D, H, r) {
      const w = W * 0.88, d = Math.min(D * 0.75, 36), gc = pfPick(r, PFC.glass), m = Math.min(w, d);
      B('pfg', 0, 0, w, H * 0.8, d, gc);
      B('pfg', 0, -d * 0.1, w * 0.78, H * 0.2, d * 0.72, gc, H * 0.8);
      B('pfp', 0, -d * 0.1, w * 0.82, 1.2, d * 0.76, 0xe8eef4, H);
      for (const s of [-1, 1]) B('pfp', s * w * 0.3, -d / 2 - 0.3, 0.8, H * 0.8, 0.6, 0xe8eef4);
      B('pfc', 0, -d * 0.1, m * 0.5, 0.5, m * 0.5, 0x55575c, H + 1.2);
    } },
  pinnacolo: { k: 'O', fw: 30, fd: 40, h: 220, n: () => L('Torre del pinnacolo', 'Pinnacle tower'), d: () => L('La più alta: vetro con gli spigoli tagliati e un\'antenna lunghissima', 'The tallest: glass with cut corners and a very long antenna'),
    draw(B, W, D, H, r) {
      const s = Math.min(W * 0.86, D * 0.6, 26), gc = pfPick(r, PFC.glass);
      B('pfg', 0, 0, s, H * 0.24, s, 0x4a6a88);
      B('pfg', 0, 0, s * 0.7, H * 0.62, s * 0.7, gc, H * 0.24, Math.PI / 4);
      B('pfg', 0, 0, s * 0.52, H * 0.14, s * 0.52, gc, H * 0.86);
      B('pfc', 0, 0, 1.4, H * 0.3, 1.4, 0xe0e6ec, H);
      B('pfn', 0, 0, 0.9, 0.9, 0.9, 0xff2020, H * 1.3);
    } },
  fungo: { k: 'O', fw: 36, fd: 36, h: 110, n: () => L('Torre a fungo panoramica', 'Mushroom view tower'), d: () => L('Un gambo sottile e in cima un grande disco con le vetrate e una cupola', 'A slim stem with a big glass-walled disc and a dome on top'),
    draw(B, W, D, H, r) {
      const m = Math.min(W, D), s = Math.min(m * 1.05, 34), y = H * 0.8;
      B('pfc', 0, 0, m * 0.9, 5, m * 0.9, 0xe8eef2);
      B('pfcw', 0, 0, m * 0.34, y, m * 0.34, 0xe8eef2);
      B('pfc', 0, 0, s, H * 0.05, s, 0xf0f4f8, y);
      B('pfnc', 0, 0, s * 1.01, 0.5, s * 1.01, 0x7ad8ff, y + H * 0.02);
      B('pfcg', 0, 0, s * 0.92, H * 0.09, s * 0.92, 0x9ac8e0, y + H * 0.05);
      B('pfc', 0, 0, s * 1.06, 1.2, s * 1.06, 0xf0f4f8, H * 0.94);
      B('pfd', 0, 0, s * 0.5, s * 0.25, s * 0.5, 0xbfe0f0, H * 0.94 + 1.2);
    } },
};
const PF_BY = { R: [], C: [], O: [] }; for (const k in PF) PF_BY[PF[k].k].push(k);

// ---------- 3 zone nuove ----------
Object.assign(ZT, {
  15: { k: 'R', dens: 2, like: 3, pf: 'R', col: 0x14f05a, ms: 5, n: () => L('Residenziale futuristica (torri verdi e di vetro)', 'Futuristic residential (green & glass towers)'), sh: () => L('Case del futuro', 'Future homes') },
  16: { k: 'C', dens: 2, like: 6, pf: 'C', col: 0xff3fd0, ms: 4, n: () => L('Commerciale al neon (maxischermi e insegne)', 'Neon commercial (big screens & signs)'), sh: () => L('Neon', 'Neon') },
  17: { k: 'O', dens: 2, like: 7, pf: 'O', col: 0x6a3cff, ms: 4, n: () => L('Uffici futuristici (guglie, anelli, vetro)', 'Futuristic offices (spires, rings, glass)'), sh: () => L('Uffici del futuro', 'Future offices') },
});
for (const [z, after] of [[15, 3], [16, 6], [17, 7]]) if (!ZONE_ORDER.includes(z)) ZONE_ORDER.splice(ZONE_ORDER.indexOf(after) + 1, 0, z);
// ogni edificio di queste zone ha sempre lo stesso palazzo (dipende dal suo numero), anche quando sale di livello
function pfStyleOf(b) { const z = ZT[b.zone]; if (!z || !z.pf || b.spec) return null; const l = PF_BY[z.pf]; return l[Math.floor(mulberry32(b.id * 7919 + 13)() * l.length)]; }
{ const _bh = bldHeight; bldHeight = function (b) { let h = _bh(b); const k = pfStyleOf(b); if (k && PF[k].maxH) h = Math.min(h, PF[k].maxH); return h; }; }
{ const _bn = bldName; bldName = function (b) { const k = pfStyleOf(b); if (!k) return _bn(b); return PF[k].n() + ' ' + NAMES_A[Math.floor(mulberry32(b.id * 13)() * NAMES_A.length)]; }; }
{
  const _db = drawBuilding;
  drawBuilding = function (b) {
    const k = pfStyleOf(b); if (!k || b.ruin) return _db(b);
    removeParts(b.parts); curRef = b;
    const W = b.cw * CELL - 1.6, D = b.cd * CELL - 1.6, y = b.y, yaw = b.ang, fx = Math.sin(yaw), fz = Math.cos(yaw);
    if (b.cons > 0) { // cantiere: la solita gru gialla
      const cx = b.x + fx * (D / 2 - 2), cz = b.z + fz * (D / 2 - 2), mh = (b.h || 8) + 10;
      addPart(b.parts, 'body', cx, y, cz, yaw, 1.2, mh, 1.2, 0xe0b020);
      addPart(b.parts, 'plain', cx - Math.cos(yaw) * W * 0.3, y + mh, cz + Math.sin(yaw) * W * 0.3, yaw, W * 0.9 + 6, 0.8, 0.8, 0xe0b020);
    }
    PF[k].draw(pfAdder(b.parts, b.x, b.z, y, yaw), W, D, Math.max(8, b.h || 20), mulberry32(b.id * 31 + 5));
  };
}

// ---------- menu 🏙️: ogni palazzo si può costruire anche da solo, come un monumento ----------
CAT.foto = { i: '🏙️', n: () => L('Palazzi futuristici', 'Futuristic buildings') };
SVCOL.foto = 0xd8e4ee;
if (!TB.some(t => t.id === 'foto')) TB.splice(TB.findIndex(t => t.id === 'lines'), 0, { id: 'foto', i: CAT.foto.i, n: CAT.foto.n });
{
  const ZN = { R: () => ZT[15].sh(), C: () => ZT[16].sh(), O: () => ZT[17].sh() };
  for (const k in PF) {
    const p = PF[k];
    SV['pf_' + k] = { cat: 'foto', pf: k, w: p.fw, d: p.fd, h: p.h, cost: Math.round((60000 + p.h * 1500) / 1000) * 1000, upk: Math.round(200 + p.h * 5), ms: p.h < 60 ? 2 : p.h < 140 ? 3 : 4, r: 500, park: 2, attr: 2 + Math.round(p.h / 60), xp: 400,
      n: p.n, d2: () => `${p.d()} · ${p.h} m · ${L('Attira turisti. Cresce anche da solo nella zona', 'Draws tourists. Also grows by itself in the zone')} «${ZN[p.k]()}»` };
  }
}
{
  const _ds = drawSvc;
  drawSvc = function (sv) {
    const d = SV[sv.type]; if (!d || !d.pf) return _ds(sv);
    removeParts(sv.parts); curRef = sv;
    PF[d.pf].draw(pfAdder(sv.parts, sv.x, sv.z, sv.y, sv.ang), sv.w - 1, sv.d - 1, d.h, mulberry32(sv.id * 31 + 7));
  };
}
