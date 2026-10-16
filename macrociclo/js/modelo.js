/* Modelo de un macrociclo (el mismo para el que se lee del Excel y el que se genera):
 *   start, end            fechas ISO (lunes y domingo)
 *   days[]                { date, unit, desc }   unit "CH","O","C","C/E"…, desc "A" o "A / B"
 *   bands.periodo|etapa|mesociclo[]   { label, start, end }
 *   weeks[]               { n, start, micro, tec, fza, split }  tec ALTO|MEDIO|BAJO, fza "60 - 80 %"…
 *                         split = true en semanas que dependen de si el atleta va al selectivo
 *   splitNotes            { tecMedio, tecBajo, fzaMedio, fzaBajo }  textos de esas semanas
 */
(function (g) {
  "use strict";
  const F = g.AKC.F;
  const NIVELES = ["ALTO", "MEDIO", "BAJO"];
  const FUERZA = ["60 - 80 %", "45 - 60 %", "35 - 45 %"];
  const SPLIT = {
    tecMedio: "Para los que participen en selectivos",
    tecBajo: "Para los que NO participen en selectivo",
    fzaMedio: "Para los que participen en selectivos",
    fzaBajo: "Para los que NO participen en selectivo"
  };

  // Un día puede tener dos cosas: "A / B" con unidad "C/E".
  function partes(d) {
    const desc = String(d.desc || "").split(/\s+\/\s+/).map(s => s.trim()).filter(Boolean);
    const units = String(d.unit || "").toUpperCase().replace(/\s+/g, "").split("/");
    if (desc.length > 1 && desc.length === units.length) return desc.map((t, i) => ({ desc: t, unit: units[i] }));
    return [{ desc: String(d.desc || "").trim(), unit: String(d.unit || "").toUpperCase().replace(/\s+/g, "") }];
  }
  function tipoDe(p) {
    if (/DESCANS|VACACION|PUENTE/i.test(p.desc)) return "descanso";
    if (p.unit === "C") return "competencia";
    if (p.unit === "E") return "evento";
    return null;
  }
  // Competencias, eventos y descansos agrupados por nombre en días seguidos.
  function eventos(m) {
    const out = [];
    for (const d of m.days) for (const p of partes(d)) {
      const t = tipoDe(p); if (!t || !p.desc) continue;
      const prev = [...out].reverse().find(e => e.title === p.desc && e.type === t);
      if (prev && F.sumar(prev.end, 1) === d.date) prev.end = d.date;
      else out.push({ type: t, title: p.desc, start: d.date, end: d.date });
    }
    return out;
  }
  function semanaDe(m, iso) { return Math.floor(F.dif(m.start, iso) / 7); }
  function bloqueEn(list, iso) { return list.find(b => b.start <= iso && iso <= b.end); }

  // Etapa técnica de la semana para el atleta, a partir de la descripción (para la vista).
  function etapaTecnica(desc) {
    const t = String(desc || "").toUpperCase();
    if (/1\/2 RUTINA|MEDIAS? RUTINA/.test(t)) return "Medias rutinas";
    if (/ENLACE|ENSAMBLE/.test(t)) return "Enlaces";
    if (/PULIMIENTO DE RUTINA/.test(t)) return "Rutinas completas";
    if (/RECUPERACION|PULIMIENTO|ERRORES/.test(t)) return "Recuperación y pulimiento";
    if (/RUTINA/.test(t)) return "Rutinas completas";
    if (/SUELTOS|DRILL|ELEMENTOS DE BASE|CONSOLIDACION DE ELEMENTOS|ELEMENTOS DE MEDIA|NUEVOS ELEMENTOS/.test(t)) return "Elementos sueltos";
    return "";
  }

  g.AKC = Object.assign(g.AKC || {}, { M: { NIVELES, FUERZA, SPLIT, partes, tipoDe, eventos, semanaDe, bloqueEn, etapaTecnica } });
})(typeof window !== "undefined" ? window : globalThis);
