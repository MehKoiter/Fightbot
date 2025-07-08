/**
 * FightBot - New entry point that uses the new architecture
 * 
 * This file can be used to gradually migrate to the new architecture
 * while maintaining backward compatibility with the current codebase.
 */

import FightBotApp from './core/fightBotApp.js';

// Create and start the application
const app = new FightBotApp();

// Get logger
let logger;

// Initialize and start the application
(async () => {
    try {
        await app.init();
        // Retrieve logger after initialization
        logger = app.container.get('logger');
        
        // Set up global error handlers with logger
        process.on('uncaughtException', (error) => {
            if (logger) {
                logger.error('Uncaught Exception:', error);
            } else {
                console.error('Uncaught Exception:', error);
            }
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            if (logger) {
                logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            } else {
                console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            }
        });
        
        await app.start();
    } catch (error) {
        if (logger) {
            logger.error('Failed to start FightBot:', error);
        } else {
            console.error('Failed to start FightBot:', error);
        }
        process.exit(1);
    }
})();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    if (logger) {
        logger.info('Received SIGINT. Shutting down gracefully...');
    } else {
        console.log('Received SIGINT. Shutting down gracefully...');
    }
    await app.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (logger) {
        logger.info('Received SIGTERM. Shutting down gracefully...');
    } else {
        console.log('Received SIGTERM. Shutting down gracefully...');
    }
    await app.shutdown();
    process.exit(0);
});
