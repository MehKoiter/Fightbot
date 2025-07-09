/**
 * Test ESPN Fighter Service
 * Quick test to verify ESPN data fetching works
 */

import ESPNFighterService from './services/espnFighterService.js';

async function testESPNService() {
    console.log('🧪 Testing ESPN Fighter Service...\n');
    
    const espnService = new ESPNFighterService();
    
    // Test Jon Jones
    console.log('Testing Jon Jones lookup...');
    try {
        const jonJones = await espnService.getFighterProfile('Jon Jones');
        if (jonJones) {
            console.log('✅ Jon Jones found:');
            console.log(`   Name: ${jonJones.name}`);
            console.log(`   Record: ${jonJones.record}`);
            console.log(`   Height: ${jonJones.height}`);
            console.log(`   Weight: ${jonJones.weight}`);
            console.log(`   Team: ${jonJones.team}`);
            console.log(`   Fights: ${jonJones.fights.length} recent fights`);
        } else {
            console.log('❌ Jon Jones not found');
        }
    } catch (error) {
        console.error('❌ Error testing Jon Jones:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test Israel Adesanya
    console.log('Testing Israel Adesanya lookup...');
    try {
        const adesanya = await espnService.getFighterProfile('Israel Adesanya');
        if (adesanya) {
            console.log('✅ Israel Adesanya found:');
            console.log(`   Name: ${adesanya.name}`);
            console.log(`   Record: ${adesanya.record}`);
            console.log(`   Height: ${adesanya.height}`);
            console.log(`   Weight: ${adesanya.weight}`);
            console.log(`   Team: ${adesanya.team}`);
            console.log(`   Fights: ${adesanya.fights.length} recent fights`);
        } else {
            console.log('❌ Israel Adesanya not found');
        }
    } catch (error) {
        console.error('❌ Error testing Israel Adesanya:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test comparison
    console.log('Testing fighter comparison...');
    try {
        const comparison = await espnService.compareFighters('Jon Jones', 'Israel Adesanya');
        if (comparison) {
            console.log('✅ Comparison created:');
            console.log(`   Fighter 1: ${comparison.fighter1.name} (${comparison.fighter1.record})`);
            console.log(`   Fighter 2: ${comparison.fighter2.name} (${comparison.fighter2.record})`);
            console.log('   Edges:', comparison.comparison);
        } else {
            console.log('❌ Comparison failed');
        }
    } catch (error) {
        console.error('❌ Error testing comparison:', error.message);
    }
    
    console.log('\n🏁 Test complete!');
}

// Run the test
testESPNService().catch(console.error);
