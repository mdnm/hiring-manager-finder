import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from 'fs/promises';
import { toAction, toExperienceLevel, toMatchResult, toSource } from "./helpers";
import { AirtableLeadRepository } from './infra/repositories/AirtableLeadRepository';

dotenv.config()

async function populateDatabase() {
  const airtableClient = new AirtableLeadRepository()
  const allLeads = await airtableClient.getAllLeads()

  const prisma = new PrismaClient()

  const companies = []
  const jobOffers = []
  const hiringManagers = []

  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i];

    companies.push({
      name: lead.company_name,
      staffCount: lead.company_staff_count,
      website: lead.company_website,
    })

    jobOffers.push({
      title: lead.job_title,
      description: lead.job_description,
      location: lead.location,
      url: lead.JobURL,
      source: toSource(lead.source),
      experienceLevel: toExperienceLevel(lead.experience_level),
      companyId: null,
    })

    if (lead.employee_profile_url) {
      hiringManagers.push({
        firstName: lead.employee_first_name,
        lastName: lead.employee_last_name,
        email: lead.Email,
        emailStatus: lead['Email Status'],
        linkedInUrl: lead.employee_profile_url,
        jobTitle: lead.employee_job,
        location: lead.employee_location,
        companyId: null,
      })
    }
  }

  await prisma.company.createMany({
    data: companies,
    skipDuplicates: true,
  })
  await fs.writeFile('companies.json', JSON.stringify(companies))
  console.log('companies.json created')

  const dbCompanies = await prisma.company.findMany()

  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i];
    const company = dbCompanies.find(company => company.name === lead.company_name)

    const jobOffer = jobOffers.find(jobOffer => jobOffer.url === lead.JobURL)
    const hiringManager = hiringManagers.find(hiringManager => hiringManager.linkedInUrl === lead.employee_profile_url)

    if (jobOffer) {
      jobOffer.companyId = company?.id
    }

    if (hiringManager) {
      hiringManager.companyId = company?.id
    }
  }

  await fs.writeFile('jobOffers.json', JSON.stringify(jobOffers))
  console.log('jobOffers.json created')

  await fs.writeFile('hiringManagers.json', JSON.stringify(hiringManagers))
  console.log('hiringManagers.json created')

  await prisma.jobOffer.createMany({
    data: jobOffers,
    skipDuplicates: true,
  })

  const dbJobOffers = await prisma.jobOffer.findMany()

  await prisma.hiringManager.createMany({
    data: hiringManagers.filter(hiringManager => hiringManager.companyId),
    skipDuplicates: true,
  })

  const dbHiringManagers = await prisma.hiringManager.findMany()

  const leads = dbJobOffers.map(jobOffer => {
    const lead = allLeads.find(lead => jobOffer.url === lead.JobURL)
    if (!lead) {
      return null
    }

    const hiringManager = dbHiringManagers.find(hiringManager => hiringManager.linkedInUrl === lead.employee_profile_url)

    return {
      actionName: toAction(lead.action_name),
      createdAt: new Date(lead.timestamp),
      jobOfferId: jobOffer?.id,
      hiringManagerId: hiringManager?.id,
      matchResult: toMatchResult(lead.company_employee_search_source)
    }
  }).filter(Boolean)

  await fs.writeFile('leads.json', JSON.stringify(leads))
  console.log('leads.json created')

  await prisma.lead.createMany({
    data: leads,
    skipDuplicates: true,
  })
}

populateDatabase()