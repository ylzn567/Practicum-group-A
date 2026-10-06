"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
class Repository {
    constructor(model) {
        this.model = model;
    }
    async add(data) {
        return this.model.create(data);
    }
    // filter ריק = כל המסמכים, כך שקריאות קיימות ל-getAll() לא משתנות
    async getAll(filter = {}, populate = []) {
        const query = this.model.find(filter);
        return populate.length > 0 ? query.populate(populate) : query;
    }
    async getById(id, populate = []) {
        const query = this.model.findById(id);
        return populate.length > 0 ? query.populate(populate) : query;
    }
    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }
    async remove(id) {
        await this.model.findByIdAndDelete(id);
    }
}
exports.Repository = Repository;
