/**
 * Full UFC service integration test
 * Tests the entire UFC service stack with dependency injection
 * Run with: node scripts/test-ufc-service.js
 */

import ServiceContainer from '../src/services/serviceContainer.js';
import UFCService from '../src/services/ufc/ufcService.js';
import LoggerService from '../src/utils/logger.js';
import config from '../src/config/config.js';

async function testUfcService() {
    console.log('🧪 Testing UFC Service with DI Container...\n');
    
    try {
        // Create and set up container
        const container = new ServiceContainer();
        container.registerInstance('config', config);
        container.registerInstance('logger', new LoggerService({ level: 'debug' }));
        
        // Register and initialize UFC service
        const ufcService = new UFCService();
        container.registerInstance('ufc', ufcService);
        
        // Initialize the service
        ufcService.setContainer(container);
        await ufcService.init();
        
        // Test upcoming event
        console.log('🥊 Testing getUpcomingEvent()...');
        const upcomingEvent = await ufcService.getUpcomingEvent();
        console.log('Upcoming event:', upcomingEvent.name);
        console.log('Date:', upcomingEvent.date);
        console.log(`Main card fights: ${upcomingEvent.mainCard.length}`);
        console.log('\n-------------------\n');
        
        // Test fighter info - try a different fighter name
        const fighterName = 'Israel Adesanya';
        console.log(`👤 Testing getFighterInfo() for "${fighterName}"...`);
        const fighterInfo = await ufcService.getFighterInfo(fighterName);
        console.log('Fighter info:');
        console.log({
            name: fighterInfo.name,
            nickname: fighterInfo.nickname,
            record: fighterInfo.record,
            weight: fighterInfo.weight,
            height: fighterInfo.height
        });
        
        console.log('\n✅ All service tests completed successfully!');
    } catch (error) {
        console.error('❌ Error testing UFC service:', error);
    }
}

// Run the test
testUfcService();
