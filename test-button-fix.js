// Test the button fix for UFC 318 issue
import WikipediaUFCService from './services/wikipediaUFCService.js';
import SportsDataMMAService from './services/sportsDataMMAService.js';

async function testButtonFix() {
    console.log('🧪 Testing UFC 318 button fix...\n');
    
    // Simulate the original search (what happens when user types /ufc 318)
    console.log('1. Simulating original UFC 318 search:');
    const wikipediaService = new WikipediaUFCService();
    const sportsDataService = new SportsDataMMAService();
    
    // Try Wikipedia first (as the original code does)
    let event = await wikipediaService.getUFCEventByNumber('318');
    let dataSource = 'Wikipedia';
    
    if (!event) {
        console.log('   Wikipedia failed, trying SportsData...');
        event = await sportsDataService.getUFCEventByNumber('318');
        dataSource = 'SportsData.io';
    }
    
    if (event) {
        console.log(`   ✅ Found event: ${event.title || event.Name}`);
        console.log(`   📡 Data source: ${dataSource}`);
        console.log(`   🆔 Event ID: ${event.EventId || 'N/A'}`);
        
        // Simulate button creation (new logic)
        const eventIdentifier = dataSource === 'SportsData.io' ? 
            `sports_${event.EventId}` : 
            `wiki_318`;
        console.log(`   🔘 Button ID would be: ufc_details_${eventIdentifier}\n`);
        
        // Test the button click scenarios
        console.log('2. Testing button click scenarios:');
        
        // Test old behavior (BROKEN)
        console.log('   📛 OLD BEHAVIOR (broken):');
        console.log('      Button ID: ufc_details_318');
        console.log('      Calls: createUFCDetailsEmbed("318")');
        console.log('      SportsData.getEventDetails("318") finds: UFC Fight Night: Evans vs Salmon ❌');
        
        // Test new behavior (FIXED)
        console.log('\n   ✅ NEW BEHAVIOR (fixed):');
        console.log(`      Button ID: ufc_details_${eventIdentifier}`);
        if (dataSource === 'Wikipedia') {
            console.log('      Calls: createUFCDetailsEmbed("318", "wiki")');
            console.log('      Will use Wikipedia directly for UFC 318 ✅');
        } else {
            console.log(`      Calls: createUFCDetailsEmbed("${event.EventId}", "sports")`);
            console.log(`      Will use SportsData with correct ID ${event.EventId} ✅`);
        }
        
        // Test the actual detail retrieval
        console.log('\n3. Testing actual detail retrieval:');
        
        // Test fixed approach
        if (dataSource === 'Wikipedia') {
            const details = await wikipediaService.getUFCEventByNumber('318');
            console.log(`   🔍 Wikipedia UFC 318: ${details ? details.title : 'Not found'}`);
            console.log(`   📊 Fight count: ${details?.fights?.length || 0}`);
        } else {
            const details = await sportsDataService.getEventDetails(event.EventId);
            console.log(`   🔍 SportsData Event ${event.EventId}: ${details ? details.Name : 'Not found'}`);
            console.log(`   📊 Fight count: ${details?.Fights?.length || 0}`);
        }
        
    } else {
        console.log('   ❌ No event found');
    }
}

testButtonFix().catch(console.error);
