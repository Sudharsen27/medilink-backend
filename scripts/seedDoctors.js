/**
 * Seeds marketplace doctors (idempotent — skips existing names).
 * Run: npm run seed:doctors
 */
require("dotenv").config();
const pool = require("../config/db");

const DOCTORS = [
  {
    name: "Dr. Michael Chen",
    specialization: "Dermatology",
    experience: 9,
    rating: 4.65,
    bio: "Expert in acne, eczema, and cosmetic dermatology with a focus on evidence-based skin care.",
    clinic_address: "Apollo Skin Clinic, Anna Nagar, Chennai",
    hospital: "Apollo Hospitals",
    location: "Chennai",
    is_active: true,
  },
  {
    name: "Dr. Priya Sharma",
    specialization: "Pediatrics",
    experience: 11,
    rating: 4.85,
    bio: "Caring pediatrician specializing in child wellness, vaccinations, and developmental checks.",
    clinic_address: "Rainbow Children's Hospital, Banjara Hills, Hyderabad",
    hospital: "Rainbow Hospitals",
    location: "Hyderabad",
    is_active: true,
  },
  {
    name: "Dr. Rajesh Kumar",
    specialization: "Orthopedics",
    experience: 15,
    rating: 4.70,
    bio: "Orthopedic surgeon experienced in sports injuries, joint pain, and fracture management.",
    clinic_address: "Fortis Bone & Joint Institute, Sector 62, Noida",
    hospital: "Fortis Healthcare",
    location: "Noida",
    is_active: true,
  },
  {
    name: "Dr. Ananya Reddy",
    specialization: "Gynecology",
    experience: 10,
    rating: 4.90,
    bio: "OB-GYN specialist offering prenatal care, women's health screenings, and minimally invasive procedures.",
    clinic_address: "Cloudnine Hospital, Old Airport Road, Bengaluru",
    hospital: "Cloudnine",
    location: "Bengaluru",
    is_active: true,
  },
  {
    name: "Dr. Vikram Singh",
    specialization: "Neurology",
    experience: 14,
    rating: 4.75,
    bio: "Neurologist treating migraines, epilepsy, stroke recovery, and nerve disorders.",
    clinic_address: "Max Super Speciality Hospital, Saket, New Delhi",
    hospital: "Max Healthcare",
    location: "New Delhi",
    is_active: true,
  },
  {
    name: "Dr. Meera Iyer",
    specialization: "Psychiatry",
    experience: 8,
    rating: 4.60,
    bio: "Compassionate psychiatrist helping patients with anxiety, depression, and stress management.",
    clinic_address: "Mind Wellness Centre, Bandra West, Mumbai",
    hospital: "Mind Wellness Centre",
    location: "Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Arjun Nair",
    specialization: "General Practice",
    experience: 7,
    rating: 4.55,
    bio: "Family physician for routine check-ups, chronic disease management, and preventive care.",
    clinic_address: "MediLink Primary Care, Kakkanad, Kochi",
    hospital: "MediLink Clinic",
    location: "Kochi",
    is_active: true,
  },
  {
    name: "Dr. Kavitha Menon",
    specialization: "Endocrinology",
    experience: 12,
    rating: 4.80,
    bio: "Diabetes and thyroid specialist with expertise in hormonal disorders and metabolic health.",
    clinic_address: "Manipal Hospital, HAL Airport Road, Bengaluru",
    hospital: "Manipal Hospitals",
    location: "Bengaluru",
    is_active: true,
  },
  {
    name: "Dr. Suresh Patel",
    specialization: "Gastroenterology",
    experience: 16,
    rating: 4.72,
    bio: "GI specialist for digestive issues, liver health, and endoscopy-related consultations.",
    clinic_address: "Global Hospital, Parel, Mumbai",
    hospital: "Gleneagles Global",
    location: "Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Deepa Krishnan",
    specialization: "Ophthalmology",
    experience: 10,
    rating: 4.68,
    bio: "Eye care expert for vision correction, cataract evaluation, and retinal screenings.",
    clinic_address: "Sankara Eye Hospital, Coimbatore",
    hospital: "Sankara Eye Foundation",
    location: "Coimbatore",
    is_active: true,
  },
  {
    name: "Dr. Rahul Mehta",
    specialization: "Pulmonology",
    experience: 13,
    rating: 4.77,
    bio: "Pulmonologist treating asthma, COPD, allergies, and respiratory infections.",
    clinic_address: "Kokilaben Hospital, Andheri West, Mumbai",
    hospital: "Kokilaben Dhirubhai Ambani Hospital",
    location: "Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Lakshmi Devi",
    specialization: "ENT",
    experience: 9,
    rating: 4.58,
    bio: "ENT specialist for sinus issues, hearing problems, and throat infections.",
    clinic_address: "MIOT International, Chromepet, Chennai",
    hospital: "MIOT Hospitals",
    location: "Chennai",
    is_active: true,
  },
  {
    name: "Dr. Amit Verma",
    specialization: "Urology",
    experience: 11,
    rating: 4.63,
    bio: "Urologist focused on kidney stones, prostate health, and urinary tract conditions.",
    clinic_address: "Artemis Hospital, Sector 51, Gurugram",
    hospital: "Artemis Hospitals",
    location: "Gurugram",
    is_active: true,
  },
  {
    name: "Dr. Sunita Rao",
    specialization: "Oncology",
    experience: 18,
    rating: 4.92,
    bio: "Medical oncologist supporting cancer diagnosis, treatment planning, and patient counseling.",
    clinic_address: "Tata Memorial Centre, Parel, Mumbai",
    hospital: "Tata Memorial Hospital",
    location: "Mumbai",
    is_active: true,
  },
  {
    name: "Dr. Karthik Balan",
    specialization: "Cardiology",
    experience: 6,
    rating: 4.50,
    bio: "Young cardiologist passionate about heart health education and hypertension management.",
    clinic_address: "KIMS Hospital, Secunderabad, Hyderabad",
    hospital: "KIMS Hospitals",
    location: "Hyderabad",
    is_active: true,
  },
  {
    name: "Dr. Nisha Gupta",
    specialization: "Dermatology",
    experience: 5,
    rating: 4.45,
    bio: "Dermatologist offering treatment for hair loss, pigmentation, and pediatric skin conditions.",
    clinic_address: "Skin & Hair Clinic, Salt Lake, Kolkata",
    hospital: "AMRI Hospitals",
    location: "Kolkata",
    is_active: false,
  },
];

const upsertDoctor = async (doctor) => {
  const existing = await pool.query(
    "SELECT id FROM doctors WHERE LOWER(name) = LOWER($1)",
    [doctor.name]
  );

  if (existing.rows.length) {
    return { id: existing.rows[0].id, created: false };
  }

  const { rows } = await pool.query(
    `
    INSERT INTO doctors (
      name, full_name, specialization, experience, experience_years,
      rating, bio, clinic_address, hospital, location, is_active
    ) VALUES ($1, $1, $2, $3, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
    `,
    [
      doctor.name,
      doctor.specialization,
      doctor.experience,
      doctor.rating,
      doctor.bio,
      doctor.clinic_address,
      doctor.hospital,
      doctor.location,
      doctor.is_active,
    ]
  );

  const doctorId = rows[0].id;

  await pool.query(
    `
    INSERT INTO doctor_availability (doctor_id, start_time, end_time, is_online, is_emergency_available, current_queue)
    VALUES ($1, '09:00', '18:00', $2, FALSE, 0)
  `,
    [doctorId, doctor.is_active]
  );

  return { id: doctorId, created: true };
};

(async () => {
  let created = 0;
  let skipped = 0;

  for (const doctor of DOCTORS) {
    const result = await upsertDoctor(doctor);
    if (result.created) {
      created += 1;
      console.log(`✅ Added ${doctor.name} — ${doctor.specialization}`);
    } else {
      skipped += 1;
      console.log(`ℹ️  Skipped ${doctor.name} (already exists)`);
    }
  }

  const total = await pool.query(
    "SELECT COUNT(*)::int AS count FROM doctors WHERE is_active = true"
  );

  console.log(`\n📊 Done: ${created} added, ${skipped} skipped`);
  console.log(`   Active doctors in marketplace: ${total.rows[0].count}`);

  await pool.end();
})().catch((err) => {
  console.error("❌ seedDoctors failed:", err);
  process.exit(1);
});
