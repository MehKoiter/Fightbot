#!/usr/bin/env node

/**
 * UFC Fighter Search Debug Script
 * Debug the "jon jones" search issue and "Search results" problem
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function debugFighterSearch() {
    console.log('🔍 Starting UFC Fighter Search Debug');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    
    // Test cases
    const testCases = [
        'jon jones',
        'conor mcgregor', 
        'khabib',
        'alex',
        'alex volk'
    ];
    
    for (const fighterName of testCases) {
        console.log(`\n🥊 Testing fighter: "${fighterName}"`);
        console.log('─'.repeat(40));
        
        try {
            // Test the search method directly
            console.log('📋 Testing searchFighter method...');
            const searchResults = await service.searchFighter(fighterName);
            console.log(`✅ Search results: ${searchResults.length} fighters found`);
            
            if (searchResults.length > 0) {
                searchResults.forEach((fighter, index) => {
                    console.log(`   ${index + 1}. ${fighter.name} (${fighter.nickname}) - Score: ${fighter.searchScore || 'N/A'}`);
                    console.log(`      Record: ${fighter.record || 'N/A'}`);
                    console.log(`      URL: ${fighter.profileUrl || 'N/A'}`);
                });
            }
            
            // Test autocomplete suggestions
            console.log('📋 Testing getAutocompleteSuggestions method...');
            const suggestions = await service.getAutocompleteSuggestions(fighterName);
            console.log(`✅ Autocomplete suggestions: ${suggestions.length} found`);
            
            if (suggestions.length > 0) {
                suggestions.forEach((suggestion, index) => {
                    console.log(`   ${index + 1}. ${suggestion.name || suggestion} (Value: ${suggestion.value || suggestion})`);
                });
            }
            
            // Test profile fetching if we have results
            if (searchResults.length > 0 && searchResults[0].profileUrl) {
                console.log('📋 Testing getFighterProfile method...');
                const profile = await service.getFighterProfile(searchResults[0].profileUrl);
                
                if (profile) {
                    console.log(`✅ Profile fetched: ${profile.name}`);
                    console.log(`   Nickname: ${profile.nickname || 'N/A'}`);
                    console.log(`   Record: ${profile.record || 'N/A'}`);
                    console.log(`   Height: ${profile.height || 'N/A'}`);
                    console.log(`   Weight: ${profile.weight || 'N/A'}`);
                } else {
                    console.log('❌ Profile fetch failed');
                }
            }
            
        } catch (error) {
            console.error(`❌ Error testing "${fighterName}":`, error.message);
            console.error('Stack:', error.stack);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🏁 Debug tests completed');
}

// Direct URL test
async function testDirectURL() {
    console.log('\n🌐 Testing direct UFC.com URL access');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    
    const testUrls = [
        'https://www.ufc.com/athlete/jon-jones',
        'https://www.ufc.com/athlete/jonathan-jones',
        'https://www.ufc.com/athlete/alex-volkanovski'
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔗 Testing URL: ${url}`);
        try {
            const profile = await service.getFighterProfile(url);
            if (profile) {
                console.log(`✅ Success: ${profile.name}`);
            } else {
                console.log('❌ Profile returned null');
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

// Test UFC.com search endpoint directly
async function testSearchEndpoint() {
    console.log('\n🔍 Testing UFC.com search endpoint directly');
    console.log('═'.repeat(60));
    
    const testQueries = ['jon jones', 'alex volk'];
    
    for (const query of testQueries) {
        console.log(`\n🔍 Testing search for: "${query}"`);
        
        const searchUrl = `https://www.ufc.com/athletes/all?filters%5B0%5D=status%3A23&search=${encodeURIComponent(query)}`;
        console.log(`   URL: ${searchUrl}`);
        
        try {
            const axios = (await import('axios')).default;
            const response = await axios.get(searchUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Content-Type: ${response.headers['content-type']}`);
            console.log(`   Content Length: ${response.data.length} characters`);
            
            const cheerio = (await import('cheerio')).default;
            const $ = cheerio.load(response.data);
            
            const fighterCards = $('.c-listing-athlete-flipcard__inner');
            console.log(`   Fighter cards found: ${fighterCards.length}`);
            
            fighterCards.each((index, element) => {
                const $fighter = $(element);
                const name = $fighter.find('.c-listing-athlete__name').text().trim();
                const nickname = $fighter.find('.c-listing-athlete__nickname').text().trim();
                const record = $fighter.find('.c-listing-athlete__record').text().trim();
                const profileLink = $fighter.find('a').attr('href');
                
                console.log(`   ${index + 1}. Name: "${name}"`);
                console.log(`      Nickname: "${nickname}"`);
                console.log(`      Record: "${record}"`);
                console.log(`      Link: "${profileLink}"`);
            });
            
        } catch (error) {
            console.error(`❌ Search endpoint error: ${error.message}`);
        }
    }
}

// Run all tests
async function runAllTests() {
    try {
        await debugFighterSearch();
        await testDirectURL();
        await testSearchEndpoint();
    } catch (error) {
        console.error('❌ Test runner error:', error);
    }
}

runAllTests();
