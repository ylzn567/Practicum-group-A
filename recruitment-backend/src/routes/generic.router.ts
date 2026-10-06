import { Request, Router } from "express";
import { QueryFilter, Repository } from "../repositories/generic.repository";

export interface GenericRouterOptions<T> {
  /** שדות שמותר לסנן לפיהם ב-query string. כל השאר מתעלמים מהם (מונע הזרקת $ne / $gt) */
  filterableFields?: string[];
  /** שדות שמותר להרחיב ב-?populate=a,b: ObjectId מוחלף באובייקט המלא */
  populatableFields?: string[];
  /** דורס את היצירה הגנרית, כשיצירה כוללת לוגיקה נוספת */
  create?: (body: Partial<T>) => Promise<T>;
  /** דורס את המחיקה הגנרית, למשל מחיקה מדורגת */
  remove?: (id: string) => Promise<unknown>;
}

const NOT_FOUND = { error: "Not found" };
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** CRUD מלא לכל אוסף. שגיאות מטופלות ב-errorHandler, ולכן אין כאן try/catch */
export function createGenericRouter<T>(
  repository: Repository<T>,
  {
    filterableFields = [],
    populatableFields = [],
    create = (body) => repository.add(body),
    remove = (id) => repository.remove(id),
  }: GenericRouterOptions<T> = {}
): Router {
  const router = Router();
  const id = (req: Request) => String(req.params.id);

  const filterOf = (query: Request["query"]): QueryFilter =>
    Object.fromEntries(
      filterableFields.flatMap((field) => {
        const value = text(query[field]);
        return value ? [[field, value]] : [];
      })
    );

  const populateOf = (query: Request["query"]) =>
    (text(query.populate)?.split(",") ?? [])
      .map((field) => field.trim())
      .filter((field) => populatableFields.includes(field));

  router.get("/", async (req, res) => {
    res.json(await repository.getAll(filterOf(req.query), populateOf(req.query)));
  });

  router.get("/:id", async (req, res) => {
    const item = await repository.getById(id(req), populateOf(req.query));
    item ? res.json(item) : res.status(404).json(NOT_FOUND);
  });

  router.post("/", async (req, res) => {
    res.status(201).json(await create(req.body));
  });

  router.put("/:id", async (req, res) => {
    const updated = await repository.update(id(req), req.body);
    updated ? res.json(updated) : res.status(404).json(NOT_FOUND);
  });

  router.delete("/:id", async (req, res) => {
    await remove(id(req));
    res.status(204).send();
  });

  return router;
}
