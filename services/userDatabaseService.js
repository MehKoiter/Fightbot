/**
 * User Database Service - FREE VERSION
 * Manages basic user tracking and statistics (no authentication required)
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserDatabaseService {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '..', 'data', 'fightbot.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('✅ User database initialized');
                    resolve();
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discord_id TEXT UNIQUE NOT NULL,
                    discord_username TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    preferences TEXT DEFAULT '{}'
                )
            `;

            const createUsageTable = `
                CREATE TABLE IF NOT EXISTS usage_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    command_name TEXT,
                    usage_type TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            this.db.exec(`
                ${createUsersTable};
                ${createUsageTable};
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // User Management
    async createUser(discordId, discordUsername) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO users (discord_id, discord_username)
                VALUES (?, ?)
            `);
            
            stmt.run([discordId, discordUsername], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            stmt.finalize();
        });
    }

    async getUserByDiscordId(discordId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE discord_id = ?',
                [discordId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async updateLastLogin(discordId) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE discord_id = ?
            `);
            
            stmt.run([discordId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    // Usage Tracking
    async trackUsage(discordId, commandName, usageType) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return;

        return new Promise((resolve, reject) => {
            // Simply insert a new usage record (no aggregation needed for free version)
            const stmt = this.db.prepare(`
                INSERT INTO usage_stats (user_id, command_name, usage_type) 
                VALUES (?, ?, ?)
            `);
            
            stmt.run([user.id, commandName, usageType], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            stmt.finalize();
        });
    }

    async getUserUsageStats(discordId, days = 30) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return null;

        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    command_name,
                    usage_type,
                    COUNT(*) as usage_count
                FROM usage_stats 
                WHERE user_id = ? AND timestamp >= datetime('now', '-${days} days')
                GROUP BY command_name, usage_type
                ORDER BY usage_count DESC
            `, [user.id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // User preferences
    async updateUserPreferences(discordId, preferences) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE users 
                SET preferences = ?, updated_at = CURRENT_TIMESTAMP
                WHERE discord_id = ?
            `);
            
            stmt.run([JSON.stringify(preferences), discordId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    async getUserPreferences(discordId) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return {};

        try {
            return JSON.parse(user.preferences || '{}');
        } catch (e) {
            console.error('Error parsing user preferences:', e);
            return {};
        }
    }

    // Admin methods
    async getAllUsers(limit = 100, offset = 0) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [limit, offset],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    async getUserCount() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.count : 0);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export default UserDatabaseService;
