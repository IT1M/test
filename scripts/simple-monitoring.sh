#!/bin/bash

# 📊 Simple System Monitoring for Saudi Mais Inventory System

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

print_header() {
    echo -e "\n${BLUE}📊 $1${NC}"
    echo "=================================="
}

# Configuration
APP_URL="http://localhost:3000"
HEALTH_ENDPOINT="$APP_URL/api/health"
DETAILED_HEALTH_ENDPOINT="$APP_URL/api/health/detailed"
LOG_FILE="./monitoring/system-monitor.log"
ALERT_FILE="./monitoring/alerts.log"

# Create monitoring directory
mkdir -p ./monitoring

print_header "Saudi Mais System Monitor"

# Function to check application health
check_app_health() {
    local endpoint=$1
    local name=$2
    
    if curl -s -f "$endpoint" > /dev/null 2>&1; then
        print_success "$name is healthy"
        echo "$(date): $name - HEALTHY" >> "$LOG_FILE"
        return 0
    else
        print_error "$name is not responding"
        echo "$(date): $name - UNHEALTHY" >> "$LOG_FILE"
        echo "$(date): ALERT - $name is down" >> "$ALERT_FILE"
        return 1
    fi
}

# Function to get detailed health info
get_detailed_health() {
    print_info "Fetching detailed health information..."
    
    local response=$(curl -s "$DETAILED_HEALTH_ENDPOINT" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        echo "$(date): Detailed health check completed" >> "$LOG_FILE"
    else
        print_warning "Could not fetch detailed health information"
    fi
}

# Function to check system resources
check_system_resources() {
    print_info "Checking system resources..."
    
    # Memory usage
    if command -v free &> /dev/null; then
        echo "Memory Usage:"
        free -h
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Memory Usage (macOS):"
        vm_stat | head -10
    fi
    
    echo ""
    
    # Disk usage
    echo "Disk Usage:"
    df -h . 2>/dev/null || df -h
    
    echo ""
    
    # CPU load (if available)
    if command -v uptime &> /dev/null; then
        echo "System Load:"
        uptime
    fi
    
    echo "$(date): System resources checked" >> "$LOG_FILE"
}

# Function to check database connectivity
check_database() {
    print_info "Checking database connectivity..."
    
    if [[ -n "$DATABASE_URL" ]]; then
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                print_success "Database connection successful"
                echo "$(date): Database - CONNECTED" >> "$LOG_FILE"
            else
                print_error "Database connection failed"
                echo "$(date): Database - DISCONNECTED" >> "$LOG_FILE"
                echo "$(date): ALERT - Database connection failed" >> "$ALERT_FILE"
            fi
        else
            print_warning "psql not available, skipping direct database check"
        fi
    else
        print_warning "DATABASE_URL not set, skipping database check"
    fi
}

# Function to check Node.js processes
check_nodejs_processes() {
    print_info "Checking Node.js processes..."
    
    local node_processes=$(ps aux | grep -E "(node|npm|next)" | grep -v grep | wc -l)
    
    if [ "$node_processes" -gt 0 ]; then
        print_success "Found $node_processes Node.js process(es)"
        ps aux | grep -E "(node|npm|next)" | grep -v grep | head -5
        echo "$(date): Node.js processes - $node_processes running" >> "$LOG_FILE"
    else
        print_warning "No Node.js processes found"
        echo "$(date): Node.js processes - NONE" >> "$LOG_FILE"
    fi
}

# Function to generate monitoring report
generate_report() {
    local report_file="./monitoring/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    print_info "Generating monitoring report..."
    
    cat > "$report_file" << EOF
# Saudi Mais System Health Report
Generated: $(date)

## Application Health
EOF

    # Check main health endpoint
    if curl -s -f "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        echo "✅ Main Application: HEALTHY" >> "$report_file"
    else
        echo "❌ Main Application: UNHEALTHY" >> "$report_file"
    fi
    
    # Get detailed health if available
    echo "" >> "$report_file"
    echo "## Detailed Health Information" >> "$report_file"
    local detailed_health=$(curl -s "$DETAILED_HEALTH_ENDPOINT" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$detailed_health" ]; then
        echo "$detailed_health" >> "$report_file"
    else
        echo "Detailed health information not available" >> "$report_file"
    fi
    
    # System resources
    echo "" >> "$report_file"
    echo "## System Resources" >> "$report_file"
    echo "Disk Usage:" >> "$report_file"
    df -h . >> "$report_file" 2>/dev/null || df -h >> "$report_file"
    
    echo "" >> "$report_file"
    echo "Memory Usage:" >> "$report_file"
    if command -v free &> /dev/null; then
        free -h >> "$report_file"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        vm_stat >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "System Load:" >> "$report_file"
    uptime >> "$report_file" 2>/dev/null || echo "Load information not available" >> "$report_file"
    
    print_success "Report generated: $report_file"
}

# Main monitoring function
run_monitoring() {
    local mode=${1:-"single"}
    
    if [ "$mode" = "continuous" ]; then
        print_info "Starting continuous monitoring (Ctrl+C to stop)..."
        
        while true; do
            clear
            print_header "Saudi Mais System Monitor - $(date)"
            
            check_app_health "$HEALTH_ENDPOINT" "Main Application"
            echo ""
            
            get_detailed_health
            echo ""
            
            check_system_resources
            echo ""
            
            check_nodejs_processes
            echo ""
            
            print_info "Next check in 30 seconds..."
            sleep 30
        done
    else
        # Single check
        check_app_health "$HEALTH_ENDPOINT" "Main Application"
        echo ""
        
        check_app_health "$DETAILED_HEALTH_ENDPOINT" "Detailed Health API"
        echo ""
        
        get_detailed_health
        echo ""
        
        check_database
        echo ""
        
        check_system_resources
        echo ""
        
        check_nodejs_processes
        echo ""
        
        generate_report
    fi
}

# Parse command line arguments
case "${1:-single}" in
    "continuous"|"watch"|"-w")
        run_monitoring "continuous"
        ;;
    "report"|"-r")
        generate_report
        ;;
    "logs"|"-l")
        print_info "Recent monitoring logs:"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No logs found"
        ;;
    "alerts"|"-a")
        print_info "Recent alerts:"
        tail -10 "$ALERT_FILE" 2>/dev/null || echo "No alerts found"
        ;;
    "help"|"-h"|"--help")
        echo "Saudi Mais System Monitor"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  single      Single health check (default)"
        echo "  continuous  Continuous monitoring"
        echo "  report      Generate detailed report"
        echo "  logs        Show recent logs"
        echo "  alerts      Show recent alerts"
        echo "  help        Show this help"
        ;;
    *)
        run_monitoring "single"
        ;;
esac