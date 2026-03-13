// --- CONSTANTS ---
const PHYSICS = {
    GRAVITY: 600,
};

const PLAYER = {
    MOVE_VELOCITY: 160,
    JUMP_VELOCITY: -440,
    BOUNCE: 0.1,
    BODY_SIZE: { x: 50, y: 60 },
    BODY_OFFSET: { x: 7, y: 20 },
    SMASH_VERTICAL_RANGE: 60,
    SMASH_REACH_BONUS: 15,
};

const ENEMY = {
    PATROL_SPEED: 30,
    PATROL_DISTANCE: 200,
    RESPAWN_X_OFFSET: 100,
    MIN_SPAWN_DISTANCE: 400,
    RESPAWN_ADJUST: 150,
};

const COIN = {
    FLEE_DISTANCE: 200,
    FLEE_SPEED: 75,
    SCALE: 0.7,
    SPAWN_CHANCE: 80, // out of 100
};

const LEVEL = {
    WIDTH: 2400,
};

const HOWLS = {
    SPEED_X: 38,           // horizontal travel speed (px/sec, screen-space)
    SPEED_Y: 8,            // max depth travel speed (px/sec) — modulated by depth
    MIN_SCALE: 0.12,       // tiny when far away (high up)
    MAX_SCALE: 2.2,        // huge when close (low)
    MIN_Y: 384,            // ceiling = 216px from base of bg1 (600 - 216)
    MAX_Y: 520,            // near ground
    FRAME_RATE: 3,         // animation cycle speed
    DIR_CHANGE_MIN: 3000,
    DIR_CHANGE_MAX: 8000,
    WANDER_X: 700,         // how far off either screen edge Howl can wander
    PARALLAX_X: 0.45,      // fraction of camera scroll that drifts Howl left — at player speed (160px/s),
                           // this creates ~72px/s leftward drift that Howl's own speed (38px/s) can't fully fight,
                           // so running right slowly pushes him off, running left or standing still lets him return
};

const UI = {
    ROUND_PREFIX: 'Round: ',
    SCORE_PREFIX: 'Soot Sprites: '
};

// --- CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 1152,
    height: 600,
    backgroundColor: '#87CEEB', // pale blue — visible above bg1 when camera scrolls up
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: PHYSICS.GRAVITY },
            debug: false
        }
    },
    parent: 'gameContainer',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// --- GLOBAL VARIABLES ---
let player;
let cursors;
let platforms;
let floors;
let wordBlocks;
let textGroup;
let bg1, bg2, fg;
let debrisEmitter;
let currentRound = 0;
let roundText;
let enemies;
let sootCoins;
let score = 0;
let scoreText;
let audioCtx;
let audioTriggerX = 0;
let wordSpoken = true;
let flowerEmitter;
let sparkleEmitter;
let ctrlKey;
let isSmashing = false;
let isDead = false;
let backgroundMusic;
let activeRounds;
let roundObjectsMap = {};
let lives = 0;
let lifeIcons = [];
let isInvincible = false;
let coinsForLife = 0;
let sceneRef = null;
let currentGameLevel = 1;
let mikesDefeated = 0;
let endBlock = null;
let endBlockLabel = null;
let worldTopExtent = 800;
let activeCastle = null;
let pendingCastleStartX = null;
let howlsCastle = null;
let howlsVelX = 0;
let howlsVelY = 0;
let howlsFrame = 0;
let howlsFrameTimer = 0;
let howlsDirTimer = 0;
let howlsOffScreenTimer = 0;
const skyCastleParallaxX = 0.34;
const skyCastleParallaxY = 1;
const skyCastleBaseXInLevel = 900;
const skyCastleBaseY = -220;

// --- ROUND DATA ---
const rounds = [
    { target: "CAT", options: ["BAT", "CAT", "RAT"] },
    { target: "DOG", options: ["DOG", "LOG", "FOG"] },
    { target: "SUN", options: ["RUN", "SUN", "FUN"] },
    { target: "RED", options: ["BED", "RED", "FED"] },
    { target: "ONE", options: ["WUM", "TON", "ONE"] },
    { target: "BIG", options: ["RIG", "BIG", "DIG"] },
    { target: "HOP", options: ["MOP", "TOP", "HOP"] },
    { target: "SKY", options: ["SKY", "FLY", "DRY"] },
    { target: "FOX", options: ["BOX", "FOX", "POX"] },
    { target: "JAM", options: ["HAM", "JAM", "DAM"] }
];

const level2Rounds = [
    { target: "THIS", options: ["THAT", "THIS", "THE"], soundKey: "tw_this" },
    { target: "THAT", options: ["THIS", "THAT", "THE"], soundKey: "tw_that" },
    { target: "THE", options: ["THIS", "THE", "THAT"], soundKey: "tw_the" },
    { target: "LOOK", options: ["BOOK", "LOOK", "TOOK"], soundKey: "tw_look" },
    { target: "SAID", options: ["SAID", "SED", "SAD"], soundKey: "tw_said" },
    { target: "YOU", options: ["YUE", "YOU", "UYE"], soundKey: "tw_you" },
    { target: "OF", options: ["UV", "OF", "UF"], soundKey: "tw_of" },
    { target: "DO", options: ["DO", "DU", "BO"], soundKey: "tw_do" },
    { target: "FROM", options: ["FROM", "FRUM", "FUM"], soundKey: "tw_from" },
    { target: "ARE", options: ["AR", "ARE", "OR"], soundKey: "tw_are" }
];

// --- PRELOAD FUNCTION ---
function preload() {
    this.load.image('bg1', 'assets/background1.png');
    this.load.image('bg2', 'assets/background2.png');
    this.load.image('l2bg1', 'assets/l2background1.png');
    this.load.image('l2bg2', 'assets/l2background2.png');
    this.load.image('howls1', 'assets/howls1.png');
    this.load.image('howls2', 'assets/howls2.png');
    this.load.image('howls3', 'assets/howls3.png');
    this.load.image('brickpath', 'assets/brickpath.png');
    this.load.image('bubbleblock1', 'assets/bubbleblock1.png');
    this.load.image('bubbleblock2', 'assets/bubbleblock2.png');
    this.load.image('bubbleblock3', 'assets/bubbleblock3.png');
    this.load.image('bubbleblock4', 'assets/bubbleblock4.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('skycastle', 'assets/skycastle.png');

    this.load.image('totoro1', 'assets/totoro1.png');
    this.load.image('totoro2', 'assets/totoro2.png');
    this.load.image('totoro3', 'assets/totoro3.png');
    this.load.image('totoro4', 'assets/totoro4.png');
    this.load.image('totorosmash1', 'assets/totorosmash1.png');
    this.load.image('totorosmash2', 'assets/totorosmash2.png');

    this.load.image('mike1', 'assets/mike1.png');
    this.load.image('mike2', 'assets/mike2.png');
    this.load.image('mike3', 'assets/mike3.png');
    this.load.image('sootcoin', 'assets/sootcoin.png');

    this.load.audio('backgroundMusic', 'assets/backgroundmusic.mp3');
    this.load.audio('l2backgroundMusic', 'assets/l2backgroundmusic.mp3');

    this.load.audio('tw_this', 'assets/tw_this.mp3');
    this.load.audio('tw_that', 'assets/tw_that.mp3');
    this.load.audio('tw_the', 'assets/tw_the.mp3');
    this.load.audio('tw_look', 'assets/tw_look.mp3');
    this.load.audio('tw_said', 'assets/tw_said.mp3');
    this.load.audio('tw_you', 'assets/tw_you.mp3');
    this.load.audio('tw_of', 'assets/tw_of.mp3');
    this.load.audio('tw_do', 'assets/tw_do.mp3');
    this.load.audio('tw_from', 'assets/tw_from.mp3');
    this.load.audio('tw_are', 'assets/tw_are.mp3');

    this.load.audio('cat', 'assets/cat.wav');
    this.load.audio('big', 'assets/big.wav');
    this.load.audio('dog', 'assets/dog.wav');
    this.load.audio('fox', 'assets/fox.wav');
    this.load.audio('hop', 'assets/hop.wav');
    this.load.audio('jam', 'assets/jam.wav');
    this.load.audio('one', 'assets/one.wav');
    this.load.audio('red', 'assets/red.wav');
    this.load.audio('sky', 'assets/sky.wav');
    this.load.audio('sun', 'assets/sun.wav');
}

// --- CREATE FUNCTION ---
function create() {
    score = 0;
    isSmashing = false;
    isDead = false;
    roundObjectsMap = {};
    activeCastle = null;
    pendingCastleStartX = null;
    lives = 0;
    lifeIcons = [];
    isInvincible = false;
    coinsForLife = 0;
    sceneRef = this;

    window.leftButtonPressed = false;
    window.rightButtonPressed = false;
    window.smashButtonPressed = false;

    window.triggerJump = () => {
        if (player && (player.body.touching.down || player.body.blocked.down)) {
            player.setVelocityY(PLAYER.JUMP_VELOCITY);
            playJumpSound();
        }
    };

    // Shuffle a copy so the original array is never mutated
    activeRounds = Phaser.Utils.Array.Shuffle([...(currentGameLevel === 2 ? level2Rounds : rounds)]);

    // 1. Add Parallax Backgrounds
    const bg1Key = currentGameLevel === 1 ? 'bg1' : 'l2bg1';
    const bg2Key = currentGameLevel === 1 ? 'bg2' : 'l2bg2';

    const bg1Source = this.textures.get(bg1Key).getSourceImage();
    const bg1Width = bg1Source.width || config.width;
    const bg1Height = bg1Source.height || config.height;
    const bg2Height = this.textures.get(bg2Key).getSourceImage().height || 600;
    const fgHeight = this.textures.get('brickpath').getSourceImage().height || 50;

    // bg1 (sky): use a single vertically non-repeating slice by matching tileSprite height
    // to exactly one scaled texture height, then bottom-align it to ground level.
    // Keep horizontal tiling for long side-scrolling rounds.
    const bgScale = config.width / bg1Width;
    const bg1ScaledHeight = bg1Height * bgScale;
    bg1 = this.add.tileSprite(0, config.height, 30000, bg1ScaledHeight, bg1Key).setOrigin(0, 1);
    bg1.setTileScale(bgScale);
    bg1.setScrollFactor(0.3, 1);
    bg1.setDepth(-30);

    // Keep at least the original 800px jump space, but expand if bg1 has more headroom.
    worldTopExtent = Math.max(1200, Math.floor(bg1ScaledHeight - config.height));

    // bg2 (terrain silhouette): world-space, anchored to the bottom of the game area.
    // Scrolls off the bottom of the screen as the camera moves up.
    bg2 = this.add.tileSprite(0, config.height, 30000, bg2Height, bg2Key).setOrigin(0, 1);
    bg2.setScrollFactor(0.7, 1);
    bg2.setDepth(-10);

    // fg (brickpath): world-space at ground level. Naturally scrolls off the bottom
    // of the screen when the camera moves up to show higher platforms.
    fg = this.add.tileSprite(0, config.height - fgHeight / 2, 30000, fgHeight, 'brickpath').setOrigin(0, 0.5);
    fg.setDepth(-5);

    // Howl's Moving Castle — level 2 only
    howlsCastle = null;
    howlsFrame = 0;
    howlsFrameTimer = 0;
    howlsOffScreenTimer = 0;
    if (currentGameLevel === 2) {
        spawnHowlsCastle(this);
    }

    // Play Background Music
    const musicKey = currentGameLevel === 2 ? 'l2backgroundMusic' : 'backgroundMusic';
    backgroundMusic = this.sound.add(musicKey, { loop: true, volume: 0.5 });
    backgroundMusic.play();
    window.backgroundMusic = backgroundMusic;

    // Dynamically generate particle textures
    const graphics = this.make.graphics();
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture('debris', 8, 8);
    graphics.destroy();

    debrisEmitter = this.add.particles(0, 0, 'debris', {
        speed: { min: 50, max: 200 },
        angle: { min: 45, max: 135 },
        scale: { start: 1, end: 0 },
        lifespan: 800,
        gravityY: 300,
        emitting: false
    });

    const flowerGraphics = this.make.graphics();
    flowerGraphics.fillStyle(0xFF69B4, 1);
    flowerGraphics.fillCircle(5, 5, 5);
    flowerGraphics.fillStyle(0xFFFF00, 1);
    flowerGraphics.fillCircle(5, 5, 2);
    flowerGraphics.generateTexture('flower', 10, 10);
    flowerGraphics.destroy();

    flowerEmitter = this.add.particles(0, 0, 'flower', {
        speed: { min: 50, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        gravityY: 200,
        emitting: false
    });

    const sparkleGraphics = this.make.graphics();
    sparkleGraphics.fillStyle(0xFFFFE0, 1);
    sparkleGraphics.fillRect(0, 0, 6, 6);
    sparkleGraphics.generateTexture('sparkle', 6, 6);
    sparkleGraphics.destroy();

    sparkleEmitter = this.add.particles(0, 0, 'sparkle', {
        speed: { min: 100, max: 250 },
        scale: { start: 1, end: 0 },
        lifespan: 300,
        blendMode: 'ADD',
        emitting: false
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
        repeat: -1
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
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'smash',
        frames: [
            { key: 'totorosmash1' },
            { key: 'totorosmash2' },
            { key: 'totorosmash1' }
        ],
        frameRate: 10,
        repeat: 0
    });

    // 3. Create Player (Totoro)
    player = this.physics.add.sprite(100, 455, 'totoro1');
    player.setBounce(PLAYER.BOUNCE);
    player.setCollideWorldBounds(true);
    player.body.setSize(PLAYER.BODY_SIZE.x, PLAYER.BODY_SIZE.y).setOffset(PLAYER.BODY_OFFSET.x, PLAYER.BODY_OFFSET.y);

    // 4. Camera & World Setup
    // Y bounds extend above y=0 to allow high jumps/platforms.
    // Max scrollY is clamped to 0, so during normal gameplay the camera follows upward
    // into negative Y, then back down to ground level.
    // spawnRound expands the X bounds as new rounds are added.
    this.physics.world.setBounds(0, -worldTopExtent, 3000, config.height + worldTopExtent);
    this.cameras.main.setBounds(0, -worldTopExtent, 3000, config.height + worldTopExtent);
    this.cameras.main.startFollow(player, true, 0.5, 0.5);

    // 5. Inputs
    cursors = this.input.keyboard.createCursorKeys();
    ctrlKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.input.addPointer(3);

    // 6. Create Groups
    platforms = this.physics.add.staticGroup();
    floors = this.physics.add.staticGroup();
    wordBlocks = this.physics.add.staticGroup();
    textGroup = this.add.group();
    enemies = this.physics.add.group();
    sootCoins = this.physics.add.group({
        dragX: 100,
        bounceX: 0.5,
        bounceY: 0.4
    });

    // 7. Collisions
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, floors);
    this.physics.add.collider(player, wordBlocks, hitBlock, null, this);
    this.physics.add.collider(enemies, floors);
    this.physics.add.collider(player, enemies, hitEnemy, null, this);
    this.physics.add.collider(sootCoins, platforms);
    this.physics.add.collider(sootCoins, floors);
    this.physics.add.overlap(player, sootCoins, collectCoin, null, this);

    // 8. UI Text
    roundText = this.add.text(16, 16, UI.ROUND_PREFIX + (currentRound + 1), { fontSize: '32px', fill: '#000' });
    roundText.setScrollFactor(0);

    scoreText = this.add.text(config.width - 16, 16, UI.SCORE_PREFIX + score, {
        fontSize: '32px',
        fill: '#FFD700',
        stroke: '#000',
        strokeThickness: 4,
        fontFamily: 'Arial'
    });
    scoreText.setOrigin(1, 0);
    scoreText.setScrollFactor(0);

    // 9. Start the first round
    spawnRound.call(this, 0);
}


// --- UPDATE FUNCTION ---

function update() {
    if (isDead) return;

    // Parallax is handled automatically by setScrollFactor on each world-space tileSprite.
    // No manual tilePosition updates needed.
    updateCastleLifecycle.call(this);
    if (currentGameLevel === 2) updateHowlsCastle.call(this);

    // 2. Smash Attack
    if ((ctrlKey.isDown || window.smashButtonPressed) && !isSmashing) {
        isSmashing = true;
        player.setVelocityX(0);

        const totoroWidth = this.textures.get('totoro1').getSourceImage().width || 64;
        const smashWidth = this.textures.get('totorosmash1').getSourceImage().width || 100;

        let newOriginX;
        if (player.flipX) {
            newOriginX = (smashWidth - (totoroWidth / 2)) / smashWidth;
        } else {
            newOriginX = (totoroWidth / 2) / smashWidth;
        }
        player.setOrigin(newOriginX, 0.5);
        player.anims.play('smash');

        if (window.smashButtonPressed) window.smashButtonPressed = false;

        player.once('animationcomplete-smash', () => {
            isSmashing = false;
            player.setOrigin(0.5, 0.5);
        });
    }

    if (isSmashing) {
        // Smash hit detection
        const totoroWidth = this.textures.get('totoro1').getSourceImage().width || 64;
        const smashWidth = this.textures.get('totorosmash1').getSourceImage().width || 105;
        const reach = smashWidth - totoroWidth; // How much further the bag sprite reaches
        const hitRange = (totoroWidth / 2) + reach + PLAYER.SMASH_REACH_BONUS;

        const mikes = enemies.getChildren();
        for (let i = 0; i < mikes.length; i++) {
            const mike = mikes[i];
            if (!mike || !mike.active) continue;
            if (Math.abs(mike.y - player.y) < PLAYER.SMASH_VERTICAL_RANGE) {
                const dist = mike.x - player.x;
                if (!player.flipX) {
                    if (dist > 0 && dist < hitRange) {
                        const mx = mike.x, my = mike.y;
                        mike.destroy();
                        mikesDefeated++;
                        playSmashHitSound();
                        debrisEmitter.explode(30, mx, my);
                        sparkleEmitter.explode(15, player.x + hitRange, player.y);
                    }
                } else {
                    if (dist < 0 && dist > -(hitRange + 10)) {
                        const mx = mike.x, my = mike.y;
                        mike.destroy();
                        mikesDefeated++;
                        playSmashHitSound();
                        debrisEmitter.explode(30, mx, my);
                        sparkleEmitter.explode(15, player.x - hitRange, player.y);
                    }
                }
            }
        }
    } else {
        // 3. Player Movement — only when not smashing

        if (cursors.left.isDown || window.leftButtonPressed) {
            player.setVelocityX(-PLAYER.MOVE_VELOCITY);
            player.anims.play('run', true);
            player.setFlipX(true);
        } else if (cursors.right.isDown || window.rightButtonPressed) {
            player.setVelocityX(PLAYER.MOVE_VELOCITY);
            player.anims.play('run', true);
            player.setFlipX(false);
        } else {
            player.setVelocityX(0);
            player.anims.play('idle');
        }

        // 4. Jump
        if (cursors.space.isDown && (player.body.touching.down || player.body.blocked.down)) {

            player.setVelocityY(PLAYER.JUMP_VELOCITY);
            playJumpSound();
        }
    }

    // 5. Enemy Movement (Patrol and Respawn)
    const allMikes = enemies.getChildren();
    for (let i = 0; i < allMikes.length; i++) {
        const mike = allMikes[i];
        if (!mike || !mike.active) continue;

        if (mike.x < this.cameras.main.scrollX - ENEMY.RESPAWN_X_OFFSET) {
            let respawnX = this.cameras.main.scrollX + config.width + ENEMY.RESPAWN_X_OFFSET;

            let safe = false;
            let attempts = 0;
            while (!safe && attempts < 50) {
                safe = true;
                attempts++;
                for (let otherMike of allMikes) {
                    if (mike !== otherMike && Math.abs(otherMike.x - respawnX) < ENEMY.MIN_SPAWN_DISTANCE) {
                        respawnX += ENEMY.RESPAWN_ADJUST;
                        safe = false;
                        break;
                    }
                }
            }

            mike.x = respawnX;
            mike.startX = mike.x;
            mike.setVelocityX(-ENEMY.PATROL_SPEED);
            mike.setFlipX(true);
        } else {
            if (mike.body && mike.body.velocity.x < 0 && mike.x < mike.startX - ENEMY.PATROL_DISTANCE) {
                mike.setVelocityX(ENEMY.PATROL_SPEED);
                mike.setFlipX(false);
            } else if (mike.body && mike.body.velocity.x > 0 && mike.x > mike.startX + ENEMY.PATROL_DISTANCE) {
                mike.setVelocityX(-ENEMY.PATROL_SPEED);
                mike.setFlipX(true);
            }
        }
    }

    // 6. Sootcoin Flee Logic
    sootCoins.children.iterate((coin) => {
        if (coin && coin.body) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, coin.x, coin.y);
            if (dist < COIN.FLEE_DISTANCE) {
                coin.setVelocityX(player.x < coin.x ? COIN.FLEE_SPEED : -COIN.FLEE_SPEED);
            }
            coin.rotation += coin.body.velocity.x * 0.0035;
        }
    });

    // 7. Audio Trigger for Target Word
    if (!wordSpoken && player.x > audioTriggerX) {
        const data = activeRounds[currentRound % activeRounds.length];
        const soundKey = data.soundKey || data.target.toLowerCase().trim();
        if (this.cache.audio.exists(soundKey)) {
            this.sound.play(soundKey);
        }
        wordSpoken = true;
    }
}

// --- CUSTOM FUNCTIONS ---

function spawnHowlsCastle(scene) {
    // Start off the right edge — parallax drift pulls him into view naturally as the player runs
    const startX = config.width + 150;
    const startY = Phaser.Math.Between(HOWLS.MIN_Y, HOWLS.MAX_Y);
    howlsCastle = scene.add.image(startX, startY, 'howls1');
    howlsCastle.setScrollFactor(0, 1); // X: screen-fixed (wandering); Y: world-space (stays down when camera pans up)
    howlsCastle.setDepth(-18);      // between bg1 (-30) and bg2 (-10)
    const t = (startY - HOWLS.MIN_Y) / (HOWLS.MAX_Y - HOWLS.MIN_Y);
    howlsCastle.setScale(Phaser.Math.Linear(HOWLS.MIN_SCALE, HOWLS.MAX_SCALE, t));
    howlsVelX = -HOWLS.SPEED_X; // walk in from the right
    howlsVelY = (Math.random() < 0.5 ? 1 : -1) * HOWLS.SPEED_Y;
    howlsDirTimer = Phaser.Math.Between(HOWLS.DIR_CHANGE_MIN, HOWLS.DIR_CHANGE_MAX);
}

function updateHowlsCastle() {
    if (!howlsCastle || !howlsCastle.active) return;

    const dt = this.sys.game.loop.delta;
    const dtSec = dt / 1000;

    // Animate frames
    howlsFrameTimer += dt;
    if (howlsFrameTimer >= 1000 / HOWLS.FRAME_RATE) {
        howlsFrameTimer -= 1000 / HOWLS.FRAME_RATE;
        howlsFrame = (howlsFrame + 1) % 3;
        howlsCastle.setTexture('howls' + (howlsFrame + 1));
    }

    // Randomly change direction
    howlsDirTimer -= dt;
    if (howlsDirTimer <= 0) {
        howlsVelX = (Math.random() < 0.5 ? 1 : -1) * HOWLS.SPEED_X;
        howlsVelY = (Math.random() < 0.5 ? 1 : -1) * HOWLS.SPEED_Y;
        howlsDirTimer = Phaser.Math.Between(HOWLS.DIR_CHANGE_MIN, HOWLS.DIR_CHANGE_MAX);
    }

    // Parallax drift — each frame, undo a fraction of the camera's scroll so Howl feels
    // like he lives in the background world rather than being glued to the screen.
    const cameraDelta = this.cameras.main.scrollX - (howlsCastle.prevScrollX ?? this.cameras.main.scrollX);
    howlsCastle.prevScrollX = this.cameras.main.scrollX;
    howlsCastle.x -= cameraDelta * HOWLS.PARALLAX_X;

    // Move — X at full speed; Y scaled by depth so going from far→close feels gradual
    howlsCastle.x += howlsVelX * dtSec;
    const depthT = Phaser.Math.Clamp((howlsCastle.y - HOWLS.MIN_Y) / (HOWLS.MAX_Y - HOWLS.MIN_Y), 0, 1);
    const depthSpeedMul = Phaser.Math.Linear(0.2, 0.75, depthT);
    howlsCastle.y += howlsVelY * depthSpeedMul * dtSec;

    // Flip to face direction of travel
    howlsCastle.setFlipX(howlsVelX < 0);

    // Bounce off wide X bounds — allows wandering off-screen and back
    const xMin = -HOWLS.WANDER_X;
    const xMax = config.width + HOWLS.WANDER_X;
    if (howlsCastle.x < xMin) {
        howlsCastle.x = xMin;
        howlsVelX = Math.abs(howlsVelX);
    } else if (howlsCastle.x > xMax) {
        howlsCastle.x = xMax;
        howlsVelX = -Math.abs(howlsVelX);
    }

    // Bounce off vertical bounds
    if (howlsCastle.y < HOWLS.MIN_Y) {
        howlsCastle.y = HOWLS.MIN_Y;
        howlsVelY = Math.abs(howlsVelY);
    } else if (howlsCastle.y > HOWLS.MAX_Y) {
        howlsCastle.y = HOWLS.MAX_Y;
        howlsVelY = -Math.abs(howlsVelY);
    }

    // Scale by Y — higher up = smaller (far away), lower = bigger (closer)
    const t = (howlsCastle.y - HOWLS.MIN_Y) / (HOWLS.MAX_Y - HOWLS.MIN_Y);
    howlsCastle.setScale(Phaser.Math.Linear(HOWLS.MIN_SCALE, HOWLS.MAX_SCALE, t));

    // Off-screen tracking — if Howl has been off screen too long, teleport him back to the edge
    const isOnScreen = howlsCastle.x > -50 && howlsCastle.x < config.width + 50;
    if (isOnScreen) {
        howlsOffScreenTimer = 0;
    } else {
        howlsOffScreenTimer += dt;
        if (howlsOffScreenTimer > 6000) {
            // Reposition off the right edge (both positions are off-screen so no pop)
            // Parallax + own velocity will carry him into view as the player keeps running
            howlsCastle.x = config.width + 150;
            howlsVelX = -HOWLS.SPEED_X;
            howlsOffScreenTimer = 0;
        }
    }
}

function getCastleWorldX(startX) {
    // For parallax layers, world X must be offset by scrollFactor to keep a stable
    // on-screen placement per round segment.
    return skyCastleBaseXInLevel + (startX * skyCastleParallaxX);
}

function spawnCastle(scene, startX) {
    const castleSource = scene.textures.get('skycastle').getSourceImage();
    const castleWorldX = getCastleWorldX(startX);
    const castle = scene.add.image(castleWorldX, skyCastleBaseY, 'skycastle');
    castle.setScrollFactor(skyCastleParallaxX, skyCastleParallaxY);
    castle.setDepth(-20);
    if (castleSource && castleSource.height) {
        castle.setScale(160 / castleSource.height);
    }
    return castle;
}

function isCastleOffscreen(scene, castle) {
    const camera = scene.cameras.main;
    const halfW = (castle.displayWidth || 0) / 2;
    const screenX = castle.x - (camera.scrollX * skyCastleParallaxX);
    return (screenX + halfW < 0) || (screenX - halfW > config.width);
}

function updateCastleLifecycle() {
    const onGroundFloor = !!(
        player &&
        player.body &&
        (player.body.blocked.down || player.body.touching.down) &&
        player.y >= (config.height - 120)
    );

    if (onGroundFloor) {
        const currentStartX = currentRound * LEVEL.WIDTH;
        if (!activeCastle || !activeCastle.active || isCastleOffscreen(this, activeCastle)) {
            if (activeCastle && activeCastle.active) activeCastle.destroy();
            activeCastle = spawnCastle(this, currentStartX);
        }
        pendingCastleStartX = null;
        return;
    }

    if (activeCastle && activeCastle.active && isCastleOffscreen(this, activeCastle)) {
        activeCastle.destroy();
        activeCastle = null;
    }

    if (!activeCastle && pendingCastleStartX !== null) {
        const nextCastleX = getCastleWorldX(pendingCastleStartX);
        const nextScreenX = nextCastleX - (this.cameras.main.scrollX * skyCastleParallaxX);

        // Only spawn when off-canvas so the player never sees a pop-in.
        if (nextScreenX < -50 || nextScreenX > (config.width + 50)) {
            activeCastle = spawnCastle(this, pendingCastleStartX);
            pendingCastleStartX = null;
        }
    }
}

function spawnRound(index) {
    if (index >= rounds.length) {
        spawnLevelEnd.call(this);
        return;
    }

    // Level 2: guarantee Howl comes back on screen at the start of each round
    if (currentGameLevel === 2 && howlsCastle && howlsCastle.active) {
        const onScreen = howlsCastle.x > -50 && howlsCastle.x < config.width + 50;
        if (!onScreen) {
            // Reposition off the right edge (off-screen → off-screen, no visible pop)
            howlsCastle.x = config.width + 150;
            howlsVelX = -HOWLS.SPEED_X;
            howlsOffScreenTimer = 0;
        }
    }

    currentRound = index;
    roundText.setText(UI.ROUND_PREFIX + (currentRound + 1));

    // Clean up objects from 2 rounds back — the player has moved well past them.
    const cleanupIndex = index - 2;
    if (cleanupIndex >= 0 && roundObjectsMap[cleanupIndex]) {
        const old = roundObjectsMap[cleanupIndex];
        if (old.floor && old.floor.active) old.floor.destroy();
        old.platforms.forEach(p => { if (p && p.active) p.destroy(); });
        old.wordBlocks.forEach(b => { if (b && b.active) b.destroy(); });
        old.texts.forEach(t => { if (t && t.active) t.destroy(); });
        old.coins.forEach(c => { if (c && c.active) c.destroy(); });
        delete roundObjectsMap[cleanupIndex];

    }

    // Bucket to track all objects created this round for later cleanup
    const roundObjects = { floor: null, platforms: [], wordBlocks: [], texts: [], coins: [] };

    const startX = currentRound * LEVEL.WIDTH;

    // Expand world and camera bounds to include the new round area.
    const newMaxX = startX + LEVEL.WIDTH;
    this.physics.world.setBounds(0, -worldTopExtent, newMaxX, config.height + worldTopExtent);
    this.cameras.main.setBounds(0, -worldTopExtent, newMaxX, config.height + worldTopExtent);

    if (!activeCastle || !activeCastle.active) {
        activeCastle = spawnCastle(this, startX);
    } else {
        pendingCastleStartX = startX;
    }

    // Invisible physics floor for this round segment
    const fgHeight = this.textures.get('brickpath').getSourceImage().height || 50;
    let floor = this.add.rectangle(startX + 1500, config.height - (fgHeight / 2), 3000, fgHeight, 0x2E8B57);
    floor.setVisible(false);
    this.physics.add.existing(floor, true);
    floors.add(floor);
    roundObjects.floor = floor;

    // --- JUMP OVER MIKE PLATFORMS ---
    // Skipped for round 2, which has its own lead-up staircase.
    const jumpPlatforms = currentRound === 1 ? [] : [
        { x: startX + 250, y: 480 },
        { x: startX + 430, y: 390 },
        { x: startX + 610, y: 300 }
    ];
    for (let i = 0; i < jumpPlatforms.length; i++) {
        const pos = jumpPlatforms[i];

        let p = platforms.create(pos.x, pos.y, 'platform');
        p.setDisplaySize(120, 40);
        p.refreshBody();
        p.body.checkCollision.down = false;
        p.body.checkCollision.left = false;
        p.body.checkCollision.right = false;
        roundObjects.platforms.push(p);

        if (Phaser.Math.Between(0, 100) < COIN.SPAWN_CHANCE) {
            let coin = sootCoins.create(pos.x, pos.y - 50, 'sootcoin');
            coin.setScale(COIN.SCALE);
            roundObjects.coins.push(coin);
        }
    }

    const data = activeRounds[currentRound % activeRounds.length];

    // --- PLATFORM & BLOCK GENERATION ---
    if (currentRound === 1) {
        // Round 2: three lead-up platforms to one larger platform with all 3 word blocks above it.
        const leadUpPlatforms = [
            { x: startX + 200, y: 480 },
            { x: startX + 360, y: 390 },
            { x: startX + 540, y: 290 },
            { x: startX + 720, y: 190 }
        ];

        for (let i = 0; i < leadUpPlatforms.length; i++) {
            const pos = leadUpPlatforms[i];
            let platform = platforms.create(pos.x, pos.y, 'platform');
            platform.setDisplaySize(180, 40).refreshBody();
            platform.body.checkCollision.down = false;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
            roundObjects.platforms.push(platform);

            if (Phaser.Math.Between(0, 100) < COIN.SPAWN_CHANCE) {
                let coin = sootCoins.create(pos.x, pos.y - 50, 'sootcoin');
                coin.setScale(COIN.SCALE);
                roundObjects.coins.push(coin);
            }
        }

        const finalPlatformX = startX + 700;
        const finalPlatformY = 80;
        let finalPlatform = platforms.create(finalPlatformX, finalPlatformY, 'platform');
        finalPlatform.setDisplaySize(560, 40).refreshBody();
        finalPlatform.body.checkCollision.down = false;
        finalPlatform.body.checkCollision.left = false;
        finalPlatform.body.checkCollision.right = false;
        roundObjects.platforms.push(finalPlatform);

        const blockY = finalPlatformY - 190;
        const positions = [finalPlatformX - 180, finalPlatformX, finalPlatformX + 180];
        for (let i = 0; i < 3; i++) {
            let x = positions[i];
            let y = blockY;

            const bHeight = this.textures.get('bubbleblock1').getSourceImage().height || 64;
            let block = wordBlocks.create(x, y + (bHeight / 2), 'bubbleblock1');
            block.setOrigin(0.5, 1).refreshBody();
            block.word = data.options[i];
            roundObjects.wordBlocks.push(block);

            let text = this.add.text(x, y, data.options[i], { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });
            text.setOrigin(0.5);
            textGroup.add(text);
            block.textObject = text;
            roundObjects.texts.push(text);
        }

        audioTriggerX = finalPlatformX - 700;

    } else if (currentRound < 3) {
        // Rounds 1–3: Staircase up to one wide platform
        const numPlatforms = Math.min(Math.max(currentRound + 2, 2), 4);
        let blockY = 220;
        let blockXBase = startX + 1800;

        if (numPlatforms > 0) {
            let platX = startX + 1000;
            let platY = 460;

            for (let i = 0; i < numPlatforms; i++) {
                const isFinalPlatform = (i === numPlatforms - 1);
                const platWidth = isFinalPlatform ? 600 : 200;
                const currentPlatX = isFinalPlatform ? platX + 200 : platX;

                let platform = platforms.create(currentPlatX, platY, 'platform');
                platform.setDisplaySize(platWidth, 40).refreshBody();
                platform.body.checkCollision.down = false;
                platform.body.checkCollision.left = false;
                platform.body.checkCollision.right = false;
                roundObjects.platforms.push(platform);

                if (Phaser.Math.Between(0, 100) < COIN.SPAWN_CHANCE) {
                    let coin = sootCoins.create(currentPlatX, platY - 50, 'sootcoin');
                    coin.setScale(COIN.SCALE);
                    roundObjects.coins.push(coin);
                }

                if (isFinalPlatform) {
                    blockY = platY - 210;
                    blockXBase = platX;
                }

                platX += 250;
                platY -= 110;
            }
        }

        const positions = [blockXBase, blockXBase + 200, blockXBase + 400];
        for (let i = 0; i < 3; i++) {
            let x = positions[i];
            let y = blockY;

            const bHeight = this.textures.get('bubbleblock1').getSourceImage().height || 64;
            let block = wordBlocks.create(x, y + (bHeight / 2), 'bubbleblock1');
            block.setOrigin(0.5, 1).refreshBody();
            block.word = data.options[i];
            roundObjects.wordBlocks.push(block);

            let text = this.add.text(x, y, data.options[i], { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });
            text.setOrigin(0.5);
            textGroup.add(text);
            block.textObject = text;
            roundObjects.texts.push(text);
        }

        audioTriggerX = blockXBase - 700;

    } else {
        // Rounds 4+: Three separate elevated platforms for blocks
        let leadUpPlatX = startX + 1000;
        let leadUpPlatY = 420;
        for (let i = 0; i < 3; i++) {
            let p = platforms.create(leadUpPlatX, leadUpPlatY, 'platform');
            p.setDisplaySize(150, 40).refreshBody();
            p.body.checkCollision.down = false;
            p.body.checkCollision.left = false;
            p.body.checkCollision.right = false;
            roundObjects.platforms.push(p);

            if (Phaser.Math.Between(0, 100) < COIN.SPAWN_CHANCE) {
                let coin = sootCoins.create(leadUpPlatX, leadUpPlatY - 50, 'sootcoin').setScale(COIN.SCALE);
                roundObjects.coins.push(coin);
            }
            leadUpPlatX += 240;
            leadUpPlatY -= 120;
        }

        const blockPlatformPositions = [
            { x: startX + 1680, y: 140 },
            { x: startX + 1940, y: 40 },
            { x: startX + 2200, y: 140 }
        ];
        Phaser.Utils.Array.Shuffle(blockPlatformPositions);

        for (let i = 0; i < 3; i++) {
            const pos = blockPlatformPositions[i];

            let platform = platforms.create(pos.x, pos.y, 'platform');
            platform.setDisplaySize(200, 40).refreshBody();
            platform.body.checkCollision.down = false;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
            roundObjects.platforms.push(platform);

            let x = pos.x;
            let y = pos.y - 190;

            const bHeight = this.textures.get('bubbleblock1').getSourceImage().height || 64;
            let block = wordBlocks.create(x, y + (bHeight / 2), 'bubbleblock1');
            block.setOrigin(0.5, 1).refreshBody();
            block.word = data.options[i];
            roundObjects.wordBlocks.push(block);

            let text = this.add.text(x, y, data.options[i], { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });
            text.setOrigin(0.5);
            textGroup.add(text);
            block.textObject = text;
            roundObjects.texts.push(text);
        }

        audioTriggerX = startX + 1500 - 700;
    }

    wordSpoken = false;

    // --- SPAWN GROUND COINS ---
    for (let i = 0; i < 3; i++) {
        let cx = startX + 400 + (i * 150);
        let coin = sootCoins.create(cx, 450, 'sootcoin');
        coin.setScale(COIN.SCALE);
        roundObjects.coins.push(coin);
    }

    // --- SPAWN MIKE (BAD GUY) ---
    let numMikes = 1;
    if (currentRound >= 4) numMikes = 2;
    if (currentRound >= 7) numMikes = 3;

    for (let i = 0; i < numMikes; i++) {
        let mikeX = startX + 600 + (i * 400);
        let mike = enemies.create(mikeX, 500, 'mike1');
        mike.setScale(0.64);
        mike.setCollideWorldBounds(true);
        mike.startX = mikeX;
        mike.setVelocityX(-ENEMY.PATROL_SPEED);
        mike.setFlipX(true);
        mike.anims.play('mikeWalk');
    }

    // Store round objects for cleanup when 2 rounds ahead is reached
    roundObjectsMap[index] = roundObjects;
}

// Called when player hits the bottom of a block (jumping up)
function hitBlock(player, block) {
    if (player.body.touching.up && block.body.touching.down) {
        const data = activeRounds[currentRound % activeRounds.length];

        if (block.word === data.target) {
            // CORRECT!
            block.body.enable = false;
            flowerEmitter.explode(30, block.x, block.y);

            this.time.delayedCall(200, () => { if (block.active) block.setTexture('bubbleblock2'); });
            this.time.delayedCall(400, () => { if (block.active) block.setTexture('bubbleblock3'); });
            this.time.delayedCall(600, () => { if (block.active) block.setTexture('bubbleblock4'); });

            spawnRound.call(this, currentRound + 1);

        } else {
            // INCORRECT!
            block.body.enable = false;
            block.setTint(0x333333);

            // Fade out, then fully destroy the block and its text label
            this.tweens.add({
                targets: [block, block.textObject],
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    if (block.textObject && block.textObject.active) block.textObject.destroy();
                    if (block.active) block.destroy();
                }
            });

            // Penalize: all collected coins fly off screen
            if (score > 0) {
                const coinsToShow = Math.min(score, 20);
                for (let i = 0; i < coinsToShow; i++) {
                    let coin = this.add.image(config.width / 2, 100, 'sootcoin').setScrollFactor(0).setScale(COIN.SCALE);
                    this.tweens.add({
                        targets: coin,
                        x: -100,
                        duration: Phaser.Math.Between(500, 1000),
                        onComplete: () => coin.destroy()
                    });
                }
                score = 0;
                scoreText.setText(UI.SCORE_PREFIX + score);
            }
        }
    }
}

 
// Called when player touches Mike
function hitEnemy(_player, _enemy) {
    if (isDead) return;
    if (isInvincible) return;
    if (!this.physics) return;

    if (lives > 0) {
        lives--;
        updateLifeIcons(this);
        respawnPlayer(this);
        return;
    }

    isDead = true;
    playCrashSound();
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('idle');

    if (window.backgroundMusic) {
        window.backgroundMusic.stop();
    }

    this.time.delayedCall(1000, () => {
        currentRound = 0;
        currentGameLevel = 1;
        mikesDefeated = 0;
        this.scene.restart();
    });
}

// Called when player collects a coin
function collectCoin(_player, coin) {
    coin.destroy();
    playCoinSound();
    score += 1;
    coinsForLife += 1;
    scoreText.setText(UI.SCORE_PREFIX + score);
    if (coinsForLife % 10 === 0) {
        lives++;
        updateLifeIcons(this);
    }
}

function spawnLevelEnd() {
    const startX = rounds.length * LEVEL.WIDTH;

    // Expand world bounds to cover the end zone
    const newMaxX = startX + LEVEL.WIDTH;
    this.physics.world.setBounds(0, -worldTopExtent, newMaxX, config.height + worldTopExtent);
    this.cameras.main.setBounds(0, -worldTopExtent, newMaxX, config.height + worldTopExtent);

    // Invisible floor for this zone
    const fgHeight = this.textures.get('brickpath').getSourceImage().height || 50;
    const floor = this.add.rectangle(startX + 1200, config.height - (fgHeight / 2), 2400, fgHeight, 0x2E8B57);
    floor.setVisible(false);
    this.physics.add.existing(floor, true);
    floors.add(floor);

    // End block — placed at a height reachable from the ground
    const blockX = startX + 700;
    const blockBottomY = 370;
    endBlock = this.physics.add.staticSprite(blockX, blockBottomY, 'bubbleblock1');
    endBlock.setDisplaySize(280, 80);
    endBlock.setOrigin(0.5, 1);
    endBlock.refreshBody();
    endBlock.phase = (currentGameLevel === 1) ? 0 : 2; // 0 = LEVEL 1 COMPLETE, 1 = GO TO LEVEL 2, 2 = GAME COMPLETE

    const endLabelText = (currentGameLevel === 1) ? 'LEVEL 1\nCOMPLETE' : 'GAME\nCOMPLETE';
    endBlockLabel = this.add.text(blockX, blockBottomY - 40, endLabelText, {
        fontSize: '20px', fill: '#ffffff', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);

    this.physics.add.collider(player, endBlock, hitEndBlock, null, this);
}

function hitEndBlock(player, block) {
    if (!(player.body.touching.up && block.body.touching.down)) return;

    if (block.phase === 0) {
        block.body.enable = false;
        block.phase = 1;
        showLevelCompleteOverlay.call(this);

    } else if (block.phase === 1) {
        block.body.enable = false;
        currentGameLevel = 2;
        currentRound = 0;
        mikesDefeated = 0;
        if (window.backgroundMusic) window.backgroundMusic.stop();
        this.scene.restart();
    } else if (block.phase === 2) {
        block.body.enable = false;
        showGameCompleteOverlay.call(this);
    }
}

function showLevelCompleteOverlay() {
    // Flash the screen white briefly
    const flash = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0xffffff, 1);
    flash.setScrollFactor(0).setDepth(200);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Dark overlay
    const overlay = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.75);
    overlay.setScrollFactor(0).setDepth(100);

    const title = this.add.text(config.width / 2, config.height / 2 - 90, 'LEVEL 1 COMPLETE!', {
        fontSize: '52px', fill: '#fff', stroke: '#000', strokeThickness: 6, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const spritesText = this.add.text(config.width / 2, config.height / 2, `Total Soot Sprites: ${score}`, {
        fontSize: '34px', fill: '#FFD700', stroke: '#000', strokeThickness: 4, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const mikesText = this.add.text(config.width / 2, config.height / 2 + 60, `Mr. M's Defeated: ${mikesDefeated}`, {
        fontSize: '34px', fill: '#FFD700', stroke: '#000', strokeThickness: 4, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // After 10 seconds remove overlay and flip the block to "GO TO LEVEL 2"
    this.time.delayedCall(10000, () => {
        overlay.destroy();
        title.destroy();
        spritesText.destroy();
        mikesText.destroy();
        if (endBlockLabel && endBlockLabel.active) endBlockLabel.setText('GO TO\nLEVEL 2');
        if (endBlock && endBlock.active) endBlock.body.enable = true;
    });
}

function showGameCompleteOverlay() {
    // Flash the screen white briefly
    const flash = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0xffffff, 1);
    flash.setScrollFactor(0).setDepth(200);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Dark overlay
    const overlay = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.75);
    overlay.setScrollFactor(0).setDepth(100);

    const title = this.add.text(config.width / 2, config.height / 2 - 90, 'GAME COMPLETE!', {
        fontSize: '52px', fill: '#fff', stroke: '#000', strokeThickness: 6, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const spritesText = this.add.text(config.width / 2, config.height / 2, `Total Soot Sprites: ${score}`, {
        fontSize: '34px', fill: '#FFD700', stroke: '#000', strokeThickness: 4, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const mikesText = this.add.text(config.width / 2, config.height / 2 + 60, `Mr. M's Defeated: ${mikesDefeated}`, {
        fontSize: '34px', fill: '#FFD700', stroke: '#000', strokeThickness: 4, fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
}

function updateLifeIcons(scene) {
    lifeIcons.forEach(icon => { if (icon && icon.active) icon.destroy(); });
    lifeIcons = [];
    for (let i = 0; i < lives; i++) {
        const icon = scene.add.image(16 + i * 34, 58, 'totoro1');
        icon.setScale(0.4);
        icon.setScrollFactor(0);
        icon.setOrigin(0, 0);
        lifeIcons.push(icon);
    }
}

function respawnPlayer(scene) {
    player.setPosition(player.x, config.height / 2);
    player.setVelocity(0, 0);
    player.clearTint();
    player.setAlpha(1);
    isInvincible = true;

    // Flash for 5 seconds, then vulnerability returns
    scene.tweens.add({
        targets: player,
        alpha: 0.1,
        duration: 150,
        yoyo: true,
        repeat: 16,
        onComplete: () => {
            isInvincible = false;
            player.setAlpha(1);
        }
    });
}

// --- AUDIO HELPERS ---

function getAudioCtx() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playCoinSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

function playJumpSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
}

function playSmashHitSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
}

function playCrashSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    const oscA = ctx.createOscillator();
    const gainA = ctx.createGain();
    oscA.connect(gainA);
    gainA.connect(ctx.destination);
    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(220, now);
    oscA.frequency.exponentialRampToValueAtTime(70, now + 0.22);
    gainA.gain.setValueAtTime(0.001, now);
    gainA.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainA.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    const oscB = ctx.createOscillator();
    const gainB = ctx.createGain();
    oscB.connect(gainB);
    gainB.connect(ctx.destination);
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(110, now);
    oscB.frequency.exponentialRampToValueAtTime(45, now + 0.26);
    gainB.gain.setValueAtTime(0.001, now);
    gainB.gain.linearRampToValueAtTime(0.24, now + 0.008);
    gainB.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    // Short high-frequency transient for a stronger "smash" impact.
    const oscC = ctx.createOscillator();
    const gainC = ctx.createGain();
    oscC.connect(gainC);
    gainC.connect(ctx.destination);
    oscC.type = 'square';
    oscC.frequency.setValueAtTime(900, now);
    oscC.frequency.exponentialRampToValueAtTime(260, now + 0.07);
    gainC.gain.setValueAtTime(0.001, now);
    gainC.gain.linearRampToValueAtTime(0.18, now + 0.004);
    gainC.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    oscA.start(now);
    oscB.start(now);
    oscC.start(now);
    oscA.stop(now + 0.22);
    oscB.stop(now + 0.26);
    oscC.stop(now + 0.09);
}
