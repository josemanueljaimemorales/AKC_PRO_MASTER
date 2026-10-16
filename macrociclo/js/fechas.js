/* Fechas: utilidades en formato ISO (AAAA-MM-DD), sin horas ni zonas horarias. */
(function (g) {
  "use strict";
  const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const LETRA_DIA = ["D","L","M","M","J","V","S"];          // getUTCDay -> letra del MACRO

  const aFecha = s => new Date(s + "T00:00:00Z");
  const aISO = d => d.toISOString().slice(0, 10);
  const sumar = (s, n) => { const d = aFecha(s); d.setUTCDate(d.getUTCDate() + n); return aISO(d); };
  const dif = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 864e5);       // días de a a b
  const diaSemana = s => aFecha(s).getUTCDay();                              // 0 = domingo
  const lunesDe = s => sumar(s, -((diaSemana(s) + 6) % 7));
  const domingoDe = s => sumar(lunesDe(s), 6);
  const hoy = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; };
  const dentro = (s, a, b) => s >= a && s <= b;

  function texto(s, conAnio = true) {
    const d = aFecha(s);
    return `${d.getUTCDate()} ${MESES_CORTO[d.getUTCMonth()]}${conAnio ? " " + d.getUTCFullYear() : ""}`;
  }
  function rango(a, b) {
    if (a === b) return texto(a);
    const da = aFecha(a), db = aFecha(b);
    if (da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth())
      return `${da.getUTCDate()}–${texto(b)}`;
    if (da.getUTCFullYear() === db.getUTCFullYear()) return `${texto(a, false)} – ${texto(b)}`;
    return `${texto(a)} – ${texto(b)}`;
  }

  // Domingo de Pascua (algoritmo de Butcher/Meeus).
  function pascua(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), gg = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - gg + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return `${y}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }
  function nLunes(y, mes, n) {            // n-ésimo lunes del mes (mes 1-12)
    let s = `${y}-${String(mes).padStart(2, "0")}-01`;
    while (diaSemana(s) !== 1) s = sumar(s, 1);
    return sumar(s, 7 * (n - 1));
  }
  // Descansos oficiales en México (art. 74 LFT) y días que suelen ser puente escolar.
  // "porDefecto" = si se propone marcado como descanso en el ciclo nuevo.
  function festivos(desde, hasta) {
    const out = [];
    for (let y = +desde.slice(0, 4); y <= +hasta.slice(0, 4); y++) {
      const p = pascua(y);
      [
        { fecha: `${y}-01-01`, nombre: "AÑO NUEVO", porDefecto: true },
        { fecha: nLunes(y, 2, 1), nombre: "DÍA DE LA CONSTITUCIÓN", porDefecto: false },
        { fecha: nLunes(y, 3, 3), nombre: "NATALICIO DE BENITO JUÁREZ", porDefecto: false },
        { fecha: sumar(p, -3), nombre: "JUEVES SANTO", porDefecto: false },
        { fecha: sumar(p, -2), nombre: "VIERNES SANTO", porDefecto: false },
        { fecha: `${y}-05-01`, nombre: "DÍA DEL TRABAJO", porDefecto: true },
        { fecha: `${y}-09-16`, nombre: "INDEPENDENCIA DE MÉXICO", porDefecto: true },
        { fecha: nLunes(y, 11, 3), nombre: "REVOLUCIÓN MEXICANA", porDefecto: false },
        { fecha: `${y}-12-25`, nombre: "NAVIDAD", porDefecto: true }
      ].forEach(f => { if (dentro(f.fecha, desde, hasta)) out.push(f); });
    }
    return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  g.AKC = Object.assign(g.AKC || {}, {
    F: { MESES, MESES_CORTO, LETRA_DIA, aFecha, aISO, sumar, dif, diaSemana, lunesDe, domingoDe, hoy, dentro, texto, rango, pascua, festivos }
  });
})(typeof window !== "undefined" ? window : globalThis);
