const EMPTY = "—";

export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return EMPTY;
  return `${value.toLocaleString("he-IL")} ₪`;
}

export function formatDate(value?: string): string {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatText(value?: string): string {
  return value?.trim() ? value : EMPTY;
}

/** שם קובץ בטוח ל-Windows: "/" בכותרת כמו "מהנדס/ת" לא חוקי בשם קובץ */
export function toFileName(prefix: string, title: string, extension: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
  return `${prefix} ${cleaned || "משרה"}.${extension}`;
}
