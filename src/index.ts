import { MatchResult, PrismaClient, Source } from "@prisma/client";
import dotenv from "dotenv";
import express, { Request } from 'express';
import { Company, JobOpportunity, Lead } from './domain';
import { toAction } from "./helpers";
import { FetchHTTPClient } from './infra/http/FetchHTTPClient';
import { findOrganizationPotentialHiringManagers, getCompany } from "./services/matcher";

dotenv.config()

const app = express()

app.post("/api/apollo", async (req: Request<{}, any, BrowseAITask>, res) => {
  const body = req.body;

  try {
    const fetchClient = new FetchHTTPClient();
    const prisma = new PrismaClient();

    const { robot } = await fetchClient.get<{ robot: BrowseAIRobot }>(`https://api.browse.ai/v2/robots/${body.task.robotId}`, process.env.BROWSE_AI_API_KEY);

    const leads = body.task.capturedLists.Jobs.map<Lead>(job => {
      const jobOpportunity = new JobOpportunity({
        title: job.Title,
        description: job.Description,
        location: job.Location,
        url: job["Post Link"],
      })

      const company = new Company({
        name: job.Company,
      })

      const lead = new Lead({
        action: robot.name,
        jobOpportunity,
        company,
        timestamp: new Date(body.task.finishedAt).toISOString(),
        alreadyProcessed: false,
      })

      return lead
    }).filter(lead => lead.jobOpportunity.title)

    const airtableLeads = []

    for (const lead of leads) {
      const existingJobOffer = await prisma.jobOffer.findUnique({
        where: {
          url: lead.jobOpportunity.url
        }
      })

      if (existingJobOffer && lead.jobOpportunity.title === existingJobOffer.title && lead.jobOpportunity.description === existingJobOffer.description) {
        continue;
      }

      const company = await getCompany(lead.company.name, prisma);
      const source = lead.jobOpportunity.getSource()

      const onDbAndWithoutEmployees = company?.id && company?.employeeCount === 0
      const notOnApollo = !company?.id && !company?.domain

      if (!company || (notOnApollo) || (onDbAndWithoutEmployees)) {
        airtableLeads.push({
          fields: {
            job_title: lead.jobOpportunity.title,
            company_name: lead.company.name,
            timestamp: lead.timestamp,
            action_name: lead.action,
            JobURL: lead.jobOpportunity.url,
            location: lead.jobOpportunity.location,
            source,
            company_employee_search_source: `Mateus API (Company not found)`,
            company_staff_count: 0,
          }
        })

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

          const jobOffer = await tx.jobOffer.create({
            data: {
              title: lead.jobOpportunity.title,
              description: lead.jobOpportunity.description,
              location: lead.jobOpportunity.location,
              url: lead.jobOpportunity.url,
              source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
              companyId: companyId,
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

        continue
      }

      const { potentialHiringManagers } = await findOrganizationPotentialHiringManagers({
        company: company,
        job: lead.jobOpportunity,
        lead: lead,
        source
      });

      const [foundMatch] = potentialHiringManagers

      if (foundMatch) {
        airtableLeads.push({
          fields: {
            job_title: lead.jobOpportunity.title,
            company_name: lead.company.name,
            timestamp: lead.timestamp,
            action_name: lead.action,
            JobURL: lead.jobOpportunity.url,
            location: lead.jobOpportunity.location,
            Email: foundMatch.email ?? '',
            "Email Status": foundMatch.emailStatus ?? '',
            employee_profile_url: foundMatch.linkedinUrl ?? '',
            employee_full_name: foundMatch.name ?? '',
            employee_first_name: foundMatch.firstName ?? '',
            employee_last_name: foundMatch.lastName ?? '',
            employee_job: foundMatch.title ?? '',
            employee_location: foundMatch.location ?? '',
            company_employee_search_source: `Mateus API`,
            company_website: company.website ?? `https://${company.domain}`,
            company_staff_count: company.employeeCount,
            source,
          }
        })

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

          const createdJobOffer = await tx.jobOffer.create({
            data: {
              title: lead.jobOpportunity.title,
              description: lead.jobOpportunity.description,
              location: lead.jobOpportunity.location,
              url: lead.jobOpportunity.url,
              source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
              companyId: companyId,
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
        airtableLeads.push({
          fields: {
            job_title: lead.jobOpportunity.title,
            company_name: lead.company.name,
            timestamp: lead.timestamp,
            action_name: lead.action,
            JobURL: lead.jobOpportunity.url,
            location: lead.jobOpportunity.location,
            source,
            company_employee_search_source: `Mateus API (${company.employeeCount === 0 ? 'Company not found' : 'No match found'})`,
            company_website: company.website ?? `https://${company.domain}`,
            company_staff_count: company.employeeCount,
          }
        })

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

          const createdJobOffer = await tx.jobOffer.create({
            data: {
              title: lead.jobOpportunity.title,
              description: lead.jobOpportunity.description,
              location: lead.jobOpportunity.location,
              url: lead.jobOpportunity.url,
              source: source === 'linkedin' ? Source.LinkedIn : source === 'indeed' ? Source.Indeed : undefined,
              companyId: companyId,
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
    }

    const airtableLeadsChunks = chunk(airtableLeads, 10)

    for (const airtableLeadsChunk of airtableLeadsChunks) {
      await fetchClient.post(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/`, {
        records: airtableLeadsChunk
      }, process.env.AIRTABLE_API_KEY)

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
})

function chunk<T>(array: T[], size: number) {
  const chunkedArray = [];

  let index = 0;
  while (index < array.length) {
    chunkedArray.push(array.slice(index, size + index).filter(Boolean));
    index += size;
  }

  return chunkedArray;
}

type BrowseAIRobot = {
  id: string,
  name: string,
}

type BrowseAITask = {
  task: {
    id: string
    status: string,
    finishedAt: number,
    robotId: string,
    capturedLists: {
      Jobs: {
        "Title": string,
        "Post Link": string,
        Company: string,
        "Company Profile"?: string,
        Location?: string,
        Description: string,
        "Seniority level"?: string,
        "Employment type"?: string,
        "Job function"?: string,
        Industries?: string,
      }[]
    }
  }  
}

app.listen(process.env.PORT || 3000, () => {
  console.log("> Ready on http://localhost:3000");
})