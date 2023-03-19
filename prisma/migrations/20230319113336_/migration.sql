/*
  Warnings:

  - A unique constraint covering the columns `[name,website]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[linkedInUrl]` on the table `HiringManager` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `JobOffer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "website" DROP NOT NULL,
ALTER COLUMN "staffCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "HiringManager" ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "emailStatus" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_website_key" ON "Company"("name", "website");

-- CreateIndex
CREATE UNIQUE INDEX "HiringManager_linkedInUrl_key" ON "HiringManager"("linkedInUrl");

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_url_key" ON "JobOffer"("url");
