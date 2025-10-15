/**
 * Simple Socket.io server for testing poker multiplayer functionality
 * Run with: node simple-server.js
 * Then access the game at: http://localhost:3000
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const rooms = new Map();

// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create room
    socket.on('createRoom', (data) => {
        const roomId = generateRoomId();
        const room = {
            id: roomId,
            host: socket.id,
            players: [{
                id: socket.id,
                name: data.playerName,
                isHost: true
            }],
            gameStarted: false
        };
        
    rooms.set(roomId, room);
    socket.join(roomId);
    // Always send full player list
    socket.emit('roomCreated', { roomId: roomId, players: room.players });
    console.log(`Room ${roomId} created by ${data.playerName}`);
    });

    // Join room
    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        if (room.players.length >= 8) {
            socket.emit('error', 'Room is full');
            return;
        }
        
        room.players.push({
            id: socket.id,
            name: data.playerName,
            isHost: false
        });
        
        socket.join(data.roomId);
        // Always send full player list to the joining player
        socket.emit('roomJoined', { roomId: data.roomId, players: room.players });
        // Notify all players in room with updated player list
        io.to(data.roomId).emit('playerJoined', {
            players: room.players
        });
        console.log(`${data.playerName} joined room ${data.roomId}`);
        // Removed auto-start logic. Host must manually start the game.
    });

    // Start game
    socket.on('startGame', (data) => {
        const room = rooms.get(data.roomId);
        if (!room || room.host !== socket.id) {
            socket.emit('error', 'Not authorized to start game');
            return;
        }
      
        if (room.players.length < 2) {
            socket.emit('error', 'Need at least 2 players to start the game');
            return;
        }
        if (room.gameStarted) {
            socket.emit('error', 'Game already started');
            return;
        }
        room.gameStarted = true;
        io.to(data.roomId).emit('gameStarted', {
            players: room.players
        });
        console.log(`Game started in room ${data.roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove player from all rooms
        for (const [roomId, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
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
                    io.to(roomId).emit('playerLeft', {
                        players: room.players
                    });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🃏 Poker server running on http://localhost:${PORT}`);
    console.log('📁 Serving static files from current directory');
    console.log('🔌 Socket.io ready for connections');
});