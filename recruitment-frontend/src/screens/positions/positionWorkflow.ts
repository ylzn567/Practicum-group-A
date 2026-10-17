import type { PositionStatus } from "../../types/position";
import type { PositionFormValues } from "./positionForm";

/**
 * כללי חיי התיחור: אילו מעברי סטטוס מותרים ומה ננעל בכל שלב.
 * עותק של services/positionWorkflow.ts בשרת, כדי להציג רק פעולות מותרות ולנעול שדות מראש.
 * האכיפה היא בשרת, ולכן שינוי כאן חייב להיעשות גם שם.
 */

/** הרצף הראשי של התיחור. "בוטלה" לא חלק ממנו */
export const STATUS_FLOW: PositionStatus[] = [
  "DRAFT",
  "PREPARING_MATERIALS",
  "PENDING_COMMITTEE_APPROVAL",
  "PUBLISHED",
  "IN_REVIEW",
  "PENDING_FINAL_APPROVAL",
  "CLOSED",
];

// אחורה רק כשיש לזה סיבה בתהליך: ועדה שמחזירה חומרים לתיקון, או זוכה שלא אושר.
// אחרי הפרסום אין חזרה, רק ביטול
const TRANSITIONS: Record<PositionStatus, PositionStatus[]> = {
  DRAFT: ["PREPARING_MATERIALS", "CANCELLED"],
  PREPARING_MATERIALS: ["PENDING_COMMITTEE_APPROVAL", "DRAFT", "CANCELLED"],
  PENDING_COMMITTEE_APPROVAL: ["PUBLISHED", "PREPARING_MATERIALS", "CANCELLED"],
  PUBLISHED: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["PENDING_FINAL_APPROVAL", "CANCELLED"],
  PENDING_FINAL_APPROVAL: ["CLOSED", "IN_REVIEW", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

export const isFinalStatus = (status: PositionStatus) =>
  status === "CLOSED" || status === "CANCELLED";

/** מהפרסום הספקים מתמחרים ומגישים לפי הנתונים, ולכן הם ננעלים. לתיקון מבטלים ופותחים משרה חדשה */
export const isContentLocked = (status: PositionStatus) =>
  status === "CANCELLED" || STATUS_FLOW.indexOf(status) >= STATUS_FLOW.indexOf("PUBLISHED");

/** תיאור ומועד הגשה נשארים פתוחים גם אחרי הפרסום (למשל הארכת מועד), עד סטטוס סופי */
const OPEN_AFTER_PUBLISH: (keyof PositionFormValues)[] = ["description", "submissionDeadline"];

export function isFieldLocked(status: PositionStatus, field: keyof PositionFormValues): boolean {
  if (isFinalStatus(status)) return true;
  return isContentLocked(status) && !OPEN_AFTER_PUBLISH.includes(field);
}

/** המעברים שאפשר להציע מהסטטוס הנוכחי: הבא ברצף, חזרה אחורה, וביטול */
export function getTransitions(status: PositionStatus) {
  const allowed = TRANSITIONS[status] ?? [];
  const index = STATUS_FLOW.indexOf(status);
  const inFlow = allowed.filter((target) => target !== "CANCELLED");
  return {
    next: inFlow.find((target) => STATUS_FLOW.indexOf(target) > index) ?? null,
    back: inFlow.find((target) => STATUS_FLOW.indexOf(target) < index) ?? null,
    canCancel: allowed.includes("CANCELLED"),
  };
}

/**
 * מעברים שדורשים שלבים וקריטריונים תקינים: המפ"ל (המשקלים) מוגש לוועדה,
 * ומהפרסום אי אפשר לתקן אותו.
 */
export const requiresReadiness = (target: PositionStatus) =>
  target === "PENDING_COMMITTEE_APPROVAL" || target === "PUBLISHED";
