import { Lead } from "../Lead";

export interface LeadRepository {
  getLeads(): Promise<Lead[]>;
}
