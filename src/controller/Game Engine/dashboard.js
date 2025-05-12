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

document.addEventListener("DOMContentLoaded", () => {
    const birthInput = document.getElementById("birth");
    const today = new Date().toISOString().split("T")[0];
    birthInput.setAttribute("max", today);
});

document.getElementById("phone").addEventListener("input", function () {
    this.value = this.value.replace(/[^\d\s\-]/g, '');
});