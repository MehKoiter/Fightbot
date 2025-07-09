import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about FightBot commands and features'), 
    execute: async (interaction) => {
        try {
            const infoEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`🥊 FightBot ${VERSION_CONFIG.version}`)
                .setDescription('Your ultimate UFC companion bot! **Everything is FREE!**')
                .addFields(
                    {
                        name: '📋 Available Commands',
                        value: '• `/fight` - Get upcoming UFC event details\n' +
                               '• `/fighter <name>` - Get detailed fighter profiles (NEW!)\n' +
                               '• `/fighter <name> compare:<fighter>` - Compare fighters (NEW!)\n' +
                               '• `/info` - Show this information\n' +
                               '• `/donate` - Support FightBot development (optional)',
                        inline: false
                    },
                    {
                        name: '🔥 Phase 7: Advanced Fighter Features (NEW!)',
                        value: '• **Fighter Profiles** - Detailed stats and records\n' +
                               '• **Fighter Comparison** - Side-by-side analysis\n' +
                               '• **Fighting Style Analysis** - Striking, grappling breakdowns\n' +
                               '• **Fight Predictions** - AI-powered predictions\n' +
                               '• **Career Highlights** - Notable fights and achievements\n' +
                               '• **Interactive Buttons** - Explore fighter data easily',
                        inline: false
                    },
                    {
                        name: '🎯 Core Features (ALL FREE!)',
                        value: '• **Complete fight card details** - Full event information\n' +
                               '• **Fighter rankings** - Current UFC rankings\n' +
                               '• **Advanced analytics** - Detailed fight breakdowns\n' +
                               '• **Event schedules** - Never miss a fight\n' +
                               '• **Historical data** - Access to past events',
                        inline: false
                    },
                    {
                        name: '🚀 Getting Started',
                        value: '1. Use `/fight` to see the next UFC event\n' +
                               '2. Use `/fighter Jon Jones` for fighter profiles\n' +
                               '3. Use `/fighter Jon Jones compare:Islam Makhachev` to compare\n' +
                               '4. Click interactive buttons for more details',
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

            // Direct reply - no need to defer for static content
            await interaction.reply({ embeds: [infoEmbed] });
            
        } catch (error) {
            console.error('Info command error:', error);
            
            // Simple error handling - only attempt response if we haven't already replied
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: 'Sorry, there was an error displaying the information. Please try again later.',
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
            }
        }
    },
};
