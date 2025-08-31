-- CreateTable
CREATE TABLE "Rastreador" (
    "id" SERIAL NOT NULL,
    "modelo" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "vehicleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rastreador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licenca" (
    "id" SERIAL NOT NULL,
    "rastreadorId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rastreador_identificador_key" ON "Rastreador"("identificador");

-- AddForeignKey
ALTER TABLE "Rastreador" ADD CONSTRAINT "Rastreador_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rastreador" ADD CONSTRAINT "Rastreador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licenca" ADD CONSTRAINT "Licenca_rastreadorId_fkey" FOREIGN KEY ("rastreadorId") REFERENCES "Rastreador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
