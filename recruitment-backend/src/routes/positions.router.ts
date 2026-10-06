import express, { Request, Router } from "express";
import { createGenericRouter } from "./generic.router";
import { positionRepository } from "../models/position.model";
import { XLSX_MIME, buildMapalWorkbook } from "../services/mapal.service";
import { createPositionFromDraft, parseMapalFile } from "../services/mapalImport.service";
import { createPositionWithTemplate, deletePositionCascade } from "../services/position.service";

const router = Router();

// שם הקובץ מקודד בכותרת, כי כותרות HTTP לא נושאות עברית
const fileNameOf = (req: Request) => {
  const raw = String(req.header("x-file-name") ?? "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** קובץ מפ"ל (Excel) של המשרה, במבנה הקבצים המקוריים של המשרד */
router.get("/:id/mapal", async (req, res) => {
  const result = await buildMapalWorkbook(String(req.params.id));
  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.setHeader("Content-Type", XLSX_MIME);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
  );
  res.send(result.buffer);
});

/** מקבל xlsx גולמי (לא multipart) ומחזיר טיוטת משרה, בלי ליצור כלום */
router.post(
  "/import-mapal/parse",
  express.raw({ type: () => true, limit: "5mb" }),
  async (req, res) => {
    res.json(await parseMapalFile(req.body, fileNameOf(req)));
  }
);

/** יוצר משרה, שלבים וקריטריונים מטיוטה שאושרה. המבנה בא מהקובץ ולא מתבנית קטגוריה */
router.post("/import-mapal", async (req, res) => {
  res.status(201).json(await createPositionFromDraft(req.body));
});

// שאר ה-CRUD גנרי. יצירה מעתיקה תבנית קטגוריה, ומחיקה מוחקת גם שלבים וקריטריונים
router.use(
  createGenericRouter(positionRepository, {
    filterableFields: ["categoryId", "status", "level"],
    populatableFields: ["categoryId", "createdBy"],
    create: createPositionWithTemplate,
    remove: deletePositionCascade,
  })
);

export default router;
