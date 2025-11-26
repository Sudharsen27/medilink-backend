// utils/checkDatabaseStructure.js
const pool = require('../config/db');

const checkDatabaseStructure = async () => {
  console.log('🔍 Checking database structure...\n');

  // Check doctors table
  console.log('📋 Doctors table columns:');
  const doctorsColumns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'doctors' 
    ORDER BY ordinal_position
  `);
  doctorsColumns.rows.forEach(col => {
    console.log(`   - ${col.column_name} (${col.data_type})`);
  });

  // Check if required tables exist
  const tables = ['appointments', 'prescriptions', 'medical_records', 'favorites'];
  
  for (const table of tables) {
    console.log(`\n📋 ${table} table columns:`);
    try {
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      if (columns.rows.length === 0) {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else {
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error checking table '${table}':`, error.message);
    }
  }
};

// Run if this file is executed directly
if (require.main === module) {
  checkDatabaseStructure()
    .then(() => {
      console.log('\n✅ Database check completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Database check failed:', error);
      process.exit(1);
    });
}

module.exports = checkDatabaseStructure;