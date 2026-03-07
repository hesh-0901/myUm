// 🔹 1. Configuration Firebase
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔹 Pagination
let pageSize = 5;
let lastVisible = null;
let firstVisible = null;
let pages = [];

// 🔹 Charger annonces
async function loadAnnonces(direction = 'next') {
    let query = db.collection("annonce").orderBy("date_publication", "desc").limit(pageSize);

    if (direction === 'next' && lastVisible) {
        query = query.startAfter(lastVisible);
    } else if (direction === 'prev' && pages.length > 1) {
        pages.pop(); 
        lastVisible = pages[pages.length - 1].last;
        query = db.collection("annonce").orderBy("date_publication", "desc").startAt(lastVisible).limit(pageSize);
    }

    const snapshot = await query.get();

    if (!snapshot.empty) {
        firstVisible = snapshot.docs[0];
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        if (direction === 'next') pages.push({ first: firstVisible, last: lastVisible });

        displayAnnonces(snapshot.docs);
    }
}

// 🔹 Afficher annonces
function displayAnnonces(docs) {
    const container = document.getElementById('annonces');
    container.innerHTML = '';
    docs.forEach(doc => {
        const data = doc.data();
        const div = document.createElement('div');
        div.className = 'annonce';
        div.innerHTML = `
            <h3>${data.titre}</h3>
            <p>${data.message}</p>
            <small>Catégorie: ${data.categorie} | Publié le: ${data.date_publication}</small>
            <br>
            <button onclick="deleteAnnonce('${doc.id}')">Supprimer</button>
        `;
        container.appendChild(div);
    });
    document.getElementById('pageInfo').innerText = `Page ${pages.length}`;
}

// 🔹 Ajouter annonce
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titre = document.getElementById('titre').value;
    const message = document.getElementById('message').value;
    const categorie = document.getElementById('categorie').value;
    const date_publication = document.getElementById('date_publication').value;

    await db.collection('annonce').add({ 
        titre, message, categorie, date_publication 
    });

    alert("Annonce ajoutée !");
    loadAnnonces('next');
    e.target.reset();
});

// 🔹 Supprimer annonce
async function deleteAnnonce(id) {
    if (confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
        await db.collection('annonce').doc(id).delete();
        loadAnnonces('next');
    }
}

// 🔹 Pagination boutons
document.getElementById('nextBtn').addEventListener('click', () => loadAnnonces('next'));
document.getElementById('prevBtn').addEventListener('click', () => loadAnnonces('prev'));

// 🔹 Suppression automatique des annonces dépassées
async function cleanupOldAnnonces() {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await db.collection('annonce').where('date_publication', '<', today).get();
    snapshot.forEach(doc => doc.ref.delete());
}

// 🔹 Initialisation
cleanupOldAnnonces();
loadAnnonces();