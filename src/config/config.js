/**
 * Environment Configuration Manager
 * Manages different configuration settings based on environment
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config();

// Environment-specific settings
const environments = {
    development: {
        dataDirectory: path.join(__dirname, '..', '..', 'data'),
        logLevel: 'debug',
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
    },
    production: {
        dataDirectory: process.env.DATA_DIRECTORY || path.join(__dirname, '..', '..', 'data'),
        logLevel: 'info',
        cacheTimeout: 30 * 60 * 1000, // 30 minutes
    },
    test: {
        dataDirectory: path.join(__dirname, '..', '..', 'test-data'),
        logLevel: 'debug',
        cacheTimeout: 1000, // 1 second
    }
};

// Get current environment from NODE_ENV
const currentEnv = process.env.NODE_ENV || 'development';

// Core configuration
const coreConfig = {
    // Bot information
    bot: {
        name: 'FightBot',
        version: process.env.BOT_VERSION || '1.0.0-free',
        description: 'UFC fight information and analytics bot for Discord',
    },
    
    // Discord configuration
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID,
        devMode: currentEnv === 'development',
    },
    
    // Feature settings
    features: {
        // Features are all enabled in the free version
        basicFightCard: true,
        upcomingEvents: true,
        fightAnalysis: true,
        fighterRecords: true,
        venueInfo: true,
        fightTimes: true,
        refreshData: true,
        detailedStats: true,
        predictionAlerts: true,
        customNotifications: true,
        advancedAnalytics: true,
        historicalData: true,
        betOddsTracking: true,
        multiEventTracking: true,
        personalizedFeed: true,
        exportData: true,
    },
    
    // External API settings
    apis: {
        ufc: {
            baseUrl: 'https://www.ufc.com',
            eventsPath: '/events',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
    },
    
    // Links
    links: {
        support: 'https://patreon.com/fightbot',
        website: 'https://github.com/MehKoiter/Fightbot',
        invite: process.env.DISCORD_INVITE_LINK || 'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=277025704000',
    },
    
    // Messages
    messages: {
        freeVersionFooter: "FightBot - Free Forever! ❤️",
        premiumPromotion: "❤️ **Support FightBot** on Patreon to help fund development and keep all features free!",
        featureDisabled: "🎉 This feature is FREE and available to everyone!"
    }
};

// Create the final config by merging environment-specific settings with core config
const config = {
    ...coreConfig,
    env: currentEnv,
    ...environments[currentEnv],
    
    // Helper methods
    isProduction: () => currentEnv === 'production',
    isDevelopment: () => currentEnv === 'development',
    isTest: () => currentEnv === 'test',
    
    // Legacy compatibility helpers
    isFree: () => true,
    isPremium: () => true,
    isFeatureEnabled: (featureName) => coreConfig.features[featureName] === true,
};

export default config;
