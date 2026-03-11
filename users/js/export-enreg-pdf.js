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
  const pageHeight = pdf.internal.pageSize.height;

  let y = 70;

  const colors = {
    primary:[26,54,104],
    secondary:[37,150,217],
    text:[30,30,30],
    muted:[120,120,120],
    card:[255,255,255],
    border:[230,232,236],
    bg:[245,247,250]
  };

  /* BACKGROUND */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,pageHeight,"F");


  /* SIDEBAR */

  pdf.setFillColor(...colors.primary);
  pdf.rect(0,0,65,pageHeight,"F");

  pdf.setFillColor(...colors.secondary);
  pdf.rect(0,0,65,10,"F");


  /* LOGO */

  try{
    pdf.addImage("/myUm/assets/logo-myum.png","PNG",12,18,42,14);
  }catch(e){}


  /* PROFILE PHOTO */

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

      pdf.setFillColor(255,255,255);
      pdf.circle(32.5,70,22,"F");

      pdf.addImage(base64,"JPEG",15,53,35,35);

    }

  }catch(e){}


  /* HEADER CARD */

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(70,15,pageWidth-80,40,4,4,"F");

  pdf.setDrawColor(...colors.border);
  pdf.roundedRect(70,15,pageWidth-80,40,4,4);


  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);

  pdf.text(fullName || "MEMBRE MYUM",75,30);


  /* BADGE ROLE */

  if(data.fonction){

    pdf.setFillColor(...colors.secondary);
    pdf.roundedRect(75,34,45,8,3,3,"F");

    pdf.setFontSize(10);
    pdf.setTextColor(255,255,255);

    pdf.text(data.fonction.toUpperCase(),78,39);

  }


  if(data.username){

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);

    pdf.text("@"+data.username,75,48);

  }


  /* BIO CARD */

  if(data.bio){

    pdf.setFillColor(...colors.card);
    pdf.roundedRect(70,60,pageWidth-80,40,4,4,"F");

    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(70,60,pageWidth-80,40,4,4);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);

    pdf.text("PRÉSENTATION",75,68);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);

    const lines = pdf.splitTextToSize(data.bio,pageWidth-90);

    pdf.text(lines,75,76);

    y = 105;

  }


  /* SECTION BUILDER */

  const drawSection = (title,fields)=>{

    const validFields = fields.filter(f=>f[1]);

    if(validFields.length===0) return;

    const startY = y;

    pdf.setFillColor(...colors.card);
    pdf.roundedRect(70,startY,pageWidth-80,(validFields.length*8)+18,4,4,"F");

    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(70,startY,pageWidth-80,(validFields.length*8)+18);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);

    pdf.text(title,75,startY+8);

    let lineY = startY+16;

    validFields.forEach(([label,value])=>{

      pdf.setFont("helvetica","bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.muted);

      pdf.text(label,75,lineY);

      pdf.setFont("helvetica","normal");
      pdf.setTextColor(...colors.text);

      pdf.text(String(value),120,lineY);

      lineY+=8;

    });

    y = startY + (validFields.length*8)+26;

  };


  /* DATA */

  drawSection("COORDONNÉES",[
    ["Téléphone",data.phone],
    ["Commune",data.commune],
    ["Avenue",data.avenue],
    ["État civil",data.etatCivil],
    ["Relation",data.statutRelationnel]
  ]);

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


  /* FOOTER */

  const dateStr = new Date().toLocaleDateString();

  pdf.setFontSize(8);
  pdf.setTextColor(255,255,255);

  pdf.text("Département de Musique",10,pageHeight-20);
  pdf.text("UM Compassion",10,pageHeight-15);

  pdf.setTextColor(...colors.muted);
  pdf.text(`Généré le ${dateStr}`,pageWidth-15,pageHeight-10,{align:"right"});


  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);

}
