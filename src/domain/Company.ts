export class Company {
  name: string | null
  employeeCount: number | null
  domain: string | null

  constructor({ name, employeeCount, domain }: {name?: string, employeeCount?: number, domain?: string}) {
    this.name = name ?? null
    this.employeeCount = employeeCount ?? null
    this.domain = domain ?? null
  }
}