import WikipediaUFCService from './services/wikipediaUFCService.js';

async function testWikipediaUFCService() {
    console.log('🧪 Testing Wikipedia UFC Service...\n');
    
    const wikipediaService = new WikipediaUFCService();
    
    try {
        // Test 1: Connection test
        console.log('🔗 Testing Wikipedia API connection...');
        const connectionTest = await wikipediaService.testConnection();
        console.log('Connection result:', connectionTest ? '✅ Connected' : '❌ Failed');
        console.log('');

        // Test 2: Search for a classic UFC event (UFC 199)
        console.log('🥊 Testing UFC 199 (Historical Event)...');
        const ufc199 = await wikipediaService.getUFCEventByNumber('199');
        if (ufc199) {
            console.log('✅ UFC 199 found!');
            console.log('Title:', ufc199.title);
            console.log('Date:', ufc199.date || ufc199.dateTime);
            console.log('Location:', ufc199.location || ufc199.venue);
            console.log('Description preview:', ufc199.description?.substring(0, 100) + '...');
            if (ufc199.fights) {
                console.log(`Fight card: ${ufc199.fights.length} fights found`);
                ufc199.fights.slice(0, 3).forEach((fight, i) => {
                    if (fight.fighters && fight.fighters.length >= 2) {
                        console.log(`  ${i + 1}. ${fight.fighters[0].name} vs ${fight.fighters[1].name}`);
                    } else {
                        console.log(`  ${i + 1}. ${fight.rawText}`);
                    }
                });
            }
        } else {
            console.log('❌ UFC 199 not found');
        }
        console.log('');

        // Test 3: Search for another classic event (UFC 100)
        console.log('🥊 Testing UFC 100 (Milestone Event)...');
        const ufc100 = await wikipediaService.getUFCEventByNumber('100');
        if (ufc100) {
            console.log('✅ UFC 100 found!');
            console.log('Title:', ufc100.title);
            console.log('Date:', ufc100.date || ufc100.dateTime);
            console.log('Location:', ufc100.location || ufc100.venue);
            if (ufc100.fights) {
                console.log(`Fight card: ${ufc100.fights.length} fights found`);
            }
        } else {
            console.log('❌ UFC 100 not found');
        }
        console.log('');

        // Test 4: Search for very early UFC event (UFC 1)
        console.log('🥊 Testing UFC 1 (First Event)...');
        const ufc1 = await wikipediaService.getUFCEventByNumber('1');
        if (ufc1) {
            console.log('✅ UFC 1 found!');
            console.log('Title:', ufc1.title);
            console.log('Date:', ufc1.date || ufc1.dateTime);
            console.log('Location:', ufc1.location || ufc1.venue);
            console.log('Description preview:', ufc1.description?.substring(0, 150) + '...');
        } else {
            console.log('❌ UFC 1 not found');
        }
        console.log('');

        // Test 5: Search for non-existent event
        console.log('🥊 Testing UFC 999 (Non-existent Event)...');
        const ufc999 = await wikipediaService.getUFCEventByNumber('999');
        if (ufc999) {
            console.log('❌ Unexpectedly found UFC 999');
        } else {
            console.log('✅ UFC 999 correctly not found');
        }
        console.log('');

        console.log('🎉 Wikipedia UFC Service test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testWikipediaUFCService();
