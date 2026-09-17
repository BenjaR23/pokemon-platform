/*
  Warnings:

  - You are about to drop the column `user_id` on the `user_collection` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_favorites` table. All the data in the column will be lost.
  - Made the column `profile_id` on table `user_collection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profile_id` on table `user_favorites` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "user_collection" DROP CONSTRAINT "user_collection_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_favorites" DROP CONSTRAINT "user_favorites_user_id_fkey";

-- DropIndex
DROP INDEX "user_collection_user_id_species_id_key";

-- DropIndex
DROP INDEX "user_favorites_user_id_species_id_key";

-- AlterTable
ALTER TABLE "user_collection" DROP COLUMN "user_id",
ALTER COLUMN "profile_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_favorites" DROP COLUMN "user_id",
ALTER COLUMN "profile_id" SET NOT NULL;
