#!/usr/bin/env node

/**
 * Health Check Utility for FightBot
 * Comprehensive system health monitoring and diagnostics
 */

import { performanceMonitor } from './performanceMonitor.js';
import { memoryManager } from './memoryManager.js';
import { eventCache } from '../services/eventCacheOptimized.js';
import { config } from '../config.js';
import fs from 'fs/promises';
import path from 'path';

class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.thresholds = {
            memory: {
                warning: 200 * 1024 * 1024,  // 200MB
                critical: 400 * 1024 * 1024  // 400MB
            },
            responseTime: {
                warning: 3000,  // 3 seconds
                critical: 5000  // 5 seconds
            },
            cacheHitRate: {
                warning: 50,    // 50%
                critical: 30    // 30%
            },
            uptime: {
                minimum: 60000  // 1 minute
            }
        };
    }

    /**
     * Run all health checks
     */
    async runAllChecks() {
        console.log('🏥 Running FightBot Health Checks...\n');

        const checks = [
            { name: 'System Resources', fn: this.checkSystemResources.bind(this) },
            { name: 'Memory Health', fn: this.checkMemoryHealth.bind(this) },
            { name: 'Performance Metrics', fn: this.checkPerformance.bind(this) },
            { name: 'Cache Health', fn: this.checkCacheHealth.bind(this) },
            { name: 'Database Connectivity', fn: this.checkDatabase.bind(this) },
            { name: 'File System', fn: this.checkFileSystem.bind(this) },
            { name: 'Configuration', fn: this.checkConfiguration.bind(this) },
            { name: 'Dependencies', fn: this.checkDependencies.bind(this) }
        ];

        const results = [];

        for (const check of checks) {
            try {
                const result = await check.fn();
                results.push({ name: check.name, ...result });
                this.logCheckResult(check.name, result);
            } catch (error) {
                const errorResult = {
                    status: 'error',
                    message: error.message,
                    details: { error: error.stack }
                };
                results.push({ name: check.name, ...errorResult });
                this.logCheckResult(check.name, errorResult);
            }
        }

        return this.generateHealthReport(results);
    }

    /**
     * Check system resources
     */
    async checkSystemResources() {
        const usage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();

        const issues = [];
        let status = 'healthy';

        // Check memory usage
        if (usage.heapUsed > this.thresholds.memory.critical) {
            status = 'critical';
            issues.push('Critical memory usage detected');
        } else if (usage.heapUsed > this.thresholds.memory.warning) {
            status = 'warning';
            issues.push('High memory usage detected');
        }

        // Check uptime
        if (uptime < this.thresholds.uptime.minimum / 1000) {
            issues.push('System recently restarted');
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'System resources healthy',
            details: {
                memory: {
                    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
                    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
                    rss: (usage.rss / 1024 / 1024).toFixed(2) + 'MB'
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                uptime: `${(uptime / 3600).toFixed(2)} hours`
            }
        };
    }

    /**
     * Check memory health
     */
    async checkMemoryHealth() {
        if (!memoryManager) {
            return {
                status: 'warning',
                message: 'Memory manager not available',
                details: {}
            };
        }

        const health = memoryManager.getHealthStatus();
        const stats = memoryManager.getStats();

        let status = 'healthy';
        const issues = [];

        switch (health) {
            case 'emergency':
            case 'critical':
                status = 'critical';
                issues.push(`Memory health is ${health}`);
                break;
            case 'warning':
                status = 'warning';
                issues.push('Memory usage is elevated');
                break;
        }

        // Check for memory growth trend
        if (stats.trend && stats.trend.direction === 'increasing' && stats.trend.rate > 50) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Memory growing at ${stats.trend.rate.toFixed(1)}MB/hour`);
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'Memory health good',
            details: {
                health,
                current: stats.current,
                trend: stats.trend
            }
        };
    }

    /**
     * Check performance metrics
     */
    async checkPerformance() {
        if (!performanceMonitor) {
            return {
                status: 'warning',
                message: 'Performance monitor not available',
                details: {}
            };
        }

        const summary = performanceMonitor.getSummary();
        let status = 'healthy';
        const issues = [];

        // Check average response time
        if (summary.averageResponseTime > this.thresholds.responseTime.critical) {
            status = 'critical';
            issues.push('Critical response time detected');
        } else if (summary.averageResponseTime > this.thresholds.responseTime.warning) {
            status = 'warning';
            issues.push('Slow response times detected');
        }

        // Check error rate
        const errorRate = summary.totalOperations > 0 
            ? (summary.slowOperations / summary.totalOperations) * 100 
            : 0;

        if (errorRate > 20) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`High slow operation rate: ${errorRate.toFixed(1)}%`);
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'Performance metrics healthy',
            details: {
                totalOperations: summary.totalOperations,
                averageResponseTime: `${summary.averageResponseTime.toFixed(2)}ms`,
                slowOperations: summary.slowOperations,
                uptime: `${(summary.uptime / 3600 / 1000).toFixed(2)} hours`
            }
        };
    }

    /**
     * Check cache health
     */
    async checkCacheHealth() {
        if (!eventCache) {
            return {
                status: 'warning',
                message: 'Event cache not available',
                details: {}
            };
        }

        const stats = eventCache.getStats();
        const isHealthy = eventCache.isHealthy();
        
        let status = 'healthy';
        const issues = [];

        if (!isHealthy) {
            status = 'warning';
            issues.push('Cache health check failed');
        }

        // Check hit rate
        const hitRate = parseFloat(stats.hitRate);
        if (hitRate < this.thresholds.cacheHitRate.critical) {
            status = 'critical';
            issues.push(`Very low cache hit rate: ${hitRate}%`);
        } else if (hitRate < this.thresholds.cacheHitRate.warning) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Low cache hit rate: ${hitRate}%`);
        }

        // Check memory utilization
        const memoryUtil = parseFloat(stats.memoryUtilization);
        if (memoryUtil > 95) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`High cache memory utilization: ${memoryUtil}%`);
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'Cache healthy',
            details: {
                hitRate: stats.hitRate,
                memoryUtilization: stats.memoryUtilization,
                totalEntries: stats.totalEntries,
                maxEntries: stats.maxSize,
                memoryUsage: stats.estimatedSizeMB + 'MB'
            }
        };
    }

    /**
     * Check database connectivity
     */
    async checkDatabase() {
        try {
            // This would test database connectivity
            // For now, just check if data directory exists
            const dataDir = './data';
            await fs.access(dataDir);
            
            return {
                status: 'healthy',
                message: 'Database accessible',
                details: { dataDirectory: dataDir }
            };
        } catch (error) {
            return {
                status: 'critical',
                message: 'Database connection failed',
                details: { error: error.message }
            };
        }
    }

    /**
     * Check file system health
     */
    async checkFileSystem() {
        const checks = [
            { path: './data', name: 'Data directory' },
            { path: './data/logs', name: 'Logs directory' },
            { path: './commands', name: 'Commands directory' },
            { path: './services', name: 'Services directory' }
        ];

        const results = {};
        let status = 'healthy';
        const issues = [];

        for (const check of checks) {
            try {
                await fs.access(check.path);
                results[check.name] = 'accessible';
            } catch (error) {
                results[check.name] = 'not accessible';
                issues.push(`${check.name} not accessible`);
                status = 'warning';
            }
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'File system healthy',
            details: results
        };
    }

    /**
     * Check configuration
     */
    async checkConfiguration() {
        const issues = [];
        let status = 'healthy';

        // Check required environment variables
        const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                issues.push(`Missing ${envVar}`);
                status = 'critical';
            }
        }

        // Check configuration values
        if (!config) {
            issues.push('Configuration not loaded');
            status = 'critical';
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'Configuration healthy',
            details: {
                environment: process.env.NODE_ENV || 'development',
                configLoaded: !!config
            }
        };
    }

    /**
     * Check dependencies
     */
    async checkDependencies() {
        const issues = [];
        let status = 'healthy';

        try {
            // Check critical imports
            const criticalModules = [
                'discord.js',
                'axios',
                'sqlite3'
            ];

            for (const module of criticalModules) {
                try {
                    await import(module);
                } catch (error) {
                    issues.push(`Failed to load ${module}`);
                    status = 'critical';
                }
            }

        } catch (error) {
            issues.push('Dependency check failed');
            status = 'critical';
        }

        return {
            status,
            message: issues.length > 0 ? issues.join('; ') : 'Dependencies healthy',
            details: {
                nodeVersion: process.version,
                platform: process.platform
            }
        };
    }

    /**
     * Log check result
     */
    logCheckResult(name, result) {
        const icons = {
            healthy: '✅',
            warning: '⚠️',
            critical: '🚨',
            error: '❌'
        };

        const icon = icons[result.status] || '❓';
        console.log(`${icon} ${name}: ${result.message}`);
    }

    /**
     * Generate comprehensive health report
     */
    generateHealthReport(results) {
        const statusCounts = {
            healthy: 0,
            warning: 0,
            critical: 0,
            error: 0
        };

        results.forEach(result => {
            statusCounts[result.status]++;
        });

        let overallStatus = 'healthy';
        if (statusCounts.critical > 0 || statusCounts.error > 0) {
            overallStatus = 'critical';
        } else if (statusCounts.warning > 0) {
            overallStatus = 'warning';
        }

        const report = {
            timestamp: new Date().toISOString(),
            overallStatus,
            summary: statusCounts,
            checks: results,
            recommendations: this.generateRecommendations(results)
        };

        console.log('\n📋 Health Check Summary');
        console.log('========================');
        console.log(`Overall Status: ${overallStatus.toUpperCase()}`);
        console.log(`Healthy: ${statusCounts.healthy}`);
        console.log(`Warnings: ${statusCounts.warning}`);
        console.log(`Critical: ${statusCounts.critical}`);
        console.log(`Errors: ${statusCounts.error}`);

        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        console.log('========================\n');

        return report;
    }

    /**
     * Generate recommendations based on check results
     */
    generateRecommendations(results) {
        const recommendations = [];

        results.forEach(result => {
            if (result.status === 'critical') {
                switch (result.name) {
                    case 'Memory Health':
                        recommendations.push('Restart the application to free memory');
                        break;
                    case 'Performance Metrics':
                        recommendations.push('Investigate slow operations and optimize code');
                        break;
                    case 'Database Connectivity':
                        recommendations.push('Check database configuration and permissions');
                        break;
                    case 'Configuration':
                        recommendations.push('Verify all required environment variables are set');
                        break;
                }
            } else if (result.status === 'warning') {
                switch (result.name) {
                    case 'Memory Health':
                        recommendations.push('Monitor memory usage and consider optimization');
                        break;
                    case 'Cache Health':
                        recommendations.push('Review cache configuration and hit rates');
                        break;
                    case 'Performance Metrics':
                        recommendations.push('Monitor response times and optimize if needed');
                        break;
                }
            }
        });

        return recommendations;
    }

    /**
     * Quick health check (lightweight)
     */
    async quickCheck() {
        const memory = process.memoryUsage();
        const uptime = process.uptime();
        
        const health = {
            status: 'healthy',
            uptime: uptime,
            memory: (memory.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
            timestamp: new Date().toISOString()
        };

        if (memory.heapUsed > this.thresholds.memory.critical) {
            health.status = 'critical';
        } else if (memory.heapUsed > this.thresholds.memory.warning) {
            health.status = 'warning';
        }

        return health;
    }
}

// CLI interface
async function main() {
    const checker = new HealthChecker();
    const command = process.argv[2] || 'full';

    switch (command) {
        case 'full':
            await checker.runAllChecks();
            break;
        case 'quick':
            const quickResult = await checker.quickCheck();
            console.log('🏥 Quick Health Check:', quickResult);
            break;
        case 'memory':
            const memoryResult = await checker.checkMemoryHealth();
            console.log('💾 Memory Health:', memoryResult);
            break;
        case 'performance':
            const perfResult = await checker.checkPerformance();
            console.log('⚡ Performance Health:', perfResult);
            break;
        case 'cache':
            const cacheResult = await checker.checkCacheHealth();
            console.log('🏎️ Cache Health:', cacheResult);
            break;
        default:
            console.log('Usage: node health-check.js [full|quick|memory|performance|cache]');
            break;
    }
}

// Export for programmatic use
export { HealthChecker };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
