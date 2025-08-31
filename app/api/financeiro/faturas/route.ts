import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

// GET - Listar faturas/licenças
export async function GET(request: Request) {
  try {
    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get("auth_token");
      if (cookieToken) token = cookieToken.value;
    }
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    try {
      verify(token, process.env.JWT_SECRET || "");
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    // Busca todas as licenças/faturas
    const faturas = await prisma.licenca.findMany({
      select: {
        id: true,
        valor: true,
        status: true,
        dataEmissao: true,
        dataVencimento: true,
        rastreador: {
          select: {
            identificador: true,
            modelo: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { dataVencimento: "asc" },
    });
    return NextResponse.json({ success: true, faturas });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar faturas" },
      { status: 500 }
    );
  }
}
