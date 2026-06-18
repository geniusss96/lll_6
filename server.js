const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
// Укажите свои данные для подключения, либо используйте .env
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'clinic_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// API Эндпоинт для записи пациента на прием
app.post('/api/appointments', async (req, res) => {
    const { patient_id, doctor_id, appointment_date, time_slot } = req.body;

    // Базовая валидация
    if (!patient_id || !doctor_id || !appointment_date || !time_slot) {
        return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля (patient_id, doctor_id, appointment_date, time_slot)' });
    }

    try {
        // Проверяем, свободен ли слот у данного врача
        const checkSlotQuery = `
            SELECT id FROM Appointments 
            WHERE doctor_id = $1 AND appointment_date = $2 AND time_slot = $3 AND status != 'canceled'
        `;
        const existingAppointment = await pool.query(checkSlotQuery, [doctor_id, appointment_date, time_slot]);

        if (existingAppointment.rows.length > 0) {
            return res.status(409).json({ error: 'Данный слот времени уже занят' });
        }

        // Записываем пациента
        const insertQuery = `
            INSERT INTO Appointments (patient_id, doctor_id, appointment_date, time_slot, status)
            VALUES ($1, $2, $3, $4, 'scheduled')
            RETURNING *;
        `;
        const newAppointment = await pool.query(insertQuery, [patient_id, doctor_id, appointment_date, time_slot]);

        res.status(201).json({
            message: 'Запись успешно создана',
            appointment: newAppointment.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        
        // Обработка ошибки уникального ограничения из БД (на всякий случай, если пройдет параллельный запрос)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Данный слот времени уже занят (конфликт базы данных)' });
        }
        
        res.status(500).json({ error: 'Внутренняя ошибка сервера при создании записи' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
