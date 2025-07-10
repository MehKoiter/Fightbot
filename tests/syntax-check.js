// Quick syntax validation
import interactionStateManager from '../utils/interactionStateManager.js';
import UFCStatsFighterService from '../services/ufcStatsFighterService.js';

console.log('✅ All imports successful - no syntax errors');
console.log('📊 Interaction manager stats:', interactionStateManager.getStats());

const service = new UFCStatsFighterService();
console.log('✅ UFC Stats service created successfully');

process.exit(0);
