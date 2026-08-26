-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "version_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
