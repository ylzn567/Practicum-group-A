import ExcelJS from "exceljs";
import { Types } from "mongoose";
import { positionRepository } from "../models/position.model";
import { StageModel } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";
import { BadRequestError } from "../middleware/errorHandler";
import { deletePositionCascade } from "./position.service";
import { Position, PositionLevel } from "../types";

/**
 * יצירת משרה מקובץ מפ"ל (Excel).
 *
 * שני פורמטים נתמכים:
 *   "recruitment" — קובץ שהמערכת עצמה ייצאה. יש בו שורת קבוצות עם שמות השלבים
 *                   ומשקליהם, ולכן המבנה משוחזר במדויק.
 *   "office"      — קבצי המפ"ל המקוריים של המשרד. אין בהם שלבים מלבד שלושה משקלים
 *                   (ראיון / מבחן / עלות), ולכן השיוך הוא היוריסטי ומלווה באזהרות.
 */

export interface DraftCriterion {
  name: string;
  type: "BOOLEAN" | "SCORED";
  scoringMethod?: "RATIO" | "DIRECT";
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

export interface DraftStage {
  name: string;
  order: number;
  weightPercent: number;
  quota?: number;
  criteria: DraftCriterion[];
}

export interface MapalDraft {
  format: "recruitment" | "office";
  title: string;
  level?: PositionLevel;
  stages: DraftStage[];
  warnings: string[];
}

const HEADER_SCAN_ROWS = 30;
const DEFAULT_MAX_SCORE = 10;
const THRESHOLD_STAGE_NAME = "בדיקת תנאי סף";
const INTERVIEW_STAGE = "ראיון";
const TEST_STAGE = "מבחן";
const MAX_STAGES = 20;
const MAX_CRITERIA_PER_STAGE = 60;

// ===== עזרים =====

function cellText(cell: ExcelJS.Cell): string {
  // cell.text זורק שגיאה על תא ממוזג שהתא הראשי שלו ריק, למשל בלוק "סיכום למציע"
  try {
    return String(cell.text ?? "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function cellNumber(cell: ExcelJS.Cell): number | null {
  return typeof cell.value === "number" ? cell.value : null;
}

/** מנרמל רשימת מספרים לסכום 100 בדיוק (באלפיות), בלי שארית צפה */
function normalizeTo100(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (values.length === 0) return [];
  if (total <= 0) {
    const even = Math.floor(10000 / values.length) / 100;
    const result = values.map(() => even);
    result[result.length - 1] = round2(100 - even * (values.length - 1));
    return result;
  }
  const result = values.map((value) => round2((value / total) * 100));
  const diff = round2(100 - result.reduce((sum, value) => sum + value, 0));
  const largest = result.indexOf(Math.max(...result));
  result[largest] = round2(result[largest] + diff);
  return result;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function titleFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^מפל\s*[-–]?\s*/, "")
    .trim();
  return base || "משרה מיובאת";
}

function levelFromTitle(title: string): PositionLevel | undefined {
  const letter = title.match(/רמה\s*([אבגד])/)?.[1];
  const map: Record<string, PositionLevel> = {
    א: "LEVEL_A",
    ב: "LEVEL_B",
    ג: "LEVEL_C",
    ד: "LEVEL_D",
  };
  return letter ? map[letter] : undefined;
}

function parseScoredHeader(rest: string): { name: string; weight?: number } {
  // "התרשמות כללית בראיון טלפוני. 20%"  ->  שם + 20
  const match = rest.match(/^(.*?)[\s.]*?(\d+(?:\.\d+)?)\s*%\s*$/);
  if (!match) return { name: rest.trim() };
  return { name: match[1].trim().replace(/\.$/, "").trim(), weight: Number(match[2]) };
}

// ===== ניתוח הגיליון =====

interface ScoredColumn {
  column: number;
  name: string;
  weight?: number;
}

interface SheetInfo {
  thresholds: string[];
  scored: ScoredColumn[];
  weights: { label: string; value: number }[];
  groups: { start: number; end: number; label: string }[];
}

function analyzeCandidatesSheet(sheet: ExcelJS.Worksheet): SheetInfo {
  let headerRow = -1;
  const scanLimit = Math.min(sheet.rowCount, HEADER_SCAN_ROWS);
  for (let r = 1; r <= scanLimit && headerRow === -1; r += 1) {
    sheet.getRow(r).eachCell((cell) => {
      if (cellText(cell) === "שם מועמד") headerRow = r;
    });
  }
  if (headerRow === -1) {
    throw new BadRequestError(
      'לא נמצאה שורת כותרות. הקובץ צריך לכלול עמודה בשם "שם מועמד" בגיליון הראשון.'
    );
  }

  // משקלי שלבים: "משקל הראיון | 0.6" בשורות שמעל הכותרות
  const weights: SheetInfo["weights"] = [];
  let groupRow = -1;
  for (let r = 1; r < headerRow; r += 1) {
    const label = cellText(sheet.getCell(r, 1));
    const value = cellNumber(sheet.getCell(r, 2));
    if (label.startsWith("משקל") && value !== null) {
      weights.push({
        label: label.replace(/^משקל\s*/, "").trim(),
        value: value <= 1 ? value * 100 : value,
      });
    } else if (r === headerRow - 1) {
      groupRow = r;
    }
  }

  // שורת קבוצות (רק בקבצים שהמערכת ייצאה, או "מענה הספק / צוות בדיקה" במשרד)
  const groups: SheetInfo["groups"] = [];
  if (groupRow !== -1) {
    const lastColumn = sheet.columnCount;
    const starts: { col: number; label: string }[] = [];
    for (let c = 1; c <= lastColumn; c += 1) {
      const cell = sheet.getCell(groupRow, c);
      if (cell.isMerged && cell.master.address !== cell.address) continue;
      const label = cellText(cell);
      if (label) starts.push({ col: c, label });
    }
    starts.forEach((item, index) => {
      groups.push({
        start: item.col,
        end: index + 1 < starts.length ? starts[index + 1].col - 1 : lastColumn,
        label: item.label,
      });
    });
  }

  const thresholds: string[] = [];
  const scored: ScoredColumn[] = [];
  const headers = sheet.getRow(headerRow);
  for (let c = 1; c <= sheet.columnCount; c += 1) {
    const text = cellText(headers.getCell(c));
    if (!text || text.startsWith("עמידה בתנאי סף")) continue;

    if (text.startsWith("תנאי סף")) {
      const afterColon = text.includes(":") ? text.split(":").slice(1).join(":").trim() : "";
      thresholds.push(afterColon || text);
    } else if (text.startsWith("ציון:")) {
      const parsed = parseScoredHeader(text.slice("ציון:".length));
      if (parsed.name) scored.push({ column: c, name: parsed.name, weight: parsed.weight });
    }
  }

  return { thresholds, scored, weights, groups };
}

interface Sheet2Info {
  byName: Map<string, { method: "RATIO" | "DIRECT"; value: number; guide?: string }>;
  defaultMax?: number;
}

/** גיליון 2: במפ"ל שהמערכת ייצאה יש בו שיטת ניקוד ויעד לכל קריטריון. במקור יש רק "(מקסימום 5)" */
function analyzeInterviewSheet(workbook: ExcelJS.Workbook): Sheet2Info {
  const info: Sheet2Info = { byName: new Map() };
  const sheet =
    workbook.getWorksheet("ניקוד ראיון מציע X") ?? workbook.worksheets[1];
  if (!sheet) return info;

  sheet.eachRow((row) => {
    const rowText = cellText(row.getCell(3));
    const maxFromHeader = rowText.match(/מקסימום\s*(\d+(?:\.\d+)?)/);
    if (maxFromHeader && info.defaultMax === undefined) {
      info.defaultMax = Number(maxFromHeader[1]);
    }

    let raw = "";
    try {
      raw = String(row.getCell(1).text ?? ""); // שומר את מעברי השורה: השורה השנייה היא ההנחיה
    } catch {
      return;
    }
    const [nameLine, ...guideLines] = raw.split("\n");
    const name = nameLine.replace(/\s+/g, " ").trim();
    const limit = cellText(row.getCell(4));
    if (!name || !limit) return;

    const max = limit.match(/^מקסימום\s*(\d+(?:\.\d+)?)/);
    const target = limit.match(/^יעד\s*(\d+(?:\.\d+)?)/);
    const guide = guideLines.join(" ").replace(/\s+/g, " ").trim() || undefined;
    if (max) info.byName.set(name, { method: "DIRECT", value: Number(max[1]), guide });
    else if (target) info.byName.set(name, { method: "RATIO", value: Number(target[1]), guide });
  });

  return info;
}

// ===== בניית הטיוטה =====

export async function parseMapalFile(
  buffer: Buffer,
  fileName: string
): Promise<MapalDraft> {
  // xlsx הוא ארכיון zip, וכל zip מתחיל ב-"PK"
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new BadRequestError("הקובץ אינו קובץ Excel בפורמט xlsx. קבצי xls ישנים יש לשמור מחדש כ-xlsx.");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new BadRequestError("לא הצלחנו לקרוא את הקובץ. ייתכן שהוא פגום.");
  }

  const sheet = workbook.getWorksheet("מועמדים") ?? workbook.worksheets[0];
  if (!sheet) throw new BadRequestError("בקובץ אין גיליונות.");

  const info = analyzeCandidatesSheet(sheet);
  const sheet2 = analyzeInterviewSheet(workbook);
  const warnings: string[] = [];

  if (info.thresholds.length === 0 && info.scored.length === 0) {
    throw new BadRequestError(
      'לא נמצאו עמודות תנאי סף או ציון. הכותרות צריכות להתחיל ב-"תנאי סף" או ב-"ציון:".'
    );
  }

  const stageLabel = /^(.*?)\s*\((\d+(?:\.\d+)?)%\)\s*$/;
  const isRecruitmentFormat = info.groups.some((group) => stageLabel.test(group.label));

  const toCriterion = (column: ScoredColumn, weight: number | undefined): DraftCriterion => {
    const known = sheet2.byName.get(column.name);
    if (known?.method === "RATIO") {
      return {
        name: column.name,
        type: "SCORED",
        scoringMethod: "RATIO",
        targetValue: known.value,
        weightPercent: weight,
        descriptionGuide: known.guide,
      };
    }
    return {
      name: column.name,
      type: "SCORED",
      scoringMethod: "DIRECT",
      maxScore: known?.value ?? sheet2.defaultMax ?? DEFAULT_MAX_SCORE,
      weightPercent: weight,
      descriptionGuide: known?.guide,
    };
  };

  const thresholdCriteria: DraftCriterion[] = info.thresholds.map((name) => ({
    name,
    type: "BOOLEAN",
    descriptionGuide: sheet2.byName.get(name)?.guide,
  }));

  const stages: DraftStage[] = [];

  if (isRecruitmentFormat) {
    // ===== קובץ של המערכת: השלבים והמשקלים כתובים בשורת הקבוצות =====
    const byStage = new Map<string, DraftStage>();
    const ensureStage = (name: string, weight: number): DraftStage => {
      let stage = byStage.get(name);
      if (!stage) {
        stage = { name, order: 0, weightPercent: weight, criteria: [] };
        byStage.set(name, stage);
      }
      return stage;
    };

    if (thresholdCriteria.length > 0) {
      ensureStage(THRESHOLD_STAGE_NAME, 0).criteria.push(...thresholdCriteria);
    }

    info.scored.forEach((column) => {
      const group = info.groups.find(
        (item) => column.column >= item.start && column.column <= item.end
      );
      const match = group ? group.label.match(stageLabel) : null;
      const stage = match
        ? ensureStage(match[1].trim(), Number(match[2]))
        : ensureStage(INTERVIEW_STAGE, 0);
      stage.criteria.push(toCriterion(column, column.weight));
    });

    stages.push(...byStage.values());
  } else {
    // ===== קובץ מקורי של המשרד: שיוך לשלב לפי מילת מפתח =====
    const interview: ScoredColumn[] = [];
    const test: ScoredColumn[] = [];
    info.scored.forEach((column) =>
      (column.name.includes("מבחן") ? test : interview).push(column)
    );

    if (info.scored.length > 0) {
      warnings.push(
        `שויכו לשלב לפי מילת מפתח: קריטריונים שמכילים "מבחן" לשלב מבחן, כל השאר לשלב ראיון. מומלץ לעבור על השיוך.`
      );
    }

    const rawWeightOf = (label: string): number | undefined => {
      const found = info.weights.find((item) => item.label.replace(/^ה/, "") === label);
      return found?.value;
    };

    const costWeight = rawWeightOf("עלות");
    if (costWeight !== undefined) {
      warnings.push(
        `משקל העלות (${round2(costWeight)}%) לא יובא: העלות מחושבת מהצעת המחיר ואינה קריטריון. ` +
          `משקלי הראיון והמבחן נורמלו ל-100%, כמו בנוסחת ציון האיכות של המשרד.`
      );
    }

    const groups: { name: string; columns: ScoredColumn[] }[] = [
      { name: INTERVIEW_STAGE, columns: interview },
      { name: TEST_STAGE, columns: test },
    ].filter((group) => group.columns.length > 0);

    // משקל כל שלב: מהבלוק שבראש הגיליון, ואם חסר, לפי סכום אחוזי הקריטריונים שלו
    const rawStageWeights = groups.map((group) => {
      const fromBlock = rawWeightOf(group.name);
      if (fromBlock !== undefined) return fromBlock;
      return group.columns.reduce((sum, column) => sum + (column.weight ?? 0), 0);
    });
    const stageWeights = normalizeTo100(rawStageWeights);

    if (thresholdCriteria.length > 0) {
      stages.push({
        name: THRESHOLD_STAGE_NAME,
        order: 0,
        weightPercent: 0,
        criteria: thresholdCriteria,
      });
    }

    groups.forEach((group, index) => {
      const allHaveWeight = group.columns.every((column) => column.weight !== undefined);
      if (!allHaveWeight && group.columns.length > 1) {
        warnings.push(`בשלב "${group.name}" חלק מהקריטריונים בלי אחוז, ולכן המשקל חולק שווה בשווה.`);
      }
      const criteriaWeights = normalizeTo100(
        group.columns.map((column) => (allHaveWeight ? column.weight! : 1))
      );
      const sumBefore = group.columns.reduce((sum, column) => sum + (column.weight ?? 0), 0);
      if (allHaveWeight && Math.abs(sumBefore - 100) > 0.01 && group.columns.length > 0) {
        warnings.push(
          `בשלב "${group.name}" אחוזי הקריטריונים בקובץ מסתכמים ל-${round2(sumBefore)}%, ולכן נורמלו ל-100%.`
        );
      }

      stages.push({
        name: group.name,
        order: 0,
        weightPercent: stageWeights[index],
        criteria: group.columns.map((column, i) => toCriterion(column, criteriaWeights[i])),
      });
    });

    if (info.thresholds.length > 0) {
      warnings.push(
        "הפירוט של תנאי הסף (האפשרויות שבגיליון השני) לא יובא. נוצר קריטריון אחד לכל עמודת תנאי סף."
      );
    }
  }

  if (stages.length === 0) {
    throw new BadRequestError("לא נמצא בקובץ אף שלב או קריטריון לייבוא.");
  }

  stages.forEach((stage, index) => {
    stage.order = index + 1;
  });

  // בדיקות סכום בקובץ של המערכת (בקובץ משרד הנרמול כבר דאג לזה)
  if (isRecruitmentFormat) {
    const stageTotal = round2(stages.reduce((sum, stage) => sum + stage.weightPercent, 0));
    if (stageTotal !== 100) {
      warnings.push(`משקלי השלבים בקובץ מסתכמים ל-${stageTotal}% ולא ל-100%.`);
    }
    stages.forEach((stage) => {
      const scored = stage.criteria.filter((criterion) => criterion.type === "SCORED");
      const sum = round2(scored.reduce((total, criterion) => total + (criterion.weightPercent ?? 0), 0));
      if (scored.length > 0 && sum !== 100) {
        warnings.push(`בשלב "${stage.name}" משקלי הקריטריונים מסתכמים ל-${sum}% ולא ל-100%.`);
      }
    });
  }

  const missingMax =
    info.scored.length > 0 &&
    info.scored.some((column) => !sheet2.byName.has(column.name)) &&
    sheet2.defaultMax === undefined;
  if (missingMax) {
    warnings.push(
      `לא נמצא ציון מרבי בקובץ, ולכן קריטריונים מנוקדים הוגדרו כציון ישיר עם מקסימום ${DEFAULT_MAX_SCORE}.`
    );
  }

  const title = titleFromFileName(fileName);
  return {
    format: isRecruitmentFormat ? "recruitment" : "office",
    title,
    level: levelFromTitle(title),
    stages,
    warnings,
  };
}

// ===== יצירת המשרה מהטיוטה =====

export interface ImportRequest {
  title: string;
  categoryId?: string;
  level?: PositionLevel;
  stages: DraftStage[];
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`יש להזין ${label}`);
  }
  return value.trim();
}

function optionalNumber(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BadRequestError(`${label} חייב להיות מספר`);
  }
  return value;
}

export async function createPositionFromDraft(
  input: ImportRequest
): Promise<Position> {
  const title = assertString(input?.title, "כותרת המשרה");
  if (!Array.isArray(input.stages) || input.stages.length === 0) {
    throw new BadRequestError("אין שלבים ליצירה");
  }
  if (input.stages.length > MAX_STAGES) {
    throw new BadRequestError(`מספר השלבים חורג מ-${MAX_STAGES}`);
  }

  // ולידציה מלאה לפני שנוגעים במסד, כדי שרוב הכשלים לא ידרשו rollback
  const stages = input.stages.map((stage, index) => {
    const name = assertString(stage.name, `שם שלב ${index + 1}`);
    if (!Array.isArray(stage.criteria) || stage.criteria.length > MAX_CRITERIA_PER_STAGE) {
      throw new BadRequestError(`רשימת הקריטריונים בשלב "${name}" לא תקינה`);
    }
    return {
      name,
      order: index + 1,
      weightPercent: optionalNumber(stage.weightPercent, `משקל השלב "${name}"`) ?? 0,
      quota: optionalNumber(stage.quota, `מכסת השלב "${name}"`),
      criteria: stage.criteria.map((criterion) => {
        if (!criterion || typeof criterion !== "object") {
          throw new BadRequestError(`קריטריון לא תקין בשלב "${name}"`);
        }
        if (criterion.type !== "BOOLEAN" && criterion.type !== "SCORED") {
          throw new BadRequestError(`סוג קריטריון לא תקין בשלב "${name}"`);
        }
        if (
          criterion.scoringMethod !== undefined &&
          criterion.scoringMethod !== "RATIO" &&
          criterion.scoringMethod !== "DIRECT"
        ) {
          throw new BadRequestError(`שיטת ניקוד לא תקינה בשלב "${name}"`);
        }
        return {
        name: assertString(criterion.name, `שם קריטריון בשלב "${name}"`),
        type: criterion.type,
        scoringMethod: criterion.scoringMethod,
        targetValue: optionalNumber(criterion.targetValue, "ערך יעד"),
        weightPercent: optionalNumber(criterion.weightPercent, "משקל קריטריון"),
        maxScore: optionalNumber(criterion.maxScore, "ציון מרבי"),
        descriptionGuide:
          typeof criterion.descriptionGuide === "string" ? criterion.descriptionGuide : undefined,
        };
      }),
    };
  });

  if (input.categoryId && !Types.ObjectId.isValid(input.categoryId)) {
    throw new BadRequestError("קטגוריית המשרה לא תקינה");
  }

  const position = await positionRepository.add({
    title,
    categoryId: input.categoryId ? new Types.ObjectId(input.categoryId) : undefined,
    level: input.level,
    status: "DRAFT",
  });
  const positionId = (position as Position & { _id: Types.ObjectId })._id;

  try {
    for (const stage of stages) {
      const created = await StageModel.create({
        positionId,
        name: stage.name,
        order: stage.order,
        weightPercent: stage.weightPercent,
        quota: stage.quota,
      });
      if (stage.criteria.length > 0) {
        await CriterionModel.insertMany(
          stage.criteria.map((criterion) => ({ ...criterion, stageId: created._id }))
        );
      }
    }
  } catch (err) {
    // אין טרנזקציות ב-Mongo המקומי, ולכן מנקים ידנית כדי לא להשאיר משרה חצי-יצורה
    await deletePositionCascade(String(positionId));
    throw err;
  }

  return position;
}
