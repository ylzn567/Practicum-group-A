import { PositionStatus } from "./types";

/** תקרת שעות חודשיות למשרה. נאכפת גם ב-schema וגם בשירות, ומוצגת בטופס */
export const MAX_MONTHLY_HOURS = 182;

/** ברירות המחדל של משרה חדשה, לפי הנוהל. אותם ערכים בטופס בלקוח (positionForm.ts) */
export const DEFAULT_MONTHLY_HOURS = 180;
export const DEFAULT_DURATION_MONTHS = 12;

/**
 * הסטטוסים של משרה, לפי סדר חיי התיחור בהוראות המשרד.
 * "בוטלה" מחוץ לרצף: מגיעים אליה מכל שלב שאינו סופי, למשל כשמתגלה טעות אחרי הפרסום.
 */
export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  DRAFT: "טיוטה",
  PREPARING_MATERIALS: "הכנת חומרים לוועדה",
  PENDING_COMMITTEE_APPROVAL: "ממתינה לאישור ועדה",
  PUBLISHED: "פורסמה לספקים",
  IN_REVIEW: "בבדיקה ובסינון",
  PENDING_FINAL_APPROVAL: "ממתינה לאישור סופי",
  CLOSED: "סגורה",
  CANCELLED: "בוטלה",
};
