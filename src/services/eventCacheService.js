/**
 * Event Cache Service - Simple in-memory cache for storing event data temporarily
 * Migrated to use the new BaseService class
 */

import BaseService from './baseService.js';

class EventCacheService extends BaseService {
    constructor() {
        super();
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30 minutes TTL
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
            
            this.logger.info('Event Cache Service initialized');
            await super.init();
        } catch (error) {
            this.handleError(error, 'init', true);
        }
    }

    /**
     * Store event data with a key
     * @param {string} key Cache key (usually interaction user ID + channel ID)
     * @param {Object} eventData Event data to store
     */
    set(key, eventData) {
        try {
            this.ensureInitialized();
            
            const expiresAt = Date.now() + this.ttl;
            this.cache.set(key, {
                data: eventData,
                expiresAt
            });
            
            this.logger.info(`Cache SET - Key: ${key}, Data: ${eventData?.title || 'Unknown'}, Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
            
            // Clean up expired entries
            this.cleanup();
        } catch (error) {
            this.handleError(error, 'set');
        }
    }

    /**
     * Retrieve event data by key
     * @param {string} key Cache key
     * @returns {Object|null} Event data or null if not found/expired
     */
    get(key) {
        try {
            this.ensureInitialized();
            
            const entry = this.cache.get(key);
            
            if (!entry) {
                this.logger.debug(`Cache MISS - Key: ${key} not found`);
                return null;
            }

            if (Date.now() > entry.expiresAt) {
                this.logger.debug(`Cache EXPIRED - Key: ${key} expired at ${new Date(entry.expiresAt).toLocaleTimeString()}`);
                this.cache.delete(key);
                return null;
            }

            this.logger.debug(`Cache HIT - Key: ${key}, Data: ${entry.data?.title || 'Unknown'}`);
            return entry.data;
        } catch (error) {
            this.handleError(error, 'get');
            return null;
        }
    }

    /**
     * Delete a specific cache entry
     * @param {string} key Cache key to delete
     */
    delete(key) {
        try {
            this.ensureInitialized();
            
            const deleted = this.cache.delete(key);
            
            if (deleted) {
                this.logger.debug(`Cache DELETE - Key: ${key} removed`);
            } else {
                this.logger.debug(`Cache DELETE - Key: ${key} not found`);
            }
            
            return deleted;
        } catch (error) {
            this.handleError(error, 'delete');
            return false;
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        try {
            this.ensureInitialized();
            
            const size = this.cache.size;
            this.cache.clear();
            
            this.logger.info(`Cache CLEAR - Removed ${size} entries`);
        } catch (error) {
            this.handleError(error, 'clear');
        }
    }

    /**
     * Clean up expired cache entries
     */
    cleanup() {
        try {
            this.ensureInitialized();
            
            const now = Date.now();
            let expiredCount = 0;
            
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                    expiredCount++;
                }
            }
            
            if (expiredCount > 0) {
                this.logger.debug(`Cache CLEANUP - Removed ${expiredCount} expired entries`);
            }
        } catch (error) {
            this.handleError(error, 'cleanup');
        }
    }
}

// Create and export a singleton instance
const eventCache = new EventCacheService();
export { eventCache };
export default EventCacheService;
