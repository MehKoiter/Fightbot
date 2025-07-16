/**
 * User Database Service - Free Version
 * Manages basic user stats and usage tracking
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Enable verbose mode for better error reporting
sqlite3.verbose();

// Safe path resolution for ES modules
let __filename, __dirname;
try {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
} catch (error) {
    console.warn('⚠️ Failed to resolve __dirname, using fallback');
    __dirname = process.cwd();
}

class UserDatabaseService {
    constructor() {
        try {
            // Use a more deployment-friendly database path
            // In production environments like Render, use /tmp for writable storage
            const isProduction = process.env.NODE_ENV === 'production';
            
            if (isProduction) {
                // Use /tmp directory which is writable in most cloud environments
                this.dbPath = path.join('/tmp', 'users.db');
            } else {
                // Use local data directory for development
                this.dbPath = path.join(__dirname, '../data/users.db');
            }
            
            this.db = null;
            this.isInitialized = false;
            console.log(`📊 Database path: ${this.dbPath}`);
        } catch (error) {
            console.error('❌ Error in UserDatabaseService constructor:', error.message);
            // Set fallback values
            this.dbPath = ':memory:';
            this.db = null;
            this.isInitialized = false;
        }
    }

    async initialize() {
        try {
            console.log('🔧 Starting database initialization...');
            console.log('Environment details:', {
                NODE_ENV: process.env.NODE_ENV,
                platform: process.platform,
                cwd: process.cwd(),
                dbPath: this.dbPath
            });
            
            const isProduction = process.env.NODE_ENV === 'production';
            
            // Only try to create data directory in development
            if (!isProduction) {
                try {
                    const dataDir = path.dirname(this.dbPath);
                    if (!fs.existsSync(dataDir)) {
                        console.log('📁 Creating data directory...');
                        fs.mkdirSync(dataDir, { recursive: true });
                    }
                } catch (dirError) {
                    console.warn('⚠️ Failed to create data directory:', dirError.message);
                    // Fall back to in-memory database
                    this.dbPath = ':memory:';
                }
            }

            return new Promise((resolve, reject) => {
                console.log(`📊 Connecting to database at: ${this.dbPath}`);
                
                try {
                    this.db = new sqlite3.Database(this.dbPath, (err) => {
                        if (err) {
                            console.error('❌ Database connection failed:', err.message);
                            
                            // In production or if file connection fails, fall back to in-memory database
                            console.log('⚠️ Falling back to in-memory database...');
                            this.db = new sqlite3.Database(':memory:', (memErr) => {
                                if (memErr) {
                                    console.error('❌ In-memory database failed:', memErr.message);
                                    this.isInitialized = false;
                                    reject(new Error(`Database initialization failed: ${memErr.message}`));
                                } else {
                                    console.log('✅ In-memory database connected successfully');
                                    this.createTables()
                                        .then(() => {
                                            console.log('✅ Database initialization completed (in-memory)');
                                            this.isInitialized = true;
                                            resolve(true);
                                        })
                                        .catch((tableErr) => {
                                            console.error('❌ Table creation failed:', tableErr.message);
                                            this.isInitialized = false;
                                            reject(new Error(`Table creation failed: ${tableErr.message}`));
                                        });
                                }
                            });
                        } else {
                            console.log('✅ Database connected successfully');
                            this.createTables()
                                .then(() => {
                                    console.log('✅ Database initialization completed');
                                    this.isInitialized = true;
                                    resolve(true);
                                })
                                .catch((tableErr) => {
                                    console.error('❌ Table creation failed:', tableErr.message);
                                    this.isInitialized = false;
                                    reject(new Error(`Table creation failed: ${tableErr.message}`));
                                });
                        }
                    });
                } catch (dbCreateError) {
                    console.error('❌ Failed to create database instance:', dbCreateError.message);
                    this.isInitialized = false;
                    reject(new Error(`Database creation failed: ${dbCreateError.message}`));
                }
            });
        } catch (error) {
            console.error('❌ Database initialization error:', error.message);
            this.isInitialized = false;
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            // Simple command analytics table - no personal data stored
            const createAnalyticsTable = `
                CREATE TABLE IF NOT EXISTS command_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command_name TEXT NOT NULL,
                    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    server_id TEXT
                )
            `;

            this.db.exec(createAnalyticsTable, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database tables created successfully');
                    resolve();
                }
            });
        });
    }

    async logCommandUsage(commandName, serverId = null) {
        // Check if database is ready
        if (!this.db || !this.isInitialized) {
            console.warn('Database not initialized, skipping usage logging');
            return;
        }
        
        return new Promise((resolve, reject) => {
            // Log command usage without personal data
            this.db.run(
                'INSERT INTO command_analytics (command_name, server_id) VALUES (?, ?)',
                [commandName, serverId],
                function(err) {
                    if (err) {
                        console.warn('⚠️ Failed to log command usage:', err.message);
                        // Don't reject to prevent breaking the bot
                        resolve();
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async getCommandStats() {
        // Check if database is ready
        if (!this.db || !this.isInitialized) {
            return { totalCommands: 0, commandBreakdown: [] };
        }
        
        return new Promise((resolve, reject) => {
            // Get total command usage
            this.db.get(
                'SELECT COUNT(*) as total FROM command_analytics',
                (err, totalRow) => {
                    if (err) {
                        console.warn('⚠️ Failed to get command stats:', err.message);
                        resolve({ totalCommands: 0, commandBreakdown: [] });
                        return;
                    }

                    // Get breakdown by command
                    this.db.all(
                        'SELECT command_name, COUNT(*) as count FROM command_analytics GROUP BY command_name ORDER BY count DESC',
                        (err, rows) => {
                            if (err) {
                                console.warn('⚠️ Failed to get command breakdown:', err.message);
                                resolve({ totalCommands: totalRow?.total || 0, commandBreakdown: [] });
                            } else {
                                resolve({
                                    totalCommands: totalRow?.total || 0,
                                    commandBreakdown: rows || []
                                });
                            }
                        }
                    );
                }
            );
        });
    }

    // For compatibility with existing code - always return true for free version
    async hasActiveSubscription() {
        return true; // Everything is free!
    }

    async isPremiumUser() {
        return true; // Everyone is premium in free version!
    }

    async close() {
        try {
            if (this.db) {
                this.db.close();
                this.isInitialized = false;
                console.log('✅ Database closed successfully');
            }
        } catch (error) {
            console.warn('⚠️ Error closing database:', error.message);
        }
    }
}

export default UserDatabaseService;
