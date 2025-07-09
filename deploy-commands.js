import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from './config.js';
import fs from 'node:fs';
import path from 'node:path';

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = await import(`./commands/${file}`);
	commands.push(command.default.data);
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Check if global deployment is requested
		const isGlobal = process.argv.includes('--global');
		
		let data;
		if (isGlobal) {
			console.log('🌍 Deploying commands globally...');
			// Deploy globally (takes up to 1 hour to propagate)
			data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
		} else {
			console.log(`🏠 Deploying commands to guild ${guildId}...`);
			// Deploy to specific guild (instant)
			data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			);
		}

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();