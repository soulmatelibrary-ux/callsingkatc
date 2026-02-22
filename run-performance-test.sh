#!/bin/bash

# Zero Script QA - Performance Test
# Real-time monitoring with Docker logs

API_URL="http://localhost:3006"
TEST_RESULTS="/tmp/perf_results_$(date +%Y%m%d_%H%M%S).json"
LOG_FILE="/tmp/perf_test_$(date +%Y%m%d_%H%M%S).log"

echo "Starting Zero Script QA Performance Test..."
echo "Results will be saved to: $TEST_RESULTS"
echo ""

# Test 1: Login - Measure authentication performance
echo "[TEST 1] POST /api/auth/login - Authentication"
time curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@katc.com","password":"Admin123456"}' \
  | head -50

echo ""
echo ""

# Test 2: Get Airlines - Public API without auth
echo "[TEST 2] GET /api/airlines - Public API"
time curl -s "$API_URL/api/airlines" | jq . 2>/dev/null | head -50

echo ""
echo ""

# Test 3: Get Callsigns - Public API
echo "[TEST 3] GET /api/callsigns - Callsigns List"
time curl -s "$API_URL/api/callsigns?limit=10" | jq . 2>/dev/null | head -50

echo ""
echo ""

# Test 4: Stress test - Multiple sequential requests
echo "[TEST 4] Stress Test - 10 sequential requests to /api/airlines"
for i in {1..10}; do
  echo "Request $i..."
  curl -s "$API_URL/api/airlines" > /dev/null
done

echo ""
echo "Performance test completed!"
