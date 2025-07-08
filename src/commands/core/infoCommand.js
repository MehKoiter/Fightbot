/**
 * Info Command - Displays information about FightBot commands and features
 * Migrated to use the new BaseCommand class
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class InfoCommand extends BaseCommand {
    constructor() {
        super();
        
        // Define command using the builder from the base class
        this.builder
            .setName('info')
            .setDescription('Get information about FightBot commands and features');
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('info');
            
            // Get version config
            let VERSION_CONFIG;
            let isFree, isPremium;
            try {
                const versionModule = await import('../../config/version.js');
                VERSION_CONFIG = versionModule.VERSION_CONFIG;
                isFree = versionModule.isFree;
                isPremium = versionModule.isPremium;
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
                isFree = () => true;
                isPremium = () => false;
            }
            
            const infoEmbed = new EmbedBuilder()
                .setColor(isFree() ? '#ff6347' : '#9932cc')
                .setTitle(`🥊 FightBot ${VERSION_CONFIG.version}`)
                .setDescription('Your ultimate UFC companion bot!')
                .addFields(
                    {
                        name: '📋 Available Commands',
                        value: '• `/fight` - Get upcoming UFC event details\n' +
                               '• `/features` - See all available features\n' +
                               '• `/support` - Get help and contact information\n' +
                               '• `/info` - Show this information',
                        inline: false
                    },
                    {
                        name: '🎯 Features',
                        value: isFree() 
                            ? '• Basic fight card information\n• Fighter rankings\n• Event schedules\n• Limited analysis\n\n**Upgrade to Premium for more!**'
                            : '• Complete fight card details\n• Advanced analytics\n• Betting odds tracking\n• Custom notifications\n• Historical data\n• Export capabilities',
                        inline: false
                    },
                    {
                        name: '🚀 Getting Started',
                        value: '1. Use `/fight` to see the next UFC event\n2. Click the interactive buttons for more details\n3. Check out `/features` to see all available features',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: isFree() 
                        ? 'FightBot Free • Upgrade to Premium for more features'
                        : `FightBot Premium v${VERSION_CONFIG.version} • Thank you for your support!`,
                    iconURL: 'https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png'
                })
                .setTimestamp();

            if (isFree()) {
                infoEmbed.addFields({
                    name: '💎 Want More?',
                    value: 'Use `/features` to see all available features and ways to support us!',
                    inline: false
                });
            }

            await interaction.reply({ embeds: [infoEmbed] });
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
}

// Export an instance of the command
export default new InfoCommand();
