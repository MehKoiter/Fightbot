const { SlashCommandBuilder } = require('discord.js');

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('fight')
            .setDescription('This weekends fight if there is one'),
        async execute(interaction) {
                await interaction.reply('https://www.ufc.com/events');
        },
    };