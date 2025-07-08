import { Events, EmbedBuilder } from 'discord.js';
import UfcService from '../services/ufcService.js';
import { eventCache } from '../services/eventCache.js';

export default {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		// Handle slash commands
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`❌ No command matching ${interaction.commandName} was found.`);
				
				// Respond to user if interaction hasn't been replied to yet
				if (!interaction.replied && !interaction.deferred) {
					try {
						await interaction.reply({ 
							content: '❌ Command not found!', 
							ephemeral: true 
						});
					} catch (error) {
						console.error('Failed to send error response:', error.message);
					}
				}
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`❌ Error executing ${interaction.commandName}:`, error.message);
				
				// Respond to user if interaction hasn't been replied to yet
				const errorMessage = { 
					content: '❌ There was an error while executing this command!', 
					ephemeral: true 
				};
				
				try {
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp(errorMessage);
					} else {
						await interaction.reply(errorMessage);
					}
				} catch (followUpError) {
					console.error('Failed to send error response:', followUpError.message);
				}
			}
		}
		// Handle button interactions
		else if (interaction.isButton()) {
			try {
				await handleButtonInteraction(interaction);
			} catch (error) {
				console.error('❌ Error handling button interaction:', error.message);
				
				try {
					if (!interaction.replied && !interaction.deferred) {
						await interaction.reply({
							content: '❌ An error occurred while processing your request.',
							ephemeral: true
						});
					}
				} catch (replyError) {
					console.error('Failed to send button error response:', replyError.message);
				}
			}
		}
	},
};

/**
 * Handle button interactions for fight-related buttons
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleButtonInteraction(interaction) {
	const customId = interaction.customId;
	
	// Handle fight-related button interactions
	if (!customId.startsWith('fight_')) return;

	await interaction.deferReply({ ephemeral: true });

	// Get cached event data
	const cacheKey = `${interaction.user.id}_${interaction.channelId}`;
	const eventData = eventCache.get(cacheKey);
	
	// Debug logging
	console.log(`🔍 Button interaction: ${customId}`);
	console.log(`🔑 Cache key: ${cacheKey}`);
	console.log(`📊 Event data found:`, eventData ? 'Yes' : 'No');
	if (eventData) {
		console.log(`📝 Event title: ${eventData.title}`);
		console.log(`🥊 Number of fights: ${eventData.fights?.length || 0}`);
	}

	switch (customId) {
		case 'fight_prelims':
			await handlePrelimsButton(interaction, eventData);
			break;
		case 'fight_records':
			await handleRecordsButton(interaction, eventData);
			break;
		case 'fight_venue':
			await handleVenueButton(interaction, eventData);
			break;
		case 'fight_predictions':
			await handlePredictionsButton(interaction, eventData);
			break;
		case 'fight_schedule':
			await handleScheduleButton(interaction, eventData);
			break;
		case 'fight_refresh':
			await handleRefreshButton(interaction);
			break;
		default:
			await interaction.editReply({
				content: '❌ Unknown button interaction.'
			});
	}
}

/**
 * Handle prelims button click
 */
async function handlePrelimsButton(interaction, eventData) {
	const embed = new EmbedBuilder()
		.setColor('#9932cc')
		.setTitle('📺 Preliminary Card')
		.setDescription('**Early Prelims & Prelims Information**')
		.addFields(
			{
				name: '🕕 Early Prelims',
				value: 'Usually starts 2-3 hours before main card\nFeaturing up-and-coming fighters',
				inline: false
			},
			{
				name: '🕘 Prelims',
				value: 'Usually starts 1-2 hours before main card\nFeaturing established contenders',
				inline: false
			},
			{
				name: '📺 Where to Watch',
				value: '• **UFC Fight Pass** (Early Prelims)\n• **ESPN/ESPN+** (Prelims)\n• **Pay-Per-View** (Main Card)',
				inline: false
			}
		)
		.setFooter({ text: 'Times may vary by event and timezone' })
		.setTimestamp();

	await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle fighter records button click
 */
async function handleRecordsButton(interaction, eventData) {
	console.log('📊 Starting records button handler...');
	
	try {
		const embed = new EmbedBuilder()
			.setColor('#ff6347')
			.setTitle('📊 Fighter Records & Stats')
			.setTimestamp();

		if (!eventData || !eventData.fights || eventData.fights.length === 0) {
			console.log('❌ No fighter data available');
			embed.setDescription('❌ **No fighter data available**')
				.addFields({
					name: '🔄 Try Again',
					value: 'Use the refresh button and try again, or run `/fight` command again.',
					inline: false
				});
			
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const mainEvent = eventData.fights[0];
		
		embed.setDescription(`**Fighter Statistics for ${eventData.title || 'UFC Event'}**`);

		// Main Event Fighter Stats
		if (mainEvent && mainEvent.redCorner && mainEvent.blueCorner) {
			console.log('🥊 Processing main event fighter stats...');
			
			const redFighter = mainEvent.redCorner;
			const blueFighter = mainEvent.blueCorner;
			
			// Red Corner Stats
			embed.addFields({
				name: `🔴 ${redFighter.name || 'TBA'} ${redFighter.rank ? `(${redFighter.rank})` : '(Unranked)'}`,
				value: buildFighterStatsString(redFighter),
				inline: true
			});
			
			// Blue Corner Stats  
			embed.addFields({
				name: `🔵 ${blueFighter.name || 'TBA'} ${blueFighter.rank ? `(${blueFighter.rank})` : '(Unranked)'}`,
				value: buildFighterStatsString(blueFighter),
				inline: true
			});
			
			// Add spacer for better formatting
			embed.addFields({
				name: '\u200b',
				value: '\u200b',
				inline: false
			});
		}

		// Card Statistics Overview
		const cardStats = analyzeCardStats(eventData.fights);
		embed.addFields({
			name: '📋 Card Overview',
			value: `**Total Fights:** ${eventData.fights.length}\n` +
				   `**Ranked Fighters:** ${cardStats.rankedFighters}\n` +
				   `**Title Fights:** ${cardStats.titleFights}\n` +
				   `**Combined Experience:** ${cardStats.totalFights}+ UFC fights`,
			inline: false
		});

		// Top Ranked Fighters on Card
		const rankedFighters = getTopRankedFighters(eventData.fights);
		if (rankedFighters.length > 0) {
			embed.addFields({
				name: '🏆 Top Ranked Fighters',
				value: rankedFighters.slice(0, 8).join('\n') + (rankedFighters.length > 8 ? '\n*...and more*' : ''),
				inline: false
			});
		}

		// Notable Matchups
		const notableMatchups = getNotableMatchups(eventData.fights);
		if (notableMatchups.length > 0) {
			embed.addFields({
				name: '⭐ Notable Matchups',
				value: notableMatchups.slice(0, 3).join('\n'),
				inline: false
			});
		}

		embed.addFields({
			name: '💡 Stats Information',
			value: '• Rankings based on official UFC standings\n' +
				   '• For detailed fight history, visit UFC.com\n' +
				   '• Stats reflect publicly available information',
			inline: false
		});

		embed.setFooter({ text: 'Fighter stats and rankings • Data from UFC.com' });

		console.log('📤 Sending records response...');
		await interaction.editReply({ embeds: [embed] });
		console.log('✅ Records response sent successfully');
		
	} catch (error) {
		console.error('❌ Error in handleRecordsButton:', error);
		
		try {
			await interaction.editReply({
				content: '❌ An error occurred while fetching fighter records. Please try again.',
				embeds: []
			});
		} catch (replyError) {
			console.error('❌ Failed to send error response:', replyError);
		}
	}
}

/**
 * Handle venue information button click
 */
async function handleVenueButton(interaction, eventData) {
	const embed = new EmbedBuilder()
		.setColor('#32cd32')
		.setTitle('🏟️ Venue Information')
		.setDescription('**Event Location & Details**')
		.addFields(
			{
				name: '📍 Location Details',
				value: 'Venue information is typically announced closer to the event date. Check UFC.com for the latest updates.',
				inline: false
			},
			{
				name: '🎫 Ticket Information',
				value: '• **Official Sales**: UFC.com, Ticketmaster\n• **Capacity**: Varies by venue\n• **Seating**: Floor, Lower Bowl, Upper Bowl options',
				inline: false
			},
			{
				name: '🕐 Event Schedule',
				value: '• **Doors Open**: Usually 3-4 hours before main event\n• **First Fight**: Early prelims start\n• **Main Event**: Typically 10 PM ET / 7 PM PT',
				inline: false
			}
		)
		.setFooter({ text: 'Visit UFC.com for official venue and ticket information' })
		.setTimestamp();

	await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle fight predictions/analysis button click
 */
async function handlePredictionsButton(interaction, eventData) {
	console.log('🎯 Starting predictions button handler...');
	
	try {
		const embed = new EmbedBuilder()
			.setColor('#ff1493')
			.setTitle('🎯 Fight Analysis & Insights')
			.setTimestamp();

		// If no cached data, try to fetch fresh data
		if (!eventData || !eventData.fights || eventData.fights.length === 0) {
			console.log('🔄 No cached data found, fetching fresh data...');
			
			try {
				const ufcService = new UfcService();
				const freshEvent = await ufcService.getUpcomingEvent();
				
				if (freshEvent && freshEvent.fights && freshEvent.fights.length > 0) {
					console.log('✅ Fresh data retrieved successfully');
					eventData = freshEvent;
					
					// Cache the fresh data for future use
					const cacheKey = `${interaction.user.id}_${interaction.channelId}`;
					eventCache.set(cacheKey, freshEvent);
				} else {
					console.log('❌ No fresh data available either');
				}
			} catch (error) {
				console.error('❌ Error fetching fresh data:', error.message);
			}
		}

		// Still no data after trying to fetch fresh
		if (!eventData || !eventData.fights || eventData.fights.length === 0) {
			console.log('❌ No data available for analysis');
			embed.setDescription('❌ **No fight data available for analysis**')
				.addFields({
					name: '🔄 Try Again',
					value: 'Use the refresh button and try again, or run `/fight` command again to cache fresh data.',
					inline: false
				});
			
			await interaction.editReply({ embeds: [embed] });
			console.log('✅ Sent no-data response');
			return;
		}

		console.log('📊 Processing analysis with data...');
		
		// Analyze the main event (first fight)
		const mainEvent = eventData.fights[0];
		const totalFights = eventData.fights.length;

		embed.setDescription(`**Analysis for ${eventData.title || 'UFC Event'}**`);

		// Main Event Analysis
		if (mainEvent && mainEvent.redCorner && mainEvent.blueCorner) {
			console.log('🥊 Analyzing main event...');
			const redFighter = mainEvent.redCorner.name || 'TBA';
			const blueFighter = mainEvent.blueCorner.name || 'TBA';
			const redRank = mainEvent.redCorner.rank || 'Unranked';
			const blueRank = mainEvent.blueCorner.rank || 'Unranked';

			embed.addFields({
				name: '👑 Main Event Breakdown',
				value: `**${redFighter}** (${redRank}) vs **${blueFighter}** (${blueRank})\n` +
					   `**Division:** ${mainEvent.weightClass || 'TBA'}\n` +
					   `**Stakes:** ${mainEvent.weightClass?.includes('Championship') || mainEvent.weightClass?.includes('Title') ? 'Title Fight' : 'Contender Fight'}`,
				inline: false
			});

			// Ranking Analysis
			const rankingAnalysis = analyzeRankings(redRank, blueRank);
			if (rankingAnalysis) {
				embed.addFields({
					name: '📊 Ranking Analysis',
					value: rankingAnalysis,
					inline: false
				});
			}
		}

		console.log('📋 Analyzing card...');
		
		// Card Depth Analysis
		const cardAnalysis = analyzeCard(eventData.fights);
		embed.addFields({
			name: '📋 Card Analysis',
			value: `**Total Fights:** ${totalFights}\n` +
				   `**Main Card Quality:** ${cardAnalysis.quality}\n` +
				   `**Championship Fights:** ${cardAnalysis.titleFights}\n` +
				   `**Ranked Matchups:** ${cardAnalysis.rankedFights}`,
			inline: false
		});

		// Key Matchups
		console.log('🔥 Identifying key matchups...');
		const keyMatchups = identifyKeyMatchups(eventData.fights);
		if (keyMatchups.length > 0) {
			embed.addFields({
				name: '🔥 Key Matchups to Watch',
				value: keyMatchups.join('\n'),
				inline: false
			});
		}

		embed.addFields({
			name: '💡 Analysis Notes',
			value: '• Rankings and analysis based on available UFC data\n' +
				   '• For detailed fighter stats, visit UFC.com\n' +
				   '• Betting odds available on licensed sportsbooks',
			inline: false
		});

		embed.setFooter({ text: 'Analysis based on fight card data • Always gamble responsibly' });

		console.log('📤 Sending analysis response...');
		await interaction.editReply({ embeds: [embed] });
		console.log('✅ Analysis response sent successfully');
		
	} catch (error) {
		console.error('❌ Error in handlePredictionsButton:', error);
		
		try {
			await interaction.editReply({
				content: '❌ An error occurred while generating the analysis. Please try again.',
				embeds: []
			});
		} catch (replyError) {
			console.error('❌ Failed to send error response:', replyError);
		}
	}
}

/**
 * Analyze fighter rankings
 */
function analyzeRankings(redRank, blueRank) {
	const extractRank = (rankString) => {
		if (!rankString || rankString === 'Unranked') return null;
		const match = rankString.match(/#?(\d+)/);
		return match ? parseInt(match[1]) : null;
	};

	const redNum = extractRank(redRank);
	const blueNum = extractRank(blueRank);

	if (redNum && blueNum) {
		const diff = Math.abs(redNum - blueNum);
		if (diff <= 2) {
			return `🔥 **Close ranking battle!** Both fighters ranked within 2 spots of each other`;
		} else if (diff <= 5) {
			return `⚡ **Competitive matchup** with rankings ${diff} spots apart`;
		} else {
			const higher = redNum < blueNum ? 'Red Corner' : 'Blue Corner';
			return `📈 **Ranking advantage** to ${higher} - significant difference in rankings`;
		}
	} else if (redNum || blueNum) {
		const rankedFighter = redNum ? 'Red Corner' : 'Blue Corner';
		return `🎯 **Ranked vs Unranked** - ${rankedFighter} has ranking advantage`;
	}

	return null;
}

/**
 * Analyze the overall card quality
 */
function analyzeCard(fights) {
	let titleFights = 0;
	let rankedFights = 0;

	fights.forEach(fight => {
		if (fight.weightClass?.includes('Championship') || fight.weightClass?.includes('Title')) {
			titleFights++;
		}
		
		if ((fight.redCorner?.rank && fight.redCorner.rank !== 'Unranked') || 
			(fight.blueCorner?.rank && fight.blueCorner.rank !== 'Unranked')) {
			rankedFights++;
		}
	});

	let quality = 'Standard';
	if (titleFights >= 2) quality = 'Exceptional';
	else if (titleFights >= 1 && rankedFights >= 3) quality = 'High Quality';
	else if (rankedFights >= 4) quality = 'Strong';

	return {
		quality,
		titleFights,
		rankedFights
	};
}

/**
 * Identify key matchups on the card
 */
function identifyKeyMatchups(fights) {
	const keyMatchups = [];
	
	fights.slice(0, 3).forEach((fight, index) => {
		if (!fight.redCorner || !fight.blueCorner) return;
		
		const redName = fight.redCorner.name || 'TBA';
		const blueName = fight.blueCorner.name || 'TBA';
		const redRank = fight.redCorner.rank || '';
		const blueRank = fight.blueCorner.rank || '';
		
		let significance = '';
		
		if (index === 0) {
			significance = '👑 Main Event';
		} else if (fight.weightClass?.includes('Championship') || fight.weightClass?.includes('Title')) {
			significance = '🏆 Title Fight';
		} else if (redRank && blueRank && redRank !== 'Unranked' && blueRank !== 'Unranked') {
			significance = '🔥 Ranked Battle';
		} else if ((redRank && redRank !== 'Unranked') || (blueRank && blueRank !== 'Unranked')) {
			significance = '⭐ Contender Fight';
		}
		
		if (significance) {
			keyMatchups.push(`${significance}: **${redName}** vs **${blueName}**`);
		}
	});
	
	return keyMatchups;
}

/**
 * Handle fight schedule/times button click
 */
async function handleScheduleButton(interaction, eventData) {
	const embed = new EmbedBuilder()
		.setColor('#4169e1')
		.setTitle('⏰ Fight Schedule & Times')
		.setDescription('**Event Timeline (Eastern Time)**')
		.addFields(
			{
				name: '🕕 Early Prelims',
				value: '**6:00 PM ET** - Fight Pass Exclusive\n3-4 fights featuring newer UFC talent',
				inline: false
			},
			{
				name: '🕘 Prelims',
				value: '**8:00 PM ET** - ESPN/ESPN+\n4-5 fights with established fighters',
				inline: false
			},
			{
				name: '🕙 Main Card',
				value: '**10:00 PM ET** - Pay-Per-View\n5 fights including the main event',
				inline: false
			},
			{
				name: '🌍 International Times',
				value: '• **UK**: Usually 3:00 AM GMT (Sunday)\n• **Australia**: Usually 2:00 PM AEDT (Sunday)\n• **Europe**: Usually 4:00 AM CET (Sunday)',
				inline: false
			}
		)
		.setFooter({ text: 'Times may vary • Check local listings' })
		.setTimestamp();

	await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle refresh data button click
 */
async function handleRefreshButton(interaction) {
	try {
		const ufcService = new UfcService();
		const event = await ufcService.getUpcomingEvent();

		if (!event) {
			const embed = new EmbedBuilder()
				.setColor('#ff0000')
				.setTitle('🔄 Refresh Complete')
				.setDescription('❌ No upcoming events found at this time.')
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('🔄 Data Refreshed Successfully')
			.setDescription(`✅ Latest information retrieved for **${event.title}**`)
			.addFields(
				{
					name: '📅 Event Date',
					value: event.date || 'TBA',
					inline: true
				},
				{
					name: '🥊 Fights',
					value: `${event.fights?.length || 0} fights`,
					inline: true
				},
				{
					name: '🕐 Last Updated',
					value: new Date().toLocaleString(),
					inline: true
				}
			)
			.setFooter({ text: 'Use /fight command to see the updated fight card' })
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	} catch (error) {
		console.error('Error refreshing fight data:', error);
		
		const embed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('🔄 Refresh Failed')
			.setDescription('❌ Unable to refresh fight data at this time. Please try again later.')
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	}
}

/**
 * Build fighter stats string
 */
function buildFighterStatsString(fighter) {
	if (!fighter || !fighter.name) {
		return '• **Status:** TBA\n• **Rank:** Unranked\n• **Details:** Coming Soon';
	}

	let stats = [];
	
	// Ranking
	stats.push(`• **Rank:** ${fighter.rank || 'Unranked'}`);
	
	// Record (if available)
	if (fighter.record) {
		stats.push(`• **Record:** ${fighter.record}`);
	}
	
	// Age (if available)
	if (fighter.age) {
		stats.push(`• **Age:** ${fighter.age}`);
	}
	
	// Height (if available)
	if (fighter.height) {
		stats.push(`• **Height:** ${fighter.height}`);
	}
	
	// Weight (if available)
	if (fighter.weight) {
		stats.push(`• **Weight:** ${fighter.weight}`);
	}
	
	// Reach (if available)
	if (fighter.reach) {
		stats.push(`• **Reach:** ${fighter.reach}`);
	}
	
	// Fighting Style (if available)
	if (fighter.fightingStyle) {
		stats.push(`• **Style:** ${fighter.fightingStyle}`);
	}
	
	// Country (if available)
	if (fighter.country) {
		stats.push(`• **Country:** ${fighter.country}`);
	}
	
	// If no additional stats, add basic info
	if (stats.length === 1) {
		stats.push('• **Status:** Active Fighter');
		stats.push('• **Details:** Visit UFC.com for full stats');
	}
	
	return stats.slice(0, 6).join('\n'); // Limit to 6 lines for formatting
}

/**
 * Analyze card statistics
 */
function analyzeCardStats(fights) {
	let rankedFighters = 0;
	let titleFights = 0;
	let totalFights = 0;
	
	fights.forEach(fight => {
		// Count title fights
		if (fight.weightClass?.includes('Championship') || fight.weightClass?.includes('Title')) {
			titleFights++;
		}
		
		// Count ranked fighters
		if ((fight.redCorner?.rank && fight.redCorner.rank !== 'Unranked') || 
			(fight.blueCorner?.rank && fight.blueCorner.rank !== 'Unranked')) {
			rankedFighters++;
		}
		
		// Estimate total UFC fights (rough estimate)
		totalFights += 5; // Average fights per fighter pair
	});
	
	return {
		rankedFighters: Math.floor(rankedFighters),
		titleFights,
		totalFights: Math.floor(totalFights)
	};
}

/**
 * Get top ranked fighters on the card
 */
function getTopRankedFighters(fights) {
	const rankedFighters = [];
	
	fights.forEach(fight => {
		if (fight.redCorner?.rank && fight.redCorner.rank !== 'Unranked') {
			rankedFighters.push({
				name: fight.redCorner.name,
				rank: fight.redCorner.rank,
				weightClass: fight.weightClass
			});
		}
		if (fight.blueCorner?.rank && fight.blueCorner.rank !== 'Unranked') {
			rankedFighters.push({
				name: fight.blueCorner.name,
				rank: fight.blueCorner.rank,
				weightClass: fight.weightClass
			});
		}
	});
	
	// Sort by rank (lower number = higher rank)
	rankedFighters.sort((a, b) => {
		const rankA = parseInt(a.rank.replace('#', '')) || 999;
		const rankB = parseInt(b.rank.replace('#', '')) || 999;
		return rankA - rankB;
	});
	
	return rankedFighters.map(fighter => 
		`${fighter.rank} **${fighter.name}** (${fighter.weightClass || 'TBA'})`
	);
}

/**
 * Get notable matchups from the card
 */
function getNotableMatchups(fights) {
	const notableMatchups = [];
	
	// Take first 3 fights (main card)
	fights.slice(0, 3).forEach(fight => {
		if (!fight.redCorner || !fight.blueCorner) return;
		
		const redName = fight.redCorner.name || 'TBA';
		const blueName = fight.blueCorner.name || 'TBA';
		const redRank = fight.redCorner.rank || '';
		const blueRank = fight.blueCorner.rank || '';
		
		// Highlight title fights and ranked matchups
		if (fight.weightClass?.includes('Championship') || fight.weightClass?.includes('Title')) {
			notableMatchups.push(`🏆 **${redName}** vs **${blueName}** (Title Fight)`);
		} else if (redRank !== 'Unranked' && blueRank !== 'Unranked') {
			notableMatchups.push(`🔥 **${redName}** (${redRank}) vs **${blueName}** (${blueRank})`);
		} else if ((redRank && redRank !== 'Unranked') || (blueRank && blueRank !== 'Unranked')) {
			notableMatchups.push(`⭐ **${redName}** vs **${blueName}** (Ranked Fighter)`);
		}
	});

	return notableMatchups;
}