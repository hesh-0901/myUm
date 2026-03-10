import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

/* ===============================
   INIT PAGE
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");

  if (btn) {
    btn.addEventListener("click", generatePDF);
  }

});


/* ===============================
   GENERATE PDF
=============================== */

async function generatePDF() {

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;

  let y = 20;


  /* ===============================
     HEADER
  =============================== */

  pdf.setFillColor(0,116,166);
  pdf.rect(0,0,pageWidth,40,"F");

  pdf.setTextColor(255);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(20);

  pdf.text("MyUM — Profil membre", pageWidth/2, 20, {align:"center"});


  /* ===============================
     PHOTO (sans CORS)
  =============================== */

  const imgElement = document.getElementById("profilePhoto");

  if (imgElement && imgElement.complete) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    ctx.drawImage(imgElement,0,0);

    const base64 = canvas.toDataURL("image/jpeg");

    pdf.addImage(base64,"JPEG",15,50,40,40);

  }


  /* ===============================
     IDENTITE
  =============================== */

  pdf.setTextColor(0);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(18);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`;

  pdf.text(fullName,65,60);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(12);

  if(data.username)
    pdf.text("@"+data.username,65,68);

  if(data.fonction)
    pdf.text(data.fonction,65,75);


  pdf.setDrawColor(0,116,166);
  pdf.setLineWidth(1);
  pdf.line(15,95,pageWidth-15,95);

  y = 105;


  /* ===============================
     BIO
  =============================== */

  if (data.bio) {

    y = renderBlock(pdf,"Présentation",y,[["Bio",data.bio]]);

  }


  /* ===============================
     INFORMATIONS PERSONNELLES
  =============================== */

  y = renderBlock(pdf,"Informations personnelles",y,[

    ["Genre",data.genre],
    ["Téléphone",data.phone],
    ["État civil",data.etatCivil],
    ["Statut relationnel",data.statutRelationnel],
    ["Commune",data.commune],
    ["Avenue",data.avenue],
    ["Date de naissance",data.birthday],
    ["Âge",data.age]

  ]);


  /* ===============================
     INFORMATIONS ECCLESIASTIQUES
  =============================== */

  y = renderBlock(pdf,"Église & ministère",y,[

    ["Église de provenance",data.egliseProvenance],
    ["Année de baptême",data.anneeBapteme],
    ["Type de baptême",data.typeBapteme],
    ["Responsable ministère",data.responsableMinistere]

  ]);


  /* ===============================
     COMPETENCES MUSICALES
  =============================== */

  y = renderBlock(pdf,"Compétences musicales",y,[

    ["Registre de voix",data.registreVoix],
    ["Évolue dans un groupe",data.groupeMusique]

  ]);


  /* ===============================
     VIE SECULIERE
  =============================== */

  if (data.vieSeculiere && data.vieSeculiere.length) {

    const text = Array.isArray(data.vieSeculiere)
      ? data.vieSeculiere.join(", ")
      : data.vieSeculiere;

    y = renderBlock(pdf,"Vie séculière",y,[["Activités",text]]);

  }


  /* ===============================
     QR CODE PROFIL
  =============================== */

  try {

    const profileURL =
      "https://hesh-0901.github.io/myUm/profile.html?user="+currentUserId;

    const qrCanvas = document.createElement("canvas");

    await QRCode.toCanvas(qrCanvas, profileURL);

    const qrBase64 = qrCanvas.toDataURL("image/png");

    pdf.addImage(qrBase64,"PNG",160,50,30,30);

    pdf.setFontSize(8);

    pdf.text(
      "Scanner pour voir le profil",
      175,
      85,
      {align:"center"}
    );

  } catch (error) {

    console.warn("QR Code error",error);

  }


  /* ===============================
     FOOTER
  =============================== */

  pdf.setFontSize(9);
  pdf.setTextColor(120);

  pdf.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth/2,
    285,
    {align:"center"}
  );

  pdf.setTextColor(0,116,166);

  pdf.text(
    "MyUM — Département de musique",
    pageWidth/2,
    290,
    {align:"center"}
  );


  /* ===============================
     SAVE PDF
  =============================== */

  const filename =
    `${data.firstName || "membre"}-${data.lastName || ""}.pdf`;

  pdf.save(filename);

}


/* ===============================
   RENDER BLOCK
=============================== */

function renderBlock(pdf,title,y,fields){

  const pageWidth = pdf.internal.pageSize.width;

  pdf.setFillColor(0,116,166);
  pdf.rect(15,y-5,pageWidth-30,8,"F");

  pdf.setTextColor(255);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(12);

  pdf.text(title,18,y);

  y+=10;

  pdf.setTextColor(0);
  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  fields.forEach(([label,value])=>{

    if(!value) return;

    pdf.setFont("helvetica","bold");
    pdf.text(label,15,y);

    pdf.setFont("helvetica","normal");
    pdf.text(String(value),80,y);

    y+=6;

  });

  return y+8;

}
