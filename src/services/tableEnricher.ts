import { MatchResult, PrismaClient, Source } from "@prisma/client";
import { toAction } from "../helpers";
import { FetchHTTPClient } from '../infra/http/FetchHTTPClient';
import { AirtableLeadRepository } from '../infra/repositories/AirtableLeadRepository';
import { findOrganizationPotentialHiringManagers, getCompany } from "../services/matcher";


const airtableViewsMap: Record<string, string> = {
  'AutoUp': 'viwTCY5Ia7wnF28Ys',
  'J2BD': 'viwfSQBRMuwk4mCwj',
  'DigitalOrbis': 'viwZiGDRXPW8tETwO',
}

const ALL_UNMATCHED_LEADS_VIEW = 'viwbLkS6ubnpaRxmx'

export async function enrichAirtable(action?: string) {
  const actionName = action || process.argv.slice(2)[0]
  const viewId = airtableViewsMap[actionName] ?? ALL_UNMATCHED_LEADS_VIEW

  const airtableClient = new AirtableLeadRepository({
    viewId
  })
  const leads = await airtableClient.getLeads()
  const prisma = new PrismaClient()
  const fetchClient = new FetchHTTPClient()

  for (let i = 0; i < leads.length; i++) {
    try {
    const lead = leads[i]

    if (lead.alreadyProcessed) {
     continue;
    }

    if (!lead.jobOpportunity.title) {
      console.log(`Lead ${lead.id} has no title`)
      await fetchClient.delete(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, process.env.AIRTABLE_API_KEY)
      continue;
    }

    const sameUrlJobOffer = await prisma.jobOffer.findUnique({
      where: {
        url: lead.jobOpportunity.url
      }
    })

    if ((sameUrlJobOffer && sameUrlJobOffer.title === lead.jobOpportunity.title && sameUrlJobOffer.description === lead.jobOpportunity.description)) {
      console.log(`Lead ${lead.jobOpportunity.title} has same url`)
      await fetchClient.delete(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, process.env.AIRTABLE_API_KEY)
      continue;
    }

    const existingJobOffer = await prisma.jobOffer.findFirst({
      where: {
        title: lead.jobOpportunity.title,
        description: lead.jobOpportunity.description,
        Company: {
          name: lead.company.name
        }
      }
    })

    if (existingJobOffer) {
      await fetchClient.delete(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, process.env.AIRTABLE_API_KEY)
      console.log(`Lead ${lead.jobOpportunity.title} already exists`)
      continue
    }

    const company = await getCompany(lead.company.name, prisma)
    const source = lead.jobOpportunity.getSource()

    const onDbAndWithoutEmployees = company?.id && company?.employeeCount === 0
    const notOnApollo = !company?.id && !company?.domain
    if (!company || (notOnApollo) || (onDbAndWithoutEmployees)) {
      await fetchClient.patch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
        fields: {
          company_employee_search_source: `Mateus API (Company not found)`,
          company_staff_count: 0,
          source
        }
      }, process.env.AIRTABLE_API_KEY)

      await prisma.$transaction(async (tx) => {
        let companyId = company?.id

        if (!companyId) {
          const createdCompany = await tx.company.create({
            data: {
              name: lead.company.name
            }
          })
          companyId = createdCompany.id
        }

        const jobOffer = await tx.jobOffer.upsert({
          create: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            url: lead.jobOpportunity.url,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          update: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          where: {
            url: lead.jobOpportunity.url,
          }
        })

        const createdLead = await tx.lead.create({
          data: {
            actionName: toAction(lead.action),
            createdAt: new Date(lead.timestamp),
            jobOfferId: jobOffer.id,
            matchResult: MatchResult.CompanyNotFound
          }
        })

        return createdLead
      })

      console.log(`Finished ${i + 1} of ${leads.length} records`)

      continue
    }

    const { potentialHiringManagers, apolloQueryUsed } = await findOrganizationPotentialHiringManagers({
      company: company,
      job: lead.jobOpportunity,
      lead: lead,
      source
    });

    const [foundMatch] = potentialHiringManagers

    if (foundMatch) {
      await fetchClient.patch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
        fields: {
          Email: foundMatch.email ?? '',
          "Email Status": foundMatch.emailStatus ?? '',
          employee_profile_url: foundMatch.linkedinUrl ?? '',
          employee_full_name: foundMatch.name ?? '',
          employee_first_name: foundMatch.firstName ?? '',
          employee_last_name: foundMatch.lastName ?? '',
          employee_job: foundMatch.title ?? '',
          employee_location: foundMatch.location ?? '',
          company_employee_search_source: "Mateus API",
          company_website: company.website ?? `https://${company.domain}`,
          company_staff_count: company.employeeCount,
          source
        }
      }, process.env.AIRTABLE_API_KEY)

      await prisma.$transaction(async (tx) => {
        let companyId = company?.id

        if (!companyId) {
          const createdCompany = await tx.company.create({
            data: {
              name: lead.company.name,
              website: company.website,
              staffCount: company.employeeCount,
            }
          })

          companyId = createdCompany.id
        }

        const createdJobOffer = await tx.jobOffer.upsert({
          create: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            url: lead.jobOpportunity.url,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          update: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          where: {
            url: lead.jobOpportunity.url,
          }
        })

        const hiringManager = await tx.hiringManager.findUnique({
          where: {
            linkedInUrl: foundMatch.linkedinUrl,
          }
        })

        let hiringManagerId = hiringManager?.id

        if (!hiringManagerId) {
          const createdHiringManager = await tx.hiringManager.create({
            data: {
              firstName: foundMatch.firstName,
              lastName: foundMatch.lastName,
              email: foundMatch.email,
              emailStatus: foundMatch.emailStatus,
              linkedInUrl: foundMatch.linkedinUrl,
              jobTitle: foundMatch.title,
              location: foundMatch.location,
              companyId: companyId,
            }
          })

          hiringManagerId = createdHiringManager.id
        }

        const createdLead = await tx.lead.create({
          data: {
            actionName: toAction(lead.action),
            createdAt: new Date(lead.timestamp),
            jobOfferId: createdJobOffer.id,
            hiringManagerId: hiringManagerId,
            matchResult: MatchResult.MatchFound
          }
        })

        return createdLead
      })

    } else {
      await fetchClient.patch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
        fields: {
          company_employee_search_source: `Mateus API (${company.employeeCount === 0 ? 'Company not found' : 'No match found'})`,
          company_website: company.website ?? `https://${company.domain}`,
          company_staff_count: company.employeeCount,
          source
        }
      }, process.env.AIRTABLE_API_KEY)

      await prisma.$transaction(async (tx) => {
        let companyId = company?.id

        if (!companyId) {
          const createdCompany = await tx.company.create({
            data: {
              name: lead.company.name,
              website: company.website ?? `https://${company.domain}`,
              staffCount: company.employeeCount,
            }
          })
          companyId = createdCompany.id
        }

        const createdJobOffer = await tx.jobOffer.upsert({
          create: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            url: lead.jobOpportunity.url,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          update: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
            location: lead.jobOpportunity.location,
            source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
            companyId: companyId,
          },
          where: {
            url: lead.jobOpportunity.url,
          }
        })

        const createdLead = await tx.lead.create({
          data: {
            actionName: toAction(lead.action),
            createdAt: new Date(lead.timestamp),
            jobOfferId: createdJobOffer.id,
            matchResult: company.employeeCount === 0 ? MatchResult.CompanyNotFound : MatchResult.MatchNotFound
          }
        })

        return createdLead
      })
    }

    console.log(`Finished ${i + 1} of ${leads.length} records`)

    await new Promise(resolve => setTimeout(resolve, 500));
  }
    catch (e) {
      console.log('error', e.message ?? e)
    }
  }
}