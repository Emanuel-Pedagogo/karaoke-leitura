-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('LOGIN', 'REGISTER', 'READING_STARTED', 'READING_SAVED', 'AI_EVALUATION_OK', 'AI_EVALUATION_FAILED', 'OFFLINE_SYNC', 'APP_ERROR');

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "role" "UserRole",
    "source" "PilotFeedbackSource" NOT NULL,
    "appVersion" TEXT,
    "type" "UsageEventType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageEvent_type_idx" ON "UsageEvent"("type");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");
