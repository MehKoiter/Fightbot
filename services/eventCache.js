/**
 * Enhanced in-memory cache for storing event data temporarily
 * Features TTL, memory monitoring, and performance metrics
 * In production, consider Redis or a database for distributed caching
 */
class EventCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 30 * 60 * 1000; // 30 minutes TTL
    this.maxSize = 100; // Maximum number of cached items
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      cleanups: 0,
    };

    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    console.log("💾 EventCache initialized with enhanced monitoring");
  }

  /**
   * Store event data with a key
   * @param {string} key Cache key (usually interaction user ID + channel ID)
   * @param {Object} eventData Event data to store
   */
  set(key, eventData) {
    // Check if we need to evict entries due to size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + this.ttl;
    const dataSize = this.estimateSize(eventData);

    this.cache.set(key, {
      data: eventData,
      expiresAt,
      createdAt: Date.now(),
      size: dataSize,
      accessCount: 0,
      lastAccessed: Date.now(),
    });

    this.stats.sets++;

    console.log(
      `💾 Cache SET - Key: ${key}, Data: ${
        eventData?.title || "Unknown"
      }, Size: ${dataSize}B, Expires: ${new Date(
        expiresAt
      ).toLocaleTimeString()}`
    );

    // Clean up expired entries occasionally
    if (this.stats.sets % 10 === 0) {
      this.cleanup();
    }
  }

  /**
   * Retrieve event data by key
   * @param {string} key Cache key
   * @returns {Object|null} Event data or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      console.log(`🔍 Cache MISS - Key: ${key} not found`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.stats.misses++;
      console.log(
        `⏰ Cache EXPIRED - Key: ${key} expired at ${new Date(
          entry.expiresAt
        ).toLocaleTimeString()}`
      );
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    console.log(
      `✅ Cache HIT - Key: ${key}, Data: ${
        entry.data?.title || "Unknown"
      }, Access: ${entry.accessCount}`
    );
    return entry.data;
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
      console.log(`♻️ Cache eviction: removed oldest entry ${oldestKey}`);
    }
  }

  /**
   * Estimate the memory size of an object
   * @param {Object} obj Object to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default estimate for unparseable objects
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache performance statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (
            (this.stats.hits / (this.stats.hits + this.stats.misses)) *
            100
          ).toFixed(1)
        : "0.0";

    const totalSize = Array.from(this.cache.values()).reduce(
      (total, entry) => total + (entry.size || 0),
      0
    );

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalEntries: this.cache.size,
      estimatedSizeBytes: totalSize,
      estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }

  /**
   * Log cache statistics
   */
  logStats() {
    const stats = this.getStats();
    console.log("📊 Cache Statistics:", {
      entries: stats.totalEntries,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      size: `${stats.estimatedSizeMB}MB`,
      evictions: stats.evictions,
      cleanups: stats.cleanups,
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
   * Destroy the cache and cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log("💥 Cache destroyed");
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
