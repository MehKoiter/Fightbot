/**
 * Base Service Class - Parent class for all FightBot services
 * Provides common functionality and standard interface
 */

class BaseService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        this.initialized = true;
    }

    /**
     * Check if service is initialized
     * @throws {Error} if service is not initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error(`Service ${this.constructor.name} is not initialized`);
        }
    }

    /**
     * Handle errors in a standardized way
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     * @param {boolean} rethrow - Whether to rethrow the error
     */
    handleError(error, context, rethrow = false) {
        console.error(`Error in ${this.constructor.name}.${context}:`, error);
        
        if (rethrow) {
            throw error;
        }
    }
}

export default BaseService;
