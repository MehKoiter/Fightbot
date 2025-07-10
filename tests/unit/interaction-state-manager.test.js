/**
 * Test Interaction State Manager
 * Validates the interaction deduplication and state management
 */

import interactionStateManager from '../../utils/interactionStateManager.js';

// Mock interaction object
const createMockInteraction = (id, responded = false, deferred = false) => ({
    id,
    type: 4, // Autocomplete
    commandName: 'fighter',
    responded,
    deferred
});

console.log('🧪 Testing Interaction State Manager');
console.log('====================================');

// Test 1: Basic processing marking
console.log('\n🔧 Test 1: Basic processing marking');
const interaction1 = createMockInteraction('test-1');
const canProcess1 = interactionStateManager.markAsProcessing(interaction1);
console.log(`Can process interaction 1: ${canProcess1}`);

// Test 2: Duplicate processing prevention
console.log('\n🔧 Test 2: Duplicate processing prevention');
const canProcess1Again = interactionStateManager.markAsProcessing(interaction1);
console.log(`Can process interaction 1 again: ${canProcess1Again}`);

// Test 3: Safe to respond check
console.log('\n🔧 Test 3: Safe to respond check');
const isSafe1 = interactionStateManager.isSafeToRespond(interaction1);
console.log(`Is safe to respond to interaction 1: ${isSafe1}`);

// Test 4: Already responded interaction
console.log('\n🔧 Test 4: Already responded interaction');
const interaction2 = createMockInteraction('test-2', true, false);
const canProcess2 = interactionStateManager.markAsProcessing(interaction2);
const isSafe2 = interactionStateManager.isSafeToRespond(interaction2);
console.log(`Can process responded interaction: ${canProcess2}`);
console.log(`Is safe to respond to responded interaction: ${isSafe2}`);

// Test 5: Mark as completed
console.log('\n🔧 Test 5: Mark as completed');
interactionStateManager.markAsCompleted(interaction1);

// Test 6: Stats
console.log('\n🔧 Test 6: Stats');
const stats = interactionStateManager.getStats();
console.log('Manager stats:', JSON.stringify(stats, null, 2));

console.log('\n✅ Interaction State Manager tests completed');
console.log('🧹 Cleanup will happen automatically every 10 seconds');

// Exit the test
process.exit(0);
