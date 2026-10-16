/* Guardar un macrociclo en Google Drive, en una carpeta propia de esta app
 * ("Macrociclos AKC (guardados)"), distinta de "Utilidades App".
 * Se inicia sesión con Google (permiso drive.file: la app solo ve lo que ella misma crea).
 * Requiere AKC_CONFIG.GOOGLE_CLIENT_ID (cliente OAuth web con el origen de GitHub Pages autorizado). */
(function (g) {
  "use strict";
  const CFG = g.AKC_CONFIG;
  const CARPETA = "Macrociclos AKC (guardados)";
  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  let token = null, vence = 0, cliente = null;

  function disponible() { return !!(CFG.GOOGLE_CLIENT_ID && g.google && g.google.accounts && g.google.accounts.oauth2); }

  function pedirToken() {
    return new Promise((ok, mal) => {
      if (token && Date.now() < vence - 60000) return ok(token);
      if (!disponible()) return mal(new Error("Falta configurar el inicio de sesión con Google (GOOGLE_CLIENT_ID)."));
      cliente = cliente || g.google.accounts.oauth2.initTokenClient({ client_id: CFG.GOOGLE_CLIENT_ID, scope: "https://www.googleapis.com/auth/drive.file", callback: () => {} });
      cliente.callback = r => {
        if (r.error) return mal(new Error(r.error === "access_denied" ? "No se dio permiso para guardar en Drive." : r.error));
        token = r.access_token; vence = Date.now() + (r.expires_in || 3600) * 1000; ok(token);
      };
      cliente.error_callback = e => mal(new Error(e && e.type === "popup_closed" ? "Se cerró la ventana de Google sin terminar." : "No se pudo iniciar sesión con Google."));
      cliente.requestAccessToken({ prompt: token ? "" : "consent" });
    });
  }
  async function api(url, opt = {}) {
    const t = await pedirToken();
    const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: "Bearer " + t } });
    if (!r.ok) { let m = "HTTP " + r.status; try { const j = await r.json(); m += ": " + (j.error && j.error.message || ""); } catch (e) { } throw new Error(m); }
    return r.json();
  }
  const q = s => encodeURIComponent(s);
  async function carpeta() {
    const busca = await api(`https://www.googleapis.com/drive/v3/files?q=${q(`name='${CARPETA}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`);
    if (busca.files && busca.files.length) return busca.files[0].id;
    const nueva = await api("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: CARPETA, mimeType: "application/vnd.google-apps.folder" }) });
    return nueva.id;
  }
  // Sube o reemplaza (nueva versión del mismo archivo) por nombre dentro de la carpeta.
  async function subir(nombre, blob, mime, idCarpeta) {
    const ya = await api(`https://www.googleapis.com/drive/v3/files?q=${q(`name='${nombre.replace(/'/g, "\\'")}' and '${idCarpeta}' in parents and trashed=false`)}&fields=files(id)`);
    const meta = ya.files && ya.files.length ? { name: nombre } : { name: nombre, parents: [idCarpeta] };
    const cuerpo = new FormData();
    cuerpo.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
    cuerpo.append("file", blob, nombre);
    const url = ya.files && ya.files.length
      ? `https://www.googleapis.com/upload/drive/v3/files/${ya.files[0].id}?uploadType=multipart&fields=id,name,webViewLink`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
    return api(url, { method: ya.files && ya.files.length ? "PATCH" : "POST", body: cuerpo });
  }
  // Guarda el Excel y los datos editables (para poder retomar el ciclo después).
  async function guardarMacro(nombreXlsx, bufXlsx, datos) {
    const id = await carpeta();
    const x = await subir(nombreXlsx, new Blob([bufXlsx], { type: XLSX_MIME }), XLSX_MIME, id);
    if (datos) await subir(nombreXlsx.replace(/\.xlsx$/i, " (datos).json"), new Blob([JSON.stringify(datos, null, 1)], { type: "application/json" }), "application/json", id);
    return { carpeta: CARPETA, archivo: x };
  }

  g.AKC = Object.assign(g.AKC || {}, { Drive: { guardarMacro, disponible, CARPETA } });
})(typeof window !== "undefined" ? window : globalThis);
