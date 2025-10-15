/**
 * Game Configuration
 * Centralized configuration for the poker game
 */

export const CONFIG = {
    // Game dimensions
    GAME: {
        WIDTH: 1280,
        HEIGHT: 720,
        BACKGROUND_COLOR: '#004d00'
    },
    
    // Poker game settings
    POKER: {
        STARTING_CHIPS: 10000,
        SMALL_BLIND: 50,
        BIG_BLIND: 100,
        MAX_PLAYERS: 8,
        CARDS_PER_PLAYER: 2,
        COMMUNITY_CARDS: 5
    },
    
    // Player positions on table
    PLAYER_POSITIONS: [
        { x: 640, y: 600 }, // Human player (bottom center)
        { x: 320, y: 520 }, // Bot 1 (left)
        { x: 200, y: 360 }, // Bot 2 (left-top)
        { x: 320, y: 200 }, // Bot 3 (top-left)
        { x: 640, y: 120 }, // Bot 4 (top center)
        { x: 960, y: 200 }, // Bot 5 (top-right)
        { x: 1080, y: 360 }, // Bot 6 (right-top)
        { x: 960, y: 520 }  // Bot 7 (right)
    ],
    
    // Card assets mapping
    CARD_MAPPING: {
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
    },
    
    // Game constants
    SUITS: ['hearts', 'diamonds', 'clubs', 'spades'],
    RANKS: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    RANK_VALUES: { 
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
        '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 
    },
    
    // Animation settings
    ANIMATION: {
        CARD_DEAL_DURATION: 500,
        CARD_DEAL_DELAY: 150,
        BUTTON_HOVER_DURATION: 200,
        WINNER_HIGHLIGHT_DURATION: 500
    },
    
    // UI settings
    UI: {
        BUTTON_STYLE: {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        },
        COLORS: {
            PRIMARY: '#4CAF50',
            SECONDARY: '#2196F3',
            WARNING: '#FF9800',
            DANGER: '#f44336',
            SUCCESS: '#00ff88'
        }
    },
    
    // Audio settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        SFX_VOLUME: 0.5,
        MUSIC_VOLUME: 0.3
    }
};

export default CONFIG;