// =====================================================================
//  Novità dal wiki (22 nov 2026) - Blocco 9: clima e tempo
//  tipo di clima, corrente che sale col freddo e col caldo,
//  giornate che cambiano con le stagioni, emisfero sud, "nascondi la neve"
// =====================================================================
const CLIM = {
  temp: { n: () => L('Temperato', 'Temperate'), amp: 1, off: 0, day: 2.75 },
  cont: { n: () => L('Continentale (estati calde, inverni gelidi)', 'Continental (hot summers, freezing winters)'), amp: 1.5, off: -3, day: 3.3 },
  polar: { n: () => L('Polare (inverni lunghi, notti lunghissime)', 'Polar (long winters, very long nights)'), amp: 1.3, off: -15, day: 7.5 },
};
for (const k of ['newyork', 'tampere', 'seoul', 'oslo']) if (MAPS[k]) MAPS[k].clim = 'cont';
function climOf() { return (typeof S !== 'undefined' && S && CLIM[S.opts?.climate]) ? S.opts.climate : (typeof S !== 'undefined' && S && MAPS[S.map]?.clim) || 'temp'; }
// mese "del tempo": nell'emisfero sud le stagioni sono invertite
function climMonthF() { return ((S.time / 24) % 12 + (S.opts?.south ? 6 : 0)) % 12; }
seasonInfo = function () {
  const m = Math.floor(climMonthF()), c = climOf();
  const winter = c === 'polar' ? (m >= 10 || m <= 3) : (m === 11 || m <= 1), summer = c === 'polar' ? (m === 6 || m === 7) : (m >= 5 && m <= 7);
  const q = winter ? 0 : summer ? 2 : m <= 5 ? 1 : 3;
  return { m, winter, summer, name: [L('Inverno', 'Winter'), L('Primavera', 'Spring'), L('Estate', 'Summer'), L('Autunno', 'Autumn')][q] };
};
// durata del giorno (ore di luce): più corta d'inverno, cortissima ai poli
function dayLenFor() { const f = climMonthF(); return clamp(12 + CLIM[climOf()].day * Math.cos((f - 6.5) / 12 * Math.PI * 2), 3.5, 20.5); }
const CLIM_T = [3, 5, 10, 14, 19, 24, 28, 27, 22, 16, 9, 4];
const _updateWeather9 = updateWeather;
updateWeather = function () {
  _updateWeather9();
  const c = CLIM[climOf()], se = seasonInfo();
  WEATHER.temp = 15 + (CLIM_T[se.m] - 15) * c.amp + c.off + (MAPS[MAPID]?.temp || 0) + (rand() - 0.5) * 6 + (WEATHER.kind === 'clear' ? 2 : -2);
  // la neve cade solo se fa freddo, e col gelo la pioggia diventa neve
  if (WEATHER.kind === 'snow' && WEATHER.temp > 4) WEATHER.kind = 'rain';
  else if ((WEATHER.kind === 'rain' || WEATHER.kind === 'storm') && WEATHER.temp < 0) WEATHER.kind = 'snow';
  else if (climOf() === 'polar' && !se.summer && WEATHER.kind === 'cloudy' && rand() < 0.5) WEATHER.kind = 'snow';
};
// consumo di corrente: minimo tra 18 e 22 gradi, doppio a -18, più alto col caldo (aria condizionata). In 05 si divide per 1,2 per non cambiare la media delle città già fatte.
function tempPowMul() { const t = WEATHER.temp; return t < 18 ? Math.min(2.2, 1 + (18 - t) / 36) : t > 22 ? Math.min(1.8, 1 + (t - 22) / 20) : 1; }
