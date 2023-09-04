import { Company } from "./Company";
import { HiringManager } from "./HiringManager";
import { JobOpportunity } from "./JobOpportunity";

export const departments = [
  "executive",
  "founder",
  "information_technology_executive",
  "master_information_technology",
] as const;
export type Department = (typeof departments)[number];

export class Lead {
  id?: string;
  jobOpportunity: JobOpportunity;
  potentialHiringManager: HiringManager;
  departments: Department[];
  location: string;
  company: Company;
  timestamp: string;
  alreadyProcessed: boolean;

  constructor({
    id,
    jobOpportunity,
    company,
    timestamp,
    alreadyProcessed,
    location,
  }: {
    id?: string;
    jobOpportunity: JobOpportunity;
    company: Company;
    location: string;
    timestamp: string;
    alreadyProcessed: boolean;
  }) {
    this.id = id;
    this.jobOpportunity = jobOpportunity;
    this.company = company;
    this.timestamp = timestamp;
    this.alreadyProcessed = alreadyProcessed;

    this.departments = [...departments];
    this.location = location;
  }

  public setHiringManager(hiringManager: HiringManager) {
    this.potentialHiringManager = hiringManager;
  }
}
