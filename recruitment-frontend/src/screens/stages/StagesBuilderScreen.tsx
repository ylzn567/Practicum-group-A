import { LoadGate } from "../../components/LoadGate";
import { Button, Heading, Text } from "../../design-system/components";
import { useLoad } from "../../hooks/useLoad";
import { positionsApi } from "../../services/entities";
import { POSITION_STATUS_LABELS } from "../../types/position";
import { isContentLocked } from "../positions/positionWorkflow";
import { StagesEditor } from "./StagesEditor";

type StagesBuilderScreenProps = {
  positionId: string;
  onBack: () => void;
};

/** מסך עצמאי לשלבים וקריטריונים של משרה (אותו עורך משובץ גם בעריכת המשרה) */
export function StagesBuilderScreen({ positionId, onBack }: StagesBuilderScreenProps) {
  const load = useLoad(() => positionsApi.getById(positionId), [positionId]);

  return (
    <LoadGate
      load={load}
      loadingText="טוען שלבים וקריטריונים..."
      errorTitle="לא הצלחנו לטעון את השלבים"
      action={{ label: "חזרה", onClick: onBack }}
    >
      {(position) => (
        <div className="page">
          <header className="page__header">
            <div>
              <Heading level={1}>שלבים וקריטריונים</Heading>
              <Text>{`${position.title} · ${POSITION_STATUS_LABELS[position.status ?? "DRAFT"]}`}</Text>
            </div>
            <Button variant="secondary" onClick={onBack}>
              חזרה
            </Button>
          </header>
          <StagesEditor
            positionId={position._id}
            readOnly={isContentLocked(position.status ?? "DRAFT")}
          />
        </div>
      )}
    </LoadGate>
  );
}
