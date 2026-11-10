
import { useEffect, useMemo, useState } from 'react';

import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Settings,
  Search,
  Plus,
  Bell,
  Clock3,
  CheckCircle2,
  ListTodo,
  Target,
  X,
  BriefcaseBusiness,
  Trash2,
} from 'lucide-react';

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './services/api';

import './App.css';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Mis tareas', icon: CheckSquare },
  { label: 'Calendario', icon: CalendarDays },
  { label: 'Estadísticas', icon: BarChart3 },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [activePage, setActivePage] = useState('Dashboard');

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newPriority, setNewPriority] = useState('medium');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cargar tareas desde PostgreSQL al iniciar
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setError('');
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Estadísticas
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  // Buscador
  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  // Crear tarea en PostgreSQL
  const addTask = async (event) => {
    event.preventDefault();

    if (!newTitle.trim()) return;

    try {
      setSaving(true);
      setError('');

      const createdTask = await createTask({
        title: newTitle.trim(),
        description: '',
        category: newCategory,
        priority: newPriority,
      });

      setTasks(current => [createdTask, ...current]);

      setNewTitle('');
      setNewCategory('Personal');
      setNewPriority('medium');
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Actualizar estado de una tarea en PostgreSQL
  const toggleTask = async (id, completed) => {
    try {
      setError('');

      const updatedTask = await updateTask(id, {
        completed: !completed,
      });

      setTasks(current =>
        current.map(task =>
          task.id === id ? updatedTask : task
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar tarea de PostgreSQL
  const removeTask = async (id) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar esta tarea?'
    );

    if (!confirmed) return;

    try {
      setError('');
      await deleteTask(id);

      setTasks(current =>
        current.filter(task => task.id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <CheckSquare size={23} />
          </div>

          <div className="brand-name">
            Task<span>Bat</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-menu">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? 'active' : ''
              }`}
              onClick={() => setActivePage(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-label">PREFERENCIAS</div>

          <button
            className={`nav-item ${
              activePage === 'Configuración' ? 'active' : ''
            }`}
            onClick={() => setActivePage('Configuración')}
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>

          <div className="profile">
            <div className="avatar">AX</div>

            <div className="profile-info">
              <strong>Axel</strong>
              <span>Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace / <span>{activePage}</span>
          </div>

          <div className="top-actions">
            <button
              className="icon-button"
              aria-label="Notificaciones"
            >
              <Bell size={17} />
            </button>

            <div className="avatar">AX</div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <div className="eyebrow">
              YOUR PERSONAL WORKSPACE
            </div>

            <h1>Bienvenido de nuevo, Axel.</h1>

            <p>
              Organiza tus prioridades. Construye algo extraordinario.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowModal(true)}
          >
            <Plus size={17} />
            Nueva tarea
          </button>
        </section>

        {error && (
          <div
            style={{
              background: '#492b2d',
              color: '#f0aaaa',
              padding: '13px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              Tareas totales
              <div className="stat-icon">
                <ListTodo size={18} />
              </div>
            </div>

            <div className="stat-value">{tasks.length}</div>
            <div className="stat-description">
              Tareas registradas
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              Pendientes
              <div className="stat-icon">
                <Clock3 size={18} />
              </div>
            </div>

            <div className="stat-value">{pendingTasks}</div>
            <div className="stat-description">
              Por completar
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              Completadas
              <div className="stat-icon">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="stat-value">{completedTasks}</div>
            <div className="stat-description">
              Objetivos alcanzados
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              Productividad
              <div className="stat-icon">
                <Target size={18} />
              </div>
            </div>

            <div className="stat-value">{progress}%</div>
            <div className="stat-description">
              Progreso de tus tareas
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Mis tareas</h2>
                <p>Gestiona tus actividades pendientes</p>
              </div>

              <button
                className="panel-link"
                onClick={() => setSearch('')}
              >
                Ver todas
              </button>
            </div>

            <div className="search-box">
              <Search size={16} />

              <input
                type="text"
                placeholder="Buscar una tarea..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <div className="task-list">
              {loading ? (
                <div className="empty-state">
                  Cargando tareas desde PostgreSQL...
                </div>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div
                    className={`task-item ${
                      task.completed ? 'completed' : ''
                    }`}
                    key={task.id}
                  >
                    <button
                      className={`task-check ${
                        task.completed ? 'done' : ''
                      }`}
                      onClick={() =>
                        toggleTask(task.id, task.completed)
                      }
                      aria-label="Cambiar estado de tarea"
                    >
                      <CheckCircle2 size={19} />
                    </button>

                    <div className="task-details">
                      <strong>{task.title}</strong>
                      <small>{task.category || 'Personal'}</small>
                    </div>

                    <span
                      className={`priority ${
                        task.priority || 'medium'
                      }`}
                    >
                      {task.priority === 'high'
                        ? 'Alta'
                        : task.priority === 'low'
                          ? 'Baja'
                          : 'Media'}
                    </span>

                    <button
                      className="icon-button"
                      aria-label="Eliminar tarea"
                      title="Eliminar tarea"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {search
                    ? 'No encontramos tareas con ese nombre.'
                    : 'Todavía no tienes tareas. ¡Crea la primera!'}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Resumen general</h2>
                <p>Tu rendimiento actual</p>
              </div>

              <BriefcaseBusiness
                size={19}
                color="#c5a45e"
              />
            </div>

            <div className="progress-section">
              <div className="progress-info">
                <span>Progreso total</span>
                <span>{progress}%</span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mini-stat">
              <span>Tareas pendientes</span>
              <strong>{pendingTasks}</strong>
            </div>

            <div className="mini-stat">
              <span>Tareas completadas</span>
              <strong>{completedTasks}</strong>
            </div>

            <div className="mini-stat">
              <span>Total de actividades</span>
              <strong>{tasks.length}</strong>
            </div>
          </div>
        </section>
      </main>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <form className="modal" onSubmit={addTask}>
            <div className="panel-header">
              <h2>Nueva tarea</h2>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="form-field">
              <label>Nombre de la tarea</label>

              <input
                autoFocus
                required
                placeholder="Ej. Terminar proyecto..."
                value={newTitle}
                onChange={event =>
                  setNewTitle(event.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Categoría</label>

              <select
                value={newCategory}
                onChange={event =>
                  setNewCategory(event.target.value)
                }
              >
                <option>Personal</option>
                <option>Universidad</option>
                <option>Desarrollo</option>
                <option>Backend</option>
                <option>Trabajo</option>
              </select>
            </div>

            <div className="form-field">
              <label>Prioridad</label>

              <select
                value={newPriority}
                onChange={event =>
                  setNewPriority(event.target.value)
                }
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                <Plus size={15} />
                {saving ? 'Guardando...' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
