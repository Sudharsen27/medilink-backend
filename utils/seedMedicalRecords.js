// utils/seedMedicalRecords.js
const pool = require('../config/db');

const seedMedicalRecords = async () => {
  try {
    // Get a test user ID (replace with actual user ID from your database)
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('No users found in database');
      return;
    }

    const userId = userResult.rows[0].id;

    const testRecords = [
      {
        record_type: 'blood_test',
        record_date: '2024-01-10',
        description: 'Complete Blood Count Test',
        doctor_name: 'Dr. Sarah Johnson',
        hospital: 'City General Hospital',
        notes: 'All parameters within normal range'
      },
      {
        record_type: 'x_ray',
        record_date: '2024-01-05',
        description: 'Chest X-Ray',
        doctor_name: 'Dr. Michael Chen',
        hospital: 'Radiology Center',
        notes: 'No abnormalities detected'
      },
      {
        record_type: 'prescription',
        record_date: '2024-01-15',
        description: 'Antibiotics prescription',
        doctor_name: 'Dr. Emily Davis',
        hospital: 'Family Care Clinic',
        notes: 'Complete 7-day course'
      }
    ];

    for (const record of testRecords) {
      await pool.query(
        `INSERT INTO medical_records 
         (user_id, record_type, record_date, description, doctor_name, hospital, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, record.record_type, record.record_date, record.description, 
         record.doctor_name, record.hospital, record.notes]
      );
    }

    console.log('✅ Test medical records added successfully');
  } catch (error) {
    console.error('Error seeding medical records:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedMedicalRecords();
}

module.exports = seedMedicalRecords;