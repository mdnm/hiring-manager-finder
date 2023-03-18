"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableLeadRepository = void 0;
const airtable_1 = __importDefault(require("airtable"));
const domain_1 = require("../../domain");
const Lead_1 = require("../../domain/Lead");
class AirtableLeadRepository {
    client;
    base;
    tableId;
    viewId;
    constructor() {
        if (!process.env.AIRTABLE_API_KEY) {
            throw new Error("AIRTABLE_API_KEY must be configured in .env file");
        }
        if (!process.env.AIRTABLE_BASE_ID) {
            throw new Error("AIRTABLE_BASE_ID must be configured in .env file");
        }
        if (!process.env.AIRTABLE_TABLE_ID) {
            throw new Error("AIRTABLE_TABLE_ID must be configured in .env file");
        }
        if (!process.env.AIRTABLE_VIEW_ID) {
            throw new Error("AIRTABLE_VIEW_ID must be configured in .env file");
        }
        this.client = new airtable_1.default({ apiKey: process.env.AIRTABLE_API_KEY });
        this.base = this.client.base(process.env.AIRTABLE_BASE_ID);
        this.tableId = process.env.AIRTABLE_TABLE_ID;
        this.viewId = process.env.AIRTABLE_VIEW_ID;
    }
    async getLeads() {
        const records = await this.base(this.tableId).select({
            view: this.viewId,
            fields: ["job_title", "job_id", "action_name", "company_name", "job_description", "location", "action_name", "job_functions", "experience_level", "JobURL"],
            sort: [{ field: "timestamp", direction: "desc" }],
        }).firstPage();
        return records.map(record => {
            const jobOpportunity = new domain_1.JobOpportunity({
                title: record.fields.job_title,
                description: record.fields.job_description,
                location: record.fields.location,
                jobFunctions: record.fields.job_functions,
                experienceLevel: record.fields.experience_level,
                url: record.fields.JobURL,
            });
            const company = new domain_1.Company({
                name: record.fields.company_name,
            });
            const lead = new Lead_1.Lead({
                id: record.id,
                action: record.fields.action_name,
                jobOpportunity,
                company,
            });
            return lead;
        });
    }
}
exports.AirtableLeadRepository = AirtableLeadRepository;
//# sourceMappingURL=AirtableLeadRepository.js.map