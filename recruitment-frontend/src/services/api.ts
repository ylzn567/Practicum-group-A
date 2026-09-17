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
    // 404 על נתיב API מסמן כמעט תמיד endpoint שעוד לא נכתב בשרת,
    // ולא "לא נמצא". מפרידים בין השניים כדי לא לשלוח לחפש באג בצד הלקוח.
    const fallback =
      response.status === 404
        ? `הנתיב ${path} לא קיים בשרת — ה-endpoint עדיין לא נכתב`
        : `שגיאת שרת (${response.status})`;

    const message = (data as { error?: string } | null)?.error ?? fallback;
    throw new Error(message);
  }

  return data as T;
}
