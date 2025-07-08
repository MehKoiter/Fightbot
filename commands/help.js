import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG, isPremium, isFeatureEnabled } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands and features'),
    
    execute: async (interaction) => {
        const isUserPremium = isPremium();
        
        const helpEmbed = new EmbedBuilder()
            .setColor(isUserPremium ? '#9932cc' : '#00ff00')
            .setTitle(`🤖 FightBot ${VERSION_CONFIG.version} - Help`)
            .setDescription(`Welcome to FightBot ${VERSION_CONFIG.type}! Here are all available commands:`)
            .addFields(
                {
                    name: '🥊 Core Commands',
                    value: '• `/fight` - Get upcoming UFC fight card with interactive buttons\n' +
                           '• `/info` - Show bot information and version details\n' +
                           '• `/help` - Display this help message',
                    inline: false
                }
            );

        if (isUserPremium) {
            helpEmbed.addFields(
                {
                    name: '🌟 Premium Commands',
                    value: '• `/odds` - Real-time betting odds from multiple sportsbooks\n' +
                           '• `/analytics` - Advanced fight analytics and predictions\n' +
                           '• `/preferences` - Manage your personal settings and favorites\n' +
                           '• `/export` - Export fight data in various formats\n' +
                           '• `/premium` - View your premium dashboard\n' +
                           '• `/support` - Get premium support and contact information',
                    inline: false
                },
                {
                    name: '⚡ Premium Features',
                    value: '• Interactive fight card with detailed stats\n' +
                           '• Real-time betting odds tracking\n' +
                           '• AI-powered fight predictions\n' +
                           '• Custom notifications for favorite fighters\n' +
                           '• Data export in JSON, CSV, and PDF formats\n' +
                           '• Historical fight data and analytics\n' +
                           '• Priority support',
                    inline: false
                }
            );
        } else {
            helpEmbed.addFields(
                {
                    name: '🔒 Premium Features (Upgrade Required)',
                    value: '• `/odds` - Betting odds from multiple sportsbooks\n' +
                           '• `/analytics` - Advanced analytics and predictions\n' +
                           '• `/preferences` - Personal settings and favorites\n' +
                           '• `/export` - Data export capabilities',
                    inline: false
                },
                {
                    name: '🌟 Why Upgrade?',
                    value: '• **Unlimited Access** - No restrictions on features\n' +
                           '• **Real-time Data** - Live odds and fight updates\n' +
                           '• **Advanced Analytics** - AI predictions and insights\n' +
                           '• **Personalization** - Custom notifications and settings\n' +
                           '• **Data Export** - Download reports and statistics\n' +
                           '• **Priority Support** - Faster response times',
                    inline: false
                }
            );
        }

        helpEmbed.addFields(
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
                value: `• Use \`/fight\` to see the next UFC event\n` +
                       `• Click the buttons to explore different aspects\n` +
                       (isUserPremium ? 
                           '• Use `/preferences` to customize your experience\n• Set up notifications for your favorite fighters' :
                           '• Use `/premium` to learn about upgrading\n• Use `/support` for any questions'),
                inline: false
            },
            {
                name: '📊 Version Information',
                value: `• **Version:** ${VERSION_CONFIG.version}\n` +
                       `• **Type:** ${VERSION_CONFIG.type}\n` +
                       `• **Features:** ${Object.values(VERSION_CONFIG.features).filter(f => f).length} enabled\n` +
                       `• **Limits:** ${isUserPremium ? 'Unlimited' : 'Free tier restrictions'}`,
                inline: false
            }
        );

        if (!isUserPremium) {
            helpEmbed.setFooter({ text: VERSION_CONFIG.messages.freeVersionFooter });
        } else {
            helpEmbed.setFooter({ text: VERSION_CONFIG.messages.premiumFooter });
        }

        helpEmbed.setTimestamp();

        await interaction.reply({ embeds: [helpEmbed] });
    }
};
