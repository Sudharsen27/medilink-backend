const pool = require("../config/db");

const medicationFromRow = (row) => ({
  name: row.medication_name,
  dosage: row.dosage || "—",
  frequency: row.frequency || "—",
  duration:
    row.end_date != null
      ? `Until ${new Date(row.end_date).toLocaleDateString()}`
      : "As directed",
});

const groupPrescriptionRows = (rows) => {
  const groups = new Map();

  for (const row of rows) {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    const key = `${row.doctor_name || "Physician"}|${day}`;

    if (!groups.has(key)) {
      groups.set(key, {
        id: row.id,
        doctor_name: row.doctor_name || "Physician",
        doctor_specialization: row.doctor_specialization || "General Practice",
        diagnosis: row.diagnosis || null,
        medications: [],
        instructions: row.instructions || "",
        follow_up_date: row.end_date || null,
        created_at: row.created_at,
        status: row.status || "active",
      });
    }

    const group = groups.get(key);
    group.medications.push(medicationFromRow(row));
    if (row.instructions && !group.instructions.includes(row.instructions)) {
      group.instructions = group.instructions
        ? `${group.instructions}\n${row.instructions}`
        : row.instructions;
    }
  }

  return Array.from(groups.values());
};

const getUserPrescriptions = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM prescriptions
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );
  return groupPrescriptionRows(rows);
};

const mapPrescriptionRow = (row) => {
  const [group] = groupPrescriptionRows([row]);
  return group;
};

const getPrescriptionById = async (userId, prescriptionId) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM prescriptions
    WHERE id = $1 AND user_id = $2
  `,
    [prescriptionId, userId]
  );
  return rows.length ? mapPrescriptionRow(rows[0]) : null;
};

module.exports = {
  getUserPrescriptions,
  getPrescriptionById,
  mapPrescriptionRow,
};
