export class Company {
  id: number | null
  name: string | null
  employeeCount: number | null
  domain: string | null
  website: string | null

  constructor({ id, name, employeeCount, domain, website }: { id?: number, name?: string, employeeCount?: number, domain?: string, website?: string }) {
    this.id = id ?? null
    this.name = name ?? null
    this.employeeCount = employeeCount ?? null
    this.domain = domain ?? null
    this.website = website ?? null
  }
}