import { POSITION_STATUS_LABELS } from "../constants";
import { BadRequestError } from "../middleware/errorHandler";
import { positionRepository } from "../models/position.model";
import { stageRepository } from "../models/stage.model";
import { Position, PositionStatus } from "../types";

/**
 * כללי חיי התיחור: אילו מעברי סטטוס מותרים, ומה ננעל בכל שלב.
 * הלקוח מחזיק עותק של אותם כללים (positionWorkflow.ts) כדי להציג את המסך הנכון,
 * אבל האכיפה היא כאן.
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

/**
 * המעברים המותרים מכל סטטוס. אחורה רק כשיש לזה סיבה בתהליך: ועדה שמחזירה את החומרים
 * לתיקון, או זוכה שלא אושר וחוזרים לבדיקה. אחרי הפרסום אין חזרה, רק ביטול.
 */
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

const FINAL_STATUSES: PositionStatus[] = ["CLOSED", "CANCELLED"];

/** מהפרסום הספקים מתמחרים ומגישים לפי הנתונים, ולכן הם ננעלים. לתיקון מבטלים ופותחים משרה חדשה */
export const isContentLocked = (status: PositionStatus) =>
  status === "CANCELLED" || STATUS_FLOW.indexOf(status) >= STATUS_FLOW.indexOf("PUBLISHED");

const FIELD_LABELS = {
  title: "כותרת המשרה",
  categoryId: "קטגוריה",
  clusterCode: "קוד אשכול",
  roleCode: "קוד תפקיד",
  level: "רמה",
  monthlyHours: "היקף שעות חודשי",
  maxHourlyRate: "תעריף שעתי מרבי",
  durationMonths: "משך ההתקשרות",
  description: "תיאור התפקיד",
  submissionDeadline: "מועד אחרון להגשה",
} satisfies Partial<Record<keyof Position, string>>;

type EditableField = keyof typeof FIELD_LABELS;

/** תיאור ומועד הגשה נשארים פתוחים גם אחרי הפרסום (למשל הארכת מועד), עד שהמשרה מגיעה לסטטוס סופי */
const OPEN_AFTER_PUBLISH: EditableField[] = ["description", "submissionDeadline"];

function lockedFieldsOf(status: PositionStatus): EditableField[] {
  const all = Object.keys(FIELD_LABELS) as EditableField[];
  if (FINAL_STATUSES.includes(status)) return all;
  if (isContentLocked(status)) return all.filter((field) => !OPEN_AFTER_PUBLISH.includes(field));
  return [];
}

const labelOf = (status: string) => POSITION_STATUS_LABELS[status as PositionStatus] ?? status;

const normalize = (value: unknown) =>
  value === undefined || value === null || value === "" ? "" : String(value);

// הטופס שולח את כל השדות גם כשלא השתנו, ולכן נכשלים רק על שינוי אמיתי.
// תאריך מגיע כמחרוזת "YYYY-MM-DD" ונשמר כ-Date, ולכן משווים זמנים
function isSameValue(current: unknown, incoming: unknown): boolean {
  if (current instanceof Date && normalize(incoming)) {
    return new Date(String(incoming)).getTime() === current.getTime();
  }
  return normalize(current) === normalize(incoming);
}

/** בודק עדכון משרה מול הסטטוס הנוכחי שלה: מעבר הסטטוס מותר, ואף שדה נעול לא משתנה */
export function assertPositionUpdate(current: Position, changes: Partial<Position>): void {
  const from = current.status ?? "DRAFT";
  const to = changes.status;

  // סטטוס ישן שעוד לא עבר את migrate:statuses לא מופיע ב-TRANSITIONS
  if (to !== undefined && to !== from && !(TRANSITIONS[from] ?? []).includes(to)) {
    throw new BadRequestError(`לא ניתן להעביר משרה מ"${labelOf(from)}" ל"${labelOf(to)}"`);
  }

  const changed = lockedFieldsOf(from).filter(
    (field) => field in changes && !isSameValue(current[field], changes[field])
  );
  if (changed.length > 0) {
    const fields = changed.map((field) => FIELD_LABELS[field]).join(", ");
    const fix = FINAL_STATUSES.includes(from) ? "" : " לתיקון מהותי יש לבטל את התיחור ולפתוח משרה חדשה.";
    throw new BadRequestError(`המשרה בסטטוס "${labelOf(from)}" ולכן לא ניתן לשנות: ${fields}.${fix}`);
  }
}

/** משרה שפורסמה לא נמחקת, כי הספקים כבר ראו אותה. מבטלים אותה במקום */
export function assertPositionDeletable(position: Position): void {
  const status = position.status ?? "DRAFT";
  if (isContentLocked(status)) {
    const fix = FINAL_STATUSES.includes(status) ? "" : " אפשר לבטל את התיחור.";
    throw new BadRequestError(`לא ניתן למחוק משרה בסטטוס "${labelOf(status)}".${fix}`);
  }
}

/**
 * שלבים וקריטריונים (משקלי הניקוד ותנאי הסף) ננעלים יחד עם המשרה.
 * בלי מזהה, או כשהמשרה לא קיימת, אין מה לנעול, וה-schema כבר ידווח על מה שחסר.
 */
export async function assertStagesEditable(positionId: unknown): Promise<void> {
  if (!positionId) return;
  const position = await positionRepository.getById(String(positionId));
  const status = position?.status ?? "DRAFT";
  if (isContentLocked(status)) {
    throw new BadRequestError(
      `המשרה בסטטוס "${labelOf(status)}" ולכן השלבים והקריטריונים שלה נעולים לעריכה.`
    );
  }
}

/** כמו assertStagesEditable, לקריטריון שמכיר רק את השלב שלו */
export async function assertStageEditable(stageId: unknown): Promise<void> {
  if (!stageId) return;
  const stage = await stageRepository.getById(String(stageId));
  await assertStagesEditable(stage?.positionId);
}
