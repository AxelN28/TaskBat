
const pool = require('../config/db');
const { enqueueTaskEmail } = require('../services/mail');

function queueNotification(kind, task) {
    enqueueTaskEmail(kind, task).catch(error => {
        console.error('No se pudo procesar el aviso por correo:', error.message);
    });
}

const validPriorities = ['high', 'medium', 'low'];
const isValidId = (id) => /^\d+$/.test(id) && Number(id) > 0 && Number(id) <= 2147483647;
const isValidTitle = (title) => typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 255;

function isValidDueDate(value) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const hasInvalidDetails = ({ description, category, priority }) =>
    (description !== undefined && typeof description !== 'string') ||
    (category !== undefined && (typeof category !== 'string' || category.length > 100)) ||
    (priority !== undefined && !validPriorities.includes(priority));

// Obtener todas las tareas
const getTasks = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT *, due_date::text AS due_date FROM tasks ORDER BY id DESC'
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Crear una tarea
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            due_date: dueDate
        } = req.body || {};

        if (!isValidTitle(title)) {
            return res.status(400).json({
                message: 'El título debe tener entre 1 y 255 caracteres'
            });
        }

        if (!isValidDueDate(dueDate)) {
            return res.status(400).json({ message: 'La fecha límite no es válida' });
        }

        if (hasInvalidDetails({ description, category, priority })) {
            return res.status(400).json({
                message: 'Descripción, categoría o prioridad no válida'
            });
        }

        const result = await pool.query(
            `INSERT INTO tasks
                (title, description, category, priority, due_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *, due_date::text AS due_date`,
            [
                title.trim(),
                description || '',
                category || 'Personal',
                priority || 'medium',
                dueDate ?? null
            ]
        );

        res.status(201).json(result.rows[0]);
        queueNotification('created', result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
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
            completed,
            due_date: dueDate
        } = req.body || {};

        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'ID de tarea no válido' });
        }

        if ((title !== undefined && !isValidTitle(title)) ||
            (completed !== undefined && typeof completed !== 'boolean')) {
            return res.status(400).json({ message: 'Título o estado no válido' });
        }

        if (!isValidDueDate(dueDate)) {
            return res.status(400).json({ message: 'La fecha límite no es válida' });
        }

        if (hasInvalidDetails({ description, category, priority })) {
            return res.status(400).json({
                message: 'Descripción, categoría o prioridad no válida'
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 category = COALESCE($3, category),
                 priority = COALESCE($4, priority),
                 completed = COALESCE($5, completed),
                 due_date = CASE WHEN $7::boolean THEN $8::date ELSE due_date END
             WHERE id = $6
             RETURNING *, due_date::text AS due_date`,
            [
                title?.trim(),
                description,
                category,
                priority,
                completed,
                id,
                dueDate !== undefined,
                dueDate ?? null
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        res.json(result.rows[0]);
        if (completed === true) queueNotification('completed', result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Eliminar una tarea
const deleteTask = async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ message: 'ID de tarea no válido' });
    }

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
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
