/**
 * Idempotent doctor marketplace seed — used by CLI script and server startup.
 */
const pool = require("../config/db");

const DOCTORS = [
  {
    name: "Dr. Michael Chen",
    specialization: "Dermatology",
    experience: 9,
    rating: 4.65,
    bio: "Expert in acne, eczema, and cosmetic dermatology with a focus on evidence-based skin care.",
    clinic_address: "Apollo Skin Clinic, Anna Nagar, Chennai",
    is_active: true,
  },
  {
    name: "Dr. Priya Sharma",
    specialization: "Pediatrics",
    experience: 11,
    rating: 4.85,
    bio: "Caring pediatrician specializing in child wellness, vaccinations, and developmental checks.",
    clinic_address: "Rainbow Children's Hospital, Banjara Hills, Hyderabad",
    is_active: true,
  },
  {
    name: "Dr. Rajesh Kumar",
    specialization: "Orthopedics",
    experience: 15,
    rating: 4.7,
    bio: "Orthopedic surgeon experienced in sports injuries, joint pain, and fracture management.",
    clinic_address: "Fortis Bone & Joint Institute, Sector 62, Noida",
    is_active: true,
  },
  {
    name: "Dr. Ananya Reddy",
    specialization: "Gynecology",
    experience: 10,
    rating: 4.9,
    bio: "OB-GYN specialist offering prenatal care, women's health screenings, and minimally invasive procedures.",
    clinic_address: "Cloudnine Hospital, Old Airport Road, Bengaluru",
    is_active: true,
  },
  {
    name: "Dr. Vikram Singh",
    specialization: "Neurology",
    experience: 14,
    rating: 4.75,
    bio: "Neurologist treating migraines, epilepsy, stroke recovery, and nerve disorders.",
    clinic_address: "Max Super Speciality Hospital, Saket, New Delhi",
    is_active: true,
  },
  {
    name: "Dr. Meera Iyer",
    specialization: "Psychiatry",
    experience: 8,
    rating: 4.6,
    bio: "Compassionate psychiatrist helping patients with anxiety, depression, and stress management.",
    clinic_address: "Mind Wellness Centre, Bandra West, Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Arjun Nair",
    specialization: "General Practice",
    experience: 7,
    rating: 4.55,
    bio: "Family physician for routine check-ups, chronic disease management, and preventive care.",
    clinic_address: "MediLink Primary Care, Kakkanad, Kochi",
    is_active: true,
  },
  {
    name: "Dr. Kavitha Menon",
    specialization: "Endocrinology",
    experience: 12,
    rating: 4.8,
    bio: "Diabetes and thyroid specialist with expertise in hormonal disorders and metabolic health.",
    clinic_address: "Manipal Hospital, HAL Airport Road, Bengaluru",
    is_active: true,
  },
  {
    name: "Dr. Suresh Patel",
    specialization: "Gastroenterology",
    experience: 16,
    rating: 4.72,
    bio: "GI specialist for digestive issues, liver health, and endoscopy-related consultations.",
    clinic_address: "Global Hospital, Parel, Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Deepa Krishnan",
    specialization: "Ophthalmology",
    experience: 10,
    rating: 4.68,
    bio: "Eye care expert for vision correction, cataract evaluation, and retinal screenings.",
    clinic_address: "Sankara Eye Hospital, Coimbatore",
    is_active: true,
  },
  {
    name: "Dr. Rahul Mehta",
    specialization: "Pulmonology",
    experience: 13,
    rating: 4.77,
    bio: "Pulmonologist treating asthma, COPD, allergies, and respiratory infections.",
    clinic_address: "Kokilaben Hospital, Andheri West, Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Lakshmi Devi",
    specialization: "ENT",
    experience: 9,
    rating: 4.58,
    bio: "ENT specialist for sinus issues, hearing problems, and throat infections.",
    clinic_address: "MIOT International, Chromepet, Chennai",
    is_active: true,
  },
  {
    name: "Dr. Amit Verma",
    specialization: "Urology",
    experience: 11,
    rating: 4.63,
    bio: "Urologist focused on kidney stones, prostate health, and urinary tract conditions.",
    clinic_address: "Artemis Hospital, Sector 51, Gurugram",
    is_active: true,
  },
  {
    name: "Dr. Sunita Rao",
    specialization: "Oncology",
    experience: 18,
    rating: 4.92,
    bio: "Medical oncologist supporting cancer diagnosis, treatment planning, and patient counseling.",
    clinic_address: "Tata Memorial Centre, Parel, Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Karthik Balan",
    specialization: "Cardiology",
    experience: 6,
    rating: 4.5,
    bio: "Young cardiologist passionate about heart health education and hypertension management.",
    clinic_address: "KIMS Hospital, Secunderabad, Hyderabad",
    is_active: true,
  },
  {
    name: "Dr. Nisha Gupta",
    specialization: "Dermatology",
    experience: 5,
    rating: 4.45,
    bio: "Dermatologist offering treatment for hair loss, pigmentation, and pediatric skin conditions.",
    clinic_address: "Skin & Hair Clinic, Salt Lake, Kolkata",
    is_active: false,
  },
];

let doctorColumnsCache = null;

async function getDoctorColumns() {
  if (doctorColumnsCache) return doctorColumnsCache;
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'doctors'
  `);
  doctorColumnsCache = new Set(rows.map((r) => r.column_name));
  return doctorColumnsCache;
}

async function upsertDoctor(doctor, columns) {
  const existing = await pool.query(
    "SELECT id FROM doctors WHERE LOWER(name) = LOWER($1)",
    [doctor.name]
  );

  if (existing.rows.length) {
    return { id: existing.rows[0].id, created: false };
  }

  const fieldMap = {
    name: doctor.name,
    full_name: doctor.name,
    specialization: doctor.specialization,
    experience: doctor.experience,
    experience_years: doctor.experience,
    rating: doctor.rating,
    bio: doctor.bio,
    clinic_address: doctor.clinic_address,
    hospital: doctor.hospital || null,
    location: doctor.location || null,
    is_active: doctor.is_active,
  };

  const fields = [];
  const placeholders = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(fieldMap)) {
    if (value !== undefined && value !== null && columns.has(key)) {
      fields.push(key);
      placeholders.push(`$${i}`);
      values.push(value);
      i += 1;
    }
  }

  if (!fields.length) {
    throw new Error("doctors table has no compatible columns for seeding");
  }

  const { rows } = await pool.query(
    `INSERT INTO doctors (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id`,
    values
  );

  const doctorId = rows[0].id;

  try {
    const { rows: availCols } = await pool.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'doctor_availability'
    `);
    if (availCols.length) {
      await pool.query(
        `
        INSERT INTO doctor_availability (doctor_id, start_time, end_time, is_online, is_emergency_available, current_queue)
        SELECT $1, '09:00', '18:00', $2, FALSE, 0
        WHERE NOT EXISTS (SELECT 1 FROM doctor_availability WHERE doctor_id = $1)
        `,
        [doctorId, doctor.is_active]
      );
    }
  } catch (availErr) {
    console.warn(`doctor_availability skip for ${doctor.name}:`, availErr.message);
  }

  return { id: doctorId, created: true };
}

async function seedDoctors() {
  const columns = await getDoctorColumns();
  let created = 0;
  let skipped = 0;

  for (const doctor of DOCTORS) {
    const result = await upsertDoctor(doctor, columns);
    if (result.created) created += 1;
    else skipped += 1;
  }

  const total = await pool.query(
    "SELECT COUNT(*)::int AS count FROM doctors WHERE is_active = true"
  );

  return {
    created,
    skipped,
    activeTotal: total.rows[0].count,
  };
}

async function seedDoctorsIfEmpty(minActive = 5) {
  if (process.env.SEED_DOCTORS_ON_START === "false") {
    return { created: 0, skipped: 0, activeTotal: 0, skippedRun: true };
  }

  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM doctors WHERE is_active = true"
  );
  const activeCount = rows[0]?.count ?? 0;

  if (activeCount >= minActive) {
    return { created: 0, skipped: 0, activeTotal: activeCount, skippedRun: true };
  }

  console.log(`🌱 Seeding doctors (${activeCount} active, target ${minActive})...`);
  const result = await seedDoctors();
  console.log(`✅ Doctor seed: ${result.created} added, ${result.skipped} skipped, ${result.activeTotal} active`);
  return { ...result, skippedRun: false };
}

module.exports = {
  DOCTORS,
  seedDoctors,
  seedDoctorsIfEmpty,
};
