"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyRepository = exports.CompanyModel = void 0;
const mongoose_1 = require("mongoose");
const generic_repository_1 = require("../repositories/generic.repository");
const companySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    companyIdNumber: String,
    contactEmail: String,
}, { timestamps: true });
exports.CompanyModel = (0, mongoose_1.model)("Company", companySchema);
exports.companyRepository = new generic_repository_1.Repository(exports.CompanyModel);
