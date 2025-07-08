/**
 * FightBot Version Configuration
 * 
 * This file defines the features available in FightBot - ALL FREE!
 */

export const VERSION_CONFIG = {
    // Current version info
    version: "1.0.0-free",
    type: "FREE", // All features are now FREE
    
    // Feature flags - ALL ENABLED FOR FREE
    features: {
        // Core features (available for everyone)
        basicFightCard: true,
        upcomingEvents: true,
        fightAnalysis: true,
        fighterRecords: true,
        venueInfo: true,
        fightTimes: true,
        refreshData: true,
        
        // Advanced features (now FREE for everyone!)
        detailedStats: true,
        predictionAlerts: true,
        customNotifications: true,
        advancedAnalytics: true,
        historicalData: true,
        betOddsTracking: true,
        multiEventTracking: true,
        exportData: true,
        premiumSupport: true,
        
        // Premium features (now FREE for everyone!)
        fightPredictions: true,
        realtimeBetUpdates: true,
        fighterAlerts: true,
        betAlerts: true,
        customDashboard: true,
        dataSources: true,
        api: true
    },
    
    // Messages
    messages: {
        freeVersionFooter: "FightBot - All Premium Features Are Now FREE!",
        upgradeMessage: "", // No longer needed since everything is free
        supportMessage: "Need help? Use /support to get assistance!",
        welcomeMessage: "Welcome to FightBot - Your UFC fight companion!",
        donationMessage: "FightBot is free, but you can support development on Patreon!",
        betaMessage: "New features are being developed. Stay tuned!"
    }
};
