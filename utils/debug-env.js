#!/usr/bin/env node

/**
 * Environment Variable Debug Script for Render
 * This helps us see exactly what Render is receiving
 */

import dotenv from 'dotenv';

// Load environment variables from .env file (for local testing)
dotenv.config();

console.log('🔍 Render Environment Debug Check');
console.log('=================================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('CLIENT_ID:', process.env.CLIENT_ID || 'NOT SET');
console.log('GUILD_ID:', process.env.GUILD_ID || 'NOT SET');
console.log('DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN?.length || 0);
console.log('DISCORD_TOKEN first 20 chars:', process.env.DISCORD_TOKEN?.substring(0, 20) || 'NOT SET');
console.log('================================');

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is missing in Render environment');
    console.log('Available environment variables:');
    Object.keys(process.env).sort().forEach(key => {
        if (key.includes('DISCORD') || key.includes('CLIENT') || key.includes('NODE')) {
            console.log(`  ${key}: ${process.env[key]?.substring(0, 20)}...`);
        }
    });
    process.exit(1);
} else {
    console.log('✅ DISCORD_TOKEN is properly set in Render environment');
    process.exit(0);
}
