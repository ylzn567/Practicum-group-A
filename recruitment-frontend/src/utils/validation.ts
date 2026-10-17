export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** מחרוזת מנוקה, או undefined אם ריקה. שדה ריק נשלח כ-undefined ולא כ-"", אחרת mongoose דוחה אותו מול enum */
export const text = (value: string) => value.trim() || undefined;

/** מספר מהקלט, או undefined אם ריק */
export const num = (value: string) => (value.trim() ? Number(value) : undefined);

/** שגיאה של שדה מספרי חיובי, או undefined אם תקין. שדה ריק תקין אלא אם required */
export function positiveError(value: string, label: string, required = false) {
  if (!value.trim()) return required ? `יש להזין ${label}` : undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} חייב להיות מספר`;
  if (parsed <= 0) return `${label} חייב להיות גדול מאפס`;
  return undefined;
}

/** שגיאה של משקל באחוזים, או undefined אם תקין. allowZero לשלב של תנאי סף, אחרת המשקל חייב להיות חיובי */
export function weightError(value: string, allowZero: boolean, requiredMessage: string) {
  if (!value.trim()) return requiredMessage;
  const parsed = Number(value);
  const isInvalid = Number.isNaN(parsed) || parsed > 100 || (allowZero ? parsed < 0 : parsed <= 0);
  return isInvalid ? `המשקל חייב להיות בין ${allowZero ? 0 : 1} ל-100` : undefined;
}

/** מסיר מפתחות בלי שגיאה, כדי ש-Object.keys ישקף רק שגיאות אמיתיות */
export function onlyErrors<E extends Record<string, string | undefined>>(errors: E): E {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as E;
}
