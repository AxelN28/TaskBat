import { useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { dayKey, getMonth, isOverdue } from './taskDates';
import { useToday } from './useToday';
import './taskViews.css';

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function TaskCalendar({ tasks, onCreate, onSchedule, onToggle, busyTaskId }) {
  const [selected, setSelected] = useState(() => new Date());
  const [unscheduledId, setUnscheduledId] = useState('');
  const currentDate = useToday();
  const today = dayKey(currentDate);
  const selectedKey = dayKey(selected);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const { label, days } = getMonth(year, month);
  const byDate = Map.groupBy(tasks.filter(task => task.due_date), task => task.due_date);
  const unscheduled = tasks.filter(task => !task.due_date && !task.completed);
  const agenda = byDate.get(selectedKey) ?? [];
  const agendaLabel = days.find(day => day.key === selectedKey)?.label;
  const selectedTask = unscheduled.find(task => String(task.id) === unscheduledId);

  function moveMonth(change) {
    setSelected(new Date(year, month + change, 1, 12));
  }

  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel" aria-label="Calendario de fechas límite">
        <div className="calendar-toolbar">
          <div>
            <h2>{label}</h2>
            <p>Fechas límite de tus tareas</p>
          </div>
          <div className="calendar-controls">
            <button type="button" className="secondary-button" onClick={() => setSelected(currentDate)}>Hoy</button>
            <button type="button" className="icon-button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button>
            <button type="button" className="icon-button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekdays.map(day => <span className="calendar-weekday" key={day}>{day}</span>)}
          {days.map(day => {
            const dayTasks = byDate.get(day.key) ?? [];
            return (
              <button
                type="button"
                key={day.key}
                className={'calendar-day' + (day.inMonth ? '' : ' calendar-day--other')}
                aria-label={day.label + (dayTasks.length ? ', tareas: ' + dayTasks.length : '')}
                aria-current={day.key === today ? 'date' : undefined}
                aria-pressed={day.key === selectedKey}
                onClick={() => setSelected(day.date)}
              >
                <span className="calendar-number">{day.date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="calendar-count" data-overdue={dayTasks.some(task => isOverdue(task, today))}>
                    {dayTasks.length}<span> {dayTasks.length === 1 ? 'tarea' : 'tareas'}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel calendar-agenda" aria-label="Agenda del día seleccionado">
        <div className="calendar-agenda-header">
          <CalendarDays size={20} aria-hidden="true" />
          <div>
            <h2>Agenda del día</h2>
            <p>{agendaLabel}</p>
          </div>
        </div>
        {agenda.length ? (
          <ul className="agenda-tasks">
            {agenda.map(task => (
              <li key={task.id}>
                <div className="agenda-task-main">
                  <button
                    type="button"
                    className="icon-button agenda-check"
                    aria-label={(task.completed ? 'Reabrir ' : 'Completar ') + task.title}
                    disabled={busyTaskId !== null}
                    onClick={() => onToggle(task.id, task.completed)}
                  ><Check size={16} /></button>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.completed ? 'Completada' : isOverdue(task, today) ? 'Vencida' : 'Pendiente'} · {task.category || 'Personal'}</small>
                  </div>
                </div>
                <label className="agenda-date">
                  Cambiar fecha
                  <input
                    type="date"
                    min="1000-01-01"
                    max="9999-12-31"
                    value={task.due_date}
                    disabled={busyTaskId !== null}
                    onChange={event => {
                      if (event.currentTarget.validity.valid) {
                        onSchedule(task.id, event.currentTarget.value || null);
                      }
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="view-empty">No hay tareas programadas para este día.</p>}

        <button type="button" className="primary-button" onClick={() => onCreate(selectedKey)}>
          <Plus size={16} /> Nueva tarea para este día
        </button>

        {unscheduled.length > 0 && (
          <form className="agenda-assign" onSubmit={event => {
            event.preventDefault();
            if (selectedTask) onSchedule(selectedTask.id, selectedKey);
          }}>
            <label htmlFor="unscheduled-task">Tareas pendientes sin fecha</label>
            <select id="unscheduled-task" value={selectedTask ? unscheduledId : ''} onChange={event => setUnscheduledId(event.target.value)}>
              <option value="">Elige una tarea</option>
              {unscheduled.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
            <button type="submit" className="secondary-button" disabled={!selectedTask || busyTaskId !== null}>
              Asignar al día seleccionado
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
