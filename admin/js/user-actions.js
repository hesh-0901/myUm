import { db } from "../../mains.js/firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// NAVIGATION PROFIL
// ===============================
export function goToUserProfile(user){

localStorage.setItem("myum_user", JSON.stringify({
id: user.id
}));

window.location.href = "/myUm/users/enreg.html";

}


// ===============================
// SUSPENDRE UTILISATEUR
// ===============================
export async function suspendUser(user){

if(!confirm("Suspendre ce compte ?")) return;

try{

const ref = doc(db,"users",user.id);

await updateDoc(ref,{
isActive: "suspended"
});

alert("Compte suspendu");

}catch(err){

console.error(err);
alert("Erreur suspension");

}

}
