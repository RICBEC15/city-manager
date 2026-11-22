import os, math, sys, json, gzip, base64, io, urllib.request
import numpy as np
from PIL import Image
import rasterio
from rasterio.windows import from_bounds
from scipy import ndimage
os.environ['CURL_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
D = os.path.dirname(os.path.abspath(__file__))
N = 513; MAPM = 10240.0
# centro città (lat, lon): finirà a x=-640, z=+640 (dentro le caselle iniziali)
CITIES = {
 'tokyo': (35.6812, 139.7671), 'newyork': (40.7306, -73.9935), 'hongkong': (22.2870, 114.1700),
 'canarie': (28.1100, -15.4250), 'london': (51.5072, -0.1150), 'tampere': (61.4980, 23.7610),
 'seoul': (37.5550, 126.9800), 'oslo': (59.9110, 10.7450),
}
Z = 13
def tile_url(z, x, y): return f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
def get_tile(z, x, y):
    p = os.path.join(D, 'tiles', f'{z}_{x}_{y}.png')
    if not os.path.exists(p):
        with urllib.request.urlopen(tile_url(z, x, y), timeout=60) as r: open(p, 'wb').write(r.read())
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
def merc(lat, lon, z):
    n = 2 ** z; x = (lon + 180) / 360 * n; y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y
def build(cid):
    lat0, lon0 = CITIES[cid]
    mlat = 111320.0; mlon = 111320.0 * math.cos(math.radians(lat0))
    clat = lat0 + 640 / mlat; clon = lon0 + 640 / mlon
    xs = -MAPM / 2 + np.arange(N) * MAPM / (N - 1); zs = xs.copy()
    LON = clon + xs[None, :] / mlon + 0 * zs[:, None]; LAT = clat - zs[:, None] / mlat + 0 * xs[None, :]
    # DEM
    tx = (LON + 180) / 360 * 2 ** Z; latr = np.radians(LAT)
    ty = (1 - np.log(np.tan(latr) + 1 / np.cos(latr)) / np.pi) / 2 * 2 ** Z
    t0x, t1x = int(tx.min()), int(tx.max()); t0y, t1y = int(ty.min()), int(ty.max())
    big = np.zeros(((t1y - t0y + 1) * 256, (t1x - t0x + 1) * 256))
    for yy in range(t0y, t1y + 1):
        for xx in range(t0x, t1x + 1):
            big[(yy - t0y) * 256:(yy - t0y + 1) * 256, (xx - t0x) * 256:(xx - t0x + 1) * 256] = get_tile(Z, xx, yy)
    px = (tx - t0x) * 256 - 0.5; py = (ty - t0y) * 256 - 0.5
    dem = ndimage.map_coordinates(big, [py, px], order=1, mode='nearest')
    # acqua (ESA WorldCover 10 m, classe 80 = acqua; 0 = nessun dato, di solito mare aperto)
    la = math.floor(lat0 / 3) * 3; lo = math.floor(lon0 / 3) * 3
    name = f"{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"
    url = f'/vsicurl/https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{name}_Map.tif'
    with rasterio.open(url) as ds:
        w = from_bounds(LON.min(), LAT.min(), LON.max(), LAT.max(), ds.transform)
        wc = ds.read(1, window=w, out_shape=(N * 2, N * 2), boundless=True, fill_value=0)
    # wc righe: da nord (lat max) a sud; colonne: da ovest a est -> come la nostra griglia
    wc = wc.reshape(N, 2, N, 2).transpose(0, 2, 1, 3).reshape(N, N, 4)
    water = ((wc == 80) | (wc == 0)).sum(-1) >= 2
    water &= ~((wc == 0).all(-1) & (dem > 3))   # nessun dato ma terreno alto: non è acqua
    water = ndimage.binary_opening(water, iterations=1) | (water & ndimage.binary_erosion(water, iterations=2))
    water = ndimage.binary_closing(water, iterations=3, border_value=1) | water
    lab, nl = ndimage.label(water); sz = ndimage.sum(water, lab, range(1, nl + 1))
    water = np.isin(lab, 1 + np.nonzero(sz >= 25)[0])
    # livello dell'acqua vicino a ogni punto (laghi in quota)
    lev = np.where(water, np.maximum(dem, 0), 0.0)
    if water.any():
        idx = ndimage.distance_transform_edt(~water, return_distances=False, return_indices=True)
        near = lev[idx[0], idx[1]]
    else: near = np.full_like(dem, max(0.0, float(np.percentile(dem, 2))))
    near = ndimage.gaussian_filter(near, 18)
    h = dem - near
    dout = ndimage.distance_transform_edt(~water) if water.any() else np.full_like(dem, 99)
    din = ndimage.distance_transform_edt(water)
    land = np.maximum(h, 0.8 + np.minimum(dout, 6) * 0.25)
    land = np.where(dout < 30, np.minimum(land, 1.5 + dout * 1.2 + np.maximum(h, 0) * (dout / 30)), land)
    wh = -2.5 - np.minimum(din * 0.6, 14)
    wh = np.where(dem < -3, np.minimum(wh, np.maximum(dem * 0.35, -45)), wh)
    H = np.where(water, wh, land)
    H = ndimage.gaussian_filter(H, 1.1)
    return H.astype(np.float32), water
def encode(H):
    q = np.round(H * 2).astype(np.int32)
    dl = np.diff(np.concatenate([np.zeros((N, 1), np.int32), q], 1), axis=1).astype(np.int16)
    raw = dl.astype('<i2').tobytes()
    return base64.b64encode(gzip.compress(raw, 9)).decode()
out = {}
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
for cid in (sys.argv[1:] or CITIES):
    H, water = build(cid)
    np.save(os.path.join(D, 'out', cid + '.npy'), H)
    img = np.zeros((N, N, 3), np.uint8)
    img[water] = (40, 90, 170)
    lh = np.clip(H / 300, 0, 1)
    img[~water] = (np.stack([110 + lh * 120, 170 - lh * 40, 90 + lh * 60], -1)[~water]).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(D, 'out', cid + '.png'))
    out[cid] = encode(H)
    print(cid, 'water %.0f%%' % (water.mean() * 100), 'max %.0f' % H.max(), 'min %.0f' % H.min(), 'b64 %d KB' % (len(out[cid]) // 1024), flush=True)
json.dump(out, open(os.path.join(D, 'out', 'enc.json'), 'w'))
