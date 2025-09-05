/*
  Warnings:

  - Added the required column `rastreadorId` to the `Fatura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Fatura" ADD COLUMN     "rastreadorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Fatura" ADD CONSTRAINT "Fatura_rastreadorId_fkey" FOREIGN KEY ("rastreadorId") REFERENCES "public"."Rastreador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
