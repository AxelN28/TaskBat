import { useCallback, useEffect, useRef, useState } from 'react';

const reminderInterval = 24 * 60 * 60 * 1000;
const reminderStorageKey = 'taskbat:reminder:';
export function useTaskNotifications(tasks) {
  const [history, setHistory] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const lastReminders = useRef(new Map());

  const notify = useCallback((type, title, message) => {
    const notification = { id: ++nextId.current, type, title, message };
    setHistory(current => [notification, ...current].slice(0, 30));
    setToasts(current => [...current, notification].slice(-3));
    setUnread(current => current + 1);
  }, []);

  const delayReminder = useCallback((id, now = Date.now()) => {
    lastReminders.current.set(id, now);
    try {
      localStorage.setItem(reminderStorageKey + id, String(now));
    } catch {
      // El recordatorio sigue registrado en memoria durante esta sesión.
    }
  }, []);

  useEffect(() => {
    function checkReminders() {
      if (document.hidden) return;

      const now = Date.now();
      const due = tasks.filter(task => {
        if (task.completed) return false;
        const created = Date.parse(task.created_at);
        let last = lastReminders.current.get(task.id) ?? 0;
        try {
          last = Math.max(last, Number(localStorage.getItem(reminderStorageKey + task.id)) || 0);
        } catch {
          // Si el almacenamiento está bloqueado, se usa el registro en memoria.
        }
        return Number.isFinite(created) && now - Math.max(created, last) >= reminderInterval;
      });

      if (due.length === 0) return;
      for (const task of due) delayReminder(task.id, now);

      const message = due.length === 1
        ? `«${due[0].title}» sigue pendiente.`
        : `Tienes ${due.length} tareas pendientes desde hace al menos un día.`;
      notify('reminder', 'Recordatorio de tareas', message);
    }

    checkReminders();
    const timer = window.setInterval(checkReminders, 60_000);
    document.addEventListener('visibilitychange', checkReminders);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', checkReminders);
    };
  }, [tasks, delayReminder, notify]);

  const dismiss = useCallback(id => {
    setToasts(current => current.filter(item => item.id !== id));
  }, []);

  return { history, unread, markRead: () => setUnread(0), toasts, dismiss, notify, delayReminder };
}
