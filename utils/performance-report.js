#!/usr/bin/env node

/**
 * Performance Report Generator for FightBot
 * Generates comprehensive performance and health reports
 */

import { performanceMonitor } from './performanceMonitor.js';
import { memoryManager } from './memoryManager.js';
import { eventCache } from '../services/eventCacheOptimized.js';
import fs from 'fs/promises';
import path from 'path';

class PerformanceReporter {
    constructor() {
        this.reportDir = './data/reports';
        this.timestamp = new Date().toISOString();
    }

    /**
     * Generate comprehensive performance report
     */
    async generateReport() {
        console.log('📊 Generating Performance Report...');
        
        const report = {
            metadata: {
                timestamp: this.timestamp,
                version: process.env.npm_package_version || 'unknown',
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime()
            },
            performance: this.getPerformanceData(),
            memory: this.getMemoryData(),
            cache: this.getCacheData(),
            system: this.getSystemData(),
            recommendations: this.generateRecommendations()
        };

        await this.saveReport(report);
        this.printReport(report);
        
        return report;
    }

    /**
     * Get performance data from monitor
     */
    getPerformanceData() {
        const summary = performanceMonitor.getSummary();
        const exported = performanceMonitor.exportMetrics();
        
        return {
            summary: {
                totalOperations: summary.totalOperations,
                averageResponseTime: summary.averageResponseTime,
                slowOperations: summary.slowOperations,
                uptime: summary.uptime
            },
            thresholds: exported.thresholds,
            detailed: {
                commands: this.summarizeMetrics(exported.detailed.commands),
                interactions: this.summarizeMetrics(exported.detailed.interactions),
                apiCalls: this.summarizeMetrics(exported.detailed.apiCalls)
            }
        };
    }

    /**
     * Get memory data from manager
     */
    getMemoryData() {
        const stats = memoryManager.getStats();
        const health = memoryManager.getHealthStatus();
        const usage = process.memoryUsage();
        
        return {
            current: {
                heapUsed: usage.heapUsed,
                heapTotal: usage.heapTotal,
                rss: usage.rss,
                external: usage.external,
                heapUsedMB: (usage.heapUsed / 1024 / 1024).toFixed(2),
                rssMB: (usage.rss / 1024 / 1024).toFixed(2)
            },
            health,
            thresholds: stats.thresholds,
            trend: stats.trend,
            history: stats.history
        };
    }

    /**
     * Get cache data
     */
    getCacheData() {
        if (!eventCache) {
            return { available: false };
        }

        const stats = eventCache.getStats();
        const isHealthy = eventCache.isHealthy();
        
        return {
            available: true,
            stats,
            healthy: isHealthy,
            performance: {
                hitRate: parseFloat(stats.hitRate),
                memoryUtilization: parseFloat(stats.memoryUtilization),
                totalEntries: stats.totalEntries,
                maxEntries: stats.maxSize
            }
        };
    }

    /**
     * Get system data
     */
    getSystemData() {
        const loadAverage = process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0];
        const cpuUsage = process.cpuUsage();
        
        return {
            loadAverage,
            cpuUsage,
            memoryUsage: process.memoryUsage(),
            resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
            env: {
                nodeEnv: process.env.NODE_ENV || 'development',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const performance = this.getPerformanceData();
        const memory = this.getMemoryData();
        const cache = this.getCacheData();

        // Performance recommendations
        if (performance.summary.averageResponseTime > 3000) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                issue: 'High average response time',
                suggestion: 'Optimize slow operations and consider caching'
            });
        }

        if (performance.summary.slowOperations > performance.summary.totalOperations * 0.1) {
            recommendations.push({
                type: 'performance',
                severity: 'medium',
                issue: 'High number of slow operations',
                suggestion: 'Profile and optimize slow endpoints'
            });
        }

        // Memory recommendations
        if (memory.health === 'critical' || memory.health === 'emergency') {
            recommendations.push({
                type: 'memory',
                severity: 'high',
                issue: 'Critical memory usage',
                suggestion: 'Immediate memory optimization or restart required'
            });
        }

        if (memory.trend && memory.trend.direction === 'increasing' && memory.trend.rate > 50) {
            recommendations.push({
                type: 'memory',
                severity: 'medium',
                issue: 'Memory usage growing rapidly',
                suggestion: 'Check for memory leaks and optimize data structures'
            });
        }

        // Cache recommendations
        if (cache.available && cache.performance.hitRate < 50) {
            recommendations.push({
                type: 'cache',
                severity: 'medium',
                issue: 'Low cache hit rate',
                suggestion: 'Review caching strategy and TTL settings'
            });
        }

        if (cache.available && cache.performance.memoryUtilization > 90) {
            recommendations.push({
                type: 'cache',
                severity: 'medium',
                issue: 'High cache memory utilization',
                suggestion: 'Consider increasing cache size or reducing TTL'
            });
        }

        return recommendations;
    }

    /**
     * Summarize metrics for a category
     */
    summarizeMetrics(metricsMap) {
        const summary = {};
        
        for (const [name, metrics] of Object.entries(metricsMap)) {
            if (metrics.length > 0) {
                const durations = metrics.map(m => m.duration);
                durations.sort((a, b) => a - b);
                
                summary[name] = {
                    count: durations.length,
                    average: durations.reduce((a, b) => a + b, 0) / durations.length,
                    min: durations[0],
                    max: durations[durations.length - 1],
                    median: durations[Math.floor(durations.length / 2)],
                    p95: durations[Math.floor(durations.length * 0.95)]
                };
            }
        }
        
        return summary;
    }

    /**
     * Save report to file
     */
    async saveReport(report) {
        try {
            await fs.mkdir(this.reportDir, { recursive: true });
            
            const filename = `performance-report-${this.timestamp.replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(this.reportDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`📁 Report saved to: ${filepath}`);
            
        } catch (error) {
            console.error('Failed to save report:', error.message);
        }
    }

    /**
     * Print report summary to console
     */
    printReport(report) {
        console.log('\n📊 FightBot Performance Report');
        console.log('================================');
        console.log(`Generated: ${new Date(report.metadata.timestamp).toLocaleString()}`);
        console.log(`Uptime: ${(report.metadata.uptime / 3600).toFixed(2)} hours`);
        console.log(`Node.js: ${report.metadata.nodeVersion}`);
        
        console.log('\n⚡ Performance Summary');
        console.log('---------------------');
        console.log(`Total Operations: ${report.performance.summary.totalOperations}`);
        console.log(`Average Response Time: ${report.performance.summary.averageResponseTime.toFixed(2)}ms`);
        console.log(`Slow Operations: ${report.performance.summary.slowOperations}`);
        
        console.log('\n💾 Memory Summary');
        console.log('-----------------');
        console.log(`Current Usage: ${report.memory.current.heapUsedMB}MB heap, ${report.memory.current.rssMB}MB RSS`);
        console.log(`Health Status: ${report.memory.health}`);
        
        if (report.cache.available) {
            console.log('\n🏎️ Cache Summary');
            console.log('----------------');
            console.log(`Hit Rate: ${report.cache.performance.hitRate.toFixed(1)}%`);
            console.log(`Memory Usage: ${report.cache.performance.memoryUtilization.toFixed(1)}%`);
            console.log(`Entries: ${report.cache.performance.totalEntries}/${report.cache.performance.maxEntries}`);
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations');
            console.log('-------------------');
            report.recommendations.forEach(rec => {
                const icon = rec.severity === 'high' ? '🚨' : '⚠️';
                console.log(`${icon} [${rec.type.toUpperCase()}] ${rec.issue}`);
                console.log(`   → ${rec.suggestion}`);
            });
        } else {
            console.log('\n✅ No performance issues detected');
        }
        
        console.log('\n================================\n');
    }

    /**
     * Generate lightweight health check
     */
    async quickHealthCheck() {
        const memory = memoryManager.getHealthStatus();
        const cache = eventCache?.isHealthy() ?? true;
        const performance = performanceMonitor.getSummary();
        
        const health = {
            overall: 'healthy',
            memory,
            cache,
            averageResponseTime: performance.averageResponseTime,
            uptime: performance.uptime
        };
        
        if (memory === 'critical' || memory === 'emergency') {
            health.overall = 'critical';
        } else if (memory === 'warning' || !cache) {
            health.overall = 'warning';
        }
        
        return health;
    }
}

// CLI interface
async function main() {
    const reporter = new PerformanceReporter();
    
    const command = process.argv[2] || 'full';
    
    switch (command) {
        case 'full':
            await reporter.generateReport();
            break;
        case 'health':
            const health = await reporter.quickHealthCheck();
            console.log('🏥 Health Check:', health);
            break;
        case 'memory':
            const memoryData = reporter.getMemoryData();
            console.log('💾 Memory Report:', memoryData);
            break;
        case 'cache':
            const cacheData = reporter.getCacheData();
            console.log('🏎️ Cache Report:', cacheData);
            break;
        default:
            console.log('Usage: node performance-report.js [full|health|memory|cache]');
            break;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default PerformanceReporter;
