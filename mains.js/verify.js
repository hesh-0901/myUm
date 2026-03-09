import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

init();

async function init(){

const params = new URLSearchParams(window.location.search);

const uid = params.get("uid");

if(!uid){

showError("Document invalide");

return;

}

const snap = await getDoc(doc(db,"users",uid));

if(!snap.exists()){

showError("Document non reconnu");

return;

}

showValid(snap.data());

}

function showValid(data){

document.getElementById("verifyStatus").innerHTML=`
<div class="flex flex-col items-center gap-2">

<i class="bi bi-patch-check-fill text-green-500 text-5xl"></i>

<span class="text-green-600 font-semibold">
Document vérifié
</span>

<p class="text-sm text-gray-500">
Ce document appartient à un utilisateur MyUm.
</p>

</div>
`;

const card = document.getElementById("profileCard");

card.classList.remove("hidden");

document.getElementById("photo").src =
data.photoURL || "https://via.placeholder.com/150";

document.getElementById("name").innerText =
`${data.firstName} ${data.lastName}`;

document.getElementById("username").innerText =
`@${data.username}`;

document.getElementById("fonction").innerText =
data.fonction || "";

}

function showError(msg){

document.getElementById("verifyStatus").innerHTML=`
<div class="flex flex-col items-center gap-2">

<i class="bi bi-x-circle-fill text-red-500 text-5xl"></i>

<span class="text-red-600 font-semibold">
Document invalide
</span>

<p class="text-sm text-gray-500">
${msg}
</p>

</div>
`;

}
