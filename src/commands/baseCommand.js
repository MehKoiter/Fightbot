/**
 * Base Command Class - Parent class for all FightBot commands
 * Provides common functionality and standard interface
 */

import { SlashCommandBuilder } from 'discord.js';
import container from '../services/serviceContainer.js';

class BaseCommand {
    constructor() {
        // Command builder that will be extended by subclasses
        this.builder = new SlashCommandBuilder();
        
        // Access to service container
        this.container = container;
        
        // Track command usage
        this.trackUsage = true;
    }

    /**
     * Get the command data for registration with Discord
     * @returns {SlashCommandBuilder} Command data
     */
    getData() {
        return this.builder;
    }

    /**
     * Track command usage in analytics
     * @param {string} commandName - Name of command used
     */
    async trackCommandUsage(commandName) {
        if (!this.trackUsage) return;
        
        try {
            const analytics = this.container.get('analytics');
            if (analytics && typeof analytics.trackCommand === 'function') {
                await analytics.trackCommand(commandName);
            }
        } catch (error) {
            console.warn('Error tracking command:', error);
            // Continue execution even if analytics fails
        }
    }

    /**
     * Execute the command - to be implemented by subclasses
     * @param {Interaction} interaction - Discord interaction object
     */
    async execute(interaction) {
        throw new Error('Command execute() method must be implemented');
    }
    
    /**
     * Handle any errors during command execution
     * @param {Interaction} interaction - Discord interaction
     * @param {Error} error - The error that occurred
     */
    async handleError(interaction, error) {
        console.error(`Error executing command ${this.builder.name}:`, error);
        
        const errorMessage = '❌ An error occurred while processing your request. Please try again later.';
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: errorMessage,
                    ephemeral: true 
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ 
                    content: errorMessage
                });
            }
        } catch (replyError) {
            console.error('Error sending error response:', replyError);
        }
    }
}

export default BaseCommand;
