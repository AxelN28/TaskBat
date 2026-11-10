const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const createTable = require('./config/initDB');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/tasks', require('./routes/tasks.routes'));

app.get('/', (req, res) => {
    res.json({ message: 'TaskBoard API funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('PostgreSQL conectado correctamente');

        await createTable();

        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error iniciando el servidor:', error.message);
        process.exit(1);
    }
};

startServer();