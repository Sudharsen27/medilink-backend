-- =============================================================================
-- Medilink PostgreSQL Schema
-- Database: medilink
-- Generated from backend source code analysis (routes, models, services, middleware)
-- Target: Supabase SQL Editor (run against your existing medilink database)
-- =============================================================================
--
-- NOTE: Supabase provisions the database for you. Skip CREATE DATABASE.
--       Connect to the medilink database, then run this script.
-- =============================================================================

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- DROP (reverse dependency order) — safe re-run in dev
-- =============================================================================
DROP TABLE IF EXISTS consultation_chats CASCADE;
DROP TABLE IF EXISTS telemedicine_consultations CASCADE;
DROP TABLE IF EXISTS ambulance_dispatches CASCADE;
DROP TABLE IF EXISTS emergency_consultations CASCADE;
DROP TABLE IF EXISTS emergency_logs CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS emergency_medical_info CASCADE;
DROP TABLE IF EXISTS health_metrics CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS doctor_profiles CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- USERS
-- Referenced by: auth.js, users.js, websocket/server.js, appointments.js,
--                favorites.js, notifications, patient routes, emergency.js
-- =============================================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'patient', 'doctor', 'admin')),
    phone           VARCHAR(30),
    photo           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

-- =============================================================================
-- DOCTORS
-- Referenced by: routes/doctors.js, models/doctors.js, models/favorites.js,
--                routes/telemedicine.js (d.name, d.specialization)
-- =============================================================================
CREATE TABLE doctors (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(255),
    full_name       VARCHAR(255),
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    specialization  VARCHAR(255),
    experience      INTEGER,
    experience_years INTEGER,
    rating          NUMERIC(3,2) DEFAULT 0,
    bio             TEXT,
    clinic_address  TEXT,
    hospital        VARCHAR(255),
    clinic          VARCHAR(255),
    location        VARCHAR(255),
    photo_url       TEXT,
    contact_info    TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id ON doctors (user_id);
CREATE INDEX idx_doctors_specialization ON doctors (specialization);
CREATE INDEX idx_doctors_is_active ON doctors (is_active);

-- =============================================================================
-- DOCTOR PROFILES (emergency connect-doctor)
-- =============================================================================
CREATE TABLE doctor_profiles (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    professional_details    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_profiles_user_id ON doctor_profiles (user_id);

-- =============================================================================
-- DOCTOR AVAILABILITY (smart appointments + emergency)
-- =============================================================================
CREATE TABLE doctor_availability (
    id                      SERIAL PRIMARY KEY,
    doctor_id               INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_time              TIME NOT NULL DEFAULT '09:00',
    end_time                TIME NOT NULL DEFAULT '18:00',
    is_online               BOOLEAN NOT NULL DEFAULT FALSE,
    is_emergency_available  BOOLEAN NOT NULL DEFAULT FALSE,
    current_queue           INTEGER NOT NULL DEFAULT 0,
    last_active             TIMESTAMPTZ DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability (doctor_id);
CREATE INDEX idx_doctor_availability_emergency ON doctor_availability (is_online, is_emergency_available);

-- =============================================================================
-- PATIENTS (admin patient management — models/patientModel.js)
-- =============================================================================
CREATE TABLE patients (
    id                          SERIAL PRIMARY KEY,
    user_id                     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    first_name                  VARCHAR(100) NOT NULL,
    last_name                   VARCHAR(100) NOT NULL,
    phone                       VARCHAR(30) NOT NULL,
    email                       VARCHAR(255),
    dob                         DATE,
    gender                      VARCHAR(30),
    address                     TEXT,
    emergency_contact_name      VARCHAR(255),
    emergency_contact_phone     VARCHAR(30),
    emergency_contact_relation  VARCHAR(100),
    blood_group                 VARCHAR(10),
    allergies                   TEXT,
    medical_history             TEXT,
    insurance_provider          VARCHAR(255),
    insurance_policy_number     VARCHAR(100),
    status                      VARCHAR(50) DEFAULT 'active',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_user_id ON patients (user_id);
CREATE INDEX idx_patients_name ON patients (first_name, last_name);
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_created_at ON patients (created_at DESC);

-- =============================================================================
-- APPOINTMENTS
-- Active routes/appointments.js + dashboard + reminderScheduler + telemedicine
-- =============================================================================
CREATE TABLE appointments (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_id              INTEGER REFERENCES users(id) ON DELETE SET NULL,
    doctor_id               INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    name                    VARCHAR(255),
    email                   VARCHAR(255),
    doctor_name             VARCHAR(255),
    patient_name            VARCHAR(255),
    patient_phone           VARCHAR(30),
    date                    DATE,
    time                    TIME,
    appointment_date        DATE,
    appointment_time        TIME,
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                    'pending', 'scheduled', 'confirmed', 'cancelled',
                                    'completed', 'reschedule_requested', 'in-progress',
                                    'no_show', 'reminder_sent'
                                )),
    reason                  TEXT,
    appointment_type        VARCHAR(100),
    notes                   TEXT,
    send_whatsapp_reminder  BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent           BOOLEAN NOT NULL DEFAULT FALSE,
    google_event_id         VARCHAR(255),
    meet_link               TEXT,
    calendar_synced_at      TIMESTAMPTZ,
    service_id              INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments (user_id);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments (doctor_id);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_appointments_date ON appointments (date DESC, time DESC);
CREATE INDEX idx_appointments_reminder ON appointments (send_whatsapp_reminder, reminder_sent, status);

-- =============================================================================
-- MEDICAL RECORDS
-- Dual ownership: user_id (patient app) + patient_id (admin patient module)
-- =============================================================================
CREATE TABLE medical_records (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    record_type     VARCHAR(100) NOT NULL,
    title           VARCHAR(200),
    record_date     DATE NOT NULL,
    visit_date      DATE,
    description     TEXT NOT NULL,
    doctor_name     VARCHAR(200),
    hospital        VARCHAR(200),
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT,
    prescriptions   JSONB,
    file_url        TEXT,
    file_size       BIGINT,
    file_name       VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT medical_records_owner_chk CHECK (user_id IS NOT NULL OR patient_id IS NOT NULL)
);

CREATE INDEX idx_medical_records_user_id ON medical_records (user_id);
CREATE INDEX idx_medical_records_patient_id ON medical_records (patient_id);
CREATE INDEX idx_medical_records_record_type ON medical_records (record_type);
CREATE INDEX idx_medical_records_record_date ON medical_records (record_date DESC);

-- =============================================================================
-- PRESCRIPTIONS (search model; prescriptions route is stub)
-- =============================================================================
CREATE TABLE prescriptions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    doctor_name     VARCHAR(255),
    dosage          VARCHAR(100),
    frequency       VARCHAR(100),
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(50) DEFAULT 'active',
    instructions    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_user_id ON prescriptions (user_id);
CREATE INDEX idx_prescriptions_status ON prescriptions (status);
CREATE INDEX idx_prescriptions_medication ON prescriptions (medication_name);

-- =============================================================================
-- FAVORITES
-- =============================================================================
CREATE TABLE favorites (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, doctor_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
CREATE INDEX idx_favorites_doctor_id ON favorites (doctor_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(50) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    priority            VARCHAR(20) DEFAULT 'medium',
    read                BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    related_entity_type VARCHAR(50),
    related_entity_id   INTEGER,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- =============================================================================
-- DEPENDENTS (caregiver mode)
-- =============================================================================
CREATE TABLE dependents (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    age             INTEGER,
    relationship    VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dependents_user_id ON dependents (user_id);

-- =============================================================================
-- PATIENT PROFILES (JSON profile store)
-- =============================================================================
CREATE TABLE patient_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    personal_info   JSONB NOT NULL DEFAULT '{}'::jsonb,
    medical_history JSONB NOT NULL DEFAULT '{}'::jsonb,
    insurance_info  JSONB NOT NULL DEFAULT '{}'::jsonb,
    preferences     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_profiles_user_id ON patient_profiles (user_id);

-- =============================================================================
-- HEALTH METRICS
-- =============================================================================
CREATE TABLE health_metrics (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type     VARCHAR(100) NOT NULL,
    value           NUMERIC(10,2),
    systolic        INTEGER,
    diastolic       INTEGER,
    unit            VARCHAR(50),
    notes           TEXT,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_user_id ON health_metrics (user_id);
CREATE INDEX idx_health_metrics_type ON health_metrics (user_id, metric_type);

-- =============================================================================
-- EMERGENCY MODULE
-- =============================================================================
CREATE TABLE emergency_medical_info (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type          VARCHAR(10),
    allergies           JSONB DEFAULT '[]'::jsonb,
    medications         JSONB DEFAULT '[]'::jsonb,
    conditions          JSONB DEFAULT '[]'::jsonb,
    emergency_notes     TEXT DEFAULT '',
    doctor_name         VARCHAR(255) DEFAULT '',
    doctor_phone        VARCHAR(30) DEFAULT '',
    insurance_provider  VARCHAR(255) DEFAULT '',
    insurance_id        VARCHAR(100) DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    email           VARCHAR(255),
    relationship    VARCHAR(100) NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts (user_id);

CREATE TABLE emergency_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location        JSONB,
    medical_info    JSONB,
    status          VARCHAR(50) NOT NULL DEFAULT 'triggered',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_emergency_logs_user_id ON emergency_logs (user_id);

CREATE TABLE emergency_consultations (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location        JSONB,
    medical_info    JSONB,
    status          VARCHAR(50) NOT NULL DEFAULT 'connecting',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ambulance_dispatches (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location        JSONB,
    medical_info    JSONB,
    hospital_id     INTEGER,
    status          VARCHAR(50) NOT NULL DEFAULT 'dispatched',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TELEMEDICINE
-- =============================================================================
CREATE TABLE telemedicine_consultations (
    id              SERIAL PRIMARY KEY,
    appointment_id  INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    status          VARCHAR(50) NOT NULL DEFAULT 'active',
    room_id         VARCHAR(255),
    duration        INTEGER,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemedicine_appointment_id ON telemedicine_consultations (appointment_id);

CREATE TABLE consultation_chats (
    id              SERIAL PRIMARY KEY,
    appointment_id  INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sender_type     VARCHAR(20) NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
    sender_id       INTEGER NOT NULL,
    message         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultation_chats_appointment_id ON consultation_chats (appointment_id);

-- =============================================================================
-- SEARCH
-- =============================================================================
CREATE TABLE search_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query           TEXT NOT NULL,
    entity_types    JSONB NOT NULL DEFAULT '[]'::jsonb,
    filters         JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON search_history (user_id);
CREATE INDEX idx_search_history_created_at ON search_history (created_at DESC);

CREATE TABLE saved_searches (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    query           TEXT,
    entity_types    JSONB NOT NULL DEFAULT '[]'::jsonb,
    filters         JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_global       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches (user_id);

COMMIT;

-- =============================================================================
-- SEED DATA
-- Admin: sundarlingam272000@gmail.com / Sudharsen@9
-- Other test users: Password123!
-- bcrypt hashes generated with cost factor 10
-- =============================================================================

BEGIN;

INSERT INTO users (name, first_name, last_name, email, password, role, phone, is_active)
VALUES
(
    'Sundar Lingam',
    'Sundar',
    'Lingam',
    'sundarlingam272000@gmail.com',
    '$2b$10$xx0uTy/6BS9UmA1NA.zmO.XLpFFHTAiU6xHXxfgeLAtVoPGb8W/6.',
    'admin',
    '+919000000001',
    TRUE
),
(
    'Dr. Sarah Johnson',
    'Sarah',
    'Johnson',
    'doctor@medilink.test',
    '$2b$10$8S1tlxRQWxvNL.Y7op8Cru2RT0Geu2WScggmI5Wxf8M6YxZtBOSbS',
    'doctor',
    '+919000000002',
    TRUE
),
(
    'John Patient',
    'John',
    'Patient',
    'patient@medilink.test',
    '$2b$10$8S1tlxRQWxvNL.Y7op8Cru2RT0Geu2WScggmI5Wxf8M6YxZtBOSbS',
    'user',
    '+919000000003',
    TRUE
);

-- Doctor profile rows
INSERT INTO doctors (user_id, name, specialization, experience, rating, bio, clinic_address, is_active)
SELECT id, name, 'Cardiology', 12, 4.80,
       'Board-certified cardiologist specializing in preventive heart care.',
       '123 Medical Center Drive, City Hospital', TRUE
FROM users WHERE email = 'doctor@medilink.test';

INSERT INTO doctor_profiles (user_id, professional_details)
SELECT id, '{"specialization": "Cardiology", "license_number": "MED-12345"}'::jsonb
FROM users WHERE email = 'doctor@medilink.test';

INSERT INTO doctor_availability (doctor_id, start_time, end_time, is_online, is_emergency_available, current_queue)
SELECT d.id, '09:00', '18:00', TRUE, TRUE, 0
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'doctor@medilink.test';

-- Patient registry row (admin module)
INSERT INTO patients (
    user_id, first_name, last_name, phone, email, dob, gender,
    blood_group, status
)
SELECT
    id, first_name, last_name, phone, email,
    '1990-05-15'::date, 'male', 'O+', 'active'
FROM users WHERE email = 'patient@medilink.test';

-- Sample appointment (active appointments route shape)
INSERT INTO appointments (
    user_id, name, email, doctor_name, patient_name, patient_phone,
    date, time, status, send_whatsapp_reminder, reminder_sent
)
SELECT
    u.id, u.name, u.email, 'Dr. Sarah Johnson', 'John Patient', u.phone,
    CURRENT_DATE + INTERVAL '3 days', '10:30:00', 'pending', FALSE, FALSE
FROM users u WHERE u.email = 'patient@medilink.test';

-- Sample notification
INSERT INTO notifications (user_id, type, title, message, priority)
SELECT id, 'appointment', 'Welcome to Medilink', 'Your account is ready.', 'medium'
FROM users WHERE email = 'patient@medilink.test';

-- Sample telemedicine appointment
INSERT INTO appointments (
    user_id, name, email, doctor_name, patient_name, patient_phone,
    appointment_date, appointment_time, date, time,
    status, appointment_type, reason
)
SELECT
    u.id, u.name, u.email, 'Dr. Sarah Johnson', 'John Patient', u.phone,
    CURRENT_DATE, '14:30:00', CURRENT_DATE, '14:30:00',
    'confirmed', 'telemedicine', 'Follow-up consultation'
FROM users u WHERE u.email = 'patient@medilink.test';

-- Sample prescriptions
INSERT INTO prescriptions (
    user_id, medication_name, doctor_name, dosage, frequency,
    start_date, end_date, status, instructions
)
SELECT
    u.id, 'Amoxicillin', 'Dr. Sarah Johnson', '500mg', 'Twice daily',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active',
    'Take after meals. Complete full course.'
FROM users u WHERE u.email = 'patient@medilink.test';

INSERT INTO prescriptions (
    user_id, medication_name, doctor_name, dosage, frequency,
    start_date, end_date, status, instructions
)
SELECT
    u.id, 'Paracetamol', 'Dr. Sarah Johnson', '650mg', 'As needed',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'active',
    'Do not exceed 4 doses in 24 hours.'
FROM users u WHERE u.email = 'patient@medilink.test';

COMMIT;
