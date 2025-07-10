#!/usr/bin/env node

/**
 * Test the specific URL that was causing "Search results" to be returned
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function testSpecificURLs() {
    console.log('🔍 Testing specific URLs that caused "Search results"');
    console.log('═'.repeat(60));
    
    const service = new UFCStatsFighterService();
    
    const testUrls = [
        'https://www.ufc.com/athlete/alex-volkanovski',  // This was showing "Search results"
        'https://www.ufc.com/athlete/alexander-volkanovski', // Correct URL
        'https://www.ufc.com/athlete/alex volk',  // Invalid URL with spaces
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔗 Testing: ${url}`);
        console.log('─'.repeat(40));
        
        try {
            const profile = await service.getFighterProfile(url);
            if (profile) {
                console.log(`✅ Success: Name = "${profile.name}"`);
                console.log(`   Nickname: "${profile.nickname}"`);
                console.log(`   Record: "${profile.record}"`);
            } else {
                console.log('❌ Profile returned null');
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

testSpecificURLs();
