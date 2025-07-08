/**
 * FightBot Application - Main application entry point
 */

import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerServices } from '../services/serviceRegistry.js';
import CommandRegistry from '../commands/commandRegistry.js';
import { toFileUrl } from '../utils/urlUtils.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FightBotApp {
    constructor() {
        this.container = null;
        this.logger = null;
        this.config = null;
        this.commandRegistry = null;
        
        // Create the Discord.js client
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessageTyping,
            ]
        });
    }
    
    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Register and initialize all services
            this.container = await registerServices();
            
            // Get logger and config from container
            this.logger = this.container.get('logger');
            this.config = this.container.get('config');
            
            this.logger.info('FightBot application initializing');
            
            // Initialize command registry
            this.commandRegistry = new CommandRegistry(this.container);
            await this.commandRegistry.init();
            
            // Set commands on client
            this.client.commands = this.commandRegistry.getCommands();
            
            // Load event handlers
            await this.loadEvents();
            
            // Set up client event handlers
            this.client.on('error', error => {
                this.logger.error('Client error:', error);
            });
            
            this.client.on('warn', warning => {
                this.logger.warn('Client warning:', warning);
            });
            
            this.logger.info('FightBot application initialized');
        } catch (error) {
            console.error('Failed to initialize FightBot application:', error);
            throw error;
        }
    }
    
    /**
     * Load event handlers
     * @returns {Promise<void>}
     */
    async loadEvents() {
        try {
            // First load legacy events
            const legacyEventsPath = path.join(path.resolve(__dirname, '../../'), 'events');
            await this.loadEventFiles(legacyEventsPath, true);
            
            // Then load new events
            const eventsPath = path.join(path.resolve(__dirname, '../'), 'events');
            await this.loadEventFiles(eventsPath, false);
        } catch (error) {
            this.logger.error('Error loading events:', error);
            throw error;
        }
    }
    
    /**
     * Load event files from a directory
     * @param {string} eventsPath - Path to events directory
     * @param {boolean} legacy - Whether to load legacy events
     * @returns {Promise<void>}
     */
    async loadEventFiles(eventsPath, legacy = false) {
        try {
            // Ensure the directory exists
            if (!fs.existsSync(eventsPath)) {
                this.logger.warn(`Events directory not found: ${eventsPath}`);
                return;
            }
            
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
            
            for (const file of eventFiles) {
                try {
                    const filePath = path.join(eventsPath, file);
                    // Convert to proper file URL format for ESM imports
                    const fileUrl = toFileUrl(filePath);
                    this.logger.debug(`Loading event from: ${fileUrl}`);
                    const event = (await import(fileUrl)).default;
                    
                    if (event.name) {
                        // Inject container for new event format if not legacy
                        if (!legacy && typeof event.execute === 'function') {
                            const originalExecute = event.execute;
                            event.execute = (...args) => originalExecute(this.container, ...args);
                        }
                        
                        if (event.once) {
                            this.client.once(event.name, (...args) => event.execute(...args));
                        } else {
                            this.client.on(event.name, (...args) => event.execute(...args));
                        }
                        
                        this.logger.info(`Loaded ${legacy ? 'legacy ' : ''}event: ${event.name}`);
                    } else {
                        this.logger.warn(`Event file ${file} is missing name property`);
                    }
                } catch (error) {
                    this.logger.error(`Error loading event ${file}:`, error);
                }
            }
        } catch (error) {
            this.logger.error(`Error loading events from ${eventsPath}:`, error);
        }
    }
    
    /**
     * Start the bot
     * @returns {Promise<void>}
     */
    async start() {
        try {
            this.logger.info('Starting FightBot');
            
            // Login to Discord
            await this.client.login(this.config.get('token'));
            
            this.logger.info(`FightBot logged in as ${this.client.user.tag}`);
        } catch (error) {
            this.logger.error('Failed to start FightBot:', error);
            throw error;
        }
    }
    
    /**
     * Shutdown the bot
     * @returns {Promise<void>}
     */
    async shutdown() {
        try {
            this.logger.info('Shutting down FightBot');
            
            // Perform cleanup
            if (this.client) {
                this.client.destroy();
            }
            
            this.logger.info('FightBot shutdown complete');
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
            throw error;
        }
    }
}

export default FightBotApp;
