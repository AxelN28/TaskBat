
const pool = require('./db');

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT DEFAULT '',
                category VARCHAR(100) DEFAULT 'Personal',
                priority VARCHAR(20) DEFAULT 'medium',
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Actualizar tablas existentes sin eliminar información
        await pool.query(`
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Personal',
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS mail_outbox (
                message_key TEXT PRIMARY KEY,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                sent_at TIMESTAMPTZ
            );
        `);

        console.log('Tabla tasks creada y actualizada correctamente');
    } catch (error) {
        console.error('Error creando o actualizando tabla:', error.message);
        throw error;
    }
};

module.exports = createTable;
