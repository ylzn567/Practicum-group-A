import { ErrorAlert } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useLoad } from "../../hooks/useLoad";
import { getStageTree, positionsApi, stagesApi } from "../../services/entities";
import { POSITION_STATUS_LABELS } from "../../types/position";
import { StageCard } from "./StageCard";
import { sumStageWeights } from "./stageForms";
import { WeightMeter } from "./WeightMeter";
import "./StagesBuilderScreen.css";

type StagesBuilderScreenProps = {
  positionId: string;
  onBack: () => void;
};

export function StagesBuilderScreen({ positionId, onBack }: StagesBuilderScreenProps) {
  // אחרי כל שינוי טוענים מחדש: עם כמות הנתונים כאן זה זול, וחוסך באגים של סנכרון מול השרת
  const load = useLoad(async () => {
    const [position, tree] = await Promise.all([positionsApi.getById(positionId), getStageTree(positionId)]);
    return { position, ...tree };
  }, [positionId]);
  const action = useAction();

  return (
    <LoadGate
      load={load}
      loadingText="טוען שלבים וקריטריונים..."
      errorTitle="לא הצלחנו לטעון את השלבים"
      action={{ label: "חזרה", onClick: onBack }}
    >
      {({ position, stages, criteriaByStage }) => {
        const addStage = () =>
          action.run(async () => {
            await stagesApi.create({
              positionId,
              name: "שלב חדש",
              order: stages.length + 1,
              weightPercent: 0,
            });
            load.reload();
          });

        // החלפת order בין שני שלבים שכנים
        const moveStage = (index: number, direction: "up" | "down") => {
          const target = direction === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= stages.length) return;
          return action.run(async () => {
            await Promise.all([
              stagesApi.update(stages[index]._id, { order: target + 1 }),
              stagesApi.update(stages[target]._id, { order: index + 1 }),
            ]);
            load.reload();
          });
        };

        return (
          <div className="page">
            <header className="page__header">
              <div>
                <Heading level={1}>שלבים וקריטריונים</Heading>
                <Text>{`${position.title} · ${POSITION_STATUS_LABELS[position.status ?? "DRAFT"]}`}</Text>
              </div>
              <div className="page__actions">
                <Button onClick={addStage}>הוספת שלב</Button>
                <Button variant="secondary" onClick={onBack}>
                  חזרה
                </Button>
              </div>
            </header>

            <ErrorAlert message={action.error} />

            {stages.length > 0 && (
              <div className="stages__summary">
                <Card>
                  <WeightMeter total={sumStageWeights(stages)} label="סכום משקלי השלבים" />
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
                <Text>הוסיפו שלב ראשון, או צרו את המשרה מקטגוריה שיש לה תבנית שלבים מוכנה.</Text>
                <div className="page__actions">
                  <Button onClick={addStage}>הוספת שלב ראשון</Button>
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
                  onChanged={load.reload}
                  onMove={(direction) => moveStage(index, direction)}
                />
              ))
            )}
          </div>
        );
      }}
    </LoadGate>
  );
}
