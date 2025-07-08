/**
 * Simple test script to verify UFC data scraping
 * Run with: node scripts/test-ufc-api.js
 */

import ufcApi from '../src/services/ufc/ufcApi.js';

async function testUfcApi() {
    console.log('🧪 Testing UFC API...\n');
    
    try {
        // Test events listing
        console.log('📋 Testing events listing...');
        const events = await ufcApi.getEvents();
        console.log(`Found ${events.length} events`);
        console.log('First event:', events[0]);
        console.log('\n-------------------\n');
        
        // Test upcoming event
        console.log('🥊 Testing upcoming event...');
        const upcomingEvent = await ufcApi.getUpcomingEvent();
        console.log('Upcoming event:', upcomingEvent.name);
        console.log('Date:', upcomingEvent.date);
        console.log(`Main card fights: ${upcomingEvent.mainCard.length}`);
        console.log(`Prelim fights: ${upcomingEvent.prelimCard.length}`);
        console.log('\nMain event:');
        console.log(upcomingEvent.mainCard[0]);
        console.log('\n-------------------\n');
        
        // Test fighter info
        // Use a popular fighter name that's likely to be found
        const fighterName = 'Jon Jones';
        console.log(`👤 Testing fighter info for "${fighterName}"...`);
        const fighterInfo = await ufcApi.getFighterInfo(fighterName);
        console.log('Fighter info:');
        console.log(fighterInfo);
        
        console.log('\n✅ All tests completed successfully!');
    } catch (error) {
        console.error('❌ Error testing UFC API:', error);
    }
}

// Run the test
testUfcApi();
