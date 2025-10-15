/**
 * Player Entity Class
 * Represents a poker player with all associated properties and methods
 */

export class Player {
    constructor(id, name, position, isHuman = false) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.isHuman = isHuman;
        this.isBot = !isHuman;
        
        // Game state
        this.chips = 0;
        this.cards = [];
        this.currentBet = 0;
        this.totalBet = 0;
        this.isActive = true;
        this.hasActed = false;
        this.isAllIn = false;
        this.isFolded = false;
        this.isHost = false;
        
        // Visual elements (will be set by scene)
        this.avatar = null;
        this.nameText = null;
        this.chipsText = null;
        this.cardsSprites = [];
        this.actionIndicator = null;
        this.betText = null;
    }
    
    reset() {
        this.cards = [];
        this.currentBet = 0;
        this.totalBet = 0;
        this.hasActed = false;
        this.isAllIn = false;
        this.isFolded = false;
        
        // Clear visual elements
        this.cardsSprites.forEach(sprite => sprite.destroy());
        this.cardsSprites = [];
        
        if (this.actionIndicator) {
            this.actionIndicator.setVisible(false);
        }
        
        if (this.betText) {
            this.betText.setText('');
        }
    }
    
    addCard(card) {
        this.cards.push(card);
    }
    
    bet(amount) {
        const actualBet = Math.min(amount, this.chips);
        this.chips -= actualBet;
        this.currentBet += actualBet;
        this.totalBet += actualBet;
        this.hasActed = true;
        
        if (this.chips === 0) {
            this.isAllIn = true;
        }
        
        return actualBet;
    }
    
    fold() {
        this.isFolded = true;
        this.hasActed = true;
    }
    
    call(amount) {
        return this.bet(amount);
    }
    
    raise(amount) {
        this.hasActed = true;
        return this.bet(amount);
    }
    
    check() {
        this.hasActed = true;
    }
    
    allIn() {
        const amount = this.chips;
        this.bet(amount);
        this.isAllIn = true;
        return amount;
    }
    
    winPot(amount) {
        this.chips += amount;
    }
    
    updateChipsDisplay() {
        if (this.chipsText) {
            this.chipsText.setText(`$${this.chips.toLocaleString()}`);
        }
    }
    
    updateBetDisplay() {
        if (this.betText && this.currentBet > 0) {
            this.betText.setText(`$${this.currentBet}`);
        } else if (this.betText) {
            this.betText.setText('');
        }
    }
    
    showActionIndicator() {
        if (this.actionIndicator) {
            this.actionIndicator.setVisible(true);
        }
    }
    
    hideActionIndicator() {
        if (this.actionIndicator) {
            this.actionIndicator.setVisible(false);
        }
    }
    
    setCardsAlpha(alpha) {
        this.cardsSprites.forEach(sprite => {
            sprite.setAlpha(alpha);
        });
    }
    
    getHandStrength() {
        // Simple hand strength evaluation
        if (this.cards.length < 2) return 0;
        
        const card1 = this.cards[0];
        const card2 = this.cards[1];
        
        // Pair
        if (card1.value === card2.value) {
            return Math.min(0.9, card1.value / 14 + 0.3);
        }
        
        // Suited
        if (card1.suit === card2.suit) {
            return Math.min(0.7, (card1.value + card2.value) / 28 + 0.2);
        }
        
        // High cards
        return Math.min(0.6, (card1.value + card2.value) / 28);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            chips: this.chips,
            currentBet: this.currentBet,
            isActive: this.isActive,
            isAllIn: this.isAllIn,
            isFolded: this.isFolded,
            isHost: this.isHost,
            isBot: this.isBot,
            position: this.position
        };
    }
}