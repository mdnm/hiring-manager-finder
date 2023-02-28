import { Company } from "./Company"
import { HiringManager } from "./HiringManager"
import { JobOpportunity } from "./JobOpportunity"

export class Lead {
  id: string
  jobOpportunity: JobOpportunity
  potentialHiringManager: HiringManager
  company: Company
  action: string
  
  private source: string

  constructor(id: string, action: string, jobOpportunity: JobOpportunity) {
    this.id = id
    this.action = action
    this.jobOpportunity = jobOpportunity
    this.source = "Mateus API"
  }

  public setHiringManager(hiringManager: HiringManager) {
    this.potentialHiringManager = hiringManager
  }

  public setCompany(company: Company) {
    this.company = company
  }

  public getSource() {
    if (this.potentialHiringManager) {
      return this.source
    }

    if (!this.company || this.company.employeeCount === 0) {
      return `${this.source} (Company not found)`
    }

    return `${this.source} (No match found)`
  }
}