/**
 * Odds Command - Get real-time betting odds for UFC events
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class OddsCommand extends BaseCommand {
    constructor() {
        super();
        
        this.builder
            .setName('odds')
            .setDescription('Get real-time betting odds for UFC events');
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('odds');
            
            // Defer reply as this may take some time
            await interaction.deferReply();
            
            // Get services from container
            const ufcService = this.container.get('ufc');
            const oddsService = this.container.has('oddsService') ? 
                this.container.get('oddsService') : null;
            
            if (!oddsService) {
                await interaction.editReply({
                    content: '⚠️ Odds service is not yet implemented. Coming soon!'
                });
                return;
            }
            
            // Get upcoming event
            const event = await ufcService.getUpcomingEvent();
            
            if (!event) {
                await interaction.editReply({
                    content: '❌ Could not find any upcoming UFC event.'
                });
                return;
            }
            
            // Get odds for the event
            const odds = await oddsService.getOddsForEvent(event);
            
            if (!odds || odds.length === 0) {
                await interaction.editReply({
                    content: `❌ No betting odds available for ${event.title}.`
                });
                return;
            }
            
            // Create the odds embed
            const oddsEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`🎲 Betting Odds: ${event.title}`)
                .setDescription('Current betting odds from major sportsbooks')
                .setTimestamp();
                
            if (event.url) {
                oddsEmbed.setURL(event.url);
            }
            
            // Add odds for each fight
            odds.forEach((fightOdds, index) => {
                if (index < 10) { // Limit to 10 fights to avoid embed limits
                    oddsEmbed.addFields({
                        name: `${fightOdds.redCornerName} vs ${fightOdds.blueCornerName}`,
                        value: 
                            `**${fightOdds.redCornerName}:** ${fightOdds.redCornerOdds}\n` +
                            `**${fightOdds.blueCornerName}:** ${fightOdds.blueCornerOdds}`,
                        inline: false
                    });
                }
            });
            
            // Add note about odds format
            oddsEmbed.setFooter({
                text: 'Odds displayed in American format. Positive odds (e.g., +150) show profit on $100 bet. Negative odds (e.g., -200) show amount needed to bet to win $100.'
            });
            
            // Send the embed
            await interaction.editReply({ embeds: [oddsEmbed] });
            
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
}

export default new OddsCommand();
