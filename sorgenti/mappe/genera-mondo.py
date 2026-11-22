# Mondo da 100 km intorno alle città vere (griglia 641 x 641, un punto ogni 160 m).
# Stesso centro delle mappe da 10 km: il punto (0,0) del gioco.
# Uso: python3 genera-mondo.py [citta...]   -> scrive out-mondo/enc.json
import os, math, sys, json, gzip, base64, urllib.request
import numpy as np
from PIL import Image
import rasterio
from rasterio.windows import from_bounds
from scipy import ndimage
os.environ['CURL_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
D = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('MONDO_CACHE', os.path.join(D, 'tiles'))
OUT = os.environ.get('MONDO_OUT', os.path.join(D, 'out-mondo'))
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
N = 641; MAPM = 102400.0; CELL = MAPM / (N - 1)
CITIES = {
 'tokyo': (35.6812, 139.7671), 'newyork': (40.7306, -73.9935), 'hongkong': (22.2870, 114.1700),
 'canarie': (28.1100, -15.4250), 'london': (51.5072, -0.1150), 'tampere': (61.4980, 23.7610),
 'seoul': (37.5550, 126.9800), 'oslo': (59.9110, 10.7450),
}
Z = 10
def get_tile(z, x, y):
    p = os.path.join(CACHE, f'{z}_{x}_{y}.png')
    if not os.path.exists(p):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        with urllib.request.urlopen(url, timeout=60) as r: open(p, 'wb').write(r.read())
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
def worldcover(lonmin, latmin, lonmax, latmax, shape):
    acc = np.zeros(shape, np.uint8)
    for la in range(math.floor(latmin / 3) * 3, math.floor(latmax / 3) * 3 + 1, 3):
        for lo in range(math.floor(lonmin / 3) * 3, math.floor(lonmax / 3) * 3 + 1, 3):
            name = f"{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"
            url = f'/vsicurl/https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{name}_Map.tif'
            try:
                with rasterio.open(url) as ds:
                    w = from_bounds(lonmin, latmin, lonmax, latmax, ds.transform)
                    a = ds.read(1, window=w, out_shape=shape, boundless=True, fill_value=0, resampling=rasterio.enums.Resampling.mode)
                acc = np.where(acc == 0, a, acc)
            except Exception as e:
                print('  worldcover', name, 'manca:', str(e)[:80], flush=True)
    return acc
def build(cid):
    lat0, lon0 = CITIES[cid]
    mlat = 111320.0; mlon = 111320.0 * math.cos(math.radians(lat0))
    clat = lat0 + 640 / mlat; clon = lon0 + 640 / mlon
    xs = -MAPM / 2 + np.arange(N) * CELL
    LON = clon + xs[None, :] / mlon + 0 * xs[:, None]; LAT = clat - xs[:, None] / mlat + 0 * xs[None, :]
    tx = (LON + 180) / 360 * 2 ** Z; latr = np.radians(LAT)
    ty = (1 - np.log(np.tan(latr) + 1 / np.cos(latr)) / np.pi) / 2 * 2 ** Z
    t0x, t1x = int(tx.min()), int(tx.max()); t0y, t1y = int(ty.min()), int(ty.max())
    big = np.zeros(((t1y - t0y + 1) * 256, (t1x - t0x + 1) * 256))
    for yy in range(t0y, t1y + 1):
        for xx in range(t0x, t1x + 1):
            big[(yy - t0y) * 256:(yy - t0y + 1) * 256, (xx - t0x) * 256:(xx - t0x + 1) * 256] = get_tile(Z, xx, yy)
    dem = ndimage.map_coordinates(big, [(ty - t0y) * 256 - 0.5, (tx - t0x) * 256 - 0.5], order=1, mode='nearest')
    wc = worldcover(LON.min(), LAT.min(), LON.max(), LAT.max(), (N * 4, N * 4))
    wc = wc.reshape(N, 4, N, 4).transpose(0, 2, 1, 3).reshape(N, N, 16)
    water = ((wc == 80) | (wc == 0)).mean(-1) >= 0.3
    water &= ~((wc == 0).all(-1) & (dem > 3))
    water = ndimage.binary_opening(water, iterations=1) | (water & ndimage.binary_erosion(water, iterations=1))
    lab, nl = ndimage.label(water); sz = ndimage.sum(water, lab, range(1, nl + 1))
    water = np.isin(lab, 1 + np.nonzero(sz >= 3)[0])
    lev = np.where(water, np.maximum(dem, 0), 0.0)
    if water.any():
        idx = ndimage.distance_transform_edt(~water, return_distances=False, return_indices=True)
        near = lev[idx[0], idx[1]]
    else: near = np.full_like(dem, max(0.0, float(np.percentile(dem, 2))))
    near = ndimage.gaussian_filter(near, 3)
    h = dem - near
    dout = ndimage.distance_transform_edt(~water) if water.any() else np.full_like(dem, 99)
    din = ndimage.distance_transform_edt(water)
    land = np.maximum(h, 0.8 + np.minimum(dout, 2) * 1.0)
    land = np.where(dout < 4, np.minimum(land, 1.5 + dout * 8 + np.maximum(h, 0) * (dout / 4)), land)
    wh = -2.5 - np.minimum(din * 4, 14)
    wh = np.where(dem < -3, np.minimum(wh, np.maximum(dem * 0.35, -45)), wh)
    H = np.where(water, wh, land)
    H = ndimage.gaussian_filter(H, 0.7)
    return H.astype(np.float32), water
def encode(H):
    q = np.round(H * 2).astype(np.int32)
    dl = np.diff(np.concatenate([np.zeros((N, 1), np.int32), q], 1), axis=1).astype(np.int16)
    return base64.b64encode(gzip.compress(dl.astype('<i2').tobytes(), 9)).decode()
encp = os.path.join(OUT, 'enc.json')
out = json.load(open(encp)) if os.path.exists(encp) else {}
for cid in (sys.argv[1:] or CITIES):
    H, water = build(cid)
    img = np.zeros((N, N, 3), np.uint8); img[water] = (40, 90, 170)
    lh = np.clip(H / 1500, 0, 1)
    img[~water] = (np.stack([110 + lh * 140, 170 - lh * 30, 90 + lh * 120], -1)[~water]).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(OUT, cid + '.png'))
    out['w_' + cid] = encode(H)
    json.dump(out, open(encp, 'w'))
    print(cid, 'acqua %.0f%%' % (water.mean() * 100), 'max %.0f' % H.max(), 'b64 %d KB' % (len(out['w_' + cid]) // 1024), flush=True)
