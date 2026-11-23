# City manager

▶️ **Gioca online:** https://ricbec15.github.io/city-manager/

City builder 3D originale in un solo file HTML (Three.js). Si gioca aprendo `index.html` nel browser (doppio clic), tastiera e mouse. Lingue: italiano e inglese.

- `index.html`: il gioco pronto, tutto in un file.
- `sorgenti/`: il codice diviso per parti (`NN-*.js`) e `build.py`, che li unisce in `index.html` (`python3 sorgenti/build.py`).
- `lib/`: Three.js, usato da `build.py`.
- `sorgenti/menu/`: gli sfondi del menu a rotazione (WebP), messi dentro `index.html` da `build.py`.
- `sorgenti/caricamento/`: le immagini della schermata di caricamento (WebP), messe dentro `index.html` da `build.py`.

Le autostrade delle mappe delle città vere (svincoli, ponti e gallerie compresi) vengono da OpenStreetMap, tramite Overture Maps: dati © contributori di OpenStreetMap, licenza ODbL (https://www.openstreetmap.org/copyright).
