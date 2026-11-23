# Costruisce index.html (un solo file, funziona anche offline)
# Uso: python3 build.py
import base64, os, glob
d = os.path.dirname(os.path.abspath(__file__))
g = os.path.join(d, '..', 'lib')
OUT = os.path.join(d, '..', 'index.html')
rd = lambda p: open(p, encoding='utf-8').read()
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
tpl = rd(os.path.join(d, '00-template.html'))
files = sorted(glob.glob(os.path.join(d, '[0-9][0-9]-*.js')))
data = [f for f in files if os.path.basename(f).startswith('00-')]  # solo dati: script a parte, così la barra avanza mentre si scarica
js = '\n'.join(rd(f) for f in files if f not in data)
three = rd(os.path.join(g, 'three.min.js'))
# immagini della schermata di caricamento (sorgenti/caricamento/N.webp + N-sfondo.webp sfocato per i bordi)
imgs = sorted(glob.glob(os.path.join(d, 'caricamento', '[0-9].webp')))
boot = ''.join('<div class="bi" style="background-image:url(data:image/webp;base64,%s),url(data:image/webp;base64,%s)"></div>' % (b64(p), b64(p[:-5] + '-sfondo.webp')) for p in imgs)
dt = [rd(f) for f in data]
tot = len(three) + sum(map(len, dt)) + len(js); acc = len(three); dh = ''
for t in dt:
    acc += len(t); dh += '<script>\n%s\n</script>\n<script>bootP(%.2f)</script>\n' % (t, acc / tot * 0.85)
# sfondi del menu a rotazione (sorgenti/menu/N.webp): 8 s ciascuno, dissolvenza lenta
mimg = sorted(glob.glob(os.path.join(d, 'menu', '[0-9].webp')))
mper = 8.0; mcyc = mper * len(mimg)
menu = ''.join('<div class="mbg" style="background-image:url(data:image/webp;base64,%s);animation-duration:%gs;animation-delay:%gs"></div>' % (b64(p), mcyc, i * mper - 1.5) for i, p in enumerate(mimg))
out = tpl.replace('<!--MENUIMG-->', menu).replace('<!--BOOTIMG-->', boot).replace('bootP(THREE)', 'bootP(%.2f)' % (len(three) / tot * 0.85))
out = out.replace('/*GAME*/', js).replace('<!--DATA-->', dh).replace('/*THREE_LIB*/', three)
open(OUT, 'w', encoding='utf-8').write(out)
print('ok', len(out))
