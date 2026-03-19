import { db } from "../../mains.js/firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// NAVIGATION PROFIL
// ===============================
export function goToUserProfile(user){

    localStorage.setItem("myum_selected_user", JSON.stringify({
      id: user.id
    }));

  window.location.href = "/myUm/users/enreg.html";
}


// ===============================
// SUSPENDRE UTILISATEUR
// ===============================
export async function suspendUser(user){

  if(!confirm("Suspendre ce compte ?")) return false;

  try{

    const ref = doc(db,"users",user.id);

    await updateDoc(ref,{
      isActive: "suspended"
    });

    return true;

  }catch(err){

    console.error(err);
    alert("Erreur suspension");

    return false;
  }

}

// ===============================
// SUPPRIMER UTILISATEUR
// ===============================
export async function deleteUser(user){

  if(!confirm("Supprimer définitivement ce compte ?")) return false;

  try{

    await deleteDoc(doc(db,"users",user.id));

    return true;

  }catch(err){

    console.error(err);
    alert("Erreur suppression");

    return false;
  }

}
