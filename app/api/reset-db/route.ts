import { NextResponse } from "next/server";
import { prisma } from "../../utils/database";

export async function POST(request: Request) {
  try {
    await prisma.user.deleteMany({});
    return NextResponse.json(
      {
        success: true,
        message: "Banco de dados resetado com sucesso",
        collection: "users",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao resetar banco de dados: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}
