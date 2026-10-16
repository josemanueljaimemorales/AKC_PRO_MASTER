# Macrociclos AKC

App web (HTML/JS sin build) para ver, imprimir y crear macrociclos de Gimnasia Artística Varonil · Águilas KC.

- **Ciclo actual**: lee de Google Drive (carpeta "Utilidades App") el `MACRO_AA_BB.xlsx` de ciclo más nuevo y lo muestra semana por semana. Botones para imprimir y descargar el Excel.
- **Nuevo ciclo**: propone el ciclo siguiente a partir del actual (competencias un año después, en el mismo día de la semana; vacaciones, descansos, festivos y eventos). Se corrigen fechas y tipos, y se genera el MACRO nuevo con el mismo formato de Excel, listo para subir a "Utilidades App".

Archivos: `js/fechas.js` (fechas y festivos de México), `js/lector.js` (lee el MACRO), `js/generador.js` (reglas del macrociclo), `js/excel.js` (escribe el Excel con el formato del MACRO anterior), `js/vista.js` y `js/app.js` (pantalla e impresión).
