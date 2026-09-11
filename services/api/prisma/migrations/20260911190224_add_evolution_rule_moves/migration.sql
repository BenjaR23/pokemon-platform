-- AlterTable
ALTER TABLE "evolution_rules" ADD COLUMN     "knownMoveId" TEXT,
ADD COLUMN     "usedMoveId" TEXT;

-- CreateTable
CREATE TABLE "moves" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "moves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moves_external_id_key" ON "moves"("external_id");

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_knownMoveId_fkey" FOREIGN KEY ("knownMoveId") REFERENCES "moves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_usedMoveId_fkey" FOREIGN KEY ("usedMoveId") REFERENCES "moves"("id") ON DELETE SET NULL ON UPDATE CASCADE;
