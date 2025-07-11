import { Events, EmbedBuilder } from 'discord.js';
import FighterInteractionHandler from '../services/fighterInteractionHandler.js';

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
	try {
		// Add timeout protection for button interactions
		const buttonTimeout = setTimeout(async () => {
			if (!interaction.replied && !interaction.deferred) {
				try {
					await interaction.deferReply({ ephemeral: true });
					console.log(`✅ Emergency defer applied for button ${interaction.customId}`);
				} catch (deferError) {
					console.error(`❌ Failed to apply emergency defer for button:`, deferError.message);
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
			user: interaction.user.tag
		});
		
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
		console.error('Failed to send error response:', {
			error: responseError.message,
			interactionType: interaction.type,
			replied: interaction.replied,
			deferred: interaction.deferred
		});
	}
}

/**
 * Handle button interactions - all features are FREE!
 * @param {ButtonInteraction} interaction - The button interaction
 */
async function handleButtonInteraction(interaction) {
	const { customId } = interaction;
	
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
		const action = customId.split('_')[1];
		const eventId = customId.split('_')[2];
		
		await interaction.deferReply({ ephemeral: true });
		
		let embed;
		
		switch (action) {
			case 'details':
				embed = createSimpleInfoEmbed('📋 Full Card Details', `Loading complete fight card for UFC ${eventId}... All features are completely FREE!`);
				break;
			case 'stats':
				embed = createSimpleInfoEmbed('📊 Event Statistics', `Loading detailed event stats for UFC ${eventId}... All features are completely FREE!`);
				break;
			case 'upcoming':
				embed = createSimpleInfoEmbed('⏭️ Upcoming Events', 'Loading upcoming UFC events... All features are completely FREE!');
				break;
			default:
				embed = createSimpleInfoEmbed('❌ Unknown Action', 'This button action is not recognized.');
		}
		
		await interaction.editReply({ embeds: [embed] });
	}
	// Existing fight button interactions
	else if (customId.startsWith('fight_')) {
		const action = customId.split('_')[1];
		
		await interaction.deferReply({ ephemeral: true });
		
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
	} else {
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
