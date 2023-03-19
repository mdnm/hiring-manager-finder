import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { Company, JobOpportunity, Lead } from '../domain';
import { actionDepartmentMap } from '../domain/Lead';
import { USStates } from "../helpers";
import { FetchHTTPClient } from '../infra/http/FetchHTTPClient';

dotenv.config()

export async function findOrganizationPotentialHiringManagers({ company, job, lead, source }: { company: Company, job: JobOpportunity, lead: Lead, source: string }): Promise<{
  potentialHiringManagers: any[];
  apolloQueryUsed: string;
}> {
  const apolloQuery: {
    person_department_or_subdepartments?: string[];
    person_seniorities?: string[];
    person_locations?: string[];
    q_keywords?: string;
  } = {}

  apolloQuery.person_locations = lead.location
  apolloQuery.person_department_or_subdepartments = lead.departments
  apolloQuery.person_seniorities = job.getPossibleManagerSeniorities()

  const fetchClient = new FetchHTTPClient()

  const data = await fetchClient.post<{
    people: {
      first_name: string;
      last_name: string;
      email?: string;
      email_status: string;
      linkedin_url: string;
      name: string;
      title?: string;
      city?: string;
      state?: string;
      country?: string;
      departments?: string[];
    }[]
  }>("https://api.apollo.io/v1/mixed_people/search", {
    api_key: process.env.APOLLO_API_KEY,
    page: 1,
    q_organization_domains: company.domain,
    ...apolloQuery
  })

  if (data.people && data.people.length > 0) {
    const potentialHiringManagers = data.people.map(person => ({
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      emailStatus: person.email_status,
      linkedinUrl: person.linkedin_url,
      name: person.name,
      title: person.title,
      location: (person.city || person.state || person.country) && `${person.city ? `${person.city}, ` : ''}${person.state ? `${person.state}, ` : ''}${person.country || ''}`,
      departments: person.departments
    }))

    if (potentialHiringManagers.length === 1) {
      return {
        potentialHiringManagers,
        apolloQueryUsed: JSON.stringify(apolloQuery)
      };
    }

    let jobLocations = job.location?.split(",").map(location => location.replace(/[^a-zA-Z\s]/g, '')).map(location => location.trim()).filter(location => location !== 'Remote' && location !== lead.location[0]) 
    
    if (lead.location[0] === 'United States' && source === 'indeed') {
      jobLocations = jobLocations.map(location => location.length === 2 ? USStates[location] : location) ?? []
    }
    
    const actionDepartments = actionDepartmentMap[lead.action]

    return {
      potentialHiringManagers: potentialHiringManagers?.sort((a, b) => {
        let aPoints = 0;
        let bPoints = 0;

        const aIsFromDepartment = actionDepartments.some(department => a.departments?.includes(department))
        const bIsFromDepartment = actionDepartments.some(department => b.departments?.includes(department))
        if (aIsFromDepartment) {
          aPoints += 1.5;
        }

        if (a.departments?.length > 1 && !aIsFromDepartment) {
          aPoints -= 1;
        }

        if (bIsFromDepartment) {
          bPoints += 1.5;
        }

        if (b.departments?.length > 1 && !bIsFromDepartment) {
          bPoints -= 1;
        }

        if (company.employeeCount < 50) {
          if (a.title?.includes('CEO') || a.departments?.includes('founder')) {
            aPoints += 0.2;
          }
          if (b.title?.includes('CEO') || b.departments?.includes('founder')) {
            bPoints += 0.2;
          }
        }

        if (job.description?.includes(a.title)) {
          aPoints += 2;
        }

        if (job.description?.includes(b.title)) {
          bPoints += 2;
        }

        jobLocations.forEach(location => {
          if (a.location?.includes(location)) {
            aPoints += 0.5;
          }

          if (b.location?.includes(location)) {
            bPoints += 0.5;
          }
        })

        return bPoints - aPoints;
      }) ?? [],
      apolloQueryUsed: JSON.stringify(apolloQuery)
    };
  }

  return {
    potentialHiringManagers: [],
    apolloQueryUsed: JSON.stringify(apolloQuery)
  };
}

export async function getCompany(companyName: string, prisma: PrismaClient): Promise<Company | undefined> {
  const dbCompany = await prisma.company.findFirst({
    where: {
      name: companyName
    }
  })

  if (dbCompany?.website) {
    return new Company({
      id: dbCompany.id,
      name: dbCompany.name,
      website: dbCompany.website,
      employeeCount: dbCompany.staffCount
    })
  }

  const fetchClient = new FetchHTTPClient();

  const apolloResult = await fetchClient.post<{
    organizations: { name: string, primary_domain: string, estimated_num_employees: number }[]
  }>(`https://api.apollo.io/v1/organizations/search`, {
    api_key: process.env.APOLLO_API_KEY,
    q_organization_fuzzy_name: companyName,
  })

  const [company] = apolloResult.organizations;
  if (company) {
    return new Company({
      name: company.name,
      domain: company.primary_domain,
      employeeCount: company.estimated_num_employees,
    })
  }
}