#!/usr/bin/env node

/**
 * Cloudflare Workers Migration Validation Script
 *
 * This script validates that the migration from Vercel Edge Runtime
 * to Cloudflare Workers is working correctly.
 */

const tests = [
  {
    name: "Health Check",
    endpoint: "/health",
    method: "GET",
    expectedStatus: 200,
    expectedKeys: ["status", "timestamp", "runtime"],
  },
  {
    name: "Root Endpoint",
    endpoint: "/",
    method: "GET",
    expectedStatus: 200,
    expectedKeys: ["message", "endpoints"],
  },
  {
    name: "tRPC Health Check",
    endpoint: "/api/trpc/info.hello",
    method: "POST",
    body: { json: { name: "World" } },
    expectedStatus: 200,
    expectedKeys: ["result"],
  },
]

async function runTest(baseUrl, test) {
  console.log(`\n🧪 Testing: ${test.name}`)
  console.log(`   ${test.method} ${baseUrl}${test.endpoint}`)

  try {
    const options = {
      method: test.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Migration-Validator/1.0",
      },
    }

    if (test.body) {
      options.body = JSON.stringify(test.body)
    }

    const response = await fetch(`${baseUrl}${test.endpoint}`, options)
    const data = await response.json()

    console.log(`   Status: ${response.status} ${response.status === test.expectedStatus ? "✅" : "❌"}`)

    if (test.expectedKeys) {
      const hasAllKeys = test.expectedKeys.every((key) => {
        const hasKey = key in data || (data.result && key in data.result)
        console.log(`   Key "${key}": ${hasKey ? "✅" : "❌"}`)
        return hasKey
      })

      if (!hasAllKeys) {
        console.log(`   Response:`, JSON.stringify(data, null, 2))
      }
    }

    // Check for Workers-specific indicators
    if (test.name === "Health Check" && data.runtime) {
      console.log(`   Runtime: ${data.runtime} ${data.runtime === "cloudflare-workers" ? "✅" : "⚠️"}`)
    }

    return response.status === test.expectedStatus
  } catch (error) {
    console.log(`   Error: ${error.message} ❌`)
    return false
  }
}

async function validateMigration() {
  console.log("🚀 Cloudflare Workers Migration Validation")
  console.log("==========================================")

  const baseUrl = process.env.TEST_URL || "http://localhost:8790"
  console.log(`🌐 Testing against: ${baseUrl}`)

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const success = await runTest(baseUrl, test)
    if (success) {
      passed++
    } else {
      failed++
    }
  }

  console.log("\n📊 Results:")
  console.log(`   Passed: ${passed} ✅`)
  console.log(`   Failed: ${failed} ${failed > 0 ? "❌" : ""}`)

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Migration appears successful.")
    console.log("\n📋 Next Steps:")
    console.log("   1. Test your specific API endpoints")
    console.log("   2. Verify database connections")
    console.log("   3. Test environment variables")
    console.log("   4. Deploy to staging environment")
    console.log("   5. Run production validation")
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.")
    process.exit(1)
  }
}

// Handle both Node.js and module execution
if (typeof require !== "undefined" && require.main === module) {
  validateMigration().catch(console.error)
}
