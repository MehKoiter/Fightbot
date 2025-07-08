import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import UfcService from "../services/ufcService.js";
import BettingOddsService from "../services/bettingOddsService.js";
import { VERSION_CONFIG, isFeatureEnabled, isPremium } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('odds')
        .setDescription('Get betting odds for upcoming UFC fights (Premium feature)'),
    
    execute: async (interaction) => {
        // Check if premium feature
        if (!isFeatureEnabled('betOddsTracking')) {
            const featureLockedEmbed = new EmbedBuilder()
                .setColor('#ff6347')
                .setTitle('🔒 Premium Feature')
                .setDescription(VERSION_CONFIG.messages.featureDisabled)
                .addFields({
                    name: '🌟 Available in Premium',
                    value: '• Real-time betting odds from multiple sportsbooks\n• Odds movement tracking\n• Public betting percentages\n• Method of victory odds\n• Historical odds data',
                    inline: false
                })
                .setFooter({ text: 'Use /premium to learn more about upgrading' });
            
            await interaction.reply({ embeds: [featureLockedEmbed], ephemeral: true });
            return;
        }

        try {
            await interaction.deferReply();

            const ufcService = new UfcService();
            const bettingService = new BettingOddsService();
            
            const event = await ufcService.getUpcomingEvent();

            if (!event || !event.fights || event.fights.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ No Event Data')
                    .setDescription('No upcoming UFC events found with betting data available.');
                
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const embeds = [];

            // Main odds embed
            const mainEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💰 UFC Betting Odds')
                .setDescription(`**${event.title}**\n${event.subtitle || ''}`)
                .addFields({
                    name: '📊 Odds Data',
                    value: `• Live odds from ${new BettingOddsService().sportsbooks.length} major sportsbooks\n• Updated every 15 minutes\n• Includes movement tracking`,
                    inline: false
                });

            if (event.date) {
                mainEmbed.addFields({
                    name: '📅 Event Date',
                    value: event.date,
                    inline: true
                });
            }

            embeds.push(mainEmbed);

            // Get odds for main fights
            const mainFights = event.fights.slice(0, 3);
            
            for (const fight of mainFights) {
                const oddsData = await bettingService.getFightOdds(fight);
                
                if (oddsData) {
                    const oddsEmbed = new EmbedBuilder()
                        .setColor('#ffd700')
                        .setTitle(`${oddsData.fight.redCorner} vs ${oddsData.fight.blueCorner}`)
                        .setDescription(`**${oddsData.fight.weightClass}**`);

                    // Moneyline odds
                    const redOdds = bettingService.formatOdds(oddsData.odds.moneyline.red);
                    const blueOdds = bettingService.formatOdds(oddsData.odds.moneyline.blue);
                    
                    oddsEmbed.addFields({
                        name: '🥊 Moneyline Odds',
                        value: `**${oddsData.fight.redCorner}:** ${redOdds}\n**${oddsData.fight.blueCorner}:** ${blueOdds}`,
                        inline: true
                    });

                    // Over/Under
                    oddsEmbed.addFields({
                        name: '⏱️ Over/Under',
                        value: `**${oddsData.odds.overUnder.rounds} Rounds**\nOver: ${bettingService.formatOdds(oddsData.odds.overUnder.over)}\nUnder: ${bettingService.formatOdds(oddsData.odds.overUnder.under)}`,
                        inline: true
                    });

                    // Method of Victory
                    oddsEmbed.addFields({
                        name: '🏆 Method of Victory',
                        value: `KO/TKO: ${bettingService.formatOdds(oddsData.odds.methodOfVictory.ko_tko)}\nSubmission: ${bettingService.formatOdds(oddsData.odds.methodOfVictory.submission)}\nDecision: ${bettingService.formatOdds(oddsData.odds.methodOfVictory.decision)}`,
                        inline: true
                    });

                    // Best odds comparison
                    const bestRedOdds = Math.max(...oddsData.sportsbooks.map(sb => sb.moneyline.red));
                    const bestBlueOdds = Math.max(...oddsData.sportsbooks.map(sb => sb.moneyline.blue));
                    const bestRedBook = oddsData.sportsbooks.find(sb => sb.moneyline.red === bestRedOdds).sportsbook;
                    const bestBlueBook = oddsData.sportsbooks.find(sb => sb.moneyline.blue === bestBlueOdds).sportsbook;

                    oddsEmbed.addFields({
                        name: '🎯 Best Odds',
                        value: `**${oddsData.fight.redCorner}:** ${bettingService.formatOdds(bestRedOdds)} (${bestRedBook})\n**${oddsData.fight.blueCorner}:** ${bettingService.formatOdds(bestBlueOdds)} (${bestBlueBook})`,
                        inline: false
                    });

                    oddsEmbed.setFooter({ 
                        text: `${oddsData.disclaimer} • Last updated: ${new Date(oddsData.lastUpdated).toLocaleTimeString()}` 
                    });

                    embeds.push(oddsEmbed);
                }
            }

            // Add disclaimer embed
            const disclaimerEmbed = new EmbedBuilder()
                .setColor('#ff6347')
                .setTitle('⚠️ Important Disclaimer')
                .setDescription('**Please Gamble Responsibly**')
                .addFields(
                    {
                        name: '🛡️ Responsible Gambling',
                        value: '• Only bet what you can afford to lose\n• Set limits and stick to them\n• Never chase losses\n• Seek help if gambling becomes a problem',
                        inline: false
                    },
                    {
                        name: '📊 Odds Information',
                        value: '• Odds are subject to change\n• Always verify with official sportsbooks\n• Past performance doesn\'t guarantee future results\n• For entertainment purposes only',
                        inline: false
                    }
                )
                .setFooter({ text: 'FightBot Premium • Betting Odds Service' });

            embeds.push(disclaimerEmbed);

            await interaction.editReply({ embeds: embeds });

        } catch (error) {
            console.error('Error fetching betting odds:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Unable to fetch betting odds at this time. Please try again later.');
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
