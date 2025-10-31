# Backup and Recovery Guide

This guide explains how to use the backup, restore, and import/export features in the Medical Products Management System.

## Features Overview

The system provides three main data management capabilities:

1. **Backup & Restore** - Full database backups with metadata and settings
2. **Bulk Import/Export** - Excel/CSV import and export for products, customers, and patients
3. **Legacy Import/Export** - Raw database JSON import/export (advanced users)

## Backup & Restore

### Creating a Backup

There are two ways to create a backup:

1. **Create Backup** - Creates a backup and stores the timestamp locally
2. **Download Backup** - Creates a backup and immediately downloads it as a JSON file

**Backup Contents:**
- All database tables (products, customers, orders, inventory, sales, patients, medical records, etc.)
- System settings (if enabled)
- Metadata (record counts, export date, database version)

### Automatic Backups

Enable automatic backups in the Data Management Settings:

1. Toggle "Enable Automatic Backups"
2. The system will create backups automatically based on the configured schedule
3. Last backup timestamp is displayed in the Database Statistics section

### Restoring from Backup

**⚠️ WARNING: Restoring will replace ALL existing data!**

To restore from a backup:

1. Click "Restore from Backup"
2. Select a backup JSON file
3. Review the warning message
4. Click "Restore Backup" to proceed
5. The system will validate the backup file before restoring
6. Progress indicator shows restore status
7. Page will reload automatically after successful restore

**Backup Validation:**
- Checks for required metadata
- Validates all table structures
- Reports any format errors before proceeding

## Bulk Import/Export

### Exporting Data

Export data to Excel format:

1. Click the appropriate export button:
   - **Export Products** - All product data
   - **Export Customers** - All customer data
   - **Export Patients** - All patient data
2. File downloads automatically with timestamp in filename

**Export Format:**
- Excel (.xlsx) format
- Human-readable column headers
- All relevant fields included
- Date fields formatted as YYYY-MM-DD

### Importing Data

Import data from Excel or CSV files:

1. Click "Import from Excel/CSV"
2. Select data type (Products, Customers, or Patients)
3. Choose your Excel or CSV file
4. Click "Import Data"

**Import Features:**
- Data validation before import
- Duplicate detection (SKU, Customer ID, National ID)
- Detailed error reporting
- Partial import support (valid rows imported, invalid rows skipped)

### Import File Format

#### Products Import

Required columns:
- `sku` - Unique product identifier (string)
- `name` - Product name (string)

Optional columns:
- `category` - Product category
- `description` - Product description
- `manufacturer` - Manufacturer name
- `unitPrice` - Selling price (number)
- `costPrice` - Cost price (number)
- `stockQuantity` - Current stock (number)
- `reorderLevel` - Reorder threshold (number)
- `expiryDate` - Expiry date (YYYY-MM-DD)
- `batchNumber` - Batch number
- `regulatoryInfo` - Regulatory information
- `imageUrl` - Product image URL
- `isActive` - Active status (true/false)

#### Customers Import

Required columns:
- `customerId` - Unique customer identifier (string)
- `name` - Customer name (string)

Optional columns:
- `type` - Customer type (hospital/clinic/pharmacy/distributor)
- `contactPerson` - Contact person name
- `phone` - Phone number
- `email` - Email address
- `address` - Street address
- `city` - City
- `country` - Country
- `taxId` - Tax identification number
- `creditLimit` - Credit limit (number)
- `paymentTerms` - Payment terms (e.g., "Net 30")
- `segment` - Customer segment
- `isActive` - Active status (true/false)

#### Patients Import

Required columns:
- `nationalId` - Unique national identifier (string)
- `firstName` - First name (string)
- `lastName` - Last name (string)

Optional columns:
- `dateOfBirth` - Date of birth (YYYY-MM-DD)
- `gender` - Gender (male/female/other)
- `phone` - Phone number
- `email` - Email address
- `address` - Address
- `bloodType` - Blood type
- `allergies` - Comma-separated list of allergies
- `chronicConditions` - Comma-separated list of conditions
- `linkedCustomerId` - Associated customer ID

### Import Validation

The system validates:
- Required fields are present
- Data types are correct
- Email format is valid
- Numeric fields contain valid numbers
- Enum fields contain valid values
- No duplicate identifiers

**Error Handling:**
- Validation errors are reported with row number and field name
- Valid rows are imported even if some rows fail
- Import summary shows: imported count, failed count, and error details

## Database Statistics

The Data Management Settings page displays:

- **Database Size** - Approximate size in MB
- **Total Records** - Count of all records across main tables
- **Last Backup** - Time since last backup (e.g., "2 hours ago")

## Best Practices

### Backup Strategy

1. **Regular Backups**
   - Enable automatic backups
   - Download backups before major changes
   - Store backups in multiple locations

2. **Before Critical Operations**
   - Create backup before bulk imports
   - Create backup before system updates
   - Create backup before data cleanup

3. **Backup Storage**
   - Keep at least 3 recent backups
   - Store backups outside the browser
   - Test restore process periodically

### Import/Export Strategy

1. **Data Preparation**
   - Use provided export as template
   - Validate data in Excel before import
   - Start with small test imports

2. **Import Process**
   - Review validation errors carefully
   - Fix errors and re-import failed rows
   - Verify imported data after import

3. **Data Quality**
   - Ensure unique identifiers are truly unique
   - Validate email and phone formats
   - Check date formats (YYYY-MM-DD)

## Troubleshooting

### Backup Issues

**Problem:** Backup file is too large
- **Solution:** Export specific entities instead of full backup

**Problem:** Backup fails to create
- **Solution:** Check browser console for errors, ensure sufficient storage

### Restore Issues

**Problem:** "Invalid backup format" error
- **Solution:** Ensure file is a valid backup JSON file, not corrupted

**Problem:** Restore fails midway
- **Solution:** Check browser console, may need to clear database and retry

### Import Issues

**Problem:** Many validation errors
- **Solution:** Review error messages, fix data in Excel, re-import

**Problem:** Duplicate entries skipped
- **Solution:** Check for existing records with same identifiers

**Problem:** Import file not accepted
- **Solution:** Ensure file is .xlsx, .xls, or .csv format

## Technical Details

### Backup File Structure

```json
{
  "metadata": {
    "version": 1,
    "exportDate": "2024-01-15T10:30:00.000Z",
    "databaseVersion": 1,
    "recordCounts": {
      "products": 150,
      "customers": 75,
      "orders": 320,
      ...
    }
  },
  "data": {
    "products": [...],
    "customers": [...],
    ...
  },
  "settings": {...}
}
```

### Import Process Flow

1. File upload and parsing
2. Data validation (row by row)
3. Duplicate detection
4. Bulk insert of valid records
5. Error reporting
6. System log entry

### Storage Locations

- **Backups:** Browser downloads folder
- **Last Backup Timestamp:** localStorage
- **Auto Backup Setting:** localStorage
- **Database:** IndexedDB (browser storage)

## API Reference

### BackupService

```typescript
// Create backup
await BackupService.createBackup(includeSettings: boolean)

// Download backup
await BackupService.downloadBackup(includeSettings: boolean)

// Restore backup
await BackupService.restoreBackup(backup, options)

// Get backup stats
await BackupService.getBackupStats()
```

### ImportExportService

```typescript
// Import data
await ImportExportService.importProducts(file)
await ImportExportService.importCustomers(file)
await ImportExportService.importPatients(file)

// Export data
await ImportExportService.exportProducts()
await ImportExportService.exportCustomers()
await ImportExportService.exportPatients()
```

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Review this documentation
3. Contact system administrator
4. Check system logs in Admin Dashboard
