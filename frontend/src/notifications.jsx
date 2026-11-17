import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CirclePlus, PartyPopper, X } from 'lucide-react';
import './notifications.css';

const icons = { created: CirclePlus, completed: PartyPopper, reminder: BellRing };

function NoticeContent({ notice }) {
  const Icon = icons[notice.type];

  return (
    <>
      <span className="notice-icon" aria-hidden="true"><Icon size={20} /></span>
      <div className="notice-copy">
        <strong>{notice.title}</strong>
        <p>{notice.message}</p>
      </div>
    </>
  );
}

function Toast({ notice, dismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(notice.id), 8000);
    return () => window.clearTimeout(timer);
  }, [notice.id, dismiss]);

  return (
    <div className={`notice toast notice--${notice.type}`}>
      <NoticeContent notice={notice} />
      <button
        type="button"
        className="notice-close"
        aria-label="Cerrar aviso"
        onClick={() => dismiss(notice.id)}
      >
        <X size={17} />
      </button>
    </div>
  );
}

export function NotificationToasts({ toasts, dismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(notice => <Toast key={notice.id} notice={notice} dismiss={dismiss} />)}
    </div>
  );
}

export function NotificationBell({ history, unread, markRead }) {
  const [open, setOpen] = useState(false);
  const center = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return;

    function closeOutside(event) {
      if (!center.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="notification-center" ref={center}>
      <button
        type="button"
        ref={trigger}
        className="icon-button notification-trigger"
        aria-label={unread && !open ? `Notificaciones (${unread} nuevas)` : 'Notificaciones'}
        aria-expanded={open}
        onClick={() => {
          markRead();
          setOpen(!open);
        }}
      >
        <Bell size={17} />
        {unread > 0 && !open && <span className="notice-dot" aria-hidden="true" />}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notificaciones recientes">
          <h2>Notificaciones</h2>
          {history.length === 0 ? (
            <p className="notice-empty">Aún no hay avisos. Las tareas pendientes generan un recordatorio cada 24 horas.</p>
          ) : (
            <ul>
              {history.map(notice => (
                <li key={notice.id} className={`notice notice--${notice.type}`}>
                  <NoticeContent notice={notice} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
