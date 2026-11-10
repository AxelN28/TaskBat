
const API_URL = 'http://localhost:3000/api/tasks';

// Función central para realizar peticiones
const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Error al comunicarse con el servidor');
    }

    return data;
};

// Obtener todas las tareas
export const getTasks = () => {
    return request('');
};

// Crear una tarea
export const createTask = (task) => {
    return request('', {
        method: 'POST',
        body: JSON.stringify(task),
    });
};

// Actualizar una tarea
export const updateTask = (id, changes) => {
    return request(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(changes),
    });
};

// Eliminar una tarea
export const deleteTask = (id) => {
    return request(`/${id}`, {
        method: 'DELETE',
    });
};

