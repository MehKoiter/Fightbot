#!/usr/bin/env node

/**
 * Debug Profile Parsing - Test what selectors work on UFC.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugProfileParsing() {
    console.log('🔍 Debugging UFC profile parsing selectors');
    console.log('═'.repeat(60));
    
    const testUrls = [
        'https://www.ufc.com/athlete/alexander-volkanovski',
        'https://www.ufc.com/athlete/jon-jones',
        'https://www.ufc.com/athlete/conor-mcgregor'
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔗 Testing: ${url}`);
        console.log('─'.repeat(40));
        
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            console.log(`Status: ${response.status}`);
            
            const $ = cheerio.load(response.data);
            
            // Test different name selectors
            const nameSelectors = [
                '.hero-profile__name',
                '.c-hero__headline-suffix',
                'h1',
                '.c-bio__text--large',
                '.c-hero__headline',
                '.c-hero__headline-prefix + .c-hero__headline-suffix',
                '[data-module="hero"] h1',
                '.hero-profile h1',
                'h1.hero-profile__name'
            ];
            
            console.log('🔍 Testing name selectors:');
            nameSelectors.forEach(selector => {
                const result = $(selector).first().text().trim();
                console.log(`   ${selector}: "${result}"`);
            });
            
            // Look for any h1 tags
            console.log('\n📋 All H1 tags:');
            $('h1').each((i, element) => {
                const text = $(element).text().trim();
                const classes = $(element).attr('class') || 'no-class';
                console.log(`   H1 #${i+1}: "${text}" (class: ${classes})`);
            });
            
            // Look for anything with "name" in the class
            console.log('\n📋 Elements with "name" in class:');
            $('[class*="name"]').each((i, element) => {
                const text = $(element).text().trim();
                const classes = $(element).attr('class');
                if (text.length > 0 && text.length < 100) {
                    console.log(`   ${classes}: "${text}"`);
                }
            });
            
        } catch (error) {
            console.error(`❌ Error testing ${url}:`, error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

debugProfileParsing();
