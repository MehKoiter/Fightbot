/**
 * FightBot Setup Utility
 * Helps with initial setup, database initialization, and environment checks
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Main setup function
 * @param {string} action - Setup action to perform
 */
async function setup(action = 'help') {
    console.log('🤖 FightBot Setup Utility');
    console.log('------------------------');
    
    switch (action) {
        case 'init-db':
            await initDatabase();
            break;
        case 'check-env':
            checkEnvironment();
            break;
        case 'test-db':
            await testDatabase();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

/**
 * Initialize the database
 */
async function initDatabase() {
    try {
        console.log('📁 Initializing data directories...');
        
        // Create data directory if it doesn't exist
        const dataDir = process.env.DATA_DIRECTORY || path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`✅ Created data directory: ${dataDir}`);
        } else {
            console.log(`✅ Data directory already exists: ${dataDir}`);
        }
        
        // Create logs directory if it doesn't exist
        const logsDir = path.join(dataDir, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log(`✅ Created logs directory: ${logsDir}`);
        } else {
            console.log(`✅ Logs directory already exists: ${logsDir}`);
        }
        
        // Create database file if it doesn't exist
        const dbPath = process.env.DB_PATH || path.join(dataDir, 'fightbot.db');
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, '');
            console.log(`✅ Created database file: ${dbPath}`);
        } else {
            console.log(`✅ Database file already exists: ${dbPath}`);
        }
        
        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
    console.log('🔍 Checking environment configuration...');
    
    const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const missingVars = [];
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missingVars.push(varName);
        }
    }
    
    if (missingVars.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.log(`📝 Please update your .env file with the required variables`);
        
        // Check if .env file exists
        const envPath = path.join(__dirname, '..', '.env');
        if (!fs.existsSync(envPath)) {
            const examplePath = path.join(__dirname, '..', '.env.example');
            if (fs.existsSync(examplePath)) {
                fs.copyFileSync(examplePath, envPath);
                console.log(`✅ Created .env file from example. Please update with your values.`);
            } else {
                console.error(`❌ No .env.example file found.`);
            }
        }
    } else {
        console.log(`✅ All required environment variables are set`);
        
        // Check optional variables
        const optionalVars = ['GUILD_ID', 'NODE_ENV', 'LOG_LEVEL'];
        const missingOptional = optionalVars.filter(varName => !process.env[varName]);
        
        if (missingOptional.length > 0) {
            console.log(`ℹ️ Optional variables not set: ${missingOptional.join(', ')}`);
        }
    }
    
    // Check Node.js version
    const nodeVersion = process.versions.node;
    const majorVersion = parseInt(nodeVersion.split('.')[0]);
    
    if (majorVersion < 18) {
        console.warn(`⚠️ Node.js version ${nodeVersion} detected. FightBot works best with Node.js 18+`);
    } else {
        console.log(`✅ Node.js version ${nodeVersion} is compatible`);
    }
    
    console.log('✅ Environment check complete');
}

/**
 * Test database connection
 */
async function testDatabase() {
    try {
        console.log('🧪 Testing database connection...');
        
        // Here you would add actual database connection tests
        // For now, we'll just check if the file exists
        
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/fightbot.db');
        
        if (fs.existsSync(dbPath)) {
            console.log(`✅ Database file exists: ${dbPath}`);
        } else {
            console.error(`❌ Database file not found: ${dbPath}`);
            console.log(`ℹ️ Run 'npm run setup:init' to create the database file`);
        }
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
Available commands:
  npm run setup:init    - Initialize database and directories
  npm run setup:check   - Check environment variables
  npm run setup:test    - Test database connection
    `);
}

// Run setup with command line argument
const action = process.argv[2] || 'help';
setup(action);
