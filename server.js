const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Раздача статических файлов фронтенда
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Database connection
// Укажите свои данные для подключения, либо используйте .env
const poolConfig = process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Render Postgres
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'clinic_db',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

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

// API Эндпоинты для пациентов
app.get('/api/patients', async (req, res) => {
    try {
        const query = `
            SELECT p.id, u.name, TO_CHAR(p.date_of_birth, 'YYYY-MM-DD') as dob, u.phone, p.allergies
            FROM Patients p
            JOIN Users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения пациентов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/patients', async (req, res) => {
    const { name, dob, phone, allergies } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Имя обязательно' });
    }
    
    // Генерируем фиктивный email для пользователя (email UNIQUE NOT NULL)
    const email = `patient_${Date.now()}@clinicos.ru`;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const userQuery = `
            INSERT INTO Users (role, name, email, phone, password_hash)
            VALUES ('patient', $1, $2, $3, 'nopassword')
            RETURNING id;
        `;
        const userResult = await client.query(userQuery, [name, email, phone || null]);
        const userId = userResult.rows[0].id;
        
        const patientQuery = `
            INSERT INTO Patients (user_id, date_of_birth, allergies)
            VALUES ($1, $2, $3)
            RETURNING id, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as dob, allergies;
        `;
        const patientResult = await client.query(patientQuery, [userId, dob || null, allergies || null]);
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Пациент успешно создан',
            patient: {
                id: patientResult.rows[0].id,
                name: name,
                dob: patientResult.rows[0].dob,
                phone: phone,
                allergies: patientResult.rows[0].allergies
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка при создании пациента:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при создании пациента' });
    } finally {
        client.release();
    }
});

// API Эндпоинты для врачей
app.get('/api/doctors', async (req, res) => {
    try {
        const query = `
            SELECT d.id, u.name, d.specialization 
            FROM Doctors d
            JOIN Users u ON d.user_id = u.id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения врачей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// API Эндпоинт для расписания (все записи)
app.get('/api/appointments', async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.time_slot as time, a.status,
                   d.specialization as doctor_spec, du.name as doctor_name, pu.name as patient_name
            FROM Appointments a
            JOIN Doctors d ON a.doctor_id = d.id
            JOIN Users du ON d.user_id = du.id
            LEFT JOIN Patients p ON a.patient_id = p.id
            LEFT JOIN Users pu ON p.user_id = pu.id
        `;
        const result = await pool.query(query);
        
        const formatted = result.rows.map(r => ({
            id: r.id,
            time: r.time.substring(0, 5), // "09:00:00" -> "09:00"
            status: r.status,
            doctor: r.doctor_spec, // Для UI пока используем специальность как имя врача (в app.js так сделано)
            patient: r.patient_name
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Ошибка получения записей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Функция для автоматической инициализации базы данных
async function initDB() {
    try {
        const client = await pool.connect();
        try {
            // Проверяем, существует ли таблица users
            const checkRes = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'users'
                );
            `);
            
            if (!checkRes.rows[0].exists) {
                console.log('Таблицы не найдены. Запускаем создание схемы...');
                const fs = require('fs');
                const path = require('path');
                
                const schemaPath = path.join(__dirname, 'schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await client.query(schema);
                console.log('Схема создана.');
                
                console.log('Добавляем тестовых врачей...');
                const userQuery = `
                    INSERT INTO users (role, name, email, phone, password_hash)
                    VALUES 
                    ('admin', 'Системный Администратор', 'admin@clinicos.ru', '+79990000000', 'hashed_password'),
                    ('doctor', 'Иванов Иван (Терапевт)', 'ivanov@clinicos.ru', '+79991111111', 'hashed_password'),
                    ('doctor', 'Смирнова Анна (Хирург)', 'smirnova@clinicos.ru', '+79992222222', 'hashed_password'),
                    ('doctor', 'Петров Петр (Невролог)', 'petrov@clinicos.ru', '+79993333333', 'hashed_password')
                    RETURNING id, name;
                `;
                const users = await client.query(userQuery);

                const docQuery = `
                    INSERT INTO doctors (user_id, specialization, room_number, experience_years)
                    VALUES 
                    ($1, 'Терапевт', '101', 10),
                    ($2, 'Хирург', '205', 8),
                    ($3, 'Невролог', '302', 15)
                `;
                const doc1 = users.rows.find(u => u.name.includes('Терапевт')).id;
                const doc2 = users.rows.find(u => u.name.includes('Хирург')).id;
                const doc3 = users.rows.find(u => u.name.includes('Невролог')).id;

                await client.query(docQuery, [doc1, doc2, doc3]);
                console.log('Инициализация БД завершена успешно!');
            } else {
                console.log('База данных готова к работе (таблицы существуют).');
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Критическая ошибка при инициализации БД:', error);
    }
}

// Fallback route для отдачи index.html для всех остальных запросов (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    // Запускаем инициализацию БД после старта сервера
    initDB();
});
