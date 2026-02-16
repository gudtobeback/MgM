/**
 * MSP Multi-Tenant Migration Script
 * Adds companies table, user_permissions table, and role/company_id columns.
 * Run with: node migrate-msp.js
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
    name: 'create_companies_table',
    sql: `
      CREATE TABLE IF NOT EXISTS companies (
        id        SERIAL PRIMARY KEY,
        name      TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  {
    name: 'seed_default_company',
    sql: `
      INSERT INTO companies (id, name)
      VALUES (1, 'Default')
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: 'alter_users_add_role_and_company',
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
    `,
  },
  {
    name: 'backfill_users_company_id',
    sql: `
      UPDATE users SET company_id = 1 WHERE company_id IS NULL;
    `,
  },
  {
    name: 'alter_organizations_add_company',
    sql: `
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
    `,
  },
  {
    name: 'backfill_organizations_company_id',
    sql: `
      UPDATE organizations SET company_id = 1 WHERE company_id IS NULL;
    `,
  },
  {
    name: 'create_user_permissions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_permissions (
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        feature    TEXT NOT NULL,
        enabled    BOOLEAN NOT NULL DEFAULT true,
        PRIMARY KEY (user_id, feature)
      );
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

  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log('\nCurrent tables:', tables.rows.map(r => r.tablename).join(', '));

  await client.end();
  console.log('\nMSP migration complete.');
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
