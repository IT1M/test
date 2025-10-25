# Database Setup Guide

This directory contains the Prisma schema and database configuration for the Saudi Mais Inventory System.

## Prerequisites

- PostgreSQL database (local or hosted)
- Node.js and npm installed

## Environment Setup

1. Copy `.env.example` to `.env` in the root directory
2. Update the `DATABASE_URL` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

## Database Commands

### Initialize Database (First Time Setup)

```bash
# Run migrations to create tables
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### Regular Development

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Create a new migration after schema changes
npm run db:migrate

# Open Prisma Studio to view/edit data
npm run db:studio
```

## Default Admin Credentials

After running the seed script, you can login with:

- **Email:** admin@saudimais.sa
- **Password:** Admin@123

⚠️ **Important:** Change the admin password immediately after first login!

## Sample Data

The seed script creates:
- 1 admin user
- 8 sample inventory items across different categories
- Default system settings

## Database Schema

The schema includes the following models:

- **User** - System users with role-based access
- **InventoryItem** - Medical inventory records
- **AuditLog** - Complete audit trail of all actions
- **Report** - Generated reports with analytics
- **Backup** - Backup metadata and history
- **SystemSettings** - Application configuration

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct in `.env`
3. Ensure the database exists
4. Verify user has proper permissions

### Migration Issues

If migrations fail:
1. Check database connection
2. Ensure no conflicting migrations
3. Try `npx prisma migrate reset` (⚠️ destroys all data)

### Seed Issues

If seeding fails:
1. Ensure migrations have been run first
2. Check for unique constraint violations
3. Verify bcrypt is installed correctly

## Production Deployment

For production:
1. Use a managed PostgreSQL service (e.g., Vercel Postgres, AWS RDS)
2. Set DATABASE_URL in production environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Do NOT run seed script in production (or modify it for production data)
