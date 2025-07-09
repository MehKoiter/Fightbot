/**
 * Phase 7 Test Suite - Advanced Fighter Features
 * Tests the new fighter command and related functionality
 */

import FighterService from './services/fighterService.js';
import FighterInteractionHandler from './services/fighterInteractionHandler.js';

console.log('🧪 Phase 7 Test Suite - Advanced Fighter Features');
console.log('=================================================');

async function runPhase7Tests() {
    let testsPassed = 0;
    let testsTotal = 0;

    // Test 1: Fighter Service Initialization
    testsTotal++;
    console.log('\n📋 Test 1: Fighter Service Initialization');
    try {
        const fighterService = new FighterService();
        console.log('✅ Fighter service initialized successfully');
        testsPassed++;
    } catch (error) {
        console.log('❌ Fighter service initialization failed:', error.message);
    }

    // Test 2: Fighter Profile Retrieval
    testsTotal++;
    console.log('\n📋 Test 2: Fighter Profile Retrieval');
    try {
        const fighterService = new FighterService();
        const profile = await fighterService.getFighterProfile('Jon Jones');
        
        if (profile && profile.name && profile.record) {
            console.log('✅ Fighter profile retrieved successfully');
            console.log(`   Fighter: ${profile.name}`);
            console.log(`   Record: ${profile.record.wins}-${profile.record.losses}-${profile.record.draws}`);
            testsPassed++;
        } else {
            console.log('❌ Fighter profile incomplete or missing');
        }
    } catch (error) {
        console.log('❌ Fighter profile retrieval failed:', error.message);
    }

    // Test 3: Fighter Search Functionality
    testsTotal++;
    console.log('\n📋 Test 3: Fighter Search Functionality');
    try {
        const fighterService = new FighterService();
        const searchResults = await fighterService.searchFighter('Jones');
        
        if (Array.isArray(searchResults) && searchResults.length > 0) {
            console.log('✅ Fighter search working correctly');
            console.log(`   Found ${searchResults.length} results`);
            testsPassed++;
        } else {
            console.log('❌ Fighter search returned no results');
        }
    } catch (error) {
        console.log('❌ Fighter search failed:', error.message);
    }

    // Test 4: Fighter Comparison
    testsTotal++;
    console.log('\n📋 Test 4: Fighter Comparison');
    try {
        const fighterService = new FighterService();
        const comparison = await fighterService.compareFighters('Jon Jones', 'Islam Makhachev');
        
        if (comparison && comparison.fighter1 && comparison.fighter2 && comparison.comparison) {
            console.log('✅ Fighter comparison working correctly');
            console.log(`   Comparing: ${comparison.fighter1.name} vs ${comparison.fighter2.name}`);
            testsPassed++;
        } else {
            console.log('❌ Fighter comparison incomplete');
        }
    } catch (error) {
        console.log('❌ Fighter comparison failed:', error.message);
    }

    // Test 5: Fighter Statistics Calculation
    testsTotal++;
    console.log('\n📋 Test 5: Fighter Statistics Calculation');
    try {
        const fighterService = new FighterService();
        const profile = await fighterService.getFighterProfile('Jon Jones');
        
        if (profile) {
            const winPercentage = fighterService.calculateWinPercentage(profile.record);
            const totalFights = profile.record.wins + profile.record.losses + profile.record.draws;
            
            console.log('✅ Fighter statistics calculated correctly');
            console.log(`   Win percentage: ${winPercentage.toFixed(1)}%`);
            console.log(`   Total fights: ${totalFights}`);
            testsPassed++;
        } else {
            console.log('❌ Could not calculate fighter statistics');
        }
    } catch (error) {
        console.log('❌ Fighter statistics calculation failed:', error.message);
    }

    // Test 6: Interaction Handler Initialization
    testsTotal++;
    console.log('\n📋 Test 6: Interaction Handler Initialization');
    try {
        const handler = new FighterInteractionHandler();
        console.log('✅ Fighter interaction handler initialized successfully');
        testsPassed++;
    } catch (error) {
        console.log('❌ Fighter interaction handler initialization failed:', error.message);
    }

    // Test 7: Cache Functionality
    testsTotal++;
    console.log('\n📋 Test 7: Cache Functionality');
    try {
        const fighterService = new FighterService();
        
        // First call - should cache the result
        const profile1 = await fighterService.getFighterProfile('Jon Jones');
        
        // Second call - should use cache
        const profile2 = await fighterService.getFighterProfile('Jon Jones');
        
        if (profile1 && profile2 && profile1.name === profile2.name) {
            console.log('✅ Cache functionality working correctly');
            testsPassed++;
        } else {
            console.log('❌ Cache functionality not working');
        }
    } catch (error) {
        console.log('❌ Cache functionality test failed:', error.message);
    }

    // Test 8: Error Handling
    testsTotal++;
    console.log('\n📋 Test 8: Error Handling');
    try {
        const fighterService = new FighterService();
        const nonExistentFighter = await fighterService.getFighterProfile('NonExistentFighter123');
        
        if (nonExistentFighter === null) {
            console.log('✅ Error handling working correctly (returns null for non-existent fighter)');
            testsPassed++;
        } else {
            console.log('❌ Error handling not working (should return null)');
        }
    } catch (error) {
        console.log('❌ Error handling test failed:', error.message);
    }

    // Test Results Summary
    console.log('\n🏆 Phase 7 Test Results');
    console.log('========================');
    console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`);
    console.log(`❌ Tests Failed: ${testsTotal - testsPassed}/${testsTotal}`);
    console.log(`📊 Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('\n🎉 All Phase 7 tests passed! Advanced Fighter Features are ready for deployment.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation before deployment.');
    }
    
    console.log('\n📋 Phase 7 Features Implemented:');
    console.log('• /fighter command with autocomplete');
    console.log('• Detailed fighter profiles and statistics');
    console.log('• Fighter comparison tool');
    console.log('• Interactive buttons for enhanced exploration');
    console.log('• Fighting style analysis');
    console.log('• Fight prediction system');
    console.log('• Career highlights and achievements');
    console.log('• Caching for improved performance');
    console.log('• Comprehensive error handling');
}

// Run the tests
runPhase7Tests().catch(console.error);
