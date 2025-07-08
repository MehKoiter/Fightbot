/**
 * Fighter command - WORK IN PROGRESS
 * This command is under development and not yet fully functional.
 * It will eventually allow users to lookup UFC fighter stats from ESPN.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import UfcService from '../services/ufcService.js';
import CommandAnalyticsService from '../services/commandAnalyticsService.js';

// Create a singleton analytics instance
let analyticsDB;
let isInitialized = false;

// Initialize the analytics service
async function getAnalyticsService() {
    if (!analyticsDB) {
        analyticsDB = new CommandAnalyticsService();
    }
    
    if (!isInitialized) {
        try {
            await analyticsDB.init();
            isInitialized = true;
        } catch (error) {
            console.error('Error initializing analytics service:', error);
        }
    }
    
    return analyticsDB;
}

export default {
    data: new SlashCommandBuilder()
        .setName('fighter')
        .setDescription('[IN PROGRESS] Get stats for a UFC fighter')
        .addStringOption(option => 
            option
                .setName('name')
                .setDescription('The name of the fighter')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        try {
            // Track command usage for analytics
            try {
                const analytics = await getAnalyticsService();
                if (analytics && analytics.trackCommand) {
                    await analytics.trackCommand('fighter');
                }
            } catch (error) {
                console.warn('Error tracking command:', error);
                // Continue execution even if analytics fails
            }
            
            // Get the fighter name from the interaction
            const fighterName = interaction.options.getString('name');
            
            // Create the "coming soon" embed message
            const infoEmbed = new EmbedBuilder()
                .setColor(0xD20A0A)
                .setTitle('🥊 Fighter Stats - Coming Soon!')
                .setDescription(`The fighter lookup feature for **${fighterName}** is under development.`)
                .addFields(
                    { 
                        name: '⚙️ Work in Progress', 
                        value: 'We\'re currently working on implementing ESPN fighter stats lookup. Check back soon!', 
                        inline: false 
                    },
                    { 
                        name: '🔍 What to expect', 
                        value: 'This feature will provide detailed UFC fighter statistics including physical attributes, striking data, and grappling performance.',
                        inline: false 
                    }
                )
                .setFooter({ text: 'Stay tuned for the full release!' })
                .setTimestamp();
            
            // Reply with the "coming soon" message
            await interaction.reply({ embeds: [infoEmbed] });
                
        } catch (error) {
            console.error(`Error executing fighter command:`, error);
            
            try {
                // Only try to respond if the interaction hasn't already been replied to
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ An error occurred while fetching fighter stats. Please try again later.',
                        ephemeral: true 
                    });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ 
                        content: '❌ An error occurred while fetching fighter stats. Please try again later.'
                    });
                }
            } catch (replyError) {
                console.error('Error sending error response:', replyError);
            }
        }
    }
};
