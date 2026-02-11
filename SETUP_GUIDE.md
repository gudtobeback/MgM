# Meraki Management Platform - Setup Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **PostgreSQL** (version 14 or higher)
3. **Git** (for version control)

## Installation Steps

### 1. Install PostgreSQL

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation, set a password for the postgres user
4. Keep the default port 5432

**Verify Installation:**
```bash
psql --version
```

### 2. Create Database

Open Command Prompt or PowerShell:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE merakiplatform;

# Connect to the database
\c merakiplatform

# Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

### 3. Initialize Database Schema

Run the schema initialization:

```bash
cd backend
psql -U postgres -d merakiplatform -f src/database/schema.sql
```

### 4. Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cd backend
copy .env.example .env
```

Edit `.env` and update:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/merakiplatform

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=8787
NODE_ENV=development
```

### 5. Install Backend Dependencies

```bash
cd backend
npm install
```

### 6. Install Frontend Dependencies

```bash
cd ..
npm install
```

### 7. Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
Meraki API proxy server listening on http://127.0.0.1:8787
```

### 8. Start the Frontend

Open a new terminal:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Database Management

### View All Tables

```bash
psql -U postgres -d merakiplatform

\dt
```

### Check Users Table

```sql
SELECT * FROM users;
```

### Check Snapshots

```sql
SELECT id, organization_id, snapshot_type, created_at FROM config_snapshots;
```

## API Testing

### Register a New User

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin@example.com\", \"password\": \"password123\", \"fullName\": \"Admin User\"}"
```

### Login

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin@example.com\", \"password\": \"password123\"}"
```

Save the `accessToken` from the response.

### Create Organization

```sql
-- Manually insert organization for testing
INSERT INTO organizations (user_id, meraki_org_id, meraki_org_name, meraki_api_key_encrypted, meraki_region)
VALUES
  ((SELECT id FROM users WHERE email = 'admin@example.com'),
   'YOUR_MERAKI_ORG_ID',
   'My Organization',
   'YOUR_MERAKI_API_KEY',
   'com');
```

### Create Snapshot

```bash
curl -X POST http://localhost:8787/api/organizations/YOUR_ORG_ID/snapshots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d "{\"type\": \"manual\", \"notes\": \"First snapshot\"}"
```

### List Snapshots

```bash
curl -X GET http://localhost:8787/api/organizations/YOUR_ORG_ID/snapshots \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Database Connection Error

If you see:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   # Windows
   services.msc
   # Look for "postgresql-x64-14" service and start it
   ```

2. Verify connection:
   ```bash
   psql -U postgres
   ```

### JWT Secret Error

If you see:
```
Error: JWT_SECRET not defined
```

**Solution:**
Create `.env` file with proper JWT_SECRET

### Port Already in Use

If you see:
```
Error: listen EADDRINUSE: address already in use :::8787
```

**Solution:**
1. Find and kill the process using port 8787:
   ```bash
   # Windows
   netstat -ano | findstr :8787
   taskkill /PID <PID> /F
   ```

## Development Workflow

### 1. Make Changes to Backend

```bash
cd backend
# Make your changes to TypeScript files
# The server will auto-restart if using ts-node-dev
```

### 2. Database Migrations

When adding new tables/columns, update `src/database/schema.sql` and run:

```bash
psql -U postgres -d merakiplatform -f src/database/schema.sql
```

### 3. Test API Endpoints

Use Postman, Insomnia, or curl to test endpoints

## Next Steps

1. **Add Organizations**: Connect your Meraki organizations via the UI
2. **Create Snapshots**: Take configuration snapshots
3. **View Version History**: See changes over time
4. **Compare Configurations**: Use the diff viewer

## Features Now Available

✅ **User Authentication** - Register and login with JWT
✅ **Organization Management** - Store Meraki API keys securely
✅ **Configuration Snapshots** - Capture full Meraki configs
✅ **Version Control** - Track changes over time
✅ **Diff Viewer** - Compare any two snapshots
✅ **Audit Logging** - Track all user actions

## Coming Soon

🚧 **Drift Detection** - Alert on unauthorized changes
🚧 **Compliance Monitoring** - PCI DSS, HIPAA checks
🚧 **Bulk Operations** - Manage VLANs/firewall rules across networks
🚧 **Analytics** - Capacity planning and insights
