import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('features')
        .setDescription('View all available FightBot features (everything is FREE!)'),
    
    execute: async (interaction) => {
        // Show all available features (everything is free now)
        const featuresEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎉 FightBot Features - All FREE!')
            .setDescription('**Great news!** All FightBot features are now completely FREE for everyone!')
            .addFields(
                {
                    name: '✅ Core Features (FREE)',
                    value: '• **Complete Fight Cards** - Detailed event information\n• **Fighter Statistics** - Records, striking accuracy, takedown defense\n• **Real-time Betting Odds** - Track odds from multiple sportsbooks\n• **Fight Analytics** - Win probability calculations and trends\n• **Event Notifications** - Get alerts for upcoming events\n• **Historical Data** - Access to past events and results',
                    inline: false
                },
                {
                    name: '� Advanced Features (FREE)',
                    value: '• **Data Export** - Download fight cards and analysis\n• **Custom Preferences** - Personalized settings\n• **Multi-Event Tracking** - Follow multiple events\n• **Detailed Analytics** - In-depth performance analysis\n• **Priority Support** - Fast response times\n• **All Premium Features** - No restrictions!',
                    inline: false
                },
                {
                    name: '❤️ Support FightBot',
                    value: 'If you enjoy using FightBot, consider supporting development:\n• [Patreon](https://patreon.com/fightbot) - Monthly donations\n• Help us keep the bot running 24/7\n• Fund new features and improvements\n• Cover server and API costs',
                    inline: false
                },
                {
                    name: '🎯 Perfect For',
                    value: '• MMA fans of all levels\n• Betting enthusiasts\n• Fantasy sports players\n• Content creators\n• Data analysts\n• **Everyone - it\'s all FREE!**',
                    inline: false
                }
            )
            .setFooter({ text: 'FightBot - Free Forever! Support us if you can ❤️' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('❤️ Support on Patreon')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://patreon.com/fightbot')
                    .setEmoji('❤️')
            );

        await interaction.reply({ embeds: [featuresEmbed], components: [row] });
    }
};
