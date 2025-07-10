import { eventCache } from '../../services/eventCache.js';

// Test the cache functionality
console.log('🧪 Testing event cache...');

// Create mock interaction for testing
const mockInteraction = {
    user: { id: 'test_user_123' },
    channelId: 'test_channel_456'
};

const cacheKey = `${mockInteraction.user.id}_${mockInteraction.channelId}`;
console.log(`🔑 Generated cache key: ${cacheKey}`);

// Test data
const testEventData = {
    title: 'UFC Test Event',
    fights: [
        {
            redCorner: { name: 'Fighter A', rank: '#1' },
            blueCorner: { name: 'Fighter B', rank: '#2' },
            weightClass: 'Heavyweight Championship'
        }
    ]
};

// Test setting data
console.log('💾 Setting test data...');
eventCache.set(cacheKey, testEventData);

// Test getting data
console.log('🔍 Retrieving test data...');
const retrievedData = eventCache.get(cacheKey);

if (retrievedData) {
    console.log('✅ Cache test passed!');
    console.log(`📝 Retrieved title: ${retrievedData.title}`);
    console.log(`🥊 Retrieved fights: ${retrievedData.fights.length}`);
} else {
    console.log('❌ Cache test failed!');
}

// Test non-existent key
console.log('🔍 Testing non-existent key...');
const noData = eventCache.get('non_existent_key');
console.log(`No data result: ${noData}`);

console.log('🧪 Cache test complete.');

// Explicitly exit the process
process.exit(0);
