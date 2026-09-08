import { Schema, model } from "mongoose";
import { Company } from "../types";
import { Repository } from "../repositories/generic.repository";

const companySchema = new Schema<Company>(
  {
    name: { type: String, required: true },
    companyIdNumber: String,
    contactEmail: String,
  },
  { timestamps: true }
);

export const CompanyModel = model<Company>("Company", companySchema);
export const companyRepository = new Repository<Company>(CompanyModel);
