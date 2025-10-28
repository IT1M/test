#!/bin/bash

# 🔒 Encrypted Backup Script for Saudi Mais Inventory System

set -e

# Configuration
BACKUP_DIR="/var/backups/saudi-mais"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="saudi_mais_backup_${DATE}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

print_success "Starting encrypted backup process..."

# Create database backup
if docker-compose ps | grep -q "saudi-mais-db"; then
    print_success "Creating database backup..."
    docker-compose exec -T saudi-mais-db pg_dump -U postgres saudi_mais > "$BACKUP_DIR/$BACKUP_FILE"
else
    print_error "Database container not running!"
    exit 1
fi

# Encrypt backup
print_success "Encrypting backup..."
gpg --trust-model always --cipher-algo AES256 --compress-algo 1 --symmetric --output "$BACKUP_DIR/$ENCRYPTED_FILE" "$BACKUP_DIR/$BACKUP_FILE"

# Remove unencrypted backup
rm "$BACKUP_DIR/$BACKUP_FILE"

# Verify encrypted backup
if [ -f "$BACKUP_DIR/$ENCRYPTED_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$ENCRYPTED_FILE" | cut -f1)
    print_success "Encrypted backup created: $ENCRYPTED_FILE ($BACKUP_SIZE)"
else
    print_error "Failed to create encrypted backup!"
    exit 1
fi

# Clean old backups
print_success "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.gpg" -type f -mtime +$RETENTION_DAYS -delete

# Log backup
echo "$(date): Encrypted backup created - $ENCRYPTED_FILE" >> "$BACKUP_DIR/backup.log"

print_success "Encrypted backup completed successfully!"
