/**
 * Configuration Service - Manages application configuration
 */

import dotenv from 'dotenv';
import BaseService from './baseService.js';

class ConfigService extends BaseService {
    constructor() {
        super();
        this.config = {};
        this.defaultValues = {
            // Default configuration values
            logLevel: 'info',
            cacheEnabled: true,
            cacheTTL: 30 * 60 * 1000, // 30 minutes
            commandPrefix: '/',
            analyticsEnabled: true
        };
    }

    /**
     * Initialize the config service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Load environment variables from .env file
            dotenv.config();
            
            // Set up configuration
            this.config = {
                // Bot configuration
                token: process.env.DISCORD_TOKEN,
                clientId: process.env.CLIENT_ID,
                guildId: process.env.GUILD_ID,
                
                // Application settings
                logLevel: process.env.LOG_LEVEL || this.defaultValues.logLevel,
                cacheEnabled: process.env.CACHE_ENABLED !== 'false',
                cacheTTL: parseInt(process.env.CACHE_TTL) || this.defaultValues.cacheTTL,
                
                // Database configuration
                dbPath: process.env.DB_PATH || './data/fightbot.db',
                
                // Analytics
                analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false'
            };
            
            // Validate required configuration
            this.validateConfig();
            
            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }
    
    /**
     * Validate required configuration values
     * @throws {Error} If required configuration is missing
     */
    validateConfig() {
        const requiredVars = ['token', 'clientId'];
        const missing = requiredVars.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
    }
    
    /**
     * Get a configuration value
     * @param {string} key - Configuration key
     * @param {any} defaultValue - Default value if key is not found
     * @returns {any} - Configuration value
     */
    get(key, defaultValue = undefined) {
        this.ensureInitialized();
        
        if (this.config.hasOwnProperty(key)) {
            return this.config[key];
        }
        
        return defaultValue;
    }
    
    /**
     * Get all configuration
     * @returns {Object} - All configuration values
     */
    getAll() {
        this.ensureInitialized();
        return { ...this.config };
    }
    
    /**
     * Set a configuration value at runtime
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     */
    set(key, value) {
        this.ensureInitialized();
        this.config[key] = value;
    }
}

export default ConfigService;
