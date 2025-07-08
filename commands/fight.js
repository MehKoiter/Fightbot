import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import UfcService from "../services/ufcService.js";
import { eventCache } from "../services/eventCache.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fight')
        .setDescription('Get information about the upcoming UFC event with fight card details'), 
    
    execute: async (interaction) => {
        try {
            // Defer the reply since this might take a while
            await interaction.deferReply();

            const ufcService = new UfcService();
            const event = await ufcService.getUpcomingEvent();

            if (!event) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ No Upcoming Events Found')
                    .setDescription('Sorry, I couldn\'t find any upcoming UFC events at the moment.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

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

            // Create embeds for main card fights (limit to first 5 for Discord limits)
            if (event.fights && event.fights.length > 0) {
                const mainCardFights = event.fights.slice(0, 5); // Limit to 5 fights due to Discord embed limits
                
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

            // Add footer with UFC branding
            embeds[embeds.length - 1].setFooter({
                text: 'Data from UFC.com • FightBot',
                iconURL: 'https://logoeps.com/wp-content/uploads/2013/03/ufc-vector-logo.png'
            });

            // Create interactive buttons for additional information
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('fight_prelims')
                        .setLabel('📺 Prelims')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📺'),
                    new ButtonBuilder()
                        .setCustomId('fight_records')
                        .setLabel('📊 Fighter Records')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📊'),
                    new ButtonBuilder()
                        .setCustomId('fight_venue')
                        .setLabel('🏟️ Venue Info')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🏟️'),
                    new ButtonBuilder()
                        .setCustomId('fight_predictions')
                        .setLabel('🎯 Fight Analysis')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🎯')
                );

            const secondRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('fight_schedule')
                        .setLabel('⏰ Fight Times')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏰'),
                    new ButtonBuilder()
                        .setCustomId('fight_refresh')
                        .setLabel('🔄 Refresh Data')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setLabel('🌐 View on UFC.com')
                        .setStyle(ButtonStyle.Link)
                        .setURL(event.url || 'https://www.ufc.com/events')
                        .setEmoji('🌐')
                );

            // Store event data in cache for button interactions
            const cacheKey = eventCache.constructor.getKey(interaction);
            eventCache.set(cacheKey, event);

            // Send all embeds with interactive buttons
            await interaction.editReply({ 
                embeds: embeds,
                components: [actionRow, secondRow]
            });

        } catch (error) {
            console.error('❌ Error in fight command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while fetching fight information. Please try again later.')
                .setTimestamp();

            // Check if we can still edit the reply
            try {
                await interaction.editReply({ embeds: [errorEmbed] });
            } catch (editError) {
                // If edit fails, try to follow up
                try {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } catch (followUpError) {
                    console.error('❌ Failed to send error message:', followUpError);
                }
            }
        }
    },
};
