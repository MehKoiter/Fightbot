/**
 * User Database Service
 * Manages user accounts, subscriptions, and premium access
 */

import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserDatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/users.db');
        this.db = null;
        this.JWT_SECRET = process.env.JWT_SECRET || 'fightbot-premium-secret-key';
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.createTables().then(resolve).catch(reject);
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
                    email TEXT UNIQUE,
                    subscription_type TEXT DEFAULT 'free',
                    subscription_status TEXT DEFAULT 'inactive',
                    stripe_customer_id TEXT,
                    subscription_start_date DATETIME,
                    subscription_end_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    preferences TEXT DEFAULT '{}'
                )
            `;

            const createSubscriptionsTable = `
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    stripe_subscription_id TEXT UNIQUE,
                    plan_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_period_start DATETIME,
                    current_period_end DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            const createPaymentsTable = `
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    stripe_payment_intent_id TEXT,
                    amount INTEGER,
                    currency TEXT DEFAULT 'usd',
                    status TEXT,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            const createUsageTable = `
                CREATE TABLE IF NOT EXISTS usage_tracking (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    command_name TEXT,
                    feature_used TEXT,
                    usage_count INTEGER DEFAULT 1,
                    date DATE DEFAULT CURRENT_DATE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            this.db.exec(`
                ${createUsersTable};
                ${createSubscriptionsTable};
                ${createPaymentsTable};
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
    async createUser(discordId, discordUsername, email = null) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO users (discord_id, discord_username, email)
                VALUES (?, ?, ?)
            `);
            
            stmt.run([discordId, discordUsername, email], function(err) {
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

    async updateUserSubscription(discordId, subscriptionData) {
        const { type, status, stripeCustomerId, startDate, endDate } = subscriptionData;
        
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE users 
                SET subscription_type = ?, 
                    subscription_status = ?, 
                    stripe_customer_id = ?, 
                    subscription_start_date = ?, 
                    subscription_end_date = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE discord_id = ?
            `);
            
            stmt.run([type, status, stripeCustomerId, startDate, endDate, discordId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    // Subscription Management
    async createSubscription(userId, subscriptionData) {
        const { stripeSubscriptionId, planType, status, currentPeriodStart, currentPeriodEnd } = subscriptionData;
        
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO subscriptions (user_id, stripe_subscription_id, plan_type, status, current_period_start, current_period_end)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([userId, stripeSubscriptionId, planType, status, currentPeriodStart, currentPeriodEnd], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            stmt.finalize();
        });
    }

    async updateSubscriptionStatus(stripeSubscriptionId, status, currentPeriodEnd = null) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE subscriptions SET status = ?, updated_at = CURRENT_TIMESTAMP';
            let params = [status];
            
            if (currentPeriodEnd) {
                query += ', current_period_end = ?';
                params.push(currentPeriodEnd);
            }
            
            query += ' WHERE stripe_subscription_id = ?';
            params.push(stripeSubscriptionId);
            
            const stmt = this.db.prepare(query);
            stmt.run(params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    // Premium Access Checking
    async isPremiumUser(discordId) {
        const user = await this.getUserByDiscordId(discordId);
        
        if (!user) return false;
        
        // Check if user has active subscription
        if (user.subscription_status !== 'active') return false;
        
        // Check if subscription hasn't expired
        if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) {
            // Subscription expired, update status
            await this.updateUserSubscription(discordId, {
                type: 'free',
                status: 'expired',
                stripeCustomerId: user.stripe_customer_id,
                startDate: user.subscription_start_date,
                endDate: user.subscription_end_date
            });
            return false;
        }
        
        return ['monthly', 'yearly', 'lifetime'].includes(user.subscription_type);
    }

    async getSubscriptionInfo(discordId) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return null;

        return {
            type: user.subscription_type,
            status: user.subscription_status,
            startDate: user.subscription_start_date,
            endDate: user.subscription_end_date,
            isPremium: await this.isPremiumUser(discordId)
        };
    }

    // Usage Tracking
    async trackUsage(discordId, commandName, featureUsed) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return;

        return new Promise((resolve, reject) => {
            // Check if usage entry exists for today
            this.db.get(
                'SELECT id, usage_count FROM usage_tracking WHERE user_id = ? AND command_name = ? AND feature_used = ? AND date = CURRENT_DATE',
                [user.id, commandName, featureUsed],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        // Update existing usage count
                        const stmt = this.db.prepare('UPDATE usage_tracking SET usage_count = usage_count + 1 WHERE id = ?');
                        stmt.run([row.id], function(err) {
                            if (err) reject(err);
                            else resolve(row.usage_count + 1);
                        });
                        stmt.finalize();
                    } else {
                        // Create new usage entry
                        const stmt = this.db.prepare('INSERT INTO usage_tracking (user_id, command_name, feature_used) VALUES (?, ?, ?)');
                        stmt.run([user.id, commandName, featureUsed], function(err) {
                            if (err) reject(err);
                            else resolve(1);
                        });
                        stmt.finalize();
                    }
                }
            );
        });
    }

    async getUserUsageStats(discordId, days = 30) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return null;

        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    command_name,
                    feature_used,
                    SUM(usage_count) as total_usage,
                    COUNT(*) as days_used
                FROM usage_tracking 
                WHERE user_id = ? AND date >= date('now', '-${days} days')
                GROUP BY command_name, feature_used
                ORDER BY total_usage DESC
            `, [user.id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get command usage statistics
     */
    async getCommandUsageStats(limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT feature_used as command_name, SUM(usage_count) as usage_count
                FROM usage_tracking 
                WHERE feature_used != 'command'
                GROUP BY feature_used 
                ORDER BY usage_count DESC 
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // Payment Tracking
    async recordPayment(discordId, paymentData) {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) throw new Error('User not found');

        const { stripePaymentIntentId, amount, currency, status, description } = paymentData;

        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO payments (user_id, stripe_payment_intent_id, amount, currency, status, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([user.id, stripePaymentIntentId, amount, currency, status, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            stmt.finalize();
        });
    }

    // Analytics
    async getSubscriptionStats() {
        return new Promise((resolve, reject) => {
            const queries = {
                totalUsers: "SELECT COUNT(*) as count FROM users",
                activeSubscriptions: "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'",
                newUsersThisMonth: `
                    SELECT COUNT(*) as count FROM users 
                    WHERE datetime(created_at) >= datetime('now', '-30 days')
                `,
                renewalsThisMonth: `
                    SELECT COUNT(*) as count FROM payments 
                    WHERE datetime(created_at) >= datetime('now', '-30 days') 
                    AND status = 'succeeded'
                `
            };

            const results = {};
            let completed = 0;
            const total = Object.keys(queries).length;

            Object.entries(queries).forEach(([key, query]) => {
                this.db.get(query, (err, row) => {
                    if (err) {
                        console.error(`Error in ${key} query:`, err);
                        results[key] = 0;
                    } else {
                        results[key] = row ? row.count : 0;
                    }
                    
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                });
            });
        });
    }

    async getRevenue(days = 30) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as payment_count,
                    SUM(amount) as total_revenue,
                    AVG(amount) as avg_payment
                FROM payments 
                WHERE status = 'succeeded' AND created_at >= date('now', '-${days} days')
            `, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get revenue analytics
     */
    async getRevenueAnalytics() {
        return new Promise((resolve, reject) => {
            const queries = {
                monthlyRevenue: `
                    SELECT COUNT(*) * 4.99 as revenue 
                    FROM users 
                    WHERE subscription_status = 'active'
                `,
                yearToDateRevenue: `
                    SELECT SUM(amount) as revenue 
                    FROM payments 
                    WHERE strftime('%Y', created_at) = strftime('%Y', 'now')
                `,
                averageLifetimeValue: `
                    SELECT AVG(total_paid) as avg_ltv 
                    FROM (
                        SELECT user_id, SUM(amount) as total_paid 
                        FROM payments 
                        GROUP BY user_id
                    )
                `,
                totalPayments: `
                    SELECT COUNT(*) as total 
                    FROM payments 
                    WHERE status = 'succeeded'
                `
            };

            const results = {};
            let completed = 0;
            const total = Object.keys(queries).length;

            Object.entries(queries).forEach(([key, query]) => {
                this.db.get(query, (err, row) => {
                    if (err) {
                        console.error(`Error in ${key} query:`, err);
                        results[key] = 0;
                    } else {
                        results[key] = row ? (row.revenue || row.avg_ltv || row.total || 0) : 0;
                    }
                    
                    completed++;
                    if (completed === total) {
                        // Calculate churn and retention rates (simplified)
                        results.churnRate = 5.0; // Placeholder
                        results.retentionRate = 95.0; // Placeholder
                        resolve(results);
                    }
                });
            });
        });
    }

    // Cleanup and maintenance
    async cleanupExpiredSubscriptions() {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE users 
                SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP
                WHERE subscription_end_date < CURRENT_TIMESTAMP AND subscription_status = 'active'
            `);
            
            stmt.run(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
            stmt.finalize();
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
