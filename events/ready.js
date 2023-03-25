import { Events } from 'discord.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute: (client) => {
		console.log(`Ready! Logged in as ${client.user.tag}`)

		client.user.setActivity(`Type /fbhelp for more info`, { type: "WATCHING"})

	},
};