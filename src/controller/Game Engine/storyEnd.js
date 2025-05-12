window.onload = async function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }
}

const savedChap = parseInt(localStorage.getItem('gameSavedChap'));

function openSettings() {
    window.location.href = 'setting.html'
}

function goToMainMenu() {
    window.location.href = 'dashboard.html'
}

function nextChap() {
    localStorage.setItem("gameSavedChap", 0);
    window.location.href = 'dashboard.html'
}

window.onload = function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }

    const title = document.querySelector(".chapter-title");
    const summary = document.querySelector(".chapter-summary");
    const footer = document.querySelector(".chapter-footer");

    if (savedChap === 1) {
        title.textContent = "Chapter 1: Deny And Anger";
        summary.textContent = "The hardest part wasn't about the break up, it was about accepting the truth that we no longer have feelings for each other.Keep on denying this truth and it will hurt both sides, accepting it is the path forward.Anger however is not the way forward, emotions have outlets, letting it out is good, lingering on it, is not.Anger is only a gateway to push you forward like a rocket, in the end it will separate into smaller parts, in the end, you will be able to reach the destined moon. So let out that anger, use up all your fuel, to arrive at the destined future.";
        footer.textContent = "~ End of the Chapter 1 ~";
    } else if (savedChap === 2) {
        title.textContent = "Chapter 2: Memories Together";
        summary.textContent = "This chapter of Memories Together teaches us about the beauty of first love and the importance of cherishing happy moments. It shows how two people meet, become close, and slowly build a connection through small, kind actions. The most important part of this chapter is understanding that love often starts with simple things—like a smile, a seat beside someone, or a letter. You should learn to appreciate these little moments and the courage it takes to express your feelings. This chapter also reminds you that even if things change later, those first memories still matter. You should take time to remember what made you happy and carry those feelings with you, not with sadness, but with warmth and congrats.";
        footer.textContent = "~ End of the Chapter 2 ~";
    } else if (savedChap === 3) {
        title.textContent = "Chapter 3: Letting Go";
        summary.textContent = "People remain attached to the person they've experienced the deepest sense of love with so far. We accept this love, even if it comes with a ton of hardship. We accept it, even if the person doesn't feel like a good fit.The other stuff—the flaws, the humanity, the reality of whether or not the relationship works—are important details, too, ones that get overshadowed by moments of pure, deep love.And yes, it's true, they might not be the right person for you. But this is one of the most difficult learning experiences in relationships.We all deserve to be in relationships that feel good to us. Find love within yourself. You need to take the time to invest in learning how to love yourself again after your breakup. Even if you think this is silly and you have all the confidence in the world, don't overlook this step.";
        footer.textContent = "~ End of the Chapter 3 ~";
    } else {
        title.textContent = "Chapter Unknown";
        summary.textContent = "No saved progress found. Start a new story to unveil its path.";
        footer.textContent = "~ End Chapter Unknown ~";
    }
    playBackgroundMusic("../Asset Manager/musics/main/bgm.mp3");
};

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