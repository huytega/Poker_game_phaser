/**
 * Utility Functions
 * Helper functions for common operations
 */

export class Utils {
    /**
     * Format number as currency
     */
    static formatCurrency(amount) {
        return `$${amount.toLocaleString()}`;
    }
    
    /**
     * Generate random number between min and max (inclusive)
     */
    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get random element from array
     */
    static randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Shuffle array in place
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Clamp value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    /**
     * Convert degrees to radians
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Calculate distance between two points
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate angle between two points
     */
    static angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * Deep clone an object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    /**
     * Debounce function calls
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Get current timestamp
     */
    static timestamp() {
        return Date.now();
    }
    
    /**
     * Format time duration
     */
    static formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Check if value is empty (null, undefined, empty string, empty array, empty object)
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
    
    /**
     * Capitalize first letter of string
     */
    static capitalize(str) {
        if (typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    /**
     * Convert camelCase to snake_case
     */
    static camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    
    /**
     * Convert snake_case to camelCase
     */
    static snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }
    
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Save to localStorage with error handling
     */
    static saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Load from localStorage with error handling
     */
    static loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
    
    /**
     * Remove from localStorage
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
    
    /**
     * Check if running on mobile device
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Check if running on touch device
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Get browser information
     */
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';
        
        return {
            browser,
            userAgent,
            language: navigator.language,
            platform: navigator.platform
        };
    }
    
    /**
     * Wait for specified time
     */
    static wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    
    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await Utils.wait(delay);
            }
        }
    }
    
    /**
     * Create event emitter
     */
    static createEventEmitter() {
        const events = {};
        
        return {
            on(event, callback) {
                if (!events[event]) events[event] = [];
                events[event].push(callback);
            },
            
            off(event, callback) {
                if (!events[event]) return;
                events[event] = events[event].filter(cb => cb !== callback);
            },
            
            emit(event, ...args) {
                if (!events[event]) return;
                events[event].forEach(callback => callback(...args));
            },
            
            once(event, callback) {
                const onceCallback = (...args) => {
                    callback(...args);
                    this.off(event, onceCallback);
                };
                this.on(event, onceCallback);
            }
        };
    }
    
    /**
     * Color utilities
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Array utilities
     */
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static unique(array) {
        return [...new Set(array)];
    }
    
    static flatten(array) {
        return array.reduce((flat, item) => 
            flat.concat(Array.isArray(item) ? Utils.flatten(item) : item), []);
    }
}