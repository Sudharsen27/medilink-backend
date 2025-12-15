const pool = require("../config/db");

function scoreSlot(hour, history) {
  let score = 100;

  if (history.no_shows > 2) score -= 25;
  if (history.cancelled > 1) score -= 15;

  if (hour < 9 || hour > 18) score -= 10;

  return Math.max(score, 0);
}

exports.getSmartSlots = async (doctorId, patientId) => {
  const historyRes = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status='cancelled') AS cancelled,
      COUNT(*) FILTER (WHERE status='no_show') AS no_shows
    FROM appointments
    WHERE patient_id = $1
  `, [patientId]);

  const history = historyRes.rows[0];

  const availability = await pool.query(`
    SELECT * FROM doctor_availability WHERE doctor_id = $1
  `, [doctorId]);

  const slots = [];

  availability.rows.forEach(a => {
    for (let h = a.start_time.slice(0,2); h < a.end_time.slice(0,2); h++) {
      const score = scoreSlot(h, history);
      slots.push({ hour: h, score });
    }
  });

  return slots.sort((a,b) => b.score - a.score).slice(0,5);
};
