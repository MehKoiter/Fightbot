/**
 * UFC Service - Handles UFC API interactions and data processing
 * Uses the new service architecture
 */

import axios from 'axios';
import BaseService from './baseService.js';

class UfcService extends BaseService {
    constructor() {
        super();
        this.EVENTS_URL = 'https://www.ufc.com/events';
        this.FIGHTER_SEARCH_URL = 'https://www.ufc.com/athletes/all';
        this.ESPN_FIGHTER_STATS_URL = 'https://www.espn.com/mma/fighter/stats/_/name/';
        this.ESPN_FIGHTER_SEARCH_URL = 'https://www.espn.com/mma/fighters';
        this.UFC_SEARCH_URL = 'https://www.ufc.com/search?query=';
        
        this.cache = new Map();
        this.cacheTTL = 1000 * 60 * 30; // 30 minutes
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // Get dependencies from container
            const container = await import('./serviceContainer.js');
            this.container = container.default;
            
            // Initialize parser
            const { FightParserService } = await import('./fightParserService.js');
            this.parser = new FightParserService();

            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }

    /**
     * Fetch data from a URL with caching
     * @param {string} url - URL to fetch
     * @returns {Promise<string|null>} - HTML content or null if error
     */
    async fetchData(url) {
        try {
            // Check cache first
            const now = Date.now();
            const cachedData = this.cache.get(url);
            
            if (cachedData && now - cachedData.timestamp < this.cacheTTL) {
                return cachedData.data;
            }
            
            const response = await axios.get(url);
            
            if (response.status === 200) {
                // Store in cache
                this.cache.set(url, {
                    data: response.data,
                    timestamp: now
                });
                return response.data;
            }
            
            return null;
        } catch (error) {
            this.handleError(error, 'fetchData');
            return null;
        }
    }

    /**
     * Fetch upcoming UFC events
     * @returns {Promise<string|undefined>} HTML content or undefined if error
     */
    async fetchEvents() {
        this.ensureInitialized();
        return this.fetchData(this.EVENTS_URL);
    }

    /**
     * Get the next upcoming UFC event with full details
     * @returns {Promise<Object|null>} Event object with fights and details or null if error
     */
    async getUpcomingEvent() {
        try {
            this.ensureInitialized();
            
            // Get the logger service if available
            let logger;
            try {
                logger = this.container.get('logger');
            } catch (e) {
                // Fall back to console if logger not available
                logger = console;
            }
            
            logger.info('Fetching UFC events...');
            
            // Get the events page
            const eventsHtml = await this.fetchEvents();
            if (!eventsHtml) {
                logger.error('Failed to fetch events page');
                return null;
            }

            // Parse event links
            const eventLinks = this.parser.parseEvents(eventsHtml);
            logger.info(`Found ${eventLinks.length} event links`);

            if (eventLinks.length === 0) {
                logger.warn('No upcoming events found');
                return null;
            }

            // Get the next upcoming event
            const upcomingEventLink = this.parser.getNextUpcomingEvent(eventLinks);
            if (!upcomingEventLink) {
                logger.warn('No upcoming event link found');
                return null;
            }

            // Get the event details
            const eventHtml = await this.fetchData(upcomingEventLink.href);
            if (!eventHtml) {
                logger.error('Failed to fetch event details');
                return null;
            }

            // Parse the event details
            const event = this.parser.parseEventDetails(eventHtml, upcomingEventLink);
            
            return event;
        } catch (error) {
            this.handleError(error, 'getUpcomingEvent');
            return null;
        }
    }

    /**
     * Get fighter details by name
     * @param {string} name - Fighter name
     * @returns {Promise<Object|null>} Fighter details or null if error/not found
     */
    async getFighterByName(name) {
        try {
            this.ensureInitialized();
            
            // Implementation will be added in a future PR
            return null;
        } catch (error) {
            this.handleError(error, 'getFighterByName');
            return null;
        }
    }

    /**
     * Clear the service cache
     */
    clearCache() {
        this.cache.clear();
    }
}

export default UfcService;
