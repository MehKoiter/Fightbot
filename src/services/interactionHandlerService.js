/**
 * Interaction Handler Service - Manages Discord interaction responses
 * Migrated to use the new BaseService class
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import BaseService from './baseService.js';

class InteractionHandlerService extends BaseService {
    constructor() {
        super();
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Get dependencies from container
            const container = await import('./serviceContainer.js');
            this.container = container.default;
            
            this.logger = this.container.get('logger');
            this.ufcService = this.container.get('ufc');
            this.eventCache = this.container.get('eventCache');
            this.analytics = this.container.get('analytics');
            
            this.logger.info('Interaction Handler Service initialized');
            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }

    /**
     * Handle button interactions
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @returns {Promise<void>}
     */
    async handleButtonInteraction(interaction) {
        try {
            this.ensureInitialized();
            
            const { customId } = interaction;
            this.logger.info(`Button clicked: ${customId}`);
            
            // Track feature usage
            await this.analytics.trackFeature(`button:${customId}`, 
                interaction.guildId, 
                interaction.channelId
            );
            
            // Get cached event data or defer while we fetch it
            let event = this.eventCache.get(this.getCacheKey(interaction));
            
            if (!event) {
                await interaction.deferUpdate();
                event = await this.ufcService.getUpcomingEvent();
                
                if (!event) {
                    await interaction.editReply({
                        content: '❌ Failed to fetch event data. Please try again later.',
                        components: []
                    });
                    return;
                }
                
                this.eventCache.set(this.getCacheKey(interaction), event);
            }
            
            // Handle different button actions
            switch (customId) {
                case 'main_card':
                    await this.showMainCard(interaction, event);
                    break;
                case 'prelims':
                    await this.showPrelims(interaction, event);
                    break;
                case 'early_prelims':
                    await this.showEarlyPrelims(interaction, event);
                    break;
                case 'refresh':
                    await this.handleRefresh(interaction);
                    break;
                case 'stats':
                    await this.showEventStats(interaction, event);
                    break;
                case 'links':
                    await this.showEventLinks(interaction, event);
                    break;
                default:
                    await interaction.editReply({
                        content: '❓ Unknown button action.'
                    });
            }
        } catch (error) {
            this.handleError(error, 'handleButtonInteraction');
            
            // Try to respond to the interaction
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your request.',
                        ephemeral: true
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ An error occurred while processing your request.'
                    });
                }
            } catch (replyError) {
                this.logger.error('Failed to send error response:', replyError);
            }
        }
    }

    /**
     * Show main card fights
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @param {Event} event - UFC event data
     * @returns {Promise<void>}
     */
    async showMainCard(interaction, event) {
        try {
            this.ensureInitialized();
            
            const mainCardFights = event.fights.slice(0, 5); // Main card usually has 5 fights
            
            if (mainCardFights.length === 0) {
                await interaction.editReply({
                    content: 'No main card fights found for this event.'
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#d20a11')
                .setTitle(`${event.title} - Main Card`)
                .setDescription(event.date || 'Upcoming UFC Event')
                .setTimestamp();
                
            // Add fights to embed
            mainCardFights.forEach((fight, index) => {
                let fightDesc = '';
                
                // Add red corner fighter with rank
                if (fight.redCorner.rank) {
                    fightDesc += `🔴 #${fight.redCorner.rank} `;
                } else {
                    fightDesc += '🔴 ';
                }
                fightDesc += `**${fight.redCorner.name}**\n`;
                
                // Add blue corner fighter with rank
                if (fight.blueCorner.rank) {
                    fightDesc += `🔵 #${fight.blueCorner.rank} `;
                } else {
                    fightDesc += '🔵 ';
                }
                fightDesc += `**${fight.blueCorner.name}**`;
                
                // Add the fight to the embed
                embed.addFields({
                    name: index === 0 ? `🏆 ${fight.weightClass} Main Event` : fight.weightClass,
                    value: fightDesc,
                    inline: false
                });
            });
            
            // Create navigation buttons
            const buttons = this.createNavigationButtons();
            
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            this.handleError(error, 'showMainCard');
            throw error;
        }
    }

    /**
     * Show preliminary card fights
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @param {Event} event - UFC event data
     * @returns {Promise<void>}
     */
    async showPrelims(interaction, event) {
        try {
            this.ensureInitialized();
            
            const prelims = event.fights.slice(5, 9); // Prelims usually have 4 fights
            
            if (prelims.length === 0) {
                await interaction.editReply({
                    content: 'No preliminary fights found for this event.'
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${event.title} - Preliminary Card`)
                .setDescription(event.date || 'Upcoming UFC Event')
                .setTimestamp();
                
            // Add fights to embed
            prelims.forEach((fight) => {
                let fightDesc = '';
                
                // Add red corner fighter with rank
                if (fight.redCorner.rank) {
                    fightDesc += `🔴 #${fight.redCorner.rank} `;
                } else {
                    fightDesc += '🔴 ';
                }
                fightDesc += `**${fight.redCorner.name}**\n`;
                
                // Add blue corner fighter with rank
                if (fight.blueCorner.rank) {
                    fightDesc += `🔵 #${fight.blueCorner.rank} `;
                } else {
                    fightDesc += '🔵 ';
                }
                fightDesc += `**${fight.blueCorner.name}**`;
                
                // Add the fight to the embed
                embed.addFields({
                    name: fight.weightClass,
                    value: fightDesc,
                    inline: false
                });
            });
            
            // Create navigation buttons
            const buttons = this.createNavigationButtons();
            
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            this.handleError(error, 'showPrelims');
            throw error;
        }
    }

    /**
     * Show early preliminary card fights
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @param {Event} event - UFC event data
     * @returns {Promise<void>}
     */
    async showEarlyPrelims(interaction, event) {
        try {
            this.ensureInitialized();
            
            const earlyPrelims = event.fights.slice(9); // Early prelims are the rest
            
            if (earlyPrelims.length === 0) {
                await interaction.editReply({
                    content: 'No early preliminary fights found for this event.'
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#777777')
                .setTitle(`${event.title} - Early Prelims`)
                .setDescription(event.date || 'Upcoming UFC Event')
                .setTimestamp();
                
            // Add fights to embed
            earlyPrelims.forEach((fight) => {
                let fightDesc = '';
                
                // Add red corner fighter with rank
                if (fight.redCorner.rank) {
                    fightDesc += `🔴 #${fight.redCorner.rank} `;
                } else {
                    fightDesc += '🔴 ';
                }
                fightDesc += `**${fight.redCorner.name}**\n`;
                
                // Add blue corner fighter with rank
                if (fight.blueCorner.rank) {
                    fightDesc += `🔵 #${fight.blueCorner.rank} `;
                } else {
                    fightDesc += '🔵 ';
                }
                fightDesc += `**${fight.blueCorner.name}**`;
                
                // Add the fight to the embed
                embed.addFields({
                    name: fight.weightClass,
                    value: fightDesc,
                    inline: false
                });
            });
            
            // Create navigation buttons
            const buttons = this.createNavigationButtons();
            
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            this.handleError(error, 'showEarlyPrelims');
            throw error;
        }
    }

    /**
     * Show event statistics
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @param {Event} event - UFC event data
     * @returns {Promise<void>}
     */
    async showEventStats(interaction, event) {
        try {
            this.ensureInitialized();
            
            // Calculate event statistics
            const totalFights = event.fights.length;
            const championshipFights = event.fights.filter(fight => 
                fight.weightClass.toLowerCase().includes('championship') || 
                fight.weightClass.toLowerCase().includes('title')
            ).length;
            
            const rankedFighters = event.fights.filter(fight => 
                fight.redCorner.rank || fight.blueCorner.rank
            ).length;
            
            // Weight class distribution
            const weightClasses = {};
            event.fights.forEach(fight => {
                // Normalize weight class name
                const weightClass = fight.weightClass
                    .replace('Championship', '')
                    .replace('Title', '')
                    .replace('Bout', '')
                    .replace('UFC', '')
                    .trim();
                    
                if (weightClass in weightClasses) {
                    weightClasses[weightClass]++;
                } else {
                    weightClasses[weightClass] = 1;
                }
            });
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${event.title} - Event Statistics`)
                .setDescription(event.date || 'Upcoming UFC Event')
                .addFields(
                    { 
                        name: '📊 Fight Stats', 
                        value: `Total Fights: ${totalFights}\n` +
                               `Championship Fights: ${championshipFights}\n` +
                               `Fights with Ranked Fighters: ${rankedFighters}`,
                        inline: false
                    }
                )
                .setTimestamp();
                
            // Add weight class distribution
            const weightClassText = Object.entries(weightClasses)
                .map(([weightClass, count]) => `${weightClass}: ${count} fight${count > 1 ? 's' : ''}`)
                .join('\n');
                
            embed.addFields({
                name: '⚖️ Weight Classes',
                value: weightClassText || 'No weight class information available',
                inline: false
            });
            
            // Create navigation buttons
            const buttons = this.createNavigationButtons();
            
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            this.handleError(error, 'showEventStats');
            throw error;
        }
    }

    /**
     * Show event links
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @param {Event} event - UFC event data
     * @returns {Promise<void>}
     */
    async showEventLinks(interaction, event) {
        try {
            this.ensureInitialized();
            
            const embed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle(`${event.title} - Event Links`)
                .setDescription(event.date || 'Upcoming UFC Event')
                .addFields(
                    { 
                        name: '🔗 Official Links', 
                        value: `[UFC Event Page](${event.url || 'https://www.ufc.com/events'})\n` +
                               `[UFC.com](https://www.ufc.com)\n` +
                               `[UFC Fight Pass](https://www.ufcfightpass.com)`,
                        inline: false
                    },
                    {
                        name: '📺 Watch Options',
                        value: 'Check your local listings for PPV and broadcast information.\n' +
                               'Preliminary cards typically air on ESPN+ in the US.',
                        inline: false
                    }
                )
                .setTimestamp();
                
            // Create navigation buttons
            const buttons = this.createNavigationButtons();
            
            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            this.handleError(error, 'showEventLinks');
            throw error;
        }
    }

    /**
     * Handle refresh button click
     * @param {ButtonInteraction} interaction - Discord button interaction
     * @returns {Promise<void>}
     */
    async handleRefresh(interaction) {
        try {
            this.ensureInitialized();
            
            await interaction.deferUpdate();
            
            // Clear cache for this interaction
            this.eventCache.delete(this.getCacheKey(interaction));
            
            // Fetch fresh event data
            const event = await this.ufcService.getUpcomingEvent();
            
            if (!event) {
                await interaction.editReply({
                    content: '❌ Failed to fetch updated event data. Please try again later.',
                    components: []
                });
                return;
            }
            
            // Cache the new data
            this.eventCache.set(this.getCacheKey(interaction), event);
            
            // Show updated main card
            await this.showMainCard(interaction, event);
        } catch (error) {
            this.handleError(error, 'handleRefresh');
            throw error;
        }
    }

    /**
     * Create standard navigation buttons for event displays
     * @returns {ActionRowBuilder} Row of buttons
     */
    createNavigationButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('main_card')
                    .setLabel('Main Card')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('prelims')
                    .setLabel('Prelims')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('early_prelims')
                    .setLabel('Early Prelims')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stats')
                    .setLabel('Event Stats')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('refresh')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Secondary)
            );
    }

    /**
     * Get a unique cache key for an interaction
     * @param {Interaction} interaction - Discord interaction
     * @returns {string} Cache key
     */
    getCacheKey(interaction) {
        return `event:${interaction.user.id}:${interaction.channelId}`;
    }
}

// Create and export a singleton instance
const interactionHandler = new InteractionHandlerService();
export { interactionHandler };
export default InteractionHandlerService;
