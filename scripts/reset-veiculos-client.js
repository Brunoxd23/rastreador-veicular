import prisma from "../lib/prisma";
import prisma from "../lib/prisma.js"; // Updated import for Node.js compatibility

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
      userId: 2, // id do usuário client
      rastreadores: {
        create: [
          {
            modelo: "TK303",
            identificador: "123456789012345",
          },
        ],
      },
    },
  });

  console.log("Veículo criado para usuário client id 2");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
