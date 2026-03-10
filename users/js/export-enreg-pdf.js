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

  const snap = await getDoc(doc(db,"users",currentUserId));
  if(!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;

  let y = 35;

  /* COLORS */

  const bg = [247,246,243];
  const accent = [120,98,80];
  const text = [30,30,30];
  const soft = [120,120,120];


  /* BACKGROUND */

  pdf.setFillColor(...bg);
  pdf.rect(0,0,pageWidth,297,"F");


  /* HEADER */

  pdf.setDrawColor(...accent);
  pdf.setLineWidth(1);
  pdf.line(15,20,pageWidth-15,20);


  /* PHOTO */

  try {

    const imgElement = document.getElementById("profilePhoto");

    if(imgElement && imgElement.src){

      const img = new Image();
      img.crossOrigin="anonymous";
      img.src = imgElement.src;

      await new Promise((resolve,reject)=>{
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img,0,0);

      const base64 = canvas.toDataURL("image/jpeg");

      pdf.addImage(base64,"JPEG",15,25,28,28);

    }

  } catch(e){}


  /* NAME */

  pdf.setTextColor(...text);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.text(fullName || "Membre MyUM",50,35);


  pdf.setFont("helvetica","normal");
  pdf.setFontSize(12);

  if(data.fonction)
    pdf.text(data.fonction,50,43);

  if(data.username)
    pdf.setTextColor(...soft),
    pdf.text("@"+data.username,50,49);


  y = 65;


  /* BIO */

  if(data.bio){

    sectionTitle(pdf,"Présentation",y);

    y+=6;

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(11);
    pdf.setTextColor(...text);

    const lines = pdf.splitTextToSize(data.bio,pageWidth-40);

    pdf.text(lines,20,y);

    y += lines.length * 6 + 6;

  }


  y = renderSection(pdf,"Informations personnelles",y,[
    ["Téléphone",data.phone],
    ["Commune",data.commune],
    ["Avenue",data.avenue],
    ["État civil",data.etatCivil],
    ["Statut relationnel",data.statutRelationnel],
    ["Date naissance",data.birthday],
    ["Âge",data.age]
  ]);


  y = renderSection(pdf,"Église & Baptême",y,[
    ["Église",data.egliseProvenance],
    ["Année baptême",data.anneeBapteme],
    ["Type baptême",data.typeBapteme]
  ]);


  y = renderSection(pdf,"Ministère musical",y,[
    ["Voix",data.registreVoix],
    ["Groupe",data.groupeMusique],
    ["Responsable",data.responsableMinistere]
  ]);


  /* FOOTER */

  pdf.setFontSize(9);
  pdf.setTextColor(...soft);

  pdf.text(
    "MyUM — Département musique",
    pageWidth/2,
    285,
    {align:"center"}
  );


  /* SAVE */

  const filename =
  `${data.firstName || "membre"}-${data.lastName || ""}.pdf`;

  pdf.save(filename);

}



/* SECTION TITLE */

function sectionTitle(pdf,title,y){

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(14);

  pdf.setTextColor(0,0,0);

  pdf.text(title,15,y);

  pdf.setDrawColor(120,98,80);
  pdf.setLineWidth(0.6);

  pdf.line(15,y+2,60,y+2);

}



/* SECTION */

function renderSection(pdf,title,y,fields){

  sectionTitle(pdf,title,y);

  y += 8;

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  fields.forEach(([label,value])=>{

    if(!value) return;

    pdf.setTextColor(120,120,120);
    pdf.text(label,20,y);

    pdf.setTextColor(30,30,30);

    const text = pdf.splitTextToSize(String(value),110);

    pdf.text(text,70,y);

    y += text.length * 6;

  });

  return y + 6;

}
