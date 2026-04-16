-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing courses to have yesterday's date
UPDATE "Course" SET "createdAt" = CURRENT_TIMESTAMP - INTERVAL '1 day' WHERE "createdAt" = CURRENT_TIMESTAMP;
