/**
 * Card Entity Class
 * Represents a playing card with suit, rank, and value
 */

export class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }
    
    getTextureKey() {
        return `card_${this.suit}_${this.rank}`;
    }
    
    toString() {
        return `${this.rank} of ${this.suit}`;
    }
    
    equals(otherCard) {
        return this.suit === otherCard.suit && this.rank === otherCard.rank;
    }
    
    isRed() {
        return this.suit === 'hearts' || this.suit === 'diamonds';
    }
    
    isBlack() {
        return this.suit === 'clubs' || this.suit === 'spades';
    }
    
    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank,
            value: this.value
        };
    }
    
    static fromJSON(data) {
        return new Card(data.suit, data.rank, data.value);
    }
}

/**
 * Deck Manager Class
 * Handles deck creation, shuffling, and card dealing
 */
export class Deck {
    constructor() {
        this.cards = [];
        this.discardPile = [];
    }
    
    create(suits, ranks, rankValues) {
        this.cards = [];
        suits.forEach(suit => {
            ranks.forEach(rank => {
                this.cards.push(new Card(suit, rank, rankValues[rank]));
            });
        });
        return this;
    }
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this;
    }
    
    deal() {
        if (this.cards.length === 0) {
            throw new Error('Cannot deal from empty deck');
        }
        const card = this.cards.pop();
        this.discardPile.push(card);
        return card;
    }
    
    burn() {
        return this.deal(); // Burn card goes to discard pile
    }
    
    reset() {
        this.cards = [...this.cards, ...this.discardPile];
        this.discardPile = [];
        return this.shuffle();
    }
    
    getCardsRemaining() {
        return this.cards.length;
    }
    
    isEmpty() {
        return this.cards.length === 0;
    }
}