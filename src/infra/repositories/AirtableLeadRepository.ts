import Airtable from 'airtable';
import { Company, JobOpportunity } from '../../domain';
import { Lead } from '../../domain/Lead';
import { LeadRepository } from '../../domain/repositories/LeadRepository';


export class AirtableLeadRepository implements LeadRepository {
  private client: Airtable;
  private base: Airtable.Base;
  private tableId: string;
  private viewId: string;

  constructor() {
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error("AIRTABLE_API_KEY must be configured in .env file")
    }

    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error("AIRTABLE_BASE_ID must be configured in .env file")
    }
    
    if (!process.env.AIRTABLE_TABLE_ID) {
      throw new Error("AIRTABLE_TABLE_ID must be configured in .env file")
    }

    if (!process.env.AIRTABLE_VIEW_ID) {
      throw new Error("AIRTABLE_VIEW_ID must be configured in .env file")
    }
    
    this.client = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
    this.base = this.client.base(process.env.AIRTABLE_BASE_ID)
    this.tableId = process.env.AIRTABLE_TABLE_ID;
    this.viewId = process.env.AIRTABLE_VIEW_ID;
  }

  public async getLeads(): Promise<Lead[]> {
    const records = await this.base(this.tableId).select({
      view: this.viewId,
      fields: ["job_title", "job_id", "action_name", "company_name", "job_description", "location", "action_name", "job_functions", "experience_level", "JobURL"],
      sort: [{ field: "timestamp", direction: "desc" }],
    }).firstPage()

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
      })

      return lead
    })
  }

}