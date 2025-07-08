/**
 * UFC Data Fetching Test Script
 * 
 * This script tests the UFC data fetching functionality by simulating
 * a request to get the upcoming event and fighter information.
 */

import ServiceContainer from '../src/services/serviceContainer.js';
import { registerServices } from '../src/services/serviceRegistry.js';
import config from '../src/config/config.js';

async function testUfcDataFetching() {
    console.log('🥊 Testing UFC Data Fetching');
    console.log('============================');
    
    try {
        // Create a service container
        const container = new ServiceContainer();
        
        // Register config
        container.registerInstance('config', config);
        
        // Register services
        registerServices(container);
        
        // Initialize services
        const logger = container.get('logger');
        logger.level = 'debug'; // Enable debug logging
        
        const ufcService = container.get('ufc');
        const fightParser = container.get('fightParser');
        const fighterParser = container.get('fighterParser');
        
        // Initialize services
        await Promise.all([
            ufcService.init(),
            fightParser.init(),
            fighterParser.init()
        ]);
        
        console.log('\n📅 Testing Upcoming Event Data:');
        console.log('------------------------------');
        
        // Test fetching upcoming event
        const eventData = await ufcService.getUpcomingEvent();
        
        console.log(`Event name: ${eventData.name}`);
        console.log(`Date: ${eventData.date}`);
        console.log(`Main card fights: ${eventData.mainCard.length}`);
        console.log(`Preliminary card fights: ${eventData.prelimCard.length}`);
        console.log(`Image URL: ${eventData.imageUrl ? 'Available' : 'Not available'}`);
        
        console.log('\n👤 Testing Fighter Information:');
        console.log('------------------------------');
        
        // Test fetching fighter information (try a popular fighter)
        const testFighters = ['Jon Jones', 'Islam Makhachev', 'Amanda Nunes'];
        
        for (const fighterName of testFighters) {
            console.log(`\nSearching for fighter: ${fighterName}`);
            try {
                const fighterData = await ufcService.getFighterInfo(fighterName);
                
                console.log(`Name: ${fighterData.name}`);
                console.log(`Record: ${fighterData.record}`);
                console.log(`Weight: ${fighterData.weight}`);
                console.log(`Height: ${fighterData.height}`);
                console.log(`Reach: ${fighterData.reach}`);
                console.log(`Last fight: ${fighterData.lastFight}`);
            } catch (error) {
                console.error(`Error fetching fighter data for ${fighterName}:`, error.message);
            }
        }
        
        console.log('\n✅ UFC Data Fetching Test Complete');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testUfcDataFetching();
