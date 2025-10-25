#!/bin/bash

# Saudi Mais Inventory System - Production Deployment Script

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if required files exist
print_status "Checking required files..."
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml file not found!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running!"
    exit 1
fi

# Build the application
print_status "Building the application..."
npm run build

# Run tests
print_status "Running tests..."
npm run test:auth
npm run test:ui-login

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Build Docker images
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
print_status "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed database if needed
print_warning "Do you want to seed the database? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_status "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec app npm run db:seed
fi

# Check if services are running
print_status "Checking service health..."
sleep 5

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_status "✅ Deployment successful!"
    print_status "Application is running at: https://your-domain.com"
    print_status "Database is accessible at: localhost:5432"
    print_status "Redis is accessible at: localhost:6379"
else
    print_error "❌ Deployment failed! Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps

print_status "🎉 Production deployment completed successfully!"
print_warning "Don't forget to:"
print_warning "1. Update DNS records to point to this server"
print_warning "2. Configure SSL certificates"
print_warning "3. Set up monitoring and backups"
print_warning "4. Change default admin password"