let data = [];
let semana = 1;
let currentTipo = "";
let currentDia = "";

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
      sub.innerHTML += `<button onclick="cargar('${tipo}','${d}')">${d}</button>`;
    });
  }

  if(tipo === "Preventivo"){
    sub.innerHTML = `<button onclick="cargar('${tipo}','Jueves')">Jueves</button>`;
  }

  if(tipo === "Orientacion"){
    sub.innerHTML = `<button onclick="cargarOrientacion()">Ver</button>`;
  }

  if(tipo === "Drill" || tipo === "F ESP APA"){
    ["Piso","Arzon","Anillos","Salto","Paralelas","Barra"].forEach(a=>{
      sub.innerHTML += `<button onclick="cargarA('${tipo}','${a}')">${a}</button>`;
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
  lista.forEach(e=>{
    cont.innerHTML += `
    <div class="card" onclick="video('${e.Link}')">
    <h3>${e.Ejercicio || ''}</h3>
    <p>${e.Series || ''} x ${e.Reps || ''}</p>
    <p>${e.Carga || e.Peso || ''}</p>
    </div>`;
  });
}

function video(link){
  if(!link) return;
  document.body.innerHTML = `
  <iframe 
  src="${link.replace('shorts/','embed/')}?autoplay=1" 
  style="position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;"
  allow="autoplay; fullscreen"
  allowfullscreen>
  </iframe>`;
}

loadExcel();
