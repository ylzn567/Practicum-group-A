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
      window.alert(`אי אפשר למחוק את "${category.name}" — ${usage} משרות משויכות אליו.\nשנו להן את סוג המשרה קודם.`);
      return;
    }
    action.run(async () => {
      await categoriesApi.remove(category._id);
      load.reload();
    }, `למחוק את סוג המשרה "${category.name}"?`);
  };

  return (
    <LoadGate load={load} loadingText="טוען סוגי משרה..." errorTitle="לא הצלחנו לטעון את סוגי המשרה">
      {({ categories, usage }) => (
        <div className="page">
          <header className="page__header">
            <div>
              <Heading level={1}>סוגי משרה</Heading>
              <Text>כל סוג משרה מחזיק תבנית של שלבים וקריטריונים, שמועתקת למשרה חדשה.</Text>
            </div>
            <div className="page__actions">
              <Button onClick={onCreate}>סוג משרה חדש</Button>
              <Button variant="secondary" onClick={onBack}>
                חזרה למשרות
              </Button>
            </div>
          </header>

          <ErrorAlert message={action.error} />

          {categories.length === 0 ? (
            <Card>
              <Heading level={3}>אין עדיין סוגי משרה</Heading>
              <Text>בלי סוג משרה אי אפשר לפתוח משרה — הוא קובע את תבנית השלבים.</Text>
              <div className="page__actions">
                <Button onClick={onCreate}>יצירת סוג המשרה הראשון</Button>
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
