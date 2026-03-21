let data=[];
let listaActual=[];

function render(html){
document.getElementById('app').innerHTML = html;
history.pushState({html:html}, '');
}

window.onpopstate = function(e){
if(e.state && e.state.html){
document.getElementById('app').innerHTML = e.state.html;
}
};

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
const wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
home(true);
}

function home(first=false){
let html = `
<button class="btn" onclick="fuerza()">💪 Fuerza</button>
<button class="btn" onclick="preventivo()">🛡 Preventivo</button>
<button class="btn" onclick="orientacion()">🧭 Orientación</button>
<button class="btn" onclick="drill()">⚙ Drill</button>
<button class="btn" onclick="fesp()">🏋 F ESP APA</button>`;
if(first){
document.getElementById('app').innerHTML = html;
history.replaceState({html:html}, '');
}else{
render(html);
}
}

function fuerza(){
render(`
<button class="back" onclick="history.back()">⬅</button>
<button class="btn" onclick="dias('1')">Semana 1</button>
<button class="btn" onclick="dias('2')">Semana 2</button>
<button class="btn" onclick="dias('3')">Semana 3</button>`);
}

function dias(sem){
window.sem=sem;
render(`
<button class="back" onclick="history.back()">⬅</button>
<button class="btn" onclick="lista('Fuerza','Lunes')">Lunes</button>
<button class="btn" onclick="lista('Fuerza','Miercoles')">Miércoles</button>
<button class="btn" onclick="lista('Fuerza','Viernes')">Viernes</button>`);
}

function lista(tipo,dia){
let items=data.filter(r=>r.Tipo==="Fuerza" && r.Semana==window.sem && r.Dia===dia);
mostrar(items);
}

function preventivo(){
render(`
<button class="back" onclick="history.back()">⬅</button>
<button class="btn" onclick="listaPrev('1')">Semana 1</button>
<button class="btn" onclick="listaPrev('2')">Semana 2</button>
<button class="btn" onclick="listaPrev('3')">Semana 3</button>`);
}

function listaPrev(sem){
let items=data.filter(r=>r.Tipo==="Preventivo" && r.Semana==sem);
mostrar(items);
}

function orientacion(){
let items=data.filter(r=>(r.Tipo||"").toLowerCase().includes("orient"));
mostrar(items);
}

function drill(){
let aparatos=[...new Set(data.filter(r=>r.Tipo==="Drill").map(r=>r.Aparato))];
render(
`<button class="back" onclick="history.back()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('Drill','${a}')">${a}</button>`).join('')
);
}

function fesp(){
let aparatos=[...new Set(data.filter(r=>r.Tipo==="F ESP APA").map(r=>r.Aparato))];
render(
`<button class="back" onclick="history.back()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('F ESP APA','${a}')">${a}</button>`).join('')
);
}

function listaA(tipo,aparato){
let items=data.filter(r=>r.Tipo===tipo && r.Aparato===aparato);
mostrar(items);
}

function mostrar(items){
listaActual = items;
render(
`<button class="back" onclick="history.back()">⬅</button>`+
items.map((r,i)=>`
<button class="btn" onclick="video(${i})">
${r.Ejercicio||r.Nombre||"Ejercicio"}
<div class="info">
${r.Series ? "Series: "+r.Series : ""}
${r.Reps ? " | Reps: "+r.Reps : ""}
${r.Peso ? " | Peso: "+r.Peso : ""}
</div>
</button>
`).join('')
);
}

function convertir(raw){
if(!raw) return "";
raw = raw.split("?")[0];
if(raw.includes("shorts")) return "https://www.youtube.com/embed/"+raw.split("shorts/")[1];
if(raw.includes("watch?v=")) return "https://www.youtube.com/embed/"+raw.split("watch?v=")[1];
if(raw.includes("embed")) return raw;
return "";
}

function video(i){
let r = listaActual[i];
let raw = r.Video || r.Link || r.LINK || r.video || r.link || "";
let url = convertir(raw);

if(!url){
alert("Video no válido");
return;
}

render(`
<button class="back" onclick="history.back()">⬅</button>
<iframe class="video" src="${url}" allowfullscreen></iframe>`);
}

init();
