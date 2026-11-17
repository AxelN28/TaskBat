const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const dateName = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

export function dayKey(date) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatDueDate(key) {
  return shortDate.format(new Date(key + 'T12:00:00'));
}

export function getMonth(year, month) {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0, 12).getDate();

  return {
    label: monthName.format(first),
    days: Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
      const date = new Date(year, month, i - offset + 1, 12);
      return {
        key: dayKey(date),
        date,
        label: dateName.format(date),
        inMonth: date.getMonth() === month,
      };
    }),
  };
}

export function isOverdue(task, today) {
  return !task.completed && Boolean(task.due_date && task.due_date < today);
}

export function summarize(tasks, today) {
  const done = tasks.filter(task => task.completed).length;
  return {
    total: tasks.length,
    done,
    pending: tasks.length - done,
    overdue: tasks.filter(task => isOverdue(task, today)).length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
