import { useState } from 'react';
import { CheckCircle2, Clock3, ListTodo, TriangleAlert } from 'lucide-react';
import { dayKey, summarize } from './taskDates';
import { useToday } from './useToday';
import './taskViews.css';

const priorities = { high: 'Alta', medium: 'Media', low: 'Baja' };
const periods = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 0, label: 'Todas' },
];

function Breakdown({ title, groups, today }) {
  return (
    <section className="panel stats-breakdown">
      <h2>{title}</h2>
      {groups.size ? (
        <ul>
          {[...groups].sort(([, a], [, b]) => b.length - a.length).map(([label, tasks]) => {
            const { done, total, percent } = summarize(tasks, today);
            return (
              <li key={label}>
                <div className="stats-group-label"><strong>{label}</strong><span>{done} de {total} completadas</span></div>
                <progress value={done} max={total} aria-label={label + ': ' + percent + '% completadas'} />
              </li>
            );
          })}
        </ul>
      ) : <p className="view-empty">No hay datos en este período.</p>}
    </section>
  );
}

export default function TaskStatistics({ tasks }) {
  const [period, setPeriod] = useState(0);
  const now = useToday();
  const today = dayKey(now);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - period + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const visible = period ? tasks.filter(task => {
    const createdAt = new Date(task.created_at);
    return createdAt >= start && createdAt < end;
  }) : tasks;
  const { total, done, pending, overdue, percent } = summarize(visible, today);
  const cards = [
    { label: 'Tareas registradas', count: total, Icon: ListTodo },
    { label: 'Completadas', count: done, Icon: CheckCircle2 },
    { label: 'Pendientes', count: pending, Icon: Clock3 },
    { label: 'Vencidas', count: overdue, Icon: TriangleAlert },
  ];

  return (
    <>
      <div className="stats-filter">
        <span>Tareas por fecha de creación</span>
        <div className="period-options" role="group" aria-label="Período de las estadísticas">
          {periods.map(({ days, label }) => (
            <button key={days} type="button" aria-pressed={period === days} onClick={() => setPeriod(days)}>{label}</button>
          ))}
        </div>
      </div>

      <section className="stats-grid" aria-label="Indicadores del período">
        {cards.map(({ label, count, Icon }) => (
          <article className="stat-card" key={label}>
            <div className="stat-top">{label}<span className="stat-icon"><Icon size={18} /></span></div>
            <div className="stat-value">{count}</div>
          </article>
        ))}
      </section>

      <div className="stats-layout">
        <section className="panel stats-overview">
          <h2>Tasa de finalización</h2>
          <div className="stats-ring" style={{ '--completion': percent + '%' }}>
            <span><strong>{percent}%</strong><small>completadas</small></span>
          </div>
          <div className="stats-legend">
            <span><i /> Completadas <strong>{done}</strong></span>
            <span><i /> Pendientes <strong>{pending}</strong></span>
          </div>
        </section>
        <Breakdown title="Por categoría" groups={Map.groupBy(visible, task => task.category || 'Personal')} today={today} />
        <Breakdown title="Por prioridad" groups={Map.groupBy(visible, task => priorities[task.priority] || 'Media')} today={today} />
      </div>
    </>
  );
}
