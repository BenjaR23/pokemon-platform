-- AlterTable
ALTER TABLE "evolution_rules" ADD COLUMN     "baseFormId" TEXT,
ADD COLUMN     "evolvedFormId" TEXT;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_baseFormId_fkey" FOREIGN KEY ("baseFormId") REFERENCES "PokemonVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_evolvedFormId_fkey" FOREIGN KEY ("evolvedFormId") REFERENCES "PokemonVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;
