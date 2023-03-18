const jobSeniorities = ['junior', 'senior', 'manager', 'director', 'head', 'vp', "c_suite", "partner", "owner", "founder"] as const
export type JobSeniority = typeof jobSeniorities[number]

const defaultPotentialHiringManagerSeniorities: JobSeniority[] = ['manager', 'director', 'head', 'vp', "c_suite", "partner", "owner", "founder"]

export class JobOpportunity {
  title: string | null
  seniority: JobSeniority | null
  description: string | null
  location: string | null
  url: string | null

  constructor({ title, description, location, url }: { title?: string, description?: string, location?: string, url?: string}) {
    this.title = title ?? null
    this.description = description ?? null
    this.location = location ?? null
    this.url = url ?? null

    this.seniority = this.getSeniority()
  }

  private getSeniority(): JobSeniority | null {
    if (!this.title) {
      return null
    }

    const juniorSeniorities = ['junior', 'intern', 'associate', 'representative']
    const seniority = this.title.match(/(junior|intern|associate|representative|senior|manager|director|head|vp|vice president|chargé|gestionnaire|responsable|chef de|directeur)/i)

    if (!seniority) {
      return null
    }

    const formattedSeniority = seniority[0].toLowerCase()
    if (juniorSeniorities.includes(formattedSeniority)) {
      return 'junior'
    }

    if (formattedSeniority === 'chef de' || formattedSeniority === 'chargé' || formattedSeniority === 'responsable' || formattedSeniority === 'gestionnaire') {
      return 'manager'
    }

    if (formattedSeniority === 'directeur') {
      return 'director'
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
      return defaultPotentialHiringManagerSeniorities
    }

    const seniorityIndex = jobSeniorities.indexOf(this.seniority)
    if (seniorityIndex === -1) {
      return defaultPotentialHiringManagerSeniorities
    }

    const senioritiesFromPotentialHiringManagers = jobSeniorities.slice(seniorityIndex)
    return senioritiesFromPotentialHiringManagers
  }

  public getSource(): string {
    if (/indeed/.test(this.url ?? '')) {
      return 'indeed'
    }

    if (/linkedin/.test(this.url ?? '')) {
      return 'linkedin'
    }

    return ''
  }
}