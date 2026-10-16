# Macrociclos AKC — guía para Claude

App web instalable (HTML/JS sin build, GitHub Pages desde `main`) para ver, imprimir, crear y guardar macrociclos
de Gimnasia Artística Varonil de Águilas de Kids Center. Usuario: Manu (José Manuel Jaime Morales). Responder en
español, claro y sin relleno. Este repo es **solo** para el macro (la app anterior de Fuerza/Preventivo se quitó).
Estilo de aguilaskc.net (claro/oscuro, acento dorado); la línea de tiempo siempre sobre fondo blanco.

## Archivos
- `js/lector.js` lee la hoja "macro gral" del MACRO (ExcelJS) → modelo (`js/modelo.js`).
- `js/generador.js`: `proponer()` (ciclo siguiente a partir del actual) y `generar()` (reglas del macro).
- `js/excel.js` escribe el MACRO nuevo con el formato del anterior (plantilla). `js/vista.js` y `js/app.js`: pantalla e impresión.
- `js/guardar-drive.js`: "Guardar en Drive" con Google (permiso drive.file) en la carpeta "Macrociclos AKC (guardados)",
  distinta de "Utilidades App". `GOOGLE_CLIENT_ID` en `js/config.js` (proyecto akc-con-reporte; no es secreto).
- `js/excel.js` termina con `ordenarXml` (JSZip): reacomoda hijos de `<font>` y `<sheetPr>`, porque ExcelJS los escribe en un
  orden que Excel del celular rechaza ("problema con el contenido"). Validar todo Excel generado con el Open XML SDK
  (`OpenXmlValidator`): debe dar 0 errores, igual que el MACRO original.
- `sw.js`: funciona sin conexión. **Subir `VERSION`** (y los `?v=` de index.html) al cambiar archivos.

## Datos
- Lee de Drive "Utilidades App" (`CARPETA_DRIVE`) el `MACRO_AA_BB.xlsx` de ciclo más nuevo; si falla, `assets/MACRO_26_27.xlsx`.
- El MACRO generado debe seguir siendo legible por las apps AKC (GAV-APP-AKC y pruebanuevappakc): mismas filas
  (9 = unidad, 10 = descripción, 11-13 técnico, 15-17 fuerza), "A / B" con unidad "C/E" para dos cosas el mismo día,
  "DESCANSO PARA PARTICIPANTES DE <competencia>" para descansos parciales. Probar con esas apps antes de entregar.

## Criterios de Manu
- **Unidad de entrenamiento** (confirmado por Manu): CH choque, O ordinaria, R recuperación, D descanso,
  C competencia, E evento, V vacaciones.
- **Semana tipo fija** (cambian cargas, no la distribución): L básicos (CH), Ma y Mi 3 aparatos (O), J carga baja +
  anillos + elementos en rojo (R), V salidas (O), S piso, paralelas, fija y arzón (CH), D descanso.
- **Semana de fuerza 1-4**: gira siempre sin reiniciar (varía el estímulo); se acomoda para que la primera competencia sea
  semana 1. Carga en semanas normales: S1 baja (35-45 %), S2 media (45-60 %), S3 alta (60-80 %), S4 media; cerca de
  competir se ajusta la carga, no el número. En la vista, fuerza y técnico van como gráficas (no celdas de color).
- Se compite con técnico ALTO y fuerza 35-45 %, con progresión (-2 sem 60-80 %, -1 sem 45-60 %); siempre hay elementos
  nuevos en aprendizaje salvo cerca de competir (solo dominados).
- Si una competencia termina en domingo, el lunes siguiente es descanso para quienes compitieron.
- Competencias propuestas = mismas del ciclo anterior, un año después en el mismo día de la semana, marcadas "Estimada".
- Tipos: control/individual (no cambia cargas del equipo), preparación, clasificatoria (abre Precompetitivo), principal
  (el Competitivo empieza 2 semanas antes de la primera).

## Reglas de trabajo
- Cambiar solo lo que se pide; probar en navegador (pantalla, celular, claro/oscuro e impresión) antes de decir que funciona.
- Claude abre el PR y hace el merge cuando Manu aprueba.
