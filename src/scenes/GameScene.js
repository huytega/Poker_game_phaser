/**
 * Game Scene
 * Main poker game interface and logic
 */

import { CONFIG } from '../config/GameConfig.js';
import { GameManager } from '../managers/GameManager.js';
import { AudioManager, InputManager } from '../managers/SystemManagers.js';
import { HUD, Button, Dialog } from '../ui/UIComponents.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init(data) {
        this.gameMode = data.gameMode || 'single';
        this.isHost = data.isHost || false;
        this.serverUrl = data.serverUrl || 'http://localhost:3000';
        this.playerCount = data.playerCount || CONFIG.POKER.MAX_PLAYERS;
    }
    
    preload() {
        // Load game assets
        this.loadGameAssets();
        
        // Initialize audio manager
        this.audioManager = new AudioManager(this);
        this.audioManager.preloadSounds();
    }
    
    loadGameAssets() {
        // Table and background
        this.load.image('table', 'assets/poker-table.png');
        this.load.image('tablePattern', 'assets/table-pattern.png');
        
        // Cards
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        suits.forEach(suit => {
            ranks.forEach(rank => {
                this.load.image(`${rank}_${suit}`, `assets/cards/${rank}_${suit}.png`);
            });
        });
        
        this.load.image('card_back', 'assets/back-cards/card_back.png');
        this.load.image('card_back_blue', 'assets/back-cards/blue_back.png');
        this.load.image('card_back_red', 'assets/back-cards/red_back.png');
        
        // Chips
        this.load.image('chip_white', 'assets/chips/chip_white.png');
        this.load.image('chip_red', 'assets/chips/chip_red.png');
        this.load.image('chip_blue', 'assets/chips/chip_blue.png');
        this.load.image('chip_green', 'assets/chips/chip_green.png');
        this.load.image('chip_black', 'assets/chips/chip_black.png');
        
        // UI elements
        this.load.image('dealer_button', 'assets/dealer-button.png');
        this.load.image('action_indicator', 'assets/action-indicator.png');
    }
    
    create() {
        // Initialize managers
        this.audioManager.initSounds();
        this.inputManager = new InputManager(this);
        this.gameManager = new GameManager(this);
        
        // Create game world
        this.createBackground();
        this.createTable();
        this.createPlayerAreas();
        this.createCommunityArea();
        this.createUI();
        
        // Initialize game
        this.gameManager.initializePlayers();
        this.updatePlayersDisplay();
        
        // Setup multiplayer if needed
        if (this.gameMode === 'multiplayer') {
            this.setupMultiplayer();
        }
        
        // Start background music
        this.audioManager.playMusic();
        
        // Show welcome message and start game
        this.showWelcomeMessage();
    }
    
    createBackground() {
        // Create background color
        this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2,
            CONFIG.GAME.WIDTH,
            CONFIG.GAME.HEIGHT,
            0x0a5d0a
        );
        
        // Add pattern or texture
        const pattern = this.add.graphics();
        pattern.lineStyle(1, 0x0a6b0a, 0.3);
        
        for (let x = 0; x < CONFIG.GAME.WIDTH; x += 50) {
            pattern.moveTo(x, 0);
            pattern.lineTo(x, CONFIG.GAME.HEIGHT);
        }
        
        for (let y = 0; y < CONFIG.GAME.HEIGHT; y += 50) {
            pattern.moveTo(0, y);
            pattern.lineTo(CONFIG.GAME.WIDTH, y);
        }
        
        pattern.strokePath();
    }
    
    createTable() {
        // Create main poker table
        this.table = this.add.ellipse(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2,
            600, 350,
            0x2d5a2d
        );
        
        // Table border
        const tableBorder = this.add.graphics();
        tableBorder.lineStyle(8, 0x8b4513);
        tableBorder.strokeEllipse(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2, 600, 350);
        
        // Inner border
        tableBorder.lineStyle(3, 0xffd700);
        tableBorder.strokeEllipse(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2, 570, 320);
    }
    
    createPlayerAreas() {
        this.playerAreas = [];
        this.playerCards = [];
        this.playerChips = [];
        this.playerInfos = [];
        
        for (let i = 0; i < CONFIG.POKER.MAX_PLAYERS; i++) {
            const position = CONFIG.PLAYER_POSITIONS[i];
            
            // Player area background
            const area = this.add.rectangle(
                position.x, position.y - 20,
                140, 120,
                0x1a4a1a, 0.7
            );
            area.setStrokeStyle(2, 0x4a7a4a);
            
            // Player name and info
            const nameText = this.add.text(
                position.x, position.y - 60,
                `Player ${i + 1}`,
                {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5);
            
            const chipsText = this.add.text(
                position.x, position.y + 40,
                '$1000',
                {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    fill: '#ffff00'
                }
            ).setOrigin(0.5);
            
            // Card positions
            const cardPositions = [
                { x: position.x - 20, y: position.y },
                { x: position.x + 20, y: position.y }
            ];
            
            this.playerAreas.push(area);
            this.playerCards.push(cardPositions);
            this.playerChips.push(chipsText);
            this.playerInfos.push({ name: nameText, chips: chipsText });
        }
    }
    
    createCommunityArea() {
        // Community cards area
        this.communityArea = this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 - 50,
            350, 100,
            0x2a5a2a, 0.8
        );
        this.communityArea.setStrokeStyle(2, 0x6a9a6a);
        
        // Community card positions
        this.communityCardPositions = [];
        for (let i = 0; i < 5; i++) {
            this.communityCardPositions.push({
                x: CONFIG.GAME.WIDTH / 2 - 120 + (i * 60),
                y: CONFIG.GAME.HEIGHT / 2 - 50
            });
        }
        
        // Pot area
        this.potArea = this.add.rectangle(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 + 50,
            200, 60,
            0x4a4a4a, 0.8
        );
        this.potArea.setStrokeStyle(2, 0x7a7a7a);
        
        this.potText = this.add.text(
            CONFIG.GAME.WIDTH / 2,
            CONFIG.GAME.HEIGHT / 2 + 50,
            'Pot: $0',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
    }
    
    createUI() {
        // Create HUD
        this.hud = new HUD(this);
        
        // Action buttons for human player
        this.actionButtons = this.createActionButtons();
        this.hideActionButtons();
        
        // Pause menu button
        this.pauseButton = new Button(
            this, CONFIG.GAME.WIDTH - 50, 30,
            80, 35, 'Menu'
        );
        this.pauseButton.onClick = () => this.togglePauseMenu();
        
        // Start game button
        this.startButton = new Button(
            this, CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT - 80,
            150, 45, 'Start Game',
            { backgroundColor: '#4CAF50' }
        );
        this.startButton.onClick = () => this.startNewGame();
    }
    
    createActionButtons() {
        const buttonY = CONFIG.GAME.HEIGHT - 120;
        const buttonWidth = 100;
        const buttonHeight = 40;
        const spacing = 120;
        const centerX = CONFIG.GAME.WIDTH / 2;
        
        const buttons = {};
        
        buttons.fold = new Button(
            this, centerX - spacing * 1.5, buttonY,
            buttonWidth, buttonHeight, 'Fold',
            { backgroundColor: '#F44336' }
        );
        buttons.fold.onClick = () => this.playerFold();
        
        buttons.check = new Button(
            this, centerX - spacing * 0.5, buttonY,
            buttonWidth, buttonHeight, 'Check',
            { backgroundColor: '#4CAF50' }
        );
        buttons.check.onClick = () => this.playerCheck();
        
        buttons.raise = new Button(
            this, centerX + spacing * 0.5, buttonY,
            buttonWidth, buttonHeight, 'Raise',
            { backgroundColor: '#FF9800' }
        );
        buttons.raise.onClick = () => this.showRaiseDialog();
        
        buttons.allIn = new Button(
            this, centerX + spacing * 1.5, buttonY,
            buttonWidth, buttonHeight, 'All-In',
            { backgroundColor: '#9C27B0' }
        );
        buttons.allIn.onClick = () => this.playerAllIn();
        
        return buttons;
    }
    
    showWelcomeMessage() {
        const welcome = new Dialog(
            this,
            'Welcome to Texas Hold\'em Poker!',
            `Game Mode: ${this.gameMode === 'single' ? 'Single Player' : 'Multiplayer'}\n\nReady to start playing?`,
            [
                {
                    text: 'Start Game',
                    callback: () => this.startNewGame()
                },
                {
                    text: 'Back to Menu',
                    callback: () => this.returnToMenu()
                }
            ]
        );
        
        welcome.show();
    }
    
    startNewGame() {
        this.startButton.setVisible(false);
        this.audioManager.playSound('cardShuffle');
        this.gameManager.startNewGame();
    }
    
    // Game display methods
    updatePotDisplay(amount) {
        this.potText.setText(`Pot: $${amount}`);
        this.hud.updateElement('pot', 'text', `Pot: $${amount}`);
        
        // Animate pot update
        this.tweens.add({
            targets: this.potText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2.easeOut'
        });
    }
    
    updatePhaseDisplay(phase) {
        this.hud.updateElement('phase', 'text', phase.charAt(0).toUpperCase() + phase.slice(1));
    }
    
    updatePlayersDisplay() {
        this.gameManager.players.forEach((player, index) => {
            const info = this.playerInfos[index];
            if (info) {
                info.name.setText(player.name);
                info.chips.setText(`$${player.chips}`);
                
                // Update player area appearance
                const area = this.playerAreas[index];
                if (player.isFolded) {
                    area.setAlpha(0.5);
                } else if (player.isActive) {
                    area.setAlpha(1);
                } else {
                    area.setAlpha(0.7);
                }
            }
        });
    }
    
    updateStatsDisplay(gamesPlayed, gamesWon) {
        this.hud.updateElement('stats', 'text', `Games: ${gamesPlayed} | Won: ${gamesWon}`);
        
        // Save stats to localStorage
        const stats = { gamesPlayed, gamesWon };
        localStorage.setItem('pokerStats', JSON.stringify(stats));
    }
    
    // Animation methods
    animateCardDeal(player, card, cardIndex) {
        const cardSprite = this.add.image(-100, -100, 'card_back');
        cardSprite.setScale(0.8);
        
        const targetPos = this.playerCards[player.id][cardIndex];
        
        // Animate card from deck to player
        this.tweens.add({
            targets: cardSprite,
            x: targetPos.x,
            y: targetPos.y,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.audioManager.playSound('cardFlip');
                
                // Reveal human player's cards
                if (player.isHuman) {
                    setTimeout(() => {
                        cardSprite.setTexture(`${card.rank}_${card.suit}`);
                    }, 300);
                }
            }
        });
    }
    
    animateCommunityCard(card, index) {
        const cardSprite = this.add.image(-100, -100, 'card_back');
        cardSprite.setScale(0.9);
        
        const targetPos = this.communityCardPositions[index];
        
        this.tweens.add({
            targets: cardSprite,
            x: targetPos.x,
            y: targetPos.y,
            duration: 600,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.audioManager.playSound('cardFlip');
                setTimeout(() => {
                    cardSprite.setTexture(`${card.rank}_${card.suit}`);
                }, 200);
            }
        });
    }
    
    showCurrentPlayer(playerIndex) {
        // Hide all indicators first
        this.hideAllActionIndicators();
        
        // Show indicator for current player
        const position = CONFIG.PLAYER_POSITIONS[playerIndex];
        this.currentPlayerIndicator = this.add.circle(
            position.x + 60, position.y - 60,
            15, 0xffff00
        );
        
        // Pulse animation
        this.tweens.add({
            targets: this.currentPlayerIndicator,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    hideAllActionIndicators() {
        if (this.currentPlayerIndicator) {
            this.currentPlayerIndicator.destroy();
            this.currentPlayerIndicator = null;
        }
    }
    
    fadePlayerCards(player) {
        // Fade out folded player's cards
        const cardPositions = this.playerCards[player.id];
        cardPositions.forEach(pos => {
            const cardsAtPosition = this.children.list.filter(child => 
                child.x === pos.x && child.y === pos.y && child.texture
            );
            
            cardsAtPosition.forEach(card => {
                this.tweens.add({
                    targets: card,
                    alpha: 0.3,
                    duration: 500
                });
            });
        });
    }
    
    revealAllCards() {
        // Reveal all active players' cards
        this.gameManager.players.forEach(player => {
            if (!player.isFolded && !player.isHuman) {
                const cardPositions = this.playerCards[player.id];
                player.hand.forEach((card, index) => {
                    const pos = cardPositions[index];
                    const cardSprites = this.children.list.filter(child =>
                        child.x === pos.x && child.y === pos.y
                    );
                    
                    cardSprites.forEach(sprite => {
                        if (sprite.texture && sprite.texture.key === 'card_back') {
                            sprite.setTexture(`${card.rank}_${card.suit}`);
                        }
                    });
                });
            }
        });
    }
    
    highlightWinner(winner) {
        const area = this.playerAreas[winner.id];
        
        // Winner highlight animation
        this.tweens.add({
            targets: area,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            yoyo: true,
            repeat: 3
        });
        
        // Winner text
        const winnerText = this.add.text(
            CONFIG.GAME.WIDTH / 2,
            100,
            `${winner.name} Wins!`,
            {
                fontSize: '36px',
                fontFamily: 'Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        // Animate winner text
        this.tweens.add({
            targets: winnerText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 2000,
            yoyo: true,
            onComplete: () => {
                winnerText.destroy();
            }
        });
        
        // Play winner sound
        if (winner.isHuman) {
            this.audioManager.playSound('gameWin');
        } else {
            this.audioManager.playSound('gameLose');
        }
    }
    
    showGameEndOptions() {
        const dialog = new Dialog(
            this,
            'Game Complete',
            'What would you like to do next?',
            [
                {
                    text: 'Continue Playing',
                    callback: () => this.gameManager.continueGame()
                },
                {
                    text: 'Back to Menu',
                    callback: () => this.returnToMenu()
                },
                {
                    text: 'Exit Game',
                    callback: () => this.exitGame()
                }
            ]
        );
        
        dialog.show();
    }
    
    // Player action methods
    showActionButtons() {
        Object.values(this.actionButtons).forEach(button => {
            button.setVisible(true);
        });
        
        // Update button states based on game state
        const player = this.gameManager.players[0]; // Human player
        const callAmount = this.gameManager.currentBet - player.currentBet;
        
        if (callAmount > 0) {
            this.actionButtons.check.setText(`Call $${callAmount}`);
        } else {
            this.actionButtons.check.setText('Check');
        }
        
        this.actionButtons.fold.setEnabled(true);
        this.actionButtons.check.setEnabled(player.chips >= callAmount);
        this.actionButtons.raise.setEnabled(player.chips > callAmount);
        this.actionButtons.allIn.setEnabled(player.chips > 0);
    }
    
    hideActionButtons() {
        Object.values(this.actionButtons).forEach(button => {
            button.setVisible(false);
        });
    }
    
    playerFold() {
        this.audioManager.playSound('buttonClick');
        this.gameManager.processPlayerAction('fold');
    }
    
    playerCheck() {
        this.audioManager.playSound('buttonClick');
        this.gameManager.processPlayerAction('check');
    }
    
    playerAllIn() {
        this.audioManager.playSound('buttonClick');
        this.gameManager.processPlayerAction('allin');
    }
    
    showRaiseDialog() {
        const player = this.gameManager.players[0];
        const minRaise = this.gameManager.currentBet * 2;
        const maxRaise = player.chips + player.currentBet;
        
        // Simple raise dialog - for demo purposes, just raise by minimum
        const raiseAmount = Math.min(minRaise, maxRaise);
        this.gameManager.processPlayerAction('raise', raiseAmount);
    }
    
    // Menu and pause functionality
    togglePauseMenu() {
        if (this.pauseMenu) {
            this.hidePauseMenu();
        } else {
            this.showPauseMenu();
        }
    }
    
    showPauseMenu() {
        this.gameManager.pauseGame();
        
        const pauseOptions = [
            {
                text: 'Resume Game',
                callback: () => this.hidePauseMenu(),
                style: { backgroundColor: '#4CAF50' }
            },
            {
                text: 'Restart Game',
                callback: () => this.restartGame(),
                style: { backgroundColor: '#FF9800' }
            },
            {
                text: 'Settings',
                callback: () => this.showSettings(),
                style: { backgroundColor: '#2196F3' }
            },
            {
                text: 'Back to Menu',
                callback: () => this.returnToMenu(),
                style: { backgroundColor: '#757575' }
            },
            {
                text: 'Exit Game',
                callback: () => this.exitGame(),
                style: { backgroundColor: '#F44336' }
            }
        ];
        
        this.pauseMenu = new Dialog(
            this,
            'Game Paused',
            'Select an option:',
            pauseOptions
        );
        
        this.pauseMenu.show();
    }
    
    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.close();
            this.pauseMenu = null;
            this.gameManager.resumeGame();
        }
    }
    
    restartGame() {
        this.hidePauseMenu();
        this.gameManager.endGame();
        this.gameManager.startNewGame();
    }
    
    showSettings() {
        // Simple settings in pause menu
        console.log('Settings opened from pause menu');
    }
    
    returnToMenu() {
        this.audioManager.stopMusic();
        this.gameManager.endGame();
        this.scene.start('MenuScene');
    }
    
    exitGame() {
        this.audioManager.stopMusic();
        window.close();
    }
    
    // Multiplayer setup
    setupMultiplayer() {
        if (this.isHost) {
            // Start server logic would go here
            console.log('Setting up as host...');
        } else {
            // Connect to server logic would go here
            console.log('Connecting to server...');
        }
    }
    
    // Input handling methods
    isPlayerTurn() {
        return this.gameManager.isGameActive && 
               this.gameManager.currentPlayer === 0 && 
               !this.gameManager.isPaused;
    }
    
    confirmAction() {
        // Handle confirm action
    }
    
    togglePause() {
        this.togglePauseMenu();
    }
    
    updateHoverEffects(pointer) {
        // Handle hover effects
    }
    
    handleClick(pointer) {
        // Handle click events
    }
    
    destroy() {
        // Clean up
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.gameManager) {
            this.gameManager.endGame();
        }
        
        if (this.hud) {
            this.hud.destroy();
        }
        
        Object.values(this.actionButtons).forEach(button => {
            button.destroy();
        });
        
        if (this.pauseButton) {
            this.pauseButton.destroy();
        }
        
        if (this.startButton) {
            this.startButton.destroy();
        }
        
        super.destroy();
    }
}