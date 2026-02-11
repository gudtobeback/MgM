/**
 * Database Migration Script - Phase 3 tables
 * Run with: node migrate.js
 */
require('dotenv').config();
const { Client } = require('pg');

const url = new URL(process.env.DATABASE_URL);
const client = new Client({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
  ssl: false,
});

const migrations = [
  {
    name: 'create_change_requests_table',
    sql: `
      CREATE TABLE IF NOT EXISTS change_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        planned_at TIMESTAMP,
        affected_resources JSONB,
        notes TEXT,
        requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_change_requests_org ON change_requests(organization_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
    `,
  },
];

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  for (const migration of migrations) {
    try {
      await client.query(migration.sql);
      console.log(`✅ Applied: ${migration.name}`);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`⏭️  Skipped (already exists): ${migration.name}`);
      } else {
        console.error(`❌ Failed: ${migration.name} -`, err.message);
      }
    }
  }

  // Show all tables
  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log('\nCurrent tables:', tables.rows.map(r => r.tablename).join(', '));

  await client.end();
  console.log('\nMigration complete.');
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
