// Quick test to see fight data structure
import SportsDataMMAService from './services/sportsDataMMAService.js';
import WikipediaUFCService from './services/wikipediaUFCService.js';

const sportsDataService = new SportsDataMMAService();
const wikipediaService = new WikipediaUFCService();

// Test with a recent UFC event
async function testFightData() {
    console.log('Testing SportsData fight data structure...');
    
    // Try getting event details from SportsData
    try {
        const eventDetails = await sportsDataService.getEventDetails('2024');
        if (eventDetails && eventDetails.Fights) {
            console.log('SportsData Fight structure:');
            console.log(JSON.stringify(eventDetails.Fights[0], null, 2));
        } else {
            console.log('No SportsData fight data found');
        }
    } catch (error) {
        console.log('SportsData failed:', error.message);
    }
    
    console.log('\nTesting Wikipedia fight data structure...');
    
    // Try getting event details from Wikipedia
    try {
        const eventDetails = await wikipediaService.getUFCEventByNumber('294');
        if (eventDetails && eventDetails.fights) {
            console.log('Wikipedia Fight structure:');
            console.log(JSON.stringify(eventDetails.fights[0], null, 2));
            console.log('\nFull event structure:');
            console.log(JSON.stringify(eventDetails, null, 2));
        } else {
            console.log('No Wikipedia fight data found');
        }
    } catch (error) {
        console.log('Wikipedia failed:', error.message);
    }
}

testFightData().catch(console.error);
