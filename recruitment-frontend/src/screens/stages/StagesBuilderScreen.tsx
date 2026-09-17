import { useCallback, useEffect, useState } from "react";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { getPositionById } from "../../services/positions.service";
import {
  createStage,
  getCriteriaByStage,
  getStagesByPosition,
  updateStage,
} from "../../services/stages.service";
import { POSITION_STATUS_LABELS } from "../../types/position";
import type { Position } from "../../types/position";
import type { Criterion, Stage } from "../../types/stage";
import { StageCard } from "./StageCard";
import { WeightMeter } from "./WeightMeter";
import { sumStageWeights } from "./stagesBuilder";
import "./StagesBuilderScreen.css";

type StagesBuilderScreenProps = {
  positionId: string;
  onBack: () => void;
};

export function StagesBuilderScreen({
  positionId,
  onBack,
}: StagesBuilderScreenProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [criteriaByStage, setCriteriaByStage] = useState<Record<string, Criterion[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // אחרי כל שינוי טוענים מחדש — עם כמות הנתונים כאן זה זול,
  // וחוסך באגים של סנכרון בין state לשרת
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [positionData, stagesData] = await Promise.all([
        getPositionById(positionId),
        getStagesByPosition(positionId),
      ]);

      const sorted = [...stagesData].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      const criteriaLists = await Promise.all(
        sorted.map((stage) => getCriteriaByStage(stage._id))
      );

      const grouped: Record<string, Criterion[]> = {};
      sorted.forEach((stage, index) => {
        grouped[stage._id] = criteriaLists[index];
      });

      setPosition(positionData);
      setStages(sorted);
      setCriteriaByStage(grouped);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [positionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddStage() {
    setActionError(null);
    try {
      await createStage({
        positionId,
        name: "שלב חדש",
        order: stages.length + 1,
        weightPercent: 0,
      });
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  // החלפת order בין שני שלבים שכנים
  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const current = stages[index];
    const neighbour = stages[targetIndex];

    setActionError(null);
    try {
      await Promise.all([
        updateStage(current._id, { order: targetIndex + 1 }),
        updateStage(neighbour._id, { order: index + 1 }),
      ]);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען שלבים וקריטריונים...</Text>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <Card>
          <Heading level={3}>לא הצלחנו לטעון את השלבים</Heading>
          <Text>{loadError}</Text>
          <div className="stage-card__actions">
            <Button variant="secondary" onClick={onBack}>
              חזרה
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalWeight = sumStageWeights(stages);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>שלבים וקריטריונים</Heading>
          <Text>
            {position
              ? `${position.title} · ${POSITION_STATUS_LABELS[position.status ?? "DRAFT"]}`
              : ""}
          </Text>
        </div>
        <div className="stage-card__actions">
          <Button onClick={handleAddStage}>הוספת שלב</Button>
          <Button variant="secondary" onClick={onBack}>
            חזרה
          </Button>
        </div>
      </header>

      {actionError && (
        <p className="form-alert" role="alert">
          {actionError}
        </p>
      )}

      {stages.length > 0 && (
        <div className="stages__summary">
          <Card>
            <WeightMeter total={totalWeight} label="סכום משקלי השלבים" />
            <Text>
              המשקלים חייבים להסתכם ל-100% לפני שהמשרה עוברת להערכה. שלב של תנאי
              סף מקבל משקל 0.
            </Text>
          </Card>
        </div>
      )}

      {stages.length === 0 ? (
        <Card>
          <Heading level={3}>אין עדיין שלבים במשרה הזו</Heading>
          <Text>
            הוסיפו שלב ראשון, או צרו את המשרה מקטגוריה שיש לה תבנית שלבים מוכנה.
          </Text>
          <div className="stage-card__actions">
            <Button onClick={handleAddStage}>הוספת שלב ראשון</Button>
          </div>
        </Card>
      ) : (
        stages.map((stage, index) => (
          <StageCard
            key={stage._id}
            stage={stage}
            criteria={criteriaByStage[stage._id] ?? []}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
            onChanged={load}
            onMove={(direction) => handleMove(index, direction)}
          />
        ))
      )}
    </div>
  );
}
