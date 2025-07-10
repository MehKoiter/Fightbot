import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variable Debug:');
console.log('');

console.log('Raw process.env.SPORTSDATA_API_KEY:', process.env.SPORTSDATA_API_KEY);
console.log('Length:', process.env.SPORTSDATA_API_KEY ? process.env.SPORTSDATA_API_KEY.length : 0);
console.log('');

// Test loading the config file
try {
    const config = await import('./config.js');
    console.log('Config loaded successfully');
    console.log('sportsDataApiKey from config:', config.sportsDataApiKey);
    console.log('Length:', config.sportsDataApiKey ? config.sportsDataApiKey.length : 0);
} catch (error) {
    console.log('Error loading config:', error.message);
}

console.log('');
console.log('All environment variables:');
Object.keys(process.env)
    .filter(key => key.includes('SPORTS') || key.includes('DISCORD'))
    .forEach(key => {
        const value = process.env[key];
        console.log(`${key}: ${value ? value.substring(0, 4) + '...' : 'undefined'}`);
    });
