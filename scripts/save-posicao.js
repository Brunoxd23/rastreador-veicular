// scripts/save-posicao.js
// Função para salvar posição recebida do rastreador no banco

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function savePosicao(identificador, latitude, longitude) {
  // Busca rastreador pelo identificador (IMEI)
  const rastreador = await prisma.rastreador.findUnique({
    where: { identificador },
  });
  if (!rastreador) {
    console.error("Rastreador não encontrado:", identificador);
    return;
  }
  await prisma.posicao.create({
    data: {
      rastreadorId: rastreador.id,
      latitude,
      longitude,
    },
  });
  console.log("Posição salva:", identificador, latitude, longitude);
}

module.exports = { savePosicao };
