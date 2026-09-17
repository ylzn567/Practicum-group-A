import { Model } from "mongoose";

/**
 * פילטר שליפה פשוט: שם שדה -> ערך להשוואה מדויקת.
 * mongoose 9 כבר לא מייצא FilterQuery, וממילא הראוטר בונה
 * רק זוגות של מחרוזות מתוך רשימת שדות מאושרת.
 */
export type QueryFilter = Record<string, string>;

export class Repository<T> {
  constructor(private model: Model<T>) {}

  async add(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  // filter ריק = כל המסמכים, כך שקריאות קיימות ל-getAll() לא משתנות
  async getAll(filter: QueryFilter = {}, populate: string[] = []): Promise<T[]> {
    const query = this.model.find(filter);
    return populate.length > 0 ? query.populate(populate) : query;
  }

  async getById(id: string, populate: string[] = []): Promise<T | null> {
    const query = this.model.findById(id);
    return populate.length > 0 ? query.populate(populate) : query;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}
