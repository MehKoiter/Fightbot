/**
 * Help Command - Shows available commands and features
 * Migrated to use the new BaseCommand class
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class HelpCommand extends BaseCommand {
    constructor() {
        super();
        
        // Define command using the builder from the base class
        this.builder
            .setName('help')
            .setDescription('Show available commands and features');
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('help');
            
            // Get version config
            let VERSION_CONFIG;
            try {
                const versionModule = await import('../../config/version.js');
                VERSION_CONFIG = versionModule.VERSION_CONFIG;
            } catch (error) {
                this.container.get('logger').error('Error loading version config:', error);
                VERSION_CONFIG = { 
                    version: '1.0.0',
                    type: 'free',
                    features: {},
                    messages: {
                        freeVersionFooter: 'FightBot Free Edition'
                    }
                };
            }
            
            const helpEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`🤖 FightBot ${VERSION_CONFIG.version} - Help`)
                .setDescription(`Welcome to FightBot! Here are all available commands:`)
                .addFields(
                    {
                        name: '🥊 Core Commands',
                        value: '• `/fight` - Get upcoming UFC fight card with interactive buttons\n' +
                               '• `/info` - Show bot information and version details\n' +
                               '• `/fighter` - [Coming Soon] Look up UFC fighter statistics\n' +
                               '• `/help` - Display this help message',
                        inline: false
                    },
                    {
                        name: '🌟 Advanced Commands',
                        value: '• `/odds` - Real-time betting odds from multiple sportsbooks\n' +
                               '• `/analytics` - Advanced fight analytics and predictions\n' +
                               '• `/preferences` - Manage your personal settings and favorites\n' +
                               '• `/export` - Export fight data in various formats\n' +
                               '• `/features` - View all available features\n' +
                               '• `/support` - Get support and contact information\n' +
                               '• `/donate` - Support FightBot development on Patreon',
                        inline: false
                    },
                    {
                        name: '⚡ Available Features',
                        value: '• Interactive fight card with detailed stats\n' +
                               '• Real-time betting odds tracking\n' +
                               '• AI-powered fight predictions\n' +
                               '• Custom notifications for favorite fighters\n' +
                               '• Data export in JSON, CSV, and PDF formats\n' +
                               '• Historical fight data and analytics\n' +
                               '• Community support',
                        inline: false
                    },
                    {
                        name: '📱 Interactive Features',
                        value: '• **Fight Card Buttons** - Click buttons to explore prelims, stats, analysis\n' +
                               '• **Refresh Data** - Get the latest fight information\n' +
                               '• **External Links** - Direct links to UFC.com and venues\n' +
                               '• **Detailed Fighter Records** - Complete win/loss records',
                        inline: false
                    },
                    {
                        name: '🛠️ Getting Started',
                        value: '• Use `/fight` to see the next UFC event\n' +
                               '• Click the buttons to explore different aspects\n' +
                               '• Use `/features` to see all available features\n' +
                               '• Use `/support` for any questions',
                        inline: false
                    },
                    {
                        name: '📊 Version Information',
                        value: `• **Version:** ${VERSION_CONFIG.version}\n` +
                               `• **Type:** ${VERSION_CONFIG.type}\n` +
                               `• **Features:** ${Object.values(VERSION_CONFIG.features).filter(f => f).length} enabled\n` +
                               `• **Limits:** Unlimited - Everything is FREE!`,
                        inline: false
                    }
                )
                .setFooter({ text: VERSION_CONFIG.messages.freeVersionFooter })
                .setTimestamp();

            await interaction.reply({ embeds: [helpEmbed] });
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
}

// Export an instance of the command
export default new HelpCommand();
