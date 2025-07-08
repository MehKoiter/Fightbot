/**
 * Command Registry - Central registry for all bot commands
 * Organizes commands by category for easy management
 */

import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';
import { getDirname } from '../utils/pathUtils.js';
import { toFileUrl } from '../utils/urlUtils.js';
import BaseCommand from './baseCommand.js';

const __dirname = getDirname(import.meta.url);

class CommandRegistry {
    constructor(container) {
        this.container = container;
        this.logger = container ? container.get('logger') : console;
        this.commands = new Collection();
        this.modules = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the command registry
     * @returns {Promise<Collection>} Collection of commands
     */
    async init() {
        try {
            if (this.initialized) {
                return this.commands;
            }
            
            this.logger.info('Initializing command registry');
            
            // Register and load module commands
            await this.loadAllModules();
            
            // Load legacy commands for backward compatibility
            await this.loadLegacyCommands();
            
            this.initialized = true;
            this.logger.info(`Command registry initialized with ${this.commands.size} commands`);
            
            return this.commands;
        } catch (error) {
            this.logger.error('Error initializing command registry:', error);
            throw error;
        }
    }
    
    /**
     * Register a module
     * @param {string} name - Module name
     * @param {string} description - Module description
     * @param {string} directory - Directory path for module commands
     */
    registerModule(name, description, directory) {
        this.modules.set(name, {
            name,
            description,
            directory,
            commands: []
        });
    }

    /**
     * Load all commands from registered modules
     */
    async loadAllModules() {
        // Register core modules
        this.registerModule('core', 'Core bot commands', path.join(__dirname, 'core'));
        this.registerModule('ufc', 'UFC fight information', path.join(__dirname, 'ufc'));
        this.registerModule('user', 'User account and preferences', path.join(__dirname, 'user'));
        this.registerModule('admin', 'Administrative commands', path.join(__dirname, 'admin'));

        // Load commands from each module
        for (const [moduleName, moduleInfo] of this.modules.entries()) {
            try {
                await this.loadModuleCommands(moduleName, moduleInfo.directory);
                this.logger.info(`Loaded module: ${moduleName}`);
            } catch (error) {
                this.logger.error(`Failed to load module ${moduleName}:`, error);
                console.error(`Failed to load module ${moduleName}:`, error);
            }
        }
        
        // Load any commands in the root commands directory
        await this.loadRootCommands();

        return this.commands;
    }

    /**
     * Load commands from a specific module directory
     * @param {string} moduleName - Module name
     * @param {string} directory - Directory path
     */
    async loadModuleCommands(moduleName, directory) {
        try {
            // Check if directory exists
            if (!fs.existsSync(directory)) {
                this.logger.warn(`Module directory does not exist: ${directory}`);
                return;
            }

            // Get command files
            const commandFiles = fs.readdirSync(directory).filter(file => file.endsWith('.js') && !file.startsWith('_'));
            
            // Load each command
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(directory, file);
                    // Convert to proper file URL format for ESM imports
                    const fileUrl = toFileUrl(filePath);
                    this.logger.debug(`Loading command from: ${fileUrl}`);
                    
                    const command = (await import(fileUrl)).default;
                    
                    // Check if it's a BaseCommand instance
                    const isBaseCommand = command instanceof BaseCommand;
                    
                    // For both legacy and new commands
                    if ((!isBaseCommand && (!command.getData || !command.execute)) || 
                        (isBaseCommand && !command.getData)) {
                        this.logger.warn(`Command file ${file} in module ${moduleName} is missing required methods`);
                        continue;
                    }
                    
                    const commandData = command.getData();
                    const commandName = commandData.name;
                    
                    // Add command to registry
                    this.commands.set(commandName, command);
                    
                    // Add to module's command list
                    const moduleInfo = this.modules.get(moduleName);
                    moduleInfo.commands.push(commandName);
                    
                    this.logger.info(`Loaded command: ${commandName} (${moduleName})`);
                } catch (error) {
                    this.logger.error(`Failed to load command file ${file} in module ${moduleName}:`, error);
                }
            }
        } catch (error) {
            this.logger.error(`Error loading module commands for ${moduleName}:`, error);
            throw error;
        }
    }
    
    /**
     * Load commands from root commands directory
     * @returns {Promise<void>}
     */
    async loadRootCommands() {
        try {
            const directory = path.join(__dirname);
            
            if (!fs.existsSync(directory)) {
                return;
            }
            
            const commandFiles = fs.readdirSync(directory)
                .filter(file => file.endsWith('.js') && 
                       !file.startsWith('_') && 
                       file !== 'baseCommand.js' && 
                       file !== 'commandRegistry.js');
                       
            this.logger.info(`Found ${commandFiles.length} command files in root directory`);
            
            // Load each command
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(directory, file);
                    // Convert to proper file URL format for ESM imports
                    const fileUrl = toFileUrl(filePath);
                    this.logger.debug(`Loading root command from: ${fileUrl}`);
                    
                    const command = (await import(fileUrl)).default;
                    
                    // Check if it's a BaseCommand instance
                    const isBaseCommand = command instanceof BaseCommand;
                    
                    // For both legacy and new commands
                    if ((!isBaseCommand && (!command.getData || !command.execute)) || 
                        (isBaseCommand && !command.getData)) {
                        this.logger.warn(`Command file ${file} is missing required methods`);
                        continue;
                    }
                    
                    const commandData = command.getData();
                    const commandName = commandData.name;
                    
                    // Add command to registry
                    this.commands.set(commandName, command);
                    
                    this.logger.info(`Loaded command: ${commandName}`);
                } catch (error) {
                    this.logger.error(`Failed to load command file ${file}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error loading root commands:', error);
        }
    }
    
    /**
     * Load legacy commands from the old directory structure
     * @returns {Promise<void>}
     */
    async loadLegacyCommands() {
        try {
            const commandsPath = path.join(__dirname, '../../commands');
            
            // Skip if directory doesn't exist
            if (!fs.existsSync(commandsPath)) {
                this.logger.warn(`Legacy commands directory not found: ${commandsPath}`);
                return;
            }
            
            const commandFiles = fs.readdirSync(commandsPath)
                .filter(file => file.endsWith('.js'));
                
            this.logger.info(`Found ${commandFiles.length} legacy command files`);
            
            // Load each command
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    // Convert to proper file URL format for ESM imports
                    const fileUrl = toFileUrl(filePath);
                    this.logger.debug(`Loading legacy command from: ${fileUrl}`);
                    
                    // Import the command module
                    const commandModule = await import(fileUrl);
                    const command = commandModule.default;
                    
                    // Check if it's a valid legacy command
                    if (command?.data?.name) {
                        const commandName = command.data.name;
                        
                        // Only add if not already registered
                        if (!this.commands.has(commandName)) {
                            this.commands.set(commandName, command);
                            this.logger.info(`Loaded legacy command: ${commandName}`);
                        } else {
                            this.logger.info(`Legacy command ${commandName} overridden by new implementation`);
                        }
                    } else {
                        this.logger.warn(`Legacy command file ${file} is missing required data`);
                    }
                } catch (error) {
                    this.logger.error(`Error loading legacy command ${file}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error loading legacy commands:', error);
        }
    }

    /**
     * Get all commands as a Collection
     * @returns {Collection} - Discord.js Collection of commands
     */
    getAllCommands() {
        return this.commands;
    }

    /**
     * Get commands by module
     * @param {string} moduleName - Module name
     * @returns {Array} - Array of commands in the module
     */
    getCommandsByModule(moduleName) {
        const moduleInfo = this.modules.get(moduleName);
        if (!moduleInfo) {
            return [];
        }
        
        return moduleInfo.commands;
    }
    
    /**
     * Get a specific command
     * @param {string} name - Command name
     * @returns {Object|undefined} - Command object or undefined
     */
    getCommand(name) {
        return this.commands.get(name);
    }
    
    /**
     * Get all commands
     * @returns {Collection} - Collection of commands
     */
    getCommands() {
        return this.commands;
    }
    
    /**
     * Get all modules
     * @returns {Map} - Map of modules
     */
    getModules() {
        return this.modules;
    }
}

export default CommandRegistry;
