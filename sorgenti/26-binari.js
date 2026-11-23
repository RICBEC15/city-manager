// ============================================================
//  Niente binari già pronti sulla mappa (richiesta di Riccardo, 23 nov 2026):
//  i binari li mette solo il giocatore. I treni da fuori arrivano dove un binario
//  finisce sul bordo delle caselle comprate (o sul bordo del mondo).
// ============================================================
rhwRail = function () { return false; };
// toglie i binari messi dal gioco (partite nuove e salvataggi vecchi); quelli del giocatore restano
function dropPreRail() {
  let k = 0;
  for (const s of [...segs.values()]) if (s.pre && RT[s.type]?.rail) { removeSeg(s.id); k++; }
  // nodi rimasti soli del vecchio binario
  for (const n of [...nodes.values()]) if (n.rail && !n.segs.length) { nodes.delete(n.id); markNodeDirty(n); }
  if (k) { roadVersion++; netDirty = true; flushRoads?.(); }
  return k;
}
const _preplace26 = preplace;
preplace = function () { _preplace26(); dropPreRail(); };
const _computeNetworks26 = computeNetworks;
const RAIL26 = new WeakSet();
computeNetworks = function () {
  if (typeof S !== 'undefined' && S && !RAIL26.has(S)) { RAIL26.add(S); dropPreRail(); }
  return _computeNetworks26.apply(this, arguments);
};
// un binario che finisce sul bordo delle tue caselle porta fuori città
function railGate(n) {
  if (n.segs.length !== 1 || !RT[segs.get(n.segs[0])?.type]?.rail) return false;
  if (n.outside) return true;
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = n.x + a * 45, z = n.z + b * 45; if (!inMap(x, z) || !isOwned(x, z)) return true; }
  return false;
}
outsideRail = function () { return [...nodes.values()].filter(railGate); };
RT.rail.d = () => L('Per treni passeggeri e merci. Porta i binari fino al bordo delle tue caselle: da lì arrivano i treni da fuori città', 'For passenger and cargo trains. Run the tracks to the edge of your tiles: trains from outside arrive there');
