ALTER TABLE "ReadingSession" ADD COLUMN "clientSessionId" TEXT;
CREATE UNIQUE INDEX "ReadingSession_clientSessionId_key" ON "ReadingSession"("clientSessionId");
