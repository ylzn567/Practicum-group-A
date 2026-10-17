import { ErrorRequestHandler } from "express";

/** בקשה לא תקינה (400), לעומת תקלת שרת (500) */
export class BadRequestError extends Error {}

const CLIENT_ERRORS = ["ValidationError", "BSONError"];

/**
 * המקום היחיד שממפה שגיאה לסטטוס. ב-Express 5 שגיאה בתוך handler אסינכרוני
 * מגיעה לכאן לבד, ולכן ה-handlers לא צריכים try/catch.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // מזהה לא תקין הוא טעות של הקורא, לא תקלת שרת
  if (err.name === "CastError") {
    res.status(400).json({ error: `ערך לא תקין: ${err.message}` });
    return;
  }

  const isClientError =
    err instanceof BadRequestError || CLIENT_ERRORS.includes(err.name);
  const status = typeof err.status === "number" ? err.status : isClientError ? 400 : 500;
  res.status(status).json({ error: err.message });
};
