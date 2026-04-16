-- CreateTable Transcript
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'vtt',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transcript_courseId_idx" ON "Transcript"("courseId");

-- CreateIndex
CREATE INDEX "Transcript_videoId_idx" ON "Transcript"("videoId");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE;
