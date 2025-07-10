/**
 * Test script for the new UFC command and SportsData integration
 */

import SportsDataMMAService from './services/sportsDataMMAService.js';

async function testUFCCommand() {
    console.log('🧪 Testing UFC Command Functionality...\n');
    
    const sportsDataService = new SportsDataMMAService();
    
    try {
        // Test 1: Search for a popular UFC event
        console.log('🔍 Test 1: Searching for UFC 199...');
        const ufc199 = await sportsDataService.getUFCEventByNumber('199');
        
        if (ufc199) {
            console.log('✅ Found UFC 199:', ufc199.Name || 'UFC 199');
            console.log('   Date:', ufc199.DateTime);
            console.log('   Location:', ufc199.City || 'N/A');
            console.log('   Fights:', ufc199.Fights?.length || 0, 'fights scheduled');
        } else {
            console.log('❌ UFC 199 not found');
        }
        
        // Test 2: Search for a more recent event
        console.log('\n🔍 Test 2: Searching for UFC 309...');
        const ufc309 = await sportsDataService.getUFCEventByNumber('309');
        
        if (ufc309) {
            console.log('✅ Found UFC 309:', ufc309.Name || 'UFC 309');
            console.log('   Date:', ufc309.DateTime);
            console.log('   Location:', ufc309.City || 'N/A');
            console.log('   Fights:', ufc309.Fights?.length || 0, 'fights scheduled');
        } else {
            console.log('❌ UFC 309 not found');
        }
        
        // Test 3: Test with invalid input
        console.log('\n🔍 Test 3: Testing invalid event number...');
        const invalidEvent = await sportsDataService.getUFCEventByNumber('999999');
        
        if (invalidEvent) {
            console.log('⚠️ Unexpected: Found event for invalid number');
        } else {
            console.log('✅ Correctly returned null for invalid event number');
        }
        
        // Test 4: Get upcoming events for comparison
        console.log('\n🔍 Test 4: Getting UFC schedule for reference...');
        const schedule = await sportsDataService.getUFCSchedule();
        console.log(`✅ Retrieved ${schedule.length} scheduled UFC events`);
        
        if (schedule.length > 0) {
            console.log('Recent events:');
            schedule.slice(0, 3).forEach(event => {
                console.log(`   - ${event.Name || event.ShortName} (${event.DateTime})`);
            });
        }
        
        console.log('\n🎉 UFC Command tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n📝 Make sure your SportsData.io API key is configured in .env');
        }
    }
}

// Run the test
testUFCCommand();
