const BASE_URL = "/api";
const TOKEN_KEY = "recruitment.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * קריאת fetch גנרית — כל הקבוצות משתמשות בה במקום לכתוב fetch בכל מקום.
 * מוסיפה את הטוקן, מפרשת JSON, וזורקת Error עם ההודעה מהשרת.
 */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.status, path, data));
  }

  return data as T;
}

/**
 * העלאת קובץ כגוף הבקשה עצמו (לא multipart), ותשובת JSON.
 * שם הקובץ נשלח בכותרת X-File-Name מקודד, כי כותרות HTTP לא נושאות עברית.
 */
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.status, path, data));
  }

  return data as T;
}

/**
 * 404 על נתיב API מסמן כמעט תמיד endpoint שעוד לא נכתב בשרת (או שרת שלא
 * הופעל מחדש), ולא "לא נמצא". מפרידים בין השניים כדי לא לשלוח לחפש באג בלקוח.
 */
function buildErrorMessage(status: number, path: string, data: unknown): string {
  const fallback =
    status === 404
      ? `הנתיב ${path} לא קיים בשרת — ה-endpoint עדיין לא נכתב`
      : `שגיאת שרת (${status})`;

  return (data as { error?: string } | null)?.error ?? fallback;
}

/**
 * הורדת קובץ מהשרת. fetch ולא קישור רגיל, כדי שהטוקן יישלח ושגיאות
 * (למשל משרה שלא קיימת) יוצגו כהודעה ולא כדף שגיאה בלשונית חדשה.
 */
export async function downloadFile(path: string, fileName: string): Promise<void> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(buildErrorMessage(response.status, path, data));
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
