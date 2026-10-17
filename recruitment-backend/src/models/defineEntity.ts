import { Schema, SchemaDefinition, SchemaDefinitionType, model } from "mongoose";
import { Repository } from "../repositories/generic.repository";

/** Schema ← Model ← Repository במקום אחד, כך שכל ישות מוגדרת באותה צורה */
export function defineEntity<T>(
  name: string,
  definition: SchemaDefinition<SchemaDefinitionType<T>>
) {
  const Model = model<T>(name, new Schema<T>(definition, { timestamps: true }));
  return { Model, repository: new Repository<T>(Model) };
}
