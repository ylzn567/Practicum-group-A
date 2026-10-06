import { toFormValues } from "../../hooks/useForm";
import type { FormErrors } from "../../hooks/useForm";
import type { Position } from "../../types/position";
import { num, onlyErrors, positiveError, text } from "../../utils/validation";

/** תקרת שעות חודשיות. אותו ערך נאכף גם בשרת (constants.ts) */
export const MAX_MONTHLY_HOURS = 182;

// כל השדות נשמרים כמחרוזות (כמו שהדפדפן מחזיר), וההמרה למספרים ולתאריך קורית פעם אחת ב-toPayload
export interface PositionFormValues extends Record<string, string> {
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

/** התאריך של היום בפורמט של <input type="date">, לפי השעון המקומי ולא UTC */
export function todayInputValue(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export const positionToForm = (position: Position): PositionFormValues => ({
  ...toFormValues(EMPTY_POSITION_FORM, position),
  submissionDeadline: position.submissionDeadline?.slice(0, 10) ?? "", // החלק של התאריך ב-ISO
});

/** שדה ריק נשלח כ-undefined ולא כמחרוזת ריקה, אחרת mongoose דוחה אותו מול ה-enum של level ו-status */
export const positionToPayload = (values: PositionFormValues): Partial<Position> => ({
  title: values.title.trim(),
  categoryId: text(values.categoryId),
  clusterCode: text(values.clusterCode),
  roleCode: text(values.roleCode),
  level: text(values.level) as Position["level"],
  description: text(values.description),
  monthlyHours: num(values.monthlyHours),
  maxHourlyRate: num(values.maxHourlyRate),
  durationMonths: num(values.durationMonths),
  status: text(values.status) as Position["status"],
  submissionDeadline: text(values.submissionDeadline),
});

export const validatePositionForm = (values: PositionFormValues): FormErrors<PositionFormValues> =>
  onlyErrors({
    title: values.title.trim().length < 2 ? "יש להזין כותרת למשרה" : undefined,
    // הקטגוריה קובעת את תבנית השלבים והקריטריונים, ולכן חובה
    categoryId: values.categoryId ? undefined : "יש לבחור קטגוריית משרה",
    monthlyHours:
      positiveError(values.monthlyHours, "היקף שעות חודשי") ??
      (Number(values.monthlyHours) > MAX_MONTHLY_HOURS
        ? `היקף שעות חודשי לא יכול לעלות על ${MAX_MONTHLY_HOURS}`
        : undefined),
    maxHourlyRate: positiveError(values.maxHourlyRate, "תעריף מרבי"),
    durationMonths:
      positiveError(values.durationMonths, "משך ההתקשרות") ??
      (values.durationMonths.trim() && !Number.isInteger(Number(values.durationMonths))
        ? "משך ההתקשרות חייב להיות מספר חודשים שלם"
        : undefined),
    // גם ביצירה וגם בעריכה. השוואת מחרוזות "YYYY-MM-DD" בטוחה מבחינת אזור זמן
    submissionDeadline:
      values.submissionDeadline && values.submissionDeadline < todayInputValue()
        ? "המועד האחרון להגשה לא יכול להיות מוקדם מהיום"
        : undefined,
  });
