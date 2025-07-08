/**
 * Command Loader - Loads commands from the filesystem
 */

import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';
import { fileURLToPath } from 'node:url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Command Loader class - Handles loading commands
 */
class CommandLoader {
    constructor(client, container) {
        this.client = client;
        this.container = container;
        this.logger = container.get('logger');
        
        // Initialize commands collection if it doesn't exist
        if (!this.client.commands) {
            this.client.commands = new Collection();
        }
    }
    
    /**
     * Load commands from a directory
     * @param {string} commandsPath - Path to commands directory
     * @param {boolean} legacy - Whether to load legacy commands
     * @returns {Promise<Collection>} - Collection of commands
     */
    async loadCommands(commandsPath, legacy = false) {
        try {
            // Ensure the directory exists
            if (!fs.existsSync(commandsPath)) {
                this.logger.error(`Commands directory not found: ${commandsPath}`);
                return this.client.commands;
            }
            
            // Get all command files
            const commandFiles = fs.readdirSync(commandsPath)
                .filter(file => file.endsWith('.js'));
                
            this.logger.info(`Found ${commandFiles.length} command files in ${commandsPath}`);
            
            // Load each command
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    
                    // Import the command module
                    const command = (await import(filePath)).default;
                    
                    // Handle legacy and new command formats
                    if (legacy) {
                        // Legacy commands have data and execute properties
                        if (command?.data?.name) {
                            this.client.commands.set(command.data.name, command);
                            this.logger.success(`Loaded legacy command: ${command.data.name}`);
                        } else {
                            this.logger.warn(`Legacy command file ${file} is missing required data or name property`);
                        }
                    } else {
                        // New commands are instances of BaseCommand
                        if (command?.getData && typeof command.getData === 'function') {
                            const data = command.getData();
                            this.client.commands.set(data.name, command);
                            this.logger.success(`Loaded command: ${data.name}`);
                        } else {
                            this.logger.warn(`Command file ${file} is not a valid BaseCommand instance`);
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error loading command ${file}:`, error);
                }
            }
            
            return this.client.commands;
        } catch (error) {
            this.logger.error('Error loading commands:', error);
            return this.client.commands;
        }
    }
    
    /**
     * Load both legacy and new commands
     * @returns {Promise<Collection>} - Collection of commands
     */
    async loadAllCommands() {
        // First load legacy commands
        const legacyPath = path.join(path.resolve(__dirname, '../../'), 'commands');
        await this.loadCommands(legacyPath, true);
        
        // Then load new commands
        const newPath = path.join(path.resolve(__dirname, '../'), 'commands');
        await this.loadCommands(newPath, false);
        
        this.logger.info(`Loaded ${this.client.commands.size} total commands`);
        
        return this.client.commands;
    }
}

export default CommandLoader;
