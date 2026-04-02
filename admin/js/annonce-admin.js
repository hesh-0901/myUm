// 🔹 1. Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUuDQi3xzCT7lV1lOf3rhq724rfHhiTIQ",
  authDomain: "umapp-72f36.firebaseapp.com",
  projectId: "umapp-72f36",
  storageBucket: "umapp-72f36.firebasestorage.app",
  messagingSenderId: "483188283543",
  appId: "1:483188283543:web:b52415f83bf21bad2071d2",
  measurementId: "G-6X2ELMB8RY"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 🔹 Pagination
const pageSize = 3;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;

// 🔹 MODELE GLOBAL (IMPORTANT)
const annonceModel = {
    titre: "",
    message: "",
    categorie: "",
    date_publication: null,
    vues: 0,
    likes: 0,
    user_id: "",
    statut: "actif" // futur (archivé, supprimé...)
};

// 🔹 🔐 AUTH CHECK
function getUser() {
    const user = auth.currentUser;
    if (!user) {
        alert("Connecte-toi !");
        throw new Error("Non connecté");
    }
    return user;
}

// 🔹 2. AJOUTER ANNONCE (COMPLET)
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = getUser();

    const annonce = {
        ...annonceModel,
        titre: document.getElementById('titre').value,
        message: document.getElementById('message').value,
        categorie: document.getElementById('categorie').value,
        date_publication: new Date(document.getElementById('date_publication').value),
        user_id: user.uid
    };

    await db.collection('annonces').add(annonce);

    alert('✅ Annonce ajoutée !');
    e.target.reset();

    currentPage = 1;
    loadAnnonces();
});

// 🔹 3. SUPPRIMER ANNONCE
async function deleteAnnonce(id) {
    const user = getUser();

    if (confirm("Supprimer cette annonce ?")) {
        await db.collection('annonces').doc(id).delete();
        loadAnnonces();
    }
}

// 🔹 4. NETTOYAGE AUTO (ANNONCES EXPIRÉES)
async function cleanupOldAnnonces() {
    const today = new Date();

    const snapshot = await db.collection('annonces')
        .where('date_publication', '<', today)
        .get();

    snapshot.forEach(doc => doc.ref.update({ statut: "expiré" }));
}

// 🔹 5. LIKE (ANTI-SPAM)
async function likeAnnonce(id) {
    const user = getUser();

    const likeRef = db.collection("likes");

    const exist = await likeRef
        .where("user_id", "==", user.uid)
        .where("annonce_id", "==", id)
        .get();

    if (!exist.empty) {
        alert("Déjà liké !");
        return;
    }

    await likeRef.add({
        user_id: user.uid,
        annonce_id: id,
        date: new Date()
    });

    await db.collection("annonces").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    });

    loadAnnonces();
}

// 🔹 6. VUES (ANTI DOUBLE)
let vuesLocal = JSON.parse(localStorage.getItem("vues")) || {};

async function addVue(id) {
    if (vuesLocal[id]) return;

    vuesLocal[id] = true;
    localStorage.setItem("vues", JSON.stringify(vuesLocal));

    await db.collection("annonces").doc(id).update({
        vues: firebase.firestore.FieldValue.increment(1)
    });
}

// 🔹 7. AFFICHAGE
function displayAnnonces(docs) {
    const container = document.getElementById('annonces');
    container.innerHTML = '';

    if (docs.length === 0) {
        container.innerHTML = '<p>Aucune annonce</p>';
        return;
    }

    docs.forEach(doc => {
        const data = doc.data();

        const div = document.createElement('div');
        div.className = 'annonce';

        div.innerHTML = `
            <h3>${data.titre}</h3>
            <p>${data.message}</p>
            <small>
                ${data.categorie} | 
                ${data.date_publication?.toDate().toLocaleDateString()}
            </small>

            <div>
                👁 ${data.vues || 0}
                ❤️ ${data.likes || 0}
            </div>

            <button onclick="likeAnnonce('${doc.id}')">Like</button>
            <button onclick="deleteAnnonce('${doc.id}')">Supprimer</button>
        `;

        div.onclick = () => addVue(doc.id);

        container.appendChild(div);
    });

    document.getElementById('pageInfo').innerText = `Page ${currentPage}`;
}

// 🔹 8. PAGINATION
async function loadAnnonces(direction = 'next') {
    await cleanupOldAnnonces();

    let query = db.collection('annonces')
        .where("statut", "==", "actif")
        .orderBy('date_publication', 'desc')
        .limit(pageSize);

    if (direction === 'next' && lastVisible) {
        query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();

    if (snapshot.empty) return;

    firstVisible = snapshot.docs[0];
    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    displayAnnonces(snapshot.docs);
}

// 🔹 9. INIT
loadAnnonces();
