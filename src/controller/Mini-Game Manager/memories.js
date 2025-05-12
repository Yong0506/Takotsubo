// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, collection, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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

const gridSize = 3;
let selectedTile = null;
let targetTile = null;

let memoriesPuzzle;

window.onload = function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }

    playBackgroundMusic("../Asset Manager/musics/memories/bgm.mp3");

    if (localStorage.getItem("puzzleImagePath")) {
        memoriesPuzzle = parseInt(localStorage.getItem("puzzleImagePath"));
    }
    console.log(memoriesPuzzle);

    document.querySelector(".background").style.background = `url('../Asset Manager/images/memories/c${memoriesPuzzle}/full.webp') no-repeat center center / cover`;

    createBoard();
    shufflePieces();
};

function createBoard() {
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            let tile = document.createElement("img");
            tile.src = "../Asset Manager/images/memories/blank.jpg";
            addDragEvents(tile);
            document.getElementById("board").append(tile);
        }
    }
}

function shufflePieces() {
    let pieces = Array.from({ length: gridSize * gridSize }, (_, i) => (i + 1).toString());
    pieces.sort(() => Math.random() - 0.5);

    pieces.forEach(piece => {
        let tile = document.createElement("img");
        tile.src = `../Asset Manager/images/memories/c${memoriesPuzzle}/${piece}.jpg`;
        addDragEvents(tile);
        document.getElementById("pieces").append(tile);
    });
}

function addDragEvents(tile) {
    tile.addEventListener("dragstart", onDragStart);
    tile.addEventListener("dragover", event => event.preventDefault());
    tile.addEventListener("dragenter", event => event.preventDefault());
    tile.addEventListener("drop", onDrop);
    tile.addEventListener("dragend", onDragEnd);
}

function onDragStart() {
    selectedTile = this;
}

function onDrop() {
    targetTile = this;
}

function onDragEnd() {
    if (!selectedTile.src.includes("blank")) {
        [selectedTile.src, targetTile.src] = [targetTile.src, selectedTile.src];
    }
}

async function checkSolution() {
    let tiles = document.querySelectorAll("#board img");
    for (let i = 0; i < tiles.length; i++) {
        let expectedSrc = `images/memories/c${memoriesPuzzle}/${i + 1}.jpg`;
        if (!tiles[i].src.includes(expectedSrc)) {
            console.log(tiles[i].src);
            console.log(expectedSrc);
            alert("Try Again!");
            return;
        }
    }
    alert("Congratulations, Puzzle Completed!");

    if (memoriesPuzzle == 1) {
        localStorage.setItem("gameSavedDialog", "memories17");
        window.location.href = 'storyline.html';
    } else if (memoriesPuzzle == 2) {
        localStorage.setItem("gameSavedDialog", "memories28");
        window.location.href = 'storyline.html';
    } else {
        try {
            await updateDoc(doc(collection(db, "players"), deviceId), {
                lettingGo: "Yes",
            });
            localStorage.setItem("gameSavedDialog", "");
            localStorage.setItem("currentStory", "");
            window.location.href = 'storyEnd.html';
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Failed to save your information. Please try again.");
        }
    }
}

function resetPuzzle() {
    document.getElementById("board").innerHTML = "";
    document.getElementById("pieces").innerHTML = "";
    createBoard();
    shufflePieces();
}

function openSettings() {
    window.location.href = 'setting.html'
}

function goToMainMenu() {
    window.location.href = 'dashboard.html'
}

let currentBGM = null;

function playBackgroundMusic(filePath) {
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
    }

    gameVolume = (parseInt(localStorage.getItem("gameVolume")) / 100);

    currentBGM = new Audio(filePath);
    currentBGM.loop = true;
    currentBGM.volume = gameVolume;
    currentBGM.play().catch((err) => {
        console.warn("Autoplay blocked or error occurred:", err);
    });
}

window.checkSolution = checkSolution;