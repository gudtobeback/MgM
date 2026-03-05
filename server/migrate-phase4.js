/**
 * Phase 4 Database Migration
 * Adds: schedule_config column to organizations table
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envVars[key.trim()] = val.join('=').trim();
});

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  try {
    // Add schedule_config column to organizations if it doesn't exist
    await client.query(`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS schedule_config JSONB
    `);
    console.log('✅ Added schedule_config column to organizations table');

    console.log('\n✅ Phase 4 migration complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
