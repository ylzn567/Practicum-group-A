import { useEffect, useMemo, useState } from "react";
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
import { getPositions } from "../../services/positions.service";
import { getJobCategories } from "../../services/jobCategories.service";
import {
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
  POSITION_STATUS_TONES,
} from "../../types/position";
import type { Position, PositionStatus } from "../../types/position";
import type { JobCategory } from "../../types/jobCategory";
import { formatCurrency, formatDate, formatText } from "../../utils/format";
import "./PositionsListScreen.css";

const STATUS_ORDER: PositionStatus[] = [
  "DRAFT",
  "IN_EVALUATION",
  "APPROVED_FOR_TENDER",
  "CLOSED",
];

type PositionsListScreenProps = {
  onOpenPosition: (positionId: string) => void;
  onCreatePosition: () => void;
};

export function PositionsListScreen({
  onOpenPosition,
  onCreatePosition,
}: PositionsListScreenProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PositionStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        // הבאקאנד מחזיר את כל האוסף (אין עדיין סינון בשרת), לכן מסננים כאן
        const [positionsData, categoriesData] = await Promise.all([
          getPositions(),
          getJobCategories(),
        ]);
        if (isCancelled) return;
        setPositions(positionsData);
        setCategories(categoriesData);
      } catch (err) {
        if (!isCancelled) setLoadError((err as Error).message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category._id, category.name));
    return map;
  }, [categories]);

  const visiblePositions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return positions.filter((position) => {
      const matchesSearch =
        !term || position.title.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || position.status === statusFilter;
      const matchesCategory =
        !categoryFilter || position.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [positions, search, statusFilter, categoryFilter]);

  const hasActiveFilters = Boolean(search || statusFilter || categoryFilter);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>משרות</Heading>
          <Text>כל המשרות במערכת — מטיוטה ועד סגירת התהליך.</Text>
        </div>
        <Button onClick={onCreatePosition}>משרה חדשה</Button>
      </header>

      <div className="positions__filters">
        <label className="positions__filter">
          <span className="rf-label">חיפוש לפי כותרת</span>
          <Input
            type="search"
            value={search}
            placeholder="לדוגמה: DevOps"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="positions__filter">
          <span className="rf-label">סטטוס</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PositionStatus | "")}
          >
            <option value="">כל הסטטוסים</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {POSITION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </label>

        <label className="positions__filter">
          <span className="rf-label">קטגוריה</span>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {isLoading && (
        <Card>
          <Text>טוען משרות...</Text>
        </Card>
      )}

      {!isLoading && loadError && (
        <Card>
          <Heading level={3}>לא הצלחנו לטעון את המשרות</Heading>
          <Text>{loadError}</Text>
          <div className="positions__state-actions">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              ניסיון נוסף
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && !loadError && positions.length === 0 && (
        <Card>
          <Heading level={3}>עדיין אין משרות במערכת</Heading>
          <Text>המשרה הראשונה נפתחת כטיוטה, ואחריה מגדירים לה שלבים וקריטריונים.</Text>
          <div className="positions__state-actions">
            <Button onClick={onCreatePosition}>יצירת המשרה הראשונה</Button>
          </div>
        </Card>
      )}

      {!isLoading && !loadError && positions.length > 0 && (
        <>
          <p className="positions__count">
            {visiblePositions.length} מתוך {positions.length} משרות
          </p>

          {visiblePositions.length === 0 ? (
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
                  {visiblePositions.map((position) => {
                    const status = position.status ?? "DRAFT";
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
                        <td>
                          {position.categoryId
                            ? formatText(categoryNameById.get(position.categoryId))
                            : "—"}
                        </td>
                        <td>
                          {position.level
                            ? POSITION_LEVEL_LABELS[position.level]
                            : "—"}
                        </td>
                        <td className="num">
                          {formatCurrency(position.maxHourlyRate)}
                        </td>
                        <td className="num">
                          {formatDate(position.submissionDeadline)}
                        </td>
                        <td>
                          <Badge tone={POSITION_STATUS_TONES[status]}>
                            {POSITION_STATUS_LABELS[status]}
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

      {hasActiveFilters && !isLoading && !loadError && (
        <div className="positions__footer">
          <Button variant="secondary" onClick={clearFilters}>
            ניקוי סינון
          </Button>
        </div>
      )}
    </div>
  );
}
