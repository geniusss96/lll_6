-- Скрипт создания базы данных для Медицинской Информационной Системы

-- Создаем расширение для генерации UUID, если оно еще не установлено
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем ENUM типы
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'no_show');

-- 1. Таблица пользователей системы
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица пациентов
CREATE TABLE Patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    allergies TEXT,
    chronic_diseases TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица врачей
CREATE TABLE Doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    specialization VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    experience_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица записей на прием (расписание)
CREATE TABLE Appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES Patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES Doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- У одного врача не может быть двух записей на одно и то же время
    UNIQUE (doctor_id, appointment_date, time_slot)
);

-- 5. Таблица амбулаторных карт
CREATE TABLE Medical_Records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES Appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES Patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES Doctors(id) ON DELETE SET NULL,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    complaints TEXT,
    diagnosis TEXT, -- Желательно с кодами МКБ-10
    treatment_plan TEXT,
    prescriptions TEXT,
    notes TEXT
);

-- Индексы для оптимизации поиска
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_patients_user_id ON Patients(user_id);
CREATE INDEX idx_appointments_doctor_date ON Appointments(doctor_id, appointment_date);
CREATE INDEX idx_medical_records_patient ON Medical_Records(patient_id);
