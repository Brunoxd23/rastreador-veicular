const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Apaga todos os veículos
  await prisma.vehicle.deleteMany({});

  // Cria um novo veículo vinculado ao usuário client (id: 2)
  await prisma.vehicle.create({
    data: {
      plate: "ABC-1234",
      model: "Gol",
      brand: "Volkswagen",
      year: 2020,
      user: { connect: { id: 2 } }, // relação obrigatória
      rastreadores: {
        create: [
          {
            modelo: "TK303",
            identificador: "123456789012345",
            user: { connect: { id: 2 } },
          },
        ],
      },
    },
  });

  console.log("Veículo criado para usuário client id 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
