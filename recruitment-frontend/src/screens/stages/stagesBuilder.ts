import type { Criterion, CriterionType, ScoringMethod, Stage } from "../../types/stage";

// ===== טופס שלב =====

export interface StageFormValues {
  name: string;
  weightPercent: string;
  quota: string;
}

export type StageFormErrors = Partial<Record<keyof StageFormValues, string>>;

export const EMPTY_STAGE_FORM: StageFormValues = {
  name: "",
  weightPercent: "",
  quota: "",
};

export function stageToForm(stage: Stage): StageFormValues {
  return {
    name: stage.name ?? "",
    weightPercent: stage.weightPercent?.toString() ?? "",
    quota: stage.quota?.toString() ?? "",
  };
}

export function validateStageForm(values: StageFormValues): StageFormErrors {
  const errors: StageFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "יש להזין שם לשלב";
  }

  const weight = Number(values.weightPercent);
  if (!values.weightPercent.trim()) {
    errors.weightPercent = "יש להזין משקל (0 לשלב תנאי סף)";
  } else if (Number.isNaN(weight) || weight < 0 || weight > 100) {
    errors.weightPercent = "המשקל חייב להיות בין 0 ל-100";
  }

  if (values.quota.trim()) {
    const quota = Number(values.quota);
    if (Number.isNaN(quota) || quota < 0 || !Number.isInteger(quota)) {
      errors.quota = "המכסה חייבת להיות מספר שלם ולא שלילי";
    }
  }

  return errors;
}

export function stageToPayload(values: StageFormValues): Partial<Stage> {
  return {
    name: values.name.trim(),
    weightPercent: Number(values.weightPercent),
    quota: values.quota.trim() ? Number(values.quota) : undefined,
  };
}

// ===== טופס קריטריון =====

export interface CriterionFormValues {
  name: string;
  type: string;
  scoringMethod: string;
  targetValue: string;
  maxScore: string;
  weightPercent: string;
  descriptionGuide: string;
}

export type CriterionFormErrors = Partial<Record<keyof CriterionFormValues, string>>;

export const EMPTY_CRITERION_FORM: CriterionFormValues = {
  name: "",
  type: "SCORED",
  scoringMethod: "DIRECT",
  targetValue: "",
  maxScore: "",
  weightPercent: "",
  descriptionGuide: "",
};

export function criterionToForm(criterion: Criterion): CriterionFormValues {
  return {
    name: criterion.name ?? "",
    type: criterion.type ?? "SCORED",
    scoringMethod: criterion.scoringMethod ?? "DIRECT",
    targetValue: criterion.targetValue?.toString() ?? "",
    maxScore: criterion.maxScore?.toString() ?? "",
    weightPercent: criterion.weightPercent?.toString() ?? "",
    descriptionGuide: criterion.descriptionGuide ?? "",
  };
}

function positiveNumberError(value: string, label: string): string | undefined {
  if (!value.trim()) return `יש להזין ${label}`;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return `${label} חייב להיות מספר`;
  if (parsed <= 0) return `${label} חייב להיות גדול מאפס`;
  return undefined;
}

export function validateCriterionForm(
  values: CriterionFormValues
): CriterionFormErrors {
  const errors: CriterionFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "יש להזין שם לקריטריון";
  }

  // תנאי סף הוא שער עובר/לא עובר — אין לו שיטת ניקוד, ערך יעד או משקל
  if (values.type === "SCORED") {
    if (values.scoringMethod === "RATIO") {
      const targetError = positiveNumberError(values.targetValue, "ערך יעד");
      if (targetError) errors.targetValue = targetError;
    } else {
      const maxError = positiveNumberError(values.maxScore, "ציון מרבי");
      if (maxError) errors.maxScore = maxError;
    }

    const weight = Number(values.weightPercent);
    if (!values.weightPercent.trim()) {
      errors.weightPercent = "יש להזין משקל";
    } else if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
      errors.weightPercent = "המשקל חייב להיות בין 1 ל-100";
    }
  }

  return errors;
}

export function criterionToPayload(
  values: CriterionFormValues,
  stageId: string
): Partial<Criterion> {
  const isScored = values.type === "SCORED";
  const isRatio = values.scoringMethod === "RATIO";

  return {
    stageId,
    name: values.name.trim(),
    type: values.type as CriterionType,
    // שדות שלא רלוונטיים למצב הנוכחי נשלחים כ-undefined כדי לא להשאיר
    // ערכים ישנים על המסמך אחרי שינוי סוג הקריטריון
    scoringMethod: isScored ? (values.scoringMethod as ScoringMethod) : undefined,
    targetValue: isScored && isRatio ? Number(values.targetValue) : undefined,
    maxScore: isScored && !isRatio ? Number(values.maxScore) : undefined,
    weightPercent: isScored ? Number(values.weightPercent) : undefined,
    descriptionGuide: values.descriptionGuide.trim() || undefined,
  };
}

// ===== חישובי משקל =====

export function sumStageWeights(stages: Stage[]): number {
  return stages.reduce((total, stage) => total + (stage.weightPercent ?? 0), 0);
}

/** רק קריטריונים מנוקדים נכנסים לחישוב — תנאי סף הוא שער, לא ציון */
export function sumCriteriaWeights(criteria: Criterion[]): number {
  return criteria
    .filter((criterion) => criterion.type === "SCORED")
    .reduce((total, criterion) => total + (criterion.weightPercent ?? 0), 0);
}

export function hasScoredCriteria(criteria: Criterion[]): boolean {
  return criteria.some((criterion) => criterion.type === "SCORED");
}
