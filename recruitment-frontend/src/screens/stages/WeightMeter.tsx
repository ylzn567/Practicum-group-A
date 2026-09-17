type WeightMeterProps = {
  total: number;
  label: string;
};

/** מחוון חי: סכום המשקלים חייב להגיע ל-100 בדיוק */
export function WeightMeter({ total, label }: WeightMeterProps) {
  const isBalanced = total === 100;
  const rounded = Math.round(total * 100) / 100;

  return (
    <div
      className={`weight-meter ${isBalanced ? "weight-meter--ok" : "weight-meter--off"}`}
    >
      <span className="weight-meter__label">{label}</span>
      <span className="weight-meter__value">{rounded}% מתוך 100</span>
      <span className="weight-meter__bar" aria-hidden="true">
        <span
          className="weight-meter__fill"
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </span>
      {!isBalanced && (
        <span className="weight-meter__hint">
          {total > 100 ? `חריגה של ${rounded - 100}%` : `חסרים ${100 - rounded}%`}
        </span>
      )}
    </div>
  );
}
