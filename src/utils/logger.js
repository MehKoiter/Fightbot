/**
 * Logger Utility - Provides consistent logging across the application
 */

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
};

const EMOJIS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍',
    cache: '💾',
    database: '🗄️',
    network: '🌐',
    time: '⏱️',
    user: '👤',
    bot: '🤖',
    discord: '🔷',
    service: '🚀',
    command: '🎮',
    event: '📡',
    config: '⚙️'
};

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor() {
        // Default to INFO level
        this.level = LOG_LEVELS.INFO;
        this.timestamps = true;
        this.colors = true;
        this.emojis = true;
    }
    
    /**
     * Configure the logger
     * @param {Object} options - Configuration options
     */
    configure(options = {}) {
        if (options.level !== undefined) {
            this.setLevel(options.level);
        }
        
        if (options.timestamps !== undefined) {
            this.timestamps = options.timestamps;
        }
        
        if (options.colors !== undefined) {
            this.colors = options.colors;
        }
        
        if (options.emojis !== undefined) {
            this.emojis = options.emojis;
        }
    }
    
    /**
     * Set the log level
     * @param {string} level - Log level (error, warn, info, debug)
     */
    setLevel(level) {
        if (typeof level === 'string') {
            const normalizedLevel = level.toUpperCase();
            if (LOG_LEVELS[normalizedLevel] !== undefined) {
                this.level = LOG_LEVELS[normalizedLevel];
                return;
            }
        }
        
        if (typeof level === 'number' && level >= 0 && level <= 3) {
            this.level = level;
        }
    }
    
    /**
     * Format the log message
     * @param {string} level - Log level
     * @param {string} emoji - Log emoji
     * @param {string} message - Log message
     * @param {string} color - Log color
     * @returns {string} - Formatted log message
     * @private
     */
    _format(level, emoji, message, color) {
        let output = '';
        
        // Add timestamp
        if (this.timestamps) {
            const now = new Date();
            const timestamp = `[${now.toLocaleTimeString()}]`;
            output += this.colors ? `${COLORS.dim}${timestamp}${COLORS.reset} ` : `${timestamp} `;
        }
        
        // Add level and emoji
        const levelStr = level.padEnd(5);
        if (this.colors) {
            output += `${color}${levelStr}${COLORS.reset} `;
        } else {
            output += `${levelStr} `;
        }
        
        // Add emoji
        if (this.emojis) {
            output += `${emoji} `;
        }
        
        // Add message
        output += message;
        
        return output;
    }
    
    /**
     * Log an error message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    error(message, data = null) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this._format('ERROR', EMOJIS.error, message, COLORS.red));
            if (data) console.error(data);
        }
    }
    
    /**
     * Log a warning message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    warn(message, data = null) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this._format('WARN', EMOJIS.warning, message, COLORS.yellow));
            if (data) console.warn(data);
        }
    }
    
    /**
     * Log an info message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    info(message, data = null) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this._format('INFO', EMOJIS.info, message, COLORS.cyan));
            if (data) console.log(data);
        }
    }
    
    /**
     * Log a debug message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    debug(message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(this._format('DEBUG', EMOJIS.debug, message, COLORS.magenta));
            if (data) console.debug(data);
        }
    }
    
    /**
     * Log a success message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    success(message, data = null) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this._format('INFO', EMOJIS.success, message, COLORS.green));
            if (data) console.log(data);
        }
    }
    
    /**
     * Log a cache-related message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    cache(message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(this._format('CACHE', EMOJIS.cache, message, COLORS.blue));
            if (data) console.debug(data);
        }
    }
    
    /**
     * Log a database-related message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    db(message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(this._format('DB', EMOJIS.database, message, COLORS.blue));
            if (data) console.debug(data);
        }
    }
    
    /**
     * Log a service-related message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    service(message, data = null) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this._format('SVC', EMOJIS.service, message, COLORS.cyan));
            if (data) console.log(data);
        }
    }
    
    /**
     * Log a command-related message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    command(message, data = null) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this._format('CMD', EMOJIS.command, message, COLORS.green));
            if (data) console.log(data);
        }
    }
    
    /**
     * Log an event-related message
     * @param {string} message - The message to log
     * @param {*} data - Additional data to log
     */
    event(message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(this._format('EVENT', EMOJIS.event, message, COLORS.yellow));
            if (data) console.debug(data);
        }
    }
}

// Create and export a singleton instance
const logger = new Logger();
export default logger;
