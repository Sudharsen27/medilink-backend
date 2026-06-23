const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { protect } = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin");

const AVG_CONSULTATION_FEE = Number(process.env.AVG_CONSULTATION_FEE) || 1500;

const appointmentDateExpr = "COALESCE(a.date, a.appointment_date)";

router.get("/analytics", protect, verifyAdmin, async (req, res) => {
  try {
    const [
      kpiResult,
      trendsResult,
      revenueResult,
      departmentResult,
      activityResult,
      doctorPerfResult,
      patientGrowthResult,
      healthStatsResult,
    ] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM patients) AS total_patients,
          (SELECT COUNT(*)::int FROM doctors WHERE is_active = true) AS total_doctors,
          (
            SELECT COUNT(*)::int FROM appointments
            WHERE COALESCE(date, appointment_date) = CURRENT_DATE
          ) AS appointments_today,
          (
            SELECT COUNT(*)::int FROM appointments
            WHERE status = 'completed'
          ) AS completed_appointments,
          (
            SELECT COUNT(*)::int FROM appointments
            WHERE status IN ('pending', 'scheduled', 'confirmed', 'reschedule_requested')
          ) AS active_pipeline
      `),
      db.query(`
        SELECT
          ${appointmentDateExpr}::date AS day,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE a.status = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE a.status = 'cancelled')::int AS cancelled
        FROM appointments a
        WHERE ${appointmentDateExpr} >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY day
        ORDER BY day ASC
      `),
      db.query(`
        SELECT
          to_char(date_trunc('month', ${appointmentDateExpr}), 'Mon') AS month,
          date_trunc('month', ${appointmentDateExpr}) AS month_start,
          COUNT(*) FILTER (WHERE a.status = 'completed')::int AS completed,
          COUNT(*)::int AS total
        FROM appointments a
        WHERE ${appointmentDateExpr} >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY month, month_start
        ORDER BY month_start ASC
      `),
      db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(d.specialization), ''), 'General Practice') AS department,
          COUNT(DISTINCT d.id)::int AS doctors,
          COUNT(a.id)::int AS appointments
        FROM doctors d
        LEFT JOIN appointments a ON a.doctor_id = d.id
        WHERE d.is_active = true
        GROUP BY department
        ORDER BY appointments DESC, doctors DESC
        LIMIT 8
      `),
      db.query(`
        (
          SELECT
            'appointment' AS kind,
            a.id,
            COALESCE(a.patient_name, a.name, 'Patient') AS title,
            COALESCE(a.doctor_name, 'Doctor') AS subtitle,
            a.status,
            a.created_at
          FROM appointments a
          ORDER BY a.created_at DESC
          LIMIT 6
        )
        UNION ALL
        (
          SELECT
            'patient' AS kind,
            p.id,
            CONCAT(p.first_name, ' ', p.last_name) AS title,
            COALESCE(p.email, p.phone) AS subtitle,
            p.status,
            p.created_at
          FROM patients p
          ORDER BY p.created_at DESC
          LIMIT 4
        )
        ORDER BY created_at DESC
        LIMIT 10
      `),
      db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(d.name), ''), NULLIF(TRIM(d.full_name), ''), 'Doctor') AS name,
          COUNT(a.id) FILTER (WHERE a.status = 'completed')::int AS completed,
          COALESCE(d.rating, 0)::float AS rating,
          COALESCE(NULLIF(TRIM(d.specialization), ''), 'General') AS specialization
        FROM doctors d
        LEFT JOIN appointments a ON a.doctor_id = d.id
        WHERE d.is_active = true
        GROUP BY d.id, d.name, d.full_name, d.rating, d.specialization
        ORDER BY completed DESC, rating DESC
        LIMIT 8
      `),
      db.query(`
        SELECT
          to_char(date_trunc('month', p.created_at), 'Mon') AS month,
          date_trunc('month', p.created_at) AS month_start,
          COUNT(*)::int AS new_patients
        FROM patients p
        WHERE p.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY month, month_start
        ORDER BY month_start ASC
      `),
      db.query(`
        SELECT
          metric,
          SUM(current_count)::int AS current,
          SUM(previous_count)::int AS previous
        FROM (
          SELECT 'Medical Records' AS metric,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS current_count,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND created_at < date_trunc('month', CURRENT_DATE)) AS previous_count
          FROM medical_records
          UNION ALL
          SELECT 'Prescriptions',
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND created_at < date_trunc('month', CURRENT_DATE))
          FROM prescriptions
          UNION ALL
          SELECT 'Health Metrics',
            COUNT(*) FILTER (WHERE recorded_at >= date_trunc('month', CURRENT_DATE)),
            COUNT(*) FILTER (WHERE recorded_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND recorded_at < date_trunc('month', CURRENT_DATE))
          FROM health_metrics
          UNION ALL
          SELECT 'Telemedicine',
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND created_at < date_trunc('month', CURRENT_DATE))
          FROM telemedicine_consultations
          UNION ALL
          SELECT 'Emergency',
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND created_at < date_trunc('month', CURRENT_DATE))
          FROM emergency_logs
        ) stats
        GROUP BY metric
        ORDER BY current DESC
      `),
    ]);

    const kpi = kpiResult.rows[0];
    const completedCount = Number(kpi.completed_appointments) || 0;
    const revenueTotal = completedCount * AVG_CONSULTATION_FEE;

    const trends = trendsResult.rows.map((row) => ({
      day: row.day,
      label: new Date(row.day).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      total: Number(row.total),
      completed: Number(row.completed),
      cancelled: Number(row.cancelled),
    }));

    const revenue = revenueResult.rows.map((row) => ({
      month: row.month,
      completed: Number(row.completed),
      total: Number(row.total),
      revenue: Number(row.completed) * AVG_CONSULTATION_FEE,
    }));

    const departments = departmentResult.rows.map((row) => ({
      department: row.department,
      doctors: Number(row.doctors),
      appointments: Number(row.appointments),
    }));

    const recentActivity = activityResult.rows.map((row) => ({
      id: `${row.kind}-${row.id}`,
      kind: row.kind,
      title: row.title,
      subtitle: row.subtitle,
      status: row.status,
      createdAt: row.created_at,
    }));

    const doctorPerformance = doctorPerfResult.rows.map((row) => ({
      name: row.name,
      completed: Number(row.completed) || 0,
      rating: Number(row.rating) || 0,
      specialization: row.specialization,
    }));

    let cumulative = 0;
    const patientGrowth = patientGrowthResult.rows.map((row) => {
      const newPatients = Number(row.new_patients) || 0;
      cumulative += newPatients;
      return {
        month: row.month,
        newPatients,
        cumulative,
      };
    });

    const healthStatistics = healthStatsResult.rows.map((row) => ({
      metric: row.metric,
      current: Number(row.current) || 0,
      previous: Number(row.previous) || 0,
    }));

    res.json({
      kpis: {
        totalPatients: Number(kpi.total_patients) || 0,
        totalDoctors: Number(kpi.total_doctors) || 0,
        appointmentsToday: Number(kpi.appointments_today) || 0,
        revenueTotal,
        completedAppointments: completedCount,
        activePipeline: Number(kpi.active_pipeline) || 0,
        currency: "INR",
        avgConsultationFee: AVG_CONSULTATION_FEE,
      },
      appointmentTrends: trends,
      revenueOverview: revenue,
      departmentStats: departments,
      doctorPerformance,
      patientGrowth,
      healthStatistics,
      recentActivity,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ error: "Failed to load admin analytics" });
  }
});

router.post("/seed-doctors", protect, verifyAdmin, async (req, res) => {
  try {
    const { seedDoctors } = require("../services/seedDoctors.service");
    const result = await seedDoctors();
    res.json({
      success: true,
      message: `Seeded ${result.created} doctors (${result.activeTotal} active total)`,
      data: result,
    });
  } catch (error) {
    console.error("Admin seed-doctors error:", error);
    res.status(500).json({ success: false, error: "Failed to seed doctors" });
  }
});

module.exports = router;
