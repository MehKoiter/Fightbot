import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const token = process.env.DISCORD_TOKEN;
export const clientId = process.env.CLIENT_ID;
export const guildId = process.env.GUILD_ID;

// Validate required environment variables
if (!token) {
    console.error('❌ DISCORD_TOKEN is required in environment variables');
    process.exit(1);
}

if (!clientId) {
    console.error('❌ CLIENT_ID is required in environment variables');
    process.exit(1);
}