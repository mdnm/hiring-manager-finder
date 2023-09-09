import { MatchResult, Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import dotenv from "dotenv";
import express, { Request, json } from "express";
import { Company, JobOpportunity, Lead } from "./domain";
import {
  findOrganizationPotentialHiringManagers,
  getCompany,
} from "./services/matcher";

dotenv.config();

const app = express();

app.use(json());

app.post(
  "/api/find-matches",
  async (req: Request<{}, any, BrowseAITask>, res) => {
    const body = req.body;
    let prisma: PrismaClient;

    try {
      prisma = new PrismaClient();

      const leads = body.task.capturedLists.Jobs.map<Lead>((job) =>
        mapTaskJobToLead(job, body.task.finishedAt)
      ).filter((lead) => lead.jobOpportunity.title);

      for (const lead of leads) {
        const sameUrlJobOffer = await prisma.jobOffer.findUnique({
          where: {
            url: lead.jobOpportunity.url,
          },
        });

        if (
          sameUrlJobOffer &&
          sameUrlJobOffer.title === lead.jobOpportunity.title &&
          sameUrlJobOffer.description === lead.jobOpportunity.description
        ) {
          continue;
        }

        const existingJobOffer = await prisma.jobOffer.findFirst({
          where: {
            title: lead.jobOpportunity.title,
            description: lead.jobOpportunity.description,
          },
        });

        if (existingJobOffer) {
          continue;
        }

        const company = await getCompany(lead.company.name, prisma);

        const onDbAndWithoutEmployees =
          company?.id && company?.employeeCount === 0;
        const notOnApollo = !company?.id && !company?.domain;

        if (!company || notOnApollo || onDbAndWithoutEmployees) {
          await prisma.$transaction(async (tx) => {
            return await createCompanyNotFoundLead(company, tx, lead);
          });

          continue;
        }

        const { potentialHiringManagers } =
          await findOrganizationPotentialHiringManagers({
            company: company,
            job: lead.jobOpportunity,
            lead: lead,
          });

        const [foundMatch] = potentialHiringManagers;

        if (foundMatch) {
          await prisma.$transaction(async (tx) => {
            return await createLead(company, tx, lead, foundMatch);
          });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          return await createNotFoundLead(company, tx, lead);
        });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }
);

app.get(
  "/api/leads",
  async (
    req: Request<{}, any, any, { page: string; pageSize: string }>,
    res
  ) => {
    const page = parseInt(req.query.page ?? "1");
    const pageSize = parseInt(req.query.pageSize ?? "10");

    let prisma: PrismaClient;

    try {
      prisma = new PrismaClient();

      const leads = await prisma.lead.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          jobOffer: true,
          hiringManager: true,
        },
        where: {
          matchResult: MatchResult.MatchFound,
        },
      });

      return res.status(200).json({ leads });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

app.get("/health", (req, res) => {
  return res.status(200).json({ ok: true });
});

type PrismaTransaction = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type BrowseAIJob = {
  Title: string;
  "Post Link": string;
  Company: string;
  "Company Profile"?: string;
  Location?: string;
  Description: string;
  "Seniority level"?: string;
  "Employment type"?: string;
  "Job function"?: string;
  Industries?: string;
  "time ago"?: string;
};

type BrowseAIRobot = {
  id: string;
  name: string;
};

type BrowseAITask = {
  task: {
    id: string;
    status: string;
    finishedAt: number;
    robotId: string;
    capturedLists: {
      Jobs: BrowseAIJob[];
    };
  };
};

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`> Ready on port ${PORT}`);
});

async function createNotFoundLead(
  company: Company,
  tx: PrismaTransaction,
  lead: Lead
) {
  let companyId = company?.id;

  if (!companyId) {
    const createdCompany = await tx.company.create({
      data: {
        name: lead.company.name,
        website: company.website ?? `https://${company.domain}`,
        staffCount: company.employeeCount,
      },
    });
    companyId = createdCompany.id;
  }

  const createdJobOffer = await tx.jobOffer.create({
    data: {
      title: lead.jobOpportunity.title,
      description: lead.jobOpportunity.description,
      location: lead.jobOpportunity.location,
      url: lead.jobOpportunity.url,
      companyId: companyId,
    },
  });

  const createdLead = await tx.lead.create({
    data: {
      createdAt: new Date(lead.timestamp),
      jobOfferId: createdJobOffer.id,
      matchResult:
        company.employeeCount === 0
          ? MatchResult.CompanyNotFound
          : MatchResult.MatchNotFound,
    },
  });

  return createdLead;
}

async function createLead(
  company: Company,
  tx: PrismaTransaction,
  lead: Lead,
  foundMatch: any
) {
  let companyId = company?.id;

  if (!companyId) {
    const createdCompany = await tx.company.create({
      data: {
        name: lead.company.name,
        website: company.website,
        staffCount: company.employeeCount,
      },
    });

    companyId = createdCompany.id;
  }

  const createdJobOffer = await tx.jobOffer.create({
    data: {
      title: lead.jobOpportunity.title,
      description: lead.jobOpportunity.description,
      location: lead.jobOpportunity.location,
      url: lead.jobOpportunity.url,
      companyId: companyId,
    },
  });

  const hiringManager = await tx.hiringManager.findUnique({
    where: {
      linkedInUrl: foundMatch.linkedinUrl,
    },
  });

  let hiringManagerId = hiringManager?.id;

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
      },
    });

    hiringManagerId = createdHiringManager.id;
  }

  const createdLead = await tx.lead.create({
    data: {
      createdAt: new Date(lead.timestamp),
      jobOfferId: createdJobOffer.id,
      hiringManagerId: hiringManagerId,
      matchResult: MatchResult.MatchFound,
    },
  });

  return createdLead;
}

async function createCompanyNotFoundLead(
  company: Company,
  tx: PrismaTransaction,
  lead: Lead
) {
  let companyId = company?.id;

  if (!companyId) {
    const createdCompany = await tx.company.create({
      data: {
        name: lead.company.name,
      },
    });
    companyId = createdCompany.id;
  }

  const jobOffer = await tx.jobOffer.create({
    data: {
      title: lead.jobOpportunity.title,
      description: lead.jobOpportunity.description,
      location: lead.jobOpportunity.location,
      url: lead.jobOpportunity.url,
      companyId: companyId,
    },
  });

  const createdLead = await tx.lead.create({
    data: {
      createdAt: new Date(lead.timestamp),
      jobOfferId: jobOffer.id,
      matchResult: MatchResult.CompanyNotFound,
    },
  });

  return createdLead;
}

function mapTaskJobToLead(job: BrowseAIJob, finishedAt: number): Lead {
  const jobOpportunity = new JobOpportunity({
    title: job.Title,
    description: job.Description,
    location: job.Location,
    url: job["Post Link"],
    timeSincePublished: job["time ago"],
  });

  const company = new Company({
    name: job.Company,
  });

  const lead = new Lead({
    jobOpportunity,
    company,
    timestamp: new Date(finishedAt).toISOString(),
    alreadyProcessed: false,
    location: job.Location,
  });

  return lead;
}
