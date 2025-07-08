/**
 * Command Analytics Service - Tracks command usage without storing user information
 * Migrated to use the new BaseService class
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import BaseService from './baseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CommandAnalyticsService extends BaseService {
    constructor() {
        super();
        this.db = null;
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Try to get dependencies from container
            try {
                const container = await import('./serviceContainer.js');
                this.container = container.default;
                this.logger = this.container.get('logger');
                this.config = this.container.get('config');
            } catch (error) {
                // Fall back to console if container/logger not available
                this.logger = console;
                this.config = { get: () => true }; // Default enable analytics
            }
            
            // Check if analytics is enabled
            if (!this.config.get('analyticsEnabled', true)) {
                this.logger.info('Analytics is disabled by configuration');
                await super.init(); // Mark as initialized even though we're not using the DB
                return;
            }
            
            this.logger.info('Initializing Command Analytics Service...');
            
            // Ensure data directory exists
            const dataDir = path.join(__dirname, '../../data');
            
            // Create the directory if it doesn't exist
            if (!fs.existsSync(dataDir)) {
                try {
                    fs.mkdirSync(dataDir, { recursive: true });
                    this.logger.info(`Created data directory at ${dataDir}`);
                } catch (dirErr) {
                    this.logger.error(`Error creating data directory: ${dirErr.message}`);
                    throw dirErr;
                }
            }
            
            // Use full path for database
            const dbPath = path.join(dataDir, 'analytics.db');
            
            // Create database connection
            await new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        this.logger.error(`Error opening database: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    this.logger.info(`Connected to analytics database at ${dbPath}`);
                    resolve();
                });
            });
            
            // Create tables if they don't exist
            await this._createTables();
            
            this.logger.info('Command Analytics Service initialized successfully');
            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }

    /**
     * Create database tables if they don't exist
     * @returns {Promise<void>}
     * @private
     */
    async _createTables() {
        try {
            await new Promise((resolve, reject) => {
                const sql = `
                    CREATE TABLE IF NOT EXISTS command_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        command_name TEXT NOT NULL,
                        guild_id TEXT,
                        channel_id TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS error_log (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        command_name TEXT,
                        error_message TEXT,
                        error_stack TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS feature_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        feature_name TEXT NOT NULL,
                        guild_id TEXT,
                        channel_id TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `;
                
                this.db.exec(sql, (err) => {
                    if (err) {
                        this.logger.error(`Error creating tables: ${err.message}`);
                        reject(err);
                        return;
                    }
                    
                    this.logger.info('Database tables created or verified');
                    resolve();
                });
            });
        } catch (error) {
            this.handleError(error, '_createTables', true);
        }
    }

    /**
     * Track command usage
     * @param {string} commandName - Name of the command
     * @param {string} [guildId] - Guild ID where command was used
     * @param {string} [channelId] - Channel ID where command was used
     * @returns {Promise<boolean>} - Success status
     */
    async trackCommand(commandName, guildId = null, channelId = null) {
        try {
            this.ensureInitialized();
            
            // Skip if analytics is disabled
            if (!this.config.get('analyticsEnabled', true)) {
                return true;
            }
            
            return new Promise((resolve) => {
                const sql = `
                    INSERT INTO command_usage (command_name, guild_id, channel_id)
                    VALUES (?, ?, ?)
                `;
                
                this.db.run(sql, [commandName, guildId, channelId], (err) => {
                    if (err) {
                        this.handleError(err, 'trackCommand');
                        resolve(false);
                        return;
                    }
                    
                    this.logger.debug(`Tracked command usage: ${commandName}`);
                    resolve(true);
                });
            });
        } catch (error) {
            this.handleError(error, 'trackCommand');
            return false;
        }
    }

    /**
     * Track feature usage
     * @param {string} featureName - Name of the feature
     * @param {string} [guildId] - Guild ID where feature was used
     * @param {string} [channelId] - Channel ID where feature was used
     * @returns {Promise<boolean>} - Success status
     */
    async trackFeature(featureName, guildId = null, channelId = null) {
        try {
            this.ensureInitialized();
            
            // Skip if analytics is disabled
            if (!this.config.get('analyticsEnabled', true)) {
                return true;
            }
            
            return new Promise((resolve) => {
                const sql = `
                    INSERT INTO feature_usage (feature_name, guild_id, channel_id)
                    VALUES (?, ?, ?)
                `;
                
                this.db.run(sql, [featureName, guildId, channelId], (err) => {
                    if (err) {
                        this.handleError(err, 'trackFeature');
                        resolve(false);
                        return;
                    }
                    
                    this.logger.debug(`Tracked feature usage: ${featureName}`);
                    resolve(true);
                });
            });
        } catch (error) {
            this.handleError(error, 'trackFeature');
            return false;
        }
    }

    /**
     * Log an error
     * @param {string} commandName - Name of the command
     * @param {Error} error - Error object
     * @returns {Promise<boolean>} - Success status
     */
    async logError(commandName, error) {
        try {
            this.ensureInitialized();
            
            // Skip if analytics is disabled
            if (!this.config.get('analyticsEnabled', true)) {
                return true;
            }
            
            return new Promise((resolve) => {
                const sql = `
                    INSERT INTO error_log (command_name, error_message, error_stack)
                    VALUES (?, ?, ?)
                `;
                
                this.db.run(sql, [
                    commandName,
                    error.message,
                    error.stack
                ], (err) => {
                    if (err) {
                        this.handleError(err, 'logError');
                        resolve(false);
                        return;
                    }
                    
                    this.logger.debug(`Logged error for command: ${commandName}`);
                    resolve(true);
                });
            });
        } catch (error) {
            this.handleError(error, 'logError');
            return false;
        }
    }

    /**
     * Get command usage statistics
     * @param {number} [days=7] - Number of days to look back
     * @returns {Promise<Array>} - Command usage statistics
     */
    async getCommandStats(days = 7) {
        try {
            this.ensureInitialized();
            
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT command_name, COUNT(*) as count
                    FROM command_usage
                    WHERE timestamp >= datetime('now', '-${days} days')
                    GROUP BY command_name
                    ORDER BY count DESC
                `;
                
                this.db.all(sql, [], (err, rows) => {
                    if (err) {
                        this.handleError(err, 'getCommandStats');
                        resolve([]);
                        return;
                    }
                    
                    resolve(rows);
                });
            });
        } catch (error) {
            this.handleError(error, 'getCommandStats');
            return [];
        }
    }

    /**
     * Clean up resources before shutdown
     */
    async shutdown() {
        if (this.db) {
            try {
                await new Promise((resolve, reject) => {
                    this.db.close((err) => {
                        if (err) {
                            this.logger.error(`Error closing database: ${err.message}`);
                            reject(err);
                            return;
                        }
                        this.logger.info('Analytics database closed');
                        resolve();
                    });
                });
            } catch (error) {
                this.handleError(error, 'shutdown');
            }
        }
    }
}

// Create and export singleton instance
const analytics = new CommandAnalyticsService();
export { analytics };
export default CommandAnalyticsService;
