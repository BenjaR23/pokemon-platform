/*
  Warnings:

  - A unique constraint covering the columns `[chain_id,from_species_id,to_species_id,trigger_id]` on the table `evolutions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "evolutions_chain_id_from_species_id_to_species_id_trigger_i_key" ON "evolutions"("chain_id", "from_species_id", "to_species_id", "trigger_id");
