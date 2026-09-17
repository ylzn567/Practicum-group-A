import { useState } from "react";
import { Button, Card, Heading, Text } from "./design-system/components";
import DesignSystemPreview from "./design-system/DesignSystemPreview";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { PositionsListScreen } from "./screens/positions/PositionsListScreen";
import { PositionFormScreen } from "./screens/positions/PositionFormScreen";
import { StagesBuilderScreen } from "./screens/stages/StagesBuilderScreen";
import { logout } from "./services/auth.service";
import type { AuthUser } from "./types/auth";

// ניווט זמני בלי router. כשנוסיף react-router, כל View יקבל נתיב אמיתי.
type View =
  | { name: "list" }
  | { name: "create" }
  | { name: "edit"; positionId: string }
  | { name: "stages"; positionId: string }
  | { name: "detail"; positionId: string };

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<View>({ name: "list" });

  // מסך התצוגה של מערכת העיצוב — לפיתוח בלבד
  if (window.location.pathname === "/design-system") {
    return <DesignSystemPreview />;
  }

  // עוקף זמני: כל עוד אין endpoints של התחברות (קבוצה ג׳), אפשר לראות
  // את מסכי קבוצה א׳ דרך /?dev=1. למחוק ברגע שההתחברות עובדת.
  const isDevBypass = new URLSearchParams(window.location.search).has("dev");

  if (!user && !isDevBypass) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  const showList = () => setView({ name: "list" });

  return (
    <>
      <header className="app-bar">
        <span className="app-bar__user">{user?.name ?? "מצב פיתוח"}</span>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            setUser(null);
            showList();
          }}
        >
          יציאה
        </Button>
      </header>

      {view.name === "list" && (
        <PositionsListScreen
          onOpenPosition={(positionId) => setView({ name: "detail", positionId })}
          onCreatePosition={() => setView({ name: "create" })}
        />
      )}

      {view.name === "create" && (
        <PositionFormScreen
          onSaved={(positionId) => setView({ name: "detail", positionId })}
          onCancel={showList}
        />
      )}

      {view.name === "edit" && (
        <PositionFormScreen
          positionId={view.positionId}
          onSaved={(positionId) => setView({ name: "detail", positionId })}
          onCancel={showList}
        />
      )}

      {view.name === "stages" && (
        <StagesBuilderScreen
          positionId={view.positionId}
          onBack={() => setView({ name: "detail", positionId: view.positionId })}
        />
      )}

      {view.name === "detail" && (
        // עד שמסך A5 ייבנה — נקודת מעבר לשאר מסכי המשרה
        <div className="page">
          <Card>
            <Heading level={3}>כרטיס משרה (מסך A5)</Heading>
            <Text>המסך הזה עדיין לא נבנה. מזהה המשרה: {view.positionId}</Text>
            <div className="position-form__actions">
              <Button
                onClick={() =>
                  setView({ name: "stages", positionId: view.positionId })
                }
              >
                שלבים וקריטריונים
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setView({ name: "edit", positionId: view.positionId })
                }
              >
                עריכת המשרה
              </Button>
              <Button variant="secondary" onClick={showList}>
                חזרה לרשימת המשרות
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
