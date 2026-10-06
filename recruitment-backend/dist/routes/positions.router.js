"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generic_router_1 = require("./generic.router");
const position_model_1 = require("../models/position.model");
const position_service_1 = require("../services/position.service");
const router = (0, express_1.Router)();
/**
 * POST /api/positions — דורס את ה-POST הגנרי.
 * יצירת משרה היא לא CRUD רגיל: היא גם מעתיקה את תבנית השלבים
 * והקריטריונים מהקטגוריה. חייב להיות מוגדר לפני הראוטר הגנרי.
 */
router.post("/", async (req, res) => {
    try {
        const { position, copied } = await (0, position_service_1.createPositionWithTemplate)(req.body);
        console.log(`Position created with ${copied.stagesCreated} stages and ${copied.criteriaCreated} criteria`);
        res.status(201).json(position);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * DELETE /api/positions/:id — דורס את המחיקה הגנרית.
 * מחיקת משרה חייבת למחוק גם את השלבים והקריטריונים שלה.
 */
router.delete("/:id", async (req, res) => {
    try {
        const result = await (0, position_service_1.deletePositionCascade)(String(req.params.id));
        console.log(`Position deleted with ${result.stagesDeleted} stages and ${result.criteriaDeleted} criteria`);
        res.status(204).send();
    }
    catch (err) {
        const error = err;
        if (error.name === "CastError") {
            return res.status(400).json({ error: `ערך לא תקין: ${error.message}` });
        }
        res.status(500).json({ error: error.message });
    }
});
// שאר ה-CRUD נשאר גנרי
router.use((0, generic_router_1.createGenericRouter)(position_model_1.positionRepository, {
    filterableFields: ["categoryId", "status", "level"],
    populatableFields: ["categoryId", "createdBy"],
}));
exports.default = router;
