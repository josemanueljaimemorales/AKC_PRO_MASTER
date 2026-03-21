
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
        nombre: row["Ejercicio"],
        series: row["Series"],
        reps: row["Reps"],
        peso: row["Peso"],
        video: row["Video"]
    }));

    home();
});

function home(){
    document.getElementById("app").innerHTML = `
        <button class="btn" onclick="verSemanas()">💪 Fuerza</button>
    `;
}

function verSemanas(){
    let html = `<div class="back" onclick="home()">⬅</div>`;
    [1,2,3].forEach(s=>{
        html += `<button class="btn" onclick="verDias(${s})">Semana ${s}</button>`;
    });
    document.getElementById("app").innerHTML = html;
}

function verDias(semana){
    let html = `<div class="back" onclick="verSemanas()">⬅</div>`;
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

    let html = `<div class="back" onclick="verDias(${semana})">⬅</div>`;

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

function verVideo(url){
    document.getElementById("app").innerHTML = `
        <div class="back" onclick="verSemanas()">⬅</div>
        <iframe class="video" src="${url}" allowfullscreen></iframe>
    `;
}
