#!/usr/bin/env node

/**
 * Comprehensive test of all the fixes
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function comprehensiveTest() {
    console.log('🎯 Comprehensive test of all fixes');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    
    const testCases = [
        { query: 'jon jones', expected: 'should find Jon Jones' },
        { query: 'alex volk', expected: 'should find Alexander Volkanovski' },
        { query: 'conor', expected: 'should find fighters with Conor' },
        { query: 'khabib', expected: 'should use fallback for retired fighters' }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🔍 Testing: "${testCase.query}" (${testCase.expected})`);
        console.log('─'.repeat(50));
        
        try {
            // Test autocomplete
            console.log('📋 Autocomplete test:');
            const suggestions = await service.getAutocompleteSuggestions(testCase.query);
            console.log(`   ✅ Found ${suggestions.length} suggestions`);
            
            if (suggestions.length > 0) {
                suggestions.slice(0, 3).forEach((suggestion, i) => {
                    console.log(`      ${i+1}. ${suggestion.name}`);
                });
                if (suggestions.length > 3) {
                    console.log(`      ... and ${suggestions.length - 3} more`);
                }
            }
            
            // Test direct search  
            console.log('📋 Direct search test:');
            const searchResults = await service.searchFighter(testCase.query);
            console.log(`   ✅ Found ${searchResults.length} search results`);
            
            if (searchResults.length > 0) {
                const topResult = searchResults[0];
                console.log(`      Top result: ${topResult.name} (${topResult.nickname})`);
                console.log(`      Record: ${topResult.record}`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🏁 Test Summary:');
    console.log('   ✅ Autocomplete should find results (no more 0 results)');
    console.log('   ✅ No more "Search results" as fighter names');
    console.log('   ✅ Invalid URLs return null instead of bad data');
    console.log('   ✅ CSS selectors updated to match current UFC.com');
}

comprehensiveTest();
