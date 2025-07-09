/**
 * Fighter Command - Advanced Fighter Profiles and Stats
 * Phase 7: Advanced Fighter Features
 * 
 * Provides detailed fighter information, stats, and interactive features
 */

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import FighterService from "../services/fighterService.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fighter')
        .setDescription('Get detailed information about a UFC fighter')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Fighter name to search for')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('compare')
                .setDescription('Compare with another fighter (optional)')
                .setRequired(false)
                .setAutocomplete(true)),

    /**
     * Handle autocomplete for fighter names
     */
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            
            // Mock fighter suggestions - in production this would search a database
            const fighters = [
                'Jon Jones', 'Islam Makhachev', 'Alexander Volkanovski',
                'Leon Edwards', 'Aljamain Sterling', 'Charles Oliveira',
                'Kamaru Usman', 'Israel Adesanya', 'Robert Whittaker',
                'Colby Covington', 'Max Holloway', 'Jose Aldo',
                'Francis Ngannou', 'Ciryl Gane', 'Tom Aspinall',
                'Sean O\'Malley', 'Petr Yan', 'Cory Sandhagen'
            ];

            const filtered = fighters
                .filter(fighter => fighter.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25); // Discord autocomplete limit

            await interaction.respond(
                filtered.map(fighter => ({
                    name: fighter,
                    value: fighter
                }))
            );
        } catch (error) {
            console.error('Fighter autocomplete error:', error);
            await interaction.respond([]);
        }
    },

    /**
     * Execute the fighter command
     */
    async execute(interaction) {
        const fighterName = interaction.options.getString('name');
        const compareFighter = interaction.options.getString('compare');
        
        try {
            const fighterService = new FighterService();
            
            // For faster response, try without defer first for simple cases
            let hasDeferred = false;
            
            // Helper function to safely defer if not already done
            const safeDeferReply = async () => {
                if (!hasDeferred && !interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.deferReply();
                        hasDeferred = true;
                    } catch (error) {
                        console.error('Failed to defer reply:', error);
                        throw error;
                    }
                }
            };
            
            // Helper function to safely respond
            const safeResponse = async (responseData) => {
                try {
                    if (hasDeferred || interaction.deferred) {
                        await interaction.editReply(responseData);
                    } else {
                        await interaction.reply(responseData);
                    }
                } catch (error) {
                    console.error('Failed to send response:', error);
                    throw error;
                }
            };

            // If comparison requested - this might take longer, so defer immediately
            if (compareFighter) {
                await safeDeferReply();
                
                const comparison = await fighterService.compareFighters(fighterName, compareFighter);
                
                if (!comparison) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Fighter Comparison Failed')
                        .setDescription(`Could not find detailed information for "${fighterName}" or "${compareFighter}".`)
                        .addFields(
                            { name: '💡 Tips', value: '• Check spelling\n• Try using full names\n• Use autocomplete suggestions', inline: false }
                        )
                        .setTimestamp();

                    await safeResponse({ embeds: [errorEmbed] });
                    return;
                }

                // Create comparison embed
                const comparisonEmbed = await this.createComparisonEmbed(comparison);
                const comparisonButtons = this.createComparisonButtons(fighterName, compareFighter);

                await safeResponse({ 
                    embeds: [comparisonEmbed], 
                    components: [comparisonButtons] 
                });
                return;
            }

            // Single fighter profile - try fast response first
            let fighter;
            try {
                // Quick attempt without defer (for cached data)
                fighter = await Promise.race([
                    fighterService.getFighterProfile(fighterName),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
                ]);
            } catch (timeoutError) {
                // If it takes too long, defer and try again
                await safeDeferReply();
                fighter = await fighterService.getFighterProfile(fighterName);
            }

            if (!fighter) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Fighter Not Found')
                    .setDescription(`Could not find a fighter named "${fighterName}".`)
                    .addFields(
                        { name: '💡 Suggestions', value: '• Check the spelling\n• Try using the fighter\'s full name\n• Use the autocomplete feature', inline: false }
                    )
                    .setTimestamp();

                await safeResponse({ embeds: [errorEmbed] });
                return;
            }

            // Create fighter profile embed
            const profileEmbed = await this.createFighterEmbed(fighter);
            const actionButtons = this.createActionButtons(fighterName);

            await safeResponse({ 
                embeds: [profileEmbed], 
                components: [actionButtons] 
            });

        } catch (error) {
            console.error('Fighter command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while fetching fighter information.')
                .addFields(
                    { name: '🔧 Troubleshooting', value: '• Try again in a moment\n• Check your internet connection\n• Contact support if this persists', inline: false }
                )
                .setTimestamp();

            // Enhanced error handling to prevent "interaction already acknowledged" errors
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else if (!interaction.replied) {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Error executing fighter: Interaction has already been acknowledged.');
                console.error('Failed to send error response:', replyError.message);
            }
        }
    },

    /**
     * Create detailed fighter profile embed
     */
    async createFighterEmbed(fighter) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`🥊 ${fighter.name}${fighter.nickname ? ` "${fighter.nickname}"` : ''}`)
            .setDescription(`**Professional Mixed Martial Artist**`)
            .addFields(
                {
                    name: '📊 Fight Record',
                    value: `**${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}**\n` +
                           `Wins: ${fighter.record.wins} (${fighter.record.winsByKO} KO, ${fighter.record.winsBySubmission} Sub, ${fighter.record.winsByDecision} Dec)\n` +
                           `Win Rate: ${((fighter.record.wins / (fighter.record.wins + fighter.record.losses)) * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '📏 Physical Stats',
                    value: `**Height:** ${fighter.physicalStats.height}\n` +
                           `**Weight:** ${fighter.physicalStats.weight}\n` +
                           `**Reach:** ${fighter.physicalStats.reach}\n` +
                           `**Stance:** ${fighter.physicalStats.stance}\n` +
                           `**Age:** ${fighter.physicalStats.age}`,
                    inline: true
                },
                {
                    name: '🥊 Striking Stats',
                    value: `**Accuracy:** ${fighter.fightingStyle.striking.accuracy}\n` +
                           `**Defense:** ${fighter.fightingStyle.striking.defense}\n` +
                           `**Per Minute:** ${fighter.fightingStyle.striking.avgPerMinute}`,
                    inline: true
                },
                {
                    name: '🤼 Grappling Stats',
                    value: `**TD Accuracy:** ${fighter.fightingStyle.grappling.takedownAccuracy}\n` +
                           `**TD Defense:** ${fighter.fightingStyle.grappling.takedownDefense}\n` +
                           `**Avg Per Fight:** ${fighter.fightingStyle.grappling.avgPerFight}`,
                    inline: true
                },
                {
                    name: '🏆 Recent Achievement',
                    value: fighter.achievements[0] || 'Professional Fighter',
                    inline: false
                }
            );

        if (fighter.lastFight) {
            embed.addFields({
                name: '⚔️ Last Fight',
                value: `vs **${fighter.lastFight.opponent}** - ${fighter.lastFight.result}\n` +
                       `${fighter.lastFight.method} (Round ${fighter.lastFight.round})\n` +
                       `${fighter.lastFight.date}`,
                inline: false
            });
        }

        embed.setTimestamp()
             .setFooter({ text: 'FightBot • Advanced Fighter Profiles' });

        return embed;
    },

    /**
     * Create comparison embed for two fighters
     */
    async createComparisonEmbed(comparison) {
        const { fighter1, fighter2, comparison: comp } = comparison;

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(`⚔️ Fighter Comparison`)
            .setDescription(`**${fighter1.name}** vs **${fighter2.name}**`)
            .addFields(
                {
                    name: `🥊 ${fighter1.name}`,
                    value: `Record: **${fighter1.record.wins}-${fighter1.record.losses}-${fighter1.record.draws}**\n` +
                           `Height: ${fighter1.physicalStats.height}\n` +
                           `Reach: ${fighter1.physicalStats.reach}\n` +
                           `Age: ${fighter1.physicalStats.age}`,
                    inline: true
                },
                {
                    name: `🥊 ${fighter2.name}`,
                    value: `Record: **${fighter2.record.wins}-${fighter2.record.losses}-${fighter2.record.draws}**\n` +
                           `Height: ${fighter2.physicalStats.height}\n` +
                           `Reach: ${fighter2.physicalStats.reach}\n` +
                           `Age: ${fighter2.physicalStats.age}`,
                    inline: true
                },
                {
                    name: '⚖️ Key Advantages',
                    value: `**${fighter1.name}:**\n${comp.advantages.fighter1.join('\n') || 'None identified'}\n\n` +
                           `**${fighter2.name}:**\n${comp.advantages.fighter2.join('\n') || 'None identified'}`,
                    inline: false
                }
            );

        if (Math.abs(comp.physical.heightAdvantage) > 1) {
            embed.addFields({
                name: '📏 Physical Analysis',
                value: `**Height:** ${comp.physical.heightAdvantage > 0 ? fighter1.name : fighter2.name} has ${Math.abs(comp.physical.heightAdvantage)}" advantage\n` +
                       `**Reach:** ${comp.physical.reachAdvantage > 0 ? fighter1.name : fighter2.name} has ${Math.abs(comp.physical.reachAdvantage).toFixed(1)}" advantage`,
                inline: false
            });
        }

        embed.setTimestamp()
             .setFooter({ text: 'FightBot • Fighter Comparison Tool' });

        return embed;
    },

    /**
     * Create action buttons for fighter profile
     */
    createActionButtons(fighterName) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`fighter_stats_${fighterName}`)
                    .setLabel('📊 Detailed Stats')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`fighter_highlights_${fighterName}`)
                    .setLabel('🎬 Fight Highlights')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`fighter_compare_${fighterName}`)
                    .setLabel('⚔️ Compare Fighter')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`fighter_refresh_${fighterName}`)
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    /**
     * Create comparison buttons
     */
    createComparisonButtons(fighter1, fighter2) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`comparison_detailed_${fighter1}_vs_${fighter2}`)
                    .setLabel('📊 Detailed Analysis')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`comparison_styles_${fighter1}_vs_${fighter2}`)
                    .setLabel('🥊 Fighting Styles')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`comparison_prediction_${fighter1}_vs_${fighter2}`)
                    .setLabel('🔮 Fight Prediction')
                    .setStyle(ButtonStyle.Success)
            );
    }
};
