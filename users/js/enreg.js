// =======================================
// ENREG.JS - MYUM PREMIUM ENGINE
// =======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  initEditableSystem();
}

// ===============================
// LOAD USER DATA
// ===============================
async function loadUserData() {

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  currentUserData = snap.data();

  // Profil résumé
  setText("fullName", currentUserData.firstName + " " + currentUserData.lastName);
  setText("username", "@" + currentUserData.username);
  setText("userFunction", currentUserData.fonction || "");
  document.getElementById("profilePhoto").src =
    currentUserData.photoURL || "https://via.placeholder.com/150";

  // Champs dynamiques
  document.querySelectorAll(".field").forEach(field => {
    const key = field.dataset.field;
    const valueEl = field.querySelector(".value");

    let value = currentUserData[key];

    if (Array.isArray(value)) {
      valueEl.innerText = value.length ? value.join(", ") : "—";
    } else {
      valueEl.innerText = value || "—";
    }
  });

  handleEtatCivilVisibility();
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

      // Prevent double edit
      if (fieldWrapper.classList.contains("editing")) return;

      fieldWrapper.classList.add("editing");

      const currentValue =
        valueEl.innerText === "—" ? "" : valueEl.innerText;

      let input = createInput(type, key, currentValue);

      valueEl.replaceWith(input);

      btn.innerHTML = '<i class="bi bi-check-lg text-primary"></i>';

      btn.onclick = async () => {

        let newValue = getInputValue(type, input);

        // Validation required
        if (required && (!newValue || newValue.length === 0)) {
          input.classList.add("border-red-500");
          return;
        }

        await updateDoc(doc(db, "users", currentUserId), {
          [key]: newValue
        });

        fieldWrapper.classList.remove("editing");

        const newText = document.createElement("p");
        newText.className = "value text-sm mt-1";
        newText.innerText =
          Array.isArray(newValue)
            ? newValue.join(", ")
            : newValue || "—";

        input.replaceWith(newText);

        btn.innerHTML = '<i class="bi bi-pencil"></i>';

        handleEtatCivilVisibility();
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
      input.min = 1960;
      input.max = new Date().getFullYear();
      input.value = currentValue;
      break;

    case "radio":
      input = createRadioGroup(key, currentValue);
      break;

    case "select":
      input = createSelect(key, currentValue);
      break;

    case "checkbox":
      input = createCheckboxGroup(key, currentValue);
      break;

    default:
      input = document.createElement("input");
      input.type = "text";
  }

  input.classList.add(
    "value",
    "mt-2",
    "text-sm",
    "w-full",
    "p-2",
    "border",
    "rounded-lg",
    "focus:outline-none",
    "focus:border-primary"
  );

  return input;
}

// ===============================
// RADIO
// ===============================
function createRadioGroup(key, currentValue) {

  const wrapper = document.createElement("div");
  wrapper.className = "value mt-2 space-y-2 text-sm";

  let options = [];

  if (key === "genre") options = ["Homme", "Femme"];
  if (key === "etatCivil") options = ["Marié(e)", "Célibataire"];
  if (key === "typeBapteme") options = ["Immersion", "Aspersion"];
  if (key === "responsableMinistere") options = ["Oui", "Non"];
  if (key === "groupeMusique") options = ["Oui", "Non"];

  options.forEach(opt => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-2";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = key;
    radio.value = opt;

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

  let options = [];

  if (key === "statutRelationnel")
    options = ["En relation", "Pas en relation", "Autres"];

  if (key === "commune")
    options = [
      "Annexe", "Kampemba", "Katuba",
      "Kenya", "Lubumbashi", "Ruashi", "Kamalondo"
    ];

  if (key === "statutAffermissement")
    options = [
      "Affermi(e)", "Niveau 1", "Niveau 2",
      "Niveau 3", "Niveau 4",
      "Affermi(e) ailleurs", "Pas en processus"
    ];

  if (key === "registreVoix")
    options = [
      "Baryton", "Alto", "Soprano",
      "Ténor", "Basse", "Instrumentiste"
    ];

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
// CHECKBOX (max 2)
// ===============================
function createCheckboxGroup(key, currentValue) {

  const wrapper = document.createElement("div");
  wrapper.className = "value mt-2 space-y-2 text-sm";

  const options = [
    "Élève", "Étudiant(e)", "Libéral(e)", "Femme au foyer", "Travailleur(se)"
  ];

  let selected = currentValue
    ? currentValue.split(", ").filter(v => v)
    : [];

  options.forEach(opt => {

    const label = document.createElement("label");
    label.className = "flex items-center gap-2";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = opt;

    if (selected.includes(opt)) checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      const checked = wrapper.querySelectorAll("input:checked");
      if (checked.length > 2) {
        checkbox.checked = false;
      }
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
    return Array.from(input.querySelectorAll("input:checked"))
      .map(cb => cb.value);
  }

  if (type === "select") {
    return input.value;
  }

  return input.value.trim();
}

// ===============================
// CONDITIONAL LOGIC
// ===============================
function handleEtatCivilVisibility() {

  const wrapper = document.getElementById("statutRelationnelWrapper");

  if (!currentUserData) return;

  if (currentUserData.etatCivil === "Célibataire") {
    wrapper.classList.remove("hidden");
  } else {
    wrapper.classList.add("hidden");
  }
}

// ===============================
// HELPERS
// ===============================
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "";
}
