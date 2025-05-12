window.onload = function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }
    playBackgroundMusic("../Asset Manager/musics/main/bgm.mp3");
}

function openSettings() {
    window.location.href = 'setting.html'
}

function partnerPairing() {
    window.location.href = 'partnerpairing.html'
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

async function handleStoryButton() {
    const docRef = doc(db, "players", deviceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const savedChap = parseInt(localStorage.getItem("gameSavedChap"));

        await updateDoc(docRef, { newGame: "No" });

        if (savedChap > 0) {
            window.location.href = "storyline.html"
        } else {
            window.location.href = "chapter.html";
        }
    } else {
        console.log("No such document!");
    }
}