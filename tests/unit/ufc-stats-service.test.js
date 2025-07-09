/**
 * Test UFC Stats Fighter Service
 * Quick test to verify the new fighter service works
 */

import UFCStatsFighterService from '../../services/ufcStatsFighterService.js';

async function testUFCStatsService() {
    console.log('🧪 Testing UFC Stats Fighter Service...\n');
    
    const service = new UFCStatsFighterService();
    
    // Test Jon Jones
    console.log('Testing Jon Jones lookup...');
    try {
        const jonJones = await service.getFighterProfile('Jon Jones');
        if (jonJones) {
            console.log('✅ Jon Jones found:');
            console.log(`   Name: ${jonJones.name}`);
            console.log(`   Nickname: ${jonJones.nickname}`);
            console.log(`   Record: ${jonJones.record}`);
            console.log(`   Height: ${jonJones.height}`);
            console.log(`   Weight: ${jonJones.weight}`);
            console.log(`   Team: ${jonJones.team}`);
            console.log(`   Champion: ${jonJones.currentChampion}`);
            console.log(`   Recent fights: ${jonJones.recentFights.length}`);
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
        const adesanya = await service.getFighterProfile('Israel Adesanya');
        if (adesanya) {
            console.log('✅ Israel Adesanya found:');
            console.log(`   Name: ${adesanya.name}`);
            console.log(`   Nickname: ${adesanya.nickname}`);
            console.log(`   Record: ${adesanya.record}`);
            console.log(`   Height: ${adesanya.height}`);
            console.log(`   Weight: ${adesanya.weight}`);
            console.log(`   Team: ${adesanya.team}`);
            console.log(`   Champion: ${adesanya.currentChampion}`);
            console.log(`   Recent fights: ${adesanya.recentFights.length}`);
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
        const comparison = await service.compareFighters('Jon Jones', 'Israel Adesanya');
        if (comparison) {
            console.log('✅ Comparison created:');
            console.log(`   Fighter 1: ${comparison.fighter1.name} (${comparison.fighter1.record})`);
            console.log(`   Fighter 2: ${comparison.fighter2.name} (${comparison.fighter2.record})`);
            console.log('   Edges:');
            console.log(`     Experience: ${comparison.comparison.experienceEdge}`);
            console.log(`     Height: ${comparison.comparison.heightEdge}`);
            console.log(`     Reach: ${comparison.comparison.reachEdge}`);
            console.log(`     Record: ${comparison.comparison.recordEdge}`);
        } else {
            console.log('❌ Comparison failed');
        }
    } catch (error) {
        console.error('❌ Error testing comparison:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test autocomplete
    console.log('Testing autocomplete suggestions...');
    try {
        const suggestions1 = service.getAutocompleteSuggestions('jon');
        const suggestions2 = service.getAutocompleteSuggestions('israel');
        const suggestions3 = service.getAutocompleteSuggestions('bones');
        
        console.log('✅ Autocomplete results:');
        console.log(`   "jon": [${suggestions1.join(', ')}]`);
        console.log(`   "israel": [${suggestions2.join(', ')}]`);
        console.log(`   "bones": [${suggestions3.join(', ')}]`);
    } catch (error) {
        console.error('❌ Error testing autocomplete:', error.message);
    }
    
    console.log('\n🏁 Test complete!');
    
    // Show database info
    service.expandDatabase();
}

// Run the test
testUFCStatsService().catch(console.error);
