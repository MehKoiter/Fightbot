#!/usr/bin/env node

/**
 * Targeted debug for the autocomplete issue
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function testAutocompleteBug() {
    console.log('🔍 Debugging autocomplete vs direct search difference');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    const query = 'jon jones';
    
    console.log(`\n📋 1. Testing direct searchFighter("${query}")`);
    console.log('─'.repeat(40));
    
    try {
        const directResults = await service.searchFighter(query);
        console.log(`✅ Direct search: ${directResults.length} results`);
        directResults.forEach((fighter, i) => {
            console.log(`   ${i+1}. ${fighter.name} - ${fighter.record}`);
        });
    } catch (error) {
        console.error(`❌ Direct search error:`, error.message);
    }
    
    console.log(`\n📋 2. Testing getAutocompleteSuggestions("${query}")`);
    console.log('─'.repeat(40));
    
    try {
        const suggestions = await service.getAutocompleteSuggestions(query);
        console.log(`✅ Autocomplete: ${suggestions.length} suggestions`);
        suggestions.forEach((suggestion, i) => {
            console.log(`   ${i+1}. ${suggestion.name || suggestion} (${suggestion.value || suggestion})`);
        });
    } catch (error) {
        console.error(`❌ Autocomplete error:`, error.message);
    }
    
    console.log(`\n📋 3. Checking method source code`);
    console.log('─'.repeat(40));
    
    // Let's inspect the actual method
    console.log('getAutocompleteSuggestions method source:');
    console.log(service.getAutocompleteSuggestions.toString());
    
    console.log('\n📋 4. Manual method call simulation');
    console.log('─'.repeat(40));
    
    // Manually simulate what getAutocompleteSuggestions does
    try {
        if (query && query.length >= 2) {
            console.log('✅ Query length check passed');
            console.log('Calling searchFighter from within getAutocompleteSuggestions...');
            
            const manualSearchResults = await service.searchFighter(query);
            console.log(`✅ Manual call: ${manualSearchResults.length} results`);
            
            const manualSuggestions = manualSearchResults.map(fighter => ({
                name: fighter.name,
                value: fighter.name
            })).slice(0, 25);
            
            console.log(`✅ Manual suggestions: ${manualSuggestions.length} processed`);
            manualSuggestions.forEach((suggestion, i) => {
                console.log(`   ${i+1}. ${suggestion.name} (${suggestion.value})`);
            });
        }
    } catch (error) {
        console.error(`❌ Manual simulation error:`, error.message);
    }
}

testAutocompleteBug();
