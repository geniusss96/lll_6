-- ============================================================
-- Скрипт создания базы данных ClinicOS
-- Совместим с Neon, Render, Supabase и любым PostgreSQL >= 12
-- Использует встроенный gen_random_uuid() — без сторонних расширений
-- ============================================================

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role        VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'patient')),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL DEFAULT 'nopassword',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица пациентов
CREATE TABLE IF NOT EXISTS patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth   DATE,
    gender          VARCHAR(20),
    address         TEXT,
    allergies       TEXT,
    chronic_diseases TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Таблица врачей
CREATE TABLE IF NOT EXISTS doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    specialization  VARCHAR(255) NOT NULL,
    room_number     VARCHAR(50),
    experience_years INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Таблица записей на прием
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    time_slot       TIME NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'canceled', 'no_show')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (doctor_id, appointment_date, time_slot)
);

-- 5. Таблица медицинских записей (ЭМК)
CREATE TABLE IF NOT EXISTS medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID REFERENCES doctors(id) ON DELETE SET NULL,
    record_date     TIMESTAMPTZ DEFAULT NOW(),
    complaints      TEXT,
    anamnesis       TEXT,
    diagnosis       TEXT,
    treatment_plan  TEXT,
    prescriptions   TEXT,
    notes           TEXT
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
