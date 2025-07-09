#!/usr/bin/env node

/**
 * Documentation Health Check Script
 * Verifies documentation structure and identifies issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, 'docs');
const results = {
    totalFiles: 0,
    brokenLinks: [],
    missingFiles: [],
    outdatedFiles: [],
    suggestions: []
};

console.log('🔍 Running Documentation Health Check...\n');

/**
 * Check if a file exists
 */
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch {
        return false;
    }
}

/**
 * Get all markdown files in docs directory
 */
function getMarkdownFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (item.endsWith('.md')) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

/**
 * Check for broken internal links in markdown files
 */
function checkLinksInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const fileDir = path.dirname(filePath);
    const brokenLinks = [];
    
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        const linkText = match[1];
        const linkPath = match[2];
        
        // Skip external links
        if (linkPath.startsWith('http') || linkPath.startsWith('mailto:')) {
            continue;
        }
        
        // Skip anchor links (section headers) as they're harder to validate
        if (linkPath.startsWith('#')) {
            continue;
        }
        
        // Skip template placeholders
        if (linkPath.includes('category/DOCUMENT.md') || linkPath.includes('Section')) {
            continue;
        }
        
        // Handle relative links
        let absoluteLinkPath;
        
        // Handle directory links (ends with /)
        if (linkPath.endsWith('/')) {
            absoluteLinkPath = path.resolve(fileDir, linkPath);
            // Check if directory exists
            if (!fs.existsSync(absoluteLinkPath) || !fs.statSync(absoluteLinkPath).isDirectory()) {
                brokenLinks.push({
                    file: path.relative(docsDir, filePath),
                    link: linkPath,
                    text: linkText
                });
            }
        } else {
            // Handle file links
            absoluteLinkPath = path.resolve(fileDir, linkPath);
            if (!fileExists(absoluteLinkPath)) {
                brokenLinks.push({
                    file: path.relative(docsDir, filePath),
                    link: linkPath,
                    text: linkText
                });
            }
        }
    }
    
    return brokenLinks;
}

/**
 * Check if documentation is up to date
 */
function checkDocumentationAge(filePath) {
    const stat = fs.statSync(filePath);
    const daysSinceModified = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    // Flag files older than 90 days as potentially outdated
    if (daysSinceModified > 90) {
        return {
            file: path.relative(docsDir, filePath),
            daysSinceModified: Math.round(daysSinceModified),
            lastModified: stat.mtime.toDateString()
        };
    }
    
    return null;
}

/**
 * Main health check function
 */
function runHealthCheck() {
    if (!fs.existsSync(docsDir)) {
        console.error('❌ Documentation directory not found:', docsDir);
        return;
    }
    
    const markdownFiles = getMarkdownFiles(docsDir);
    results.totalFiles = markdownFiles.length;
    
    console.log(`📄 Found ${results.totalFiles} documentation files\n`);
    
    // Check for broken links
    console.log('🔗 Checking for broken links...');
    for (const file of markdownFiles) {
        const brokenLinks = checkLinksInFile(file);
        results.brokenLinks.push(...brokenLinks);
    }
    
    // Check for outdated files
    console.log('📅 Checking for outdated files...');
    for (const file of markdownFiles) {
        const outdatedInfo = checkDocumentationAge(file);
        if (outdatedInfo) {
            results.outdatedFiles.push(outdatedInfo);
        }
    }
    
    // Check for expected structure
    console.log('📁 Checking documentation structure...');
    const expectedDirs = ['user', 'developer', 'deployment', 'configuration', 'architecture', 'maintenance', 'features', 'templates'];
    const expectedFiles = ['README.md'];
    
    for (const dir of expectedDirs) {
        const dirPath = path.join(docsDir, dir);
        if (!fs.existsSync(dirPath)) {
            results.missingFiles.push(`Directory: ${dir}/`);
        }
    }
    
    for (const file of expectedFiles) {
        const filePath = path.join(docsDir, file);
        if (!fileExists(filePath)) {
            results.missingFiles.push(`File: ${file}`);
        }
    }
}

/**
 * Generate health report
 */
function generateReport() {
    console.log('\n📊 Documentation Health Report');
    console.log('================================\n');
    
    console.log(`📄 Total Files: ${results.totalFiles}`);
    
    if (results.brokenLinks.length === 0) {
        console.log('✅ No broken links found');
    } else {
        console.log(`❌ Broken Links Found: ${results.brokenLinks.length}`);
        for (const link of results.brokenLinks) {
            console.log(`   ${link.file}: "${link.text}" -> ${link.link}`);
        }
    }
    
    if (results.missingFiles.length === 0) {
        console.log('✅ All expected files present');
    } else {
        console.log(`❌ Missing Files: ${results.missingFiles.length}`);
        for (const missing of results.missingFiles) {
            console.log(`   ${missing}`);
        }
    }
    
    if (results.outdatedFiles.length === 0) {
        console.log('✅ All files recently updated');
    } else {
        console.log(`⚠️  Potentially Outdated Files: ${results.outdatedFiles.length}`);
        for (const outdated of results.outdatedFiles) {
            console.log(`   ${outdated.file} (${outdated.daysSinceModified} days old)`);
        }
    }
    
    // Generate suggestions
    results.suggestions = [];
    
    if (results.brokenLinks.length > 0) {
        results.suggestions.push('Fix broken internal links');
    }
    
    if (results.outdatedFiles.length > 0) {
        results.suggestions.push('Review and update outdated documentation');
    }
    
    if (results.missingFiles.length > 0) {
        results.suggestions.push('Create missing documentation files');
    }
    
    if (results.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        for (const suggestion of results.suggestions) {
            console.log(`   • ${suggestion}`);
        }
    }
    
    const healthScore = Math.round(
        ((results.totalFiles - results.brokenLinks.length - results.missingFiles.length) / 
         Math.max(results.totalFiles, 1)) * 100
    );
    
    console.log(`\n🎯 Documentation Health Score: ${healthScore}%`);
    
    if (healthScore >= 90) {
        console.log('🌟 Excellent documentation health!');
    } else if (healthScore >= 70) {
        console.log('👍 Good documentation health with room for improvement.');
    } else {
        console.log('⚠️  Documentation needs attention.');
    }
}

// Run the health check
try {
    runHealthCheck();
    generateReport();
} catch (error) {
    console.error('❌ Error running documentation health check:', error.message);
    process.exit(1);
}
