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
  deleteJobCategory,
  getJobCategories,
} from "../../services/jobCategories.service";
import { getPositions } from "../../services/positions.service";
import type { JobCategory } from "../../types/jobCategory";
import { formatText } from "../../utils/format";
import "./CategoryEditorScreen.css";

type CategoriesListScreenProps = {
  onCreate: () => void;
  onEdit: (categoryId: string) => void;
  onBack: () => void;
};

export function CategoriesListScreen({
  onCreate,
  onEdit,
  onBack,
}: CategoriesListScreenProps) {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [usageByCategory, setUsageByCategory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      // סופרים כמה משרות משתמשות בכל קטגוריה, כדי להזהיר לפני מחיקה
      const [categoriesData, positions] = await Promise.all([
        getJobCategories(),
        getPositions(),
      ]);

      const usage: Record<string, number> = {};
      positions.forEach((position) => {
        if (position.categoryId) {
          usage[position.categoryId] = (usage[position.categoryId] ?? 0) + 1;
        }
      });

      setCategories(categoriesData);
      setUsageByCategory(usage);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(category: JobCategory) {
    const usage = usageByCategory[category._id] ?? 0;
    if (usage > 0) {
      window.alert(
        `אי אפשר למחוק את "${category.name}" — ${usage} משרות משויכות אליה.\n` +
          "שנו להן קטגוריה קודם."
      );
      return;
    }
    if (!window.confirm(`למחוק את הקטגוריה "${category.name}"?`)) return;

    setActionError(null);
    try {
      await deleteJobCategory(category._id);
      await load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען קטגוריות...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>קטגוריות משרה</Heading>
          <Text>
            כל קטגוריה מחזיקה תבנית של שלבים וקריטריונים, שמועתקת למשרה חדשה.
          </Text>
        </div>
        <div className="category__actions">
          <Button onClick={onCreate}>קטגוריה חדשה</Button>
          <Button variant="secondary" onClick={onBack}>
            חזרה למשרות
          </Button>
        </div>
      </header>

      {(loadError || actionError) && (
        <p className="form-alert" role="alert">
          {loadError ?? actionError}
        </p>
      )}

      {categories.length === 0 ? (
        <Card>
          <Heading level={3}>אין עדיין קטגוריות</Heading>
          <Text>בלי קטגוריה אי אפשר לפתוח משרה — היא קובעת את תבנית השלבים.</Text>
          <div className="category__actions">
            <Button onClick={onCreate}>יצירת הקטגוריה הראשונה</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>שם</th>
                <th>תיאור</th>
                <th>שלבים בתבנית</th>
                <th>קריטריונים</th>
                <th>משרות משויכות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const stages = category.stageTemplates ?? [];
                const criteriaCount = stages.reduce(
                  (total, stage) => total + (stage.criteria?.length ?? 0),
                  0
                );
                const usage = usageByCategory[category._id] ?? 0;

                return (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{formatText(category.description)}</td>
                    <td className="num">{stages.length}</td>
                    <td className="num">{criteriaCount}</td>
                    <td>
                      <Badge tone={usage > 0 ? "published" : "draft"}>
                        {usage} משרות
                      </Badge>
                    </td>
                    <td>
                      <div className="category__actions">
                        <Button
                          variant="secondary"
                          onClick={() => onEdit(category._id)}
                        >
                          עריכה
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(category)}>
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
