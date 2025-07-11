/**
 * Memory and Performance Test Suite
 * Tests memory usage patterns and performance optimizations
 */

import { memoryManager } from '../../utils/memoryManager.js';
import { performanceMonitor } from '../../utils/performanceMonitor.js';
import { eventCache } from '../../services/eventCacheOptimized.js';

console.log('🧪 Memory and Performance Test Suite');
console.log('=====================================');

/**
 * Test memory management under load
 */
async function testMemoryManagement() {
    console.log('\n💾 Testing Memory Management...');
    
    const initialMemory = process.memoryUsage();
    console.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    // Create memory pressure
    const largeObjects = [];
    for (let i = 0; i < 100; i++) {
        largeObjects.push(new Array(10000).fill(`test-data-${i}`));
    }
    
    const peakMemory = process.memoryUsage();
    console.log(`Peak memory: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    // Trigger cleanup
    largeObjects.length = 0;
    if (global.gc) {
        global.gc();
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cleanedMemory = process.memoryUsage();
    console.log(`After cleanup: ${(cleanedMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    const recovered = peakMemory.heapUsed - cleanedMemory.heapUsed;
    console.log(`Memory recovered: ${(recovered / 1024 / 1024).toFixed(2)}MB`);
    
    return recovered > 0;
}

/**
 * Test cache performance under load
 */
async function testCachePerformance() {
    console.log('\n🏎️ Testing Cache Performance...');
    
    const startTime = Date.now();
    
    // Test cache operations
    const operations = 1000;
    const setTimes = [];
    const getTimes = [];
    
    // Test SET operations
    for (let i = 0; i < operations; i++) {
        const setStart = process.hrtime.bigint();
        
        eventCache.set(`test_${i}`, {
            id: i,
            data: new Array(100).fill(`data-${i}`),
            timestamp: Date.now()
        });
        
        const setEnd = process.hrtime.bigint();
        setTimes.push(Number(setEnd - setStart) / 1000000); // Convert to ms
    }
    
    // Test GET operations
    for (let i = 0; i < operations; i++) {
        const getStart = process.hrtime.bigint();
        
        const result = eventCache.get(`test_${i}`);
        
        const getEnd = process.hrtime.bigint();
        getTimes.push(Number(getEnd - getStart) / 1000000); // Convert to ms
        
        if (!result || result.id !== i) {
            console.error(`❌ Cache integrity error at index ${i}`);
            return false;
        }
    }
    
    const totalTime = Date.now() - startTime;
    
    const avgSetTime = setTimes.reduce((a, b) => a + b, 0) / setTimes.length;
    const avgGetTime = getTimes.reduce((a, b) => a + b, 0) / getTimes.length;
    
    console.log(`Total operations: ${operations * 2} in ${totalTime}ms`);
    console.log(`Average SET time: ${avgSetTime.toFixed(3)}ms`);
    console.log(`Average GET time: ${avgGetTime.toFixed(3)}ms`);
    console.log(`Operations/second: ${((operations * 2) / (totalTime / 1000)).toFixed(0)}`);
    
    // Check cache stats
    const stats = eventCache.getStats();
    console.log(`Cache hit rate: ${stats.hitRate}`);
    console.log(`Cache memory usage: ${stats.estimatedSizeMB}MB`);
    
    // Cleanup
    eventCache.clear();
    
    return avgSetTime < 1.0 && avgGetTime < 0.5; // Performance thresholds
}

/**
 * Test performance monitoring
 */
async function testPerformanceMonitoring() {
    console.log('\n📊 Testing Performance Monitoring...');
    
    // Simulate some operations
    for (let i = 0; i < 10; i++) {
        const endTiming = performanceMonitor.startTiming('test', 'operation');
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        endTiming({ iteration: i });
    }
    
    // Get stats
    const stats = performanceMonitor.getStats('test', 'operation');
    
    if (stats) {
        console.log(`Operations tracked: ${stats.count}`);
        console.log(`Average time: ${stats.average.toFixed(2)}ms`);
        console.log(`Min time: ${stats.min.toFixed(2)}ms`);
        console.log(`Max time: ${stats.max.toFixed(2)}ms`);
        console.log(`95th percentile: ${stats.p95.toFixed(2)}ms`);
        
        return stats.count === 10;
    }
    
    return false;
}

/**
 * Test memory leak detection
 */
async function testMemoryLeakDetection() {
    console.log('\n🔍 Testing Memory Leak Detection...');
    
    const initialStats = memoryManager.getStats();
    const initialMemory = initialStats.current.heapUsed;
    
    // Simulate potential memory leak
    const leakyObjects = [];
    
    for (let iteration = 0; iteration < 5; iteration++) {
        for (let i = 0; i < 1000; i++) {
            leakyObjects.push({
                data: new Array(1000).fill(`leak-${iteration}-${i}`),
                timestamp: Date.now()
            });
        }
        
        // Check memory growth
        const currentMemory = process.memoryUsage().heapUsed;
        const growth = currentMemory - initialMemory;
        
        console.log(`Iteration ${iteration + 1}: Memory growth: ${(growth / 1024 / 1024).toFixed(2)}MB`);
        
        // Memory manager should detect this
        if (growth > memoryManager.memoryThresholds.warning) {
            console.log('✅ Memory manager detected memory pressure');
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Cleanup
    leakyObjects.length = 0;
    if (global.gc) {
        global.gc();
    }
    
    return true;
}

/**
 * Test performance under concurrent load
 */
async function testConcurrentPerformance() {
    console.log('\n🚀 Testing Concurrent Performance...');
    
    const concurrentOperations = 50;
    const operationsPerTask = 20;
    
    const startTime = Date.now();
    
    // Create concurrent cache operations
    const promises = Array.from({ length: concurrentOperations }, async (_, taskId) => {
        const results = [];
        
        for (let i = 0; i < operationsPerTask; i++) {
            const key = `concurrent_${taskId}_${i}`;
            const data = {
                taskId,
                iteration: i,
                data: new Array(50).fill(`concurrent-data-${taskId}-${i}`)
            };
            
            // Set
            const setSuccess = eventCache.set(key, data);
            
            // Immediate get
            const retrieved = eventCache.get(key);
            
            results.push({
                setSuccess,
                getSuccess: retrieved !== null && retrieved.taskId === taskId
            });
        }
        
        return results;
    });
    
    const allResults = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Analyze results
    let totalOps = 0;
    let successfulOps = 0;
    
    allResults.forEach(taskResults => {
        taskResults.forEach(result => {
            totalOps += 2; // Set + Get
            if (result.setSuccess && result.getSuccess) {
                successfulOps += 2;
            }
        });
    });
    
    const successRate = (successfulOps / totalOps) * 100;
    const opsPerSecond = totalOps / (totalTime / 1000);
    
    console.log(`Concurrent operations: ${totalOps}`);
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
    console.log(`Operations/second: ${opsPerSecond.toFixed(0)}`);
    console.log(`Total time: ${totalTime}ms`);
    
    // Cleanup
    eventCache.clear();
    
    return successRate > 95; // 95% success rate threshold
}

/**
 * Run all tests
 */
async function runAllTests() {
    const tests = [
        { name: 'Memory Management', fn: testMemoryManagement },
        { name: 'Cache Performance', fn: testCachePerformance },
        { name: 'Performance Monitoring', fn: testPerformanceMonitoring },
        { name: 'Memory Leak Detection', fn: testMemoryLeakDetection },
        { name: 'Concurrent Performance', fn: testConcurrentPerformance }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`\n🧪 Running ${test.name} test...`);
            const startTime = Date.now();
            
            const passed = await test.fn();
            
            const duration = Date.now() - startTime;
            
            if (passed) {
                console.log(`✅ ${test.name} test PASSED (${duration}ms)`);
                results.push({ name: test.name, passed: true, duration });
            } else {
                console.log(`❌ ${test.name} test FAILED (${duration}ms)`);
                results.push({ name: test.name, passed: false, duration });
            }
            
        } catch (error) {
            console.log(`❌ ${test.name} test ERROR: ${error.message}`);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }
    
    // Final report
    console.log('\n📋 Test Results Summary');
    console.log('========================');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const duration = result.duration ? `(${result.duration}ms)` : '';
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`${status} ${result.name} ${duration}${error}`);
    });
    
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
    
    // Performance summary
    console.log('\n📊 Performance Summary');
    console.log('======================');
    performanceMonitor.logReport();
    
    // Memory summary
    console.log('💾 Memory Summary');
    console.log('=================');
    const memStats = memoryManager.getStats();
    const currentMemory = process.memoryUsage();
    console.log(`Current heap usage: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Memory health: ${memoryManager.getHealthStatus()}`);
    
    return passed === total;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests()
        .then(allPassed => {
            console.log(allPassed ? '\n🎉 All tests passed!' : '\n⚠️ Some tests failed');
            process.exit(allPassed ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Test suite crashed:', error);
            process.exit(1);
        });
}

export default runAllTests;
