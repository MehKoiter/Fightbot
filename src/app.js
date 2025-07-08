/**
 * FightBot - Main Bot Application Entry Point
 */

import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config/config.js';
import container from './services/serviceContainer.js';
import commandRegistry from './commands/commandRegistry.js';
import errorHandler from './utils/errorHandler.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FightBot Application Class
 */
class FightBotApplication {
    constructor() {
        // Initialize Discord client
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessageTyping,
            ]
        });
        
        // Register error handler
        container.register('errorHandler', () => errorHandler);
        
        // Setup bot configuration
        this.config = config;
    }
    
    /**
     * Initialize and start the bot
     * @returns {Promise<void>}
     */
    async start() {
        try {
            console.log(`🤖 Starting FightBot ${this.config.bot.version} (All Features FREE!)...`);
            
            // Register services
            await this._registerServices();
            
            // Initialize services
            await container.initializeAll();
            
            // Load commands
            await this._loadCommands();
            
            // Load event handlers
            await this._loadEvents();
            
            // Login to Discord
            await this.client.login(this.config.discord.token);
            
            // Start background services
            await this._startBackgroundServices();
            
            console.log('✅ FightBot initialized successfully! All features are FREE! 🎉');
        } catch (error) {
            console.error('❌ Failed to start FightBot:', error);
            process.exit(1);
        }
    }
    
    /**
     * Register services with the container
     * @returns {Promise<void>}
     * @private
     */
    async _registerServices() {
        // Import services
        const DatabaseService = (await import('./services/database/databaseService.js')).default;
        const CacheService = (await import('./services/cache/cacheService.js')).default;
        const CommandAnalyticsService = (await import('./services/analytics/commandAnalyticsService.js')).default;
        const UfcService = (await import('./services/ufc/ufcService.js')).default;
        const BettingOddsService = (await import('./services/ufc/bettingOddsService.js')).default;
        const UserPreferencesService = (await import('./services/user/userPreferencesService.js')).default;
        
        // Register services in the container
        container.register('database', () => new DatabaseService());
        container.register('cache', () => new CacheService());
        container.register('analytics', () => new CommandAnalyticsService());
        container.register('ufcService', () => new UfcService());
        container.register('bettingOdds', () => new BettingOddsService());
        container.register('userPreferences', () => new UserPreferencesService());
    }
    
    /**
     * Load commands from registry
     * @returns {Promise<void>}
     * @private
     */
    async _loadCommands() {
        try {
            // Create command directory structure if it doesn't exist
            const commandDirs = [
                path.join(__dirname, 'commands', 'core'),
                path.join(__dirname, 'commands', 'ufc'),
                path.join(__dirname, 'commands', 'user'),
                path.join(__dirname, 'commands', 'admin')
            ];
            
            for (const dir of commandDirs) {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            }
            
            // Load commands using registry
            const commands = await commandRegistry.loadAllModules();
            this.client.commands = commands;
            
            console.log(`✅ Loaded ${commands.size} commands`);
        } catch (error) {
            console.error('❌ Error loading commands:', error);
            throw error;
        }
    }
    
    /**
     * Load event handlers
     * @returns {Promise<void>}
     * @private
     */
    async _loadEvents() {
        try {
            const eventsPath = path.join(__dirname, 'events');
            
            // Create events directory if it doesn't exist
            if (!fs.existsSync(eventsPath)) {
                fs.mkdirSync(eventsPath, { recursive: true });
            }
            
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                try {
                    const filePath = path.join(eventsPath, file);
                    const event = (await import(filePath)).default;
                    
                    if (!event.name || !event.execute) {
                        console.warn(`⚠️ Event file ${file} is missing required properties`);
                        continue;
                    }
                    
                    // Inject container and client
                    event.container = container;
                    event.client = this.client;
                    
                    // Register event
                    if (event.once) {
                        this.client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        this.client.on(event.name, (...args) => event.execute(...args));
                    }
                    
                    console.log(`✅ Loaded event: ${event.name}`);
                } catch (error) {
                    console.error(`❌ Failed to load event ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Error loading events:', error);
            throw error;
        }
    }
    
    /**
     * Start background services
     * @returns {Promise<void>}
     * @private
     */
    async _startBackgroundServices() {
        console.log('🌟 Starting background services...');
        
        // Add any background services or scheduled tasks here
        
        console.log('✅ Background services started');
    }
    
    /**
     * Graceful shutdown
     * @returns {Promise<void>}
     */
    async shutdown() {
        console.log('🛑 Shutting down FightBot...');
        
        // Save any data and clean up resources
        try {
            // Close database connections
            const database = container.get('database');
            if (database) {
                // Save any pending data
                console.log('💾 Saving data...');
            }
            
            // Destroy Discord client
            await this.client.destroy();
            
            console.log('👋 FightBot has been gracefully shut down');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Create instance
const bot = new FightBotApplication();

// Register shutdown handlers
process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.shutdown();
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Start the bot
bot.start().catch(error => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});
