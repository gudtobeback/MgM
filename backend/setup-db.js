/**
 * Database Setup Script
 * Creates the merakiplatform database and initializes the schema.
 * Run with: node setup-db.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse the DATABASE_URL to get connection details
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not found in .env file');
  process.exit(1);
}

const url = new URL(dbUrl);
const host = url.hostname;
const port = parseInt(url.port) || 5432;
const user = url.username;
const password = url.password;
const database = url.pathname.replace('/', '');

console.log(`Setting up database: ${database}`);
console.log(`Host: ${host}:${port}`);
console.log(`User: ${user}`);

async function setup() {
  // Step 1: Connect to default 'postgres' database to create merakiplatform
  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres', // connect to default db first
    ssl: false,
  });

  try {
    await adminClient.connect();
    console.log('\n✅ Connected to PostgreSQL');

    // Check if database already exists
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );

    if (res.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${database}`);
      console.log(`✅ Database '${database}' created`);
    } else {
      console.log(`ℹ️  Database '${database}' already exists`);
    }

    await adminClient.end();
  } catch (err) {
    console.error('\n❌ Failed to connect or create database:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure PostgreSQL is running (check Services in Windows)');
    console.error('  2. Verify the password in backend\\.env matches your PostgreSQL password');
    console.error('  3. Ensure the user has permission to create databases');
    process.exit(1);
  }

  // Step 2: Connect to merakiplatform database and run schema
  const dbClient = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: false,
  });

  try {
    await dbClient.connect();
    console.log(`\n✅ Connected to '${database}' database`);

    // Read schema file
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Run schema
    await dbClient.query(schema);
    console.log('✅ Schema initialized successfully');

    // Verify tables were created
    const tables = await dbClient.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('\n📋 Tables created:');
    tables.rows.forEach(row => console.log(`   - ${row.tablename}`));

    await dbClient.end();
    console.log('\n🎉 Database setup complete! You can now start the backend server.');
    console.log('   Run: npm start');
  } catch (err) {
    console.error('\n❌ Failed to initialize schema:', err.message);
    await dbClient.end();
    process.exit(1);
  }
}

setup();
