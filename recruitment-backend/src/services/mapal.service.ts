import ExcelJS from "exceljs";
import { Types } from "mongoose";
import { PositionModel } from "../models/position.model";
import { StageModel } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";

/**
 * יצוא מפ"ל של משרה לקובץ Excel, במבנה של קבצי המפ"ל המקוריים של המשרד:
 *   1. "מועמדים"              — משקלי השלבים, עמודות תנאי סף וציונים, שורות ריקות למועמדים
 *   2. "ניקוד ראיון מציע X"   — דף ניקוד למראיין, לפי הקריטריונים של המשרה
 *   3. "רשימת ערכי החלטה"     — הערכים של עמודת ההחלטה
 *
 * הקובץ הוא תבנית ריקה למילוי. אין בו נוסחאות ניקוד: ההגדרה של הציון הסופי
 * (איכות, מחיר, שקלול) שייכת ל-TenderSummary של קבוצה ב׳ ועדיין לא הוגדרה.
 */

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// הערכים כפי שמופיעים בקבצים המקוריים
const DECISION_VALUES = [
  "התקבל",
  "התקבל ככשיר שני",
  "לא התקבל",
  "לא עבר תנאי סף ניסיון/השכלה",
  "לא נבחן",
  "הסיר מועמדות",
  "נפסל - הוגש ע\"י יותר מחברה אחת",
];

const CANDIDATE_ROWS = 16; // כמו בקבצים המקוריים (שורות 5-20)
const BLUE = "FFC5D9F1"; // פרטים ותנאי סף
const PINK = "FFF2DCDB"; // ציונים וסיכום

const THIN = { style: "thin" as const };
const BORDER: Partial<ExcelJS.Borders> = {
  top: THIN,
  left: THIN,
  bottom: THIN,
  right: THIN,
};

interface MapalStage {
  _id: Types.ObjectId;
  name: string;
  order?: number;
  weightPercent?: number;
}

interface MapalCriterion {
  stageId: unknown;
  name: string;
  type: "BOOLEAN" | "SCORED";
  scoringMethod?: "RATIO" | "DIRECT";
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

function fill(color: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}

/** שם קובץ בטוח: בלי תווים שאסורים ב-Windows (למשל "/" בכותרת "מהנדס/ת") */
export function toSafeFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
  return `מפל ${cleaned || "משרה"}.xlsx`;
}

function styleHeaderCell(cell: ExcelJS.Cell, color: string) {
  cell.fill = fill(color);
  cell.font = { name: "Calibri", size: 14 };
  cell.border = BORDER;
  cell.alignment = { vertical: "top", horizontal: "right", wrapText: true };
}

function setWidthAndHeader(
  sheet: ExcelJS.Worksheet,
  columnIndex: number,
  width: number,
  text: string,
  color: string,
  headerRow: number
) {
  sheet.getColumn(columnIndex).width = width;
  const cell = sheet.getCell(headerRow, columnIndex);
  cell.value = text;
  styleHeaderCell(cell, color);
}

/** גובה שורת הכותרת כך שכל הטקסט יראה, גם בעמודות צרות */
function headerHeight(headers: { text: string; width: number }[]): number {
  const lines = headers.map(({ text, width }) =>
    Math.ceil(text.length / Math.max(Math.floor(width / 1.3), 1))
  );
  return Math.max(44.25, Math.max(...lines) * 19 + 6);
}

export async function buildMapalWorkbook(
  positionId: string
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const position = await PositionModel.findById(positionId).lean();
  if (!position) return null;

  const stages = (await StageModel.find({ positionId })
    .sort({ order: 1 })
    .lean()) as unknown as MapalStage[];

  const criteria = (await CriterionModel.find({
    stageId: { $in: stages.map((stage) => stage._id) },
  })
    .sort({ _id: 1 })
    .lean()) as unknown as MapalCriterion[];

  const criteriaOf = (stage: MapalStage) =>
    criteria.filter((criterion) => String(criterion.stageId) === String(stage._id));

  const thresholds = stages.flatMap((stage) =>
    criteriaOf(stage).filter((criterion) => criterion.type === "BOOLEAN")
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "מערכת הגיוס";
  workbook.created = new Date();

  buildCandidatesSheet(workbook, stages, criteriaOf, thresholds);
  buildInterviewSheet(workbook, stages, criteriaOf, thresholds);
  buildDecisionsSheet(workbook);

  // סדר הגיליונות כמו במקור: מועמדים, ניקוד, ערכי החלטה
  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    fileName: toSafeFileName(position.title),
  };
}

// ===== גיליון 1: מועמדים =====

function buildCandidatesSheet(
  workbook: ExcelJS.Workbook,
  stages: MapalStage[],
  criteriaOf: (stage: MapalStage) => MapalCriterion[],
  thresholds: MapalCriterion[]
) {
  const sheet = workbook.addWorksheet("מועמדים", {
    views: [{ rightToLeft: true, zoomScale: 115 }],
  });

  // משקלי השלבים. שלב של תנאי סף (משקל 0) הוא שער ולא נכנס לציון, ולכן לא מופיע כאן
  const weighted = stages.filter((stage) => (stage.weightPercent ?? 0) > 0);
  weighted.forEach((stage, index) => {
    sheet.getCell(index + 1, 1).value = `משקל ${stage.name}`;
    const weightCell = sheet.getCell(index + 1, 2);
    weightCell.value = (stage.weightPercent ?? 0) / 100;
    weightCell.numFmt = "0%";
  });

  const groupRow = weighted.length + 1;
  const headerRow = groupRow + 1;

  const headers: { text: string; width: number }[] = [];
  let col = 1;

  const addColumn = (text: string, width: number, color: string) => {
    setWidthAndHeader(sheet, col, width, text, color, headerRow);
    headers.push({ text, width });
    col += 1;
  };

  const group = (from: number, to: number, label: string, color: string) => {
    if (to > from) sheet.mergeCells(groupRow, from, groupRow, to);
    const cell = sheet.getCell(groupRow, from);
    cell.value = label;
    styleHeaderCell(cell, color);
    cell.font = { name: "Calibri", size: 14, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    for (let c = from + 1; c <= to; c += 1) {
      sheet.getCell(groupRow, c).fill = fill(color);
      sheet.getCell(groupRow, c).border = BORDER;
    }
  };

  // פרטי המועמד
  const detailsStart = col;
  addColumn("מס הצעת מחיר", 16, BLUE);
  addColumn("חברה", 27, BLUE);
  addColumn("תז מועמד", 13, BLUE);
  addColumn("שם מועמד", 20, BLUE);
  group(detailsStart, col - 1, "פרטי המועמד", BLUE);

  // תנאי סף, ואחריהם עמידה בכל תנאי
  const thresholdStart = col;
  thresholds.forEach((criterion) =>
    addColumn(`תנאי סף: ${criterion.name}`, 20, BLUE)
  );
  if (thresholds.length > 0) group(thresholdStart, col - 1, "תנאי סף", BLUE);

  const passStart = col;
  const passColumns: number[] = [];
  thresholds.forEach((criterion) => {
    passColumns.push(col);
    addColumn(`עמידה בתנאי סף: ${criterion.name}`, 20, BLUE);
  });
  if (thresholds.length > 0) group(passStart, col - 1, "עמידה בתנאי סף", BLUE);

  // ציונים, מקובצים לפי שלב
  stages.forEach((stage) => {
    const scored = criteriaOf(stage).filter((criterion) => criterion.type === "SCORED");
    if (scored.length === 0) return;

    const stageStart = col;
    scored.forEach((criterion) =>
      addColumn(
        `ציון: ${criterion.name}. ${criterion.weightPercent ?? 0}%`,
        22,
        PINK
      )
    );
    group(stageStart, col - 1, `${stage.name} (${stage.weightPercent ?? 0}%)`, PINK);
  });

  // סיכום
  const summaryStart = col;
  addColumn("עמידה בציון מינימלי", 20, PINK);
  const decisionColumn = col;
  addColumn("החלטה", 24, PINK);
  addColumn("הערות", 38, PINK);
  group(summaryStart, col - 1, "סיכום", PINK);

  sheet.getRow(headerRow).height = headerHeight(headers);
  sheet.getRow(groupRow).height = 24;

  // שורות ריקות למילוי, עם הגבלת ערכים
  const totalColumns = col - 1;
  for (let i = 1; i <= CANDIDATE_ROWS; i += 1) {
    const rowIndex = headerRow + i;
    sheet.getRow(rowIndex).height = 15;
    for (let c = 1; c <= totalColumns; c += 1) {
      sheet.getCell(rowIndex, c).border = BORDER;
    }
    passColumns.forEach((c) => {
      sheet.getCell(rowIndex, c).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"כן,לא"'],
      };
    });
    sheet.getCell(rowIndex, decisionColumn).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`'רשימת ערכי החלטה'!$A$1:$A$${DECISION_VALUES.length}`],
    };
  }
}

// ===== גיליון 2: דף ניקוד למראיין =====

function buildInterviewSheet(
  workbook: ExcelJS.Workbook,
  stages: MapalStage[],
  criteriaOf: (stage: MapalStage) => MapalCriterion[],
  thresholds: MapalCriterion[]
) {
  const sheet = workbook.addWorksheet("ניקוד ראיון מציע X", {
    views: [{ rightToLeft: true, zoomScale: 115 }],
  });
  sheet.getColumn(1).width = 60;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 30;

  const header = (rowIndex: number, labels: string[], color: string) => {
    labels.forEach((label, i) => {
      const cell = sheet.getCell(rowIndex, i + 1);
      cell.value = label;
      styleHeaderCell(cell, color);
      cell.font = { name: "Calibri", size: 12, bold: true };
    });
  };

  const body = (rowIndex: number, values: (string | undefined)[]) => {
    values.forEach((value, i) => {
      const cell = sheet.getCell(rowIndex, i + 1);
      cell.value = value ?? "";
      cell.border = BORDER;
      cell.alignment = { vertical: "top", horizontal: "right", wrapText: true };
    });
  };

  let row = 1;

  // תנאי סף. בקבצים המקוריים הכותרת היא "תנאי סף (אחד מהם)", כלומר חלופות.
  // במערכת כל קריטריון BOOLEAN הוא תנאי נפרד, ולכן אין כאן "אחד מהם".
  header(row, ["תנאי סף", "יש/אין", "הערה"], BLUE);
  row += 1;
  thresholds.forEach((criterion) => {
    const text = criterion.descriptionGuide
      ? `${criterion.name}\n${criterion.descriptionGuide}`
      : criterion.name;
    body(row, [text, "", ""]);
    sheet.getCell(row, 2).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"יש,אין"'],
    };
    row += 1;
  });

  row += 1;

  // קריטריונים מנוקדים
  header(row, ["קריטריונים", "תשובות", "ציון", "מקסימום / יעד", "שלב"], PINK);
  row += 1;
  let scoredCount = 0;
  stages.forEach((stage) => {
    criteriaOf(stage)
      .filter((criterion) => criterion.type === "SCORED")
      .forEach((criterion) => {
        const text = criterion.descriptionGuide
          ? `${criterion.name}\n${criterion.descriptionGuide}`
          : criterion.name;
        const limit =
          criterion.scoringMethod === "RATIO"
            ? `יעד ${criterion.targetValue ?? ""}`
            : `מקסימום ${criterion.maxScore ?? ""}`;
        body(row, [
          text,
          "",
          "",
          limit,
          `${stage.name} (${criterion.weightPercent ?? 0}%)`,
        ]);
        row += 1;
        scoredCount += 1;
      });
  });
  if (scoredCount === 0) {
    body(row, ["אין קריטריונים מנוקדים במשרה הזו", "", "", "", ""]);
    row += 1;
  }

  body(row, ["סה\"כ", "", "", "", ""]);
  sheet.getCell(row, 1).font = { name: "Calibri", size: 11, bold: true };
  row += 2;

  const summary = sheet.getCell(row, 1);
  summary.value = "סיכום למציע:";
  summary.font = { name: "Calibri", size: 11, bold: true };
  sheet.mergeCells(row + 1, 1, row + 4, 5);
  sheet.getCell(row + 1, 1).border = BORDER;
}

// ===== גיליון 3: ערכי החלטה =====

function buildDecisionsSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("רשימת ערכי החלטה", {
    views: [{ rightToLeft: true }],
  });
  sheet.getColumn(1).width = 40;
  DECISION_VALUES.forEach((value, index) => {
    sheet.getCell(index + 1, 1).value = value;
  });
}
