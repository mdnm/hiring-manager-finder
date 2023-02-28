const jobSeniorities = ['junior', 'senior', 'manager', 'director', 'head', 'vp', "c_suite", "partner", "owner", "founder"] as const
export type JobSeniority = typeof jobSeniorities[number]

export class JobOpportunity {
  title: string | null
  seniority: JobSeniority | null
  description: string | null
  location: string | null

  constructor({ title, description, location }: { title?: string, description?: string, location?: string}) {
    this.title = title ?? null
    this.description = description ?? null
    this.location = location ?? null

    this.seniority = this.getSeniority()
  }

  private getSeniority(): JobSeniority | null {
    if (!this.title) {
      return null
    }

    const juniorSeniorities = ['junior', 'intern', 'associate', 'representative']
    const seniority = this.title.match(/(junior|intern|associate|representative|senior|manager|director|head|vp|vice president)/i)

    if (!seniority) {
      return null
    }

    const formattedSeniority = seniority[0].toLowerCase()
    if (juniorSeniorities.includes(formattedSeniority)) {
      return 'junior'
    }

    if (formattedSeniority === 'vp' || formattedSeniority === 'vice president') {
      return 'vp'
    }

    if (jobSeniorities.includes(formattedSeniority as JobSeniority)) {
      return formattedSeniority as JobSeniority
    }

    return null
  }

  public isEqualTo(jobOpportunity: JobOpportunity): boolean {
    return this.title === jobOpportunity.title && this.description === jobOpportunity.description && this.location === jobOpportunity.location
  }

  public getPossibleManagerSeniorities(): JobSeniority[] {
    if (!this.seniority) {
      throw new Error("Job opportunity doesn't have a seniority"); 
    }

    const seniorityIndex = jobSeniorities.indexOf(this.seniority)

    return jobSeniorities.slice(seniorityIndex)
  }
}