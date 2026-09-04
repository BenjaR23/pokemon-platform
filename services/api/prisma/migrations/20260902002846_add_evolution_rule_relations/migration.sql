/*
  Warnings:

  - You are about to drop the column `knownMoveId` on the `evolution_rules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "evolution_rules" DROP COLUMN "knownMoveId",
ADD COLUMN     "heldItemId" TEXT,
ADD COLUMN     "partySpeciesId" TEXT,
ADD COLUMN     "partyTypeId" TEXT,
ADD COLUMN     "regionId" TEXT,
ADD COLUMN     "tradeSpeciesId" TEXT,
ADD COLUMN     "versionGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_heldItemId_fkey" FOREIGN KEY ("heldItemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_knownTypeId_fkey" FOREIGN KEY ("knownTypeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_partyTypeId_fkey" FOREIGN KEY ("partyTypeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_partySpeciesId_fkey" FOREIGN KEY ("partySpeciesId") REFERENCES "PokemonSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_tradeSpeciesId_fkey" FOREIGN KEY ("tradeSpeciesId") REFERENCES "PokemonSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "version_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
