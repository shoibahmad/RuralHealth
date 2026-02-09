import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB6h1ZR_NIbPFtEVgdNxL3EZadUrvFTURo",
    authDomain: "ruralhealth-fe3c0.firebaseapp.com",
    projectId: "ruralhealth-fe3c0",
    storageBucket: "ruralhealth-fe3c0.firebasestorage.app",
    messagingSenderId: "303524159956",
    appId: "1:303524159956:web:9c19a4c5faaa2436093641",
    measurementId: "G-XZB0RH1T5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

console.log("Firebase App initialized:", app);
console.log("Firestore DB initialized:", db);
export { auth, db, analytics };
export default app;
