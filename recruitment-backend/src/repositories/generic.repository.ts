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
  async getAll(filter: QueryFilter = {}): Promise<T[]> {
    return this.model.find(filter);
  }

  async getById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}
