let data = [];
let semana = 1;
let currentTipo = "";
let currentDia = "";
let lastView = null;

function setSemana(s){
  semana = s;
  document.getElementById("semana").innerText = "Semana: "+semana;
  if(currentTipo && currentDia){
    cargar(currentTipo, currentDia);
  }
}

async function loadExcel(){
  const res = await fetch('AKC.xlsx');
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);
}

function limpiar(v){
  return (v || "").toString().trim().toLowerCase();
}

function menu(tipo){
  currentTipo = tipo;
  let sub = document.getElementById("sub");
  sub.innerHTML = "";
  document.getElementById("content").innerHTML = "";

  if(tipo === "Fuerza"){
    ["Lunes","Miercoles","Viernes"].forEach(d=>{
      sub.innerHTML += `<button class="big-btn" onclick="cargar('${tipo}','${d}')">${d}</button>`;
    });
  }

  if(tipo === "Preventivo"){
    sub.innerHTML = `<button class="big-btn" onclick="cargar('${tipo}','Jueves')">Jueves</button>`;
  }

  if(tipo === "Orientacion"){
    sub.innerHTML = `<button class="big-btn" onclick="cargarOrientacion()">Ver</button>`;
  }

  if(tipo === "Drill" || tipo === "F ESP APA"){
    ["Piso","Arzon","Anillos","Salto","Paralelas","Barra"].forEach(a=>{
      sub.innerHTML += `<button class="big-btn" onclick="cargarA('${tipo}','${a}')">${a}</button>`;
    });
  }
}

function cargar(tipo,dia){
  currentTipo = tipo;
  currentDia = dia;

  let cont = document.getElementById("content");
  cont.innerHTML = "";

  let f = data.filter(e =>
    limpiar(e.Tipo).includes(limpiar(tipo)) &&
    limpiar(e.Dia) === limpiar(dia) &&
    Number(e.Semana) === semana
  );

  pintar(f);
}

function cargarOrientacion(){
  let cont = document.getElementById("content");
  cont.innerHTML = "";

  let f = data.filter(e =>
    limpiar(e.Tipo).includes("orient")
  );

  pintar(f);
}

function cargarA(tipo,aparato){
  let cont = document.getElementById("content");
  cont.innerHTML = "";

  let f = data.filter(e =>
    limpiar(e.Tipo).includes(limpiar(tipo)) &&
    limpiar(e.Aparato) === limpiar(aparato)
  );

  pintar(f);
}

function pintar(lista){
  let cont = document.getElementById("content");
  cont.innerHTML = "";
  lista.forEach(e=>{
    cont.innerHTML += `
    <div class="card" onclick="video('${e.Link}')">
    <h2>${e.Ejercicio || ''}</h2>
    <p>${e.Series || ''} x ${e.Reps || ''}</p>
    <p>${e.Carga || e.Peso || ''}</p>
    </div>`;
  });
}

function video(link){
  if(!link) return;

  lastView = document.body.innerHTML;

  document.body.innerHTML = `
  <div class="back-btn">
    <button onclick="volver()">⬅️</button>
  </div>

  <iframe 
  src="${link.replace('shorts/','embed/')}?autoplay=1" 
  class="video-full"
  allow="autoplay; fullscreen"
  allowfullscreen>
  </iframe>`;
}

function volver(){
  document.body.innerHTML = lastView;
}

loadExcel();
