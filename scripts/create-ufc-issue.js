#!/usr/bin/env node

/**
 * GitHub Issue Creation Script for UFC.com Search Problems
 * 
 * This script helps create a GitHub issue for the UFC.com search problems
 * documented in docs/issues/GITHUB-ISSUE-UFC-SEARCH-PROBLEMS.md
 * 
 * Usage: node scripts/create-ufc-issue.js
 */

import fs from 'fs';
import path from 'path';

const ISSUE_TITLE = 'UFC.com Search Issues - Invalid URLs, Timeouts, and Profile Parsing Errors';
const ISSUE_LABELS = ['bug', 'ufc-scraping', 'performance', 'v1.8.3'];
const MILESTONE = 'v1.8.3';

function createIssueInstructions() {
    console.log('🚀 GitHub Issue Creation Instructions\n');
    console.log('═'.repeat(60));
    console.log('📋 TITLE:');
    console.log(`   ${ISSUE_TITLE}\n`);
    
    console.log('🏷️  LABELS:');
    ISSUE_LABELS.forEach(label => console.log(`   - ${label}`));
    console.log('');
    
    console.log('🎯 MILESTONE:');
    console.log(`   ${MILESTONE}\n`);
    
    console.log('📝 ISSUE BODY:');
    console.log('   Copy the content from:');
    console.log('   .github/ISSUE_TEMPLATE/ufc-search-problems.md\n');
    
    console.log('🔗 STEPS TO CREATE:');
    console.log('   1. Go to your GitHub repository');
    console.log('   2. Click "Issues" tab');
    console.log('   3. Click "New Issue"');
    console.log('   4. Select "🐛 UFC.com Search Issues" template');
    console.log('   5. The form will be pre-filled with all details');
    console.log('   6. Review and click "Submit new issue"\n');
    
    console.log('📊 ISSUE SUMMARY:');
    console.log('   This issue tracks multiple UFC.com search problems:');
    console.log('   • Invalid profile URL formation (spaces not encoded)');
    console.log('   • Search timeouts (1-second timeout too aggressive)');
    console.log('   • Profile parsing errors ("Search results" instead of names)');
    console.log('   • URL encoding problems for fighter names\n');
    
    console.log('💡 QUICK FIX CHECKLIST:');
    console.log('   □ Fix URL encoding for profile requests');
    console.log('   □ Increase search timeout to 2 seconds');
    console.log('   □ Add validation for extracted fighter names');
    console.log('   □ Implement profile URL cleaning function\n');
    
    console.log('✅ Files Ready:');
    const files = [
        '.github/ISSUE_TEMPLATE/ufc-search-problems.md',
        '.github/ISSUE_TEMPLATE/bug_report.md',
        '.github/ISSUE_TEMPLATE/feature_request.md',
        '.github/ISSUE_TEMPLATE/config.yml',
        '.github/pull_request_template.md',
        '.github/workflows/test.yml'
    ];
    
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} (missing)`);
        }
    });
    
    console.log('\n═'.repeat(60));
    console.log('🎯 RESULT: GitHub issue templates and workflows are ready!');
    console.log('   Use the template to create a comprehensive issue for the UFC.com problems.');
}

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
}

// Verify the issue template exists
const templatePath = '.github/ISSUE_TEMPLATE/ufc-search-problems.md';
if (!fs.existsSync(templatePath)) {
    console.error(`❌ Issue template not found: ${templatePath}`);
    console.error('   Please ensure the .github directory structure is created first');
    process.exit(1);
}

createIssueInstructions();

console.log('\n🔍 Quick Preview of Issue Template:');
console.log('─'.repeat(40));
try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const previewLines = templateContent.split('\n').slice(0, 20);
    previewLines.forEach(line => console.log('   ' + line));
    console.log('   ... (content continues)');
} catch (error) {
    console.error('❌ Could not read template file:', error.message);
}

console.log('\n🚀 Ready to create GitHub issue!');
