// scripts/limpa-tickets.js
// Script para apagar todos os tickets e mensagens do banco (Prisma)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function limparTicketsEMensagens() {
  try {
    // Exclui todas as mensagens primeiro
    await prisma.message.deleteMany({});
    console.log("Todas as mensagens excluídas.");

    // Exclui todos os tickets
    await prisma.ticket.deleteMany({});
    console.log("Todos os tickets excluídos.");

    // Opcional: Exclui outros dados relacionados (ex: posicoes, faturas, etc)
    // await prisma.posicao.deleteMany({});
    // await prisma.fatura.deleteMany({});

    await prisma.$disconnect();
    console.log("Limpeza concluída!");
  } catch (error) {
    console.error("Erro ao limpar tickets e mensagens:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

limparTicketsEMensagens();
