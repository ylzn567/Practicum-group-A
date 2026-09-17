// תואם ל-types/index.ts של הבאקאנד (קבוצה א׳), עם _id ותאריכים כמחרוזות JSON

export type PositionLevel = "LEVEL_A" | "LEVEL_C" | "LEVEL_D";

export type PositionStatus =
  | "DRAFT"
  | "IN_EVALUATION"
  | "APPROVED_FOR_TENDER"
  | "CLOSED";

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

export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  DRAFT: "טיוטה",
  IN_EVALUATION: "בהערכה",
  APPROVED_FOR_TENDER: "אושרה לתיחור",
  CLOSED: "סגורה",
};

// מיפוי לגוני ה-Badge של מערכת העיצוב
export const POSITION_STATUS_TONES: Record<
  PositionStatus,
  "draft" | "pending" | "published" | "success"
> = {
  DRAFT: "draft",
  IN_EVALUATION: "pending",
  APPROVED_FOR_TENDER: "published",
  CLOSED: "success",
};

export const POSITION_LEVEL_LABELS: Record<PositionLevel, string> = {
  LEVEL_A: "רמה א׳",
  LEVEL_C: "רמה ג׳",
  LEVEL_D: "רמה ד׳",
};
