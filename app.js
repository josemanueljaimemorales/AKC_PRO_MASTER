let wb,data=[],state={view:'home',tipo:null,semana:null,dia:null,aparato:null};

async function init(){
const res=await fetch('AKC.xlsx');
const buf=await res.arrayBuffer();
wb=XLSX.read(buf);
data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
render();
}

function nav(view,p={}){state={...state,...p,view};render();}

function header(t){return `<div class="header"><button class="back" onclick="nav('home',{tipo:null})">⬅</button><div>${t}</div><div></div></div>`;}

function render(){
let app=document.getElementById('app');

if(state.view==='home'){
app.innerHTML=`
<button class="btn" onclick="nav('semana',{tipo:'Fuerza'})">💪 Fuerza</button>
<button class="btn" onclick="nav('list',{tipo:'Preventivo'})">🛡 Preventivo</button>
<button class="btn" onclick="nav('list',{tipo:'Orientacion'})">🧭 Orientación</button>
<button class="btn" onclick="nav('aparato',{tipo:'Drill'})">⚙ Drill</button>
<button class="btn" onclick="nav('aparato',{tipo:'F ESP APA'})">🏋 F Esp Aparato</button>`;
}

if(state.view==='semana'){
app.innerHTML=header('Semana')+`
<button class="btn" onclick="nav('dias',{semana:'1'})">Semana 1</button>
<button class="btn" onclick="nav('dias',{semana:'2'})">Semana 2</button>
<button class="btn" onclick="nav('dias',{semana:'3'})">Semana 3</button>`;
}

if(state.view==='dias'){
app.innerHTML=header('Día')+`
<button class="btn" onclick="nav('list',{dia:'Lunes'})">Lunes</button>
<button class="btn" onclick="nav('list',{dia:'Miercoles'})">Miércoles</button>
<button class="btn" onclick="nav('list',{dia:'Viernes'})">Viernes</button>`;
}

if(state.view==='aparato'){
let aparatos=[...new Set(data.map(r=>r.Aparato).filter(a=>a))];
app.innerHTML=header('Aparato')+
aparatos.map(a=>`<button class="btn" onclick="nav('list',{aparato:'${a}'})">${a}</button>`).join('');
}

if(state.view==='list'){
let items=data.filter(r=>{
if(state.tipo==='Fuerza'){
return r.Tipo==='Fuerza' && r.Semana==state.semana && r.Dia==state.dia;
}
if(state.tipo==='Preventivo'){
return r.Tipo==='Preventivo' && r.Dia==='Jueves';
}
if(state.tipo==='Orientacion'){
return r.Tipo==='Orientacion';
}
if(state.tipo==='Drill' || state.tipo==='F ESP APA'){
return r.Tipo===state.tipo && r.Aparato===state.aparato;
}
return false;
});

app.innerHTML=header(state.tipo)+items.map(r=>`
<button class="btn" onclick="video('${encodeURIComponent(r.Video||'')}')">
${r.Ejercicio||''}
</button>`).join('');
}
}

function video(u){
let url=decodeURIComponent(u);
document.getElementById('app').innerHTML=header('Video')+
`<iframe src="${url.replace('shorts/','embed/').replace('watch?v=','embed/')}" style="width:100%;height:70vh;border:none"></iframe>`;
}

init();