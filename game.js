// --- CONFIGURATION ---
// This object tells Phaser how to set up the game.
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    width: 800,        // Game width
    height: 600,       // Game height
    physics: {
        default: 'arcade', // Use the simple Arcade Physics system
        arcade: {
            gravity: { y: 600 }, // Vertical gravity pulling down
            debug: false         // Set to true to see collision boxes
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game with the config
const game = new Phaser.Game(config);

// --- GLOBAL VARIABLES ---
let player;
let cursors;
let platforms;
let floors;
let wordBlocks;
let textGroup;
let bg1, bg2, fg, debrisEmitter;
let currentLevel = 0;
let levelText;
let leftButtonPressed = false;
let rightButtonPressed = false;
let enemies;
let sootCoins;
let score = 0;
let scoreText;
let audioCtx;

// --- LEVEL DATA ---
// 10 Levels with a target word and 3 options for each
const levels = [
    { target: "CAT", options: ["BAT", "CAT", "RAT"] },
    { target: "DOG", options: ["DOG", "LOG", "FOG"] },
    { target: "SUN", options: ["RUN", "SUN", "FUN"] },
    { target: "RED", options: ["BED", "RED", "FED"] },
    { target: "ONE", options: ["WON", "TON", "ONE"] },
    { target: "BIG", options: ["PIG", "BIG", "DIG"] },
    { target: "HOP", options: ["MOP", "TOP", "HOP"] },
    { target: "SKY", options: ["SKY", "FLY", "DRY"] },
    { target: "FOX", options: ["BOX", "FOX", "POX"] },
    { target: "JAM", options: ["HAM", "JAM", "DAM"] }
];

// --- PRELOAD FUNCTION ---
// Load all images and assets before the game starts
function preload() {
    // Load Backgrounds
    this.load.image('bg1', 'assets/background1.png');
    this.load.image('bg2', 'assets/background2.png');
    this.load.image('brickpath', 'assets/brickpath.png');
    this.load.image('wordblock', 'assets/wordblock.png');
    this.load.image('wordblocksmash', 'assets/wordblocksmash.png');
    this.load.image('platform', 'assets/platform.png');

    // // Load audio files (make sure you have jump.mp3 and hit.mp3 in your folder)
    // this.load.audio('jumpSound', 'jump.mp3');
    // this.load.audio('hitSound', 'assets/hit.mp3');
    // this.load.audio('coinSound', 'assets/coin.mp3');

    // Load Totoro Sprites (Frames for animation)
    this.load.image('totoro1', 'assets/totoro1.png');
    this.load.image('totoro2', 'assets/totoro2.png');
    this.load.image('totoro3', 'assets/totoro3.png');
    this.load.image('totoro4', 'assets/totoro4.png');

    // Load Mike (Bad Guy)
    this.load.image('mike1', 'assets/mike1.png');
    this.load.image('mike2', 'assets/mike2.png');
    this.load.image('mike3', 'assets/mike3.png');
    this.load.image('sootcoin', 'assets/sootcoin.png');
}

// --- CREATE FUNCTION ---
// Set up the game world, objects, and inputs



function create() {
    // Reset score on game start/restart
    score = 0;

    // 1. Add Parallax Backgrounds
    // Get image dimensions to position them correctly
    const bg1Height = this.textures.get('bg1').getSourceImage().height || 600;
    const bg2Height = this.textures.get('bg2').getSourceImage().height || 600;
    const fgHeight = this.textures.get('brickpath').getSourceImage().height || 50;

    // BG1: Scale to fit height, anchor to bottom
    const bgScale = 600 / bg1Height;
    bg1 = this.add.tileSprite(0, 600, 800, 600, 'bg1').setOrigin(0, 1);
    bg1.setTileScale(bgScale);
    
    // BG2: Use actual image height, anchor to bottom so it sits on the ground
    bg2 = this.add.tileSprite(0, 600, 800, bg2Height, 'bg2').setOrigin(0, 1);

    // FG: Brick path at the bottom, overlapping bg2
    fg = this.add.tileSprite(0, 600, 800, fgHeight, 'brickpath').setOrigin(0, 1);
    
    // Fix backgrounds to the camera so they don't scroll away; we will scroll their texture instead
    bg1.setScrollFactor(0);
    bg2.setScrollFactor(0);
    fg.setScrollFactor(0);

    // Dynamically create a small brown texture for debris particles, so we don't need another image file
    const graphics = this.make.graphics();
    graphics.fillStyle(0x8B4513, 1); // Brown color
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture('debris', 8, 8);
    graphics.destroy();

    // Create a single, reusable particle emitter. This is the most performant way.
    // We will move this emitter to the block's position and tell it to explode
    debrisEmitter = this.add.particles(0, 0, 'debris', {
        speed: { min: 50, max: 200 },
        angle: { min: 45, max: 135 },
        scale: { start: 1, end: 0 },
        lifespan: 800,
        gravityY: 300,
        emitting: false // IMPORTANT: Start the emitter turned off
    });

    // 2. Create Animations
    this.anims.create({
        key: 'run',
        frames: [
            { key: 'totoro2' },
            { key: 'totoro3' },
            { key: 'totoro4' }
        ],
        frameRate: 10,
        repeat: -1 // Loop forever
    });

    this.anims.create({
        key: 'idle',
        frames: [ { key: 'totoro1' } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'mikeWalk',
        frames: [
            { key: 'mike1' },
            { key: 'mike2' },
            { key: 'mike3' },
            { key: 'mike2' }
        ],
        frameRate: 4, // Slow walk
        repeat: -1
    });

    // 3. Create Player (Totoro)
    player = this.physics.add.sprite(100, 455, 'totoro1');
    player.setBounce(0.1); // Slight bounce when hitting ground
    player.setCollideWorldBounds(true); // Keep inside the world

    // Adjust the physics body to be smaller and lower, to match the visual feet.
    // This prevents the "hovering" look.
    // setSize(width, height) and setOffset(x_from_left, y_from_top)
    player.body.setSize(50, 60).setOffset(7, 20);
    
    // 4. Camera Setup
    // Camera follows the player
    // Set bounds to 3000px (approx 3.75 screens) to allow walking
    this.physics.world.setBounds(0, 0, 3000, 600);
    this.cameras.main.setBounds(0, 0, 3000, 600);
    this.cameras.main.startFollow(player);

    // 5. Inputs
    cursors = this.input.keyboard.createCursorKeys();
    this.input.addPointer(3); // Enable multi-touch support (e.g. run + jump)
    
    // 6. Create Groups for Objects
    platforms = this.physics.add.staticGroup(); // Static objects don't move
    floors = this.physics.add.staticGroup(); // Group for the ground floor
    wordBlocks = this.physics.add.staticGroup();
    textGroup = this.add.group(); // Group for text labels
    enemies = this.physics.add.group(); // Group for bad guys
    sootCoins = this.physics.add.group({
        dragX: 100, // Friction so they stop rolling eventually
        bounceX: 0.5, // Bounciness
        bounceY: 0.4
    });

    // 7. Collisions
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, floors);
    // When player hits a block, call the 'hitBlock' function
    this.physics.add.collider(player, wordBlocks, hitBlock, null, this);
    this.physics.add.collider(enemies, floors);
    this.physics.add.collider(player, enemies, hitEnemy, null, this);
    this.physics.add.collider(sootCoins, platforms);
    this.physics.add.collider(sootCoins, floors);
    this.physics.add.overlap(player, sootCoins, collectCoin, null, this);

    // 8. UI Text
    levelText = this.add.text(16, 16, 'Level: 1', { fontSize: '32px', fill: '#000' });
    levelText.setScrollFactor(0); // Keep text fixed on screen

    scoreText = this.add.text(config.width - 16, 16, 'Coins: 0', { 
        fontSize: '32px', 
        fill: '#FFD700', 
        stroke: '#000', 
        strokeThickness: 4 
    });
    scoreText.setOrigin(1, 0); // Align right
    scoreText.setScrollFactor(0);

    // 9. Start the first level
    // 9. On-Screen Controls
    // Create textures for controls dynamically to avoid loading more images
    const controlGraphics = this.make.graphics();
    // Arrow Button Texture
    controlGraphics.fillStyle(0x000000, 0.3); // Black, 30% transparent
    controlGraphics.fillTriangle(0, 25, 50, 0, 50, 50);
    controlGraphics.generateTexture('arrowBtn', 50, 50);
    
    // Clear the graphics object before drawing the next shape
    controlGraphics.clear();

    // Jump Button Texture
    controlGraphics.fillStyle(0x000000, 0.3);
    controlGraphics.fillCircle(35, 35, 35);
    controlGraphics.generateTexture('jumpBtn', 70, 70);
    controlGraphics.destroy();

    // Add button sprites to the screen
    const jumpButton = this.add.sprite(config.width - 220, config.height - 70, 'jumpBtn').setInteractive().setScrollFactor(0);
    const leftButton = this.add.sprite(config.width - 140, config.height - 70, 'arrowBtn').setInteractive().setScrollFactor(0);
    const rightButton = this.add.sprite(config.width - 60, config.height - 70, 'arrowBtn').setInteractive().setScrollFactor(0);
    
    rightButton.flipX = true; // Flip the right arrow to point right

    // Input events for Left Button
    leftButton.on('pointerdown', () => { leftButtonPressed = true; });
    leftButton.on('pointerup', () => { leftButtonPressed = false; });
    leftButton.on('pointerout', () => { leftButtonPressed = false; }); // Stop if pointer leaves button

    // Input events for Right Button
    rightButton.on('pointerdown', () => { rightButtonPressed = true; });
    rightButton.on('pointerup', () => { rightButtonPressed = false; });
    rightButton.on('pointerout', () => { rightButtonPressed = false; }); // Stop if pointer leaves button

    // Input event for Jump Button
    jumpButton.on('pointerdown', () => {
        if (player.body.touching.down || player.body.blocked.down) {
            player.setVelocityY(-440);
        }
    });

    // 10. Start the first level
    spawnLevel.call(this, 0);
}

// --- UPDATE FUNCTION ---
// Runs roughly 60 times per second to handle movement and logic
function update() {
    // 1. Parallax Scrolling
    // Move background texture based on camera position to create depth
    bg1.tilePositionX = this.cameras.main.scrollX * 0.3;
    bg2.tilePositionX = this.cameras.main.scrollX * 0.7;
    fg.tilePositionX = this.cameras.main.scrollX;

    // 2. Player Movement (Keyboard)
    if (cursors.left.isDown || leftButtonPressed) {
        player.setVelocityX(-160);
        player.anims.play('run', true);
        player.setFlipX(true); // Flip sprite to face left
    } else if (cursors.right.isDown || rightButtonPressed) {
        player.setVelocityX(160);
        player.anims.play('run', true);
        player.setFlipX(false); // Default face right
    } else {
        player.setVelocityX(0);
        player.anims.play('idle');
    }

    // 3. Jump (Spacebar)
    if (cursors.space.isDown && (player.body.touching.down || player.body.blocked.down)) {
        player.setVelocityY(-440);
        // try { this.sound.play('jumpSound'); } catch (e) {}
    }

    // Mouse facing logic removed as requested

    // 4. Enemy Movement (Patrol and Respawn)
    const allMikes = enemies.getChildren();
    enemies.children.iterate((mike) => {
        // PRIORITY 1: Check if Mike needs to be respawned.
        // A buffer of 100px ensures he is fully off-screen to the left.
        if (mike.x < this.cameras.main.scrollX - 100) {
            // He's left behind! Respawn him ahead of the player, just off-screen to the right.
            // We're interpreting "ahead by 1 second" as a gameplay-friendly distance ahead.
            let respawnX = this.cameras.main.scrollX + config.width + 100;

            // Ensure we don't place him too close to another Mike
            let safe = false;
            let attempts = 0;
            while (!safe && attempts < 50) {
                safe = true;
                attempts++;
                for (let otherMike of allMikes) {
                    if (mike !== otherMike && Math.abs(otherMike.x - respawnX) < 400) {
                        respawnX += 150; // Push further ahead if too close
                        safe = false;
                        break;
                    }
                }
            }
            
            mike.x = respawnX;
            
            // We must also update his patrol start point, otherwise he might turn around immediately.
            mike.startX = mike.x;

            // Ensure he is moving left towards the player.
            mike.setVelocityX(-30);
            mike.setFlipX(true);
        } else {
            // PRIORITY 2: If not respawning, do normal patrol logic.
            if (mike.body.velocity.x < 0 && mike.x < mike.startX - 200) {
                mike.setVelocityX(30);
                mike.setFlipX(false); // Face right
            } else if (mike.body.velocity.x > 0 && mike.x > mike.startX + 200) {
                mike.setVelocityX(-30);
                mike.setFlipX(true); // Face left
            }
        }
    });

    // 5. Sootcoin Flee Logic
    sootCoins.children.iterate((coin) => {
        if (coin && coin.body) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, coin.x, coin.y);
            // If player is close (within 200px), roll away!
            if (dist < 200) {
                if (player.x < coin.x) {
                    coin.setVelocityX(75); // Roll right
                } else {
                    coin.setVelocityX(-75); // Roll left
                }
            }

            // Rotate based on velocity to look like rolling
            coin.rotation += coin.body.velocity.x * 0.0035; // Decrease rotation speed by 30%
        }
    });
}

// --- CUSTOM FUNCTIONS ---

// Function to spawn a new level segment
function spawnLevel(index) {
    currentLevel = index;
    levelText.setText('Level: ' + (currentLevel + 1));

    // Calculate the starting X position for this level
    // Each level is 3000px wide. Level 0 starts at 0, Level 1 at 3000, etc.
    const startX = currentLevel * 2400; // Increased distance between levels

    // Expand the world and camera bounds to include the new level area
    const newMaxX = startX + 2400;
    this.physics.world.setBounds(0, 0, newMaxX, 600);
    this.cameras.main.setBounds(0, 0, newMaxX, 600);

    // Add a new floor segment for this level
    // Get height of brickpath to align floor collision exactly with the visual
    const fgHeight = this.textures.get('brickpath').getSourceImage().height || 50;
    // Position floor so it matches the brickpath height at the bottom of the screen
    let floor = this.add.rectangle(startX + 1500, 600 - (fgHeight / 2), 3000, fgHeight, 0x2E8B57);
    floor.setVisible(false);
    this.physics.add.existing(floor, true);
    floors.add(floor);

    // --- JUMP OVER MIKE PLATFORMS ---
    // 3 short platforms in random order to help jump over Mike
    let jumpX = startX + 250;
    for (let i = 0; i < 3; i++) {
        let jumpY;
        if (i === 0) {
            // First platform low enough to jump on (ground is ~575)
            jumpY = Phaser.Math.Between(450, 480);
        } else {
            // Others random, can be higher or lower
            jumpY = Phaser.Math.Between(350, 480);
        }
        
        // Create short platform from image
        let p = platforms.create(jumpX, jumpY, 'platform');
        p.setDisplaySize(120, 40); // Set size
        p.refreshBody(); // IMPORTANT: Update physics body after resize

        // One-way collision: Only collide from top
        p.body.checkCollision.down = false;
        p.body.checkCollision.left = false;
        p.body.checkCollision.right = false;

        // Chance to spawn a Sootcoin on the platform (80% chance)
        if (Phaser.Math.Between(0, 100) < 80) {
            let coin = sootCoins.create(jumpX, jumpY - 50, 'sootcoin');
            coin.setScale(0.7);
        }

        // Stagger X position
        jumpX += Phaser.Math.Between(120, 160);
    }

    // --- PLATFORM GENERATION ---
    // Determine number of platforms based on level (Level 1 = 0, Level 2 = 1, etc.)
    // We cap at 4 platforms to ensure they fit comfortably on the screen.
    const numPlatforms = Math.min(currentLevel, 4);

    // Default positions for blocks (used for Level 1 when there are no platforms)
    let blockY = 350; 
    let blockXBase = startX + 1800;

    if (numPlatforms > 0) {
        let platX = startX + 1000; // Start placing platforms here
        let platY = 500;           // Start height (100px above ground)

        for (let i = 0; i < numPlatforms; i++) {
            // Determine if this is the final platform
            const isFinalPlatform = (i === numPlatforms - 1);
            
            // Final platform is wider (600px) to span all 3 blocks, others are 200px
            const platWidth = isFinalPlatform ? 600 : 200;
            
            // Shift the final platform to the right so it centers under the blocks
            // Normal platforms are centered at platX. Final is centered at platX + 200.
            const currentPlatX = isFinalPlatform ? platX + 200 : platX;

            // Create a platform from an image
            let platform = platforms.create(currentPlatX, platY, 'platform');
            platform.setDisplaySize(platWidth, 40);
            platform.refreshBody(); // Refresh physics body after resize

            // One-way collision: Only collide from top
            platform.body.checkCollision.down = false;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;

            // Chance to spawn a Sootcoin on the platform (80% chance)
            if (Phaser.Math.Between(0, 100) < 80) {
                let coin = sootCoins.create(currentPlatX, platY - 50, 'sootcoin');
                coin.setScale(0.7);
            }

            // If this is the highest platform in the sequence, place the word blocks above it
            if (isFinalPlatform) {
                blockY = platY - 220; // Place blocks higher up (was 150)
                blockXBase = platX;   // Align blocks horizontally with this platform
            }

            // Calculate position for the next platform (step up and to the right)
            platX += 250; 
            platY -= 90;
        }
    }

    // --- SPAWN GROUND COINS ---
    // Only place coins on the ground in the "empty space" between levels (start of segment)
    for (let i = 0; i < 3; i++) {
        let cx = startX + 400 + (i * 150); // Move coins further away from start
        let coin = sootCoins.create(cx, 450, 'sootcoin'); // Spawn in air to fall
        coin.setScale(0.7);
    }

    // --- SPAWN MIKE (BAD GUY) ---
    // Place him on the ground, a bit ahead of the player
    // Adjust Y to ensure he sits on the floor (floor is at 600 - fgHeight/2)
    // Let's put him at y=500 and let gravity settle him, or calculate exact.
    
    // Determine number of Mikes based on level
    let numMikes = 1;
    if (currentLevel >= 4) numMikes = 2; // Level 5+ (Index 4 is Level 5)
    if (currentLevel >= 7) numMikes = 3; // Level 8+ (Index 7 is Level 8)

    for (let i = 0; i < numMikes; i++) {
        // Space them out so they aren't on top of each other
        let mikeX = startX + 600 + (i * 400);

        let mike = enemies.create(mikeX, 500, 'mike1');
        mike.setScale(0.64); // Decrease size by 20% (0.8 * 0.8 = 0.64)
        mike.setCollideWorldBounds(true);
        mike.startX = mikeX; // Remember starting spot for patrol
        mike.setVelocityX(-30); // Start walking left
        mike.setFlipX(true);
        mike.anims.play('mikeWalk');
    }

    // Get data for the current level (loop back to 0 if we pass level 10)
    const data = levels[currentLevel % levels.length];

    // Speak the target word
    // Delay slightly to prevent hang during level generation
    this.time.delayedCall(100, () => {
        speak(data.target);
    });

    // Create 3 blocks
    // Position blocks relative to the calculated base (either ground or top platform)
    const positions = [blockXBase, blockXBase + 200, blockXBase + 400];
    
    for (let i = 0; i < 3; i++) {
        let x = positions[i];
        let y = blockY; // Use the calculated height

        let block = wordBlocks.create(x, y, 'wordblock');
        block.word = data.options[i]; // Store the word inside the block object

        // Add text on top of the block
        let text = this.add.text(x, y, data.options[i], { 
            fontSize: '24px', 
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5); // Center text
        textGroup.add(text);

        // Link the block to its text object so we can hide/show it during the smash animation
        block.textObject = text;
    }
}

// Function called when player touches a block
function hitBlock(player, block) {
    // Only trigger if player hits the BOTTOM of the block (jumping up)
    if (player.body.touching.up && block.body.touching.down) {
        
        // try { this.sound.play('hitSound'); } catch (e) {}

        const data = levels[currentLevel % levels.length];
        
        if (block.word === data.target) {
            // CORRECT!
            block.setTint(0x00ff00); // Tint Green
            block.body.enable = false;  // Disable block so it can't be hit again
            speak("Level Complete");
            
            // Generate the next level immediately so player can walk to it
            spawnLevel.call(this, currentLevel + 1);
            
        } else {
            // INCORRECT!
            // Disable the block so it can't be hit again immediately
            block.body.enable = false;
            // Hide the text that is on the block
            if (block.textObject) {
                block.textObject.setVisible(false);
            }
            
            // Change texture to the smashed version
            block.setTexture('wordblocksmash');

            // Use our single, pre-made emitter to create a burst of particles.
            // This is very fast and avoids creating new objects during gameplay.
            debrisEmitter.explode(15, block.x, block.y);

            // After 2 seconds, fade out and destroy the smashed block
            this.time.delayedCall(2000, () => {
                // Create a tween to fade the smashed block out
                this.tweens.add({
                    targets: block,
                    alpha: 0,
                    duration: 500, // 0.5 second fade-out time
                    onComplete: () => {
                        // Destroy the block and its text object to clean up
                        if (block.textObject) {
                            block.textObject.destroy();
                        }
                        block.destroy();
                    }
                });
            });
        }
    }
}

// Function called when player touches Mike
function hitEnemy(player, enemy) {
    this.physics.pause(); // Stop the game
    player.setTint(0xff0000); // Turn red
    player.anims.play('idle');
    
    // Restart game after 1 second
    this.time.delayedCall(1000, () => {
        currentLevel = 0;
        this.scene.restart();
    });
}

// Function called when player collects a coin
function collectCoin(player, coin) {
    coin.destroy();
    playCoinSound();
    score += 1;
    scoreText.setText('Coins: ' + score);
}

// Function to use browser Text-to-Speech
function speak(text) {
    // Check if browser supports speech
    if ('speechSynthesis' in window) {
        // Cancel any current speech so they don't overlap
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

// Function to generate a coin sound using the Web Audio API (no file needed)
function playCoinSound() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}