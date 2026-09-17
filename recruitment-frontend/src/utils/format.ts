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
