import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");

  if (btn) btn.addEventListener("click", generatePDF);

});

async function generatePDF() {

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;

  /* ===============================
     COLORS
  =============================== */

  const dark = [70,70,70];
  const beige = [184,156,125];


  /* ===============================
     BACKGROUND
  =============================== */

  pdf.setFillColor(...dark);
  pdf.rect(0,0,pageWidth,297,"F");


  /* ===============================
     HEADER BAR
  =============================== */

  pdf.setFillColor(...beige);
  pdf.roundedRect(50,20,140,30,15,15,"F");


  /* ===============================
     PHOTO CIRCLE
  =============================== */

  const imgElement = document.getElementById("profilePhoto");

  if (imgElement && imgElement.complete) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    ctx.drawImage(imgElement,0,0);

    const base64 = canvas.toDataURL("image/jpeg");

    pdf.addImage(base64,"JPEG",15,15,45,45);

  }


  /* ===============================
     NAME
  =============================== */

  pdf.setTextColor(255);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(28);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`;

  pdf.text(fullName,70,38);


  /* ===============================
     LEFT COLUMN
  =============================== */

  let leftY = 80;

  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");
  pdf.text("Expérience",15,leftY);

  leftY += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica","normal");

  if(data.fonction){
    pdf.text(data.fonction,15,leftY);
    leftY += 6;
  }

  if(data.responsableMinistere){
    pdf.text("Responsable : "+data.responsableMinistere,15,leftY);
    leftY += 6;
  }

  if(data.groupeMusique){
    pdf.text("Groupe : "+data.groupeMusique,15,leftY);
    leftY += 6;
  }

  leftY += 10;


  /* ===============================
     CONTACT
  =============================== */

  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");
  pdf.text("Contact",15,leftY);

  leftY += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica","normal");

  if(data.phone){
    pdf.text("Téléphone : "+data.phone,15,leftY);
    leftY += 6;
  }

  if(data.commune){
    pdf.text("Commune : "+data.commune,15,leftY);
    leftY += 6;
  }

  if(data.avenue){
    pdf.text("Avenue : "+data.avenue,15,leftY);
    leftY += 6;
  }


  /* ===============================
     RIGHT PANEL
  =============================== */

  pdf.setFillColor(...beige);
  pdf.roundedRect(110,80,85,170,10,10,"F");

  let rightY = 95;

  pdf.setTextColor(255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");

  pdf.text("About Me",120,rightY);

  rightY += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica","normal");

  if(data.bio){

    const lines = pdf.splitTextToSize(data.bio,70);

    pdf.text(lines,120,rightY);

    rightY += lines.length * 5 + 8;

  }


  /* ===============================
     EDUCATION / EGLISE
  =============================== */

  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");

  pdf.text("Eglise",120,rightY);

  rightY += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica","normal");

  if(data.egliseProvenance){

    pdf.text(data.egliseProvenance,120,rightY);
    rightY += 6;

  }

  if(data.anneeBapteme){

    pdf.text("Baptême : "+data.anneeBapteme,120,rightY);
    rightY += 6;

  }

  if(data.typeBapteme){

    pdf.text(data.typeBapteme,120,rightY);
    rightY += 6;

  }


  /* ===============================
     SKILLS
  =============================== */

  rightY += 8;

  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");

  pdf.text("Skills",120,rightY);

  rightY += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica","normal");

  if(data.registreVoix){
    pdf.text("Voix : "+data.registreVoix,120,rightY);
    rightY += 6;
  }

  if(data.groupeMusique){
    pdf.text("Groupe : "+data.groupeMusique,120,rightY);
    rightY += 6;
  }


  /* ===============================
     FOOTER
  =============================== */

  pdf.setFontSize(9);
  pdf.setTextColor(200);

  pdf.text(
    "MyUM — Département musique",
    pageWidth/2,
    285,
    {align:"center"}
  );


  /* ===============================
     SAVE
  =============================== */

  const filename =
    `${data.firstName || "membre"}-${data.lastName || ""}.pdf`;

  pdf.save(filename);

}
