/**
 * FightBot FREE Test Suite
 * Tests all features (everything is FREE now!)
 */

import UfcService from './services/ufcService.js';
import { VERSION_CONFIG, isFeatureEnabled, isPremium } from './config/version.js';

class FightBotTester {
    constructor() {
        this.ufcService = new UfcService();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting FightBot FREE Test Suite...\n');
        console.log('🎉 All features are FREE! Testing comprehensive functionality...\n');
        
        await this.testVersionConfig();
        await this.testUfcService();
        await this.testFeatureFlags();
        
        this.printResults();
    }

    async testVersionConfig() {
        console.log('📋 Testing Version Configuration...');
        
        try {
            // Test version info
            this.assert(VERSION_CONFIG.version, 'Version should be defined');
            this.assert(VERSION_CONFIG.type, 'Version type should be defined');
            this.assert(typeof VERSION_CONFIG.features === 'object', 'Features should be an object');
            
            // Test helper functions
            this.assert(typeof isPremium() === 'boolean', 'isPremium should return boolean');
            this.assert(typeof isFeatureEnabled('basicFightCard') === 'boolean', 'isFeatureEnabled should return boolean');
            
            console.log('✅ Version configuration tests passed');
        } catch (error) {
            console.log('❌ Version configuration tests failed:', error.message);
        }
    }

    async testUfcService() {
        console.log('🥊 Testing UFC Service...');
        
        try {
            const event = await this.ufcService.getUpcomingEvent();
            
            this.assert(event, 'Should return an event');
            this.assert(event.title, 'Event should have a title');
            this.assert(Array.isArray(event.fights), 'Event should have fights array');
            
            if (event.fights.length > 0) {
                const fight = event.fights[0];
                this.assert(fight.redCorner, 'Fight should have red corner');
                this.assert(fight.blueCorner, 'Fight should have blue corner');
                this.assert(fight.redCorner.name, 'Red corner should have name');
                this.assert(fight.blueCorner.name, 'Blue corner should have name');
            }
            
            console.log('✅ UFC Service tests passed');
            console.log(`   📊 Event: ${event.title}`);
            console.log(`   📊 Fights: ${event.fights.length}`);
        } catch (error) {
            console.log('❌ UFC Service tests failed:', error.message);
        }
    }

    async testFeatureFlags() {
        console.log('🏁 Testing Feature Flags...');
        
        try {
            // Test core features (should always be enabled)
            const coreFeatures = ['basicFightCard', 'upcomingEvents', 'fightAnalysis'];
            
            for (const feature of coreFeatures) {
                this.assert(isFeatureEnabled(feature), `Core feature ${feature} should be enabled`);
            }
            
            // Test all features (all free now)
            const allFeatures = ['advancedAnalytics', 'betOddsTracking', 'exportData', 'personalizedFeed'];
            
            for (const feature of allFeatures) {
                const enabled = isFeatureEnabled(feature);
                this.assert(enabled, `Feature ${feature} should be enabled`);
                console.log(`   📊 Feature ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
            }
            
            console.log('✅ Feature flags tests passed');
        } catch (error) {
            console.log('❌ Feature flags tests failed:', error.message);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
        this.testResults.push({ passed: true, message });
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${total - passed}`);
        console.log(`📊 Total: ${total}`);
        console.log(`🎯 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (passed === total) {
            console.log('\n🎉 All tests passed! FightBot is ready to go!');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the output above.');
        }
        
        console.log('\n🔧 System Information:');
        console.log(`   Version: ${VERSION_CONFIG.version}`);
        console.log(`   Type: ${VERSION_CONFIG.type}`);
        console.log(`   Features Enabled: ${Object.values(VERSION_CONFIG.features).filter(f => f).length}`);
        console.log(`   Node.js: ${process.version}`);
        console.log(`   Platform: ${process.platform}`);
    }
}

// Performance testing
async function performanceTest() {
    console.log('\n⚡ Running Performance Tests...');
    
    const ufcService = new UfcService();
    const startTime = Date.now();
    
    try {
        const event = await ufcService.getUpcomingEvent();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ UFC data fetch completed in ${duration}ms`);
        
        if (duration < 2000) {
            console.log('🚀 Performance: Excellent (< 2s)');
        } else if (duration < 5000) {
            console.log('⚡ Performance: Good (< 5s)');
        } else {
            console.log('⚠️ Performance: Needs optimization (> 5s)');
        }
    } catch (error) {
        console.log('❌ Performance test failed:', error.message);
    }
}

// Memory usage test
function memoryTest() {
    console.log('\n💾 Memory Usage Test...');
    
    const memUsage = process.memoryUsage();
    
    console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
    
    if (memUsage.heapUsed / 1024 / 1024 < 100) {
        console.log('✅ Memory usage looks good');
    } else {
        console.log('⚠️ High memory usage detected');
    }
}

// Run all tests
async function main() {
    const tester = new FightBotTester();
    
    await tester.runAllTests();
    await performanceTest();
    memoryTest();
    
    console.log('\n🏁 Test suite completed!');
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default FightBotTester;
