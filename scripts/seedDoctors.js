/**
 * Seeds marketplace doctors (idempotent — skips existing names).
 * Run: npm run seed:doctors
 */
require("dotenv").config();
const pool = require("../config/db");
const { seedDoctors } = require("../services/seedDoctors.service");

(async () => {
  const result = await seedDoctors();
  console.log(`\n📊 Done: ${result.created} added, ${result.skipped} skipped`);
  console.log(`   Active doctors in marketplace: ${result.activeTotal}`);
  await pool.end();
})().catch((err) => {
  console.error("❌ seedDoctors failed:", err);
  process.exit(1);
});
