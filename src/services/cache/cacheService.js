/**
 * Cache Service - In-memory and persistent caching system
 * Improves performance and reduces API calls
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import BaseService from '../baseService.js';
import config from '../../config/config.js';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CacheService extends BaseService {
    constructor() {
        super();
        this.memoryCache = new Map();
        this.persistentCachePath = path.join(config.dataDirectory, 'cache');
        this.defaultTTL = config.cacheTimeout || 30 * 60 * 1000; // Default: 30 minutes
    }

    /**
     * Initialize the cache service
     * @returns {Promise<void>}
     */
    async init() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.persistentCachePath)) {
            fs.mkdirSync(this.persistentCachePath, { recursive: true });
        }

        // Load persistent cache into memory
        this._loadPersistentCache();

        this.initialized = true;
        console.log('✅ Cache service initialized');
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @param {boolean} usePersistent - Whether to check persistent cache
     * @returns {*} - Cached value or null
     */
    get(key, usePersistent = false) {
        this.ensureInitialized();

        // Check memory cache first
        if (this.memoryCache.has(key)) {
            const item = this.memoryCache.get(key);
            
            // Check if item is expired
            if (item.expiry > Date.now()) {
                return item.value;
            }
            
            // Remove expired item
            this.memoryCache.delete(key);
        }

        // Check persistent cache if enabled
        if (usePersistent) {
            return this._getPersistentCache(key);
        }

        return null;
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     * @param {boolean} persist - Whether to also save to persistent cache
     * @returns {void}
     */
    set(key, value, ttl = this.defaultTTL, persist = false) {
        this.ensureInitialized();

        const expiry = Date.now() + ttl;
        
        // Set in memory cache
        this.memoryCache.set(key, {
            value,
            expiry
        });

        // Log cache operation
        console.log(`💾 Cache SET - Key: ${key}, Data: ${this._getValueSummary(value)}, Expires: ${new Date(expiry).toLocaleTimeString()}`);

        // Set in persistent cache if enabled
        if (persist) {
            this._setPersistentCache(key, value, expiry);
        }
    }

    /**
     * Delete item from cache
     * @param {string} key - Cache key
     * @param {boolean} deletePersistent - Whether to delete from persistent cache
     * @returns {boolean} - Whether item was deleted
     */
    delete(key, deletePersistent = false) {
        this.ensureInitialized();

        const memoryDeleted = this.memoryCache.delete(key);
        
        if (deletePersistent) {
            this._deletePersistentCache(key);
        }

        return memoryDeleted;
    }

    /**
     * Clear all cache items
     * @param {boolean} clearPersistent - Whether to clear persistent cache
     * @returns {void}
     */
    clear(clearPersistent = false) {
        this.ensureInitialized();

        // Clear memory cache
        this.memoryCache.clear();

        // Clear persistent cache if enabled
        if (clearPersistent) {
            this._clearPersistentCache();
        }
    }

    /**
     * Get value summary for logging
     * @param {*} value - Value to summarize
     * @returns {string} - Summary
     * @private
     */
    _getValueSummary(value) {
        if (value === null || value === undefined) {
            return 'null';
        }

        if (typeof value === 'string') {
            return value.length > 50 ? `${value.substring(0, 47)}...` : value;
        }

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return `Array[${value.length}]`;
            }
            
            if (value.title) {
                return value.title;
            }
            
            const keys = Object.keys(value);
            return `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
        }

        return String(value);
    }

    /**
     * Get item from persistent cache
     * @param {string} key - Cache key
     * @returns {*} - Cached value or null
     * @private
     */
    _getPersistentCache(key) {
        try {
            const filePath = path.join(this.persistentCachePath, `${key}.json`);
            
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Check if data is expired
            if (data.expiry > Date.now()) {
                // Refresh in memory cache
                this.memoryCache.set(key, data);
                return data.value;
            }
            
            // Remove expired file
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Error reading persistent cache for key ${key}:`, error);
        }
        
        return null;
    }

    /**
     * Set item in persistent cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} expiry - Expiry timestamp
     * @private
     */
    _setPersistentCache(key, value, expiry) {
        try {
            const filePath = path.join(this.persistentCachePath, `${key}.json`);
            
            const data = {
                value,
                expiry
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
        } catch (error) {
            console.error(`Error writing persistent cache for key ${key}:`, error);
        }
    }

    /**
     * Delete item from persistent cache
     * @param {string} key - Cache key
     * @private
     */
    _deletePersistentCache(key) {
        try {
            const filePath = path.join(this.persistentCachePath, `${key}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`Error deleting persistent cache for key ${key}:`, error);
        }
    }

    /**
     * Clear persistent cache
     * @private
     */
    _clearPersistentCache() {
        try {
            const files = fs.readdirSync(this.persistentCachePath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(this.persistentCachePath, file));
                }
            }
        } catch (error) {
            console.error('Error clearing persistent cache:', error);
        }
    }

    /**
     * Load persistent cache into memory
     * @private
     */
    _loadPersistentCache() {
        try {
            if (!fs.existsSync(this.persistentCachePath)) {
                return;
            }
            
            const files = fs.readdirSync(this.persistentCachePath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const key = file.replace('.json', '');
                        const filePath = path.join(this.persistentCachePath, file);
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        
                        // Only load if not expired
                        if (data.expiry > Date.now()) {
                            this.memoryCache.set(key, data);
                        } else {
                            // Remove expired file
                            fs.unlinkSync(filePath);
                        }
                    } catch (fileError) {
                        console.error(`Error loading cache file ${file}:`, fileError);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading persistent cache:', error);
        }
    }
}

export default CacheService;
