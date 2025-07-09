import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import UfcService from "../services/ufcService.js";
import { VERSION_CONFIG } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fight')
        .setDescription('Get information about the upcoming UFC event with fight card details'), 
    
    execute: async (interaction) => {
        try {
            // Defer the reply IMMEDIATELY - this must happen within 3 seconds
            await interaction.deferReply();

            // Add a small delay to ensure defer is processed
            await new Promise(resolve => setTimeout(resolve, 100));

            // Set a timeout for the UFC service call to prevent long waits
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('UFC service timeout')), 10000)
            );

            const ufcService = new UfcService();
            const event = await Promise.race([
                ufcService.getUpcomingEvent(),
                timeoutPromise
            ]);

            if (!event) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ No Upcoming Events Found')
                    .setDescription('Sorry, I couldn\'t find any upcoming UFC events at the moment.')
                    .addFields(
                        { name: '🔧 Possible Reasons', value: '• UFC.com may be temporarily unavailable\n• No events currently scheduled\n• Network connection issues', inline: false }
                    )
                    .setFooter({ text: 'Try again in a few minutes' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            // Create the main event embed
            const eventEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`🥊 ${event.title}`)
                .setDescription(`**Next UFC Event**\n${event.subtitle || 'Ultimate Fighting Championship'}`)
                .addFields(
                    { name: '📅 Date', value: event.date || 'TBA', inline: true },
                    { name: '📍 Location', value: event.location || 'TBA', inline: true },
                    { name: '🕐 Time', value: event.time || 'TBA', inline: true }
                )
                .setFooter({ 
                    text: `Data from UFC.com • FightBot v${VERSION_CONFIG.version} - Free Forever!`,
                    iconURL: 'https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png'
                })
                .setTimestamp();

            // Add event poster/image if available
            if (event.imageUrl || event.imgUrl) {
                const imageUrl = event.imageUrl || event.imgUrl;
                console.log('🖼️ Adding event poster:', imageUrl);
                eventEmbed.setImage(imageUrl);
            } else {
                console.log('⚠️ No event poster found, using UFC logo');
                // Use a fallback UFC logo/banner if no poster is found
                eventEmbed.setThumbnail('https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png');
            }

            // Create fight card embed if fights are available
            const embeds = [eventEmbed];
            
            if (event.fights && event.fights.length > 0) {
                // Check if we have valid fight data (not all TBA)
                const validFights = event.fights.filter(fight => 
                    fight.redCorner?.name && fight.redCorner.name !== 'TBA' && 
                    fight.blueCorner?.name && fight.blueCorner.name !== 'TBA'
                );
                
                if (validFights.length === 0) {
                    console.log('⚠️ No valid fight data found - all fighters are TBA');
                    
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ffaa00')
                        .setTitle('⚠️ Fight Card Not Available')
                        .setDescription('The fight card details are not yet available for this event.')
                        .addFields(
                            { name: '🔧 This could mean:', value: '• Fight card hasn\'t been announced yet\n• UFC website structure has changed\n• Event details are being updated', inline: false }
                        )
                        .setFooter({ text: 'Check back later or visit UFC.com for updates' })
                        .setTimestamp();
                    
                    embeds.push(errorEmbed);
                } else {
                    const fightCardEmbed = new EmbedBuilder()
                        .setColor('#ff9900')
                        .setTitle('🥊 Fight Card')
                        .setDescription('**Main Card & Featured Fights**');

                    // Show valid fights (limit to 12 for better layout)
                    const displayFights = validFights.slice(0, 12);
                    
                    displayFights.forEach((fight, index) => {
                        const fighter1 = fight.redCorner?.name || 'TBA';
                        const fighter2 = fight.blueCorner?.name || 'TBA';
                        const weightClass = fight.weightClass || 'TBA';
                        
                        // Format weight class to be shorter
                        const shortWeightClass = weightClass
                            .replace('Heavyweight Bout', 'HW')
                            .replace('Light Heavyweight Bout', 'LHW')
                            .replace('Middleweight Bout', 'MW')
                            .replace('Welterweight Bout', 'WW')
                            .replace('Lightweight Bout', 'LW')
                            .replace('Featherweight Bout', 'FW')
                            .replace('Bantamweight Bout', 'BW')
                            .replace('Flyweight Bout', 'FLW')
                            .replace('Women\'s', 'W')
                            .replace('Bout', '')
                            .trim();
                        
                        // Create cleaner formatting with proper line breaks
                        const fightInfo = `**${fighter1}** vs **${fighter2}**\n${shortWeightClass}`;
                        
                        fightCardEmbed.addFields({
                            name: `${index + 1}.`,
                            value: fightInfo,
                            inline: true
                        });
                    });

                    embeds.push(fightCardEmbed);
                }
            } else {
                console.log('⚠️ No fights found in event data');
                
                const noFightsEmbed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('⚠️ Fight Card Not Available')
                    .setDescription('Fight card information could not be retrieved for this event.')
                    .addFields(
                        { name: '🔧 Possible reasons:', value: '• Fight card not yet announced\n• Website parsing issues\n• Event page structure changed', inline: false }
                    )
                    .setFooter({ text: 'Visit UFC.com for the latest information' })
                    .setTimestamp();
                
                embeds.push(noFightsEmbed);
            }

            // Create interactive buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('fight_refresh')
                        .setLabel('🔄 Refresh')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('fight_prelims')
                        .setLabel('📋 Prelims')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('fight_stats')
                        .setLabel('📊 Stats')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Add UFC.com link if available
            if (event.url) {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setLabel('🔗 UFC.com')
                        .setStyle(ButtonStyle.Link)
                        .setURL(event.url)
                );
            }

            await interaction.editReply({ embeds: embeds, components: [actionRow] });

        } catch (error) {
            console.error('❌ Error in fight command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Sorry, there was an error fetching the fight information. Please try again in a moment.')
                .addFields(
                    { name: '🔧 Troubleshooting', value: '• Check your internet connection\n• Try the command again\n• The UFC website may be temporarily unavailable', inline: false }
                )
                .setFooter({ text: 'All features remain free regardless!' })
                .setTimestamp();
            
            try {
                // Only try to respond if we haven't already responded
                if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Failed to send error message:', replyError);
                // If we can't send a message, it's likely because the interaction has expired
                // This is normal for Discord interactions that take too long
            }
        }
    },
};
