# Mappe vere nuove (mod di Cities: Skylines II, blocco 4): Alpi svizzere e Alaska.
# Per ogni mappa tre griglie di altezze, tutte con lo stesso livello dell'acqua:
#   <id>    centro preciso 10 km (513 x 513, un punto ogni 20 m), centro città in x=-640, z=+640
#   w_<id>  mondo da 100 km (641 x 641, un punto ogni 160 m)
#   m_<id>  (se c'è 'mid') riquadro medio da 25,6 km (641 x 641, un punto ogni 40 m) centrato in mid=(x, z)
# Il livello dell'acqua viene dal mondo e vale solo per laghi e mare bassi (wmax): i laghetti di montagna
# e i torrenti che scendono restano terra, perché nel gioco l'acqua è tutta a un livello.
# Uso: python3 genera-nuove.py [mappa...]   -> scrive out-nuove/enc.json (e i disegni .png)
import os, math, sys, json, gzip, base64, urllib.request
import numpy as np
from PIL import Image, ImageDraw
import rasterio
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
from scipy import ndimage
os.environ['CURL_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
D = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('MAPPE_CACHE', os.path.join(D, 'tiles')); OUT = os.environ.get('MAPPE_OUT', os.path.join(D, 'out-nuove'))
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
HALF = 51200.0
CONF = {
    # Interlaken tra i laghi di Thun e di Brienz; a sud la valle di Lauterbrunnen e le vette
    'jungfrau': dict(ll=(46.6863, 7.8632), wmax=620, tol=12, mid=(5000, 11000), poi={
        'Interlaken': (46.6863, 7.8632), 'Lauterbrunnen': (46.5935, 7.9091), 'Staubbach': (46.5966, 7.9060),
        'Wengen': (46.6055, 7.9214), 'Muerren': (46.5590, 7.8925), 'Grindelwald': (46.6243, 8.0414),
        'Eiger': (46.5775, 8.0052), 'Moench': (46.5586, 7.9974), 'Jungfrau': (46.5367, 7.9625),
        'Schilthorn': (46.5579, 7.8353), 'Stechelberg': (46.5443, 7.9035), 'KlScheidegg': (46.5850, 7.9612)}),
    # Capo Lazaref, isola di Unimak: tundra, vulcani (Shishaldin) e oceano
    'alaska': dict(ll=(54.632, -163.578), wmax=40, tol=15, mid=None, poi={
        'CapeLazaref': (54.6133, -163.5903), 'LazarefPeak': (54.6451, -163.5294), 'Shishaldin': (54.7554, -163.9711),
        'Isanotski': (54.765, -163.727), 'Roundtop': (54.80, -163.59), 'FalsePass': (54.8536, -163.4120)}),
}
def get_tile(z, x, y):
    p = os.path.join(CACHE, f'{z}_{x}_{y}.png')
    if not os.path.exists(p):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        for t in range(4):
            try:
                with urllib.request.urlopen(url, timeout=60) as r: data = r.read()
                open(p, 'wb').write(data); break
            except Exception as e:
                if t == 3: raise
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
def dem_at(LAT, LON, Z):
    tx = (LON + 180) / 360 * 2 ** Z; latr = np.radians(LAT)
    ty = (1 - np.log(np.tan(latr) + 1 / np.cos(latr)) / np.pi) / 2 * 2 ** Z
    t0x, t1x = int(tx.min()), int(tx.max()); t0y, t1y = int(ty.min()), int(ty.max())
    big = np.zeros(((t1y - t0y + 1) * 256, (t1x - t0x + 1) * 256))
    for yy in range(t0y, t1y + 1):
        for xx in range(t0x, t1x + 1):
            big[(yy - t0y) * 256:(yy - t0y + 1) * 256, (xx - t0x) * 256:(xx - t0x + 1) * 256] = get_tile(Z, xx, yy)
    return ndimage.map_coordinates(big, [(ty - t0y) * 256 - 0.5, (tx - t0x) * 256 - 0.5], order=1, mode='nearest')
def worldcover(lonmin, latmin, lonmax, latmax, shape, mode):
    acc = np.zeros(shape, np.uint8)
    for la in range(math.floor(latmin / 3) * 3, math.floor(latmax / 3) * 3 + 1, 3):
        for lo in range(math.floor(lonmin / 3) * 3, math.floor(lonmax / 3) * 3 + 1, 3):
            name = f"{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"
            url = f'/vsicurl/https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{name}_Map.tif'
            try:
                with rasterio.open(url) as ds:
                    w = from_bounds(lonmin, latmin, lonmax, latmax, ds.transform)
                    kw = dict(resampling=Resampling.mode) if mode else {}
                    a = ds.read(1, window=w, out_shape=shape, boundless=True, fill_value=0, **kw)
                acc = np.where(acc == 0, a, acc)
            except Exception as e:
                print('  worldcover', name, 'manca:', str(e)[:80], flush=True)
    return acc
class Geo:
    def __init__(self, lat0, lon0):
        self.mlat = 111320.0; self.mlon = 111320.0 * math.cos(math.radians(lat0))
        self.clat = lat0 + 640 / self.mlat; self.clon = lon0 + 640 / self.mlon
    def ll(self, x, z): return self.clat - z / self.mlat, self.clon + x / self.mlon
    def xz(self, lat, lon): return (lon - self.clon) * self.mlon, -(lat - self.clat) * self.mlat
def grid(geo, cx, cz, n, cell):
    xs = cx - (n - 1) / 2 * cell + np.arange(n) * cell; zs = cz - (n - 1) / 2 * cell + np.arange(n) * cell
    X = xs[None, :] + 0 * zs[:, None]; Zg = zs[:, None] + 0 * xs[None, :]
    LAT, LON = geo.ll(X, Zg)
    return X, Zg, LAT, LON
def water_mask(LAT, LON, dem, n, sub, frac, mode, wmax, minsize, open_=True):
    wc = worldcover(LON.min(), LAT.min(), LON.max(), LAT.max(), (n * sub, n * sub), mode)
    wc = wc.reshape(n, sub, n, sub).transpose(0, 2, 1, 3).reshape(n, n, sub * sub)
    water = ((wc == 80) | (wc == 0)).mean(-1) >= frac
    water &= ~((wc == 0).all(-1) & (dem > 3))
    water &= dem < wmax
    if open_: water = ndimage.binary_opening(water, iterations=1) | (water & ndimage.binary_erosion(water, iterations=1))
    lab, nl = ndimage.label(water)
    if nl:
        sz = ndimage.sum(water, lab, range(1, nl + 1)); water = np.isin(lab, 1 + np.nonzero(sz >= minsize)[0])
    return water
def shape(dem, near, water, cell, sig):
    h = dem - near
    dout = (ndimage.distance_transform_edt(~water) if water.any() else np.full_like(dem, 999)) * cell
    din = ndimage.distance_transform_edt(water) * cell
    land = np.maximum(h, 0.8 + np.minimum(dout, 150) / 150 * 1.5)
    land = np.where(dout < 600, np.minimum(land, 1.5 + dout * 0.06 + np.maximum(h, 0) * (dout / 600)), land)
    wh = -2.5 - np.minimum(din * 0.03, 14)
    wh = np.where(dem < -3, np.minimum(wh, np.maximum(dem * 0.35, -45)), wh)
    H = np.where(water, wh, land)
    return ndimage.gaussian_filter(H, sig).astype(np.float32)
def encode(H):
    n = H.shape[1]
    q = np.round(H * 2).astype(np.int32)
    dl = np.diff(np.concatenate([np.zeros((H.shape[0], 1), np.int32), q], 1), axis=1)
    assert np.abs(dl).max() < 32767
    return base64.b64encode(gzip.compress(dl.astype('<i2').tobytes(), 9)).decode()
def paint(H, water, path, top, marks=()):
    img = np.zeros(H.shape + (3,), np.uint8); img[water] = (40, 90, 170)
    lh = np.clip(H / top, 0, 1)
    img[~water] = (np.stack([110 + lh * 140, 170 - lh * 30, 90 + lh * 120], -1)[~water]).astype(np.uint8)
    im = Image.fromarray(img); dr = ImageDraw.Draw(im)
    for (i, j, name) in marks:
        dr.ellipse([i - 3, j - 3, i + 3, j + 3], outline=(255, 0, 0)); dr.text((i + 5, j - 5), name, fill=(255, 255, 0))
    im.save(path)
def build(mid_id):
    c = CONF[mid_id]; geo = Geo(*c['ll']); res = {}
    pois = {k: geo.xz(*v) for k, v in c['poi'].items()}
    for k, (x, z) in pois.items(): print(f'  {k:14s} x={x:8.0f} z={z:8.0f}')
    # 1) mondo (160 m): acqua bassa e livello dell'acqua
    N = 641; cell = 160.0
    X, Zg, LAT, LON = grid(geo, 0, 0, N, cell)
    dem = dem_at(LAT, LON, 10)
    water = water_mask(LAT, LON, dem, N, 4, 0.3, True, c['wmax'], 3)
    lev = np.where(water, np.maximum(dem, 0), 0.0)
    if water.any():
        idx = ndimage.distance_transform_edt(~water, return_distances=False, return_indices=True); near = lev[idx[0], idx[1]]
    else: near = np.full_like(dem, max(0.0, float(np.percentile(dem, 2))))
    nearW = ndimage.gaussian_filter(near, 3)
    Hw = shape(dem, nearW, water, cell, 0.7)
    mk = [((x + HALF) / cell, (z + HALF) / cell, k) for k, (x, z) in pois.items()]
    paint(Hw, water, os.path.join(OUT, mid_id + '_mondo.png'), 2500, mk)
    res['w_' + mid_id] = Hw
    print(mid_id, 'mondo: acqua %.0f%%' % (water.mean() * 100), 'max %.0f' % Hw.max(), 'min %.0f' % Hw.min(), flush=True)
    def nearAt(X, Zg): return ndimage.map_coordinates(nearW, [(Zg + HALF) / cell, (X + HALF) / cell], order=1, mode='nearest')
    # 2) riquadri precisi: stesso livello dell'acqua del mondo
    boxes = [(mid_id, 0.0, 0.0, 513, 20.0, 2, 0.5, 25, 1.1)]
    if c.get('mid'): boxes.append(('m_' + mid_id, c['mid'][0], c['mid'][1], 641, 40.0, 4, 0.4, 15, 0.9))
    for key, cx, cz, n, cs, sub, frac, mins, sig in boxes:
        X, Zg, LAT, LON = grid(geo, cx, cz, n, cs)
        dem = dem_at(LAT, LON, 13)
        nr = nearAt(X, Zg)
        water = water_mask(LAT, LON, dem, n, sub, frac, False, c['wmax'], mins, False)
        water = ndimage.binary_closing(water, iterations=2, border_value=1) | water
        water &= dem < nr + c['tol']
        lab, nl = ndimage.label(water)
        if nl:
            sz = ndimage.sum(water, lab, range(1, nl + 1)); water = np.isin(lab, 1 + np.nonzero(sz >= mins)[0])
        Hb = shape(dem, nr, water, cs, sig)
        res[key] = Hb
        mk = [((x - cx) / cs + (n - 1) / 2, (z - cz) / cs + (n - 1) / 2, k) for k, (x, z) in pois.items() if abs(x - cx) < n * cs / 2 and abs(z - cz) < n * cs / 2]
        paint(Hb, water, os.path.join(OUT, key + '.png'), 2500 if c['wmax'] > 100 else 900, mk)
        print(key, 'acqua %.0f%%' % (water.mean() * 100), 'max %.0f' % Hb.max(), 'min %.0f' % Hb.min(), flush=True)
    return res
encp = os.path.join(OUT, 'enc.json')
out = json.load(open(encp)) if os.path.exists(encp) else {}
for mid_id in (sys.argv[1:] or CONF):
    r = build(mid_id)
    for k, H in r.items():
        np.save(os.path.join(OUT, k + '.npy'), H)
        out[k] = encode(H); print('  ', k, 'b64 %d KB' % (len(out[k]) // 1024), flush=True)
    json.dump(out, open(encp, 'w'))
