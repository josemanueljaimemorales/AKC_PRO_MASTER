/* Escribe un modelo de macrociclo en Excel usando el MACRO anterior como plantilla de formato
 * (mismas filas, colores, bordes y tamaños). Requiere ExcelJS. */
(function (g) {
  "use strict";
  const F = g.AKC.F, M = g.AKC.M;
  const clon = o => JSON.parse(JSON.stringify(o || {}));
  const letra = n => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  const colNum = l => { let n = 0; for (const ch of l) n = n * 26 + ch.charCodeAt(0) - 64; return n; };
  const merges = ws => ((ws.model && ws.model.merges) || []).map(s => { const m = s.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/); return m && { s, c1: colNum(m[1]), r1: +m[2], c2: colNum(m[3]), r2: +m[4] }; }).filter(Boolean);
  const plano = v => (v == null ? "" : typeof v === "object" ? (v.richText ? null : String(v.result ?? v.text ?? "")) : String(v)).trim?.() ?? "";

  // --- Estilos de la plantilla, por tipo de celda ---
  function estilos(ws) {
    const S = { _desc: {}, mes: [], dia: [], dow: {}, periodo: {}, etapa: {}, meso: {}, semana: [], micro: {}, unit: {}, desc: {}, niv: {}, sep: null, def: {} };
    const ms = merges(ws), top = {};
    for (const m of ms) for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) top[r + "," + c] = [m.r1, m.c1];
    const st = (r, c) => clon(ws.getCell(r, c).style);
    const tl = (r, c) => top[r + "," + c] || [r, c];
    const v = (r, c) => { const [a, b] = tl(r, c); return plano(ws.getCell(a, b).value); };
    let mesPrev = null, mesIdx = -1, semIdx = -1, semPrev = null;
    for (let c = 2; c <= ws.columnCount; c++) {
      const dia = Number(v(2, c)); if (!(dia >= 1 && dia <= 31)) continue;
      const mk = tl(1, c).join(); if (mk !== mesPrev) { mesPrev = mk; mesIdx++; }
      const p = mesIdx % 2;
      if (!S.mes[p]) S.mes[p] = st(...tl(1, c));
      if (!S.dia[p]) S.dia[p] = st(2, c);
      const dl = (v(3, c) || "").toUpperCase(); const pos = (c - 2) % 7;   // la hoja empieza en lunes
      if (!S.dow[pos]) S.dow[pos] = st(3, c);
      for (const [r, k] of [[4, "periodo"], [5, "etapa"], [6, "meso"], [8, "micro"]]) { const t = v(r, c).toUpperCase(); if (t && !S[k][t]) S[k][t] = st(...tl(r, c)); if (!S.def[k]) S.def[k] = st(...tl(r, c)); }
      const sk = tl(7, c).join(); if (sk !== semPrev) { semPrev = sk; semIdx++; if (!S.semana[semIdx % 2]) S.semana[semIdx % 2] = st(...tl(7, c)); }
      const u = v(9, c).toUpperCase().replace(/\s/g, ""); if (u && !S.unit[u]) S.unit[u] = st(9, c);
      // descripción (solo celdas de texto simple)
      const [dr, dc] = tl(10, c), raw = ws.getCell(dr, dc).value;
      if (typeof raw === "string" && raw.trim()) {
        const t = raw.toUpperCase(), tipo = /VACACION/.test(t) ? "vacaciones" : /DESCANS|PUENTE/.test(t) ? "descanso" : u === "C" ? "competencia" : u === "E" ? "evento" : "normal";
        if (dc === c) (S._desc[tipo] = S._desc[tipo] || []).push(st(dr, dc));
      }
      for (const r of [11, 12, 13, 15, 16, 17]) {
        const t = v(r, c).toUpperCase(), lleno = /^(ALTO|MEDIO|BAJO|\d+ - \d+ %)$/.test(t);
        S.niv[r] = S.niv[r] || {};
        if (lleno && !S.niv[r].v) S.niv[r].v = st(...tl(r, c));
        if (!t && !S.niv[r].e) S.niv[r].e = st(...tl(r, c));
        if (/PARTICIP/.test(t) && !S.niv[r].n) S.niv[r].n = st(...tl(r, c));
      }
      if (!S.sep) S.sep = st(14, c);
    }
    // Para la descripción se usa el formato más común de cada tipo (hay celdas con formato suelto)
    for (const [t, list] of Object.entries(S._desc)) {
      const cuenta = {}; let mejor = null, max = 0;
      for (const e of list) { const k = JSON.stringify(e); cuenta[k] = (cuenta[k] || 0) + 1; if (cuenta[k] > max) { max = cuenta[k]; mejor = e; } }
      S.desc[t] = mejor;
    }
    S.desc.normal = S.desc.normal || st(10, 2);
    return S;
  }
  const porClave = (dic, t, def) => {
    if (dic[t]) return dic[t];
    const k = Object.keys(dic).find(x => x.startsWith(t.slice(0, 8)) || t.startsWith(x.slice(0, 8)));
    return k ? dic[k] : def;
  };
  const estiloMicro = (S, t) => {
    if (S.micro[t]) return S.micro[t];
    const alias = [[/^COMPETITIV/, "COMPETITIVO"], [/^PRECOMPETITIV/, "PRECOMPETITIVO"], [/ESTABILIZ/, "BASICO ESTABILIZADOR"], [/DESARROLL/, "BAS DESARROLLADOR"]];
    for (const [re, k] of alias) if (re.test(t)) { const hit = Object.keys(S.micro).find(x => re.test(x)); if (hit) return S.micro[hit]; }
    return porClave(S.micro, t, S.def.micro);
  };

  async function escribirExcel(m, plantilla) {
    const ExcelJS = g.ExcelJS;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(plantilla);
    const ws = wb.getWorksheet("macro gral") || wb.worksheets[0];
    const S = estilos(ws);
    const anchoDia = ws.getColumn(3).width || 13;
    const viejoMax = ws.columnCount;
    // Limpiar filas 1-17 desde la columna B
    for (const mg of merges(ws)) if (mg.c1 >= 2 && mg.r1 <= 17) ws.unMergeCells(mg.s);
    const ND = m.days.length, ult = ND + 1;
    for (let r = 1; r <= 17; r++) for (let c = 2; c <= Math.max(viejoMax, ult); c++) { const cell = ws.getCell(r, c); cell.value = null; cell.style = {}; }
    for (let c = 2; c <= ult; c++) ws.getColumn(c).width = anchoDia;
    for (let c = ult + 1; c <= viejoMax; c++) ws.getColumn(c).width = 9;
    const col = iso => 2 + F.dif(m.start, iso);
    const bloque = (r1, c1, r2, c2, valor, estilo) => {
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ws.getCell(r, c).style = clon(estilo);
      if (r2 > r1 || c2 > c1) ws.mergeCells(r1, c1, r2, c2);
      ws.getCell(r1, c1).value = valor === "" ? null : valor;
    };
    // Fila 1-3: mes, día, día de la semana
    let i = 0, mesIdx = 0;
    while (i < ND) {
      const mes = m.days[i].date.slice(0, 7); let j = i; while (j + 1 < ND && m.days[j + 1].date.slice(0, 7) === mes) j++;
      bloque(1, 2 + i, 1, 2 + j, F.MESES[+mes.slice(5) - 1], S.mes[mesIdx % 2] || S.mes[0]);
      for (let k = i; k <= j; k++) {
        const d = m.days[k].date;
        bloque(2, 2 + k, 2, 2 + k, +d.slice(8), S.dia[mesIdx % 2] || S.dia[0]);
        const pos = (F.diaSemana(d) + 6) % 7;
        bloque(3, 2 + k, 3, 2 + k, F.LETRA_DIA[F.diaSemana(d)], S.dow[pos] || S.dow[0]);
      }
      mesIdx++; i = j + 1;
    }
    // Filas 4-6: periodo, etapa, mesociclo
    for (const [r, k, dic] of [[4, "periodo", "periodo"], [5, "etapa", "etapa"], [6, "mesociclo", "meso"]])
      for (const b of m.bands[k]) bloque(r, col(b.start), r, col(b.end), b.label, porClave(S[dic], b.label, S.def[dic]));
    // Filas 7-8 y niveles por semana
    const filasTec = { ALTO: 11, MEDIO: 12, BAJO: 13 }, filasFza = { "60 - 80 %": 15, "45 - 60 %": 16, "35 - 45 %": 17 };
    let w = 0;
    while (w < m.weeks.length) {
      const wk = m.weeks[w], c1 = 2 + w * 7, c2 = Math.min(ult, c1 + 6);
      bloque(7, c1, 7, c2, wk.n, S.semana[w % 2] || S.semana[0]);
      bloque(8, c1, 8, c2, wk.micro, estiloMicro(S, wk.micro));
      if (wk.split) {                       // semanas que dependen de ir o no al selectivo (seguidas = un bloque)
        let w2 = w; while (w2 + 1 < m.weeks.length && m.weeks[w2 + 1].split) { w2++; bloque(7, 2 + w2 * 7, 7, 2 + w2 * 7 + 6, m.weeks[w2].n, S.semana[w2 % 2] || S.semana[0]); bloque(8, 2 + w2 * 7, 8, 2 + w2 * 7 + 6, m.weeks[w2].micro, estiloMicro(S, m.weeks[w2].micro)); }
        const e2 = Math.min(ult, 2 + w2 * 7 + 6);
        bloque(11, c1, 11, e2, "", S.niv[11].e);
        bloque(12, c1, 12, e2, M.SPLIT.tecMedio, S.niv[12].n || S.niv[12].v);
        bloque(13, c1, 13, e2, M.SPLIT.tecBajo, S.niv[13].n || S.niv[13].v);
        bloque(15, c1, 15, e2, "", S.niv[15].e);
        bloque(16, c1, 16, e2, M.SPLIT.fzaMedio, S.niv[16].n || S.niv[16].v);
        bloque(17, c1, 17, e2, M.SPLIT.fzaBajo, S.niv[17].n || S.niv[17].v);
        w = w2 + 1; continue;
      }
      for (const r of [11, 12, 13]) bloque(r, c1, r, c2, filasTec[wk.tec] === r ? wk.tec : "", filasTec[wk.tec] === r ? S.niv[r].v : S.niv[r].e);
      for (const r of [15, 16, 17]) bloque(r, c1, r, c2, filasFza[wk.fza] === r ? wk.fza : "", filasFza[wk.fza] === r ? S.niv[r].v : S.niv[r].e);
      w++;
    }
    for (let c = 2; c <= ult; c++) ws.getCell(14, c).style = clon(S.sep);
    // Fila 9: unidad; fila 10: descripción (días seguidos con el mismo texto = una celda)
    m.days.forEach((d, k) => {
      const u = d.unit, e = S.unit[u] || S.unit[u.split("/")[0]] || S.unit.O;
      bloque(9, 2 + k, 9, 2 + k, u, e);
    });
    const tipoDesc = d => {
      const ps = M.partes(d), t = ps.map(p => M.tipoDe(p));
      if (t.includes("competencia")) return "competencia";
      if (ps.some(p => /VACACION/i.test(p.desc))) return "vacaciones";
      if (t.includes("evento")) return "evento";
      if (t.includes("descanso")) return "descanso";
      return "normal";
    };
    i = 0;
    while (i < ND) {
      let j = i; while (j + 1 < ND && m.days[j + 1].desc === m.days[i].desc) j++;
      const t = tipoDesc(m.days[i]);
      bloque(10, 2 + i, 10, 2 + j, m.days[i].desc, S.desc[t] || S.desc.normal);
      i = j + 1;
    }
    // Área de impresión
    ws.pageSetup.printArea = `A1:${letra(ult)}17`;          // el resto de la configuración de impresión se queda como en la plantilla

    // Hoja1: resumen MES / DÍA / DESCRIPCION
    const h = wb.getWorksheet("Hoja1");
    if (h) {
      const sA = clon(h.getCell(2, 1).style), sB = clon(h.getCell(2, 2).style), sC = clon(h.getCell(2, 3).style);
      for (const mg of merges(h)) if (mg.r1 >= 2) h.unMergeCells(mg.s);
      if (h.rowCount > 1) h.spliceRows(2, h.rowCount - 1);
      let r = 2; i = 0; let mesFila = null, mesActual = null;
      const cerrarMes = hasta => { if (mesFila && hasta > mesFila) h.mergeCells(mesFila, 1, hasta, 1); };
      while (i < ND) {
        let j = i; while (j + 1 < ND && m.days[j + 1].desc === m.days[i].desc) j++;
        const ds = [m.days[i].date, m.days[j].date];
        const filas = ds[0] === ds[1] ? [ds[0]] : ds;
        filas.forEach((d, k) => {
          const mes = d.slice(0, 7);
          if (mes !== mesActual) { cerrarMes(r - 1); mesActual = mes; mesFila = r; h.getCell(r, 1).value = F.MESES[+mes.slice(5) - 1]; }
          h.getCell(r, 1).style = clon(sA); h.getCell(r, 2).style = clon(sB); h.getCell(r, 3).style = clon(sC);
          h.getCell(r, 2).value = +d.slice(8);
          if (k === 0) h.getCell(r, 3).value = m.days[i].desc;
          r++;
        });
        if (filas.length === 2) h.mergeCells(r - 2, 3, r - 1, 3);
        i = j + 1;
      }
      cerrarMes(r - 1);
    }
    return wb.xlsx.writeBuffer();
  }
  function nombreArchivo(m) { const a = +m.start.slice(2, 4); return `MACRO_${String(a).padStart(2, "0")}_${String(a + 1).padStart(2, "0")}.xlsx`; }

  g.AKC = Object.assign(g.AKC || {}, { escribirExcel, nombreArchivo });
})(typeof window !== "undefined" ? window : globalThis);
