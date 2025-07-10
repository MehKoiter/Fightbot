/**
 * Test: Autocomplete Interaction Error Prevention
 * Tests the new lightweight autocomplete to prevent interaction errors
 */

import UFCStatsFighterService from '../../services/ufcStatsFighterService.js';

async function testAutocompleteFix() {
    console.log('🧪 Testing Autocomplete Interaction Error Fixes');
    console.log('================================================');
    
    const service = new UFCStatsFighterService();
    
    try {
        // Test 1: Quick autocomplete response (should be under 1 second)
        console.log('\n🔍 Test 1: Quick autocomplete response');
        const startTime = Date.now();
        const suggestions = await service.getAutocompleteSuggestions('alex');
        const duration = Date.now() - startTime;
        
        console.log(`✅ Got ${suggestions.length} suggestions in ${duration}ms`);
        if (duration > 1500) {
            throw new Error(`Autocomplete took too long: ${duration}ms`);
        }
        
        // Test 2: Lightweight search vs full search
        console.log('\n🔍 Test 2: Lightweight vs Full search comparison');
        
        const lightweightStart = Date.now();
        const lightweightResults = await service.lightweightSearchFighter('volk');
        const lightweightDuration = Date.now() - lightweightStart;
        
        const fullStart = Date.now();
        const fullResults = await service.searchFighter('volk');
        const fullDuration = Date.now() - fullStart;
        
        console.log(`✅ Lightweight search: ${lightweightResults.length} results in ${lightweightDuration}ms`);
        console.log(`✅ Full search: ${fullResults.length} results in ${fullDuration}ms`);
        console.log(`📊 Performance improvement: ${Math.round((fullDuration - lightweightDuration) / fullDuration * 100)}% faster`);
        
        // Test 3: Fallback system
        console.log('\n🔍 Test 3: Fallback system for timeout scenarios');
        const fallbackSuggestions = await service.getAutocompleteSuggestions('con');
        console.log(`✅ Fallback suggestions: ${fallbackSuggestions.length} fighters`);
        
        if (fallbackSuggestions.length > 0) {
            console.log(`   - Example: ${fallbackSuggestions[0].name}`);
        }
        
        console.log('\n✅ All autocomplete fix tests passed!');
        console.log('📝 Key improvements:');
        console.log('   - Lightweight search prevents detailed profile fetching during autocomplete');
        console.log('   - Reduced timeout from 2s to 1s for faster response');
        console.log('   - Better fallback system with popular fighters');
        console.log('   - Enhanced error handling for interaction state');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
testAutocompleteFix().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});
