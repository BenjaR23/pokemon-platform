/*
  Warnings:

  - A unique constraint covering the columns `[profile_id,species_id]` on the table `user_collection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profile_id,species_id]` on the table `user_favorites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CollectionObjectiveMode" AS ENUM ('ALL', 'GENERATIONS', 'RANGE');

-- AlterTable
ALTER TABLE "collection_profiles" ADD COLUMN     "end_pokemon_number" INTEGER,
ADD COLUMN     "objective_mode" "CollectionObjectiveMode" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "start_pokemon_number" INTEGER;

-- AlterTable
ALTER TABLE "user_collection" ADD COLUMN     "profile_id" TEXT;

-- AlterTable
ALTER TABLE "user_favorites" ADD COLUMN     "profile_id" TEXT;

-- CreateTable
CREATE TABLE "collection_profile_generations" (
    "profile_id" TEXT NOT NULL,
    "generation_id" TEXT NOT NULL,

    CONSTRAINT "collection_profile_generations_pkey" PRIMARY KEY ("profile_id","generation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_collection_profile_id_species_id_key" ON "user_collection"("profile_id", "species_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_profile_id_species_id_key" ON "user_favorites"("profile_id", "species_id");

-- AddForeignKey
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "collection_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "collection_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profile_generations" ADD CONSTRAINT "collection_profile_generations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "collection_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profile_generations" ADD CONSTRAINT "collection_profile_generations_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
