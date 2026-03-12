import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

/* ======================================
INITIALISATION
====================================== */

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

/* ======================================
SEPARATEUR VISUEL ENTRE SECTIONS
====================================== */

function drawSeparator(pdf,y,pageWidth){

  pdf.setDrawColor(220,224,230);

  pdf.line(
    75,
    y,
    pageWidth-15,
    y
  );

}

/* ======================================
GENERATION PDF PREMIUM
====================================== */

async function generatePDF(){

  const snap = await getDoc(doc(db,"users",currentUserId));
  if(!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

const colors = {
  primary:[41,128,185],   // bleu moderne
  text:[40,40,40],
  muted:[130,130,130],
  sidebar:[52,73,94]      // gris bleu plus doux
};
  /* ======================================
  BACKGROUND
  ====================================== */

  pdf.setFillColor(248,249,252);
  pdf.rect(0,0,pageWidth,pageHeight,"F");

  /* ======================================
  SIDEBAR
  ====================================== */

  const sidebarWidth = 60;

  pdf.setFillColor(...colors.sidebar);
  pdf.rect(0,0,sidebarWidth,pageHeight,"F");

  /* ======================================
  LOGO
  ====================================== */

  try{

    pdf.addImage(
      "/myUm/assets/logo-myum.png",
      "PNG",
      12,
      16,
      36,
      12
    );

  }catch(e){}

  /* ======================================
  PHOTO
  ====================================== */

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

      pdf.addImage(base64,"JPEG",12,40,36,36);

    }

  }catch(e){}

  /* ======================================
  SIDEBAR CONTACT
  ====================================== */

  let sideY = 95;

  const sideItem = (label,value)=>{

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

  sideItem("Téléphone",data.phone);
  sideItem("Commune",data.commune);
  sideItem("Avenue",data.avenue);
  sideItem("État civil",data.etatCivil);
  sideItem("Relation",data.statutRelationnel);

  /* ======================================
  QR CODE DE VERIFICATION
  ====================================== */

  const verifyURL = `${window.location.origin}/myUm/verify.html?id=${currentUserId}`;

  const qrCode = await QRCode.toDataURL(verifyURL);

  pdf.addImage(
    qrCode,
    "PNG",
    pageWidth-35,
    20,
    20,
    20
  );
  pdf.setFontSize(7);
pdf.setTextColor(...colors.muted);

pdf.text(
  "Scan pour vérifier",
  pageWidth-25,
  45,
  {align:"center"}
);

  /* ======================================
  HEADER
  ====================================== */

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);

  pdf.text(fullName,75,30);

  if(data.fonction){

    pdf.setFontSize(12);
    pdf.setTextColor(...colors.text);

    pdf.text(data.fonction.toUpperCase(),75,40);

  }

  if(data.username){

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);

    pdf.text("@"+data.username,75,48);

  }

  let y = 65;

  /* ======================================
  BIO
  ====================================== */

  if(data.bio){

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.primary);

    pdf.text("PRÉSENTATION",75,y);

    y+=8;

    const lines = pdf.splitTextToSize(
  data.bio,
  pageWidth-100
);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);

    pdf.text(lines,75,y);

    y += lines.length*5 + 10;

  }

  /* ======================================
  SECTION GENERIQUE
  ====================================== */

  const drawSection = (title,fields)=>{

    const valid = fields.filter(f=>f[1]);

    if(valid.length===0) return;

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.primary);

pdf.text(title,75,y);

y+=6;

drawSeparator(pdf,y,pageWidth);

y+=8;

valid.forEach(([label,value])=>{

      pdf.setFont("helvetica","bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.muted);

      pdf.text(label,75,y);

      pdf.setFont("helvetica","normal");
      pdf.setTextColor(...colors.text);

      pdf.text(
  pdf.splitTextToSize(String(value),60),
  120,
  y
);

      y+=7;

    });

    y+=5;

  };

  drawSection("IDENTITÉ",[

["Date de naissance",data.birthday],
["Âge",data.age ? data.age + " ans" : ""],
["Genre",data.genre]

]);

  drawSection("PARCOURS SPIRITUEL",[

    ["Église",data.egliseProvenance],
    ["Année Baptême",data.anneeBapteme],
    ["Type",data.typeBapteme]

  ]);

drawSection("MINISTÈRE MUSICAL",[

["Chorale",data.chorale],
["Statut d'affermissement",data.statutAffermissement],
["Registre",data.registreVoix],
["Groupe musical",data.groupeMusique],
["Responsable ministère",data.responsableMinistere]

]);

  /* ======================================
  SIGNATURE NUMERIQUE
  ====================================== */

  const now = new Date();

  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  const signature = `Document vérifiable MyUM
Utilisateur : ${fullName}
Date : ${date} ${time}
ID : ${currentUserId}`;

  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);

  pdf.text(signature,pageWidth-15,pageHeight-15,{align:"right"});

  

  /* ======================================
  EXPORT
  ====================================== */

  pdf.save(`${data.firstName}-${data.lastName}.pdf`);

}
