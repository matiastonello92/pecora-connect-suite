#!/bin/bash

# k6 Load Testing Script Runner for Location Management System
# This script provides various options for running load tests

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_BASE_URL="https://cqlbidkagiknfplzbwse.supabase.co"
DEFAULT_WS_URL="wss://cqlbidkagiknfplzbwse.supabase.co"
DEFAULT_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if k6 is installed
check_k6_installation() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Installing k6..."
        
        # Detect OS and install k6
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -s https://dl.k6.io/key.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/k6-archive-keyring.gpg >/dev/null
            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install k6
            else
                print_error "Homebrew not found. Please install k6 manually: https://k6.io/docs/getting-started/installation/"
                exit 1
            fi
        else
            print_error "Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/"
            exit 1
        fi
        
        print_success "k6 installed successfully"
    else
        print_success "k6 is already installed ($(k6 version))"
    fi
}

# Function to create results directory
create_results_dir() {
    if [ ! -d "k6-results" ]; then
        mkdir -p k6-results
        print_info "Created k6-results directory"
    fi
}

# Function to run quick validation test
run_validation_test() {
    print_info "Running quick validation test..."
    
    export API_BASE_URL=${API_BASE_URL:-$DEFAULT_BASE_URL}
    export WS_URL=${WS_URL:-$DEFAULT_WS_URL}
    export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$DEFAULT_ANON_KEY}
    export AUTH_TOKEN=${AUTH_TOKEN:-""}
    
    k6 run --vus 10 --duration 30s \
        --out json=k6-results/validation-results.json \
        k6-load-test.js
    
    if [ $? -eq 0 ]; then
        print_success "Validation test passed! Ready for full load test."
    else
        print_error "Validation test failed. Please check your configuration."
        exit 1
    fi
}

# Function to run full load test
run_full_load_test() {
    print_info "Running full load test (100,000 concurrent users)..."
    print_warning "This test will run for approximately 15 minutes"
    
    export API_BASE_URL=${API_BASE_URL:-$DEFAULT_BASE_URL}
    export WS_URL=${WS_URL:-$DEFAULT_WS_URL}
    export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$DEFAULT_ANON_KEY}
    export AUTH_TOKEN=${AUTH_TOKEN:-""}
    
    # Create timestamp for results
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    # Run the full load test
    k6 run --vus 1000 --duration 15m \
        --out json=k6-results/full-load-test-${TIMESTAMP}.json \
        --out csv=k6-results/full-load-test-${TIMESTAMP}.csv \
        k6-load-test.js
    
    if [ $? -eq 0 ]; then
        print_success "Full load test completed successfully!"
        print_info "Results saved to k6-results/full-load-test-${TIMESTAMP}.*"
    else
        print_error "Load test failed. Check the results for details."
        exit 1
    fi
}

# Function to run custom test
run_custom_test() {
    local vus=$1
    local duration=$2
    
    print_info "Running custom test with ${vus} VUs for ${duration}..."
    
    export API_BASE_URL=${API_BASE_URL:-$DEFAULT_BASE_URL}
    export WS_URL=${WS_URL:-$DEFAULT_WS_URL}
    export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$DEFAULT_ANON_KEY}
    export AUTH_TOKEN=${AUTH_TOKEN:-""}
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    k6 run --vus ${vus} --duration ${duration} \
        --out json=k6-results/custom-test-${TIMESTAMP}.json \
        --out csv=k6-results/custom-test-${TIMESTAMP}.csv \
        k6-load-test.js
}

# Function to run with Docker
run_with_docker() {
    print_info "Running load test with Docker..."
    
    # Set environment variables for Docker
    export API_BASE_URL=${API_BASE_URL:-$DEFAULT_BASE_URL}
    export WS_URL=${WS_URL:-$DEFAULT_WS_URL}
    export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$DEFAULT_ANON_KEY}
    export AUTH_TOKEN=${AUTH_TOKEN:-""}
    
    # Create results directory
    mkdir -p k6-results
    
    # Run with docker-compose
    docker-compose -f docker-compose.k6.yml up --build
    
    print_success "Docker-based load test completed!"
}

# Function to analyze results
analyze_results() {
    print_info "Analyzing test results..."
    
    # Find the most recent JSON result file
    LATEST_RESULT=$(ls -t k6-results/*.json 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_RESULT" ]; then
        print_error "No test results found in k6-results directory"
        exit 1
    fi
    
    print_info "Analyzing: $LATEST_RESULT"
    
    # Extract key metrics using jq (if available)
    if command -v jq &> /dev/null; then
        echo ""
        echo "📊 Key Performance Metrics:"
        echo "=========================="
        
        # Total requests
        total_requests=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "$LATEST_RESULT")
        echo "Total Requests: $total_requests"
        
        # Request rate
        request_rate=$(jq -r '.metrics.http_reqs.values.rate // "N/A"' "$LATEST_RESULT")
        echo "Request Rate: ${request_rate}/s"
        
        # Error rate
        error_rate=$(jq -r '.metrics.http_req_failed.values.rate // "N/A"' "$LATEST_RESULT")
        echo "Error Rate: $(echo "$error_rate * 100" | bc -l 2>/dev/null || echo "$error_rate")%"
        
        # Response times
        p95_duration=$(jq -r '.metrics.http_req_duration.values.p95 // "N/A"' "$LATEST_RESULT")
        echo "95th Percentile Response Time: ${p95_duration}ms"
        
        echo ""
        echo "🎯 Endpoint-Specific Metrics:"
        echo "============================="
        
        # Location fetch time
        location_fetch_p95=$(jq -r '.metrics.location_fetch_duration.values.p95 // "N/A"' "$LATEST_RESULT")
        echo "Location Fetch (p95): ${location_fetch_p95}ms"
        
        # Location switch time
        location_switch_p95=$(jq -r '.metrics.location_switch_duration.values.p95 // "N/A"' "$LATEST_RESULT")
        echo "Location Switch (p95): ${location_switch_p95}ms"
        
        # Dashboard load time
        dashboard_load_p95=$(jq -r '.metrics.dashboard_load_duration.values.p95 // "N/A"' "$LATEST_RESULT")
        echo "Dashboard Load (p95): ${dashboard_load_p95}ms"
        
        # Chat latency
        chat_latency_p95=$(jq -r '.metrics.chat_latency.values.p95 // "N/A"' "$LATEST_RESULT")
        echo "Chat Latency (p95): ${chat_latency_p95}ms"
        
        echo ""
        echo "✅ Success Rates:"
        echo "================"
        
        # Success rates
        location_switch_success=$(jq -r '.metrics.location_switch_success.values.rate // "N/A"' "$LATEST_RESULT")
        echo "Location Switch Success: $(echo "$location_switch_success * 100" | bc -l 2>/dev/null || echo "$location_switch_success")%"
        
        dashboard_success=$(jq -r '.metrics.dashboard_load_success.values.rate // "N/A"' "$LATEST_RESULT")
        echo "Dashboard Load Success: $(echo "$dashboard_success * 100" | bc -l 2>/dev/null || echo "$dashboard_success")%"
        
        chat_success=$(jq -r '.metrics.chat_connection_success.values.rate // "N/A"' "$LATEST_RESULT")
        echo "Chat Connection Success: $(echo "$chat_success * 100" | bc -l 2>/dev/null || echo "$chat_success")%"
        
    else
        print_warning "jq not installed. Install jq for detailed result analysis."
        print_info "Raw results available in: $LATEST_RESULT"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  validate              Run quick validation test (10 VUs, 30s)"
    echo "  full                  Run full load test (100K VUs, 15m)"
    echo "  custom [VUs] [duration] Run custom test with specified parameters"
    echo "  docker                Run with Docker Compose"
    echo "  analyze               Analyze most recent test results"
    echo "  help                  Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL          Base URL for API endpoints (default: Supabase URL)"
    echo "  WS_URL                WebSocket URL for chat testing (default: Supabase WS)"
    echo "  SUPABASE_ANON_KEY     Supabase anonymous key"
    echo "  AUTH_TOKEN            JWT token for authenticated requests"
    echo ""
    echo "Examples:"
    echo "  $0 validate                           # Quick validation"
    echo "  $0 full                               # Full 100K user test"
    echo "  $0 custom 5000 10m                    # 5K users for 10 minutes"
    echo "  API_BASE_URL=http://localhost:3000 $0 validate  # Test local API"
}

# Main script logic
main() {
    print_info "🚀 k6 Load Testing Script for Location Management System"
    echo ""
    
    # Check if k6 is installed
    check_k6_installation
    
    # Create results directory
    create_results_dir
    
    # Parse command line arguments
    case "${1:-help}" in
        "validate")
            run_validation_test
            ;;
        "full")
            run_full_load_test
            ;;
        "custom")
            if [ -z "$2" ] || [ -z "$3" ]; then
                print_error "Usage: $0 custom [VUs] [duration]"
                print_error "Example: $0 custom 5000 10m"
                exit 1
            fi
            run_custom_test "$2" "$3"
            ;;
        "docker")
            run_with_docker
            ;;
        "analyze")
            analyze_results
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"