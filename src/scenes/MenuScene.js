/**
 * Menu Scene
 * Main menu interface with options to start game, settings, etc.
 */

import { CONFIG } from '../config/GameConfig.js';
import { Menu, Button } from '../ui/UIComponents.js';
import { AudioManager, InputManager } from '../managers/SystemManagers.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    preload() {
        // Load menu assets
        this.load.image('menuBackground', 'assets/menu-background.jpg');
        this.load.image('logo', 'assets/poker-logo.png');
        this.load.image('menuButton', 'assets/menu-button.png');
        
        // Load audio
        this.audioManager = new AudioManager(this);
        this.audioManager.preloadSounds();
    }
    
    create() {
        // Initialize managers
        this.audioManager.initSounds();
        this.inputManager = new InputManager(this);
        
        // Create background
        this.createBackground();
        
        // Create logo
        this.createLogo();
        
        // Create main menu
        this.createMainMenu();
        
        // Create footer
        this.createFooter();
        
        // Start background music
        this.audioManager.playMusic();
    }
    
    createBackground() {
        // Add background image or color
        this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2,
            CONFIG.GAME.WIDTH,
            CONFIG.GAME.HEIGHT,
            0x0f4c2b
        );
        
        // Add poker table pattern or texture
        const bg = this.add.graphics();
        bg.fillStyle(0x2d5aa0, 0.3);
        bg.fillEllipse(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2, 600, 400);
        
        // Add subtle pattern
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, CONFIG.GAME.WIDTH);
            const y = Phaser.Math.Between(0, CONFIG.GAME.HEIGHT);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
            
            const dot = this.add.circle(x, y, 2, 0xffffff, alpha);
        }
    }
    
    createLogo() {
        // Game title
        const title = this.add.text(
            CONFIG.GAME.WIDTH / 2,
            150,
            'TEXAS HOLD\'EM POKER',
            {
                fontSize: '48px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    fill: true
                }
            }
        ).setOrigin(0.5);
        
        // Subtitle
        const subtitle = this.add.text(
            CONFIG.GAME.WIDTH / 2,
            200,
            'Professional Edition',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                fill: '#ffff00',
                style: 'italic'
            }
        ).setOrigin(0.5);
        
        // Logo animation
        this.tweens.add({
            targets: [title, subtitle],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    createMainMenu() {
        const menuOptions = [
            {
                text: 'Single Player',
                callback: () => this.startSinglePlayer(),
                style: { backgroundColor: '#4CAF50' }
            },
            {
                text: 'Multiplayer',
                callback: () => this.startMultiplayer(),
                style: { backgroundColor: '#2196F3' }
            },
            {
                text: 'Settings',
                callback: () => this.openSettings(),
                style: { backgroundColor: '#FF9800' }
            },
            {
                text: 'How to Play',
                callback: () => this.showTutorial(),
                style: { backgroundColor: '#9C27B0' }
            },
            {
                text: 'Statistics',
                callback: () => this.showStats(),
                style: { backgroundColor: '#607D8B' }
            },
            {
                text: 'Exit Game',
                callback: () => this.exitGame(),
                style: { backgroundColor: '#F44336' }
            }
        ];
        
        this.mainMenu = new Menu(
            this,
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 + 50,
            menuOptions
        );
        
        // Menu entrance animation
        this.mainMenu.container.setAlpha(0);
        this.mainMenu.container.y += 50;
        
        this.tweens.add({
            targets: this.mainMenu.container,
            alpha: 1,
            y: CONFIG.GAME.HEIGHT / 2 + 50,
            duration: 1000,
            ease: 'Back.easeOut'
        });
    }
    
    createFooter() {
        // Version info
        this.add.text(
            CONFIG.GAME.WIDTH - 20,
            CONFIG.GAME.HEIGHT - 20,
            'v1.0.0',
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: '#888888'
            }
        ).setOrigin(1);
        
        // Controls info
        this.add.text(
            20,
            CONFIG.GAME.HEIGHT - 40,
            'Use mouse to navigate • ESC to exit',
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                fill: '#cccccc'
            }
        );
    }
    
    startSinglePlayer() {
        this.audioManager.playSound('buttonClick');
        
        // Fade out menu
        this.tweens.add({
            targets: this.mainMenu.container,
            alpha: 0,
            y: this.mainMenu.container.y - 50,
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.scene.start('GameScene', { 
                    gameMode: 'single',
                    playerCount: CONFIG.POKER.MAX_PLAYERS 
                });
            }
        });
    }
    
    startMultiplayer() {
        this.audioManager.playSound('buttonClick');
        
        // Show multiplayer options
        this.showMultiplayerMenu();
    }
    
    showMultiplayerMenu() {
        const multiplayerOptions = [
            {
                text: 'Create Room',
                callback: () => this.createRoom(),
                style: { backgroundColor: '#4CAF50' }
            },
            {
                text: 'Join Room',
                callback: () => this.joinRoom(),
                style: { backgroundColor: '#2196F3' }
            },
            {
                text: 'Back',
                callback: () => this.showMainMenu(),
                style: { backgroundColor: '#757575' }
            }
        ];
        
        // Hide main menu
        this.mainMenu.setVisible(false);
        
        // Show multiplayer menu
        this.multiplayerMenu = new Menu(
            this,
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 + 50,
            multiplayerOptions
        );
        
        this.multiplayerMenu.setTitle('Multiplayer Options');
    }
    
    createRoom() {
        this.audioManager.playSound('buttonClick');
        
        // Start multiplayer server and game
        this.scene.start('GameScene', { 
            gameMode: 'multiplayer',
            isHost: true 
        });
    }
    
    joinRoom() {
        this.audioManager.playSound('buttonClick');
        
        // Show room join dialog
        // For now, just join localhost
        this.scene.start('GameScene', { 
            gameMode: 'multiplayer',
            isHost: false,
            serverUrl: 'http://localhost:3000'
        });
    }
    
    showMainMenu() {
        if (this.multiplayerMenu) {
            this.multiplayerMenu.destroy();
            this.multiplayerMenu = null;
        }
        
        this.mainMenu.setVisible(true);
    }
    
    openSettings() {
        this.audioManager.playSound('buttonClick');
        
        const settingsOptions = [
            {
                text: 'Sound: ON',
                callback: () => this.toggleSound(),
                style: { backgroundColor: '#4CAF50' }
            },
            {
                text: 'Music: ON',
                callback: () => this.toggleMusic(),
                style: { backgroundColor: '#4CAF50' }
            },
            {
                text: 'Fullscreen',
                callback: () => this.toggleFullscreen(),
                style: { backgroundColor: '#FF9800' }
            },
            {
                text: 'Reset Stats',
                callback: () => this.resetStats(),
                style: { backgroundColor: '#F44336' }
            },
            {
                text: 'Back',
                callback: () => this.showMainMenu(),
                style: { backgroundColor: '#757575' }
            }
        ];
        
        this.mainMenu.setVisible(false);
        
        this.settingsMenu = new Menu(
            this,
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 + 50,
            settingsOptions
        );
        
        this.settingsMenu.setTitle('Settings');
    }
    
    toggleSound() {
        // Toggle sound setting
        this.audioManager.setSoundEnabled(!this.audioManager.soundEnabled);
        // Update button text
        // Implementation would update the menu button text
    }
    
    toggleMusic() {
        // Toggle music setting
        this.audioManager.setMusicEnabled(!this.audioManager.musicEnabled);
        // Update button text
        // Implementation would update the menu button text
    }
    
    toggleFullscreen() {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    }
    
    resetStats() {
        // Reset player statistics
        localStorage.removeItem('pokerStats');
        this.audioManager.playSound('notification');
    }
    
    showTutorial() {
        this.audioManager.playSound('buttonClick');
        this.scene.start('TutorialScene');
    }
    
    showStats() {
        this.audioManager.playSound('buttonClick');
        
        // Load stats from localStorage
        const stats = JSON.parse(localStorage.getItem('pokerStats') || '{}');
        const gamesPlayed = stats.gamesPlayed || 0;
        const gamesWon = stats.gamesWon || 0;
        const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : 0;
        
        const message = `Games Played: ${gamesPlayed}\nGames Won: ${gamesWon}\nWin Rate: ${winRate}%`;
        
        // Show stats dialog
        this.showDialog('Player Statistics', message);
    }
    
    showDialog(title, message) {
        // Create simple dialog overlay
        const overlay = this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2,
            CONFIG.GAME.WIDTH,
            CONFIG.GAME.HEIGHT,
            0x000000,
            0.7
        ).setInteractive();
        
        const dialog = this.add.container(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x2a2a2a);
        bg.fillRoundedRect(-200, -150, 400, 300, 10);
        bg.lineStyle(2, 0xffffff);
        bg.strokeRoundedRect(-200, -150, 400, 300, 10);
        
        const titleText = this.add.text(0, -100, title, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const messageText = this.add.text(0, -20, message, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
        
        const closeButton = new Button(this, 0, 80, 100, 40, 'Close');
        closeButton.onClick = () => {
            overlay.destroy();
            dialog.destroy();
        };
        
        dialog.add([bg, titleText, messageText, closeButton.container]);
    }
    
    exitGame() {
        this.audioManager.playSound('buttonClick');
        
        // Confirm exit
        const confirmOverlay = this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2,
            CONFIG.GAME.WIDTH,
            CONFIG.GAME.HEIGHT,
            0x000000,
            0.8
        ).setInteractive();
        
        const confirmDialog = this.add.container(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x2a2a2a);
        bg.fillRoundedRect(-150, -100, 300, 200, 10);
        bg.lineStyle(2, 0xff4444);
        bg.strokeRoundedRect(-150, -100, 300, 200, 10);
        
        const title = this.add.text(0, -50, 'Exit Game?', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const message = this.add.text(0, -10, 'Are you sure you want to exit?', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        const yesButton = new Button(this, -60, 50, 80, 35, 'Yes', { backgroundColor: '#F44336' });
        const noButton = new Button(this, 60, 50, 80, 35, 'No', { backgroundColor: '#4CAF50' });
        
        yesButton.onClick = () => {
            // Close the game window
            window.close();
        };
        
        noButton.onClick = () => {
            confirmOverlay.destroy();
            confirmDialog.destroy();
        };
        
        confirmDialog.add([bg, title, message, yesButton.container, noButton.container]);
    }
    
    // Input handling
    isPlayerTurn() {
        return false; // Not applicable in menu
    }
    
    togglePauseMenu() {
        // Not applicable in menu
    }
    
    updateHoverEffects(pointer) {
        // Handle button hover effects
    }
    
    handleClick(pointer) {
        // Handle click events
    }
    
    destroy() {
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.mainMenu) {
            this.mainMenu.destroy();
        }
        
        if (this.multiplayerMenu) {
            this.multiplayerMenu.destroy();
        }
        
        if (this.settingsMenu) {
            this.settingsMenu.destroy();
        }
        
        super.destroy();
    }
}