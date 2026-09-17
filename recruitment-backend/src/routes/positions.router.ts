import { Router, Request, Response } from "express";
import { createGenericRouter } from "./generic.router";
import { positionRepository } from "../models/position.model";
import {
  createPositionWithTemplate,
  deletePositionCascade,
} from "../services/position.service";

const router = Router();

/**
 * POST /api/positions — דורס את ה-POST הגנרי.
 * יצירת משרה היא לא CRUD רגיל: היא גם מעתיקה את תבנית השלבים
 * והקריטריונים מהקטגוריה. חייב להיות מוגדר לפני הראוטר הגנרי.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { position, copied } = await createPositionWithTemplate(req.body);
    console.log(
      `Position created with ${copied.stagesCreated} stages and ${copied.criteriaCreated} criteria`
    );
    res.status(201).json(position);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * DELETE /api/positions/:id — דורס את המחיקה הגנרית.
 * מחיקת משרה חייבת למחוק גם את השלבים והקריטריונים שלה.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await deletePositionCascade(String(req.params.id));
    console.log(
      `Position deleted with ${result.stagesDeleted} stages and ${result.criteriaDeleted} criteria`
    );
    res.status(204).send();
  } catch (err) {
    const error = err as Error;
    if (error.name === "CastError") {
      return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
    }
    res.status(500).json({ error: error.message });
  }
});

// שאר ה-CRUD נשאר גנרי
router.use(
  createGenericRouter(positionRepository, {
    filterableFields: ["categoryId", "status", "level"],
    populatableFields: ["categoryId", "createdBy"],
  })
);

export default router;
