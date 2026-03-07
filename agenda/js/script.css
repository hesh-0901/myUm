let annonces = [];
let vuesStock = JSON.parse(localStorage.getItem("vues")) || {};

function recupererAnnonces(){
    db.collection("annonces").orderBy("date_publication","desc").get()
    .then(snapshot => {
        annonces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        afficherAnnonces("tous");
    });
}

function afficherAnnonces(filtre){
    const container = document.getElementById("annonces");
    container.innerHTML = "";

    annonces.forEach(a=>{
        if(filtre==="tous" || a.categorie===filtre){
            let court = a.message.substring(0,25)+"...";
            let div = document.createElement("div");
            div.className = "annonce";

            div.innerHTML = `
                <h3>${a.titre}</h3>
                <div class="date">📅 ${new Date(a.date_publication.seconds*1000).toLocaleDateString()}</div>
                <p class="message" id="msg_${a.id}">${court}</p>
                <div class="actions">
                    <button class="voirPlus" onclick="voirPlus('${a.id}')">Voir plus</button>
                    <div class="stats">
                        <span class="vue">👁 <span id="vue_${a.id}">${a.vues || 0}</span></span>
                        <span class="like" onclick="like('${a.id}', this)">❤️ <span id="like_${a.id}">${a.likes || 0}</span></span>
                    </div>
                </div>
            `;
            container.appendChild(div);
        }
    });
}

function voirPlus(id){
    const annonce = annonces.find(a=>a.id===id);
    document.getElementById("msg_"+id).innerText = annonce.message;

    if(!vuesStock[id]){
        vuesStock[id] = true;
        localStorage.setItem("vues", JSON.stringify(vuesStock));

        db.collection("annonces").doc(id).update({ vues: firebase.firestore.FieldValue.increment(1) });
        document.getElementById("vue_"+id).innerText = (annonce.vues || 0)+1;
    }
}

function like(id, el){
    db.collection("annonces").doc(id).update({ likes: firebase.firestore.FieldValue.increment(1) });

    let likeSpan = document.getElementById("like_"+id);
    likeSpan.innerText = parseInt(likeSpan.innerText)+1;

    el.classList.add("pop");
    setTimeout(()=> el.classList.remove("pop"), 300);
}

// Filtres
document.querySelectorAll(".filtre").forEach(btn=>{
    btn.addEventListener("click", function(){
        document.querySelectorAll(".filtre").forEach(b=>b.classList.remove("actif"));
        this.classList.add("actif");
        afficherAnnonces(this.dataset.filtre);
    });
});

// Initialisation
recupererAnnonces();
