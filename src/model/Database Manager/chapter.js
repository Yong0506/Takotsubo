// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, collection, getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAGSZM98qLSSIXfSor4_Mn_jqxPs__a_S0",
    authDomain: "takotsubo-4f61d.firebaseapp.com",
    projectId: "takotsubo-4f61d",
    storageBucket: "takotsubo-4f61d.firebasestorage.app",
    messagingSenderId: "59472372412",
    appId: "1:59472372412:web:a192e23b031683988266b9",
    measurementId: "G-QQ6VXX1M7C"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const deviceId = localStorage.getItem("deviceId");

const docRef = doc(db, "players", deviceId);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
    const data = docSnap.data();
    const denyAnger = data.denyAnger;
    const memories = data.memories;
    const lettingGo = data.lettingGo;
    const allChapUnlock = data.allChapUnlock;

    // Show all if fully unlocked
    if (allChapUnlock === "Yes") {
        document.getElementById("denyBox").style.display = "block";
        document.getElementById("memoriesBox").style.display = "block";
        document.getElementById("lettingGoBox").style.display = "block";
    } else {
        if (denyAnger === "Yes") {
            document.getElementById("denyBox").style.display = "block";
        }
        if (memories === "Yes") {
            document.getElementById("memoriesBox").style.display = "block";
        }
        if (lettingGo === "Yes") {
            document.getElementById("lettingGoBox").style.display = "block";
        }
    }
} else {
    console.log("No such document!");
}