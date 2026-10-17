import { ErrorAlert, Notice } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useLoad } from "../../hooks/useLoad";
import { getStageTree, stagesApi } from "../../services/entities";
import { StageCard } from "./StageCard";
import { sumStageWeights } from "./stageForms";
import { WeightMeter } from "./WeightMeter";
import "./StagesBuilderScreen.css";

/**
 * עורך השלבים והקריטריונים של משרה. משובץ גם במסך עריכת המשרה וגם במסך השלבים העצמאי,
 * ולכן אין לו כותרת עמוד משלו.
 * readOnly: המשרה פורסמה, והשלבים מוצגים בלי אפשרות לשנות (השרת אוכף את אותה נעילה).
 */
export function StagesEditor({ positionId, readOnly = false }: { positionId: string; readOnly?: boolean }) {
  // אחרי כל שינוי טוענים מחדש: עם כמות הנתונים כאן זה זול, וחוסך באגים של סנכרון מול השרת
  const load = useLoad(() => getStageTree(positionId), [positionId]);
  const action = useAction();

  return (
    <LoadGate
      inline
      load={load}
      loadingText="טוען שלבים וקריטריונים..."
      errorTitle="לא הצלחנו לטעון את השלבים"
      action={{ label: "ניסיון נוסף", onClick: load.reload }}
    >
      {({ stages, criteriaByStage }) => {
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
          <>
            {readOnly ? (
              <Notice>
                השלבים, המשקלים והקריטריונים נעולים לעריכה: הם ננעלים כשהמשרה מתפרסמת לספקים או
                כשהתיחור מבוטל.
              </Notice>
            ) : (
              <div className="page__actions stages__toolbar">
                <Button onClick={addStage}>הוספת שלב</Button>
              </div>
            )}

            <ErrorAlert message={action.error} />

            {stages.length > 0 && (
              <div className="stages__summary">
                <Card>
                  <WeightMeter total={sumStageWeights(stages)} label="סכום משקלי השלבים" />
                  <Text>
                    המשקלים חייבים להסתכם ל-100% לפני ההגשה לוועדה ולפני הפרסום. שלב של תנאי סף
                    מקבל משקל 0.
                  </Text>
                </Card>
              </div>
            )}

            {stages.length === 0 ? (
              <Card>
                <Heading level={3}>אין עדיין שלבים במשרה הזו</Heading>
                {!readOnly && (
                  <>
                    <Text>הוסיפו שלב ראשון, או צרו את המשרה מסוג משרה שיש לו תבנית שלבים מוכנה.</Text>
                    <div className="page__actions">
                      <Button onClick={addStage}>הוספת שלב ראשון</Button>
                    </div>
                  </>
                )}
              </Card>
            ) : (
              stages.map((stage, index) => (
                <StageCard
                  key={stage._id}
                  stage={stage}
                  criteria={criteriaByStage[stage._id] ?? []}
                  isFirst={index === 0}
                  isLast={index === stages.length - 1}
                  readOnly={readOnly}
                  onChanged={load.reload}
                  onMove={(direction) => moveStage(index, direction)}
                />
              ))
            )}
          </>
        );
      }}
    </LoadGate>
  );
}
