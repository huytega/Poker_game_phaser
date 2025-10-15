class MultiplayerPokerGame {
    constructor() {
        this.socket = null;
        this.gameState = null;
        this.playerName = '';
        this.roomId = '';
        this.isConnected = false;
        this.serverAvailable = false;
        
        this.initializeUI();
        // Only try to connect if we're not explicitly in offline mode
        if (!window.location.search.includes('offline=true')) {
            this.connectToServer();
        } else {
            this.handleOfflineMode();
        }
    }

    initializeUI() {
        console.log('Initializing multiplayer UI...');
        // Create multiplayer UI
        const gameContainer = document.getElementById('gameContainer');
        
        if (!gameContainer) {
            console.error('gameContainer element not found!');
            return;
        }

        // Check if menu already exists
        if (document.getElementById('menuOverlay')) {
            console.log('Menu overlay already exists');
            return;
        }

        // Main menu overlay
        const menuOverlay = document.createElement('div');
        menuOverlay.id = 'menuOverlay';
        menuOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 20, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Roboto', sans-serif;
        `;

        const menuContent = document.createElement('div');
        menuContent.style.cssText = `
            background: linear-gradient(135deg, #0f4a0f, #1a5a1a);
            padding: 40px;
            border-radius: 15px;
            border: 2px solid #4CAF50;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        menuContent.innerHTML = `
            <h1 style="color: #4CAF50; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                Poker Game
            </h1>
            
            <div id="nameInputSection">
                <input type="text" id="playerNameInput" placeholder="Enter your name" 
                       style="width: 100%; padding: 15px; margin-bottom: 20px; border: 2px solid #4CAF50; 
                              border-radius: 8px; font-size: 16px; background: #0a3a0a; color: white; text-align: center;">
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
                    <button id="singlePlayerBtn" style="flex: 1; padding: 15px; background: #FF9800; color: white; 
                            border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;
                            transition: background 0.3s;">
                        🎮 Single Player
                    </button>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="createRoomBtn" style="flex: 1; padding: 15px; background: #4CAF50; color: white; 
                            border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;
                            transition: background 0.3s;">
                        Create Room
                    </button>
                    <button id="joinRoomBtn" style="flex: 1; padding: 15px; background: #2196F3; color: white; 
                            border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;
                            transition: background 0.3s;">
                        Join Room
                    </button>
                </div>
            </div>

            <div id="joinRoomSection" style="display: none;">
                <input type="text" id="roomIdInput" placeholder="Enter Room ID" 
                       style="width: 100%; padding: 15px; margin-bottom: 20px; border: 2px solid #4CAF50; 
                              border-radius: 8px; font-size: 16px; background: #0a3a0a; color: white; text-align: center;">
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="joinRoomConfirmBtn" style="flex: 1; padding: 15px; background: #4CAF50; color: white; 
                            border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
                        Join
                    </button>
                    <button id="backToMenuBtn" style="flex: 1; padding: 15px; background: #666; color: white; 
                            border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
                        Back
                    </button>
                </div>
            </div>

            <div id="lobbySection" style="display: none;">
                <h2 style="color: #4CAF50; margin-bottom: 20px;">Room: <span id="roomIdDisplay"></span></h2>
                
                <div id="playersList" style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); 
                     border-radius: 8px; text-align: left; color: white;"></div>
                
                <div id="hostControls" style="display: none;">
                    <button id="addBotsBtn" style="width: 100%; padding: 15px; margin-bottom: 15px; 
                            background: #FF9800; color: white; border: none; border-radius: 8px; 
                            font-size: 16px; cursor: pointer; font-weight: bold;">
                        Add Bots
                    </button>
                    <button id="startGameBtn" style="width: 100%; padding: 15px; background: #4CAF50; 
                            color: white; border: none; border-radius: 8px; font-size: 18px; 
                            cursor: pointer; font-weight: bold;">
                        Start Game
                    </button>
                </div>
                
                <button id="leaveLobbyBtn" style="width: 100%; padding: 15px; background: #f44336; 
                        color: white; border: none; border-radius: 8px; font-size: 16px; 
                        cursor: pointer; font-weight: bold; margin-top: 15px;">
                    Leave Room
                </button>
            </div>

            <div id="connectionStatus" style="margin-top: 20px; color: #FF9800; font-size: 14px;">
                Checking server connection...
            </div>
        `;

        menuOverlay.appendChild(menuContent);
        gameContainer.appendChild(menuOverlay);

        // Add event listeners
        this.setupMenuEvents();
        
        // Initially disable multiplayer features until connection is established
        this.disableMultiplayerFeatures();
    }

    setupMenuEvents() {
        const playerNameInput = document.getElementById('playerNameInput');
        const singlePlayerBtn = document.getElementById('singlePlayerBtn');
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const joinRoomConfirmBtn = document.getElementById('joinRoomConfirmBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const addBotsBtn = document.getElementById('addBotsBtn');
        const startGameBtn = document.getElementById('startGameBtn');
        const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');

        singlePlayerBtn.addEventListener('click', () => {
            this.startSinglePlayer();
        });

        createRoomBtn.addEventListener('click', () => {
            if (!this.isConnected) {
                alert('Multiplayer server is not available. Please try single player mode.');
                return;
            }
            const name = playerNameInput.value.trim();
            if (name) {
                this.playerName = name;
                this.createRoom();
            } else {
                alert('Please enter your name');
            }
        });

        joinRoomBtn.addEventListener('click', () => {
            if (!this.isConnected) {
                alert('Multiplayer server is not available. Please try single player mode.');
                return;
            }
            const name = playerNameInput.value.trim();
            if (name) {
                this.playerName = name;
                this.showJoinRoomForm();
            } else {
                alert('Please enter your name');
            }
        });

        joinRoomConfirmBtn.addEventListener('click', () => {
            const roomId = document.getElementById('roomIdInput').value.trim().toUpperCase();
            if (roomId) {
                this.roomId = roomId;
                this.joinRoom();
            } else {
                alert('Please enter room ID');
            }
        });

        backToMenuBtn.addEventListener('click', () => {
            this.showMainMenu();
        });

        addBotsBtn.addEventListener('click', () => {
            this.addBots();
        });

        startGameBtn.addEventListener('click', () => {
            this.startGame();
        });

        leaveLobbyBtn.addEventListener('click', () => {
            this.leaveRoom();
        });

        // Enter key handlers
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createRoomBtn.click();
            }
        });

        document.getElementById('roomIdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoomConfirmBtn.click();
            }
        });
    }

    connectToServer() {
        console.log('Attempting to connect to server...');
        try {
            // Check if io is available
            if (typeof io === 'undefined') {
                console.error('Socket.io not loaded!');
                this.handleOfflineMode();
                return;
            }

            // Set a connection timeout
            const connectionTimeout = setTimeout(() => {
                console.log('Connection timeout - switching to offline mode');
                this.handleOfflineMode();
            }, 3000); // 3 second timeout

            this.socket = io({
                timeout: 3000,
                forceNew: true
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to server successfully');
                clearTimeout(connectionTimeout);
                this.isConnected = true;
                this.serverAvailable = true;
                this.updateConnectionStatus('Connected to server', '#4CAF50');
                this.enableMultiplayerFeatures();
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.updateConnectionStatus('Offline mode - Single player available', '#FF9800');
                this.disableMultiplayerFeatures();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                clearTimeout(connectionTimeout);
                this.handleOfflineMode();
            });

            this.socket.on('roomCreated', (data) => {
                console.log('Room created:', data.roomId);
                this.roomId = data.roomId;
                // Always use the players property from server
                this.gameState = { players: data.players };
                this.showLobby();
                this.updatePlayersList();
            });

            this.socket.on('roomJoined', (data) => {
                console.log('Room joined successfully');
                // Always use the players property from server
                this.gameState = { players: data.players };
                this.showLobby();
                this.updatePlayersList();
            });

            this.socket.on('playerJoined', (data) => {
                // Always use the players property from server
                this.gameState = { players: data.players };
                this.updatePlayersList();
            });

            this.socket.on('botsAdded', (data) => {
                this.gameState = data.gameState;
                this.updatePlayersList();
            });

            this.socket.on('gameStarted', (data) => {
                this.gameState = data.gameState;
                this.startMultiplayerGame();
            });

            this.socket.on('actionPerformed', (data) => {
                this.gameState = data.gameState;
                // Update game UI with new state
                if (this.pokerGame) {
                    this.pokerGame.updateFromMultiplayer(this.gameState);
                }
            });

            this.socket.on('playerLeft', (data) => {
                this.gameState = data.gameState;
                this.updatePlayersList();
            });

            this.socket.on('error', (message) => {
                alert('Error: ' + message);
            });

        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.handleOfflineMode();
        }
    }

    updateConnectionStatus(message, color) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = color;
        }
    }

    handleOfflineMode() {
        this.isConnected = false;
        this.serverAvailable = false;
        this.updateConnectionStatus('Offline mode - Single player available', '#FF9800');
        this.disableMultiplayerFeatures();
    }

    enableMultiplayerFeatures() {
        // Enable multiplayer buttons
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        
        if (createRoomBtn) {
            createRoomBtn.disabled = false;
            createRoomBtn.style.opacity = '1';
            createRoomBtn.style.cursor = 'pointer';
        }
        
        if (joinRoomBtn) {
            joinRoomBtn.disabled = false;
            joinRoomBtn.style.opacity = '1';
            joinRoomBtn.style.cursor = 'pointer';
        }
    }

    disableMultiplayerFeatures() {
        // Disable multiplayer buttons
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        
        if (createRoomBtn) {
            createRoomBtn.disabled = true;
            createRoomBtn.style.opacity = '0.5';
            createRoomBtn.style.cursor = 'not-allowed';
            createRoomBtn.title = 'Multiplayer server not available';
        }
        
        if (joinRoomBtn) {
            joinRoomBtn.disabled = true;
            joinRoomBtn.style.opacity = '0.5';
            joinRoomBtn.style.cursor = 'not-allowed';
            joinRoomBtn.title = 'Multiplayer server not available';
        }
    }

    showMainMenu() {
        document.getElementById('nameInputSection').style.display = 'block';
        document.getElementById('joinRoomSection').style.display = 'none';
        document.getElementById('lobbySection').style.display = 'none';
    }

    showJoinRoomForm() {
        document.getElementById('nameInputSection').style.display = 'none';
        document.getElementById('joinRoomSection').style.display = 'block';
        document.getElementById('lobbySection').style.display = 'none';
    }

    showLobby() {
        document.getElementById('nameInputSection').style.display = 'none';
        document.getElementById('joinRoomSection').style.display = 'none';
        document.getElementById('lobbySection').style.display = 'block';
        
        document.getElementById('roomIdDisplay').textContent = this.roomId;
        this.updatePlayersList();
        this.updateHostControls();
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        if (!this.gameState || !Array.isArray(this.gameState.players)) {
            // Show 1/8 if room just created and host is present
            const hostName = this.playerName || 'Host';
            playersList.innerHTML = `<strong>Players (1/8):</strong><br><div>${hostName} 👑 - 10000 chips</div>`;
            return;
        }

        const playersHTML = this.gameState.players.map(player => {
            const hostBadge = player.isHost ? ' 👑' : '';
            const botBadge = player.isBot ? ' 🤖' : '';
            return `<div style="margin-bottom: 5px;">
                ${player.name}${hostBadge}${botBadge} - ${player.chips || ''} chips
            </div>`;
        }).join('');

        playersList.innerHTML = `
            <strong>Players (${this.gameState.players.length}/8):</strong><br>
            ${playersHTML}
        `;

        // Show Start Game button only if host and 2+ players
        this.updateHostControls();
    }

    updateHostControls() {
        const hostControls = document.getElementById('hostControls');
        if (!this.gameState || !Array.isArray(this.gameState.players)) {
            hostControls.style.display = 'none';
            return;
        }
        const currentPlayer = this.gameState.players.find(p => p.id === this.socket.id);
        // Only show Start Game if host and at least 2 players
        if (currentPlayer && currentPlayer.isHost && !this.gameState.gameStarted && this.gameState.players.length >= 2) {
            hostControls.style.display = 'block';
        } else {
            hostControls.style.display = 'none';
        }
    }

    createRoom() {
        if (!this.isConnected) {
            alert('Not connected to server');
            return;
        }

        this.socket.emit('createRoom', { playerName: this.playerName });
    }

    joinRoom() {
        if (!this.isConnected) {
            alert('Not connected to server');
            return;
        }

        this.socket.emit('joinRoom', { 
            roomId: this.roomId, 
            playerName: this.playerName 
        });
    }

    addBots() {
        this.socket.emit('addBots', { roomId: this.roomId });
    }

    startGame() {
        this.socket.emit('startGame', { roomId: this.roomId });
    }

    startSinglePlayer() {
        console.log('Starting single player game...');
        // Hide menu overlay
        document.getElementById('menuOverlay').style.display = 'none';
        
        // Initialize the poker game in single player mode
        if (window.PokerGame) {
            console.log('Creating single player PokerGame...');
            this.pokerGame = new PokerGame(false, null); // Single player mode
        } else {
            console.error('PokerGame class not found!');
            alert('Game engine not loaded. Please refresh the page.');
        }
    }

    startMultiplayerGame() {
        // Hide menu overlay
        document.getElementById('menuOverlay').style.display = 'none';
        
        // Initialize the poker game with multiplayer mode
        if (window.PokerGame) {
            this.pokerGame = new PokerGame(true, this); // Pass multiplayer flag and reference
        }
    }

    leaveRoom() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket.connect();
        }
        this.showMainMenu();
    }

    // Methods called by the poker game for multiplayer actions
    sendPlayerAction(action, amount = 0) {
        if (this.socket && this.roomId) {
            this.socket.emit('playerAction', {
                roomId: this.roomId,
                action: action,
                amount: amount
            });
        }
    }

    getMultiplayerGameState() {
        return this.gameState;
    }

    isMultiplayer() {
        return true;
    }
}

// Start the multiplayer game when page loads
window.addEventListener('load', () => {
    console.log('Initializing multiplayer poker...');
    try {
        window.multiplayerGame = new MultiplayerPokerGame();
        console.log('Multiplayer poker initialized successfully');
    } catch (error) {
        console.error('Failed to initialize multiplayer poker:', error);
        // Fallback to single-player mode
        console.log('Falling back to single-player mode...');
        if (window.PokerGame) {
            new PokerGame();
        }
    }
});