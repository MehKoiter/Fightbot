/**
 * Fight Parser Service - Handles parsing of UFC website data
 * Provides structured data from UFC HTML content
 */

import * as cheerio from 'cheerio';
import BaseService from '../baseService.js';

class FightParserService extends BaseService {
    constructor() {
        super();
        this.baseUrl = 'https://www.ufc.com';
        this.selectors = {
            titleClass: '.c-hero__headline-prefix',
            subtitleClass: '.c-hero__headline.is-large-text',
            dateClass: '.c-hero__headline-suffix',
            weightClass: 'div.c-listing-fight__details > div.c-listing-fight__class',
            fighterClass: '.c-listing-fight__corner-name',
            rankClass: '.c-listing-fight__corner-rank',
            imgClass: '.c-hero__image',
            eventHeadline: '.c-card-event--result__headline'
        };
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        this.logger = this.container.get('logger');
        this.initialized = true;
        this.logger.info('FightParser service initialized');
    }

    /**
     * Parse events from HTML content
     * @param {string} html - HTML content
     * @returns {string[]} - List of event links
     */
    parseEvents(html) {
        this.ensureInitialized();

        try {
            const $ = cheerio.load(html);
            const links = [];
            
            $(this.selectors.eventHeadline).each((_, eventHeadline) => {
                const child = $(eventHeadline).children().first();
                const link = `${this.baseUrl}${child.attr('href')}`;
                links.push(link);
            });
            
            return links;
        } catch (error) {
            this.logger.error('Error parsing events:', error);
            throw error;
        }
    }

    /**
     * Parse image URL from HTML content
     * @param {cheerio.CheerioAPI} $ - Cheerio instance
     * @returns {string} - Image URL
     */
    parseImage($) {
        const imgHero = $(this.selectors.imgClass);
        const img = imgHero.find('img');
        return img?.attr('src') ?? '';
    }

    /**
     * Parse event details from HTML content
     * @param {string} html - HTML content
     * @returns {Object} - Parsed event data
     */
    parseEvent(html) {
        this.ensureInitialized();
        
        try {
            const $ = cheerio.load(html);
            
            // Get fighter data
            const fighters = [];
            $(this.selectors.fighterClass).each((_, el) => {
                fighters.push($(el).text().trim().replace(/\n/g, ''));
            });
            
            // Get rank data
            const ranks = [];
            $(this.selectors.rankClass).each((_, el) => {
                ranks.push($(el).text().trim().replace(/\n/g, ''));
            });
            
            // Get weight classes
            const weightClasses = [];
            $(this.selectors.weightClass).each((_, el) => {
                weightClasses.push($(el).text().trim().replace(/\n/g, ''));
            });
            
            // Build fight objects
            const fights = [];
            let i = 0;
            
            weightClasses.forEach(weightClass => {
                const fight = {
                    weightClass: weightClass.replace(/ +/g, ' ').trim(),
                    redCorner: {
                        name: fighters[i] || 'TBA',
                        rank: ranks[i] || '',
                    },
                    blueCorner: {
                        name: fighters[i + 1] || 'TBA',
                        rank: ranks[i + 1] || '',
                    },
                };
                
                i += 2;
                fights.push(fight);
            });
            
            // Get title, subtitle, date and image data
            const title = $(this.selectors.titleClass).text().trim().replace(/\n/g, '') || 'Upcoming Event';
            const subtitle = $(this.selectors.subtitleClass).text().trim().replace(/\n/g, '').replace(/ +/g, ' ') || '';
            const date = $(this.selectors.dateClass).text().trim() || 'TBA';
            const imgUrl = this.parseImage($);
            
            return {
                title,
                subtitle,
                date,
                fights,
                imgUrl,
            };
        } catch (error) {
            this.logger.error('Error parsing event:', error);
            throw error;
        }
    }
}

export default FightParserService;
