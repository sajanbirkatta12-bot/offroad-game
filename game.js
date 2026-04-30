const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
const game = {
    width: canvas.width,
    height: canvas.height,
    score: 0,
    distance: 0,
    health: 100,
    level: 1,
    gameRunning: true,
    cameraY: 0
};

// Player Vehicle
const player = {
    x: game.width / 2,
    y: game.height - 100,
    width: 40,
    height: 60,
    angle: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0,
    maxSpeed: 8,
    acceleration: 0.3,
    friction: 0.95,
    rotationSpeed: 0.1
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Game Objects Arrays
let obstacles = [];
let collectibles = [];

// Obstacle Types
const obstacleTypes = {
    rock: { damage: 10, color: '#8B7355', emoji: '🪨' },
    water: { damage: 20, color: '#4A90E2', emoji: '💧' },
    mud: { damage: 15, color: '#A0826D', emoji: '🌪️' }
};

// Collectible Types
const collectibleTypes = {
    coin: { points: 50, color: '#FFD700', emoji: '🪙' },
    star: { points: 100, color: '#FF6B9D', emoji: '⭐' },
    health: { points: 0, healthRestore: 25, color: '#4ADE80', emoji: '🩹' }
};

// Spawn obstacles and collectibles
function spawnObjects() {
    const spawnRate = Math.max(0.02, 0.05 - game.level * 0.005);
    
    // Spawn obstacles
    if (Math.random() < spawnRate) {
        const types = Object.keys(obstacleTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        obstacles.push({
            x: Math.random() * (game.width - 40) + 20,
            y: game.cameraY - 100,
            width: 40,
            height: 40,
            type: randomType,
            ...obstacleTypes[randomType]
        });
    }

    // Spawn collectibles
    if (Math.random() < spawnRate * 1.5) {
        const types = Object.keys(collectibleTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        collectibles.push({
            x: Math.random() * (game.width - 30) + 15,
            y: game.cameraY - 100,
            width: 30,
            height: 30,
            type: randomType,
            ...collectibleTypes[randomType]
        });
    }
}

// Update player movement
function updatePlayer() {
    // Rotation
    if (keys['arrowleft'] || keys['a']) {
        player.angle -= player.rotationSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
        player.angle += player.rotationSpeed;
    }

    // Acceleration
    if (keys['arrowup'] || keys['w']) {
        player.speed = Math.min(player.speed + player.acceleration, player.maxSpeed);
    } else {
        player.speed *= player.friction;
    }

    // Braking
    if (keys[' ']) {
        player.speed *= 0.8;
    }

    // Velocity based on angle
    player.velocityX = Math.sin(player.angle) * player.speed;
    player.velocityY = -Math.cos(player.angle) * player.speed;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Boundary collision
    if (player.x < player.width / 2) player.x = player.width / 2;
    if (player.x > game.width - player.width / 2) player.x = game.width - player.width / 2;
    if (player.y < player.height / 2) player.y = player.height / 2;
    if (player.y > game.height - player.height / 2) player.y = game.height - player.height / 2;

    // Update distance and level
    game.distance += player.speed;
    game.level = Math.floor(game.distance / 5000) + 1;

    // Camera follows player
    game.cameraY = player.y - game.height / 3;
}

// Collision detection
function checkCollisions() {
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (circleCollision(player, obstacle)) {
            game.health -= obstacle.damage;
            obstacles.splice(i, 1);
            continue;
        }
        if (obstacle.y > game.cameraY + game.height) {
            obstacles.splice(i, 1);
        }
    }

    // Check collectible collisions
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        if (circleCollision(player, collectible)) {
            const type = collectibleTypes[collectible.type];
            game.score += collectible.points;
            if (type.healthRestore) {
                game.health = Math.min(game.health + type.healthRestore, 100);
            }
            collectibles.splice(i, 1);
            continue;
        }
        if (collectible.y > game.cameraY + game.height) {
            collectibles.splice(i, 1);
        }
    }

    // Check if player is dead
    if (game.health <= 0) {
        endGame();
    }
}

// Circle collision detection
function circleCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.width / 2) + (obj2.width / 2);
}

// Draw functions
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Vehicle body
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(-player.width / 3, -player.height / 3, (player.width * 2) / 3, player.height / 4);

    // Windows
    ctx.fillStyle = '#333';
    ctx.fillRect(-player.width / 3 + 2, -player.height / 3 + 2, player.width / 3 - 4, player.height / 4 - 4);

    ctx.restore();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obstacle.emoji, obstacle.x, obstacle.y);
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        ctx.fillStyle = collectible.color;
        ctx.beginPath();
        ctx.arc(collectible.x, collectible.y, collectible.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(collectible.emoji, collectible.x, collectible.y);
    });
}

function drawUI() {
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 202, 22);
    ctx.fillStyle = game.health > 50 ? '#4ADE80' : game.health > 25 ? '#FBBF24' : '#EF4444';
    ctx.fillRect(12, 12, (game.health * 2), 18);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 202, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(game.health)}%`, 111, 21);

    // Speed indicator
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ Speed: ${Math.floor(player.speed * 10)}`, 10, 50);
}

function drawBackground() {
    // Terrain pattern
    const tileSize = 100;
    const offsetY = game.cameraY % tileSize;
    
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    for (let y = -offsetY; y < game.height; y += tileSize) {
        for (let x = 0; x < game.width; x += tileSize) {
            ctx.strokeRect(x, y, tileSize, tileSize);
        }
    }

    // Distance marker
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🏁 Distance: ${Math.floor(game.distance)}m`, game.width / 2, 30);
}

// Update UI display
function updateUIDisplay() {
    document.getElementById('distance').textContent = Math.floor(game.distance);
    document.getElementById('speed').textContent = Math.floor(player.speed * 10);
    document.getElementById('score').textContent = Math.floor(game.score);
    document.getElementById('level').textContent = game.level;
}

// End game
function endGame() {
    game.gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${Math.floor(game.score)}`;
    document.getElementById('finalDistance').textContent = `Distance: ${Math.floor(game.distance)}m`;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Game loop
function gameLoop() {
    if (!game.gameRunning) return;

    // Update
    updatePlayer();
    spawnObjects();
    checkCollisions();
    updateUIDisplay();

    // Draw
    ctx.clearRect(0, 0, game.width, game.height);
    ctx.save();
    ctx.translate(0, -game.cameraY);
    
    drawBackground();
    drawObstacles();
    drawCollectibles();
    drawPlayer();
    
    ctx.restore();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();