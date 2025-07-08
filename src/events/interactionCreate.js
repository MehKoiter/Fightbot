/**
 * Interaction Create Event - Handles Discord interactions
 * Using the new service-oriented architecture
 */

import { Events } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    once: false,
    
    /**
     * Execute the event handler
     * @param {ServiceContainer} container - Service container
     * @param {Interaction} interaction - Discord interaction
     */
    execute: async (container, interaction) => {
        try {
            const logger = container.get('logger');
            
            // Handle slash commands
            if (interaction.isChatInputCommand()) {
                logger.debug(`Received command: ${interaction.commandName}`);
                
                const command = interaction.client.commands.get(interaction.commandName);
                
                if (!command) {
                    logger.warn(`No command matching ${interaction.commandName} was found.`);
                    
                    // Respond to user if interaction hasn't been replied to yet
                    if (!interaction.replied && !interaction.deferred) {
                        try {
                            await interaction.reply({ 
                                content: '❌ Command not found!', 
                                ephemeral: true 
                            });
                        } catch (error) {
                            logger.error('Failed to send error response:', error.message);
                        }
                    }
                    return;
                }
                
                // Execute the command
                try {
                    // Track analytics if available
                    try {
                        const analytics = container.get('analytics');
                        await analytics.trackCommand(
                            interaction.commandName, 
                            interaction.guildId, 
                            interaction.channelId
                        );
                    } catch (analyticsError) {
                        logger.debug('Analytics unavailable or tracking failed');
                    }
                    
                    // Execute the command
                    await command.execute(interaction);
                } catch (error) {
                    logger.error(`Error executing command ${interaction.commandName}:`, error);
                    
                    // Handle error response
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: '❌ There was an error executing this command!', 
                            ephemeral: true 
                        });
                    } else if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ 
                            content: '❌ There was an error executing this command!' 
                        });
                    }
                }
            }
            
            // Handle button interactions
            else if (interaction.isButton()) {
                logger.debug(`Button interaction: ${interaction.customId}`);
                
                // Get interaction handler service
                try {
                    const handler = container.get('interactionHandler');
                    await handler.handleButtonInteraction(interaction);
                } catch (error) {
                    logger.error('Error handling button interaction:', error);
                    
                    // Respond with error if needed
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Error processing button interaction',
                            ephemeral: true
                        });
                    } else if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({
                            content: '❌ Error processing button interaction'
                        });
                    }
                }
            }
            
            // Handle select menu interactions
            else if (interaction.isAnySelectMenu()) {
                logger.debug(`Select menu interaction: ${interaction.customId}`);
                
                // Will be implemented in a future PR
                await interaction.reply({
                    content: 'Select menu handler not yet implemented',
                    ephemeral: true
                });
            }
            
            // Handle modal submit interactions
            else if (interaction.isModalSubmit()) {
                logger.debug(`Modal submit interaction: ${interaction.customId}`);
                
                // Will be implemented in a future PR
                await interaction.reply({
                    content: 'Modal submit handler not yet implemented',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
        }
    }
};
