
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// Serve socket.io client JS explicitly (for browser)
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

// Game configuration
const CONFIG = {
    maxPlayersPerRoom: 8,
    minPlayersToStart: 2,
    startingChips: 10000,
    smallBlind: 50,
    bigBlind: 100,
    botNames: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace']
};

// Card data
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };


// Game rooms storage
const rooms = new Map();

// Generate random room ID (simple-server.js style)
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

class PokerRoom {
    constructor(roomId, hostName) {
        this.roomId = roomId;
        this.players = [];
        this.deck = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentPlayer = 0;
        this.dealerPosition = 0;
        this.gamePhase = 'waiting'; // waiting, preflop, flop, turn, river, showdown
        this.currentBet = 0;
        this.gameStarted = false;
        this.bots = [];
        
        console.log(`Created room ${roomId} with host ${hostName}`);
    }

    addPlayer(socketId, playerName) {
        if (this.players.length >= CONFIG.maxPlayersPerRoom) {
            return { success: false, message: 'Room is full' };
        }

        const player = {
            id: socketId,
            name: playerName,
            chips: CONFIG.startingChips,
            cards: [],
            isBot: false,
            isHost: this.players.length === 0,
            isActive: true,
            hasActed: false,
            currentBet: 0,
            isAllIn: false,
            isFolded: false,
            position: this.players.length
        };

        this.players.push(player);
        console.log(`Player ${playerName} joined room ${this.roomId}`);
        
        return { success: true, player };
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.id === socketId);
        if (playerIndex !== -1) {
            const player = this.players[playerIndex];
            this.players.splice(playerIndex, 1);
            console.log(`Player ${player.name} left room ${this.roomId}`);
            
            // If host left, assign new host
            if (player.isHost && this.players.length > 0) {
                this.players[0].isHost = true;
            }
            
            return true;
        }
        return false;
    }

    addBots() {
        const botsNeeded = Math.min(
            CONFIG.maxPlayersPerRoom - this.players.length,
            CONFIG.botNames.length
        );

        for (let i = 0; i < botsNeeded; i++) {
            const bot = {
                id: `bot_${uuidv4()}`,
                name: CONFIG.botNames[i],
                chips: CONFIG.startingChips,
                cards: [],
                isBot: true,
                isHost: false,
                isActive: true,
                hasActed: false,
                currentBet: 0,
                isAllIn: false,
                isFolded: false,
                position: this.players.length
            };

            this.players.push(bot);
            this.bots.push(bot);
        }

        console.log(`Added ${botsNeeded} bots to room ${this.roomId}`);
    }

    startGame() {
        if (this.players.length < CONFIG.minPlayersToStart) {
            return { success: false, message: 'Need at least 2 players to start' };
        }

        this.gameStarted = true;
        this.gamePhase = 'preflop';
        this.dealerPosition = 0;
        
        // Create and shuffle deck
        this.createDeck();
        this.shuffleDeck();
        
        // Reset all players
        this.players.forEach(player => {
            player.cards = [];
            player.currentBet = 0;
            player.hasActed = false;
            player.isAllIn = false;
            player.isFolded = false;
        });

        // Deal hole cards
        this.dealHoleCards();
        
        // Post blinds
        this.postBlinds();
        
        console.log(`Game started in room ${this.roomId}`);
        return { success: true };
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

    dealHoleCards() {
        // Deal 2 cards to each player
        for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
            for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
                const player = this.players[playerIndex];
                if (player.isActive) {
                    const card = this.deck.pop();
                    player.cards.push(card);
                }
            }
        }
    }

    postBlinds() {
        const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
        const bigBlindPos = (this.dealerPosition + 2) % this.players.length;

        // Small blind
        this.players[smallBlindPos].currentBet = CONFIG.smallBlind;
        this.players[smallBlindPos].chips -= CONFIG.smallBlind;
        this.pot += CONFIG.smallBlind;

        // Big blind
        this.players[bigBlindPos].currentBet = CONFIG.bigBlind;
        this.players[bigBlindPos].chips -= CONFIG.bigBlind;
        this.pot += CONFIG.bigBlind;

        this.currentBet = CONFIG.bigBlind;
        this.currentPlayer = (bigBlindPos + 1) % this.players.length;
    }

    playerAction(socketId, action, amount = 0) {
        const player = this.players.find(p => p.id === socketId);
        if (!player || this.players[this.currentPlayer].id !== socketId) {
            return { success: false, message: 'Not your turn' };
        }

        let result = this.processAction(player, action, amount);
        
        if (result.success) {
            this.nextPlayer();
        }

        return result;
    }

    processAction(player, action, amount = 0) {
        switch (action) {
            case 'check':
                if (this.currentBet === player.currentBet) {
                    player.hasActed = true;
                    return { success: true, action: 'check' };
                } else {
                    return { success: false, message: 'Cannot check, must call or fold' };
                }

            case 'call':
                const callAmount = this.currentBet - player.currentBet;
                const actualCall = Math.min(callAmount, player.chips);
                player.currentBet += actualCall;
                player.chips -= actualCall;
                this.pot += actualCall;
                player.hasActed = true;
                
                if (player.chips === 0) {
                    player.isAllIn = true;
                }
                return { success: true, action: 'call', amount: actualCall };

            case 'raise':
                if (amount <= this.currentBet) {
                    return { success: false, message: 'Raise amount must be higher than current bet' };
                }
                
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
                return { success: true, action: 'raise', amount: raiseAmount };

            case 'fold':
                player.isFolded = true;
                player.hasActed = true;
                return { success: true, action: 'fold' };

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
                return { success: true, action: 'allin', amount: allInAmount };

            default:
                return { success: false, message: 'Invalid action' };
        }
    }

    nextPlayer() {
        // Find next active player
        let attempts = 0;
        do {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            attempts++;
        } while ((this.players[this.currentPlayer].isFolded || 
                 this.players[this.currentPlayer].isAllIn) && attempts < this.players.length);

        // Check if betting round is complete
        if (this.isBettingRoundComplete()) {
            this.completeBettingRound();
            return;
        }

        // Handle bot actions
        if (this.players[this.currentPlayer].isBot) {
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
            if (!player.isFolded && !player.isAllIn) {
                player.hasActed = false;
            }
        });

        // Burn one card
        this.deck.pop();

        // Deal 3 community cards
        for (let i = 0; i < 3; i++) {
            const card = this.deck.pop();
            this.communityCards.push(card);
        }

        this.nextPlayer();
    }

    dealTurn() {
        this.gamePhase = 'turn';
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;

        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
            if (!player.isFolded && !player.isAllIn) {
                player.hasActed = false;
            }
        });

        // Burn one card
        this.deck.pop();

        // Deal 1 community card
        const card = this.deck.pop();
        this.communityCards.push(card);

        this.nextPlayer();
    }

    dealRiver() {
        this.gamePhase = 'river';
        this.currentBet = 0;
        this.currentPlayer = this.dealerPosition;

        // Reset player bets for new round
        this.players.forEach(player => {
            player.currentBet = 0;
            if (!player.isFolded && !player.isAllIn) {
                player.hasActed = false;
            }
        });

        // Burn one card
        this.deck.pop();

        // Deal 1 community card
        const card = this.deck.pop();
        this.communityCards.push(card);

        this.nextPlayer();
    }

    showdown() {
        this.gamePhase = 'showdown';
        
        // Determine winner (simplified)
        const activePlayers = this.players.filter(p => !p.isFolded);
        const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        
        // Award pot
        winner.chips += this.pot;
        
        // Reset for next hand
        setTimeout(() => {
            this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
            this.startNextHand();
        }, 5000);

        return { winner: winner.name, amount: this.pot };
    }

    startNextHand() {
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
        });

        // Create and shuffle deck
        this.createDeck();
        this.shuffleDeck();

        // Deal hole cards
        this.dealHoleCards();
        
        // Post blinds
        this.postBlinds();
    }

    botAction() {
        const bot = this.players[this.currentPlayer];
        if (!bot.isBot) return;

        // Simple bot AI
        const handStrength = Math.random(); // Simplified
        const callAmount = this.currentBet - bot.currentBet;
        
        let action = 'fold';
        let amount = 0;
        
        if (handStrength >= 0.7) {
            if (Math.random() > 0.5 && bot.chips > callAmount * 2) {
                action = 'raise';
                amount = this.currentBet * 2;
            } else {
                action = callAmount > 0 ? 'call' : 'check';
            }
        } else if (handStrength >= 0.4) {
            action = callAmount > 0 ? (Math.random() > 0.5 ? 'call' : 'fold') : 'check';
        }

        const result = this.processAction(bot, action, amount);
        if (result.success) {
            this.nextPlayer();
        }
    }

    getGameState(socketId) {
        const player = this.players.find(p => p.id === socketId);
        
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                chips: p.chips,
                cards: p.id === socketId ? p.cards : [], // Only send own cards
                isBot: p.isBot,
                isHost: p.isHost,
                currentBet: p.currentBet,
                isAllIn: p.isAllIn,
                isFolded: p.isFolded,
                position: p.position
            })),
            communityCards: this.communityCards,
            pot: this.pot,
            currentPlayer: this.currentPlayer,
            gamePhase: this.gamePhase,
            currentBet: this.currentBet,
            gameStarted: this.gameStarted,
            dealerPosition: this.dealerPosition
        };
    }
}

// Socket.IO events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', (data) => {
        const roomId = generateRoomId();
        const room = new PokerRoom(roomId, data.playerName);
        const result = room.addPlayer(socket.id, data.playerName);
        if (result.success) {
            rooms.set(roomId, room);
            room.host = socket.id;
            socket.join(roomId);
            socket.emit('roomCreated', { roomId, players: room.players, gameState: room.getGameState(socket.id) });
            console.log(`Room ${roomId} created by ${data.playerName}`);
        } else {
            socket.emit('error', result.message);
        }
    });

    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        if (room.players.length >= CONFIG.maxPlayersPerRoom) {
            socket.emit('error', 'Room is full');
            return;
        }
        const result = room.addPlayer(socket.id, data.playerName);
        if (result.success) {
            socket.join(data.roomId);
            socket.emit('roomJoined', { roomId: data.roomId, players: room.players, gameState: room.getGameState(socket.id) });
            // Notify all players in room with updated player list and their own game state
            for (const player of room.players) {
                io.to(player.id).emit('playerJoined', {
                    players: room.players,
                    gameState: room.getGameState(player.id)
                });
            }
            console.log(`${data.playerName} joined room ${data.roomId}`);
        } else {
            socket.emit('error', result.message);
        }
    });

    socket.on('addBots', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit('error', 'Only host can add bots');
            return;
        }
        room.addBots();
        for (const player of room.players) {
            io.to(player.id).emit('botsAdded', { players: room.players, gameState: room.getGameState(player.id) });
        }
    });

    socket.on('startGame', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        if (room.host !== socket.id) {
            socket.emit('error', 'Not authorized to start game');
            return;
        }
        if (room.players.length < CONFIG.minPlayersToStart) {
            socket.emit('error', 'Need at least 2 players to start the game');
            return;
        }
        if (room.gameStarted) {
            socket.emit('error', 'Game already started');
            return;
        }
        const result = room.startGame();
        if (result.success) {
            for (const player of room.players) {
                io.to(player.id).emit('gameStarted', { players: room.players, gameState: room.getGameState(player.id) });
            }
            console.log(`Game started in room ${data.roomId}`);
        } else {
            socket.emit('error', result.message);
        }
    });

    socket.on('playerAction', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        const result = room.playerAction(socket.id, data.action, data.amount);
        if (result.success) {
            for (const player of room.players) {
                io.to(player.id).emit('actionPerformed', {
                    playerId: socket.id,
                    action: data.action,
                    amount: data.amount,
                    players: room.players,
                    gameState: room.getGameState(player.id)
                });
            }
        } else {
            socket.emit('error', result.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove player from all rooms
        for (const [roomId, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                room.removePlayer(socket.id);
                // If room is empty, delete it
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty)`);
                } else {
                    // If host left, assign new host
                    if (room.host === socket.id) {
                        room.host = room.players[0].id;
                        room.players[0].isHost = true;
                    }
                    // Notify remaining players
                    for (const player of room.players) {
                        io.to(player.id).emit('playerLeft', {
                            players: room.players,
                            gameState: room.getGameState(player.id)
                        });
                    }
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Poker server running on port ${PORT}`);
    console.log(`Access game at: http://localhost:${PORT}`);
});