-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('Internship', 'Associate', 'EntryLevel', 'MidSeniorLevel', 'Director', 'Executive');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('MatchFound', 'MatchNotFound', 'CompanyNotFound');

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "url" TEXT NOT NULL,
    "timeSincePublished" TEXT,
    "experienceLevel" "ExperienceLevel",
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "staffCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringManager" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "jobTitle" TEXT,
    "email" TEXT,
    "emailStatus" TEXT,
    "linkedInUrl" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "HiringManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "matchResult" "MatchResult" NOT NULL,
    "jobOfferId" INTEGER NOT NULL,
    "hiringManagerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_url_key" ON "JobOffer"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_website_key" ON "Company"("name", "website");

-- CreateIndex
CREATE UNIQUE INDEX "HiringManager_linkedInUrl_key" ON "HiringManager"("linkedInUrl");

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringManager" ADD CONSTRAINT "HiringManager_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "HiringManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
