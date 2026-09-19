/*
  Warnings:

  - A unique constraint covering the columns `[active]` on the table `sync_runs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sync_runs" ADD COLUMN     "active" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "sync_runs_active_key" ON "sync_runs"("active");
