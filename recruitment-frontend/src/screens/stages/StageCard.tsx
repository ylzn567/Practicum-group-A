import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorAlert } from "../../components/FormFields";
import { Badge, Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { criteriaApi, stagesApi } from "../../services/entities";
import type { Criterion, Stage } from "../../types/stage";
import { CriteriaTable } from "./CriteriaTable";
import { CriterionEditor } from "./CriterionEditor";
import { StageFields } from "./StageFields";
import {
  hasScoredCriteria,
  stageToForm,
  stageToPayload,
  sumCriteriaWeights,
  validateStageForm,
} from "./stageForms";
import { WeightMeter } from "./WeightMeter";

type StageCardProps = {
  stage: Stage;
  criteria: Criterion[];
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
  onMove: (direction: "up" | "down") => void;
};

export function StageCard({ stage, criteria, isFirst, isLast, onChanged, onMove }: StageCardProps) {
  const form = useForm(stageToForm(stage));
  const action = useAction();
  const [isOpen, setIsOpen] = useState(true);
  // null = סגור, "new" = קריטריון חדש, אחרת מזהה הקריטריון בעריכה
  const [editing, setEditing] = useState<string | null>(null);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate(validateStageForm)) return;
    action.run(async () => {
      await stagesApi.update(stage._id, stageToPayload(form.values));
      onChanged();
    });
  };

  const handleDeleteStage = () =>
    action.run(
      async () => {
        await stagesApi.remove(stage._id); // השרת מוחק גם את הקריטריונים של השלב
        onChanged();
      },
      criteria.length > 0
        ? `מחיקת השלב "${stage.name}" תמחק גם ${criteria.length} קריטריונים. להמשיך?`
        : `למחוק את השלב "${stage.name}"?`
    );

  const handleDeleteCriterion = (criterion: Criterion) =>
    action.run(async () => {
      await criteriaApi.remove(criterion._id);
      onChanged();
    }, `למחוק את הקריטריון "${criterion.name}"?`);

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
            <Button variant="secondary" disabled={isFirst} aria-label="הזזה למעלה" onClick={() => onMove("up")}>
              ↑
            </Button>
            <Button variant="secondary" disabled={isLast} aria-label="הזזה למטה" onClick={() => onMove("down")}>
              ↓
            </Button>
          </div>
        </div>

        {isOpen && (
          <>
            <ErrorAlert message={action.error} />

            <form onSubmit={handleSave} noValidate>
              <StageFields form={form} />
              <div className="page__actions">
                <Button type="submit" disabled={action.isRunning}>
                  {action.isRunning ? "שומר..." : "שמירת השלב"}
                </Button>
                <Button type="button" variant="danger" onClick={handleDeleteStage}>
                  מחיקת השלב
                </Button>
              </div>
            </form>

            <div className="stage-card__criteria">
              <div className="stage-card__criteria-header">
                <Heading level={3}>קריטריונים</Heading>
                {hasScoredCriteria(criteria) && (
                  <WeightMeter total={sumCriteriaWeights(criteria)} label="סכום משקלי הקריטריונים" />
                )}
              </div>

              {criteria.length === 0 ? (
                <Text>אין עדיין קריטריונים בשלב הזה.</Text>
              ) : (
                <CriteriaTable
                  criteria={criteria}
                  actions={(criterion) => (
                    <div className="stage-card__row-actions">
                      <Button variant="secondary" onClick={() => setEditing(criterion._id)}>
                        עריכה
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteCriterion(criterion)}>
                        מחיקה
                      </Button>
                    </div>
                  )}
                />
              )}

              {editing === null ? (
                <div className="page__actions">
                  <Button variant="secondary" onClick={() => setEditing("new")}>
                    הוספת קריטריון
                  </Button>
                </div>
              ) : (
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
