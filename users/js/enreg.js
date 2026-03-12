// =======================================
// ENREG.JS - MYUM PREMIUM ENGINE
// =======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let currentUserData = null;

document.addEventListener("DOMContentLoaded", initEnreg);

// ===============================
// INIT
// ===============================
async function initEnreg() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);

  currentUserId = sessionUser.id;

  await loadUserData();

  injectBackButton();

  highlightRequiredFields();

  initEditableSystem();
}

// ===============================
// LOAD USER DATA
// ===============================
async function loadUserData() {

  const snap = await getDoc(doc(db, "users", currentUserId));

  if (!snap.exists()) return;

  currentUserData = snap.data();

  setText("fullName", currentUserData.firstName + " " + currentUserData.lastName);

  setText("username", "@" + currentUserData.username);

  setText("userFunction", currentUserData.fonction || "");

  const photo = document.getElementById("profilePhoto");

  if (photo) {
    photo.src = currentUserData.photoURL || "https://via.placeholder.com/150";
  }

  document.querySelectorAll(".field").forEach(field => {

    const key = field.dataset.field;

    const valueEl = field.querySelector(".value");

    if (!valueEl) return;

    let value = currentUserData[key];

    if (Array.isArray(value)) {
      valueEl.innerText = value.length ? value.join(", ") : "—";
    } else {
      valueEl.innerText = value || "—";
    }

  });

  handleEtatCivilVisibility();
  handleTypeMembreVisibility();
  updateProfileCompletion(currentUserData);
}

// ===============================
// BACK BUTTON
// ===============================
function injectBackButton() {

  const container = document.querySelector(".max-w-md");

  if (!container) return;

  const wrapper = document.createElement("div");

  wrapper.className = "flex items-center gap-3 mb-6";

  wrapper.innerHTML = `
    <button id="backBtn"
      class="w-10 h-10 flex items-center justify-center rounded-full 
             bg-white shadow-md border border-gray-200 
             text-primary hover:bg-lightblue/10 
             active:scale-95 transition">
      <i class="bi bi-arrow-left text-lg"></i>
    </button>

    <h1 class="text-lg font-semibold text-primary">
      Mon Profil
    </h1>
  `;

  container.prepend(wrapper);

  document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
  });
}

// ===============================
// HIGHLIGHT REQUIRED FIELDS
// ===============================
function highlightRequiredFields() {

  document.querySelectorAll(".field[data-required='true']").forEach(field => {

    const valueEl = field.querySelector(".value");

    if (valueEl && valueEl.innerText.trim() === "—") {

      field.classList.add(
        "bg-red-50",
        "border-l-4",
        "border-danger",
        "pl-3",
        "rounded-lg"
      );

    }

  });

}

// ===============================
// EDIT SYSTEM
// ===============================
function initEditableSystem() {

  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const fieldWrapper = btn.closest(".field");

      const key = fieldWrapper.dataset.field;

      const type = fieldWrapper.dataset.type;

      const required = fieldWrapper.dataset.required === "true";

      const valueEl = fieldWrapper.querySelector(".value");

      if (fieldWrapper.classList.contains("editing")) return;

      fieldWrapper.classList.add("editing", "animate-pulse");

      const currentValue = valueEl.innerText === "—" ? "" : valueEl.innerText;

      let input = createInput(type, key, currentValue);

      valueEl.replaceWith(input);

      btn.innerHTML = '<i class="bi bi-check-lg text-primary text-lg"></i>';

      btn.onclick = async () => {

        let newValue = getInputValue(type, input);

        if (required && (!newValue || newValue.length === 0)) {

          input.classList.add("border-danger", "bg-red-50");

          return;

        }

      await updateDoc(doc(db, "users", currentUserId), { [key]: newValue });
      
      currentUserData[key] = newValue;
      
      updateProfileCompletion(currentUserData);

        fieldWrapper.classList.remove("editing", "animate-pulse");

        const newText = document.createElement("p");

        newText.className = "value text-sm mt-2 font-medium text-gray-800";

        newText.innerText =
          Array.isArray(newValue)
            ? newValue.join(", ")
            : newValue || "—";

        input.replaceWith(newText);

        btn.innerHTML = '<i class="bi bi-pencil text-sm"></i>';

        highlightRequiredFields();

        handleEtatCivilVisibility();
        handleTypeMembreVisibility();
        
        initEditableSystem();
      };
    });
  });
}

// ===============================
// CREATE INPUTS
// ===============================
function createInput(type, key, currentValue) {

  let input;

  switch (type) {

    case "text":

      input = document.createElement("input");

      input.type = "text";

      input.value = currentValue;

      break;

      case "year":
      
        input = document.createElement("input");
      
        input.type = "number";
        input.min = 1900;
        input.max = new Date().getFullYear();
      
        input.placeholder = "AAAA";
        input.value = currentValue;
      
        input.addEventListener("input", () => {
      
          if (input.value.length > 4) {
            input.value = input.value.slice(0, 4);
          }
      
        });
      
        break;
      
         case "date":
        
          input = document.createElement("input");
        
          input.type = "date";
        
          input.max = new Date().toISOString().split("T")[0];
        
          input.value = currentValue;
    
          break;

          case "textarea":
          
            input = document.createElement("textarea");
          
            input.rows = 3;
            input.value = currentValue;
          
            const maxWords = 30;
          
            // compteur
            const counter = document.createElement("div");
            counter.className = "text-xs text-gray-400 mt-1 text-right";
            counter.innerText = "0 / 30 mots";
          
            input.addEventListener("input", () => {
          
              const words = input.value.trim().split(/\s+/).filter(w => w);
          
              // limite
              if(words.length > maxWords){
                input.value = words.slice(0,maxWords).join(" ");
              }
          
              // mise à jour compteur
              const count = input.value.trim().split(/\s+/).filter(w => w).length;
              counter.innerText = `${count} / 30 mots`;
          
            });
          
            // ajouter le compteur sous le textarea
            setTimeout(()=>{
              input.parentNode.appendChild(counter);
            });
          
          break;

    case "radio":

      return createRadioGroup(key, currentValue);

    case "select":

      return createSelect(key, currentValue);

    case "checkbox":

      return createCheckboxGroup(key, currentValue);

    default:

      input = document.createElement("input");

      input.type = "text";

  }

  input.classList.add(
    "value",
    "mt-3",
    "text-sm",
    "w-full",
    "p-3",
    "border",
    "border-gray-300",
    "rounded-xl",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-lightblue",
    "transition"
  );

  return input;
}

// ===============================
// RADIO
// ===============================
function createRadioGroup(key, currentValue) {

  const wrapper = document.createElement("div");

  wrapper.className = "value mt-3 space-y-3 text-sm";

  let options = [];

  if (key === "genre") options = ["Homme", "Femme"];
  if (key === "etatCivil") options = ["Marié(e)", "Célibataire"];
  if (key === "typeBapteme") options = ["Immersion", "Aspersion"];
  if (key === "responsableMinistere") options = ["Oui", "Non"];
  if (key === "groupeMusique") options = ["Oui", "Non"];
  if (key === "typeMembre") options = ["Ancien membre", "Nouveau membre"];

  options.forEach(opt => {

    const label = document.createElement("label");

    label.className = "flex items-center gap-3 bg-gray-50 p-3 rounded-xl cursor-pointer";

    const radio = document.createElement("input");

    radio.type = "radio";

    radio.name = key;

    radio.value = opt;

    radio.className = "accent-primary";

    if (opt === currentValue) radio.checked = true;

    label.appendChild(radio);

    label.appendChild(document.createTextNode(opt));

    wrapper.appendChild(label);
  });

  return wrapper;
}

// ===============================
// SELECT
// ===============================
function createSelect(key, currentValue) {

  const select = document.createElement("select");

  select.className =
    "value mt-3 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lightblue transition";

  let options = [];

  if (key === "statutRelationnel")
    options = ["En relation", "Pas en relation", "Autres"];

  if (key === "commune")
    options = ["Annexe", "Kampemba", "Katuba", "Kenya", "Lubumbashi", "Ruashi", "Kamalondo"];

  if (key === "statutAffermissement")
    options = ["Affermi(e)", "Niveau 1", "Niveau 2", "Niveau 3", "Niveau 4", "Affermi(e) ailleurs", "Pas en processus"];

  if (key === "registreVoix")
    options = ["Baryton", "Alto", "Soprano", "Ténor", "Basse", "Instrumentiste"];

  options.forEach(opt => {

    const option = document.createElement("option");

    option.value = opt;

    option.textContent = opt;

    if (opt === currentValue) option.selected = true;

    select.appendChild(option);

  });

  return select;
}

// ===============================
// CHECKBOX
// ===============================
function createCheckboxGroup(key, currentValue) {

  const wrapper = document.createElement("div");

  wrapper.className = "value mt-3 space-y-3 text-sm";

  const options = ["Élève", "Étudiant(e)", "Libéral(e)", "Femme au foyer", "Travailleur(se)"];

  let selected = [];

  if (Array.isArray(currentValue)) {
    selected = currentValue;
  } else if (typeof currentValue === "string") {
    selected = currentValue.split(", ").filter(v => v);
  }

  options.forEach(opt => {

    const label = document.createElement("label");

    label.className = "flex items-center gap-3 bg-gray-50 p-3 rounded-xl cursor-pointer";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.value = opt;

    checkbox.className = "accent-primary";

    if (selected.includes(opt)) checkbox.checked = true;

    checkbox.addEventListener("change", () => {

      const checked = wrapper.querySelectorAll("input:checked");

      if (checked.length > 2) checkbox.checked = false;

    });

    label.appendChild(checkbox);

    label.appendChild(document.createTextNode(opt));

    wrapper.appendChild(label);

  });

  return wrapper;
}

// ===============================
// GET VALUE
// ===============================
function getInputValue(type, input) {

  if (type === "radio") {

    const checked = input.querySelector("input:checked");

    return checked ? checked.value : "";

  }

  if (type === "checkbox") {

    return Array.from(input.querySelectorAll("input:checked")).map(cb => cb.value);

  }

  if (type === "select") {

    return input.value;

  }

  if (type === "date") {

  return input.value;

}

return input.value.trim();
}

// ===============================
// CONDITIONAL LOGIC
// ===============================
function handleEtatCivilVisibility() {

  const wrapper = document.getElementById("statutRelationnelWrapper");

  if (!wrapper || !currentUserData) return;

  if (currentUserData.etatCivil === "Célibataire") {

    wrapper.classList.remove("hidden");

  } else {

    wrapper.classList.add("hidden");

  }
}

// ===============================
// TYPE MEMBRE VISIBILITY
// ===============================
function handleTypeMembreVisibility(){

  const ancien = document.getElementById("ancienMembreSection");
  const nouveau = document.getElementById("nouveauMembreSection");

  if(!ancien || !nouveau || !currentUserData) return;

  if(currentUserData.typeMembre === "Ancien membre"){

    ancien.classList.remove("hidden");
    nouveau.classList.add("hidden");

  }

  else if(currentUserData.typeMembre === "Nouveau membre"){

    nouveau.classList.remove("hidden");
    ancien.classList.add("hidden");

  }

  else{

    ancien.classList.add("hidden");
    nouveau.classList.add("hidden");

  }

}

function updateProfileCompletion(data){

  const fields = [

    "genre",
    "etatCivil",
    "commune",
    "vieSeculiere",

    "typeMembre",
    "egliseProvenance",
    "anneeBapteme",
    "typeBapteme",

    "statutAffermissement",
    "responsableMinistere",

    "registreVoix",
    "groupeMusique"

  ];

  let filled = 0;

  fields.forEach(field => {

    const value = data[field];

    if(value && value !== "" && value !== "—"){
      filled++;
    }

  });

  const percent = Math.round((filled / fields.length) * 100);

  const bar = document.getElementById("profileProgress");
  const label = document.getElementById("profilePercent");

  if(bar) bar.style.width = percent + "%";
  if(label) label.innerText = percent + "%";

}

// ===============================
// HELPERS
// ===============================
function setText(id, value) {

  const el = document.getElementById(id);

  if (el) el.innerText = value || "";

}
