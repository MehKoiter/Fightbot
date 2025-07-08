/**
 * UFC Service Test - Simple test for the UFC service
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// UFC events URL
const UFC_URL = 'https://www.ufc.com/events';

async function testUfcFetching() {
    console.log('🥊 Testing UFC Data Fetching (Simple Version)');
    console.log('==========================================');
    
    try {
        // Fetch events page
        console.log('Fetching UFC events page...');
        const response = await axios.get(UFC_URL, {
            timeout: 10000,
            headers: { 'User-Agent': 'FightBot/1.0.0' }
        });
        
        console.log('✅ Successfully fetched events page');
        
        // Parse with cheerio
        const $ = cheerio.load(response.data);
        console.log('✅ Successfully loaded HTML with cheerio');
        
        // Find events
        const eventHeadlines = $('.c-card-event--result__headline');
        console.log(`Found ${eventHeadlines.length} events`);
        
        // Get first event details
        const firstEvent = eventHeadlines.first();
        const eventLink = firstEvent.find('a').attr('href');
        const eventTitle = firstEvent.text().trim();
        
        console.log(`\nFirst event: ${eventTitle}`);
        console.log(`Event link: https://www.ufc.com${eventLink}`);
        
        console.log('\n✅ UFC fetching test completed successfully');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testUfcFetching();
