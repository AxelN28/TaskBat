# TaskBat

Gestor de tareas que permite crear, listar, completar, reabrir y eliminar tareas, con categorías y prioridades.

## Arquitectura

El navegador carga el frontend React + Vite desde un Static Site de Render. El frontend llama con Fetch al Web Service de Node.js + Express. La API guarda las tareas en Render Postgres.

- `frontend/` contiene la interfaz y el cliente HTTP.
- `backend/` contiene la API y la inicialización de la tabla de tareas.

## Desarrollo local

1. Instala Node.js LTS y PostgreSQL, o usa la URL externa de tu base de desarrollo.
2. En `backend/`, copia `.env.example` como `.env`, configura la conexión y ejecuta `npm ci` y `npm start`. El backend prepara la tabla al arrancar.
3. En otra terminal, entra en `frontend/`, copia `.env.example` como `.env` y ejecuta `npm ci` y `npm run dev`. Abre la URL que imprime Vite.

| Variable | Dónde | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Backend | URL de PostgreSQL. Usa la URL interna en Render y la externa si te conectas desde tu equipo a Render Postgres. |
| `DB_SSL` | Backend | `false` para la URL interna de Render o PostgreSQL local sin SSL. `true` para la URL externa de Render. |
| `FRONTEND_URL` | Backend | Origen autorizado sin barra final. Localmente, `http://localhost:5173`. Para autorizar tanto el Static Site como el dominio personalizado, separa sus orígenes por coma. |
| `PORT` | Backend | `3000` por defecto. Render lo asigna al servicio. |
| `VITE_API_URL` | Frontend | URL base del backend, sin `/api/tasks`. Localmente, `http://localhost:3000`. En Render se define antes de compilar. |

## API REST

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio con `{"status":"ok"}`. |
| GET | `/api/tasks` | Lista las tareas. |
| POST | `/api/tasks` | Crea una tarea con un `title` y devuelve 201. |
| PATCH | `/api/tasks/:id` | Actualiza los campos enviados. Envía `{"completed":true}` para completar la tarea y `false` para reabrirla. |
| DELETE | `/api/tasks/:id` | Elimina una tarea. |

## Despliegue en Render

Conecta ambos servicios al repositorio y a la rama `main`, con autodespliegue al hacer push.

| Configuración | Web Service | Static Site |
| --- | --- | --- |
| Directorio raíz | `backend` | `frontend` |
| Compilación | `npm ci` | `npm ci && npm run build` |
| Inicio | `npm start` | — |
| Directorio publicado | — | `dist` |
| Ruta de salud | `/api/health` | — |

1. Configura el Web Service con la URL interna de Render Postgres y `DB_SSL=false`.
2. Configura el Static Site con `VITE_API_URL` igual a la URL pública del Web Service. Si la cambias, vuelve a desplegar el sitio para que Vite incorpore el nuevo valor.
3. Configura `FRONTEND_URL` en el Web Service con el origen del Static Site. Si habilitas `taskbat.lat`, agrega también `https://taskbat.lat`.

## URLs y verificación de producción

- Dominio previsto: https://taskbat.lat
- Static Site de Render: pendiente de registrar el enlace verificado.
- Health check del Web Service: pendiente de registrar el enlace verificado.

En producción, comprueba que la ruta de salud responde y que se puede crear, listar, completar, reabrir y borrar una tarea. Conserva una tarea durante un reinicio del Web Service para verificar la persistencia. Guarda capturas del panel con los tres servicios, de la app en uso y del autodespliegue tras un push.
