import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
} from "../../design-system/components";
import {
  createPosition,
  getJobCategories,
  getPositionById,
  updatePosition,
} from "../../services/positions.service";
import {
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
} from "../../types/position";
import type { JobCategory, PositionLevel, PositionStatus } from "../../types/position";
import {
  EMPTY_POSITION_FORM,
  toFormValues,
  todayInputValue,
  toPositionPayload,
  validatePositionForm,
} from "./positionForm";
import type { PositionFormErrors, PositionFormValues } from "./positionForm";
import "./PositionFormScreen.css";

const LEVELS: PositionLevel[] = ["LEVEL_A", "LEVEL_C", "LEVEL_D"];
const STATUSES: PositionStatus[] = [
  "DRAFT",
  "IN_EVALUATION",
  "APPROVED_FOR_TENDER",
  "CLOSED",
];

type PositionFormScreenProps = {
  /** undefined = יצירת משרה חדשה */
  positionId?: string;
  onSaved: (positionId: string) => void;
  onCancel: () => void;
};

export function PositionFormScreen({
  positionId,
  onSaved,
  onCancel,
}: PositionFormScreenProps) {
  const mode = positionId ? "edit" : "create";

  const [values, setValues] = useState<PositionFormValues>(EMPTY_POSITION_FORM);
  const [errors, setErrors] = useState<PositionFormErrors>({});
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [categoriesData, position] = await Promise.all([
          getJobCategories(),
          positionId ? getPositionById(positionId) : Promise.resolve(null),
        ]);
        if (isCancelled) return;
        setCategories(categoriesData);
        if (position) setValues(toFormValues(position));
      } catch (err) {
        if (!isCancelled) setLoadError((err as Error).message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [positionId]);

  function updateField(field: keyof PositionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const validationErrors = validatePositionForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = toPositionPayload(values);
      const saved = positionId
        ? await updatePosition(positionId, payload)
        : await createPosition(payload);
      onSaved(saved._id);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען את פרטי המשרה...</Text>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <Card>
          <Heading level={3}>לא הצלחנו לטעון את המשרה</Heading>
          <Text>{loadError}</Text>
          <div className="position-form__actions">
            <Button variant="secondary" onClick={onCancel}>
              חזרה לרשימה
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>
            {mode === "create" ? "משרה חדשה" : "עריכת משרה"}
          </Heading>
          <Text>
            {mode === "create"
              ? "הקטגוריה קובעת אילו שלבים וקריטריונים יועתקו למשרה."
              : "שינויים נשמרים על המשרה הקיימת, בלי לגעת בשלבים ובקריטריונים."}
          </Text>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          {serverError && (
            <p className="form-alert" role="alert">
              {serverError}
            </p>
          )}

          <div className={errors.title ? "form-invalid" : undefined}>
            <Field label="כותרת המשרה *" hint={errors.title}>
              <Input
                value={values.title}
                placeholder="לדוגמה: מהנדס/ת DevOps בכיר/ה"
                aria-invalid={Boolean(errors.title)}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </Field>
          </div>

          <div className={errors.categoryId ? "form-invalid" : undefined}>
            <Field
              label="קטגוריית משרה *"
              hint={errors.categoryId ?? "קובעת את תבנית השלבים והקריטריונים"}
            >
              <Select
                value={values.categoryId}
                aria-invalid={Boolean(errors.categoryId)}
                onChange={(e) => updateField("categoryId", e.target.value)}
              >
                <option value="">בחרו קטגוריה</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="position-form__grid">
            <Field label="קוד אשכול">
              <Input
                value={values.clusterCode}
                dir="ltr"
                placeholder="TECH-01"
                onChange={(e) => updateField("clusterCode", e.target.value)}
              />
            </Field>

            <Field label="קוד תפקיד">
              <Input
                value={values.roleCode}
                dir="ltr"
                placeholder="DEVOPS-SR"
                onChange={(e) => updateField("roleCode", e.target.value)}
              />
            </Field>

            <Field label="רמה">
              <Select
                value={values.level}
                onChange={(e) => updateField("level", e.target.value)}
              >
                <option value="">ללא רמה</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {POSITION_LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="סטטוס">
              <Select
                value={values.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {POSITION_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <div className={errors.monthlyHours ? "form-invalid" : undefined}>
              <Field label="היקף שעות חודשי" hint={errors.monthlyHours}>
                <Input
                  type="number"
                  min="1"
                  value={values.monthlyHours}
                  aria-invalid={Boolean(errors.monthlyHours)}
                  onChange={(e) => updateField("monthlyHours", e.target.value)}
                />
              </Field>
            </div>

            <div className={errors.maxHourlyRate ? "form-invalid" : undefined}>
              <Field label="תעריף שעתי מרבי (₪)" hint={errors.maxHourlyRate}>
                <Input
                  type="number"
                  min="1"
                  value={values.maxHourlyRate}
                  aria-invalid={Boolean(errors.maxHourlyRate)}
                  onChange={(e) => updateField("maxHourlyRate", e.target.value)}
                />
              </Field>
            </div>

            <div className={errors.durationMonths ? "form-invalid" : undefined}>
              <Field label="משך ההתקשרות (חודשים)" hint={errors.durationMonths}>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={values.durationMonths}
                  aria-invalid={Boolean(errors.durationMonths)}
                  onChange={(e) => updateField("durationMonths", e.target.value)}
                />
              </Field>
            </div>

            <div className={errors.submissionDeadline ? "form-invalid" : undefined}>
              <Field label="מועד אחרון להגשה" hint={errors.submissionDeadline}>
                <Input
                  type="date"
                  value={values.submissionDeadline}
                  min={todayInputValue()}
                  aria-invalid={Boolean(errors.submissionDeadline)}
                  onChange={(e) => updateField("submissionDeadline", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <Field label="תיאור התפקיד">
            <Textarea
              value={values.description}
              placeholder="תיאור התפקיד, תחומי האחריות והממשקים..."
              onChange={(e) => updateField("description", e.target.value)}
            />
          </Field>

          <div className="position-form__actions">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "שומר..." : mode === "create" ? "יצירת משרה" : "שמירת שינויים"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              ביטול
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
