
let data=[];

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
const wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
home();
}

function home(){
document.getElementById('app').innerHTML=`
<h2>AKC</h2>
<button class="btn" onclick="menu('fuerza')">💪 Fuerza</button>
<button class="btn" onclick="menu('orientacion')">🧭 Orientación</button>
<button class="btn" onclick="menu('preventivo')">🛡 Preventivo</button>
<button class="btn" onclick="menu('drill')">⚙ Drill</button>
<button class="btn" onclick="menu('fesp')">🏋 Fuerza Esp Aparato</button>
`;
}

function menu(tipo){
let lista=data.filter(r=>{
let t=(r.Tipo||"").toString().toLowerCase();
if(tipo==="orientacion") return t.includes("orient");
if(tipo==="fuerza") return t.includes("fuerza");
if(tipo==="preventivo") return t.includes("prevent");
if(tipo==="drill") return t.includes("drill");
if(tipo==="fesp") return t.includes("esp");
});

if(lista.length===0){
document.getElementById('app').innerHTML=`<button class="back" onclick="home()">⬅</button>No hay datos`;
return;
}

document.getElementById('app').innerHTML=`
<button class="back" onclick="home()">⬅</button>
${lista.map((r,i)=>`<button class="btn" onclick="ver(${i},'${tipo}')">${r.Nombre}</button>`).join('')}
`;
window.current=lista;
}

function convertir(url){
if(!url) return "";
if(url.includes("shorts")){
return url.replace("shorts/","embed/");
}
return url.replace("watch?v=","embed/");
}

function ver(i,tipo){
let r=window.current[i];
let url=convertir(r.Video||r.Link||"");

document.getElementById('app').innerHTML=`
<button class="back" onclick="menu('${tipo}')">⬅ Regresar</button>
<iframe class="video" src="${url}" allowfullscreen autoplay></iframe>
`;
}

init();
