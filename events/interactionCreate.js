import { Events, EmbedBuilder } from 'discord.js';
import FighterInteractionHandler from '../services/fighterInteractionHandler.js';

// Initialize fighter interaction handler
const fighterHandler = new FighterInteractionHandler();

export default {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		// Handle slash commands
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`❌ No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				// Set up a timeout protection for the entire command execution
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
						interaction.client.userDB.logCommandUsage(interaction.commandName, interaction.guildId).catch(err => {
							console.error('Background analytics tracking error:', err);
						});
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
				console.error(`❌ Error executing ${interaction.commandName}:`, error.message);
				
				// Enhanced error response with better user feedback
				const isTimeout = error.message.includes('timeout');
				const errorMessage = { 
					content: isTimeout 
						? '⏱️ The command is taking longer than expected. Please try again in a moment.'
						: '❌ There was an error while executing this command! Please try again.',
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

		// Handle autocomplete interactions
		if (interaction.isAutocomplete()) {
			try {
				const command = interaction.client.commands.get(interaction.commandName);
				
				if (!command) {
					console.error(`❌ No command matching ${interaction.commandName} was found for autocomplete.`);
					return;
				}

				if (command.autocomplete) {
					await command.autocomplete(interaction);
				}
			} catch (error) {
				console.error(`❌ Error handling autocomplete for ${interaction.commandName}:`, error.message);
			}
		}

		// Handle button interactions
		if (interaction.isButton()) {
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
				console.error('Button interaction error:', error);
				
				const isTimeout = error.message.includes('timeout');
				const errorMessage = { 
					content: isTimeout 
						? '⏱️ The button action is taking longer than expected. Please try again.'
						: '❌ There was an error processing your request.', 
					ephemeral: true 
				};
				
				try {
					if (!interaction.replied && !interaction.deferred) {
						await interaction.reply(errorMessage);
					} else if (interaction.deferred) {
						await interaction.editReply(errorMessage);
					} else {
						await interaction.followUp(errorMessage);
					}
				} catch (replyError) {
					console.error('Failed to send button error response:', replyError.message);
				}
			}
		}
	},
};

/**
 * Handle button interactions - all features are FREE!
 */
async function handleButtonInteraction(interaction) {
	const { customId } = interaction;
	
	// Fighter-related button interactions (Phase 7)
	if (customId.startsWith('fighter_') || customId.startsWith('comparison_')) {
		return await fighterHandler.handleFighterInteraction(interaction);
	}
	
	// Existing fight button interactions
	if (customId.startsWith('fight_')) {
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
	}
}

/**
 * Create a simple info embed
 */
function createSimpleInfoEmbed(title, description) {
	return new EmbedBuilder()
		.setColor('#00ff00')
		.setTitle(title)
		.setDescription(description)
		.setFooter({ text: 'FightBot - All Features FREE Forever! ❤️' })
		.setTimestamp();
}
