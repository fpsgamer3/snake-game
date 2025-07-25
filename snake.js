const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 600;

const gridSize = 30;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = { x: 5, y: 5 };
let gameOver = false;
let score = 0;
let showHappyFace = false;
let happyFaceTimeout = null;
let gameSpeed = 100; 
let gameLoopTimeout = null;
let gameStarted = false;
let menuActive = true;
let menuButtons = [
    { label: 'Slug', speed: 180, x: 180, y: 220, w: 240, h: 60, hover: false },
    { label: 'Snake', speed: 100, x: 180, y: 300, w: 240, h: 60, hover: false },
    { label: 'Python', speed: 60, x: 180, y: 380, w: 240, h: 60, hover: false }
];
let showGameOverScreen = false;
let restartButton = { x: 180, y: 340, w: 240, h: 60, hover: false };

// Update score display above canvas
function updateScoreDisplay() {
    const scoreDiv = document.getElementById('scoreDisplay');
    if (scoreDiv) scoreDiv.textContent = 'Score: ' + score;
}

function drawMenu() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#232526');
    gradient.addColorStop(1, '#414345');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Press Start 2P", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Choose Difficulty', canvas.width/2, 140);
    // Draw buttons
    menuButtons.forEach(btn => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
        ctx.fillStyle = btn.hover ? '#333' : '#222';
        ctx.shadowColor = btn.hover ? '#00ffea' : 'transparent';
        ctx.shadowBlur = btn.hover ? 16 : 0;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = btn.hover ? '#00ffea' : '#fff';
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.font = '18px "Press Start 2P", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + btn.w/2, btn.y + btn.h/2 + 8);
    });
    ctx.textAlign = 'left';
}

function drawGameOverScreen() {
    // Overlay
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#232526';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    // Popup
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(100, 150, 400, 300, 24);
    ctx.fill();
    ctx.stroke();
    // Game Over text
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Press Start 2P", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, 200);
    // Score
    ctx.font = '16px "Press Start 2P", Arial, sans-serif';
    ctx.fillText('Score: ' + score, canvas.width/2, 240);
    // Draw dead snake head
    drawDeadSnakeHead(canvas.width/2, 280);
    // Restart button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(restartButton.x, restartButton.y, restartButton.w, restartButton.h, 12);
    ctx.fillStyle = restartButton.hover ? '#333' : '#222';
    ctx.shadowColor = restartButton.hover ? '#00ffea' : 'transparent';
    ctx.shadowBlur = restartButton.hover ? 16 : 0;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = restartButton.hover ? '#00ffea' : '#fff';
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Press Start 2P", Arial, sans-serif';
    ctx.fillText('Restart', restartButton.x + restartButton.w/2, restartButton.y + restartButton.h/2 + 8);
    ctx.textAlign = 'left';
    ctx.restore();
}

function drawDeadSnakeHead(x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Head as a square (like snake segment)
    ctx.beginPath();
    ctx.rect(-30, -30, 60, 60);
    ctx.fillStyle = '#2196F3';
    ctx.fill();
    // Crossed eyes
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    // Left eye X
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-5, 0);
    ctx.moveTo(-5, -10);
    ctx.lineTo(-15, 0);
    ctx.stroke();
    // Right eye X
    ctx.beginPath();
    ctx.moveTo(5, -10);
    ctx.lineTo(15, 0);
    ctx.moveTo(15, -10);
    ctx.lineTo(5, 0);
    ctx.stroke();
    // Mouth (flat)
    ctx.beginPath();
    ctx.moveTo(-10, 18);
    ctx.lineTo(10, 18);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function draw() {
    if (menuActive) {
        drawMenu();
        return;
    }
    if (showGameOverScreen) {
        drawGameOverScreen();
        return;
    }
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#232526');
    gradient.addColorStop(1, '#414345');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();

    // Draw food as an apple
    const appleX = food.x * gridSize + gridSize / 2;
    const appleY = food.y * gridSize + gridSize / 2;
    const appleRadius = (gridSize - 6) / 2;
    // Apple body
    ctx.beginPath();
    ctx.arc(appleX, appleY, appleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    // Apple stem
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.moveTo(appleX, appleY - appleRadius);
    ctx.lineTo(appleX, appleY - appleRadius - 7);
    ctx.stroke();
    // Apple leaf
    ctx.beginPath();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.moveTo(appleX, appleY - appleRadius - 5);
    ctx.lineTo(appleX + 5, appleY - appleRadius - 10);
    ctx.stroke();

    // Draw snake
    ctx.fillStyle = '#2196F3'; // blue
    const segmentSpacing = 2; // space between segments
    const segmentSize = gridSize - segmentSpacing;
    snake.forEach((segment, idx) => {
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + segmentSpacing / 2,
            segment.y * gridSize + segmentSpacing / 2,
            segmentSize,
            segmentSize,
            6 // corner radius
        );
        ctx.fill();
    });

    // Draw face on the head
    const head = snake[0];
    const headX = head.x * gridSize + gridSize / 2;
    const headY = head.y * gridSize + gridSize / 2;
    ctx.save();
    ctx.translate(headX, headY);
    // Determine rotation angle based on direction
    let angle = 0;
    if (direction.x === 1 && direction.y === 0) angle = 0; // right
    else if (direction.x === -1 && direction.y === 0) angle = Math.PI; // left
    else if (direction.x === 0 && direction.y === -1) angle = -Math.PI / 2; // up
    else if (direction.x === 0 && direction.y === 1) angle = Math.PI / 2; // down
    ctx.rotate(angle);
    // Eyes
    ctx.beginPath();
    ctx.arc(-5, -3, 2, 0, Math.PI * 2);
    ctx.arc(5, -3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    // Mouth
    ctx.beginPath();
    if (showHappyFace) {
        // Happy mouth
        ctx.arc(0, 3, 5, 0, Math.PI, false);
    } else {
        // Dull mouth (flat)
        ctx.moveTo(-4, 6);
        ctx.lineTo(4, 6);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';
    ctx.stroke();
    ctx.restore();

}

function update() {
    if (gameOver) return;

    // Move snake
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wrap around the edges
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver = true;
            showGameOverScreen = true;
            setTimeout(() => { draw(); }, 50); // Ensure overlay draws after game ends
            return;
        }
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScoreDisplay();
        placeFood();
        // Show happy face for 400ms
        showHappyFace = true;
        if (happyFaceTimeout) clearTimeout(happyFaceTimeout);
        happyFaceTimeout = setTimeout(() => {
            showHappyFace = false;
        }, 400);
    } else {
        snake.pop();
    }
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Make sure food doesn't spawn on the snake
    for (let segment of snake) {
        if (food.x === segment.x && food.y === segment.y) {
            placeFood();
            return;
        }
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        gameLoopTimeout = setTimeout(gameLoop, gameSpeed);
    }
}

// Menu logic
canvas.addEventListener('mousemove', function(e) {
    if (!menuActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    menuButtons.forEach(btn => {
        btn.hover = mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    });
    draw();
});

canvas.addEventListener('mousedown', function(e) {
    if (!menuActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    menuButtons.forEach(btn => {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
            gameSpeed = btn.speed;
            menuActive = false;
            resetGame();
            gameStarted = true;
            direction = { x: 1, y: 0 };
            gameLoop();
        }
    });
});

// Game Over screen mouse logic
canvas.addEventListener('mousemove', function(e) {
    if (showGameOverScreen) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        restartButton.hover = mx >= restartButton.x && mx <= restartButton.x + restartButton.w && my >= restartButton.y && my <= restartButton.y + restartButton.h;
        draw();
        return;
    }
    if (menuActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    menuButtons.forEach(btn => {
        btn.hover = mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    });
    draw();
});

canvas.addEventListener('mousedown', function(e) {
    if (showGameOverScreen) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (mx >= restartButton.x && mx <= restartButton.x + restartButton.w && my >= restartButton.y && my <= restartButton.y + restartButton.h) {
            resetGame();
            menuActive = true;
            draw();
        }
        return;
    }
    if (!menuActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    menuButtons.forEach(btn => {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
            gameSpeed = btn.speed;
            menuActive = false;
            resetGame();
            gameStarted = true;
            direction = { x: 1, y: 0 };
            gameLoop();
        }
    });
});

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    food = { x: 5, y: 5 };
    gameOver = false;
    showGameOverScreen = false;
    score = 0;
    updateScoreDisplay();
    showHappyFace = false;
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    draw();
}

document.addEventListener('keydown', e => {
    if (showGameOverScreen && (e.key === 'Enter' || e.key === ' ')) {
        resetGame();
        menuActive = true;
        draw();
        return;
    }
    if (!gameStarted || menuActive) return;
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 1) break;
            direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === -1) break;
            direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 1) break;
            direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === -1) break;
            direction = { x: 1, y: 0 };
            break;
    }
});

draw();
updateScoreDisplay();
// Remove old start-on-keypress logic 