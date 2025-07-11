/**
 * Centralized Error Handler for FightBot
 * Provides consistent error handling patterns and logging
 */

import { EmbedBuilder } from 'discord.js';

class ErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.maxErrorsPerHour = 50;
    }

    /**
     * Handle Discord interaction errors
     * @param {Error} error - The error that occurred
     * @param {Interaction} interaction - The Discord interaction
     * @param {string} context - Context where error occurred
     */
    async handleInteractionError(error, interaction, context = 'unknown') {
        const errorId = this.generateErrorId();
        const userId = interaction.user?.id || 'unknown';
        
        // Log error with context
        this.logError(error, context, errorId, userId);
        
        // Track error frequency
        this.trackError(context);
        
        // Send user-friendly error message
        await this.sendErrorResponse(interaction, error, errorId);
    }

    /**
     * Generate unique error ID for tracking
     * @returns {string} Unique error identifier
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log error with comprehensive context
     * @param {Error} error - The error object
     * @param {string} context - Where the error occurred
     * @param {string} errorId - Unique error identifier
     * @param {string} userId - User ID who triggered the error
     */
    logError(error, context, errorId, userId) {
        const timestamp = new Date().toISOString();
        
        console.error(`❌ [${timestamp}] Error in ${context} (ID: ${errorId})`);
        console.error(`   User: ${userId}`);
        console.error(`   Message: ${error.message}`);
        
        if (error.code) {
            console.error(`   Discord Code: ${error.code}`);
        }
        
        if (error.stack && process.env.NODE_ENV === 'development') {
            console.error(`   Stack: ${error.stack}`);
        }
        
        // Log to file in production
        if (process.env.NODE_ENV === 'production') {
            this.logToFile(error, context, errorId, userId, timestamp);
        }
    }

    /**
     * Track error frequency for monitoring
     * @param {string} context - Error context
     */
    trackError(context) {
        const hour = Math.floor(Date.now() / (1000 * 60 * 60));
        const key = `${context}_${hour}`;
        
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
        
        // Alert if too many errors
        if (count + 1 >= this.maxErrorsPerHour) {
            console.warn(`🚨 High error rate detected in ${context}: ${count + 1} errors this hour`);
        }
        
        // Cleanup old entries
        this.cleanupErrorCounts();
    }

    /**
     * Send user-friendly error response
     * @param {Interaction} interaction - Discord interaction
     * @param {Error} error - The error object
     * @param {string} errorId - Error identifier
     */
    async sendErrorResponse(interaction, error, errorId) {
        const isDiscordError = error.code && error.code >= 10000;
        const isTimeout = error.message.includes('timeout') || error.message.includes('TIMEOUT');
        
        let title, description, color;
        
        if (isTimeout) {
            title = '⏱️ Request Timeout';
            description = 'The request is taking longer than expected. Please try again.';
            color = '#ffaa00';
        } else if (isDiscordError) {
            title = '🔌 Connection Issue';
            description = 'There was a temporary connection issue. Please try again in a moment.';
            color = '#ff6600';
        } else {
            title = '❌ Something went wrong';
            description = 'An unexpected error occurred. Our team has been notified.';
            color = '#ff0000';
        }

        const errorEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .addFields({
                name: '🔧 What can you do?',
                value: '• Try the command again\n• Check your internet connection\n• Contact support if this persists',
                inline: false
            })
            .setFooter({ 
                text: `Error ID: ${errorId}`,
                iconURL: 'https://cdn.discordapp.com/emojis/853728016590381066.png'
            })
            .setTimestamp();

        try {
            if (interaction.isAutocomplete()) {
                // For autocomplete, send empty response
                if (!interaction.responded) {
                    await interaction.respond([]);
                }
            } else {
                // For other interactions
                const response = { embeds: [errorEmbed], ephemeral: true };
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply(response);
                } else if (interaction.deferred) {
                    await interaction.editReply(response);
                } else {
                    await interaction.followUp(response);
                }
            }
        } catch (responseError) {
            console.error(`Failed to send error response: ${responseError.message}`);
        }
    }

    /**
     * Log error to file (production only)
     * @param {Error} error - Error object
     * @param {string} context - Error context
     * @param {string} errorId - Error ID
     * @param {string} userId - User ID
     * @param {string} timestamp - Timestamp
     */
    async logToFile(error, context, errorId, userId, timestamp) {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const logDir = './data/logs';
            const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
            
            // Ensure log directory exists
            await fs.mkdir(logDir, { recursive: true });
            
            const logEntry = JSON.stringify({
                timestamp,
                errorId,
                context,
                userId,
                message: error.message,
                code: error.code,
                stack: error.stack
            }) + '\n';
            
            await fs.appendFile(logFile, logEntry);
        } catch (logError) {
            console.error('Failed to log error to file:', logError.message);
        }
    }

    /**
     * Clean up old error count entries
     */
    cleanupErrorCounts() {
        const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
        
        for (const [key] of this.errorCounts) {
            const hour = parseInt(key.split('_').pop());
            if (currentHour - hour > 24) { // Remove entries older than 24 hours
                this.errorCounts.delete(key);
            }
        }
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getStats() {
        const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
        let totalErrors = 0;
        const contextCounts = {};
        
        for (const [key, count] of this.errorCounts) {
            const [context, hour] = key.split('_');
            if (currentHour - parseInt(hour) <= 24) {
                totalErrors += count;
                contextCounts[context] = (contextCounts[context] || 0) + count;
            }
        }
        
        return {
            totalErrorsLast24h: totalErrors,
            errorsByContext: contextCounts,
            uniqueContexts: Object.keys(contextCounts).length
        };
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Async wrapper for better error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
export function asyncErrorHandler(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            // Extract interaction from args if available
            const interaction = args.find(arg => arg && typeof arg.reply === 'function');
            
            if (interaction) {
                await errorHandler.handleInteractionError(error, interaction, context);
            } else {
                errorHandler.logError(error, context, errorHandler.generateErrorId(), 'system');
            }
            
            throw error; // Re-throw for upstream handling
        }
    };
}

export default ErrorHandler;
