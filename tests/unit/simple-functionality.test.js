import { VERSION_CONFIG } from '../../config/version.js';

console.log('🧪 Simple test of FightBot Premium');
console.log(`Version: ${VERSION_CONFIG.version}`);
console.log(`Type: ${VERSION_CONFIG.type}`);
console.log(`Features enabled: ${Object.values(VERSION_CONFIG.features).filter(f => f).length}`);
console.log('✅ Basic import test passed!');
