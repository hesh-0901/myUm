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

async function generatePDF(){

  const snap = await getDoc(doc(db,"users",currentUserId));
  if(!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  const colors = {
    primary:[26,54,104],
    secondary:[37,150,217],
    text:[30,30,30],
    muted:[120,120,120],
    card:[255,255,255],
    border:[230,232,236],
    bg:[247,249,252]
  };

  /* BACKGROUND */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,pageHeight,"F");

  /* SIDEBAR */

  pdf.setFillColor(...colors.primary);
  pdf.rect(0,0,65,pageHeight,"F");

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
      pdf.circle(32.5,65,22,"F");

      pdf.addImage(base64,"JPEG",15,48,35,35);

    }

  }catch(e){}

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  /* SIDEBAR NAME */

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(12);
  pdf.setTextColor(255,255,255);

  pdf.text(fullName,32.5,100,{align:"center"});

  pdf.setFontSize(9);
  pdf.setTextColor(200,210,240);

  if(data.fonction)
  pdf.text(data.fonction,32.5,107,{align:"center"});

  if(data.username)
  pdf.text("@"+data.username,32.5,113,{align:"center"});

  /* SIDEBAR INFOS */

  let sideY = 130;

  const sideItem = (label,value)=>{

    if(!value) return;

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(7);
    pdf.setTextColor(180,200,255);

    pdf.text(label.toUpperCase(),10,sideY);

    sideY += 4;

    pdf.setFont("helvetica","normal");
    pdf.setTextColor(255,255,255);

    pdf.text(String(value),10,sideY,{maxWidth:45});

    sideY += 10;

  };

  sideItem("Téléphone",data.phone);
  sideItem("Commune",data.commune);
  sideItem("Avenue",data.avenue);
  sideItem("État civil",data.etatCivil);
  sideItem("Relation",data.statutRelationnel);

  /* MAIN HEADER */

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);

  pdf.text(fullName,75,30);

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

  let y = 60;

  /* SECTION FUNCTION */

  const drawCard = (title,contentHeight)=>{

    pdf.setFillColor(...colors.card);
    pdf.roundedRect(70,y,pageWidth-80,contentHeight,4,4,"F");

    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(70,y,pageWidth-80,contentHeight,4,4,"S");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);

    pdf.text(title,75,y+8);

  };

  /* BIO */

  if(data.bio){

    const lines = pdf.splitTextToSize(data.bio,pageWidth-90);
    const h = lines.length*5 + 16;

    drawCard("PRÉSENTATION",h);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);

    pdf.text(lines,75,y+16);

    y += h + 10;

  }

  /* DATA SECTIONS */

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

      lineY+=8;

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

  /* FOOTER */

  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);

  const dateStr = new Date().toLocaleDateString();

  pdf.text(`Généré le ${dateStr}`,pageWidth-15,pageHeight-10,{align:"right"});

  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);

}
