let data = [];

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

if(tipo === "Drill" || tipo === "F ESP APA"){
["Piso","Arzon","Anillos","Salto","Paralelas","Barra"].forEach(a=>{
sub.innerHTML += `<button onclick="cargarA('${tipo}','${a}')">${a}</button>`;
});
}

if(tipo === "Orientacion"){
cargar("Orientacion");
}
}

function cargar(tipo,dia){
let cont = document.getElementById("content");
cont.innerHTML = "";

let f = data.filter(e =>
limpiar(e.Tipo) === limpiar(tipo) &&
(dia ? limpiar(e.Dia) === limpiar(dia) : true)
);

f.forEach(e=>{
cont.innerHTML += `
<div class="card" onclick="video('${e.Link}')">
<h3>${e.Ejercicio || ''}</h3>
<p>${e.Series || ''} x ${e.Reps || ''}</p>
<p>${e.Carga || ''}</p>
</div>
`;
});
}

function cargarA(tipo,aparato){
let cont = document.getElementById("content");
cont.innerHTML = "";

let f = data.filter(e =>
limpiar(e.Tipo) === limpiar(tipo) &&
limpiar(e.Aparato) === limpiar(aparato)
);

f.forEach(e=>{
cont.innerHTML += `
<div class="card" onclick="video('${e.Link}')">
<h3>${e.Ejercicio || ''}</h3>
</div>
`;
});
}

function video(link){
document.body.innerHTML = `
<button onclick="location.reload()">⬅️</button>
<iframe width="100%" height="80%" 
src="${link.replace('shorts/','embed/')}" 
frameborder="0" allowfullscreen></iframe>
`;
}

loadExcel();
