#!/usr/bin/env node

/**
 * FightBot Setup Utility
 * Helps with initial setup and configuration of the payment system
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserDatabaseService from './services/userDatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDB = new UserDatabaseService();

async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'init-db':
            await initializeDatabase();
            break;
        case 'check-env':
            checkEnvironmentVariables();
            break;
        case 'test-db':
            await testDatabase();
            break;
        case 'stats':
            await showStats();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

async function initializeDatabase() {
    console.log('🗄️ Initializing FightBot database...');
    
    try {
        await userDB.initialize();
        console.log('✅ Database initialized successfully!');
        console.log('📍 Database location: ./fightbot.db');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

function checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');
    
    const required = [
        'DISCORD_TOKEN',
        'CLIENT_ID',
        'GUILD_ID'
    ];
    
    const premium = [
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRICE_ID'
    ];
    
    const optional = [
        'WEBHOOK_PORT',
        'WEBHOOK_URL'
    ];
    
    let missingRequired = [];
    let missingPremium = [];
    
    // Check required variables
    required.forEach(key => {
        if (!process.env[key]) {
            missingRequired.push(key);
        } else {
            console.log(`✅ ${key}: Set`);
        }
    });
    
    // Check premium variables
    premium.forEach(key => {
        if (!process.env[key]) {
            missingPremium.push(key);
        } else {
            console.log(`💎 ${key}: Set`);
        }
    });
    
    // Check optional variables
    optional.forEach(key => {
        if (process.env[key]) {
            console.log(`🔧 ${key}: ${process.env[key]}`);
        } else {
            console.log(`⚠️ ${key}: Not set (using default)`);
        }
    });
    
    if (missingRequired.length > 0) {
        console.log('\\n❌ Missing required environment variables:');
        missingRequired.forEach(key => console.log(`   - ${key}`));
        console.log('\\n📝 Copy .env.example to .env and fill in these values');
    }
    
    if (missingPremium.length > 0) {
        console.log('\\n⚠️ Missing premium environment variables:');
        missingPremium.forEach(key => console.log(`   - ${key}`));
        console.log('\\n💡 These are needed for payment processing');
    }
    
    if (missingRequired.length === 0 && missingPremium.length === 0) {
        console.log('\\n🎉 All environment variables are configured!');
    }
}

async function testDatabase() {
    console.log('🧪 Testing database operations...');
    
    try {
        await userDB.initialize();
        console.log('✅ Database connection: OK');
        
        // Test user creation
        const testUserId = 'test_' + Date.now();
        await userDB.createUser(testUserId, 'TestUser');
        console.log('✅ User creation: OK');
        
        // Test user retrieval
        const user = await userDB.getUserByDiscordId(testUserId);
        if (user && user.discord_id === testUserId) {
            console.log('✅ User retrieval: OK');
        } else {
            throw new Error('User retrieval failed');
        }
        
        // Test command tracking
        await userDB.trackUsage(testUserId, 'test', 'test-feature');
        console.log('✅ Command tracking: OK');
        
        // Test stats
        const stats = await userDB.getSubscriptionStats();
        if (stats && typeof stats.totalUsers === 'number') {
            console.log('✅ Statistics: OK');
        } else {
            throw new Error('Statistics failed');
        }
        
        console.log('\\n🎉 All database tests passed!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    }
}

async function showStats() {
    console.log('📊 FightBot Statistics\\n');
    
    try {
        await userDB.initialize();
        const stats = await userDB.getSubscriptionStats();
        
        console.log(`👥 Total Users: ${stats.totalUsers}`);
        console.log(`⭐ Premium Users: ${stats.activeSubscriptions}`);
        console.log(`📈 Conversion Rate: ${((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%`);
        console.log(`💰 Monthly Revenue: $${(stats.activeSubscriptions * 4.99).toFixed(2)}`);
        console.log(`📅 New Users (30d): ${stats.newUsersThisMonth}`);
        console.log(`🔄 Renewals (30d): ${stats.renewalsThisMonth}`);
        
        // Command usage
        const usage = await userDB.getCommandUsageStats();
        console.log('\\n🎯 Popular Commands:');
        usage.forEach((cmd, i) => {
            console.log(`   ${i + 1}. /${cmd.command_name} (${cmd.usage_count} times)`);
        });
        
    } catch (error) {
        console.error('❌ Failed to get statistics:', error.message);
    }
}

function showHelp() {
    console.log(`
🤖 FightBot Setup Utility

Usage: node setup.js <command>

Commands:
  init-db     Initialize the database
  check-env   Check environment variables
  test-db     Test database operations
  stats       Show bot statistics
  help        Show this help message

Examples:
  node setup.js init-db
  node setup.js check-env
  node setup.js test-db
  node setup.js stats

For more information, see PAYMENT-SETUP-GUIDE.md
    `);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error.message);
    process.exit(1);
});

// Run the utility
main().catch(error => {
    console.error('❌ Setup utility error:', error.message);
    process.exit(1);
});
