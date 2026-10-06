import { toFormValues } from "../../hooks/useForm";
import type { FormErrors } from "../../hooks/useForm";
import type { CriterionTemplate } from "../../types/jobCategory";
import type { Stage } from "../../types/stage";
import { num, onlyErrors, positiveError, text, weightError } from "../../utils/validation";

// טפסי שלב וקריטריון, משותפים לעורך השלבים של משרה ולעורך התבנית של קטגוריה.
// הערכים מחרוזות (כמו שהדפדפן מחזיר), וההמרה למספרים קורית פעם אחת ב-toPayload.

// ===== שלב =====

export interface StageFormValues extends Record<string, string> {
  name: string;
  weightPercent: string;
  quota: string;
}

export const EMPTY_STAGE_FORM: StageFormValues = { name: "", weightPercent: "", quota: "" };

export const stageToForm = (stage: Partial<Stage>) => toFormValues(EMPTY_STAGE_FORM, stage);

export const validateStageForm = (values: StageFormValues): FormErrors<StageFormValues> =>
  onlyErrors({
    name: values.name.trim().length < 2 ? "יש להזין שם לשלב" : undefined,
    weightPercent: weightError(values.weightPercent, true, "יש להזין משקל (0 לשלב של תנאי סף)"),
    quota:
      values.quota.trim() && !(Number.isInteger(Number(values.quota)) && Number(values.quota) >= 0)
        ? "המכסה חייבת להיות מספר שלם ולא שלילי"
        : undefined,
  });

export const stageToPayload = (values: StageFormValues) => ({
  name: values.name.trim(),
  weightPercent: Number(values.weightPercent),
  quota: num(values.quota),
});

// ===== קריטריון =====

export interface CriterionFormValues extends Record<string, string> {
  name: string;
  type: string;
  scoringMethod: string;
  targetValue: string;
  maxScore: string;
  weightPercent: string;
  descriptionGuide: string;
}

export const EMPTY_CRITERION_FORM: CriterionFormValues = {
  name: "",
  type: "SCORED",
  scoringMethod: "DIRECT",
  targetValue: "",
  maxScore: "",
  weightPercent: "",
  descriptionGuide: "",
};

export const criterionToForm = (criterion: CriterionTemplate) =>
  toFormValues(EMPTY_CRITERION_FORM, criterion);

/** תנאי סף הוא שער עובר/לא עובר, ולכן אין לו שיטת ניקוד, ערך יעד או משקל */
export function validateCriterionForm(values: CriterionFormValues): FormErrors<CriterionFormValues> {
  const isRatio = values.scoringMethod === "RATIO";
  return onlyErrors({
    name: values.name.trim().length < 2 ? "יש להזין שם לקריטריון" : undefined,
    ...(values.type === "SCORED" && {
      targetValue: isRatio ? positiveError(values.targetValue, "ערך יעד", true) : undefined,
      maxScore: isRatio ? undefined : positiveError(values.maxScore, "ציון מרבי", true),
      weightPercent: weightError(values.weightPercent, false, "יש להזין משקל"),
    }),
  });
}

/** שדות שלא רלוונטיים למצב הנוכחי נשלחים כ-undefined, כדי לא להשאיר ערכים ישנים אחרי החלפת סוג */
export function criterionToPayload(values: CriterionFormValues): CriterionTemplate {
  const isScored = values.type === "SCORED";
  const isRatio = values.scoringMethod === "RATIO";
  return {
    name: values.name.trim(),
    type: values.type as CriterionTemplate["type"],
    scoringMethod: isScored ? (values.scoringMethod as CriterionTemplate["scoringMethod"]) : undefined,
    targetValue: isScored && isRatio ? Number(values.targetValue) : undefined,
    maxScore: isScored && !isRatio ? Number(values.maxScore) : undefined,
    weightPercent: isScored ? Number(values.weightPercent) : undefined,
    descriptionGuide: text(values.descriptionGuide),
  };
}

// ===== חישובי משקל =====
// עובדים גם על ישויות (מספרים) וגם על ערכי טופס (מחרוזות)

type Weighted = { weightPercent?: number | string };
const weightOf = (item: Weighted) => Number(item.weightPercent) || 0;

export const sumStageWeights = (stages: Weighted[]) =>
  stages.reduce((total, stage) => total + weightOf(stage), 0);

/** רק קריטריונים מנוקדים נכנסים לחישוב: תנאי סף הוא שער, לא ציון */
export const sumCriteriaWeights = (criteria: (Weighted & { type: string })[]) =>
  sumStageWeights(criteria.filter((criterion) => criterion.type === "SCORED"));

export const hasScoredCriteria = (criteria: { type: string }[]) =>
  criteria.some((criterion) => criterion.type === "SCORED");
