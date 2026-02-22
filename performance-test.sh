#!/bin/bash
# Zero Script QA - Performance Test Suite

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
RESULTS_FILE="/tmp/performance_test_$(date +%Y%m%d_%H%M%S).json"
LOG_FILE="/tmp/perf_test_$(date +%Y%m%d_%H%M%S).log"

# Test data
declare -a ENDPOINTS=(
  "POST|/api/auth/login|{\"email\":\"admin@katc.air\",\"password\":\"Admin123456\"}"
  "GET|/api/airlines"
  "GET|/api/callsigns"
  "GET|/api/actions"
)

# Statistics
declare -A TOTAL_TIME
declare -A RESPONSE_COUNT
declare -A ERROR_COUNT
CURRENT_CYCLE=1
MAX_CYCLES=3

# Initialize results file
echo "{" > "$RESULTS_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$RESULTS_FILE"
echo "  \"api_url\": \"$API_URL\"," >> "$RESULTS_FILE"
echo "  \"cycles\": $MAX_CYCLES," >> "$RESULTS_FILE"
echo "  \"endpoints_tested\": ${#ENDPOINTS[@]}," >> "$RESULTS_FILE"
echo "  \"results\": [" >> "$RESULTS_FILE"

log_message() {
  local level=$1
  local message=$2
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local cycle=$4
  local request_num=$5

  local start_time=$(date +%s%N)
  local response
  local status
  local duration_ms

  echo -n "  [$cycle/$MAX_CYCLES] Testing $method $endpoint... "

  if [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w "\n%{http_code}")
  else
    response=$(curl -s -X GET "$API_URL$endpoint" \
      -w "\n%{http_code}")
  fi

  # Extract status code (last line)
  status=$(echo "$response" | tail -n 1)
  local body=$(echo "$response" | head -n -1)

  local end_time=$(date +%s%N)
  local duration_ns=$((end_time - start_time))
  duration_ms=$(echo "scale=2; $duration_ns / 1000000" | bc)

  # Store metrics
  TOTAL_TIME["$endpoint"]=$(echo "${TOTAL_TIME[$endpoint]:-0} + $duration_ms" | bc)
  RESPONSE_COUNT["$endpoint"]=$(( ${RESPONSE_COUNT[$endpoint]:-0} + 1 ))

  # Determine status
  if [ "$status" -lt 400 ]; then
    echo -e "${GREEN}✓ $status ($duration_ms ms)${NC}"
  elif [ "$status" -lt 500 ]; then
    echo -e "${YELLOW}⚠ $status ($duration_ms ms)${NC}"
    ERROR_COUNT["$endpoint"]=$(( ${ERROR_COUNT[$endpoint]:-0} + 1 ))
  else
    echo -e "${RED}✗ $status ($duration_ms ms)${NC}"
    ERROR_COUNT["$endpoint"]=$(( ${ERROR_COUNT[$endpoint]:-0} + 1 ))
  fi

  # Log to results file
  if [ "$request_num" -gt 0 ] && [ "$request_num" -lt ${#ENDPOINTS[@]} ]; then
    echo "," >> "$RESULTS_FILE"
  fi

  cat >> "$RESULTS_FILE" <<EOF
    {
      "cycle": $cycle,
      "method": "$method",
      "endpoint": "$endpoint",
      "status": $status,
      "duration_ms": $duration_ms,
      "timestamp": "$(date -Iseconds)"
    }
EOF
}

run_performance_test() {
  print_header "ZERO SCRIPT QA - PERFORMANCE TEST STARTED"

  log_message "INFO" "API URL: $API_URL"
  log_message "INFO" "Cycles: $MAX_CYCLES"
  log_message "INFO" "Endpoints: ${#ENDPOINTS[@]}"
  log_message "INFO" "Results file: $RESULTS_FILE"

  echo -e "${YELLOW}Waiting for API to be ready...${NC}"
  sleep 2

  for ((cycle=1; cycle<=MAX_CYCLES; cycle++)); do
    print_header "CYCLE $cycle / $MAX_CYCLES"

    request_num=0
    for endpoint in "${ENDPOINTS[@]}"; do
      IFS='|' read -r method path data <<< "$endpoint"
      test_endpoint "$method" "$path" "$data" "$cycle" "$request_num"
      ((request_num++))
      sleep 0.1
    done

    echo ""
    if [ $cycle -lt $MAX_CYCLES ]; then
      echo -e "${YELLOW}Waiting 2 seconds before next cycle...${NC}"
      sleep 2
    fi
  done
}

print_summary() {
  print_header "PERFORMANCE TEST SUMMARY"

  echo -e "${BLUE}Response Time Statistics:${NC}\n"

  local total_requests=0
  local total_errors=0

  for endpoint in "${!TOTAL_TIME[@]}"; do
    local avg_time=$(echo "scale=2; ${TOTAL_TIME[$endpoint]} / ${RESPONSE_COUNT[$endpoint]}" | bc)
    local count=${RESPONSE_COUNT[$endpoint]}
    local errors=${ERROR_COUNT[$endpoint]:-0}
    local error_rate=$(echo "scale=2; $errors * 100 / $count" | bc)

    echo -e "  Endpoint: ${BLUE}$endpoint${NC}"
    echo -e "    Calls: $count"
    echo -e "    Average time: ${avg_time}ms"
    echo -e "    Errors: $errors ($error_rate%)"

    if (( $(echo "$avg_time < 100" | bc -l) )); then
      echo -e "    Status: ${GREEN}✓ Fast${NC}"
    elif (( $(echo "$avg_time < 200" | bc -l) )); then
      echo -e "    Status: ${YELLOW}⚠ Normal${NC}"
    else
      echo -e "    Status: ${RED}✗ Slow${NC}"
    fi
    echo ""

    total_requests=$((total_requests + count))
    total_errors=$((total_errors + errors))
  done

  local overall_error_rate=$(echo "scale=2; $total_errors * 100 / $total_requests" | bc)

  echo -e "${BLUE}Overall Statistics:${NC}"
  echo -e "  Total Requests: $total_requests"
  echo -e "  Total Errors: $total_errors (${overall_error_rate}%)"

  if (( $(echo "$overall_error_rate < 1" | bc -l) )); then
    echo -e "  Performance Grade: ${GREEN}A (Excellent)${NC}"
  elif (( $(echo "$overall_error_rate < 3" | bc -l) )); then
    echo -e "  Performance Grade: ${YELLOW}B (Good)${NC}"
  else
    echo -e "  Performance Grade: ${RED}C (Needs Improvement)${NC}"
  fi
}

# Close JSON results file
finalize_results() {
  echo "" >> "$RESULTS_FILE"
  echo "  ]" >> "$RESULTS_FILE"
  echo "}" >> "$RESULTS_FILE"

  log_message "INFO" "Results saved to: $RESULTS_FILE"
}

# Main execution
run_performance_test
finalize_results
print_summary

echo -e "\n${BLUE}Detailed log: $LOG_FILE${NC}\n"
