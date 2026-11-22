// =====================================================================
//  Grafica: scena, cielo, luci, terreno, acqua, alberi, telecamera
// =====================================================================
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 2, 60000);
scene.fog = new THREE.Fog(0xa9c4dc, 4000, 26000);
const hemi = new THREE.HemisphereLight(0xdfeeff, 0x5a5a40, 0.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3dd, 0.9);
sun.position.set(3000, 5000, 2000);
scene.add(sun, sun.target);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10; sun.shadow.camera.far = 6000;
sun.shadow.bias = -0.0008;

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

// ---------- Cielo ----------
const skyU = { uTop: { value: new THREE.Color(0x3d7bd0) }, uHor: { value: new THREE.Color(0xbcd6ec) }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 0.9, 0.7) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(50000, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: 'uniform vec3 uTop,uHor,uSun,uSunCol; varying vec3 vD; void main(){ float h = max(vD.y,0.0); vec3 c = mix(uHor,uTop,pow(h,0.55)); if(vD.y<0.0) c = uHor*0.85; float s = max(dot(normalize(vD),normalize(uSun)),0.0); c += uSunCol*(pow(s,600.0)*2.0 + pow(s,12.0)*0.25); gl_FragColor = vec4(c,1.0);} '
}));
sky.renderOrder = -10;
scene.add(sky);
const starGeo = new THREE.BufferGeometry(); { const a = []; const r = mulberry32(5); for (let i = 0; i < 1800; i++) { const t = r() * Math.PI * 2, u = r() * 0.95 + 0.05; const s = Math.sqrt(1 - u * u); a.push(Math.cos(t) * s * 45000, u * 45000, Math.sin(t) * s * 45000); } starGeo.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); }
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
scene.add(stars);

// ---------- Terreno ----------
const OVN = 512;
const ovData = new Uint8Array(OVN * OVN * 4);
const ovTex = new THREE.DataTexture(ovData, OVN, OVN, THREE.RGBAFormat); ovTex.magFilter = THREE.LinearFilter; ovTex.minFilter = THREE.LinearFilter; ovTex.needsUpdate = true;
const tileData = new Uint8Array(NT * NT * 4);
const tileTex = new THREE.DataTexture(tileData, NT, NT, THREE.RGBAFormat); tileTex.needsUpdate = true;
const terrU = { uOv: { value: ovTex }, uOvAmt: { value: 0 }, uTiles: { value: tileTex }, uSnow: { value: 0 }, uTileShow: { value: 0.35 }, uOvR: { value: new THREE.Vector4(-HALF, -HALF, MAP, 0) }, uContour: { value: 0 }, uCloud: { value: 0.15 }, uTime: { value: 0 } };
function patchWorld(sh) {
  sh.vertexShader = 'varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = (modelMatrix*vec4(transformed,1.0)).xyz; vWn = normal;');
}
const terrMat = new THREE.MeshLambertMaterial({ vertexColors: true }); terrMat.extensions = { derivatives: true };
terrMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, terrU);
  patchWorld(sh);
  sh.fragmentShader = 'uniform sampler2D uOv; uniform float uOvAmt; uniform sampler2D uTiles; uniform float uSnow; uniform float uTileShow; uniform vec4 uOvR; uniform float uContour; uniform float uCloud; uniform float uTime; uniform sampler2D uPaint; uniform float uPaintOn; varying vec3 vWp; varying vec3 vWn;\nfloat hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat vns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hsh(i),hsh(i+vec2(1.0,0.0)),f.x),mix(hsh(i+vec2(0.0,1.0)),hsh(i+vec2(1.0,1.0)),f.x),f.y);}\n' +
    sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 muv = (vWp.xz + ${HALF.toFixed(1)}) / ${MAP.toFixed(1)};
      if (uPaintOn > 0.0) { vec4 pw = texture2D(uPaint, muv); float nz = vns(vWp.xz / 9.0) * 0.5 + vns(vWp.xz / 3.0) * 0.25; pw = smoothstep(0.25, 0.75, pw + (nz - 0.37) * 0.5); float tw = pw.r + pw.g + pw.b + pw.a;
        if (tw > 0.001) { vec3 pc = (pw.r * vec3(0.34,0.55,0.24) + pw.g * vec3(0.47,0.36,0.23) + pw.b * vec3(0.52,0.51,0.49) + pw.a * vec3(0.86,0.79,0.57)) / tw; diffuseColor.rgb = mix(diffuseColor.rgb, pc * (0.9 + nz * 0.25), clamp(tw, 0.0, 1.0)); } }
      float sn = uSnow * smoothstep(0.6, 0.9, vWn.y) * smoothstep(0.5, 3.0, vWp.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92,0.94,0.98), sn);
      float own = texture2D(uTiles, muv).r;
      diffuseColor.rgb *= mix(1.0, mix(0.62,1.0,own), uTileShow);
      vec2 tl = abs(fract(muv*80.0+0.5)-0.5);
      float bl = (1.0 - smoothstep(0.0, 0.0025, min(tl.x,tl.y))) * uTileShow;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), bl*0.6);
      if (uContour > 0.0 && vWp.y > 0.6) { float ch = vWp.y / 10.0; float dd = min(fract(ch), 1.0 - fract(ch)); float fw = max(fwidth(ch), 0.0001); float cl = 1.0 - smoothstep(0.0, fw * 1.4, dd); float major = step(0.5, 1.0 - abs(mod(floor(ch + 0.5), 5.0))); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.25, 0.2, 0.12), cl * uContour * (major > 0.5 ? 0.75 : 0.4)); }
      vec2 cp = vWp.xz / 1500.0 + vec2(uTime * 0.006, uTime * 0.004); float cld = vns(cp) * 0.62 + vns(cp * 2.3 + 7.0) * 0.38;
      diffuseColor.rgb *= 1.0 - smoothstep(0.52, 0.72, cld) * uCloud;
      vec2 ouv = (vWp.xz - uOvR.xy) / uOvR.z; vec4 ov = (ouv.x > 0.0 && ouv.y > 0.0 && ouv.x < 1.0 && ouv.y < 1.0) ? texture2D(uOv, ouv) : vec4(0.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, ov.rgb, ov.a*uOvAmt);`);
};
// ---------- terreno a pezzi (40 x 40 pezzi da 2,56 km), più dettagliati vicino alla telecamera ----------
const TCH = 64, NTC = (HN - 1) / TCH;           // celle per pezzo, pezzi per lato
const tChunks = [];
let colNoise = null;
function terrColorAt(i, j, out) {
  const k = j * HN + i, h = H[k], x = -HALF + i * HC, z = -HALF + j * HC;
  const hl = H[j * HN + Math.max(i - 1, 0)], hr = H[j * HN + Math.min(i + 1, HN - 1)], hd = H[Math.max(j - 1, 0) * HN + i], hu = H[Math.min(j + 1, HN - 1) * HN + i];
  let nx = hl - hr, ny = 2 * HC, nz = hd - hu; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  const v = colNoise(x / 260, z / 260) * 0.5 + colNoise(x / 60, z / 60) * 0.2;
  let r, g, b;
  if (h < WATER - 0.5) { r = 0.55; g = 0.52; b = 0.42; }
  else if (h < 2.5) { r = 0.78; g = 0.72; b = 0.55; }
  else { r = 0.36 + v * 0.1; g = 0.52 + v * 0.12; b = 0.25 + v * 0.05; const dry = smooth(80, 260, h); r = lerp(r, 0.47, dry * 0.5); g = lerp(g, 0.5, dry * 0.4); }
  const rock = Math.max(smooth(0.82, 0.62, ny), smooth(380, 560, h) * 0.8);
  r = lerp(r, 0.5, rock); g = lerp(g, 0.47, rock); b = lerp(b, 0.43, rock);
  const snow = smooth(600, 700, h + v * 60) * smooth(0.6, 0.85, ny);
  r = lerp(r, 0.95, snow); g = lerp(g, 0.96, snow); b = lerp(b, 0.98, snow);
  out[0] = x; out[1] = h; out[2] = z; out[3] = nx; out[4] = ny; out[5] = nz; out[6] = r; out[7] = g; out[8] = b;
}
const _tc = new Float32Array(9);
function buildChunk(ch, step) {
  if (!colNoise) colNoise = makeNoise(99);
  const SZ = ch.sz || TCH, n = SZ / step + 1, nv = n * n + 4 * n, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  let v = 0, ymin = 1e9, ymax = -1e9;
  const put = (i, j, drop) => { terrColorAt(i, j, _tc); pos[v * 3] = _tc[0]; pos[v * 3 + 1] = _tc[1] - drop; pos[v * 3 + 2] = _tc[2]; nor[v * 3] = _tc[3]; nor[v * 3 + 1] = _tc[4]; nor[v * 3 + 2] = _tc[5]; col[v * 3] = _tc[6]; col[v * 3 + 1] = _tc[7]; col[v * 3 + 2] = _tc[8]; if (_tc[1] < ymin) ymin = _tc[1]; if (_tc[1] > ymax) ymax = _tc[1]; v++; };
  const i0 = ch.ci * SZ, j0 = ch.cj * SZ;
  for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) put(i0 + a * step, j0 + b * step, 0);
  // bordi abbassati (gonne) per non vedere fessure tra pezzi con dettaglio diverso
  const sk = 8 + step * 6, base = n * n;
  for (let a = 0; a < n; a++) put(i0 + a * step, j0, sk);
  for (let a = 0; a < n; a++) put(i0 + a * step, j0 + SZ, sk);
  for (let b = 0; b < n; b++) put(i0, j0 + b * step, sk);
  for (let b = 0; b < n; b++) put(i0 + SZ, j0 + b * step, sk);
  const idx = []; const q = (a, b, c, d) => idx.push(a, c, b, b, c, d);
  for (let b = 0; b < n - 1; b++) for (let a = 0; a < n - 1; a++) { const p = b * n + a; q(p, p + 1, p + n, p + n + 1); }
  for (let a = 0; a < n - 1; a++) { q(base + a, base + a + 1, a, a + 1); q((n - 1) * n + a, (n - 1) * n + a + 1, base + n + a, base + n + a + 1); q(base + 2 * n + a + 1, a * n + n, base + 2 * n + a, a * n); q(a * n + n - 1, base + 3 * n + a, a * n + 2 * n - 1, base + 3 * n + a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  const cx = -HALF + (ch.ci + 0.5) * SZ * HC, cz = -HALF + (ch.cj + 0.5) * SZ * HC;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, (ymin + ymax) / 2, cz), Math.hypot(SZ * HC * 0.72, (ymax - ymin) / 2 + 60));
  if (ch.mesh) { ch.mesh.geometry.dispose(); ch.mesh.geometry = g; } else { ch.mesh = new THREE.Mesh(g, terrMat); ch.mesh.receiveShadow = !!(typeof SET !== 'undefined' && SET.shadows); scene.add(ch.mesh); }
  ch.step = step; ch.dirty = false; ch.cx = cx; ch.cz = cz;
}
for (let cj = 0; cj < NTC; cj++) for (let ci = 0; ci < NTC; ci++) tChunks.push({ ci, cj, mesh: null, step: 0, dirty: true });
// pezzi grandi (4 x 4 pezzi, 10 km) usati da lontano: molte meno chiamate di disegno sui PC meno potenti
const SUP = 4, NSU = NTC / SUP, tSupers = [];
for (let cj = 0; cj < NSU; cj++) for (let ci = 0; ci < NSU; ci++) tSupers.push({ ci, cj, sz: TCH * SUP, mesh: null, step: 0, dirty: true, on: false, cx: -HALF + (ci + 0.5) * TCH * SUP * HC, cz: -HALF + (cj + 0.5) * TCH * SUP * HC });
const terrMeshes = () => tChunks.concat(tSupers).filter(c => c.mesh).map(c => c.mesh);
let LODK = 1; // la qualità automatica lo abbassa sui PC lenti (meno dettaglio da lontano)
function chunkStep(ch) {
  const half = (ch.sz || TCH) * HC / 2, dx = Math.max(0, Math.abs(camera.position.x - ch.cx) - half), dz = Math.max(0, Math.abs(camera.position.z - ch.cz) - half);
  const d = Math.hypot(dx, dz, Math.max(0, camera.position.y - 300) * 0.6);
  const e = d / LODK;
  return e < 2500 ? 1 : e < 5500 ? 2 : e < 11000 ? 4 : e < 22000 ? 8 : e < 40000 ? 16 : 32;
}
// ogni fotogramma: rifà prima i pezzi cambiati vicini, poi quelli che devono cambiare dettaglio (pochi alla volta)
function updateTerrainLOD(all, lim) {
  if (!tChunks[0].cx) for (const ch of tChunks) { ch.cx = -HALF + (ch.ci + 0.5) * TCH * HC; ch.cz = -HALF + (ch.cj + 0.5) * TCH * HC; }
  let budget = all ? 1e9 : lim || 6;
  const todo = [];
  for (const su of tSupers) {
    const half = su.sz * HC / 2, d = Math.hypot(Math.max(0, Math.abs(camera.position.x - su.cx) - half), Math.max(0, Math.abs(camera.position.z - su.cz) - half), Math.max(0, camera.position.y - 300) * 0.6);
    const on = d >= 22000, st = d < 40000 ? 16 : 32;
    su.on = on; su.want = st;
    if (on && (su.dirty || st !== su.step || !su.mesh)) todo.push([su, st, Math.hypot(su.cx - camera.position.x, su.cz - camera.position.z)]);
    if (su.mesh) su.mesh.visible = on && !!su.step;
  }
  for (const ch of tChunks) {
    const su = tSupers[Math.floor(ch.cj / SUP) * NSU + Math.floor(ch.ci / SUP)];
    const hide = su.on && su.mesh && su.step;
    if (ch.mesh) ch.mesh.visible = !hide;
    if (su.on) { if (!su.mesh || !su.step) { /* il pezzo grande non è ancora pronto: tieni i piccoli */ } else continue; }
    const st = chunkStep(ch); if (ch.dirty || st !== ch.step) todo.push([ch, st, (ch.dirty && ch.mesh ? -1e9 : 0) + Math.hypot(ch.cx - camera.position.x, ch.cz - camera.position.z)]);
  }
  todo.sort((a, b) => a[2] - b[2]);
  for (const [ch, st, pr] of todo) { if (budget <= 0 && pr > -1e8) break; buildChunk(ch, st); budget -= st === 1 ? 2 : ch.sz ? 2 : 1; }
}
function updateTerrain(i0 = 0, j0 = 0, i1 = HN - 1, j1 = HN - 1) {
  const a = clamp(Math.floor((i0 - 1) / TCH), 0, NTC - 1), b = clamp(Math.floor((i1 + 1) / TCH), 0, NTC - 1), c = clamp(Math.floor((j0 - 1) / TCH), 0, NTC - 1), d = clamp(Math.floor((j1 + 1) / TCH), 0, NTC - 1);
  for (let cj = c; cj <= d; cj++) for (let ci = a; ci <= b; ci++) tChunks[cj * NTC + ci].dirty = true;
  for (let cj = Math.floor(c / SUP); cj <= Math.floor(d / SUP); cj++) for (let ci = Math.floor(a / SUP); ci <= Math.floor(b / SUP); ci++) tSupers[cj * NSU + ci].dirty = true;
}


// ---------- Acqua ----------
const waterU = { uTime: { value: 0 }, uNight: { value: 0 } };
const waterMat = new THREE.MeshLambertMaterial({ color: 0x2f6f9a, transparent: true, opacity: 0.82 });
waterMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, waterU);
  patchWorld(sh);
  sh.fragmentShader = 'uniform float uTime; varying vec3 vWp; varying vec3 vWn;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    float w = sin(vWp.x*0.05+uTime*1.3)*sin(vWp.z*0.043-uTime*1.1) + sin((vWp.x+vWp.z)*0.11+uTime*2.0)*0.5;
    diffuseColor.rgb *= 0.92 + w*0.06;`);
};
const water = new THREE.Mesh(new THREE.PlaneGeometry(400000, 400000, 1, 1).rotateX(-Math.PI / 2), waterMat);
water.renderOrder = 2;
scene.add(water);

// ---------- Utility geometrie ----------
function mergeGeos(list) { // list di BufferGeometry non indicizzate o indicizzate, con colori opzionali
  let n = 0; const gs = list.map(g => { const ng = g.index ? g.toNonIndexed() : g; n += ng.attributes.position.count; return ng; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of gs) {
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
    o += g.attributes.position.count;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return m;
}
function colorGeo(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v3 = new THREE.Vector3(), _s3 = new THREE.Vector3(), _c = new THREE.Color();
function setInst(mesh, i, x, y, z, yaw, sx, sy, sz) {
  const e = mesh.instanceMatrix.array, o = i * 16, c = Math.cos(yaw), s = Math.sin(yaw);
  e[o] = c * sx; e[o + 1] = 0; e[o + 2] = -s * sx; e[o + 3] = 0;
  e[o + 4] = 0; e[o + 5] = sy; e[o + 6] = 0; e[o + 7] = 0;
  e[o + 8] = s * sz; e[o + 9] = 0; e[o + 10] = c * sz; e[o + 11] = 0;
  e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
}
function setInstCol(mesh, i, r, g, b) { const a = mesh.instanceColor.array; a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b; }

// pool di istanze con rimozione veloce (scambio con l'ultima)
class InstPool {
  constructor(geo, mat, max) {
    this.mesh = new THREE.InstancedMesh(geo, mat, max); this.max = max;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
    this.mesh.count = 0; this.owner = new Array(max); this.mesh.frustumCulled = false; scene.add(this.mesh);
  }
  add(obj) { if (this.mesh.count >= this.max) return -1; const i = this.mesh.count++; this.owner[i] = obj; return i; }
  remove(i, field) {
    const last = this.mesh.count - 1;
    if (i < 0 || i > last) return;
    if (i !== last) {
      this.mesh.instanceMatrix.array.copyWithin(i * 16, last * 16, last * 16 + 16);
      this.mesh.instanceColor.array.copyWithin(i * 3, last * 3, last * 3 + 3);
      const o = this.owner[last]; this.owner[i] = o; o[field] = i;
    }
    this.owner[last] = null; this.mesh.count--; this.dirty();
  }
  dirty() { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true; }
}

// ---------- Alberi ----------
const treeGeo = (() => {
  const leaves = colorGeo(new THREE.ConeGeometry(3.2, 9.5, 5, 1, true).translate(0, 6.7, 0), 0x3f7a35);
  const trunk = colorGeo(new THREE.CylinderGeometry(0.35, 0.45, 2.5, 3, 1, true).translate(0, 1.25, 0), 0x6b4a2b);
  return mergeGeos([leaves, trunk]);
})();
const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const TRB = 1600, TRBC = MAP / TRB; // secchi da 64 m
let trees = null; // {x,z,alive,chunk,idx}
const treeChunks = [];
function genTrees(seed, density) {
  for (const c of treeChunks) { scene.remove(c.mesh); c.mesh.geometry.dispose(); }
  treeChunks.length = 0;
  const r = mulberry32(seed + 3), list = [], n = makeNoise(seed + 5);
  const target = 0; // niente alberi di base: restano solo quelli piantati dal giocatore
  let tries = 0;
  while (list.length < target && tries < target * 8) {
    tries++;
    const x = (r() - 0.5) * MAP * 0.995, z = (r() - 0.5) * MAP * 0.995, h = getH(x, z);
    if (h < 2 || h > 560) continue;
    const f = fbm(n, x / 1300, z / 1300, 3) * 2.2 + 0.1 + (h > 120 ? 0.25 : 0);
    if (r() > f) continue;
    if (slopeAt(x, z) > 0.55) continue;
    list.push({ x, z, alive: true, s: 0.7 + r() * 0.7, c: 0.75 + r() * 0.4 });
  }
  trees = list;
  buildTreeChunks();
}
const treeBuckets = new Map();
function buildTreeChunks() {
  treeBuckets.clear();
  const per = Array.from({ length: NT * NT }, () => []);
  trees.forEach((t, i) => { per[tileIdx(t.x, t.z)].push(i); const b = Math.floor((t.z + HALF) / TRBC) * TRB + Math.floor((t.x + HALF) / TRBC); if (!treeBuckets.has(b)) treeBuckets.set(b, []); treeBuckets.get(b).push(i); });
  for (let c = 0; c < NT * NT; c++) {
    const ids = per[c]; if (!ids.length) continue;
    const g = treeGeo.clone();
    const cx = -HALF + (c % NT + 0.5) * TILE, cz = -HALF + (Math.floor(c / NT) + 0.5) * TILE;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 200, cz), TILE * 0.8);
    const m = new THREE.InstancedMesh(g, treeMat, ids.length);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ids.length * 3), 3);
    ids.forEach((ti, k) => { const t = trees[ti]; t.chunk = treeChunks.length; t.idx = k; });
    const ch = { mesh: m, ids, cx, cz };
    treeChunks.push(ch); scene.add(m);
    refreshTreeChunk(ch);
  }
}
function refreshTreeChunk(ch) {
  ch.ids.forEach((ti, k) => {
    const t = trees[ti], y = getH(t.x, t.z) - 0.3;
    setInst(ch.mesh, k, t.x, y, t.z, t.x, t.alive ? t.s : 0, t.alive ? t.s : 0, t.alive ? t.s : 0);
    setInstCol(ch.mesh, k, t.c, t.c, t.c);
  });
  ch.mesh.instanceMatrix.needsUpdate = true; ch.mesh.instanceColor.needsUpdate = true;
}
function treesNear(x, z, r, fn) {
  const b0 = Math.floor((x - r + HALF) / TRBC), b1 = Math.floor((x + r + HALF) / TRBC), c0 = Math.floor((z - r + HALF) / TRBC), c1 = Math.floor((z + r + HALF) / TRBC);
  for (let bz = c0; bz <= c1; bz++) for (let bx = b0; bx <= b1; bx++) { const l = treeBuckets.get(bz * TRB + bx); if (l) for (const i of l) fn(trees[i], i); }
}
const treeDirty = new Set();
function clearTrees(test, x, z, r) { treesNear(x, z, r, t => { if (t.alive && test(t.x, t.z)) { t.alive = false; treeDirty.add(t.chunk); } }); }
function plantTree(x, z) {
  const t = { x, z, alive: true, s: 0.7 + rand() * 0.6, c: 0.8 + rand() * 0.3, planted: true };
  trees.push(t); const i = trees.length - 1;
  const b = Math.floor((z + HALF) / TRBC) * TRB + Math.floor((x + HALF) / TRBC); if (!treeBuckets.has(b)) treeBuckets.set(b, []); treeBuckets.get(b).push(i);
  plantedTrees.push(i);
  return t;
}
let plantedTrees = [];
const plantedMesh = new InstPool(treeGeo, treeMat, 20000);
function flushTrees() {
  for (const c of treeDirty) refreshTreeChunk(treeChunks[c]);
  treeDirty.clear();
  let n = 0;
  for (const i of plantedTrees) { const t = trees[i]; if (!t.alive) continue; if (n >= plantedMesh.max) break; setInst(plantedMesh.mesh, n, t.x, getH(t.x, t.z) - 0.3, t.z, t.x, t.s, t.s, t.s); setInstCol(plantedMesh.mesh, n, t.c, t.c, t.c); n++; }
  plantedMesh.mesh.count = n; plantedMesh.dirty();
}
function updateTreeVisibility() {
  for (const ch of treeChunks) ch.mesh.visible = Math.hypot(ch.cx - camera.position.x, ch.cz - camera.position.z) < 3200 + camera.position.y * 1.1;
}

// ---------- Telecamera ----------
const cam = { tx: 0, tz: 0, ty: 0, dist: 900, yaw: 0.6, pitch: 0.85, vx: 0, vz: 0 };
function updateCamera() {
  cam.pitch = clamp(cam.pitch, 0.12, 1.5);
  cam.dist = clamp(cam.dist, 25, 5e6); // in pratica nessun limite allo zoom indietro
  cam.tx = clamp(cam.tx, -HALF, HALF); cam.tz = clamp(cam.tz, -HALF, HALF);
  cam.ty = lerp(cam.ty, Math.max(getH(cam.tx, cam.tz), WATER), 0.2);
  const cp = Math.cos(cam.pitch);
  let x = cam.tx + Math.sin(cam.yaw) * cp * cam.dist, z = cam.tz + Math.cos(cam.yaw) * cp * cam.dist, y = cam.ty + Math.sin(cam.pitch) * cam.dist;
  const g = Math.max(getH(x, z), WATER) + 8; if (y < g) y = g;
  camera.position.set(x + shake.x, y + shake.y, z);
  camera.lookAt(cam.tx, cam.ty, cam.tz);
  sky.position.copy(camera.position); sky.scale.setScalar(Math.max(150000, cam.dist * 40) * 0.85 / 50000);
  camera.near = Math.max(clamp(cam.dist * 0.01, 1, 400), cam.dist > 60000 ? Math.max(0, y - 3000) * 0.5 : 0); camera.far = Math.max(150000, cam.dist * 40); camera.updateProjectionMatrix();
  { const ws = camera.far / 190000; water.scale.set(ws, 1, ws); water.position.x = camera.position.x; water.position.z = camera.position.z; }
}
const shake = { x: 0, y: 0, t: 0 };

// raggio dal mouse al terreno (marcia sull'altezza)
const ray = new THREE.Raycaster(); const _ndc = new THREE.Vector2();
function groundAt(mx, my) {
  _ndc.set(mx / innerWidth * 2 - 1, -(my / innerHeight) * 2 + 1);
  ray.setFromCamera(_ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  let t = 0, step = Math.max(4, cam.dist * 0.01), prev = 0;
  for (let k = 0; k < 2000; k++) {
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    const g = Math.max(getH(x, z), WATER);
    if (y <= g) {
      let a = prev, b = t;
      for (let q = 0; q < 12; q++) { const m = (a + b) / 2; const yy = o.y + d.y * m, xx = o.x + d.x * m, zz = o.z + d.z * m; if (yy <= Math.max(getH(xx, zz), WATER)) b = m; else a = m; }
      const xx = o.x + d.x * b, zz = o.z + d.z * b;
      return { x: xx, z: zz, y: Math.max(getH(xx, zz), WATER) };
    }
    prev = t; t += step; step *= 1.01;
    if (t > 250000) break;
  }
  return null;
}
