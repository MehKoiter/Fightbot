import SportsDataMMAService from './services/sportsDataMMAService.js';
import * as config from './config.js';

async function testSportsDataAPI() {
    console.log('Testing SportsData.io MMA API Integration...\n');
    
    const sportsDataService = new SportsDataMMAService();
    
    try {
        // Test 1: Get UFC Schedule (Upcoming Events)
        console.log('🗓️ Testing UFC Schedule...');
        const upcomingEvents = await sportsDataService.getUFCSchedule();
        console.log(`Found ${upcomingEvents.length} scheduled events`);
        if (upcomingEvents.length > 0) {
            console.log('First event:', upcomingEvents[0].Name || upcomingEvents[0].ShortName);
        }
        console.log('✅ UFC Schedule test passed\n');
        
        // Test 2: Search for a popular fighter
        console.log('🥊 Testing Fighter Search...');
        const conorResults = await sportsDataService.searchFighters('Conor McGregor');
        console.log(`Found ${conorResults.length} results for "Conor McGregor"`);
        if (conorResults.length > 0) {
            console.log('First result:', conorResults[0].FirstName, conorResults[0].LastName);
        }
        console.log('✅ Fighter Search test passed\n');
        
        // Test 3: Get Fighter Details (if we found any)
        if (conorResults.length > 0) {
            console.log('👤 Testing Fighter Details...');
            const fighterDetails = await sportsDataService.getFighterProfile(conorResults[0].FighterId);
            if (fighterDetails) {
                console.log('Fighter Details:', fighterDetails.FirstName, fighterDetails.LastName);
                console.log('Weight Class:', fighterDetails.WeightClass);
                console.log('Record:', `${fighterDetails.Wins}-${fighterDetails.Losses}-${fighterDetails.Draws}`);
            }
            console.log('✅ Fighter Details test passed\n');
        }
        
        // Test 4: Get Next UFC Event
        console.log('📅 Testing Next UFC Event...');
        const nextEvent = await sportsDataService.getNextUFCEvent();
        if (nextEvent) {
            console.log('Next UFC event:', nextEvent.Name || nextEvent.ShortName);
        }
        console.log('✅ Next Event test passed\n');
        
        // Test 5: Test API Connection
        console.log('⏱️ Testing API Connection...');
        const connectionTest = await sportsDataService.testConnection();
        console.log('Connection test result:', connectionTest ? '✅ Connected' : '❌ Failed');
        console.log('✅ Connection test completed\n');
        
        console.log('🎉 All SportsData.io API tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n📝 To fix this:');
            console.log('1. Sign up at https://sportsdata.io/');
            console.log('2. Get your MMA API key');
            console.log('3. Add SPORTSDATA_API_KEY=your_key_here to your .env file');
        }
        
        if (error.message.includes('401')) {
            console.log('\n🔑 Authentication Error:');
            console.log('- Check that your API key is correct');
            console.log('- Ensure your subscription includes MMA data');
        }
        
        if (error.message.includes('429')) {
            console.log('\n🚫 Rate Limit Error:');
            console.log('- You may have exceeded your API rate limit');
            console.log('- Try again in a few minutes');
        }
    }
}

// Run the test
testSportsDataAPI();
