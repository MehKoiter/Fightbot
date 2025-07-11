/**
 * Memory Management Utility for FightBot
 * Monitors and optimizes memory usage across the application
 */

class MemoryManager {
    constructor() {
        this.memoryThresholds = {
            warning: 200 * 1024 * 1024,  // 200MB
            critical: 400 * 1024 * 1024, // 400MB
            emergency: 500 * 1024 * 1024 // 500MB
        };
        
        this.gcCallbacks = new Set();
        this.memoryHistory = [];
        this.isMonitoring = false;
        
        this.startMonitoring();
    }

    /**
     * Start memory monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Check memory every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 30 * 1000);
        
        // Detailed check every 5 minutes
        this.detailedInterval = setInterval(() => {
            this.performDetailedCheck();
        }, 5 * 60 * 1000);
        
        console.log('💾 Memory monitoring started');
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        clearInterval(this.monitoringInterval);
        clearInterval(this.detailedInterval);
        this.isMonitoring = false;
        
        console.log('💾 Memory monitoring stopped');
    }

    /**
     * Check current memory usage and trigger actions if needed
     */
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const timestamp = Date.now();
        
        // Record memory usage
        this.memoryHistory.push({
            timestamp,
            rss: usage.rss,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external
        });
        
        // Limit history to last 24 hours (720 entries at 2-minute intervals)
        if (this.memoryHistory.length > 720) {
            this.memoryHistory = this.memoryHistory.slice(-720);
        }
        
        // Check thresholds
        if (usage.heapUsed > this.memoryThresholds.emergency) {
            this.handleEmergencyMemory(usage);
        } else if (usage.heapUsed > this.memoryThresholds.critical) {
            this.handleCriticalMemory(usage);
        } else if (usage.heapUsed > this.memoryThresholds.warning) {
            this.handleWarningMemory(usage);
        }
    }

    /**
     * Handle warning level memory usage
     * @param {Object} usage - Memory usage object
     */
    handleWarningMemory(usage) {
        const memoryMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
        console.warn(`⚠️ Memory warning: ${memoryMB}MB heap usage`);
        
        // Suggest garbage collection
        this.scheduleGarbageCollection('warning');
    }

    /**
     * Handle critical level memory usage
     * @param {Object} usage - Memory usage object
     */
    handleCriticalMemory(usage) {
        const memoryMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
        console.error(`🚨 Critical memory usage: ${memoryMB}MB heap usage`);
        
        // Force garbage collection
        this.forceGarbageCollection();
        
        // Notify registered callbacks
        this.notifyGCCallbacks('critical');
        
        // Clear caches if available
        this.clearCaches();
    }

    /**
     * Handle emergency level memory usage
     * @param {Object} usage - Memory usage object
     */
    handleEmergencyMemory(usage) {
        const memoryMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
        console.error(`🆘 EMERGENCY: Memory usage critical at ${memoryMB}MB!`);
        
        // Aggressive cleanup
        this.emergencyCleanup();
        
        // Force multiple GC cycles
        for (let i = 0; i < 3; i++) {
            this.forceGarbageCollection();
        }
        
        // Notify all callbacks
        this.notifyGCCallbacks('emergency');
    }

    /**
     * Perform detailed memory check and optimization
     */
    performDetailedCheck() {
        const usage = process.memoryUsage();
        const trend = this.getMemoryTrend();
        
        console.log('🔍 Detailed memory check:');
        console.log(`   Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   RSS: ${(usage.rss / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   External: ${(usage.external / 1024 / 1024).toFixed(2)}MB`);
        
        if (trend) {
            console.log(`   Trend: ${trend.direction} (${trend.rate.toFixed(2)}MB/hour)`);
        }
        
        // Optimize if memory is growing too fast
        if (trend && trend.direction === 'increasing' && trend.rate > 50) {
            console.warn('📈 Memory growing rapidly, performing optimization...');
            this.optimize();
        }
    }

    /**
     * Calculate memory usage trend
     * @returns {Object|null} Trend information
     */
    getMemoryTrend() {
        if (this.memoryHistory.length < 10) return null;
        
        const recent = this.memoryHistory.slice(-10);
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        
        const timeDiff = newest.timestamp - oldest.timestamp;
        const memoryDiff = newest.heapUsed - oldest.heapUsed;
        
        if (timeDiff === 0) return null;
        
        const ratePerMs = memoryDiff / timeDiff;
        const ratePerHour = ratePerMs * 60 * 60 * 1000 / 1024 / 1024; // MB per hour
        
        return {
            direction: memoryDiff > 0 ? 'increasing' : 'decreasing',
            rate: Math.abs(ratePerHour)
        };
    }

    /**
     * Register a callback for garbage collection events
     * @param {Function} callback - Function to call before GC
     */
    registerGCCallback(callback) {
        this.gcCallbacks.add(callback);
    }

    /**
     * Unregister a garbage collection callback
     * @param {Function} callback - Function to remove
     */
    unregisterGCCallback(callback) {
        this.gcCallbacks.delete(callback);
    }

    /**
     * Notify all registered callbacks before garbage collection
     * @param {string} level - Urgency level (warning, critical, emergency)
     */
    notifyGCCallbacks(level) {
        for (const callback of this.gcCallbacks) {
            try {
                callback(level);
            } catch (error) {
                console.error('Error in GC callback:', error.message);
            }
        }
    }

    /**
     * Schedule garbage collection (less aggressive)
     * @param {string} reason - Reason for GC
     */
    scheduleGarbageCollection(reason) {
        // Use setImmediate to schedule GC on next tick
        setImmediate(() => {
            if (global.gc) {
                console.log(`♻️ Scheduled garbage collection (${reason})`);
                global.gc();
            }
        });
    }

    /**
     * Force immediate garbage collection
     */
    forceGarbageCollection() {
        if (global.gc) {
            console.log('♻️ Forcing garbage collection');
            global.gc();
        } else {
            console.warn('⚠️ Garbage collection not available (run with --expose-gc)');
        }
    }

    /**
     * Clear caches throughout the application
     */
    clearCaches() {
        try {
            // Clear event cache if available
            if (global.eventCache && typeof global.eventCache.clear === 'function') {
                global.eventCache.clear();
                console.log('🗑️ Event cache cleared');
            }
            
            // Clear any other caches
            // Add more cache clearing logic here as needed
            
        } catch (error) {
            console.error('Error clearing caches:', error.message);
        }
    }

    /**
     * Emergency cleanup procedures
     */
    emergencyCleanup() {
        console.log('🆘 Performing emergency cleanup...');
        
        // Clear all caches
        this.clearCaches();
        
        // Clear large objects from memory
        this.clearLargeObjects();
        
        // Reset collections
        this.resetCollections();
    }

    /**
     * Clear large objects that might be consuming memory
     */
    clearLargeObjects() {
        // This would clear any large data structures
        // Implementation depends on specific application needs
        console.log('🧹 Clearing large objects...');
    }

    /**
     * Reset collections to prevent memory leaks
     */
    resetCollections() {
        // Reset any Maps, Sets, or Arrays that might be growing
        console.log('🔄 Resetting collections...');
    }

    /**
     * Optimize memory usage
     */
    optimize() {
        console.log('⚡ Optimizing memory usage...');
        
        // Notify callbacks to clean up
        this.notifyGCCallbacks('optimization');
        
        // Clear caches
        this.clearCaches();
        
        // Force garbage collection
        this.forceGarbageCollection();
        
        console.log('✅ Memory optimization complete');
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory statistics
     */
    getStats() {
        const usage = process.memoryUsage();
        const trend = this.getMemoryTrend();
        
        return {
            current: {
                heapUsed: usage.heapUsed,
                heapTotal: usage.heapTotal,
                rss: usage.rss,
                external: usage.external
            },
            thresholds: this.memoryThresholds,
            trend,
            history: this.memoryHistory.slice(-12), // Last hour
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * Get memory health status
     * @returns {string} Health status
     */
    getHealthStatus() {
        const usage = process.memoryUsage();
        
        if (usage.heapUsed > this.memoryThresholds.emergency) {
            return 'emergency';
        } else if (usage.heapUsed > this.memoryThresholds.critical) {
            return 'critical';
        } else if (usage.heapUsed > this.memoryThresholds.warning) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }

    /**
     * Create a memory report
     * @returns {Object} Detailed memory report
     */
    createReport() {
        const stats = this.getStats();
        const health = this.getHealthStatus();
        
        return {
            timestamp: new Date().toISOString(),
            health,
            stats,
            recommendations: this.getRecommendations(health, stats)
        };
    }

    /**
     * Get recommendations based on memory status
     * @param {string} health - Health status
     * @param {Object} stats - Memory statistics
     * @returns {Array} Array of recommendations
     */
    getRecommendations(health, stats) {
        const recommendations = [];
        
        if (health === 'emergency' || health === 'critical') {
            recommendations.push('Immediate garbage collection required');
            recommendations.push('Clear all caches');
            recommendations.push('Consider restarting the application');
        } else if (health === 'warning') {
            recommendations.push('Monitor memory usage closely');
            recommendations.push('Consider clearing caches');
        }
        
        if (stats.trend && stats.trend.direction === 'increasing' && stats.trend.rate > 30) {
            recommendations.push('Memory usage is increasing rapidly');
            recommendations.push('Check for memory leaks');
        }
        
        return recommendations;
    }
}

// Export singleton instance
export const memoryManager = new MemoryManager();

// Register with global for access by other modules
global.memoryManager = memoryManager;

export default MemoryManager;
