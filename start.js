#!/usr/bin/env node

/**
 * Heroku Startup Script for FightBot
 * Handles graceful startup and shutdown for Heroku environment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Import the main bot
import('./index.js').then(() => {
    console.log('🚀 FightBot started successfully on Heroku');
}).catch((error) => {
    console.error('❌ Failed to start FightBot:', error);
    process.exit(1);
});

// Graceful shutdown handling for Heroku
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
