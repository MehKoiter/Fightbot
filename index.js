// import fetchEvents from './fetchEvents.js';
// setting requirements for index.js to run
// GatewauIntentBits is the language used for discord.js to know what things to monitor
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js')
require('dotenv/config')

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessageTyping,

        ]
    })
// setting a consol log to tell us when the bot is ready
    client.on('ready',()=> {
        console.log('bot is ready')
    } )
// monitoring content on pages, to look for an input
//    client.on('messageCreate', message => {
//        if (message.content === '/fights'){
//           fetchEvents();
//            message.reply('https://www.ufc.com/events')
//        }
//    })
    module.exports = {
        data: new SlashCommandBuilder()
            .setName('fight')
            .setDescription('This weekends fight if there is one'),
        async execute(interaction) {
                await interaction.reply('https://www.ufc.com/events');
        },
    };
    client.login(process.env.TOKEN)

    async function fetchEvents(){
        console.log('fetchingEvents');
        const response = await fetch('https://www.ufc.com/events');
        //var data = await response.json();
        console.log(JSON.parse(JSON.stringify(response)));
    }