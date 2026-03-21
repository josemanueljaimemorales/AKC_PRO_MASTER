
let dataGlobal = [];

fetch('AKC.xlsx')
.then(res => res.arrayBuffer())
.then(data => {
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    dataGlobal = json.map(row => ({
        tipo: row["Tipo"],
        dia: row["Día"],
        semana: row["Semana"],
        aparato: row["Aparato"],
        nombre: row["Ejercicio"],
        series: row["Series"],
        reps: row["Reps"],
        peso: row["Peso"],
        video: row["Video"] || row["VIDEO"] || row["link"] || ""
    }));

    home();
});

function home(){
    document.getElementById("app").innerHTML = `
        <button class="btn" onclick="verFuerza()">💪 Fuerza</button>
        <button class="btn" onclick="verPreventivo()">🛡 Preventivo</button>
        <button class="btn" onclick="verOrientacion()">🧭 Orientación</button>
        <button class="btn" onclick="verDrill()">🔁 Drill</button>
        <button class="btn" onclick="verFES()">⚡ F Esp APA</button>
    `;
}

// ================= FUERZA =================
function verFuerza(){
    let html = `<div class="back" onclick="home()">⬅</div>`;
    [1,2,3].forEach(s=>{
        html += `<button class="btn" onclick="verDias(${s})">Semana ${s}</button>`;
    });
    document.getElementById("app").innerHTML = html;
}

function verDias(semana){
    let html = `<div class="back" onclick="verFuerza()">⬅</div>`;
    ["Lunes","Miércoles","Viernes"].forEach(d=>{
        html += `<button class="btn" onclick="verEjercicios(${semana}, '${d}')">${d}</button>`;
    });
    document.getElementById("app").innerHTML = html;
}

function verEjercicios(semana, dia){
    let lista = dataGlobal.filter(e =>
        e.tipo === "Fuerza" &&
        e.semana == semana &&
        e.dia === dia
    );

    renderLista(lista, () => verDias(semana));
}

// ================= PREVENTIVO =================
function verPreventivo(){
    let html = `<div class="back" onclick="home()">⬅</div>`;
    [1,2,3].forEach(s=>{
        html += `<button class="btn" onclick="verPreventivoLista(${s})">Semana ${s}</button>`;
    });
    document.getElementById("app").innerHTML = html;
}

function verPreventivoLista(semana){
    let lista = dataGlobal.filter(e =>
        e.tipo === "Preventivo" &&
        e.semana == semana
    );

    renderLista(lista, verPreventivo);
}

// ================= ORIENTACION =================
function verOrientacion(){
    let lista = dataGlobal.filter(e => e.tipo === "Orientacion");
    renderLista(lista, home);
}

// ================= DRILL =================
function verDrill(){
    let lista = dataGlobal.filter(e => e.tipo === "Drill");
    renderLista(lista, home);
}

// ================= FES =================
function verFES(){
    let lista = dataGlobal.filter(e => e.tipo === "F Esp APA");
    renderLista(lista, home);
}

// ================= RENDER =================
function renderLista(lista, backFn){
    let html = `<div class="back" onclick="(${backFn})()">⬅</div>`;

    lista.forEach(e=>{
        html += `
        <div class="btn" onclick="verVideo('${e.video}')">
            ${e.nombre || ""}
            <div class="info">
                ${e.series ? "Series: " + e.series : ""}
                ${e.reps ? " | Reps: " + e.reps : ""}
                ${e.peso ? " | Peso: " + e.peso : ""}
            </div>
        </div>
        `;
    });

    document.getElementById("app").innerHTML = html;
}

// ================= VIDEO =================
function verVideo(url){
    if(!url){
        alert("Este ejercicio no tiene video (revisa columna Video en Excel)");
        return;
    }

    document.getElementById("app").innerHTML = `
        <div class="back" onclick="home()">⬅</div>
        <iframe class="video" src="${url}" allowfullscreen></iframe>
    `;
}
