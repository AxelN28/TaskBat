
const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

const API_URL = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/api/tasks` : '';

// Función central para realizar peticiones
const request = async (endpoint, options = {}) => {
    if (!API_URL) {
        throw new Error('Configura VITE_API_URL con la URL pública del backend.');
    }

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
        method: 'PATCH',
        body: JSON.stringify(changes),
    });
};

// Eliminar una tarea
export const deleteTask = (id) => {
    return request(`/${id}`, {
        method: 'DELETE',
    });
};

