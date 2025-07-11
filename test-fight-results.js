// Test to see if we can get actual fight result data
import SportsDataMMAService from './services/sportsDataMMAService.js';

const sportsDataService = new SportsDataMMAService();

async function testFightResults() {
    console.log('Testing if SportsData provides fight results...');
    
    try {
        // Get schedule to find events
        const schedule = await sportsDataService.getUFCSchedule('2024');
        if (schedule && schedule.length > 0) {
            console.log('Found events:', schedule.slice(0, 3).map(e => e.Name || 'Unknown'));
            
            // Try getting details for the first event
            const eventDetails = await sportsDataService.getEventDetails(schedule[0].EventId);
            if (eventDetails && eventDetails.Fights) {
                console.log('\nFirst fight in event:');
                console.log(JSON.stringify(eventDetails.Fights[0], null, 2));
                
                console.log('\nAvailable fight fields:');
                console.log(Object.keys(eventDetails.Fights[0]));
                
                // Check if any fights have result data
                const fightWithResult = eventDetails.Fights.find(f => 
                    f.WinnerId || f.Winner || f.Result || f.ResultType || f.Status === 'Final'
                );
                
                if (fightWithResult) {
                    console.log('\nFight with result data:');
                    console.log(JSON.stringify(fightWithResult, null, 2));
                }
            }
        } else {
            console.log('No events found in schedule');
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
}

testFightResults().catch(console.error);
