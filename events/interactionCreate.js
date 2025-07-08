import { Events } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		if (!interaction.isChatInputCommand()) return;

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
	},
};