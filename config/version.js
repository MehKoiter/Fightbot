/**
 * FightBot Version Configuration
 * 
 * This file defines the features available in different versions of FightBot
 */

export const VERSION_CONFIG = {
    // Current version info
    version: "1.0.0-premium",
    type: "PREMIUM", // FREE or PREMIUM
    
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
        
        // Premium features (enabled in premium version)
        detailedStats: true,
        predictionAlerts: true,
        customNotifications: true,
        advancedAnalytics: true,
        historicalData: true,
        betOddsTracking: true,
        multiEventTracking: true,
        personalizedFeed: true,
        exportData: true,
        premiumSupport: true
    },
    
    // Limits for premium version
    limits: {
        maxEventsPerQuery: 10,
        maxFightsDisplayed: 50,
        maxAnalysisDepth: "advanced",
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
        requestsPerHour: 1000
    },
    
    // Messages
    messages: {
        freeVersionFooter: "FightBot Free • Upgrade to Premium for more features",
        premiumFooter: "FightBot Premium • Thank you for your support!",
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
