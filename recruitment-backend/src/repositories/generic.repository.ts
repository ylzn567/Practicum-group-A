import { Model } from "mongoose";

export class Repository<T> {
  constructor(private model: Model<T>) {}

  async add(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async getAll(): Promise<T[]> {
    return this.model.find();
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
