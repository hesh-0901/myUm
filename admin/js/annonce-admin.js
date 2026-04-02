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
const auth = firebase.auth(); // ✅ AJOUT

// 🔹 Pagination
const pageSize = 3;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;

// 🔹 Ajouter annonce
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log("Form soumis ✅");

    try {
        const titre = document.getElementById('titre').value;
        const message = document.getElementById('message').value;
        const categorie = document.getElementById('categorie').value;
        const dateInput = document.getElementById('date_publication').value;

        const user = auth.currentUser;
        if (!user) {
            alert("Connecte-toi !");
            return;
        }

        await db.collection('annonces').add({ // ✅ CORRECTION
            titre,
            message,
            categorie,
            date_publication: firebase.firestore.Timestamp.fromDate(new Date(dateInput)), // ✅ CORRECTION
            vues: 0,
            likes: 0,
            user_id: user.uid
        });

        alert('Annonce ajoutée !');

        e.target.reset();
        currentPage = 1;
        loadAnnonces();

    } catch (err) {
        console.error(err);
        alert("Erreur : " + err.message);
    }
});

// 🔹 Supprimer annonce
async function deleteAnnonce(id) {
    if (confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
        await db.collection('annonces').doc(id).delete(); // ✅ CORRECTION
        loadAnnonces();
    }
}

// 🔹 Supprimer annonces dépassées
async function cleanupOldAnnonces() {
    const today = new Date();

    const snapshot = await db.collection('annonces') // ✅ CORRECTION
        .where('date_publication', '<', today)
        .get();

    snapshot.forEach(doc => doc.ref.delete());
}

// 🔹 Afficher annonces
function displayAnnonces(docs) {
    const container = document.getElementById('annonces');
    container.innerHTML = '';

    if (docs.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Aucune annonce.</p>';
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
                Catégorie: ${data.categorie} | 
                Publié le: ${data.date_publication?.toDate().toLocaleDateString()}
            </small>
            <button onclick="deleteAnnonce('${doc.id}')">Supprimer</button>
        `;

        container.appendChild(div);
    });

    document.getElementById('pageInfo').innerText = `Page ${currentPage}`;
}

// 🔹 Charger annonces avec pagination
async function loadAnnonces(direction = 'next') {

    await cleanupOldAnnonces();

    let query = db.collection('annonces') // ✅ CORRECTION
        .orderBy('date_publication', 'desc')
        .limit(pageSize);

    if (direction === 'next' && lastVisible) {
        query = query.startAfter(lastVisible);
    } 
    else if (direction === 'prev' && firstVisible) {
        query = query.endBefore(firstVisible).limitToLast(pageSize);
        currentPage = currentPage > 1 ? currentPage - 1 : 1;
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
        if (direction === 'prev') currentPage++;
        return;
    }

    firstVisible = snapshot.docs[0];
    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    if (direction === 'next') currentPage++;

    displayAnnonces(snapshot.docs);
}

// 🔹 Pagination boutons
document.getElementById('nextBtn').addEventListener('click', () => loadAnnonces('next'));
document.getElementById('prevBtn').addEventListener('click', () => loadAnnonces('prev'));

// 🔹 Initialisation
loadAnnonces();
