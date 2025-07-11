/**
 * Test script to validate button interaction functionality
 */

import SportsDataMMAService from './services/sportsDataMMAService.js';
import WikipediaUFCService from './services/wikipediaUFCService.js';

console.log('🧪 Testing Button Interaction Services...\n');

async function testServices() {
    console.log('📡 Testing SportsData.io service...');
    const sportsDataService = new SportsDataMMAService();
    
    try {
        console.log('🔍 Testing getUFCSchedule...');
        const schedule = await sportsDataService.getUFCSchedule('2025');
        console.log(`✅ Found ${schedule ? schedule.length : 0} events in schedule`);
        
        if (schedule && schedule.length > 0) {
            console.log(`📅 First event: ${schedule[0].Name} - ${schedule[0].DateTime}`);
            
            // Test event details
            if (schedule[0].EventId) {
                console.log('🔍 Testing getEventDetails...');
                const details = await sportsDataService.getEventDetails(schedule[0].EventId);
                console.log(`✅ Event details: ${details ? 'Found' : 'Not found'}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ SportsData error: ${error.message}`);
    }
    
    console.log('\n📖 Testing Wikipedia service...');
    const wikipediaService = new WikipediaUFCService();
    
    try {
        console.log('🔍 Testing getUFCEventByNumber for UFC 123...');
        const event = await wikipediaService.getUFCEventByNumber('123');
        console.log(`✅ UFC 123: ${event ? 'Found' : 'Not found'}`);
        
        if (event) {
            console.log(`📋 Title: ${event.title}`);
            console.log(`🥊 Fights: ${event.fights ? event.fights.length : 0}`);
        }
        
    } catch (error) {
        console.log(`❌ Wikipedia error: ${error.message}`);
    }
}

testServices()
    .then(() => {
        console.log('\n✅ Test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
