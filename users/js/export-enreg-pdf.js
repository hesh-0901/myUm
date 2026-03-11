import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

/* ======================================================
   INITIALISATION
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");

  if(btn){
    btn.addEventListener("click", generatePDF);
  }

});

/* ======================================================
   GENERATION DU PDF
====================================================== */

async function generatePDF(){

  const snap = await getDoc(doc(db,"users",currentUserId));

  if(!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  /* ======================================================
     COULEURS DU DESIGN
  ====================================================== */

  const colors = {

    primary:[20,33,61],
    secondary:[0,119,182],
    text:[40,40,40],
    muted:[120,120,120],
    border:[220,220,220],
    bg:[245,247,250],
    white:[255,255,255]

  };

  /* ======================================================
     BACKGROUND GLOBAL
  ====================================================== */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,pageHeight,"F");

  /* ======================================================
     SIDEBAR
  ====================================================== */

  const sidebarWidth = 60;

  pdf.setFillColor(...colors.primary);
  pdf.rect(0,0,sidebarWidth,pageHeight,"F");

  /* ======================================================
     LOGO (position propre)
  ====================================================== */

  try{

    pdf.addImage(
      "/myUm/assets/logo-myum.png",
      "PNG",
      12,
      15,
      36,
      12
    );

  }catch(e){}

  /* ======================================================
     PHOTO UTILISATEUR (RECTANGLE PRO)
  ====================================================== */

  try{

    const imgElement = document.getElementById("profilePhoto");

    if(imgElement && imgElement.src){

      const response = await fetch(imgElement.src);
      const blob = await response.blob();

      const reader = new FileReader();

      const base64 = await new Promise(resolve=>{
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      pdf.addImage(
        base64,
        "JPEG",
        12,
        40,
        36,
        36
      );

    }

  }catch(e){}

  /* ======================================================
     SIDEBAR CONTACT INFOS
  ====================================================== */

  let sideY = 95;

  const sidebarItem = (label,value)=>{

    if(!value) return;

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(7);
    pdf.setTextColor(180,200,255);

    pdf.text(label.toUpperCase(),10,sideY);

    sideY+=4;

    pdf.setFont("helvetica","normal");
    pdf.setTextColor(255,255,255);

    pdf.text(String(value),10,sideY,{maxWidth:40});

    sideY+=10;

  };

  sidebarItem("Téléphone",data.phone);
  sidebarItem("Commune",data.commune);
  sidebarItem("Avenue",data.avenue);
  sidebarItem("État civil",data.etatCivil);
  sidebarItem("Relation",data.statutRelationnel);

  /* ======================================================
     HEADER PRINCIPAL
  ====================================================== */

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);

  pdf.text(fullName,75,30);

  if(data.fonction){

    pdf.setFillColor(...colors.secondary);

    pdf.roundedRect(
      75,
      35,
      55,
      8,
      2,
      2,
      "F"
    );

    pdf.setFontSize(10);
    pdf.setTextColor(255,255,255);

    pdf.text(data.fonction.toUpperCase(),78,40);

  }

  if(data.username){

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);

    pdf.text("@"+data.username,75,50);

  }

  /* ======================================================
     ZONE QR CODE (PREVU)
  ====================================================== */

  /*
  ============================
  QR CODE FUTUR
  ============================

  Exemple futur:

  const qr = await QRCode.toDataURL(profileUrl)

  pdf.addImage(
      qr,
      "PNG",
      pageWidth - 40,
      20,
      20,
      20
  )

  ============================
  */

  /* ======================================================
     POSITION DES SECTIONS
  ====================================================== */

  let y = 65;

  /* ======================================================
     CREATION CARD DESIGN
  ====================================================== */

  const drawCard = (title,height)=>{

    pdf.setFillColor(...colors.white);

    pdf.roundedRect(
      70,
      y,
      pageWidth-80,
      height,
      3,
      3,
      "F"
    );

    pdf.setDrawColor(...colors.border);

    pdf.roundedRect(
      70,
      y,
      pageWidth-80,
      height,
      3,
      3,
      "S"
    );

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);

    pdf.text(title,75,y+8);

  };

  /* ======================================================
     BIOGRAPHIE
  ====================================================== */

  if(data.bio){

    const lines = pdf.splitTextToSize(
      data.bio,
      pageWidth-95
    );

    const h = lines.length*5 + 16;

    drawCard("PRÉSENTATION",h);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);

    pdf.text(lines,75,y+16);

    y += h + 10;

  }

  /* ======================================================
     SECTIONS GENERIQUES
  ====================================================== */

  const drawSection = (title,fields)=>{

    const valid = fields.filter(f=>f[1]);

    if(valid.length===0) return;

    const h = valid.length*8 + 18;

    drawCard(title,h);

    let lineY = y+16;

    valid.forEach(([label,value])=>{

      pdf.setFont("helvetica","bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.muted);

      pdf.text(label,75,lineY);

      pdf.setFont("helvetica","normal");
      pdf.setTextColor(...colors.text);

      pdf.text(String(value),120,lineY);

      lineY += 8;

    });

    y += h + 10;

  };

  drawSection("PARCOURS SPIRITUEL",[

    ["Église",data.egliseProvenance],
    ["Année Baptême",data.anneeBapteme],
    ["Type",data.typeBapteme]

  ]);

  drawSection("MINISTÈRE MUSICAL",[

    ["Registre",data.registreVoix],
    ["Groupe",data.groupeMusique],
    ["Responsable",data.responsableMinistere]

  ]);

  /* ======================================================
     SIGNATURE NUMERIQUE
  ====================================================== */

  const now = new Date();

  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  const signature = `Document généré par MyUM
Utilisateur : ${fullName}
Date : ${date} ${time}`;

  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);

  pdf.text(
    signature,
    pageWidth-15,
    pageHeight-15,
    {align:"right"}
  );

  /* ======================================================
     EXPORT
  ====================================================== */

  pdf.save(
    `${data.firstName || "profil"}-${data.lastName || ""}.pdf`
  );

}
