const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'clinic_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function seed() {
    try {
        console.log('Начинаем заполнение базы данных...');
        
        // Создадим тестового пользователя (админа/врача) чтобы на него ссылаться
        const userQuery = `
            INSERT INTO Users (role, name, email, phone, password_hash)
            VALUES 
            ('admin', 'Системный Администратор', 'admin@clinicos.ru', '+79990000000', 'hashed_password'),
            ('doctor', 'Иванов Иван (Терапевт)', 'ivanov@clinicos.ru', '+79991111111', 'hashed_password'),
            ('doctor', 'Смирнова Анна (Хирург)', 'smirnova@clinicos.ru', '+79992222222', 'hashed_password'),
            ('doctor', 'Петров Петр (Невролог)', 'petrov@clinicos.ru', '+79993333333', 'hashed_password')
            RETURNING id, name;
        `;
        const users = await pool.query(userQuery);
        console.log('Пользователи созданы:', users.rows.length);

        // Создадим врачей
        const docQuery = `
            INSERT INTO Doctors (user_id, specialization, room_number, experience_years)
            VALUES 
            ($1, 'Терапевт', '101', 10),
            ($2, 'Хирург', '205', 8),
            ($3, 'Невролог', '302', 15)
            RETURNING id, specialization;
        `;
        
        const doc1 = users.rows.find(u => u.name.includes('Терапевт')).id;
        const doc2 = users.rows.find(u => u.name.includes('Хирург')).id;
        const doc3 = users.rows.find(u => u.name.includes('Невролог')).id;

        const docs = await pool.query(docQuery, [doc1, doc2, doc3]);
        console.log('Врачи созданы:', docs.rows.length);

        console.log('Готово! База данных заполнена тестовыми данными.');
    } catch (error) {
        console.error('Ошибка при заполнении БД:', error);
    } finally {
        await pool.end();
    }
}

seed();
