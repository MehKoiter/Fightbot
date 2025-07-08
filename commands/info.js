import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG, isFree, isPremium } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about FightBot commands and features'), 
    execute: async (interaction) => {
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
    },
};
