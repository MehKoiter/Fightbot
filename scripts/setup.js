/**
 * FightBot Setup Script
 * Helper script to setup the bot
 * Run with: node scripts/setup.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🤖 FightBot Setup Helper');
console.log('========================');

// Check for .env file
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file. Please edit it with your Discord credentials.');
} else if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists.');
} else {
    console.log('❌ .env.example file not found. Please create a .env file manually.');
}

// Create data directory if it doesn't exist
const dataDir = path.join(rootDir, 'data');
if (!fs.existsSync(dataDir)) {
    console.log('📁 Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory.');
} else {
    console.log('✅ Data directory already exists.');
}

// Print setup instructions
console.log('\n📋 Setup Instructions:');
console.log('1. Edit the .env file with your Discord bot token and client ID');
console.log('2. Install dependencies: npm install');
console.log('3. Deploy commands: npm run deploy:dev (for testing) or npm run deploy (for production)');
console.log('4. Start the bot: npm start');
console.log('\n📚 For more information, see the README.md file.');
