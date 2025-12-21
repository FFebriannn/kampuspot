// Import SDK dari CDN 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtnD4p5cDfdCAf_mnRKK7yiC8-eXtuWpU",
  authDomain: "kampuspot.firebaseapp.com",
  projectId: "kampuspot",
  storageBucket: "kampuspot.firebasestorage.app",
  messagingSenderId: "434441291548",
  appId: "1:434441291548:web:d4e988e7fe9710123f5cd9"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Firestore & Auth instance
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };