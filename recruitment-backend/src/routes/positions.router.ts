import express, { Router, Request, Response } from "express";
import { createGenericRouter } from "./generic.router";
import { positionRepository } from "../models/position.model";
import {
  createPositionWithTemplate,
  deletePositionCascade,
} from "../services/position.service";
import { XLSX_MIME, buildMapalWorkbook } from "../services/mapal.service";
import {
  ImportError,
  createPositionFromDraft,
  parseMapalFile,
} from "../services/mapalImport.service";

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

/**
 * GET /api/positions/:id/mapal — קובץ מפ"ל (Excel) של המשרה, במבנה הקבצים המקוריים.
 * חייב להיות מוגדר לפני הראוטר הגנרי.
 */
router.get("/:id/mapal", async (req: Request, res: Response) => {
  try {
    const result = await buildMapalWorkbook(String(req.params.id));
    if (!result) return res.status(404).json({ error: "Not found" });

    res.setHeader("Content-Type", XLSX_MIME);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
    );
    res.send(result.buffer);
  } catch (err) {
    const error = err as Error;
    if (error.name === "CastError") {
      return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/positions/import-mapal/parse — מקבל קובץ xlsx גולמי (לא multipart)
 * ומחזיר טיוטה של המשרה, בלי ליצור כלום. שם הקובץ מגיע בכותרת X-File-Name.
 */
router.post(
  "/import-mapal/parse",
  express.raw({ type: () => true, limit: "5mb" }),
  async (req: Request, res: Response) => {
    try {
      let fileName = "";
      try {
        fileName = decodeURIComponent(String(req.header("x-file-name") ?? ""));
      } catch {
        fileName = String(req.header("x-file-name") ?? "");
      }
      res.json(await parseMapalFile(req.body as Buffer, fileName));
    } catch (err) {
      if (err instanceof ImportError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

/**
 * POST /api/positions/import-mapal — יוצר משרה, שלבים וקריטריונים מטיוטה שאושרה.
 * לא מעתיק תבנית של קטגוריה: המבנה בא מהקובץ.
 */
router.post("/import-mapal", async (req: Request, res: Response) => {
  try {
    const position = await createPositionFromDraft(req.body);
    res.status(201).json(position);
  } catch (err) {
    const error = err as Error;
    const isClientError =
      err instanceof ImportError ||
      error.name === "CastError" ||
      error.name === "ValidationError" ||
      error.name === "BSONError";
    res.status(isClientError ? 400 : 500).json({ error: error.message });
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
