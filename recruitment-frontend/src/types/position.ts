// תואם ל-types/index.ts של הבאקאנד (קבוצה א׳), עם _id ותאריכים כמחרוזות JSON

export type PositionLevel = "LEVEL_A" | "LEVEL_B" | "LEVEL_C" | "LEVEL_D";

export type PositionStatus =
  | "DRAFT"
  | "PREPARING_MATERIALS"
  | "PENDING_COMMITTEE_APPROVAL"
  | "PUBLISHED"
  | "IN_REVIEW"
  | "PENDING_FINAL_APPROVAL"
  | "CLOSED"
  | "CANCELLED";

export interface Position {
  _id: string;
  title: string;
  categoryId?: string;
  clusterCode?: string;
  roleCode?: string;
  level?: PositionLevel;
  description?: string;
  monthlyHours?: number;
  maxHourlyRate?: number;
  durationMonths?: number;
  status?: PositionStatus;
  submissionDeadline?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// לפי סדר חיי התיחור. "בוטלה" מחוץ לרצף (ראו positionWorkflow.ts)
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

// מיפוי לגוני ה-Badge של מערכת העיצוב: ממתינה = pending, פתוחה לספקים = published
export const POSITION_STATUS_TONES: Record<
  PositionStatus,
  "draft" | "pending" | "published" | "success" | "cancelled"
> = {
  DRAFT: "draft",
  PREPARING_MATERIALS: "pending",
  PENDING_COMMITTEE_APPROVAL: "pending",
  PUBLISHED: "published",
  IN_REVIEW: "published",
  PENDING_FINAL_APPROVAL: "pending",
  CLOSED: "success",
  CANCELLED: "cancelled",
};

export const POSITION_LEVEL_LABELS: Record<PositionLevel, string> = {
  LEVEL_A: "רמה א׳",
  LEVEL_B: "רמה ב׳",
  LEVEL_C: "רמה ג׳",
  LEVEL_D: "רמה ד׳",
};
