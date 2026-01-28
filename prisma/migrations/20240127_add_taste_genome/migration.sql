-- Add TasteGenome model for THE TWELVE system
-- This extends the existing ConstellationProfile without breaking backwards compatibility

-- Add new fields to ConstellationProfile for THE TWELVE
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "designation" VARCHAR(4);
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "glyph" VARCHAR(16);
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "sigil" VARCHAR(32);
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "sigilRevealed" BOOLEAN DEFAULT false;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "primaryConfidence" FLOAT DEFAULT 0;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "secondaryDesignation" VARCHAR(4);
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "secondaryConfidence" FLOAT DEFAULT 0;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "dimensionScores" JSONB;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "contextScores" JSONB;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "genomeVersion" INTEGER DEFAULT 1;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "totalSignals" INTEGER DEFAULT 0;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "signalBreakdown" JSONB;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "lastDriftCheck" TIMESTAMP;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "driftDetected" BOOLEAN DEFAULT false;
ALTER TABLE "ConstellationProfile" ADD COLUMN IF NOT EXISTS "migratedToTwelve" BOOLEAN DEFAULT false;

-- Create index for THE TWELVE designations
CREATE INDEX IF NOT EXISTS "ConstellationProfile_designation_idx" ON "ConstellationProfile"("designation");
CREATE INDEX IF NOT EXISTS "ConstellationProfile_glyph_idx" ON "ConstellationProfile"("glyph");

-- Create table for storing profiling stage progress
CREATE TABLE IF NOT EXISTS "ProfilingProgress" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE,
  "currentStage" TEXT NOT NULL DEFAULT 'initial',
  "stagesCompleted" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "signalCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfilingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProfilingProgress_userId_idx" ON "ProfilingProgress"("userId");
CREATE INDEX IF NOT EXISTS "ProfilingProgress_currentStage_idx" ON "ProfilingProgress"("currentStage");

-- Create table for storing signal history (for temporal decay)
CREATE TABLE IF NOT EXISTS "SignalHistory" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "signalData" JSONB NOT NULL,
  "weight" FLOAT NOT NULL DEFAULT 1.0,
  "decayedWeight" FLOAT,
  "processed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SignalHistory_userId_idx" ON "SignalHistory"("userId");
CREATE INDEX IF NOT EXISTS "SignalHistory_userId_createdAt_idx" ON "SignalHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "SignalHistory_signalType_idx" ON "SignalHistory"("signalType");
