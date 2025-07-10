#!/usr/bin/env node

/**
 * Test the "alex volk" issue specifically
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function testAlexVolk() {
    console.log('🔍 Testing "alex volk" search issue');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    const query = 'alex volk';
    
    console.log(`\n📋 Testing autocomplete for: "${query}"`);
    try {
        const suggestions = await service.getAutocompleteSuggestions(query);
        console.log(`✅ Autocomplete: ${suggestions.length} suggestions`);
        suggestions.forEach((suggestion, i) => {
            console.log(`   ${i+1}. ${suggestion.name} (${suggestion.value})`);
        });
        
        if (suggestions.length > 0) {
            console.log('🎉 SUCCESS: "alex volk" now returns suggestions!');
        }
    } catch (error) {
        console.error(`❌ Error:`, error.message);
    }
    
    console.log(`\n📋 Testing lightweight search directly: "${query}"`);
    try {
        const results = await service.lightweightSearchFighter(query);
        console.log(`✅ Lightweight search: ${results.length} results`);
        results.forEach((result, i) => {
            console.log(`   ${i+1}. ${result.name} (${result.nickname})`);
        });
    } catch (error) {
        console.error(`❌ Error:`, error.message);
    }
}

testAlexVolk();
