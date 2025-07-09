import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about FightBot commands and features'), 
    execute: async (interaction) => {
        try {
            // Defer reply immediately to prevent timeout
            await interaction.deferReply({ ephemeral: false });
            
            const infoEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`🥊 FightBot ${VERSION_CONFIG.version}`)
                .setDescription('Your ultimate UFC companion bot! **Everything is FREE!**')
                .addFields(
                    {
                        name: '📋 Available Commands',
                        value: '• `/fight` - Get upcoming UFC event details\n' +
                               '• `/info` - Show this information\n' +
                               '• `/donate` - Support FightBot development (optional)',
                        inline: false
                    },
                    {
                        name: '🎯 Features (ALL FREE!)',
                        value: '• **Complete fight card details** - Full event information\n' +
                               '• **Fighter rankings** - Current UFC rankings\n' +
                               '• **Advanced analytics** - Detailed fight breakdowns\n' +
                               '• **Interactive buttons** - Explore fight data easily\n' +
                               '• **Event schedules** - Never miss a fight\n' +
                               '• **Fighter statistics** - Comprehensive fighter data\n' +
                               '• **Historical data** - Access to past events',
                        inline: false
                    },
                    {
                        name: '🚀 Getting Started',
                        value: '1. Use `/fight` to see the next UFC event\n2. Click the interactive buttons for more details\n3. Use `/donate` to support development (optional)',
                        inline: false
                    },
                    {
                        name: '💚 Support Development',
                        value: 'FightBot is completely FREE! If you enjoy using it, consider supporting development with `/donate` - but it\'s totally optional!',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `FightBot Free v${VERSION_CONFIG.version} • All features FREE for everyone!`,
                    iconURL: 'https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png'
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [infoEmbed] });
        } catch (error) {
            console.error('Info command error:', error);
            
            try {
                const errorMessage = 'Sorry, there was an error displaying the information. Please try again later.';
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.editReply({ content: errorMessage });
                }
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
            }
        }
    },
};
