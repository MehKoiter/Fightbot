// Test SportsData path for a recent event
import SportsDataMMAService from './services/sportsDataMMAService.js';

async function testSportsDataPath() {
    console.log('🧪 Testing SportsData path...\n');
    
    const sportsDataService = new SportsDataMMAService();
    
    // Test with a known SportsData event
    try {
        const event = await sportsDataService.getUFCEventByNumber('317');
        if (event) {
            console.log(`✅ Found event: ${event.Name}`);
            console.log(`🆔 Event ID: ${event.EventId}`);
            
            // Simulate new button creation
            const eventIdentifier = `sports_${event.EventId}`;
            console.log(`🔘 Button ID would be: ufc_details_${eventIdentifier}`);
            
            // Test detail retrieval with correct ID
            const details = await sportsDataService.getEventDetails(event.EventId);
            console.log(`🔍 Detail retrieval: ${details ? details.Name : 'Failed'}`);
            console.log(`📊 Fight count: ${details?.Fights?.length || 0}`);
        } else {
            console.log('❌ UFC 317 not found');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testSportsDataPath().catch(console.error);
