/**
 * Ready Event Handler - Executes when the bot is ready
 * Using the new service-oriented architecture
 */

import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    
    /**
     * Execute the event handler
     * @param {ServiceContainer} container - Service container
     * @param {Client} client - Discord.js client
     */
    execute: async (container, client) => {
        try {
            const logger = container.get('logger');
            const config = container.get('config');
            
            logger.success(`🤖 Ready! Logged in as ${client.user.tag}`);
            
            // Set the bot's activity
            client.user.setActivity(`UFC Events | /help`, { type: 'WATCHING' });
            
            // Log some bot stats
            const guildCount = client.guilds.cache.size;
            const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            
            logger.info(`Serving ${guildCount} servers and ${userCount} users`);
            logger.info(`FightBot is running in ${config.get('production') ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
            
            // Log registered commands
            const commandCount = client.commands.size;
            logger.info(`Loaded ${commandCount} commands`);
            
            // Set bot version in container for other services to access
            config.set('botVersion', config.get('version', '1.0.0'));
            
        } catch (error) {
            console.error('Error in ready event:', error);
        }
    }
};
