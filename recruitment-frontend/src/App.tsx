import { useState } from "react";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { Button } from "./components/ui/Button";
import { logout } from "./services/auth.service";
import type { AuthUser } from "./types/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  // מסך זמני — כאן ייכנס בהמשך הניווט לשאר מסכי המערכת
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ color: "var(--color-primary)" }}>שלום, {user.name}</h1>
      <p>נכנסת למערכת בהצלחה.</p>
      <Button
        variant="secondary"
        onClick={() => {
          logout();
          setUser(null);
        }}
      >
        יציאה
      </Button>
    </main>
  );
}
