const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Substitua pelo IMEI do rastreador cadastrado
  const imei = "864943045287949";
  // Busque o rastreador pelo IMEI
  const rastreador = await prisma.rastreador.findUnique({
    where: { identificador: imei },
  });
  if (!rastreador) {
    console.error("Rastreador não encontrado!");
    process.exit(1);
  }
  // Registra uma posição (latitude/longitude de exemplo)
  await prisma.posicao.create({
    data: {
      rastreadorId: rastreador.id,
      latitude: -23.55052, // exemplo: São Paulo
      longitude: -46.633308,
    },
  });
  console.log("Posição registrada para rastreador IMEI:", imei);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
