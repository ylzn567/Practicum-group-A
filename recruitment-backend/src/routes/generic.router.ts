import { Router, Request, Response } from "express";
import { Repository } from "../repositories/generic.repository";

export interface GenericRouterOptions {
  /**
   * אילו שדות מותר לסנן לפיהם ב-query string.
   * כל שאר הפרמטרים מתעלמים מהם — כדי שאי אפשר יהיה להזריק
   * אופרטורים של mongo ($ne, $gt) דרך הכתובת.
   */
  filterableFields?: string[];
}

// יוצר router עם CRUD מלא לכל אוסף — לא משכפלים קוד לכל ישות
export function createGenericRouter<T>(
  repository: Repository<T>,
  options: GenericRouterOptions = {}
): Router {
  const router = Router();
  const { filterableFields = [] } = options;

  // בונה פילטר רק מהשדות שהוגדרו במפורש, ורק מערכים שהם מחרוזת
  function buildFilter(query: Request["query"]): Record<string, string> {
    const filter: Record<string, string> = {};

    for (const field of filterableFields) {
      const value = query[field];
      if (typeof value === "string" && value.trim()) {
        filter[field] = value.trim();
      }
    }

    return filter;
  }

  // ObjectId לא תקין גורם ל-CastError; זו בקשה שגויה ולא תקלת שרת
  function handleError(err: unknown, res: Response, fallbackStatus: number) {
    const error = err as Error;
    if (error.name === "CastError") {
      return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
    }
    return res.status(fallbackStatus).json({ error: error.message });
  }

  // GET /  — כל המסמכים, עם סינון אופציונלי לפי query string
  router.get("/", async (req: Request, res: Response) => {
    try {
      const items = await repository.getAll(buildFilter(req.query));
      res.json(items);
    } catch (err) {
      handleError(err, res, 500);
    }
  });

  // GET /:id  — מסמך לפי מזהה
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const item = await repository.getById(String(req.params.id));
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      handleError(err, res, 500);
    }
  });

  // POST /  — יצירת מסמך חדש
  router.post("/", async (req: Request, res: Response) => {
    try {
      const created = await repository.add(req.body);
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res, 400);
    }
  });

  // PUT /:id  — עדכון מסמך
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const updated = await repository.update(String(req.params.id), req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res, 400);
    }
  });

  // DELETE /:id  — מחיקת מסמך
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      await repository.remove(String(req.params.id));
      res.status(204).send();
    } catch (err) {
      handleError(err, res, 500);
    }
  });

  return router;
}
