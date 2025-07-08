/**
 * Fight Parser Service - Parses UFC event data from HTML
 * Migrated to use the new BaseService class
 */

import * as Cheerio from 'cheerio';
import BaseService from './baseService.js';

const baseUrl = 'https://www.ufc.com';
const titleClass = '.c-hero__headline-prefix';
const subtitleClass = '.c-hero__headline.is-large-text';
const dateClass = '.c-hero__headline-suffix';
const weightClass = 'div.c-listing-fight__details > div.c-listing-fight__class';
const fighterClass = '.c-listing-fight__corner-name';
const rankClass = '.c-listing-fight__corner-rank';
const imgClass = '.c-hero__image';

export class FightCorner {
  constructor(name = '', rank = '') {
    this.name = name;
    this.rank = rank;
  }
}

export class Fight {
  constructor(redCorner = new FightCorner(), blueCorner = new FightCorner(), weightClass = '') {
    this.redCorner = redCorner;
    this.blueCorner = blueCorner;
    this.weightClass = weightClass;
  }
}

export class Event {
  constructor(title = '', subtitle = '', date = '', imgUrl = '', fights = []) {
    this.title = title;
    this.subtitle = subtitle;
    this.date = date;
    this.imgUrl = imgUrl;
    this.fights = fights;
  }
}

class FightParserService extends BaseService {
    constructor() {
        super();
    }
    
    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Try to get logger from container
            try {
                const container = await import('./serviceContainer.js');
                this.container = container.default;
                this.logger = this.container.get('logger');
            } catch (error) {
                // Fall back to console if container/logger not available
                this.logger = console;
            }
            
            this.logger.info('Fight Parser Service initialized');
            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }

    /**
     * Parse upcoming events from UFC events page
     * @param {string} html HTML content from UFC events page
     * @returns {Array<{href: string, text: string}>} Array of event links
     */
    parseEvents(html) {
        try {
            this.ensureInitialized();
            
            const parsedHTML = Cheerio.load(html);
            const links = [];

            // Look for upcoming events
            parsedHTML('.c-card-event--result__headline a, .c-card-event__headline a').each((_, element) => {
                const href = parsedHTML(element).attr('href');
                if (href) {
                    links.push({
                        href: href.startsWith('/') ? `${baseUrl}${href}` : href,
                        text: parsedHTML(element).text().trim()
                    });
                }
            });

            this.logger.debug(`Parsed ${links.length} event links`);
            return links;
        } catch (error) {
            this.handleError(error, 'parseEvents');
            return [];
        }
    }

    /**
     * Get the next upcoming event from list of event links
     * @param {Array<{href: string, text: string}>} eventLinks Array of event links
     * @returns {{href: string, text: string}|null} Next upcoming event or null
     */
    getNextUpcomingEvent(eventLinks) {
        try {
            this.ensureInitialized();
            
            // Currently, the first link should be the next upcoming event
            // Future enhancement: Add date parsing and sorting logic
            if (eventLinks && eventLinks.length > 0) {
                this.logger.debug(`Next upcoming event: ${eventLinks[0].text}`);
                return eventLinks[0];
            }
            
            this.logger.warn('No upcoming events found');
            return null;
        } catch (error) {
            this.handleError(error, 'getNextUpcomingEvent');
            return null;
        }
    }

    /**
     * Parse event details page
     * @param {string} html HTML content from event page
     * @param {{href: string, text: string}} eventLink Event link object
     * @returns {Event} Event object with details
     */
    parseEventDetails(html, eventLink) {
        try {
            this.ensureInitialized();
            
            const $ = Cheerio.load(html);
            const event = new Event();

            // Set the URL
            event.url = eventLink.href;

            // Parse title
            const titleText = $(titleClass).text().trim();
            event.title = titleText || eventLink.text;

            // Parse subtitle
            const subtitleText = $(subtitleClass).text().trim();
            event.subtitle = subtitleText;

            // Parse date
            const dateText = $(dateClass).text().trim();
            event.date = dateText;

            // Parse image URL
            const imgUrl = $(imgClass).attr('src');
            if (imgUrl) {
                event.imgUrl = imgUrl.startsWith('/') ? `${baseUrl}${imgUrl}` : imgUrl;
            }

            // Parse fights
            event.fights = this.parseFights($);
            
            this.logger.info(`Parsed event: ${event.title} with ${event.fights.length} fights`);
            return event;
        } catch (error) {
            this.handleError(error, 'parseEventDetails');
            return new Event();
        }
    }

    /**
     * Parse fights from event page
     * @param {CheerioAPI} $ Cheerio instance
     * @returns {Fight[]} Array of Fight objects
     */
    parseFights($) {
        try {
            this.ensureInitialized();
            
            const fights = [];
            $('.c-listing-fight').each((_, fightElement) => {
                try {
                    // Get corners
                    const corners = $(fightElement).find(fighterClass);
                    const ranks = $(fightElement).find(rankClass);
                    
                    // Get weight class
                    const weightClassText = $(fightElement).find(weightClass).text().trim();
                    
                    // Create fight object
                    const fight = new Fight(
                        new FightCorner(
                            $(corners[0]).text().trim(),
                            $(ranks[0]).text().trim()
                        ),
                        new FightCorner(
                            $(corners[1]).text().trim(),
                            $(ranks[1]).text().trim()
                        ),
                        weightClassText
                    );
                    
                    fights.push(fight);
                } catch (fightError) {
                    this.handleError(fightError, 'parseFights (single fight)');
                }
            });
            
            this.logger.debug(`Parsed ${fights.length} fights`);
            return fights;
        } catch (error) {
            this.handleError(error, 'parseFights');
            return [];
        }
    }
}

// Create and export a singleton instance
const fightParser = new FightParserService();
export { FightParserService, fightParser };
export default FightParserService;
