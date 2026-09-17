import { useState } from "react";
import { Button, Card, Heading, Text } from "./design-system/components";
import DesignSystemPreview from "./design-system/DesignSystemPreview";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { PositionsListScreen } from "./screens/positions/PositionsListScreen";
import { logout } from "./services/auth.service";
import type { AuthUser } from "./types/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

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

  return (
    <>
      <header className="app-bar">
        <span className="app-bar__user">{user?.name ?? "מצב פיתוח"}</span>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            setUser(null);
            setSelectedPositionId(null);
          }}
        >
          יציאה
        </Button>
      </header>

      {selectedPositionId ? (
        // עד שמסך A5 ייבנה — מציין בבירור לאן הלחיצה מובילה
        <div className="page">
          <Card>
            <Heading level={3}>כרטיס משרה (מסך A5)</Heading>
            <Text>המסך הזה עדיין לא נבנה. מזהה המשרה שנבחרה: {selectedPositionId}</Text>
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary" onClick={() => setSelectedPositionId(null)}>
                חזרה לרשימת המשרות
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <PositionsListScreen
          onOpenPosition={setSelectedPositionId}
          onCreatePosition={() => setSelectedPositionId("new")}
        />
      )}
    </>
  );
}
