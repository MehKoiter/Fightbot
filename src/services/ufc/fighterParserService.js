/**
 * Fighter Parser Service - Handles parsing of UFC fighter data
 * Provides structured data from UFC fighter profiles
 */

import * as cheerio from 'cheerio';
import BaseService from '../baseService.js';

class FighterParserService extends BaseService {
    constructor() {
        super();
        this.baseUrl = 'https://www.ufc.com';
        this.searchUrl = 'https://www.ufc.com/athletes/all';
        this.selectors = {
            // Fighter profile selectors
            name: '.hero-profile__name',
            nickname: '.hero-profile__nickname',
            record: '.hero-profile__division-body',
            personalInfo: '.hero-profile__bio-row',
            personalLabel: '.hero-profile__bio-label',
            personalValue: '.hero-profile__bio-text',
            lastFight: '.c-card-event--athlete-results__date',
            lastOpponent: '.c-card-event--athlete-results__headliner',
            lastResult: '.c-card-event--athlete-results__result',
            
            // Search results selectors
            searchResults: '.c-listing-athlete__item',
            searchResultLink: '.c-listing-athlete__name a',
            searchResultName: '.c-listing-athlete__name'
        };
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        this.logger = this.container.get('logger');
        this.initialized = true;
        this.logger.info('FighterParser service initialized');
    }

    /**
     * Parse fighter search results
     * @param {string} html - HTML content
     * @param {string} searchTerm - Search term
     * @returns {Object[]} - List of fighter search results
     */
    parseFighterSearchResults(html, searchTerm) {
        this.ensureInitialized();

        try {
            const $ = cheerio.load(html);
            const results = [];
            
            $(this.selectors.searchResults).each((_, element) => {
                const nameElement = $(element).find(this.selectors.searchResultName);
                const linkElement = $(element).find(this.selectors.searchResultLink);
                
                if (nameElement.length && linkElement.length) {
                    const name = nameElement.text().trim();
                    const link = linkElement.attr('href');
                    
                    // Only include results that match the search term
                    if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        results.push({
                            name,
                            url: this.baseUrl + link
                        });
                    }
                }
            });
            
            return results;
        } catch (error) {
            this.logger.error('Error parsing fighter search results:', error);
            throw error;
        }
    }
    
    /**
     * Parse fighter profile from HTML content
     * @param {string} html - HTML content
     * @returns {Object} - Parsed fighter data
     */
    parseFighterProfile(html) {
        this.ensureInitialized();
        
        try {
            const $ = cheerio.load(html);
            const data = {
                name: $(this.selectors.name).text().trim(),
                nickname: $(this.selectors.nickname).text().trim(),
                record: $(this.selectors.record).first().text().trim().split(' ')[0] || 'N/A',
                height: 'N/A',
                weight: 'N/A',
                reach: 'N/A',
                stance: 'N/A',
                age: 'N/A',
                lastFight: 'N/A'
            };
            
            // Extract personal information (height, weight, etc)
            $(this.selectors.personalInfo).each((_, element) => {
                const label = $(element).find(this.selectors.personalLabel).text().trim().toLowerCase();
                const value = $(element).find(this.selectors.personalValue).text().trim();
                
                if (label.includes('height')) {
                    data.height = value;
                } else if (label.includes('weight')) {
                    data.weight = value;
                } else if (label.includes('reach')) {
                    data.reach = value;
                } else if (label.includes('stance')) {
                    data.stance = value;
                } else if (label.includes('age') || label.includes('dob') || label.includes('date of birth')) {
                    data.age = value;
                }
            });
            
            // Extract last fight information
            const lastFightDate = $(this.selectors.lastFight).first().text().trim();
            const lastFightOpponent = $(this.selectors.lastOpponent).first().text().trim();
            const lastFightResult = $(this.selectors.lastResult).first().text().trim();
            
            if (lastFightDate && lastFightOpponent) {
                data.lastFight = `${lastFightResult} vs ${lastFightOpponent} (${lastFightDate})`;
            }
            
            return data;
        } catch (error) {
            this.logger.error('Error parsing fighter profile:', error);
            throw error;
        }
    }
}

export default FighterParserService;
