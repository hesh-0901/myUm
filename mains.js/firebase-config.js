// mains.js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8SZu1X1dzqQya-1-_7wU8jfem2U6pWE0",
  authDomain: "myum-54de2.firebaseapp.com",
  projectId: "myum-54de2",
  storageBucket: "myum-54de2.firebasestorage.app",
  messagingSenderId: "33283961446",
  appId: "1:33283961446:web:4711b0e410978668a573a7",
  measurementId: "G-FF92444M2V"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
