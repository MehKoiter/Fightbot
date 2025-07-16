/**
 * Test Runner - Organized Test Suite Manager
 * Runs all tests in the proper order and provides comprehensive reporting
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

console.log("🧪 FightBot Test Suite Runner");
console.log("==============================");

const testCategories = {
  unit: {
    name: "Unit Tests",
    description: "Test individual components and functions",
    path: "tests/unit",
    icon: "🔧",
  },
  integration: {
    name: "Integration Tests",
    description: "Test component interactions and workflows",
    path: "tests/integration",
    icon: "🔗",
  },
  performance: {
    name: "Performance Tests",
    description: "Test timing, caching, and performance metrics",
    path: "tests/performance",
    icon: "⚡",
  },
};

async function runTest(testFile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn("node", [testFile], { stdio: "pipe" });

    let output = "";
    let hasError = false;

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      output += data.toString();
      hasError = true;
    });

    child.on("close", (code) => {
      const duration = Date.now() - startTime;
      resolve({
        file: testFile,
        success: code === 0 && !hasError,
        duration,
        output,
        code,
      });
    });
  });
}

async function runTestCategory(category) {
  console.log(`\\n${category.icon} ${category.name}`);
  console.log("=".repeat(category.name.length + 4));
  console.log(`${category.description}\\n`);

  const testPath = category.path;

  if (!fs.existsSync(testPath)) {
    console.log(`❌ Test directory not found: ${testPath}`);
    return { passed: 0, failed: 0, total: 0 };
  }

  const testFiles = fs
    .readdirSync(testPath)
    .filter((file) => file.endsWith(".test.js"))
    .map((file) => path.join(testPath, file));

  if (testFiles.length === 0) {
    console.log(`ℹ️  No test files found in ${testPath}`);
    return { passed: 0, failed: 0, total: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    const testName = path.basename(testFile, ".test.js");
    console.log(`🔍 Running: ${testName}`);

    try {
      const result = await runTest(testFile);

      if (result.success) {
        console.log(`   ✅ PASSED (${result.duration}ms)`);
        passed++;
      } else {
        console.log(`   ❌ FAILED (${result.duration}ms)`);
        console.log(`   Error code: ${result.code}`);
        if (result.output) {
          console.log(`   Output: ${result.output.slice(0, 200)}...`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: testFiles.length };
}

async function runAllTests() {
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  // Run tests by category
  for (const [key, category] of Object.entries(testCategories)) {
    const results = await runTestCategory(category);
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalTests += results.total;
  }

  const totalDuration = Date.now() - startTime;

  // Summary report
  console.log("\\n🏆 Test Suite Summary");
  console.log("=====================");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(
    `📊 Success Rate: ${
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
    }%`
  );
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  if (totalFailed === 0) {
    console.log("\\n🎉 All tests passed! FightBot is ready for deployment.");
  } else {
    console.log(
      `\\n⚠️  ${totalFailed} test(s) failed. Please review and fix before deployment.`
    );
  }

  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node test-runner.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --unit         Run only unit tests");
  console.log("  --integration  Run only integration tests");
  console.log("  --performance  Run only performance tests");
  console.log("  --help, -h     Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  node test-runner.js              # Run all tests");
  console.log("  node test-runner.js --unit       # Run only unit tests");
  console.log(
    "  node test-runner.js --performance# Run only performance tests"
  );
  process.exit(0);
}

// Run specific category or all tests
if (args.includes("--unit")) {
  runTestCategory(testCategories.unit).then(() => process.exit(0));
} else if (args.includes("--integration")) {
  runTestCategory(testCategories.integration).then(() => process.exit(0));
} else if (args.includes("--performance")) {
  runTestCategory(testCategories.performance).then(() => process.exit(0));
} else {
  runAllTests();
}
