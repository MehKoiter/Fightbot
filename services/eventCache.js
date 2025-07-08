/**
 * Simple in-memory cache for storing event data temporarily
 * In production, you might want to use Redis or a database
 */
class EventCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30 minutes TTL
    }

    /**
     * Store event data with a key
     * @param {string} key Cache key (usually interaction user ID + channel ID)
     * @param {Object} eventData Event data to store
     */
    set(key, eventData) {
        const expiresAt = Date.now() + this.ttl;
        this.cache.set(key, {
            data: eventData,
            expiresAt
        });
        
        console.log(`💾 Cache SET - Key: ${key}, Data: ${eventData?.title || 'Unknown'}, Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
        
        // Clean up expired entries
        this.cleanup();
    }

    /**
     * Retrieve event data by key
     * @param {string} key Cache key
     * @returns {Object|null} Event data or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            console.log(`🔍 Cache MISS - Key: ${key} not found`);
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            console.log(`⏰ Cache EXPIRED - Key: ${key} expired at ${new Date(entry.expiresAt).toLocaleTimeString()}`);
            this.cache.delete(key);
            return null;
        }

        console.log(`✅ Cache HIT - Key: ${key}, Data: ${entry.data?.title || 'Unknown'}`);
        return entry.data;
    }

    /**
     * Clean up expired cache entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache key for an interaction
     * @param {import('discord.js').BaseInteraction} interaction 
     * @returns {string}
     */
    static getKey(interaction) {
        return `${interaction.user.id}_${interaction.channelId}`;
    }
}

// Export a singleton instance
export const eventCache = new EventCache();
