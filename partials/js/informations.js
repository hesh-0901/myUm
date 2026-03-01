import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let currentUserData = null;

export async function initInformations() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  await loadInformations();
  initEditableFields();
}

// =====================
// LOAD DATA
// =====================
async function loadInformations() {

  const userRef = doc(db, "users", currentUserId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  currentUserData = snap.data();

  setField("bio", currentUserData.bio);
  setField("phone", currentUserData.phone);
  setField("birthday", currentUserData.birthday);
  setField("age", currentUserData.age);
  setField("fonction", currentUserData.fonction);
}

function setField(field, value) {
  const el = document.getElementById("info-" + field);
  if (el) {
    el.innerText = value || "—";
  }
}

// =====================
// EDIT BIO + PHONE
// =====================
function initEditableFields() {

  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const field = btn.dataset.field;
      const el = document.getElementById("info-" + field);

      const currentValue = el.innerText === "—" ? "" : el.innerText;

      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue;
      input.className =
        "w-full mt-1 p-2 text-sm border rounded-lg focus:outline-none focus:border-primary";

      el.replaceWith(input);
      input.id = "info-" + field;

      btn.innerHTML = '<i class="bi bi-check-lg text-primary"></i>';

      btn.onclick = async () => {

        const newValue = input.value.trim();

        await updateDoc(doc(db, "users", currentUserId), {
          [field]: newValue
        });

        const newText = document.createElement("p");
        newText.id = "info-" + field;
        newText.className = "text-sm mt-1";
        newText.innerText = newValue || "—";

        input.replaceWith(newText);

        btn.innerHTML = '<i class="bi bi-pencil"></i>';

        initEditableFields();
      };

    });

  });

}
