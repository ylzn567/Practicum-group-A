// עדכונים של רשימה בלי לשנות את המקור, לטפסים מקוננים (שלבים וקריטריונים בעורך תבנית)

export const replaceAt = <T,>(list: T[], index: number, item: T): T[] =>
  list.map((existing, i) => (i === index ? item : existing));

export const removeAt = <T,>(list: T[], index: number): T[] =>
  list.filter((_, i) => i !== index);

export const swap = <T,>(list: T[], a: number, b: number): T[] => {
  const copy = [...list];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
};
