/**
 * User Database Service - Free Version
 * Manages basic user stats and usage tracking
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserDatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/users.db');
        this.db = null;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                console.log('📁 Creating data directory...');
                fs.mkdirSync(dataDir, { recursive: true });
            }

            return new Promise((resolve, reject) => {
                console.log(`📊 Connecting to database at: ${this.dbPath}`);
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('❌ Database connection failed:', err.message);
                        reject(new Error(`Database connection failed: ${err.message}`));
                    } else {
                        console.log('✅ Database connected successfully');
                        this.createTables()
                            .then(() => {
                                console.log('✅ Database initialization completed');
                                resolve(true);
                            })
                            .catch((tableErr) => {
                                console.error('❌ Table creation failed:', tableErr.message);
                                reject(new Error(`Table creation failed: ${tableErr.message}`));
                            });
                    }
                });
            });
        } catch (error) {
            console.error('❌ Database initialization error:', error.message);
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
        if (!this.db) {
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
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async getCommandStats() {
        // Check if database is ready
        if (!this.db) {
            return { totalCommands: 0, commandBreakdown: [] };
        }
        
        return new Promise((resolve, reject) => {
            // Get total command usage
            this.db.get(
                'SELECT COUNT(*) as total FROM command_analytics',
                (err, totalRow) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Get breakdown by command
                    this.db.all(
                        'SELECT command_name, COUNT(*) as count FROM command_analytics GROUP BY command_name ORDER BY count DESC',
                        (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    totalCommands: totalRow.total,
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
        if (this.db) {
            this.db.close();
        }
    }
}

export default UserDatabaseService;
