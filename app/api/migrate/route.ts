import { NextResponse } from "next/server";
import { prisma } from "../../utils/database";

export async function POST() {
  console.log("Iniciando migração do MongoDB para o Prisma...");

  try {
    // Exemplo: Limpar dados existentes no Neon/Postgres
    console.log("Limpando dados existentes no Neon/Postgres...");
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();

    // Exemplo: Criar usuários e tickets diretamente no Neon/Postgres
    // Adapte para inserir dados conforme sua necessidade
    // await prisma.user.create({ data: { ... } });
    // await prisma.ticket.create({ data: { ... } });

    console.log("Migração concluída com sucesso");

    return NextResponse.json({
      success: true,
      message: `Migração concluída no Neon/Postgres.`,
    });
  } catch (error) {
    console.error("Erro na migração:", error);
    return NextResponse.json(
      {
        error:
          "Erro na migração: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
