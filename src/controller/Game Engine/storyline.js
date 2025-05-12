// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAGSZM98qLSSIXfSor4_Mn_jqxPs__a_S0",
    authDomain: "takotsubo-4f61d.firebaseapp.com",
    projectId: "takotsubo-4f61d",
    storageBucket: "takotsubo-4f61d.firebasestorage.app",
    messagingSenderId: "59472372412",
    appId: "1:59472372412:web:a192e23b031683988266b9",
    measurementId: "G-QQ6VXX1M7C"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const characterNameElement = document.getElementById("characterName");
const dialogueTextElement = document.getElementById("dialogueText");
const characterLeftElement = document.getElementById("characterLeft");
const choicesContainer = document.querySelector(".choices-container");
const dialogueBox = document.querySelector(".dialogue-box");
const characterContainer = document.querySelector(".character-container");

// 新增：当前对话ID
let currentProgress = "";
let isTyping = false;
let currentTimeout = null;
let choicesTimeout = null;

// 特征追踪系统
const playerTraits = {
    kind: 0,
    romantic: 0,
    humorous: 0,
    direct: 0,
    optimistic: 0,
    shy: 0
};

let currentUserId = null; // 用于存储当前用户ID

// 初始化或获取用户ID
async function initializeUser() {
    currentUserId = localStorage.getItem('deviceId');
    if (!currentUserId) {
        try {
            const userCredential = await firebase.auth().signInAnonymously();
            currentUserId = userCredential.user.uid;
            localStorage.setItem('userId', currentUserId);
        } catch (error) {
            console.error("Error creating anonymous user:", error);
        }
    }
    await loadTraitsFromFirebase();
}

// 从对应章节的 Firebase Collection 加载特征
async function loadTraitsFromFirebase() {
    if (!currentUserId) return;
    try {
        const doc = await db.collection('traits').doc(currentUserId).get();
        if (doc.exists) {
            const data = doc.data();
            Object.assign(playerTraits, data);
            saveTraitsToLocal();
        } else {
            await saveTraitsToFirebase();
        }
    } catch (error) {
        console.error('Error loading traits:', error);
        loadTraitsFromLocal();
    }
}

function loadTraitsFromLocal() {
    const savedTraits = localStorage.getItem('playerTraits');
    if (savedTraits) {
        Object.assign(playerTraits, JSON.parse(savedTraits));
    }
}

async function saveTraitsToFirebase() {
    if (!currentUserId) return;
    try {
        await db.collection('traits').doc(currentUserId).set({
            ...playerTraits,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        saveTraitsToLocal();
    } catch (error) {
        console.error(`Error saving traits to traits collection:`, error);
        saveTraitsToLocal();
    }
}

function saveTraitsToLocal() {
    localStorage.setItem('playerTraits', JSON.stringify(playerTraits));
}

async function updateTraits(traits) {
    if (!traits) return;
    try {
        Object.keys(traits).forEach(trait => {
            if (traits[trait] && playerTraits.hasOwnProperty(trait)) {
                playerTraits[trait]++;
            }
        });
        await saveTraitsToFirebase();
        saveTraitsToLocal();
    } catch (error) {
        console.error('Error updating traits:', error);
    }
}

function getTextSpeed() {
    const savedSpeed = localStorage.getItem('textSpeed');
    if (savedSpeed === null) return 50;
    return Math.floor(200 - (savedSpeed * 1.9));
}

function typeText(text) {
    if (isTyping && currentTimeout) {
        clearTimeout(currentTimeout);
    }
    const dialogueElement = document.getElementById("dialogueText");
    let i = 0;
    isTyping = true;
    dialogueElement.innerHTML = "";
    const speed = getTextSpeed();

    function typingEffect() {
        if (i < text.length) {
            dialogueElement.innerHTML += text.charAt(i);
            i++;
            const delay = /[,.!?]/.test(text.charAt(i - 1)) ? speed * 4 : speed;
            currentTimeout = setTimeout(typingEffect, delay);
        } else {
            isTyping = false;
            currentTimeout = null;
        }
    }

    typingEffect();
}

async function loadDialogueFromFirebase(dialogueId) {
    console.log(dialogueId);
    const currentStory = localStorage.getItem("currentStory");
    if (!dialogueId || dialogueId === "0") {
        console.error(`Invalid dialogue ID: ${dialogueId}`);
        return null;
    }
    try {
        const doc = await db.collection(`${currentStory}_dialogue`).doc(dialogueId).get();
        if (doc.exists) {
            return doc.data();
        } else {
            console.error(`No dialogue found for ID: ${dialogueId} in story: ${currentStory}`);
            return null;
        }
    } catch (error) {
        console.error('Error loading dialogue from Firebase:', error);
        return null;
    }
}

async function showDialogue(dialogueId) {
    currentProgress = dialogueId;
    const dialogue = await loadDialogueFromFirebase(dialogueId);
    if (!dialogue) return;
    localStorage.setItem('gameSavedDialog', dialogueId);
    updateProgress(dialogue.progressBar, dialogue.overallProgress);

    if (dialogue.type === 'punch') {
        window.location.href = 'punch.html';
    }

    if (dialogue.type === 'puzzle') {
        startPuzzleGame(dialogue.imagePath);
        return;
    }

    if (dialogue.type === 'maze') {
        window.location.href = 'maze.html';
    }

    characterNameElement.innerText = renderCharName(dialogue.charName);

    if (dialogue.type === "monologue") {
        dialogueTextElement.classList.add("monologue");
    } else {
        dialogueTextElement.classList.remove("monologue");
    }

    typeText(dialogue.dialog || "");

    if (dialogue.charImg) {
        characterLeftElement.src = dialogue.charImg;
        characterContainer.classList.add('show');
    } else {
        characterContainer.classList.remove('show');
    }

    if (dialogue.backgroundImg) {
        await changeBackground(dialogue.backgroundImg);
    }

    choicesContainer.innerHTML = '';
    let hasOptions = false;
    for (let i = 1; i <= 3; i++) {
        if (dialogue[`option${i}`]) {
            hasOptions = true;
            const btn = document.createElement('button');
            btn.classList.add('choice-btn');
            btn.innerText = dialogue[`option${i}`];
            const optionTraits = {};
            if (dialogue[`trait${i}`]) {
                optionTraits[dialogue[`trait${i}`]] = true;
            }
            if (dialogue[`trait${i}_2`]) {
                optionTraits[dialogue[`trait${i}_2`]] = true;
            }
            if (dialogue[`trait${i}_3`]) {
                optionTraits[dialogue[`trait${i}_3`]] = true;
            }
            btn.onclick = () => handleChoice(dialogue[`option${i}Next`], optionTraits);
            choicesContainer.appendChild(btn);
        }
    }

    if (!hasOptions) {
        choicesContainer.innerHTML = '';
    }
}

async function handleChoice(nextDialogueId, traits) {
    if (traits) {
        const allTraits = {
            kind: traits.kind,
            romantic: traits.romantic,
            humorous: traits.humorous,
            direct: traits.direct,
            optimistic: traits.optimistic,
            shy: traits.shy
        };
        await updateTraits(allTraits);
        showDialogue(nextDialogueId);
        currentProgress = nextDialogueId;
    }
}

function changeBackground(imagePath) {
    const backgroundLayer = document.querySelector('.background-layer');
    if (!backgroundLayer) return;
    const img = new Image();
    img.onload = function () {
        backgroundLayer.style.backgroundImage = `url('${imagePath}')`;
        backgroundLayer.style.opacity = '1';
    };
    img.onerror = function () {
        console.error('Failed to load background image:', imagePath);
    };
    img.src = imagePath;
}

async function skipToInteraction() {
    async function checkAndSkipDialogue(dialogueId) {
        const dialogue = await loadDialogueFromFirebase(dialogueId);
        if (!dialogue) return false;
        let hasOptions = false;
        for (let i = 1; i <= 3; i++) {
            if (dialogue[`option${i}`]) {
                hasOptions = true;
                break;
            }
        }
        if (hasOptions) {
            currentProgress = dialogueId;
            showDialogue(currentProgress);
            return true;
        }
        if (dialogue.type === 'punch') {
            window.location.href = 'punch.html';
            return true;
        }
        if (dialogue.next.type === 'puzzle') {
            startPuzzleGame(dialogue.imagePath);
            return true;
        }
        if (dialogue.type === 'maze') {
            window.location.href = 'maze.html';
            return true;
        }
        if (dialogue.next.onComplete) {
            currentProgress = dialogue.next.onComplete;
            return await checkAndSkipDialogue(dialogue.next.onComplete);
        } else if (dialogue.next) {
            currentProgress = dialogue.next;
            return await checkAndSkipDialogue(dialogue.next);
        }
        return false;
    }
    const found = await checkAndSkipDialogue(currentProgress);
    if (!found) {
        console.log('No interaction point found');
    }
}

// document.querySelector('.skip-button').addEventListener('click', skipToInteraction);

dialogueBox.addEventListener('click', async () => {
    const dialogue = await loadDialogueFromFirebase(currentProgress);
    if (!dialogue) return;
    if (isTyping) {
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }
        dialogueTextElement.innerHTML = dialogue.dialog;
        isTyping = false;
        return;
    }
    let hasOptions = false;
    for (let i = 1; i <= 3; i++) {
        if (dialogue[`option${i}`]) hasOptions = true;
    }
    if (hasOptions) return;

    if (dialogue.type === 'punch') {
        window.location.href = 'punch.html';
        return true;
    }
    if (dialogue.next.type === 'puzzle') {
        startPuzzleGame(dialogue.next.imagePath);
        return true;
    }
    if (dialogue.type === 'maze') {
        window.location.href = 'maze.html';
        return true;
    }

    if (dialogue.next.onComplete) {
        currentProgress = dialogue.next.onComplete;
        showDialogue(currentProgress);
    } else if (dialogue.next) {
        currentProgress = dialogue.next;
        showDialogue(currentProgress);
    }
});


async function updateProgress(chapterProgress, overallProgress) {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill && chapterProgress) {
        progressFill.style.height = `${chapterProgress}%`;
    }
    localStorage.setItem('progressBar', chapterProgress);
    localStorage.setItem('overallProgress', overallProgress);

    try {
        await db.collection('players').doc(currentUserId).update({
            overallProgress: overallProgress
        });
    } catch (error) {
        console.error(`Error:`, error);
    }
}

async function startPuzzleGame(imagePath) {
    if (!imagePath) return;
    const dialogue = await loadDialogueFromFirebase(currentProgress);
    localStorage.setItem('puzzleImagePath', String(imagePath));
    window.location.href = 'memories.html';
}

function renderCharName(rawCharName) {
    const playerName = "You";
    if (!rawCharName) return playerName;
    return rawCharName.replace(/\{playerName\}/g, playerName);
}

window.onload = async function () {
    await initializeUser();

    // 检查是否有保存的章节和对话
    const savedChapter = parseInt(localStorage.getItem("gameSavedChap"));
    const savedDialog = localStorage.getItem('gameSavedDialog');
    let currentStory;

    if (savedChapter === 1) {
        currentStory = "denyAnger";
        localStorage.setItem('currentStory', "denyAnger");
        currentProgress = savedDialog !== "" ? savedDialog : "deny1";
        if (savedDialog === "") localStorage.setItem('gameSavedDialog', "deny1");
        playBackgroundMusic("../Asset Manager/musics/main/chp1.mp3")
    } else if (savedChapter === 2) {
        currentStory = "memoriesTogether";
        localStorage.setItem('currentStory', "memoriesTogether");
        currentProgress = savedDialog !== "" ? savedDialog : "memories1";
        if (savedDialog === "") localStorage.setItem('gameSavedDialog', "memories1");
        playBackgroundMusic("../Asset Manager/musics/main/chp2.mp3")
    } else if (savedChapter === 3) {
        currentStory = "lettingGo";
        localStorage.setItem('currentStory', "lettingGo");
        currentProgress = savedDialog !== "" ? savedDialog : "letting1";
        if (savedDialog === "") localStorage.setItem('gameSavedDialog', "letting1");
        playBackgroundMusic("../Asset Manager/musics/main/chp3.mp3")
    }

    console.log('Initialization - Current state:', {
        savedChapter,
        savedDialog,
        currentStory,
        currentProgress,
    });

    showDialogue(currentProgress);
};

function openSettings() {
    window.location.href = 'setting.html';
}

function goToMainMenu() {
    window.location.href = 'dashboard.html';
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