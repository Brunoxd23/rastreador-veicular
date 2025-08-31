-- CreateTable
CREATE TABLE "Posicao" (
    "id" SERIAL NOT NULL,
    "rastreadorId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "dataRecebida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Posicao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Posicao" ADD CONSTRAINT "Posicao_rastreadorId_fkey" FOREIGN KEY ("rastreadorId") REFERENCES "Rastreador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
