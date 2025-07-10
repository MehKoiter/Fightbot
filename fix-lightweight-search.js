#!/usr/bin/env node

/**
 * Fix UFC Fighter Search - Replace lightweightSearchFighter method
 * This script fixes the CSS selectors in the lightweightSearchFighter method
 */

import fs from 'fs';

function fixLightweightSearchMethod() {
    console.log('🔧 Fixing lightweightSearchFighter method CSS selectors');
    console.log('═'.repeat(60));
    
    const filePath = 'services/ufcStatsFighterService.js';
    
    try {
        // Read the current file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find and replace the problematic CSS selector
        const oldSelector = `$('.c-card-athlete-results__athlete').each((index, element) => {`;
        const newSelector = `$('.c-listing-athlete-flipcard__inner').each((index, element) => {`;
        
        if (content.includes(oldSelector)) {
            content = content.replace(oldSelector, newSelector);
            console.log('✅ Fixed main CSS selector');
        }
        
        // Fix the name selector
        const oldNameSelector = `const name = $fighter.find('.c-card-athlete-results__name').text().trim() ||
                                $fighter.find('.c-listing-athlete__name').text().trim() ||
                                $fighter.find('h3').text().trim();`;
        
        const newNameSelector = `const name = $fighter.find('.c-listing-athlete__name').text().trim();`;
        
        if (content.includes('.c-card-athlete-results__name')) {
            content = content.replace(/const name = \$fighter\.find\('\.c-card-athlete-results__name'\)\.text\(\)\.trim\(\) \|\|\s*\$fighter\.find\('\.c-listing-athlete__name'\)\.text\(\)\.trim\(\) \|\|\s*\$fighter\.find\('h3'\)\.text\(\)\.trim\(\);/, 
                                    'const name = $fighter.find(\'.c-listing-athlete__name\').text().trim();');
            console.log('✅ Fixed name selector');
        }
        
        // Fix the nickname selector
        const oldNicknamePattern = /const nickname = \$fighter\.find\('\.c-card-athlete-results__nickname'\)\.text\(\)\.trim\(\) \|\|\s*\$fighter\.find\('\.c-listing-athlete__nickname'\)\.text\(\)\.trim\(\) \|\|\s*'';/;
        const newNicknameSelector = `const nickname = $fighter.find('.c-listing-athlete__nickname').text().trim();`;
        
        if (oldNicknamePattern.test(content)) {
            content = content.replace(oldNicknamePattern, newNicknameSelector);
            console.log('✅ Fixed nickname selector');
        }
        
        // Write the fixed content back
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ File updated successfully');
        
        console.log('\n🎯 Changes made:');
        console.log('  • Fixed CSS selector: .c-card-athlete-results__athlete → .c-listing-athlete-flipcard__inner');
        console.log('  • Fixed name selector: removed fallback chains, use consistent .c-listing-athlete__name');
        console.log('  • Fixed nickname selector: use consistent .c-listing-athlete__nickname');
        
    } catch (error) {
        console.error('❌ Error fixing file:', error.message);
    }
}

fixLightweightSearchMethod();
