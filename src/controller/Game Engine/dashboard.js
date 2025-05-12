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
