/**
 * Enhanced in-memory cache for storing event data temporarily
 * Features TTL, memory monitoring, LRU eviction, and performance metrics
 * In production, consider Redis or a database for distributed caching
 */

import { memoryManager } from '../utils/memoryManager.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';

class EventCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30 minutes TTL
        this.maxSize = 100; // Maximum number of cached items
        this.maxMemorySize = 50 * 1024 * 1024; // 50MB max cache size
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0,
            cleanups: 0,
            memoryEvictions: 0
        };
        
        // Periodic cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
        
        // Memory pressure cleanup every minute
        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryPressure();
        }, 60 * 1000);
        
        // Register with memory manager for cleanup events
        if (memoryManager) {
            memoryManager.registerGCCallback((level) => {
                if (level === 'critical' || level === 'emergency') {
                    this.aggressiveCleanup();
                }
            });
        }
        
        console.log('💾 Enhanced EventCache initialized with memory monitoring');
    }

    /**
     * Store event data with a key
     * @param {string} key Cache key (usually interaction user ID + channel ID)
     * @param {Object} eventData Event data to store
     */
    set(key, eventData) {
        const endTiming = performanceMonitor?.startTiming('cache', 'set');
        
        try {
            // Check if we need to evict entries due to size limit
            if (this.cache.size >= this.maxSize) {
                this.evictOldest();
            }
            
            // Check memory pressure before adding new entry
            this.checkMemoryPressure();
            
            const expiresAt = Date.now() + this.ttl;
            const dataSize = this.estimateSize(eventData);
            
            // Don't cache very large objects
            if (dataSize > 5 * 1024 * 1024) { // 5MB limit per entry
                console.warn(`⚠️ Cache entry too large (${(dataSize / 1024 / 1024).toFixed(2)}MB), skipping: ${key}`);
                return false;
            }
            
            this.cache.set(key, {
                data: eventData,
                expiresAt,
                createdAt: Date.now(),
                size: dataSize,
                accessCount: 0,
                lastAccessed: Date.now()
            });
            
            this.stats.sets++;
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`💾 Cache SET - Key: ${key}, Data: ${eventData?.title || 'Unknown'}, Size: ${dataSize}B, Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
            }
            
            // Clean up expired entries occasionally
            if (this.stats.sets % 10 === 0) {
                this.cleanup();
            }
            
            endTiming?.({ success: true, keyLength: key.length, dataSize });
            return true;
            
        } catch (error) {
            console.error('Cache set error:', error.message);
            endTiming?.({ success: false, error: error.message });
            return false;
        }
    }

    /**
     * Retrieve event data by key
     * @param {string} key Cache key
     * @returns {Object|null} Event data or null if not found/expired
     */
    get(key) {
        const endTiming = performanceMonitor?.startTiming('cache', 'get');
        
        try {
            const entry = this.cache.get(key);
            
            if (!entry) {
                this.stats.misses++;
                if (process.env.NODE_ENV === 'development') {
                    console.log(`🔍 Cache MISS - Key: ${key} not found`);
                }
                endTiming?.({ success: false, hit: false });
                return null;
            }

            if (Date.now() > entry.expiresAt) {
                this.stats.misses++;
                if (process.env.NODE_ENV === 'development') {
                    console.log(`⏰ Cache EXPIRED - Key: ${key} expired at ${new Date(entry.expiresAt).toLocaleTimeString()}`);
                }
                this.cache.delete(key);
                endTiming?.({ success: false, hit: false, expired: true });
                return null;
            }

            // Update access statistics
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            this.stats.hits++;
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Cache HIT - Key: ${key}, Data: ${entry.data?.title || 'Unknown'}, Access: ${entry.accessCount}`);
            }
            
            endTiming?.({ success: true, hit: true, accessCount: entry.accessCount });
            return entry.data;
            
        } catch (error) {
            console.error('Cache get error:', error.message);
            endTiming?.({ success: false, error: error.message });
            return null;
        }
    }

    /**
     * Check for memory pressure and clean up if needed
     */
    checkMemoryPressure() {
        const totalSize = this.getTotalSize();
        
        if (totalSize > this.maxMemorySize) {
            console.warn(`💾 Cache memory pressure: ${(totalSize / 1024 / 1024).toFixed(2)}MB, cleaning up...`);
            this.memoryPressureCleanup();
        }
    }

    /**
     * Get total cache size in bytes
     * @returns {number} Total size in bytes
     */
    getTotalSize() {
        let totalSize = 0;
        for (const entry of this.cache.values()) {
            totalSize += entry.size || 0;
        }
        return totalSize;
    }

    /**
     * Aggressive cleanup for memory pressure
     */
    memoryPressureCleanup() {
        const beforeSize = this.cache.size;
        const targetSize = Math.floor(this.maxSize * 0.7); // Keep only 70%
        
        // Convert to array and sort by last accessed time
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        // Remove oldest entries
        let removed = 0;
        while (this.cache.size > targetSize && removed < entries.length) {
            const [key] = entries[removed];
            this.cache.delete(key);
            removed++;
            this.stats.memoryEvictions++;
        }
        
        console.log(`🧹 Memory pressure cleanup: removed ${beforeSize - this.cache.size} entries`);
    }

    /**
     * Clean up expired cache entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        this.stats.cleanups++;
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
        }
    }

    /**
     * Aggressive cleanup for critical memory situations
     */
    aggressiveCleanup() {
        const beforeSize = this.cache.size;
        
        // Remove all but the most recently accessed 20% of entries
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
        
        const keepCount = Math.floor(entries.length * 0.2);
        this.cache.clear();
        
        // Keep only the most recent entries
        for (let i = 0; i < keepCount && i < entries.length; i++) {
            const [key, entry] = entries[i];
            this.cache.set(key, entry);
        }
        
        console.log(`🆘 Aggressive cleanup: kept ${keepCount}/${beforeSize} entries`);
    }

    /**
     * Evict the oldest entry (LRU style)
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            if (process.env.NODE_ENV === 'development') {
                console.log(`♻️ Cache eviction: removed oldest entry ${oldestKey}`);
            }
        }
    }

    /**
     * Estimate the memory size of an object
     * @param {Object} obj Object to estimate
     * @returns {number} Estimated size in bytes
     */
    estimateSize(obj) {
        try {
            const str = JSON.stringify(obj);
            return str.length * 2; // UTF-16 encoding
        } catch {
            return 1000; // Default estimate for unparseable objects
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache performance statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
            : '0.0';

        const totalSize = this.getTotalSize();

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            totalEntries: this.cache.size,
            estimatedSizeBytes: totalSize,
            estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            maxSize: this.maxSize,
            maxMemoryMB: (this.maxMemorySize / 1024 / 1024).toFixed(2),
            memoryUtilization: `${((totalSize / this.maxMemorySize) * 100).toFixed(1)}%`
        };
    }

    /**
     * Log cache statistics
     */
    logStats() {
        const stats = this.getStats();
        console.log('📊 Cache Statistics:', {
            entries: stats.totalEntries,
            hits: stats.hits,
            misses: stats.misses,
            hitRate: stats.hitRate,
            size: `${stats.estimatedSizeMB}MB`,
            utilization: stats.memoryUtilization,
            evictions: stats.evictions,
            memoryEvictions: stats.memoryEvictions,
            cleanups: stats.cleanups
        });
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const count = this.cache.size;
        this.cache.clear();
        console.log(`🗑️ Cache cleared: removed ${count} entries`);
    }

    /**
     * Destroy the cache and cleanup intervals
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
        }
        this.clear();
        console.log('💥 Cache destroyed');
    }

    /**
     * Get cache key for an interaction
     * @param {import('discord.js').BaseInteraction} interaction 
     * @returns {string}
     */
    static getKey(interaction) {
        return `${interaction.user.id}_${interaction.channelId}`;
    }

    /**
     * Preload data into cache
     * @param {string} key - Cache key
     * @param {Promise} dataPromise - Promise that resolves to data
     * @returns {Promise} Promise that resolves when data is cached
     */
    async preload(key, dataPromise) {
        try {
            const data = await dataPromise;
            this.set(key, data);
            return data;
        } catch (error) {
            console.error(`Failed to preload cache key ${key}:`, error.message);
            throw error;
        }
    }

    /**
     * Get or set pattern - get from cache or compute and cache
     * @param {string} key - Cache key
     * @param {Function} computeFn - Function to compute value if not cached
     * @param {number} customTTL - Custom TTL for this entry
     * @returns {Promise} Promise that resolves to cached or computed value
     */
    async getOrSet(key, computeFn, customTTL = null) {
        // Try to get from cache first
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        // Compute value
        try {
            const value = await computeFn();
            
            // Cache with custom TTL if provided
            if (customTTL !== null) {
                const originalTTL = this.ttl;
                this.ttl = customTTL;
                this.set(key, value);
                this.ttl = originalTTL;
            } else {
                this.set(key, value);
            }
            
            return value;
        } catch (error) {
            console.error(`Failed to compute value for cache key ${key}:`, error.message);
            throw error;
        }
    }

    /**
     * Check if cache is healthy
     * @returns {boolean} True if cache is healthy
     */
    isHealthy() {
        const stats = this.getStats();
        const totalSize = parseInt(stats.estimatedSizeMB);
        const maxSize = parseInt(stats.maxMemoryMB);
        
        return (
            totalSize < maxSize * 0.9 && // Less than 90% of max memory
            stats.totalEntries < this.maxSize * 0.9 && // Less than 90% of max entries
            parseFloat(stats.hitRate) > 30 // Hit rate above 30%
        );
    }
}

// Export a singleton instance
export const eventCache = new EventCache();

// Make available globally for memory manager
global.eventCache = eventCache;
