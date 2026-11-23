// =====================================================================
//  Schermata di caricamento a tutto schermo con le immagini di Riccardo
//  (sorgenti/caricamento/). Si vede all'apertura del gioco e quando si
//  prepara una città (nuova o caricata). Le immagini girano da sole con
//  le animazioni CSS, quindi non pesano sul gioco.
// =====================================================================
const BOOT = { el: document.getElementById('boot'), t: 0 };
function bootText(t) { const x = document.getElementById('bootX'); if (x) x.textContent = t; }
function bootShow(txt, f) {
  const b = BOOT.el; if (!b) return;
  clearTimeout(BOOT.t);
  if (b.style.display === 'none') { // ogni volta parte da un'immagine a caso
    const e = b.querySelectorAll('.bi'), n = e.length, r = Math.floor(Math.random() * n);
    e.forEach((x, k) => { x.style.animationDelay = (((k - r + n) % n) * 3.5 - 0.84) + 's'; });
    b.style.display = '';
  }
  b.classList.remove('off');
  if (txt != null) bootText(txt);
  if (f != null) bootP(f);
}
function bootHide() {
  const b = BOOT.el; if (!b) return;
  b.classList.add('off'); clearTimeout(BOOT.t);
  BOOT.t = setTimeout(() => { if (b.classList.contains('off')) b.style.display = 'none'; }, 700); // nascosta del tutto: le animazioni si fermano
}
// all'apertura: resta finché le mappe e le autostrade sono pronte e il menu è disegnato
bootP(0.9); bootText(L('Preparo le mappe…', 'Preparing maps…'));
(async () => {
  const iv = setInterval(() => bootP(0.9 + 0.09 * (typeof MAPS_PROG === 'number' ? Math.min(1, MAPS_PROG) : 1)), 150);
  try { await MAPS_READY; await RHW_READY; } catch (e) { console.error(e); }
  clearInterval(iv); bootP(1);
  await nextFrame(); await nextFrame();
  bootHide();
})();
// nuova città o partita caricata: la stessa schermata al posto della barretta in basso
const _loadBar13 = loadBar;
loadBar = function (f, txt) {
  if (f == null) { _loadBar13(null); bootHide(); return; }
  bootShow(txt + ' ' + Math.round(f * 100) + '%', f);
};
