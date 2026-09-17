import { Router, Request, Response } from "express";
import { createGenericRouter } from "./generic.router";
import { stageRepository } from "../models/stage.model";
import { deleteStageCascade } from "../services/stage.service";

const router = Router();

/**
 * DELETE /api/stages/:id — דורס את המחיקה הגנרית.
 * מחיקת שלב חייבת למחוק גם את הקריטריונים שלו.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const result = await deleteStageCascade(String(req.params.id));
    console.log(`Stage deleted with ${result.criteriaDeleted} criteria`);
    res.status(204).send();
  } catch (err) {
    const error = err as Error;
    if (error.name === "CastError") {
      return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
    }
    res.status(500).json({ error: error.message });
  }
});

router.use(
  createGenericRouter(stageRepository, {
    filterableFields: ["positionId"],
    populatableFields: ["positionId"],
  })
);

export default router;
