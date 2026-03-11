// mains.js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ============================================================
   BLOC 1 : CONFIGURATION FIREBASE
   Rôle :
   - Contenir les clés et identifiants du projet Firebase
============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDUuDQi3xzCT7lV1lOf3rhq724rfHhiTIQ",
  authDomain: "umapp-72f36.firebaseapp.com",
  projectId: "umapp-72f36",
  storageBucket: "umapp-72f36.firebasestorage.app",
  messagingSenderId: "483188283543",
  appId: "1:483188283543:web:b52415f83bf21bad2071d2",
  measurementId: "G-6X2ELMB8RY"
};

/* ============================================================
   BLOC 2 : INITIALISATION APP
   Rôle :
   - Créer l'instance Firebase principale
============================================================ */
const app = initializeApp(firebaseConfig);

/* ============================================================
   BLOC 3 : SERVICES FIREBASE
   Rôle :
   - analytics : statistiques usage
   - db : Firestore
   - storage : upload fichiers / notes vocales / images / vidéos
============================================================ */
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ============================================================
   BLOC 4 : EXPORTS
   Rôle :
   - Rendre les services disponibles dans toute l'application
============================================================ */
export { app, analytics, db, storage };