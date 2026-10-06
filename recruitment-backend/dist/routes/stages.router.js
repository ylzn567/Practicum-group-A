"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generic_router_1 = require("./generic.router");
const stage_model_1 = require("../models/stage.model");
const stage_service_1 = require("../services/stage.service");
const router = (0, express_1.Router)();
/**
 * DELETE /api/stages/:id — דורס את המחיקה הגנרית.
 * מחיקת שלב חייבת למחוק גם את הקריטריונים שלו.
 */
router.delete("/:id", async (req, res) => {
    try {
        const result = await (0, stage_service_1.deleteStageCascade)(String(req.params.id));
        console.log(`Stage deleted with ${result.criteriaDeleted} criteria`);
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
router.use((0, generic_router_1.createGenericRouter)(stage_model_1.stageRepository, {
    filterableFields: ["positionId"],
    populatableFields: ["positionId"],
}));
exports.default = router;
