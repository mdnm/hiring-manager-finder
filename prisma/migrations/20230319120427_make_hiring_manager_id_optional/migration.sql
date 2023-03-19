-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_hiringManagerId_fkey";

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "hiringManagerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "HiringManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
