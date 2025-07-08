/**
 * Error Handler - Centralized error handling system
 * Provides consistent error logging, tracking, and user feedback
 */

import { EmbedBuilder } from 'discord.js';
import config from '../config/config.js';

class ErrorHandler {
    constructor() {
        this.errors = [];
    }
    
    /**
     * Handle command execution error
     * @param {Interaction} interaction - Discord interaction
     * @param {Error} error - The error that occurred
     * @param {string} commandName - The command name
     */
    async handleCommandError(interaction, error, commandName) {
        // Log the error
        console.error(`❌ Error executing command ${commandName}:`, error);
        
        // Track the error for metrics
        this._trackError(error, 'command', commandName);
        
        // Create user-friendly error message
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription('An error occurred while processing your request.')
            .addFields({
                name: 'What happened?',
                value: this._getUserFriendlyMessage(error),
                inline: false
            })
            .setFooter({ text: 'Please try again later or use /support for assistance.' })
            .setTimestamp();

        // Try to respond to the user
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyError) {
            console.error('Error sending error response:', replyError);
        }
    }
    
    /**
     * Handle a general error
     * @param {Error} error - The error that occurred
     * @param {string} context - Error context
     * @param {string} source - Error source
     */
    handleError(error, context, source) {
        // Log the error
        console.error(`❌ Error in ${context} (${source}):`, error);
        
        // Track the error for metrics
        this._trackError(error, context, source);
        
        // In development, show more details
        if (config.isDevelopment()) {
            console.error('Error details:', error.stack);
        }
    }
    
    /**
     * Get recent errors
     * @param {number} count - Number of errors to return
     * @returns {Array} - Recent errors
     */
    getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }
    
    /**
     * Track an error for metrics
     * @param {Error} error - The error
     * @param {string} context - Error context
     * @param {string} source - Error source
     * @private
     */
    _trackError(error, context, source) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            source,
            timestamp: new Date().toISOString()
        };
        
        // Add to local history (limited to 100 entries)
        this.errors.push(errorInfo);
        if (this.errors.length > 100) {
            this.errors.shift();
        }
    }
    
    /**
     * Convert error to user-friendly message
     * @param {Error} error - The error
     * @returns {string} - User-friendly message
     * @private
     */
    _getUserFriendlyMessage(error) {
        // Common error types and user-friendly messages
        if (error.message.includes('Missing Access') || error.message.includes('Missing Permissions')) {
            return 'I don\'t have the required permissions to perform this action. Please ask a server admin to check my permissions.';
        }
        
        if (error.message.includes('Unknown Message')) {
            return 'The message I was trying to interact with no longer exists.';
        }
        
        if (error.message.includes('Missing Permissions')) {
            return 'You don\'t have the required permissions to use this command.';
        }
        
        if (error.message.includes('Cannot send messages to this user')) {
            return 'I wasn\'t able to send you a direct message. Please check your privacy settings.';
        }
        
        // API-related errors
        if (error.message.includes('fetch') || error.message.includes('request') || error.message.includes('ENOTFOUND')) {
            return 'There was a problem connecting to the UFC data service. Please try again later.';
        }
        
        // Generic error message for production
        if (config.isProduction()) {
            return 'Something went wrong while processing your request. Please try again later.';
        }
        
        // In development, return more details
        return `Error: ${error.message}`;
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;
