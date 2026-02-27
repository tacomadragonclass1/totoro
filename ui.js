window.addEventListener('load', function () {
    const musicButton = document.getElementById('musicButton');
    const restartButton = document.getElementById('restartButton');

    musicButton.addEventListener('click', function () {
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
});