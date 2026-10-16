/* Lee la hoja "macro gral" de un MACRO (ExcelJS) y la convierte al modelo. */
(function (g) {
  "use strict";
  const F = g.AKC.F;
  const MES_NUM = Object.fromEntries(F.MESES.map((m, i) => [m, i + 1]));

  function texto(v) {
    if (v == null) return "";
    if (typeof v === "object") {
      if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join("").trim();
      if ("result" in v) return texto(v.result);
      if ("text" in v) return String(v.text).trim();
      if (v instanceof Date) return String(v.getUTCDate());
    }
    return String(v).trim();
  }
  function colNum(letras) { let n = 0; for (const ch of letras) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
  function rangos(ws) {
    const list = (ws.model && ws.model.merges) || [];
    return list.map(s => {
      const m = s.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/); if (!m) return null;
      return { c1: colNum(m[1]), r1: +m[2], c2: colNum(m[3]), r2: +m[4] };
    }).filter(Boolean);
  }

  function leerMacro(wb) {
    const ws = wb.getWorksheet("macro gral") || wb.worksheets[0];
    if (!ws) throw new Error('El archivo no tiene la hoja "macro gral".');
    const merges = rangos(ws);
    const dueño = {};                                  // "r,c" -> [r,c] de la celda superior izquierda
    for (const m of merges) for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) dueño[r + "," + c] = [m.r1, m.c1];
    const val = (r, c) => { const k = dueño[r + "," + c] || [r, c]; return texto(ws.getCell(k[0], k[1]).value); };
    const clave = (r, c) => (dueño[r + "," + c] || [r, c]).join(",");

    // Columnas de días: fila 2 con número de día y fila 1 con un mes.
    const cols = [];
    for (let c = 2; c <= ws.columnCount; c++) {
      const dia = Number(val(2, c)), mes = MES_NUM[val(1, c).toUpperCase()];
      if (mes && dia >= 1 && dia <= 31) cols.push({ c, dia, mes, dow: val(3, c).toUpperCase().charAt(0) });
    }
    if (!cols.length) throw new Error("No encontré las fechas (filas MES y DÍA) en la hoja.");
    // Año de inicio: el que coincide con los días de la semana de la fila 3.
    const base = new Date().getFullYear();
    let anio = null;
    for (const y of [base, base - 1, base + 1, base - 2, base + 2, base - 3, base + 3]) {
      let yy = y, prev = 0, ok = true;
      for (const x of cols.slice(0, 21)) {
        if (prev && x.mes < prev) yy++; prev = x.mes;
        const iso = `${yy}-${String(x.mes).padStart(2, "0")}-${String(x.dia).padStart(2, "0")}`;
        if (x.dow && F.LETRA_DIA[F.diaSemana(iso)] !== x.dow && !(x.dow === "X" && F.diaSemana(iso) === 3)) { ok = false; break; }
      }
      if (ok) { anio = y; break; }
    }
    if (anio == null) anio = base;
    let yy = anio, prev = 0;
    for (const x of cols) {
      if (prev && x.mes < prev) yy++; prev = x.mes;
      x.date = `${yy}-${String(x.mes).padStart(2, "0")}-${String(x.dia).padStart(2, "0")}`;
    }

    const bloques = r => {
      const out = []; let cur = null;
      for (const x of cols) {
        const k = clave(r, x.c), v = val(r, x.c);
        if (cur && cur.k === k) { cur.end = x.date; continue; }
        if (cur && cur.label) out.push({ label: cur.label, start: cur.start, end: cur.end });
        cur = { k, label: v.toUpperCase(), start: x.date, end: x.date };
      }
      if (cur && cur.label) out.push({ label: cur.label, start: cur.start, end: cur.end });
      return out;
    };
    const days = cols.map(x => ({ date: x.date, unit: val(9, x.c).toUpperCase(), desc: val(10, x.c) }));
    const weeks = [];
    for (let i = 0; i < cols.length; i += 7) {
      const c = cols[i].c;
      const nivel = rs => { for (const [r, n] of rs) { const v = val(r, c).toUpperCase(); if (v === n || v.replace(/\s/g, "") === n.replace(/\s/g, "")) return n; } return null; };
      const tec = nivel([[11, "ALTO"], [12, "MEDIO"], [13, "BAJO"]]);
      const fza = nivel([[15, "60 - 80 %"], [16, "45 - 60 %"], [17, "35 - 45 %"]]);
      const split = !tec && /PARTICIP/i.test(val(12, c) + val(13, c));
      weeks.push({ n: Number(val(7, c)) || weeks.length, start: cols[i].date, micro: val(8, c).toUpperCase(), tec, fza, split });
    }
    const m = {
      start: cols[0].date, end: cols[cols.length - 1].date, days, weeks,
      bands: { periodo: bloques(4), etapa: bloques(5), mesociclo: bloques(6) }
    };
    m.events = g.AKC.M.eventos(m);
    return m;
  }

  g.AKC = Object.assign(g.AKC || {}, { leerMacro, textoCelda: texto });
})(typeof window !== "undefined" ? window : globalThis);
