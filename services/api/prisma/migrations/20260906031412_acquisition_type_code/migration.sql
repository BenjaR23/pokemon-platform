/*
  Warnings:

  - You are about to drop the column `external_id` on the `acquisition_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `acquisition_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `acquisition_types` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE "acquisition_types"
ADD COLUMN "code" TEXT;

UPDATE "acquisition_types"
SET "code" = 'encounter'
WHERE "external_id" = 1;

ALTER TABLE "acquisition_types"
ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "acquisition_types_code_key"
ON "acquisition_types"("code");

ALTER TABLE "acquisition_types"
DROP COLUMN "external_id";