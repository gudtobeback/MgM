/**
 * Seed script: creates two demo users
 *   free@demo.com       / Demo1234!   → free tier
 *   admin@demo.com      / Admin1234!  → enterprise tier (unlimited)
 *
 * Run: node seed-users.js
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load .env
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envVars[key.trim()] = val.join('=').trim();
});

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not found in .env'); process.exit(1); }

const USERS = [
  {
    email: 'free@demo.com',
    password: 'Demo1234!',
    fullName: 'Free Demo User',
    subscriptionTier: 'free',
  },
  {
    email: 'admin@demo.com',
    password: 'Admin1234!',
    fullName: 'Admin Demo User',
    subscriptionTier: 'enterprise',
  },
];

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to database\n');

  for (const u of USERS) {
    // Check if already exists
    const existing = await client.query('SELECT id, subscription_tier FROM users WHERE email = $1', [u.email]);

    if (existing.rows.length > 0) {
      // Update tier in case it changed
      await client.query(
        'UPDATE users SET subscription_tier = $1 WHERE email = $2',
        [u.subscriptionTier, u.email]
      );
      console.log(`⚡ Updated  : ${u.email}  →  ${u.subscriptionTier}`);
    } else {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, subscription_tier, subscription_status)
         VALUES ($1, $2, $3, $4, 'active')`,
        [u.email, hash, u.fullName, u.subscriptionTier]
      );
      console.log(`✅ Created  : ${u.email}  →  ${u.subscriptionTier}`);
    }
  }

  console.log('\nDemo credentials:');
  console.log('  Email: free@demo.com       Password: Demo1234!   Tier: free');
  console.log('  Email: admin@demo.com      Password: Admin1234!  Tier: enterprise');

  await client.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
