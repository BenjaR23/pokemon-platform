-- CreateEnum
CREATE TYPE "CollectionProfileGameRole" AS ENUM ('PRIMARY', 'AUXILIARY');

-- AlterTable
ALTER TABLE "collection_profile_games" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "CollectionProfileGameRole" NOT NULL DEFAULT 'PRIMARY';

-- CreateIndex
CREATE INDEX "collection_profile_games_profile_id_role_position_idx" ON "collection_profile_games"("profile_id", "role", "position");
