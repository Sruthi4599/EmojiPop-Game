const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let fruits = [];
let bombs = [];
let slicedFruits = []; // For sliced fruit pieces
let smashEffects = []; // For smash and splash effects
let score = 0;
let missedFruits = 0;
let gameOver = false;

// Fruit and bomb images
const fruitImages = ["😍", "🥹", "🤣", "🤩", "😎", "🤪", "🤩", "🤗"];
const bombImage = "👻";

// Function to create a random fruit or bomb
function spawnObject(type) {
    const x = Math.random() * (canvas.width - 50) + 25; // Random x position
    const y = canvas.height - 50; // Start from the bottom
    const size = 40 + Math.random() * 20; // Random size
    const upwardSpeed = -15 - Math.random() * 8; // Initial upward speed
    const gravity = 0.7; // Gravity factor

    if (type === "fruit") {
        const fruit = {
            x,
            y,
            size,
            upwardSpeed,
            gravity,
            emoji: fruitImages[Math.floor(Math.random() * fruitImages.length)],
            isFalling: false, // Determines whether it’s falling
        };
        fruits.push(fruit);
    } else if (type === "bomb") {
        const bomb = {
            x,
            y,
            size,
            upwardSpeed,
            gravity,
            isFalling: false,
        };
        bombs.push(bomb);
    }
}

// Draw an object (fruit or bomb)
function drawObject(object, type) {
    ctx.font = `${object.size}px Arial`;
    ctx.textAlign = "center";

    if (type === "fruit") {
        ctx.fillText(object.emoji, object.x, object.y);
    } else if (type === "bomb") {
        ctx.fillText(bombImage, object.x, object.y);
    }
}

// Draw sliced fruit pieces
function drawSlicedFruit(piece) {
    ctx.font = `${piece.size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(piece.emoji, piece.x, piece.y);
}

// Draw smash or splash effect
function drawSmashEffect(effect) {
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.globalAlpha = effect.opacity;
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset transparency
}

// Handle object movement with parabolic motion
function moveObjects(objects) {
    objects.forEach((object, index) => {
        if (!object.isFalling) {
            object.y += object.upwardSpeed; // Move upward
            object.upwardSpeed += object.gravity; // Decelerate
            if (object.upwardSpeed >= 0) {
                object.isFalling = true; // Start falling after reaching peak
            }
        } else {
            object.y += object.gravity * 2; // Fall faster
        }

        // Remove object if it moves out of bounds
        if (object.y - object.size > canvas.height) {
            objects.splice(index, 1);
            if (!gameOver && objects === fruits) {
                missedFruits++;
                if (missedFruits >= 50) gameOver = true; // Game over if too many missed
            }
        }
    });
}

// Handle sliced fruit pieces
function moveSlicedFruits() {
    slicedFruits.forEach((piece, index) => {
        piece.x += piece.speedX;
        piece.y += piece.speedY;
        piece.speedY += 0.3; // Gravity effect

        // Remove sliced piece if it falls off screen
        if (piece.y > canvas.height) {
            slicedFruits.splice(index, 1);
        }
    });
}

// Handle smash effects
function updateSmashEffects() {
    smashEffects.forEach((effect, index) => {
        effect.radius += 2; // Increase effect radius
        effect.opacity -= 0.02; // Fade out slower for splash effect
        if (effect.opacity <= 0) {
            smashEffects.splice(index, 1); // Remove faded effects
        }
    });
}

// Check if an object is sliced
function checkSlice(event, objects, type) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    objects.forEach((object, index) => {
        const emojiCenterX = object.x;
        const emojiCenterY = object.y - object.size / 3; // Adjust the center upwards
        const radius = object.size / 2; // Approximate radius for hitbox

        const dx = mouseX - emojiCenterX;
        const dy = mouseY - emojiCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radius) { // Click inside circular hitbox
            if (type === "fruit") {
                if (object.emoji === "⭐") {
                    score += 5;
                } else {
                    score++;
                }

                // Create sliced fruit pieces
                const halfSize = object.size / 2;
                slicedFruits.push({
                    x: object.x - halfSize / 2,
                    y: object.y,
                    size: halfSize,
                    emoji: object.emoji,
                    speedX: -3,
                    speedY: -3,
                });
                slicedFruits.push({
                    x: object.x + halfSize / 2,
                    y: object.y,
                    size: halfSize,
                    emoji: object.emoji,
                    speedX: 3,
                    speedY: -3,
                });

                // Create smash effect
                smashEffects.push({
                    x: mouseX,
                    y: mouseY,
                    radius: 10,
                    color: "rgb(224, 136, 42)",
                    opacity: 0.7,
                });

                // Create splash effect
                smashEffects.push({
                    x: mouseX,
                    y: mouseY,
                    radius: 20,
                    color: "rgba(255, 165, 0, 0.5)",
                    opacity: 0.3,
                });
            } else if (type === "bomb") {
                gameOver = true;
            }
            objects.splice(index, 1);
        }
    });
}

// Display score and game over message
function displayScore() {
    document.getElementById("score").innerText = score;
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FFF";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
    }
}

// Main game loop
function gameLoop() {
    if (gameOver) {
        displayScore();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw and move fruits, bombs, sliced pieces, and effects
    fruits.forEach((fruit) => drawObject(fruit, "fruit"));
    bombs.forEach((bomb) => drawObject(bomb, "bomb"));
    slicedFruits.forEach(drawSlicedFruit);
    smashEffects.forEach(drawSmashEffect);

    moveObjects(fruits);
    moveObjects(bombs);
    moveSlicedFruits();
    updateSmashEffects();

    displayScore();

    requestAnimationFrame(gameLoop);
}

// Spawn objects at intervals
setInterval(() => {
    if (!gameOver) {
        if (Math.random() < 0.7) {
            spawnObject("fruit");
        } 
        else if(Math.random===0.7){
            spawnObject("fruit","⭐");
        }
        else {
            spawnObject("bomb");
        }
    }
}, 1000);

// Handle slicing
canvas.addEventListener("mousedown", (event) => {
    checkSlice(event, fruits, "fruit");
    checkSlice(event, bombs, "bomb");
});

// Start the game
gameLoop();
