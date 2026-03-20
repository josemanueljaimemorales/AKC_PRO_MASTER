let data=[];

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
const wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
home();
}

function home(){
document.getElementById('app').innerHTML=`
<button class="btn" onclick="fuerza()">💪 Fuerza</button>
<button class="btn" onclick="preventivo()">🛡 Preventivo</button>
<button class="btn" onclick="orientacion()">🧭 Orientación</button>
<button class="btn" onclick="drill()">⚙ Drill</button>
<button class="btn" onclick="fesp()">🏋 F ESP APA</button>`;
}

function fuerza(){
document.getElementById('app').innerHTML=`
<button class="back" onclick="home()">⬅</button>
<button class="btn" onclick="dias('1')">Semana 1</button>
<button class="btn" onclick="dias('2')">Semana 2</button>
<button class="btn" onclick="dias('3')">Semana 3</button>`;
}

function dias(sem){
window.sem=sem;
document.getElementById('app').innerHTML=`
<button class="back" onclick="fuerza()">⬅</button>
<button class="btn" onclick="lista('Fuerza','Lunes')">Lunes</button>
<button class="btn" onclick="lista('Fuerza','Miercoles')">Miércoles</button>
<button class="btn" onclick="lista('Fuerza','Viernes')">Viernes</button>`;
}

function preventivo(){
document.getElementById('app').innerHTML=`
<button class="back" onclick="home()">⬅</button>
<button class="btn" onclick="listaPrev('1')">Semana 1</button>
<button class="btn" onclick="listaPrev('2')">Semana 2</button>
<button class="btn" onclick="listaPrev('3')">Semana 3</button>`;
}

function listaPrev(sem){
let items=data.filter(r=>r.Tipo==="Preventivo" && r.Semana==sem);
mostrar(items,"preventivo");
}

function orientacion(){
let items=data.filter(r=>(r.Tipo||"").toLowerCase().includes("orient"));
mostrar(items,"orientacion");
}

function drill(){
let aparatos=[...new Set(data.filter(r=>r.Tipo==="Drill").map(r=>r.Aparato))];
document.getElementById('app').innerHTML=
`<button class="back" onclick="home()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('Drill','${a}')">${a}</button>`).join('');
}

function fesp(){
let aparatos=[...new Set(data.filter(r=>r.Tipo==="F ESP APA").map(r=>r.Aparato))];
document.getElementById('app').innerHTML=
`<button class="back" onclick="home()">⬅</button>`+
aparatos.map(a=>`<button class="btn" onclick="listaA('F ESP APA','${a}')">${a}</button>`).join('');
}

function lista(tipo,dia){
let items=data.filter(r=>r.Tipo===tipo && r.Semana==window.sem && r.Dia===dia);
mostrar(items,tipo);
}

function listaA(tipo,aparato){
let items=data.filter(r=>r.Tipo===tipo && r.Aparato===aparato);
mostrar(items,tipo);
}

function mostrar(items,back){
document.getElementById('app').innerHTML=
`<button class="back" onclick="home()">⬅</button>`+
items.map((r,i)=>`<button class="btn" onclick="video('${encodeURIComponent(r.Video||"")}')">${r.Ejercicio||r.Nombre||"Ejercicio"}</button>`).join('');
}

function convertir(url){
if(!url) return "";
// limpiar params
url=url.split("&")[0];

// shorts
if(url.includes("shorts")){
return "https://www.youtube.com/embed/"+url.split("shorts/")[1];
}

// watch
if(url.includes("watch?v=")){
return "https://www.youtube.com/embed/"+url.split("watch?v=")[1];
}

// ya embed
if(url.includes("embed")) return url;

return url;
}

function video(u){
let raw=decodeURIComponent(u);
let url=convertir(raw);

document.getElementById('app').innerHTML=`
<button class="back" onclick="home()">⬅</button>
<iframe class="video" src="${url}" allowfullscreen allow="autoplay"></iframe>`;
}

init();
