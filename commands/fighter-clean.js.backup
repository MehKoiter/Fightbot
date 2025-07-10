/**
 * Fighter Command - Streamlined SportsData.io Integration
 * Version 4.1: Professional Fighter Profiles with SportsData.io API
 * 
 * Features:
 * - Professional fighter profiles from SportsData.io API
 * - Real-time fight statistics and career analytics
 * - Advanced fighter comparisons with detailed analysis
 * - Interactive profile navigation with rich embeds
 * - Intelligent autocomplete with SportsData.io fighters
 * - Enhanced error handling and performance optimization
 * - Clean, maintainable codebase with single API source
 */

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import SportsDataMMAService from "../services/sportsDataMMAService.js";
import FighterInteractionHandler from "../services/fighterInteractionHandler.js";
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
                const sportsDataService = new SportsDataMMAService();
                const suggestions = await sportsDataService.searchFighters(focusedValue);
                
                // Ensure we return valid format for Discord
                if (!Array.isArray(suggestions)) {
                    console.log('⚠️ SportsData service returned non-array suggestions');
                    return [];
                }
                
                // Convert to Discord autocomplete format
                return suggestions.map(fighter => ({
                    name: `${fighter.DisplayName}${fighter.Nickname ? ` "${fighter.Nickname}"` : ''}`,
                    value: fighter.DisplayName || fighter.FirstName + ' ' + fighter.LastName
                })).slice(0, 25); // Discord autocomplete limit
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
            const sportsDataService = new SportsDataMMAService();
            
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
                
                const comparison = await sportsDataService.compareFighters(fighterName, compareFighter);
                
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
                const comparisonEmbed = await this.createComparisonEmbed(comparison.fighter1, comparison.fighter2);
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
                // Search for the fighter first to get their ID
                const searchResults = await sportsDataService.searchFighters(fighterName);
                if (!searchResults || searchResults.length === 0) {
                    throw new Error('Fighter not found in search');
                }
                
                // Get the detailed profile using the fighter ID
                fighter = await Promise.race([
                    sportsDataService.getFighterProfile(searchResults[0].FighterId),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
                ]);
            } catch (timeoutError) {
                // If it takes too long, defer and try again
                await safeDeferReply();
                const searchResults = await sportsDataService.searchFighters(fighterName);
                if (searchResults && searchResults.length > 0) {
                    fighter = await sportsDataService.getFighterProfile(searchResults[0].FighterId);
                }
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
            .setTitle(`🥊 ${fighter.DisplayName || fighter.FirstName + ' ' + fighter.LastName}${fighter.Nickname ? ` "${fighter.Nickname}"` : ''}`)
            .setDescription(`**Professional Mixed Martial Artist**`)
            .addFields(
                {
                    name: '📊 Fight Record',
                    value: `**${fighter.Wins || 0}-${fighter.Losses || 0}-${fighter.Draws || 0}**\n` +
                           `Wins: ${fighter.Wins || 0} | Losses: ${fighter.Losses || 0} | Draws: ${fighter.Draws || 0}\n` +
                           `Win Rate: ${fighter.Wins && fighter.Losses ? ((fighter.Wins / (fighter.Wins + fighter.Losses)) * 100).toFixed(1) : 0}%`,
                    inline: true
                },
                {
                    name: '📏 Physical Stats',
                    value: `**Height:** ${fighter.Height || 'N/A'}\n` +
                           `**Weight:** ${fighter.Weight || 'N/A'}\n` +
                           `**Reach:** ${fighter.Reach || 'N/A'}\n` +
                           `**Stance:** ${fighter.Stance || 'N/A'}`,
                    inline: true
                },
                {
                    name: '🏟️ Fighter Info',
                    value: `**Division:** ${fighter.WeightClass || 'N/A'}\n` +
                           `**Born:** ${fighter.BirthDate ? new Date(fighter.BirthDate).toLocaleDateString() : 'N/A'}\n` +
                           `**Nationality:** ${fighter.Nationality || 'N/A'}\n` +
                           `**Team:** ${fighter.Team || 'N/A'}`,
                    inline: true
                }
            );

        // Add career highlights if available
        if (fighter.TitleWins > 0) {
            embed.addFields({
                name: '🏆 Championships',
                value: `Title Wins: ${fighter.TitleWins}\nTitle Losses: ${fighter.TitleLosses}\nTitle Draws: ${fighter.TitleDraws}`,
                inline: false
            });
        }

        // Add photo if available
        if (fighter.PhotoUrl) {
            embed.setThumbnail(fighter.PhotoUrl);
        }

        embed.setTimestamp()
             .setFooter({ text: 'FightBot • SportsData.io Professional Fighter Profiles' });

        return embed;
    },

    /**
     * Create comparison embed for two fighters
     */
    async createComparisonEmbed(fighter1, fighter2) {
        const f1Record = `${fighter1.Wins || 0}-${fighter1.Losses || 0}-${fighter1.Draws || 0}`;
        const f2Record = `${fighter2.Wins || 0}-${fighter2.Losses || 0}-${fighter2.Draws || 0}`;

        const f1WinRate = fighter1.Wins && fighter1.Losses ? ((fighter1.Wins / (fighter1.Wins + fighter1.Losses)) * 100).toFixed(1) : 0;
        const f2WinRate = fighter2.Wins && fighter2.Losses ? ((fighter2.Wins / (fighter2.Wins + fighter2.Losses)) * 100).toFixed(1) : 0;

        // Calculate advantages
        const experienceEdge = (fighter1.Wins + fighter1.Losses) > (fighter2.Wins + fighter2.Losses) ? fighter1.DisplayName : fighter2.DisplayName;
        const recordEdge = f1WinRate > f2WinRate ? fighter1.DisplayName : f2WinRate > f1WinRate ? fighter2.DisplayName : 'Even';

        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(`⚔️ Fighter Comparison`)
            .setDescription(`**${fighter1.DisplayName}** vs **${fighter2.DisplayName}**`)
            .addFields(
                {
                    name: `🥊 ${fighter1.DisplayName}`,
                    value: `**Record:** ${f1Record} (${f1WinRate}% win rate)\n` +
                           `**Height:** ${fighter1.Height || 'N/A'}\n` +
                           `**Weight:** ${fighter1.Weight || 'N/A'}\n` +
                           `**Reach:** ${fighter1.Reach || 'N/A'}\n` +
                           `**Division:** ${fighter1.WeightClass || 'N/A'}`,
                    inline: true
                },
                {
                    name: `🥊 ${fighter2.DisplayName}`,
                    value: `**Record:** ${f2Record} (${f2WinRate}% win rate)\n` +
                           `**Height:** ${fighter2.Height || 'N/A'}\n` +
                           `**Weight:** ${fighter2.Weight || 'N/A'}\n` +
                           `**Reach:** ${fighter2.Reach || 'N/A'}\n` +
                           `**Division:** ${fighter2.WeightClass || 'N/A'}`,
                    inline: true
                },
                {
                    name: '⚖️ Analysis',
                    value: `**Experience Edge:** ${experienceEdge}\n` +
                           `**Record Edge:** ${recordEdge}\n` +
                           `**Title Wins:** ${fighter1.TitleWins || 0} vs ${fighter2.TitleWins || 0}`,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'FightBot • SportsData.io Fighter Comparison' });

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
