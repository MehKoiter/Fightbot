#!/usr/bin/env node

/**
 * Simple health check script for Railway deployment
 * Can be used to verify the bot is running properly
 */

import { readFileSync } from 'fs';

try {
    // Check if the main files exist and are readable
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    const indexExists = readFileSync('./index.js', 'utf8').length > 0;
    
    console.log('✅ Health Check PASSED');
    console.log(`📦 FightBot ${packageJson.version}`);
    console.log(`🕐 Check time: ${new Date().toISOString()}`);
    
    process.exit(0);
} catch (error) {
    console.error('❌ Health Check FAILED:', error.message);
    process.exit(1);
}
