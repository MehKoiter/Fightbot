/**
 * User Preferences Service for FightBot
 * Manages user preferences and settings
 */

class UserPreferencesService {
    constructor() {
        this.preferences = new Map();
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        console.log('✅ User preferences service initialized');
    }

    /**
     * Get preferences for a user
     * @param {string} userId - The Discord user ID
     * @returns {Object} - User preferences object
     */
    async getUserPreferences(userId) {
        if (!this.preferences.has(userId)) {
            // Return default preferences if none exist
            return this._getDefaultPreferences();
        }
        return this.preferences.get(userId);
    }

    /**
     * Update preferences for a user
     * @param {string} userId - The Discord user ID
     * @param {Object} preferences - The preferences to update
     * @returns {Promise<Object>} - Updated preferences
     */
    async updateUserPreferences(userId, preferences) {
        const current = this.preferences.has(userId) 
            ? this.preferences.get(userId)
            : this._getDefaultPreferences();
            
        const updated = {
            ...current,
            ...preferences,
            lastUpdated: new Date()
        };
        
        this.preferences.set(userId, updated);
        return updated;
    }

    /**
     * Get default preferences for new users
     * @private
     * @returns {Object} - Default preferences
     */
    _getDefaultPreferences() {
        return {
            notifications: {
                enabled: true,
                fightAnnouncements: true,
                resultAlerts: true,
                favoritesFocus: true,
                oddsChanges: false
            },
            display: {
                showBettingOdds: true,
                detailedFighterStats: true,
                compactView: false,
                theme: 'default'
            },
            favorites: {
                fighters: [],
                events: [],
                weightClasses: []
            },
            created: new Date(),
            lastUpdated: new Date()
        };
    }

    /**
     * Get a list of all users with preferences
     * @returns {Array<string>} - User IDs
     */
    async getAllUsers() {
        return Array.from(this.preferences.keys());
    }

    /**
     * Delete a user's preferences
     * @param {string} userId - The Discord user ID
     * @returns {Promise<boolean>} - Whether the deletion was successful
     */
    async deleteUser(userId) {
        return this.preferences.delete(userId);
    }
}

export { UserPreferencesService as default };
