import type {
  CriterionTemplate,
  JobCategory,
  StageTemplate,
} from "../../types/jobCategory";
import type { CriterionType, ScoringMethod } from "../../types/stage";

// כמו בשאר הטפסים — ערכים כמחרוזות, המרה אחת בשמירה

export interface CriterionTemplateForm {
  name: string;
  type: string;
  scoringMethod: string;
  targetValue: string;
  maxScore: string;
  weightPercent: string;
  descriptionGuide: string;
}

export interface StageTemplateForm {
  name: string;
  weightPercent: string;
  quota: string;
  criteria: CriterionTemplateForm[];
}

export interface CategoryForm {
  name: string;
  description: string;
  stageTemplates: StageTemplateForm[];
}

export const EMPTY_CRITERION_TEMPLATE: CriterionTemplateForm = {
  name: "",
  type: "SCORED",
  scoringMethod: "DIRECT",
  targetValue: "",
  maxScore: "",
  weightPercent: "",
  descriptionGuide: "",
};

export const EMPTY_STAGE_TEMPLATE: StageTemplateForm = {
  name: "",
  weightPercent: "",
  quota: "",
  criteria: [],
};

export const EMPTY_CATEGORY: CategoryForm = {
  name: "",
  description: "",
  stageTemplates: [],
};

export function categoryToForm(category: JobCategory): CategoryForm {
  const stages = [...(category.stageTemplates ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return {
    name: category.name ?? "",
    description: category.description ?? "",
    stageTemplates: stages.map((stage) => ({
      name: stage.name ?? "",
      weightPercent: stage.weightPercent?.toString() ?? "",
      quota: stage.quota?.toString() ?? "",
      criteria: (stage.criteria ?? []).map((criterion) => ({
        name: criterion.name ?? "",
        type: criterion.type ?? "SCORED",
        scoringMethod: criterion.scoringMethod ?? "DIRECT",
        targetValue: criterion.targetValue?.toString() ?? "",
        maxScore: criterion.maxScore?.toString() ?? "",
        weightPercent: criterion.weightPercent?.toString() ?? "",
        descriptionGuide: criterion.descriptionGuide ?? "",
      })),
    })),
  };
}

/** order נגזר ממיקום במערך — אין צורך לנהל אותו ידנית */
export function categoryToPayload(form: CategoryForm): Partial<JobCategory> {
  const stageTemplates: StageTemplate[] = form.stageTemplates.map(
    (stage, index) => ({
      name: stage.name.trim(),
      order: index + 1,
      weightPercent: stage.weightPercent.trim()
        ? Number(stage.weightPercent)
        : 0,
      quota: stage.quota.trim() ? Number(stage.quota) : undefined,
      criteria: stage.criteria.map((criterion): CriterionTemplate => {
        const isScored = criterion.type === "SCORED";
        const isRatio = criterion.scoringMethod === "RATIO";
        return {
          name: criterion.name.trim(),
          type: criterion.type as CriterionType,
          scoringMethod: isScored
            ? (criterion.scoringMethod as ScoringMethod)
            : undefined,
          targetValue:
            isScored && isRatio ? Number(criterion.targetValue) : undefined,
          maxScore:
            isScored && !isRatio ? Number(criterion.maxScore) : undefined,
          weightPercent: isScored ? Number(criterion.weightPercent) : undefined,
          descriptionGuide: criterion.descriptionGuide.trim() || undefined,
        };
      }),
    })
  );

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    stageTemplates,
  };
}

// ===== חישובי משקל =====

export function sumStageTemplateWeights(stages: StageTemplateForm[]): number {
  return stages.reduce((total, stage) => total + (Number(stage.weightPercent) || 0), 0);
}

export function sumCriteriaTemplateWeights(
  criteria: CriterionTemplateForm[]
): number {
  return criteria
    .filter((criterion) => criterion.type === "SCORED")
    .reduce((total, criterion) => total + (Number(criterion.weightPercent) || 0), 0);
}

export function hasScoredTemplateCriteria(
  criteria: CriterionTemplateForm[]
): boolean {
  return criteria.some((criterion) => criterion.type === "SCORED");
}

/**
 * ולידציה של התבנית כולה. מחזירה רשימת בעיות קריאות —
 * המבנה מקונן מדי בשביל מפת שגיאות לפי שדה, והמחוונים החיים
 * ממילא מראים את חוסר האיזון תוך כדי עבודה.
 */
export function validateCategory(form: CategoryForm): string[] {
  const problems: string[] = [];

  if (form.name.trim().length < 2) {
    problems.push("יש להזין שם לקטגוריה");
  }

  if (form.stageTemplates.length === 0) {
    problems.push("יש להגדיר לפחות שלב אחד בתבנית");
  }

  form.stageTemplates.forEach((stage, stageIndex) => {
    const stageLabel = stage.name.trim() || `שלב ${stageIndex + 1}`;

    if (stage.name.trim().length < 2) {
      problems.push(`${stageLabel}: יש להזין שם לשלב`);
    }

    const stageWeight = Number(stage.weightPercent);
    if (!stage.weightPercent.trim()) {
      problems.push(`${stageLabel}: יש להזין משקל (0 לשלב של תנאי סף)`);
    } else if (Number.isNaN(stageWeight) || stageWeight < 0 || stageWeight > 100) {
      problems.push(`${stageLabel}: המשקל חייב להיות בין 0 ל-100`);
    }

    if (stage.criteria.length === 0) {
      problems.push(`${stageLabel}: אין קריטריונים בשלב`);
    }

    stage.criteria.forEach((criterion, criterionIndex) => {
      const label = `${stageLabel} / ${criterion.name.trim() || `קריטריון ${criterionIndex + 1}`}`;

      if (criterion.name.trim().length < 2) {
        problems.push(`${label}: יש להזין שם לקריטריון`);
      }

      if (criterion.type !== "SCORED") return;

      if (criterion.scoringMethod === "RATIO") {
        if (!criterion.targetValue.trim() || Number(criterion.targetValue) <= 0) {
          problems.push(`${label}: ערך יעד חייב להיות מספר גדול מאפס`);
        }
      } else if (!criterion.maxScore.trim() || Number(criterion.maxScore) <= 0) {
        problems.push(`${label}: ציון מרבי חייב להיות מספר גדול מאפס`);
      }

      const weight = Number(criterion.weightPercent);
      if (!criterion.weightPercent.trim() || weight <= 0 || weight > 100) {
        problems.push(`${label}: משקל חייב להיות בין 1 ל-100`);
      }
    });

    if (
      hasScoredTemplateCriteria(stage.criteria) &&
      sumCriteriaTemplateWeights(stage.criteria) !== 100
    ) {
      problems.push(
        `${stageLabel}: סכום משקלי הקריטריונים הוא ${sumCriteriaTemplateWeights(stage.criteria)}% במקום 100%`
      );
    }
  });

  const total = sumStageTemplateWeights(form.stageTemplates);
  if (form.stageTemplates.length > 0 && total !== 100) {
    problems.push(`סכום משקלי השלבים הוא ${total}% במקום 100%`);
  }

  return problems;
}
