import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Ask fightbot for some command help.'), 
    execute: async (interaction) => {
        await interaction.reply('Type / and click on the mma glove icon to see a list of commands.')
    },
};
