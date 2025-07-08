/**
 * FightBot Version Configuration
 * 
 * This file defines the features available in different versions of FightBot
 */

export const VERSION_CONFIG = {
    // Current version info
    version: "1.0.0-free",
    type: "FREE", // FREE or PREMIUM
    
    // Feature flags
    features: {
        // Core features (available in both versions)
        basicFightCard: true,
        upcomingEvents: true,
        fightAnalysis: true,
        fighterRecords: true,
        venueInfo: true,
        fightTimes: true,
        refreshData: true,
        
        // Premium features (disabled in free version)
        detailedStats: false,
        predictionAlerts: false,
        customNotifications: false,
        advancedAnalytics: false,
        historicalData: false,
        betOddsTracking: false,
        multiEventTracking: false,
        personalizedFeed: false,
        exportData: false,
        premiumSupport: false
    },
    
    // Limits for free version
    limits: {
        maxEventsPerQuery: 1,
        maxFightsDisplayed: 5,
        maxAnalysisDepth: "basic",
        cacheTimeout: 30 * 60 * 1000, // 30 minutes
        requestsPerHour: 100
    },
    
    // Messages
    messages: {
        freeVersionFooter: "FightBot Free • Upgrade to Premium for more features",
        premiumPromotion: "🌟 **Upgrade to FightBot Premium** for advanced analytics, detailed stats, and more! Contact support for pricing.",
        featureDisabled: "🔒 This feature is available in FightBot Premium only."
    }
};

// Helper functions
export const isFeatureEnabled = (featureName) => {
    return VERSION_CONFIG.features[featureName] === true;
};

export const isPremium = () => {
    return VERSION_CONFIG.type === "PREMIUM";
};

export const isFree = () => {
    return VERSION_CONFIG.type === "FREE";
};
