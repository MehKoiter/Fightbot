/**
 * Service Registration - Register all services with the container
 */

import container from './serviceContainer.js';
import ConfigService from './configService.js';
import UfcService from './ufcService.js';
import { eventCache } from './eventCacheService.js';
import { fightParser } from './fightParserService.js';
import { analytics } from './commandAnalyticsService.js';
import { interactionHandler } from './interactionHandlerService.js';

// Import logger and error handler
import logger from '../utils/logger.js';
import errorHandler from '../utils/errorHandler.js';

/**
 * Register all services with the container
 */
export async function registerServices() {
    // Register logger first
    container.register('logger', () => logger, true);
    
    // Register config service
    container.register('config', () => new ConfigService(), true);
    
    // Register UFC service
    container.register('ufc', () => new UfcService(), true);
    
    // Register event cache service
    container.register('eventCache', () => eventCache, true);
    
    // Register fight parser service
    container.register('fightParser', () => fightParser, true);
    
    // Register analytics service
    container.register('analytics', () => analytics, true);
    
    // Register interaction handler service
    container.register('interactionHandler', () => interactionHandler, true);
    
    // Register error handler service
    container.register('errorHandler', () => errorHandler, true);
    
    // Initialize all services
    await container.initializeAll();
    
    return container;
}

export default container;
