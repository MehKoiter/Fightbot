import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG, isPremium, isFree } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Learn about FightBot Premium features and pricing'),
    
    execute: async (interaction) => {
        if (isPremium()) {
            // Show premium user dashboard
            const premiumEmbed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('💎 FightBot Premium Dashboard')
                .setDescription('Welcome to FightBot Premium! Here are your available features:')
                .addFields(
                    {
                        name: '✅ Active Premium Features',
                        value: '• Detailed Fighter Statistics\n• Betting Odds Tracking\n• Advanced Analytics\n• Custom Notifications\n• Historical Data Access\n• Export Capabilities\n• Priority Support',
                        inline: false
                    },
                    {
                        name: '📊 Your Usage',
                        value: '• Unlimited event queries\n• Full fight card access\n• Advanced analysis depth\n• Extended cache (24 hours)',
                        inline: false
                    },
                    {
                        name: '🆕 Coming Soon',
                        value: '• Live fight updates\n• AI-powered predictions\n• Multi-event tracking\n• Custom dashboards',
                        inline: false
                    }
                )
                .setFooter({ text: `FightBot Premium v${VERSION_CONFIG.version} • Thank you for your support!` })
                .setTimestamp();

            await interaction.reply({ embeds: [premiumEmbed] });
        } else {
            // Show premium upgrade information
            const upgradeEmbed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('🌟 Upgrade to FightBot Premium')
                .setDescription('Unlock the full potential of FightBot with advanced features and analytics!')
                .addFields(
                    {
                        name: '🚀 Premium Features',
                        value: '• **Detailed Fighter Stats** - Complete records, striking accuracy, takedown defense\n' +
                               '• **Real-time Betting Odds** - Track odds from multiple sportsbooks\n' +
                               '• **Advanced Analytics** - Win probability calculations and performance trends\n' +
                               '• **Custom Notifications** - Get alerts for your favorite fighters and events\n' +
                               '• **Historical Data** - Access to past events, results, and statistical trends\n' +
                               '• **Data Export** - Download fight cards, stats, and analysis reports',
                        inline: false
                    },
                    {
                        name: '📈 Analytics & Insights',
                        value: '• Fighter performance tracking\n• Head-to-head comparisons\n• Betting trends analysis\n• Event outcome predictions\n• Custom reporting dashboard',
                        inline: true
                    },
                    {
                        name: '⚡ Enhanced Experience',
                        value: '• Priority support\n• Extended data retention\n• Faster response times\n• Beta feature access\n• Custom integrations',
                        inline: true
                    },
                    {
                        name: '💰 Pricing',
                        value: '**Monthly:** $9.99/month\n**Yearly:** $99.99/year (2 months free!)\n**Lifetime:** $299.99 (one-time payment)',
                        inline: false
                    },
                    {
                        name: '🎯 Perfect For',
                        value: '• Serious MMA fans\n• Betting enthusiasts\n• Fantasy sports players\n• Content creators\n• Data analysts',
                        inline: false
                    }
                )
                .setFooter({ text: 'Contact support to upgrade or ask questions about Premium features' })
                .setTimestamp();

            await interaction.reply({ embeds: [upgradeEmbed] });
        }
    }
};
