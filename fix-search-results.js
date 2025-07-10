#!/usr/bin/env node

/**
 * Fix the "Search results" issue by adding validation
 */

import fs from 'fs';

function fixSearchResultsIssue() {
    console.log('🔧 Fixing "Search results" issue in profile parsing');
    console.log('═'.repeat(60));
    
    const filePath = 'services/ufcStatsFighterService.js';
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the parseFighterProfile method and add validation
        const oldValidationPattern = /if \(!name\) \{\s*console\.log\('.*Could not extract fighter name.*'\);\s*return null;\s*\}/;
        
        const newValidation = `// Validate that we got a real name, not page artifacts
            if (!name || name === 'Search results' || name.length < 2 || name.toLowerCase().includes('search')) {
                console.log('❌ Invalid fighter name extracted or landed on search page, skipping profile');
                return null;
            }`;
        
        if (oldValidationPattern.test(content)) {
            content = content.replace(oldValidationPattern, newValidation);
            console.log('✅ Added "Search results" validation');
        } else {
            console.log('⚠️ Could not find exact validation pattern, adding fallback');
            // Add validation before the profile creation
            const profileCreationPattern = /const profile = \{/;
            if (profileCreationPattern.test(content)) {
                content = content.replace(profileCreationPattern, 
                    `// Validate that we got a real name, not page artifacts
            if (!name || name === 'Search results' || name.length < 2 || name.toLowerCase().includes('search')) {
                console.log('❌ Invalid fighter name extracted or landed on search page, skipping profile');
                return null;
            }

            const profile = {`);
                console.log('✅ Added validation before profile creation');
            }
        }
        
        // Write the updated content
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ File updated successfully');
        
    } catch (error) {
        console.error('❌ Error fixing file:', error.message);
    }
}

fixSearchResultsIssue();
