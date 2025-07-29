#!/bin/bash

# K6 Stress Testing Runner Script
# Usage: ./run-k6-tests.sh [test-suite] [environment] [output-format]

set -e

# Default values
TEST_SUITE=${1:-"auth-system"}
ENVIRONMENT=${2:-"development"}
OUTPUT_FORMAT=${3:-"json"}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/k6-config.json"
RESULTS_DIR="$SCRIPT_DIR/../test-results/k6"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} K6 STRESS TESTING SUITE${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if k6 is installed
check_k6_installation() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first:"
        echo "  - macOS: brew install k6"
        echo "  - Linux: sudo apt-get install k6"
        echo "  - Windows: winget install k6"
        echo "  - Or visit: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    print_status "k6 version: $(k6 version --short)"
}

# Function to validate configuration
validate_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
    
    # Extract configuration using jq if available
    if command -v jq &> /dev/null; then
        local base_url=$(jq -r ".environments.$ENVIRONMENT.baseUrl" "$CONFIG_FILE")
        local max_users=$(jq -r ".environments.$ENVIRONMENT.maxConcurrentUsers" "$CONFIG_FILE")
        
        if [ "$base_url" = "null" ]; then
            print_error "Environment '$ENVIRONMENT' not found in configuration"
            exit 1
        fi
        
        print_status "Environment: $ENVIRONMENT"
        print_status "Base URL: $base_url"
        print_status "Max Concurrent Users: $max_users"
    else
        print_warning "jq not found. Skipping configuration validation."
    fi
}

# Function to run specific test suite
run_test_suite() {
    local test_script="$SCRIPT_DIR/$1"
    local output_file="$RESULTS_DIR/${TEST_SUITE}_${ENVIRONMENT}_${TIMESTAMP}"
    
    if [ ! -f "$test_script" ]; then
        print_error "Test script not found: $test_script"
        exit 1
    fi
    
    print_status "Running test suite: $TEST_SUITE"
    print_status "Script: $test_script"
    print_status "Output: $output_file"
    
    # Set environment variables
    export BASE_URL=$(jq -r ".environments.$ENVIRONMENT.baseUrl" "$CONFIG_FILE" 2>/dev/null || echo "https://cqlbidkagiknfplzbwse.supabase.co")
    export ANON_KEY=$(jq -r ".environments.$ENVIRONMENT.anonKey" "$CONFIG_FILE" 2>/dev/null || echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA")
    
    # Build k6 command with appropriate output format
    local k6_cmd="k6 run"
    
    case $OUTPUT_FORMAT in
        "json")
            k6_cmd="$k6_cmd --out json=$output_file.json"
            ;;
        "influxdb")
            k6_cmd="$k6_cmd --out influxdb=http://localhost:8086/k6"
            ;;
        "html")
            k6_cmd="$k6_cmd --out json=$output_file.json"
            ;;
        *)
            print_warning "Unknown output format: $OUTPUT_FORMAT. Using JSON."
            k6_cmd="$k6_cmd --out json=$output_file.json"
            ;;
    esac
    
    # Add summary output
    k6_cmd="$k6_cmd --summary-export=$output_file.summary.json"
    
    # Run the test
    print_status "Executing: $k6_cmd $test_script"
    echo ""
    
    if $k6_cmd "$test_script"; then
        print_status "Test completed successfully!"
        
        # Generate HTML report if requested
        if [ "$OUTPUT_FORMAT" = "html" ] && [ -f "$output_file.json" ]; then
            generate_html_report "$output_file.json" "$output_file.html"
        fi
        
        # Display summary
        display_test_summary "$output_file.summary.json"
        
    else
        print_error "Test failed!"
        exit 1
    fi
}

# Function to generate HTML report
generate_html_report() {
    local json_file="$1"
    local html_file="$2"
    
    print_status "Generating HTML report: $html_file"
    
    # Create simple HTML report template
    cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>K6 Stress Test Report - $TEST_SUITE</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>K6 Stress Test Report</h1>
        <p><strong>Test Suite:</strong> $TEST_SUITE</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Timestamp:</strong> $(date)</p>
    </div>
    
    <div class="metric">
        <h3>Test Results</h3>
        <p>Detailed metrics are available in the JSON file: $(basename "$json_file")</p>
    </div>
</body>
</html>
EOF
}

# Function to display test summary
display_test_summary() {
    local summary_file="$1"
    
    if [ -f "$summary_file" ] && command -v jq &> /dev/null; then
        echo ""
        print_status "Test Summary:"
        echo "================================"
        
        # Extract key metrics
        local http_reqs=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "$summary_file")
        local http_req_duration_avg=$(jq -r '.metrics.http_req_duration.values.avg // "N/A"' "$summary_file")
        local http_req_duration_p95=$(jq -r '.metrics.http_req_duration.values["p(95)"] // "N/A"' "$summary_file")
        local http_req_failed=$(jq -r '.metrics.http_req_failed.values.rate // "N/A"' "$summary_file")
        
        echo "Total HTTP Requests: $http_reqs"
        echo "Average Response Time: ${http_req_duration_avg}ms"
        echo "95th Percentile Response Time: ${http_req_duration_p95}ms"
        echo "Error Rate: ${http_req_failed}%"
        echo "================================"
    else
        print_warning "Cannot display summary. Missing jq or summary file."
    fi
}

# Function to show available test suites
show_available_tests() {
    echo "Available test suites:"
    for script in "$SCRIPT_DIR"/*.js; do
        if [ -f "$script" ]; then
            local basename=$(basename "$script" .js)
            echo "  - $basename"
        fi
    done
}

# Function to show help
show_help() {
    echo "K6 Stress Testing Runner"
    echo ""
    echo "Usage: $0 [test-suite] [environment] [output-format]"
    echo ""
    echo "Arguments:"
    echo "  test-suite     Test suite to run (default: auth-system)"
    echo "  environment    Target environment (default: development)"
    echo "  output-format  Output format: json, html, influxdb (default: json)"
    echo ""
    echo "Examples:"
    echo "  $0 auth-system development json"
    echo "  $0 chat-system staging html"
    echo "  $0 inventory-system production influxdb"
    echo ""
    show_available_tests
}

# Main execution
main() {
    case "$1" in
        "--help"|"-h")
            show_help
            exit 0
            ;;
        "--list"|"-l")
            show_available_tests
            exit 0
            ;;
    esac
    
    print_header
    
    check_k6_installation
    validate_config
    
    # Determine test script file
    local test_script=""
    case $TEST_SUITE in
        "auth-system"|"auth")
            test_script="auth-api-test.js"
            ;;
        "chat-system"|"chat")
            test_script="chat-system-test.js"
            ;;
        "inventory-system"|"inventory")
            test_script="inventory-system-test.js"
            ;;
        *)
            test_script="$TEST_SUITE.js"
            ;;
    esac
    
    run_test_suite "$test_script"
    
    print_status "All tests completed. Results saved to: $RESULTS_DIR"
}

# Run main function with all arguments
main "$@"