/**
 * Service Container - Dependency Injection for FightBot
 * This provides a centralized way to manage service instances
 */

class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.initializers = new Map();
    }

    /**
     * Register a service with the container
     * @param {string} name - The service name
     * @param {Function} factory - Factory function that returns service instance
     * @param {boolean} singleton - Whether to create only one instance
     */
    register(name, factory, singleton = true) {
        this.initializers.set(name, { factory, singleton });
    }

    /**
     * Get a service from the container
     * @param {string} name - The service name
     * @returns {Object} - Service instance
     */
    get(name) {
        // If it's a singleton and already instantiated, return existing instance
        if (this.services.has(name)) {
            return this.services.get(name);
        }

        const initializer = this.initializers.get(name);
        if (!initializer) {
            throw new Error(`Service '${name}' not registered`);
        }

        // Create new instance
        const instance = initializer.factory(this);
        
        // Store if singleton
        if (initializer.singleton) {
            this.services.set(name, instance);
        }
        
        return instance;
    }

    /**
     * Initialize all registered services
     * @returns {Promise<void>}
     */
    async initializeAll() {
        for (const [name, initializer] of this.initializers.entries()) {
            const service = initializer.factory(this);
            if (initializer.singleton) {
                this.services.set(name, service);
            }
            
            // If service has an init method, call it
            if (service.init && typeof service.init === 'function') {
                try {
                    await service.init();
                    console.log(`✅ Service initialized: ${name}`);
                } catch (error) {
                    console.error(`❌ Error initializing service ${name}:`, error);
                }
            }
        }
    }
}

// Create and export a singleton instance
const container = new ServiceContainer();
export default container;
