import UfcService from './services/ufcService.js';

async function testUfcService() {
    console.log('🧪 Testing UFC Service...');
    
    try {
        const service = new UfcService();
        console.log('✅ Service created');
        
        const event = await service.getUpcomingEvent();
        console.log('📊 Event data received:');
        
        if (event) {
            console.log('- Title:', event.title);
            console.log('- Subtitle:', event.subtitle);
            console.log('- Date:', event.date);
            console.log('- Image URL:', event.imgUrl);
            console.log('- Number of fights:', event.fights?.length || 0);
            
            if (event.fights && event.fights.length > 0) {
                console.log('\n🥊 Main Event:');
                const mainEvent = event.fights[0];
                console.log('- Red Corner:', mainEvent.redCorner?.name, '(' + mainEvent.redCorner?.rank + ')');
                console.log('- Blue Corner:', mainEvent.blueCorner?.name, '(' + mainEvent.blueCorner?.rank + ')');
                console.log('- Weight Class:', mainEvent.weightClass);
            }
        } else {
            console.log('❌ No event data received');
        }
        
    } catch (error) {
        console.error('❌ Error testing UFC service:', error);
    }
}

testUfcService();
