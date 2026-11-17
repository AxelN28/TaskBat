import { useEffect, useState } from 'react';

export function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    function update() {
      const date = new Date();
      setToday(current => current.toDateString() === date.toDateString() ? current : date);
    }

    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return today;
}
