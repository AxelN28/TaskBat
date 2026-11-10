
const pool = require('../config/db');

// Obtener todas las tareas
const getTasks = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks ORDER BY id DESC'
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear una tarea
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'El título es obligatorio'
            });
        }

        const validPriorities = ['high', 'medium', 'low'];

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                message: 'Prioridad no válida'
            });
        }

        const result = await pool.query(
            `INSERT INTO tasks
                (title, description, category, priority)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                title.trim(),
                description || '',
                category || 'Personal',
                priority || 'medium'
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar una tarea
const updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            completed
        } = req.body;

        const { id } = req.params;

        const validPriorities = ['high', 'medium', 'low'];

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                message: 'Prioridad no válida'
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 category = COALESCE($3, category),
                 priority = COALESCE($4, priority),
                 completed = COALESCE($5, completed)
             WHERE id = $6
             RETURNING *`,
            [
                title,
                description,
                category,
                priority,
                completed,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar una tarea
const deleteTask = async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
