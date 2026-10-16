/* Macrociclos AKC: carga el MACRO vigente, lo muestra, lo imprime y crea ciclos nuevos. */
(function () {
  "use strict";
  const { F, M, G, V } = window.AKC;
  const CFG = window.AKC_CONFIG;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cap = V.cap;
  const ALMACEN = "akc-macro-borrador-v1";

  const estado = { base: null, plantilla: null, nombreBase: "", actual: null, generado: false, sel: 0 };

  // ---------------- Carga desde Drive ----------------
  async function listarCarpeta() {
    const q = `'${CFG.CARPETA_DRIVE}' in parents and trashed=false`;
    const url = "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(q) + "&fields=files(id,name,modifiedTime)&orderBy=modifiedTime%20desc&pageSize=200&key=" + CFG.DRIVE_API_KEY;
    const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status);
    return (await r.json()).files || [];
  }
  function macroMasNuevo(files) {
    let mejor = null, clave = -1;
    for (const f of files) { const m = f.name.match(/^MACRO[ _-]?(\d{2})[ _-](\d{2})\.xlsx$/i); if (m && +m[1] * 100 + +m[2] > clave) { clave = +m[1] * 100 + +m[2]; mejor = f; } }
    return mejor;
  }
  async function cargar() {
    let buf, nombre, origen;
    try {
      const f = macroMasNuevo(await listarCarpeta()); if (!f) throw new Error("no hay MACRO en la carpeta");
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${CFG.DRIVE_API_KEY}`, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      buf = await r.arrayBuffer(); nombre = f.name; origen = `Google Drive · ${f.name}`;
    } catch (e) {
      console.warn("Drive no respondió, uso la copia local:", e);
      const r = await fetch(CFG.RESPALDO); buf = await r.arrayBuffer(); nombre = CFG.RESPALDO.split("/").pop(); origen = `copia guardada en la app · ${nombre} (Drive no respondió)`;
    }
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    estado.base = AKC.leerMacro(wb); estado.plantilla = buf; estado.nombreBase = nombre; estado.origen = origen;
  }

  // ---------------- Vista de un ciclo ----------------
  function anios(m) { return `${m.start.slice(0, 4)}–${m.end.slice(0, 4)}`; }
  function semanaActual(m) { const h = F.hoy(); return h >= m.start && h <= m.end ? Math.floor(F.dif(m.start, h) / 7) : -1; }

  function mostrar(m, generado) {
    estado.actual = m; estado.generado = generado;
    estado.ex = V.extras(m);
    $("vc-fuente").textContent = generado ? "Ciclo nuevo · vista previa" : "Ciclo actual · " + estado.origen;
    $("vc-titulo").textContent = `Macrociclo ${anios(m)}`;
    $("vc-rango").textContent = `Del lunes ${F.texto(m.start)} al domingo ${F.texto(m.end)} · ${m.weeks.length} semanas`;
    $("btn-excel").textContent = generado ? "Descargar Excel nuevo" : "Descargar Excel";
    $("btn-guardar").hidden = !generado; $("guardar-estado").hidden = true;
    const av = $("vc-aviso");
    if (generado) {
      const est = (estado.datos.competencias || []).filter(c => c.estimada).length;
      av.hidden = false;
      av.innerHTML = `<b>Revisa antes de usarlo. Así quedó armado:</b><ul class="decisiones">${m.decisiones.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
        ${est ? `<p><b>${est} competencias siguen con fecha estimada.</b> Confírmalas en “Nuevo ciclo” cuando tengas las fechas oficiales.</p>` : ""}
        <div class="acciones"><button class="btn sec chico" type="button" id="btn-editar">Volver a editar</button></div>`;
      $("btn-editar").onclick = () => ir("nuevo");
    } else av.hidden = true;
    resumen(m);
    pintarTimeline(m);
    $("leyenda").innerHTML = V.leyendaHTML();
    semanaTipo();
    listaEventos(m);
    impresion(m);
    const sa = semanaActual(m);
    elegir(sa >= 0 ? sa : 0, true);
  }

  function resumen(m) {
    const tot = m.days.length, comps = m.events.filter(e => e.type === "competencia");
    const h = F.hoy(), sig = comps.find(e => e.end >= h), sa = semanaActual(m);
    const per = m.bands.periodo.map(b => {
      const n = F.dif(b.start, b.end) + 1, col = V.C[b.label] || V.C.TRANSITORIO;
      return { b, n, col };
    });
    $("vc-resumen").innerHTML = `
      <div class="datos">
        ${sa >= 0 ? `<div class="dato"><small>Semana actual</small><b>${m.weeks[sa].n}</b><span>de ${m.weeks.length - 1}</span></div>` : ""}
        <div class="dato"><small>Competencias</small><b>${comps.length}</b></div>
        ${sig && sa >= 0 ? `<div class="dato ancho"><small>Próxima competencia</small><b class="txt">${esc(cap(sig.title))}</b><span>${F.rango(sig.start, sig.end)} · ${F.dif(h, sig.start) > 0 ? `faltan ${F.dif(h, sig.start)} días` : "en curso"}</span></div>` : ""}
      </div>
      <div class="barra-periodos" role="img" aria-label="Duración de cada periodo">${per.map(p => `<div style="flex:${p.n} 1 0;background:${p.col[0]};color:${p.col[1]}"><span>${p.n / tot > 0.12 ? cap(p.b.label) : ""}</span></div>`).join("")}</div>
      <ul class="periodos">${per.map(p => `<li><i style="background:${p.col[0]}"></i><b>${cap(p.b.label)}</b><span>${F.rango(p.b.start, p.b.end)}</span><span class="cuenta">${Math.round(p.n / 7)} semanas · ${Math.round(p.n / tot * 100)} %</span></li>`).join("")}</ul>`;
  }

  function pintarTimeline(m) {
    const lab = $("tl-lab"), sc = $("tl-scroll");
    lab.innerHTML = ""; sc.innerHTML = "";
    const lw = window.innerWidth < 600 ? 92 : 132;
    lab.appendChild(V.timeline(m, 0, 0, { labelW: lw, extras: estado.ex, hoy: false }));
    const svg = V.timeline(m, 0, m.weeks.length, { colW: 46, extras: estado.ex });
    svg.setAttribute("tabindex", "0");
    sc.appendChild(svg);
    const hl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hl.setAttribute("y", 30); hl.setAttribute("height", svg._geo.H - 32); hl.setAttribute("width", 46); hl.setAttribute("rx", 5);
    hl.setAttribute("fill", "none"); hl.setAttribute("stroke", "#0f172a"); hl.setAttribute("stroke-width", 3); hl.setAttribute("pointer-events", "none");
    svg.appendChild(hl); estado.hl = hl;
    const semana = ev => { const r = svg.getBoundingClientRect(); return Math.floor((ev.clientX - r.left) / (r.width / m.weeks.length)); };
    svg.addEventListener("click", ev => elegir(semana(ev)));
    svg.addEventListener("pointermove", ev => { if (ev.pointerType === "mouse") elegir(semana(ev)); });
    svg.addEventListener("keydown", ev => { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); elegir(estado.sel + (ev.key === "ArrowRight" ? 1 : -1), true); } });
  }

  function elegir(i, desplazar) {
    const m = estado.actual; i = Math.max(0, Math.min(m.weeks.length - 1, i));
    if (i === estado.sel && !desplazar && $("detalle").innerHTML) return;
    estado.sel = i;
    if (estado.hl) estado.hl.setAttribute("x", i * 46);
    if (desplazar) { const sc = $("tl-scroll"); sc.scrollLeft = Math.max(0, i * 46 - sc.clientWidth / 3); }
    const w = m.weeks[i], a = w.start, b = F.sumar(a, 6), ex = estado.ex[i];
    const per = M.bloqueEn(m.bands.periodo, a), et = M.bloqueEn(m.bands.etapa, a), me = M.bloqueEn(m.bands.mesociclo, a);
    const evs = m.events.filter(e => e.start <= b && e.end >= a);
    const dias = m.days.slice(i * 7, i * 7 + 7);
    const textos = [...new Set(dias.flatMap(d => M.partes(d)).filter(p => !M.tipoDe(p)).map(p => p.desc))];
    const mi = V.micro(w.micro), tec = V.C.tec[w.tec], fza = V.C.fza[w.fza];
    const etiqueta = (t, c) => `<span class="etq" style="background:${c ? c[0] : "#fff"};color:${c ? c[1] : "#0f172a"}">${esc(t)}</span>`;
    const sa = semanaActual(m);
    $("detalle").innerHTML = `
      <div class="det-top"><h3>Semana ${w.n}</h3><span class="fechas">${F.rango(a, b)}</span>${i === sa ? '<span class="etq hoy">Semana actual</span>' : ""}</div>
      <div class="det-grid">
        <div><small>Periodo</small>${etiqueta(per ? cap(per.label) : "—", per && V.C[per.label])}</div>
        <div><small>Etapa</small>${etiqueta(et ? (V.C.etapa[et.label] || [, , cap(et.label)])[2] : "—", et && V.C.etapa[et.label])}</div>
        <div><small>Mesociclo</small>${etiqueta(me ? cap(me.label) : "—", me && V.C.meso[me.label])}</div>
        <div><small>Microciclo</small>${etiqueta(V.MICRO_NOMBRE[mi.a] || cap(w.micro), [mi.f, mi.tx])}</div>
        <div><small>Nivel técnico</small>${w.split ? etiqueta("Según vaya o no al selectivo", null) : etiqueta(w.tec ? cap(w.tec) : "—", tec)}</div>
        <div><small>Carga de fuerza</small>${w.split ? etiqueta("Según vaya o no al selectivo", null) : etiqueta(w.fza ? ({ "35 - 45 %": "Baja", "45 - 60 %": "Media", "60 - 80 %": "Alta" }[w.fza] + " · " + w.fza) : "—", fza)}</div>
        <div><small>Semana de fuerza</small>${etiqueta("Semana " + ex.sf, ["#f1f5f9", "#0f172a"])}</div>
        <div><small>Trabajo técnico</small>${etiqueta(ex.trab || "—", V.C.trab[ex.trab])}</div>
        <div><small>Elementos nuevos</small>${etiqueta(ex.nuevos === "Dominados" ? "Solo elementos dominados" : ex.nuevos || "—", V.C.nuevos[ex.nuevos])}</div>
      </div>
      <div class="dias">${dias.map((d, k) => {
        const u = d.unit, ps = u.split("/"); const cls = ps.includes("C") ? "c" : ps.includes("E") ? "e" : ps.includes("V") ? "v" : u === "D" ? "d" : "";
        return `<div class="dia ${cls}"><small>${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][k]} ${+d.date.slice(8)}</small><b>${esc(u)}</b></div>`; }).join("")}</div>
      ${evs.length ? `<ul class="det-ev">${evs.map(e => `<li class="${e.type}"><b>${esc(cap(e.title))}</b> · ${F.rango(e.start, e.end)}</li>`).join("")}</ul>` : ""}
      ${textos.length ? `<ul class="det-txt">${textos.map(t => `<li>${esc(t.charAt(0) + t.slice(1).toLowerCase())}</li>`).join("")}</ul>` : ""}`;
  }

  function semanaTipo() {
    $("semana-tipo").innerHTML = G.SEMANA_TIPO_TEXTO.map(([d, u, t]) => `<div class="st"><span class="st-dia">${d}</span><b class="st-u u-${u}">${u}</b><span>${esc(t)}</span></div>`).join("");
  }

  function listaEventos(m) {
    const h = F.hoy();
    $("lista-ev").innerHTML = m.bands.periodo.map(p => {
      const list = m.events.filter(e => e.start >= p.start && e.start <= p.end); if (!list.length) return "";
      const col = V.C[p.label] || V.C.TRANSITORIO;
      return `<div class="grupo"><h3 style="border-color:${col[0]}">${cap(p.label)}</h3>${list.map(e => {
        const dl = F.dif(h, e.start), tag = e.end < h ? "Pasó" : dl <= 0 ? "En curso" : dl === 1 ? "Mañana" : `En ${dl} días`;
        const tipo = e.type === "competencia" ? "Competencia" : e.type === "evento" ? "Evento" : "Descanso";
        return `<button type="button" class="ev ${e.type} ${e.end < h ? "pasado" : ""}" data-w="${Math.floor(F.dif(m.start, e.start) / 7)}">
          <span class="ev-f">${F.rango(e.start, e.end)}</span><span class="ev-t"><b>${esc(cap(e.title))}</b><small>${tipo}</small></span><span class="ev-c">${estado.generado ? "" : tag}</span></button>`; }).join("")}</div>`;
    }).join("");
    $("lista-ev").onclick = ev => { const b = ev.target.closest(".ev"); if (!b) return; elegir(+b.dataset.w, true); $("tl-scroll").scrollIntoView({ behavior: "smooth", block: "center" }); };
  }

  function impresion(m) {
    const box = $("print-tl"); box.innerHTML = "";
    const N = m.weeks.length, mitad = Math.ceil(N / 2);
    const head = `<div class="p-head"><img src="assets/aguilas-kc-logo.png" alt=""><div><b>Macrociclo ${anios(m)}</b><span>Gimnasia Artística Varonil · Águilas KC · ${F.texto(m.start)} – ${F.texto(m.end)}</span></div></div>`;
    for (const [a, b] of [[0, mitad], [mitad, N]]) {
      const pg = document.createElement("div"); pg.className = "p-pagina";
      pg.innerHTML = head;
      pg.appendChild(V.timeline(m, a, b, { colW: 46, labelW: 132, fit: true, extras: estado.ex, hoy: false }));
      const ley = document.createElement("div"); ley.className = "leyenda p-ley"; ley.innerHTML = V.leyendaHTML(); pg.appendChild(ley);
      box.appendChild(pg);
    }
    const pg = document.createElement("div"); pg.className = "p-pagina";
    pg.innerHTML = head + `<div class="p-dos"><div><h2>Competencias, eventos y descansos</h2><table class="p-tabla"><tbody>${m.events.map(e =>
      `<tr><td>${F.rango(e.start, e.end)}</td><td><b>${esc(cap(e.title))}</b></td><td>${e.type === "competencia" ? "Competencia" : e.type === "evento" ? "Evento" : "Descanso"}</td></tr>`).join("")}</tbody></table></div>
      <div><h2>Semana tipo</h2>${G.SEMANA_TIPO_TEXTO.map(([d, u, t]) => `<p class="p-st"><b>${d} (${u}):</b> ${esc(t)}</p>`).join("")}
      <h2>Periodos</h2>${m.bands.periodo.map(b => `<p class="p-st"><b>${cap(b.label)}:</b> ${F.rango(b.start, b.end)}</p>`).join("")}</div></div>`;
    box.appendChild(pg);
  }

  function descargar(buf, nombre) {
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------------- Nuevo ciclo ----------------
  const TABLAS = {
    competencias: { t: "t-comp", fila: c => `
      <td><input type="text" data-k="nombre" value="${esc(c.nombre)}" aria-label="Nombre" required></td>
      <td><input type="date" data-k="inicio" value="${esc(c.inicio)}" aria-label="Inicio"></td>
      <td><input type="date" data-k="fin" value="${esc(c.fin)}" aria-label="Fin"></td>
      <td><select data-k="tipo" aria-label="Tipo">${Object.entries(G.TIPOS).map(([k, v]) => `<option value="${k}" ${c.tipo === k ? "selected" : ""}>${v}</option>`).join("")}</select></td>
      <td class="c"><input type="checkbox" data-k="descansoDespues" ${c.descansoDespues ? "checked" : ""} aria-label="Descanso al día siguiente"></td>
      <td class="c"><label class="conf"><input type="checkbox" data-k="confirmada" ${c.estimada ? "" : "checked"}> <span>${c.estimada ? `Estimada${c.antes ? ` (antes ${esc(c.antes)})` : ""}` : "Confirmada"}</span></label></td>
      <td><button type="button" class="quitar" aria-label="Quitar">✕</button></td>`, nuevo: () => ({ nombre: "", inicio: "", fin: "", tipo: "preparacion", estimada: false }) },
    vacaciones: { t: "t-vac", fila: c => filaSimple(c), nuevo: () => ({ nombre: "VACACIONES", inicio: "", fin: "" }) },
    descansos: { t: "t-desc", fila: c => filaSimple(c), nuevo: () => ({ nombre: "DESCANSO", inicio: "", fin: "" }) },
    eventos: { t: "t-ev", fila: c => filaSimple(c), nuevo: () => ({ nombre: "", inicio: "", fin: "" }) }
  };
  function filaSimple(c) {
    return `<td><input type="text" data-k="nombre" value="${esc(c.nombre)}" aria-label="Nombre"></td>
      <td><input type="date" data-k="inicio" value="${esc(c.inicio)}" aria-label="Inicio"></td>
      <td><input type="date" data-k="fin" value="${esc(c.fin)}" aria-label="Fin"></td>
      <td><button type="button" class="quitar" aria-label="Quitar">✕</button></td>`;
  }
  function pintarForm(d) {
    estado.datos = d;
    $("nc-base").textContent = `Basado en ${estado.nombreBase} (${F.rango(estado.base.start, estado.base.end)}). Las fechas propuestas son estimadas: revísalas.`;
    $("nc-inicio").value = d.inicio; $("nc-fin").value = d.fin; semanas();
    for (const [k, def] of Object.entries(TABLAS)) {
      $(def.t).querySelector("tbody").innerHTML = (d[k] || []).map((c, i) => `<tr data-i="${i}">${def.fila(c)}</tr>`).join("") || `<tr class="vacia"><td colspan="7">Sin registros</td></tr>`;
    }
    $("festivos").innerHTML = (d.festivos || []).map((f, i) => `<label class="fest"><input type="checkbox" data-f="${i}" ${f.descansa ? "checked" : ""}> <b>${F.texto(f.fecha)}</b> ${esc(cap(f.nombre))}</label>`).join("") || "<p class='hint'>Sin festivos en estas fechas.</p>";
  }
  function semanas() {
    const a = $("nc-inicio").value, b = $("nc-fin").value;
    $("nc-semanas").textContent = a && b && b > a ? `${F.texto(F.lunesDe(a))} – ${F.texto(F.domingoDe(b))} · ${Math.round((F.dif(F.lunesDe(a), F.domingoDe(b)) + 1) / 7)} semanas` : "";
  }
  function leerForm() {
    const d = { ...estado.datos, inicio: $("nc-inicio").value, fin: $("nc-fin").value };
    for (const [k, def] of Object.entries(TABLAS)) {
      d[k] = [...$(def.t).querySelectorAll("tbody tr[data-i]")].map(tr => {
        const o = { ...(estado.datos[k] || [])[+tr.dataset.i] };
        tr.querySelectorAll("[data-k]").forEach(inp => { o[inp.dataset.k] = inp.type === "checkbox" ? inp.checked : inp.value.trim(); });
        if (k === "competencias") { o.estimada = !o.confirmada; o.nombre = o.nombre.toUpperCase(); }
        if (!o.fin) o.fin = o.inicio;
        return o;
      });
    }
    d.festivos = (estado.datos.festivos || []).map((f, i) => ({ ...f, descansa: !!document.querySelector(`[data-f="${i}"]`)?.checked }));
    return d;
  }
  function guardar(d) { try { localStorage.setItem(ALMACEN, JSON.stringify({ base: estado.base.start, d })); } catch (e) { } }
  function borrador() { try { const x = JSON.parse(localStorage.getItem(ALMACEN) || "null"); return x && x.base === estado.base.start ? x.d : null; } catch (e) { return null; } }

  function iniciarForm() {
    pintarForm(borrador() || G.proponer(estado.base));
    const f = $("form-nuevo");
    f.addEventListener("input", ev => {
      if (ev.target.id === "nc-inicio" || ev.target.id === "nc-fin") semanas();
      if (ev.target.dataset.k === "confirmada") ev.target.nextElementSibling.textContent = ev.target.checked ? "Confirmada" : "Estimada";
      // Si una competencia termina en domingo, se propone descanso el lunes siguiente
      if (ev.target.dataset.k === "fin" && ev.target.value && F.diaSemana(ev.target.value) === 0) { const c = ev.target.closest("tr").querySelector('[data-k="descansoDespues"]'); if (c) c.checked = true; }
      estado.datos = leerForm(); guardar(estado.datos);
    });
    f.addEventListener("click", ev => {
      const q = ev.target.closest(".quitar");
      if (q) { estado.datos = leerForm(); const tr = q.closest("tr"), k = Object.keys(TABLAS).find(x => TABLAS[x].t === tr.closest("table").id);
        estado.datos[k].splice(+tr.dataset.i, 1); pintarForm(estado.datos); guardar(estado.datos); return; }
      const ad = ev.target.closest("[data-agregar]");
      if (ad) { estado.datos = leerForm(); const k = ad.dataset.agregar; estado.datos[k] = (estado.datos[k] || []).concat([TABLAS[k].nuevo()]); pintarForm(estado.datos); guardar(estado.datos);
        const filas = $(TABLAS[k].t).querySelectorAll("tbody tr[data-i]"); filas[filas.length - 1]?.querySelector("input")?.focus(); }
    });
    // Al cambiar las fechas del ciclo se recalculan los festivos
    for (const id of ["nc-inicio", "nc-fin"]) $(id).addEventListener("change", () => {
      const d = leerForm(); if (!d.inicio || !d.fin) return;
      const prev = Object.fromEntries((d.festivos || []).map(x => [x.fecha, x.descansa]));
      d.festivos = F.festivos(F.lunesDe(d.inicio), F.domingoDe(d.fin)).map(x => ({ ...x, descansa: x.fecha in prev ? prev[x.fecha] : x.porDefecto }));
      pintarForm(d); guardar(d);
    });
    $("nc-reiniciar").onclick = () => { try { localStorage.removeItem(ALMACEN); } catch (e) { } pintarForm(G.proponer(estado.base)); };
    f.addEventListener("submit", ev => {
      ev.preventDefault(); const err = $("nc-error"); err.hidden = true;
      try {
        const d = leerForm(); estado.datos = d; guardar(d);
        const malas = d.competencias.filter(c => !c.inicio || (c.fin && c.fin < c.inicio));
        if (malas.length) throw new Error(`Revisa las fechas de: ${malas.map(c => c.nombre || "(sin nombre)").join(", ")}.`);
        const m = G.generar(d);
        mostrar(m, true); ir("ver", true);
      } catch (e) { err.textContent = e.message; err.hidden = false; err.scrollIntoView({ block: "center" }); }
    });
  }

  // ---------------- Navegación ----------------
  function ir(v, mantener) {
    $("vista-ciclo").hidden = v !== "ver"; $("vista-nuevo").hidden = v !== "nuevo";
    $("tab-ver").classList.toggle("activo", v === "ver"); $("tab-nuevo").classList.toggle("activo", v === "nuevo");
    $("tab-ver").textContent = estado.generado && v === "ver" ? "Vista previa" : "Ciclo actual";
    if (v === "ver" && !mantener && estado.generado) mostrar(estado.base, false);
    window.scrollTo(0, 0);
  }

  async function init() {
    try { await cargar(); }
    catch (e) { $("estado").textContent = "No pude leer el MACRO: " + e.message; return; }
    $("estado").hidden = true;
    mostrar(estado.base, false);
    iniciarForm();
    ir("ver", true);
    $("tab-ver").onclick = () => ir("ver");
    $("tab-nuevo").onclick = () => ir("nuevo");
    $("btn-imprimir").onclick = () => window.print();
    $("btn-excel").onclick = async () => {
      const b = $("btn-excel"); b.disabled = true; const t = b.textContent; b.textContent = "Preparando…";
      try {
        if (estado.generado) descargar(await AKC.escribirExcel(estado.actual, estado.plantilla), AKC.nombreArchivo(estado.actual));
        else descargar(estado.plantilla, estado.nombreBase);
      } catch (e) { alert("No se pudo crear el Excel: " + e.message); }
      b.disabled = false; b.textContent = t;
    };
    $("btn-guardar").onclick = async () => {
      const b = $("btn-guardar"), st = $("guardar-estado"); st.hidden = false; st.className = "guardado";
      if (!AKC_CONFIG.GOOGLE_CLIENT_ID) { st.className = "guardado error"; st.textContent = "El botón Guardar todavía no está configurado: falta el permiso de Google para escribir en Drive."; return; }
      b.disabled = true; st.textContent = "Guardando en Google Drive…";
      try {
        const nombre = AKC.nombreArchivo(estado.actual);
        const buf = await AKC.escribirExcel(estado.actual, estado.plantilla);
        const r = await AKC.Drive.guardarMacro(nombre, buf, estado.datos);
        st.innerHTML = `Guardado: <b>${esc(nombre)}</b> en la carpeta <b>${esc(r.carpeta)}</b> de tu Drive.${r.archivo.webViewLink ? ` <a href="${esc(r.archivo.webViewLink)}" target="_blank" rel="noopener">Abrir</a>` : ""}`;
      } catch (e) { st.className = "guardado error"; st.textContent = "No se guardó: " + e.message; }
      b.disabled = false;
    };
    let ancho = window.innerWidth;
    window.addEventListener("resize", () => { if (Math.abs(window.innerWidth - ancho) > 120) { ancho = window.innerWidth; pintarTimeline(estado.actual); elegir(estado.sel, true); } });
  }
  init();
})();
