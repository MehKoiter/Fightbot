/**
 * Command Deployment Script
 * Registers commands with Discord using the new command architecture
 */

import { REST, Routes } from 'discord.js';
import config from './config/config.js';
import CommandRegistry from './commands/commandRegistry.js';
import { registerServices } from './services/serviceRegistry.js';
import logger from './utils/logger.js';
import { toFileUrl } from './utils/urlUtils.js';

async function deployCommands() {
    try {
        logger.info('Starting command deployment');
        
        // Validate required environment variables
        if (!config.discord.token) {
            logger.error('Missing Discord Bot Token in environment variables');
            process.exit(1);
        }
        
        if (!config.discord.clientId) {
            logger.error('Missing Client ID in environment variables');
            process.exit(1);
        }
        
        // Initialize services
        logger.info('Initializing services');
        await registerServices();
        
        // Create command registry and load commands
        logger.info('Loading commands');
        const registry = new CommandRegistry();
        const commands = await registry.init();
        
        // Convert commands to data for REST API
        const commandData = [];
        
        for (const [_, command] of commands) {
            try {
                if (command.getData) {
                    const data = command.getData().toJSON();
                    commandData.push(data);
                    logger.success(`Added command: ${data.name}`);
                } else if (command.data) {
                    // Legacy command
                    commandData.push(command.data.toJSON());
                    logger.success(`Added legacy command: ${command.data.name}`);
                } else {
                    logger.warn(`Command has no data method or property`);
                }
            } catch (error) {
                logger.error(`Error processing command: ${error}`);
            }
        }
        
        logger.info(`Deploying ${commandData.length} commands to Discord`);
        
        // Create REST client
        const rest = new REST({ version: '10' }).setToken(config.discord.token);
        
        // Deploy commands - either globally or to a test guild
        try {
            if (config.discord.devMode && config.discord.guildId) {
                // Dev mode - Deploy to specific test guild for faster testing
                logger.info(`Deploying commands to test guild ${config.discord.guildId} (Dev Mode)`);
                
                await rest.put(
                    Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
                    { body: commandData },
                );
                
                logger.success(`Successfully deployed ${commandData.length} commands to test guild`);
            } else {
                // Production mode - Deploy globally (takes up to an hour to propagate)
                logger.info('Deploying commands globally (may take up to an hour to propagate)');
                
                await rest.put(
                    Routes.applicationCommands(config.discord.clientId),
                    { body: commandData },
                );
                
                logger.success(`Successfully deployed ${commandData.length} commands globally`);
            }
        } catch (error) {
            logger.error('Error deploying commands:', error);
            process.exit(1);
        }
        
    } catch (error) {
        logger.error('Deployment failed:', error);
        process.exit(1);
    }
}

// Run the deployment
deployCommands();
