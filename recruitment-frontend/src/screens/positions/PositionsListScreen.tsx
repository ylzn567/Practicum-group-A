import type { ReactNode } from "react";
import { Options, toOptions } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import {
  Badge,
  Button,
  Card,
  Heading,
  Input,
  Select,
  Table,
  Text,
} from "../../design-system/components";
import { useForm } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi, positionsApi } from "../../services/entities";
import {
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
  POSITION_STATUS_TONES,
} from "../../types/position";
import { formatCurrency, formatDate, formatText } from "../../utils/format";
import "./PositionsListScreen.css";

type PositionsListScreenProps = {
  onOpenPosition: (positionId: string) => void;
  onCreatePosition: () => void;
  onImportMapal: () => void;
};

const Filter = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="positions__filter">
    <span className="rf-label">{label}</span>
    {children}
  </label>
);

const STATUS_OPTIONS = toOptions(POSITION_STATUS_LABELS);

export function PositionsListScreen({
  onOpenPosition,
  onCreatePosition,
  onImportMapal,
}: PositionsListScreenProps) {
  // הבאקאנד תומך בסינון, אבל עם מספר המשרות כאן סינון בלקוח מיידי וגם מאפשר חיפוש חופשי בכותרת
  const load = useLoad(async () => {
    const [positions, categories] = await Promise.all([positionsApi.getAll(), categoriesApi.getAll()]);
    return { positions, categories };
  });
  const filters = useForm({ search: "", status: "", categoryId: "" });
  const { search, status, categoryId } = filters.values;
  const hasActiveFilters = Boolean(search || status || categoryId);

  return (
    <LoadGate
      load={load}
      loadingText="טוען משרות..."
      errorTitle="לא הצלחנו לטעון את המשרות"
      action={{ label: "ניסיון נוסף", onClick: load.reload }}
    >
      {({ positions, categories }) => {
        const categoryName = new Map(categories.map((category) => [category._id, category.name]));
        const term = search.trim().toLowerCase();
        const visible = positions.filter(
          (position) =>
            (!term || position.title.toLowerCase().includes(term)) &&
            (!status || position.status === status) &&
            (!categoryId || position.categoryId === categoryId)
        );
        const clearFilters = () => filters.reset();

        return (
          <div className="page">
            <header className="page__header">
              <div>
                <Heading level={1}>משרות</Heading>
                <Text>כל המשרות במערכת — מטיוטה ועד סגירת התהליך.</Text>
              </div>
              <div className="page__actions">
                <Button onClick={onCreatePosition}>משרה חדשה</Button>
                <Button variant="secondary" onClick={onImportMapal}>
                  ייבוא מפ״ל
                </Button>
              </div>
            </header>

            <div className="positions__filters">
              <Filter label="חיפוש לפי כותרת">
                <Input
                  type="search"
                  value={search}
                  placeholder="לדוגמה: DevOps"
                  onChange={(e) => filters.set("search", e.target.value)}
                />
              </Filter>
              <Filter label="סטטוס">
                <Select value={status} onChange={(e) => filters.set("status", e.target.value)}>
                  <Options options={STATUS_OPTIONS} placeholder="כל הסטטוסים" />
                </Select>
              </Filter>
              <Filter label="קטגוריה">
                <Select value={categoryId} onChange={(e) => filters.set("categoryId", e.target.value)}>
                  <Options
                    options={categories.map((category) => ({ value: category._id, label: category.name }))}
                    placeholder="כל הקטגוריות"
                  />
                </Select>
              </Filter>
            </div>

            {positions.length === 0 ? (
              <Card>
                <Heading level={3}>עדיין אין משרות במערכת</Heading>
                <Text>המשרה הראשונה נפתחת כטיוטה, ואחריה מגדירים לה שלבים וקריטריונים.</Text>
                <div className="positions__state-actions">
                  <Button onClick={onCreatePosition}>יצירת המשרה הראשונה</Button>
                </div>
              </Card>
            ) : (
              <>
                <p className="positions__count">
                  {visible.length} מתוך {positions.length} משרות
                </p>

                {visible.length === 0 ? (
                  <Card>
                    <Heading level={3}>אין משרות שמתאימות לסינון</Heading>
                    <Text>נסו לשנות את החיפוש או לנקות את הסינון.</Text>
                    <div className="positions__state-actions">
                      <Button variant="secondary" onClick={clearFilters}>
                        ניקוי סינון
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <thead>
                        <tr>
                          <th>כותרת</th>
                          <th>קטגוריה</th>
                          <th>רמה</th>
                          <th>תעריף מרבי</th>
                          <th>דדליין הגשה</th>
                          <th>סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((position) => {
                          const positionStatus = position.status ?? "DRAFT";
                          return (
                            <tr
                              key={position._id}
                              className="positions__row"
                              onClick={() => onOpenPosition(position._id)}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="positions__title"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPosition(position._id);
                                  }}
                                >
                                  {position.title}
                                </button>
                              </td>
                              <td>{formatText(categoryName.get(position.categoryId ?? ""))}</td>
                              <td>{position.level ? POSITION_LEVEL_LABELS[position.level] : "—"}</td>
                              <td className="num">{formatCurrency(position.maxHourlyRate)}</td>
                              <td className="num">{formatDate(position.submissionDeadline)}</td>
                              <td>
                                <Badge tone={POSITION_STATUS_TONES[positionStatus]}>
                                  {POSITION_STATUS_LABELS[positionStatus]}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card>
                )}
              </>
            )}

            {hasActiveFilters && (
              <div className="positions__footer">
                <Button variant="secondary" onClick={clearFilters}>
                  ניקוי סינון
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </LoadGate>
  );
}
