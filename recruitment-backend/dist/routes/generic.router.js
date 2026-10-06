"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGenericRouter = createGenericRouter;
const express_1 = require("express");
// יוצר router עם CRUD מלא לכל אוסף — לא משכפלים קוד לכל ישות
function createGenericRouter(repository, options = {}) {
    const router = (0, express_1.Router)();
    const { filterableFields = [], populatableFields = [] } = options;
    // בונה פילטר רק מהשדות שהוגדרו במפורש, ורק מערכים שהם מחרוזת
    function buildFilter(query) {
        const filter = {};
        for (const field of filterableFields) {
            const value = query[field];
            if (typeof value === "string" && value.trim()) {
                filter[field] = value.trim();
            }
        }
        return filter;
    }
    // רק שדות מהרשימה המאושרת, כדי שלא יבקשו להרחיב שדה שרירותי
    function buildPopulate(query) {
        const raw = query.populate;
        if (typeof raw !== "string")
            return [];
        return raw
            .split(",")
            .map((field) => field.trim())
            .filter((field) => populatableFields.includes(field));
    }
    // ObjectId לא תקין גורם ל-CastError; זו בקשה שגויה ולא תקלת שרת
    function handleError(err, res, fallbackStatus) {
        const error = err;
        if (error.name === "CastError") {
            return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
        }
        return res.status(fallbackStatus).json({ error: error.message });
    }
    // GET /  — כל המסמכים, עם סינון אופציונלי לפי query string
    router.get("/", async (req, res) => {
        try {
            const items = await repository.getAll(buildFilter(req.query), buildPopulate(req.query));
            res.json(items);
        }
        catch (err) {
            handleError(err, res, 500);
        }
    });
    // GET /:id  — מסמך לפי מזהה
    router.get("/:id", async (req, res) => {
        try {
            const item = await repository.getById(String(req.params.id), buildPopulate(req.query));
            if (!item)
                return res.status(404).json({ error: "Not found" });
            res.json(item);
        }
        catch (err) {
            handleError(err, res, 500);
        }
    });
    // POST /  — יצירת מסמך חדש
    router.post("/", async (req, res) => {
        try {
            const created = await repository.add(req.body);
            res.status(201).json(created);
        }
        catch (err) {
            handleError(err, res, 400);
        }
    });
    // PUT /:id  — עדכון מסמך
    router.put("/:id", async (req, res) => {
        try {
            const updated = await repository.update(String(req.params.id), req.body);
            if (!updated)
                return res.status(404).json({ error: "Not found" });
            res.json(updated);
        }
        catch (err) {
            handleError(err, res, 400);
        }
    });
    // DELETE /:id  — מחיקת מסמך
    router.delete("/:id", async (req, res) => {
        try {
            await repository.remove(String(req.params.id));
            res.status(204).send();
        }
        catch (err) {
            handleError(err, res, 500);
        }
    });
    return router;
}
