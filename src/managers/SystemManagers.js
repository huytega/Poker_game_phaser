/**
 * Scene Manager Class
 * Manages scene transitions and state
 */

export class SceneManager {
    constructor(game) {
        this.game = game;
        this.currentScene = null;
        this.scenes = new Map();
    }
    
    registerScene(key, sceneClass) {
        this.scenes.set(key, sceneClass);
        this.game.scene.add(key, sceneClass, false);
    }
    
    startScene(key, data = {}) {
        if (this.currentScene) {
            this.game.scene.stop(this.currentScene);
        }
        
        this.currentScene = key;
        this.game.scene.start(key, data);
    }
    
    switchToScene(key, data = {}) {
        this.startScene(key, data);
    }
    
    pauseScene(key) {
        this.game.scene.pause(key);
    }
    
    resumeScene(key) {
        this.game.scene.resume(key);
    }
    
    restartScene(key, data = {}) {
        this.game.scene.restart(key, data);
    }
    
    getCurrentScene() {
        return this.currentScene;
    }
}

/**
 * Audio Manager Class
 * Manages all game audio and sound effects
 */

export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.music = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
    }
    
    preloadSounds() {
        // Card sounds
        this.scene.load.audio('cardFlip', ['assets/sounds/card-flip.mp3']);
        this.scene.load.audio('cardShuffle', ['assets/sounds/card-shuffle.mp3']);
        this.scene.load.audio('chipStack', ['assets/sounds/chip-stack.mp3']);
        this.scene.load.audio('chipDrop', ['assets/sounds/chip-drop.mp3']);
        
        // UI sounds
        this.scene.load.audio('buttonClick', ['assets/sounds/button-click.mp3']);
        this.scene.load.audio('notification', ['assets/sounds/notification.mp3']);
        
        // Game sounds
        this.scene.load.audio('gameWin', ['assets/sounds/game-win.mp3']);
        this.scene.load.audio('gameLose', ['assets/sounds/game-lose.mp3']);
        
        // Background music
        this.scene.load.audio('backgroundMusic', ['assets/sounds/background-music.mp3']);
    }
    
    initSounds() {
        // Initialize sound objects
        this.sounds.set('cardFlip', this.scene.sound.add('cardFlip', { volume: this.soundVolume }));
        this.sounds.set('cardShuffle', this.scene.sound.add('cardShuffle', { volume: this.soundVolume }));
        this.sounds.set('chipStack', this.scene.sound.add('chipStack', { volume: this.soundVolume }));
        this.sounds.set('chipDrop', this.scene.sound.add('chipDrop', { volume: this.soundVolume }));
        this.sounds.set('buttonClick', this.scene.sound.add('buttonClick', { volume: this.soundVolume }));
        this.sounds.set('notification', this.scene.sound.add('notification', { volume: this.soundVolume }));
        this.sounds.set('gameWin', this.scene.sound.add('gameWin', { volume: this.soundVolume }));
        this.sounds.set('gameLose', this.scene.sound.add('gameLose', { volume: this.soundVolume }));
        
        // Initialize background music
        this.music = this.scene.sound.add('backgroundMusic', {
            volume: this.musicVolume,
            loop: true
        });
    }
    
    playSound(key) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds.get(key);
        if (sound) {
            sound.play();
        }
    }
    
    playMusic() {
        if (!this.musicEnabled || !this.music) return;
        
        if (!this.music.isPlaying) {
            this.music.play();
        }
    }
    
    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }
    
    pauseMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.pause();
        }
    }
    
    resumeMusic() {
        if (this.music && this.music.isPaused) {
            this.music.resume();
        }
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
    }
    
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.setVolume(this.soundVolume);
        });
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.setVolume(this.musicVolume);
        }
    }
}

/**
 * Input Manager Class
 * Handles all user input and controls
 */

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.pointers = {};
        this.setupKeyboard();
        this.setupMouse();
    }
    
    setupKeyboard() {
        // Create key objects
        this.keys.ESC = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keys.SPACE = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keys.ENTER = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keys.C = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.keys.R = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keys.F = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keys.A = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.P = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        // Set up key events
        this.keys.ESC.on('down', () => this.onEscPressed());
        this.keys.SPACE.on('down', () => this.onSpacePressed());
        this.keys.ENTER.on('down', () => this.onEnterPressed());
        this.keys.C.on('down', () => this.onCallCheckPressed());
        this.keys.R.on('down', () => this.onRaisePressed());
        this.keys.F.on('down', () => this.onFoldPressed());
        this.keys.A.on('down', () => this.onAllInPressed());
        this.keys.P.on('down', () => this.onPausePressed());
    }
    
    setupMouse() {
        this.scene.input.on('pointerdown', (pointer) => {
            this.onPointerDown(pointer);
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            this.onPointerUp(pointer);
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            this.onPointerMove(pointer);
        });
    }
    
    onEscPressed() {
        // Toggle pause menu or exit game
        if (this.scene.scene.key === 'GameScene') {
            this.scene.togglePauseMenu();
        } else if (this.scene.scene.key === 'MenuScene') {
            this.scene.exitGame();
        }
    }
    
    onSpacePressed() {
        // Quick action - check/call
        if (this.scene.scene.key === 'GameScene' && this.scene.isPlayerTurn()) {
            this.scene.playerCheck();
        }
    }
    
    onEnterPressed() {
        // Confirm action or continue
        if (this.scene.scene.key === 'GameScene') {
            this.scene.confirmAction();
        }
    }
    
    onCallCheckPressed() {
        if (this.scene.scene.key === 'GameScene' && this.scene.isPlayerTurn()) {
            this.scene.playerCheck();
        }
    }
    
    onRaisePressed() {
        if (this.scene.scene.key === 'GameScene' && this.scene.isPlayerTurn()) {
            this.scene.showRaiseDialog();
        }
    }
    
    onFoldPressed() {
        if (this.scene.scene.key === 'GameScene' && this.scene.isPlayerTurn()) {
            this.scene.playerFold();
        }
    }
    
    onAllInPressed() {
        if (this.scene.scene.key === 'GameScene' && this.scene.isPlayerTurn()) {
            this.scene.playerAllIn();
        }
    }
    
    onPausePressed() {
        if (this.scene.scene.key === 'GameScene') {
            this.scene.togglePause();
        }
    }
    
    onPointerDown(pointer) {
        this.pointers.down = {
            x: pointer.x,
            y: pointer.y,
            time: this.scene.time.now
        };
    }
    
    onPointerUp(pointer) {
        if (this.pointers.down) {
            const duration = this.scene.time.now - this.pointers.down.time;
            const distance = Phaser.Math.Distance.Between(
                this.pointers.down.x, this.pointers.down.y,
                pointer.x, pointer.y
            );
            
            // Register as click if short duration and small movement
            if (duration < 300 && distance < 10) {
                this.onPointerClick(pointer);
            }
        }
        
        this.pointers.down = null;
    }
    
    onPointerMove(pointer) {
        // Handle hover effects
        this.scene.updateHoverEffects(pointer);
    }
    
    onPointerClick(pointer) {
        // Handle click events
        this.scene.handleClick(pointer);
    }
    
    isKeyPressed(key) {
        return this.keys[key] && this.keys[key].isDown;
    }
    
    wasKeyJustPressed(key) {
        return this.keys[key] && Phaser.Input.Keyboard.JustDown(this.keys[key]);
    }
    
    destroy() {
        // Clean up input listeners
        Object.values(this.keys).forEach(key => {
            if (key) key.destroy();
        });
        
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointerup');
        this.scene.input.off('pointermove');
    }
}