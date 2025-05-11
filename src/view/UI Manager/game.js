// This file contains the game logic for the maze game. It initializes the maze, handles keyboard input for player movement, manages trigger points, and displays pop-up pages when the player touches a trigger point.

const mazeContainer = document.getElementById('maze');
const mazeSize = 20;
const maze = [];
const player = { x: 0, y: 0 }; // Player's starting position
let previousPlayerPos = { x: 0, y: 0 }; // Stores player's position before a move to a trigger
const triggers = [];
let firstTriggerActivated = false; // Track if the first trigger has been activated
let triggersRemaining = 10; // Track the number of remaining trigger points
let lastReachableCell = { x: 0, y: 0 }; // Track the last reachable cell
let currentTriggerIndex = 0; // Track how many triggers have been activated
let redEndpointGenerated = false; // Track if the red endpoint has been generated
let playerHealth = 3; // Initialize player health

// Generate the maze grid with a single path
function generateMaze() {
    function carvePath(x, y) {
        visited[y][x] = true;
        maze[y][x].classList.remove('wall'); // Clear the current cell

        // Shuffle directions to create a random path
        const shuffledDirections = directions.sort(() => Math.random() - 0.5);

        for (const { dx, dy } of shuffledDirections) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;

            if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && !visited[ny][nx]) {
                // Remove the wall between the current cell and the next cell
                maze[y + dy][x + dx].classList.remove('wall');
                carvePath(nx, ny);
            }
        }

        // Update the last reachable cell
        lastReachableCell.x = x;
        lastReachableCell.y = y;
    }

    // Initialize the maze with walls
    for (let y = 0; y < mazeSize; y++) {
        const row = [];
        for (let x = 0; x < mazeSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'wall'); // Start with all walls
            mazeContainer.appendChild(cell);
            row.push(cell);
        }
        maze.push(row);
    }

    // Create a visited array to track carved paths
    const visited = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(false));
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];

    // Start carving the path from the top-left corner
    carvePath(0, 0);

    // Place the player at the starting point
    maze[player.y][player.x].classList.add('player');

    // Place 10 trigger points along the path
    for (let i = 0; i < 10; i++) {
        let tx, ty;
        do {
            tx = Math.floor(Math.random() * mazeSize);
            ty = Math.floor(Math.random() * mazeSize);
        } while (maze[ty][tx].classList.contains('wall') || maze[ty][tx].classList.contains('trigger') || (tx === 0 && ty === 0));
        maze[ty][tx].classList.add('trigger');
        triggers.push({ x: tx, y: ty });
    }
}

// Move the player
function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    // Store current position as previous before making the move
    previousPlayerPos.x = player.x;
    previousPlayerPos.y = player.y;

    if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize) return; // Out of bounds
    if (maze[newY][newX].classList.contains('wall')) return; // Hit a wall

    // Remove player from current position
    maze[player.y][player.x].classList.remove('player');

    // Update player position
    player.x = newX;
    player.y = newY;

    // Add player to new position
    maze[player.y][player.x].classList.add('player');

    // Check if the player reaches a trigger point
    if (maze[player.y][player.x].classList.contains('trigger')) {
        maze[player.y][player.x].classList.remove('trigger'); // Remove the trigger point

        // Open the corresponding scenario modal
        currentTriggerIndex++;
        if (currentTriggerIndex <= 10) {
            openModal(`scenario${currentTriggerIndex}`);
        }

        // Check if all triggers are activated
        if (currentTriggerIndex === 10 && !redEndpointGenerated) {
            generateRedEndpoint();
        }
    }

    // Check if the player reaches the red endpoint
    if (maze[player.y][player.x].classList.contains('red-end')) {
        alert('🎉 Congratulations! You have completed the maze!');
        window.location.href = 'storyEnd.html';
        maze[player.y][player.x].classList.remove('red-end'); // Remove the red endpoint
    }
}

// Function to generate the red endpoint
function generateRedEndpoint() {
    let ex, ey;
    do {
        ex = Math.floor(Math.random() * mazeSize);
        ey = Math.floor(Math.random() * mazeSize);
    } while (maze[ey][ex].classList.contains('wall') || maze[ey][ex].classList.contains('player'));

    maze[ey][ex].classList.add('red-end'); // Add the red endpoint class
    redEndpointGenerated = true;

    alert('🎯 The red endpoint has been generated! Move your player icon to trigger it and complete the maze!');
}

// Function to handle health loss
function loseHealth() {
    if (playerHealth > 0) {
        playerHealth--;
        updateHeartDisplay();

        if (playerHealth <= 0) {
            gameOver();
        }
    }
}

// Function to update heart display
function updateHeartDisplay() {
    for (let i = 1; i <= 3; i++) {
        const heartElement = document.getElementById(`heart${i}`); // Assumes heart IDs are heart1, heart2, heart3
        if (heartElement) {
            if (i <= playerHealth) {
                heartElement.style.visibility = 'visible';
            } else {
                heartElement.style.visibility = 'hidden';
            }
        }
    }
}

// Function to handle game over
function gameOver() {
    openModal('gameOverModal'); // Assumes a modal with id="gameOverModal" exists in HTML
    // Optionally, disable player movement here
}

// Function to reset the game (called by replay button in gameOverModal)
function resetGame() {
    location.reload(); // Reload the page to reset the game to its initial state
}

// Modify the `showFeedback` function to handle wrong answers and health
function showFeedback(correct, feedbackId) {
    const feedback = document.getElementById(feedbackId);
    const scenarioModalId = feedbackId.replace('feedback', 'scenario');

    if (correct) {
        feedback.innerText = "✅ That's the right answer! Returning to the maze...";
        setTimeout(() => {
            closeModal(scenarioModalId);
        }, 2000); // Wait 2 seconds before closing the modal
    } else {
        feedback.innerText = "❌ Incorrect! You lose a heart and will be moved back.";
        loseHealth(); // Handles health reduction and checks for game over
        setTimeout(() => {
            closeModal(scenarioModalId);
            if (playerHealth > 0) { // If game is not over, move player back
                maze[player.y][player.x].classList.remove('player'); // Remove player from current (trigger) cell
                player.x = previousPlayerPos.x;
                player.y = previousPlayerPos.y;
                maze[player.y][player.x].classList.add('player'); // Add player to the actual previous cell
            }
        }, 2000); // Close modal, then move player if applicable
    }
}

// Function to open a modal
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

// Function to close a modal
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
    }
});



function openInfoModal() {
    document.getElementById('info-modal').style.display = 'block';
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// Initialize the game
generateMaze();
previousPlayerPos = { x: player.x, y: player.y }; // Initialize previous position
updateHeartDisplay(); // Set initial heart display