import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const token = process.env.DISCORD_TOKEN;
export const clientId = process.env.CLIENT_ID;
export const guildId = process.env.GUILD_ID;
export const sportsDataApiKey = process.env.SPORTSDATA_API_KEY;

// Configuration object for better organization
export const config = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    database: {
        path: process.env.DB_PATH || './data/fightbot.db',
        backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL) || 24 * 60 * 60 * 1000 // 24 hours
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 30 * 60 * 1000, // 30 minutes
        maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100
    },
    api: {
        timeout: parseInt(process.env.API_TIMEOUT) || 10000, // 10 seconds
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3
    },
    performance: {
        maxResponseTime: parseInt(process.env.MAX_RESPONSE_TIME) || 5000,
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 2000
    }
};

// Validation function
export function validateConfig() {
    const errors = [];
    
    if (!token) {
        errors.push('DISCORD_TOKEN is required');
    }
    
    if (!clientId) {
        errors.push('CLIENT_ID is required');
    }
    
    // Validate token format (basic check)
    if (token && !token.match(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
        errors.push('DISCORD_TOKEN format appears invalid');
    }
    
    // Validate client ID format
    if (clientId && !clientId.match(/^\d{17,19}$/)) {
        errors.push('CLIENT_ID format appears invalid (should be 17-19 digits)');
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration validation failed:');
        errors.forEach(error => console.error(`   • ${error}`));
        return false;
    }
    
    return true;
}