/*
  Warnings:

  - You are about to drop the column `locationAreaId` on the `evolution_rules` table. All the data in the column will be lost.

*/
-- RenameColumn
ALTER TABLE "evolution_rules"
RENAME COLUMN "locationAreaId" TO "locationId";

-- AlterTable
ALTER TABLE "evolution_rules"
ADD COLUMN "gender" INTEGER,
ADD COLUMN "minDamageTaken" INTEGER,
ADD COLUMN "minMoveCount" INTEGER,
ADD COLUMN "minSteps" INTEGER,
ADD COLUMN "nearSpecialRock" BOOLEAN,
ADD COLUMN "needsMultiplayer" BOOLEAN,
ADD COLUMN "needsOverworldRain" BOOLEAN,
ADD COLUMN "relativePhysicalStats" INTEGER,
ADD COLUMN "turnUpsideDown" BOOLEAN;