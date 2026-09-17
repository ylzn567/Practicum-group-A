import { useState } from "react";
import type { FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Table,
  Text,
} from "../../design-system/components";
import {
  deleteCriterion,
  deleteStage,
  updateStage,
} from "../../services/stages.service";
import { CRITERION_TYPE_LABELS, SCORING_METHOD_LABELS } from "../../types/stage";
import type { Criterion, Stage } from "../../types/stage";
import { CriterionEditor } from "./CriterionEditor";
import { WeightMeter } from "./WeightMeter";
import {
  hasScoredCriteria,
  stageToForm,
  stageToPayload,
  sumCriteriaWeights,
  validateStageForm,
} from "./stagesBuilder";
import type { StageFormErrors, StageFormValues } from "./stagesBuilder";

type StageCardProps = {
  stage: Stage;
  criteria: Criterion[];
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
  onMove: (direction: "up" | "down") => void;
};

export function StageCard({
  stage,
  criteria,
  isFirst,
  isLast,
  onChanged,
  onMove,
}: StageCardProps) {
  const [values, setValues] = useState<StageFormValues>(stageToForm(stage));
  const [errors, setErrors] = useState<StageFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // null = סגור, "new" = קריטריון חדש, אחרת מזהה הקריטריון בעריכה
  const [editing, setEditing] = useState<string | null>(null);

  const criteriaWeight = sumCriteriaWeights(criteria);
  const showCriteriaMeter = hasScoredCriteria(criteria);

  function updateField(field: keyof StageFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSaveStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const validationErrors = validateStageForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      await updateStage(stage._id, stageToPayload(values));
      onChanged();
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStage() {
    const message =
      criteria.length > 0
        ? `מחיקת השלב "${stage.name}" תמחק גם ${criteria.length} קריטריונים. להמשיך?`
        : `למחוק את השלב "${stage.name}"?`;
    if (!window.confirm(message)) return;

    setServerError(null);
    try {
      // מוחקים קודם את הקריטריונים כדי לא להשאיר מסמכים יתומים
      await Promise.all(criteria.map((criterion) => deleteCriterion(criterion._id)));
      await deleteStage(stage._id);
      onChanged();
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function handleDeleteCriterion(criterion: Criterion) {
    if (!window.confirm(`למחוק את הקריטריון "${criterion.name}"?`)) return;
    setServerError(null);
    try {
      await deleteCriterion(criterion._id);
      onChanged();
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  return (
    <div className="stage-card">
      <Card>
        <div className="stage-card__header">
          <button
            type="button"
            className="stage-card__toggle"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="stage-card__chevron">{isOpen ? "▾" : "◂"}</span>
            <Heading level={3}>
              {stage.order ? `${stage.order}. ` : ""}
              {stage.name}
            </Heading>
          </button>

          <div className="stage-card__header-meta">
            <Badge tone={stage.weightPercent ? "published" : "draft"}>
              משקל {stage.weightPercent ?? 0}%
            </Badge>
            <Badge tone="draft">{criteria.length} קריטריונים</Badge>
            <Button
              variant="secondary"
              disabled={isFirst}
              aria-label="הזזה למעלה"
              onClick={() => onMove("up")}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              disabled={isLast}
              aria-label="הזזה למטה"
              onClick={() => onMove("down")}
            >
              ↓
            </Button>
          </div>
        </div>

        {isOpen && (
          <>
            {serverError && (
              <p className="form-alert" role="alert">
                {serverError}
              </p>
            )}

            <form onSubmit={handleSaveStage} noValidate>
              <div className="stage-card__grid">
                <div className={errors.name ? "form-invalid" : undefined}>
                  <Field label="שם השלב *" hint={errors.name}>
                    <Input
                      value={values.name}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                  </Field>
                </div>

                <div className={errors.weightPercent ? "form-invalid" : undefined}>
                  <Field
                    label="משקל במשרה (%) *"
                    hint={errors.weightPercent ?? "0 לשלב של תנאי סף"}
                  >
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={values.weightPercent}
                      onChange={(e) => updateField("weightPercent", e.target.value)}
                    />
                  </Field>
                </div>

                <div className={errors.quota ? "form-invalid" : undefined}>
                  <Field
                    label="מכסת מעבר"
                    hint={errors.quota ?? "כמה מועמדים ממשיכים לשלב הבא"}
                  >
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={values.quota}
                      onChange={(e) => updateField("quota", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="stage-card__actions">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמירת השלב"}
                </Button>
                <Button type="button" variant="danger" onClick={handleDeleteStage}>
                  מחיקת השלב
                </Button>
              </div>
            </form>

            <div className="stage-card__criteria">
              <div className="stage-card__criteria-header">
                <Heading level={3}>קריטריונים</Heading>
                {showCriteriaMeter && (
                  <WeightMeter total={criteriaWeight} label="סכום משקלי הקריטריונים" />
                )}
              </div>

              {criteria.length === 0 ? (
                <Text>אין עדיין קריטריונים בשלב הזה.</Text>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>סוג</th>
                      <th>שיטה</th>
                      <th>יעד / מרבי</th>
                      <th>משקל</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion._id}>
                        <td>{criterion.name}</td>
                        <td>
                          <Badge
                            tone={criterion.type === "BOOLEAN" ? "pending" : "published"}
                          >
                            {CRITERION_TYPE_LABELS[criterion.type]}
                          </Badge>
                        </td>
                        <td>
                          {criterion.scoringMethod
                            ? SCORING_METHOD_LABELS[criterion.scoringMethod]
                            : "—"}
                        </td>
                        <td className="num">
                          {criterion.targetValue ?? criterion.maxScore ?? "—"}
                        </td>
                        <td className="num">
                          {criterion.weightPercent != null
                            ? `${criterion.weightPercent}%`
                            : "—"}
                        </td>
                        <td>
                          <div className="stage-card__row-actions">
                            <Button
                              variant="secondary"
                              onClick={() => setEditing(criterion._id)}
                            >
                              עריכה
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDeleteCriterion(criterion)}
                            >
                              מחיקה
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {editing === null && (
                <div className="stage-card__actions">
                  <Button variant="secondary" onClick={() => setEditing("new")}>
                    הוספת קריטריון
                  </Button>
                </div>
              )}

              {editing !== null && (
                <CriterionEditor
                  stageId={stage._id}
                  criterion={criteria.find((item) => item._id === editing)}
                  onSaved={() => {
                    setEditing(null);
                    onChanged();
                  }}
                  onCancel={() => setEditing(null)}
                />
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
