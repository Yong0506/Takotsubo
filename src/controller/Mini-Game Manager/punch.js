// punch.js

// Ensure the DOM is loaded before binding event listeners
document.addEventListener("DOMContentLoaded", () => {
    function openSettings() {
        const confirmed = window.confirm("Your current progress will all be lost, are you sure?");
        if (confirmed) {
            window.location.href = 'setting.html';
        }
    }

    function goToMainMenu() {
        const confirmed = window.confirm("Your current progress will all be lost, are you sure?");
        if (confirmed) {
            window.location.href = 'dashboard.html';
        }
    }

    // Attach to buttons after the DOM is ready
    document.querySelectorAll(".btn-custom").forEach(button => {
        if (button.textContent.includes("Settings")) {
            button.onclick = openSettings;
        } else if (button.textContent.includes("Main Menu")) {
            button.onclick = goToMainMenu;
        }
    });
});


const dodgeContainer = document.querySelector('.dodge-container');
const dodgeArrow = document.querySelector('.dodge-arrow img');
const dodgeProgressBar = document.querySelector('.dodge-progress .progress-bar');

//dodge values
let isDodgeActive = false;
let dodgeSequence = [];
let currentArrowIndex = 0;
let dodgeTimer;
let dodgeDamage = 0;
let wrongInputs = 0; // counts wrong arrow inputs during dodge

let isFeedbackShowing = false; //arrowFeed

let dodgeInterval;
let dodgeStartTime = null;
let dodgeRemainingTime = null;
let dodgeElapsedBeforePause = 0;


//Timer values
let matchTimer = 60;  // Starting time for match timer
let matchInterval;    // Timer interval reference

let isMatchActive = true;  // Is the match currently active
let isMatchOver = false;
let dodgeSequenceInProgress = false;


// Health values
let playerHealth = 100;
let opponentHealth = 100;
const playerHealthNumber = document.querySelector('.player-section .health-number');
const opponentHealthNumber = document.querySelector('.opponent-section .health-number');

//punch & stamina values
let playerStamina = 50;
let staminaRegenInterval = null;
let canPunch = true;
const maxStamina = 50;
const punchDamage = 5;
const staminaPerPunch = 10;
const staminaRegenAmount = 20;
const staminaRegenDelay = 1000; // 1 second
let lastPunchTime = 0;

const playerStaminaBar = document.querySelector('.player-section .progress-bar');

// Toggle punch visuals
const rightPunch = document.querySelector('.right-punch');
const rightPunched = document.querySelector('.right-punched');
const opponent = document.querySelector('.opponent');
const opponentHit = document.querySelector('.opponent_hit');

//SCORE VALUES
const playerScoreElement = document.querySelector('.score h2');
const opponentScoreElement = document.querySelector('.op-score h2');

let playerScore = 0;
let opponentScore = 0;

// Grab all the containers
const matchWinContainer = document.querySelector('.matchWin');
const matchLoseContainer = document.querySelector('.matchLose');
const gameWinContainer = document.querySelector('.gameWin');
const gameLoseContainer = document.querySelector('.gameLose');

// Buttons inside the containers
const matchWinButton = matchWinContainer.querySelector('.nextMatch');
const matchLoseButton = matchLoseContainer.querySelector('.nextMatch');
const gameWinButton = gameWinContainer.querySelector('.nextMatch');
const gameLoseButton = gameLoseContainer.querySelector('.nextMatch');


//BGM
let currentBGM = null;
let globalVolume = 0.5;


//PAUSE VALUES
let isPaused = false;
let savedMatchInterval = null;
let savedDodgeInterval = null;


//JUMP/SAVE CHP
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


//
//
//DODGE//
//
//
const dodgeArrowImages = {
    ArrowLeft: 'arrow-left.png',
    ArrowRight: 'arrow-right.png',
    ArrowUp: 'arrow-up.png',
    ArrowDown: 'arrow-down.png'
};

function getRandomArrow() {
    const arrows = Object.keys(dodgeArrowImages);
    return arrows[Math.floor(Math.random() * arrows.length)];
}

function generateDodgeSequence() {
    const sequenceLength = Math.floor(Math.random() * 4) + 5; // 5 to 8
    return Array.from({ length: sequenceLength }, getRandomArrow);
}

function showNextArrow() {
    if (currentArrowIndex < dodgeSequence.length) {
        const nextArrow = dodgeSequence[currentArrowIndex];
        dodgeArrow.src = `../Asset Manager/images/punch/${dodgeArrowImages[nextArrow]}`;
    }
}

function startDodgeSequence() {
    if (isDodgeActive || isMatchOver || isPaused) return;

    isDodgeActive = true;
    dodgeContainer.style.display = 'flex';
    dodgeSequence = generateDodgeSequence();
    currentArrowIndex = 0;
    dodgeDamage = 0;
    wrongInputs = 0;
    showNextArrow();

    dodgeElapsedBeforePause = 0;
    resumeDodgeTimer(); // run timer logic separately
}




function finishDodge() {
    let missed = dodgeSequence.length - currentArrowIndex;
    missed = Math.max(0, missed);
    const totalMistakes = missed + wrongInputs;
    dodgeDamage = totalMistakes * 5;

    console.log(`Dodge missed: ${missed},wrong inputs: ${wrongInputs}, Damage: ${dodgeDamage}`);

    damagePlayer(dodgeDamage);  // <-- Apply damage to player

    isDodgeActive = false;
    dodgeContainer.style.display = 'none';
    dodgeSequence = [];
    currentArrowIndex = 0;
    dodgeProgressBar.style.width = '0%';

    // 🚀 After dodge finishes, schedule next dodge
    const nextInterval = Math.random() * 3000 + 3000; // 3s–6s
    setTimeout(() => {
        if (!isDodgeActive) startDodgeSequence();
    }, nextInterval);
}

function handleArrowKeyInput(e) {
    if (!isDodgeActive || !dodgeArrowImages[e.key]) return;
    if (currentArrowIndex >= dodgeSequence.length) return; // No input after sequence ends

    const expected = dodgeSequence[currentArrowIndex];
    if (!expected) return;

    // Block inputs during feedback
    if (isFeedbackShowing) return;

    if (e.key === expected) {
        showFeedbackArrow(expected, true);
    } else {
        wrongInputs++;
        showFeedbackArrow(expected, false);
    }


}

function showFeedbackArrow(keyPressed, isCorrect) {
    isFeedbackShowing = true;

    // Decide which feedback image to show
    const feedbackType = isCorrect ? '_right' : '_wrong';
    dodgeArrow.src = `../Asset Manager/images/punch/${dodgeArrowImages[keyPressed].replace('.png', feedbackType + '.png')}`;

    // Play appropriate sound
    if (isCorrect) {
        playSoundEffect('../Asset Manager/musics/punch/snd_egg.wav');
    } else {
        playSoundEffect('../Asset Manager/musics/punch/snd_error.wav');
    }

    setTimeout(() => {
        currentArrowIndex++;

        if (currentArrowIndex >= dodgeSequence.length) {
            clearInterval(dodgeTimer);
            finishDodge();
        } else {
            showNextArrow(); // Show next arrow
        }

        isFeedbackShowing = false; // Allow input again
    }, 150); // 0.3 seconds
}


function startRandomDodgeInterval() {
    function scheduleNext() {
        const nextInterval = Math.random() * 3000 + 3000; // 3s–6s
        setTimeout(() => {
            if (!isDodgeActive) startDodgeSequence();
        }, nextInterval);
    }
    scheduleNext();
}



// Hide the dodge container
function hideDodgeContainer() {
    document.querySelector('.dodge-container').style.display = 'none';
}




//
//
//TIMER//
//
//
// Reset health values for both player and opponent
function resetHealth() {
    playerHealth = 100;
    opponentHealth = 100;
    updatePlayerHealthUI();
    updateOpponentHealthUI();
}

// Reset dodge sequence timer
function resetDodgeTimer() {
    dodgeSequenceInProgress = false;
    // Reset the dodge progress bar
    document.querySelector('.dodge-progress .progress-bar').style.width = '0%';
}

// Reset stamina (example when match starts)
function resetStamina() {
    playerStamina = maxStamina;
    updatePlayerStaminaBar();
}



function endMatch() {
    isMatchActive = false;  // Deactivate the match
    hideDodgeContainer();   // Hide the dodge container if visible
    resetDodgeTimer();      // Reset dodge timer for the next round
}

// Function to update the match timer on the screen
function updateMatchTimer() {
    if (!isMatchActive || isMatchOver) return; //Do nothing if match is paused or over

    if (matchTimer <= 0) {
        clearInterval(matchInterval);  // Stop the match timer
        determineMatchWinner();
    } else {
        matchTimer--;
        document.querySelector('.time div').textContent = matchTimer;  // Update match timer on the UI
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.startButton');
    const startScreen = document.querySelector('.startGameInstruction');
    const gameUI = document.querySelector('.gameUI');

    startButton.addEventListener('click', () => {
        playBackgroundMusic('../Asset Manager/musics/punch/punchBGM.mp3')
        startScreen.classList.add('fade-out');

        setTimeout(() => {
            startScreen.style.display = 'none';
            gameUI.style.display = 'block';
            startNewMatch();
        }, 600);
    });
});


function startNewMatch() {
    clearInterval(matchInterval);  //  FIRST clear the old interval before anything else

    matchTimer = 60;                // THEN reset timer to 60
    document.querySelector('.time div').textContent = matchTimer;  //  Update the screen immediately
    resetHealth();          // Reset healths if necessary for the next round
    resetStamina();
    isMatchActive = true; //  Mark match as active
    matchInterval = setInterval(updateMatchTimer, 1000);  //  Start a new interval
    document.addEventListener('keydown', handleArrowKeyInput);
    startRandomDodgeInterval();

    // Punch Key Listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p') {
            if (isPaused || isDodgeActive || isMatchOver) return;
            punch();
        }
    });
}



//
//
//HEALTH// 
//
//
//Update the player's health on screen
function updatePlayerHealthUI() {
    const playerHealthText = document.querySelector('.player-section .health-number');
    playerHealthText.textContent = playerHealth;
}

// Update the opponent's health on screen
function updateOpponentHealthUI() {
    const opponentHealthText = document.querySelector('.opponent-section .health-number');
    opponentHealthText.textContent = opponentHealth;
}

// Reduce player's health
function damagePlayer(amount) {
    playerHealth = Math.max(0, playerHealth - amount);
    updatePlayerHealthUI();
    console.log(`Damage Dealt: ${amount}`);
    if (playerHealth <= 0) {
        clearInterval(matchInterval);
        determineMatchWinner(); // KO
    }
}

// Reduce opponent's health (this will be used later when punch is added)
function damageOpponent(amount) {
    opponentHealth = Math.max(0, opponentHealth - amount);
    updateOpponentHealthUI();

    if (opponentHealth <= 0) {
        clearInterval(matchInterval);
        determineMatchWinner(); // KO
    }
}



//
//
//PUNCH & STAMINA
//
//
function updatePlayerStaminaBar() {
    const staminaPercent = (playerStamina / maxStamina) * 100;
    playerStaminaBar.style.width = `${staminaPercent}%`;
}

function updateOpponentHealth() {
    opponentHealthNumber.textContent = opponentHealth;
}

function punch() {
    const now = Date.now();

    // Check punch cooldown (0.5s)
    if (now - lastPunchTime < 500) return;
    lastPunchTime = now;

    // Check stamina
    if (playerStamina < staminaPerPunch) return; // Not enough stamina to punch

    // Stop stamina regeneration if player punches
    stopStaminaRegen();

    // 🎵 Play one of two punch sound effects randomly
    const punchSounds = [
        '../Asset Manager/musics/punch/punch_ish_1.wav',
        '../Asset Manager/musics/punch/punch_ish_1_bc.wav'
    ];
    const randomSound = punchSounds[Math.floor(Math.random() * punchSounds.length)];
    playSoundEffect(randomSound);


    // Apply punch
    playerStamina -= staminaPerPunch;
    if (playerStamina < 0) playerStamina = 0;
    updatePlayerStaminaBar();

    opponentHealth -= punchDamage;
    if (opponentHealth < 0) opponentHealth = 0;
    updateOpponentHealth();

    console.log('Player punched! Opponent health:', opponentHealth);

    // Safety check
    if (rightPunch && rightPunched && opponent && opponentHit) {
        // Hide idle punch and opponent
        rightPunch.style.display = 'none';
        opponent.style.display = 'none';

        // Show hit states
        rightPunched.style.display = 'flex';
        opponentHit.style.display = 'flex';

        // Revert back after short delay (e.g., 150ms)
        setTimeout(() => {
            rightPunch.style.display = 'flex';
            opponent.style.display = 'flex';
            rightPunched.style.display = 'none';
            opponentHit.style.display = 'none';
        }, 150);
    }

    // Check for opponent KO
    if (opponentHealth <= 0) {
        console.log('Opponent knocked out!');
        determineMatchWinner();
    }

    // Start stamina regen after small delay if player stops punching
    startStaminaRegen();
}

function startStaminaRegen() {
    if (staminaRegenInterval) clearInterval(staminaRegenInterval);

    staminaRegenInterval = setInterval(() => {
        if (!isMatchActive) {
            stopStaminaRegen();
            return;
        }

        if (playerStamina < maxStamina) {
            playerStamina += staminaRegenAmount;
            if (playerStamina > maxStamina) playerStamina = maxStamina;
            updatePlayerStaminaBar();
        } else {
            clearInterval(staminaRegenInterval);
            staminaRegenInterval = null;
        }
    }, staminaRegenDelay);
}

function stopStaminaRegen() {
    if (staminaRegenInterval) {
        clearInterval(staminaRegenInterval);
        staminaRegenInterval = null;
    }
}



//
//
//SCORE
//
//
function updateScore(winner) {
    if (winner === 'player') {
        playerScore++;
    } else if (winner === 'opponent') {
        opponentScore++;
    }

    // Update display
    playerScoreElement.textContent = `${playerScore} |`;
    opponentScoreElement.textContent = `| ${opponentScore}`;

}


// This function is called when match ends
function determineMatchWinner() {
    const playerHealth = parseInt(playerHealthNumber.textContent);
    const opponentHealth = parseInt(opponentHealthNumber.textContent);

    if (playerHealth === opponentHealth) {
        console.log('Match tied. Restarting match without awarding point.');
        endMatch();
        startNewMatch();
    } else if (playerHealth > opponentHealth) {
        console.log('Player wins this match!');
        playerScore++; // Update score manually here
        playerScoreElement.textContent = `${playerScore} |`;
        opponentScoreElement.textContent = `| ${opponentScore}`;

        if (playerScore >= 2) {
            console.log('Player wins the game!');
            endMatch();
            showGameWin();  // 🎯 Show game win container
        } else {
            endMatch();
            showMatchWin(); // 🎯 Only show match win if game not ended
        }
    } else {
        console.log('Opponent wins this match!');
        opponentScore++; // Update score manually here
        playerScoreElement.textContent = `${playerScore} |`;
        opponentScoreElement.textContent = `| ${opponentScore}`;

        if (opponentScore >= 2) {
            console.log('Opponent wins the game!');
            endMatch();
            showGameLose(); //  Show game lose container
        } else {
            endMatch();
            showMatchLose(); //  Only show match lose if game not ended
        }
    }
}


//
//
//matchInBetween
//
//

// Functions to show containers
function showMatchWin() {
    isMatchOver = true;
    matchWinContainer.style.display = 'flex';
}

function showMatchLose() {
    isMatchOver = true;
    matchLoseContainer.style.display = 'flex';
}

function showGameWin() {
    isMatchOver = true;
    gameWinContainer.style.display = 'flex';
}

function showGameLose() {
    isMatchOver = true;
    gameLoseContainer.style.display = 'flex';
}

// Functions to hide all containers
function hideAllMatchContainers() {
    matchWinContainer.style.display = 'none';
    matchLoseContainer.style.display = 'none';
    gameWinContainer.style.display = 'none';
    gameLoseContainer.style.display = 'none';
}

// Attach button behaviors
matchWinButton.onclick = () => {
    hideAllMatchContainers();
    isMatchOver = false;  // Unlock the match
    startNewMatch();
};

matchLoseButton.onclick = () => {
    hideAllMatchContainers();
    isMatchOver = false;
    startNewMatch();
};

gameWinButton.onclick = () => {
    hideAllMatchContainers();
    isMatchOver = false;

    playerScore = 0;
    opponentScore = 0;
    playerScoreElement.textContent = `0 |`;
    opponentScoreElement.textContent = `| 0`;
    saveChp();
};

async function saveChp() {
    try {
        await updateDoc(doc(collection(db, "players"), deviceId), {
            memories: "Yes",
        });
        localStorage.setItem("gameSavedDialog", "");
        localStorage.setItem("currentStory", "");
        window.location.href = 'storyEnd.html';
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Failed to save your information. Please try again.");
    }
}

gameLoseButton.onclick = () => {
    hideAllMatchContainers();
    isMatchOver = false;

    playerScore = 0;
    opponentScore = 0;
    playerScoreElement.textContent = `0 |`;
    opponentScoreElement.textContent = `| 0`;

    startNewMatch();
};


//BGM FUNCTION
function playBackgroundMusic(filePath) {
    // Stop previous BGM if playing
    if (currentBGM) {
        currentBGM.pause();
        currentBGM.currentTime = 0;
    }

    // Create new audio element
    currentBGM = new Audio(filePath);
    currentBGM.loop = true;

    // Set volume based on the saved setting or default to 0.5
    const savedVolume = localStorage.getItem("gameVolume");
    currentBGM.volume = savedVolume !== null ? savedVolume / 100 : 0.5;

    currentBGM.play().catch((err) => {
        console.warn("Autoplay blocked or error occurred:", err);
    });
}

function playSoundEffect(filePath) {
    const sfx = new Audio(filePath);

    // Set volume based on the saved setting or default to 0.5 (same as BGM)
    const savedVolume = localStorage.getItem("gameVolume");
    sfx.volume = savedVolume !== null ? savedVolume / 100 : 0.5;

    sfx.play().catch((err) => {
        console.warn("Sound effect failed to play:", err);
    });
}

// Refresh BGM volume when returning from settings
function refreshBGMVolume() {
    if (currentBGM) {
        const savedVolume = localStorage.getItem("gameVolume");
        currentBGM.volume = savedVolume !== null ? savedVolume / 100 : 0.5;
    }
}

// Ensure volume is refreshed when returning from settings
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshBGMVolume();
    }
});



//
//
// Pause everything
//
function pauseGame() {
    isPaused = true;

    if (matchInterval) clearInterval(matchInterval);

    if (dodgeTimer) {
        clearInterval(dodgeTimer);
        dodgeElapsedBeforePause += Date.now() - dodgeStartTime;
    }

    if (dodgeInterval) clearInterval(dodgeInterval);

    stopStaminaRegen();

    if (currentBGM && !currentBGM.paused) currentBGM.pause();
}


function resumeDodgeTimer() {
    const duration = 8000;
    dodgeStartTime = Date.now();

    dodgeTimer = setInterval(() => {
        const totalElapsed = dodgeElapsedBeforePause + (Date.now() - dodgeStartTime);
        const percent = ((duration - totalElapsed) / duration) * 100;
        dodgeProgressBar.style.width = `${percent}%`;

        if (totalElapsed >= duration) {
            clearInterval(dodgeTimer);
            dodgeElapsedBeforePause = 0;
            finishDodge();
        }
    }, 100);
}


function resumeGame() {
    isPaused = false;

    if (isMatchActive && !isMatchOver) {
        matchInterval = setInterval(updateMatchTimer, 1000);
    }

    if (isDodgeActive) {
        resumeDodgeTimer(); // Don't restart sequence, just continue timing
    } else {
        startRandomDodgeInterval();
    }

    if (playerStamina < maxStamina) {
        startStaminaRegen();
    }


    if (currentBGM && currentBGM.paused) currentBGM.play();
}



// Resume when "Resume" button is clicked in modal
document.querySelector('#pauseModal .btn-custom[data-bs-dismiss="modal"]')
    .addEventListener('click', resumeGame);

document.getElementById('btn btn-success').addEventListener('click', () => {
    pauseGame(); // This will pause everything as defined earlier
});


window.onload = async function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }
}