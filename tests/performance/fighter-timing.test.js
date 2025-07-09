/**
 * Test script for fighter command interaction timing fix
 */

import FighterService from '../../services/fighterService.js';

console.log('🧪 Testing Fighter Command Timing Fix');
console.log('=====================================');

async function testFighterCommand() {
    const fighterService = new FighterService();
    
    console.log('📋 Test 1: Fighter Profile Retrieval Speed');
    console.log('-------------------------------------------');
    
    const testFighters = ['Jon Jones', 'Conor McGregor', 'Khabib Nurmagomedov'];
    
    for (const fighterName of testFighters) {
        try {
            const startTime = Date.now();
            console.log(`🔍 Testing: ${fighterName}`);
            
            // Test with timeout like the command does
            const fighter = await Promise.race([
                fighterService.getFighterProfile(fighterName),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
            ]);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (fighter) {
                console.log(`✅ ${fighterName}: ${duration}ms - ${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`);
            } else {
                console.log(`❌ ${fighterName}: ${duration}ms - Not found`);
            }
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (error.message === 'Timeout') {
                console.log(`⏱️ ${fighterName}: ${duration}ms - Timeout (would defer)`);
            } else {
                console.log(`❌ ${fighterName}: ${duration}ms - Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('------------------------');
    console.log('✅ Fast responses (< 2.5s): Direct reply');
    console.log('⏱️ Slow responses (> 2.5s): Deferred reply');
    console.log('❌ Errors: Handled gracefully');
    console.log('\n🎉 Fighter command timing fix ready for testing!');
}

testFighterCommand().catch(console.error);
