#!/bin/bash

# Saudi Mais Inventory System - Production Backup Script

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="saudi_mais_inventory"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

print_status "Starting backup process..."

# Database backup
print_status "Creating database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U saudi_mais_user \
    -d $DB_NAME \
    --no-password \
    --clean \
    --if-exists \
    > "$BACKUP_DIR/db_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    print_status "✅ Database backup created: db_backup_$DATE.sql"
else
    print_error "❌ Database backup failed!"
    exit 1
fi

# Compress the backup
print_status "Compressing backup..."
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Application data backup (if any)
print_status "Creating application data backup..."
if [ -d "/app/data" ]; then
    tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" -C /app data/
    print_status "✅ Application data backup created: app_data_$DATE.tar.gz"
fi

# Clean old backups
print_status "Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List current backups
print_status "Current backups:"
ls -lh $BACKUP_DIR/

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
print_status "Total backup size: $BACKUP_SIZE"

print_status "🎉 Backup process completed successfully!"

# Optional: Upload to cloud storage
if [ "$UPLOAD_TO_CLOUD" = "true" ]; then
    print_status "Uploading to cloud storage..."
    # Add your cloud upload commands here
    # Example for AWS S3:
    # aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" s3://your-backup-bucket/
fi