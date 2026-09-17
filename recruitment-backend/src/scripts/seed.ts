/**
 * מילוי מסד הנתונים בנתוני דמו לאוספים של קבוצה א׳.
 *
 * הרצה:  npm run seed -- --reset
 * הדגל --reset נדרש במפורש, כי הסקריפט מוחק את האוספים לפני שהוא כותב.
 * האוספים של קבוצות ב׳ ו-ג׳ לא נוגעים בהם.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { JobCategoryModel } from "../models/jobCategory.model";
import { PositionModel } from "../models/position.model";
import { StageModel } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";
import { CompanyModel } from "../models/company.model";
import { JobCategory, Position, Company } from "../types";

dotenv.config();

// ===== קטגוריות משרה (תבניות) =====
// משקלי השלבים מסתכמים ל-100, וכך גם הקריטריונים בתוך כל שלב מנוקד.
// שלב "תנאי סף" הוא שער BOOLEAN בלבד — ולכן משקלו 0.

const jobCategories: JobCategory[] = [
  {
    name: "DevOps",
    description: "תפקידי תשתית, אוטומציה וענן",
    stageTemplates: [
      {
        name: "בדיקת תנאי סף",
        order: 1,
        weightPercent: 0,
        quota: 25,
        criteria: [
          {
            name: "תואר ראשון רלוונטי",
            type: "BOOLEAN",
            descriptionGuide: "הנדסת תוכנה, מדעי המחשב או תחום משיק",
          },
          {
            name: "אזרחות ישראלית",
            type: "BOOLEAN",
            descriptionGuide: "תנאי סף מחייב לפי נוהל המשרד",
          },
          {
            name: "סיווג ביטחוני בתוקף",
            type: "BOOLEAN",
            descriptionGuide: "או נכונות לעבור תהליך סיווג",
          },
        ],
      },
      {
        name: "ראיון טלפוני",
        order: 2,
        weightPercent: 20,
        quota: 12,
        criteria: [
          {
            name: "ותק בתפקיד DevOps",
            type: "SCORED",
            scoringMethod: "RATIO",
            targetValue: 72,
            weightPercent: 50,
            descriptionGuide: "להזין ותק בחודשים. הציון מחושב כיחס מול ערך היעד.",
          },
          {
            name: "רושם כללי ויכולת התבטאות",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 50,
            descriptionGuide: "ציון ישיר 1–10 לפי התרשמות המראיין",
          },
        ],
      },
      {
        name: "מבחן מקצועי",
        order: 3,
        weightPercent: 50,
        quota: 6,
        criteria: [
          {
            name: "Kubernetes ו-Docker",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 100,
            weightPercent: 40,
            descriptionGuide: "תרגיל מעשי: פריסת שירות ואבחון תקלה",
          },
          {
            name: "CI/CD — Jenkins / GitHub Actions",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 100,
            weightPercent: 35,
            descriptionGuide: "בניית pipeline מלא כולל בדיקות",
          },
          {
            name: "תשתית כקוד — Terraform",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 100,
            weightPercent: 25,
            descriptionGuide: "קריאת קוד קיים וזיהוי בעיות",
          },
        ],
      },
      {
        name: "ראיון עומק מול הוועדה",
        order: 4,
        weightPercent: 30,
        quota: 3,
        criteria: [
          {
            name: "ניסיון בהובלת פרויקטים",
            type: "SCORED",
            scoringMethod: "RATIO",
            targetValue: 36,
            weightPercent: 40,
            descriptionGuide: "חודשי ניסיון בהובלה, לא בהשתתפות בלבד",
          },
          {
            name: "התאמה לעבודה בסביבה ממשלתית",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 35,
            descriptionGuide: "היכרות עם רגולציה ותהליכי עבודה במגזר הציבורי",
          },
          {
            name: "עבודת צוות",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 25,
            descriptionGuide: "ציון ישיר 1–10",
          },
        ],
      },
    ],
  },
  {
    name: "PMO",
    description: "ניהול פרויקטים, בקרה ותכנון",
    stageTemplates: [
      {
        name: "בדיקת תנאי סף",
        order: 1,
        weightPercent: 0,
        quota: 20,
        criteria: [
          {
            name: "תואר ראשון",
            type: "BOOLEAN",
            descriptionGuide: "כל תחום, ממוסד מוכר",
          },
          {
            name: "ניסיון מוכח בניהול פרויקטים",
            type: "BOOLEAN",
            descriptionGuide: "לפחות שנתיים, מגובה בקורות חיים",
          },
        ],
      },
      {
        name: "ראיון מקצועי",
        order: 2,
        weightPercent: 60,
        quota: 8,
        criteria: [
          {
            name: "ותק בניהול פרויקטים",
            type: "SCORED",
            scoringMethod: "RATIO",
            targetValue: 60,
            weightPercent: 45,
            descriptionGuide: "להזין ותק בחודשים",
          },
          {
            name: "שליטה בכלי בקרה ותכנון",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 100,
            weightPercent: 35,
            descriptionGuide: "MS Project, Jira, לוחות גאנט",
          },
          {
            name: "יכולת הצגה וכתיבת דוחות",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 20,
            descriptionGuide: "ציון ישיר 1–10",
          },
        ],
      },
      {
        name: "ראיון ועדה",
        order: 3,
        weightPercent: 40,
        quota: 3,
        criteria: [
          {
            name: "התאמה כוללת לתפקיד",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 60,
            descriptionGuide: "התרשמות הוועדה, ציון 1–10",
          },
          {
            name: "יכולת עמידה מול גורמי חוץ",
            type: "SCORED",
            scoringMethod: "DIRECT",
            maxScore: 10,
            weightPercent: 40,
            descriptionGuide: "ספקים, קבלנים ומשרדי ממשלה אחרים",
          },
        ],
      },
    ],
  },
];

// ===== חברות גיוס / ספקים =====

const companies: Company[] = [
  {
    name: "אבני דרך גיוס בע\"מ",
    companyIdNumber: "514736219",
    contactEmail: "jobs@avnei-derech.co.il",
  },
  {
    name: "טאלנט פלוס שירותי כוח אדם",
    companyIdNumber: "512908455",
    contactEmail: "recruit@talentplus.co.il",
  },
  {
    name: "הראל השמה ומיון",
    companyIdNumber: "515620334",
    contactEmail: "office@harel-hr.co.il",
  },
];

// ===== משרות =====
// categoryName מתורגם ל-categoryId אחרי שהקטגוריות נוצרות.

type PositionSeed = Omit<Position, "categoryId" | "createdBy"> & {
  categoryName: string;
};

const positions: PositionSeed[] = [
  {
    title: "מהנדס/ת DevOps בכיר/ה",
    categoryName: "DevOps",
    clusterCode: "TECH-01",
    roleCode: "DEVOPS-SR",
    level: "LEVEL_D",
    description:
      "אחריות על תשתיות הענן של המשרד, בניית תהליכי CI/CD והובלה מקצועית של צוות התשתיות.",
    monthlyHours: 180,
    maxHourlyRate: 320,
    durationMonths: 24,
    status: "IN_EVALUATION",
    submissionDeadline: new Date("2026-10-15"),
  },
  {
    title: "מהנדס/ת DevOps ג׳וניור",
    categoryName: "DevOps",
    clusterCode: "TECH-01",
    roleCode: "DEVOPS-JR",
    level: "LEVEL_A",
    description:
      "ליווי צוות התשתיות במשימות אוטומציה, ניטור וטיפול בתקלות שוטפות.",
    monthlyHours: 160,
    maxHourlyRate: 185,
    durationMonths: 12,
    status: "DRAFT",
    submissionDeadline: new Date("2026-11-01"),
  },
  {
    title: "ראש/ת תחום PMO",
    categoryName: "PMO",
    clusterCode: "MGMT-04",
    roleCode: "PMO-HEAD",
    level: "LEVEL_D",
    description:
      "ניהול מטה הפרויקטים של המשרד, בקרת לוחות זמנים ותקציב מול כלל היחידות.",
    monthlyHours: 186,
    maxHourlyRate: 295,
    durationMonths: 36,
    status: "APPROVED_FOR_TENDER",
    submissionDeadline: new Date("2026-09-30"),
  },
  {
    title: "מנהל/ת פרויקטי תשתית",
    categoryName: "PMO",
    clusterCode: "MGMT-04",
    roleCode: "PMO-INFRA",
    level: "LEVEL_C",
    description:
      "ניהול פרויקטי תשתית מקצה לקצה, כולל ממשק מול ספקים וקבלני משנה.",
    monthlyHours: 170,
    maxHourlyRate: 245,
    durationMonths: 18,
    status: "IN_EVALUATION",
    submissionDeadline: new Date("2026-10-22"),
  },
  {
    title: "רכז/ת PMO",
    categoryName: "PMO",
    clusterCode: "MGMT-04",
    roleCode: "PMO-COORD",
    level: "LEVEL_C",
    description: "ריכוז נתוני פרויקטים, הפקת דוחות תקופתיים ותחזוקת לוחות הבקרה.",
    monthlyHours: 150,
    maxHourlyRate: 205,
    durationMonths: 12,
    status: "CLOSED",
    submissionDeadline: new Date("2026-08-20"),
  },
];

/**
 * העתקת תבנית הקטגוריה לשלבים וקריטריונים אמיתיים של המשרה.
 * זו הלוגיקה שצריכה לרוץ גם ביצירת משרה חדשה — כשנבנה את זה בשרת,
 * להוציא את הפונקציה לשירות ייעודי במקום לשכפל אותה כאן.
 */
async function copyTemplateToPosition(
  positionId: mongoose.Types.ObjectId,
  category: JobCategory
): Promise<number> {
  let criteriaCount = 0;

  for (const stageTemplate of category.stageTemplates ?? []) {
    const stage = await StageModel.create({
      positionId,
      name: stageTemplate.name,
      order: stageTemplate.order,
      weightPercent: stageTemplate.weightPercent,
      quota: stageTemplate.quota,
    });

    const criteria = (stageTemplate.criteria ?? []).map((criterion) => ({
      stageId: stage._id,
      name: criterion.name,
      type: criterion.type,
      scoringMethod: criterion.scoringMethod,
      targetValue: criterion.targetValue,
      weightPercent: criterion.weightPercent,
      maxScore: criterion.maxScore,
      descriptionGuide: criterion.descriptionGuide,
    }));

    if (criteria.length > 0) {
      await CriterionModel.insertMany(criteria);
      criteriaCount += criteria.length;
    }
  }

  return criteriaCount;
}

async function seed(): Promise<void> {
  if (!process.argv.includes("--reset")) {
    console.error(
      "הסקריפט מוחק את האוספים של קבוצה א׳ לפני הכתיבה.\n" +
        "להרצה מכוונת:  npm run seed -- --reset"
    );
    process.exit(1);
  }

  await connectDB();

  await Promise.all([
    CriterionModel.deleteMany({}),
    StageModel.deleteMany({}),
    PositionModel.deleteMany({}),
    JobCategoryModel.deleteMany({}),
    CompanyModel.deleteMany({}),
  ]);
  console.log("האוספים של קבוצה א׳ נוקו");

  const createdCategories = await JobCategoryModel.insertMany(jobCategories);
  const categoryIdByName = new Map(
    createdCategories.map((category) => [category.name, category._id])
  );
  console.log(`נוצרו ${createdCategories.length} קטגוריות משרה`);

  const createdCompanies = await CompanyModel.insertMany(companies);
  console.log(`נוצרו ${createdCompanies.length} חברות`);

  let stagesTotal = 0;
  let criteriaTotal = 0;

  for (const { categoryName, ...positionData } of positions) {
    const category = jobCategories.find((c) => c.name === categoryName);
    if (!category) throw new Error(`קטגוריה לא נמצאה: ${categoryName}`);

    const position = await PositionModel.create({
      ...positionData,
      categoryId: categoryIdByName.get(categoryName),
    });

    criteriaTotal += await copyTemplateToPosition(position._id, category);
    stagesTotal += category.stageTemplates?.length ?? 0;
  }

  console.log(`נוצרו ${positions.length} משרות`);
  console.log(`נוצרו ${stagesTotal} שלבים ו-${criteriaTotal} קריטריונים`);

  await mongoose.disconnect();
  console.log("הסתיים בהצלחה");
}

seed().catch(async (error) => {
  console.error("שגיאה במילוי הנתונים:", error);
  await mongoose.disconnect();
  process.exit(1);
});
