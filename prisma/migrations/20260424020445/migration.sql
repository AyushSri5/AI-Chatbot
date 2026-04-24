-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_courseId_fkey";

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
