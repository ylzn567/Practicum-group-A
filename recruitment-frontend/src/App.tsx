import { useState } from "react";
import type { ReactNode } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Button, Card, Heading, Text } from "./design-system/components";
import DesignSystemPreview from "./design-system/DesignSystemPreview";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { PositionsListScreen } from "./screens/positions/PositionsListScreen";
import { PositionFormScreen } from "./screens/positions/PositionFormScreen";
import { PositionDetailScreen } from "./screens/positions/PositionDetailScreen";
import { StagesBuilderScreen } from "./screens/stages/StagesBuilderScreen";
import { CategoriesListScreen } from "./screens/categories/CategoriesListScreen";
import { CategoryEditorScreen } from "./screens/categories/CategoryEditorScreen";
import { CompaniesScreen } from "./screens/companies/CompaniesScreen";
import { logout } from "./services/auth.service";
import type { AuthUser } from "./types/auth";

/**
 * עוקף זמני: כל עוד אין endpoints של התחברות (קבוצה ג׳), /?dev=1 פותח
 * את המסכים בלי משתמש. נשמר ל-sessionStorage כדי לשרוד ניווט בין נתיבים.
 * למחוק את הפונקציה ואת השימושים בה ברגע שההתחברות עובדת.
 */
const DEV_KEY = "recruitment.devBypass";

function isDevBypass(): boolean {
  if (new URLSearchParams(window.location.search).has("dev")) {
    sessionStorage.setItem(DEV_KEY, "1");
  }
  return sessionStorage.getItem(DEV_KEY) === "1";
}

// ===== עטיפות שמחברות את המסכים לנתיבים =====

function PositionsRoute() {
  const navigate = useNavigate();
  return (
    <PositionsListScreen
      onOpenPosition={(id) => navigate(`/positions/${id}`)}
      onCreatePosition={() => navigate("/positions/new")}
    />
  );
}

function PositionCreateRoute() {
  const navigate = useNavigate();
  return (
    <PositionFormScreen
      onSaved={(id) => navigate(`/positions/${id}`)}
      onCancel={() => navigate("/positions")}
    />
  );
}

function PositionEditRoute() {
  const navigate = useNavigate();
  const { positionId = "" } = useParams();
  return (
    <PositionFormScreen
      positionId={positionId}
      onSaved={(id) => navigate(`/positions/${id}`)}
      onCancel={() => navigate(`/positions/${positionId}`)}
    />
  );
}

function PositionDetailRoute() {
  const navigate = useNavigate();
  const { positionId = "" } = useParams();
  return (
    <PositionDetailScreen
      positionId={positionId}
      onEdit={() => navigate(`/positions/${positionId}/edit`)}
      onOpenStages={() => navigate(`/positions/${positionId}/stages`)}
      onBack={() => navigate("/positions")}
    />
  );
}

function StagesRoute() {
  const navigate = useNavigate();
  const { positionId = "" } = useParams();
  return (
    <StagesBuilderScreen
      positionId={positionId}
      onBack={() => navigate(`/positions/${positionId}`)}
    />
  );
}

function CategoriesRoute() {
  const navigate = useNavigate();
  return (
    <CategoriesListScreen
      onCreate={() => navigate("/categories/new")}
      onEdit={(categoryId) => navigate(`/categories/${categoryId}/edit`)}
      onBack={() => navigate("/positions")}
    />
  );
}

function CategoryEditorRoute() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  return (
    <CategoryEditorScreen
      key={categoryId ?? "new"}
      categoryId={categoryId}
      onSaved={() => navigate("/categories")}
      onCancel={() => navigate("/categories")}
    />
  );
}

function CompaniesRoute() {
  const navigate = useNavigate();
  return <CompaniesScreen onBack={() => navigate("/positions")} />;
}

function NotFoundRoute() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <Card>
        <Heading level={3}>הדף לא נמצא</Heading>
        <Text>הכתובת שהגעת אליה לא קיימת במערכת.</Text>
        <div className="app-bar__nav" style={{ marginTop: 16 }}>
          <Button onClick={() => navigate("/positions")}>חזרה למשרות</Button>
        </div>
      </Card>
    </div>
  );
}

// ===== מעטפת האפליקציה =====

type AppShellProps = {
  user: AuthUser | null;
  onLogout: () => void;
  children: ReactNode;
};

function AppShell({ user, onLogout, children }: AppShellProps) {
  return (
    <>
      <header className="app-bar">
        <span className="app-bar__user">{user?.name ?? "מצב פיתוח"}</span>
        <nav className="app-bar__nav">
          <NavLink className="app-bar__link" to="/positions">
            משרות
          </NavLink>
          <NavLink className="app-bar__link" to="/categories">
            קטגוריות
          </NavLink>
          <NavLink className="app-bar__link" to="/companies">
            חברות
          </NavLink>
        </nav>
        <Button variant="secondary" onClick={onLogout}>
          יציאה
        </Button>
      </header>
      {children}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = Boolean(user) || isDevBypass();

  function handleLogout() {
    logout();
    sessionStorage.removeItem(DEV_KEY);
    setUser(null);
    navigate("/login");
  }

  return (
    <Routes>
      {/* מסך התצוגה של מערכת העיצוב — לפיתוח בלבד, בלי מעטפת ובלי הרשאה */}
      <Route path="/design-system" element={<DesignSystemPreview />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/positions" replace />
          ) : (
            <AuthScreen
              onAuthenticated={(authUser) => {
                setUser(authUser);
                navigate("/positions");
              }}
            />
          )
        }
      />

      <Route
        path="*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <AppShell user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/positions" replace />} />
                <Route path="/positions" element={<PositionsRoute />} />
                <Route path="/positions/new" element={<PositionCreateRoute />} />
                <Route
                  path="/positions/:positionId"
                  element={<PositionDetailRoute />}
                />
                <Route
                  path="/positions/:positionId/edit"
                  element={<PositionEditRoute />}
                />
                <Route
                  path="/positions/:positionId/stages"
                  element={<StagesRoute />}
                />
                <Route path="/categories" element={<CategoriesRoute />} />
                <Route path="/categories/new" element={<CategoryEditorRoute />} />
                <Route
                  path="/categories/:categoryId/edit"
                  element={<CategoryEditorRoute />}
                />
                <Route path="/companies" element={<CompaniesRoute />} />
                <Route path="*" element={<NotFoundRoute />} />
              </Routes>
            </AppShell>
          )
        }
      />
    </Routes>
  );
}
