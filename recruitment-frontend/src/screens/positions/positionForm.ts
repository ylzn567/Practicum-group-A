import type { Position, PositionLevel, PositionStatus } from "../../types/position";

// כל השדות נשמרים כמחרוזות — זה מה שמחזירים שדות טופס.
// ההמרה למספרים ולתאריך קורית פעם אחת, ב-toPositionPayload.
export interface PositionFormValues {
  title: string;
  categoryId: string;
  clusterCode: string;
  roleCode: string;
  level: string;
  description: string;
  monthlyHours: string;
  maxHourlyRate: string;
  durationMonths: string;
  status: string;
  submissionDeadline: string;
}

export type PositionFormErrors = Partial<Record<keyof PositionFormValues, string>>;

export const EMPTY_POSITION_FORM: PositionFormValues = {
  title: "",
  categoryId: "",
  clusterCode: "",
  roleCode: "",
  level: "",
  description: "",
  monthlyHours: "",
  maxHourlyRate: "",
  durationMonths: "",
  status: "DRAFT",
  submissionDeadline: "",
};

/** התאריך של היום בפורמט של <input type="date"> — לפי השעון המקומי, לא UTC */
export function todayInputValue(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function toFormValues(position: Position): PositionFormValues {
  return {
    title: position.title ?? "",
    categoryId: position.categoryId ?? "",
    clusterCode: position.clusterCode ?? "",
    roleCode: position.roleCode ?? "",
    level: position.level ?? "",
    description: position.description ?? "",
    monthlyHours: position.monthlyHours?.toString() ?? "",
    maxHourlyRate: position.maxHourlyRate?.toString() ?? "",
    durationMonths: position.durationMonths?.toString() ?? "",
    status: position.status ?? "DRAFT",
    submissionDeadline: toDateInputValue(position.submissionDeadline),
  };
}

/**
 * שדה ריק נשלח כ-undefined ולא כמחרוזת ריקה — אחרת mongoose
 * ידחה "" מול ה-enum של level ו-status.
 */
export function toPositionPayload(values: PositionFormValues): Partial<Position> {
  const text = (value: string) => (value.trim() ? value.trim() : undefined);
  const num = (value: string) => (value.trim() ? Number(value) : undefined);

  return {
    title: values.title.trim(),
    categoryId: text(values.categoryId),
    clusterCode: text(values.clusterCode),
    roleCode: text(values.roleCode),
    level: (text(values.level) as PositionLevel | undefined) ?? undefined,
    description: text(values.description),
    monthlyHours: num(values.monthlyHours),
    maxHourlyRate: num(values.maxHourlyRate),
    durationMonths: num(values.durationMonths),
    status: (text(values.status) as PositionStatus | undefined) ?? undefined,
    submissionDeadline: text(values.submissionDeadline),
  };
}

function validatePositiveNumber(value: string, label: string): string | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} חייב להיות מספר`;
  if (parsed <= 0) return `${label} חייב להיות גדול מאפס`;
  return undefined;
}

export function validatePositionForm(
  values: PositionFormValues
): PositionFormErrors {
  const errors: PositionFormErrors = {};

  if (values.title.trim().length < 2) {
    errors.title = "יש להזין כותרת למשרה";
  }

  // הקטגוריה קובעת את תבנית השלבים והקריטריונים, ולכן חובה ביצירה
  if (!values.categoryId) {
    errors.categoryId = "יש לבחור קטגוריית משרה";
  }

  errors.monthlyHours = validatePositiveNumber(values.monthlyHours, "היקף שעות חודשי");
  errors.maxHourlyRate = validatePositiveNumber(values.maxHourlyRate, "תעריף מרבי");

  const duration = validatePositiveNumber(values.durationMonths, "משך ההתקשרות");
  if (duration) {
    errors.durationMonths = duration;
  } else if (values.durationMonths.trim() && !Number.isInteger(Number(values.durationMonths))) {
    errors.durationMonths = "משך ההתקשרות חייב להיות מספר חודשים שלם";
  }

  // גם ביצירה וגם בעריכה. השוואת מחרוזות "YYYY-MM-DD" בטוחה מבחינת אזור זמן
  if (
    values.submissionDeadline &&
    values.submissionDeadline < todayInputValue()
  ) {
    errors.submissionDeadline = "המועד האחרון להגשה לא יכול להיות מוקדם מהיום";
  }

  // מנקים מפתחות שקיבלו undefined כדי ש-Object.keys ישקף רק שגיאות אמיתיות
  (Object.keys(errors) as (keyof PositionFormErrors)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });

  return errors;
}
