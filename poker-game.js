/**
 * Texas Hold'em Poker Game - Using Real Assets
 * 8 players (1 human + 7 bots) poker game
 */

// Professional Texas Hold'em Poker Configuration
const CONFIG = {
    width: 1280,
    height: 720,
    backgroundColor: '#004d00',
    startingChips: 1500,     // Standard tournament starting chips
    smallBlind: 25,          // Professional blinds structure
    bigBlind: 50,
    ante: 0,                 // Ante for tournament play
    
    // Card display settings
    cardSize: {
        width: 50,           // Smaller card width
        height: 70,          // Smaller card height
        communityWidth: 60,  // Community cards slightly larger
        communityHeight: 84
    },
    
    // Layout improvements
    layout: {
        potTextSize: '20px',
        playerNameSize: '12px',
        chipsTextSize: '11px',
        buttonPadding: 10,
        cardSpacing: 25      // Space between player cards
    },
    
    blindLevels: [           // Tournament blind structure
        { level: 1, smallBlind: 25, bigBlind: 50, ante: 0 },
        { level: 2, smallBlind: 50, bigBlind: 100, ante: 0 },
        { level: 3, smallBlind: 75, bigBlind: 150, ante: 0 },
        { level: 4, smallBlind: 100, bigBlind: 200, ante: 25 },
        { level: 5, smallBlind: 150, bigBlind: 300, ante: 25 },
        { level: 6, smallBlind: 200, bigBlind: 400, ante: 50 },
        { level: 7, smallBlind: 300, bigBlind: 600, ante: 75 },
        { level: 8, smallBlind: 500, bigBlind: 1000, ante: 100 }
    ],
    blindIncreaseTime: 300000, // 5 minutes per level
    minRaise: 0,             // Minimum raise (calculated dynamically)
    maxPlayers: 8,
    minPlayersToStart: 2,
    playerPositions: [
        { x: 640, y: 600 }, // Human player (bottom center)
        { x: 320, y: 520 }, // Bot 1 (left)
        { x: 200, y: 360 }, // Bot 2 (left-top)
        { x: 320, y: 200 }, // Bot 3 (top-left)
        { x: 640, y: 120 }, // Bot 4 (top center)
        { x: 960, y: 200 }, // Bot 5 (top-right)
        { x: 1080, y: 360 }, // Bot 6 (right-top)
        { x: 960, y: 520 }  // Bot 7 (right)
    ]
};

// Card mapping for assets
const CARD_MAPPING = {
    'A': 'ace',
    'K': 'king', 
    'Q': 'queen',
    'J': 'jack',
    '10': '10',
    '9': '9',
    '8': '8', 
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

class PokerGame {
    constructor(isMultiplayer = false, multiplayerManager = null) {
        this.players = [];
        this.deck = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentPlayer = 0;
        this.dealerPosition = 0;
        this.gamePhase = 'preflop';
        this.currentBet = 0;
        this.gameHistory = [];
        this.gamesWon = 0;
        this.gamesLost = 0;
        
        // Professional poker features
        this.blindLevel = 1;
        this.currentSmallBlind = CONFIG.blindLevels[0].smallBlind;
        this.currentBigBlind = CONFIG.blindLevels[0].bigBlind;
        this.currentAnte = CONFIG.blindLevels[0].ante;
        this.blindTimer = 0;
        this.gameTimer = 0;
        this.minRaise = this.currentBigBlind;
        this.lastRaiseAmount = 0;
        this.actionHistory = [];
        this.sidePots = [];
        this.playersInHand = [];
        
        // Multiplayer properties
        this.isMultiplayer = isMultiplayer;
        this.multiplayerManager = multiplayerManager;
        this.myPlayerId = null;
        // If multiplayer, get myPlayerId from multiplayerManager
        if (isMultiplayer && multiplayerManager && multiplayerManager.socket) {
            this.myPlayerId = multiplayerManager.socket.id;
        }
        this.initPhaser();
    }

    initPhaser() {
        console.log('Initializing Phaser game...');
        const self = this;
        const config = {
            type: Phaser.AUTO,
            width: CONFIG.width,
            height: CONFIG.height,
            parent: 'gameContainer',
            backgroundColor: CONFIG.backgroundColor,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: {
                preload: function() { self.preload(this); },
                create: function() { self.create(this); },
                update: function() { self.update(this); }
            }
        };

        try {
            this.game = new Phaser.Game(config);
            console.log('Phaser game created successfully');
        } catch (error) {
            console.error('Failed to create Phaser game:', error);
        }
    }

    preload(scene) {
        console.log('Loading assets...');
        // Load poker table background
        scene.load.image('table', 'assets/table.png');
        // Load card back
        scene.load.image('card_back', 'assets/back-cards/back-blue.png');
        // Load all card faces
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                const cardName = CARD_MAPPING[rank];
                const fileName = `${cardName}_of_${suit}.svg`;
                const key = `card_${suit}_${rank}`;
                scene.load.image(key, `assets/cards/${fileName}`);
            });
        });
        // Load poker chips
        scene.load.image('chip_red', 'assets/chips/red.webp');
        scene.load.image('chip_green', 'assets/chips/green.webp');
        scene.load.image('chip_yellow', 'assets/chips/yellow.webp');
        scene.load.image('chip_purple', 'assets/chips/purple.webp');
        scene.load.image('chip_aqua', 'assets/chips/aquablue.webp');
        // Create loading text
        const loadingText = scene.add.text(CONFIG.width / 2, CONFIG.height / 2, 'Loading...', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        // Update loading progress
        scene.load.on('progress', (progress) => {
            loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
        });
        scene.load.on('complete', () => {
            loadingText.destroy();
        });
    }

    create(scene) {
        console.log('Game created');
        this.scene = scene; // Store scene reference
        // Create poker table background
        this.createTableBackground(scene);
        // Initialize game
        this.initializePlayers(scene);
        this.createUI(scene);
        // Start first game
        if (!this.isMultiplayer) {
            setTimeout(() => {
                this.startNewGame();
            }, 1000);
        }
        console.log('Game initialization complete');
    }

    createTableBackground(scene) {
        // Add table background image
        const table = scene.add.image(CONFIG.width / 2, CONFIG.height / 2, 'table');
        table.setDisplaySize(CONFIG.width, CONFIG.height);
        // If no table image, create simple background
        if (!scene.textures.exists('table')) {
            const bg = scene.add.graphics();
            bg.fillStyle(0x004d00);
            bg.fillRect(0, 0, CONFIG.width, CONFIG.height);
            // Poker table ellipse
            bg.fillStyle(0x006600);
            bg.fillEllipse(CONFIG.width / 2, CONFIG.height / 2, 800, 400);
            // Table border
            bg.lineStyle(8, 0x8B4513);
            bg.strokeEllipse(CONFIG.width / 2, CONFIG.height / 2, 800, 400);
        }
    }

    initializePlayers(scene) {
        console.log('Initializing players...');
        let playerList;
        if (this.isMultiplayer && this.multiplayerManager && this.multiplayerManager.gameState && Array.isArray(this.multiplayerManager.gameState.players)) {
            playerList = this.multiplayerManager.gameState.players;
        } else {
            playerList = [
                { name: 'You', chips: CONFIG.startingChips },
                { name: 'Alice', chips: CONFIG.startingChips },
                { name: 'Bob', chips: CONFIG.startingChips },
                { name: 'Charlie', chips: CONFIG.startingChips },
                { name: 'Diana', chips: CONFIG.startingChips },
                { name: 'Eve', chips: CONFIG.startingChips },
                { name: 'Frank', chips: CONFIG.startingChips },
                { name: 'Grace', chips: CONFIG.startingChips }
            ];
        }
        const avatarColors = [0x4CAF50, 0x2196F3, 0xFF9800, 0x9C27B0, 0xF44336, 0x00BCD4, 0x795548, 0x607D8B];
        for (let i = 0; i < playerList.length; i++) {
            const playerData = playerList[i];
            const player = {
                id: playerData.id !== undefined ? playerData.id : i,
                name: playerData.name || `Player ${i+1}`,
                chips: playerData.chips,
                cards: playerData.cards || [],
                isHuman: (!this.isMultiplayer && i === 0) || (this.isMultiplayer && playerData.id === this.myPlayerId),
                isActive: true,
                hasActed: false,
                currentBet: 0,
                isAllIn: false,
                isFolded: false,
                position: CONFIG.playerPositions[i],
                // Visual elements
                avatar: null,
                nameText: null,
                chipsText: null,
                cardsSprites: [],
                actionIndicator: null
            };
            // Create avatar (simple colored circle)
            const avatar = scene.add.graphics();
            avatar.fillStyle(avatarColors[i % avatarColors.length]);
            avatar.fillCircle(0, 0, 25);
            avatar.lineStyle(3, 0xffffff);
            avatar.strokeCircle(0, 0, 25);
            avatar.x = player.position.x;
            avatar.y = player.position.y - 60;
            player.avatar = avatar;
            // Player name
            player.nameText = scene.add.text(player.position.x, player.position.y - 110, player.name, {
                fontSize: CONFIG.layout.playerNameSize,
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            // Chips display
            player.chipsText = scene.add.text(player.position.x, player.position.y - 20, `$${player.chips}`, {
                fontSize: CONFIG.layout.chipsTextSize,
                fill: '#ffff00',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            // Action indicator
            player.actionIndicator = scene.add.graphics();
            player.actionIndicator.lineStyle(4, 0x00ff00);
            player.actionIndicator.strokeCircle(player.position.x, player.position.y - 60, 30);
            player.actionIndicator.setVisible(false);
            this.players.push(player);
        }
    }

    createUI(scene) {
        console.log('Creating UI...');
        
        // Pot display in center - smaller size
        this.potText = scene.add.text(CONFIG.width / 2, CONFIG.height / 2 - 50, 'Pot: $0', {
            fontSize: CONFIG.layout.potTextSize,
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // Game phase indicator
        this.phaseText = scene.add.text(CONFIG.width / 2, 50, 'Ready to Play', {
            fontSize: '16px',
            fill: '#00ff88',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Settings button
        this.settingsButton = scene.add.text(CONFIG.width - 80, 30, '⚙️ Settings', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.showSettingsMenu())
        .on('pointerover', () => this.settingsButton.setStyle({ backgroundColor: '#555555' }))
        .on('pointerout', () => this.settingsButton.setStyle({ backgroundColor: '#333333' }));

        // Notification area for win/loss messages
        this.notificationText = scene.add.text(CONFIG.width / 2, CONFIG.height - 150, '', {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setVisible(false);

        // Action buttons for human player
        this.createActionButtons(scene);

        // Community cards area
        this.communityCardsGroup = scene.add.group();
    }

    createActionButtons(scene) {
        const buttonY = CONFIG.height - 80;
        const buttonStyle = {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        };

        // Check/Call button
        this.checkCallButton = scene.add.text(400, buttonY, 'Check', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.playerAction('check'))
            .on('pointerover', () => this.checkCallButton.setStyle({ backgroundColor: '#555555' }))
            .on('pointerout', () => this.checkCallButton.setStyle({ backgroundColor: '#333333' }));

        // Raise button
        this.raiseButton = scene.add.text(520, buttonY, 'Raise', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.showRaiseInput())
            .on('pointerover', () => this.raiseButton.setStyle({ backgroundColor: '#555555' }))
            .on('pointerout', () => this.raiseButton.setStyle({ backgroundColor: '#333333' }));

        // Fold button
        this.foldButton = scene.add.text(640, buttonY, 'Fold', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.playerAction('fold'))
            .on('pointerover', () => this.foldButton.setStyle({ backgroundColor: '#555555' }))
            .on('pointerout', () => this.foldButton.setStyle({ backgroundColor: '#333333' }));

        // All-in button
        this.allInButton = scene.add.text(740, buttonY, 'All-In', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.playerAction('allin'))
            .on('pointerover', () => this.allInButton.setStyle({ backgroundColor: '#555555' }))
            .on('pointerout', () => this.allInButton.setStyle({ backgroundColor: '#333333' }));

        this.actionButtons = [this.checkCallButton, this.raiseButton, this.foldButton, this.allInButton];
        this.hideActionButtons();
    }

    showActionButtons() {
        this.actionButtons.forEach(button => button.setVisible(true));
        
        // Update check/call button text
        const callAmount = this.currentBet - this.players[0].currentBet;
        if (callAmount > 0) {
            this.checkCallButton.setText(`Call $${callAmount}`);
        } else {
            this.checkCallButton.setText('Check');
        }
    }

    hideActionButtons() {
        this.actionButtons.forEach(button => button.setVisible(false));
    }

    showRaiseInput() {
        const raiseAmount = prompt('Enter raise amount:', Math.max(this.currentBet * 2, CONFIG.bigBlind));
        if (raiseAmount && !isNaN(raiseAmount)) {
            this.playerAction('raise', parseInt(raiseAmount));
        }
    }

    startNewGame() {
        console.log('Starting new game...');
        
        // Reset game state
        this.pot = 0;
        this.communityCards = [];
        this.gamePhase = 'preflop';
        this.currentBet = 0;

        // Reset players
        this.players.forEach(player => {
            player.cards = [];
            player.currentBet = 0;
            player.hasActed = false;
            player.isAllIn = false;
            player.isFolded = false;
            player.cardsSprites.forEach(sprite => sprite.destroy());
            player.cardsSprites = [];
            player.actionIndicator.setVisible(false);
        });

        // Clear community cards
        this.communityCardsGroup.clear(true, true);

        // Create and shuffle deck
        this.createDeck();
        this.shuffleDeck();

        // Post blinds
        this.postBlinds();

        // Deal hole cards
        setTimeout(() => {
            this.dealHoleCards();
        }, 1000);

        // Start betting round
        setTimeout(() => {
            this.startBettingRound();
        }, 3000);
    }
    
    showWinNotification(amount, handType) {
        const message = `YOU WIN!\n+${amount} chips\nWith ${handType}`;
        this.showNotification(message, '#00ff00', 3000);
        
        // Update statistics
        this.gamesWon++;
    }
    
    showLossNotification(lostAmount, winnerName, handType) {
        const message = `${winnerName} wins\n-${lostAmount} chips\nWith ${handType}`;
        this.showNotification(message, '#ff0000', 3000);
        
        // Update statistics
        this.gamesLost++;
    }
    
    showNotification(message, color = '#ffffff', duration = 2000) {
        // Remove existing notification if any
        if (this.notificationText) {
            this.notificationText.destroy();
        }
        
        // Create notification text
        this.notificationText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 100,
            message,
            {
                fontSize: `${CONFIG.layout.notificationSize}px`,
                fontFamily: 'Arial Black',
                color: color,
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(1000);
        
        // Animate notification
        this.tweens.add({
            targets: this.notificationText,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.out',
            yoyo: false,
            onComplete: () => {
                // Keep visible for duration, then fade out
                this.tweens.add({
                    targets: this.notificationText,
                    alpha: 0,
                    scale: 0.8,
                    duration: 500,
                    delay: duration - 800,
                    ease: 'Power2.out',
                    onComplete: () => {
                        if (this.notificationText) {
                            this.notificationText.destroy();
                            this.notificationText = null;
                        }
                    }
                });
            }
        });
    }

    createDeck() {
        this.deck = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                this.deck.push({ suit, rank, value: RANK_VALUES[rank] });
            });
        });
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    postBlinds() {
        console.log('Posting blinds...');
        const smallBlindPos = (this.dealerPosition + 1) % 8;
        const bigBlindPos = (this.dealerPosition + 2) % 8;

        // Small blind
        this.players[smallBlindPos].currentBet = CONFIG.smallBlind;
        this.players[smallBlindPos].chips -= CONFIG.smallBlind;
        this.pot += CONFIG.smallBlind;

        // Big blind
        this.players[bigBlindPos].currentBet = CONFIG.bigBlind;
        this.players[bigBlindPos].chips -= CONFIG.bigBlind;
        this.pot += CONFIG.bigBlind;

        this.currentBet = CONFIG.bigBlind;
        this.currentPlayer = (bigBlindPos + 1) % 8;

        this.updateChipsDisplay();
        this.updatePotDisplay();
    }

    dealHoleCards() {
        console.log('Dealing hole cards...');
        
        // Deal 2 cards to each player with animation
        for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
            for (let playerIndex = 0; playerIndex < 8; playerIndex++) {
                const player = this.players[playerIndex];
                if (!player.isActive) continue;

                const card = this.deck.pop();
                player.cards.push(card);

                // Create card sprite with animation
                setTimeout(() => {
                    this.dealCardToPlayer(player, card, cardIndex);
                }, (playerIndex * 8 + cardIndex) * 150);
            }
        }
    }

    dealCardToPlayer(player, card, cardIndex) {
        const isHuman = player.isHuman;
        const textureKey = isHuman ? `card_${card.suit}_${card.rank}` : 'card_back';
        
        const cardSprite = this.scene.add.image(CONFIG.width / 2, CONFIG.height / 2, textureKey);
        cardSprite.setDisplaySize(CONFIG.cardSize.width, CONFIG.cardSize.height);
        cardSprite.setAlpha(0);
        
        const targetX = player.position.x + (cardIndex - 0.5) * CONFIG.layout.cardSpacing;
        const targetY = player.position.y + 20;

        // Flying animation
        this.scene.tweens.add({
            targets: cardSprite,
            x: targetX,
            y: targetY,
            alpha: 1,
            rotation: Math.random() * 0.2 - 0.1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Small bounce effect
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100,
                    yoyo: true
                });
            }
        });

        player.cardsSprites.push(cardSprite);
    }

    startBettingRound() {
        console.log('Starting betting round:', this.gamePhase);
        this.phaseText.setText(`${this.gamePhase.charAt(0).toUpperCase() + this.gamePhase.slice(1)}`);
        
        // Reset hasActed for new betting round
        this.players.forEach(player => {
            if (!player.isFolded && !player.isAllIn) {
                player.hasActed = false;
            }
        });

        this.nextPlayer();
    }

    nextPlayer() {
        // Find next active player
        let attempts = 0;
        do {
            this.currentPlayer = (this.currentPlayer + 1) % 8;
            attempts++;
        } while ((this.players[this.currentPlayer].isFolded || 
                 this.players[this.currentPlayer].isAllIn) && attempts < 8);

        // Check if betting round is complete
        if (this.isBettingRoundComplete()) {
            this.completeBettingRound();
            return;
        }

        // Show action indicator
        this.players.forEach(player => player.actionIndicator.setVisible(false));
        this.players[this.currentPlayer].actionIndicator.setVisible(true);

        // Handle player action
        if (this.players[this.currentPlayer].isHuman) {
            this.showActionButtons();
        } else {
            // Bot action with delay
            setTimeout(() => {
                this.botAction();
            }, 1000);
        }
    }

    isBettingRoundComplete() {
        const activePlayers = this.players.filter(p => !p.isFolded && !p.isAllIn);
        
        if (activePlayers.length <= 1) return true;
        
        const allActed = activePlayers.every(p => p.hasActed);
        const allBetsEqual = activePlayers.every(p => p.currentBet === this.currentBet);
        
        return allActed && allBetsEqual;
    }

    completeBettingRound() {
        // Hide action indicators
        this.players.forEach(player => player.actionIndicator.setVisible(false));
        
        // Move to next phase
        switch (this.gamePhase) {
            case 'preflop':
                this.dealFlop();
                break;
            case 'flop':
                this.dealTurn();
                break;
            case 'turn':
                this.dealRiver();
                break;
            case 'river':
                this.showdown();
                break;
        }
    }

    dealFlop() {
        this.gamePhase = 'flop';
        this.phaseText.setText('Flop');
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;

        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
        });

        // Burn one card
        this.deck.pop();

        // Deal 3 community cards
        for (let i = 0; i < 3; i++) {
            const card = this.deck.pop();
            this.communityCards.push(card);
            setTimeout(() => {
                this.dealCommunityCard(card, i);
            }, i * 300);
        }

        setTimeout(() => {
            this.startBettingRound();
        }, 1500);
    }

    dealTurn() {
        this.gamePhase = 'turn';
        this.phaseText.setText('Turn');
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;

        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
        });

        // Burn one card
        this.deck.pop();

        // Deal 1 community card
        const card = this.deck.pop();
        this.communityCards.push(card);
        this.dealCommunityCard(card, 3);

        setTimeout(() => {
            this.startBettingRound();
        }, 1000);
    }

    dealRiver() {
        this.gamePhase = 'river';
        this.phaseText.setText('River');
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;

        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
        });

        // Burn one card
        this.deck.pop();

        // Deal 1 community card
        const card = this.deck.pop();
        this.communityCards.push(card);
        this.dealCommunityCard(card, 4);

        setTimeout(() => {
            this.startBettingRound();
        }, 1000);
    }

    dealCommunityCard(card, index) {
        const cardSprite = this.scene.add.image(CONFIG.width / 2, CONFIG.height / 2, `card_${card.suit}_${card.rank}`);
        cardSprite.setDisplaySize(CONFIG.cardSize.communityWidth, CONFIG.cardSize.communityHeight);
        cardSprite.setAlpha(0);
        
        const targetX = CONFIG.width / 2 - 140 + (index * 60);
        const targetY = CONFIG.height / 2;

        this.scene.tweens.add({
            targets: cardSprite,
            x: targetX,
            y: targetY,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
            }
        });

        this.communityCardsGroup.add(cardSprite);
    }

    playerAction(action, amount = 0) {
        // In multiplayer mode, send action to server
        if (this.isMultiplayer && this.multiplayerManager) {
            this.multiplayerManager.sendPlayerAction(action, amount);
            return;
        }
        
        const player = this.players[0]; // Human player
        
        switch (action) {
            case 'check':
                if (this.currentBet === player.currentBet) {
                    player.hasActed = true;
                } else {
                    // Call
                    const callAmount = this.currentBet - player.currentBet;
                    const actualCall = Math.min(callAmount, player.chips);
                    player.currentBet += actualCall;
                    player.chips -= actualCall;
                    this.pot += actualCall;
                    player.hasActed = true;
                    
                    if (player.chips === 0) {
                        player.isAllIn = true;
                    }
                }
                break;
                
            case 'raise':
                const raiseAmount = Math.min(amount, player.chips + player.currentBet);
                const additionalBet = raiseAmount - player.currentBet;
                player.chips -= additionalBet;
                this.pot += additionalBet;
                player.currentBet = raiseAmount;
                this.currentBet = raiseAmount;
                player.hasActed = true;
                
                // Reset other players' hasActed status
                this.players.forEach(p => {
                    if (p !== player && !p.isFolded && !p.isAllIn) {
                        p.hasActed = false;
                    }
                });
                
                if (player.chips === 0) {
                    player.isAllIn = true;
                }
                break;
                
            case 'fold':
                player.isFolded = true;
                player.hasActed = true;
                // Fade out cards
                player.cardsSprites.forEach(sprite => {
                    this.scene.tweens.add({
                        targets: sprite,
                        alpha: 0.3,
                        duration: 300
                    });
                });
                break;
                
            case 'allin':
                const allInAmount = player.chips + player.currentBet;
                const additionalAllIn = player.chips;
                player.chips = 0;
                this.pot += additionalAllIn;
                player.currentBet = allInAmount;
                player.isAllIn = true;
                player.hasActed = true;
                
                if (allInAmount > this.currentBet) {
                    this.currentBet = allInAmount;
                    this.players.forEach(p => {
                        if (p !== player && !p.isFolded && !p.isAllIn) {
                            p.hasActed = false;
                        }
                    });
                }
                break;
        }

        this.updateChipsDisplay();
        this.updatePotDisplay();
        this.hideActionButtons();
        this.nextPlayer();
    }

    botAction() {
        const bot = this.players[this.currentPlayer];
        const handStrength = this.evaluateHandStrength(bot.cards, this.communityCards);
        const callAmount = this.currentBet - bot.currentBet;
        
        let action = 'fold';
        
        // Simple bot AI based on hand strength
        if (handStrength >= 0.8) {
            // Strong hand - raise or call
            if (Math.random() > 0.5 && bot.chips > callAmount * 2) {
                action = 'raise';
            } else {
                action = 'call';
            }
        } else if (handStrength >= 0.6) {
            // Medium hand - call or check
            if (callAmount === 0) {
                action = 'check';
            } else if (Math.random() > 0.3) {
                action = 'call';
            }
        } else if (handStrength >= 0.4) {
            // Weak hand - check or fold
            if (callAmount === 0) {
                action = 'check';
            } else if (Math.random() > 0.7) {
                action = 'call';
            }
        }

        // Execute action
        switch (action) {
            case 'check':
                bot.hasActed = true;
                break;
                
            case 'call':
                const actualCall = Math.min(callAmount, bot.chips);
                bot.currentBet += actualCall;
                bot.chips -= actualCall;
                this.pot += actualCall;
                bot.hasActed = true;
                
                if (bot.chips === 0) {
                    bot.isAllIn = true;
                }
                break;
                
            case 'raise':
                const raiseAmount = Math.min(this.currentBet * 2, bot.chips + bot.currentBet);
                const additionalBet = raiseAmount - bot.currentBet;
                bot.chips -= additionalBet;
                this.pot += additionalBet;
                bot.currentBet = raiseAmount;
                this.currentBet = raiseAmount;
                bot.hasActed = true;
                
                // Reset other players' hasActed status
                this.players.forEach(p => {
                    if (p !== bot && !p.isFolded && !p.isAllIn) {
                        p.hasActed = false;
                    }
                });
                
                if (bot.chips === 0) {
                    bot.isAllIn = true;
                }
                break;
                
            case 'fold':
                bot.isFolded = true;
                bot.hasActed = true;
                // Fade out cards
                bot.cardsSprites.forEach(sprite => {
                    this.scene.tweens.add({
                        targets: sprite,
                        alpha: 0.3,
                        duration: 300
                    });
                });
                break;
        }

        this.updateChipsDisplay();
        this.updatePotDisplay();
        this.nextPlayer();
    }

    // Professional Texas Hold'em Hand Evaluation
    evaluateHandStrength(playerCards, communityCards) {
        const allCards = [...playerCards, ...communityCards];
        if (allCards.length < 5) {
            // Pre-flop evaluation based on hole cards
            return this.evaluatePreFlop(playerCards);
        }
        
        // Find best 5-card hand
        const bestHand = this.findBestHand(allCards);
        return this.getHandRank(bestHand);
    }

    evaluatePreFlop(holeCards) {
        const [card1, card2] = holeCards;
        const val1 = RANK_VALUES[card1.rank];
        const val2 = RANK_VALUES[card2.rank];
        const maxVal = Math.max(val1, val2);
        const minVal = Math.min(val1, val2);
        const isPair = val1 === val2;
        const isSuited = card1.suit === card2.suit;
        const isConnected = Math.abs(val1 - val2) === 1;
        
        // Premium hands
        if (isPair && maxVal >= 10) return 0.9; // TT+
        if (isPair && maxVal >= 7) return 0.75; // 77-99
        if (isPair) return 0.6; // 22-66
        
        // Suited connectors and high cards
        if (isSuited && isConnected && maxVal >= 10) return 0.8; // AKs, KQs, etc.
        if (maxVal === 14 && minVal >= 10) return 0.75; // AK, AQ, AJ, AT
        if (maxVal >= 12 && minVal >= 10) return 0.65; // KQ, KJ, QJ
        if (isSuited && maxVal >= 12) return 0.6; // Suited high cards
        if (isConnected && maxVal >= 8) return 0.5; // Connectors
        
        return Math.min(0.4, (val1 + val2) / 28); // Low cards
    }

    findBestHand(cards) {
        // Generate all possible 5-card combinations
        const combinations = this.getCombinations(cards, 5);
        let bestHand = null;
        let bestRank = 0;
        
        combinations.forEach(hand => {
            const rank = this.getHandRank(hand);
            if (rank > bestRank) {
                bestRank = rank;
                bestHand = hand;
            }
        });
        
        return bestHand;
    }

    getHandRank(hand) {
        if (this.isRoyalFlush(hand)) return 9;
        if (this.isStraightFlush(hand)) return 8;
        if (this.isFourOfAKind(hand)) return 7;
        if (this.isFullHouse(hand)) return 6;
        if (this.isFlush(hand)) return 5;
        if (this.isStraight(hand)) return 4;
        if (this.isThreeOfAKind(hand)) return 3;
        if (this.isTwoPair(hand)) return 2;
        if (this.isPair(hand)) return 1;
        return 0; // High card
    }

    isRoyalFlush(hand) {
        return this.isFlush(hand) && this.hasSequence(hand, [10, 11, 12, 13, 14]);
    }

    isStraightFlush(hand) {
        return this.isFlush(hand) && this.isStraight(hand);
    }

    isFourOfAKind(hand) {
        const ranks = this.getRankCounts(hand);
        return Object.values(ranks).includes(4);
    }

    isFullHouse(hand) {
        const ranks = this.getRankCounts(hand);
        const counts = Object.values(ranks).sort((a, b) => b - a);
        return counts[0] === 3 && counts[1] === 2;
    }

    isFlush(hand) {
        const suits = hand.map(card => card.suit);
        return new Set(suits).size === 1;
    }

    isStraight(hand) {
        const values = hand.map(card => RANK_VALUES[card.rank]).sort((a, b) => a - b);
        // Check for regular straight
        for (let i = 0; i < 4; i++) {
            if (values[i + 1] - values[i] !== 1) {
                // Check for A-2-3-4-5 straight (wheel)
                if (!(values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14)) {
                    return false;
                }
            }
        }
        return true;
    }

    isThreeOfAKind(hand) {
        const ranks = this.getRankCounts(hand);
        return Object.values(ranks).includes(3);
    }

    isTwoPair(hand) {
        const ranks = this.getRankCounts(hand);
        const pairs = Object.values(ranks).filter(count => count === 2);
        return pairs.length === 2;
    }

    isPair(hand) {
        const ranks = this.getRankCounts(hand);
        return Object.values(ranks).includes(2);
    }

    getRankCounts(hand) {
        const counts = {};
        hand.forEach(card => {
            counts[card.rank] = (counts[card.rank] || 0) + 1;
        });
        return counts;
    }

    hasSequence(hand, sequence) {
        const values = hand.map(card => RANK_VALUES[card.rank]).sort((a, b) => a - b);
        return sequence.every(val => values.includes(val));
    }

    getCombinations(arr, size) {
        if (size > arr.length) return [];
        if (size === 1) return arr.map(item => [item]);
        
        const combinations = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
            tailCombinations.forEach(tail => combinations.push([head, ...tail]));
        }
        return combinations;
    }

    showdown() {
        this.phaseText.setText('Showdown');
        
        // Reveal all player cards
        this.players.forEach(player => {
            if (!player.isFolded && player.cards.length === 2) {
                player.cardsSprites.forEach((sprite, index) => {
                    if (!player.isHuman) {
                        const card = player.cards[index];
                        sprite.setTexture(`card_${card.suit}_${card.rank}`);
                    }
                });
            }
        });

        // Determine winner (simplified)
        setTimeout(() => {
            this.determineWinner();
        }, 2000);
    }

    determineWinner() {
        const activePlayers = this.players.filter(p => !p.isFolded);
        
        // Evaluate all active players' hands
        const playerHands = activePlayers.map(player => {
            const bestHand = this.findBestHand([...player.cards, ...this.communityCards]);
            const handRank = this.getHandRank(bestHand);
            const handName = this.getHandName(bestHand);
            
            return {
                player: player,
                hand: bestHand,
                rank: handRank,
                name: handName,
                tiebreaker: this.getTiebreaker(bestHand, handRank)
            };
        });
        
        // Sort by hand rank and tiebreakers
        playerHands.sort((a, b) => {
            if (a.rank !== b.rank) return b.rank - a.rank;
            return b.tiebreaker - a.tiebreaker;
        });
        
        const winner = playerHands[0];
        
        // Check for ties
        const winners = playerHands.filter(ph => 
            ph.rank === winner.rank && ph.tiebreaker === winner.tiebreaker
        );
        
        if (winners.length > 1) {
            // Split pot
            const splitAmount = Math.floor(this.pot / winners.length);
            const humanPlayer = this.players.find(p => p.isHuman);
            const humanWon = winners.some(w => w.player.isHuman);
            
            winners.forEach(w => {
                w.player.chips += splitAmount;
            });
            
            this.phaseText.setText(`Split Pot! ${winners.map(w => w.player.name).join(', ')} win with ${winner.name}`);
            
            if (humanWon) {
                this.showWinNotification(splitAmount, `Split ${winner.name}`);
            } else {
                this.showLossNotification(humanPlayer.currentBet, winners[0].player.name, winner.name);
            }
        } else {
            // Single winner
            const humanPlayer = this.players.find(p => p.isHuman);
            
            winner.player.chips += this.pot;
            this.highlightWinner(winner.player);
            this.phaseText.setText(`${winner.player.name} wins with ${winner.name}!`);
            
            if (winner.player.isHuman) {
                this.showWinNotification(this.pot, winner.name);
            } else {
                this.showLossNotification(humanPlayer.currentBet, winner.player.name, winner.name);
            }
        }
        
        this.updateChipsDisplay();
        this.updateStatistics();
        
        // Start new game after delay
        setTimeout(() => {
            this.startNewGame();
        }, 5000);
    }

    getHandName(hand) {
        if (this.isRoyalFlush(hand)) return 'Royal Flush';
        if (this.isStraightFlush(hand)) return 'Straight Flush';
        if (this.isFourOfAKind(hand)) return 'Four of a Kind';
        if (this.isFullHouse(hand)) return 'Full House';
        if (this.isFlush(hand)) return 'Flush';
        if (this.isStraight(hand)) return 'Straight';
        if (this.isThreeOfAKind(hand)) return 'Three of a Kind';
        if (this.isTwoPair(hand)) return 'Two Pair';
        if (this.isPair(hand)) return 'Pair';
        return 'High Card';
    }

    getTiebreaker(hand, rank) {
        const values = hand.map(card => RANK_VALUES[card.rank]).sort((a, b) => b - a);
        
        switch (rank) {
            case 7: // Four of a kind
                const fourRank = this.getFourOfAKindRank(hand);
                const kicker = values.find(v => v !== fourRank);
                return fourRank * 100 + kicker;
                
            case 6: // Full house
                const threeRank = this.getThreeOfAKindRank(hand);
                const pairRank = this.getPairRank(hand, threeRank);
                return threeRank * 100 + pairRank;
                
            case 3: // Three of a kind
                const trips = this.getThreeOfAKindRank(hand);
                const kickers = values.filter(v => v !== trips).slice(0, 2);
                return trips * 10000 + kickers[0] * 100 + kickers[1];
                
            case 2: // Two pair
                const pairs = this.getTwoPairRanks(hand);
                const kicker2 = values.find(v => !pairs.includes(v));
                return Math.max(...pairs) * 10000 + Math.min(...pairs) * 100 + kicker2;
                
            case 1: // Pair
                const pair = this.getPairRank(hand);
                const pairKickers = values.filter(v => v !== pair).slice(0, 3);
                return pair * 1000000 + pairKickers[0] * 10000 + pairKickers[1] * 100 + pairKickers[2];
                
            default: // High card, flush, straight
                return values[0] * 100000000 + values[1] * 1000000 + values[2] * 10000 + values[3] * 100 + values[4];
        }
    }

    getFourOfAKindRank(hand) {
        const ranks = this.getRankCounts(hand);
        return RANK_VALUES[Object.keys(ranks).find(rank => ranks[rank] === 4)];
    }

    getThreeOfAKindRank(hand) {
        const ranks = this.getRankCounts(hand);
        return RANK_VALUES[Object.keys(ranks).find(rank => ranks[rank] === 3)];
    }

    getPairRank(hand, exclude = null) {
        const ranks = this.getRankCounts(hand);
        const pairRank = Object.keys(ranks).find(rank => 
            ranks[rank] === 2 && RANK_VALUES[rank] !== exclude
        );
        return pairRank ? RANK_VALUES[pairRank] : 0;
    }

    getTwoPairRanks(hand) {
        const ranks = this.getRankCounts(hand);
        return Object.keys(ranks)
            .filter(rank => ranks[rank] === 2)
            .map(rank => RANK_VALUES[rank]);
    }

    updateGameStatistics(winner) {
        // Update statistics
        if (winner.player.isHuman) {
            this.gamesWon++;
        } else {
            this.gamesLost++;
        }
        
        this.updateChipsDisplay();
        this.updateStatistics();
        
        // Start new game after delay
        setTimeout(() => {
            this.dealerPosition = (this.dealerPosition + 1) % 8;
            this.startNewGame();
        }, 5000);
    }

    highlightWinner(winner) {
        const highlight = this.scene.add.graphics();
        highlight.lineStyle(6, 0xffff00);
        highlight.strokeCircle(winner.position.x, winner.position.y - 60, 35);
        
        const winnerText = this.scene.add.text(winner.position.x, winner.position.y - 140, 'WINNER!', {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Animate
        this.scene.tweens.add({
            targets: [highlight, winnerText],
            alpha: { from: 1, to: 0.3 },
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: 8,
            onComplete: () => {
                highlight.destroy();
                winnerText.destroy();
            }
        });
    }

    updateChipsDisplay() {
        this.players.forEach(player => {
            player.chipsText.setText(`$${player.chips}`);
        });
        
        // Update external UI
        const currentChipsElement = document.getElementById('currentChips');
        if (currentChipsElement) {
            currentChipsElement.textContent = this.players[0].chips.toLocaleString();
        }
    }

    updatePotDisplay() {
        this.potText.setText(`Pot: $${this.pot}`);
        
        // Update external UI
        const potElement = document.getElementById('potSize');
        if (potElement) {
            potElement.textContent = this.pot.toLocaleString();
        }
    }

    updateStats() {
        const gamesPlayedElement = document.getElementById('gamesPlayed');
        const gamesWonElement = document.getElementById('gamesWon');
        
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = this.gamesWon + this.gamesLost;
        }
        
        if (gamesWonElement) {
            gamesWonElement.textContent = this.gamesWon;
        }
    }

    update(scene) {
        // Game update loop
    }

    // Settings Menu
    showSettingsMenu() {
        // Create settings overlay
        if (this.settingsOverlay) {
            this.settingsOverlay.setVisible(true);
            return;
        }

        this.settingsOverlay = this.scene.add.container(CONFIG.width / 2, CONFIG.height / 2);

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(-200, -150, 400, 300);
        bg.lineStyle(2, 0x4CAF50);
        bg.strokeRect(-200, -150, 400, 300);

        // Title
        const title = this.scene.add.text(0, -120, 'Game Settings', {
            fontSize: '20px',
            fill: '#4CAF50',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Card size options
        const cardSizeText = this.scene.add.text(0, -80, 'Card Size:', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const smallCardsBtn = this.scene.add.text(-60, -50, 'Small', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setCardSize('small'));

        const mediumCardsBtn = this.scene.add.text(0, -50, 'Medium', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setCardSize('medium'));

        const largeCardsBtn = this.scene.add.text(60, -50, 'Large', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setCardSize('large'));

        // Blind level options
        const blindText = this.scene.add.text(0, -10, 'Blind Levels:', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const slowBlindsBtn = this.scene.add.text(-60, 20, 'Slow', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setBlindSpeed('slow'));

        const normalBlindsBtn = this.scene.add.text(0, 20, 'Normal', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setBlindSpeed('normal'));

        const fastBlindsBtn = this.scene.add.text(60, 20, 'Fast', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.setBlindSpeed('fast'));

        // Close button
        const closeBtn = this.scene.add.text(0, 100, 'Close', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#666666',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.hideSettingsMenu());

        this.settingsOverlay.add([bg, title, cardSizeText, smallCardsBtn, mediumCardsBtn, largeCardsBtn,
                                  blindText, slowBlindsBtn, normalBlindsBtn, fastBlindsBtn, closeBtn]);
    }

    hideSettingsMenu() {
        if (this.settingsOverlay) {
            this.settingsOverlay.setVisible(false);
        }
    }

    setCardSize(size) {
        switch(size) {
            case 'small':
                CONFIG.cardSize.width = 40;
                CONFIG.cardSize.height = 56;
                CONFIG.cardSize.communityWidth = 50;
                CONFIG.cardSize.communityHeight = 70;
                break;
            case 'medium':
                CONFIG.cardSize.width = 50;
                CONFIG.cardSize.height = 70;
                CONFIG.cardSize.communityWidth = 60;
                CONFIG.cardSize.communityHeight = 84;
                break;
            case 'large':
                CONFIG.cardSize.width = 60;
                CONFIG.cardSize.height = 84;
                CONFIG.cardSize.communityWidth = 70;
                CONFIG.cardSize.communityHeight = 98;
                break;
        }
        this.showNotification(`Card size set to ${size}`);
        this.hideSettingsMenu();
    }

    setBlindSpeed(speed) {
        switch(speed) {
            case 'slow':
                CONFIG.blindIncreaseTime = 600000; // 10 minutes
                break;
            case 'normal':
                CONFIG.blindIncreaseTime = 300000; // 5 minutes
                break;
            case 'fast':
                CONFIG.blindIncreaseTime = 120000; // 2 minutes
                break;
        }
        this.showNotification(`Blind speed set to ${speed}`);
        this.hideSettingsMenu();
    }
    
    // Multiplayer methods
    updateFromMultiplayer(gameState) {
        if (!this.isMultiplayer) return;
        
        // Implementation for multiplayer updates
        console.log('Updating from multiplayer state:', gameState);
    }
}

// Make PokerGame available globally
window.PokerGame = PokerGame;

console.log('PokerGame with real assets loaded and available globally');
