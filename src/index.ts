import { HiringManager, PotentialMatch, PrismaClient } from '@prisma/client';
import dotenv from "dotenv";
import { Company, JobOpportunity } from './domain';
const prisma = new PrismaClient()
dotenv.config()

async function main({ searchedCompanyName  }:{ searchedCompanyName?: string; }) {
    await prisma.$connect()
    const airtableView = 'viwTCY5Ia7wnF28Ys'

    const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/listRecords`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`
      },
      body: JSON.stringify({
        view: airtableView,
        fields: ["job_title", "job_id", "action_name", "company_name", "job_description", "location"]
      })
    })

    const airtableData = await airtableResponse.json()

    await prisma.potentialMatch.deleteMany({})
    
    for (let i = 0; i < airtableData.records.length; i++) {
      const row = airtableData.records[i].fields;
      const rowId = airtableData.records[i].id

      const job = new JobOpportunity({
        title: row.job_title,
        description: row.job_description,
        location: row.location,
      })
      
      const company = await getCompany(row.company_name)

      const potentialMatch: Omit<PotentialMatch, 'id' | 'createdAt'> = {
        actionName: row.action_name,
        job: job,
        company: company,
        potentialHiringManagers: [],
        apolloQueryUsed: '',
        foundMatch: false,
        reasonForNoMatch: null
      }
  
      if (!company || !company.domain) {
        await prisma.potentialMatch.create({
          data: {
            ...potentialMatch,
            reasonForNoMatch: 'Company not found'
          }
        })

        const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${rowId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`
          },
          body: JSON.stringify({
              fields: {
                company_employee_search_source: `Mateus API (Company not found)`,
                company_staff_count: 0,
              }
          }),
        }) 
        continue
      }

      const { potentialHiringManagers, apolloQueryUsed } = await findOrganizationPotentialHiringManagers({
        company: company,
        job: job,
      });

      if (potentialHiringManagers.length === 0) {
        await prisma.potentialMatch.create({
          data: {
            ...potentialMatch,
            apolloQueryUsed,
            foundMatch: false,
            reasonForNoMatch: company.employeeCount === 0 ? 'Company not found' : 'No potential hiring managers found'
          }
        })
      } else { 
        await prisma.potentialMatch.create({
          data: {
            ...potentialMatch,
            potentialHiringManagers,
            apolloQueryUsed,
            foundMatch: true
          }
        })
      }

      const [foundMatch] = potentialHiringManagers
      console.log(foundMatch)

      if (foundMatch) {
        const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${rowId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`
          },
          body: JSON.stringify({
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
                company_website: `https://${company.domain}`,
                company_staff_count: company.employeeCount,
              }
          }),
        }) 

        // const airtableData = await airtableResponse.json()
        // console.log(airtableData)
      } else {
        const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${rowId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`
          },
          body: JSON.stringify({
              fields: {
                company_employee_search_source: `Mateus API (${company.employeeCount === 0 ? 'Company not found' : 'No match found'})`,
                company_website: `https://${company.domain}`,
                company_staff_count: company.employeeCount,
              }
          }),
        }) 
      }

      console.log(`Finished ${i + 1} of ${airtableData.records.length} records`)
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  await prisma.$disconnect()
}

main({
  searchedCompanyName: "Mountain Racing Products"
})

const USStates: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "District Of Columbia",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
}

async function findOrganizationPotentialHiringManagers({ company, job }: { company: Company, job: JobOpportunity }): Promise<{
  potentialHiringManagers: HiringManager[];
  apolloQueryUsed: string;
}> {
  const apolloQuery: {
    person_department_or_subdepartments?: string[];
    person_seniorities?: string[];
    person_locations?: string[];
    q_keywords?: string;
  } = {
    person_department_or_subdepartments: ["executive", "founder", "sales_executive", "master_sales"],
    person_locations: ['United States']
  }

  apolloQuery.person_seniorities = job.getPossibleManagerSeniorities()

  const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.APOLLO_API_KEY,
      page: 1,
      q_organization_domains: company.domain,
      ...apolloQuery
    }),
  });

  const data = await response.json();

  if (data.people && data.people.length > 0) {
    const potentialHiringManagers = (data.people as any[]).map<HiringManager>(person => ({
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

    const jobTitleTerms = job.title.split(" ")
    const jobLocations = job.location.split(",").map(location => location.replace(/[^a-zA-Z\s]/g, '')).map(location => location.trim()).filter(location => location !== 'Remote' && location !== 'United States').map(location => location.length === 2 ? USStates[location] : location)

    console.log(jobLocations)

    return {
      potentialHiringManagers: potentialHiringManagers.sort((a, b) => {
        let aPoints = 0;
        let bPoints = 0;
  
        if (a.departments.includes('master_sales') || a.departments.includes('sales_executive')) {
          aPoints += 1.5;
        }

        if (a.departments.length > 1 && (!a.departments.includes('master_sales') || !a.departments.includes('sales_executive'))) {
          aPoints -= 1;
        }

        if (b.departments.includes('master_sales') || b.departments.includes('sales_executive')) {
          bPoints += 1.5;
        }

        if (b.departments.length > 1 && (!b.departments.includes('master_sales') || !b.departments.includes('sales_executive'))) {
          bPoints -= 1;
        }
        
        if (company.employeeCount < 50) {
          if (a.title.includes('CEO')) {
            aPoints += 0.2;
          }
          if (b.title.includes('CEO')) {
            bPoints += 0.2;
          }
        }
 
        jobTitleTerms.forEach(term => {
          if (a.title.includes(term)) {
            aPoints += 1.5;
          }
          
          if (b.title.includes(term)) {
            bPoints += 1.5;
          }
        })

        jobLocations.forEach(location => {
          if (a.location.includes(location)) {
            aPoints += 0.5;
          }

          if (b.location.includes(location)) {
            bPoints += 0.5;
          }
        })

        return bPoints - aPoints;
      }),
      apolloQueryUsed: JSON.stringify(apolloQuery)
    };
  }

  return {
    potentialHiringManagers: [],
    apolloQueryUsed: JSON.stringify(apolloQuery)
  };
}

async function getCompany(companyName: string): Promise<Company | undefined> {
  const companyResponse = await fetch(`https://app.apollo.io/api/v1/organizations/search`, {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.APOLLO_API_KEY,
      q_organization_fuzzy_name: companyName,
    }),
    method: "POST"
  });

  
  const companyData = await companyResponse.json();

  const fetchedCompany = companyData.organizations[0];

  if (fetchedCompany) {
    return new Company({
      name: fetchedCompany.name,
      domain: fetchedCompany.primary_domain,
      employeeCount: fetchedCompany.estimated_num_employees,
    })
  }
}