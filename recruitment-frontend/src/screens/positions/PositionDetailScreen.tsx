import { ErrorAlert } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Badge, Button, Card, Heading, Table, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useLoad } from "../../hooks/useLoad";
import {
  categoriesApi,
  downloadMapal,
  getStageTree,
  positionsApi,
} from "../../services/entities";
import {
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
  POSITION_STATUS_TONES,
} from "../../types/position";
import type { Position } from "../../types/position";
import { formatCurrency, formatDate, formatText, toFileName } from "../../utils/format";
import { hasScoredCriteria, sumCriteriaWeights } from "../stages/stageForms";
import {
  STATUS_FLOW_ORDER,
  buildReadinessChecks,
  getNextStatus,
  getStatusStepIndex,
} from "./positionReadiness";
import "./PositionDetailScreen.css";

type PositionDetailScreenProps = {
  positionId: string;
  onEdit: () => void;
  onOpenStages: () => void;
  onBack: () => void;
};

const detailRows = (position: Position, categoryName: string) => [
  { label: "קטגוריה", value: formatText(categoryName) },
  { label: "רמה", value: position.level ? POSITION_LEVEL_LABELS[position.level] : "—" },
  { label: "קוד אשכול", value: formatText(position.clusterCode) },
  { label: "קוד תפקיד", value: formatText(position.roleCode) },
  { label: "היקף שעות חודשי", value: position.monthlyHours ? `${position.monthlyHours} שעות` : "—" },
  { label: "תעריף שעתי מרבי", value: formatCurrency(position.maxHourlyRate) },
  { label: "משך התקשרות", value: position.durationMonths ? `${position.durationMonths} חודשים` : "—" },
  { label: "מועד אחרון להגשה", value: formatDate(position.submissionDeadline) },
];

export function PositionDetailScreen({
  positionId,
  onEdit,
  onOpenStages,
  onBack,
}: PositionDetailScreenProps) {
  const load = useLoad(async () => {
    const [position, categories, tree] = await Promise.all([
      positionsApi.getById(positionId),
      categoriesApi.getAll(),
      getStageTree(positionId),
    ]);
    const categoryName = categories.find((category) => category._id === position.categoryId)?.name ?? "";
    return { position, categoryName, ...tree };
  }, [positionId]);
  const advance = useAction();
  const exporter = useAction();

  return (
    <LoadGate
      load={load}
      loadingText="טוען את פרטי המשרה..."
      errorTitle="לא הצלחנו לטעון את המשרה"
      action={{ label: "חזרה לרשימה", onClick: onBack }}
    >
      {({ position, categoryName, stages, criteriaByStage }) => {
        const status = position.status ?? "DRAFT";
        const nextStatus = getNextStatus(status);
        const currentStep = getStatusStepIndex(status);
        const checks = buildReadinessChecks(stages, criteriaByStage);

        // הבדיקות רלוונטיות רק למעבר מטיוטה להערכה
        const requiresChecks = status === "DRAFT";
        const isReady = checks.every((check) => check.passed);
        const canAdvance = Boolean(nextStatus) && (!requiresChecks || isReady);

        const handleAdvance = () =>
          nextStatus &&
          advance.run(async () => {
            await positionsApi.update(positionId, { status: nextStatus });
            load.reload();
          }, `להעביר את המשרה לסטטוס "${POSITION_STATUS_LABELS[nextStatus]}"?`);

        const handleExport = () =>
          exporter.run(() => downloadMapal(positionId, toFileName("מפל", position.title, "xlsx")));

        return (
          <div className="page">
            <header className="page__header">
              <div>
                <Heading level={1}>{position.title}</Heading>
                <div className="detail__title-meta">
                  <Badge tone={POSITION_STATUS_TONES[status]}>{POSITION_STATUS_LABELS[status]}</Badge>
                  {categoryName && <Text>{categoryName}</Text>}
                </div>
              </div>
              <div className="page__actions">
                <Button onClick={onOpenStages}>שלבים וקריטריונים</Button>
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  disabled={exporter.isRunning || stages.length === 0}
                  title={
                    stages.length === 0
                      ? "אין שלבים במשרה, ולכן אין מה לייצא"
                      : "הורדת קובץ מפ״ל (Excel) של המשרה"
                  }
                >
                  {exporter.isRunning ? "מייצא..." : "ייצוא מפ״ל"}
                </Button>
                <Button variant="secondary" onClick={onEdit}>
                  עריכת המשרה
                </Button>
                <Button variant="secondary" onClick={onBack}>
                  חזרה לרשימה
                </Button>
              </div>
            </header>

            <ErrorAlert message={advance.error ?? exporter.error} />

            <div className="detail__block">
              <Card>
                <Heading level={3}>מצב התהליך</Heading>
                <ol className="status-track">
                  {STATUS_FLOW_ORDER.map((flowStatus, index) => (
                    <li
                      key={flowStatus}
                      className={`status-track__step ${
                        index < currentStep ? "status-track__step--done" : ""
                      } ${index === currentStep ? "status-track__step--current" : ""}`}
                    >
                      <span className="status-track__dot" aria-hidden="true" />
                      <span className="status-track__label">{POSITION_STATUS_LABELS[flowStatus]}</span>
                    </li>
                  ))}
                </ol>

                {nextStatus ? (
                  <div className="detail__advance">
                    <Button onClick={handleAdvance} disabled={!canAdvance || advance.isRunning}>
                      {advance.isRunning ? "מעדכן..." : `העברה ל"${POSITION_STATUS_LABELS[nextStatus]}"`}
                    </Button>
                    {requiresChecks && !isReady && (
                      <Text>לא ניתן להעביר להערכה עד שכל הבדיקות למטה עוברות.</Text>
                    )}
                  </div>
                ) : (
                  <Text>המשרה בסטטוס הסופי.</Text>
                )}
              </Card>
            </div>

            {requiresChecks && (
              <div className="detail__block">
                <Card>
                  <Heading level={3}>מוכנות למעבר להערכה</Heading>
                  <ul className="checklist">
                    {checks.map((check) => (
                      <li
                        key={check.label}
                        className={`checklist__item checklist__item--${check.passed ? "ok" : "fail"}`}
                      >
                        <span className="checklist__mark" aria-hidden="true">
                          {check.passed ? "✓" : "✕"}
                        </span>
                        <span>
                          {check.label}
                          {check.detail && <span className="checklist__detail"> — {check.detail}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            <div className="detail__block">
              <Card>
                <Heading level={3}>פרטי המשרה</Heading>
                <dl className="detail__grid">
                  {detailRows(position, categoryName).map((item) => (
                    <div className="detail__item" key={item.label}>
                      <dt className="detail__label">{item.label}</dt>
                      <dd className="detail__value">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                {position.description && (
                  <>
                    <p className="detail__label">תיאור התפקיד</p>
                    <Text>{position.description}</Text>
                  </>
                )}
              </Card>
            </div>

            <div className="detail__block">
              <Card>
                <Heading level={3}>שלבי ההערכה</Heading>
                {stages.length === 0 ? (
                  <Text>עדיין לא הוגדרו שלבים למשרה הזו.</Text>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>שלב</th>
                        <th>משקל</th>
                        <th>קריטריונים</th>
                        <th>משקלי קריטריונים</th>
                        <th>מכסת מעבר</th>
                        <th>מועמדים בשלב</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stages.map((stage, index) => {
                        const criteria = criteriaByStage[stage._id] ?? [];
                        const scoredWeight = sumCriteriaWeights(criteria);
                        return (
                          <tr key={stage._id}>
                            <td className="num">{stage.order ?? index + 1}</td>
                            <td>{stage.name}</td>
                            <td className="num">{stage.weightPercent ?? 0}%</td>
                            <td className="num">{criteria.length}</td>
                            <td className="num">
                              {hasScoredCriteria(criteria) ? (
                                <span className={scoredWeight === 100 ? "detail__ok" : "detail__warn"}>
                                  {scoredWeight}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="num">{stage.quota ?? "—"}</td>
                            <td className="detail__pending">—</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
                <p className="detail__footnote">
                  עמודת "מועמדים בשלב" תתמלא כשקבוצה ב׳ תבנה את Application — הספירה מגיעה משדה
                  currentStage.
                </p>
              </Card>
            </div>
          </div>
        );
      }}
    </LoadGate>
  );
}
