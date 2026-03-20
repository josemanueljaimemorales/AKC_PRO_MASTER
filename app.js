
let dataGlobal = [];

fetch('AKC.xlsx')
.then(res => res.arrayBuffer())
.then(data => {
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataJson = XLSX.utils.sheet_to_json(sheet);

    dataGlobal = dataJson.map(row => ({
        tipo: row["Tipo"],
        dia: row["Día"],
        semana: row["Semana"],
        nombre: row["Ejercicio"],
        series: row["Series"],
        reps: row["Reps"],
        peso: row["Peso"],
        video: row["Video"]
    }));

    renderHome();
});

function renderHome(){
    const app = document.getElementById("app");
    app.innerHTML = `
        <button class="btn" onclick="verFuerza()">💪 Fuerza</button>
    `;
}

function verFuerza(){
    const app = document.getElementById("app");

    const ejercicios = dataGlobal.filter(e => e.tipo === "Fuerza");

    let html = `<div class="back" onclick="renderHome()">⬅</div>`;

    ejercicios.forEach(e => {
        html += `
        <div class="card" onclick="verVideo('${e.video}')">
            <div class="titulo">${e.nombre || ""}</div>
            <div class="info">
                ${e.series ? `Series: ${e.series}` : ""}
                ${e.reps ? ` | Reps: ${e.reps}` : ""}
                ${e.peso ? ` | Peso: ${e.peso}` : ""}
            </div>
        </div>
        `;
    });

    app.innerHTML = html;
}

function verVideo(url){
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="back" onclick="verFuerza()">⬅</div>
        <iframe class="video" src="${url}" allowfullscreen></iframe>
    `;
}
