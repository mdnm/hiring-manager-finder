"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const domain_1 = require("./domain");
const Lead_1 = require("./domain/Lead");
const AirtableLeadRepository_1 = require("./infra/repositories/AirtableLeadRepository");
dotenv_1.default.config();
async function main() {
    const airtableClient = new AirtableLeadRepository_1.AirtableLeadRepository();
    const leads = await airtableClient.getLeads();
    const alreadyProcessedLeads = new Set();
    for (let i = 0; i < 100; i++) {
        const lead = leads[i];
        if (lead.jobOpportunity.getPossibleManagerSeniorities().length === 0 || !lead.jobOpportunity.title) {
            continue;
        }
        if (lead.departments.length === 0) {
            continue;
        }
        const leadId = `${lead.jobOpportunity.title}-${lead.jobOpportunity.description}-${lead.jobOpportunity.location}-${lead.action}`;
        if (alreadyProcessedLeads.has(leadId)) {
            continue;
        }
        alreadyProcessedLeads.add(leadId);
        const company = await getCompany(lead.company.name);
        if (!company || !company.domain) {
            const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`
                },
                body: JSON.stringify({
                    fields: {
                        company_employee_search_source: `Mateus API (Company not found)`,
                        company_staff_count: 0,
                        source: lead.jobOpportunity.getSource()
                    }
                }),
            });
            continue;
        }
        const { potentialHiringManagers, apolloQueryUsed } = await findOrganizationPotentialHiringManagers({
            company: company,
            job: lead.jobOpportunity,
            lead: lead,
        });
        const [foundMatch] = potentialHiringManagers;
        if (foundMatch) {
            const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
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
                        source: lead.jobOpportunity.getSource()
                    }
                }),
            });
        }
        else {
            const airtableResponse = await fetch(`https://api.airtable.com/v0/app03KmZkL6KyuLTk/tblqaJ6uGTxsYnyMg/${lead.id}`, {
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
                        source: lead.jobOpportunity.getSource()
                    }
                }),
            });
        }
        console.log(`Finished ${i + 1} of ${leads.length} records`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    //await prisma.$disconnect()
}
const USStates = {
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
};
async function findOrganizationPotentialHiringManagers({ company, job, lead }) {
    const apolloQuery = {};
    apolloQuery.person_locations = lead.location;
    apolloQuery.person_department_or_subdepartments = lead.departments;
    apolloQuery.person_seniorities = job.getPossibleManagerSeniorities();
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
        }));
        if (potentialHiringManagers.length === 1) {
            return {
                potentialHiringManagers,
                apolloQueryUsed: JSON.stringify(apolloQuery)
            };
        }
        const jobTitleTerms = job.title?.split(" ");
        const jobLocations = job.location?.split(",").map(location => location.replace(/[^a-zA-Z\s]/g, '')).map(location => location.trim()).filter(location => location !== 'Remote' && location !== lead.location[0]) ?? []; //.map(location => location.length === 2 ? USStates[location] : location) ?? []
        const actionDepartments = Lead_1.actionDepartmentMap[lead.action];
        return {
            potentialHiringManagers: potentialHiringManagers?.sort((a, b) => {
                let aPoints = 0;
                let bPoints = 0;
                const aIsFromDepartment = actionDepartments.some(department => a.departments?.includes(department));
                const bIsFromDepartment = actionDepartments.some(department => b.departments?.includes(department));
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
                jobTitleTerms.forEach(term => {
                    if (a.title?.includes(term)) {
                        aPoints += 0.5;
                    }
                    if (b.title?.includes(term)) {
                        bPoints += 0.5;
                    }
                });
                jobLocations.forEach(location => {
                    if (a.location?.includes(location)) {
                        aPoints += 0.5;
                    }
                    if (b.location?.includes(location)) {
                        bPoints += 0.5;
                    }
                });
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
async function getCompany(companyName) {
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
        return new domain_1.Company({
            name: fetchedCompany.name,
            domain: fetchedCompany.primary_domain,
            employeeCount: fetchedCompany.estimated_num_employees,
        });
    }
}
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let body = Buffer.alloc(0);
        req.on("data", (chunk) => {
            body = Buffer.concat([body, chunk]);
        });
        req.on("end", () => {
            resolve(body);
        });
        req.on("error", (err) => {
            reject(err);
        });
    });
}
const server = (0, http_1.createServer)(async (req, res) => {
    const { method, url } = req;
    if (method === "POST" && url === "/api/apollo") {
        const body = await getRawBody(req);
        console.log(body.toString());
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ name: "John Doe" }));
});
server.listen(process.env.PORT || 3000, () => {
    console.log("> Ready on http://localhost:3000");
});
//# sourceMappingURL=index.js.map