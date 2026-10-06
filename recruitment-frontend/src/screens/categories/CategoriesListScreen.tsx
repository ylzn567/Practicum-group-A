import { ErrorAlert } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Badge, Button, Card, Heading, Table, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi, positionsApi } from "../../services/entities";
import type { JobCategory } from "../../types/jobCategory";
import { formatText } from "../../utils/format";

type CategoriesListScreenProps = {
  onCreate: () => void;
  onEdit: (categoryId: string) => void;
  onBack: () => void;
};

export function CategoriesListScreen({ onCreate, onEdit, onBack }: CategoriesListScreenProps) {
  // סופרים כמה משרות משתמשות בכל קטגוריה, כדי לחסום מחיקה של קטגוריה בשימוש
  const load = useLoad(async () => {
    const [categories, positions] = await Promise.all([categoriesApi.getAll(), positionsApi.getAll()]);
    const usage: Record<string, number> = {};
    positions.forEach((position) => {
      if (position.categoryId) usage[position.categoryId] = (usage[position.categoryId] ?? 0) + 1;
    });
    return { categories, usage };
  });
  const action = useAction();

  const handleDelete = (category: JobCategory, usage: number) => {
    if (usage > 0) {
      window.alert(`אי אפשר למחוק את "${category.name}" — ${usage} משרות משויכות אליה.\nשנו להן קטגוריה קודם.`);
      return;
    }
    action.run(async () => {
      await categoriesApi.remove(category._id);
      load.reload();
    }, `למחוק את הקטגוריה "${category.name}"?`);
  };

  return (
    <LoadGate load={load} loadingText="טוען קטגוריות..." errorTitle="לא הצלחנו לטעון את הקטגוריות">
      {({ categories, usage }) => (
        <div className="page">
          <header className="page__header">
            <div>
              <Heading level={1}>קטגוריות משרה</Heading>
              <Text>כל קטגוריה מחזיקה תבנית של שלבים וקריטריונים, שמועתקת למשרה חדשה.</Text>
            </div>
            <div className="page__actions">
              <Button onClick={onCreate}>קטגוריה חדשה</Button>
              <Button variant="secondary" onClick={onBack}>
                חזרה למשרות
              </Button>
            </div>
          </header>

          <ErrorAlert message={action.error} />

          {categories.length === 0 ? (
            <Card>
              <Heading level={3}>אין עדיין קטגוריות</Heading>
              <Text>בלי קטגוריה אי אפשר לפתוח משרה — היא קובעת את תבנית השלבים.</Text>
              <div className="page__actions">
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
                    const used = usage[category._id] ?? 0;
                    return (
                      <tr key={category._id}>
                        <td>{category.name}</td>
                        <td>{formatText(category.description)}</td>
                        <td className="num">{stages.length}</td>
                        <td className="num">
                          {stages.reduce((total, stage) => total + (stage.criteria?.length ?? 0), 0)}
                        </td>
                        <td>
                          <Badge tone={used > 0 ? "published" : "draft"}>{used} משרות</Badge>
                        </td>
                        <td>
                          <div className="page__actions">
                            <Button variant="secondary" onClick={() => onEdit(category._id)}>
                              עריכה
                            </Button>
                            <Button variant="danger" onClick={() => handleDelete(category, used)}>
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
      )}
    </LoadGate>
  );
}
