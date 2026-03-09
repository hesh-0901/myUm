console.log("export-enreg-pdf chargé");

document.addEventListener("DOMContentLoaded", () => {

const header = document.getElementById("header-back");

if (!header) return;


// observer les changements du header

const observer = new MutationObserver(() => {

const title = header.querySelector("h1, h2, span");

if (!title) return;


// créer container actions

let actions = header.querySelector("#header-actions");

if (!actions) {

actions = document.createElement("div");

actions.id = "header-actions";

actions.className =
"absolute right-4 top-1/2 -translate-y-1/2 flex items-center";

header.style.position = "relative";

header.appendChild(actions);

}


// ajouter bouton

if (!actions.querySelector(".pdf-btn")) {

const btn = document.createElement("button");

btn.className =
"pdf-btn w-10 h-10 flex items-center justify-center rounded-full bg-lightblue/10 text-medium hover:bg-lightblue/20 transition";

btn.innerHTML =
`<i class="bi bi-file-earmark-pdf text-lg"></i>`;

btn.onclick = () => alert("PDF export prêt");

actions.appendChild(btn);

}

observer.disconnect();

});


observer.observe(header,{
childList:true,
subtree:true
});

});
