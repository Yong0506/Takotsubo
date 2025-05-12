// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, collection, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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

async function saveInfo() {
    // user information
    const name = document.getElementById("playerName").value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const birthDate = document.getElementById("birthDate").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    // default game chapter
    const newGame = "Yes";
    const allChapUnlock = "No";
    const denyAnger = "Yes";
    const memories = "No";
    const lettingGo = "No";
    // doughnut chart
    const overallProgress = 0;
    // validate email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !gender || !birthDate || !email || !phone) {
        alert("Please fill out all fields before proceeding.");
        return;
    }

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
    }

    let gameVolume = localStorage.getItem("gameVolume");
    if (!gameVolume) {
        gameVolume = 50;
        localStorage.setItem("gameVolume", gameVolume);
    }

    let textSpeed = localStorage.getItem("textSpeed");
    if (!textSpeed) {
        textSpeed = 50;
        localStorage.setItem("textSpeed", textSpeed);
    }

    let gameSavedChap = localStorage.getItem("gameSavedChap");
    if (!gameSavedChap) {
        gameSavedChap = 0;
        localStorage.setItem("gameSavedChap", gameSavedChap);
    }

    let gameSavedDialog = localStorage.getItem("gameSavedDialog");
    if (!gameSavedDialog) {
        gameSavedDialog = "";
        localStorage.setItem("gameSavedDialog", gameSavedDialog);
    }

    try {
        await setDoc(doc(collection(db, "players"), deviceId), {
            name: name,
            gender: gender,
            birthDate: birthDate,
            email: email,
            phone: phone,
            deviceId: deviceId,
            newGame: newGame,
            allChapUnlock: allChapUnlock,
            denyAnger: denyAnger,
            memories: memories,
            lettingGo: lettingGo,
            overallProgress: overallProgress,
            createdAt: new Date()
        });

        await setDoc(doc(collection(db, "traits"), deviceId), {
            direct: 0,
            humorous: 0,
            kind: 0,
            optimistic: 0,
            romantic: 0,
            shy: 0
        });

        console.log("player ID (deviceId): ", deviceId);
        window.location.href = 'dashboard.html';
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Failed to save your information. Please try again.");
    }
}

window.saveInfo = saveInfo;