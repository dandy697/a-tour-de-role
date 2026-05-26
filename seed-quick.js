const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log("Connecting to database...");
    await pool.query(`
      INSERT INTO "Plan" (id, name, "priceMonthly", "maxFamilies", "maxMembers", features)
      VALUES 
        (gen_random_uuid()::text, 'free', 0, 1, 1, '{"chat": false, "analytics": false}'::jsonb),
        (gen_random_uuid()::text, 'pro', 4.99, 3, 20, '{"chat": true, "analytics": false}'::jsonb),
        (gen_random_uuid()::text, 'premium', 9.99, -1, -1, '{"chat": true, "analytics": true}'::jsonb)
      ON CONFLICT (name) DO UPDATE SET "maxMembers" = EXCLUDED."maxMembers";
    `);
    console.log("✅ Plans seeded successfully.");
  } catch (err) {
    console.error("Error seeding plans:", err);
  } finally {
    await pool.end();
  }
}

main();
