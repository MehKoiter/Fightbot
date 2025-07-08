/**
 * Fighter Command - Look up UFC fighter statistics
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class FighterCommand extends BaseCommand {
    constructor() {
        super();
        
        this.builder
            .setName('fighter')
            .setDescription('Look up UFC fighter statistics')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Fighter name to search for')
                    .setRequired(true));
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('fighter');
            
            // Defer reply as this may take some time
            await interaction.deferReply();
            
            // Get fighter name from options
            const fighterName = interaction.options.getString('name');
            
            // Get services from container
            const ufcService = this.container.get('ufc');
            
            // Get fighter data
            const fighter = await ufcService.getFighterByName(fighterName);
            
            if (!fighter) {
                await interaction.editReply({
                    content: `❌ Could not find fighter: ${fighterName}`
                });
                return;
            }
            
            // Create the fighter embed
            const fighterEmbed = new EmbedBuilder()
                .setColor('#d20a11') // UFC red
                .setTitle(`${fighter.name}${fighter.nickname ? ` "${fighter.nickname}"` : ''}`)
                .setDescription(`Fighter Statistics`)
                .addFields(
                    { name: 'Record', value: fighter.record || 'N/A', inline: true },
                    { name: 'Height', value: fighter.height || 'N/A', inline: true },
                    { name: 'Weight', value: fighter.weight || 'N/A', inline: true },
                    { name: 'Reach', value: fighter.reach || 'N/A', inline: true },
                    { name: 'Stance', value: fighter.stance || 'N/A', inline: true },
                    { name: 'DOB', value: fighter.dateOfBirth || 'N/A', inline: true },
                )
                .setTimestamp();
                
            // Add UFC link if available
            if (fighter.url) {
                fighterEmbed.setURL(fighter.url);
            }
                
            // Add strike stats if available
            if (fighter.significant_strikes_per_min || fighter.significant_strike_accuracy) {
                fighterEmbed.addFields({
                    name: '👊 Strike Stats',
                    value: 
                        `• **Strikes Per Min:** ${fighter.significant_strikes_per_min || 'N/A'}\n` +
                        `• **Strike Accuracy:** ${fighter.significant_strike_accuracy || 'N/A'}\n` +
                        `• **Strikes Absorbed:** ${fighter.significant_strikes_absorbed_per_min || 'N/A'}\n` +
                        `• **Strike Defense:** ${fighter.significant_strike_defense || 'N/A'}`,
                    inline: false
                });
            }
                
            // Add grappling stats if available
            if (fighter.average_takedowns_per_15_min || fighter.takedown_accuracy) {
                fighterEmbed.addFields({
                    name: '🤼 Grappling Stats',
                    value: 
                        `• **Takedowns Per 15 Min:** ${fighter.average_takedowns_per_15_min || 'N/A'}\n` +
                        `• **Takedown Accuracy:** ${fighter.takedown_accuracy || 'N/A'}\n` +
                        `• **Takedown Defense:** ${fighter.takedown_defense || 'N/A'}\n` +
                        `• **Submissions Per 15 Min:** ${fighter.average_submissions_per_15_min || 'N/A'}`,
                    inline: false
                });
            }
            
            // Send the embed
            await interaction.editReply({ embeds: [fighterEmbed] });
            
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
}

export default new FighterCommand();
