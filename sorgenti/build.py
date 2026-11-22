# Costruisce city-manager/city-manager.html (un solo file, funziona anche offline)
# Uso: python3 build.py
import base64, os, glob
d = os.path.dirname(os.path.abspath(__file__))
g = os.path.join(d, '..', 'lib')
tpl = open(os.path.join(d, '00-template.html'), encoding='utf-8').read()
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, '[0-9][0-9]-*.js'))))
three = open(os.path.join(g, 'three.min.js'), encoding='utf-8').read()
bg = base64.b64encode(open(os.path.join(g, 'sfondo-menu.jpg'), 'rb').read()).decode()
out = tpl.replace('/*GAME*/', js).replace('SFONDO', bg).replace('/*THREE_LIB*/', three)
open(os.path.join(d, '..', 'index.html'), 'w', encoding='utf-8').write(out)
print('ok', len(out))
