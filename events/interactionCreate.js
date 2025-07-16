
import { Events, EmbedBuilder } from 'discord.js';
import FighterInteractionHandler from '../services/fighterInteractionHandler.js';
import SportsDataMMAService from '../services/sportsDataMMAService.js';
import WikipediaUFCService from '../services/wikipediaUFCService.js';
import { VERSION_CONFIG } from '../config/version.js';
import { errorHandler, asyncErrorHandler } from '../utils/errorHandler.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';

// Initialize fighter interaction handler with error handling
let fighterHandler;
try {
    fighterHandler = new FighterInteractionHandler();
} catch (error) {
    console.error('❌ Failed to initialize fighter interaction handler:', error);
    fighterHandler = null;
}

// Performance monitoring for interactions
const interactionMetrics = {
    totalInteractions: 0,
    commandInteractions: 0,
    buttonInteractions: 0,
    autocompleteInteractions: 0,
    errors: 0,
    averageResponseTime: 0
};

/**
 * Log interaction performance metrics
 * @param {string} type - Type of interaction
 * @param {number} responseTime - Response time in milliseconds
 * @param {boolean} wasError - Whether an error occurred
 */
function logInteractionMetrics(type, responseTime, wasError = false) {
    interactionMetrics.totalInteractions++;
    
    if (type === 'command') interactionMetrics.commandInteractions++;
    else if (type === 'button') interactionMetrics.buttonInteractions++;
    else if (type === 'autocomplete') interactionMetrics.autocompleteInteractions++;
    
    if (wasError) interactionMetrics.errors++;
    
    // Update average response time (simple moving average)
    interactionMetrics.averageResponseTime = 
        (interactionMetrics.averageResponseTime * (interactionMetrics.totalInteractions - 1) + responseTime) / 
        interactionMetrics.totalInteractions;
        
    // Log slow interactions
    if (responseTime > 5000) {
        console.warn(`🐌 Slow ${type} interaction: ${responseTime}ms`);
    }
}

export default {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		const startTime = Date.now();
		let interactionType = 'unknown';
		
		try {
			// Handle slash commands
			if (interaction.isChatInputCommand()) {
				interactionType = 'command';
				await handleSlashCommand(interaction);
			}
			// Handle autocomplete interactions
			else if (interaction.isAutocomplete()) {
				interactionType = 'autocomplete';
				await handleAutocomplete(interaction);
			}
			// Handle button interactions
			else if (interaction.isButton()) {
				interactionType = 'button';
				await handleButton(interaction);
			}
			
			// Log successful interaction
			const responseTime = Date.now() - startTime;
			logInteractionMetrics(interactionType, responseTime, false);
			
		} catch (error) {
			// Log failed interaction
			const responseTime = Date.now() - startTime;
			logInteractionMetrics(interactionType, responseTime, true);
			
			console.error(`❌ Unhandled interaction error (${interactionType}):`, {
				error: error.message,
				user: interaction.user?.tag,
				guild: interaction.guildId,
				responseTime
			});
		}
	},
};

/**
 * Handle slash command interactions with improved error handling
 * @param {ChatInputCommandInteraction} interaction - The command interaction
 */
async function handleSlashCommand(interaction) {
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`❌ No command matching ${interaction.commandName} was found.`);
		await interaction.reply({ 
			content: '❌ Command not found. Please try again or contact support.',
			ephemeral: true 
		});
		return;
	}

	try {
		// Set up timeout protection for the entire command execution
		const commandTimeout = setTimeout(async () => {
			console.warn(`⚠️ Command ${interaction.commandName} is taking longer than expected...`);
			
			// If the interaction hasn't been deferred or replied to, defer it
			if (!interaction.replied && !interaction.deferred) {
				try {
					await interaction.deferReply();
					console.log(`✅ Emergency defer applied for ${interaction.commandName}`);
				} catch (deferError) {
					console.error(`❌ Failed to apply emergency defer:`, deferError.message);
				}
			}
		}, 2500); // Emergency defer at 2.5 seconds

		// Track command usage for analytics (no personal data) - fire and forget
		setImmediate(() => {
			if (interaction.client.userDB) {
				interaction.client.userDB.logCommandUsage(interaction.commandName, interaction.guildId)
					.catch(err => console.error('Background analytics tracking error:', err.message));
			}
		});
		
		// Execute command with race condition against timeout
		const commandPromise = command.execute(interaction);
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Command execution timeout')), 12000) // 12 second total timeout
		);
		
		await Promise.race([commandPromise, timeoutPromise]);
		clearTimeout(commandTimeout);
		
	} catch (error) {
		console.error(`❌ Error executing ${interaction.commandName}:`, {
			message: error.message,
			user: interaction.user.tag,
			guild: interaction.guildId
		});
		
		// Enhanced error response with better user feedback
		const isTimeout = error.message.includes('timeout');
		const errorMessage = { 
			content: isTimeout 
				? '⏱️ The command is taking longer than expected. Please try again in a moment.'
				: '❌ There was an error while executing this command! Please try again.',
			ephemeral: true 
		};
		
		await sendErrorResponse(interaction, errorMessage);
	}
}

/**
 * Handle autocomplete interactions with improved error handling
 * @param {AutocompleteInteraction} interaction - The autocomplete interaction
 */
async function handleAutocomplete(interaction) {
	try {
		const command = interaction.client.commands.get(interaction.commandName);
		
		if (!command) {
			console.error(`❌ No command matching ${interaction.commandName} was found for autocomplete.`);
			return;
		}

		if (command.autocomplete) {
			// Set up timeout protection for autocomplete
			const autocompleteTimeout = setTimeout(() => {
				console.warn(`⚠️ Autocomplete for ${interaction.commandName} is taking too long...`);
			}, 1500); // Autocomplete should be faster than commands
			
			await command.autocomplete(interaction);
			clearTimeout(autocompleteTimeout);
		}
	} catch (error) {
		console.error(`❌ Error handling autocomplete for ${interaction.commandName}:`, {
			message: error.message,
			user: interaction.user.tag
		});
		
		// Try to send empty response if we haven't responded yet
		await sendErrorResponse(interaction, []);
	}
}

/**
 * Handle button interactions with improved error handling
 * @param {ButtonInteraction} interaction - The button interaction
 */
async function handleButton(interaction) {
	let emergencyDeferApplied = false;
	
	try {
		// Add timeout protection for button interactions
		const buttonTimeout = setTimeout(async () => {
			if (!interaction.replied && !interaction.deferred && !emergencyDeferApplied) {
				try {
					await interaction.deferReply({ ephemeral: true });
					emergencyDeferApplied = true;
					console.log(`✅ Emergency defer applied for button ${interaction.customId}`);
				} catch (deferError) {
					// Don't log errors for expired interactions as these are common
					if (deferError.code === 10062 || deferError.message.includes('Unknown interaction')) {
						console.log(`⚠️ Emergency defer skipped - interaction ${interaction.customId} has expired`);
					} else {
						console.error(`❌ Failed to apply emergency defer for button:`, deferError.message);
					}
				}
			}
		}, 2500);

		const buttonPromise = handleButtonInteraction(interaction);
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Button interaction timeout')), 10000)
		);
		
		await Promise.race([buttonPromise, timeoutPromise]);
		clearTimeout(buttonTimeout);
		
	} catch (error) {
		console.error('Button interaction error:', {
			message: error.message,
			customId: interaction.customId,
			user: interaction.user.tag,
			errorCode: error.code,
			isDiscordAPIError: error.code === 10062 || error.message.includes('Unknown interaction')
		});
		
		// Don't try to respond if this is a Discord "Unknown interaction" error
		// This usually means the interaction has already expired or been acknowledged
		if (error.code === 10062 || error.message.includes('Unknown interaction')) {
			console.log(`⚠️ Interaction ${interaction.customId} has expired or already been acknowledged - skipping error response`);
			return;
		}
		
		const isTimeout = error.message.includes('timeout');
		const errorMessage = { 
			content: isTimeout 
				? '⏱️ The button action is taking longer than expected. Please try again.'
				: '❌ There was an error processing your request.', 
			ephemeral: true 
		};
		
		await sendErrorResponse(interaction, errorMessage);
	}
}

/**
 * Safely send error responses with improved error handling
 * @param {Interaction} interaction - The Discord interaction
 * @param {Object|Array} response - The response to send
 */
async function sendErrorResponse(interaction, response) {
	try {
		// Check if interaction is still valid before attempting to respond
		if (interaction.isAutocomplete()) {
			// For autocomplete, response should be an array
			if (!interaction.responded) {
				await interaction.respond(Array.isArray(response) ? response : []);
			}
		} else {
			// For other interactions, response should be a message object
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply(response);
			} else if (interaction.deferred) {
				await interaction.editReply(response);
			} else {
				await interaction.followUp(response);
			}
		}
	} catch (responseError) {
		// Don't log errors for expired interactions as these are expected in some cases
		if (responseError.code === 10062 || responseError.message.includes('Unknown interaction')) {
			console.log(`⚠️ Cannot send error response - interaction has expired or been acknowledged`);
		} else {
			console.error('Failed to send error response:', {
				error: responseError.message,
				interactionType: interaction.type,
				replied: interaction.replied,
				deferred: interaction.deferred
			});
		}
	}
}

/**
 * Handle button interactions - all features are FREE!
 * @param {ButtonInteraction} interaction - The button interaction
 */
async function handleButtonInteraction(interaction) {
	const { customId } = interaction;
	
	console.log(`🔍 Processing button interaction: ${customId} by ${interaction.user.tag}`);
	console.log(`🔍 Interaction state - Replied: ${interaction.replied}, Deferred: ${interaction.deferred}, Acknowledged: ${interaction.replied || interaction.deferred}`);
	
	// Fighter-related button interactions (Phase 7)
	if (customId.startsWith('fighter_') || customId.startsWith('comparison_')) {
		if (fighterHandler) {
			return await fighterHandler.handleFighterInteraction(interaction);
		} else {
			throw new Error('Fighter handler not available');
		}
	}
	
	// UFC command button interactions
	if (customId.startsWith('ufc_')) {
		const parts = customId.split('_');
		const action = parts[1];
		const dataSource = parts[2]; // 'sports', 'wiki', or undefined for backwards compatibility
		const eventId = parts[3] || parts[2]; // New format uses parts[3], old format uses parts[2]
		
		console.log(`🔍 UFC button - Action: ${action}, DataSource: ${dataSource || 'legacy'}, EventId: ${eventId || 'N/A'}`);
		
		// Check if interaction is already deferred before attempting to defer
		if (!interaction.deferred && !interaction.replied) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (deferError) {
				// If defer fails with Unknown interaction, the interaction has expired
				if (deferError.code === 10062 || deferError.message.includes('Unknown interaction')) {
					throw new Error('Unknown interaction');
				}
				throw deferError;
			}
		}
		
		let embed;
		
		try {
			switch (action) {
				case 'details':
					if (!eventId) {
						embed = createSimpleInfoEmbed('❌ Missing Event ID', 'Event details require a valid event ID.');
					} else {
						embed = await createUFCDetailsEmbed(eventId, dataSource);
					}
					break;
				case 'stats':
					if (!eventId) {
						embed = createSimpleInfoEmbed('❌ Missing Event ID', 'Event statistics require a valid event ID.');
					} else {
						console.log(`📊 Creating stats embed for event ${eventId} from ${dataSource || 'auto-detect'}`);
						embed = await createUFCStatsEmbed(eventId, dataSource);
					}
					break;
				case 'upcoming':
					embed = await createUpcomingEventsEmbed();
					break;
				default:
					embed = createSimpleInfoEmbed('❌ Unknown Action', 'This button action is not recognized.');
			}
			
			await interaction.editReply({ embeds: [embed] });
		} catch (embedError) {
			console.error(`❌ Error creating embed for action ${action}:`, embedError);
			const errorEmbed = createSimpleInfoEmbed(
				'❌ Error Loading Content',
				'Sorry, there was an error loading the requested information. Please try again later.'
			);
			await interaction.editReply({ embeds: [errorEmbed] });
		}
		return; // Important: Return here to prevent fall-through
	}
	// Existing fight button interactions
	else if (customId.startsWith('fight_')) {
		const action = customId.split('_')[1];
		
		// Check if interaction is already deferred before attempting to defer
		if (!interaction.deferred && !interaction.replied) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (deferError) {
				// If defer fails with Unknown interaction, the interaction has expired
				if (deferError.code === 10062 || deferError.message.includes('Unknown interaction')) {
					throw new Error('Unknown interaction');
				}
				throw deferError;
			}
		}
		
		let embed;
		
		switch (action) {
			case 'prelims':
				embed = createSimpleInfoEmbed('📺 Preliminary Card', 'Feature coming soon! All features are completely FREE.');
				break;
			case 'stats':
				embed = createSimpleInfoEmbed('📊 Fighter Stats', 'Detailed fighter statistics coming soon! All features are completely FREE.');
				break;
			case 'refresh':
				embed = createSimpleInfoEmbed('🔄 Data Refreshed', 'Fight data has been refreshed! All features are completely FREE.');
				break;
			default:
				embed = createSimpleInfoEmbed('❌ Unknown Action', 'This button action is not recognized.');
		}
		
		await interaction.editReply({ embeds: [embed] });
		return; // Important: Return here to prevent fall-through
	} else {
		console.error(`❌ Unknown button interaction received:`, {
			customId: customId,
			user: interaction.user.tag,
			guildId: interaction.guildId,
			timestamp: new Date().toISOString()
		});
		throw new Error(`Unknown button interaction: ${customId}`);
	}
}

/**
 * Create a simple info embed with consistent styling
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} The created embed
 */
function createSimpleInfoEmbed(title, description) {
	return new EmbedBuilder()
		.setColor('#00ff00')
		.setTitle(title)
		.setDescription(description)
		.setFooter({ text: 'FightBot - All Features FREE Forever! ❤️' })
		.setTimestamp();
}

/**
 * Create detailed UFC event embed with complete fight card
 * @param {string} eventId - UFC event ID or number
 * @returns {EmbedBuilder} The created embed with full details
 */
async function createUFCDetailsEmbed(eventId, dataSource = null) {
	try {
		// Try to get detailed event data using the specified data source
		const sportsDataService = new SportsDataMMAService();
		const wikipediaService = new WikipediaUFCService();
		
		let eventDetails = null;
		let actualDataSource = 'Unknown';
		
		// Use the specified data source if available
		if (dataSource === 'sports' && eventId && !isNaN(eventId)) {
			try {
				eventDetails = await sportsDataService.getEventDetails(eventId);
				if (eventDetails) {
					actualDataSource = 'SportsData.io';
				}
			} catch (error) {
				console.log(`SportsData.io failed for event ${eventId}, trying alternative...`);
			}
		} else if (dataSource === 'wiki') {
			try {
				eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
				if (eventDetails) {
					actualDataSource = 'Wikipedia';
				}
			} catch (error) {
				console.log(`Wikipedia failed for UFC ${eventId}`);
			}
		} else {
			// Legacy behavior - try SportsData.io first if we have a numeric event ID
			if (eventId && !isNaN(eventId)) {
				try {
					eventDetails = await sportsDataService.getEventDetails(eventId);
					if (eventDetails) {
						actualDataSource = 'SportsData.io';
					}
				} catch (error) {
					console.log(`SportsData.io failed for event ${eventId}, trying alternative...`);
				}
			}
			
			// If SportsData failed or we have a UFC number, try Wikipedia
			if (!eventDetails) {
				try {
					eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
					if (eventDetails) {
						actualDataSource = 'Wikipedia';
					}
				} catch (error) {
					console.log(`Wikipedia failed for UFC ${eventId}`);
				}
			}
		}
		
		if (!eventDetails) {
			return createSimpleInfoEmbed(
				'❌ Details Not Available', 
				`Sorry, I couldn't load detailed information for UFC ${eventId}. The event may be too old or not yet available in our database.`
			);
		}
		
		const embed = new EmbedBuilder()
			.setColor('#ff6600')
			.setTitle(`📋 ${eventDetails.title || eventDetails.Name || `UFC ${eventId}`} - Full Card Details`)
			.setDescription(eventDetails.description || eventDetails.ShortName || 'Complete fight card information');
		
		// Add all available fights
		const fights = eventDetails.fights || eventDetails.Fights || [];
		if (fights.length > 0) {
			let fightsList = '';
			
			if (actualDataSource === 'Wikipedia') {
				fightsList = fights.map((fight, index) => {
					if (fight.fighters && fight.fighters.length >= 2) {
						const emoji = index === 0 ? '👑' : index < 5 ? '🥊' : '⚔️';
						let fightText = '';
						
						// Check if we have winner information
						if (fight.result === 'win' || fight.winner) {
							// If there's a winner, format as "Winner def. Loser"
							const winner = fight.winner || fight.fighters[0].name;
							const loser = fight.fighters.find(f => f.name !== winner)?.name || fight.fighters[1].name;
							fightText = `${emoji} **${winner}** def. ${loser}`;
							
							// Add method if available
							if (fight.method) {
								fightText += ` (${fight.method})`;
							} else if (fight.winMethod) {
								fightText += ` (${fight.winMethod})`;
							}
						} else {
							// No winner info, show traditional vs format
							fightText = `${emoji} **${fight.fighters[0].name}** vs **${fight.fighters[1].name}**`;
						}
						
						// Add weight class
						if (fight.weightClass) {
							fightText += ` - ${fight.weightClass}`;
						}
						
						return fightText;
					} else if (fight.rawText) {
						const emoji = index === 0 ? '👑' : index < 5 ? '🥊' : '⚔️';
						
						// Try to parse winner from rawText (def. format)
						if (fight.rawText.includes(' def. ') || fight.rawText.includes(' defeated ')) {
							return `${emoji} ${fight.rawText}`;
						} else {
							return `${emoji} ${fight.rawText}`;
						}
					}
					return null;
				}).filter(Boolean).join('\n');
			} else {
				// SportsData format
				const sortedFights = fights.sort((a, b) => (b.Order || 0) - (a.Order || 0));
				fightsList = sortedFights.map((fight, index) => {
					const fighter1 = fight.Fighters?.[0];
					const fighter2 = fight.Fighters?.[1];
					
					if (fighter1 && fighter2) {
						const emoji = index === 0 ? '👑' : index < 5 ? '🥊' : '⚔️';
						const name1 = `${fighter1.FirstName} ${fighter1.LastName}`;
						const name2 = `${fighter2.FirstName} ${fighter2.LastName}`;
						let fightText = '';
						
						// Check for winner information in SportsData format
						if (fight.Status === 'Final' || fighter1.Winner !== undefined || fighter2.Winner !== undefined) {
							let winner, loser;
							
							// Determine winner/loser from Winner boolean
							if (fighter1.Winner === true) {
								winner = name1;
								loser = name2;
							} else if (fighter2.Winner === true) {
								winner = name2;
								loser = name1;
							} else if (fight.WinnerId) {
								// Fallback to WinnerId
								if (fight.WinnerId === fighter1.FighterId) {
									winner = name1;
									loser = name2;
								} else if (fight.WinnerId === fighter2.FighterId) {
									winner = name2;
									loser = name1;
								}
							}
							
							if (winner && loser) {
								fightText = `${emoji} **${winner}** def. ${loser}`;
								
								// Add method if available and not "Scrambled"
								if (fight.ResultType && fight.ResultType !== 'Scrambled') {
									fightText += ` (${fight.ResultType})`;
								}
								
								// Add round info if available
								if (fight.ResultRound && fight.ResultRound !== 'Scrambled') {
									fightText += ` R${fight.ResultRound}`;
								}
							} else if (fight.Status === 'Final' && fight.ResultType && fight.ResultType.toLowerCase().includes('draw')) {
								// Handle draws
								fightText = `${emoji} **${name1}** vs **${name2}** (Draw)`;
							} else {
								// Fallback to vs format
								fightText = `${emoji} **${name1}** vs **${name2}**`;
							}
						} else {
							// No winner info or fight not completed, show traditional vs format
							fightText = `${emoji} **${name1}** vs **${name2}**`;
						}
						
						// Add weight class if available and not scrambled
						if (fight.WeightClass && fight.WeightClass !== 'Scrambled') {
							fightText += ` - ${fight.WeightClass}`;
						}
						
						return fightText;
					}
					return null;
				}).filter(Boolean).join('\n');
			}
			
			// Split into chunks if too long for Discord
			const chunks = [];
			let currentChunk = '';
			const lines = fightsList.split('\n');
			
			for (const line of lines) {
				if ((currentChunk + line + '\n').length > 1024) {
					if (currentChunk) chunks.push(currentChunk.trim());
					currentChunk = line + '\n';
				} else {
					currentChunk += line + '\n';
				}
			}
			if (currentChunk) chunks.push(currentChunk.trim());
			
			// Add fields for each chunk
			chunks.forEach((chunk, index) => {
				embed.addFields({
					name: index === 0 ? `🥊 Complete Fight Card & Results (${fights.length} fights)` : '‎', // Zero-width space for continuation
					value: chunk,
					inline: false
				});
			});
		} else {
			embed.addFields({
				name: '🥊 Fight Card',
				value: 'Fight card details not available for this event.',
				inline: false
			});
		}
		
		// Add event info if available
		const eventDate = eventDetails.dateTime || eventDetails.DateTime || eventDetails.date;
		if (eventDate) {
			const parsedDate = new Date(eventDate);
			if (!isNaN(parsedDate.getTime())) {
				embed.addFields({
					name: '📅 Event Date',
					value: parsedDate.toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					}),
					inline: true
				});
			}
		}
		
		const location = eventDetails.location || eventDetails.venue || 
			(eventDetails.City && eventDetails.Country ? `${eventDetails.City}, ${eventDetails.Country}` : null);
		if (location) {
			embed.addFields({
				name: '📍 Location',
				value: location,
				inline: true
			});
		}
		
		embed.setFooter({ 
			text: `${VERSION_CONFIG.BOT_NAME} v${VERSION_CONFIG.VERSION} • Data from ${actualDataSource} • All Features FREE!` 
		});
		embed.setTimestamp();
		
		return embed;
		
	} catch (error) {
		console.error('Error creating UFC details embed:', error);
		return createSimpleInfoEmbed(
			'❌ Error Loading Details', 
			'Sorry, there was an error loading the detailed fight card information. Please try again later.'
		);
	}
}

/**
 * Create UFC event statistics embed
 * @param {string} eventId - UFC event ID or number
 * @param {string} dataSource - Data source hint ('sports', 'wiki', or null for auto-detect)
 * @returns {EmbedBuilder} The created embed with event stats
 */
async function createUFCStatsEmbed(eventId, dataSource = null) {
	try {
		const sportsDataService = new SportsDataMMAService();
		const wikipediaService = new WikipediaUFCService();
		
		let eventDetails = null;
		let actualDataSource = 'Unknown';
		
		// Use the specified data source if available
		if (dataSource === 'sports' && eventId && !isNaN(eventId)) {
			try {
				eventDetails = await sportsDataService.getEventDetails(eventId);
				if (eventDetails) {
					actualDataSource = 'SportsData.io';
				}
			} catch (error) {
				console.log(`SportsData.io failed for event ${eventId}, trying Wikipedia...`);
			}
		} else if (dataSource === 'wiki') {
			try {
				eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
				if (eventDetails) {
					actualDataSource = 'Wikipedia';
				}
			} catch (error) {
				console.log(`Wikipedia failed for UFC ${eventId}`);
			}
		} else {
			// Legacy behavior - try to get event data
			if (eventId && !isNaN(eventId)) {
				try {
					eventDetails = await sportsDataService.getEventDetails(eventId);
					if (eventDetails) {
						actualDataSource = 'SportsData.io';
					}
				} catch (error) {
					console.log(`SportsData.io failed for event ${eventId}, trying Wikipedia...`);
				}
			}
			
			if (!eventDetails) {
				try {
					eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
					if (eventDetails) {
						actualDataSource = 'Wikipedia';
					}
				} catch (error) {
					console.log(`Wikipedia failed for UFC ${eventId}`);
				}
			}
		}
		
		if (!eventDetails) {
			return createSimpleInfoEmbed(
				'❌ Statistics Not Available', 
				`Sorry, I couldn't load statistics for UFC ${eventId}. The event may be too old or not yet available in our database.`
			);
		}
		
		const embed = new EmbedBuilder()
			.setColor('#ff6600')
			.setTitle(`📊 ${eventDetails.title || eventDetails.Name || `UFC ${eventId}`} - Event Statistics`)
			.setDescription('Detailed event statistics and information');
		
		const fights = eventDetails.fights || eventDetails.Fights || [];
		
		// Basic event stats
		embed.addFields({
			name: '📊 Fight Statistics',
			value: `**Total Fights:** ${fights.length}\n**Event Number:** UFC ${eventId}`,
			inline: true
		});
		
		// Date and venue info
		const eventDate = eventDetails.dateTime || eventDetails.DateTime || eventDetails.date;
		if (eventDate) {
			const parsedDate = new Date(eventDate);
			if (!isNaN(parsedDate.getTime())) {
				embed.addFields({
					name: '📅 Event Details',
					value: `**Date:** ${parsedDate.toLocaleDateString('en-US', { 
						weekday: 'long', 
						year: 'numeric', 
						month: 'long', 
						day: 'numeric' 
					})}`,
					inline: true
				});
			}
		}
		
		const location = eventDetails.location || eventDetails.venue || 
			(eventDetails.City && eventDetails.Country ? `${eventDetails.City}, ${eventDetails.Country}` : null);
		if (location) {
			embed.addFields({
				name: '📍 Venue Information',
				value: `**Location:** ${location}`,
				inline: false
			});
		}
		
		// Fight breakdown by card
		if (fights.length > 0) {
			let mainCardCount = 0;
			let prelimsCount = 0;
			let earlyPrelimsCount = 0;
			
			if (dataSource === 'SportsData.io') {
				fights.forEach(fight => {
					if (fight.Card === 'Main' || (fight.Order && fight.Order <= 5)) {
						mainCardCount++;
					} else if (fight.Card === 'Preliminary') {
						prelimsCount++;
					} else {
						earlyPrelimsCount++;
					}
				});
			} else {
				// For Wikipedia data, estimate based on fight order
				mainCardCount = Math.min(5, fights.length);
				prelimsCount = Math.max(0, fights.length - 5);
			}
			
			embed.addFields({
				name: '🎭 Card Breakdown',
				value: `**Main Card:** ${mainCardCount} fights\n**Preliminary Card:** ${prelimsCount} fights${earlyPrelimsCount > 0 ? `\n**Early Prelims:** ${earlyPrelimsCount} fights` : ''}`,
				inline: false
			});
		}
		
		// Status information
		if (eventDetails.Status) {
			embed.addFields({
				name: '📈 Event Status',
				value: `**Status:** ${eventDetails.Status}`,
				inline: true
			});
		}
		
		embed.setFooter({ 
			text: `${VERSION_CONFIG.BOT_NAME} v${VERSION_CONFIG.VERSION} • Data from ${actualDataSource} • All Features FREE!` 
		});
		embed.setTimestamp();
		
		return embed;
		
	} catch (error) {
		console.error('Error creating UFC stats embed:', error);
		return createSimpleInfoEmbed(
			'❌ Error Loading Statistics', 
			'Sorry, there was an error loading the event statistics. Please try again later.'
		);
	}
}

/**
 * Create upcoming UFC events embed
 * @returns {EmbedBuilder} The created embed with upcoming events
 */
async function createUpcomingEventsEmbed() {
	try {
		const sportsDataService = new SportsDataMMAService();
		
		// Get upcoming events
		const currentYear = new Date().getFullYear().toString();
		const schedule = await sportsDataService.getUFCSchedule(currentYear);
		
		if (!schedule || schedule.length === 0) {
			return createSimpleInfoEmbed(
				'❌ No Upcoming Events', 
				'Sorry, I couldn\'t find any upcoming UFC events in our database. Please try again later.'
			);
		}
		
		// Filter for upcoming events
		const now = new Date();
		const upcomingEvents = schedule.filter(event => {
			const eventDate = new Date(event.DateTime);
			return eventDate > now;
		}).sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));
		
		if (upcomingEvents.length === 0) {
			return createSimpleInfoEmbed(
				'📅 No Upcoming Events', 
				'There are currently no upcoming UFC events scheduled in our database. Check back later for updates!'
			);
		}
		
		const embed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('⏭️ Upcoming UFC Events')
			.setDescription(`Here are the next ${Math.min(upcomingEvents.length, 5)} upcoming UFC events:`);
		
		// Show next 5 upcoming events
		const eventsToShow = upcomingEvents.slice(0, 5);
		let eventsText = '';
		
		eventsToShow.forEach((event, index) => {
			const eventDate = new Date(event.DateTime);
			const dateStr = eventDate.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
			
			const eventName = event.Name || event.ShortName || `UFC Event`;
			const location = event.City && event.Country ? `${event.City}, ${event.Country}` : 'TBA';
			
			eventsText += `**${index + 1}.** ${eventName}\n`;
			eventsText += `📅 ${dateStr}\n`;
			eventsText += `📍 ${location}\n\n`;
		});
		
		embed.addFields({
			name: '🗓️ Upcoming Events',
			value: eventsText.trim(),
			inline: false
		});
		
		// Add next event highlight
		const nextEvent = upcomingEvents[0];
		const nextEventDate = new Date(nextEvent.DateTime);
		const daysUntil = Math.ceil((nextEventDate - now) / (1000 * 60 * 60 * 24));
		
		embed.addFields({
			name: '🎯 Next Event',
			value: `**${nextEvent.Name || 'UFC Event'}**\n📅 In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
			inline: true
		});
		
		embed.addFields({
			name: '💡 Tip',
			value: 'Use `/ufc [number]` to get detailed information about a specific event!',
			inline: false
		});
		
		embed.setFooter({ 
			text: `${VERSION_CONFIG.BOT_NAME} v${VERSION_CONFIG.VERSION} • Data from SportsData.io • All Features FREE!` 
		});
		embed.setTimestamp();
		
		return embed;
		
	} catch (error) {
		console.error('Error creating upcoming events embed:', error);
		return createSimpleInfoEmbed(
			'❌ Error Loading Events', 
			'Sorry, there was an error loading upcoming UFC events. Please try again later.'
		);
	}
}
