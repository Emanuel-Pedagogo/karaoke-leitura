-- CreateEnum
CREATE TYPE "PilotFeedbackSource" AS ENUM ('WEB', 'MOBILE');

-- CreateTable
CREATE TABLE "PilotFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "role" "UserRole",
    "source" "PilotFeedbackSource" NOT NULL,
    "appVersion" TEXT,
    "screen" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "internetQuality" TEXT,
    "aiWorked" BOOLEAN,
    "readingWorked" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotFeedback_pkey" PRIMARY KEY ("id")
);
