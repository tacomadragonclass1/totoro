window.addEventListener('load', function () {
    const musicButton = document.getElementById('musicButton');
    const restartButton = document.getElementById('restartButton');
    const leftButton = document.getElementById('leftCtrl');
    const rightButton = document.getElementById('rightCtrl');
    const jumpButton = document.getElementById('jumpCtrl');
    const smashButton = document.getElementById('smashCtrl');

    musicButton.addEventListener('click', function () {
        // Wait for game to load music
        if (!window.backgroundMusic) return;

        if (window.backgroundMusic.isPlaying) {
            window.backgroundMusic.pause();
            musicButton.textContent = 'Music On';
        } else {
            window.backgroundMusic.resume();
            musicButton.textContent = 'Music Off';
        }
    });

    restartButton.addEventListener('click', function () {
        // This reloads the page, effectively restarting the game
        window.location.reload();
    });

    document.getElementById('goLevel1Btn').addEventListener('click', function () {
        if (window.backgroundMusic) window.backgroundMusic.stop();
        currentRound = 0;
        currentGameLevel = 1;
        mikesDefeated = 0;
        game.scene.scenes[0].scene.restart();
    });

    document.getElementById('goLevel2Btn').addEventListener('click', function () {
        if (window.backgroundMusic) window.backgroundMusic.stop();
        currentRound = 0;
        currentGameLevel = 2;
        mikesDefeated = 0;
        game.scene.scenes[0].scene.restart();
    });

    // --- New Game Controls ---

    // For movement buttons, we need to track pointer down and up
    // to allow for continuous movement.
    leftButton.addEventListener('pointerdown', () => { window.leftButtonPressed = true; });
    leftButton.addEventListener('pointerup', () => { window.leftButtonPressed = false; });
    leftButton.addEventListener('pointerout', () => { window.leftButtonPressed = false; });

    rightButton.addEventListener('pointerdown', () => { window.rightButtonPressed = true; });
    rightButton.addEventListener('pointerup', () => { window.rightButtonPressed = false; });
    rightButton.addEventListener('pointerout', () => { window.rightButtonPressed = false; });

    // Use pointerdown for immediate response (better for jumping)
    jumpButton.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // Prevent default browser behavior
        // Check if the game's function is ready before calling it
        if (window.triggerJump) {
            window.triggerJump();
        }
    });

    smashButton.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        // Set a flag that the game's update loop will check
        window.smashButtonPressed = true;
    });
});