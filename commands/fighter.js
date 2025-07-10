/**
 * Fighter Command - Advanced Fighter Profiles and Stats
 * Phase 7: Advanced Fighter Features
 * 
 * Provides detailed fighter information, stats, and interactive features
 */

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import UFCStatsFighterService from "../services/ufcStatsFighterService.js";
import interactionStateManager from "../utils/interactionStateManager.js";

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
        // Use interaction state manager for additional safety
        const isSafeToRespond = () => {
            return interactionStateManager.isSafeToRespond(interaction);
        };

        // Exit immediately if interaction is invalid
        if (!isSafeToRespond()) {
            console.log('⚠️ Autocomplete interaction not safe to respond - exiting early');
            return;
        }

        try {
            const focusedValue = interaction.options.getFocused();
            
            // Return empty if no input or too short
            if (!focusedValue || focusedValue.length < 2) {
                // Double-check interaction state right before responding
                if (isSafeToRespond()) {
                    try {
                        await interaction.respond([]);
                        console.log('✅ Responded with empty autocomplete (short input)');
                    } catch (respondError) {
                        console.log('⚠️ Failed to respond to short input (interaction already handled)');
                    }
                }
                return;
            }

            // Create a race between autocomplete and timeout with shorter timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Autocomplete timeout')), 1500) // Reduced to 1.5 seconds
            );
            
            const autocompletePromise = (async () => {
                const ufcStatsService = new UFCStatsFighterService();
                const suggestions = await ufcStatsService.getAutocompleteSuggestions(focusedValue);
                
                // Ensure we return valid format
                if (!Array.isArray(suggestions)) {
                    console.log('⚠️ UFC service returned non-array suggestions');
                    return [];
                }
                
                return suggestions.slice(0, 25); // Discord autocomplete limit
            })();

            // Race against timeout
            let suggestions;
            try {
                suggestions = await Promise.race([autocompletePromise, timeoutPromise]);
            } catch (timeoutError) {
                console.log('⚠️ Autocomplete for fighter is taking too long...');
                suggestions = []; // Use empty suggestions on timeout
            }
            
            // Final safety check before responding - check interaction state right before the call
            if (isSafeToRespond()) {
                try {
                    await interaction.respond(Array.isArray(suggestions) ? suggestions : []);
                    console.log(`✅ Responded with ${suggestions.length} autocomplete suggestions`);
                } catch (respondError) {
                    console.log('⚠️ Failed to respond with suggestions (interaction state changed during processing)');
                }
            } else {
                console.log('⚠️ Interaction state changed during processing - skipping response');
            }
            
        } catch (error) {
            console.error('Fighter autocomplete error:', error);
            
            // Don't try to respond in the catch block - too risky for race conditions
            // Let the interactionCreate.js error handler deal with it if needed
            console.error('❌ Error in fighter autocomplete, letting global handler manage response');
        }
    },

    /**
     * Execute the fighter command
     */
    async execute(interaction) {
        const fighterName = interaction.options.getString('name');
        const compareFighter = interaction.options.getString('compare');
        
        try {
            const ufcStatsService = new UFCStatsFighterService();
            
            // For faster response, try without defer first for simple cases
            let hasDeferred = false;
            
            // Helper function to safely defer if not already done
            const safeDeferReply = async () => {
                if (!hasDeferred && !interaction.replied && !interaction.deferred) {
                    try {
                        // Add a small delay to avoid conflicts with autocomplete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Double-check interaction state after delay
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.deferReply();
                            hasDeferred = true;
                        }
                    } catch (error) {
                        console.error('Failed to defer reply:', error);
                        
                        // Check if the error is due to interaction already being handled
                        if (error.code === 40060 || error.code === 10062) {
                            console.log('Interaction was already handled - continuing without defer');
                            return; // Don't throw, just continue
                        }
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
                
                const comparison = await ufcStatsService.compareFighters(fighterName, compareFighter);
                
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
                    ufcStatsService.getFighterProfile(fighterName),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
                ]);
            } catch (timeoutError) {
                // If it takes too long, defer and try again
                await safeDeferReply();
                fighter = await ufcStatsService.getFighterProfile(fighterName);
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
                    value: `**${fighter.record}**\n` +
                           `Wins: ${fighter.wins} | Losses: ${fighter.losses} | Draws: ${fighter.draws}\n` +
                           `Win Rate: ${((fighter.wins / (fighter.wins + fighter.losses)) * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '📏 Physical Stats',
                    value: `**Height:** ${fighter.height}\n` +
                           `**Weight:** ${fighter.weight}\n` +
                           `**Reach:** ${fighter.reach}\n` +
                           `**Stance:** ${fighter.stance}`,
                    inline: true
                },
                {
                    name: '🏟️ Division & Status',
                    value: `**Division:** ${fighter.weightClass}\n` +
                           `**Team:** ${fighter.team}\n` +
                           `**Status:** ${fighter.currentChampion ? 'Current Champion' : fighter.formerChampion ? 'Former Champion' : 'Contender'}`,
                    inline: true
                },
                {
                    name: '🏆 Achievements',
                    value: (fighter.achievements && fighter.achievements.length > 0) 
                        ? fighter.achievements.slice(0, 3).join('\n') 
                        : 'Professional Fighter',
                    inline: false
                }
            );

        if (fighter.recentFights && fighter.recentFights.length > 0) {
            const lastFight = fighter.recentFights[0];
            embed.addFields({
                name: '⚔️ Last Fight',
                value: `vs **${lastFight.opponent}** - ${lastFight.result}\n` +
                       `${lastFight.method} (Round ${lastFight.round}, ${lastFight.time})\n` +
                       `${lastFight.event} | ${lastFight.date}`,
                inline: false
            });
        }

        embed.setTimestamp()
             .setFooter({ text: 'FightBot • UFC Stats Fighter Profiles' });

        return embed;
    },

    /**
     * Create comparison embed for two fighters
     */
    async createComparisonEmbed(comparison) {
        const { fighter1, fighter2, comparison: comp } = comparison;

        // Safely extract data with fallbacks
        const f1Record = `${fighter1.wins || 0}-${fighter1.losses || 0}-${fighter1.draws || 0}`;
        const f2Record = `${fighter2.wins || 0}-${fighter2.losses || 0}-${fighter2.draws || 0}`;

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(`⚔️ Fighter Comparison`)
            .setDescription(`**${fighter1.name}** vs **${fighter2.name}**`)
            .addFields(
                {
                    name: `🥊 ${fighter1.name}`,
                    value: `**Record:** ${f1Record}\n` +
                           `**Height:** ${fighter1.height || 'N/A'}\n` +
                           `**Weight:** ${fighter1.weight || 'N/A'}\n` +
                           `**Reach:** ${fighter1.reach || 'N/A'}\n` +
                           `**Team:** ${fighter1.team || 'N/A'}`,
                    inline: true
                },
                {
                    name: `🥊 ${fighter2.name}`,
                    value: `**Record:** ${f2Record}\n` +
                           `**Height:** ${fighter2.height || 'N/A'}\n` +
                           `**Weight:** ${fighter2.weight || 'N/A'}\n` +
                           `**Reach:** ${fighter2.reach || 'N/A'}\n` +
                           `**Team:** ${fighter2.team || 'N/A'}`,
                    inline: true
                },
                {
                    name: '⚖️ Analysis',
                    value: `**Experience Edge:** ${comp.experienceEdge}\n` +
                           `**Height Edge:** ${comp.heightEdge}\n` +
                           `**Reach Edge:** ${comp.reachEdge}\n` +
                           `**Record Edge:** ${comp.recordEdge}`,
                    inline: false
                }
            )
            .setTimestamp()
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
