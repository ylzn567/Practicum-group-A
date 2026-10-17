import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

connectDB();

app.get("/", (_req, res) => {
  res.send("Recruitment Backend API is running");
});

app.use("/api", apiRoutes);
app.use(errorHandler); // חייב להיות אחרון

// ב-Express 5 שגיאת האזנה (למשל פורט שתפוס בידי שרת קודם) מגיעה לכאן ולא נזרקת.
// בלי הבדיקה השרת מדפיס שהוא רץ, והבקשות ממשיכות להגיע לשרת הישן
app.listen(PORT, (error) => {
  if (error) {
    console.error(`השרת לא עלה על פורט ${PORT}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
