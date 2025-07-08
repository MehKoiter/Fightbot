/**
 * UFC Service - Handles UFC data fetching and processing
 * Provides interface to UFC event information
 */

import BaseService from '../baseService.js';
import ufcApi from './ufcApi.js';

class UFCService extends BaseService {
    constructor() {
        super();
        this.ufcApi = ufcApi;
        this.initialized = false;
    }

    /**
     * Initialize the UFC service
     * @returns {Promise<void>}
     */
    async init() {
        this.config = this.container.get('config');
        this.logger = this.container.get('logger');
        this.initialized = true;
        this.logger.info('UFC service initialized');
    }

    /**
     * Get upcoming UFC event
     * @returns {Promise<Object>} - Event data
     */
    async getUpcomingEvent() {
        this.ensureInitialized();
        
        try {
            this.logger.info('Fetching upcoming UFC event data');
            const eventData = await this.ufcApi.getUpcomingEvent();
            
            if (!eventData) {
                throw new Error('Failed to fetch event data');
            }
            
            return eventData;
        } catch (error) {
            this.logger.error('Error fetching UFC event data:', error);
            
            // Fallback to placeholder data in case of error
            return {
                name: "UFC: UPCOMING EVENT",
                date: "TBA",
                venue: "To Be Announced",
                mainCard: [
                    {
                        fighter1: "Fighter 1",
                        fighter2: "Fighter 2",
                        weightClass: "Main Event",
                        isTitle: true
                    }
                ],
                prelimCard: []
            };
        }
    }

    /**
     * Get fighter information
     * @param {string} fighterName - Fighter name
     * @returns {Promise<Object>} - Fighter data
     */
    async getFighterInfo(fighterName) {
        this.ensureInitialized();
        
        try {
            this.logger.debug(`Fetching fighter info for: ${fighterName}`);
            return await this.ufcApi.getFighterInfo(fighterName);
        
            
        } catch (error) {
            this.logger.error(`Error fetching fighter info for ${fighterName}:`, error);
            
            // Return placeholder data as fallback
            return {
                name: fighterName,
                record: "N/A",
                age: "N/A",
                height: "N/A",
                weight: "N/A",
                reach: "N/A",
                stance: "N/A",
                lastFight: "No recent fights found"
            };
        }
    }
    
    /**
     * Get UFC events list
     * @returns {Promise<string[]>} - List of event URLs
     */
    async getEvents() {
        this.ensureInitialized();
        
        try {
            this.logger.info('Fetching UFC events list');
            return await this.ufcApi.getEvents();
        } catch (error) {
            this.logger.error('Error fetching UFC events list:', error);
            throw error;
        }
    }
    
    /**
     * Fetch data from specified URL using the ufcApi
     * @param {string} url - URL to fetch
     * @returns {Promise<string|null>} - Response data or null
     */
    async fetchData(url) {
        try {
            return await this.ufcApi.fetchData(url);
        } catch (error) {
            this.logger.error(`Failed to fetch data from ${url}:`, error?.message || error);
            return null;
        }
    }
    
    /**
     * Helper to ensure the service is initialized
     * @private
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('UFC service not initialized');
        }
    }
}

export default UFCService;
