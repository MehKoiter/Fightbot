import { Events, EmbedBuilder } from 'discord.js';

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
				// Track command usage for analytics (no personal data) - fire and forget
				setImmediate(() => {
					if (interaction.client.userDB) {
						interaction.client.userDB.logCommandUsage(interaction.commandName, interaction.guildId).catch(err => {
							console.error('Background analytics tracking error:', err);
						});
					}
				});
				
				// Execute command immediately without waiting for analytics
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
		if (interaction.isButton()) {
			try {
				await handleButtonInteraction(interaction);
			} catch (error) {
				console.error('Button interaction error:', error);
				
				try {
					if (!interaction.replied && !interaction.deferred) {
						await interaction.reply({ 
							content: '❌ There was an error processing your request.', 
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
 * Handle button interactions - all features are FREE!
 */
async function handleButtonInteraction(interaction) {
	const { customId } = interaction;
	
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
