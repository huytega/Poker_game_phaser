/**
 * Game Manager Class
 * Handles game logic, state management, and flow control
 */

import { CONFIG } from '../config/GameConfig.js';
import { Player } from '../entities/Player.js';
import { Deck } from '../entities/Card.js';

export class GameManager {
    constructor(scene) {
        this.scene = scene;
        this.players = [];
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentPlayer = 0;
        this.dealerPosition = 0;
        this.gamePhase = 'waiting'; // waiting, preflop, flop, turn, river, showdown
        this.currentBet = 0;
        this.smallBlind = CONFIG.POKER.SMALL_BLIND;
        this.bigBlind = CONFIG.POKER.BIG_BLIND;
        this.gameHistory = [];
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.isGameActive = false;
        this.isPaused = false;
    }
    
    initializePlayers() {
        const playerNames = ['You', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace'];
        this.players = [];
        
        for (let i = 0; i < CONFIG.POKER.MAX_PLAYERS; i++) {
            const player = new Player(
                i,
                playerNames[i],
                CONFIG.PLAYER_POSITIONS[i],
                i === 0 // First player is human
            );
            player.chips = CONFIG.POKER.STARTING_CHIPS;
            this.players.push(player);
        }
    }
    
    startNewGame() {
        console.log('Starting new poker game...');
        this.isGameActive = true;
        this.isPaused = false;
        
        // Reset game state
        this.pot = 0;
        this.communityCards = [];
        this.gamePhase = 'preflop';
        this.currentBet = 0;
        
        // Reset players
        this.players.forEach(player => player.reset());
        
        // Create and shuffle deck
        this.deck.create(CONFIG.SUITS, CONFIG.RANKS, CONFIG.RANK_VALUES);
        this.deck.shuffle();
        
        // Post blinds
        this.postBlinds();
        
        // Deal hole cards
        this.dealHoleCards();
        
        // Start betting round
        setTimeout(() => {
            this.startBettingRound();
        }, 2000);
    }
    
    postBlinds() {
        const smallBlindPos = (this.dealerPosition + 1) % CONFIG.POKER.MAX_PLAYERS;
        const bigBlindPos = (this.dealerPosition + 2) % CONFIG.POKER.MAX_PLAYERS;
        
        // Small blind
        const smallBlindAmount = this.players[smallBlindPos].bet(this.smallBlind);
        this.pot += smallBlindAmount;
        
        // Big blind
        const bigBlindAmount = this.players[bigBlindPos].bet(this.bigBlind);
        this.pot += bigBlindAmount;
        
        this.currentBet = this.bigBlind;
        this.currentPlayer = (bigBlindPos + 1) % CONFIG.POKER.MAX_PLAYERS;
        
        // Update displays
        this.scene.updatePotDisplay(this.pot);
        this.scene.updatePlayersDisplay();
    }
    
    dealHoleCards() {
        for (let cardIndex = 0; cardIndex < CONFIG.POKER.CARDS_PER_PLAYER; cardIndex++) {
            for (let playerIndex = 0; playerIndex < CONFIG.POKER.MAX_PLAYERS; playerIndex++) {
                const player = this.players[playerIndex];
                if (!player.isActive) continue;
                
                const card = this.deck.deal();
                player.addCard(card);
                
                // Animate card dealing
                setTimeout(() => {
                    this.scene.animateCardDeal(player, card, cardIndex);
                }, (playerIndex * CONFIG.POKER.MAX_PLAYERS + cardIndex) * CONFIG.ANIMATION.CARD_DEAL_DELAY);
            }
        }
    }
    
    startBettingRound() {
        if (!this.isGameActive || this.isPaused) return;
        
        console.log('Starting betting round:', this.gamePhase);
        this.scene.updatePhaseDisplay(this.gamePhase);
        
        // Reset hasActed for new betting round
        this.players.forEach(player => {
            if (!player.isFolded && !player.isAllIn) {
                player.hasActed = false;
            }
        });
        
        this.nextPlayer();
    }
    
    nextPlayer() {
        if (!this.isGameActive || this.isPaused) return;
        
        // Find next active player
        let attempts = 0;
        do {
            this.currentPlayer = (this.currentPlayer + 1) % CONFIG.POKER.MAX_PLAYERS;
            attempts++;
        } while ((this.players[this.currentPlayer].isFolded || 
                 this.players[this.currentPlayer].isAllIn) && attempts < CONFIG.POKER.MAX_PLAYERS);
        
        // Check if betting round is complete
        if (this.isBettingRoundComplete()) {
            this.completeBettingRound();
            return;
        }
        
        // Show current player indicator
        this.scene.showCurrentPlayer(this.currentPlayer);
        
        // Handle player action
        if (this.players[this.currentPlayer].isHuman) {
            this.scene.showActionButtons();
        } else {
            // Bot action with delay
            setTimeout(() => {
                this.processBotAction();
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
        this.scene.hideAllActionIndicators();
        
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
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;
        
        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
        });
        
        // Burn one card
        this.deck.burn();
        
        // Deal 3 community cards
        for (let i = 0; i < 3; i++) {
            const card = this.deck.deal();
            this.communityCards.push(card);
            setTimeout(() => {
                this.scene.animateCommunityCard(card, i);
            }, i * 300);
        }
        
        setTimeout(() => {
            this.startBettingRound();
        }, 1500);
    }
    
    dealTurn() {
        this.gamePhase = 'turn';
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;
        
        // Reset player bets
        this.players.forEach(player => {
            player.currentBet = 0;
        });
        
        // Burn and deal
        this.deck.burn();
        const card = this.deck.deal();
        this.communityCards.push(card);
        this.scene.animateCommunityCard(card, 3);
        
        setTimeout(() => {
            this.startBettingRound();
        }, 1000);
    }
    
    dealRiver() {
        this.gamePhase = 'river';
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;
        
        // Reset player bets
        this.players.forEach(player => {
            player.currentBet = 0;
        });
        
        // Burn and deal
        this.deck.burn();
        const card = this.deck.deal();
        this.communityCards.push(card);
        this.scene.animateCommunityCard(card, 4);
        
        setTimeout(() => {
            this.startBettingRound();
        }, 1000);
    }
    
    showdown() {
        this.gamePhase = 'showdown';
        this.scene.updatePhaseDisplay('Showdown');
        
        // Reveal all player cards
        this.scene.revealAllCards();
        
        setTimeout(() => {
            this.determineWinner();
        }, 2000);
    }
    
    determineWinner() {
        const activePlayers = this.players.filter(p => !p.isFolded);
        
        // Simple winner determination (can be enhanced with proper hand evaluation)
        const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        
        // Award pot
        winner.winPot(this.pot);
        
        // Update statistics
        if (winner.isHuman) {
            this.gamesWon++;
        }
        this.gamesPlayed++;
        
        // Show winner
        this.scene.highlightWinner(winner);
        this.scene.updateStatsDisplay(this.gamesPlayed, this.gamesWon);
        
        // Show continue/exit options
        setTimeout(() => {
            this.scene.showGameEndOptions();
        }, 3000);
    }
    
    processPlayerAction(action, amount = 0) {
        if (!this.isGameActive || this.isPaused) return;
        
        const player = this.players[this.currentPlayer];
        let actualAmount = 0;
        
        switch (action) {
            case 'check':
                if (this.currentBet === player.currentBet) {
                    player.check();
                } else {
                    // Call
                    const callAmount = this.currentBet - player.currentBet;
                    actualAmount = player.call(callAmount);
                    this.pot += actualAmount;
                }
                break;
                
            case 'raise':
                const raiseAmount = Math.min(amount, player.chips + player.currentBet);
                const additionalBet = raiseAmount - player.currentBet;
                actualAmount = player.bet(additionalBet);
                this.pot += actualAmount;
                this.currentBet = raiseAmount;
                
                // Reset other players' hasActed status
                this.players.forEach(p => {
                    if (p !== player && !p.isFolded && !p.isAllIn) {
                        p.hasActed = false;
                    }
                });
                break;
                
            case 'fold':
                player.fold();
                this.scene.fadePlayerCards(player);
                break;
                
            case 'allin':
                actualAmount = player.allIn();
                this.pot += actualAmount;
                
                if (player.currentBet > this.currentBet) {
                    this.currentBet = player.currentBet;
                    this.players.forEach(p => {
                        if (p !== player && !p.isFolded && !p.isAllIn) {
                            p.hasActed = false;
                        }
                    });
                }
                break;
        }
        
        this.scene.updatePotDisplay(this.pot);
        this.scene.updatePlayersDisplay();
        this.scene.hideActionButtons();
        this.nextPlayer();
    }
    
    processBotAction() {
        if (!this.isGameActive || this.isPaused) return;
        
        const bot = this.players[this.currentPlayer];
        const handStrength = bot.getHandStrength();
        const callAmount = this.currentBet - bot.currentBet;
        
        let action = 'fold';
        let amount = 0;
        
        // Simple bot AI
        if (handStrength >= 0.8) {
            if (Math.random() > 0.5 && bot.chips > callAmount * 2) {
                action = 'raise';
                amount = Math.min(this.currentBet * 2, bot.chips + bot.currentBet);
            } else {
                action = 'check';
            }
        } else if (handStrength >= 0.6) {
            if (callAmount === 0) {
                action = 'check';
            } else if (Math.random() > 0.3) {
                action = 'check';
            }
        } else if (handStrength >= 0.4) {
            if (callAmount === 0) {
                action = 'check';
            } else if (Math.random() > 0.7) {
                action = 'check';
            }
        }
        
        this.processPlayerAction(action, amount);
    }
    
    pauseGame() {
        this.isPaused = true;
        console.log('Game paused');
    }
    
    resumeGame() {
        this.isPaused = false;
        console.log('Game resumed');
    }
    
    endGame() {
        this.isGameActive = false;
        this.isPaused = false;
        console.log('Game ended');
        
        // Clean up
        this.players.forEach(player => player.reset());
        this.communityCards = [];
        this.pot = 0;
        
        // Return to menu
        this.scene.returnToMenu();
    }
    
    continueGame() {
        // Move dealer button
        this.dealerPosition = (this.dealerPosition + 1) % CONFIG.POKER.MAX_PLAYERS;
        
        // Start new hand
        this.startNewGame();
    }
}