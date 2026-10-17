import { useState } from "react";

/**
 * מריץ פעולה אסינכרונית עם מצב "רץ" והודעת שגיאה, ושואל אישור לפני כן אם צריך.
 * מחזיר true אם הפעולה הצליחה, כדי שהקורא ימשיך (למשל לסגור טופס).
 */
export function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  async function run(action: () => Promise<unknown>, confirmText?: string): Promise<boolean> {
    if (confirmText && !window.confirm(confirmText)) return false;
    setError(null);
    setIsRunning(true);
    try {
      await action();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsRunning(false);
    }
  }

  return { run, error, isRunning, setError };
}
