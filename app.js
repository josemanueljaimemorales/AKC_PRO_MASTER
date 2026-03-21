let data=[];
let listaActual=[];
let stack=[];

function render(html){
document.getElementById('app').innerHTML = html;
}

function push(view){
stack.push(view);
render(view);
}

function back(){
stack.pop();
let prev = stack[stack.length-1];
if(prev){
render(prev);
}else{
home();
}
}

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
const wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
home();
}

function home(){
stack=[];
let html = `
<button class="btn" onclick="fuerza()">💪 Fuerza</button>
<button class="btn" onclick="preventivo()">🛡 Preventivo</button>
<button class="btn" onclick="orientacion()">🧭 Orientación</button>
<button class="btn" onclick="drill()">⚙ Drill</button>
<button class="btn" onclick="fesp()">🏋 F ESP APA</button>`;
push(html);
}

function fuerza(){
let html = `
<button class="back" onclick="back()">⬅</button>
<button class="btn" onclick="dias('1')">Semana 1</button>
<button class="btn" onclick="dias('2')">Semana 2</button>
<button class="btn" onclick="dias('3')">Semana 3</button>`;
push(html);
}

function dias(sem){
window.sem=sem;
let html = `
<button class="back" onclick="back()">⬅</button>
<button class="btn" onclick="lista('Fuerza','Lunes')">Lunes</button>
<button class="btn" onclick="lista('Fuerza','Miercoles')">Miércoles</button>
<button class="btn" onclick="lista('Fuerza','Viernes')">Viernes</button>`;
push(html);
}

function lista(tipo,dia){
let items=data.filter(r=>r.Tipo==="Fuerza" && r.Semana==window.sem && r.Dia===dia);
mostrar(items);
}

function preventivo(){
let html = `
<button class="back" onclick="back()">⬅</button>
<button class="btn" onclick="listaPrev('1')">Semana 1</button>
<button class="btn" onclick="listaPrev('2')">Semana 2</button>
<button class="btn" onclick="listaPrev('3')">Semana 3</button>`;
push(html);
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
let html = `<button class="back" onclick="back()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('Drill','${a}')">${a}</button>`).join('');
push(html);
}

function fesp(){
let aparatos=[...new Set(data.filter(r=>r.Tipo==="F ESP APA").map(r=>r.Aparato))];
let html = `<button class="back" onclick="back()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('F ESP APA','${a}')">${a}</button>`).join('');
push(html);
}

function listaA(tipo,aparato){
let items=data.filter(r=>r.Tipo===tipo && r.Aparato===aparato);
mostrar(items);
}

function mostrar(items){
listaActual = items;
let html =
`<button class="back" onclick="back()">⬅</button>`+
items.map((r,i)=>`
<button class="btn" onclick="video(${i})">
${r.Ejercicio||r.Nombre||"Ejercicio"}
<div class="info">
${r.Series ? "Series: "+r.Series : ""}
${r.Reps ? " | Reps: "+r.Reps : ""}
${r.Peso ? " | Peso: "+r.Peso : ""}
</div>
</button>
`).join('');
push(html);
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

let html = `
<button class="back" onclick="back()">⬅</button>
<iframe class="video" src="${url}" allowfullscreen></iframe>`;
push(html);
}

init();
