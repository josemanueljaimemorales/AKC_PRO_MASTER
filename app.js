let wb,data=[],state={view:'home',type:null,day:null};

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
render();
}

function nav(view,p={}){state={...state,...p,view};render();}

function header(t){return `<div class="header"><button class="back" onclick="nav('home')">⬅</button><div>${t}</div><div></div></div>`;}

function render(){
let app=document.getElementById('app');

if(state.view==='home'){
app.innerHTML=`
<button class="btn" onclick="nav('days',{type:'Fuerza'})">💪 Fuerza</button>
<button class="btn" onclick="nav('days',{type:'Preventivo'})">🛡 Preventivo</button>
<button class="btn" onclick="nav('days',{type:'Drill'})">⚙ Drill</button>
<button class="btn" onclick="nav('days',{type:'Orientacion'})">🧭 Orientación</button>`;
}

if(state.view==='days'){
app.innerHTML=header(state.type)+`
<button class="btn" onclick="nav('list',{day:'Lunes'})">Lunes</button>
<button class="btn" onclick="nav('list',{day:'Miercoles'})">Miércoles</button>
<button class="btn" onclick="nav('list',{day:'Viernes'})">Viernes</button>`;
}

if(state.view==='list'){
let items=data.filter(r=>(r.Tipo||'').includes(state.type)&&(r.Dia||'').includes(state.day));
app.innerHTML=header(state.type+" "+state.day)+items.map(r=>`
<button class="btn" onclick="video('${encodeURIComponent(r.Video||'')}')">${r.Ejercicio||''}</button>`).join('');
}
}

function video(u){
let url=decodeURIComponent(u);
document.getElementById('app').innerHTML=header('Video')+`
<iframe src="${url.replace('shorts/','embed/').replace('watch?v=','embed/')}" style="width:100%;height:70vh;border:none"></iframe>`;
}

init();