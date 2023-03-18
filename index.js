// import fetchEvents from './fetchEvents.js';
const { Client, GatewayIntentBits } = require('discord.js')
require('dotenv/config')

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    })

    client.on('ready',()=> {
        console.log('bot is ready')
    } )
    client.on('messageCreate', message => {
        if (message.content === '/fights'){
            fetchEvents();
            message.reply('https://www.ufc.com/events')
        }
    })

    client.login(process.env.TOKEN)

    async function fetchEvents(){
        console.log('fetchingEvents');
        const response = await fetch('https://www.ufc.com/events');
        //var data = await response.json();
        console.log(JSON.parse(JSON.stringify(response)));
    }