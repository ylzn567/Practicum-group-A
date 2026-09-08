import { Router, Request, Response } from "express";
import { Repository } from "../repositories/generic.repository";

// יוצר router עם CRUD מלא לכל אוסף — לא משכפלים קוד לכל ישות
export function createGenericRouter<T>(repository: Repository<T>): Router {
  const router = Router();

  // GET /  — כל המסמכים
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const items = await repository.getAll();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /:id  — מסמך לפי מזהה
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const item = await repository.getById(String(req.params.id));
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /  — יצירת מסמך חדש
  router.post("/", async (req: Request, res: Response) => {
    try {
      const created = await repository.add(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // PUT /:id  — עדכון מסמך
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const updated = await repository.update(String(req.params.id), req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // DELETE /:id  — מחיקת מסמך
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      await repository.remove(String(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
