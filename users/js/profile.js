// ======================================
// FIREBASE IMPORTS
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


// ======================================
// VARIABLES GLOBALES
// ======================================

const storage = getStorage();

let currentUserId = null;
let currentUserData = null;

let cropper = null;


// ======================================
// INIT PAGE
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) {
    window.location.href = "/myUm/users/login.html";
    return;
  }

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  await loadUserProfile();

  initEditButtons();
  initLogout();
  initPhotoCrop(); // initialisation cropper

});


// ======================================
// LOAD USER DATA
// ======================================

async function loadUserProfile() {

  try {

    const userRef = doc(db, "users", currentUserId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    currentUserData = snap.data();


    // ======================================
    // HEADER PROFIL
    // ======================================

    // Nom complet
    document.getElementById("fullName").innerText =
      `${currentUserData.firstName} ${currentUserData.lastName}`;


    // Fonction
    const functionEl = document.getElementById("userFunction");

    if (functionEl) {
      functionEl.innerText = currentUserData.fonction || "";
    }


    // Username
    document.getElementById("username").innerText =
      `@${currentUserData.username}`;


   // ======================================
// BADGE CHORALE
// ======================================

const choraleBadge = document.getElementById("choraleBadge");

if (choraleBadge) {

  choraleBadge.innerText = currentUserData.chorale || "";

  choraleBadge.className =
    "px-3 py-1 text-xs rounded-full bg-accent/20 text-accent font-medium";

}


// ======================================
// BADGE ROLE
// ======================================

const roleBadge = document.getElementById("roleBadge");

if (roleBadge) {

  roleBadge.innerText = currentUserData.role || "";

  // Style dynamique selon rôle
  switch (currentUserData.role) {

    case "super_admin":

      roleBadge.className =
        "px-3 py-1 text-xs rounded-full bg-accent/30 text-accent font-semibold";

      break;


    case "admin":

      roleBadge.className =
        "px-3 py-1 text-xs rounded-full bg-primary/20 text-primary font-semibold";

      break;


    default:

      roleBadge.className =
        "px-3 py-1 text-xs rounded-full bg-white/10 text-soft font-medium";

  }

}

    // Friends / Posts
    document.getElementById("friendsCount").innerText =
      currentUserData.friendsCount || 0;

    document.getElementById("postsCount").innerText =
      currentUserData.postsCount || 0;


    // ======================================
    // PHOTO PROFIL
    // ======================================

    const profilePhoto = document.getElementById("profilePhoto");

    if (currentUserData.photoURL) {

      profilePhoto.src = currentUserData.photoURL;

    } else {

      profilePhoto.src =
        "https://ui-avatars.com/api/?name=" +
        currentUserData.firstName +
        "+" +
        currentUserData.lastName +
        "&background=1A3668&color=fff";
    }


    // ======================================
    // INFORMATIONS MODULE
    // ======================================

    setField("bio", currentUserData.bio);
    setField("phone", currentUserData.phone);
    setField("birthday", currentUserData.birthday);
    setField("age", currentUserData.age);
    setField("fonction", currentUserData.fonction);

  } catch (error) {

    console.error("Erreur chargement profil :", error);

  }

}


// ======================================
// SET FIELD
// ======================================

function setField(field, value) {

  const el = document.getElementById("info-" + field);

  if (!el) return;

  el.innerText = value || "—";

}


// ======================================
// EDIT BUTTONS
// ======================================

function initEditButtons() {

  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const field = btn.dataset.field;

      const valueElement = document.getElementById("info-" + field);

      const currentValue = valueElement.innerText === "—"
        ? ""
        : valueElement.innerText;


      // Si déjà en mode input
      if (
        valueElement.tagName === "INPUT" ||
        valueElement.tagName === "TEXTAREA"
      ) {
        return;
      }


      // Création input
      let input;

      if (field === "bio") {

        input = document.createElement("textarea");

      } else {

        input = document.createElement("input");
        input.type = "text";

      }

      input.className =
        "w-full mt-1 p-2 text-sm border rounded-lg focus:outline-none focus:border-primary";

      input.value = currentValue;

      valueElement.replaceWith(input);

      input.id = "info-" + field;


      // Icône check
      btn.innerHTML = '<i class="bi bi-check-lg text-primary"></i>';


      btn.onclick = async () => {

        const newValue = input.value.trim();

        try {

          await updateDoc(doc(db, "users", currentUserId), {
            [field]: newValue
          });

          currentUserData[field] = newValue;

        } catch (error) {

          console.error("Erreur update :", error);

        }


        const newText = document.createElement("p");

        newText.id = "info-" + field;

        newText.className = "text-sm mt-1";

        newText.innerText = newValue || "—";

        input.replaceWith(newText);

        btn.innerHTML = '<i class="bi bi-pencil"></i>';

        initEditButtons();

      };

    });

  });

}


// ======================================
// PHOTO CROP + UPLOAD
// ======================================

function initPhotoCrop() {

  const photoInput = document.getElementById("photoInput");
  const cropModal = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");

  const confirmCrop = document.getElementById("confirmCrop");
  const cancelCrop = document.getElementById("cancelCrop");

  if (!photoInput) return;


  // Sélection image
  photoInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      cropImage.src = reader.result;

      cropModal.classList.remove("hidden");
      cropModal.classList.add("flex");

      if (cropper) cropper.destroy();

      cropper = new Cropper(cropImage, {

        aspectRatio: 1,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        background: false

      });

    };

    reader.readAsDataURL(file);

  });


  // CONFIRM CROP
  confirmCrop.addEventListener("click", async () => {

    const canvas = cropper.getCroppedCanvas({
      width: 400,
      height: 400
    });

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );

    try {

      const storageRef = ref(storage, "profilePhotos/" + currentUserId);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", currentUserId), {
        photoURL: downloadURL
      });

      document.getElementById("profilePhoto").src = downloadURL;

    } catch (error) {

      console.error("Erreur upload photo :", error);

    }

    cropModal.classList.add("hidden");

    if (cropper) cropper.destroy();

  });


  // CANCEL CROP
  cancelCrop.addEventListener("click", () => {

    cropModal.classList.add("hidden");

    if (cropper) cropper.destroy();

  });

}


// ======================================
// LOGOUT
// ======================================

function initLogout() {

  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("myum_user");

    window.location.href = "/myUm/users/login.html";

  });

}
