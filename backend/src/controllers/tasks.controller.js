let tasks = [];
let nextId = 1;

const getTasks = (req, res) => {
    res.json(tasks);
};

const createTask = (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'El título es obligatorio' });
    }

    const newTask = {
        id: nextId++,
        title,
        description: description || '',
        completed: false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
};

const updateTask = (req, res) => {
    const task = tasks.find(t => t.id === Number(req.params.id));

    if (!task) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    Object.assign(task, req.body);
    res.json(task);
};

const deleteTask = (req, res) => {
    const index = tasks.findIndex(t => t.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    tasks.splice(index, 1);
    res.json({ message: 'Tarea eliminada correctamente' });
};

module.exports = { getTasks, createTask, updateTask, deleteTask };