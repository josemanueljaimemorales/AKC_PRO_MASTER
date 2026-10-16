/* Generador de macrociclos.
 * proponer(anterior, inicio?, fin?)  -> datos editables para el ciclo nuevo (competencias estimadas, etc.)
 * generar(datos)                     -> modelo completo del ciclo nuevo
 *
 * Reglas (criterios de Manu + periodización clásica: Matveyev, Platonov, Bompa, Issurin, Arkaev–Suchilin):
 *  - Periodos: Preparatorio hasta la semana de la 1a competencia clasificatoria; Precompetitivo hasta
 *    2 semanas antes de la 1a competencia principal; Competitivo hasta la última principal; Transitorio al final.
 *  - Etapas: pendular General/Específica (bloques de 2 y luego 3 semanas) en el Preparatorio.
 *  - Mesociclos: Base / Desarrollador / Estabilizador en el Preparatorio; en temporada cada mesociclo cierra
 *    con su competencia.
 *  - Técnico y fuerza: se llega a competir con técnico ALTO y fuerza 35-45 %, con progresión
 *    (-2 sem: 60-80 %, -1 sem: 45-60 %). Después de competir: recuperación y, si la siguiente está a 4 semanas
 *    o más, recarga de fuerza (efecto residual de la fuerza ≈ 30 días).
 *  - Semana tipo fija: L básicos (CH), Ma y Mi 3 aparatos (O), J carga baja + anillos + elementos rojos (R),
 *    V salidas (O), S aparatos complejos: piso, paralelas, fija, arzón (CH), D descanso.
 */
(function (g) {
  "use strict";
  const F = g.AKC.F;
  const SEMANA_TIPO = ["CH", "O", "O", "R", "O", "CH", "D"];          // lunes a domingo
  const SEMANA_TIPO_TEXTO = [
    ["Lunes", "CH", "Básicos, proporcionales al nivel de cada atleta"],
    ["Martes", "O", "3 aparatos: desarrollo, aprendizaje y reafirmación según la etapa"],
    ["Miércoles", "O", "3 aparatos: desarrollo, aprendizaje y reafirmación según la etapa"],
    ["Jueves", "R", "Carga baja: fortalecimiento específico de anillos y elementos en rojo o con complicaciones"],
    ["Viernes", "O", "Salidas"],
    ["Sábado", "CH", "Aparatos más complejos: piso, paralelas, barra fija y arzón"],
    ["Domingo", "D", "Descanso"]
  ];
  const TIPOS = { control: "Control o individual (no cambia cargas del equipo)", preparacion: "Preparación / fogueo", clasificatoria: "Clasificatoria", principal: "Principal" };

  function adivinarTipo(nombre) {
    const t = nombre.toUpperCase();
    if (/CONTROL|INTERNO|FOGUEO INTERNO/.test(t)) return "control";
    if (/SELECTIVO|CLASIFICATORI/.test(t)) return "clasificatoria";
    if (/NACIONAL|CONADE|OLIMPIADA|JUEGOS NACIONALES/.test(t)) return "principal";
    if (/ESTATAL|BKA|ROMERO|CORRAL|REGIONAL|MACRO ?REGIONAL/.test(t)) return "clasificatoria";
    return "preparacion";
  }
  function subirAnio(nombre, n) {
    return nombre.replace(/\b(20\d{2})\b/g, y => String(+y + n)).replace(/\b(\d{2})\s*$/, y => String(+y + n).padStart(2, "0"));
  }
  const limpio = s => String(s || "").trim().toUpperCase().replace(/\s+/g, " ");

  // ---------- Propuesta a partir del ciclo anterior ----------
  function proponer(ant, inicio, fin) {
    const ini = F.lunesDe(inicio || F.sumar(ant.start, 364));
    const corr = F.dif(ant.start, ini);                            // múltiplo de 7: mismo día de la semana
    const fn = F.domingoDe(fin || F.sumar(ant.end, corr));
    const anios = Math.round(corr / 365);
    const calendario = s => { const y = +s.slice(0, 4) + anios; let d = `${y}${s.slice(4)}`; if (d.endsWith("-02-29")) d = `${y}-02-28`; return d; };
    const dentro = e => e.start >= ini && e.start <= fn;
    const evs = ant.events || g.AKC.M.eventos(ant);
    const tras = (e, modo) => ({ start: modo === "cal" ? calendario(e.start) : F.sumar(e.start, corr), end: modo === "cal" ? calendario(e.end) : F.sumar(e.end, corr) });
    const conDesc = new Set(evs.filter(e => /DESCANSO PARA PARTICIPANTES DE /.test(e.title)).map(e => e.title.replace(/.*PARTICIPANTES DE /, "")));
    const competencias = evs.filter(e => e.type === "competencia").map(e => {
      const t = tras(e);
      // Si en el ciclo anterior se encimó con un evento de equipo (campamento), seguramente fue individual
      const individual = evs.some(x => x.type === "evento" && x.start <= e.end && x.end >= e.start && !/HALLOWEEN|POSADA|DIA DEL NI/.test(x.title));
      return { nombre: subirAnio(e.title, anios), inicio: t.start, fin: t.end, tipo: individual ? "control" : adivinarTipo(e.title), descansoDespues: conDesc.has(e.title), estimada: true, antes: `${F.rango(e.start, e.end)}` };
    }).filter(x => dentro({ start: x.inicio }));
    const eventos = evs.filter(e => e.type === "evento").map(e => { const t = tras(e); return { nombre: subirAnio(e.title, anios), inicio: t.start, fin: t.end, estimada: true }; }).filter(x => dentro({ start: x.inicio }));
    const fest = F.festivos(ini, fn);
    const esFestivo = d => fest.some(f => f.fecha === d);
    const vacaciones = [], descansos = [];
    for (const e of evs.filter(e => e.type === "descanso")) {
      if (/PARTICIPANTES DE/.test(e.title)) continue;
      if (/VACACION/.test(e.title)) { const t = tras(e, "cal"); vacaciones.push({ nombre: "VACACIONES", inicio: t.start, fin: t.end, estimada: true }); continue; }
      const t = /PASIVO/.test(e.title) ? tras(e) : tras(e, "cal");
      if (t.start === t.end && esFestivo(t.start)) continue;      // ya va en festivos
      descansos.push({ nombre: e.title, inicio: t.start, fin: t.end, estimada: true });
    }
    // Un DESCANSO del ciclo anterior en la víspera o en un festivo se propone marcado
    const festivos = fest.map(f => ({ ...f, descansa: f.porDefecto }));
    return {
      inicio: ini, fin: fn, competencias: competencias.sort((a, b) => a.inicio.localeCompare(b.inicio)),
      eventos, vacaciones: vacaciones.filter(dentro2(ini, fn)), descansos: descansos.filter(dentro2(ini, fn)), festivos,
      base: `${ant.start}|${ant.end}`
    };
  }
  const dentro2 = (a, b) => x => x.inicio >= a && x.inicio <= b;

  // ---------- Generación ----------
  function generar(d) {
    const start = F.lunesDe(d.inicio), end = F.domingoDe(d.fin);
    const ND = F.dif(start, end) + 1, N = ND / 7;
    if (N < 12) throw new Error("El ciclo debe durar al menos 12 semanas.");
    const fecha = i => F.sumar(start, i);
    const semDe = s => Math.floor(F.dif(start, s) / 7);
    const comps = (d.competencias || []).filter(c => c.nombre && c.inicio && c.inicio >= start && c.inicio <= end)
      .map(c => ({ ...c, nombre: limpio(c.nombre), fin: c.fin && c.fin >= c.inicio ? c.fin : c.inicio }))
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
    comps.forEach(c => { c.w1 = semDe(c.inicio); c.w2 = Math.min(N - 1, semDe(c.fin)); });
    const pico = comps.filter(c => c.tipo !== "control");          // las de control o individuales no cambian cargas

    // Vacaciones por día y semanas de vacaciones (4 días o más)
    const diaVac = new Set();
    for (const v of d.vacaciones || []) for (let s = v.inicio; s <= (v.fin || v.inicio); s = F.sumar(s, 1)) diaVac.add(s);
    const semVac = new Set();
    for (let w = 0; w < N; w++) { let n = 0; for (let k = 0; k < 7; k++) if (diaVac.has(fecha(w * 7 + k))) n++; if (n >= 4) semVac.add(w); }

    // --- Periodos ---
    const noPrep = pico.filter(c => c.tipo !== "preparacion");
    const princ = comps.filter(c => c.tipo === "principal");
    let P = noPrep.length ? noPrep[0].w1 : Math.round(N * 0.6);
    P = Math.max(Math.min(12, N - 6), Math.min(P, N - 4));
    let C = princ.length ? princ[0].w1 - 2 : Math.round(N * 0.87);
    C = Math.max(P + 1, Math.min(C, N - 2));
    const ult = princ.length ? princ[princ.length - 1] : (noPrep.length ? noPrep[noPrep.length - 1] : null);
    let T = ult ? ult.w2 + 1 : N - 1;
    T = Math.max(C + 1, Math.min(T, N - 1));
    const periodo = w => w < P ? "PREPARATORIO" : w < C ? "PRECOMPETITIVO" : w < T ? "COMPETITIVO" : "TRANSITORIO";

    // --- Semanas con competencia ---
    const compSem = {};                                   // w -> competencias de esa semana
    pico.forEach(c => { for (let w = c.w1; w <= c.w2; w++) (compSem[w] = compSem[w] || []).push(c); });
    const esComp = w => !!compSem[w];
    const proxComp = w => { for (let k = w; k < N; k++) if (esComp(k)) return k - w; return Infinity; };
    const ultComp = w => { for (let k = w; k >= 0; k--) if (esComp(k)) return w - k; return Infinity; };

    // --- Etapas ---
    const etapa = new Array(N);
    { let w = 0, i = 0;
      while (w < P) { const len = i < 3 ? 2 : 3; const lab = i % 2 ? "PREPARACION ESPECIFICA" : "PREPARACION GENERAL";
        for (let k = 0; k < len && w < P; k++, w++) etapa[w] = { lab, id: "e" + i }; i++; }
      if (P >= 2 && etapa[P - 1].id !== etapa[P - 2].id) etapa[P - 1] = etapa[P - 2];   // sin bloque de 1 semana
      const L = C - P; let gen = 0, esp = 0;
      if (L >= 12) { gen = 4; esp = 4; } else if (L >= 6) esp = Math.floor(L / 3);
      for (let w2 = P; w2 < C; w2++) { const k = w2 - P;
        etapa[w2] = k < gen ? { lab: "PREPARACION GENERAL", id: "pg" } : k < gen + esp ? { lab: "PREPARACION ESPECIFICA", id: "pe" } : { lab: "PRECOMPETITIVO", id: "pc" }; }
      for (let w2 = C; w2 < T; w2++) etapa[w2] = { lab: "COMPETITIVO", id: "c" };
      for (let w2 = T; w2 < N; w2++) etapa[w2] = { lab: "TRANSITORIO", id: "t" };
    }

    // --- Mesociclos ---
    const meso = new Array(N);
    { const pat = [[3, "BASE"], [3, "DESARROLLADOR"], [2, "BASE"], [2, "DESARROLLADOR"], [2, "ESTABILIZADOR"]];
      const rep = [[4, "BASE"], [4, "ESTABILIZADOR"], [4, "DESARROLLADOR"], [4, "ESTABILIZADOR"]];
      let w = 0, i = 0, id = 0;
      while (w < P) {
        const [len, lab] = i < pat.length ? pat[i] : rep[(i - pat.length) % rep.length];
        id++;
        for (let k = 0; k < len && w < P; k++, w++) meso[w] = semVac.has(w) ? { lab: "TRANSITORIO", id: "v" + w } : { lab, id: "m" + id };
        i++;
      }
      // vacaciones seguidas = un solo bloque
      for (let w2 = 1; w2 < P; w2++) if (meso[w2].lab === "TRANSITORIO" && meso[w2 - 1].lab === "TRANSITORIO") meso[w2].id = meso[w2 - 1].id;
      // sin bloques de 1 semana al final del preparatorio
      if (P >= 2 && meso[P - 1].id !== meso[P - 2].id && meso[P - 1].lab !== "TRANSITORIO") meso[P - 1] = meso[P - 2];
      // En temporada: cada mesociclo cierra con la semana de una competencia
      const cortes = [];
      for (let w2 = P; w2 < T; w2++) if (esComp(w2) && !esComp(w2 + 1)) cortes.push(w2);
      let ini = P, n = 0;
      const tramos = [];
      for (const c of cortes) { if (c - ini + 1 >= 2) { tramos.push([ini, c]); ini = c + 1; } }
      if (ini < T) { if (T - ini < 2 && tramos.length) tramos[tramos.length - 1][1] = T - 1; else tramos.push([ini, T - 1]); }
      tramos.forEach(([a, b], k) => { for (let w2 = a; w2 <= b; w2++) meso[w2] = { lab: k === 0 && a < C ? "PRECOMPETITIVO" : "COMPETITIVO", id: "t" + k }; n++; });
      for (let w2 = T; w2 < N; w2++) meso[w2] = { lab: "TRANSITORIO", id: "fin" };
    }

    // --- Microciclo, técnico y fuerza por semana ---
    const weeks = [];
    const libre = [];
    for (let w = 0; w < N; w++) {
      const per = periodo(w);
      let micro;
      if (per === "TRANSITORIO") micro = "TRANSITORIO";
      else if (semVac.has(w)) micro = "DESCANSO ABSOLUTO";
      else if (esComp(w)) micro = "COMPETITIVO";
      else if (esComp(w + 1)) micro = "PRECOMPETITIVO";
      else if (w > 0 && esComp(w - 1)) micro = "BASICO ESTABILIZADOR";
      else { libre.push(w); micro = null; }
      weeks.push({ n: w, start: fecha(w * 7), micro, tec: null, fza: null, split: false, per });
    }
    let j = 0;
    for (const w of libre) {
      const per = weeks[w].per;
      if (per === "PREPARATORIO") weeks[w].micro = ["PREPARACION GRAL", "PREPARACION ESPECIF", (Math.floor(j / 3) % 2 ? "BAS DESARROLLADOR" : "CHOQUE")][j % 3];
      else weeks[w].micro = j % 2 ? "PREPARACION GRAL" : "PREPARACION ESPECIF";
      j++;
    }
    const set = (w, tec, fza) => { if (w >= 0 && w < N && !weeks[w].tec && !weeks[w].split) { weeks[w].tec = tec; weeks[w].fza = fza; } };
    for (let w = T; w < N; w++) set(w, "BAJO", "35 - 45 %");
    for (const w of semVac) {
      if (weeks[w].per === "TRANSITORIO") continue;
      const sig = noPrep.find(c => c.w1 > w);
      if (sig && sig.w1 - w <= 8) weeks[w].split = true; else set(w, "BAJO", "35 - 45 %");
    }
    // 1) semana de competencia, 2) semana previa, 3) semana posterior, 4) dos semanas antes,
    // 5) recuperación + recarga tras competencias dobles, 6) ola de 4 semanas contada hacia atrás
    //    desde la siguiente competencia (ALTO en la competencia, MEDIO, BAJO con fuerza 60-80 %, MEDIO…).
    const sigPico = w => { for (let k = w + 1; k < N; k++) if (esComp(k)) return compSem[k]; return null; };
    for (let w = 0; w < N; w++) if (esComp(w)) set(w, "ALTO", "35 - 45 %");
    for (let w = 0; w < N; w++) if (esComp(w)) set(w - 1, "MEDIO", "45 - 60 %");
    for (let w = 0; w < N; w++) if (esComp(w) && !esComp(w + 1)) {
      const doble = compSem[w].filter(c => c.tipo !== "preparacion").length >= 2;
      const sig = sigPico(w), k = proxComp(w + 1);
      if (doble && k >= 4) { set(w + 1, "BAJO", "35 - 45 %"); set(w + 2, "MEDIO", "60 - 80 %"); }
      else if (k === 2 && sig && sig.some(c => c.tipo === "principal")) set(w + 1, "BAJO", "60 - 80 %");
      else set(w + 1, "MEDIO", "45 - 60 %");
    }
    for (let w = 0; w < N; w++) if (esComp(w)) set(w - 2, "BAJO", "60 - 80 %");
    const ola = [["ALTO", "35 - 45 %"], ["MEDIO", "45 - 60 %"], ["BAJO", "60 - 80 %"], ["MEDIO", "45 - 60 %"]];
    for (let w = 0; w < N; w++) if (!weeks[w].tec && !weeks[w].split) { const k = proxComp(w); set(w, ...ola[(isFinite(k) ? k : w) % 4]); }

    // --- Texto técnico de cada semana ---
    const fracPrep = w => w / Math.max(1, (comps.length ? Math.min(P, comps[0].w1) : P));
    const efect = w => weeks[w].per === "COMPETITIVO" ? 95 : 90;
    function textoSemana(w) {
      const per = weeks[w].per, k = proxComp(w), u = ultComp(w), e = efect(w);
      if (per === "TRANSITORIO") return "RECUPERACION ACTIVA";
      if (k === 0) return `RUTINAS COMPLETAS 1 A 2 REPETICIONES +${e}% DE EFECTIVIDAD`;
      if (u === 1) return "RECUPERACION Y PULIMIENTO";
      if (u === 2 && k > 2) return "PULIMIENTO DE ERRORES Y ELEMENTOS NUEVOS";
      if (k === 1) return `RUTINAS COMPLETAS 2 A 3 REPETICIONES +${e}% DE EFECTIVIDAD`;
      if (k === 2) return `1/2 RUTINAS 4 A 5 REPETICIONES +${e}% DE EFECTIVIDAD`;
      if (k === 3) return "ENLACES DE RUTINA DE MEDIA DIFICULTAD MANTENIENDO ELEMENTOS";
      if (k <= 6) return "CONSOLIDACION DE ENLACES DE RUTINA, ELEMENTOS DE MEDIA DIFICULTAD Y BONIFICACIONES";
      if (per !== "PREPARATORIO") return "RUTINAS COMPLETAS CON CORRECCION DE ELEMENTOS";
      const p = fracPrep(w);
      if (p < 0.3) return "TRABAJO DE BASE Y DRILLS DE NUEVOS ELEMENTOS";
      if (p < 0.45) return "PREPARACION DE ELEMENTOS SUELTOS";
      if (p < 0.6) return "CONSOLIDACION DE ELEMENTOS DE BASE Y SEGUIMIENTO DE ELEMENTOS DE MEDIA DIFICULTAD";
      if (p < 0.75) return "ENSAMBLE DE ENLACES DE RUTINA CON 3 ELEMENTOS";
      return "ENLACES DE RUTINA Y MANTENIMIENTO DE ELEMENTOS EN PROYECCION";
    }

    // --- Días: unidad y descripción ---
    const extra = {};                                     // fecha -> [{desc, unit}] en orden
    const poner = (s, desc, unit) => { (extra[s] = extra[s] || []).push({ desc: limpio(desc), unit }); };
    const recorrer = (a, b, fn) => { for (let s = a; s <= (b || a); s = F.sumar(s, 1)) if (s >= start && s <= end) fn(s); };
    comps.forEach(c => recorrer(c.inicio, c.fin, s => poner(s, c.nombre, "C")));
    (d.eventos || []).filter(e => e.nombre && e.inicio).forEach(e => recorrer(e.inicio, e.fin, s => poner(s, e.nombre, "E")));
    (d.vacaciones || []).filter(v => v.inicio).forEach(v => recorrer(v.inicio, v.fin, s => { if (!(extra[s] || []).length) poner(s, v.nombre || "VACACIONES", "V"); }));
    (d.descansos || []).filter(v => v.inicio).forEach(v => recorrer(v.inicio, v.fin, s => poner(s, /DESCANS|PUENTE/i.test(v.nombre) ? v.nombre : "DESCANSO " + v.nombre, "D")));
    (d.festivos || []).filter(x => x.descansa).forEach(x => recorrer(x.fecha, x.fecha, s => { if (!(extra[s] || []).some(p => p.unit === "V" || p.unit === "D")) poner(s, "DESCANSO " + x.nombre, "D"); }));
    comps.filter(c => c.descansoDespues).forEach(c => { const s = F.sumar(c.fin, 1); if (s <= end) poner(s, "DESCANSO PARA PARTICIPANTES DE " + c.nombre, "D"); });

    const days = [];
    for (let i = 0; i < ND; i++) {
      const s = fecha(i), w = Math.floor(i / 7), dow = i % 7, base = SEMANA_TIPO[dow];
      let ps = (extra[s] || []).slice();
      const parcial = ps.length && ps.every(p => /PARTICIPANTES DE/.test(p.desc));
      if (parcial) ps.push({ desc: textoSemana(w), unit: base });
      // Día de descanso dentro de un evento/competencia: se queda la competencia o el evento
      if (ps.length > 1 && ps.some(p => p.unit === "C" || p.unit === "E")) ps = ps.filter(p => p.unit === "C" || p.unit === "E" || /PARTICIPANTES DE/.test(p.desc));
      if (!ps.length) days.push({ date: s, unit: base, desc: textoSemana(w) });
      else if (ps.length === 1) days.push({ date: s, unit: ps[0].unit, desc: ps[0].desc });
      else days.push({ date: s, unit: ps.map(p => p.unit).join("/"), desc: ps.map(p => p.desc).join(" / ") });
    }

    // --- Bandas ---
    const bandas = (fnLab, fnId) => {
      const out = []; for (let w = 0; w < N; w++) {
        const lab = fnLab(w), id = fnId ? fnId(w) : lab, last = out[out.length - 1];
        if (last && last._id === id) last.end = fecha(w * 7 + 6); else out.push({ label: lab, start: fecha(w * 7), end: fecha(w * 7 + 6), _id: id });
      }
      return out.map(({ _id, ...b }) => b);
    };
    const m = {
      start, end, days,
      weeks: weeks.map(({ per, ...w }) => w),
      bands: { periodo: bandas(periodo), etapa: bandas(w => etapa[w].lab, w => etapa[w].id), mesociclo: bandas(w => meso[w].lab, w => meso[w].id) },
      generado: true
    };
    m.events = g.AKC.M.eventos(m);
    m.decisiones = [
      `Preparatorio: ${F.rango(start, F.sumar(start, P * 7 - 1))} (${P} semanas)` + (noPrep.length ? `, hasta la semana de ${noPrep[0].nombre}.` : "."),
      `Precompetitivo: ${F.rango(F.sumar(start, P * 7), F.sumar(start, C * 7 - 1))} (${C - P} semanas)` + (princ.length ? `, termina 2 semanas antes de ${princ[0].nombre}.` : "."),
      `Competitivo: ${F.rango(F.sumar(start, C * 7), F.sumar(start, T * 7 - 1))} (${T - C} semanas)` + (ult ? `, cierra con ${ult.nombre}.` : "."),
      `Transitorio: ${F.rango(F.sumar(start, T * 7), end)} (${N - T} semanas).`,
      `${comps.length} competencias; ${comps.filter(c => c.estimada).length} con fecha estimada a partir del ciclo anterior.`
    ];
    return m;
  }

  g.AKC = Object.assign(g.AKC || {}, { G: { proponer, generar, adivinarTipo, SEMANA_TIPO, SEMANA_TIPO_TEXTO, TIPOS } });
})(typeof window !== "undefined" ? window : globalThis);
