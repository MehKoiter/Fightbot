/**
 * FightBot Version Configuration
 * 
 * This file defines the features available in FightBot - ALL FREE!
 */

export const VERSION_CONFIG = {
    // Current version info
    version: "1.7.0-free",
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
        
        // Phase 7: Advanced Fighter Features (NEW!)
        fighterProfiles: true,
        fighterComparison: true,
        fightingStyleAnalysis: true,
        fightPredictions: true,
        fighterHighlights: true,
        advancedFighterStats: true,
        fighterSearch: true,
        
        // Advanced features (now FREE for everyone!)
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
    
    // Generous limits for free version
    limits: {
        maxEventsPerQuery: 10,
        maxFightsDisplayed: 50,
        maxAnalysisDepth: "advanced",
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
        requestsPerHour: 1000
    },
    
    // Messages
    messages: {
        freeVersionFooter: "FightBot - Free Forever! ❤️",
        premiumFooter: "FightBot - Free Forever! Support us on Patreon ❤️",
        premiumPromotion: "❤️ **Support FightBot** on Patreon to help fund development and keep all features free!",
        featureDisabled: "🎉 This feature is FREE and available to everyone!"
    }
};

// Helper functions
export const isFeatureEnabled = (featureName) => {
    return VERSION_CONFIG.features[featureName] === true;
};

export const isPremium = () => {
    // Everything is free now, but return true to enable all features
    return true;
};

export const isFree = () => {
    // Everything is free, but we keep this for compatibility
    return true;
};
