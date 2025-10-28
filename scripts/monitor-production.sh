#!/bin/bash

# Saudi Mais Inventory System - Production Monitoring Script

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[MONITOR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if containers are running
check_containers() {
    print_status "Checking container status..."
    
    containers=("saudi-mais-app" "saudi-mais-db" "saudi-mais-redis" "saudi-mais-nginx")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            print_status "✅ $container is running"
        else
            print_error "❌ $container is not running"
            return 1
        fi
    done
}

# Check application health
check_app_health() {
    print_status "Checking application health..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
    
    if [ "$response" = "200" ]; then
        print_status "✅ Application is healthy"
    else
        print_error "❌ Application health check failed (HTTP $response)"
        return 1
    fi
}

# Check database connection
check_database() {
    print_status "Checking database connection..."
    
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U saudi_mais_user > /dev/null 2>&1; then
        print_status "✅ Database is accessible"
    else
        print_error "❌ Database connection failed"
        return 1
    fi
}

# Check Redis connection
check_redis() {
    print_status "Checking Redis connection..."
    
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "✅ Redis is accessible"
    else
        print_error "❌ Redis connection failed"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        print_status "✅ Disk usage: ${usage}%"
    elif [ "$usage" -lt 90 ]; then
        print_warning "⚠️  Disk usage: ${usage}% (Warning)"
    else
        print_error "❌ Disk usage: ${usage}% (Critical)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    print_status "Checking memory usage..."
    
    usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt 80 ]; then
        print_status "✅ Memory usage: ${usage}%"
    elif [ "$usage" -lt 90 ]; then
        print_warning "⚠️  Memory usage: ${usage}% (Warning)"
    else
        print_error "❌ Memory usage: ${usage}% (Critical)"
        return 1
    fi
}

# Check SSL certificate expiry
check_ssl_cert() {
    print_status "Checking SSL certificate..."
    
    if [ -f "/etc/nginx/ssl/cert.pem" ]; then
        expiry=$(openssl x509 -enddate -noout -in /etc/nginx/ssl/cert.pem | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry" +%s)
        current_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_left" -gt 30 ]; then
            print_status "✅ SSL certificate expires in $days_left days"
        elif [ "$days_left" -gt 7 ]; then
            print_warning "⚠️  SSL certificate expires in $days_left days"
        else
            print_error "❌ SSL certificate expires in $days_left days (Critical)"
            return 1
        fi
    else
        print_warning "⚠️  SSL certificate not found"
    fi
}

# Main monitoring function
main() {
    print_status "🔍 Starting system health check..."
    echo "Timestamp: $(date)"
    echo "----------------------------------------"
    
    failed_checks=0
    
    check_containers || ((failed_checks++))
    check_app_health || ((failed_checks++))
    check_database || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_memory || ((failed_checks++))
    check_ssl_cert || ((failed_checks++))
    
    echo "----------------------------------------"
    
    if [ "$failed_checks" -eq 0 ]; then
        print_status "🎉 All checks passed! System is healthy."
        exit 0
    else
        print_error "❌ $failed_checks check(s) failed!"
        exit 1
    fi
}

# Run monitoring
main