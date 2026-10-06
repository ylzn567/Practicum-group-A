import { useEffect, useRef, useState } from "react";

/**
 * טוען נתונים כשהמסך עולה (ושוב כש-deps משתנים), עם ביטול אם המסך נסגר באמצע.
 * reload() טוען מחדש בלי להחזיר את המסך למצב "טוען", כדי שאין הבהוב אחרי כל שינוי.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let isCancelled = false;
    setError(null);
    loaderRef
      .current()
      .then((result) => !isCancelled && setData(result))
      .catch((err) => !isCancelled && setError((err as Error).message));
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return {
    data,
    error,
    isLoading: data === undefined && error === null,
    reload: () => setVersion((current) => current + 1),
  };
}
