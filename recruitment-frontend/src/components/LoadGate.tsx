import type { ReactNode } from "react";
import { Button, Card, Heading, Text } from "../design-system/components";

/**
 * מציג "טוען" או כרטיס שגיאה במקום המסך, וכשהנתונים מוכנים מעביר אותם ל-children.
 * load הוא התוצאה של useLoad.
 */
export function LoadGate<T>({
  load,
  loadingText,
  errorTitle,
  action,
  children,
}: {
  load: { data?: T; error: string | null };
  loadingText: string;
  errorTitle: string;
  /** כפתור בכרטיס השגיאה, למשל "חזרה" או "ניסיון נוסף" */
  action?: { label: string; onClick: () => void };
  children: (data: T) => ReactNode;
}) {
  if (!load.error && load.data !== undefined) return <>{children(load.data)}</>;

  return (
    <div className="page">
      <Card>
        {load.error ? (
          <>
            <Heading level={3}>{errorTitle}</Heading>
            <Text>{load.error}</Text>
            {action && (
              <div className="page__actions" style={{ marginTop: 16 }}>
                <Button variant="secondary" onClick={action.onClick}>
                  {action.label}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Text>{loadingText}</Text>
        )}
      </Card>
    </div>
  );
}
