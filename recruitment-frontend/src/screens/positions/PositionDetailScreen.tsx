import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Heading,
  Table,
  Text,
} from "../../design-system/components";
import {
  getJobCategories,
  getPositionById,
  updatePosition,
} from "../../services/positions.service";
import { getCriteriaByStage, getStagesByPosition } from "../../services/stages.service";
import {
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
  POSITION_STATUS_TONES,
} from "../../types/position";
import type { Position } from "../../types/position";
import type { Criterion, Stage } from "../../types/stage";
import { formatCurrency, formatDate, formatText } from "../../utils/format";
import { sumCriteriaWeights } from "../stages/stagesBuilder";
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

export function PositionDetailScreen({
  positionId,
  onEdit,
  onOpenStages,
  onBack,
}: PositionDetailScreenProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [criteriaByStage, setCriteriaByStage] = useState<Record<string, Criterion[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [positionData, categories, stagesData] = await Promise.all([
        getPositionById(positionId),
        getJobCategories(),
        getStagesByPosition(positionId),
      ]);

      const sorted = [...stagesData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const criteriaLists = await Promise.all(
        sorted.map((stage) => getCriteriaByStage(stage._id))
      );

      const grouped: Record<string, Criterion[]> = {};
      sorted.forEach((stage, index) => {
        grouped[stage._id] = criteriaLists[index];
      });

      setPosition(positionData);
      setCategoryName(
        categories.find((category) => category._id === positionData.categoryId)?.name ?? ""
      );
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

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען את פרטי המשרה...</Text>
        </Card>
      </div>
    );
  }

  if (loadError || !position) {
    return (
      <div className="page">
        <Card>
          <Heading level={3}>לא הצלחנו לטעון את המשרה</Heading>
          <Text>{loadError ?? "המשרה לא נמצאה"}</Text>
          <div className="detail__actions">
            <Button variant="secondary" onClick={onBack}>
              חזרה לרשימה
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const status = position.status ?? "DRAFT";
  const nextStatus = getNextStatus(status);
  const currentStep = getStatusStepIndex(status);
  const checks = buildReadinessChecks(stages, criteriaByStage);

  // הבדיקות רלוונטיות רק למעבר מטיוטה להערכה
  const requiresChecks = status === "DRAFT";
  const isReady = checks.every((check) => check.passed);
  const canAdvance = Boolean(nextStatus) && (!requiresChecks || isReady);

  async function handleAdvance() {
    if (!nextStatus) return;
    const label = POSITION_STATUS_LABELS[nextStatus];
    if (!window.confirm(`להעביר את המשרה לסטטוס "${label}"?`)) return;

    setActionError(null);
    setIsAdvancing(true);
    try {
      await updatePosition(positionId, { status: nextStatus });
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsAdvancing(false);
    }
  }

  const details: { label: string; value: string }[] = [
    { label: "קטגוריה", value: formatText(categoryName) },
    {
      label: "רמה",
      value: position.level ? POSITION_LEVEL_LABELS[position.level] : "—",
    },
    { label: "קוד אשכול", value: formatText(position.clusterCode) },
    { label: "קוד תפקיד", value: formatText(position.roleCode) },
    {
      label: "היקף שעות חודשי",
      value: position.monthlyHours ? `${position.monthlyHours} שעות` : "—",
    },
    { label: "תעריף שעתי מרבי", value: formatCurrency(position.maxHourlyRate) },
    {
      label: "משך התקשרות",
      value: position.durationMonths ? `${position.durationMonths} חודשים` : "—",
    },
    { label: "מועד אחרון להגשה", value: formatDate(position.submissionDeadline) },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>{position.title}</Heading>
          <div className="detail__title-meta">
            <Badge tone={POSITION_STATUS_TONES[status]}>
              {POSITION_STATUS_LABELS[status]}
            </Badge>
            {categoryName && <Text>{categoryName}</Text>}
          </div>
        </div>
        <div className="detail__actions">
          <Button onClick={onOpenStages}>שלבים וקריטריונים</Button>
          <Button variant="secondary" onClick={onEdit}>
            עריכת המשרה
          </Button>
          <Button variant="secondary" onClick={onBack}>
            חזרה לרשימה
          </Button>
        </div>
      </header>

      {actionError && (
        <p className="form-alert" role="alert">
          {actionError}
        </p>
      )}

      {/* ===== ציר הסטטוס ===== */}
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
                <span className="status-track__label">
                  {POSITION_STATUS_LABELS[flowStatus]}
                </span>
              </li>
            ))}
          </ol>

          {nextStatus ? (
            <div className="detail__advance">
              <Button onClick={handleAdvance} disabled={!canAdvance || isAdvancing}>
                {isAdvancing
                  ? "מעדכן..."
                  : `העברה ל"${POSITION_STATUS_LABELS[nextStatus]}"`}
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

      {/* ===== בדיקות מוכנות ===== */}
      {requiresChecks && (
        <div className="detail__block">
          <Card>
            <Heading level={3}>מוכנות למעבר להערכה</Heading>
            <ul className="checklist">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={`checklist__item ${
                    check.passed ? "checklist__item--ok" : "checklist__item--fail"
                  }`}
                >
                  <span className="checklist__mark" aria-hidden="true">
                    {check.passed ? "✓" : "✕"}
                  </span>
                  <span>
                    {check.label}
                    {check.detail && (
                      <span className="checklist__detail"> — {check.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ===== פרטי המשרה ===== */}
      <div className="detail__block">
        <Card>
          <Heading level={3}>פרטי המשרה</Heading>
          <dl className="detail__grid">
            {details.map((item) => (
              <div className="detail__item" key={item.label}>
                <dt className="detail__label">{item.label}</dt>
                <dd className="detail__value">{item.value}</dd>
              </div>
            ))}
          </dl>
          {position.description && (
            <>
              <dt className="detail__label">תיאור התפקיד</dt>
              <Text>{position.description}</Text>
            </>
          )}
        </Card>
      </div>

      {/* ===== שלבי ההערכה ===== */}
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
                  const hasScored = criteria.some((c) => c.type === "SCORED");
                  return (
                    <tr key={stage._id}>
                      <td className="num">{stage.order ?? index + 1}</td>
                      <td>{stage.name}</td>
                      <td className="num">{stage.weightPercent ?? 0}%</td>
                      <td className="num">{criteria.length}</td>
                      <td className="num">
                        {hasScored ? (
                          <span
                            className={
                              scoredWeight === 100 ? "detail__ok" : "detail__warn"
                            }
                          >
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
            עמודת "מועמדים בשלב" תתמלא כשקבוצה ב׳ תבנה את Application — הספירה
            מגיעה משדה currentStage.
          </p>
        </Card>
      </div>
    </div>
  );
}
