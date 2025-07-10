/**
 * Test UFC Stats Fighter Service with Real Scraping
 * Quick test to verify the new UFC.com scraping works for Alexander Volkanovski
 */

import UFCStatsFighterService from './services/ufcStatsFighterService.js';

async function testVolkanovski() {
    console.log('🧪 Testing UFC Stats Fighter Service with Real Scraping...\n');
    
    const ufcService = new UFCStatsFighterService();
    
    try {
        console.log('='.repeat(50));
        console.log('Testing Alexander Volkanovski lookup...');
        console.log('='.repeat(50));
        
        const volkanovski = await ufcService.searchFighter('Alexander Volkanovski');
        
        if (volkanovski && volkanovski.length > 0) {
            const fighter = volkanovski[0];
            console.log('✅ Alexander Volkanovski found:');
            console.log(`   Name: ${fighter.name}`);
            console.log(`   Nickname: ${fighter.nickname}`);
            console.log(`   Record: ${fighter.record}`);
            console.log(`   Height: ${fighter.height}`);
            console.log(`   Weight: ${fighter.weight}`);
            console.log(`   Reach: ${fighter.reach}`);
            console.log(`   Team: ${fighter.team}`);
            console.log(`   Weight Class: ${fighter.weightClass}`);
            console.log(`   Recent fights: ${fighter.recentFights?.length || 0}`);
            
            if (fighter.recentFights && fighter.recentFights.length > 0) {
                console.log('   Last fight:');
                const lastFight = fighter.recentFights[0];
                console.log(`     vs ${lastFight.opponent}: ${lastFight.result} (${lastFight.method})`);
                console.log(`     Event: ${lastFight.event}`);
                console.log(`     Date: ${lastFight.date}`);
            }
        } else {
            console.log('❌ Alexander Volkanovski not found');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('Testing autocomplete suggestions...');
        console.log('='.repeat(50));
        
        const suggestions = await ufcService.getAutocompleteSuggestions('volk');
        console.log('✅ Autocomplete results for "volk":');
        suggestions.forEach(suggestion => {
            console.log(`   - ${suggestion.name}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
    
    console.log('\n🏁 Test complete!');
}

testVolkanovski().catch(console.error);
