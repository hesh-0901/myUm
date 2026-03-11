import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const userId = params.get("id");

const profileDiv = document.getElementById("profile");

async function loadProfile(){

if(!userId){

profileDiv.innerHTML = "<p>Profil invalide</p>";
return;

}

const snap = await getDoc(doc(db,"users",userId));

if(!snap.exists()){

profileDiv.innerHTML = "<p>Profil non trouvé</p>";
return;

}

const data = snap.data();

profileDiv.innerHTML = `

<div class="name">
${data.firstName} ${data.lastName}
</div>

<div class="role">
${data.fonction || ""}
</div>

<div class="verified">
Profil vérifié par MyUM
</div>

<p>@${data.username || ""}</p>

`;

}

loadProfile();
