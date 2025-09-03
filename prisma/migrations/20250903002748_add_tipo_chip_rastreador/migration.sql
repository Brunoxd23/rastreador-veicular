-- AlterTable
ALTER TABLE "Rastreador" ADD COLUMN     "numeroChip" TEXT,
ADD COLUMN     "tipoChip" TEXT NOT NULL DEFAULT 'iot';
