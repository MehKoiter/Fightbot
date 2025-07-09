#!/usr/bin/env node

import { eventCache } from './services/eventCache.js';
import { FightParser, Event, Fight, FightCorner } from './services/fightParser.js';

// Test Colors for Console Output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function testCacheOnly() {
    log('cyan', '\n=== Testing Cache Performance ===');
    
    try {
        // Create test event data
        const createTestEvent = (id) => new Event(
            `UFC ${300 + id}: Test Event ${id}`,
            `Event ${id} Subtitle`,
            new Date(Date.now() + id * 24 * 60 * 60 * 1000).toISOString(),
            `https://example.com/poster${id}.jpg`,
            [
                new Fight(
                    new FightCorner(`Fighter ${id}A`, id % 2 === 0 ? `#${id}` : ''),
                    new FightCorner(`Fighter ${id}B`, id % 3 === 0 ? `#${id + 1}` : ''),
                    `${id % 2 === 0 ? 'Welterweight' : 'Lightweight'}`
                )
            ],
            `Test Arena ${id}`,
            `${10 + (id % 12)}:00 PM ET`
        );

        // Test cache operations
        const testKeys = [];
        const startTime = Date.now();

        log('yellow', 'Testing cache SET operations...');
        for (let i = 0; i < 10; i++) {
            const key = `test_user_${i}_channel_${i % 5}`;
            testKeys.push(key);
            eventCache.set(key, createTestEvent(i));
        }

        log('yellow', 'Testing cache GET operations...');
        let hits = 0;
        for (const key of testKeys) {
            if (eventCache.get(key)) {
                hits++;
            }
        }

        const endTime = Date.now();
        
        // Display results
        const stats = eventCache.getStats();
        log('green', `✅ Cache Performance Test Results:`);
        log('white', `   • Operations completed in: ${endTime - startTime}ms`);
        log('white', `   • Hit rate: ${stats.hitRate}`);
        log('white', `   • Total entries: ${stats.totalEntries}`);
        log('white', `   • Memory usage: ${stats.estimatedSizeMB}MB`);
        
        eventCache.logStats();
        
    } catch (error) {
        log('red', `❌ Cache test failed: ${error.message}`);
        console.error(error.stack);
    } finally {
        eventCache.destroy();
    }
}

testCacheOnly();
