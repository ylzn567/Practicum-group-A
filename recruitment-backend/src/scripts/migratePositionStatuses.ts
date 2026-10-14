/**
 * העברה חד-פעמית של משרות קיימות מהסטטוסים הישנים לחדשים.
 *
 * הרצה:  npm run migrate:statuses
 * בטוח להריץ שוב: משרה שכבר בסטטוס חדש לא נוגעים בה.
 *
 * המיפוי לפי המשמעות ולא לפי הסדר הישן: "בהערכה" היה השלב שבו מועמדים מקבלים ציונים,
 * ו"אושרה לתיחור" הוא תיחור שאושר ויצא לספקים.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { PositionModel } from "../models/position.model";
import { PositionStatus } from "../types";

dotenv.config();

const LEGACY_TO_NEW: Record<string, PositionStatus> = {
  IN_EVALUATION: "IN_REVIEW",
  APPROVED_FOR_TENDER: "PUBLISHED",
};

async function migrate(): Promise<void> {
  await connectDB();

  // ישירות מול האוסף, כי הערכים הישנים כבר לא חלק מה-schema
  for (const [legacy, next] of Object.entries(LEGACY_TO_NEW)) {
    const result = await PositionModel.collection.updateMany(
      { status: legacy },
      { $set: { status: next } }
    );
    console.log(`${legacy} -> ${next}: עודכנו ${result.modifiedCount} משרות`);
  }

  await mongoose.disconnect();
  console.log("הסתיים בהצלחה");
}

migrate().catch(async (error) => {
  console.error("שגיאה בהעברת הסטטוסים:", error);
  await mongoose.disconnect();
  process.exit(1);
});
