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

  let y = 25;

  /* COLORS */

  const bg = [246,245,242];
  const card = [232,226,218];
  const accent = [139,111,90];
  const text = [46,46,46];


  /* BACKGROUND */

  pdf.setFillColor(...bg);
  pdf.rect(0,0,pageWidth,297,"F");


  /* HEADER CARD */

  pdf.setFillColor(...card);
  pdf.roundedRect(15,15,pageWidth-30,45,10,10,"F");

/* PHOTO CIRCLE */

const imgEl = document.getElementById("profilePhoto");

if (imgEl && imgEl.src) {

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgEl.src;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const size = Math.min(img.width, img.height);

  canvas.width = size;
  canvas.height = size;

  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, 0, 0, size, size);

  const base64 = canvas.toDataURL("image/jpeg");

  pdf.addImage(base64, "JPEG", 20, 20, 30, 30);

}


  /* NAME */

  pdf.setTextColor(...text);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(20);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`;

  pdf.text(fullName,60,35);


  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  if(data.fonction)
    pdf.text(data.fonction,60,42);

  if(data.username)
    pdf.text("@"+data.username,60,48);


  y = 70;


  /* BIO CARD */

  if(data.bio){

    pdf.setFillColor(...card);
    pdf.roundedRect(15,y,pageWidth-30,40,8,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(13);

    pdf.text("Présentation",20,y+10);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(10);

    const bio = pdf.splitTextToSize(data.bio,170);

    pdf.text(bio,20,y+18);

    y += 55;

  }


  /* SECTION FUNCTION */

  const section = (title,fields)=>{

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(13);

    pdf.text(title,15,y);

    y+=8;

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(11);

    fields.forEach(([label,value])=>{

      if(!value) return;

      pdf.setFont("helvetica","bold");
      pdf.text(label,15,y);

      pdf.setFont("helvetica","normal");
      pdf.text(String(value),70,y);

      y+=6;

    });

    y+=10;

  };


  /* INFORMATIONS */

  section("Informations personnelles",[

    ["Téléphone",data.phone],
    ["Commune",data.commune],
    ["Avenue",data.avenue],
    ["État civil",data.etatCivil],
    ["Statut relationnel",data.statutRelationnel],
    ["Date naissance",data.birthday],
    ["Âge",data.age]

  ]);


  /* EGLISE */

  section("Église & Baptême",[

    ["Église",data.egliseProvenance],
    ["Année baptême",data.anneeBapteme],
    ["Type baptême",data.typeBapteme]

  ]);


  /* MINISTERE */

  section("Ministère musical",[

    ["Voix",data.registreVoix],
    ["Groupe",data.groupeMusique],
    ["Responsable",data.responsableMinistere]

  ]);


  /* QR CODE */

  try{

    const url =
      "https://hesh-0901.github.io/myUm/profile.html?user="+currentUserId;

    const qrCanvas = document.createElement("canvas");

    await QRCode.toCanvas(qrCanvas,url);

    const qr = qrCanvas.toDataURL("image/png");

    pdf.addImage(qr,"PNG",pageWidth/2-15,240,30,30);

  }catch(e){}


  /* FOOTER */

  pdf.setTextColor(...accent);
  pdf.setFontSize(9);

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
