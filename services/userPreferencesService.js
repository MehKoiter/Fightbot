/**
 * User Preferences Service
 * Manages user preferences and settings for premium features
 */

class UserPreferencesService {
    constructor() {
        // In-memory storage for demo purposes
        // In production, this would connect to a database
        this.userPreferences = new Map();
    }

    // Get user preferences
    getUserPreferences(userId) {
        return this.userPreferences.get(userId) || this.getDefaultPreferences();
    }

    // Set user preferences
    setUserPreferences(userId, preferences) {
        const currentPrefs = this.getUserPreferences(userId);
        const updatedPrefs = { ...currentPrefs, ...preferences };
        this.userPreferences.set(userId, updatedPrefs);
        return updatedPrefs;
    }

    // Get default preferences for new users
    getDefaultPreferences() {
        return {
            // Notification preferences
            notifications: {
                fightResults: true,
                oddsChanges: false,
                favoritesFights: true,
                eventReminders: true,
                breakingNews: false
            },

            // Display preferences
            display: {
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                temperatureUnit: 'F',
                showSpoilers: true,
                compactMode: false
            },

            // Analytics preferences
            analytics: {
                showProbabilities: true,
                showTrends: true,
                showComparisons: true,
                detailLevel: 'standard', // basic, standard, advanced
                includeHistorical: true
            },

            // Betting preferences
            betting: {
                showOdds: true,
                preferredSportsbooks: ['DraftKings', 'FanDuel', 'BetMGM'],
                oddsFormat: 'american', // american, decimal, fractional
                showMovement: true,
                alertThreshold: 0.1 // 10% odds movement
            },

            // Favorite fighters/events
            favorites: {
                fighters: [],
                weightClasses: [],
                organizations: ['UFC'],
                venues: []
            },

            // Data export preferences
            export: {
                format: 'json', // json, csv, pdf
                includeImages: false,
                includeAnalytics: true,
                compression: true
            }
        };
    }

    // Add favorite fighter
    addFavoriteFighter(userId, fighterName) {
        const prefs = this.getUserPreferences(userId);
        if (!prefs.favorites.fighters.includes(fighterName)) {
            prefs.favorites.fighters.push(fighterName);
            this.setUserPreferences(userId, prefs);
        }
        return prefs.favorites.fighters;
    }

    // Remove favorite fighter
    removeFavoriteFighter(userId, fighterName) {
        const prefs = this.getUserPreferences(userId);
        const index = prefs.favorites.fighters.indexOf(fighterName);
        if (index > -1) {
            prefs.favorites.fighters.splice(index, 1);
            this.setUserPreferences(userId, prefs);
        }
        return prefs.favorites.fighters;
    }

    // Check if user should receive notification
    shouldNotify(userId, notificationType) {
        const prefs = this.getUserPreferences(userId);
        return prefs.notifications[notificationType] === true;
    }

    // Get user's preferred sportsbooks
    getPreferredSportsbooks(userId) {
        const prefs = this.getUserPreferences(userId);
        return prefs.betting.preferredSportsbooks;
    }

    // Get user's odds format preference
    getOddsFormat(userId) {
        const prefs = this.getUserPreferences(userId);
        return prefs.betting.oddsFormat;
    }

    // Get user's timezone
    getTimezone(userId) {
        const prefs = this.getUserPreferences(userId);
        return prefs.display.timezone;
    }

    // Update notification preferences
    updateNotificationPreferences(userId, notifications) {
        const prefs = this.getUserPreferences(userId);
        prefs.notifications = { ...prefs.notifications, ...notifications };
        this.setUserPreferences(userId, prefs);
        return prefs.notifications;
    }

    // Get analytics detail level
    getAnalyticsDetailLevel(userId) {
        const prefs = this.getUserPreferences(userId);
        return prefs.analytics.detailLevel;
    }

    // Export user preferences
    exportPreferences(userId) {
        const prefs = this.getUserPreferences(userId);
        return {
            userId,
            preferences: prefs,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Import user preferences
    importPreferences(userId, importedData) {
        if (importedData.version === '1.0.0' && importedData.preferences) {
            this.setUserPreferences(userId, importedData.preferences);
            return true;
        }
        return false;
    }

    // Get all users with specific notification enabled
    getUsersWithNotification(notificationType) {
        const users = [];
        for (const [userId, prefs] of this.userPreferences.entries()) {
            if (prefs.notifications[notificationType] === true) {
                users.push(userId);
            }
        }
        return users;
    }

    // Get users who have a specific fighter as favorite
    getUsersWithFavoriteFighter(fighterName) {
        const users = [];
        for (const [userId, prefs] of this.userPreferences.entries()) {
            if (prefs.favorites.fighters.includes(fighterName)) {
                users.push(userId);
            }
        }
        return users;
    }
}

export default UserPreferencesService;
