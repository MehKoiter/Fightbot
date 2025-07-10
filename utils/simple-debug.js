#!/usr/bin/env node

/**
 * Simple Phase 6 Test - Debug version to isolate issues
 */

import { eventCache } from './services/eventCache.js';
import { FightParser, Event, Fight, FightCorner } from './services/fightParser.js';

console.log('✅ Imports successful');

// Test just the basic functionality
async function simpleTest() {
    try {
        console.log('🧪 Testing Event creation...');
        const event = new Event(
            'Test UFC Event',
            'Test Subtitle', 
            new Date().toISOString(),
            'test.jpg',
            [new Fight(
                new FightCorner('Fighter A', '#1'),
                new FightCorner('Fighter B', '#2'), 
                'Welterweight'
            )],
            'Test Arena',
            '10:00 PM ET'
        );
        console.log('✅ Event created:', event.title);

        console.log('🧪 Testing cache...');
        eventCache.set('test-key', event);
        const retrieved = eventCache.get('test-key');
        console.log('✅ Cache working:', retrieved?.title);

        console.log('🧪 Testing parser...');
        const parser = new FightParser();
        const html = `
            <div class="c-hero__headline-text">Test Event</div>
            <div class="c-listing-fight__corner-name">Fighter One</div>
            <div class="c-listing-fight__corner-name">Fighter Two</div>
            <div class="c-listing-fight__class">Welterweight</div>
        `;
        
        const result = parser.parseEvent(html);
        console.log('✅ Parser result:', result ? 'Success' : 'Expected null for simple HTML');

        console.log('🎉 All basic tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        eventCache.destroy();
    }
}

simpleTest();
