import type { ReactNode } from "react";
import { Badge, Table } from "../../design-system/components";
import type { CriterionTemplate } from "../../types/jobCategory";
import { CRITERION_TYPE_LABELS, SCORING_METHOD_LABELS } from "../../types/stage";

/** טבלת קריטריונים של שלב. עמודת הפעולות מופיעה רק אם נשלח actions (בתצוגה מקדימה אין) */
export function CriteriaTable<C extends CriterionTemplate>({
  criteria,
  actions,
}: {
  criteria: C[];
  actions?: (criterion: C) => ReactNode;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>שם</th>
          <th>סוג</th>
          <th>שיטה</th>
          <th>יעד / מרבי</th>
          <th>משקל</th>
          {actions && <th>פעולות</th>}
        </tr>
      </thead>
      <tbody>
        {criteria.map((criterion, index) => (
          <tr key={`${index}-${criterion.name}`}>
            <td>{criterion.name}</td>
            <td>
              <Badge tone={criterion.type === "BOOLEAN" ? "pending" : "published"}>
                {CRITERION_TYPE_LABELS[criterion.type]}
              </Badge>
            </td>
            <td>
              {criterion.scoringMethod ? SCORING_METHOD_LABELS[criterion.scoringMethod] : "—"}
            </td>
            <td className="num">{criterion.targetValue ?? criterion.maxScore ?? "—"}</td>
            <td className="num">
              {criterion.weightPercent != null ? `${criterion.weightPercent}%` : "—"}
            </td>
            {actions && <td>{actions(criterion)}</td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
