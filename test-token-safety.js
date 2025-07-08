/**
 * Token Safety Test Script
 * This script checks if your token is loaded properly without exposing it.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if token exists without exposing it
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ DISCORD_TOKEN is missing in your .env file');
  process.exit(1);
}

// Show first few characters only (safer way to verify it's loaded)
console.log(`✅ DISCORD_TOKEN is loaded successfully! (Starts with: ${token.substring(0, 4)}...)`);
console.log('✅ Length check:', token.length > 50 ? 'Valid token length' : 'Token seems too short');
console.log('✅ Configuration test complete');
