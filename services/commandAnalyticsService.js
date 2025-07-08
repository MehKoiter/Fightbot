/**
 * Command Analytics Service
 * Tracks command usage without storing user information
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CommandAnalyticsService {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.initPromise = null;
    }

    async init() {
        // If already initialized or in progress, return the existing promise
        if (this.initialized) {
            return Promise.resolve();
        }
        
        if (this.initPromise) {
            return this.initPromise;
        }
        
        try {
            this.initPromise = new Promise((resolve, reject) => {
                try {
                    // Ensure data directory exists
                    const dataDir = path.join(__dirname, '..', 'data');
                    
                    // Create the directory if it doesn't exist
                    if (!fs.existsSync(dataDir)) {
                        try {
                            fs.mkdirSync(dataDir, { recursive: true });
                            console.log(`Created data directory at ${dataDir}`);
                        } catch (dirErr) {
                            console.error(`Error creating data directory: ${dirErr.message}`);
                        }
                    }
                    
                    // Use full path for database
                    const dbPath = path.join(dataDir, 'analytics.db');
                    
                    // Create database connection with verbose error handling
                    this.db = new sqlite3.Database(dbPath, (err) => {
                        if (err) {
                            console.error(`Error opening analytics database at ${dbPath}:`, err.message);
                            // Still resolve but with a warning
                            this.db = null;
                            console.warn('⚠️ Analytics will be disabled');
                            this.initialized = true;
                            resolve();
                        } else {
                            // Use non-async callback to create tables
                            this.createTables()
                                .then(() => {
                                    console.log('✅ Command analytics database initialized');
                                    this.initialized = true;
                                    resolve();
                                })
                                .catch(tableErr => {
                                    console.error('Error creating analytics tables:', tableErr.message);
                                    // Still resolve but with a warning
                                    console.warn('⚠️ Analytics may not work correctly');
                                    this.initialized = true;
                                    resolve();
                                });
                        }
                    });
                } catch (error) {
                    console.error('Error in DB initialization:', error);
                    this.initialized = true;
                    resolve();
                }
            });
            
            return this.initPromise;
            
        } catch (error) {
            console.error('Unexpected error initializing analytics:', error);
            this.initialized = true;
            // Don't let this crash the application
            return Promise.resolve();
        }
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            // Only create a simple command analytics table without user references
            const createTable = `
                CREATE TABLE IF NOT EXISTS command_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command_name TEXT NOT NULL,
                    usage_count INTEGER DEFAULT 1,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                    guild_count INTEGER DEFAULT 1
                )
            `;

            this.db.exec(createTable, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Anonymous Command Analytics
    async trackCommand(commandName, guildId = null) {
        // Make sure we're initialized
        if (!this.initialized) {
            try {
                await this.init();
            } catch (initError) {
                console.warn('⚠️ Failed to initialize analytics database:', initError.message);
                return Promise.resolve();
            }
        }
        
        // Safely handle DB not being initialized
        if (!this.db) {
            console.warn('⚠️ Analytics database not initialized, cannot track command');
            return Promise.resolve();
        }
        
        try {
            return new Promise((resolve, reject) => {
                // First try to update existing record
                this.db.run(
                    `UPDATE command_analytics 
                    SET usage_count = usage_count + 1, 
                        last_used = CURRENT_TIMESTAMP 
                    WHERE command_name = ?`,
                    [commandName],
                    function(err) {
                        if (err) {
                            console.error(`Error updating command count for ${commandName}:`, err.message);
                            // Don't reject, just resolve with warning to not crash the application
                            console.warn('⚠️ Analytics error, continuing with command execution');
                            resolve(null);
                            return;
                        }
                        
                        // If command wasn't found (no update occurred), insert a new record
                        if (this.changes === 0) {
                            try {
                                const stmt = this.db.prepare(
                                    `INSERT INTO command_analytics (command_name) VALUES (?)`
                                );
                                
                                stmt.run([commandName], function(insertErr) {
                                    if (insertErr) {
                                        console.error(`Error inserting new command ${commandName}:`, insertErr.message);
                                        // Don't reject, just resolve with warning to not crash the application
                                        console.warn('⚠️ Analytics insert error, continuing with command execution');
                                        resolve(null);
                                    } else {
                                        resolve(this.lastID);
                                    }
                                });
                                stmt.finalize();
                            } catch (prepareErr) {
                                console.error('Error preparing statement:', prepareErr.message);
                                // Don't reject, just resolve with warning to not crash the application
                                console.warn('⚠️ Analytics prepare error, continuing with command execution');
                                resolve(null);
                            }
                        } else {
                            resolve(this.changes);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Unexpected error in trackCommand:', error);
            return Promise.resolve(); // Don't let this crash the application
        }
    }
    
    // Analytics Reporting
    async getCommandStats() {
        // Make sure we're initialized
        if (!this.initialized) {
            try {
                await this.init();
            } catch (initError) {
                console.warn('⚠️ Failed to initialize analytics database:', initError.message);
                return [];
            }
        }
        
        // Return empty array if DB isn't available
        if (!this.db) {
            console.warn('⚠️ Analytics database not initialized, cannot get command stats');
            return [];
        }
        
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT command_name, usage_count, last_used 
                 FROM command_analytics 
                 ORDER BY usage_count DESC`,
                (err, rows) => {
                    if (err) {
                        console.error('Error getting command stats:', err.message);
                        // Don't reject, just return empty array to not crash the application
                        resolve([]);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }
    
    // Gets total commands executed
    async getTotalCommandCount() {
        // Make sure we're initialized
        if (!this.initialized) {
            try {
                await this.init();
            } catch (initError) {
                console.warn('⚠️ Failed to initialize analytics database:', initError.message);
                return 0;
            }
        }
        
        // Return 0 if DB isn't available
        if (!this.db) {
            console.warn('⚠️ Analytics database not initialized, cannot get total command count');
            return 0;
        }
        
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT SUM(usage_count) as total 
                 FROM command_analytics`,
                (err, row) => {
                    if (err) {
                        console.error('Error getting total command count:', err.message);
                        // Don't reject, just return 0 to not crash the application
                        resolve(0);
                    } else {
                        resolve(row?.total || 0);
                    }
                }
            );
        });
    }
    
    // Get stats for a specific command
    async getCommandUsage(commandName) {
        // Make sure we're initialized
        if (!this.initialized) {
            try {
                await this.init();
            } catch (initError) {
                console.warn('⚠️ Failed to initialize analytics database:', initError.message);
                return { command_name: commandName, usage_count: 0 };
            }
        }
        
        // Return default if DB isn't available
        if (!this.db) {
            console.warn('⚠️ Analytics database not initialized, cannot get command usage');
            return { command_name: commandName, usage_count: 0 };
        }
        
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT command_name, usage_count, last_used 
                 FROM command_analytics 
                 WHERE command_name = ?`,
                [commandName],
                (err, row) => {
                    if (err) {
                        console.error(`Error getting usage for command ${commandName}:`, err.message);
                        // Don't reject, just return default to not crash the application
                        resolve({ command_name: commandName, usage_count: 0 });
                    } else {
                        resolve(row || { command_name: commandName, usage_count: 0 });
                    }
                }
            );
        });
    }
}

export default CommandAnalyticsService;
