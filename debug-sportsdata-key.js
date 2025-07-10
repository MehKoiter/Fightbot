import axios from 'axios';
import { sportsDataApiKey } from './config.js';

async function debugSportsDataAPI() {
    console.log('🔍 Debugging SportsData.io API Connection...\n');
    
    // Check if API key is loaded
    console.log('API Key loaded:', sportsDataApiKey ? 'Yes ✅' : 'No ❌');
    console.log('API Key length:', sportsDataApiKey ? sportsDataApiKey.length : 0);
    console.log('API Key first 4 chars:', sportsDataApiKey ? sportsDataApiKey.substring(0, 4) + '...' : 'None');
    console.log('');
    
    if (!sportsDataApiKey) {
        console.log('❌ No API key found. Check your .env file.');
        return;
    }
    
    // Test different endpoint formats
    const testEndpoints = [
        {
            name: 'Basic Fighters Endpoint',
            url: 'https://api.sportsdata.io/v3/mma/scores/json/FightersBasic',
            headers: { 'Ocp-Apim-Subscription-Key': sportsDataApiKey }
        },
        {
            name: 'Alternative Header Format',
            url: 'https://api.sportsdata.io/v3/mma/scores/json/FightersBasic',
            headers: { 'X-RapidAPI-Key': sportsDataApiKey }
        },
        {
            name: 'Query Parameter Format',
            url: `https://api.sportsdata.io/v3/mma/scores/json/FightersBasic?key=${sportsDataApiKey}`,
            headers: {}
        }
    ];
    
    for (const test of testEndpoints) {
        console.log(`🧪 Testing: ${test.name}`);
        try {
            const response = await axios.get(test.url, {
                headers: test.headers,
                timeout: 10000
            });
            
            console.log(`✅ Success! Status: ${response.status}`);
            console.log(`📊 Data type: ${typeof response.data}`);
            console.log(`📊 Data length: ${Array.isArray(response.data) ? response.data.length : 'Not an array'}`);
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                console.log(`👤 Sample fighter: ${response.data[0].FirstName} ${response.data[0].LastName}`);
            }
            
            break; // If one works, we found the right format
            
        } catch (error) {
            console.log(`❌ Failed: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log(`📄 Error details: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
            }
        }
        console.log('');
    }
    
    // Test if it's a subscription issue
    console.log('🔍 Testing subscription status...');
    try {
        const response = await axios.get('https://api.sportsdata.io/v3/mma/scores/json/FightersBasic', {
            headers: { 'Ocp-Apim-Subscription-Key': sportsDataApiKey },
            timeout: 5000
        });
        console.log('✅ Subscription appears active');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ 401 Unauthorized - Possible causes:');
            console.log('  • Invalid API key');
            console.log('  • API key not activated');
            console.log('  • No MMA subscription');
            console.log('  • Trial period expired');
        } else if (error.response?.status === 403) {
            console.log('❌ 403 Forbidden - Subscription required or quota exceeded');
        } else {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

debugSportsDataAPI();
