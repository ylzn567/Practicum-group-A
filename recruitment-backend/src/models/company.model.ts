import { Company } from "../types";
import { defineEntity } from "./defineEntity";

export const { Model: CompanyModel, repository: companyRepository } =
  defineEntity<Company>("Company", {
    name: { type: String, required: true },
    companyIdNumber: String,
    contactEmail: String,
  });
