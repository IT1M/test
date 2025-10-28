#!/bin/bash

# 📊 Saudi Mais Monitoring Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

print_header() {
    echo -e "\n${BLUE}📊 $1${NC}"
    echo "=================================="
}

print_header "Saudi Mais System Monitoring Setup"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    print_info "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running."
    print_info "Please start Docker Desktop:"
    print_info "  - On macOS: Open Docker Desktop from Applications"
    print_info "  - On Linux: sudo systemctl start docker"
    print_info "  - On Windows: Start Docker Desktop"
    
    # Try to start Docker on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Attempting to start Docker Desktop..."
        open -a Docker
        print_warning "Waiting for Docker to start (this may take a minute)..."
        
        # Wait for Docker to start (max 60 seconds)
        for i in {1..60}; do
            if docker info &> /dev/null; then
                print_success "Docker is now running!"
                break
            fi
            sleep 1
            if [ $i -eq 60 ]; then
                print_error "Docker failed to start within 60 seconds."
                print_info "Please start Docker Desktop manually and run this script again."
                exit 1
            fi
        done
    else
        exit 1
    fi
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available."
        print_info "Please install Docker Compose or use Docker Desktop which includes it."
        exit 1
    else
        # Use 'docker compose' instead of 'docker-compose'
        COMPOSE_CMD="docker compose"
    fi
else
    COMPOSE_CMD="docker-compose"
fi

print_success "Docker Compose is available"

# Create network if it doesn't exist
if ! docker network ls | grep -q "saudi-mais-network"; then
    print_info "Creating Docker network..."
    docker network create saudi-mais-network
    print_success "Network created: saudi-mais-network"
else
    print_success "Network already exists: saudi-mais-network"
fi

# Navigate to monitoring directory
cd "$(dirname "$0")/../monitoring"

# Pull latest Uptime Kuma image
print_info "Pulling latest Uptime Kuma image..."
docker pull louislam/uptime-kuma:1

# Start Uptime Kuma
print_info "Starting Uptime Kuma monitoring..."
$COMPOSE_CMD -f uptime-kuma.yml up -d

# Wait for service to be ready
print_info "Waiting for Uptime Kuma to start..."
sleep 10

# Check if service is running
if docker ps | grep -q "saudi-mais-monitor"; then
    print_success "Uptime Kuma is running!"
    print_info "Access the monitoring dashboard at: http://localhost:3001"
    print_info ""
    print_info "First-time setup:"
    print_info "1. Open http://localhost:3001 in your browser"
    print_info "2. Create an admin account"
    print_info "3. Add monitors for your Saudi Mais system:"
    print_info "   - Main App: http://localhost:3000/api/health"
    print_info "   - Detailed Health: http://localhost:3000/api/health/detailed"
    print_info ""
    print_warning "Make sure your main application is running on port 3000"
else
    print_error "Failed to start Uptime Kuma"
    print_info "Check logs with: $COMPOSE_CMD -f uptime-kuma.yml logs"
    exit 1
fi

# Test main application health endpoint
print_info "Testing main application health..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Main application health endpoint is responding"
else
    print_warning "Main application is not responding on http://localhost:3000"
    print_info "Make sure to start your Saudi Mais application with: npm run dev"
fi

print_header "Monitoring Setup Complete"
print_success "Uptime Kuma is running at: http://localhost:3001"
print_info "To stop monitoring: $COMPOSE_CMD -f uptime-kuma.yml down"
print_info "To view logs: $COMPOSE_CMD -f uptime-kuma.yml logs -f"