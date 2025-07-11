/**
 * Performance Monitoring Utility for FightBot
 * Tracks response times, memory usage, and system performance
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            commands: new Map(),
            interactions: new Map(),
            apiCalls: new Map(),
            memory: [],
            uptime: Date.now()
        };
        
        this.thresholds = {
            slowCommand: 3000,      // 3 seconds
            slowInteraction: 2000,  // 2 seconds
            slowApiCall: 5000,      // 5 seconds
            highMemory: 256 * 1024 * 1024 // 256MB
        };
        
        this.startPeriodicMonitoring();
    }

    /**
     * Start periodic monitoring tasks
     */
    startPeriodicMonitoring() {
        // Memory monitoring every 5 minutes
        setInterval(() => {
            this.recordMemoryUsage();
        }, 5 * 60 * 1000);
        
        // Cleanup old metrics every hour
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60 * 60 * 1000);
        
        console.log('📊 Performance monitoring started');
    }

    /**
     * Start timing a performance measurement
     * @param {string} type - Type of operation (command, interaction, api)
     * @param {string} name - Name of the operation
     * @returns {Function} Function to call when operation completes
     */
    startTiming(type, name) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        return (metadata = {}) => {
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
            
            this.recordMetric(type, name, duration, memoryDelta, metadata);
            
            return duration;
        };
    }

    /**
     * Record a performance metric
     * @param {string} type - Type of operation
     * @param {string} name - Name of operation
     * @param {number} duration - Duration in milliseconds
     * @param {number} memoryDelta - Memory change in bytes
     * @param {Object} metadata - Additional metadata
     */
    recordMetric(type, name, duration, memoryDelta, metadata = {}) {
        const timestamp = Date.now();
        
        if (!this.metrics[type]) {
            this.metrics[type] = new Map();
        }
        
        if (!this.metrics[type].has(name)) {
            this.metrics[type].set(name, []);
        }
        
        const metric = {
            timestamp,
            duration,
            memoryDelta,
            ...metadata
        };
        
        this.metrics[type].get(name).push(metric);
        
        // Check for performance issues
        this.checkPerformanceThresholds(type, name, duration, memoryDelta);
        
        // Limit stored metrics to prevent memory issues
        this.limitMetricHistory(type, name);
    }

    /**
     * Check if operation exceeded performance thresholds
     * @param {string} type - Operation type
     * @param {string} name - Operation name
     * @param {number} duration - Duration in ms
     * @param {number} memoryDelta - Memory change
     */
    checkPerformanceThresholds(type, name, duration, memoryDelta) {
        const thresholdKey = `slow${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const threshold = this.thresholds[thresholdKey];
        
        if (threshold && duration > threshold) {
            console.warn(`🐌 Slow ${type}: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
        }
        
        if (Math.abs(memoryDelta) > this.thresholds.highMemory) {
            console.warn(`💾 High memory usage in ${type} ${name}: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Limit the number of stored metrics to prevent memory issues
     * @param {string} type - Metric type
     * @param {string} name - Metric name
     */
    limitMetricHistory(type, name) {
        const maxHistory = 100;
        const metrics = this.metrics[type].get(name);
        
        if (metrics.length > maxHistory) {
            // Keep only the most recent metrics
            this.metrics[type].set(name, metrics.slice(-maxHistory));
        }
    }

    /**
     * Record current memory usage
     */
    recordMemoryUsage() {
        const usage = process.memoryUsage();
        const timestamp = Date.now();
        
        this.metrics.memory.push({
            timestamp,
            rss: usage.rss,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external
        });
        
        // Limit memory history
        if (this.metrics.memory.length > 288) { // 24 hours of 5-minute intervals
            this.metrics.memory = this.metrics.memory.slice(-288);
        }
        
        // Alert on high memory usage
        if (usage.heapUsed > this.thresholds.highMemory) {
            console.warn(`🚨 High memory usage: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Get performance statistics for a specific type and name
     * @param {string} type - Metric type
     * @param {string} name - Metric name
     * @returns {Object} Performance statistics
     */
    getStats(type, name) {
        if (!this.metrics[type] || !this.metrics[type].has(name)) {
            return null;
        }
        
        const metrics = this.metrics[type].get(name);
        const durations = metrics.map(m => m.duration);
        
        if (durations.length === 0) return null;
        
        durations.sort((a, b) => a - b);
        
        return {
            count: durations.length,
            min: durations[0],
            max: durations[durations.length - 1],
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            median: durations[Math.floor(durations.length / 2)],
            p95: durations[Math.floor(durations.length * 0.95)],
            p99: durations[Math.floor(durations.length * 0.99)]
        };
    }

    /**
     * Get overall performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        const summary = {
            uptime: Date.now() - this.metrics.uptime,
            totalOperations: 0,
            averageResponseTime: 0,
            memoryUsage: null,
            slowOperations: 0
        };
        
        // Calculate totals across all types
        let totalDuration = 0;
        let slowCount = 0;
        
        for (const [type, nameMap] of Object.entries(this.metrics)) {
            if (type === 'memory' || type === 'uptime') continue;
            
            for (const [name, metrics] of nameMap) {
                summary.totalOperations += metrics.length;
                
                for (const metric of metrics) {
                    totalDuration += metric.duration;
                    
                    const thresholdKey = `slow${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    if (metric.duration > this.thresholds[thresholdKey]) {
                        slowCount++;
                    }
                }
            }
        }
        
        if (summary.totalOperations > 0) {
            summary.averageResponseTime = totalDuration / summary.totalOperations;
        }
        
        summary.slowOperations = slowCount;
        
        // Get current memory usage
        if (this.metrics.memory.length > 0) {
            const latest = this.metrics.memory[this.metrics.memory.length - 1];
            summary.memoryUsage = {
                heapUsed: latest.heapUsed,
                heapTotal: latest.heapTotal,
                rss: latest.rss
            };
        }
        
        return summary;
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupOldMetrics() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        let cleaned = 0;
        
        for (const [type, nameMap] of Object.entries(this.metrics)) {
            if (type === 'memory' || type === 'uptime') continue;
            
            for (const [name, metrics] of nameMap) {
                const before = metrics.length;
                const filtered = metrics.filter(m => m.timestamp > cutoff);
                nameMap.set(name, filtered);
                cleaned += before - filtered.length;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} old performance metrics`);
        }
    }

    /**
     * Log performance report
     */
    logReport() {
        const summary = this.getSummary();
        const uptimeHours = (summary.uptime / (1000 * 60 * 60)).toFixed(2);
        
        console.log('\n📊 Performance Report');
        console.log('========================');
        console.log(`⏱️  Uptime: ${uptimeHours} hours`);
        console.log(`🔄 Total Operations: ${summary.totalOperations}`);
        console.log(`⚡ Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
        console.log(`🐌 Slow Operations: ${summary.slowOperations}`);
        
        if (summary.memoryUsage) {
            const heapMB = (summary.memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
            const rssMB = (summary.memoryUsage.rss / 1024 / 1024).toFixed(2);
            console.log(`💾 Memory Usage: ${heapMB}MB heap, ${rssMB}MB RSS`);
        }
        
        console.log('========================\n');
    }

    /**
     * Get metrics for export (useful for monitoring systems)
     * @returns {Object} All metrics data
     */
    exportMetrics() {
        return {
            summary: this.getSummary(),
            detailed: {
                commands: Object.fromEntries(this.metrics.commands),
                interactions: Object.fromEntries(this.metrics.interactions),
                apiCalls: Object.fromEntries(this.metrics.apiCalls)
            },
            memory: this.metrics.memory.slice(-12), // Last hour of 5-minute intervals
            thresholds: this.thresholds
        };
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to automatically monitor function performance
 * @param {string} type - Type of operation
 * @param {string} name - Name of operation
 * @returns {Function} Decorator function
 */
export function monitored(type, name) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args) {
            const endTiming = performanceMonitor.startTiming(type, name || propertyKey);
            
            try {
                const result = await originalMethod.apply(this, args);
                endTiming({ success: true });
                return result;
            } catch (error) {
                endTiming({ success: false, error: error.message });
                throw error;
            }
        };
        
        return descriptor;
    };
}

export default PerformanceMonitor;
