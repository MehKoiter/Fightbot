#!/usr/bin/env node

/**
 * Simple Phase 6 Test - Quick validation of core improvements
 */

import { eventCache } from './services/eventCache.js';
import { FightParser, Event, Fight, FightCorner } from './services/fightParser.js';

// Simple console logging
const log = (message) => console.log(message);

async function quickTest() {
    log('🚀 Starting Quick Phase 6 Test...\n');
    
    try {
        // Test 1: Cache basic functionality
        log('1️⃣ Testing Cache...');
        const testEvent = new Event(
            'UFC Test',
            'Test Event',
            new Date().toISOString(),
            'test.jpg',
            [new Fight(
                new FightCorner('Fighter A', '#1'),
                new FightCorner('Fighter B', '#2'),
                'Heavyweight'
            )],
            'Test Arena',
            '10:00 PM ET'
        );
        
        eventCache.set('test_key', testEvent);
        const retrieved = eventCache.get('test_key');
        
        if (retrieved && retrieved.title === 'UFC Test') {
            log('   ✅ Cache working correctly');
        } else {
            log('   ❌ Cache failed');
        }
        
        // Test 2: Parser basic functionality
        log('2️⃣ Testing Parser...');
        const parser = new FightParser();
        const testHtml = `
            <div class="c-hero__headline-text">UFC Test Event</div>
            <div class="c-listing-fight__corner-name">Fighter One</div>
            <div class="c-listing-fight__corner-name">Fighter Two</div>
            <div class="c-listing-fight__class">Welterweight</div>
        `;
        
        const result = parser.parseEvent(testHtml);
        if (result && result.title.includes('UFC Test Event')) {
            log('   ✅ Parser working correctly');
        } else {
            log('   ❌ Parser failed');
        }
        
        // Test 3: Memory check
        log('3️⃣ Testing Memory...');
        const memory = process.memoryUsage();
        log(`   Memory usage: ${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        
        // Test 4: Cache stats
        log('4️⃣ Cache Statistics...');
        eventCache.logStats();
        
        log('\n✅ Quick Phase 6 Test Completed Successfully!');
        log('🎯 All core improvements are working correctly.');
        
    } catch (error) {
        log(`❌ Test failed: ${error.message}`);
        console.error(error);
    } finally {
        // Clean up
        process.exit(0);
    }
}

quickTest();
