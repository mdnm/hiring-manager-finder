import Airtable from 'airtable';
import { Company, JobOpportunity } from '../../domain';
import { Lead } from '../../domain/Lead';
import { LeadRepository } from '../../domain/repositories/LeadRepository';


export class AirtableLeadRepository implements LeadRepository {
  private client: Airtable;
  private base: Airtable.Base;
  private tableId: string;
  private viewId: string;

  constructor({ baseId, tableId, viewId }: { baseId?: string, tableId?: string, viewId?: string } = {}) {
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error("AIRTABLE_API_KEY must be configured in .env file")
    }

    if (!process.env.AIRTABLE_BASE_ID && !baseId) {
      throw new Error("AIRTABLE_BASE_ID must be configured in .env file")
    }

    if (!process.env.AIRTABLE_TABLE_ID && !tableId) {
      throw new Error("AIRTABLE_TABLE_ID must be configured in .env file")
    }

    if (!process.env.AIRTABLE_VIEW_ID && !viewId) {
      throw new Error("AIRTABLE_VIEW_ID must be configured in .env file")
    }

    this.client = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
    this.base = this.client.base(baseId || process.env.AIRTABLE_BASE_ID)
    this.tableId = tableId || process.env.AIRTABLE_TABLE_ID;
    this.viewId = viewId || process.env.AIRTABLE_VIEW_ID;
  }

  public async getAllLeads(): Promise<{
    job_title?: string;
    job_id?: string;
    action_name?: string;
    company_name?: string;
    job_description?: string;
    location?: string;
    job_functions?: string;
    experience_level?: string;
    JobURL?: string;
    "Email Status"?: string;
    Email?: string;
    employee_profile_url?: string;
    employee_full_name?: string;
    employee_first_name?: string;
    employee_last_name?: string;
    employee_job?: string;
    employee_location?: string;
    company_employee_search_source?: string;
    company_website?: string;
    company_staff_count?: number;
    source?: string;
    Timestamp: string;
  }[]> {
    const records = await this.base<{
      job_title?: string;
      job_id?: string;
      action_name?: string;
      company_name?: string;
      job_description?: string;
      location?: string;
      job_functions?: string;
      experience_level?: string;
      JobURL?: string;
      "Email Status"?: string;
      Email?: string;
      employee_profile_url?: string;
      employee_full_name?: string;
      employee_first_name?: string;
      employee_last_name?: string;
      employee_job?: string;
      employee_location?: string;
      company_employee_search_source?: string;
      company_website?: string;
      company_staff_count?: number;
      source?: string;
      Timestamp: string;
    }>(this.tableId).select({
      view: this.viewId,
      fields: ["job_title", "job_id", "action_name", "company_name", "job_description", "location", "action_name", "job_functions", "experience_level", "JobURL", "Email Status", "Email", "employee_profile_url", "employee_full_name", "employee_first_name", "employee_last_name", "employee_job", "employee_location", "company_employee_search_source", "company_website", "company_staff_count", "source", "Timestamp"],
      sort: [{ field: "Timestamp", direction: "desc" }],
    }).all()

    return Array.from(records).filter(
      record => record.fields.company_employee_search_source?.includes?.("Mateus")
    ).map(record => record.fields)
  }

  public async getLeads(): Promise<Lead[]> {
    try {
      const records = await this.base(this.tableId).select({
        view: this.viewId,
        fields: ["job_title", "job_id", "action_name", "company_name", "job_description", "location", "action_name", "job_functions", "experience_level", "JobURL", "Timestamp", "company_employee_search_source"],
        sort: [{ field: "Timestamp", direction: "desc" }],
      }).all()

      return records.map<Lead>(record => {
        const jobOpportunity = new JobOpportunity({
          title: record.fields.job_title,
          description: record.fields.job_description,
          location: record.fields.location,
          jobFunctions: record.fields.job_functions,
          experienceLevel: record.fields.experience_level,
          url: record.fields.JobURL,
        } as unknown)

        const company = new Company({
          name: record.fields.company_name as string,
        })

        const lead = new Lead({
          id: record.id,
          action: record.fields.action_name as string,
          jobOpportunity,
          company,
          timestamp: record.fields.timestamp as string,
          alreadyProcessed: (record.fields.company_employee_search_source as string)?.includes?.("Mateus"),
        })

        return lead
      })
    } catch (error) {
      console.log(error.message || error)
      return []
    }
  }
}