import { sumCriteriaWeights, sumStageWeights } from "../stages/stagesBuilder";
import type { Criterion, Stage } from "../../types/stage";
import type { PositionStatus } from "../../types/position";

export interface ReadinessCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

/**
 * מה שצריך להיות תקין לפני שמשרה עוברת מטיוטה להערכה.
 * ברגע שמועמדים מתחילים לקבל ציונים, שינוי משקלים ישנה ציונים קיימים —
 * ולכן הבדיקה נעשית כאן, לפני המעבר, ולא אחריו.
 */
export function buildReadinessChecks(
  stages: Stage[],
  criteriaByStage: Record<string, Criterion[]>
): ReadinessCheck[] {
  const stageWeight = sumStageWeights(stages);

  const stagesWithoutCriteria = stages.filter(
    (stage) => (criteriaByStage[stage._id] ?? []).length === 0
  );

  const unbalancedStages = stages.filter((stage) => {
    const criteria = criteriaByStage[stage._id] ?? [];
    const scored = criteria.filter((criterion) => criterion.type === "SCORED");
    if (scored.length === 0) return false; // שלב של תנאי סף בלבד — אין מה לאזן
    return sumCriteriaWeights(criteria) !== 100;
  });

  return [
    {
      label: "הוגדר לפחות שלב אחד",
      passed: stages.length > 0,
      detail: stages.length === 0 ? "אין שלבים במשרה" : `${stages.length} שלבים`,
    },
    {
      label: "סכום משקלי השלבים הוא 100%",
      passed: stages.length > 0 && stageWeight === 100,
      detail: `${Math.round(stageWeight * 100) / 100}%`,
    },
    {
      label: "לכל שלב יש קריטריונים",
      passed: stages.length > 0 && stagesWithoutCriteria.length === 0,
      detail:
        stagesWithoutCriteria.length > 0
          ? `חסר ב: ${stagesWithoutCriteria.map((s) => s.name).join(", ")}`
          : undefined,
    },
    {
      label: "משקלי הקריטריונים בכל שלב מנוקד הם 100%",
      passed: unbalancedStages.length === 0,
      detail:
        unbalancedStages.length > 0
          ? `לא מאוזן ב: ${unbalancedStages.map((s) => s.name).join(", ")}`
          : undefined,
    },
  ];
}

/**
 * סדר המעברים. שימו לב: המשרד לא הגדיר אילו מעברים מותרים —
 * זו הנחה שלנו שצריכה אישור, ולא כלל שהגיע מהנוהל.
 */
const STATUS_FLOW: PositionStatus[] = [
  "DRAFT",
  "IN_EVALUATION",
  "APPROVED_FOR_TENDER",
  "CLOSED",
];

export function getNextStatus(current: PositionStatus): PositionStatus | null {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

export function getStatusStepIndex(current: PositionStatus): number {
  return STATUS_FLOW.indexOf(current);
}

export const STATUS_FLOW_ORDER = STATUS_FLOW;
