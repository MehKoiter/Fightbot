/**
 * Debug script to test glob patterns
 */

import { globSync } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, '..', 'src', 'commands');

console.log('Testing glob patterns for commands:');
console.log('Commands directory:', commandsDir);

// Test different glob patterns
const patterns = [
  './**/*.js',                   // Relative pattern
  '**/*.js',                     // Any JS file in subdirectories
  path.join(commandsDir, '**/*.js'), // Absolute path with glob
  path.join(commandsDir, './**/*.js') // Absolute path with relative glob
];

patterns.forEach((pattern, i) => {
  try {
    console.log(`\nPattern ${i + 1}: ${pattern}`);
    const files = globSync(pattern, { cwd: commandsDir });
    console.log(`Found ${files.length} files:`);
    files.forEach(file => console.log(`  - ${file}`));
  } catch (error) {
    console.error(`Error with pattern ${i + 1}:`, error);
  }
});
