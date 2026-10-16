/* Dibuja la línea de tiempo del macrociclo (SVG) y los textos de apoyo. */
(function (g) {
  "use strict";
  const F = g.AKC.F, M = g.AKC.M;
  const NS = "http://www.w3.org/2000/svg";

  // Colores sólidos y de alto contraste (texto siempre legible)
  const C = {
    PREPARATORIO: ["#0f6b45", "#fff"], PRECOMPETITIVO: ["#b45309", "#fff"], COMPETITIVO: ["#b91c1c", "#fff"], TRANSITORIO: ["#475569", "#fff"],
    etapa: { "PREPARACION GENERAL": ["#e2e8f0", "#0f172a", "General"], "PREPARACION ESPECIFICA": ["#94a3b8", "#0f172a", "Específica"],
      PRECOMPETITIVO: ["#fcd34d", "#0f172a", "Precompetitiva"], COMPETITIVO: ["#fca5a5", "#0f172a", "Competitiva"], TRANSITORIO: ["#cbd5e1", "#0f172a", "Transitoria"] },
    meso: { BASE: ["#dbeafe", "#0f172a"], DESARROLLADOR: ["#93c5fd", "#0f172a"], ESTABILIZADOR: ["#3b82f6", "#fff"],
      PRECOMPETITIVO: ["#fcd34d", "#0f172a"], COMPETITIVO: ["#fca5a5", "#0f172a"], TRANSITORIO: ["#cbd5e1", "#0f172a"] },
    tec: { ALTO: ["#1d4ed8", "#fff"], MEDIO: ["#60a5fa", "#0f172a"], BAJO: ["#dbeafe", "#0f172a"] },
    fza: { "60 - 80 %": ["#c2410c", "#fff"], "45 - 60 %": ["#fb923c", "#0f172a"], "35 - 45 %": ["#ffedd5", "#0f172a"] },
    trab: { "Elementos sueltos": ["#dcfce7", "#14532d", "SUE"], "Enlaces": ["#86efac", "#14532d", "ENL"], "Medias rutinas": ["#22c55e", "#052e16", "½ R"],
      "Rutinas completas": ["#15803d", "#fff", "RC"], "Recuperación y pulimiento": ["#e2e8f0", "#0f172a", "REC"] },
    nuevos: { Aprendizaje: ["#7c3aed", "#fff", "APR"], Desarrollo: ["#c4b5fd", "#1e1b4b", "DES"], Dominados: ["#ede9fe", "#1e1b4b", "DOM"] },
    comp: "#b91c1c", evt: "#0369a1", desc: "#64748b", hoy: "#ca8a04", linea: "#cbd5e1", tinta: "#0f172a", tinta2: "#475569"
  };
  const MICRO = [[/GRAL|GENERAL/, "PG", "#ffffff", "#0f172a"], [/ESPECIF/, "PE", "#f1f5f9", "#0f172a"], [/DESARROLL/, "BD", "#bbf7d0", "#0f172a"],
    [/ESTABILIZ/, "BE", "#86efac", "#0f172a"], [/CHOQUE/, "CH", "#1e293b", "#fff"], [/PRECOMPET/, "PC", "#f59e0b", "#0f172a"],
    [/COMPETIT/, "C", "#dc2626", "#fff"], [/DESCANSO/, "DA", "#94a3b8", "#0f172a"], [/TRANSIT/, "T", "#94a3b8", "#0f172a"]];
  const MICRO_NOMBRE = { PG: "Preparación general", PE: "Preparación específica", BD: "Básico desarrollador", BE: "Básico estabilizador", CH: "Choque", PC: "Precompetitivo", C: "Competitivo", DA: "Descanso absoluto", T: "Transitorio" };
  const micro = t => { for (const [re, a, f, tx] of MICRO) if (re.test(t)) return { a, f, tx }; return { a: (t || "").slice(0, 2), f: "#fff", tx: "#0f172a" }; };
  const SIGLAS = new Set(["CDI", "BKA", "GUEM", "FMG", "CONADE", "CODE", "ON", "AKC", "FIG", "UPAF"]), MENORES = new Set(["de", "del", "la", "en", "y", "para", "los", "las", "a", "el"]);
  const cap = t => String(t || "").split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w)) return w; const up = w.toUpperCase(), lo = w.toLowerCase();
    if (SIGLAS.has(up.replace(/[^A-Z]/g, ""))) return up;
    if (i > 0 && MENORES.has(lo)) return lo;
    return lo.charAt(0).toUpperCase() + lo.slice(1);
  }).join("");

  const ROWS = [
    ["mes", "", 30], ["sem", "Semana", 24], ["periodo", "Periodo", 38], ["etapa", "Etapa", 32], ["meso", "Mesociclo", 32],
    ["micro", "Microciclo", 32], ["tec", "Técnico", 32], ["fza", "Fuerza", 32], ["trab", "Trabajo técnico", 32], ["nuevos", "Elementos nuevos", 32], ["ev", "Competencias", 30]
  ];

  // Etapa técnica y elementos nuevos por semana (para cualquier modelo)
  function extras(m) {
    const N = m.weeks.length, comp = new Set();
    for (const e of m.events) if (e.type === "competencia" && !/CONTROL|INTERNO/.test(e.title))
      for (let s = e.start; s <= e.end; s = F.sumar(s, 1)) comp.add(Math.floor(F.dif(m.start, s) / 7));
    return m.weeks.map((w, i) => {
      const texts = m.days.slice(i * 7, i * 7 + 7).flatMap(d => M.partes(d)).filter(p => !M.tipoDe(p)).map(p => p.desc);
      let trab = ""; for (const t of texts) { trab = M.etapaTecnica(t); if (trab) break; }
      let k = Infinity; for (let j = i; j < N; j++) if (comp.has(j)) { k = j - i; break; }
      const nuevos = /DESCANSO|TRANSIT/.test(w.micro) ? "" : k <= 2 ? "Dominados" : k <= 4 ? "Desarrollo" : "Aprendizaje";
      return { trab, nuevos, k };
    });
  }

  function el(tag, a, p, txt) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; }

  // Dibuja semanas [w0, w1) en un <svg>. Devuelve el svg.
  function timeline(m, w0, w1, opt = {}) {
    const CW = opt.colW || 46, LW = opt.labelW || 0;
    const ex = opt.extras || extras(m);
    let y = 0; const Y = {}; for (const [k, , h] of ROWS) { Y[k] = [y, h]; y += h; } const H = y + 4;
    const nW = w1 - w0, W = LW + nW * CW;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: opt.fit ? "100%" : W, ...(opt.fit ? {} : { height: H }), class: "tl-svg", role: "img", "aria-label": "Línea de tiempo por semana", "font-family": "Barlow Condensed, Arial Narrow, Arial, sans-serif" });
    const defs = el("defs", {}, svg);
    const pat = el("pattern", { id: "rayas" + w0, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 6, height: 6, fill: "#e2e8f0" }, pat); el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "#94a3b8", "stroke-width": 3 }, pat);
    const x = w => LW + (w - w0) * CW;
    const xd = s => LW + (F.dif(m.start, s) / 7 - w0) * CW;
    const g0 = el("g", {}, svg);
    const caja = (row, x1, x2, fill, txt, color, size = 15) => {
      const [yy, h] = Y[row]; const ww = Math.max(2, x2 - x1 - 3);
      el("rect", { x: x1 + 1.5, y: yy + 2, width: ww, height: h - 4, rx: 4, fill, stroke: fill === "#ffffff" ? C.linea : "none" }, g0);
      if (!txt) return;
      if (ww > 520) { const n = Math.floor(ww / 460) + 1; for (let k = 0; k < n; k++) el("text", { x: x1 + 1.5 + ww * (k + 0.5) / n, y: yy + h / 2 + size * 0.36, "text-anchor": "middle", fill: color, "font-size": size, "font-weight": 700 }, g0, txt); return; }
      const t = txt.length * size * 0.5 + 10 < ww ? txt : (ww > 34 ? txt.slice(0, Math.max(2, Math.floor((ww - 8) / (size * 0.5)) - 1)) + "." : "");
      if (t) el("text", { x: x1 + 1.5 + ww / 2, y: yy + h / 2 + size * 0.36, "text-anchor": "middle", fill: color, "font-size": size, "font-weight": 700 }, g0, t);
    };
    // etiquetas de filas
    if (LW) for (const [k, t] of ROWS) if (t) el("text", { x: 4, y: Y[k][0] + Y[k][1] / 2 + 5, fill: C.tinta2, "font-size": 13, "font-weight": 700, "letter-spacing": ".04em" }, g0, t.toUpperCase());
    // meses
    let mesAct = null;
    for (let d = w0 * 7; d < w1 * 7 && d < m.days.length; d++) {
      const s = m.days[d].date, mm = s.slice(0, 7);
      if (mm !== mesAct) { mesAct = mm; const xx = LW + (d / 7 - w0) * CW;
        el("line", { x1: xx, x2: xx, y1: 4, y2: Y.sem[0] + Y.sem[1], stroke: C.tinta2, "stroke-width": 1.5 }, g0);
        el("text", { x: xx + 5, y: 21, fill: C.tinta, "font-size": 17, "font-weight": 700, "letter-spacing": ".06em" }, g0, F.MESES[+mm.slice(5) - 1].slice(0, 3) + " " + mm.slice(2, 4)); }
    }
    for (let w = w0; w < w1; w++) el("text", { x: x(w) + CW / 2, y: Y.sem[0] + 17, "text-anchor": "middle", fill: C.tinta2, "font-size": 13, "font-weight": 600 }, g0, m.weeks[w].n);
    // bandas
    const clip = (b, row, col) => { const a = Math.max(xd(b.start), x(w0)), z = Math.min(xd(F.sumar(b.end, 1)), x(w1)); if (z > a) caja(row, a, z, col[0], col[2] || cap(b.label), col[1]); };
    m.bands.periodo.forEach(b => clip(b, "periodo", C[b.label] || C.TRANSITORIO));
    m.bands.etapa.forEach(b => clip(b, "etapa", C.etapa[b.label] || ["#e2e8f0", "#0f172a"]));
    m.bands.mesociclo.forEach(b => clip(b, "meso", (C.meso[b.label] || ["#e2e8f0", "#0f172a"]).concat(b.label === "TRANSITORIO" ? ["Transit."] : [])));
    for (let w = w0; w < w1; w++) {
      const wk = m.weeks[w], mi = micro(wk.micro), e = ex[w];
      caja("micro", x(w), x(w + 1), mi.f, mi.a, mi.tx);
      if (wk.split) { caja("tec", x(w), x(w + 1), `url(#rayas${w0})`, "±", C.tinta); caja("fza", x(w), x(w + 1), `url(#rayas${w0})`, "±", C.tinta); }
      else {
        const t = C.tec[wk.tec], f = C.fza[wk.fza];
        caja("tec", x(w), x(w + 1), t ? t[0] : "#fff", wk.tec ? wk.tec.charAt(0) + wk.tec.slice(1).toLowerCase() : "", t ? t[1] : C.tinta, 13);
        caja("fza", x(w), x(w + 1), f ? f[0] : "#fff", wk.fza ? wk.fza.replace(/\s|%/g, "").replace("-", "–") : "", f ? f[1] : C.tinta, 13);
      }
      const tb = C.trab[e.trab]; caja("trab", x(w), x(w + 1), tb ? tb[0] : "#ffffff", tb ? tb[2] : "", tb ? tb[1] : C.tinta, 13);
      const nv = C.nuevos[e.nuevos]; caja("nuevos", x(w), x(w + 1), nv ? nv[0] : "#ffffff", nv ? nv[2] : "", nv ? nv[1] : C.tinta, 13);
    }
    // competencias, eventos y descansos
    const [ey, eh] = Y.ev;
    for (const e of m.events) {
      const a = Math.max(xd(e.start), x(w0)), z = Math.min(xd(F.sumar(e.end, 1)), x(w1)); if (z <= a) continue;
      const fill = e.type === "competencia" ? C.comp : e.type === "evento" ? C.evt : C.desc;
      const arriba = e.type === "competencia", yy = arriba ? ey + 2 : ey + 17, hh = arriba ? 14 : 11, ww = Math.max(8, z - a - 1);
      el("rect", { x: a, y: yy, width: ww, height: hh, rx: 3, fill }, g0);
      if (arriba && ww >= 12) el("text", { x: a + ww / 2, y: yy + 11.5, "text-anchor": "middle", "font-size": 11.5, "font-weight": 700, fill: "#fff" }, g0, "C");
    }
    // hoy
    const hoy = F.hoy(), hx = xd(hoy);
    if (opt.hoy !== false && hoy >= m.start && hoy <= m.end && hx >= x(w0) && hx <= x(w1)) {
      el("line", { x1: hx, x2: hx, y1: Y.sem[0], y2: H, stroke: C.hoy, "stroke-width": 3 }, g0);
      el("rect", { x: hx - 20, y: Y.sem[0] - 1, width: 40, height: 18, rx: 4, fill: C.hoy }, g0);
      el("text", { x: hx, y: Y.sem[0] + 13, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#fff" }, g0, "HOY");
    }
    svg._geo = { CW, LW, w0, w1, H, Y };
    return svg;
  }

  function leyendaHTML() {
    const sw = (f, t, tx = "#0f172a") => `<span class="lg"><i style="background:${f};color:${tx}"></i>${t}</span>`;
    const tec = Object.entries(C.tec).map(([k, v]) => sw(v[0], cap(k))).join("");
    const fza = Object.entries(C.fza).map(([k, v]) => sw(v[0], k)).join("");
    const trab = Object.entries(C.trab).map(([k, v]) => sw(v[0], `<b>${v[2]}</b> ${k}`)).join("");
    const nv = [["Aprendizaje", "APR", "aprende elementos nuevos"], ["Desarrollo", "DES", "los perfecciona"], ["Dominados", "DOM", "compite solo con lo dominado"]]
      .map(([k, a, t]) => sw(C.nuevos[k][0], `<b>${a}</b> ${t}`)).join("");
    const mic = MICRO.map(([, a, f]) => sw(f, `<b>${a}</b> ${MICRO_NOMBRE[a]}`)).join("");
    return `<div class="lg-grupo"><b>Técnico</b>${tec}</div><div class="lg-grupo"><b>Fuerza</b>${fza}</div>
      <div class="lg-grupo"><b>Trabajo técnico</b>${trab}</div><div class="lg-grupo"><b>Elementos nuevos</b>${nv}</div>
      <div class="lg-grupo"><b>Microciclo</b>${mic}</div>
      <div class="lg-grupo"><b>Fila de competencias</b>${sw(C.comp, "Competencia")}${sw(C.evt, "Evento")}${sw(C.desc, "Descanso o vacaciones")}${sw(C.hoy, "Hoy")}</div>
      <div class="lg-grupo"><b>Unidad de entrenamiento (letra de cada día)</b><span class="lg"><b>CH</b> Choque</span><span class="lg"><b>O</b> Ordinaria</span><span class="lg"><b>R</b> Recuperación</span><span class="lg"><b>D</b> Descanso</span><span class="lg"><b>C</b> Competencia</span><span class="lg"><b>E</b> Evento</span><span class="lg"><b>V</b> Vacaciones</span><span class="lg"><b>C/E</b> dos cosas el mismo día</span></div>`;
  }

  g.AKC = Object.assign(g.AKC || {}, { V: { timeline, extras, leyendaHTML, cap, micro, MICRO_NOMBRE, C, ROWS } });
})(typeof window !== "undefined" ? window : globalThis);
