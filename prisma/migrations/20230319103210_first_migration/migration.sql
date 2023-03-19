-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('Internship', 'Associate', 'EntryLevel', 'MidSeniorLevel', 'Director', 'Executive');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('LinkedIn', 'Indeed', 'Monster');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('MatchFound', 'MatchNotFound', 'CompanyNotFound');

-- CreateEnum
CREATE TYPE "Actions" AS ENUM ('AutoUp', 'J2BDMarketing', 'J2BDChefSecteur', 'J2BDSalesHead', 'J2BDLogistics', 'J2BDHRManager', 'DigitalOrbisIT', 'DigitalOrbisFinance');

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "experienceLevel" "ExperienceLevel",
    "source" "Source" NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "staffCount" INTEGER NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiringManager" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailStatus" TEXT NOT NULL,
    "linkedInUrl" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "HiringManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "matchResult" "MatchResult" NOT NULL,
    "actionName" "Actions" NOT NULL,
    "jobOfferId" INTEGER NOT NULL,
    "hiringManagerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringManager" ADD CONSTRAINT "HiringManager_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "HiringManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
