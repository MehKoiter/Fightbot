/**
 * Fight Command - Get information about upcoming UFC events
 * Shows the fight card with interactive buttons
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import BaseCommand from '../../commands/baseCommand.js';
import config from '../../config/config.js';

class FightCommand extends BaseCommand {
    constructor() {
        super();
        
        this.builder
            .setName('fight')
            .setDescription('Get information about the upcoming UFC event with fight card details');
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('fight');
            
            // Defer reply as this may take some time
            await interaction.deferReply();

            // Get services from container
            const ufcService = this.container.get('ufc');
            const cacheService = this.container.get('eventCache');
            
            // Get event from cache or fetch new data
            let event;
            const cacheKey = `upcoming_event`;
            
            event = cacheService.get(cacheKey);
            if (!event) {
                event = await ufcService.getUpcomingEvent();
                if (event) {
                    cacheService.set(cacheKey, event, 30 * 60 * 1000, true); // 30 minutes
                }
            }

            if (!event) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ No Upcoming Events Found')
                    .setDescription('Sorry, I couldn\'t find any upcoming UFC events at the moment.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            // Create embeds array
            const embeds = await this._createEventEmbeds(event);
            
            // Create interactive buttons
            const buttons = this._createInteractiveButtons(event);
            
            // Store event data in cache for button interactions
            const userCacheKey = `${interaction.user.id}_${interaction.channelId}`;
            cacheService.set(userCacheKey, event);
            
            // Send all embeds with interactive buttons
            await interaction.editReply({ 
                embeds: embeds,
                components: buttons
            });
            
        } catch (error) {
            try {
                // Handle error properly using the error handler
                const errorHandler = this.container.get('errorHandler');
                await errorHandler.handleCommandError(interaction, error, 'fight');
            } catch (handlerError) {
                // Fallback if error handler is not available
                console.error('Error in error handler:', handlerError);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ An error occurred while processing your request.',
                        ephemeral: true 
                    });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ 
                        content: '❌ An error occurred while processing your request.'
                    });
                }
            }
        }
    }
    
    /**
     * Create event embeds
     * @param {Object} event - Event data
     * @returns {Array} - Array of embeds
     * @private
     */
    async _createEventEmbeds(event) {
        // Create the main event embed
        const mainEmbed = new EmbedBuilder()
            .setColor('#d20a11') // UFC red color
            .setTitle(`🥊 ${event.title || 'UFC Event'}`)
            .setDescription(event.subtitle || 'Upcoming UFC Event')
            .setURL(event.url || 'https://www.ufc.com/events')
            .setTimestamp();

        // Add event date if available
        if (event.date) {
            mainEmbed.addFields({
                name: '📅 Event Date',
                value: event.date,
                inline: true
            });
        }

        // Add event poster if available
        if (event.imgUrl) {
            mainEmbed.setImage(event.imgUrl);
        }

        // Add number of fights
        if (event.fights && event.fights.length > 0) {
            mainEmbed.addFields({
                name: '🥊 Total Fights',
                value: `${event.fights.length} fights scheduled`,
                inline: true
            });
        }

        const embeds = [mainEmbed];

        // Create embeds for main card fights
        if (event.fights && event.fights.length > 0) {
            const maxFights = event.fights.length;
            const mainCardFights = event.fights.slice(0, Math.min(maxFights, 5)); // Discord embed limits
            
            // Create headliner embed (first fight is usually the main event)
            const headliner = mainCardFights[0];
            if (headliner && headliner.redCorner && headliner.blueCorner) {
                const headlinerEmbed = new EmbedBuilder()
                    .setColor('#ffd700') // Gold color for main event
                    .setTitle('👑 MAIN EVENT')
                    .setDescription(`**${headliner.weightClass || 'Championship Fight'}**`)
                    .addFields(
                        {
                            name: '🔴 Red Corner',
                            value: `**${headliner.redCorner.name || 'TBA'}**${headliner.redCorner.rank ? `\n${headliner.redCorner.rank}` : ''}`,
                            inline: true
                        },
                        {
                            name: '🆚',
                            value: 'VS',
                            inline: true
                        },
                        {
                            name: '🔵 Blue Corner',
                            value: `**${headliner.blueCorner.name || 'TBA'}**${headliner.blueCorner.rank ? `\n${headliner.blueCorner.rank}` : ''}`,
                            inline: true
                        }
                    );
                
                embeds.push(headlinerEmbed);
            }

            // Create main card embed for remaining fights
            if (mainCardFights.length > 1) {
                const mainCardEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📋 Main Card')
                    .setDescription('Additional main card fights:');

                // Add remaining fights to the main card embed
                mainCardFights.slice(1).forEach((fight, index) => {
                    if (fight.redCorner && fight.blueCorner) {
                        const redName = fight.redCorner.name || 'TBA';
                        const blueName = fight.blueCorner.name || 'TBA';
                        const redRank = fight.redCorner.rank ? ` (${fight.redCorner.rank})` : '';
                        const blueRank = fight.blueCorner.rank ? ` (${fight.blueCorner.rank})` : '';
                        
                        mainCardEmbed.addFields({
                            name: `${index + 2}. ${fight.weightClass || 'Fight'}`,
                            value: `${redName}${redRank} vs ${blueName}${blueRank}`,
                            inline: false
                        });
                    }
                });

                embeds.push(mainCardEmbed);
            }
        }

        // Add footer with version information
        embeds[embeds.length - 1].setFooter({
            text: config.messages.freeVersionFooter,
            iconURL: 'https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png'
        });
        
        // Add support embed
        const supportEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('❤️ Support FightBot Development')
            .setDescription(config.messages.premiumPromotion)
            .addFields(
                {
                    name: '🚀 All Features Are FREE!',
                    value: '• **Detailed Fighter Stats** - Full records, striking accuracy, takedown defense\n' +
                           '• **Betting Odds Tracking** - Real-time odds from multiple sportsbooks\n' +
                           '• **Advanced Analytics** - Win probability, performance trends\n' +
                           '• **Custom Notifications** - Get alerts for your favorite fighters\n' +
                           '• **Historical Data** - Access past event results and trends\n' +
                           '• **Export Data** - Download fight cards and stats',
                    inline: false
                },
                {
                    name: '💎 Coming Soon',
                    value: '• Live fight updates\n• Prediction algorithms\n• Multi-event tracking\n• Enhanced support',
                    inline: false
                }
            )
            .setFooter({ text: 'Use /features to see all available features' });
        
        embeds.push(supportEmbed);
        
        return embeds;
    }
    
    /**
     * Create interactive buttons
     * @param {Object} event - Event data
     * @returns {Array} - Array of button rows
     * @private
     */
    _createInteractiveButtons(event) {
        // Create interactive buttons for additional information
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('fight_prelims')
                    .setLabel('Prelims')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📺'),
                new ButtonBuilder()
                    .setCustomId('fight_records')
                    .setLabel('Fighter Records')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('fight_venue')
                    .setLabel('Venue Info')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏟️'),
                new ButtonBuilder()
                    .setCustomId('fight_predictions')
                    .setLabel('Fight Analysis')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎯')
            );

        const secondRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('fight_schedule')
                    .setLabel('Fight Times')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏰'),
                new ButtonBuilder()
                    .setCustomId('fight_refresh')
                    .setLabel('Refresh Data')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setLabel('View on UFC.com')
                    .setStyle(ButtonStyle.Link)
                    .setURL(event.url || 'https://www.ufc.com/events')
                    .setEmoji('🌐')
            );
            
        return [actionRow, secondRow];
    }
}

export default new FightCommand();
